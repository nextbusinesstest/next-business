import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

function cx(...c) {
  return c.filter(Boolean).join(" ");
}

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

async function fetchSiteSpec(id) {
  const r = await fetch(`/api/sites/${encodeURIComponent(id)}`);
  const txt = await r.text();
  let json = null;
  try {
    json = JSON.parse(txt);
  } catch {}
  if (!r.ok) {
    throw new Error(json?.error || `HTTP ${r.status}`);
  }
  return json;
}

export default function InternalSites() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonTitle, setJsonTitle] = useState("");
  const [jsonText, setJsonText] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/sites");
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setErr(e?.message || "Error loading sites");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => {
      const hay = [
        it?.id,
        it?.name,
        it?.sector,
        it?.location,
        it?.goal,
        it?.pack,
        it?.archetype,
        it?.personality,
        it?.forked_from,
        it?.revision,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [items, q]);

  async function handleLoadToPreview(id) {
    const key = `load:${id}`;
    setBusyKey(key);
    setErr("");

    try {
      const spec = await fetchSiteSpec(id);
      localStorage.setItem("nb_last_site_spec", JSON.stringify(spec));
      window.open("/internal/preview", "_blank", "noopener,noreferrer");
    } catch (e) {
      setErr(e?.message || "No se pudo cargar el spec en preview.");
    } finally {
      setBusyKey("");
    }
  }

  async function handleDuplicate(id) {
    const key = `dup:${id}`;
    setBusyKey(key);
    setErr("");

    try {
      const spec = await fetchSiteSpec(id);
      const cloned = JSON.parse(JSON.stringify(spec));

      const newId = buildDuplicateId(cloned?.meta?.site_id || id);
      cloned.meta = cloned.meta || {};
      cloned.meta.site_id = newId;
      cloned.meta.forked_from = id;
      delete cloned.meta.created_at;
      delete cloned.meta.updated_at;
      delete cloned.meta.revision;

      localStorage.setItem("nb_last_site_spec", JSON.stringify(cloned));
      window.open("/internal/preview", "_blank", "noopener,noreferrer");
    } catch (e) {
      setErr(e?.message || "No se pudo duplicar el site.");
    } finally {
      setBusyKey("");
    }
  }

  async function handleExport(id) {
    const key = `export:${id}`;
    setBusyKey(key);
    setErr("");

    try {
      const spec = await fetchSiteSpec(id);
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
    } catch (e) {
      setErr(e?.message || "No se pudo exportar el JSON.");
    } finally {
      setBusyKey("");
    }
  }

  async function handleViewJson(id) {
    const key = `json:${id}`;
    setBusyKey(key);
    setErr("");

    try {
      const spec = await fetchSiteSpec(id);
      setJsonTitle(id);
      setJsonText(JSON.stringify(spec, null, 2));
      setJsonOpen(true);
    } catch (e) {
      setErr(e?.message || "No se pudo abrir el JSON.");
    } finally {
      setBusyKey("");
    }
  }

  async function handleCopyJson(id) {
    const key = `copyjson:${id}`;
    setBusyKey(key);
    setErr("");

    try {
      const spec = await fetchSiteSpec(id);
      await navigator.clipboard?.writeText(JSON.stringify(spec, null, 2));
    } catch (e) {
      setErr(e?.message || "No se pudo copiar el JSON.");
    } finally {
      setBusyKey("");
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm(
      `Vas a despublicar y borrar el site "${id}". Esta acción elimina la URL pública.`
    );
    if (!ok) return;

    const key = `delete:${id}`;
    setBusyKey(key);
    setErr("");

    try {
      const r = await fetch(`/api/sites/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);

      setItems((prev) => prev.filter((x) => x?.id !== id));
    } catch (e) {
      setErr(e?.message || "No se pudo borrar el site.");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Head>
        <title>Sites · Internal</title>
      </Head>

      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-neutral-900">Published Sites</div>
            <div className="text-xs text-neutral-600 mt-1">
              Gestión interna de sites publicados con versión, trazabilidad e inspector
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-neutral-50"
            >
              Refresh
            </button>
            <a
              href="/internal/lab"
              className="rounded-xl bg-neutral-900 text-white px-3 py-2 text-sm font-semibold hover:bg-neutral-800"
            >
              Open Lab
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por id, nombre, sector, goal, personality, fork..."
            className="w-full md:w-[520px] rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10"
          />
          <div className="text-xs text-neutral-600">
            Total: <b className="text-neutral-900">{items.length}</b> · Mostrando:{" "}
            <b className="text-neutral-900">{filtered.length}</b>
          </div>
        </div>

        {err ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {err}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-[1620px] w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Site</th>
                  <th className="text-left font-semibold px-4 py-3">Goal</th>
                  <th className="text-left font-semibold px-4 py-3">Pack / Archetype</th>
                  <th className="text-left font-semibold px-4 py-3">Personality</th>
                  <th className="text-left font-semibold px-4 py-3">Version</th>
                  <th className="text-left font-semibold px-4 py-3">Updated</th>
                  <th className="text-left font-semibold px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-neutral-600" colSpan={7}>
                      Cargando…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-600" colSpan={7}>
                      No hay sites publicados (o no coinciden con la búsqueda).
                    </td>
                  </tr>
                ) : (
                  filtered.map((it) => {
                    const url = `/s/${it.id}`;
                    return (
                      <tr key={it.id} className="border-t border-neutral-100">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-neutral-900">{it.name || it.id}</div>
                          <div className="text-xs text-neutral-600 mt-1">
                            <span className="font-mono">{it.id}</span>
                            {it.location ? <> · {it.location}</> : null}
                            {it.sector ? <> · {it.sector}</> : null}
                          </div>
                          {it.forked_from ? (
                            <div className="mt-2 text-[11px] text-amber-700 font-mono">
                              forked_from: {it.forked_from}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-4 py-3 font-mono text-xs text-neutral-800">
                          {it.goal || "-"}
                        </td>

                        <td className="px-4 py-3 text-xs text-neutral-800">
                          <div className="font-mono">{it.pack || "-"}</div>
                          <div className="font-mono text-neutral-600 mt-1">{it.archetype || "-"}</div>
                        </td>

                        <td className="px-4 py-3 font-mono text-xs text-neutral-800">
                          {it.personality || "-"}
                        </td>

                        <td className="px-4 py-3 text-xs text-neutral-700">
                          <div className="font-mono">rev {it.revision || 1}</div>
                          {it.created_at ? (
                            <div className="text-neutral-500 mt-1">
                              created {new Date(it.created_at).toLocaleString()}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-4 py-3 text-xs text-neutral-700">
                          {it.updated_at || it.published_at
                            ? new Date(it.updated_at || it.published_at).toLocaleString()
                            : "-"}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl bg-neutral-900 text-white px-3 py-2 text-xs font-semibold hover:bg-neutral-800"
                            >
                              Open
                            </a>

                            <button
                              onClick={() => handleLoadToPreview(it.id)}
                              disabled={busyKey === `load:${it.id}`}
                              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
                            >
                              {busyKey === `load:${it.id}` ? "Loading…" : "Load to Preview"}
                            </button>

                            <button
                              onClick={() => handleDuplicate(it.id)}
                              disabled={busyKey === `dup:${it.id}`}
                              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
                            >
                              {busyKey === `dup:${it.id}` ? "Duplicating…" : "Duplicate"}
                            </button>

                            <button
                              onClick={() => handleViewJson(it.id)}
                              disabled={busyKey === `json:${it.id}`}
                              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
                            >
                              {busyKey === `json:${it.id}` ? "Opening…" : "View JSON"}
                            </button>

                            <button
                              onClick={() => handleCopyJson(it.id)}
                              disabled={busyKey === `copyjson:${it.id}`}
                              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
                            >
                              {busyKey === `copyjson:${it.id}` ? "Copying…" : "Copy JSON"}
                            </button>

                            <button
                              onClick={() => handleExport(it.id)}
                              disabled={busyKey === `export:${it.id}`}
                              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
                            >
                              {busyKey === `export:${it.id}` ? "Exporting…" : "Export JSON"}
                            </button>

                            <button
                              onClick={() => navigator.clipboard?.writeText(location.origin + url)}
                              className={cx(
                                "rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold",
                                "hover:bg-neutral-50"
                              )}
                            >
                              Copy URL
                            </button>

                            <button
                              onClick={() => handleDelete(it.id)}
                              disabled={busyKey === `delete:${it.id}`}
                              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                            >
                              {busyKey === `delete:${it.id}` ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-xs text-neutral-500">
          Tip: usa “View JSON” para QA rápido sin salir del dashboard.
        </div>
      </div>

      {jsonOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-6">
          <div className="w-full max-w-5xl max-h-[85vh] rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-neutral-900">JSON Inspector</div>
                <div className="text-xs text-neutral-600 mt-1 font-mono">{jsonTitle}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(jsonText)}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-50"
                >
                  Copy
                </button>
                <button
                  onClick={() => setJsonOpen(false)}
                  className="rounded-xl bg-neutral-900 text-white px-3 py-2 text-xs font-semibold hover:bg-neutral-800"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 bg-neutral-50">
              <pre className="w-full max-h-[68vh] overflow-auto rounded-xl border border-neutral-200 bg-white p-4 text-[11px] leading-5 whitespace-pre-wrap break-words text-neutral-900">
                {jsonText}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
