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
    return { ok: true, value: JSON.parse(txt), error: null };
  } catch (e) {
    return { ok: false, value: null, error: e?.message || "JSON inválido" };
  }
}

// --- Renderer coverage allowlist (debe reflejar PacksRouter actual) ---
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

function clampHex(x) {
  const s = String(x || "").trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s) ? s : "";
}

// Heurística simple: si bg es muy oscuro, text debe ser claro
function approxLuma(hex) {
  const h = clampHex(hex);
  if (!h) return null;
  const v = h.length === 4
    ? [h[1] + h[1], h[2] + h[2], h[3] + h[3]]
    : [h.slice(1, 3), h.slice(3, 5), h.slice(5, 7)];
  const [r, g, b] = v.map((x) => parseInt(x, 16) / 255);
  // relative luminance (approx)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function validateDarkContrast(spec) {
  const c = spec?.brand?.design_tokens?.colors || {};
  const bg = c.bg || c.background || c.backgroundColor;
  const text = c.text || c.textColor;

  const Lbg = approxLuma(bg);
  const Lt = approxLuma(text);
  if (Lbg == null || Lt == null) return { ok: true, note: "no-check" };

  // si bg oscuro (<0.25), el texto debería ser claramente más claro
  if (Lbg < 0.25) {
    const ok = Lt > 0.65;
    return { ok, note: ok ? "dark-ok" : "dark-bad-text" };
  }
  return { ok: true, note: "light-ok" };
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
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const txt = await r.text();
  let json = null;
  try { json = JSON.parse(txt); } catch {}
  return { ok: r.ok, status: r.status, json, text: txt };
}

