"""
api.py
------
Flask HTTP API exposing the Clarity decision engine.

Endpoints:
    POST /evaluate   →  run the engine on a StructuredInput
    GET  /templates  →  list scenario templates + chip vocabulary
    GET  /care/<tier>→  nearby care locations for a tier
    GET  /health     →  health check

Run:
    python -m clarity.api          (defaults to port 5000)
"""

from __future__ import annotations
from dataclasses import asdict
from flask import Flask, jsonify, request
from flask_cors import CORS

from .engine import StructuredInput, evaluate
from .scenarios import SCENARIOS, SYMPTOM_CHIPS
from .care_locations import nearby


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)  # allow the frontend to call us during local dev

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "service": "clarity-engine", "version": "1.0"})

    @app.get("/templates")
    def templates():
        return jsonify({
            "scenarios": [asdict(s) for s in SCENARIOS],
            "symptom_chips": SYMPTOM_CHIPS,
        })

    @app.get("/care/<tier>")
    def care(tier: str):
        if tier not in ("low", "moderate", "high"):
            return jsonify({"error": "tier must be low, moderate, or high"}), 400
        return jsonify({"tier": tier, "places": [asdict(p) for p in nearby(tier)]})

    @app.post("/evaluate")
    def evaluate_endpoint():
        body = request.get_json(silent=True) or {}
        symptoms = body.get("symptoms", [])
        if not isinstance(symptoms, list) or not all(isinstance(s, str) for s in symptoms):
            return jsonify({"error": "symptoms must be a list of strings"}), 400
        try:
            inp = StructuredInput(
                scenario_id=body.get("scenario_id"),
                severity=int(body.get("severity", 3)),
                onset=body.get("onset", "gradual"),
                symptoms=symptoms,
                free_text=body.get("free_text"),
            )
        except (ValueError, TypeError) as e:
            return jsonify({"error": f"invalid input: {e}"}), 400

        if inp.severity < 1 or inp.severity > 5:
            return jsonify({"error": "severity must be between 1 and 5"}), 400
        if inp.onset not in ("sudden", "gradual"):
            return jsonify({"error": "onset must be 'sudden' or 'gradual'"}), 400

        result = evaluate(inp)
        payload = asdict(result)
        payload["places"] = [asdict(p) for p in nearby(result.tier)]
        return jsonify(payload)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=True)
