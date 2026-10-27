/**
 * i18n.ts
 * English and Spanish copy for the whole interface.
 *
 * Why Spanish: people who aren't comfortable in English are more likely to wait
 * before getting care, and a triage tool that only works in English leaves them
 * out at exactly the wrong moment. The engine itself stays in one canonical
 * language; this layer translates what the user sees, and maps common Spanish
 * phrases in free text onto the engine's English keywords.
 */

import type { DetectedSignal, EvaluationResult, Lang, RuleId, Tier, TierCopy } from "./types.js";
import { IMPLIED_BY, SUDDEN_ONSET } from "./rules.generated.js";

type Strings = Record<string, string>;

const EN: Strings = {
    tagline: "Rapid triage<br/>for uncertain moments",
    problemLabel: "THE PROBLEM",
    problemText: "In the first seconds after a scary symptom, most people <em>freeze</em>. Rest, call a nurse, or call 911? Waiting to decide costs time that matters.",
    navTriage: "Triage", navGuide: "Guide",
    heroEye: "RAPID CHECK · AIM ≤10 SEC",
    heroTitle: "What's<br/><em>happening</em> <span class=\"mark\">now?</span>",
    heroSub: "Tap a scenario, set severity, pick symptoms. No typing needed, but you can add detail.",
    emptyBanner: "Pick a scenario or at least one symptom first.",
    step1: "Pick a scenario", step2: "How severe?", step3: "Onset", step4: "Symptoms",
    stepWord: "Step",
    sudden: "Sudden", gradual: "Gradual",
    freeShow: "+ Add written description", freeHide: "− Hide description",
    freePlaceholder: "Anything else, in your own words (optional)",
    evaluate: "Evaluate now", reset: "Start over",
    analyzing: "Analyzing…",
    an1: "Reading your answers", an2: "Checking warning signs", an3: "Applying safety rules", an4: "Choosing one action",
    stepsDone: "{n} / 4 steps",
    sev1: "Barely there", sev2: "Mild", sev3: "Noticeable", sev4: "Strong", sev5: "Overwhelming",
    why: "Why", whatNow: "What to do now", watchFor: "Watch for",
    nearby: "Nearby care", sampleData: "Sample locations near Redmond, WA. Not live data.",
    viewReasoning: "View reasoning", signals: "{n} signals · score {s}", escalated: "safety rule {r}",
    noSignals: "No specific signals",
    call911: "Call 911", call911Demo: "Demo version: this button would call 911.",
    newCheck: "New check", edit: "Edit answers",
    decidedIn: "Decided in {t}s", srcBackend: "Python engine", srcLocal: "On-device engine",
    tierWord: "TIER", tier_low: "LOW", tier_moderate: "MODERATE", tier_high: "HIGH",
    installTitle: "Install Clarity", installSub: "Keep it on your home screen. Works offline.",
    installBtn: "Install",
    iosTitle: "Add Clarity to your iPhone",
    ios1: "Tap the Share button at the bottom of Safari.",
    ios2: "Scroll down and tap <strong>Add to Home Screen</strong>.",
    ios3: "Tap <strong>Add</strong>.",
    gotIt: "Got it",
    guideTitle: "How Clarity <em>thinks.</em>",
    guideSub: "A rule-based engine you can inspect. It helps you act. It does not diagnose. When in doubt, it moves you up a level.",
    tiersLabel: "Urgency levels",
    lowName: "Low · Stable", lowDesc: "No immediate action. Rest, watch, check again if anything changes.",
    modName: "Moderate · Act soon", modDesc: "Get seen within hours. Call a professional or go to urgent care.",
    highName: "High · Emergency", highDesc: "Call 911 or go to the nearest ER now. Don't drive yourself.",
    principlesLabel: "Safety rules",
    p1n: "Warning signs always win", p1b: "Chest pressure, stroke signs, trouble breathing, and similar always mean emergency care. Nothing can talk them down.",
    p2n: "Unsure means up, not down", p2b: "Unclear answers, missing details, a baby or older adult, or sudden strong symptoms all move LOW up to MODERATE.",
    p3n: "One action", p3b: "In a scary moment, a list of options is a burden. You get one clear next step.",
    p4n: "Nothing hidden", p4b: "Tap View reasoning on any result to see every signal, its weight, and which rule fired.",
    howLabel: "How it decides",
    howBody: "Your answers are scanned for warning signs, severity words, symptoms, and reassuring context. Each has a weight. The total sets a level, then the safety rules can only move it up. Red flags can never move down.",
    disclaimer: "Clarity is a student prototype. It is not a medical device and does not diagnose or treat anything. In an emergency, call 911.",
    principle1: "Turn a confusing moment into one clear next step.",
    principle2: "When unsure, move up a level. Never down.",
    principle3: "Every decision shows its reasoning.",
    principle4: "Clarity routes you to care. It does not diagnose.",
    langToggle: "ES", langToggleLabel: "Cambiar a español",
};

