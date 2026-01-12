import Container from "./Container";

export default function Section({ id, title, tone = "plain", children }) {
  const bg = tone === "soft" ? "bg-[var(--c-secondary)]/40" : "bg-transparent";

  return (
    <section id={id} className={`${bg} py-14 md:py-18 border-b border-black/5`}>
      <Container>
        <div className="flex items-end justify-between gap-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--c-text)]">{title}</h2>
          <div className="hidden md:block h-px flex-1 bg-black/10 max-w-[280px]" />
        </div>
        <div className="mt-7">{children}</div>
      </Container>
    </section>
  );
}
