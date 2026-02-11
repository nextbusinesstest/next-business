import { useMemo } from "react";
import { resolveTheme, toStyleVars } from "../../lib/themes";

/**
 * PacksRouter (unificado)
 * - Renderiza header/footer según layout.header_variant / layout.footer_variant
 * - Renderiza secciones según layout.pages.home.sections (V2)
 * - Lee props desde spec.modules[props_ref]
 * - Incluye “fallbacks” para que si falta una variant, no rompa
 */

/* -----------------------------
  Utils
----------------------------- */

function getByRef(spec, ref) {
  // ref esperado: "modules.x"
  if (!ref || typeof ref !== "string") return null;
  const parts = ref.split(".");
  if (parts.length !== 2) return null;
  const [root, key] = parts;
  if (root !== "modules") return null;
  return spec?.modules?.[key] ?? null;
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function cap(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function safeStr(v, fallback = "—") {
  const t = (v ?? "").toString().trim();
  return t || fallback;
}

/* -----------------------------
  Shared layout primitives
----------------------------- */

function Container({ children }) {
  return <div className="max-w-6xl mx-auto px-5 sm:px-6">{children}</div>;
}

function SectionWrap({ id, title, kicker, children, className }) {
  return (
    <section
      className={cx("border-t", className)}
      style={{ paddingTop: "var(--section-py)", paddingBottom: "var(--section-py)", borderColor: "var(--border)" }}
    >
      <Container>
        {kicker ? <div className="text-xs tracking-wide uppercase text-[var(--c-text)]/60">{kicker}</div> : null}
        {title ? <h2 className="mt-2 text-2xl font-semibold text-[var(--c-text)]">{title}</h2> : null}
        <div className={cx(title ? "mt-6" : "", "")}>{children}</div>
      </Container>
    </section>
  );
}

/* -----------------------------
  Header variants
----------------------------- */

function HeaderMinimal({ spec }) {
  const brandName = spec?.business?.name || spec?.brand?.name || "Preview";
  const type = spec?.business?.type || "";
  const pack = spec?.layout?.pack || "";
  const personality = spec?.brand?.brand_personality || "";

  // nav items (si más adelante los generas)
  const navItems = spec?.navigation?.items || [];

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-20">
      <Container>
        <div className="py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[var(--c-accent)]/20 flex items-center justify-center text-[var(--c-accent)] font-semibold shrink-0">
              {(brandName || "P").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 truncate">{brandName}</div>
              <div className="text-xs text-gray-500 truncate">
                {type ? type : "unknown"} {pack ? `· ${pack}` : ""} {personality ? `· ${personality}` : ""}
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-5 text-sm text-gray-700">
            {navItems.map((it) => (
              <a key={it.href || it.label} href={it.href} className="hover:text-gray-900">
                {it.label}
              </a>
            ))}
            <a
              href="#contact"
              className="ml-2 inline-flex items-center justify-center px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50"
            >
              Contacto
            </a>
          </nav>

          <a
            href="#contact"
            className="md:hidden inline-flex items-center justify-center px-3 py-2 rounded-full border border-gray-200 text-sm"
          >
            Contacto
          </a>
        </div>
      </Container>
    </header>
  );
}

function HeaderTrust({ spec }) {
  const brandName = spec?.business?.name || spec?.brand?.name || "Preview";
  const phone = spec?.contact?.phone;

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-20">
      <Container>
        <div className="py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[var(--c-primary)] text-white flex items-center justify-center font-semibold shrink-0">
              {(brandName || "P").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 truncate">{brandName}</div>
              <div className="text-xs text-gray-500 truncate">Servicio · Confianza · Garantía</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-full bg-[var(--c-primary)] text-white text-sm font-semibold hover:opacity-95"
              >
                Llamar
              </a>
            ) : null}
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 text-sm"
            >
              Solicitar presupuesto
            </a>
          </div>
        </div>
      </Container>
    </header>
  );
}

/* -----------------------------
  Footer variants
----------------------------- */

