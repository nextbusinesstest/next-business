import React from "react";

function getByRef(spec, ref) {
  if (!ref) return null;
  const key = ref.startsWith("modules.") ? ref.replace("modules.", "") : ref;
  return spec?.modules?.[key] ?? null;
}

function SectionWrap({ id, children, dense = false }) {
  return (
    <section id={id} className={dense ? "py-10" : "py-16"}>
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </section>
  );
}

function Title({ title, subtitle }) {
  return (
    <div className="mb-8">
      {subtitle ? (
        <div className="text-xs font-semibold tracking-wider text-gray-500">{subtitle}</div>
      ) : null}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function Header({ spec }) {
  const name = spec?.business?.name || "Preview";
  const pack = spec?.layout?.pack || "Layout";
  const subtitle =
    pack === "ecommerce_conversion"
      ? "Ecommerce conversion layout"
      : pack === "local_service_trust"
      ? "Local service trust layout"
      : pack;

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold"
            style={{ background: "var(--c-primary)" }}
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{name}</div>
            <div className="text-xs text-gray-500">{subtitle}</div>
          </div>
        </div>

        <nav className="flex items-center gap-4 text-sm">
          <a className="text-gray-700 hover:text-gray-900" href="#contact">
            Contacto
          </a>
        </nav>
      </div>
    </header>
  );
}

function Footer({ spec }) {
  const left = spec?.business?.name || "Preview";
  const right =
    spec?.brand?.brand_personality
      ? `${spec.brand.brand_personality} · ${spec.strategy?.web_strategy || ""}`
      : "Next Business";

  return (
    <footer className="border-t bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-xs text-gray-500">
        <div>{left}</div>
        <div>{right}</div>
      </div>
    </footer>
  );
}

/* -----------------------------
   HERO Variants
----------------------------- */

function HeroMinimal({ spec, data }) {
  const headline = data?.headline || spec?.seo?.title || spec?.business?.name || "Preview";
  const subheadline = data?.subheadline || spec?.seo?.description || "";
  const primary = data?.primary_cta || { label: "Ver más", href: "#categories" };
  const secondary = data?.secondary_cta || { label: "Contacto", href: "#contact" };

  return (
    <section className="pt-16 pb-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight">{headline}</h1>
            {subheadline ? <p className="mt-4 text-lg text-gray-600">{subheadline}</p> : null}

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={primary.href || "#"}
                className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white"
                style={{ background: "var(--c-primary)" }}
              >
                {primary.label || "Ver más"}
              </a>
              <a
                href={secondary.href || "#"}
                className="inline-flex items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold"
              >
                {secondary.label || "Contacto"}
              </a>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold tracking-wider text-gray-500">RESUMEN</div>
            <div className="mt-2 text-xl font-semibold">{spec?.business?.name || "Preview"}</div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border p-4">
                <div className="text-xs font-semibold text-gray-500">Contacto</div>
                <div className="mt-2 text-sm text-gray-800">
                  {spec?.contact?.phone ? <div>{spec.contact.phone}</div> : null}
                  {spec?.contact?.email ? <div>{spec.contact.email}</div> : null}
                </div>
              </div>
              {spec?.contact?.address ? (
                <div className="rounded-2xl border p-4">
                  <div className="text-xs font-semibold text-gray-500">Dirección</div>
                  <div className="mt-2 text-sm text-gray-800">{spec.contact.address}</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ✅ Composición B: “split hero” con placeholder visual + copy
function HeroSplit({ spec, data }) {
  const headline = data?.headline || spec?.seo?.title || spec?.business?.name || "Preview";
  const subheadline = data?.subheadline || spec?.seo?.description || "";
  const primary = data?.primary_cta || { label: "Ver categorías", href: "#categories" };
  const secondary = data?.secondary_cta || { label: "Ver condiciones", href: "#benefits" };

  return (
    <section className="pt-14 pb-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
          {/* “Imagen” / bloque visual */}
          <div className="rounded-[28px] border bg-white shadow-sm overflow-hidden">
            <div
              className="h-full min-h-[280px] flex flex-col justify-between p-8"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,0,0,0.04), rgba(0,0,0,0.02))",
              }}
            >
              <div className="text-xs font-semibold tracking-wider text-gray-500">
                DESTACADO
              </div>

              <div className="mt-6">
                <div className="text-2xl font-semibold tracking-tight">
                  Compra con claridad
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Envío, devoluciones y soporte: sin sorpresas.
                </div>
              </div>

              <div className="mt-10 flex gap-2">
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ background: "var(--c-primary)" }}
                >
                  Pago seguro
                </span>
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold">
                  Devoluciones
                </span>
              </div>
            </div>
          </div>

          {/* Copy + CTAs */}
          <div className="rounded-[28px] border bg-white p-8 shadow-sm">
            <div className="text-xs font-semibold tracking-wider text-gray-500">TIENDA ONLINE</div>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight">{headline}</h1>
            {subheadline ? <p className="mt-4 text-lg text-gray-600">{subheadline}</p> : null}

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={primary.href || "#"}
                className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                style={{ background: "var(--c-primary)" }}
              >
                {primary.label || "Ver categorías"}
              </a>
              <a
                href={secondary.href || "#"}
                className="inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold"
              >
                {secondary.label || "Ver condiciones"}
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <div className="text-xs font-semibold text-gray-500">Teléfono</div>
                <div className="mt-1 text-sm font-semibold">{spec?.contact?.phone || "-"}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs font-semibold text-gray-500">Email</div>
                <div className="mt-1 text-sm font-semibold">{spec?.contact?.email || "-"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Hero({ spec, data, variant }) {
  switch (variant) {
    case "hero_product_split_v1":
      return <HeroSplit spec={spec} data={data} />;
    case "hero_product_minimal_v1":
    default:
      return <HeroMinimal spec={spec} data={data} />;
  }
}

/* -----------------------------
   Cards Variants (Categories)
----------------------------- */

function CardsGrid({ id, data }) {
  const title = data?.title || "Categorías";
  const items = Array.isArray(data?.items) ? data.items : [];

  return (
    <SectionWrap id={id}>
      <Title title={title} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-lg font-semibold">{it.name || it.title || "Item"}</div>
            {it.description ? <div className="mt-2 text-sm text-gray-600">{it.description}</div> : null}
            <div className="mt-4 inline-flex items-center text-sm font-semibold" style={{ color: "var(--c-accent)" }}>
              Ver →
            </div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

// ✅ Composición B: scroller horizontal
function CardsScroller({ id, data }) {
  const title = data?.title || "Categorías";
  const items = Array.isArray(data?.items) ? data.items : [];

  return (
    <SectionWrap id={id} dense>
      <Title title={title} subtitle="Explora rápido" />
      <div className="flex gap-4 overflow-auto pb-2">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="min-w-[260px] rounded-2xl border bg-white p-5 shadow-sm"
          >
            <div className="text-lg font-semibold">{it.name || it.title || "Item"}</div>
            {it.description ? <div className="mt-2 text-sm text-gray-600">{it.description}</div> : null}
            <div className="mt-4 inline-flex items-center text-sm font-semibold" style={{ color: "var(--c-accent)" }}>
              Abrir →
            </div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function Cards({ id, data, variant }) {
  if (variant === "categories_scroller_min_v1") {
    return <CardsScroller id={id} data={data} />;
  }
  // default / A
  return <CardsGrid id={id} data={data} />;
}

/* -----------------------------
   Benefits Variants (Bullets)
----------------------------- */

function BenefitsInline({ id, data }) {
  const title = data?.title || "Beneficios";
  const bullets = Array.isArray(data?.bullets) ? data.bullets : [];

  return (
    <SectionWrap id={id} dense>
      <Title title={title} />
      <ul className="grid gap-3">
        {bullets.map((b, idx) => (
          <li key={idx} className="flex gap-3">
            <span className="mt-2 inline-block h-2 w-2 rounded-full" style={{ background: "var(--c-accent)" }} />
            <span className="text-gray-700">{b}</span>
          </li>
        ))}
      </ul>
    </SectionWrap>
  );
}

// ✅ Composición B: beneficios en cards
function BenefitsCards({ id, data }) {
  const title = data?.title || "Beneficios";
  const bullets = Array.isArray(data?.bullets) ? data.bullets : [];

  return (
    <SectionWrap id={id}>
      <Title title={title} subtitle="Condiciones claras" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bullets.map((b, idx) => (
          <div key={idx} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold" style={{ color: "var(--c-accent)" }}>
              ✓
            </div>
            <div className="mt-2 text-sm text-gray-700">{b}</div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function Bullets({ id, data, variant }) {
  if (variant === "benefits_cards_min_v1") {
    return <BenefitsCards id={id} data={data} />;
  }
  // default / A
  return <BenefitsInline id={id} data={data} />;
}

/* -----------------------------
   Services Grid (sin variante de momento)
----------------------------- */

function ServicesGrid({ id, data }) {
  const title = data?.title || "Servicios";
  const items = Array.isArray(data?.items) ? data.items : [];

  return (
    <SectionWrap id={id}>
      <Title title={title} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="font-semibold">{it.name || "Servicio"}</div>
            {it.description ? <div className="mt-2 text-sm text-gray-600">{it.description}</div> : null}
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

/* -----------------------------
   Text Section (sin variante de momento)
----------------------------- */

function TextSection({ id, data }) {
  const title = data?.title || "Sobre nosotros";
  const body = data?.body || "";

  return (
    <SectionWrap id={id}>
      <Title title={title} />
      <div className="max-w-3xl text-gray-700 leading-relaxed">{body}</div>
    </SectionWrap>
  );
}

/* -----------------------------
   Contact Variants
----------------------------- */

function ContactSplit({ id, spec, data }) {
  const title = data?.title || "Contacto";
  const body = data?.body || "Ponte en contacto y te respondemos pronto.";

  return (
    <SectionWrap id={id}>
      <Title title={title} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">TELÉFONO</div>
          <div className="mt-2 font-semibold">{spec?.contact?.phone || "-"}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">EMAIL</div>
          <div className="mt-2 font-semibold">{spec?.contact?.email || "-"}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-gray-500">DIRECCIÓN</div>
          <div className="mt-2 font-semibold">{spec?.contact?.address || "-"}</div>
        </div>
      </div>

      <div className="mt-8 max-w-3xl text-gray-700">{body}</div>
    </SectionWrap>
  );
}

// ✅ Composición B: contacto centrado en card
function ContactCenter({ id, spec, data }) {
  const title = data?.title || "Contacto";
  const body = data?.body || "Ponte en contacto y te respondemos pronto.";

  return (
    <SectionWrap id={id}>
      <div className="mx-auto max-w-2xl rounded-[28px] border bg-white p-8 shadow-sm text-center">
        <div className="text-xs font-semibold tracking-wider text-gray-500">HABLEMOS</div>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-3 text-gray-600">{body}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a
            href={spec?.contact?.phone ? `tel:${spec.contact.phone.replace(/\s/g, "")}` : "#"}
            className="rounded-2xl border px-5 py-3 text-sm font-semibold"
          >
            {spec?.contact?.phone || "Teléfono"}
          </a>
          <a
            href={spec?.contact?.email ? `mailto:${spec.contact.email}` : "#"}
            className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
            style={{ background: "var(--c-primary)" }}
          >
            {spec?.contact?.email || "Email"}
          </a>
        </div>

        {spec?.contact?.address ? (
          <div className="mt-6 text-xs text-gray-500">{spec.contact.address}</div>
        ) : null}
      </div>
    </SectionWrap>
  );
}

function Contact({ id, spec, data, variant }) {
  if (variant === "contact_center_min_v1") {
    return <ContactCenter id={id} spec={spec} data={data} />;
  }
  // default / A
  return <ContactSplit id={id} spec={spec} data={data} />;
}

/* -----------------------------
   Main Router (V2)
----------------------------- */

export default function PacksRouter({ spec }) {
  const sections = spec?.layout?.pages?.home?.sections || [];

  // Un truco simple: density controla spacing general (light = más aire)
  const density = spec?.brand?.brand_expression?.density || "medium";

  return (
    <div className={density === "light" ? "text-[15px]" : "text-[16px]"}>
      <Header spec={spec} />

      {/* HERO */}
      {sections
        .filter((s) => s.module === "hero")
        .map((s, idx) => (
          <Hero
            key={`hero-${idx}`}
            spec={spec}
            data={getByRef(spec, s.props_ref)}
            variant={s.variant}
          />
        ))}

      {/* RESTO */}
      {sections
        .filter((s) => s.module !== "hero")
        .map((s, idx) => {
          const data = getByRef(spec, s.props_ref);
          const id = data?.id || (s.module === "contact" ? "contact" : `section-${idx}`);

          switch (s.module) {
            case "cards":
              return <Cards key={idx} id={id} data={data} variant={s.variant} />;

            case "bullets":
              return <Bullets key={idx} id={id} data={data} variant={s.variant} />;

            case "services_grid":
              return <ServicesGrid key={idx} id={id} data={data} />;

            case "text":
              return <TextSection key={idx} id={id} data={data} />;

            case "contact":
              return <Contact key={idx} id={"contact"} spec={spec} data={data} variant={s.variant} />;

            default:
              // fallback: para módulos aún no implementados
              return (
                <SectionWrap key={idx} id={id}>
                  <Title title={data?.title || s.module} subtitle="Módulo sin renderer" />
                  <pre className="rounded-xl border bg-white p-4 text-xs overflow-auto">
                    {JSON.stringify({ module: s.module, variant: s.variant, data }, null, 2)}
                  </pre>
                </SectionWrap>
              );
          }
        })}

      <Footer spec={spec} />
    </div>
  );
}
