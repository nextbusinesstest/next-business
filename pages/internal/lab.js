// pages/internal/lab.js
import { useEffect, useMemo, useState } from "react";
import { PRESETS } from "../../lib/lab/presets";
import { resolveTheme, themeKeyFromPersonality } from "../../lib/themes";

function pretty(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function safeParseJSON(txt) {
  try {
    return { ok: true, value: JSON.parse(txt), error: null };
  } catch (e) {
    return { ok: false, value: null, error: e?.message || "JSON inválido" };
  }
}

// ---------- Renderer coverage allowlist (debe reflejar PacksRouter actual) ----------
const SUPPORTED_HERO = new Set([
  "hero_product_minimal_v1",
  "hero_product_split_v1",
  "hero_product_bold_v1",
  "hero_brand_story_v1",
  "hero_saas_split_v1",
]);

const SUPPORTED_SECTIONS = new Set([
  "steps_auto_v1",
  "testimonials_auto_v1",
  "faq_auto_v1",
  "services_grid_auto_v1",
  "text_auto_v1",

  // ecommerce premium
  "categories_scroller_min_v1",
  "benefits_cards_min_v1",
  "contact_center_min_v1",

  // compat / bridge
  "cards_auto_v1",
  "bullets_auto_v1",
  "contact_auto_v1",
  "categories_grid_min_v1",
  "benefits_inline_min_v1",
  "contact_split_min_v1",
]);

function validateRenderCoverage(spec) {
  const sections = spec?.layout?.pages?.home?.sections || [];
  const missing = [];

  for (const s of sections) {
    if (!s?.variant) continue;
    if (s.module === "hero") {
      if (!SUPPORTED_HERO.has(s.variant)) missing.push({ module: "hero", variant: s.variant });
    } else {
      if (!SUPPORTED_SECTIONS.has(s.variant)) missing.push({ module: s.module, variant: s.variant });
    }
  }
  return missing;
}

// ---------- Dark contrast heuristic ----------
function clampHex(x) {
  const s = String(x || "").trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s) ? s : "";
}

