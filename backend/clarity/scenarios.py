"""
scenarios.py
------------
Pre-defined rapid-triage scenarios. Each scenario is a structured input
the user can tap to skip typing. Designed for the 10-second usability target.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import List


@dataclass(frozen=True)
class Scenario:
    id: str
    category: str
    label: str
    default_severity: int         # 1-5 slider default
    default_onset: str            # "sudden" | "gradual"
    default_symptoms: tuple[str, ...]  # chip selections
    narrative: str                # free-text equivalent (used for engine backward-compat)


SCENARIOS: List[Scenario] = [
    Scenario(
        id="chest",
        category="Cardiac",
        label="Chest discomfort",
        default_severity=4,
        default_onset="sudden",
        default_symptoms=("chest pressure", "sweating", "shortness of breath"),
        narrative="I've had a tight, heavy feeling in the center of my chest for "
                  "the last 20 minutes. It's not going away and I feel sweaty.",
    ),
    Scenario(
        id="breathing",
        category="Respiratory",
        label="Breathing difficulty",
        default_severity=4,
        default_onset="sudden",
        default_symptoms=("short of breath", "tight chest"),
        narrative="I'm having trouble catching my breath. It started suddenly "
                  "about 15 minutes ago and I feel winded just sitting here.",
    ),
    Scenario(
        id="headache",
        category="Neuro",
        label="Severe headache",
        default_severity=5,
        default_onset="sudden",
        default_symptoms=("worst headache", "nausea", "light sensitivity"),
        narrative="I have the worst headache of my life. It came on suddenly "
                  "and I also feel nauseous and light-sensitive.",
    ),
    Scenario(
        id="injury",
        category="Trauma",
        label="Sudden injury",
        default_severity=2,
        default_onset="sudden",
        default_symptoms=("mild bleeding", "bruising"),
        narrative="I fell and cut my leg. It's bleeding but I can stop it with "
                  "pressure. It's mild and I don't think anything is broken.",
    ),
    Scenario(
        id="fever_child",
        category="Pediatric",
        label="High fever (child)",
        default_severity=4,
        default_onset="gradual",
        default_symptoms=("high fever", "tired", "not eating"),
        narrative="My 2-year-old has a fever of 103 and seems very tired. "
                  "She's drinking a little water but not eating.",
    ),
    Scenario(
        id="vague",
        category="Ambiguous",
        label="Something feels off",
        default_severity=2,
        default_onset="gradual",
        default_symptoms=("dizzy", "heart feels weird"),
        narrative="I just don't feel right. Kind of dizzy and my heart feels "
                  "weird. I'm not sure if I should be worried.",
    ),
]


# Symptom chips used across scenarios (for the multi-select UI)
SYMPTOM_CHIPS: List[str] = [
    "chest pressure", "short of breath", "sweating",
    "worst headache", "nausea", "vomiting",
    "dizzy", "confused", "slurred speech",
    "high fever", "chills", "mild bleeding",
    "severe bleeding", "swelling", "tight chest",
    "heart feels weird", "tired", "not eating",
    "light sensitivity", "bruising", "face drooping",
]


def find_scenario(scenario_id: str) -> Scenario | None:
    for s in SCENARIOS:
        if s.id == scenario_id:
            return s
    return None
