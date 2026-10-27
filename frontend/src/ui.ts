/**
 * ui.ts
 * Owns the screen: input controls, the analyze step, the result, the guide,
 * the language switch, and the decision timer.
 */

import type { EvaluationResult, Lang, Onset, StructuredInput } from "./types.js";
import { SCENARIOS, SYMPTOM_CHIPS } from "./engine.js";
import { evaluateRequest, type Source } from "./api.js";
import { chipText, crisisLine, explanation, scenarioText, signalText, t, tierCopy, withSpanishKeywords } from "./i18n.js";

type View = "input" | "result" | "guide";
type Step = "scenario" | "severity" | "onset" | "symptoms";

interface State {
    lang: Lang;
    scenarioId: string | null;
    severity: number;
    onset: Onset;
    symptoms: Set<string>;
    freeText: string;
    showFreeText: boolean;
    touched: Set<Step>;
    startedAt: number | null;   // first tap, for the "decided in" timer
    last: { result: EvaluationResult; source: Source; seconds: number } | null;
}

const state: State = {
    lang: loadLang(),
    scenarioId: null, severity: 3, onset: "gradual",
    symptoms: new Set(), freeText: "", showFreeText: false,
    touched: new Set(), startedAt: null, last: null,
};

let timerHandle: number | undefined;
const reducedMotion = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── Small helpers ──────────────────────────────────────────────────────────

function $<T extends HTMLElement = HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`#${id} missing from index.html`);
    return el as T;
}

function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

function loadLang(): Lang {
    try { return localStorage.getItem("clarity-lang") === "es" ? "es" : "en"; } catch { return "en"; }
}

function saveLang(lang: Lang): void {
    try { localStorage.setItem("clarity-lang", lang); } catch { /* private mode, fine */ }
}

// ─── Static text ────────────────────────────────────────────────────────────

/** Fill every element marked data-i18n="key" (and data-i18n-aria / -placeholder). */
function applyStaticText(): void {
    document.documentElement.lang = state.lang;
    document.querySelectorAll<HTMLElement>("[data-i18n]").forEach(el => {
        el.innerHTML = t(state.lang, el.dataset.i18n as string); // our own strings, not user input
    });
    document.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach(el => {
        el.setAttribute("aria-label", t(state.lang, el.dataset.i18nAria as string));
    });
    document.querySelectorAll<HTMLTextAreaElement>("[data-i18n-placeholder]").forEach(el => {
        el.placeholder = t(state.lang, el.dataset.i18nPlaceholder as string);
    });
}

// ─── Input screen ───────────────────────────────────────────────────────────

function renderScenarios(): void {
    const grid = $("scenario-grid");
    grid.innerHTML = "";
    for (const sc of SCENARIOS) {
        const txt = scenarioText(state.lang, sc.id, sc);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "scenario-chip";
        btn.dataset.sid = sc.id;
        btn.innerHTML = `<span class="sc-cat">${escapeHtml(txt.category)}</span><span class="sc-label">${escapeHtml(txt.label)}</span>`;
        btn.addEventListener("click", () => selectScenario(sc.id));
        grid.appendChild(btn);
    }
}

function renderChips(): void {
    const wrap = $("symptom-chips");
    wrap.innerHTML = "";
    for (const chip of SYMPTOM_CHIPS) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "symptom-chip";
        btn.dataset.chip = chip; // canonical English value the engine uses
        btn.textContent = chipText(state.lang, chip);
        btn.addEventListener("click", () => {
            if (state.symptoms.has(chip)) state.symptoms.delete(chip);
            else state.symptoms.add(chip);
            touch("symptoms");
            sync();
        });
        wrap.appendChild(btn);
    }
}

function selectScenario(id: string): void {
    const sc = SCENARIOS.find(s => s.id === id);
    if (!sc) return;
    state.scenarioId = id;
    state.severity = sc.defaultSeverity;
    state.onset = sc.defaultOnset;
    state.symptoms = new Set(sc.defaultSymptoms);
    (["scenario", "severity", "onset", "symptoms"] as Step[]).forEach(touch);
    sync();
}

/** Reflect state into every control. */
function sync(): void {
    document.querySelectorAll<HTMLButtonElement>(".scenario-chip").forEach(b => {
        const on = b.dataset.sid === state.scenarioId;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
    });
    document.querySelectorAll<HTMLButtonElement>(".symptom-chip").forEach(b => {
        const on = state.symptoms.has(b.dataset.chip as string);
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
    });
    document.querySelectorAll<HTMLButtonElement>(".onset-pill").forEach(b => {
        const on = b.dataset.onset === state.onset;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
    });

    const slider = $<HTMLInputElement>("severity");
    slider.value = String(state.severity);
    const sevLabel = `${state.severity} · ${t(state.lang, `sev${state.severity}`)}`;
    slider.setAttribute("aria-valuetext", sevLabel);
    $("severity-label").textContent = sevLabel;
    $("severity-dots").innerHTML = [1, 2, 3, 4, 5]
        .map(i => `<span class="sev-dot${i <= state.severity ? " filled" : ""}"></span>`).join("");

    $("free-text-wrap").classList.toggle("visible", state.showFreeText);
    const toggle = $("free-text-toggle");
    toggle.textContent = t(state.lang, state.showFreeText ? "freeHide" : "freeShow");
    toggle.setAttribute("aria-expanded", String(state.showFreeText));

    $("tap-count").textContent = t(state.lang, "stepsDone", { n: state.touched.size });
}