const ES: Strings = {
    tagline: "Triaje rápido<br/>para momentos inciertos",
    problemLabel: "EL PROBLEMA",
    problemText: "En los primeros segundos después de un síntoma que asusta, la mayoría de la gente se <em>paraliza</em>. ¿Descansar, llamar a una enfermera o al 911? Dudar cuesta tiempo valioso.",
    navTriage: "Triaje", navGuide: "Guía",
    heroEye: "REVISIÓN RÁPIDA · META ≤10 SEG",
    heroTitle: "¿Qué está<br/><em>pasando</em> <span class=\"mark\">ahora?</span>",
    heroSub: "Elija una situación, la gravedad y los síntomas. No hace falta escribir, pero puede agregar detalles.",
    emptyBanner: "Primero elija una situación o al menos un síntoma.",
    step1: "Elija una situación", step2: "¿Qué tan grave?", step3: "Comienzo", step4: "Síntomas",
    stepWord: "Paso",
    sudden: "Repentino", gradual: "Gradual",
    freeShow: "+ Agregar descripción escrita", freeHide: "− Ocultar descripción",
    freePlaceholder: "Algo más, en sus propias palabras (opcional)",
    evaluate: "Evaluar ahora", reset: "Empezar de nuevo",
    analyzing: "Analizando…",
    an1: "Leyendo sus respuestas", an2: "Buscando señales de alarma", an3: "Aplicando reglas de seguridad", an4: "Eligiendo una acción",
    stepsDone: "{n} / 4 pasos",
    sev1: "Casi nada", sev2: "Leve", sev3: "Notable", sev4: "Fuerte", sev5: "Abrumador",
    why: "Por qué", whatNow: "Qué hacer ahora", watchFor: "Esté atento a",
    nearby: "Atención cercana", sampleData: "Lugares de ejemplo cerca de Redmond, WA. No son datos en vivo.",
    viewReasoning: "Ver razonamiento", signals: "{n} señales · puntaje {s}", escalated: "regla {r}",
    noSignals: "Ninguna señal específica",
    call911: "Llamar al 911", call911Demo: "Versión de demostración: este botón llamaría al 911.",
    newCheck: "Nueva revisión", edit: "Editar respuestas",
    decidedIn: "Decidido en {t} s", srcBackend: "Motor en Python", srcLocal: "Motor en el teléfono",
    tierWord: "NIVEL", tier_low: "BAJO", tier_moderate: "MODERADO", tier_high: "ALTO",
    installTitle: "Instalar Clarity", installSub: "Téngala en su pantalla de inicio. Funciona sin internet.",
    installBtn: "Instalar",
    iosTitle: "Agregue Clarity a su iPhone",
    ios1: "Toque el botón Compartir en la parte de abajo de Safari.",
    ios2: "Baje y toque <strong>Agregar a inicio</strong>.",
    ios3: "Toque <strong>Agregar</strong>.",
    gotIt: "Entendido",
    guideTitle: "Cómo <em>piensa</em> Clarity.",
    guideSub: "Un motor de reglas que usted puede revisar. Le ayuda a actuar. No diagnostica. Si hay duda, sube un nivel.",
    tiersLabel: "Niveles de urgencia",
    lowName: "Baja · Estable", lowDesc: "No se necesita acción inmediata. Descanse, observe y revise de nuevo si algo cambia.",
    modName: "Moderada · Actúe pronto", modDesc: "Busque atención en las próximas horas. Llame a un profesional o vaya a urgent care.",
    highName: "Alta · Emergencia", highDesc: "Llame al 911 o vaya a la sala de emergencias ahora. No maneje usted.",
    principlesLabel: "Reglas de seguridad",
    p1n: "Las señales de alarma siempre ganan", p1b: "Presión en el pecho, señales de derrame, dificultad para respirar y similares siempre significan emergencia. Nada las baja.",
    p2n: "Si hay duda, se sube", p2b: "Respuestas poco claras, falta de detalles, un bebé o una persona mayor, o síntomas fuertes y repentinos suben BAJA a MODERADA.",
    p3n: "Una sola acción", p3b: "En un momento de miedo, una lista de opciones es una carga. Usted recibe un solo paso claro.",
    p4n: "Nada oculto", p4b: "Toque Ver razonamiento en cualquier resultado para ver cada señal, su peso y qué regla se aplicó.",
    howLabel: "Cómo decide",
    howBody: "Sus respuestas se revisan buscando señales de alarma, palabras de gravedad, síntomas y contexto tranquilizador. Cada una tiene un peso. El total marca un nivel y las reglas de seguridad solo pueden subirlo. Las señales de alarma nunca bajan.",
    disclaimer: "Clarity es un prototipo estudiantil. No es un dispositivo médico y no diagnostica ni trata nada. En una emergencia, llame al 911.",
    principle1: "Convertir un momento confuso en un solo paso claro.",
    principle2: "Si hay duda, subir de nivel. Nunca bajar.",
    principle3: "Cada decisión muestra su razonamiento.",
    principle4: "Clarity le guía hacia la atención. No diagnostica.",
    langToggle: "EN", langToggleLabel: "Switch to English",
};

