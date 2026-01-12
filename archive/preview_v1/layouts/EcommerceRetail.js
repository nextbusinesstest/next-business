import Head from "next/head";

function ProductCard({ title, desc }) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition">
      <div className="h-28 bg-gray-100" />
      <div className="p-5">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

function Section({ section }) {
  if (!section) return null;

  if (section.type === "cards") {
    return (
      <section id={section.id} className="mt-14">
        <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {(section.items || []).map((it, i) => (
            <ProductCard key={i} title={it.name} desc={it.description} />
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "services_grid") {
    return (
      <section id={section.id} className="mt-14">
        <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(section.items || []).map((it, i) => (
            <div key={i} className="p-6 rounded-2xl border bg-white shadow-sm">
              <h3 className="font-semibold text-gray-900">{it.name}</h3>
              <p className="mt-2 text-sm text-gray-600">{it.description}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "bullets") {
    return (
      <section id={section.id} className="mt-14">
        <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
        <div className="mt-6 p-6 rounded-2xl border bg-white shadow-sm">
          <ul className="grid gap-3 md:grid-cols-2 text-gray-700">
            {(section.bullets || []).map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 w-2 h-2 rounded-full" style={{ backgroundColor: "var(--c-accent)" }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  if (section.type === "text") {
    return (
      <section id={section.id} className="mt-14">
        <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
        <div className="mt-6 p-6 rounded-2xl border bg-white shadow-sm">
          <p className="text-gray-700 leading-relaxed max-w-3xl">{section.body}</p>
        </div>
      </section>
    );
  }

  return null;
}

export default function EcommerceRetail({ spec }) {
  const title = spec?.meta?.title || "Preview";
  const description = spec?.meta?.description || "";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>
        <header className="border-b bg-white">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="font-semibold text-gray-900">{title}</div>
            <div className="flex gap-2">
              <a
                href="#categories"
                className="px-4 py-2 rounded-xl text-sm font-semibold border"
                style={{ borderColor: "var(--c-primary)", color: "var(--c-primary)" }}
              >
                Categorías
              </a>
              <a
                href="#contact"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--c-primary)" }}
              >
                {spec.hero?.secondary_cta_label || "Contacto"}
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10">
          <section className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                {spec.hero?.headline || title}
              </h1>
              <p className="mt-4 text-gray-700 leading-relaxed">{spec.hero?.subheadline || description}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#categories"
                  className="px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-sm"
                  style={{ backgroundColor: "var(--c-primary)" }}
                >
                  {spec.hero?.primary_cta_label || "Ver categorías"}
                </a>
                <a
                  href="#benefits"
                  className="px-5 py-3 rounded-xl border text-sm font-semibold"
                  style={{ borderColor: "var(--c-accent)", color: "var(--c-accent)" }}
                >
                  Envío y devoluciones
                </a>
              </div>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm p-6">
              <div className="text-xs text-gray-500">Compra segura</div>
              <div className="mt-2 text-lg font-semibold text-gray-900">
                Proceso simple y claro
              </div>
              <div className="mt-4 grid gap-3 text-sm text-gray-700">
                <div>• Pagos integrables</div>
                <div>• Envíos y devoluciones</div>
                <div>• Atención al cliente</div>
              </div>
            </div>
          </section>

          {(spec.sections || []).map((s) => (
            <Section key={s.id} section={s} />
          ))}

          <section id="contact" className="mt-14">
            <h2 className="text-2xl font-bold text-gray-900">Contacto</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <div className="p-6 rounded-2xl bg-white border shadow-sm">
                <div className="text-xs text-gray-500">Teléfono</div>
                <div className="mt-2 font-semibold">{spec.contact?.phone || "—"}</div>
              </div>
              <div className="p-6 rounded-2xl bg-white border shadow-sm">
                <div className="text-xs text-gray-500">Email</div>
                <div className="mt-2 font-semibold">{spec.contact?.email || "—"}</div>
              </div>
              <div className="p-6 rounded-2xl bg-white border shadow-sm">
                <div className="text-xs text-gray-500">Dirección</div>
                <div className="mt-2 font-semibold">{spec.contact?.address || "—"}</div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t bg-white">
          <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-gray-600">
            {title} · E-commerce · Confianza · Conversión
          </div>
        </footer>
      </div>
    </>
  );
}
