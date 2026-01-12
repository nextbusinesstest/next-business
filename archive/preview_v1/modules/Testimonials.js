export default function Testimonials({ items }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {list.map((t, idx) => (
        <figure key={idx} className="rounded-2xl border border-black/5 bg-white shadow-sm p-5">
          <blockquote className="text-sm text-black/75 leading-relaxed">“{t.text || ""}”</blockquote>
          <figcaption className="mt-3 text-xs font-semibold text-black/60">
            — {t.author || "Cliente"}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
