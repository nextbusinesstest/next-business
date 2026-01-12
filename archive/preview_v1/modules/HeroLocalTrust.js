import Container from "../shared/Container";
import NBButton from "../shared/NBButton";

export default function HeroLocalTrust({ spec }) {
  const hero = spec?.hero || {};
  const headline = hero.headline || "Servicio profesional de confianza";
  const sub = hero.subheadline || "Presupuesto claro, atención rápida y resultados garantizados.";

  const primary = hero.primary_cta || { label: "Solicitar presupuesto", href: "#contact" };
  const secondary = hero.secondary_cta || (spec?.contact?.phone ? { label: "Llamar", href: `tel:${spec.contact.phone}` } : null);

  return (
    <div className="relative overflow-hidden border-b border-black/5 bg-white">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          background:
            "radial-gradient(700px 300px at 20% 30%, var(--c-accent), transparent 60%), radial-gradient(700px 300px at 80% 20%, var(--c-primary), transparent 60%)"
        }}
      />
      <Container className="py-14 md:py-20 relative">
        <div className="grid md:grid-cols-[1.2fr,0.8fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-black/70 bg-[var(--c-secondary)]/60 border border-black/5 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[var(--c-accent)]" />
              Respuesta rápida · Trabajo con garantía
            </div>

            <h1 className="mt-5 text-3xl md:text-5xl font-extrabold leading-tight text-[var(--c-text)]">
              {headline}
            </h1>
            <p className="mt-4 text-base md:text-lg text-black/70 max-w-xl">
              {sub}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <NBButton href={primary.href}>{primary.label}</NBButton>
              {secondary ? (
                <NBButton variant="ghost" href={secondary.href}>
                  {secondary.label}
                </NBButton>
              ) : null}
            </div>

            <div className="mt-6 grid sm:grid-cols-3 gap-3 max-w-xl">
              <MiniCard title="Presupuesto claro" desc="Sin letra pequeña." />
              <MiniCard title="Atención directa" desc="Sin intermediarios." />
              <MiniCard title="Trabajo garantizado" desc="Calidad y seguridad." />
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-6">
            <div className="text-sm font-semibold text-[var(--c-text)]">Servicio ideal para:</div>
            <ul className="mt-3 space-y-2 text-sm text-black/70">
              <li>• Viviendas y comunidades</li>
              <li>• Comercios y oficinas</li>
              <li>• Industria y mantenimiento</li>
            </ul>

            <div className="mt-5 p-4 rounded-xl bg-[var(--c-secondary)]/50 border border-black/5">
              <div className="text-xs font-semibold text-black/70">Contacto rápido</div>
              <div className="mt-2 text-sm text-black/80 space-y-1">
                {spec?.contact?.phone ? <div><span className="font-semibold">Tel:</span> {spec.contact.phone}</div> : null}
                {spec?.contact?.email ? <div><span className="font-semibold">Email:</span> {spec.contact.email}</div> : null}
                {spec?.contact?.address ? <div><span className="font-semibold">Zona:</span> {spec.contact.address}</div> : null}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

function MiniCard({ title, desc }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white px-4 py-3 shadow-sm">
      <div className="text-sm font-semibold text-[var(--c-text)]">{title}</div>
      <div className="text-xs text-black/60 mt-0.5">{desc}</div>
    </div>
  );
}
