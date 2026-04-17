import { useMemo, useState } from "react";
import { useRouter } from "next/router";

const GOAL_OPTIONS = [
  { value: "leads", label: "Captar contactos / solicitudes de presupuesto" },
  { value: "corporate", label: "Presentación corporativa" },
  { value: "ecommerce", label: "Vender online (e-commerce)" },
  { value: "bookings", label: "Reservas / citas" },
  { value: "catalog", label: "Informativa / catálogo" },
  { value: "landing", label: "Conversión / Landing (una sola acción)" },
  { value: "other", label: "Otro (especificar)" },
];

const TONE_OPTIONS = [
  { value: "neutral", label: "Neutral" },
  { value: "professional", label: "Profesional" },
  { value: "friendly", label: "Cercano" },
  { value: "bold", label: "Atrevido" },
];

function safeTrim(v) {
  return (v ?? "").toString().trim();
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Componentes fuera del render principal para evitar re-mounts
function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="px-5 py-4 border-b border-neutral-200">
        <div className="text-sm font-semibold text-neutral-900">{title}</div>
        {subtitle ? (
          <div className="text-xs text-neutral-500 mt-0.5">{subtitle}</div>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Label({ children, htmlFor, optional = false }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-800 mb-1.5">
      {children}
      {optional ? (
        <span className="ml-1.5 text-xs font-normal text-neutral-400">opcional</span>
      ) : null}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl bg-white border border-neutral-200 px-4 py-3 text-sm text-neutral-900 " +
  "outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 placeholder:text-neutral-400 transition-colors";

const selectBase =
  "w-full rounded-xl bg-white border border-neutral-200 px-4 py-3 text-sm text-neutral-900 " +
  "outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-colors";

export default function ClientNew() {
  const router = useRouter();

  // Datos del negocio
  const [businessName, setBusinessName] = useState("");
  const [sector, setSector] = useState("");
  const [location, setLocation] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [services, setServices] = useState([""]);

  // Contacto del negocio (nuevo)
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Objetivo
  const [websiteGoal, setWebsiteGoal] = useState("");
  const [websiteGoalDetail, setWebsiteGoalDetail] = useState("");

  // Opciones
  const [tone, setTone] = useState("neutral");
  const [seed, setSeed] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [logoOk, setLogoOk] = useState(true);

  const needsGoalDetail = websiteGoal === "other" || websiteGoal === "landing";

  const canSubmit = useMemo(() => {
    if (!safeTrim(businessName)) return false;
    if (!safeTrim(sector)) return false;
    if (!safeTrim(websiteGoal)) return false;
    if (needsGoalDetail && !safeTrim(websiteGoalDetail)) return false;
    return true;
  }, [businessName, sector, websiteGoal, websiteGoalDetail, needsGoalDetail]);

  function updateService(i, value) {
    setServices((prev) => prev.map((s, idx) => (idx === i ? value : s)));
  }

  function addService() {
    setServices((prev) => [...prev, ""]);
  }

  function removeService(i) {
    setServices((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!canSubmit) {
      setErrorMsg("Completa los campos obligatorios.");
      return;
    }

    const cleanedServices = services
      .map((s) => safeTrim(s))
      .filter(Boolean)
      .slice(0, 20);

    const brief = {
      business_name: safeTrim(businessName),
      sector: safeTrim(sector),
      location: safeTrim(location),
      target_audience: safeTrim(targetAudience),
      services: cleanedServices,

      // Contacto del negocio
      contact_phone: safeTrim(phone),
      contact_email: safeTrim(email),
      contact_whatsapp: safeTrim(whatsapp),

      website_goal: safeTrim(websiteGoal),
      website_goal_detail: safeTrim(websiteGoalDetail),

      tone: safeTrim(tone),
      seed: safeTrim(seed),
    };

    setLoading(true);

    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Error ${res.status}`);
      }

      const spec = await res.json();
      localStorage.setItem("nb_last_site_spec", JSON.stringify(spec));
      router.push("/internal/preview");
    } catch (err) {
      setErrorMsg(err?.message || "Ha ocurrido un error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoOk ? (
              <img
                src="/logo.png"
                alt="Next Business"
                className="h-8 w-8 rounded-lg object-contain border border-neutral-200"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-neutral-900" aria-hidden />
            )}
            <div>
              <div className="text-sm font-semibold text-neutral-900 leading-none">
                Next Business
              </div>
              <div className="text-xs text-neutral-500 mt-0.5 leading-none">
                Generador de webs
              </div>
            </div>
          </div>

          <div className="text-xs text-neutral-400">
            ~2 min para completar
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Nuevo cliente
        </h1>
        <p className="text-neutral-500 mt-1.5 text-sm">
          Rellena los datos del negocio. El generador construirá la estructura y el estilo automáticamente.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">

          {/* Datos básicos */}
          <Card
            title="Datos del negocio"
            subtitle="Nombre y sector son obligatorios."
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Nombre del negocio</Label>
                <input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={inputBase}
                  placeholder="Nombre comercial"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sector">Sector / actividad</Label>
                <input
                  id="sector"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className={inputBase}
                  placeholder="Ej: clínica dental, asesoría fiscal, software de gestión, tienda de moda…"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" optional>Ubicación</Label>
                  <input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={inputBase}
                    placeholder="Ciudad o zona"
                  />
                </div>

                <div>
                  <Label htmlFor="targetAudience" optional>Público objetivo</Label>
                  <input
                    id="targetAudience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className={inputBase}
                    placeholder="Ej: B2B, familias, jóvenes 18-35…"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Contacto del negocio */}
          <Card
            title="Contacto del negocio"
            subtitle="Aparecerá en el header, footer y sección de contacto del sitio generado."
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" optional>Teléfono</Label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputBase}
                    placeholder="Ej: +34 612 345 678"
                  />
                </div>

                <div>
                  <Label htmlFor="email" optional>Email de contacto</Label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputBase}
                    placeholder="Ej: hola@negocio.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="whatsapp" optional>WhatsApp</Label>
                <input
                  id="whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className={inputBase}
                  placeholder="Número con prefijo internacional, ej: +34 612 345 678"
                />
                <p className="text-xs text-neutral-400 mt-1.5">
                  Si lo rellenas, el botón de contacto del sitio abrirá WhatsApp directamente.
                </p>
              </div>
            </div>
          </Card>

          {/* Servicios */}
          <Card
            title="Servicios o productos"
            subtitle="Opcional. Cuantos más detalles, más preciso es el resultado."
          >
            <div className="space-y-2.5">
              {services.map((s, i) => (
                <div key={i} className="flex gap-2.5">
                  <input
                    value={s}
                    onChange={(e) => updateService(i, e.target.value)}
                    className={inputBase}
                    placeholder={`Servicio o producto ${i + 1}`}
                  />
                  {services.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeService(i)}
                      className="rounded-xl border border-neutral-200 px-3 text-neutral-400 hover:border-neutral-300 hover:text-neutral-600 transition-colors shrink-0"
                      aria-label="Eliminar"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addService}
              className="mt-3 rounded-xl border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
            >
              + Añadir
            </button>
          </Card>

          {/* Objetivo */}
          <Card
            title="Objetivo de la web"
            subtitle="Define la estructura y el foco del sitio generado."
          >
            <div>
              <Label htmlFor="websiteGoal">Objetivo principal</Label>
              <select
                id="websiteGoal"
                value={websiteGoal}
                onChange={(e) => setWebsiteGoal(e.target.value)}
                className={selectBase}
                required
              >
                <option value="">Selecciona una opción…</option>
                {GOAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              {needsGoalDetail ? (
                <div className="mt-4">
                  <Label htmlFor="websiteGoalDetail">Detalla el objetivo</Label>
                  <input
                    id="websiteGoalDetail"
                    value={websiteGoalDetail}
                    onChange={(e) => setWebsiteGoalDetail(e.target.value)}
                    className={inputBase}
                    placeholder="Ej: solicitar demo, pedir presupuesto, reservar cita…"
                    required
                  />
                </div>
              ) : null}
            </div>
          </Card>

          {/* Opciones avanzadas */}
          <Card
            title="Opciones"
            subtitle="Parámetros para afinar el resultado. No son obligatorios."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tone" optional>Tono de comunicación</Label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className={selectBase}
                >
                  {TONE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="seed" optional>Seed</Label>
                <input
                  id="seed"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className={inputBase}
                  placeholder="Código para reproducir resultados"
                />
                <p className="text-xs text-neutral-400 mt-1.5">
                  Mismo seed = mismo resultado visual en variantes.
                </p>
              </div>
            </div>
          </Card>

          {/* Error */}
          {errorMsg ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
              {errorMsg}
            </div>
          ) : null}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className={cx(
              "w-full rounded-2xl px-6 py-4 text-sm font-semibold transition-colors",
              "bg-neutral-900 text-white hover:bg-neutral-800",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-neutral-900"
            )}
          >
            {loading ? "Generando…" : "Generar web"}
          </button>

          <p className="text-xs text-neutral-400 text-center pb-4">
            El resultado se carga en el preview interno para revisión antes de publicar.
          </p>
        </form>
      </div>
    </div>
  );
}
