export default function TrustBadges({ items }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((t, idx) => (
        <div key={idx} className="rounded-2xl border border-black/5 bg-white shadow-sm px-4 py-3 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[var(--c-accent)]/15 border border-black/5 flex items-center justify-center text-sm font-bold">
            ✓
          </span>
          <div className="text-sm font-semibold text-black/80">{t}</div>
        </div>
      ))}
    </div>
  );
}