function FooterSimple({ spec }) {
  const brandName = spec?.business?.name || spec?.brand?.name || "Preview";
  const type = spec?.business?.type || "unknown";
  const pack = spec?.layout?.pack || "pack";
  const personality = spec?.brand?.brand_personality || "personality";

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <Container>
        <div className="py-10 flex items-center justify-between gap-4 text-sm text-gray-500">
          <div className="truncate">{brandName}</div>
          <div className="truncate">{type} · {pack} · {personality}</div>
        </div>
      </Container>
    </footer>
  );
}

/* -----------------------------
  Module variants
----------------------------- */

function HeroProductMinimal({ spec, data }) {
  const headline = data?.headline || spec?.hero?.headline || "Headline";
  const subheadline = data?.subheadline || spec?.hero?.subheadline || "";
  const primary = data?.primary_cta || null;
  const secondary = data?.secondary_cta || null;

  const contact = spec?.contact || {};

  return (
    <section className="py-16">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 leading-tight">
              {headline}
            </h1>
            {subheadline ? <p className="mt-4 text-gray-600 max-w-xl">{subheadline}</p> : null}

            <div className="mt-8 flex flex-wrap gap-3">
              {primary ? (
                <a
                  href={primary.href || "#"}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[var(--c-accent)] text-white font-semibold hover:opacity-95"
                >
                  {primary.label || "Empezar"}
                </a>
              ) : null}
              {secondary ? (
                <a
                  href={secondary.href || "#"}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-gray-200 hover:bg-gray-50 font-semibold"
                >
                  {secondary.label || "Ver más"}
                </a>
              ) : null}
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-[var(--shadow)]">
            <div className="text-xs tracking-wide uppercase text-gray-500">Resumen</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{spec?.business?.name || "Preview"}</div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500">Contacto</div>
                <div className="mt-1 text-sm text-gray-900">
                  {safeStr(contact.phone)}
                  <br />
                  {safeStr(contact.email)}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500">Dirección</div>
                <div className="mt-1 text-sm text-gray-900">{safeStr(contact.address)}</div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * ✅ NUEVO: Hero split (composición B)
 * - Panel izquierdo “destacado”
 * - Panel derecho con headline + mini contacto
 */
function HeroProductSplit({ spec, data }) {
  const headline = data?.headline || "Headline";
  const subheadline = data?.subheadline || "";
  const primary = data?.primary_cta || null;
  const secondary = data?.secondary_cta || null;

  const contact = spec?.contact || {};
  const kickerLeft = "Destacado";
  const titleLeft = "Compra con claridad";
  const descLeft = "Envío, devoluciones y soporte sin sorpresas.";

  return (
    <section className="py-16">
      <Container>
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-2)] p-8 flex flex-col justify-between min-h-[260px]">
            <div>
              <div className="text-xs tracking-wide uppercase text-gray-500">{kickerLeft}</div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">{titleLeft}</h2>
              <p className="mt-2 text-sm text-gray-600 max-w-md">{descLeft}</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={secondary?.href || "#categories"}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:opacity-95 text-sm font-semibold"
              >
                {secondary?.label || "Devoluciones"}
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow)]">
            <div className="text-xs tracking-wide uppercase text-gray-500">Tienda online</div>

            <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
              {headline}
            </h1>
            {subheadline ? <p className="mt-3 text-gray-600">{subheadline}</p> : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={primary?.href || "#categories"}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[var(--c-accent)] text-white font-semibold hover:opacity-95"
              >
                {primary?.label || "Ver catálogo"}
              </a>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500">Teléfono</div>
                <div className="mt-1 text-sm text-gray-900">{safeStr(contact.phone)}</div>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500">Email</div>
                <div className="mt-1 text-sm text-gray-900">{safeStr(contact.email)}</div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function CardsGridMinimal({ data }) {
  const title = data?.title || "Compra por categorías";
  const items = Array.isArray(data?.items) ? data.items : [];

  return (
    <SectionWrap id={data?.id || "categories"} title={title} kicker="Explora rápido">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-sm transition">
            <div className="font-semibold text-gray-900">{it.name}</div>
            {it.description ? <div className="mt-1 text-sm text-gray-600">{it.description}</div> : null}
            <div className="mt-3 text-sm text-[var(--c-accent)] font-semibold">Ver →</div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

/**
 * ✅ NUEVO: Categories scroller (composición B)
 */
function CardsScrollerMinimal({ data }) {
  const title = data?.title || "Compra por categorías";
  const items = Array.isArray(data?.items) ? data.items : [];

  return (
    <SectionWrap id={data?.id || "categories"} title={title} kicker="Explora rápido">
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="min-w-[240px] rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-sm transition"
          >
            <div className="font-semibold text-gray-900">{it.name}</div>
            {it.description ? <div className="mt-1 text-sm text-gray-600">{it.description}</div> : null}
            <div className="mt-3 text-sm text-[var(--c-accent)] font-semibold">Abrir →</div>
          </div>
        ))}
      </div>
      <div className="h-1 rounded-full bg-gray-200 mt-3" />
    </SectionWrap>
  );
}

