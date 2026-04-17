import { useMemo, useState } from "react";
import { resolveTheme, toStyleVars } from "../../lib/themes";

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

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getByRef(spec, ref) {
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

function safeStr(v, fallback = "") {
  const t = (v ?? "").toString().trim();
  return t || fallback;
}

function normTitle(x) {
  if (!x) return "";
  return (x.title || x.name || "").toString().trim();
}

function normDesc(x) {
  if (!x) return "";
  return (x.description || x.desc || x.body || x.note || x.a || "").toString().trim();
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
  const headline = (data?.headline || spec?.business?.name || "").toString().trim();
  const subheadline = (
    data?.subheadline ||
    (spec?.business?.sector && spec?.business?.location
      ? `${spec.business.sector} · ${spec.business.location}`
      : spec?.business?.sector || spec?.business?.location || "")
  ).toString().trim();
  const ctaPrimaryLabel = (data?.cta_primary || data?.primary_cta?.label || "").toString().trim();
  const ctaSecondaryLabel = (data?.cta_secondary || data?.secondary_cta?.label || "").toString().trim();
  const primary = ctaPrimaryLabel ? { label: ctaPrimaryLabel, href: "#contact" } : null;
  const secondary = ctaSecondaryLabel ? { label: ctaSecondaryLabel, href: "#services" } : null;
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

function applyArchetypeOverrides(vars, archetype) {
  const v = { ...(vars || {}) };

  function clampHex(x) {
    const s = String(x || "").trim();
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s) ? s : "";
  }
  function hexToRgb01(hex) {
    const h = clampHex(hex);
    if (!h) return null;
    const parts =
      h.length === 4
        ? [h[1] + h[1], h[2] + h[2], h[3] + h[3]]
        : [h.slice(1, 3), h.slice(3, 5), h.slice(5, 7)];
    const [r, g, b] = parts.map((p) => parseInt(p, 16) / 255);
    return { r, g, b };
  }
  function luma(hex) {
    const rgb = hexToRgb01(hex);
    if (!rgb) return null;
    return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  }

  const bg = v["--c-bg"];
  const L = luma(bg);
  const isDark = L != null && L < 0.25;

  if (archetype === "saas_landing_v1") {
    v["--section-py"] = "52px";
    v["--shadow"] = isDark ? "0_28px_95px_rgba(0,0,0,0.55)" : "0_24px_70px_rgba(2,6,23,0.14)";
    v["--r-sm"] = "14px";
    v["--r-md"] = "18px";
    v["--r-lg"] = "26px";
    if (!isDark) { v["--surface-2"] = "#f6f7fb"; v["--border"] = "#e6e8f0"; }
  }
  if (archetype === "booking_trust_v1") {
    v["--section-py"] = "72px";
    v["--shadow"] = isDark ? "0_24px_85px_rgba(0,0,0,0.45)" : "0_18px_55px_rgba(15,23,42,0.10)";
    v["--r-sm"] = "16px";
    v["--r-md"] = "20px";
    v["--r-lg"] = "28px";
    if (!isDark) { v["--surface-2"] = "#f7fafc"; v["--border"] = "#e2e8f0"; }
  }
  if (archetype === "ecommerce_premium_v1") {
    v["--section-py"] = "56px";
    v["--shadow"] = isDark ? "0_28px_100px_rgba(0,0,0,0.55)" : "0_22px_70px_rgba(2,6,23,0.18)";
    v["--r-sm"] = "14px";
    v["--r-md"] = "18px";
    v["--r-lg"] = "28px";
  }

  return v;
}

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------

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
          <div className="text-xs tracking-wide uppercase text-[var(--c-text)]/50">{kicker}</div>
        ) : null}
        {title ? (
          <h2 className="mt-2 text-2xl font-semibold text-[var(--c-text)]">{title}</h2>
        ) : null}
        <div className={cx(title ? "mt-6" : "")}>{children}</div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Shared contact primitives
