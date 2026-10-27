"""
care_locations.py
-----------------
Mock nearby-care database. In production, this would be a lookup against
Google Places / HealthData.gov. For the prototype, three curated lists
keyed by urgency tier.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Literal


Tier = Literal["low", "moderate", "high"]


@dataclass(frozen=True)
class CarePlace:
    name: str
    kind: str             # e.g. "Urgent Care", "ER", "Retail Clinic"
    distance_mi: float
    is_open: bool = True


CARE_BY_TIER: Dict[Tier, List[CarePlace]] = {
    "low": [
        CarePlace("CVS MinuteClinic",        "Retail Clinic",  0.8),
        CarePlace("Redmond Urgent Care",     "Walk-in Clinic", 1.2),
        CarePlace("Overlake Primary Care",   "Primary Care",   2.1),
    ],
    "moderate": [
        CarePlace("Overlake Urgent Care",    "Urgent Care · 24/7", 1.4),
        CarePlace("Evergreen Urgent Care",   "Urgent Care",        2.3),
        CarePlace("Swedish Redmond ER",      "Emergency Room",     3.1),
    ],
    "high": [
        CarePlace("Overlake Hospital ER",    "Level III Trauma · 24/7",  2.4),
        CarePlace("Evergreen Health ER",     "Emergency Room · 24/7",    3.0),
        CarePlace("Harborview Medical Ctr.", "Level I Trauma · 24/7",   12.8),
    ],
}


def nearby(tier: Tier) -> List[CarePlace]:
    return CARE_BY_TIER[tier]
