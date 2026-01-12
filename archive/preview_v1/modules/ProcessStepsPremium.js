export default function ProcessStepsPremium({ steps }) {
  const list = Array.isArray(steps) ? steps : [];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {list.map((s, idx) => (
        <div key={idx} className="rounded-2xl border border-black/5 bg-white shadow-sm p-5">
          <div className="text-xs font-bold text-[var(--c-primary)]">
            Paso {String(idx + 1).padStart(2, "0")}
          </div>
          <div className="mt-2 text-base font-semibold text-[var(--c-text)]">{s.title || "Paso"}</div>
          <div className="mt-1 text-sm text-black/70">{s.description || ""}</div>
        </div>
      ))}
    </div>
  );
}
