export default function ServicesGridPremium({ items }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {list.map((it, idx) => (
        <div key={idx} className="rounded-2xl border border-black/5 bg-white shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--c-secondary)] border border-black/5 flex items-center justify-center font-bold text-sm">
              {String(idx + 1).padStart(2, "0")}
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--c-text)]">{it.name || "Servicio"}</h3>
              <p className="mt-1 text-sm text-black/70">{it.description || ""}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
