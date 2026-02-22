// pages/internal/lab.js
import { useEffect, useMemo, useState } from "react";
import { PRESETS } from "../../lib/lab/presets";

function pretty(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}
function safeParseJSON(txt) {
  try { return { ok: true, value: JSON.parse(txt), error: null }; }
  catch (e) { return { ok: false, value: null, error: e?.message || "JSON inválido" }; }
}

function runValidations(spec) {
  const sections = spec?.layout?.pages?.home?.sections || [];
  const mods = spec?.modules || {};
  const goal = spec?.strategy?.primary_goal;
  const note = String(mods?.contact_auto?.note || "");
  const ok = (cond, msg) => ({ ok: !!cond, msg });

  return [
    ok(spec?.version === "2.0", "spec.version == 2.0"),
    ok(!!spec?.meta?.site_id, "meta.site_id existe"),
    ok(!!spec?.layout?.archetype, "layout.archetype existe"),
    ok(!!spec?.layout?.header_variant, "layout.header_variant existe"),
    ok(Array.isArray(sections) && sections.length >= 3, "home.sections existe y tiene >=3"),
    ok(!!mods?.hero_auto?.headline, "modules.hero_auto.headline existe"),
    ok(!!mods?.contact_auto?.note, "modules.contact_auto.note existe"),
    ok(goal !== "single_action" || sections.some((x) => x.module === "steps"), "single_action incluye steps"),
    ok(goal !== "book_appointments" || sections.some((x) => x.module === "steps"), "book_appointments incluye steps"),
    ok(!note.toLowerCase().includes("solicita solicitar"), "No hay duplicado 'Solicita Solicitar...'"),
  ];
}

function pickQA(spec) {
  const goal = spec?.strategy?.primary_goal || "";
  const goalDetail = spec?.strategy?.goal_detail || "";
  const pack = spec?.layout?.pack || "";
  const archetype = spec?.layout?.archetype || "";
  const header = spec?.layout?.header_variant || "";
  const personality = spec?.brand?.brand_personality || "";

  const bullets = (spec?.modules?.bullets_auto?.items || []).map((x) => (typeof x === "string" ? x : x?.title)).filter(Boolean);
  const steps = (spec?.modules?.steps_auto?.items || []).map((x) => ({ title: x?.title || "", description: x?.description || "" })).filter((x) => x.title);
  const faqQs = (spec?.modules?.faq_auto?.items || []).map((x) => x?.q || x?.question || x?.title || "").filter(Boolean);
  const cards = (spec?.modules?.cards_auto?.items || []).map((x) => ({ title: x?.title || "", description: x?.description || "" })).filter((x) => x.title);

  const hasFastShip = bullets.some((b) => /24\/48|24-48|24h|48h/i.test(String(b)));

  const d = String(goalDetail || "").toLowerCase();
  let intent = "";
  if (goal === "single_action") {
    if (d.includes("audit") || d.includes("auditor") || d.includes("diagnos")) intent = "audit";
    else if (d.includes("trial") || d.includes("prueba") || d.includes("piloto")) intent = "trial";
    else if (d.includes("presupuesto") || d.includes("precio") || d.includes("cotiz")) intent = "quote";
    else if (d.includes("llamada") || d.includes("call") || d.includes("reunión") || d.includes("reunion")) intent = "call";
    else if (d.includes("descarga") || d.includes("download") || d.includes("pdf")) intent = "download";
    else intent = "demo";
  }

  return {
    goal,
    goal_detail: goalDetail,
    archetype,
    pack,
    header_variant: header,
    personality,
    intent,
    bullets,
    steps,
    faq_questions: faqQs,
    cards,
    ecommerce_has_fast_ship_bullet: pack === "ecommerce_conversion" ? hasFastShip : undefined,
  };
}

function buildValidationBundle(spec) {
  const sections = spec?.layout?.pages?.home?.sections || [];
  const modules = spec?.modules || {};
  const pick = (k) => (modules?.[k] ? modules[k] : undefined);

  return {
    meta: spec?.meta,
    business: spec?.business,
    strategy: spec?.strategy,
    brand: {
      brand_personality: spec?.brand?.brand_personality,
      brand_expression: spec?.brand?.brand_expression,
      design_tokens: spec?.brand?.design_tokens,
    },
    layout: {
      pack: spec?.layout?.pack,
      archetype: spec?.layout?.archetype,
      header_variant: spec?.layout?.header_variant,
      footer_variant: spec?.layout?.footer_variant,
      sections: sections.map((s) => ({ module: s.module, variant: s.variant, props_ref: s.props_ref })),
    },
    modules: {
      hero_auto: pick("hero_auto"),
      services_auto: pick("services_auto"),
      cards_auto: pick("cards_auto"),
      bullets_auto: pick("bullets_auto"),
      steps_auto: pick("steps_auto"),
      testimonials_auto: pick("testimonials_auto"),
      faq_auto: pick("faq_auto"),
      text_auto: pick("text_auto"),
      contact_auto: pick("contact_auto"),
    },
    qa: pickQA(spec),
    validations: runValidations(spec),
  };
}

