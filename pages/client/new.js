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

function safeTrim(v) {
  return (v ?? "").toString().trim();
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
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

  const Card = ({ title, subtitle, children }) => (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="px-5 py-4 border-b border-neutral-200">
        <div className="text-sm font-semibold text-neutral-900">{title}</div>
        {subtitle ? (
          <div className="text-xs text-neutral-600 mt-1">{subtitle}</div>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  const Label = ({ children }) => (
    <label className="block text-sm font-medium text-neutral-800 mb-2">
      {children}
    </label>
  );

  const inputBase =
    "w-full rounded-xl bg-white border border-neutral-200 px-4 py-3 text-sm text-neutral-900 " +
    "outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 placeholder:text-neutral-400";

  const selectBase =
    "w-full rounded-xl bg-white border border-neutral-200 px-4 py-3 text-sm text-neutral-900 " +
    "outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header NB */}
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-neutral-900" aria-hidden />
            <div>
              <div className="text-sm font-semibold text-neutral-900 leading-none">
                Next Business
              </div>
              <div className="text-xs text-neutral-600 mt-1 leading-none">
                Brief rápido · Generación automática
              </div>
            </div>
          </div>
          <div className="text-xs text-neutral-500">
            Tiempo estimado: <span className="font-medium">2–3 min</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          Nuevo cliente
        </h1>
        <p className="text-neutral-600 mt-2">
          Rellena lo mínimo imprescindible. El generador decidirá estructura y estilo.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Card
            title="Datos básicos"
            subtitle="Campos obligatorios para generar una web coherente."
          >
            <div className="space-y-5">
              <div>
                <Label>Nombre del negocio *</Label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={inputBase}
                  placeholder="Nombre comercial del negocio"
                />
              </div>

              <div>
                <Label>Sector / actividad *</Label>
                <input
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className={inputBase}
                  placeholder="Ej: clínica, reformas, asesoría, software, tienda…"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Ubicación (opcional)</Label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={inputBase}
                    placeholder="Ciudad o zona"
                  />
                </div>

                <div>
                  <Label>Público objetivo (opcional)</Label>
                  <input
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className={inputBase}
                    placeholder="Ej: B2B, familias, premium, jóvenes…"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Servicios / productos"
            subtitle="Opcional. Si lo rellenas, mejora la precisión de la estructura."
          >
            <div className="space-y-3">
              {services.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <input
                    value={s}
                    onChange={(e) => updateService(i, e.target.value)}
                    className={inputBase}
                    placeholder={`Elemento ${i + 1}`}
                  />
                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(i)}
                      className="rounded-xl border border-neutral-200 px-3 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                      aria-label="Eliminar"
                      title="Eliminar"
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
              className="mt-4 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50"
            >
              + Añadir
            </button>
          </Card>

          <Card
            title="Objetivo de la web"
            subtitle="El objetivo define el arquetipo y la estructura."
          >
            <div>
              <Label>Objetivo *</Label>
              <select
                value={websiteGoal}
                onChange={(e) => setWebsiteGoal(e.target.value)}
                className={selectBase}
              >
                <option value="">Selecciona una opción…</option>
                {GOAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              {needsGoalDetail && (
                <div className="mt-5">
                  <Label>Detalle del objetivo *</Label>
                  <input
                    value={websiteGoalDetail}
                    onChange={(e) => setWebsiteGoalDetail(e.target.value)}
                    className={inputBase}
                    placeholder="Ej: solicitar demo, pedir presupuesto, agenda de cita…"
                  />
                </div>
              )}
            </div>
          </Card>

          <Card
            title="Opciones"
            subtitle="No son obligatorias. Útiles para afinar el resultado."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label>Tono (opcional)</Label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className={selectBase}
                >
                  <option value="neutral">Neutral</option>
                  <option value="professional">Profesional</option>
                  <option value="friendly">Cercano</option>
                  <option value="bold">Atrevido</option>
                </select>
              </div>

              <div>
                <Label>Seed (opcional)</Label>
                <input
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className={inputBase}
                  placeholder="Código corto (opcional)"
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Útil para reproducir el mismo resultado en variantes.
                </p>
              </div>
            </div>
          </Card>

          {errorMsg && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
              {errorMsg}
            </div>
          )}

          <button
            disabled={!canSubmit || loading}
            className={cx(
              "w-full rounded-2xl px-6 py-4 text-sm font-semibold",
              "bg-neutral-900 text-white hover:bg-neutral-800",
              "disabled:opacity-40 disabled:hover:bg-neutral-900"
            )}
          >
            {loading ? "Generando…" : "Generar web"}
          </button>

          <p className="text-xs text-neutral-500">
            Al generar, se guarda el resultado en tu navegador (localStorage) para previsualizarlo.
          </p>
        </form>
      </div>
    </div>
  );
}
