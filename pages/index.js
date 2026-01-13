import Head from "next/head";
import { useState } from "react";

const FORM_ENDPOINT = "https://formspree.io/f/xkgkpepa";

export default function Home() {
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("LOADING");

    const form = e.target;
    const data = new FormData(form);

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setStatus("OK");
        form.reset();
      } else {
        setStatus("ERROR");
      }
    } catch (err) {
      setStatus("ERROR");
    }
  };

  return (
    <>
      <Head>
        <title>Next Business</title>
        <meta
          name="description"
          content="Next Business es una agencia de marketing y automatización con IA que diseña sistemas de captación, contenido y ventas para negocios que quieren crecer sin sumar más trabajo manual."
        />
        <meta
          property="og:title"
          content="Next Business — Marketing y automatización con IA"
        />
        <meta
          property="og:description"
          content="Creamos y automatizamos tu sistema de marketing: web, contenido, campañas y procesos para que puedas enfocarte en tu negocio."
        />
        <meta property="og:image" content="/og_image.png" />
        <link rel="icon" type="image/png" href="/logo.png" />
      </Head>

      <div className="min-h-screen bg-white text-gray-800 antialiased">
        {/* HEADER */}
        <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Logo Next Business"
              className="w-28 h-28 object-contain"
            />
            <div>
              <div className="text-lg font-semibold text-blue-900">
                Next Business
              </div>
            </div>
          </div>
          <nav className="hidden md:flex gap-6 items-center text-sm">
            <a href="#services" className="hover:underline">
              Servicios
            </a>
            <a href="#pricing" className="hover:underline">
              Precios
            </a>
            <a href="#about" className="hover:underline">
              Sobre Next Business
            </a>
            <a
              href="#contact"
              className="px-4 py-2 bg-blue-900 text-white rounded-md shadow hover:bg-blue-800"
            >
              Contacto
            </a>
          </nav>
        </header>

        <main className="max-w-6xl mx-auto px-6 pb-16">
          {/* HERO */}
          <section className="mt-8 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-blue-900">
                Marketing y automatización con IA para negocios que quieren crecer
              </h1>
              <p className="mt-4 text-gray-600">
                Diseñamos y ponemos en marcha sistemas de marketing que trabajan
                en segundo plano por tu negocio: página web, contenido, campañas
                y automatizaciones que generan oportunidades sin depender de que
                tú estés encima de todo cada día.
              </p>
              <ul className="mt-4 text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Implantación completa: de la estrategia a la ejecución.</li>
                <li>Procesos apoyados en IA para reducir tareas repetitivas.</li>
                <li>Enfoque práctico: menos ruido, más resultados.</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#contact"
                  className="px-5 py-3 bg-blue-900 text-white rounded-md shadow hover:bg-blue-800"
                >
                  Solicitar demo gratuita
                </a>
                <a
                  href="#services"
                  className="px-5 py-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  Ver servicios
                </a>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Ideal para negocios que quieren dar un salto en su presencia
                digital sin añadir más carga de trabajo al día a día.
              </p>
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center bg-gray-50">
              <img
                src="/logo.png"
                alt="Next Business"
                className="w-40 h-40 object-contain"
              />
            </div>
          </section>

          {/* SERVICIOS */}
          <section id="services" className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
              Servicios
            </h2>
            <p className="mt-2 text-gray-600 max-w-2xl">
              Combinamos estrategia, creatividad y automatización para construir
              un sistema de marketing estable alrededor de tu negocio, no solo
              acciones sueltas.
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Gestión de redes sociales",
                  desc: "Calendario de contenido, publicaciones programadas y presencia constante en los canales clave para tu negocio.",
                },
                {
                  title: "Contenido con IA",
                  desc: "Textos, imágenes y guiones generados con IA y revisados a mano para mantener el tono y la calidad que tu marca necesita.",
                },
                {
                  title: "Páginas web y e-commerce",
                  desc: "Webs rápidas, claras y enfocadas a generar contactos y ventas, con una base lista para futuras automatizaciones.",
                },
                {
                  title: "Publicidad online",
                  desc: "Campañas en Meta Ads y Google Ads diseñadas para captar leads y clientes con un control real del presupuesto.",
                },
                {
                  title: "Consultoría y estrategia digital",
                  desc: "Análisis del punto de partida y diseño de un plan digital realista, alineado con los recursos y objetivos del negocio.",
                },
                {
                  title: "Automatizaciones",
                  desc: "Flujos automáticos para gestionar contactos, responder de forma básica y hacer seguimiento sin depender del calendario.",
                },
                {
                  title: "Branding y diseño",
                  desc: "Identidad visual, logotipos y materiales digitales coherentes para que tu marca se vea profesional en todos los puntos de contacto.",
                },
                {
                  title: "SEO y contenido web",
                  desc: "Optimización técnica y de contenidos para mejorar la visibilidad en buscadores y atraer visitas cualificadas.",
                },
                {
                  title: "Soporte y mantenimiento",
                  desc: "Acompañamiento continuo, ajustes mensuales y mejoras evolutivas según los datos y la respuesta de tus clientes.",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="p-5 border border-gray-100 rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-600">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* PRECIOS */}
          <section id="pricing" className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
              Planes orientativos
            </h2>
            <p className="mt-2 text-gray-600 max-w-2xl">
              Cada negocio es distinto, pero es importante tener una referencia.
              Estos rangos sirven como punto de partida para ajustar una
              propuesta a medida según tus objetivos y nivel actual.
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="p-6 border border-gray-100 rounded-xl bg-white shadow-sm">
                <div className="text-xs uppercase text-gray-500">Implantación</div>
                <div className="mt-2 text-2xl font-bold">Desde 399 €</div>
                <p className="mt-3 text-sm text-gray-600">
                  Puesta en marcha inicial: web, presencia digital básica y
                  primeras automatizaciones para empezar a medir resultados.
                </p>
              </div>

              <div className="p-6 border border-blue-100 rounded-xl bg-blue-50 shadow-sm">
                <div className="text-xs uppercase text-gray-600">
                  Mantenimiento mensual
                </div>
                <div className="mt-2 text-2xl font-bold">Desde 89 € / mes</div>
                <p className="mt-3 text-sm text-gray-700">
                  Gestión de contenido, pequeños ajustes, seguimiento y soporte
                  directo para mantener el sistema vivo y mejorando.
                </p>
              </div>

              <div className="p-6 border border-gray-100 rounded-xl bg-white shadow-sm">
                <div className="text-xs uppercase text-gray-500">E-commerce</div>
                <div className="mt-2 text-2xl font-bold">Desde 799 €</div>
                <p className="mt-3 text-sm text-gray-600">
                  Tienda online, configuración de pagos e integraciones básicas
                  para empezar a vender productos o servicios de forma digital.
                </p>
              </div>
            </div>
          </section>

          {/* SOBRE NEXT BUSINESS */}
          <section id="about" className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
              Sobre Next Business
            </h2>
            <p className="mt-2 text-gray-600 max-w-3xl">
              Next Business es una agencia digital pensada para negocios que
              quieren tomarse en serio su presencia online sin convertir el
              marketing en otra jornada laboral. Combinamos herramientas de
              inteligencia artificial y automatización con una manera de trabajar
              muy sencilla: entender bien el negocio, definir un sistema y
              mantenerlo en el tiempo. No se trata solo de tener una web o unas
              redes sociales, sino de que todo lo que hagas en digital tenga un
              propósito claro y pueda medirse. La idea es que sientas que hay
              alguien al otro lado que se ocupa de tu marketing mientras tú te
              concentras en hacer crecer la empresa.
            </p>
          </section>

          {/* CONTACTO */}
          <section id="contact" className="mt-16 mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
              Contacto
            </h2>
            <p className="mt-2 text-gray-600 max-w-2xl">
              Cuéntame brevemente en qué punto está tu negocio y qué te gustaría
              mejorar. A partir de ahí, prepararemos una demo o propuesta sin
              compromiso.
            </p>

            <div className="mt-6 max-w-2xl">
              <form
                onSubmit={handleSubmit}
                className="grid gap-4 bg-white p-6 border border-gray-100 rounded-xl shadow-sm"
              >
                <input
                  name="name"
                  type="text"
                  placeholder="Nombre"
                  className="p-3 border rounded-md w-full"
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="p-3 border rounded-md w-full"
                  required
                />
                <input
                  name="phone"
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  className="p-3 border rounded-md w-full"
                />
                <textarea
                  name="message"
                  rows={5}
                  placeholder="Ejemplo: tenemos una empresa de X, queremos mejorar nuestra web, redes o sistema de captación."
                  className="p-3 border rounded-md w-full"
                  required
                />
                <button
                  type="submit"
                  disabled={status === "LOADING"}
                  className="mt-2 px-4 py-3 bg-blue-900 text-white rounded-md font-semibold hover:bg-blue-800 disabled:opacity-60"
                >
                  {status === "LOADING" ? "Enviando..." : "Enviar mensaje"}
                </button>

                {status === "OK" && (
                  <p className="text-sm text-green-600">
                    Mensaje enviado correctamente. Te responderé lo antes posible.
                  </p>
                )}
                {status === "ERROR" && (
                  <p className="text-sm text-red-600">
                    Ha habido un problema al enviar el mensaje. Por favor, prueba
                    de nuevo o escríbeme a{" "}
                    <a
                      href="mailto:nextbusiness.test@gmail.com"
                      className="underline"
                    >
                      nextbusiness.test@gmail.com
                    </a>
                    .
                  </p>
                )}
              </form>

              <div className="mt-4 text-sm text-gray-500">
                También puedes escribir a{" "}
                <a
                  href="mailto:nextbusiness.test@gmail.com"
                  className="underline"
                >
                  nextbusiness.test@gmail.com
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="border-t py-6">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-gray-600">
            <div>© {new Date().getFullYear()} Next Business</div>
            <div>Agencia de marketing y automatización con IA para negocios.</div>
          </div>
        </footer>
      </div>
    </>
  );
}