function BulletsInlineMinimal({ data }) {
  const title = data?.title || "Compra sin complicaciones";
  const bullets = Array.isArray(data?.bullets) ? data.bullets : [];

  return (
    <SectionWrap id={data?.id || "benefits"} title={title} kicker="Condiciones claras">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bullets.map((b, idx) => (
          <div key={idx} className="text-sm text-gray-700 flex gap-2">
            <span className="mt-1 inline-block w-2 h-2 rounded-full bg-[var(--c-accent)] shrink-0" />
            <span>{b}</span>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

/**
 * ✅ NUEVO: Benefits cards (composición B)
 */
function BenefitsCardsMinimal({ data }) {
  const title = data?.title || "Compra sin complicaciones";
  const bullets = Array.isArray(data?.bullets) ? data.bullets : [];

  return (
    <SectionWrap id={data?.id || "benefits"} title={title} kicker="Condiciones claras">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {bullets.map((b, idx) => (
          <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-sm font-semibold text-gray-900">{b}</div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function ServicesGridAuto({ data }) {
  const title = data?.title || "Servicios";
  const items = Array.isArray(data?.items) ? data.items : [];
  return (
    <SectionWrap id={data?.id || "services"} title={title}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="font-semibold text-gray-900">{it.name}</div>
            {it.description ? <div className="mt-2 text-sm text-gray-600">{it.description}</div> : null}
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function TextAuto({ data }) {
  const title = data?.title || "Sobre la empresa";
  const body = data?.body || "";
  return (
    <SectionWrap id={data?.id || "about"} title={title}>
      <div className="text-gray-700 leading-relaxed max-w-3xl text-sm">{body}</div>
    </SectionWrap>
  );
}

function ContactAuto({ spec, data }) {
  const title = data?.title || "Contacto";
  const body = data?.body || "";
  const contact = spec?.contact || {};

  return (
    <SectionWrap id="contact" title={title}>
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div>
          <p className="text-sm text-gray-600 max-w-xl">{body}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-xs text-gray-500">Teléfono</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{safeStr(contact.phone)}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-xs text-gray-500">Email</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{safeStr(contact.email)}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-xs text-gray-500">Dirección</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{safeStr(contact.address)}</div>
          </div>
        </div>
      </div>
    </SectionWrap>
  );
}

/**
 * ✅ NUEVO: Contact split (ecommerce A)
 * - Izquierda: copy
 * - Derecha: tarjetas de contacto
 */
function ContactSplitMinimal({ spec, data }) {
  const title = data?.title || "Contacto";
  const body = data?.body || "Escríbenos para dudas de tallas, envíos, devoluciones o disponibilidad.";
  const contact = spec?.contact || {};

  return (
    <SectionWrap id="contact" title={title}>
      <div className="grid gap-8 lg:grid-cols-2 items-start">
        <div>
          <p className="text-sm text-gray-600 max-w-xl">{body}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-xs text-gray-500">Teléfono</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{safeStr(contact.phone)}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-xs text-gray-500">Email</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{safeStr(contact.email)}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-xs text-gray-500">Dirección</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{safeStr(contact.address)}</div>
          </div>
        </div>
      </div>
    </SectionWrap>
  );
}

/**
 * ✅ NUEVO: Contact center (ecommerce B)
 */
function ContactCenterMinimal({ spec, data }) {
  const title = data?.title || "Contacto";
  const body = data?.body || "Escríbenos para dudas de tallas, envíos, devoluciones o disponibilidad.";
  const contact = spec?.contact || {};

  return (
    <SectionWrap id="contact" title={title} kicker="Hablemos">
      <div className="max-w-2xl mx-auto rounded-3xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-600">{body}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="rounded-full border border-gray-200 px-4 py-2 text-sm">
            {safeStr(contact.phone)}
          </div>
          <div className="rounded-full border border-gray-200 px-4 py-2 text-sm">
            {safeStr(contact.email)}
          </div>
        </div>

        {contact.address ? (
          <div className="mt-4 text-xs text-gray-500">{contact.address}</div>
        ) : null}
      </div>
    </SectionWrap>
  );
}

/* -----------------------------
  Variant maps
----------------------------- */

const HEADER_MAP = {
  header_minimal_v1: HeaderMinimal,
  header_trust_v1: HeaderTrust,
};

const FOOTER_MAP = {
  footer_simple_v1: FooterSimple,
};

const HERO_MAP = {
  hero_product_minimal_v1: HeroProductMinimal,
  hero_product_split_v1: HeroProductSplit, // ✅ NUEVO
};

const SECTION_MAP = {
  // ecommerce + base
  categories_grid_min_v1: CardsGridMinimal,
  categories_scroller_min_v1: CardsScrollerMinimal, // ✅ NUEVO
  benefits_inline_min_v1: BulletsInlineMinimal,
  benefits_cards_min_v1: BenefitsCardsMinimal, // ✅ NUEVO

  services_grid_auto_v1: ServicesGridAuto,
  text_auto_v1: TextAuto,

  contact_auto_v1: ContactAuto,
  contact_split_min_v1: ContactSplitMinimal, // ✅ NUEVO
  contact_center_min_v1: ContactCenterMinimal, // ✅ NUEVO

  // bridge
  cards_auto_v1: CardsGridMinimal,
  bullets_auto_v1: BulletsInlineMinimal,
};

/* -----------------------------
  Main renderer
----------------------------- */

export default function PacksRouter({ spec }) {
  const headerKey = spec?.layout?.header_variant || "header_minimal_v1";
  const footerKey = spec?.layout?.footer_variant || "footer_simple_v1";

  const Header = HEADER_MAP[headerKey] || HeaderMinimal;
  const Footer = FOOTER_MAP[footerKey] || FooterSimple;

  const sections = useMemo(() => {
    const home = spec?.layout?.pages?.home;
    return Array.isArray(home?.sections) ? home.sections : [];
  }, [spec]);

  const theme = useMemo(() => resolveTheme(spec), [spec]);
  const themeStyle = useMemo(() => toStyleVars(theme.vars), [theme]);

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]" style={themeStyle}>
      <Header spec={spec} />

      {sections.map((s, idx) => {
        const data = getByRef(spec, s.props_ref);

        // HERO
        if (s.module === "hero") {
          const Hero = HERO_MAP[s.variant] || HeroProductMinimal;
          return <Hero key={idx} spec={spec} data={data} />;
        }

        // SECTIONS
        const Comp = SECTION_MAP[s.variant];
        if (Comp) {
          // Contact necesita spec para phone/email/address
          if (
            s.variant === "contact_auto_v1" ||
            s.variant === "contact_split_min_v1" ||
            s.variant === "contact_center_min_v1"
          ) {
            return <Comp key={idx} spec={spec} data={data} />;
          }
          return <Comp key={idx} spec={spec} data={data} />;
        }

        // fallback debug visible (no rompe build)
        return (
          <SectionWrap key={idx} title={`Módulo no soportado: ${cap(s.module)}`}>
            <div className="text-sm text-red-600">
              No hay renderer para variant <b>{s.variant}</b>
            </div>
            <pre className="mt-3 text-xs bg-gray-50 border rounded-xl p-4 overflow-auto">
              {JSON.stringify({ module: s.module, variant: s.variant, data }, null, 2)}
            </pre>
          </SectionWrap>
        );
      })}

      <Footer spec={spec} />
    </div>
  );
}
