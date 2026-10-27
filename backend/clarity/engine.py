"""
engine.py
---------
The Clarity decision engine.

Pipeline:
    [1] build one lowercase text from the structured input + free text
    [2] extract signals (keyword matches)
    [3] score = signal weights + severity bonus
    [4] base tier from the score (any red flag -> high)
    [5] safety overrides (can only move low -> moderate)
    [6] red-flag guard (a red flag always ends at high)
    [7] explanation + action copy

Design goals:
    - Deterministic: same input always produces same output.
    - Conservative: escalate on ambiguity; never downgrade on uncertainty.
    - Explainable: every tier decision traces to a detected signal.
"""

from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import List, Literal, Optional

from .signals import ALL_SIGNALS, IMPLIED_BY, PHRASES, SUDDEN_ONSET
from .scenarios import find_scenario


Tier = Literal["low", "moderate", "high"]


# ─── Input / Output contracts ────────────────────────────────────────────────

@dataclass
class StructuredInput:
    """Rapid-input mode: scenario + severity + onset + chips."""
    scenario_id: Optional[str] = None           # id from scenarios.py
    severity: int = 3                           # 1..5
    onset: Literal["sudden", "gradual"] = "gradual"
    symptoms: List[str] = field(default_factory=list)
    free_text: Optional[str] = None             # fallback / additional context


@dataclass
class DetectedSignal:
    label: str
    weight: int
    category: str


@dataclass
class EvaluationResult:
    tier: Tier
    action: str                      # single, decisive next step
    headline: str                    # "HIGH URGENCY", "MODERATE URGENCY", "LOW URGENCY"
    explanation: str                 # 1–2 sentences, plain language
    what_to_do: List[str]            # 2–3 bullets
    watch_for: List[str]             # warning signs for deterioration
    detected: List[DetectedSignal]   # for the "view reasoning" panel
    score: int                       # raw numeric score (pre-override)
    escalated: bool                  # did a safety rule bump the tier?
    severity: int = 3                # the slider value this result was computed from
    escalation_rule: Optional[str] = None    # "R1".."R4" if a rule fired
    escalation_reason: Optional[str] = None


# ─── Tier configuration ─────────────────────────────────────────────────────

TIER_CONFIG = {
    "low": {
        "headline": "LOW URGENCY",
        "action": "No immediate action needed.",
        "what_to_do": [
            "Rest and monitor how you feel",
            "Reassess in 1–2 hours or if anything changes",
            "Call a nurse line if you want reassurance",
        ],
        "watch_for": [
            "Pain increases or changes character",
            "Symptoms last longer than 24 hours",
            "New symptoms appear (fever, swelling, confusion)",
        ],
    },
    "moderate": {
        "headline": "MODERATE URGENCY",
        "action": "Monitor closely and seek care if symptoms persist.",
        "what_to_do": [
            "Contact a healthcare professional within a few hours",
            "Consider visiting urgent care",
            "Do not drive yourself if you feel impaired",
        ],
        "watch_for": [
            "Symptoms worsen or spread",
            "Breathing becomes harder",
            "You feel faint, very weak, or confused",
        ],
    },
    "high": {
        "headline": "HIGH URGENCY",
        "action": "Seek emergency care immediately.",
        "what_to_do": [
            "Call 911 or go to the nearest ER now",
            "Do not drive yourself — have someone take you",
            "Note the time symptoms began for responders",
        ],
        "watch_for": [
            "If the person loses consciousness, begin CPR if trained",
            "Stay with them until help arrives",
            "Unlock the door so EMTs can enter",
        ],
    },
}


# ─── Pipeline ───────────────────────────────────────────────────────────────

def _build_text(inp: StructuredInput) -> str:
    """Assemble a canonical text representation for keyword scanning."""
    parts = []
    if inp.scenario_id:
        sc = find_scenario(inp.scenario_id)
        if sc:
            parts.append(sc.narrative.lower())
    if inp.symptoms:
        parts.append(" ".join(s.lower() for s in inp.symptoms))
    if inp.onset == "sudden":
        parts.append("sudden onset came on suddenly")
    if inp.free_text:
        parts.append(inp.free_text.lower())
    return " ".join(parts)


NEGATIONS = ("not ", "n't ", "no ", "never ")


def _matches(text: str, keyword: str, allow_negation: bool = False) -> bool:
    """
    True if `keyword` appears in `text` at the start of a word and is not negated.

    - Word start: "cut" must not match inside "acute".
    - Negation: "not going away" must not count as "going away" (improving).
      Red flags pass allow_negation=True, so they always count. If someone writes
      "no chest pain, wait, actually chest pressure" we want the red flag to win.
    """
    start = text.find(keyword)
    while start != -1:
        at_word_start = start == 0 or not text[start - 1].isalnum()
        before = text[max(0, start - 6):start]
        negated = any(before.endswith(n) for n in NEGATIONS)
        if at_word_start and (allow_negation or not negated):
            return True
        start = text.find(keyword, start + 1)
    return False


def _extract_signals(text: str) -> List[DetectedSignal]:
    """Scan text for keyword matches and return one hit per signal."""
    detected: List[DetectedSignal] = []
    for signal in ALL_SIGNALS:
        always = signal.category == "red_flag"
        if any(_matches(text, kw, allow_negation=always) for kw in signal.keywords):
            detected.append(DetectedSignal(
                label=signal.label,
                weight=signal.weight,
                category=signal.category,
            ))
    return detected


