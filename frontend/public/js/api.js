/**
 * api.ts
 * Asks the Python backend first when it's running locally, otherwise uses the
 * in-browser TypeScript engine. Either way the user gets an answer.
 */
import { isRuleId, isTier } from "./types.js";
import { evaluate as evaluateLocal } from "./engine.js";
const BACKEND_URL = "http://127.0.0.1:5000";
const TIMEOUT_MS = 600;
/** Only try the backend on localhost. A public https page can't call http://127.0.0.1 anyway. */
function backendPossible() {
    return typeof location !== "undefined" &&
        (location.hostname === "localhost" || location.hostname === "127.0.0.1");
}
async function tryBackend(inp) {
    if (!backendPossible())
        return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(`${BACKEND_URL}/evaluate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                scenario_id: inp.scenarioId, severity: inp.severity, onset: inp.onset,
                symptoms: inp.symptoms, free_text: inp.freeText,
            }),
            signal: ctrl.signal,
        });
        if (!res.ok)
            return null;
        const d = (await res.json());
        if (!isTier(d.tier))
            return null; // never trust the network blindly
        return {
            tier: d.tier, headline: d.headline, action: d.action, explanation: d.explanation,
            whatToDo: d.what_to_do, watchFor: d.watch_for, detected: d.detected,
            score: d.score, escalated: d.escalated, severity: d.severity,
            escalationRule: isRuleId(d.escalation_rule) ? d.escalation_rule : null,
            escalationReason: d.escalation_reason,
            places: d.places.map(p => ({ name: p.name, kind: p.kind, distanceMi: p.distance_mi, isOpen: p.is_open })),
        };
    }
    catch {
        return null;
    }
    finally {
        clearTimeout(timer);
    }
}
export async function evaluateRequest(inp) {
    const remote = await tryBackend(inp);
    return remote ? { result: remote, source: "backend" } : { result: evaluateLocal(inp), source: "local" };
}
