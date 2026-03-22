import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

function cx(...c) {
  return c.filter(Boolean).join(" ");
}

export default function InternalSites() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [items, q]);

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
              Lista interna de sites publicados (KV / dev FS)
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
            placeholder="Buscar por id, nombre, sector, goal, personality..."
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
            <table className="min-w-[1050px] w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Site</th>
                  <th className="text-left font-semibold px-4 py-3">Goal</th>
                  <th className="text-left font-semibold px-4 py-3">Pack / Archetype</th>
                  <th className="text-left font-semibold px-4 py-3">Personality</th>
                  <th className="text-left font-semibold px-4 py-3">Published</th>
                  <th className="text-left font-semibold px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-neutral-600" colSpan={6}>
                      Cargando…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-600" colSpan={6}>
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
                          {it.published_at ? new Date(it.published_at).toLocaleString() : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl bg-neutral-900 text-white px-3 py-2 text-xs font-semibold hover:bg-neutral-800"
                            >
                              Open
                            </a>
                            <button
                              onClick={() => navigator.clipboard?.writeText(location.origin + url)}
                              className={cx(
                                "rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold",
                                "hover:bg-neutral-50"
                              )}
                            >
                              Copy URL
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
          Tip: Publica desde <code>/internal/preview</code> y aparecerá aquí.
        </div>
      </div>
    </div>
  );
}