# Slider value (1-5) -> points added to the score.
SEVERITY_BONUS = {1: -1, 2: 0, 3: 1, 4: 3, 5: 5}
SEVERITY_WORDS = {1: "barely there", 2: "mild", 3: "noticeable", 4: "strong", 5: "overwhelming"}
HIGH_THRESHOLD = 6
MODERATE_THRESHOLD = 2


def _severity_bonus(severity: int) -> int:
    if severity not in SEVERITY_BONUS:
        raise ValueError(f"severity must be 1-5, got {severity}")
    return SEVERITY_BONUS[severity]


def _base_tier(score: int, has_red_flag: bool) -> Tier:
    """Classify score into a base tier before safety overrides."""
    if has_red_flag or score >= HIGH_THRESHOLD:
        return "high"
    if score >= MODERATE_THRESHOLD:
        return "moderate"
    return "low"


# Each safety rule has a stable ID so the UI can show (and translate) which
# rule fired. Rules run in order; the first one that fires wins.
ESCALATION_REASONS = {
    "R1": "Unclear wording with nothing reassuring, so we moved it up to moderate to be safe.",
    "R2": "Not enough detail to rule anything out, so we defaulted to moderate to be safe.",
    "R3": "A baby, older adult, or pregnancy is involved, so the bar for care is lower.",
    "R4": "Strong symptoms that came on suddenly should never be treated as low urgency.",
}


def _apply_safety_overrides(
    tier: Tier,
    detected: List[DetectedSignal],
    inp: StructuredInput,
) -> tuple[Tier, Optional[str]]:
    """
    The heart of the system. Returns (tier, rule_id_that_fired or None).

    R1  Ambiguity, no reassuring context      low -> moderate
    R2  Nothing detected, no scenario          -> moderate (never reassure on no data)
    R3  Vulnerable person + any concern       low -> moderate
    R4  Sudden onset + severity >= 4          low -> moderate

    None of these can produce HIGH. Only red flags or a high score can.
    """
    if tier != "low":
        return tier, None

    has = lambda cat: any(d.category == cat for d in detected)
    has_concern = has("moderate") or has("severity")

    if has("ambiguity") and not has("protective"):
        return "moderate", "R1"
    if not detected and not inp.scenario_id:
        return "moderate", "R2"
    if has("vulnerable") and has_concern:
        return "moderate", "R3"
    if inp.onset == "sudden" and inp.severity >= 4:
        return "moderate", "R4"
    return tier, None


ENDINGS = {
    "high": ". Together, that's serious enough for emergency care.",
    "moderate": ", which should be checked within a few hours.",
    "low": ", which is worth keeping an eye on.",
}


def _build_explanation(detected: List[DetectedSignal], tier: Tier, severity: int, reason: Optional[str]) -> str:
    """One or two plain sentences: what we saw, how urgent, and which safety rule fired."""
    labels = {d.label for d in detected}

    def said(cat):
        return [PHRASES.get(d.label, d.label.lower()) for d in detected
                if d.category == cat and IMPLIED_BY.get(d.label) not in labels
                and d.label != SUDDEN_ONSET]

    red = said("red_flag")
    concerns = said("severity") + said("moderate")
    sudden = SUDDEN_ONSET in labels

    if red:
        core = f"You reported {red[0]}. That's a warning sign, and warning signs always mean emergency care."
    elif concerns or sudden:
        what = " and ".join(concerns[:2]) if concerns else "symptoms"
        if sudden:
            what += " that started suddenly"
        core = f"You reported {what}{ENDINGS[tier]}"
    elif tier != "low":
        # No specific symptom drove this: the severity rating did. Say so.
        core = f"You rated how you feel as {SEVERITY_WORDS[severity]}, {severity} out of 5{ENDINGS[tier]}"
    else:
        core = "Nothing specific stood out."
    return f"{core} {reason}" if reason else core


# ─── Public API ─────────────────────────────────────────────────────────────

def evaluate(inp: StructuredInput) -> EvaluationResult:
    """
    Run the full decision pipeline on a StructuredInput.
    Returns a complete EvaluationResult ready to render.
    """
    text = _build_text(inp)
    detected = _extract_signals(text)
    has_red_flag = any(d.category == "red_flag" for d in detected)

    score = sum(d.weight for d in detected) + _severity_bonus(inp.severity)

    base = _base_tier(score, has_red_flag)
    tier, rule = _apply_safety_overrides(base, detected, inp)
    escalated = rule is not None
    reason = ESCALATION_REASONS[rule] if rule else None

    # Red flags cannot be downgraded, ever.
    if has_red_flag:
        tier = "high"

    cfg = TIER_CONFIG[tier]
    return EvaluationResult(
        tier=tier,
        action=cfg["action"],
        headline=cfg["headline"],
        explanation=_build_explanation(detected, tier, inp.severity, reason),
        what_to_do=cfg["what_to_do"],
        watch_for=cfg["watch_for"],
        detected=detected,
        score=score,
        escalated=escalated,
        severity=inp.severity,
        escalation_rule=rule,
        escalation_reason=reason,
    )
