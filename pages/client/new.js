import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const GOAL_OPTIONS = [
  { value: "leads", label: "Captar contactos / solicitudes de presupuesto" },
  { value: "corporate", label: "Presentación corporativa" },
  { value: "ecommerce", label: "Vender online (e-commerce)" },
  { value: "bookings", label: "Reservas / citas" },
  { value: "catalog", label: "Informativa / catálogo" },

  // NUEVO
  { value: "landing", label: "Conversión / Landing (una sola acción)" },

  // NUEVO
  { value: "other", label: "Otro (especificar)" },
];

function safeTrim(v) {
  return (v ?? "").toString().trim();
}

export default function ClientNew() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [sector, setSector] = useState("");
  const [location, setLocation] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [services, setServices] = useState([""]);
  const [websiteGoal, setWebsiteGoal] = useState("");
  const [websiteGoalDetail, setWebsiteGoalDetail] = useState("");
  const [tone, setTone] = useState("neutral");
  const [seed, setSeed] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

      // NUEVO: objetivo con detalle opcional
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Nuevo cliente — Brief
        </h1>
        <p className="text-neutral-400 mt-2">
          Rellena lo mínimo imprescindible. El generador decidirá estructura y
          estilo.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <label className="block text-sm text-neutral-300 mb-2">
              Nombre del negocio *
            </label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-3 outline-none focus:border-neutral-600"
              placeholder="Ej: Zapatos Rivera"
            />
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <label className="block text-sm text-neutral-300 mb-2">
              Sector / actividad *
            </label>
            <input
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-3 outline-none focus:border-neutral-600"
              placeholder="Ej: Calzado, clínica dental, restaurante..."
            />
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <label className="block text-sm text-neutral-300 mb-2">
              Ubicación (opcional)
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-3 outline-none focus:border-neutral-600"
              placeholder="Ej: Pamplona"
            />
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <label className="block text-sm text-neutral-300 mb-2">
              Público objetivo (opcional)
            </label>
            <input
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-3 outline-none focus:border-neutral-600"
              placeholder="Ej: familias, premium, B2B, jóvenes..."
            />
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <label className="block text-sm text-neutral-300 mb-2">
              Servicios / productos principales (opcional)
            </label>

            <div className="space-y-3">
              {services.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <input
                    value={s}
                    onChange={(e) => updateService(i, e.target.value)}
                    className="flex-1 rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-3 outline-none focus:border-neutral-600"
                    placeholder={`Servicio ${i + 1}`}
                  />
                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(i)}
                      className="rounded-lg border border-neutral-800 px-3 text-neutral-300 hover:border-neutral-600"
                      aria-label="Eliminar"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addService}
              className="mt-4 rounded-lg border border-neutral-800 px-4 py-2 text-neutral-300 hover:border-neutral-600"
            >
              + Añadir servicio
            </button>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <label className="block text-sm text-neutral-300 mb-2">
              Objetivo de la web *
            </label>
            <select
              value={websiteGoal}
              onChange={(e) => setWebsiteGoal(e.target.value)}
              className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-3 outline-none focus:border-neutral-600"
            >
              <option value="">Selecciona una opción...</option>
              {GOAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {needsGoalDetail && (
              <div className="mt-4">
                <label className="block text-sm text-neutral-300 mb-2">
                  Describe el objetivo *
                </label>
                <input
                  value={websiteGoalDetail}
                  onChange={(e) => setWebsiteGoalDetail(e.target.value)}
                  className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-3 outline-none focus:border-neutral-600"
                  placeholder="Ej: pedir demo, suscripción, descarga, WhatsApp..."
                />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <label className="block text-sm text-neutral-300 mb-2">
              Tono (opcional)
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-3 outline-none focus:border-neutral-600"
            >
              <option value="neutral">Neutral</option>
              <option value="professional">Profesional</option>
              <option value="friendly">Cercano</option>
              <option value="bold">Atrevido</option>
            </select>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <label className="block text-sm text-neutral-300 mb-2">
              Seed (opcional)
            </label>
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-4 py-3 outline-none focus:border-neutral-600"
              placeholder="Ej: 1234"
            />
            <p className="text-xs text-neutral-500 mt-2">
              Útil para reproducir el mismo resultado en variantes.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-red-200">
              {errorMsg}
            </div>
          )}

          <button
            disabled={!canSubmit || loading}
            className="w-full rounded-xl bg-white text-black px-6 py-4 font-medium disabled:opacity-40"
          >
            {loading ? "Generando..." : "Generar web"}
          </button>
        </form>
      </div>
    </div>
  );
}
