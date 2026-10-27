/**
 * engine.ts
 * The Clarity decision engine, in TypeScript, running in the browser.
 *
 * The algorithm here mirrors backend/clarity/engine.py step for step.
 * The data it uses (signals, weights, thresholds, copy) is NOT typed by hand:
 * it's generated from the Python source into rules.generated.ts.
 * tests/engine.test.ts checks this file against 108 cases the Python engine
 * produced, so the two can't silently drift apart.
 *
 * Why run it in the browser at all? So the app works with no signal.
 */
import { CARE, ENDINGS, ESCALATION_REASONS, HIGH_THRESHOLD, IMPLIED_BY, MODERATE_THRESHOLD, NEGATIONS, PHRASES, SCENARIOS, SEVERITY_BONUS, SEVERITY_WORDS, SIGNALS, SUDDEN_ONSET, TIER_COPY, } from "./rules.generated.js";
export { SCENARIOS, SYMPTOM_CHIPS } from "./rules.generated.js";
/** [1] Combine every input into one lowercase string to scan. */
export function buildText(inp) {
    const parts = [];
    if (inp.scenarioId) {
        const sc = SCENARIOS.find(s => s.id === inp.scenarioId);
        if (sc)
            parts.push(sc.narrative.toLowerCase());
    }
    if (inp.symptoms.length)
        parts.push(inp.symptoms.map(s => s.toLowerCase()).join(" "));
    if (inp.onset === "sudden")
        parts.push("sudden onset came on suddenly");
    if (inp.freeText)
        parts.push(inp.freeText.toLowerCase());
    return parts.join(" ");
}
const isAlnum = (ch) => /[a-z0-9]/i.test(ch);
/**
 * Keyword match that (a) only counts at the start of a word, so "cut" doesn't
 * match "acute", and (b) skips negated phrases like "not going away", unless
 * allowNegation is set. Red flags set it, so they can never be talked down.
 */
export function matches(text, keyword, allowNegation = false) {
    let start = text.indexOf(keyword);
    while (start !== -1) {
        const atWordStart = start === 0 || !isAlnum(text[start - 1]);
        const before = text.slice(Math.max(0, start - 6), start);
        const negated = NEGATIONS.some(n => before.endsWith(n));
        if (atWordStart && (allowNegation || !negated))
            return true;
        start = text.indexOf(keyword, start + 1);
    }
    return false;
}
/** [2] One hit per signal whose keywords appear. */
export function extractSignals(text) {
    return SIGNALS
        .filter(s => s.keywords.some(kw => matches(text, kw, s.category === "red_flag")))
        .map(s => ({ label: s.label, weight: s.weight, category: s.category }));
}
/** [3] Score -> base tier. */
function baseTier(score, hasRedFlag) {
    if (hasRedFlag || score >= HIGH_THRESHOLD)
        return "high";
    if (score >= MODERATE_THRESHOLD)
        return "moderate";
    return "low";
}
/**
 * [4] Safety overrides. Only ever move LOW up to MODERATE.
 * R1 unclear wording, R2 no data, R3 vulnerable person, R4 sudden + severe.
 */
function applySafetyOverrides(tier, detected, inp) {
    if (tier !== "low")
        return { tier, rule: null };
    const has = (c) => detected.some(d => d.category === c);
    const hasConcern = has("moderate") || has("severity");
    if (has("ambiguity") && !has("protective"))
        return { tier: "moderate", rule: "R1" };
    if (detected.length === 0 && !inp.scenarioId)
        return { tier: "moderate", rule: "R2" };
    if (has("vulnerable") && hasConcern)
        return { tier: "moderate", rule: "R3" };
    if (inp.onset === "sudden" && inp.severity >= 4)
        return { tier: "moderate", rule: "R4" };
    return { tier, rule: null };
}
/** [5] One or two plain sentences: what we saw, how urgent, and which safety rule fired. */
function buildExplanation(detected, tier, severity, reason) {
    const labels = new Set(detected.map(d => d.label));
    const said = (c) => detected
        .filter(d => d.category === c && !labels.has(IMPLIED_BY[d.label] ?? "") && d.label !== SUDDEN_ONSET)
        .map(d => PHRASES[d.label] ?? d.label.toLowerCase());
    const red = said("red_flag");
    const concerns = [...said("severity"), ...said("moderate")];
    const sudden = labels.has(SUDDEN_ONSET);
    let core;
    if (red.length) {
        core = `You reported ${red[0]}. That's a warning sign, and warning signs always mean emergency care.`;
    }
    else if (concerns.length || sudden) {
        let what = concerns.length ? concerns.slice(0, 2).join(" and ") : "symptoms";
        if (sudden)
            what += " that started suddenly";
        core = `You reported ${what}${ENDINGS[tier]}`;
    }
    else if (tier !== "low") {
        // No specific symptom drove this: the severity rating did. Say so.
        core = `You rated how you feel as ${SEVERITY_WORDS[severity]}, ${severity} out of 5${ENDINGS[tier]}`;
    }
    else {
        core = "Nothing specific stood out.";
    }
    return reason ? `${core} ${reason}` : core;
}
/** Run the whole pipeline. Same input always gives the same output. */
export function evaluate(inp) {
    const detected = extractSignals(buildText(inp));
    const hasRedFlag = detected.some(d => d.category === "red_flag");
    const bonus = SEVERITY_BONUS[inp.severity];
    if (bonus === undefined)
        throw new RangeError(`severity must be 1-5, got ${inp.severity}`);
    const score = detected.reduce((sum, d) => sum + d.weight, 0) + bonus;
    const over = applySafetyOverrides(baseTier(score, hasRedFlag), detected, inp);
    const tier = hasRedFlag ? "high" : over.tier; // red flags can never be downgraded
    const reason = over.rule ? ESCALATION_REASONS[over.rule] : null;
    const copy = TIER_COPY[tier];
    return {
        tier,
        headline: copy.headline,
        action: copy.action,
        explanation: buildExplanation(detected, tier, inp.severity, reason),
        whatToDo: copy.whatToDo,
        watchFor: copy.watchFor,
        detected,
        score,
        escalated: over.rule !== null,
        severity: inp.severity,
        escalationRule: over.rule,
        escalationReason: reason,
        places: [...CARE[tier]],
    };
}