// ─── Decision timer ─────────────────────────────────────────────────────────

/** First tap starts the clock. The point of the app is a decision in about ten seconds. */
function touch(step: Step): void {
    state.touched.add(step);
    if (state.startedAt !== null) return;
    state.startedAt = performance.now();
    const el = $("timer");
    el.hidden = false;
    timerHandle = window.setInterval(() => {
        if (state.startedAt !== null) el.textContent = `${((performance.now() - state.startedAt) / 1000).toFixed(1)}s`;
    }, 100);
}

function stopTimer(): number {
    window.clearInterval(timerHandle);
    const secs = state.startedAt === null ? 0 : (performance.now() - state.startedAt) / 1000;
    return Math.round(secs * 10) / 10;
}

function resetInput(): void {
    window.clearInterval(timerHandle);
    Object.assign(state, {
        scenarioId: null, severity: 3, onset: "gradual", symptoms: new Set(),
        freeText: "", showFreeText: false, touched: new Set(), startedAt: null,
    });
    $<HTMLTextAreaElement>("free-text").value = "";
    const timer = $("timer");
    timer.hidden = true;
    timer.textContent = "0.0s";
    sync();
}

// ─── Evaluate ───────────────────────────────────────────────────────────────

async function runEvaluation(): Promise<void> {
    const text = state.showFreeText ? state.freeText.trim() : "";
    if (!state.scenarioId && state.symptoms.size === 0 && !text) {
        const banner = $("empty-banner");
        banner.classList.add("show");
        setTimeout(() => banner.classList.remove("show"), 2000);
        return;
    }

    const inp: StructuredInput = {
        scenarioId: state.scenarioId,
        severity: state.severity,
        onset: state.onset,
        symptoms: [...state.symptoms],
        freeText: text ? withSpanishKeywords(text) : null,
    };

    showAnalyzing();
    const [out] = await Promise.all([evaluateRequest(inp), wait(reducedMotion() ? 0 : 650)]);
    state.last = { ...out, seconds: stopTimer() };
    renderResult();
    $("analyzing").classList.remove("active");
    switchView("result");
    $("result-headline").focus();
}

function showAnalyzing(): void {
    const overlay = $("analyzing");
    overlay.classList.add("active");
    const steps = Array.from(document.querySelectorAll<HTMLElement>("#analyze-steps li"));
    steps.forEach(s => s.classList.remove("done"));
    steps.forEach((s, i) => setTimeout(() => s.classList.add("done"), 80 + i * 140));
}

// ─── Result screen ──────────────────────────────────────────────────────────