function approxLuma(hex) {
  const h = clampHex(hex);
  if (!h) return null;
  const v =
    h.length === 4
      ? [h[1] + h[1], h[2] + h[2], h[3] + h[3]]
      : [h.slice(1, 3), h.slice(3, 5), h.slice(5, 7)];
  const [r, g, b] = v.map((x) => parseInt(x, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function validateDarkContrast(spec) {
  // Nota: esto valida colors del spec. La legibilidad real depende de hardcodes,
  // pero sirve como detector rápido de "bg oscuro + texto oscuro" (fatal).
  const c = spec?.brand?.design_tokens?.colors || {};
  const bg = c.bg || c.background || c.backgroundColor;
  const text = c.text || c.textColor;

  const Lbg = approxLuma(bg);
  const Lt = approxLuma(text);
  if (Lbg == null || Lt == null) return { ok: true, note: "no-check" };

  if (Lbg < 0.25) {
    const ok = Lt > 0.65;
    return { ok, note: ok ? "dark-ok" : "dark-bad-text" };
  }
  return { ok: true, note: "light-ok" };
}

// ---------- Theme validation (importante para Bloque 6) ----------
const REQUIRED_THEME_VARS = ["--surface", "--border", "--shadow", "--r-md", "--section-py"];

function validateTheme(spec) {
  const personality = spec?.brand?.brand_personality || "";
  const expectedKey = themeKeyFromPersonality(personality);

  let theme;
  try {
    theme = resolveTheme(spec);
  } catch {
    theme = null;
  }

  const actualKey = theme?.name || "";
  const vars = theme?.vars || {};

  const missingVars = REQUIRED_THEME_VARS.filter((k) => !(k in vars));
  const keyOk = !expectedKey || !actualKey ? true : expectedKey === actualKey;

  // También validamos que no sea “todo igual” a nivel de feel:
  // si el theme devuelve siempre los mismos r/shadow/surface, no diferencia.
  const signature = [
    vars["--surface"],
    vars["--border"],
    vars["--shadow"],
    vars["--r-md"],
    vars["--section-py"],
    vars["--c-bg"],
    vars["--c-text"],
    vars["--c-accent"],
  ]
    .map((x) => String(x || ""))
    .join("|");

  return {
    expectedKey,
    actualKey,
    keyOk,
    missingVars,
    signature,
  };
}

function pickQA(spec) {
  const goal = spec?.strategy?.primary_goal || "";
  const goalDetail = spec?.strategy?.goal_detail || "";
  const pack = spec?.layout?.pack || "";
  const archetype = spec?.layout?.archetype || "";
  const header = spec?.layout?.header_variant || "";
  const personality = spec?.brand?.brand_personality || "";
  return { goal, goalDetail, pack, archetype, header, personality };
}

async function postGenerate(payload) {
  const r = await fetch("/api/generate-site", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-nb-internal": "1",
    },
    body: JSON.stringify(payload),
  });
  const txt = await r.text();
  let json = null;
  try {
    json = JSON.parse(txt);
  } catch {}
  return { ok: r.ok, status: r.status, json, text: txt };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getPresetById(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0] || null;
}

export default function LabPage() {
  const presetIds = useMemo(() => PRESETS.map((p) => p.id), []);
  const [presetId, setPresetId] = useState(presetIds[0] || "");
  const [personality, setPersonality] = useState("modern_minimal");

  const [payloadText, setPayloadText] = useState("");
  const [resultSpec, setResultSpec] = useState(null);
  const [resultRaw, setResultRaw] = useState("");
  const [busy, setBusy] = useState(false);

  const [sweepBusy, setSweepBusy] = useState(false);
  const [sweepRows, setSweepRows] = useState([]);

  const preset = useMemo(() => getPresetById(presetId), [presetId]);

  useEffect(() => {
    if (!preset) return;
    const base = preset.brief || preset;
    const withP = { ...base, brand_personality: personality };
    setPayloadText(pretty(withP));
  }, [presetId, personality]);

  const qa = useMemo(() => (resultSpec ? pickQA(resultSpec) : null), [resultSpec]);
  const coverage = useMemo(() => (resultSpec ? validateRenderCoverage(resultSpec) : []), [resultSpec]);
  const darkCheck = useMemo(
    () => (resultSpec ? validateDarkContrast(resultSpec) : { ok: true, note: "no" }),
    [resultSpec]
  );
  const themeCheck = useMemo(() => (resultSpec ? validateTheme(resultSpec) : null), [resultSpec]);

  async function onGenerate() {
    const parsed = safeParseJSON(payloadText);
    if (!parsed.ok) {
      setResultRaw(`JSON inválido: ${parsed.error}`);
      setResultSpec(null);
      return;
    }

    setBusy(true);
    setResultRaw("");
    setResultSpec(null);

    try {
      const resp = await postGenerate(parsed.value);
      setResultRaw(resp.ok ? pretty(resp.json) : resp.text || `HTTP ${resp.status}`);
      if (resp.ok) {
        setResultSpec(resp.json);
        try {
          localStorage.setItem("nb_last_site_spec", JSON.stringify(resp.json));
        } catch {}
      }
    } finally {
      setBusy(false);
    }
  }

  function loadToPreview(spec) {
    try {
      localStorage.setItem("nb_last_site_spec", JSON.stringify(spec));
      window.open("/internal/preview", "_blank");
    } catch {
      alert("No se pudo guardar en localStorage.");
    }
  }

  async function onSweepAll() {
    const personalities = [
      "modern_minimal",
      "premium_elegant",
      "trust_authority",
      "clinical_calm",
      "service_local_friendly",
      "tech_clean",
      "bold_street",
      "artisan_warm",
      "industrial_solid",
      "dark_luxury",
    ];

    setSweepBusy(true);
    setSweepRows([]);

    const rows = [];
    const sigByPreset = new Map(); // presetId -> set(signature) para ver si hay diferenciación real

    try {
      for (const p of PRESETS) {
        const base = p?.brief || p;
        if (!base) continue;

        for (const per of personalities) {
          const payload = { ...base, brand_personality: per };
          const resp = await postGenerate(payload);
          await sleep(80);
          
          if (!resp.ok) {
            rows.push({
              preset: p.id,
              label: p.label || p.id,
              personality: per,
              ok: false,
              status: resp.status,
              pack: "",
              archetype: "",
              dark: "n/a",
              missing: ["HTTP_ERROR"],
              themeKeyOk: false,
              themeMissingVars: ["THEME_ERROR"],
              signature: "",
              spec: null,
            });
            setSweepRows([...rows]);
            continue;
          }

          const spec = resp.json;
          const miss = validateRenderCoverage(spec);
          const dark = validateDarkContrast(spec);
          const qa = pickQA(spec);
          const t = validateTheme(spec);

          const isOk =
            miss.length === 0 &&
            dark.ok &&
            t.keyOk &&
            (t.missingVars?.length || 0) === 0;

          const signature = t.signature || "";
          const set = sigByPreset.get(p.id) || new Set();
          set.add(signature);
          sigByPreset.set(p.id, set);

          rows.push({
            preset: p.id,
            label: p.label || p.id,
            personality: per,
            ok: isOk,
            status: 200,
            pack: qa.pack,
            archetype: qa.archetype,
            dark: dark.note,
            missing: miss.map((x) => `${x.module}:${x.variant}`),
            themeKeyOk: t.keyOk,
            themeMissingVars: t.missingVars || [],
            signature,
            spec, // guardamos el spec para “Load to preview”
          });

          // actualiza incremental (feedback rápido)
          setSweepRows([...rows]);
        }
      }

      // Post-check: diferenciación real por preset (si todos los signatures son iguales, “solo cambia color” o nada)
      const annotated = rows.map((r) => {
        const uniq = sigByPreset.get(r.preset)?.size || 0;
        return { ...r, styleVarianceCount: uniq };
      });

      setSweepRows(annotated);
    } finally {
      setSweepBusy(false);
    }
  }

  const sweepSummary = useMemo(() => {
    if (!sweepRows.length) return null;
    const total = sweepRows.length;
    const ok = sweepRows.filter((r) => r.ok).length;
    const bad = total - ok;
    const varianceBad = sweepRows.filter((r) => (r.styleVarianceCount || 0) <= 1).length;
    return { total, ok, bad, varianceBad };
  }, [sweepRows]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-semibold">Internal Lab</h1>
        <p className="text-sm text-gray-600 mt-1">
          Genera site_spec V2, valida renderers + dark, y ejecuta Sweep completo: todos los presets × personalidades.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-2xl p-4">
            <div className="text-sm font-semibold mb-2">Preset</div>
            <select
              className="w-full border rounded-xl px-3 py-2 text-sm"
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label || p.id}
                </option>
              ))}
            </select>

            <div className="text-sm font-semibold mt-4 mb-2">Personality override</div>
            <select
              className="w-full border rounded-xl px-3 py-2 text-sm"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
            >
              {[
                "modern_minimal",
                "premium_elegant",
                "trust_authority",
                "clinical_calm",
                "service_local_friendly",
                "tech_clean",
                "bold_street",
                "artisan_warm",
                "industrial_solid",
                "dark_luxury",
              ].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <button
              className="mt-4 w-full rounded-xl bg-black text-white py-2 text-sm font-semibold disabled:opacity-50"
              onClick={onGenerate}
              disabled={busy}
            >
              {busy ? "Generating..." : "Generate"}
            </button>

            <a
              href="/internal/preview"
              className="mt-3 block w-full text-center rounded-xl border py-2 text-sm font-semibold bg-white hover:bg-gray-50"
            >
              Open Preview
            </a>

            <button
              className="mt-3 w-full rounded-xl border py-2 text-sm font-semibold bg-white hover:bg-gray-50 disabled:opacity-50"
              onClick={onSweepAll}
              disabled={sweepBusy}
              title="Genera TODOS los presets para TODAS las personalidades y reporta fallos"
            >
              {sweepBusy ? "Running full sweep..." : "Run FULL Sweep (all presets × personalities)"}
            </button>

            {sweepSummary ? (
              <div className="mt-4 text-sm">
                <div>
                  <b>Total:</b> {sweepSummary.total} · <b>OK:</b> {sweepSummary.ok} ·{" "}
                  <b>Fail:</b> {sweepSummary.bad}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  “VarianceBad” = presets donde todas las personalities producen el mismo “signature” visual (posible
                  “solo cambia color”).
                </div>
                <div className="text-sm mt-1">
                  <b>VarianceBad:</b> {sweepSummary.varianceBad}
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-white border rounded-2xl p-4 md:col-span-2">
            <div className="text-sm font-semibold mb-2">Payload (request)</div>
            <textarea
              className="w-full h-[240px] border rounded-xl p-3 font-mono text-xs"
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-2">
              Esto se envía tal cual a <code>/api/generate-site</code>.
            </div>
          </div>
        </div>

        {resultSpec ? (
          <div className="mt-6 bg-white border rounded-2xl p-4">
            <div className="text-sm font-semibold">Checks (último generate)</div>

            <div className="mt-2 text-sm text-gray-700">
              <div><b>preset</b>: {preset?.id}</div>
              <div><b>pack</b>: {qa?.pack}</div>
              <div><b>archetype</b>: {qa?.archetype}</div>
              <div><b>header</b>: {qa?.header}</div>
              <div><b>personality</b>: {qa?.personality}</div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border p-3">
                <div className="font-semibold">Renderer coverage</div>
                {coverage.length === 0 ? (
                  <div className="mt-2 text-green-700">✓ Todo renderizable</div>
                ) : (
                  <div className="mt-2 text-red-700">
                    ✗ Missing:
                    <ul className="mt-1 list-disc pl-5">
                      {coverage.map((m, i) => (
                        <li key={i}>{m.module}: <b>{m.variant}</b></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="rounded-xl border p-3">
                <div className="font-semibold">Dark heuristic</div>
                <div className={darkCheck.ok ? "mt-2 text-green-700" : "mt-2 text-red-700"}>
                  {darkCheck.ok ? "✓" : "✗"} {darkCheck.note}
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <div className="font-semibold">Theme integrity</div>
                {themeCheck ? (
                  <div className="mt-2">
                    <div className={themeCheck.keyOk ? "text-green-700" : "text-red-700"}>
                      {themeCheck.keyOk ? "✓" : "✗"} themeKey: {themeCheck.actualKey} (esperado {themeCheck.expectedKey})
                    </div>
                    {themeCheck.missingVars?.length ? (
                      <div className="text-red-700 mt-1">
                        Missing vars: {themeCheck.missingVars.join(", ")}
                      </div>
                    ) : (
                      <div className="text-green-700 mt-1">✓ vars premium OK</div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 text-gray-600">n/a</div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">Result (response spec)</div>
              <pre className="w-full max-h-[420px] overflow-auto border rounded-xl p-3 text-xs bg-gray-50">
                {resultRaw}
              </pre>
            </div>
          </div>
        ) : (
          resultRaw ? (
            <div className="mt-6 bg-white border rounded-2xl p-4">
              <div className="text-sm font-semibold mb-2">Result</div>
              <pre className="w-full max-h-[420px] overflow-auto border rounded-xl p-3 text-xs bg-gray-50">
                {resultRaw}
              </pre>
            </div>
          ) : null
        )}

        {sweepRows.length ? (
          <div className="mt-8 bg-white border rounded-2xl p-4">
            <div className="text-sm font-semibold mb-3">FULL Sweep results</div>
            <div className="overflow-auto">
              <table className="min-w-[1200px] w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-4">preset</th>
                    <th className="py-2 pr-4">personality</th>
                    <th className="py-2 pr-4">pack</th>
                    <th className="py-2 pr-4">archetype</th>
                    <th className="py-2 pr-4">dark</th>
                    <th className="py-2 pr-4">missing</th>
                    <th className="py-2 pr-4">theme</th>
                    <th className="py-2 pr-4">variance</th>
                    <th className="py-2 pr-4">preview</th>
                    <th className="py-2 pr-4">status</th>
                  </tr>
                </thead>
                <tbody>
                  {sweepRows.map((r, i) => {
                    const missTxt = r.missing?.length ? r.missing.join(", ") : "✓";
                    const missBad = r.missing?.length;
                    const themeBad = !r.themeKeyOk || (r.themeMissingVars?.length || 0) > 0;
                    const varianceBad = (r.styleVarianceCount || 0) <= 1;

                    return (
                      <tr key={i} className="border-t">
                        <td className="py-2 pr-4">{r.preset}</td>
                        <td className="py-2 pr-4 font-mono">{r.personality}</td>
                        <td className="py-2 pr-4 font-mono">{r.pack}</td>
                        <td className="py-2 pr-4 font-mono">{r.archetype}</td>

                        <td className={`py-2 pr-4 ${r.dark === "dark-bad-text" ? "text-red-700" : "text-gray-700"}`}>
                          {r.dark}
                        </td>

                        <td className={`py-2 pr-4 ${missBad ? "text-red-700" : "text-green-700"}`}>
                          {missTxt}
                        </td>

                        <td className={`py-2 pr-4 ${themeBad ? "text-red-700" : "text-green-700"}`}>
                          {themeBad ? "✗" : "✓"}
                        </td>

                        <td className={`py-2 pr-4 ${varianceBad ? "text-amber-700" : "text-green-700"}`}>
                          {r.styleVarianceCount || 0}
                        </td>

                        <td className="py-2 pr-4">
                          {r.spec ? (
                            <button
                              className="rounded-lg border px-2 py-1 text-xs bg-white hover:bg-gray-50"
                              onClick={() => loadToPreview(r.spec)}
                            >
                              Load
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="py-2 pr-4">{r.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-gray-500 mt-3">
              - “theme ✓” valida que el theme elegido corresponde a la personality y trae variables premium. <br />
              - “variance” = nº de signatures diferentes por preset (si es 1, probablemente “se ve igual”).
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