// ---------------------------------------------------------------------------

function ContactForm({ contact, ctaLabel = "Enviar mensaje", compact = false }) {
  const [status, setStatus] = useState("idle");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    const form = e.target;
    const fd = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone") || "",
          message: fd.get("message"),
          _to: contact?.email || "",
        }),
      });
      if (res.ok) {
        setStatus("ok");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const inputCls =
    "w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--c-text)] outline-none focus:border-[var(--c-accent)] focus:bg-[var(--surface)] transition-colors placeholder:text-[var(--c-text)]/40";

  if (status === "ok") {
    return (
      <div className="py-8 text-center">
        <div className="font-semibold text-[var(--c-text)]">Mensaje recibido</div>
        <div className="mt-2 text-sm text-[var(--c-text)]/60">
          Te respondemos lo antes posible.
        </div>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-xs text-[var(--c-accent)] underline underline-offset-2"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className={cx("grid gap-3", compact ? "" : "sm:grid-cols-2")}>
        <input name="name" type="text" placeholder="Nombre" required className={inputCls} />
        <input name="email" type="email" placeholder="Email" required className={inputCls} />
      </div>
      <input name="phone" type="tel" placeholder="Teléfono (opcional)" className={inputCls} />
      <textarea
        name="message"
        rows={compact ? 3 : 4}
        placeholder="¿En qué podemos ayudarte?"
        required
        className={inputCls}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex items-center justify-center px-6 py-3 rounded-[var(--r-sm)] bg-[var(--c-accent)] text-white font-semibold text-sm hover:opacity-95 disabled:opacity-50 transition-opacity"
      >
        {status === "loading" ? "Enviando…" : ctaLabel}
      </button>
      {status === "error" ? (
        <div className="text-xs text-red-500">Ha ocurrido un error. Inténtalo de nuevo.</div>
      ) : null}
    </form>
  );
}

function ContactInfo({ contact, centered = false }) {
  const { phone, email, address } = contact || {};
  if (!phone && !email && !address) return null;

  return (
    <div className={cx("mt-6 flex flex-wrap gap-x-6 gap-y-2", centered ? "justify-center" : "")}>
      {phone ? (
        <a
          href={`tel:${phone}`}
          className="text-sm text-[var(--c-text)]/60 hover:text-[var(--c-accent)] transition-colors"
        >
          {phone}
        </a>
      ) : null}
      {email ? (
        <a
          href={`mailto:${email}`}
          className="text-sm text-[var(--c-text)]/60 hover:text-[var(--c-accent)] transition-colors"
        >
          {email}
        </a>
      ) : null}
      {address ? (
        <span className="text-sm text-[var(--c-text)]/50">{address}</span>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header variants
// ---------------------------------------------------------------------------

function HeaderMinimal({ spec }) {
  const brandName = spec?.business?.name || spec?.brand?.name || "";
  const sector = spec?.business?.sector || "";
  const navItems = spec?.navigation?.items || [];

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-20">
      <Container>
        <div className="py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[var(--c-accent)]/15 flex items-center justify-center text-[var(--c-accent)] font-semibold text-sm shrink-0">
              {(brandName || "N").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-[var(--c-text)] truncate leading-tight">{brandName}</div>
              {sector ? (
                <div className="text-xs text-[var(--c-text)]/50 truncate">{sector}</div>
              ) : null}
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-5 text-sm text-[var(--c-text)]/70">
            {navItems.map((it) => (
              <a
                key={it.href || it.label}
                href={it.href}
                className="hover:text-[var(--c-text)] transition-colors"
              >
                {it.label}
              </a>
            ))}
            <a
              href="#contact"
              className="ml-1 inline-flex items-center justify-center px-4 py-2 rounded-full border border-[var(--border)] text-[var(--c-text)] hover:border-[var(--c-accent)] hover:text-[var(--c-accent)] transition-colors text-sm"
            >
              Contacto
            </a>
          </nav>

          <a
            href="#contact"
            className="md:hidden inline-flex items-center justify-center px-3 py-2 rounded-full border border-[var(--border)] text-sm text-[var(--c-text)]"
          >
            Contacto
          </a>
        </div>
      </Container>
    </header>
  );
}

function HeaderTrust({ spec }) {
  const brandName = spec?.business?.name || spec?.brand?.name || "";
  const sector = spec?.business?.sector || "";
  const phone = spec?.contact?.phone || "";

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-20">
      <Container>
        <div className="py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[var(--c-primary)] text-[var(--surface)] flex items-center justify-center font-semibold text-sm shrink-0">
              {(brandName || "N").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-[var(--c-text)] truncate leading-tight">{brandName}</div>
              {sector ? (
                <div className="text-xs text-[var(--c-text)]/50 truncate">{sector}</div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-full bg-[var(--c-primary)] text-[var(--surface)] text-sm font-semibold hover:opacity-90"
              >
                {phone}
              </a>
            ) : null}
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-[var(--border)] text-[var(--c-text)] hover:border-[var(--c-accent)] transition-colors text-sm"
            >
              Contactar
            </a>
          </div>
        </div>
      </Container>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function FooterSimple({ spec }) {
  const brandName = spec?.business?.name || spec?.brand?.name || "";
  const sector = spec?.business?.sector || "";
  const location = spec?.business?.location || "";
  const email = spec?.contact?.email || "";
  const phone = spec?.contact?.phone || "";
  const year = new Date().getFullYear();
  const tagline = [sector, location].filter(Boolean).join(" · ");

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <Container>
        <div className="py-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <div className="font-semibold text-[var(--c-text)]">{brandName}</div>
            {tagline ? (
              <div className="mt-1 text-[var(--c-text)]/50">{tagline}</div>
            ) : null}
          </div>

          {(phone || email) ? (
            <div className="flex flex-col gap-2">
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="text-[var(--c-text)]/60 hover:text-[var(--c-accent)] transition-colors"
                >
                  {phone}
                </a>
              ) : null}
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="text-[var(--c-text)]/60 hover:text-[var(--c-accent)] transition-colors"
                >
                  {email}
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="text-[var(--c-text)]/35">© {year} {brandName}</div>
        </div>
      </Container>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Hero variants
// ---------------------------------------------------------------------------

function HeroProductMinimal({ spec, data }) {
  const hero = normalizeHeroData(spec, data);
  const sector = spec?.business?.sector || "";
  const target = spec?.business?.target_audience || "";
  const location = spec?.business?.location || "";

  return (
    <section className="py-16">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold text-[var(--c-text)] leading-tight">
              {hero.headline}
            </h1>
            {hero.subheadline ? (
              <p className="mt-4 text-[var(--c-text)]/70 max-w-xl leading-relaxed">
                {hero.subheadline}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              {hero.primary ? (
                <a
                  href={hero.primary.href}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[var(--c-accent)] text-white font-semibold hover:opacity-95"
                >
                  {hero.primary.label}
                </a>
              ) : null}
              {hero.secondary ? (
                <a
                  href={hero.secondary.href}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-[var(--border)] text-[var(--c-text)] hover:opacity-95 font-semibold"
                >
                  {hero.secondary.label}
                </a>
              ) : null}
            </div>
          </div>

          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--r-lg)] p-6 shadow-[var(--shadow)]">
            {location ? (
              <div className="text-xs tracking-wide uppercase text-[var(--c-text)]/50">{location}</div>
            ) : null}
            <div className="mt-2 text-base font-semibold text-[var(--c-text)]">
              {sector || "Servicio profesional"}
            </div>
            {target ? (
              <div className="mt-2 text-sm text-[var(--c-text)]/70 leading-relaxed">
                Orientado a {target}.
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

function HeroProductSplit({ spec, data }) {
  const hero = normalizeHeroData(spec, data);
  const kicker = safeStr(data?.kicker, spec?.business?.sector || "");
  const location = spec?.business?.location || "";

  return (
    <section className="py-16">
      <Container>
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-8 flex flex-col justify-between">
            <div>
              {kicker ? (
                <div className="text-xs tracking-wide uppercase text-[var(--c-text)]/50">{kicker}</div>
              ) : null}
              <h2 className="mt-4 text-xl font-semibold text-[var(--c-text)]">
                {safeStr(data?.secondary_headline, "Información clara")}
              </h2>
              <p className="mt-2 text-sm text-[var(--c-text)]/70 leading-relaxed">
                {safeStr(data?.secondary_body, "Todo lo que necesitas saber antes de decidir.")}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#services"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-[var(--border)] text-[var(--c-text)] hover:opacity-95 text-sm font-semibold"
              >
                Ver servicios
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[var(--c-accent)] text-white hover:opacity-95 text-sm font-semibold"
              >
                Contactar
              </a>
            </div>
          </div>

          <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow)]">
            {location ? (
              <div className="text-xs tracking-wide uppercase text-[var(--c-text)]/50">{location}</div>
            ) : null}
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-[var(--c-text)] leading-tight">
              {hero.headline}
            </h1>
            {hero.subheadline ? (
              <p className="mt-3 text-[var(--c-text)]/70 leading-relaxed">{hero.subheadline}</p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              {hero.primary ? (
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[var(--c-accent)] text-white font-semibold hover:opacity-95"
                >
                  {hero.primary.label}
                </a>
              ) : null}
              {hero.secondary ? (
                <a
                  href="#services"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-[var(--border)] text-[var(--c-text)] hover:opacity-95 font-semibold"
                >
                  {hero.secondary.label}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function HeroSaasSplit({ spec, data }) {
  const hero = normalizeHeroData(spec, data);
  const badges = Array.isArray(data?.badges) && data.badges.length
    ? data.badges
    : ["Implantación rápida", "KPIs en tiempo real", "Soporte incluido"];

  return (
    <section className="py-16">
      <Container>
        <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-8 shadow-[var(--shadow)]">
          <div className="grid gap-8 lg:grid-cols-2 items-start">
            <div>
              {spec?.business?.sector ? (
                <div className="text-xs tracking-wide uppercase text-[var(--c-text)]/50">
                  {spec.business.sector}
                </div>
              ) : null}
              <h1 className="mt-3 text-4xl md:text-5xl font-semibold text-[var(--c-text)] leading-tight">
                {hero.headline}
              </h1>
              {hero.subheadline ? (
                <p className="mt-4 text-[var(--c-text)]/70 max-w-xl leading-relaxed">
                  {hero.subheadline}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span
                    key={b}
                    className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--c-text)]/70"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {hero.primary ? (
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[var(--c-accent)] text-white font-semibold hover:opacity-95"
                  >
                    {hero.primary.label}
                  </a>
                ) : null}
                {hero.secondary ? (
                  <a
                    href="#services"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-[var(--border)] text-[var(--c-text)] hover:opacity-95 font-semibold"
                  >
                    {hero.secondary.label}
                  </a>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="text-xs text-[var(--c-text)]/50">Resultado</div>
                <div className="mt-1 text-sm font-semibold text-[var(--c-text)]">
                  {safeStr(data?.result_headline, "Menos fricción. Más control.")}
                </div>
                <div className="mt-2 text-sm text-[var(--c-text)]/70 leading-relaxed">
                  {safeStr(data?.result_body, "Centraliza, automatiza y mide resultados desde el primer día.")}
                </div>
              </div>
              <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="text-xs text-[var(--c-text)]/50">Primeros pasos</div>
                <ol className="mt-2 space-y-1.5 text-sm text-[var(--c-text)]/70">
                  <li>1. Solicita una demo</li>
                  <li>2. Configuración guiada</li>
                  <li>3. Primeros resultados</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section modules
// ---------------------------------------------------------------------------

function StepsAuto({ data }) {
  const title = (data?.title || "Cómo funciona").toString();
  const items = (Array.isArray(data?.items) ? data.items : [])
    .map((it) => typeof it === "string"
      ? { title: it, description: "" }
      : { title: normTitle(it), description: normDesc(it) })
    .filter((it) => it.title);

  return (
    <SectionWrap id={data?.id || "how"} title={title} kicker="Proceso">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="text-xs font-semibold text-[var(--c-accent)]">Paso {idx + 1}</div>
            <div className="mt-2 font-semibold text-[var(--c-text)]">{it.title}</div>
            {it.description ? (
              <div className="mt-2 text-sm text-[var(--c-text)]/70 leading-relaxed">{it.description}</div>
            ) : null}
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function TestimonialsAuto({ data }) {
  const title = (data?.title || "Opiniones").toString();
  const items = (Array.isArray(data?.items) ? data.items : [])
    .map((it) => typeof it === "string"
      ? { quote: it, name: "Cliente", role: "" }
      : {
          quote: (it.quote || it.text || "").toString().trim(),
          name: (it.name || "Cliente").toString().trim(),
          role: (it.role || "").toString().trim(),
        })
    .filter((it) => it.quote);

  return (
    <SectionWrap id={data?.id || "testimonials"} title={title} kicker="Confianza">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="text-sm text-[var(--c-text)]/80 leading-relaxed">"{it.quote}"</div>
            <div className="mt-4 text-sm font-semibold text-[var(--c-text)]">{it.name}</div>
            {it.role ? <div className="text-xs text-[var(--c-text)]/50">{it.role}</div> : null}
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function FaqAuto({ data }) {
  const title = (data?.title || "Preguntas frecuentes").toString();
  const items = (Array.isArray(data?.items) ? data.items : [])
    .map((it) => typeof it === "string"
      ? { q: it, a: "" }
      : {
          q: (it.q || it.question || it.title || "").toString().trim(),
          a: (it.a || it.answer || it.description || "").toString().trim(),
        })
    .filter((it) => it.q);

  return (
    <SectionWrap id={data?.id || "faq"} title={title} kicker="FAQ">
      <div className="grid gap-2">
        {items.map((it, idx) => (
          <details
            key={idx}
            className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <summary className="cursor-pointer text-sm font-semibold text-[var(--c-text)] list-none flex items-center justify-between gap-3">
              {it.q}
              <span className="text-[var(--c-text)]/40 shrink-0 text-base leading-none">+</span>
            </summary>
            {it.a ? (
              <div className="mt-3 text-sm text-[var(--c-text)]/70 leading-relaxed">{it.a}</div>
            ) : null}
          </details>
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
          <div key={idx} className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="font-semibold text-[var(--c-text)]">{it.name}</div>
            {it.description ? (
              <div className="mt-2 text-sm text-[var(--c-text)]/70 leading-relaxed">{it.description}</div>
            ) : null}
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function ServicesGridSaas({ data }) {
  const title = (data?.title || "Soluciones").toString();
  const items = normItemsToNameDesc(data);

  return (
    <SectionWrap id={data?.id || "services"} title={title} kicker="Módulos">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-[var(--c-text)]">{it.name}</div>
              <span className="text-xs px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--c-text)]/60 shrink-0">
                Módulo
              </span>
            </div>
            <div className="mt-2 text-sm text-[var(--c-text)]/70 leading-relaxed">
              {it.description || "Configurable según tu proceso y equipo."}
            </div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function ServicesGridBooking({ data }) {
  const title = (data?.title || "Servicios").toString();
  const items = normItemsToNameDesc(data);

  return (
    <SectionWrap id={data?.id || "services"} title={title} kicker="Atención">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, idx) => (
          <div key={idx} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-[var(--c-accent)]/15 text-[var(--c-accent)] font-bold text-sm shrink-0">
                +
              </span>
              <div className="font-semibold text-[var(--c-text)]">{it.name}</div>
            </div>
            {it.description ? (
              <div className="mt-3 text-sm text-[var(--c-text)]/70 leading-relaxed">{it.description}</div>
            ) : null}
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function BulletsSaasChecks({ data }) {
  const title = (data?.title || "Por qué elegirnos").toString();
  const bullets = normBullets(data);

  return (
    <SectionWrap id={data?.id || "benefits"} title={title} kicker="Ventajas">
      <div className="grid gap-3 sm:grid-cols-2">
        {bullets.map((b, idx) => (
          <div
            key={idx}
            className="flex gap-3 items-start rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <span className="mt-0.5 inline-flex w-5 h-5 items-center justify-center rounded-full bg-[var(--c-accent)] text-white text-xs font-bold shrink-0">
              ✓
            </span>
            <div className="text-sm text-[var(--c-text)]/85 leading-relaxed">{b}</div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function BulletsTrustInline({ data }) {
  const title = (data?.title || "Por qué elegirnos").toString();
  const bullets = normBullets(data);

  return (
    <SectionWrap id={data?.id || "benefits"} title={title} kicker="Confianza">
      <div className="flex flex-wrap gap-2">
        {bullets.map((b, idx) => (
          <span
            key={idx}
            className="text-sm px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--c-text)]/80"
          >
            {b}
          </span>
        ))}
      </div>
    </SectionWrap>
  );
}

function BulletsInlineMinimal({ data }) {
  const title = (data?.title || "Por qué elegirnos").toString();
  const bullets = normBullets(data);

  return (
    <SectionWrap id={data?.id || "benefits"} title={title}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bullets.map((b, idx) => (
          <div key={idx} className="text-sm text-[var(--c-text)]/80 flex gap-2 items-start">
            <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[var(--c-accent)] shrink-0" />
            <span className="leading-relaxed">{b}</span>
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
    <SectionWrap id="benefits" title={title}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {bullets.map((b, idx) => (
          <div key={idx} className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="text-sm font-semibold text-[var(--c-text)] leading-relaxed">{b}</div>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}

function CardsGridMinimal({ data }) {
  const title = (data?.title || "Categorías").toString();
  const items = normItemsToNameDesc(data);

  return (
    <SectionWrap id={data?.id || "categories"} title={title}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-5 hover:shadow-[var(--shadow)] transition-shadow"
          >
            <div className="font-semibold text-[var(--c-text)]">{it.name}</div>
            {it.description ? (
              <div className="mt-1 text-sm text-[var(--c-text)]/70 leading-relaxed">{it.description}</div>
            ) : null}
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
    <SectionWrap id="categories" title={title}>
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="min-w-[240px] rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]"
          >
            <div className="font-semibold text-[var(--c-text)]">{it.name}</div>
            {it.description ? (
              <div className="mt-2 text-sm text-[var(--c-text)]/70">{it.description}</div>
            ) : null}
            <div className="mt-4 text-sm text-[var(--c-accent)] font-semibold">Ver →</div>
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
      <div className="text-[var(--c-text)]/75 leading-relaxed max-w-3xl text-sm">{body}</div>
    </SectionWrap>
  );
}

// ---------------------------------------------------------------------------
// Contact modules — with real functional forms
// ---------------------------------------------------------------------------

function ContactAuto({ spec, data }) {
  const title = (data?.title || "Contacto").toString();
  const body = (data?.body || data?.note || "").toString();
  const contact = spec?.contact || {};
  const ctaLabel = safeStr(data?.cta_label, "Enviar mensaje");

  return (
    <SectionWrap id="contact" title={title}>
      <div className="grid gap-10 lg:grid-cols-2 items-start">
        <div>
          {body ? (
            <p className="text-sm text-[var(--c-text)]/70 max-w-md leading-relaxed">{body}</p>
          ) : null}
          <ContactInfo contact={contact} />
        </div>
        <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
          <ContactForm contact={contact} ctaLabel={ctaLabel} />
        </div>
      </div>
    </SectionWrap>
  );
}

function ContactCenterMinimal({ spec, data }) {
  const title = (data?.title || "Contacto").toString();
  const body = (data?.body || data?.note || "Escríbenos y te respondemos en breve.").toString();
  const contact = spec?.contact || {};
  const ctaLabel = safeStr(data?.cta_label, "Enviar mensaje");

  return (
    <SectionWrap id="contact" title={title} kicker="Hablemos">
      <div className="max-w-xl mx-auto">
        {body ? (
          <p className="text-sm text-[var(--c-text)]/70 text-center mb-6 leading-relaxed">{body}</p>
        ) : null}
        <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
          <ContactForm contact={contact} ctaLabel={ctaLabel} compact />
        </div>
        <ContactInfo contact={contact} centered />
      </div>
    </SectionWrap>
  );
}

// ---------------------------------------------------------------------------
// Variant maps
// ---------------------------------------------------------------------------

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
  hero_saas_split_v1: HeroSaasSplit,
};

const SECTION_MAP = {
  // Steps, proof, faq
  steps_auto_v1: StepsAuto,
  testimonials_auto_v1: TestimonialsAuto,
  faq_auto_v1: FaqAuto,

  // Services
  services_grid_auto_v1: ServicesGridAuto,
  services_grid_saas_v1: ServicesGridSaas,
  services_grid_booking_v1: ServicesGridBooking,

  // Bullets / benefits
  bullets_auto_v1: BulletsInlineMinimal,
  bullets_saas_checks_v1: BulletsSaasChecks,
  bullets_trust_inline_v1: BulletsTrustInline,
  benefits_inline_min_v1: BulletsInlineMinimal,
  benefits_cards_min_v1: BenefitsCardsMinimal,

  // Cards / categories
  cards_auto_v1: CardsGridMinimal,
  categories_grid_min_v1: CardsGridMinimal,
  categories_scroller_min_v1: CardsScrollerMinimal,

  // Text / about
  text_auto_v1: TextAuto,

  // Contact
  contact_auto_v1: ContactAuto,
  contact_split_min_v1: ContactAuto,
  contact_center_min_v1: ContactCenterMinimal,
};

// ---------------------------------------------------------------------------
// Main router
// ---------------------------------------------------------------------------

export default function PacksRouter({ spec }) {
  const headerKey = spec?.layout?.header_variant || "header_minimal_v1";
  const footerKey = spec?.layout?.footer_variant || "footer_simple_v1";
  const archetype = spec?.layout?.archetype || "default_v1";

  const Header = HEADER_MAP[headerKey] || HeaderMinimal;
  const Footer = FOOTER_MAP[footerKey] || FooterSimple;

  const sections = useMemo(() => {
    const home = spec?.layout?.pages?.home;
    return Array.isArray(home?.sections) ? home.sections : [];
  }, [spec]);

  const theme = useMemo(() => safeResolveTheme(spec), [spec]);
  const themeStyle = useMemo(() => {
    const merged = applyArchetypeOverrides(theme.vars, archetype);
    return safeToStyleVars(merged);
  }, [theme, archetype]);

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]" style={themeStyle}>
      <Header spec={spec} />

      {sections.map((s, idx) => {
        const data = getByRef(spec, s.props_ref);

        if (s.module === "hero") {
          const Hero = HERO_MAP[s.variant] || HeroProductMinimal;
          return <Hero key={idx} spec={spec} data={data} />;
        }

        const Comp = SECTION_MAP[s.variant];
        if (Comp) return <Comp key={idx} spec={spec} data={data} />;

        if (process.env.NODE_ENV !== "production") {
          return (
            <SectionWrap key={idx} title={`Módulo: ${cap(s.module)}`}>
              <div className="text-xs text-orange-600 font-mono">
                Variante sin renderer: <b>{s.variant}</b>
              </div>
            </SectionWrap>
          );
        }

        return null;
      })}

      <Footer spec={spec} />
    </div>
  );
}
