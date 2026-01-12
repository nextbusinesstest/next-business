import Head from "next/head";
import { useState } from "react";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function ClientNew() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const form = e.target;
    const data = new FormData(form);

    const companyName = (data.get("companyName") || "").toString().trim();
    const location = (data.get("location") || "").toString().trim();
    const sector = (data.get("sector") || "").toString().trim();
    const businessType = (data.get("businessType") || "").toString().trim();
    const websiteGoal = (data.get("websiteGoal") || "").toString().trim();

    const services = (data.get("services") || "")
      .toString()
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const targetAudience = (data.get("targetAudience") || "").toString().trim();

    const phone = (data.get("phone") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const address = (data.get("address") || "").toString().trim();

    // logo opcional
    let logoDataUrl = null;
    const logoFile = data.get("logo");
    if (logoFile && logoFile instanceof File && logoFile.size > 0) {
      try {
        logoDataUrl = await readFileAsDataUrl(logoFile);
      } catch {
        // no bloqueamos por logo
        logoDataUrl = null;
      }
    }

    const clientBrief = {
      company: {
        name: companyName,
        current_website: null,
        location,
        sector,
        business_type: businessType,
      },
      website_goal: websiteGoal,
      services,
      target_audience: targetAudience,
      contact_info: { phone, email, address, socials: [] },
      brand: { logoDataUrl },
    };

    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_brief: clientBrief }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al generar la web");

      const siteSpec = json.site_spec;

      // Guardamos para preview
      window.localStorage.setItem("nb_last_site_spec", JSON.stringify(siteSpec));

      // Abrimos preview en otra pestaña
      const previewUrl = `${window.location.origin}/internal/preview`;
      window.open(previewUrl, "_blank", "noopener,noreferrer");

      // Notificamos a Next Business (tu email via Formspree)
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          layout: siteSpec.layout,
          previewUrl,
        }),
      }).catch(() => {});

      setStatus("done");
      form.reset();
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  return (
    <>
      <Head>
        <title>Next Business · Crear web</title>
        <link rel="icon" type="image/png" href="/logo.png" />
      </Head>

      <div className="min-h-screen bg-gray-50 text-gray-800">
        <header className="border-b bg-white">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Next Business" className="w-10 h-10 object-contain" />
              <div>
                <div className="text-sm font-semibold text-blue-900">Creación de web</div>
                <div className="text-xs text-gray-500">Rellena los datos y se abrirá una vista previa</div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8">
          <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h1 className="text-xl font-semibold text-blue-900">Datos del negocio</h1>
            <p className="mt-1 text-sm text-gray-600">
              Completa la información y se generará una propuesta de web automáticamente.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del negocio *</label>
                  <input name="companyName" required className="w-full p-3 border rounded-md" placeholder="Ej. Nombre empresa" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ubicación *</label>
                  <input name="location" required className="w-full p-3 border rounded-md" placeholder="Ej. Ciudad, provincia" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sector *</label>
                  <input name="sector" required className="w-full p-3 border rounded-md" placeholder="Ej. Comercio, Servicios, Industria..." />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de negocio *</label>
                  <input name="businessType" required className="w-full p-3 border rounded-md" placeholder="Ej. tienda de calzado, electricista, asesoría..." />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Objetivo de la web *</label>
                  <select name="websiteGoal" required className="w-full p-3 border rounded-md bg-white">
                    <option value="">Selecciona una opción...</option>
                    <option value="Captar contactos / solicitudes de presupuesto">Captar contactos / solicitudes de presupuesto</option>
                    <option value="Presentación corporativa">Presentación corporativa</option>
                    <option value="Vender online (e-commerce)">Vender online (e-commerce)</option>
                    <option value="Reservas / citas">Reservas / citas</option>
                    <option value="Informativa / catálogo">Informativa / catálogo</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Servicios / productos (uno por línea) *</label>
                  <textarea
                    name="services"
                    required
                    rows={5}
                    className="w-full p-3 border rounded-md"
                    placeholder={"Ej.\nVenta de calzado para hombre\nVenta de calzado para mujer\nDevoluciones y cambios"}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cliente ideal *</label>
                  <textarea
                    name="targetAudience"
                    required
                    rows={3}
                    className="w-full p-3 border rounded-md"
                    placeholder="Ej. Personas que buscan calidad, empresas que necesitan rapidez, familias..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono *</label>
                  <input name="phone" required className="w-full p-3 border rounded-md" placeholder="Ej. +34 600 000 000" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input name="email" type="email" required className="w-full p-3 border rounded-md" placeholder="Ej. info@empresa.com" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dirección (opcional)</label>
                  <input name="address" className="w-full p-3 border rounded-md" placeholder="Ej. Calle, número..." />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Logo (opcional)</label>
                  <input name="logo" type="file" accept="image/*" className="w-full p-3 border rounded-md bg-white" />
                  <p className="mt-1 text-xs text-gray-500">
                    Si lo subes, se usará en la vista previa. Si no, se genera sin logo.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs text-gray-500">Al enviar, se abrirá la vista previa en otra pestaña.</span>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="px-4 py-3 bg-blue-900 text-white rounded-md font-semibold hover:bg-blue-800 disabled:opacity-60"
                >
                  {status === "loading" ? "Generando..." : "Generar vista previa"}
                </button>
              </div>

              {status === "done" && (
                <div className="text-sm text-green-700">
                  Listo. Se ha abierto la vista previa y hemos recibido la notificación.
                </div>
              )}
              {status === "error" && <div className="text-sm text-red-600">Error: {error}</div>}
            </form>
          </section>
        </main>
      </div>
    </>
  );
}
