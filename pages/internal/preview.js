import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";

import PacksRouter from "../../components/preview/PacksRouter";

import { v1ToV2 } from "../../lib/spec/adapters/v1_to_v2";
import { normalizeV2 } from "../../lib/spec/v2/normalize";
import { resolveV2Layout } from "../../lib/spec/v2/resolveLayout";

const PERSONALITIES = [
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

function sanitizeId(id) {
  return (id ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildDuplicateId(baseId) {
  const clean = sanitizeId(baseId || "site") || "site";
  const d = new Date();
  const stamp = [
    String(d.getFullYear()).slice(-2),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
    String(d.getSeconds()).padStart(2, "0"),
  ].join("");

  return `${clean}-copy-${stamp}`.slice(0, 80);
}

function safeTrim(v) {
  return (v ?? "").toString().trim();
}

function chooseHeaderVariant(archetype, personality, currentHeader) {
  if (
    archetype === "booking_trust_v1" ||
    personality === "trust_authority" ||
    personality === "clinical_calm" ||
    personality === "industrial_solid"
  ) {
    return "header_trust_v1";
  }

  if (currentHeader === "header_trust_v1") {
    return "header_minimal_v1";
  }

  return currentHeader || "header_minimal_v1";
}

function getDraftFromSpec(spec) {
  return {
    siteId: spec?.meta?.site_id || "",
    businessName: spec?.business?.name || "",
    sector: spec?.business?.sector || "",
    location: spec?.business?.location || "",
    targetAudience: spec?.business?.target_audience || "",
    personality: spec?.brand?.brand_personality || "modern_minimal",

    seoTitle: spec?.seo?.title || "",
    seoDescription: spec?.seo?.description || "",

    heroHeadline: spec?.modules?.hero_auto?.headline || "",
    heroSubheadline: spec?.modules?.hero_auto?.subheadline || "",
    heroPrimaryCta: spec?.modules?.hero_auto?.cta_primary || "",
    heroSecondaryCta: spec?.modules?.hero_auto?.cta_secondary || "",

    contactTitle: spec?.modules?.contact_auto?.title || "",
    contactNote: spec?.modules?.contact_auto?.note || "",
  };
}

function applyDraftToSpec(baseSpec, draft) {
  const next = JSON.parse(JSON.stringify(baseSpec || {}));

  next.meta = next.meta || {};
  next.business = next.business || {};
  next.brand = next.brand || {};
  next.layout = next.layout || {};
  next.modules = next.modules || {};
  next.modules.hero_auto = next.modules.hero_auto || {};
  next.modules.contact_auto = next.modules.contact_auto || {};
  next.seo = next.seo || {};
  next.contact = next.contact || {};

  const siteId = sanitizeId(draft.siteId) || next.meta.site_id || "site";
  const businessName = safeTrim(draft.businessName) || next.business.name || "";
  const sector = safeTrim(draft.sector);
  const location = safeTrim(draft.location);
  const targetAudience = safeTrim(draft.targetAudience);
  const personality = safeTrim(draft.personality) || next.brand.brand_personality || "modern_minimal";

  next.meta.site_id = siteId;

  next.business.name = businessName;
  next.business.sector = sector;
  next.business.location = location;
  next.business.target_audience = targetAudience;

  next.brand.brand_personality = personality;

  next.layout.header_variant = chooseHeaderVariant(
    next.layout.archetype,
    personality,
    next.layout.header_variant
  );

  next.seo.title = safeTrim(draft.seoTitle) || businessName || next.seo.title || siteId;
  next.seo.description =
    safeTrim(draft.seoDescription) ||
    next.seo.description ||
    (sector ? `${businessName} · ${sector}` : businessName);

  next.modules.hero_auto.headline =
    safeTrim(draft.heroHeadline) || next.modules.hero_auto.headline || businessName;

  next.modules.hero_auto.subheadline =
    safeTrim(draft.heroSubheadline) || next.modules.hero_auto.subheadline || "";

  next.modules.hero_auto.cta_primary =
    safeTrim(draft.heroPrimaryCta) || next.modules.hero_auto.cta_primary || "";

  next.modules.hero_auto.cta_secondary =
    safeTrim(draft.heroSecondaryCta) || next.modules.hero_auto.cta_secondary || "";

  next.modules.contact_auto.title =
    safeTrim(draft.contactTitle) || next.modules.contact_auto.title || "Contacto";

  next.modules.contact_auto.note =
    safeTrim(draft.contactNote) || next.modules.contact_auto.note || "";

  next.contact.address = location || next.contact.address || "";

  return next;
}

export default function PreviewPage() {
  const [spec, setSpec] = useState(null);
  const [debug, setDebug] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState("");
  const [publishErr, setPublishErr] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMsg, setEditorMsg] = useState("");
  const [draft, setDraft] = useState({
    siteId: "",
    businessName: "",
    sector: "",
    location: "",
    targetAudience: "",
    personality: "modern_minimal",
    seoTitle: "",
    seoDescription: "",
    heroHeadline: "",
    heroSubheadline: "",
    heroPrimaryCta: "",
    heroSecondaryCta: "",
    contactTitle: "",
    contactNote: "",
  });

  const fileInputRef = useRef(null);

  function normalizeIncomingSpec(rawSpec) {
    let parsed = rawSpec;
    if (!parsed?.version || parsed.version === "v1") {
      parsed = v1ToV2(parsed);
    }
    parsed = normalizeV2(parsed);
    parsed = resolveV2Layout(parsed);
    return parsed;
  }

  function saveSpecToLocalStorage(nextSpec) {
    localStorage.setItem("nb_last_site_spec", JSON.stringify(nextSpec));
  }

  function loadFromLocalStorage() {
    const raw = window.localStorage.getItem("nb_last_site_spec");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const normalized = normalizeIncomingSpec(parsed);
      setSpec(normalized);
      setDraft(getDraftFromSpec(normalized));
    } catch (e) {
      console.error("Error loading site_spec:", e);
      setSpec(null);
    }
  }

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setDebug(params.get("debug") === "1");
    } catch {
      setDebug(false);
    }

    loadFromLocalStorage();
  }, []);

  const cssVars = useMemo(() => {
    const c = spec?.brand?.design_tokens?.colors;
    if (!c) return {};

    const wantsOverride =
      c._override === true ||
      c.__override === true ||
      c.override_theme === true ||
      String(c.mode || "").toLowerCase() === "override";

    if (!wantsOverride) return {};

    const primary = c.primary ?? c.primaryColor;
    const secondary = c.secondary ?? c.secondaryColor;
    const bg = c.background ?? c.backgroundColor;
    const text = c.text ?? c.textColor;
    const accent = c.accent ?? c.accentColor;

    return {
      "--c-primary": primary,
      "--c-secondary": secondary,
      "--c-bg": bg,
      "--c-text": text,
      "--c-accent": accent,
    };
  }, [spec]);

  async function publishCurrentSpec() {
    if (!spec) return;

    setPublishing(true);
    setPublishErr("");
    setPublishUrl("");
    setEditorMsg("");

    try {
      const r = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_spec: spec }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      // reflejamos meta actualizada (revision / timestamps) si vuelve del API
      if (data?.meta) {
        const next = JSON.parse(JSON.stringify(spec));
        next.meta = next.meta || {};
        next.meta.created_at = data.meta.created_at;
        next.meta.updated_at = data.meta.updated_at;
        next.meta.revision = data.meta.revision;
        if (data.meta.forked_from) next.meta.forked_from = data.meta.forked_from;
        saveSpecToLocalStorage(next);
        setSpec(next);
      }

      setPublishUrl(data?.url || "");
      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      setPublishErr(e?.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  function exportCurrentSpec() {
    if (!spec) return;

    const id = spec?.meta?.site_id || "site";
    const blob = new Blob([JSON.stringify(spec, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function duplicateCurrentSpec() {
    if (!spec) return;

    const cloned = JSON.parse(JSON.stringify(spec));
    const originalId = cloned?.meta?.site_id || "site";

    cloned.meta = cloned.meta || {};
    cloned.meta.site_id = buildDuplicateId(originalId);
    cloned.meta.forked_from = originalId;
    delete cloned.meta.created_at;
    delete cloned.meta.updated_at;
    delete cloned.meta.revision;

    const normalized = normalizeIncomingSpec(cloned);
    saveSpecToLocalStorage(normalized);
    setSpec(normalized);
    setDraft(getDraftFromSpec(normalized));
    setPublishErr("");
    setPublishUrl("");
    setEditorMsg("Copia creada con un site_id nuevo y trazabilidad de fork.");
  }

  function openImportDialog() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPublishErr("");
    setPublishUrl("");
    setEditorMsg("");

    try {
      const txt = await file.text();
      const rawSpec = JSON.parse(txt);
      const normalized = normalizeIncomingSpec(rawSpec);

      saveSpecToLocalStorage(normalized);
      setSpec(normalized);
      setDraft(getDraftFromSpec(normalized));
      setEditorMsg("JSON importado correctamente.");
    } catch {
      setPublishErr("No se pudo importar el JSON.");
    } finally {
      e.target.value = "";
    }
  }

  function applyEdits() {
    if (!spec) return;

    try {
      const nextSpec = applyDraftToSpec(spec, draft);
      const normalized = normalizeIncomingSpec(nextSpec);

      saveSpecToLocalStorage(normalized);
      setSpec(normalized);
      setDraft(getDraftFromSpec(normalized));
      setPublishErr("");
      setPublishUrl("");
      setEditorMsg("Cambios aplicados en preview. Ya puedes publicar.");
    } catch {
      setPublishErr("No se pudieron aplicar los cambios.");
    }
  }

  function resetDraft() {
    if (!spec) return;
    setDraft(getDraftFromSpec(spec));
    setEditorMsg("Formulario reseteado desde el spec actual.");
  }

  if (!spec) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
        <div className="bg-white border rounded-2xl p-6 max-w-md text-center shadow-sm">
          <h1 className="text-lg font-semibold mb-2">No hay site_spec cargado</h1>
          <p className="text-sm text-gray-600">
            Genera un <code>site_spec</code> desde el panel interno o el portal cliente y vuelve aquí.
          </p>
          <a
            href="/internal/new-client"
            className="inline-flex items-center justify-center mt-4 px-4 py-2.5 bg-blue-900 text-white text-sm font-semibold rounded-md hover:bg-blue-800"
          >
            Ir al panel interno
          </a>
        </div>
      </div>
    );
  }

  const title = spec?.seo?.title || spec?.meta?.title || "Preview";
  const favicon = spec?.brand?.logoDataUrl ? spec.brand.logoDataUrl : "/logo.png";

  const inputBase =
    "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none " +
    "focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 placeholder:text-neutral-400";

  const labelBase = "block text-xs font-semibold text-neutral-700 mb-1";

  return (
    <>
      <Head>
        <title>{title} · Preview</title>
        <link rel="icon" type="image/png" href={favicon} />
      </Head>

      <div style={cssVars} className="nb-root min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]">
        <div className="sticky top-0 z-40 border-b border-neutral-200/60 bg-white/70 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs text-neutral-500">Preview</div>
              <div className="text-sm font-semibold text-neutral-900 truncate">
                {spec?.business?.name || spec?.meta?.title || spec?.meta?.site_id || "Site"}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1 font-mono">
                {spec?.meta?.site_id || "-"}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                rev {spec?.meta?.revision || 1}
                {spec?.meta?.forked_from ? (
                  <> · forked_from: <span className="font-mono">{spec.meta.forked_from}</span></>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setEditorOpen((v) => !v)}
                className="text-xs font-semibold rounded-lg border border-neutral-200 bg-white px-3 py-2 hover:bg-neutral-50"
              >
                {editorOpen ? "Close editor" : "Edit"}
              </button>

              <button
                onClick={openImportDialog}
                className="text-xs font-semibold rounded-lg border border-neutral-200 bg-white px-3 py-2 hover:bg-neutral-50"
              >
                Import JSON
              </button>

              <button
                onClick={exportCurrentSpec}
                className="text-xs font-semibold rounded-lg border border-neutral-200 bg-white px-3 py-2 hover:bg-neutral-50"
              >
                Export JSON
              </button>

              <button
                onClick={duplicateCurrentSpec}
                className="text-xs font-semibold rounded-lg border border-neutral-200 bg-white px-3 py-2 hover:bg-neutral-50"
              >
                Duplicate as new
              </button>

              {publishUrl ? (
                <a
                  href={publishUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold rounded-lg border border-neutral-200 bg-white px-3 py-2 hover:bg-neutral-50"
                >
                  Open public
                </a>
              ) : null}

              <button
                onClick={publishCurrentSpec}
                disabled={publishing}
                className="text-xs font-semibold rounded-lg bg-neutral-900 text-white px-3 py-2 hover:bg-neutral-800 disabled:opacity-50"
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </div>

          {(publishErr || publishUrl || editorMsg) ? (
            <div className="max-w-6xl mx-auto px-6 pb-3 space-y-2">
              {publishErr ? (
                <div className="text-xs rounded-xl border border-red-200 bg-red-50 text-red-800 px-3 py-2">
                  {publishErr}
                </div>
              ) : null}

              {editorMsg ? (
                <div className="text-xs rounded-xl border border-blue-200 bg-blue-50 text-blue-800 px-3 py-2">
                  {editorMsg}
                </div>
              ) : null}

              {publishUrl ? (
                <div className="text-xs rounded-xl border border-green-200 bg-green-50 text-green-800 px-3 py-2">
                  Publicado: <code className="font-semibold">{publishUrl}</code>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {editorOpen ? (
          <div className="max-w-6xl mx-auto px-6 pt-5">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-neutral-900">Editor ligero</div>
                  <div className="text-xs text-neutral-600 mt-1">
                    Cambia datos visibles y republica. No modifica estructura profunda ni módulos avanzados.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={resetDraft}
                    className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-50"
                  >
                    Reset
                  </button>
                  <button
                    onClick={applyEdits}
                    className="rounded-xl bg-neutral-900 text-white px-3 py-2 text-xs font-semibold hover:bg-neutral-800"
                  >
                    Apply edits
                  </button>
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className={labelBase}>site_id</label>
                    <input
                      className={inputBase}
                      value={draft.siteId}
                      onChange={(e) => setDraft((d) => ({ ...d, siteId: e.target.value }))}
                      placeholder="site-id"
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Nombre del negocio</label>
                    <input
                      className={inputBase}
                      value={draft.businessName}
                      onChange={(e) => setDraft((d) => ({ ...d, businessName: e.target.value }))}
                      placeholder="Nombre comercial"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelBase}>Sector</label>
                      <input
                        className={inputBase}
                        value={draft.sector}
                        onChange={(e) => setDraft((d) => ({ ...d, sector: e.target.value }))}
                        placeholder="Sector / actividad"
                      />
                    </div>
                    <div>
                      <label className={labelBase}>Ubicación</label>
                      <input
                        className={inputBase}
                        value={draft.location}
                        onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                        placeholder="Ciudad / zona"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelBase}>Público objetivo</label>
                    <input
                      className={inputBase}
                      value={draft.targetAudience}
                      onChange={(e) => setDraft((d) => ({ ...d, targetAudience: e.target.value }))}
                      placeholder="B2B, familias, premium..."
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Personality</label>
                    <select
                      className={inputBase}
                      value={draft.personality}
                      onChange={(e) => setDraft((d) => ({ ...d, personality: e.target.value }))}
                    >
                      {PERSONALITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelBase}>SEO title</label>
                    <input
                      className={inputBase}
                      value={draft.seoTitle}
                      onChange={(e) => setDraft((d) => ({ ...d, seoTitle: e.target.value }))}
                      placeholder="Título SEO"
                    />
                  </div>

                  <div>
                    <label className={labelBase}>SEO description</label>
                    <textarea
                      className={inputBase + " min-h-[88px] resize-y"}
                      value={draft.seoDescription}
                      onChange={(e) => setDraft((d) => ({ ...d, seoDescription: e.target.value }))}
                      placeholder="Descripción SEO"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelBase}>Hero headline</label>
                    <input
                      className={inputBase}
                      value={draft.heroHeadline}
                      onChange={(e) => setDraft((d) => ({ ...d, heroHeadline: e.target.value }))}
                      placeholder="Headline principal"
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Hero subheadline</label>
                    <textarea
                      className={inputBase + " min-h-[88px] resize-y"}
                      value={draft.heroSubheadline}
                      onChange={(e) => setDraft((d) => ({ ...d, heroSubheadline: e.target.value }))}
                      placeholder="Subheadline / propuesta de valor"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelBase}>CTA principal</label>
                      <input
                        className={inputBase}
                        value={draft.heroPrimaryCta}
                        onChange={(e) => setDraft((d) => ({ ...d, heroPrimaryCta: e.target.value }))}
                        placeholder="Acción principal"
                      />
                    </div>

                    <div>
                      <label className={labelBase}>CTA secundaria</label>
                      <input
                        className={inputBase}
                        value={draft.heroSecondaryCta}
                        onChange={(e) => setDraft((d) => ({ ...d, heroSecondaryCta: e.target.value }))}
                        placeholder="Acción secundaria"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelBase}>Título contacto</label>
                    <input
                      className={inputBase}
                      value={draft.contactTitle}
                      onChange={(e) => setDraft((d) => ({ ...d, contactTitle: e.target.value }))}
                      placeholder="Título del bloque contacto"
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Nota contacto</label>
                    <textarea
                      className={inputBase + " min-h-[110px] resize-y"}
                      value={draft.contactNote}
                      onChange={(e) => setDraft((d) => ({ ...d, contactNote: e.target.value }))}
                      placeholder="Texto breve de contacto"
                    />
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-xs text-neutral-600">
                    Estado actual:
                    <div className="mt-2">
                      <span className="font-mono">rev {spec?.meta?.revision || 1}</span>
                    </div>
                    {spec?.meta?.forked_from ? (
                      <div className="mt-1">
                        forked from: <span className="font-mono">{spec.meta.forked_from}</span>
                      </div>
                    ) : null}
                    {spec?.meta?.updated_at ? (
                      <div className="mt-1">
                        updated: {new Date(spec.meta.updated_at).toLocaleString()}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <PacksRouter spec={spec} />

        {debug ? (
          <div className="fixed bottom-4 right-4 z-50 w-[520px] max-h-[70vh] overflow-auto rounded-xl border bg-[var(--surface)]/95 p-3 shadow-lg">
            <div className="text-xs font-semibold mb-2">DEBUG · site_spec (v2)</div>
            <pre className="text-[10px] leading-4 whitespace-pre-wrap break-words">
              {JSON.stringify(spec, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </>
  );
}
