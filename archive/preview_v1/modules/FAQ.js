export default function FAQ({ items }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-3">
      {list.map((f, idx) => (
        <details key={idx} className="rounded-2xl border border-black/10 bg-white shadow-sm p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--c-text)]">
            {f.question || "Pregunta"}
          </summary>
          <div className="mt-2 text-sm text-black/70 leading-relaxed">
            {f.answer || ""}
          </div>
        </details>
      ))}
    </div>
  );
}
