/**
 * TypeScript engine tests. Run with: npm test
 *
 * The big one: shared/parity_cases.json holds 108 inputs and the exact output
 * the Python engine produced. The TypeScript engine has to match every field.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluate, matches } from "../src/engine.js";
import { explanation } from "../src/i18n.js";
import type { StructuredInput, Tier } from "../src/types.js";

interface ParityCase {
    input: StructuredInput;
    expected: {
        tier: Tier; score: number; escalated: boolean; escalationRule: string | null;
        explanation: string; detected: string[];
    };
}

const casesPath = new URL("../../../shared/parity_cases.json", import.meta.url) // from .test-build/tests/;
const cases = JSON.parse(readFileSync(casesPath, "utf-8")) as ParityCase[];

test("parity file is not empty", () => {
    assert.ok(cases.length >= 100, `expected 100+ parity cases, got ${cases.length}`);
});

test("TypeScript engine matches Python on every parity case", () => {
    const failures: string[] = [];
    for (const c of cases) {
        const r = evaluate(c.input);
        const got = {
            tier: r.tier, score: r.score, escalated: r.escalated, escalationRule: r.escalationRule,
            explanation: r.explanation, detected: r.detected.map(d => d.label),
        };
        try { assert.deepEqual(got, c.expected); }
        catch { failures.push(JSON.stringify({ input: c.input, expected: c.expected, got })); }
    }
    assert.equal(failures.length, 0, `${failures.length} mismatches:\n${failures.slice(0, 3).join("\n")}`);
});

test("demo flow: chest -> high, something feels off -> moderate, injury -> moderate", () => {
    const run = (scenarioId: string, severity: number, onset: "sudden" | "gradual", symptoms: string[]) =>
        evaluate({ scenarioId, severity, onset, symptoms, freeText: null }).tier;
    assert.equal(run("chest", 4, "sudden", ["chest pressure", "sweating", "shortness of breath"]), "high");
    assert.equal(run("vague", 2, "gradual", ["dizzy", "heart feels weird"]), "moderate");
    assert.equal(run("injury", 2, "sudden", ["mild bleeding", "bruising"]), "moderate");
});

test("matching respects word starts and negation, except for red flags", () => {
    assert.equal(matches("acute pain", "cut"), false);
    assert.equal(matches("it's not going away", "going away"), false);
    assert.equal(matches("no chest pain", "chest pain", true), true);
});

test("red flags can never be downgraded", () => {
    const r = evaluate({ scenarioId: null, severity: 1, onset: "gradual", symptoms: [],
        freeText: "chest pressure, mild, improving, brief" });
    assert.equal(r.tier, "high");
});

test("same input, same output", () => {
    const inp: StructuredInput = { scenarioId: "vague", severity: 3, onset: "sudden", symptoms: ["dizzy"], freeText: null };
    assert.deepEqual(evaluate(inp), evaluate(inp));
});

test("Spanish explanation exists for every parity case and has no English left in it", () => {
    for (const c of cases) {
        const es = explanation("es", evaluate(c.input));
        assert.ok(es.length > 0);
        assert.ok(!/You reported|Nothing specific|warning sign/.test(es), `English leaked into Spanish: ${es}`);
    }
});

test("Spanish explanation matches the urgency level", () => {
    for (const c of cases) {
        const r = evaluate(c.input);
        const es = explanation("es", r);
        if (r.tier === "high") assert.match(es, /emergencia/);
        if (r.tier !== "low") assert.doesNotMatch(es, /estar atento/);
    }
});

test("invalid severity is rejected, not silently treated as 3", () => {
    assert.throws(() => evaluate({ scenarioId: null, severity: 9, onset: "gradual", symptoms: [], freeText: null }), RangeError);
});
