import Head from "next/head";

function Icon({ name }) {
  const cls = "w-5 h-5";
  if (name === "check") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l3 7 7 .6-5.3 4.6 1.7 7-6.4-3.8L5.6 21l1.7-7L2 9.6 9 9l3-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function Card({ title, desc }) {
  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur border border-black/10 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] hover:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.45)] transition-shadow">
      <div className="p-6">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, var(--c-primary), var(--c-accent))", color: "white" }}
        >
          <Icon name="check" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

function Section({ section }) {
  if (!section) return null;

  if (section.type === "services_grid" || section.type === "cards") {
    return (
      <section id={section.id} className="mt-20">
        <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900">{section.title}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(section.items || []).map((it, i) => (
            <Card key={i} title={it.name} desc={it.description} />
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "bullets") {
    return (
      <section id={section.id} className="mt-20">
        <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900">{section.title}</h2>
        <div className="mt-8 rounded-3xl border border-black/10 bg-white/70 backdrop-blur shadow-[0_12px_40px_-24px_rgba(0,0,0,0.45)] p-7">
          <ul className="space-y-3 text-gray-700">
            {(section.bullets || []).map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-0.5 w-9 h-9 rounded-2xl flex items-center justify-center text-white"
                  style={{ background: "linear-gradient(135deg, var(--c-primary), var(--c-accent))" }}
                >
                  <Icon name="check" />
                </span>
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  if (section.type === "text") {
    return (
      <section id={section.id} className="mt-20">
        <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900">{section.title}</h2>
        <div className="mt-8 rounded-3xl border border-black/10 bg-white/70 backdrop-blur shadow-[0_12px_40px_-24px_rgba(0,0,0,0.45)] p-7">
          <p className="text-gray-700 leading-relaxed max-w-3xl">{section.body}</p>
        </div>
      </section>
    );
  }

  if (section.type === "contact") {
    return (
      <section id={section.id} className="mt-20">
        <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900">{section.title}</h2>
        <div className="mt-8 rounded-3xl border border-black/10 bg-white/70 backdrop-blur shadow-[0_12px_40px_-24px_rgba(0,0,0,0.45)] p-7">
          <p className="text-gray-700">{section.body}</p>
        </div>
      </section>
    );
  }

  return null;
}

export default function PremiumBrand({ spec }) {
  const title = spec?.meta?.title || "Preview";
  const description = spec?.meta?.description || "";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>
        <div
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 400px at 20% 0%, rgba(0,0,0,0.04), transparent 60%), radial-gradient(900px 400px at 80% 10%, rgba(0,0,0,0.03), transparent 55%)",
          }}
        />

        <header className="sticky top-0 z-20 border-b border-black/10 bg-white/60 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, var(--c-primary), var(--c-accent))" }}
              >
                {title.charAt(0) || "W"}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate text-gray-900">{title}</div>
                <div className="text-xs text-gray-500 truncate">Premium brand layout</div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-5 text-xs tracking-wider text-gray-700">
              {(spec.sections || []).slice(0, 5).map((s) => (
                <a key={s.id} href={`#${s.id}`} className="hover:opacity-80">
                  {s.id.replace(/_/g, " ").toUpperCase()}
                </a>
              ))}
              <a href="#contact" className="hover:opacity-80">
                CONTACTO
              </a>
            </nav>
          </div>
        </header>

        <section className="border-b border-black/10">
          <div className="max-w-6xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-2 items-center">
            <div>
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900 leading-tight">
                {spec.hero?.headline || title}
              </h1>
              <p className="mt-5 text-gray-700 leading-relaxed max-w-xl">{spec.hero?.subheadline || description}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#services"
                  className="px-6 py-3 rounded-2xl text-white text-sm font-semibold shadow-sm"
                  style={{ background: "linear-gradient(135deg, var(--c-primary), var(--c-accent))" }}
                >
                  {spec.hero?.primary_cta_label || "Ver más"}
                </a>
                <a
                  href="#contact"
                  className="px-6 py-3 rounded-2xl text-sm font-semibold border border-black/10 bg-white/70 backdrop-blur hover:bg-white"
                  style={{ color: "var(--c-primary)" }}
                >
                  {spec.hero?.secondary_cta_label || "Contacto"}
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white/70 backdrop-blur shadow-[0_20px_70px_-40px_rgba(0,0,0,0.6)] p-7">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Resumen</div>
              <div className="mt-2 text-xl font-semibold text-gray-900">{title}</div>

              <div className="mt-6 grid gap-4">
                <div className="p-5 rounded-2xl border border-black/10 bg-white">
                  <div className="text-xs text-gray-500">Contacto</div>
                  <div className="mt-2 text-sm text-gray-700">{spec.contact?.phone || "—"}</div>
                  <div className="text-sm text-gray-700">{spec.contact?.email || "—"}</div>
                </div>
                <div className="p-5 rounded-2xl border border-black/10 bg-white">
                  <div className="text-xs text-gray-500">Dirección</div>
                  <div className="mt-2 text-sm text-gray-700">{spec.contact?.address || "—"}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="max-w-6xl mx-auto px-6 pb-16">
          {(spec.sections || []).map((section) => (
            <Section key={section.id} section={section} />
          ))}

          <section id="contact" className="mt-20">
            <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900">Contacto</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                { label: "Teléfono", value: spec.contact?.phone || "—" },
                { label: "Email", value: spec.contact?.email || "—" },
                { label: "Dirección", value: spec.contact?.address || "—" },
              ].map((x, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-black/10 bg-white/70 backdrop-blur shadow-[0_12px_40px_-24px_rgba(0,0,0,0.45)] p-7"
                >
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">{x.label}</div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">{x.value}</div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="border-t border-black/10 bg-white/60 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-700">{title}</div>
            <div className="text-xs text-gray-500">Premium · Coherencia · Conversión</div>
          </div>
        </footer>
      </div>
    </>
  );
}
