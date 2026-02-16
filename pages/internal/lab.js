// pages/internal/lab.js
import { useEffect, useMemo, useState } from "react";
import { PRESETS } from "../../lib/lab/presets";

function pretty(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function safeParseJSON(txt) {
  try {
    const v = JSON.parse(txt);
    return { ok: true, value: v, error: null };
  } catch (e) {
    return { ok: false, value: null, error: e?.message || "JSON inválido" };
  }
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
    ok(Array.isArray(sections) && sections.length >= 3, "home.sections existe y tiene >=3"),
    ok(!!mods?.hero_auto?.headline, "modules.hero_auto.headline existe"),
    ok(!!mods?.contact_auto?.note, "modules.contact_auto.note existe"),
    ok(
      goal !== "single_action" || sections.some((x) => x.module === "steps"),
      "single_action incluye steps"
    ),
    ok(
      goal !== "book_appointments" || sections.some((x) => x.module === "steps"),
      "book_appointments incluye steps"
    ),
    ok(!note.toLowerCase().includes("solicita solicitar"), "No hay duplicado 'Solicita Solicitar...'"),
  ];
}

function buildValidationBundle(spec) {
  const sections = spec?.layout?.pages?.home?.sections || [];
  const modules = spec?.modules || {};

  const pick = (k) => (modules?.[k] ? modules[k] : undefined);
  const pickedModules = {
    hero_auto: pick("hero_auto"),
    services_auto: pick("services_auto"),
    cards_auto: pick("cards_auto"),
    bullets_auto: pick("bullets_auto"),
    steps_auto: pick("steps_auto"),
    text_auto: pick("text_auto"),
    contact_auto: pick("contact_auto"),
  };

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
      header_variant: spec?.layout?.header_variant,
      footer_variant: spec?.layout?.footer_variant,
      sections: sections.map((s) => ({
        module: s.module,
        variant: s.variant,
        props_ref: s.props_ref,
      })),
    },
    modules: pickedModules,
    validations: runValidations(spec),
  };
}

export default function InternalLab() {
  const [presetId, setPresetId] = useState(PRESETS[0]?.id || "");
  const activePreset = useMemo(() => PRESETS.find((p) => p.id === presetId) || PRESETS[0], [presetId]);

  const [briefText, setBriefText] = useState(pretty(activePreset?.brief || {}));
  const [lastSpec, setLastSpec] = useState(null);
  const [lastError, setLastError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Carga preset en editor
  useEffect(() => {
    setBriefText(pretty(activePreset?.brief || {}));
    // no borramos resultados automáticamente para que puedas comparar
  }, [activePreset?.id]);

  const parsed = useMemo(() => safeParseJSON(briefText), [briefText]);
  const validations = useMemo(() => (lastSpec ? runValidations(lastSpec) : []), [lastSpec]);

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

      // guarda para preview (como client/new)
      try {
        localStorage.setItem("nb_last_site_spec", JSON.stringify(spec));
      } catch {}

    } catch (e) {
      setLastError(e?.message || "Error generando spec");
      setLastSpec(null);
    } finally {
      setIsLoading(false);
    }
  }

  function openPreview() {
    // tu ruta actual de preview
    window.open("/internal/preview", "_blank", "noopener,noreferrer");
  }

  function copySpec() {
    if (!lastSpec) return;
    navigator.clipboard?.writeText(pretty(lastSpec));
  }

  function copyValidationBundle() {
    if (!lastSpec) return;
    const bundle = buildValidationBundle(lastSpec);
    navigator.clipboard?.writeText(JSON.stringify(bundle, null, 2));
  }


  function downloadSpec() {
    if (!lastSpec) return;
    const blob = new Blob([pretty(lastSpec)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lastSpec?.meta?.site_id || "nb_last_site_spec"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function clearLocalSpec() {
    try {
      localStorage.removeItem("nb_last_site_spec");
    } catch {}
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
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Internal Lab — Next Business</h1>
          <p className="text-sm text-gray-600">
            Presets + generación + validación rápida. Guarda en localStorage: <code>nb_last_site_spec</code>.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Left: Presets + Editor */}
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Brief editor</div>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={presetId}
                onChange={(e) => setPresetId(e.target.value)}
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <textarea
                className="w-full h-[420px] border border-gray-200 rounded-2xl p-4 font-mono text-xs"
                value={briefText}
                onChange={(e) => setBriefText(e.target.value)}
                spellCheck={false}
              />
              <div className="mt-2 text-xs">
                {parsed.ok ? (
                  <span className="text-green-700">JSON OK</span>
                ) : (
                  <span className="text-red-600">JSON inválido: {parsed.error}</span>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={generateFromBrief}
                disabled={isLoading || !parsed.ok}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-50"
              >
                {isLoading ? "Generando..." : "Generate spec"}
              </button>

              <button
                onClick={openPreview}
                disabled={!lastSpec}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-50"
              >
                Open /internal/preview
              </button>

              <button
                onClick={copySpec}
                disabled={!lastSpec}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-50"
              >
                Copy spec
              </button>

              <button
                onClick={downloadSpec}
                disabled={!lastSpec}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-50"
              >
                Download JSON
              </button>

              <button
                onClick={clearLocalSpec}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold"
              >
                Clear local spec
              </button>
            </div>
                  
            <button
              onClick={copyValidationBundle}
              disabled={!lastSpec}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-50"
            >
              Copy validation bundle
            </button>

            {lastError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {lastError}
              </div>
            ) : null}
          </div>

          {/* Right: Results */}
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="text-sm font-semibold">Result</div>

            {!lastSpec ? (
              <div className="mt-4 text-sm text-gray-600">
                Genera un spec para ver validaciones, secciones y módulos.
              </div>
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
                    {lastSpec?.strategy?.goal_detail ? (
                      <div className="mt-1 text-xs text-gray-600">detail: {lastSpec.strategy.goal_detail}</div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs text-gray-500">pack</div>
                    <div className="mt-1 text-sm font-semibold">{lastSpec?.layout?.pack}</div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="text-xs text-gray-500">personality</div>
                    <div className="mt-1 text-sm font-semibold">{lastSpec?.brand?.brand_personality}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500">contact_auto.note</div>
                  <div className="mt-1 text-sm font-semibold">
                    {lastSpec?.modules?.contact_auto?.note || "—"}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500">home.sections</div>
                  <ul className="mt-2 text-xs font-mono space-y-1">
                    {sectionsView.map((x, i) => (
                      <li key={i} className="text-gray-800">{x}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                  <div className="text-xs text-gray-500">Validations</div>
                  <div className="mt-2 space-y-2">
                    {validations.map((v, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm ${
                          v.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        <span>{v.msg}</span>
                        <span className="font-semibold">{v.ok ? "OK" : "FAIL"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <details className="rounded-2xl border border-gray-200 p-4">
                    <summary className="text-sm font-semibold cursor-pointer">View full spec (JSON)</summary>
                    <pre className="mt-3 text-xs bg-gray-50 border rounded-xl p-4 overflow-auto">
                      {pretty(lastSpec)}
                    </pre>
                  </details>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-10 text-xs text-gray-500">
          Tip: esto no sustituye a /client/new. Es tu “QA interno” para iterar rápido sin rellenar formularios.
        </div>
      </div>
    </div>
  );
}
