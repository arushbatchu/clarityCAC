/**
 * types.ts
 * Shared type definitions. These mirror the Python dataclasses in
 * backend/clarity/engine.py so both engines speak the same contract.
 */

export type Tier = "low" | "moderate" | "high";
export type Onset = "sudden" | "gradual";
export type Lang = "en" | "es";
export type RuleId = "R1" | "R2" | "R3" | "R4";
export type Category =
    | "red_flag"    // any hit forces HIGH
    | "severity"    // strong intensifiers
    | "moderate"    // concrete symptoms
    | "protective"  // reassuring context, negative weight
    | "ambiguity"   // unclear wording, can trigger R1
    | "vulnerable"; // baby, older adult, pregnancy, can trigger R3

export interface SignalDef {
    label: string;
    weight: number;
    category: Category;
    keywords: readonly string[];
}

export interface StructuredInput {
    scenarioId: string | null;
    severity: number; // 1..5
    onset: Onset;
    symptoms: readonly string[];
    freeText: string | null;
}

export interface DetectedSignal {
    label: string;
    weight: number;
    category: Category;
}

export interface Scenario {
    id: string;
    category: string;
    label: string;
    defaultSeverity: number;
    defaultOnset: Onset;
    defaultSymptoms: readonly string[];
    narrative: string;
}

export interface CarePlace {
    name: string;
    kind: string;
    distanceMi: number;
    isOpen: boolean;
}

export interface TierCopy {
    headline: string;
    action: string;
    whatToDo: readonly string[];
    watchFor: readonly string[];
}

export interface EvaluationResult {
    tier: Tier;
    headline: string;
    action: string;
    explanation: string;
    whatToDo: readonly string[];
    watchFor: readonly string[];
    detected: DetectedSignal[];
    score: number;
    escalated: boolean;
    severity: number;
    escalationRule: RuleId | null;
    escalationReason: string | null;
    places: CarePlace[];
}

export function isTier(x: unknown): x is Tier {
    return x === "low" || x === "moderate" || x === "high";
}

export function isRuleId(x: unknown): x is RuleId {
    return x === "R1" || x === "R2" || x === "R3" || x === "R4";
}
