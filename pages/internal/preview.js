import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import PacksRouter from "../../components/preview/PacksRouter";

import { v1ToV2 } from "../../lib/spec/adapters/v1_to_v2";
import { normalizeV2 } from "../../lib/spec/v2/normalize";
import { resolveV2Layout } from "../../lib/spec/v2/resolveLayout";

export default function PreviewPage() {
  const [spec, setSpec] = useState(null);
  const [debug, setDebug] = useState(false);

  // publish state
  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState("");
  const [publishErr, setPublishErr] = useState("");

  useEffect(() => {
    // Toggle debug con ?debug=1
    try {
      const params = new URLSearchParams(window.location.search);
      setDebug(params.get("debug") === "1");
    } catch {
      setDebug(false);
    }

    const raw = window.localStorage.getItem("nb_last_site_spec");
    if (!raw) return;

    try {
      let parsed = JSON.parse(raw);

      // Si viene en v1 (o sin version), lo pasamos a v2
      if (!parsed?.version || parsed.version === "v1") {
        parsed = v1ToV2(parsed);
      }

      // Normalizamos + resolvemos layout/variantes
      let normalized = normalizeV2(parsed);
      normalized = resolveV2Layout(normalized);

      setSpec(normalized);
    } catch (e) {
      console.error("Error loading site_spec:", e);
      setSpec(null);
    }
  }, []);

  const cssVars = useMemo(() => {
    const c = spec?.brand?.design_tokens?.colors;
    if (!c) return {};

    // IMPORTANT (Bloque 6):
    // No queremos que design_tokens.colors machaque el theme por defecto.
    // Solo aplicamos estos CSS vars si el spec lo marca como override explícito.
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

    try {
      const r = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_spec: spec }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      // data: { id, url }
      setPublishUrl(data?.url || "");
      if (data?.url) {
        // abre en nueva pestaña
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      setPublishErr(e?.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
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

  return (
    <>
      <Head>
        <title>{title} · Preview</title>
        <link rel="icon" type="image/png" href={favicon} />
      </Head>

      <div style={cssVars} className="nb-root min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]">
        {/* Top bar (internal) */}
        <div className="sticky top-0 z-40 border-b border-neutral-200/60 bg-white/70 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs text-neutral-500">Preview</div>
              <div className="text-sm font-semibold text-neutral-900 truncate">
                {spec?.business?.name || spec?.meta?.title || spec?.meta?.site_id || "Site"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {publishUrl ? (
                <a
                  href={publishUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold rounded-lg border border-neutral-200 bg-white px-3 py-2 hover:bg-neutral-50"
                  title="Abrir web pública"
                >
                  Open public
                </a>
              ) : null}

              <button
                onClick={publishCurrentSpec}
                disabled={publishing}
                className="text-xs font-semibold rounded-lg bg-neutral-900 text-white px-3 py-2 hover:bg-neutral-800 disabled:opacity-50"
                title="Publicar este site_spec como /s/<site_id>"
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>

          {(publishErr || publishUrl) ? (
            <div className="max-w-6xl mx-auto px-6 pb-3">
              {publishErr ? (
                <div className="text-xs rounded-xl border border-red-200 bg-red-50 text-red-800 px-3 py-2">
                  {publishErr}
                </div>
              ) : null}

              {publishUrl ? (
                <div className="text-xs rounded-xl border border-green-200 bg-green-50 text-green-800 px-3 py-2 mt-2">
                  Publicado: <code className="font-semibold">{publishUrl}</code>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

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
