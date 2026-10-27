"""Clarity — rapid triage decision engine."""

__version__ = "1.0.0"

from .engine import StructuredInput, EvaluationResult, evaluate
from .scenarios import SCENARIOS, SYMPTOM_CHIPS
from .care_locations import nearby

__all__ = [
    "StructuredInput",
    "EvaluationResult",
    "evaluate",
    "SCENARIOS",
    "SYMPTOM_CHIPS",
    "nearby",
]
