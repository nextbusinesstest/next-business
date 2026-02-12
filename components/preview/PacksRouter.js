import { useMemo } from "react";
import { resolveTheme, toStyleVars } from "../../lib/themes";

/**
 * PacksRouter (unificado, robusto)
 * - No rompe si faltan variants o si el shape del spec varía (title/name, bullets.items, etc.)
 * - Normaliza módulos "auto" (hero/services/bullets/cards/contact) para que SIEMPRE rendericen contenido.
 * - Aplica theme vars de forma segura (nunca rompe el build).
 */

/* -----------------------------
  Utils
----------------------------- */

const DEFAULT_THEME = {
  vars: {
    "--c-bg": "#ffffff",
    "--c-text": "#111827",
    "--c-primary": "#111827",
    "--c-accent": "#2563eb",
    "--surface": "#ffffff",
    "--surface-2": "#f8fafc",
    "--border": "#e5e7eb",
    "--shadow": "0_16px_50px_rgba(15,23,42,0.10)",
    "--r-sm": "12px",
    "--r-md": "16px",
    "--r-lg": "22px",
    "--section-py": "64px",
  },
};

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

// Normalizadores
function normTitle(x) {
  if (!x) return "";
  return (x.title || x.name || "").toString().trim();
}

function normDesc(x) {
  if (!x) return "";
  return (x.description || x.desc || x.body || x.note || "").toString().trim();
}

function normItemsToNameDesc(arrOrObj) {
  const raw = Array.isArray(arrOrObj)
    ? arrOrObj
    : Array.isArray(arrOrObj?.items)
      ? arrOrObj.items
      : [];

  return raw
    .map((it) => {
      if (typeof it === "string") return { name: it, description: "" };
      return { name: normTitle(it), description: normDesc(it) };
    })
    .filter((it) => it.name);
}

function normBullets(arrOrObj) {
  const raw = Array.isArray(arrOrObj)
    ? arrOrObj
    : Array.isArray(arrOrObj?.bullets)
      ? arrOrObj.bullets
      : Array.isArray(arrOrObj?.items)
        ? arrOrObj.items
        : [];

  return raw
    .map((b) => (typeof b === "string" ? b : normTitle(b)))
    .map((s) => (s || "").trim())
    .filter(Boolean);
}

function normalizeHeroData(spec, data) {
  const headline = (data?.headline || spec?.business?.name || "Headline").toString().trim();

  const subheadline =
    (data?.subheadline ||
      (spec?.business?.sector && spec?.business?.location
        ? `${spec.business.sector} · ${spec.business.location}`
        : spec?.business?.sector || spec?.business?.location || "")
    ).toString().trim();

  // En tu spec v2 viene como strings: cta_primary / cta_secondary
  // Pero también soportamos legacy: primary_cta/secondary_cta
  const ctaPrimaryLabel = (data?.cta_primary || data?.primary_cta?.label || "").toString().trim();
  const ctaSecondaryLabel = (data?.cta_secondary || data?.secondary_cta?.label || "").toString().trim();

  const primary = ctaPrimaryLabel
    ? { label: ctaPrimaryLabel, href: data?.primary_cta?.href || "#contact" }
    : null;

  const secondary = ctaSecondaryLabel
    ? { label: ctaSecondaryLabel, href: data?.secondary_cta?.href || "#services" }
    : null;

  return { headline, subheadline, primary, secondary };
}

