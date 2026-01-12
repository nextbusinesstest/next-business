import Container from "../shared/Container";
import NBButton from "../shared/NBButton";
import Section from "../shared/Section";

import HeroLocalTrust from "../modules/HeroLocalTrust";
import ServicesGridPremium from "../modules/ServicesGridPremium";
import ProcessStepsPremium from "../modules/ProcessStepsPremium";
import TrustBadges from "../modules/TrustBadges";
import Testimonials from "../modules/Testimonials";
import FAQ from "../modules/FAQ";
import ContactSection from "../modules/ContactSection";

export default function LocalServiceTrustPack({ spec, fallback }) {
  try {
    const nav = Array.isArray(spec?.navigation) ? spec.navigation : [
      { id: "services", label: "Servicios" },
      { id: "process", label: "Cómo trabajamos" },
      { id: "trust", label: "Garantías" },
      { id: "contact", label: "Contacto" },
    ];

    return (
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-black/5">
          <Container className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--c-secondary)] border border-black/5 flex items-center justify-center font-bold text-sm">
                {initials(spec?.meta?.title || spec?.slug || "NB")}
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-[var(--c-text)]">
                  {spec?.meta?.title?.split("|")?.[0]?.trim() || "Empresa"}
                </div>
                <div className="text-xs text-black/55">
                  Atención rápida · Presupuesto claro · Trabajo garantizado
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-5 text-sm">
              {nav.map((item) => (
                <a key={item.id} href={`#${item.id}`} className="text-black/70 hover:text-black">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2">
              {spec?.contact?.phone ? (
                <NBButton variant="ghost" href={`tel:${spec.contact.phone}`}>
                  Llamar
                </NBButton>
              ) : null}
              <NBButton href="#contact">Solicitar presupuesto</NBButton>
            </div>
          </Container>
        </header>

        {/* Hero */}
        <HeroLocalTrust spec={spec} />

        {/* Modules */}
        <main>
          {(spec?.modules || []).map((m) => (
            <ModuleRenderer key={m.id || `${m.type}-${Math.random()}`} mod={m} spec={spec} />
          ))}
        </main>

        {/* Footer */}
        <footer className="border-t border-black/5 bg-white">
          <Container className="py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="text-sm text-black/70">
              © {new Date().getFullYear()} {spec?.meta?.title?.split("|")?.[0]?.trim() || "Empresa"}
              <div className="text-xs text-black/50 mt-1">
                Web generada en preview · diseño premium · estructura optimizada
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {spec?.contact?.email ? (
                <NBButton variant="ghost" href={`mailto:${spec.contact.email}`}>
                  Email
                </NBButton>
              ) : null}
              {spec?.contact?.phone ? (
                <NBButton variant="ghost" href={`tel:${spec.contact.phone}`}>
                  Teléfono
                </NBButton>
              ) : null}
              <NBButton href="#contact">Contacto</NBButton>
            </div>
          </Container>
        </footer>

        {/* Fallback (por si algo falla con un spec raro) */}
        <div className="hidden">{fallback}</div>
      </div>
    );
  } catch (e) {
    return fallback || null;
  }
}

function ModuleRenderer({ mod, spec }) {
  const type = String(mod?.type || "").toLowerCase();

  switch (type) {
    case "services_grid":
      return (
        <Section id={mod.id} title={mod.title}>
          <ServicesGridPremium items={mod.items || []} />
        </Section>
      );

    case "process_steps":
      return (
        <Section id={mod.id} title={mod.title} tone="soft">
          <ProcessStepsPremium steps={mod.steps || []} />
        </Section>
      );

    case "trust_badges":
      return (
        <Section id={mod.id} title={mod.title}>
          <TrustBadges items={mod.items || []} />
        </Section>
      );

    case "testimonials":
      return (
        <Section id={mod.id} title={mod.title} tone="soft">
          <Testimonials items={mod.items || []} />
        </Section>
      );

    case "faq":
      return (
        <Section id={mod.id} title={mod.title}>
          <FAQ items={mod.items || []} />
        </Section>
      );

    case "contact":
      return (
        <Section id={mod.id || "contact"} title={mod.title || "Contacto"} tone="soft">
          <ContactSection spec={spec} body={mod.body} />
        </Section>
      );

    case "text":
      return (
        <Section id={mod.id} title={mod.title}>
          <div className="max-w-3xl text-black/70 leading-relaxed whitespace-pre-line">
            {mod.body || ""}
          </div>
        </Section>
      );

    default:
      return null;
  }
}

function initials(text) {
  const t = String(text || "").trim();
  if (!t) return "NB";
  const parts = t.split(" ").filter(Boolean);
  const a = parts[0]?.[0] || "N";
  const b = parts[1]?.[0] || "B";
  return (a + b).toUpperCase();
}