export default function LabPage() {
  const [presetKey, setPresetKey] = useState(Object.keys(PRESETS)[0] || "");
  const [personality, setPersonality] = useState("modern_minimal");

  const [payloadText, setPayloadText] = useState("");
  const [resultSpec, setResultSpec] = useState(null);
  const [resultRaw, setResultRaw] = useState("");
  const [busy, setBusy] = useState(false);

  const [sweepBusy, setSweepBusy] = useState(false);
  const [sweepRows, setSweepRows] = useState([]);

  const preset = PRESETS[presetKey];

  useEffect(() => {
    if (!preset) return;
    const base = preset.brief || preset;
    const withP = { ...base, brand_personality: personality };
    setPayloadText(pretty(withP));
  }, [presetKey, personality]);

  const validations = useMemo(() => (resultSpec ? runValidations(resultSpec) : []), [resultSpec]);
  const qa = useMemo(() => (resultSpec ? pickQA(resultSpec) : null), [resultSpec]);

  const coverage = useMemo(() => (resultSpec ? validateRenderCoverage(resultSpec) : []), [resultSpec]);
  const darkCheck = useMemo(() => (resultSpec ? validateDarkContrast(resultSpec) : { ok: true, note: "no" }), [resultSpec]);

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
        // guardar en localStorage para preview
        try {
          localStorage.setItem("nb_last_site_spec", JSON.stringify(resp.json));
        } catch {}
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSweep() {
    // Sweep rápido: 2 presets (si existen) y todas las personalidades “principales”
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

    // Intentamos detectar presets típicos
    const allPresetKeys = Object.keys(PRESETS);
    const clinicKey =
      allPresetKeys.find((k) => k.toLowerCase().includes("clinic")) ||
      allPresetKeys.find((k) => k.toLowerCase().includes("clin")) ||
      allPresetKeys[0];

    const ecommerceKey =
      allPresetKeys.find((k) => k.toLowerCase().includes("ecom")) ||
      allPresetKeys.find((k) => k.toLowerCase().includes("shop")) ||
      allPresetKeys[0];

    const sweepTargets = [
      { label: "clinic", presetKey: clinicKey },
      { label: "ecommerce", presetKey: ecommerceKey },
    ];

    setSweepBusy(true);
    setSweepRows([]);

    const rows = [];

    try {
      for (const target of sweepTargets) {
        const p = PRESETS[target.presetKey];
        const base = p?.brief || p;
        if (!base) continue;

        for (const per of personalities) {
          const payload = { ...base, brand_personality: per };
          const resp = await postGenerate(payload);

          if (!resp.ok) {
            rows.push({
              target: target.label,
              personality: per,
              ok: false,
              status: resp.status,
              missing: ["HTTP_ERROR"],
              dark: "n/a",
              pack: "",
              archetype: "",
            });
            setSweepRows([...rows]);
            continue;
          }

          const spec = resp.json;
          const missing = validateRenderCoverage(spec);
          const dark = validateDarkContrast(spec);
          const qa = pickQA(spec);

          rows.push({
            target: target.label,
            personality: per,
            ok: missing.length === 0 && dark.ok,
            status: 200,
            missing: missing.map((x) => `${x.module}:${x.variant}`),
            dark: dark.note,
            pack: qa.pack,
            archetype: qa.archetype,
          });

          setSweepRows([...rows]);
        }
      }
    } finally {
      setSweepBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-semibold">Internal Lab</h1>
        <p className="text-sm text-gray-600 mt-1">
          Genera site_spec V2, valida invariantes y comprueba cobertura de renderers (rápido).
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-2xl p-4">
            <div className="text-sm font-semibold mb-2">Preset</div>
            <select
              className="w-full border rounded-xl px-3 py-2 text-sm"
              value={presetKey}
              onChange={(e) => setPresetKey(e.target.value)}
            >
              {Object.keys(PRESETS).map((k) => (
                <option key={k} value={k}>
                  {k}
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
              onClick={onSweep}
              disabled={sweepBusy}
              title="Genera clinic + ecommerce para todas las personalidades y reporta fallos"
            >
              {sweepBusy ? "Running sweep..." : "Run Sweep (clinic + ecommerce)"}
            </button>
          </div>

          <div className="bg-white border rounded-2xl p-4 md:col-span-2">
            <div className="text-sm font-semibold mb-2">Payload (request)</div>
            <textarea
              className="w-full h-[240px] border rounded-xl p-3 font-mono text-xs"
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-2">
              Tip: esto se envía tal cual a <code>/api/generate-site</code>.
            </div>
          </div>
        </div>

        {resultSpec ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-2xl p-4">
              <div className="text-sm font-semibold">QA</div>
              <div className="mt-2 text-sm text-gray-700">
                <div><b>pack</b>: {qa?.pack}</div>
                <div><b>archetype</b>: {qa?.archetype}</div>
                <div><b>header</b>: {qa?.header}</div>
                <div><b>personality</b>: {qa?.personality}</div>
              </div>

              <div className="mt-4 text-sm font-semibold">Validations</div>
              <ul className="mt-2 space-y-1 text-sm">
                {validations.map((v, i) => (
                  <li key={i} className={v.ok ? "text-green-700" : "text-red-700"}>
                    {v.ok ? "✓" : "✗"} {v.msg}
                  </li>
                ))}
              </ul>

              <div className="mt-4 text-sm font-semibold">Renderer coverage</div>
              {coverage.length === 0 ? (
                <div className="mt-2 text-green-700 text-sm">✓ Todo renderizable</div>
              ) : (
                <div className="mt-2 text-red-700 text-sm">
                  ✗ Missing renderers:
                  <ul className="mt-1 list-disc pl-5">
                    {coverage.map((m, i) => (
                      <li key={i}>
                        {m.module}: <b>{m.variant}</b>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 text-sm font-semibold">Dark contrast (heurístico)</div>
              <div className={darkCheck.ok ? "mt-2 text-green-700 text-sm" : "mt-2 text-red-700 text-sm"}>
                {darkCheck.ok ? "✓" : "✗"} {darkCheck.note}
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-4">
              <div className="text-sm font-semibold mb-2">Result (response spec)</div>
              <pre className="w-full h-[420px] overflow-auto border rounded-xl p-3 text-xs bg-gray-50">
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
            <div className="text-sm font-semibold mb-3">Sweep results</div>
            <div className="overflow-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-4">target</th>
                    <th className="py-2 pr-4">personality</th>
                    <th className="py-2 pr-4">pack</th>
                    <th className="py-2 pr-4">archetype</th>
                    <th className="py-2 pr-4">dark</th>
                    <th className="py-2 pr-4">missing</th>
                    <th className="py-2 pr-4">status</th>
                  </tr>
                </thead>
                <tbody>
                  {sweepRows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 pr-4">{r.target}</td>
                      <td className="py-2 pr-4 font-mono">{r.personality}</td>
                      <td className="py-2 pr-4 font-mono">{r.pack}</td>
                      <td className="py-2 pr-4 font-mono">{r.archetype}</td>
                      <td className={`py-2 pr-4 ${r.dark === "dark-bad-text" ? "text-red-700" : "text-gray-700"}`}>
                        {r.dark}
                      </td>
                      <td className={`py-2 pr-4 ${r.missing.length ? "text-red-700" : "text-green-700"}`}>
                        {r.missing.length ? r.missing.join(", ") : "✓"}
                      </td>
                      <td className="py-2 pr-4">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-gray-500 mt-3">
              Nota: “missing” detecta variantes no soportadas por el renderer actual (allowlist).
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
