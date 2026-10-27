"""
Tests for the Clarity decision engine.   Run:  pytest -v
"""

import pytest
from clarity.engine import StructuredInput, evaluate, _matches
from clarity.scenarios import SCENARIOS


def run(scenario=None, severity=3, onset="gradual", symptoms=(), text=None):
    return evaluate(StructuredInput(scenario, severity, onset, list(symptoms), text))


# ─── Core scenarios ───────────────────────────────────────────────────────────

class TestDemoFlow:
    def test_chest_discomfort_is_high(self):
        r = run("chest", 4, "sudden", ["chest pressure", "sweating", "shortness of breath"])
        assert r.tier == "high"
        assert "emergency" in r.action.lower()

    def test_something_feels_off_is_moderate(self):
        r = run("vague", 2, "gradual", ["dizzy", "heart feels weird"])
        assert r.tier == "moderate"

    def test_mild_injury_is_moderate_not_high(self):
        r = run("injury", 2, "sudden", ["mild bleeding", "bruising"])
        assert r.tier == "moderate"


# ─── Red flags ───────────────────────────────────────────────────────────────

class TestRedFlags:
    @pytest.mark.parametrize("text", [
        "face drooping and slurred speech",
        "throat closing after peanuts",
        "he passed out",
        "I took too many pills",
        "I want to die",
        "bleeding heavily from my arm",
    ])
    def test_red_flag_text_is_high(self, text):
        assert run(severity=1, text=text).tier == "high"

    def test_red_flag_cannot_be_downgraded_by_reassuring_words(self):
        r = run(severity=1, text="chest pressure, mild, improving, brief")
        assert r.tier == "high"

    def test_negated_red_flag_still_counts(self):
        # Conservative on purpose: we never let "no" cancel a red flag.
        assert run(severity=1, text="no chest pain").tier == "high"


# ─── Safety rules R1-R4 ──────────────────────────────────────────────────────

class TestSafetyRules:
    def test_r1_unclear_wording_moves_low_to_moderate(self):
        r = run(severity=1, text="not sure, something feels weird")
        assert (r.tier, r.escalation_rule) == ("moderate", "R1")

    def test_r1_does_not_fire_with_reassuring_context(self):
        r = run(severity=1, text="feels odd but it passed quickly")
        assert r.escalation_rule != "R1"

    @pytest.mark.parametrize("severity", [1, 2, 3])
    def test_r2_no_information_never_returns_low(self, severity):
        r = run(severity=severity)
        assert (r.tier, r.escalation_rule) == ("moderate", "R2")

    def test_r3_vulnerable_person_lowers_the_bar(self):
        r = run(severity=1, text="my grandmother has a headache")
        assert (r.tier, r.escalation_rule) == ("moderate", "R3")

    def test_r4_sudden_and_severe_is_never_low(self):
        r = run(severity=4, onset="sudden", text="mild, slight, minor, improving")
        assert r.tier == "moderate"

    def test_rules_never_produce_high_on_their_own(self):
        r = run(severity=2, text="not sure, maybe weird")
        assert r.tier != "high"


# ─── Keyword matching edge cases (bugs we actually hit) ──────────────────────

class TestMatching:
    def test_word_start_only(self):
        assert not _matches("acute pain", "cut")
        assert _matches("i cut my hand", "cut")
        assert _matches("my arm is broken", "broke")

    def test_negation_skips_reassuring_phrases(self):
        assert not _matches("it's not going away", "going away")
        assert _matches("it's going away", "going away")

    def test_chest_scenario_is_not_read_as_improving(self):
        r = run("chest", 4, "sudden")
        assert "Improving" not in [d.label for d in r.detected]

    def test_hyphenated_toddler_age_is_vulnerable(self):
        r = run("fever_child", 4, "gradual")
        assert any(d.category == "vulnerable" for d in r.detected)


# ─── Output contract the UI depends on ───────────────────────────────────────

class TestOutputContract:
    @pytest.mark.parametrize("scenario", [s.id for s in SCENARIOS])
    def test_every_scenario_produces_a_complete_result(self, scenario):
        r = run(scenario, 3, "sudden")
        assert r.tier in ("low", "moderate", "high")
        assert r.action and "URGENCY" in r.headline
        assert 2 <= len(r.what_to_do) <= 3
        assert 2 <= len(r.watch_for) <= 3
        assert len(r.explanation) < 400

    def test_escalated_flag_matches_rule(self):
        for sev in range(1, 6):
            r = run(severity=sev)
            assert r.escalated == (r.escalation_rule is not None)


def test_engine_is_deterministic():
    a = run("vague", 3, "sudden", ["dizzy"])
    b = run("vague", 3, "sudden", ["dizzy"])
    assert a == b


@pytest.mark.parametrize("scenario", [s.id for s in SCENARIOS])
def test_why_sentence_matches_urgency(scenario):
    """The 'why' must never sound calmer than the level shown above it."""
    for sev in range(1, 6):
        r = run(scenario, sev, "sudden")
        if r.tier == "high":
            assert "emergency care" in r.explanation
        if r.tier != "low":
            assert "keeping an eye on" not in r.explanation


@pytest.mark.parametrize("severity", [0, 6, -1])
def test_invalid_severity_is_rejected(severity):
    with pytest.raises(ValueError):
        run(severity=severity)


def test_why_sentence_never_contradicts_level_on_any_parity_case():
    """Across all 108 shared cases: a non-low result always gives a real reason."""
    import json
    from pathlib import Path
    cases = json.loads((Path(__file__).resolve().parents[2] / "shared/parity_cases.json").read_text())
    for c in cases:
        i = c["input"]
        r = evaluate(StructuredInput(i["scenarioId"], i["severity"], i["onset"], i["symptoms"], i["freeText"]))
        if r.tier != "low":
            assert not r.explanation.startswith("Nothing specific"), i
        if r.tier == "high":
            assert "emergency care" in r.explanation, i
