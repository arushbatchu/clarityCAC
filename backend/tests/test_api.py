"""Tests for the Flask HTTP API."""

import pytest
from clarity.api import create_app


@pytest.fixture
def client():
    return create_app().test_client()


def test_health(client):
    assert client.get("/health").get_json()["status"] == "ok"


def test_templates_lists_all_scenarios(client):
    body = client.get("/templates").get_json()
    assert len(body["scenarios"]) == 6
    assert "chest pressure" in body["symptom_chips"]


def test_evaluate_returns_tier_and_nearby_care(client):
    res = client.post("/evaluate", json={
        "scenario_id": "chest", "severity": 4, "onset": "sudden",
        "symptoms": ["chest pressure"],
    })
    body = res.get_json()
    assert res.status_code == 200
    assert body["tier"] == "high"
    assert len(body["places"]) == 3


@pytest.mark.parametrize("payload", [
    {"severity": 9},
    {"severity": "loud"},
    {"onset": "yesterday"},
    {"symptoms": "dizzy"},
])
def test_evaluate_rejects_bad_input(client, payload):
    assert client.post("/evaluate", json=payload).status_code == 400


def test_care_rejects_unknown_tier(client):
    assert client.get("/care/purple").status_code == 400
