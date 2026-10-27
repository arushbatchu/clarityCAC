"""
signals.py
----------
Signal dictionaries for the Clarity decision engine.

A "signal" is a weighted indicator extracted from user input.
Signals are grouped into six categories, each with a distinct role
in the scoring pipeline.

This file is pure data. No logic lives here.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import List, Literal

Category = Literal[
    "red_flag",    # any hit forces HIGH urgency
    "severity",    # high-weight intensifiers
    "moderate",    # concrete symptoms of moderate concern
    "protective",  # de-escalators (negative weight)
    "ambiguity",   # uncertainty markers (trigger escalation rule)
    "vulnerable",  # population modifiers (infant, elderly, pregnant)
]


@dataclass(frozen=True)
class Signal:
    """A single signal: a label, a weight, and the keywords that trigger it."""
    label: str
    weight: int
    keywords: tuple[str, ...]
    category: Category


# --- RED-FLAG INDICATORS ------------------------------------------------------
# Any red-flag hit routes to HIGH urgency regardless of score.
# These are drawn from widely-accepted emergency triage "call-911 now" criteria.

RED_FLAGS: List[Signal] = [
    Signal("Chest pain / pressure", 5,
           ("chest pain", "chest pressure", "chest tight", "crushing chest",
            "chest discomfort", "heavy chest", "pain in my chest",
            "center of my chest"),
           "red_flag"),
    Signal("Severe breathing difficulty", 6,
           ("can't breathe", "cannot breathe", "not breathing", "stopped breathing",
            "gasping for air", "choking"),
           "red_flag"),
    Signal("Loss of consciousness", 6,
           ("unconscious", "passed out", "unresponsive", "won't wake up",
            "not responding", "fainted"),
           "red_flag"),
    Signal("Stroke indicators (FAST)", 6,
           ("stroke", "face drooping", "slurred speech", "can't move arm",
            "numb on one side", "one side weak", "can't speak"),
           "red_flag"),
    Signal("Uncontrolled bleeding", 5,
           ("severe bleeding", "heavy bleeding", "bleeding heavily",
            "won't stop bleeding", "gushing blood", "lost a lot of blood"),
           "red_flag"),
    Signal("Safety crisis", 6,
           ("suicidal", "kill myself", "end my life", "want to die"),
           "red_flag"),
    Signal("Possible overdose / poisoning", 6,
           ("overdose", "took too many", "poisoning", "swallowed chemicals"),
           "red_flag"),
    Signal("Seizure activity", 5,
           ("seizure", "convulsing", "shaking uncontrollably"),
           "red_flag"),
    Signal("Airway / anaphylaxis", 6,
           ("anaphylaxis", "throat closing", "tongue swelling", "face swelling",
            "can't swallow"),
           "red_flag"),
    Signal("Significant head injury", 4,
           ("knocked out", "lost consciousness after hit", "head trauma"),
           "red_flag"),
]

# --- SEVERITY INTENSIFIERS ----------------------------------------------------
SEVERITY: List[Signal] = [
    Signal("High severity language", 3,
           ("severe", "extreme", "excruciating", "unbearable",
            "worst pain", "worst headache"),
           "severity"),
    Signal("Sudden onset", 3,
           ("sudden", "suddenly", "out of nowhere", "came on fast",
            "all at once", "abrupt"),
           "severity"),
    Signal("Intense pain quality", 3,
           ("crushing", "stabbing", "ripping", "tearing", "sharp pain"),
           "severity"),
    Signal("Escalating over time", 3,
           ("getting worse", "worsening", "spreading", "more intense",
            "keeps getting worse"),
           "severity"),
    Signal("Very high fever", 3,
           ("high fever", "103", "104", "105", "burning up"),
           "severity"),
]

# --- MODERATE CONCERN SIGNALS -------------------------------------------------
MODERATE: List[Signal] = [
    Signal("Shortness of breath", 3,
           ("short of breath", "hard to breathe", "shortness of breath",
            "winded", "out of breath"),
           "moderate"),
    Signal("Dizziness / vision change", 2,
           ("dizzy", "lightheaded", "vision blurry", "blurred vision",
            "spinning"),
           "moderate"),
    Signal("Nausea / vomiting", 1,
           ("vomiting", "throwing up", "nausea", "nauseous"),
           "moderate"),
    Signal("Confusion", 3,
           ("confused", "disoriented", "not making sense", "can't think straight"),
           "moderate"),
    Signal("Fever present", 1,
           ("fever", "temperature", "chills"),
           "moderate"),
    Signal("Headache", 1,
           ("headache", "migraine", "head hurts"),
           "moderate"),
    Signal("Pain reported", 1,
           ("pain", "hurts", "hurting", "aching"),
           "moderate"),
    Signal("Injury", 2,
           ("injury", "injured", "fell", "cut", "burned", "sprained", "broke"),
           "moderate"),
    Signal("Skin / swelling reaction", 2,
           ("rash", "hives", "swelling", "itchy skin"),
           "moderate"),
    Signal("Dehydration signs", 2,
           ("dehydrated", "can't keep fluids", "no urine", "very thirsty"),
           "moderate"),
]

# --- PROTECTIVE / DE-ESCALATING CONTEXT ---------------------------------------
PROTECTIVE: List[Signal] = [
    Signal("Mild descriptors", -2,
           ("mild", "slight", "minor", "just a bit"),
           "protective"),
    Signal("Improving", -2,
           ("better now", "improving", "getting better", "subsiding",
            "going away", "almost gone"),
           "protective"),
    Signal("Brief duration", -1,
           ("brief", "for a moment", "passed quickly", "only lasted"),
           "protective"),
    Signal("No pain", -2,
           ("no pain", "painless", "no discomfort"),
           "protective"),
]

# --- AMBIGUITY / UNCERTAINTY --------------------------------------------------
AMBIGUITY: List[Signal] = [
    Signal("Ambiguous / uncertain phrasing", 1,
           ("not sure", "maybe", "might be", "i think", "kind of", "sort of",
            "unsure", "weird", "strange", "odd", "something's off",
            "doesn't feel right", "can't tell"),
           "ambiguity"),
]

# --- VULNERABLE POPULATION MODIFIERS ------------------------------------------
VULNERABLE: List[Signal] = [
    Signal("Infant / very young child", 2,
           ("baby", "infant", "newborn", "toddler",
            "1-year-old", "2-year-old", "3-year-old", "1 year old", "2 year old"),
           "vulnerable"),
    Signal("Elderly person", 1,
           ("elderly", "grandma", "grandpa", "80-year-old", "90-year-old",
            "80 year old", "90 year old", "grandmother", "grandfather"),
           "vulnerable"),
    Signal("Pregnancy context", 2,
           ("pregnant", "pregnancy", "expecting"),
           "vulnerable"),
]

# --- AGGREGATED ---------------------------------------------------------------
ALL_SIGNALS: List[Signal] = (
    RED_FLAGS + SEVERITY + MODERATE + PROTECTIVE + AMBIGUITY + VULNERABLE
)


def signals_by_category(category: Category) -> List[Signal]:
    """Return all signals in a given category."""
    return [s for s in ALL_SIGNALS if s.category == category]


# --- PLAIN-ENGLISH PHRASES ----------------------------------------------------
# How each concern signal is said to the user in the "Why" sentence.
PHRASES = {
    "Chest pain / pressure": "chest pain or pressure",
    "Severe breathing difficulty": "severe trouble breathing",
    "Loss of consciousness": "passing out or not responding",
    "Stroke indicators (FAST)": "signs of a stroke",
    "Uncontrolled bleeding": "bleeding that won't stop",
    "Safety crisis": "thoughts of ending your life",
    "Possible overdose / poisoning": "a possible overdose or poisoning",
    "Seizure activity": "a seizure",
    "Airway / anaphylaxis": "throat, tongue, or face swelling",
    "Significant head injury": "a serious head injury",
    "High severity language": "severe symptoms",
    "Sudden onset": "symptoms that started suddenly",
    "Intense pain quality": "intense pain",
    "Escalating over time": "symptoms getting worse",
    "Very high fever": "a very high fever",
    "Shortness of breath": "shortness of breath",
    "Dizziness / vision change": "dizziness or vision changes",
    "Nausea / vomiting": "nausea or vomiting",
    "Confusion": "confusion",
    "Fever present": "a fever",
    "Headache": "a headache",
    "Pain reported": "pain",
    "Injury": "an injury",
    "Skin / swelling reaction": "a rash or swelling",
    "Dehydration signs": "signs of dehydration",
}

# Label of the "came on suddenly" signal. The explanation phrases it as
# "... that started suddenly" instead of listing it as its own concern.
SUDDEN_ONSET = "Sudden onset"

# Don't mention the first signal when the second (more specific) one is present.
IMPLIED_BY = {"Fever present": "Very high fever"}
