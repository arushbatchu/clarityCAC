# Architecture

## Three rules for the design

1. **Deterministic.** Same input, same output, every time. No AI model, no randomness. Every answer traces to a rule you can read.
2. **Conservative.** Uncertainty only ever moves urgency up. A false alarm is recoverable. A missed emergency might not be.
3. **Works offline.** The engine runs on the phone. The Python API is optional.

## The pipeline

Same steps in `backend/clarity/engine.py` and `frontend/src/engine.ts`:

1. **Build text.** Combine the scenario's description, tapped symptoms, "sudden onset" if chosen, and any typed text. (Spanish phrases get their English keyword added first, in `i18n.ts`.)
2. **Find signals.** Check ~33 signals in six groups. A keyword only counts at the start of a word ("cut" doesn't match "acute") and is skipped if negated ("not going away" is not "going away"). Red flags ignore negation on purpose.
3. **Score.** Add the signal weights plus a bonus from the severity slider (1→−1, 2→0, 3→+1, 4→+3, 5→+5).
4. **Base level.** Any red flag or score ≥ 6 → HIGH. Score ≥ 2 → MODERATE. Otherwise LOW.
5. **Safety rules.** Only run on LOW, only move it to MODERATE. First match wins:
   - **R1** unclear wording and nothing reassuring
   - **R2** nothing detected and no scenario chosen
   - **R3** baby, older adult, or pregnancy, plus any symptom
   - **R4** sudden onset at severity 4 or 5
6. **Red-flag guard.** If there's a red flag, the result is HIGH no matter what.
7. **Output.** Level, one action, a one-or-two-sentence reason, what to do, what to watch for, nearby care, and the full list of signals and weights.

| Signal group | Count | Weight | Role |
|---|---|---|---|
| red_flag | 10 | +4 to +6 | Forces HIGH |
| severity | 5 | +3 | Strong intensifiers |
| moderate | 10 | +1 to +3 | Concrete symptoms |
| protective | 4 | −1 to −2 | Reassuring context |
| ambiguity | 1 | +1 | Can trigger R1 |
| vulnerable | 3 | +1 to +2 | Can trigger R3 |

## Keeping Python and TypeScript identical

`backend/scripts/codegen.py` writes two files from the Python source:

- `frontend/src/rules.generated.ts`: every signal, keyword, weight, threshold, scenario, and piece of result copy, as typed TypeScript. The TypeScript engine imports this instead of having its own copy.
- `shared/parity_cases.json`: 108 inputs (every scenario × severity × onset, chip-only inputs, and tricky free text) with the exact answer Python gives.

`frontend/tests/engine.test.ts` runs the TypeScript engine on all 108 and requires an exact match on level, score, which rule fired, the reason text, and the detected signals. `backend/tests/test_codegen.py` fails if someone edits Python and forgets to rerun codegen. CI runs all of it on every push.

## Frontend modules

| File | Job |
|---|---|
| `types.ts` | Shared types and runtime type guards |
| `rules.generated.ts` | Generated rule data (don't edit) |
| `engine.ts` | The on-device engine |
| `i18n.ts` | English/Spanish text, Spanish phrase → keyword mapping |
| `api.ts` | On localhost, ask the Flask API first (600 ms timeout), else use the on-device engine. Validates the response before trusting it. |
| `ui.ts` | Controls, decision timer, results, reasoning panel, language switch |
| `pwa.ts` | Service worker registration and install prompts (Android prompt, iPhone instructions) |
| `main.ts` | Entry point |

Compiled output goes to `frontend/public/js/` and is committed so GitHub Pages can serve it with no build step. `scripts/build-standalone.mjs` inlines it all into one HTML file for opening without a server.

## Accessibility

Toggle buttons expose `aria-pressed`, the severity slider announces its label, the result area is a live region and focus moves to the result headline, keyboard focus is clearly outlined, tap targets are at least 36px, and animations turn off for people who set "reduce motion."

## Why no AI model

For "should I call 911," every recommendation should be traceable to a specific rule that someone can check and argue with. A language model could be useful later for understanding free text, but the decision itself should stay rule-based and reviewable.