async function copyTextRobust(text) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch { return false; }
}

const PERSONALITIES = [
  "trust_authority",
  "clinical_calm",
  "tech_clean",
  "bold_street",
  "artisan_warm",
  "industrial_solid",
  "service_local_friendly",
  "premium_elegant",
  "modern_minimal",
  "dark_luxury",
];

export default function InternalLab() {
  const [presetId, setPresetId] = useState(PRESETS[0]?.id || "");
  const activePreset = useMemo(() => PRESETS.find((p) => p.id === presetId) || PRESETS[0], [presetId]);

  const [briefText, setBriefText] = useState(pretty(activePreset?.brief || {}));
  const [lastSpec, setLastSpec] = useState(null);
  const [lastError, setLastError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");

  useEffect(() => { setBriefText(pretty(activePreset?.brief || {})); }, [activePreset?.id]);

  const parsed = useMemo(() => safeParseJSON(briefText), [briefText]);
  const validations = useMemo(() => (lastSpec ? runValidations(lastSpec) : []), [lastSpec]);
  const qa = useMemo(() => (lastSpec ? pickQA(lastSpec) : null), [lastSpec]);

  function patchGoalDetail(nextDetail) {
    const p = safeParseJSON(briefText);
    if (!p.ok) return;
    const obj = { ...p.value };
    obj.goal = { ...(obj.goal || {}) };
    obj.goal.goal_detail = nextDetail;
    setBriefText(pretty(obj));
  }

  // ✅ NUEVO: forzar brand_personality (para validar Bloque 6)
  function patchPersonality(nextPersonality) {
    const p = safeParseJSON(briefText);
    if (!p.ok) return;
    const obj = { ...p.value };
    obj.brand_personality = nextPersonality; // <-- viaja a generate-site y hace override
    setBriefText(pretty(obj));
  }

  async function generateFromBrief() {
    setLastError("");
    setIsLoading(true);
    try {
      if (!parsed.ok) {
        setLastError(`JSON inválido: ${parsed.error}`);
        setIsLoading(false);
        return;
      }
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.value),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`API error ${res.status}: ${t}`);
      }
      const spec = await res.json();
      setLastSpec(spec);
      try { localStorage.setItem("nb_last_site_spec", JSON.stringify(spec)); } catch {}
    } catch (e) {
      setLastError(e?.message || "Error generando spec");
      setLastSpec(null);
    } finally {
      setIsLoading(false);
    }
  }

  function openPreview() { window.open("/internal/preview", "_blank", "noopener,noreferrer"); }

  async function copySpec() {
    if (!lastSpec) return;
    const ok = await copyTextRobust(pretty(lastSpec));
    setCopyMsg(ok ? "Copiado ✅" : "No se pudo copiar ❌");
    setTimeout(() => setCopyMsg(""), 1500);
  }

  async function copyValidationBundle() {
    if (!lastSpec) return;
    const bundle = buildValidationBundle(lastSpec);
    const ok = await copyTextRobust(JSON.stringify(bundle, null, 2));
    setCopyMsg(ok ? "Copiado ✅" : "No se pudo copiar ❌");
    setTimeout(() => setCopyMsg(""), 1500);
  }

  function clearLocalSpec() {
    try { localStorage.removeItem("nb_last_site_spec"); } catch {}
    setLastSpec(null);
    setLastError("");
  }

  const sectionsView = useMemo(() => {
    const sections = lastSpec?.layout?.pages?.home?.sections || [];
    return sections.map((s) => `${s.module}:${s.variant} (${s.props_ref})`);
  }, [lastSpec]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold">Internal Lab — Next Business</h1>
        <p className="text-sm text-gray-600 mt-1">
          QA cockpit. Guarda en localStorage: <code>nb_last_site_spec</code>.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Brief editor</div>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={presetId}
                onChange={(e) => setPresetId(e.target.value)}
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* ✅ NUEVO: selector personalidad (Bloque 6) */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="text-xs text-gray-500">Personality:</div>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold"
                onChange={(e) => patchPersonality(e.target.value)}
                value={(safeParseJSON(briefText).ok && safeParseJSON(briefText).value?.brand_personality) || ""}
              >
                <option value="">(auto)</option>
                {PERSONALITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  const p = safeParseJSON(briefText);
                  if (!p.ok) return;
                  const cur = p.value?.brand_personality || "";
                  const idx = Math.max(0, PERSONALITIES.indexOf(cur));
                  const next = PERSONALITIES[(idx + 1) % PERSONALITIES.length];
                  patchPersonality(next);
                }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold"
              >
                Cycle →
              </button>
            </div>

            {/* goal_detail quick */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => patchGoalDetail("Solicitar demo")} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold">goal_detail: Demo</button>
              <button onClick={() => patchGoalDetail("Auditoría")} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold">goal_detail: Auditoría</button>
              <button onClick={() => patchGoalDetail("Prueba")} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold">goal_detail: Prueba</button>
              <button onClick={() => patchGoalDetail("Presupuesto")} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold">goal_detail: Presupuesto</button>
              <button onClick={() => patchGoalDetail("Llamada")} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold">goal_detail: Llamada</button>
            </div>

            <div className="mt-4">
              <textarea
                className="w-full h-[420px] border border-gray-200 rounded-2xl p-4 font-mono text-xs"
                value={briefText}
                onChange={(e) => setBriefText(e.target.value)}
                spellCheck={false}
              />
              <div className="mt-2 text-xs">
                {parsed.ok ? <span className="text-green-700">JSON OK</span> : <span className="text-red-600">JSON inválido: {parsed.error}</span>}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={generateFromBrief} disabled={isLoading || !parsed.ok} className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-50">
                {isLoading ? "Generando..." : "Generate spec"}
              </button>
              <button onClick={openPreview} disabled={!lastSpec} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-50">
                Open /internal/preview
              </button>
              <button onClick={copySpec} disabled={!lastSpec} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-50">
                Copy spec
              </button>
              <button onClick={copyValidationBundle} disabled={!lastSpec} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-50">
                Copy validation bundle
              </button>
              <button onClick={clearLocalSpec} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold">
                Clear local spec
              </button>
            </div>

            {copyMsg ? <div className="mt-3 text-sm font-semibold text-gray-700">{copyMsg}</div> : null}
            {lastError ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{lastError}</div> : null}
          </div>

          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="text-sm font-semibold">Result</div>
            {!lastSpec ? (
              <div className="mt-4 text-sm text-gray-600">Genera un spec para ver validaciones y QA.</div>
            ) : (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs text-gray-500">site_id</div>
                    <div className="mt-1 text-sm font-semibold">{lastSpec?.meta?.site_id}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs text-gray-500">goal</div>
                    <div className="mt-1 text-sm font-semibold">{lastSpec?.strategy?.primary_goal}</div>
                    {lastSpec?.strategy?.goal_detail ? <div className="mt-1 text-xs text-gray-600">detail: {lastSpec.strategy.goal_detail}</div> : null}
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs text-gray-500">pack</div>
                    <div className="mt-1 text-sm font-semibold">{lastSpec?.layout?.pack}</div>
                    <div className="mt-1 text-xs text-gray-600">archetype: {lastSpec?.layout?.archetype || "—"}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs text-gray-500">personality</div>
                    <div className="mt-1 text-sm font-semibold">{lastSpec?.brand?.brand_personality}</div>
                    <div className="mt-1 text-xs text-gray-600">header: {lastSpec?.layout?.header_variant}</div>
                  </div>
                </div>

                {qa ? (
                  <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs text-gray-500">Rules QA</div>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">intent</div>
                        <div className="font-semibold">{qa.intent || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">header_variant</div>
                        <div className="font-semibold">{qa.header_variant || "—"}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500">home.sections</div>
                  <ul className="mt-2 text-xs font-mono space-y-1">
                    {sectionsView.map((x, i) => <li key={i} className="text-gray-800">{x}</li>)}
                  </ul>
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500">Validations</div>
                  <div className="mt-2 space-y-2">
                    {validations.map((v, i) => (
                      <div key={i} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm ${
                        v.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        <span>{v.msg}</span>
                        <span className="font-semibold">{v.ok ? "OK" : "FAIL"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <details className="mt-4 rounded-2xl border border-gray-200 p-4">
                  <summary className="text-sm font-semibold cursor-pointer">View full spec (JSON)</summary>
                  <pre className="mt-3 text-xs bg-gray-50 border rounded-xl p-4 overflow-auto">{pretty(lastSpec)}</pre>
                </details>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
