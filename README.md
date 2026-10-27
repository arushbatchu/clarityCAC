# Clarity

**One clear next step in the first ten seconds after a scary symptom.**

Congressional App Challenge 2026 · Washington's 1st District

**Live app:** (https://arushbatchu.github.io/clarityCAC/) (works on any phone, installs to the home screen, works offline)

---

## The problem

Something feels wrong. Chest pressure, a toddler's fever climbing, a grandparent who suddenly can't find words. You have to decide fast: rest, call a nurse, or call 911?

Most people freeze. Searching symptoms online gives a wall of possibilities, which makes the panic worse. Some people wait because they don't want to overreact. And if you're more comfortable in Spanish than English, almost every tool built for this moment is harder to use.

## What Clarity does

You tap four things: a scenario, how severe it is, whether it came on suddenly, and any symptoms. No typing needed. Clarity gives back **one urgency level and one action**:

| Level | Action |
|---|---|
| 🟢 Low | Rest and watch |
| 🟡 Moderate | Get seen within hours |
| 🔴 High | Call 911 now |

It is not a chatbot and it does not diagnose. It tells you what level of care to go to, and it shows its reasoning for every answer.

## What makes it different

- **Warning signs always win.** Chest pressure, stroke signs, trouble breathing, and similar red flags always mean HIGH. Reassuring words like "mild" or "getting better" can't talk them down.
- **Unsure means up, never down.** Four safety rules can move LOW up to MODERATE: unclear wording, too little information, a baby/older adult/pregnancy, or sudden strong symptoms. No rule can move anything down.
- **English and Spanish.** One tap switches the whole app. Spanish free-text descriptions are mapped to the same warning signs, so "no puedo respirar" is a red flag just like "can't breathe."
- **Nothing hidden.** Tap "View reasoning" on any result to see each signal, its weight, the score, and which safety rule fired.
- **Works offline and installs like an app.** It's a Progressive Web App. Add it to your home screen and it runs with no signal.
- **Tracks the ten-second goal.** A timer starts on your first tap and every result shows how long the decision took.

## How it's built

Two programming languages, each doing real work:

| Language | Where | What it does |
|---|---|---|
| **Python** | `backend/` | The decision engine (source of truth for every rule and weight), a Flask API, a code generator, and 51 pytest tests |
| **TypeScript** | `frontend/src/` | The whole app the user touches: UI, a port of the engine that runs on the phone, English/Spanish layer, offline/install support, and parity tests. Strict mode. |

HTML and CSS handle layout and styling.

```
                     backend/scripts/codegen.py
 Python engine  ───────────────┬───────────────────────────┐
 (rules, weights,              │                           │
  safety rules)                ▼                           ▼
       │            frontend/src/rules.generated.ts   shared/parity_cases.json
       │                       │                     (108 inputs + Python's answers)
       ▼                       ▼                           │
  Flask API  ◄── optional ── TypeScript app ◄── must match ┘
  /evaluate                  (runs on the phone, offline)
```

**Why two engines?** The app has to work with no internet, so the decision logic runs on the phone in TypeScript. But two copies of the same logic can quietly drift apart. So Python owns the rules: a script generates the TypeScript rule table from the Python source, and also writes 108 test cases with Python's exact answers. The TypeScript tests have to reproduce every one, field for field. If anyone changes a weight in one place and not the other, the tests fail.

More detail: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Tests

```bash
cd backend && pytest -v        # 51 tests: demo cases, red flags, each safety rule, keyword edge cases, API, codegen sync
cd frontend && npm test        # TypeScript engine vs. all 108 Python parity cases, plus edge cases
```

Both suites run on every push through GitHub Actions (`.github/workflows/ci.yml`).

## Run it

**Just use it:** open the live link above on any phone or computer.

**Offline single file:** `cd frontend && npm install && npm run standalone`, then double-click `frontend/dist/clarity-standalone.html`.

**Full stack locally:**
```bash
cd backend && pip install -r requirements.txt && python -m clarity.api     # Flask on :5000
cd frontend && npm install && npm run build && npm run serve                 # app on :8080
```
On localhost the app asks the Python API first and falls back to the on-device engine if it's not running. The reasoning panel shows which one answered.

## Repo layout

```
backend/clarity/       signals.py, scenarios.py, care_locations.py, engine.py, api.py
backend/scripts/       codegen.py (Python → TypeScript rules + parity cases)
backend/tests/         test_engine.py, test_api.py, test_codegen.py
frontend/src/          types, engine, rules.generated, i18n, api, ui, pwa, main (.ts)
frontend/tests/        engine.test.ts
frontend/public/       index.html, compiled js/, manifest, service worker, icons
shared/                parity_cases.json
docs/                  ARCHITECTURE, INSTALL
```

## Limits, honestly

- The rules and weights are based on widely published "call 911" warning signs. They have not been reviewed by a clinician or validated on real patients. A real version would need both.
- Nearby care locations are sample data near Redmond, WA, not a live lookup.
- Spanish free-text understanding covers common phrases, not everything.
- This is a student prototype, not a medical device. In an emergency, call 911.

## What's next

- Have an ER nurse or physician review the warning-sign list and weights
- Live nearby-care lookup
- More languages, starting with the most common ones in my district
- Screen reader testing with real users

MIT License