const STRINGS: Record<Lang, Strings> = { en: EN, es: ES };

/** Look up a string, filling {placeholders}. Falls back to English, then the key. */
export function t(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
    const raw = STRINGS[lang][key] ?? EN[key] ?? key;
    return raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

// ─── Engine data the user sees, keyed by its canonical English id ───────────

const SCENARIO_ES: Record<string, { category: string; label: string }> = {
    chest: { category: "Cardíaco", label: "Molestia en el pecho" },
    breathing: { category: "Respiratorio", label: "Dificultad para respirar" },
    headache: { category: "Neurológico", label: "Dolor de cabeza fuerte" },
    injury: { category: "Trauma", label: "Lesión repentina" },
    fever_child: { category: "Pediátrico", label: "Fiebre alta (niño)" },
    vague: { category: "Incierto", label: "Algo no se siente bien" },
};

const CHIP_ES: Record<string, string> = {
    "chest pressure": "presión en el pecho", "short of breath": "falta de aire", "sweating": "sudoración",
    "worst headache": "el peor dolor de cabeza", "nausea": "náuseas", "vomiting": "vómito",
    "dizzy": "mareo", "confused": "confusión", "slurred speech": "habla arrastrada",
    "high fever": "fiebre alta", "chills": "escalofríos", "mild bleeding": "sangrado leve",
    "severe bleeding": "sangrado grave", "swelling": "hinchazón", "tight chest": "pecho apretado",
    "heart feels weird": "el corazón se siente raro", "tired": "cansancio", "not eating": "no come",
    "light sensitivity": "sensibilidad a la luz", "bruising": "moretones", "face drooping": "cara caída",
};

const SIGNAL_ES: Record<string, string> = {
    "Chest pain / pressure": "Dolor o presión en el pecho",
    "Severe breathing difficulty": "Dificultad grave para respirar",
    "Loss of consciousness": "Pérdida del conocimiento",
    "Stroke indicators (FAST)": "Señales de derrame cerebral (FAST)",
    "Uncontrolled bleeding": "Sangrado que no para",
    "Safety crisis": "Crisis de seguridad",
    "Possible overdose / poisoning": "Posible sobredosis o envenenamiento",
    "Seizure activity": "Convulsiones",
    "Airway / anaphylaxis": "Vías respiratorias / anafilaxia",
    "Significant head injury": "Golpe fuerte en la cabeza",
    "High severity language": "Palabras de alta gravedad",
    "Sudden onset": "Comienzo repentino",
    "Intense pain quality": "Dolor intenso",
    "Escalating over time": "Empeora con el tiempo",
    "Very high fever": "Fiebre muy alta",
    "Shortness of breath": "Falta de aire",
    "Dizziness / vision change": "Mareo o cambio en la vista",
    "Nausea / vomiting": "Náuseas o vómito",
    "Confusion": "Confusión",
    "Fever present": "Fiebre",
    "Headache": "Dolor de cabeza",
    "Pain reported": "Dolor",
    "Injury": "Lesión",
    "Skin / swelling reaction": "Reacción en la piel o hinchazón",
    "Dehydration signs": "Señales de deshidratación",
    "Mild descriptors": "Palabras de algo leve",
    "Improving": "Está mejorando",
    "Brief duration": "Duró poco",
    "No pain": "Sin dolor",
    "Ambiguous / uncertain phrasing": "Descripción incierta",
    "Infant / very young child": "Bebé o niño pequeño",
    "Elderly person": "Persona mayor",
    "Pregnancy context": "Embarazo",
};

const RULE_ES: Record<RuleId, string> = {
    R1: "La descripción es incierta y no hay nada tranquilizador, así que por seguridad la subimos a moderada.",
    R2: "No hay suficientes detalles para descartar nada, así que por seguridad la dejamos en moderada.",
    R3: "Hay un bebé, una persona mayor o un embarazo, así que el umbral para buscar atención es más bajo.",
    R4: "Síntomas fuertes que empiezan de repente nunca deben tratarse como baja urgencia.",
};

const TIER_ES: Record<Tier, TierCopy> = {
    low: {
        headline: "BAJA URGENCIA",
        action: "No se necesita acción inmediata.",
        whatToDo: ["Descanse y observe cómo se siente", "Revise de nuevo en 1–2 horas o si algo cambia", "Llame a una línea de enfermería si quiere tranquilidad"],
        watchFor: ["El dolor aumenta o cambia", "Los síntomas duran más de 24 horas", "Aparecen síntomas nuevos (fiebre, hinchazón, confusión)"],
    },
    moderate: {
        headline: "URGENCIA MODERADA",
        action: "Observe de cerca y busque atención si los síntomas continúan.",
        whatToDo: ["Comuníquese con un profesional de salud en las próximas horas", "Considere ir a urgent care", "No maneje si se siente afectado"],
        watchFor: ["Los síntomas empeoran o se extienden", "Respirar se vuelve más difícil", "Se siente a punto de desmayarse, muy débil o confundido"],
    },
    high: {
        headline: "ALTA URGENCIA",
        action: "Busque atención de emergencia de inmediato.",
        whatToDo: ["Llame al 911 o vaya a la sala de emergencias ahora", "No maneje usted; que alguien lo lleve", "Anote la hora en que empezaron los síntomas"],
        watchFor: ["Si la persona pierde el conocimiento, inicie RCP si sabe hacerlo", "Quédese con la persona hasta que llegue ayuda", "Abra la puerta para que entren los paramédicos"],
    },
};

export function scenarioText(lang: Lang, id: string, en: { category: string; label: string }) {
    return lang === "es" ? (SCENARIO_ES[id] ?? en) : en;
}
export const chipText = (lang: Lang, chip: string): string => (lang === "es" ? CHIP_ES[chip] ?? chip : chip);
export const signalText = (lang: Lang, label: string): string => (lang === "es" ? SIGNAL_ES[label] ?? label : label);

/** Headline, action and bullets for a result, in the chosen language. */
export function tierCopy(lang: Lang, r: EvaluationResult): TierCopy {
    return lang === "es" ? TIER_ES[r.tier] : { headline: r.headline, action: r.action, whatToDo: r.whatToDo, watchFor: r.watchFor };
}

const PHRASE_ES: Record<string, string> = {
    "Chest pain / pressure": "dolor o presión en el pecho",
    "Severe breathing difficulty": "mucha dificultad para respirar",
    "Loss of consciousness": "desmayo o que la persona no responde",
    "Stroke indicators (FAST)": "señales de un derrame cerebral",
    "Uncontrolled bleeding": "sangrado que no para",
    "Safety crisis": "pensamientos de quitarse la vida",
    "Possible overdose / poisoning": "una posible sobredosis o envenenamiento",
    "Seizure activity": "una convulsión",
    "Airway / anaphylaxis": "hinchazón de garganta, lengua o cara",
    "Significant head injury": "un golpe fuerte en la cabeza",
    "High severity language": "síntomas graves",
    "Sudden onset": "síntomas que empezaron de repente",
    "Intense pain quality": "dolor intenso",
    "Escalating over time": "síntomas que empeoran",
    "Very high fever": "fiebre muy alta",
    "Shortness of breath": "falta de aire",
    "Dizziness / vision change": "mareo o cambios en la vista",
    "Nausea / vomiting": "náuseas o vómito",
    "Confusion": "confusión",
    "Fever present": "fiebre",
    "Headache": "dolor de cabeza",
    "Pain reported": "dolor",
    "Injury": "una lesión",
    "Skin / swelling reaction": "sarpullido o hinchazón",
    "Dehydration signs": "señales de deshidratación",
};

const ENDINGS_ES: Record<Tier, string> = {
    high: ". En conjunto, es lo bastante serio como para atención de emergencia.",
    moderate: ", y conviene que lo revisen en las próximas horas.",
    low: ", y vale la pena estar atento.",
};

/** The "why" sentence. English comes straight from the engine; Spanish is rebuilt from the same data. */
export function explanation(lang: Lang, r: EvaluationResult): string {
    if (lang === "en") return r.explanation;
    const labels = new Set(r.detected.map(d => d.label));
    const said = (c: DetectedSignal["category"]) => r.detected
        .filter(d => d.category === c && !labels.has(IMPLIED_BY[d.label] ?? "") && d.label !== SUDDEN_ONSET)
        .map(d => PHRASE_ES[d.label] ?? signalText("es", d.label).toLowerCase());
    const red = said("red_flag");
    const concerns = [...said("severity"), ...said("moderate")];
    const sudden = labels.has(SUDDEN_ONSET);

    let core: string;
    if (red.length) {
        core = `Usted indicó ${red[0]}. Es una señal de alarma, y las señales de alarma siempre significan atención de emergencia.`;
    } else if (concerns.length || sudden) {
        let what = concerns.length ? concerns.slice(0, 2).join(" y ") : "síntomas";
        if (sudden) what += " (empezó de repente)";
        core = `Usted indicó ${what}${ENDINGS_ES[r.tier]}`;
    } else if (r.tier !== "low") {
        core = `Usted calificó cómo se siente como ${t("es", `sev${r.severity}`).toLowerCase()}, ${r.severity} de 5${ENDINGS_ES[r.tier]}`;
    } else {
        core = "No se encontró nada específico.";
    }
    return r.escalationRule ? `${core} ${RULE_ES[r.escalationRule]}` : core;
}

/** Extra first step when someone describes thoughts of ending their life. */
export function crisisLine(lang: Lang): string {
    return lang === "es"
        ? "Llame o envíe un mensaje de texto al 988 (Línea 988 de Prevención del Suicidio y Crisis, hay ayuda en español)"
        : "Call or text 988 (Suicide & Crisis Lifeline), any time, free";
}

// ─── Spanish free text → engine keywords ────────────────────────────────────

/** Common Spanish phrases and the English keyword the engine already knows. Red flags first. */
const ES_PHRASES: ReadonlyArray<readonly [string, string]> = [
    ["dolor de pecho", "chest pain"], ["dolor en el pecho", "chest pain"], ["presion en el pecho", "chest pressure"],
    ["pecho apretado", "chest tight"], ["no puedo respirar", "can't breathe"], ["no puede respirar", "can't breathe"],
    ["no respira", "not breathing"], ["ahog", "choking"], ["desmay", "fainted"], ["inconsciente", "unconscious"],
    ["no responde", "unresponsive"], ["convuls", "seizure"], ["cara caida", "face drooping"],
    ["no puede hablar", "can't speak"], ["habla arrastrada", "slurred speech"], ["sangra mucho", "heavy bleeding"],
    ["sangrado fuerte", "heavy bleeding"], ["sobredosis", "overdose"], ["envenen", "poisoning"],
    ["quiero morir", "want to die"], ["suicid", "suicidal"], ["se cierra la garganta", "throat closing"],
    ["garganta cerrada", "throat closing"], ["lengua hinchada", "tongue swelling"],
    ["falta de aire", "short of breath"], ["mare", "dizzy"], ["vomit", "vomiting"], ["nausea", "nausea"],
    ["fiebre", "fever"], ["dolor de cabeza", "headache"], ["peor dolor", "worst pain"], ["confundid", "confused"],
    ["embarazada", "pregnant"], ["bebe", "baby"], ["abuel", "grandmother"], ["de repente", "suddenly"],
    ["me cai", "fell"], ["se cayo", "fell"], ["cortad", "cut"], ["hinchaz", "swelling"], ["sarpullido", "rash"],
    ["leve", "mild"], ["mejorando", "improving"], ["no estoy segur", "not sure"], ["raro", "weird"], ["rara", "weird"],
];

const stripAccents = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Add the English keywords for any Spanish phrases found. The original text is
 * kept, so English input is untouched. Example: "no puedo respirar" also gets
 * "can't breathe", which is a red flag.
 */
export function withSpanishKeywords(text: string): string {
    const plain = stripAccents(text);
    const extra = ES_PHRASES.filter(([es]) => plain.includes(es)).map(([, en]) => en);
    return extra.length ? `${text} ${extra.join(" ")}` : text;
}