function safeResolveTheme(spec) {
  try {
    const t = resolveTheme(spec);
    return t && t.vars ? t : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function safeToStyleVars(vars) {
  try {
    const out = toStyleVars(vars);
    return out && typeof out === "object" ? out : {};
  } catch {
    return {};
  }
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
      id={id}
      className={cx("border-t", className)}
      style={{
        paddingTop: "var(--section-py)",
        paddingBottom: "var(--section-py)",
        borderColor: "var(--border)",
      }}
    >
      <Container>
        {kicker ? (
          <div className="text-xs tracking-wide uppercase text-[var(--c-text)]/60">{kicker}</div>
        ) : null}
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
              <div className="font-semibold text-[var(--c-text)] truncate">{brandName}</div>
              <div className="text-xs text-[var(--c-text)]/60 truncate">
                {type ? type : "unknown"} {pack ? `· ${pack}` : ""} {personality ? `· ${personality}` : ""}
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-5 text-sm text-[var(--c-text)]/80">
            {navItems.map((it) => (
              <a key={it.href || it.label} href={it.href} className="hover:opacity-90">
                {it.label}
              </a>
            ))}
            <a
              href="#contact"
              className="ml-2 inline-flex items-center justify-center px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:opacity-95"
            >
              Contacto
            </a>
          </nav>

          <a
            href="#contact"
            className="md:hidden inline-flex items-center justify-center px-3 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:opacity-95 text-sm"
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
              <div className="font-semibold text-[var(--c-text)] truncate">{brandName}</div>
              <div className="text-xs text-[var(--c-text)]/60 truncate">Servicio · Confianza · Garantía</div>
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
              className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:opacity-95 text-sm"
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
  const type = spec?.business?.type || "";
  const pack = spec?.layout?.pack || "";
  const personality = spec?.brand?.brand_personality || "";

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <Container>
        <div className="py-10 flex items-center justify-between gap-4 text-sm text-[var(--c-text)]/60">
          <div className="truncate">{brandName}</div>
          <div className="truncate">
            {type || "unknown"} {pack ? `· ${pack}` : ""} {personality ? `· ${personality}` : ""}
          </div>
        </div>
      </Container>
    </footer>
  );
}

/* -----------------------------
  Module variants
----------------------------- */

function HeroProductMinimal({ spec, data }) {
  const hero = normalizeHeroData(spec, data);
  const contact = spec?.contact || {};

  return (
    <section className="py-16">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold text-[var(--c-text)] leading-tight">
              {hero.headline}
            </h1>
            {hero.subheadline ? <p className="mt-4 text-[var(--c-text)]/70 max-w-xl">{hero.subheadline}</p> : null}

            <div className="mt-8 flex flex-wrap gap-3">
              {hero.primary ? (
                <a
                  href={hero.primary.href || "#contact"}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[var(--c-accent)] text-white font-semibold hover:opacity-95"
                >
                  {hero.primary.label}
                </a>
              ) : null}
              {hero.secondary ? (
                <a
                  href={hero.secondary.href || "#services"}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:opacity-95 font-semibold text-[var(--c-text)]"
                >
                  {hero.secondary.label}
                </a>
              ) : null}
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-[var(--shadow)]">
            <div className="text-xs tracking-wide uppercase text-[var(--c-text)]/60">Resumen</div>
            <div className="mt-2 text-lg font-semibold text-[var(--c-text)]">{spec?.business?.name || "Preview"}</div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-xs text-[var(--c-text)]/60">Contacto</div>
                <div className="mt-1 text-sm text-[var(--c-text)]">
                  {safeStr(contact.phone)}
                  <br />
                  {safeStr(contact.email)}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-xs text-[var(--c-text)]/60">Dirección</div>
                <div className="mt-1 text-sm text-[var(--c-text)]">{safeStr(contact.address)}</div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * ✅ Hero split (composición B) — robusto con spec v2
 */
function HeroProductSplit({ spec, data }) {
  const hero = normalizeHeroData(spec, data);
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
              <div className="text-xs tracking-wide uppercase text-[var(--c-text)]/60">{kickerLeft}</div>
              <h2 className="mt-4 text-xl font-semibold text-[var(--c-text)]">{titleLeft}</h2>
              <p className="mt-2 text-sm text-[var(--c-text)]/70 max-w-md">{descLeft}</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={(hero.secondary?.href || "#services").toString()}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:opacity-95 text-sm font-semibold text-[var(--c-text)]"
              >
                {hero.secondary?.label || "Saber más"}
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow)]">
            <div className="text-xs tracking-wide uppercase text-[var(--c-text)]/60">Tienda online</div>

            <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-[var(--c-text)] leading-tight">
              {hero.headline}
            </h1>
            {hero.subheadline ? <p className="mt-3 text-[var(--c-text)]/70">{hero.subheadline}</p> : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={(hero.primary?.href || "#contact").toString()}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[var(--c-accent)] text-white font-semibold hover:opacity-95"
              >
                {hero.primary?.label || "Ver catálogo"}
              </a>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-xs text-[var(--c-text)]/60">Teléfono</div>
                <div className="mt-1 text-sm text-[var(--c-text)]">{safeStr(contact.phone)}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-xs text-[var(--c-text)]/60">Email</div>
                <div className="mt-1 text-sm text-[var(--c-text)]">{safeStr(contact.email)}</div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function CardsGridMinimal({ data }) {
  const title = (data?.title || "Categorías").toString();
  const items = normItemsToNameDesc(data);

  return (
    <SectionWrap id={data?.id || "categories"} title={title} kicker="Explora rápido">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:opacity-95 transition"
          >
            <div className="font-semibold text-[var(--c-text)]">{it.name}</div>
            {it.description ? <div className="mt-1 text-sm text-[var(--c-text)]/70">{it.description}</div> : null}
            <div className="mt-3 text-sm text-[var(--c-accent)] font-semibold">Ver →</div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function CardsScrollerMinimal({ data }) {
  const title = (data?.title || "Categorías").toString();
  const items = normItemsToNameDesc(data);

  return (
    <SectionWrap id={data?.id || "categories"} title={title} kicker="Explora rápido">
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="min-w-[240px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:opacity-95 transition"
          >
            <div className="font-semibold text-[var(--c-text)]">{it.name}</div>
            {it.description ? <div className="mt-1 text-sm text-[var(--c-text)]/70">{it.description}</div> : null}
            <div className="mt-3 text-sm text-[var(--c-accent)] font-semibold">Abrir →</div>
          </div>
        ))}
      </div>
      <div className="h-1 rounded-full bg-[var(--border)] mt-3" />
    </SectionWrap>
  );
}

function BulletsInlineMinimal({ data }) {
  const title = (data?.title || "Por qué elegirnos").toString();
  const bullets = normBullets(data);

  return (
    <SectionWrap id={data?.id || "benefits"} title={title} kicker="Condiciones claras">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bullets.map((b, idx) => (
          <div key={idx} className="text-sm text-[var(--c-text)]/80 flex gap-2">
            <span className="mt-1 inline-block w-2 h-2 rounded-full bg-[var(--c-accent)] shrink-0" />
            <span>{b}</span>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function BenefitsCardsMinimal({ data }) {
  const title = (data?.title || "Por qué elegirnos").toString();
  const bullets = normBullets(data);

  return (
    <SectionWrap id={data?.id || "benefits"} title={title} kicker="Condiciones claras">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {bullets.map((b, idx) => (
          <div key={idx} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="text-sm font-semibold text-[var(--c-text)]">{b}</div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function ServicesGridAuto({ data }) {
  const title = (data?.title || "Servicios").toString();
  const items = normItemsToNameDesc(data);

  return (
    <SectionWrap id={data?.id || "services"} title={title}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="font-semibold text-[var(--c-text)]">{it.name}</div>
            {it.description ? <div className="mt-2 text-sm text-[var(--c-text)]/70">{it.description}</div> : null}
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function TextAuto({ data }) {
  const title = (data?.title || "Sobre nosotros").toString();
  const body = (data?.body || data?.note || "").toString();

  return (
    <SectionWrap id={data?.id || "about"} title={title}>
      <div className="text-[var(--c-text)]/80 leading-relaxed max-w-3xl text-sm">{body}</div>
    </SectionWrap>
  );
}

function ContactAuto({ spec, data }) {
  const title = (data?.title || "Contacto").toString();
  const body = (data?.body || data?.note || "").toString();
  const contact = spec?.contact || {};

  return (
    <SectionWrap id="contact" title={title}>
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div>
          <p className="text-sm text-[var(--c-text)]/70 max-w-xl">{body}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="text-xs text-[var(--c-text)]/60">Teléfono</div>
            <div className="mt-1 text-sm font-semibold text-[var(--c-text)]">{safeStr(contact.phone)}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="text-xs text-[var(--c-text)]/60">Email</div>
            <div className="mt-1 text-sm font-semibold text-[var(--c-text)]">{safeStr(contact.email)}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="text-xs text-[var(--c-text)]/60">Dirección</div>
            <div className="mt-1 text-sm font-semibold text-[var(--c-text)]">{safeStr(contact.address)}</div>
          </div>
        </div>
      </div>
    </SectionWrap>
  );
}

function ContactSplitMinimal({ spec, data }) {
  const title = (data?.title || "Contacto").toString();
  const body = (data?.body || data?.note || "Escríbenos y te respondemos en breve.").toString();
  const contact = spec?.contact || {};

  return (
    <SectionWrap id="contact" title={title}>
      <div className="grid gap-8 lg:grid-cols-2 items-start">
        <div>
          <p className="text-sm text-[var(--c-text)]/70 max-w-xl">{body}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="text-xs text-[var(--c-text)]/60">Teléfono</div>
            <div className="mt-1 text-sm font-semibold text-[var(--c-text)]">{safeStr(contact.phone)}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="text-xs text-[var(--c-text)]/60">Email</div>
            <div className="mt-1 text-sm font-semibold text-[var(--c-text)]">{safeStr(contact.email)}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="text-xs text-[var(--c-text)]/60">Dirección</div>
            <div className="mt-1 text-sm font-semibold text-[var(--c-text)]">{safeStr(contact.address)}</div>
          </div>
        </div>
      </div>
    </SectionWrap>
  );
}

function ContactCenterMinimal({ spec, data }) {
  const title = (data?.title || "Contacto").toString();
  const body = (data?.body || data?.note || "Escríbenos y te respondemos en breve.").toString();
  const contact = spec?.contact || {};

  return (
    <SectionWrap id="contact" title={title} kicker="Hablemos">
      <div className="max-w-2xl mx-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="text-sm text-[var(--c-text)]/70">{body}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--c-text)]">
            {safeStr(contact.phone)}
          </div>
          <div className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--c-text)]">
            {safeStr(contact.email)}
          </div>
        </div>

        {contact.address ? <div className="mt-4 text-xs text-[var(--c-text)]/60">{contact.address}</div> : null}
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
  hero_product_split_v1: HeroProductSplit,
};

const SECTION_MAP = {
  // ecommerce + base
  categories_grid_min_v1: CardsGridMinimal,
  categories_scroller_min_v1: CardsScrollerMinimal,
  benefits_inline_min_v1: BulletsInlineMinimal,
  benefits_cards_min_v1: BenefitsCardsMinimal,

  // generic packs
  services_grid_auto_v1: ServicesGridAuto,
  text_auto_v1: TextAuto,

  // contact
  contact_auto_v1: ContactAuto,
  contact_split_min_v1: ContactSplitMinimal,
  contact_center_min_v1: ContactCenterMinimal,

  // bridge (legacy names)
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

  const theme = useMemo(() => safeResolveTheme(spec), [spec]);
  const themeStyle = useMemo(() => safeToStyleVars(theme.vars), [theme]);

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
          return <Comp key={idx} spec={spec} data={data} />;
        }

        // fallback debug visible (no rompe build)
        return (
          <SectionWrap key={idx} title={`Módulo no soportado: ${cap(s.module)}`}>
            <div className="text-sm text-red-600">
              No hay renderer para variant <b>{s.variant}</b>
            </div>
            <pre className="mt-3 text-xs bg-gray-50 border rounded-xl p-4 overflow-auto">
              {JSON.stringify({ module: s.module, variant: s.variant, props_ref: s.props_ref, data }, null, 2)}
            </pre>
          </SectionWrap>
        );
      })}

      <Footer spec={spec} />
    </div>
  );
}
