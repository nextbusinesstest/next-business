import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";

import PacksRouter from "../../components/preview/PacksRouter";

import { v1ToV2 } from "../../lib/spec/adapters/v1_to_v2";
import { normalizeV2 } from "../../lib/spec/v2/normalize";
import { resolveV2Layout } from "../../lib/spec/v2/resolveLayout";

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

export default function PreviewPage() {
  const [spec, setSpec] = useState(null);
  const [debug, setDebug] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState("");
  const [publishErr, setPublishErr] = useState("");

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

    try {
      const r = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_spec: spec }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

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
    cloned.meta = cloned.meta || {};
    cloned.meta.site_id = buildDuplicateId(cloned?.meta?.site_id || "site");

    const normalized = normalizeIncomingSpec(cloned);
    saveSpecToLocalStorage(normalized);
    setSpec(normalized);
    setPublishErr("");
    setPublishUrl("");
  }

  function openImportDialog() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPublishErr("");
    setPublishUrl("");

    try {
      const txt = await file.text();
      const rawSpec = JSON.parse(txt);
      const normalized = normalizeIncomingSpec(rawSpec);

      saveSpecToLocalStorage(normalized);
      setSpec(normalized);
    } catch (err) {
      setPublishErr("No se pudo importar el JSON.");
    } finally {
      e.target.value = "";
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
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={openImportDialog}
                className="text-xs font-semibold rounded-lg border border-neutral-200 bg-white px-3 py-2 hover:bg-neutral-50"
                title="Importar site_spec desde JSON"
              >
                Import JSON
              </button>

              <button
                onClick={exportCurrentSpec}
                className="text-xs font-semibold rounded-lg border border-neutral-200 bg-white px-3 py-2 hover:bg-neutral-50"
                title="Exportar site_spec actual"
              >
                Export JSON
              </button>

              <button
                onClick={duplicateCurrentSpec}
                className="text-xs font-semibold rounded-lg border border-neutral-200 bg-white px-3 py-2 hover:bg-neutral-50"
                title="Duplicar este site con un site_id nuevo"
              >
                Duplicate as new
              </button>

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
                title="Publicar o actualizar este site_spec como /s/<site_id>"
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