function renderResult(): void {
    if (!state.last) return;
    const { result: r, source, seconds } = state.last;
    const L = state.lang;
    const copy = tierCopy(L, r);
    const li = (mark: string) => (s: string) => `<li><span class="dash" aria-hidden="true">${mark}</span><span>${escapeHtml(s)}</span></li>`;

    // Someone describing thoughts of ending their life also needs the 988 crisis line, first.
    const crisis = r.detected.some(d => d.label === "Safety crisis");
    const whatToDo = crisis ? [crisisLine(L), ...copy.whatToDo] : [...copy.whatToDo];

    const signals = r.detected.length === 0
        ? `<div class="sig-row"><span class="sig-label">${t(L, "noSignals")}</span></div>`
        : r.detected.map(d => {
            const w = Math.abs(d.weight) >= 5 ? "w-high" : Math.abs(d.weight) >= 2 ? "w-med" : "w-low";
            return `<div class="sig-row"><span class="sig-label">${escapeHtml(signalText(L, d.label))}</span>` +
                `<span class="sig-weight ${w}">${d.weight > 0 ? "+" : ""}${d.weight}</span></div>`;
        }).join("");

    const places = r.places.map(p => `
        <div class="place">
          <div><div class="place-name">${escapeHtml(p.name)}</div><div class="place-kind">${escapeHtml(p.kind)}</div></div>
          <div class="place-dist">${p.distanceMi}<span>mi</span></div>
        </div>`).join("");

    const host = $("result-host");
    host.className = `result-host tier-${r.tier}`;
    host.innerHTML = `
      <section class="urgency-banner">
        <div class="urg-meta">
          <span class="urg-tier">${t(L, "tierWord")} · ${t(L, `tier_${r.tier}`)}</span>
          <span class="urg-time">${t(L, "decidedIn", { t: seconds.toFixed(1) })}</span>
        </div>
        <h1 class="urg-headline" id="result-headline" tabindex="-1">${escapeHtml(copy.headline)}</h1>
        <p class="urg-action">${escapeHtml(copy.action)}</p>
        ${r.tier === "high" ? `<button type="button" class="emergency-btn" id="btn-911"><span class="emergency-dot" aria-hidden="true"></span>${t(L, "call911")}</button>` : ""}
      </section>
      <section class="block"><h3 class="block-title">${t(L, "why")}</h3><p class="block-body">${escapeHtml(explanation(L, r))}</p></section>
      <section class="block"><h3 class="block-title">${t(L, "whatNow")}</h3><ul class="bullets">${whatToDo.map(li("—")).join("")}</ul></section>
      <section class="block"><h3 class="block-title">${t(L, "watchFor")}</h3><ul class="bullets warn">${copy.watchFor.map(li("△")).join("")}</ul></section>
      <section class="block">
        <h3 class="block-title">${t(L, "nearby")}</h3>
        <div class="places">${places}</div>
        <p class="sample-note">${t(L, "sampleData")}</p>
      </section>
      <details class="reasoning-panel">
        <summary>
          <span>${t(L, "viewReasoning")}</span>
          <span class="sum-meta">${t(L, "signals", { n: r.detected.length, s: r.score })}${r.escalationRule ? ` · ${t(L, "escalated", { r: r.escalationRule })}` : ""}</span>
        </summary>
        <div class="sig-list">${signals}</div>
        <div class="src-line">${t(L, source === "backend" ? "srcBackend" : "srcLocal")}</div>
      </details>
      <div class="result-actions">
        <button type="button" class="btn secondary" id="btn-new">${t(L, "newCheck")}</button>
        <button type="button" class="btn primary" id="btn-edit">${t(L, "edit")}</button>
      </div>`;

    $("btn-new").addEventListener("click", () => { resetInput(); switchView("input"); });
    $("btn-edit").addEventListener("click", () => switchView("input"));
    document.getElementById("btn-911")?.addEventListener("click", () => alert(t(L, "call911Demo")));
}

// ─── Navigation + language ──────────────────────────────────────────────────

function switchView(view: View): void {
    document.querySelectorAll<HTMLElement>(".view").forEach(v => v.classList.toggle("active", v.id === `view-${view}`));
    document.querySelectorAll<HTMLButtonElement>(".nav-btn").forEach(b => {
        const on = b.dataset.view === view || (view === "result" && b.dataset.view === "input");
        b.classList.toggle("active", on);
        b.setAttribute("aria-current", on ? "page" : "false");
    });
    $("cta-row").hidden = view !== "input";
    $("app-scroll").scrollTop = 0;
}

function setLang(lang: Lang): void {
    state.lang = lang;
    saveLang(lang);
    applyStaticText();
    renderScenarios();
    renderChips();
    sync();
    if (state.last) renderResult();
}

// ─── Start ──────────────────────────────────────────────────────────────────

export function init(): void {
    applyStaticText();
    renderScenarios();
    renderChips();
    sync();

    document.querySelectorAll<HTMLButtonElement>(".nav-btn").forEach(b =>
        b.addEventListener("click", () => switchView(b.dataset.view as View)));

    $("lang-toggle").addEventListener("click", () => setLang(state.lang === "en" ? "es" : "en"));

    $<HTMLInputElement>("severity").addEventListener("input", e => {
        state.severity = Number((e.target as HTMLInputElement).value);
        touch("severity");
        sync();
    });

    document.querySelectorAll<HTMLButtonElement>(".onset-pill").forEach(b =>
        b.addEventListener("click", () => {
            state.onset = b.dataset.onset as Onset;
            touch("onset");
            sync();
        }));

    $("free-text-toggle").addEventListener("click", () => {
        state.showFreeText = !state.showFreeText;
        sync();
        if (state.showFreeText) $("free-text").focus();
    });
    $<HTMLTextAreaElement>("free-text").addEventListener("input", e => {
        state.freeText = (e.target as HTMLTextAreaElement).value;
        if (state.freeText) touch("symptoms");
    });

    $("evaluate").addEventListener("click", () => void runEvaluation());
    $("reset").addEventListener("click", resetInput);

    const clock = $("clock");
    const tick = () => {
        const d = new Date();
        clock.textContent = `${((d.getHours() + 11) % 12) + 1}:${String(d.getMinutes()).padStart(2, "0")}`;
    };
    tick();
    setInterval(tick, 30_000);
}
