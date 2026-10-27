/**
 * types.ts
 * Shared type definitions. These mirror the Python dataclasses in
 * backend/clarity/engine.py so both engines speak the same contract.
 */
export function isTier(x) {
    return x === "low" || x === "moderate" || x === "high";
}
export function isRuleId(x) {
    return x === "R1" || x === "R2" || x === "R3" || x === "R4";
}
