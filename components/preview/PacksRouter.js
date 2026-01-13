import React from "react";

function getByRef(spec, ref) {
  if (!ref) return null;
  const key = ref.startsWith("modules.") ? ref.replace("modules.", "") : ref;
  return spec?.modules?.[key] ?? null;
}

function SectionWrap({ id, children }) {
  return (
    <section id={id} className="py-16">
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </section>
  );
}

function Hero({ spec, data }) {
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
            {subheadline ? (
              <p className="mt-4 text-lg text-gray-600">{subheadline}</p>
            ) : null}

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

function Title({ title, subtitle }) {
  return (
    <div className="mb-8">
      {subtitle ? <div className="text-xs font-semibold tracking-wider text-gray-500">{subtitle}</div> : null}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function Cards({ id, data }) {
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
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function Bullets({ id, data }) {
  const title = data?.title || "Beneficios";
  const bullets = Array.isArray(data?.bullets) ? data.bullets : [];

  return (
    <SectionWrap id={id}>
      <Title title={title} />
      <ul className="grid gap-3">
        {bullets.map((b, idx) => (
          <li key={idx} className="flex gap-3">
            <span
              className="mt-2 inline-block h-2 w-2 rounded-full"
              style={{ background: "var(--c-accent)" }}
            />
            <span className="text-gray-700">{b}</span>
          </li>
        ))}
      </ul>
    </SectionWrap>
  );
}

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

function Contact({ id, spec, data }) {
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

function Header({ spec }) {
  const name = spec?.business?.name || "Preview";
  const subtitle =
    spec?.layout?.pack === "ecommerce_conversion"
      ? "Ecommerce conversion layout"
      : spec?.layout?.pack === "local_service_trust"
      ? "Local service trust layout"
      : spec?.layout?.pack || "Layout";

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

export default function PacksRouter({ spec }) {
  const sections = spec?.layout?.pages?.home?.sections || [];

  return (
    <div>
      <Header spec={spec} />

      {/* HERO siempre al principio si existe */}
      {sections
        .filter((s) => s.module === "hero")
        .map((s, idx) => (
          const heroVariant = s.variant;
          return <Hero key={`hero-${idx}`} spec={spec} data={getByRef(spec, s.props_ref)} variant={heroVariant} />;
        ))}

      {/* Resto de secciones */}
      {sections
        .filter((s) => s.module !== "hero")
        .map((s, idx) => {
          const data = getByRef(spec, s.props_ref);
          const id = data?.id || s.module || `section-${idx}`;

          switch (s.module) {
            case "cards":
              return <Cards key={idx} id={id} data={data} />;
            case "bullets":
              return <Bullets key={idx} id={id} data={data} />;
            case "services_grid":
              return <ServicesGrid key={idx} id={id} data={data} />;
            case "text":
              return <TextSection key={idx} id={id} data={data} />;
            case "contact":
              return <Contact key={idx} id={id} spec={spec} data={data} />;
            default:
              // fallback: muestra algo para no “silenciar” módulos desconocidos
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
