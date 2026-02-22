function safeTrim(v) {
  return (v ?? "").toString().trim();
}

function slugify(input) {
  const s = safeTrim(input).toLowerCase();
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "nb-site"
  );
}

function pickBusinessTypeFromGoal(goal) {
  const g = goal?.primary_goal || "";
  if (g === "sell_online") return "ecommerce";
  if (g === "book_appointments") return "local_service";
  return "generic";
}

function pickPack(businessType, goal) {
  if (businessType === "ecommerce" || goal?.primary_goal === "sell_online")
    return "ecommerce_conversion";
  return "generic";
}

function pickPersonality(businessType, goal, sector) {
  const g = goal?.primary_goal || "";
  const s = (sector || "").toLowerCase();

  if (businessType === "ecommerce") return "modern_minimal";
  if (g === "present_brand") return "corporate_b2b";
  if (g === "capture_leads" || g === "book_appointments") return "trust_authority";
  if (g === "single_action") return "premium_elegant";
  if (g === "show_catalog") return "premium_elegant";

  if (
    s.includes("abogado") ||
    s.includes("asesor") ||
    s.includes("ingenier") ||
    s.includes("consult")
  ) {
    return "corporate_b2b";
  }

  return "premium_elegant";
}

/* -----------------------------
  Archetypes / Layout
----------------------------- */

function pickArchetype(primaryGoal, pack) {
  if (pack === "ecommerce_conversion") return "ecommerce_premium_v1";
  if (primaryGoal === "book_appointments") return "booking_trust_v1";
  if (primaryGoal === "single_action") return "saas_landing_v1";
  return "default_v1";
}

function buildHomeSectionsForGoal(goal, pack, archetype) {
  const g = goal?.primary_goal || "capture_leads";

  // ✅ Ecommerce premium
  if (pack === "ecommerce_conversion") {
    return [
      { module: "hero", variant: "hero_product_split_v1", props_ref: "modules.hero_auto" },
      { module: "cards", variant: "categories_scroller_min_v1", props_ref: "modules.cards_auto" },
      { module: "bullets", variant: "benefits_cards_min_v1", props_ref: "modules.bullets_auto" },
      { module: "text", variant: "text_auto_v1", props_ref: "modules.text_auto" },
      { module: "contact", variant: "contact_center_min_v1", props_ref: "modules.contact_auto" },
    ];
  }

  // ✅ Landing / acción única (SaaS)
  if (g === "single_action") {
    const heroVariant =
      archetype === "saas_landing_v1" ? "hero_saas_split_v1" : "hero_product_minimal_v1";

    const bulletsVariant =
      archetype === "saas_landing_v1" ? "bullets_saas_checks_v1" : "bullets_auto_v1";

    const servicesVariant =
      archetype === "saas_landing_v1" ? "services_grid_saas_v1" : "services_grid_auto_v1";

    return [
      { module: "hero", variant: heroVariant, props_ref: "modules.hero_auto" },
      { module: "bullets", variant: bulletsVariant, props_ref: "modules.bullets_auto" },
      { module: "services", variant: servicesVariant, props_ref: "modules.services_auto" },
      { module: "testimonials", variant: "testimonials_auto_v1", props_ref: "modules.testimonials_auto" },
      { module: "steps", variant: "steps_auto_v1", props_ref: "modules.steps_auto" },
      { module: "faq", variant: "faq_auto_v1", props_ref: "modules.faq_auto" },
      { module: "contact", variant: "contact_auto_v1", props_ref: "modules.contact_auto" },
    ];
  }

  // Catálogo / informativa
  if (g === "show_catalog") {
    return [
      { module: "hero", variant: "hero_product_minimal_v1", props_ref: "modules.hero_auto" },
      { module: "cards", variant: "cards_auto_v1", props_ref: "modules.cards_auto" },
      { module: "services", variant: "services_grid_auto_v1", props_ref: "modules.services_auto" },
      { module: "contact", variant: "contact_auto_v1", props_ref: "modules.contact_auto" },
    ];
  }

  // Corporate
  if (g === "present_brand") {
    return [
      { module: "hero", variant: "hero_product_minimal_v1", props_ref: "modules.hero_auto" },
      { module: "text", variant: "text_auto_v1", props_ref: "modules.text_auto" },
      { module: "bullets", variant: "bullets_auto_v1", props_ref: "modules.bullets_auto" },
      { module: "contact", variant: "contact_auto_v1", props_ref: "modules.contact_auto" },
    ];
  }

  // ✅ Reservas / citas
  if (g === "book_appointments") {
    const bulletsVariant =
      archetype === "booking_trust_v1" ? "bullets_trust_inline_v1" : "bullets_auto_v1";

    const servicesVariant =
      archetype === "booking_trust_v1" ? "services_grid_booking_v1" : "services_grid_auto_v1";

    return [
      { module: "hero", variant: "hero_product_minimal_v1", props_ref: "modules.hero_auto" },
      { module: "bullets", variant: bulletsVariant, props_ref: "modules.bullets_auto" },
      { module: "services", variant: servicesVariant, props_ref: "modules.services_auto" },
      { module: "testimonials", variant: "testimonials_auto_v1", props_ref: "modules.testimonials_auto" },
      { module: "faq", variant: "faq_auto_v1", props_ref: "modules.faq_auto" },
      { module: "steps", variant: "steps_auto_v1", props_ref: "modules.steps_auto" },
      { module: "contact", variant: "contact_auto_v1", props_ref: "modules.contact_auto" },
    ];
  }

  // Leads (default)
  return [
    { module: "hero", variant: "hero_product_minimal_v1", props_ref: "modules.hero_auto" },
    { module: "services", variant: "services_grid_auto_v1", props_ref: "modules.services_auto" },
    { module: "bullets", variant: "bullets_auto_v1", props_ref: "modules.bullets_auto" },
    { module: "contact", variant: "contact_auto_v1", props_ref: "modules.contact_auto" },
  ];
}

/* -----------------------------
  Domain detection + helpers
----------------------------- */

function norm(s = "") {
  return String(s).toLowerCase().trim();
}

function detectDomain(sectorRaw) {
  const s = norm(sectorRaw);

  if (s.includes("dental") || s.includes("clín") || s.includes("clin") || s.includes("odont") || s.includes("salud"))
    return "health";
  if (s.includes("abog") || s.includes("legal") || s.includes("desp") || s.includes("laboral") || s.includes("civil"))
    return "legal";
  if (s.includes("saas") || s.includes("software") || s.includes("plataforma") || s.includes("incid") || s.includes("ticket"))
    return "saas";
  if (s.includes("rest") || s.includes("asador") || s.includes("bar") || s.includes("cafe") || s.includes("hostel"))
    return "hospitality";
  if (s.includes("zapat") || s.includes("ropa") || s.includes("moda") || s.includes("tienda") || s.includes("ecommerce"))
    return "ecommerce";

  return "generic";
}

function firstNonEmpty(...arr) {
  for (const v of arr) {
    const t = safeTrim(v);
    if (t) return t;
  }
  return "";
}

function titleize(s) {
  const t = safeTrim(s);
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function uniqueLimit(arr, max = 6) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = norm(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
    if (out.length >= max) break;
  }
  return out;
}

function servicesFromUserInput(services) {
  return Array.isArray(services)
    ? services.map((s) => safeTrim(s)).filter(Boolean)
    : [];
}

function smartDefaultServices(domain) {
  if (domain === "health") {
    return [
      "Revisiones y diagnóstico",
      "Limpieza dental",
      "Ortodoncia",
      "Implantes",
      "Estética dental",
    ];
  }
  if (domain === "saas") {
    return [
      "Ticketing y SLA",
      "Automatización de asignación",
      "Integraciones (Email/Teams)",
      "Panel de métricas",
      "Base de conocimiento",
    ];
  }
  if (domain === "legal") {
    return [
      "Derecho laboral",
      "Derecho civil",
      "Contratos y asesoría",
      "Reclamaciones",
      "Mediación",
    ];
  }
  if (domain === "hospitality") {
    return [
      "Menú del día",
      "Carta de temporada",
      "Eventos y grupos",
      "Reservas",
      "Postres caseros",
    ];
  }
  if (domain === "ecommerce") {
    return [
      "Novedades semanales",
      "Drops limitados",
      "Envío (si aplica)",
      "Cambios y devoluciones",
      "Atención por WhatsApp",
    ];
  }
  return [
    "Servicio 1",
    "Servicio 2",
    "Servicio 3",
  ];
}

/* -----------------------------
  ✅ 5.2 RULES — intent classifier (single_action)
----------------------------- */

function classifySingleActionIntent(goalDetail) {
  const d = norm(goalDetail);
  if (!d) return "demo";

  // orden importa
  if (d.includes("audit") || d.includes("auditor") || d.includes("diagnos")) return "audit";
  if (d.includes("trial") || d.includes("prueba") || d.includes("piloto")) return "trial";
  if (d.includes("presupuesto") || d.includes("precio") || d.includes("cotiz")) return "quote";
  if (d.includes("llamada") || d.includes("call") || d.includes("reunión") || d.includes("reunion")) return "call";
  if (d.includes("descarga") || d.includes("download") || d.includes("pdf")) return "download";
  if (d.includes("demo") || d.includes("ver") || d.includes("solicita")) return "demo";

  // default
  return "demo";
}

function formatSingleActionNote(detail) {
  const d = safeTrim(detail);
  if (!d) return "Solicita una demo y te respondemos en breve.";

  const startsWithVerb =
    /^(solicita(r)?|pide(r)?|reserva(r)?|contacta(r)?|obt(e|é)n(er)?|descarga(r)?|agenda(r)?)\b/i.test(d);

  if (startsWithVerb) {
    // guardrail: "Solicitar demo" -> "Solicita una demo"
    if (/^solicitar\b/i.test(d)) return "Solicita una demo y te respondemos en breve.";
    if (/^pedir\b/i.test(d)) return "Pide información y te respondemos en breve.";
    if (/^reservar\b/i.test(d)) return "Reserva una cita y te respondemos en breve.";
    if (/^agenda(r)?\b/i.test(d)) return "Agenda una llamada y te respondemos en breve.";
    return `${d} y te respondemos en breve.`;
  }

  return `Solicita ${d} y te respondemos en breve.`;
}

/* -----------------------------
  ✅ 5.1 — categorías/cards inteligentes
----------------------------- */

function smartEcommerceCategories({ sector }) {
  const s = norm(sector);

  // base premium ecommerce
  const base = [
    { title: "Novedades", description: "Últimos lanzamientos y reposiciones." },
    { title: "Drops", description: "Ediciones limitadas y lanzamientos por fecha." },
    { title: "Básicos", description: "Modelos esenciales para diario." },
    { title: "Ediciones limitadas", description: "Pocas unidades. Cuando se acaba, se acaba." },
    { title: "Accesorios", description: "Complementos y extras." },
  ];

  if (s.includes("zapat") || s.includes("footwear") || s.includes("sneaker")) return base;

  if (s.includes("joya") || s.includes("bisuter")) {
    return [
      { title: "Novedades", description: "Piezas recién añadidas." },
      { title: "Colecciones", description: "Series y líneas por estilo." },
      { title: "Regalos", description: "Ideas rápidas para regalar." },
      { title: "Edición limitada", description: "Pocas unidades disponibles." },
      { title: "Cuidados", description: "Limpieza y mantenimiento." },
    ];
  }

  if (s.includes("cosm") || s.includes("skincare") || s.includes("bellez")) {
    return [
      { title: "Rutina diaria", description: "Lo esencial para día a día." },
      { title: "Tratamientos", description: "Soluciones por objetivo (hidratación, etc.)." },
      { title: "Sets", description: "Packs con mejor precio." },
      { title: "Novedades", description: "Lanzamientos y reposiciones." },
      { title: "Top ventas", description: "Lo que más eligen nuestros clientes." },
    ];
  }

  return [
    { title: "Novedades", description: "Lanzamientos y reposiciones." },
    { title: "Top ventas", description: "Lo más vendido esta temporada." },
    { title: "Colecciones", description: "Por estilo, uso o temporada." },
    { title: "Ofertas", description: "Oportunidades puntuales." },
    { title: "Accesorios", description: "Complementos y extras." },
  ];
}

function smartCardsForDomain({ domain, businessType, servicesList, sector }) {
  if (businessType === "ecommerce" || domain === "ecommerce") {
    return smartEcommerceCategories({ sector });
  }

  if (domain === "hospitality") {
    return [
      { title: "Menú del día", description: "Opciones rápidas, producto de temporada." },
      { title: "Carta", description: "Platos principales y especialidades." },
      { title: "Parrilla / brasa", description: "Carnes y pescados al punto." },
      { title: "Grupos", description: "Eventos y celebraciones." },
      { title: "Postres", description: "Hechos en casa." },
    ];
  }

  if (domain === "health") {
    const fromServices = uniqueLimit(servicesList.map((x) => titleize(x)), 5).map((t) => ({
      title: t,
      description: "Valoración y plan claro desde la primera visita.",
    }));

    return fromServices.length >= 3
      ? fromServices
      : [
          { title: "Revisión y diagnóstico", description: "Plan de tratamiento claro y personalizado." },
          { title: "Limpieza dental", description: "Prevención y seguimiento." },
          { title: "Ortodoncia", description: "Opciones estéticas y funcionales." },
          { title: "Implantes", description: "Solución estable y profesional." },
          { title: "Estética dental", description: "Blanqueamiento y sonrisa natural." },
        ];
  }

  if (domain === "saas") {
    const fromServices = uniqueLimit(servicesList.map((x) => titleize(x)), 6).map((t) => ({
      title: t,
      description: "Configurable según equipo y proceso.",
    }));

    return fromServices.length >= 3
      ? fromServices
      : [
          { title: "Ticketing", description: "Incidencias centralizadas y priorización." },
          { title: "SLA", description: "Control de tiempos y escalados." },
          { title: "Automatización", description: "Asignación inteligente y reglas." },
          { title: "Métricas", description: "KPIs y visibilidad en tiempo real." },
          { title: "Knowledge base", description: "Respuestas rápidas y autoservicio." },
        ];
  }

  if (domain === "legal") {
    const fromServices = uniqueLimit(servicesList.map((x) => titleize(x)), 6).map((t) => ({
      title: t,
      description: "Estrategia clara, documentación bajo control.",
    }));

    return fromServices.length >= 3
      ? fromServices
      : [
          { title: "Laboral", description: "Despidos, reclamaciones y negociación." },
          { title: "Civil", description: "Contratos, herencias y conflictos." },
          { title: "Empresas", description: "Asesoría a pymes y prevención." },
          { title: "Reclamaciones", description: "Recuperación de cantidades." },
          { title: "Mediación", description: "Acuerdos extrajudiciales." },
        ];
  }

  if (servicesList.length) {
    return uniqueLimit(servicesList.map((x) => titleize(x)), 5).map((t) => ({
      title: t,
      description: "Servicio adaptado a tu caso.",
    }));
  }

  return [
    { title: "Solución 1", description: "Propuesta clara y enfocada." },
    { title: "Solución 2", description: "Implementación ordenada." },
    { title: "Solución 3", description: "Soporte y seguimiento." },
  ];
}

/* -----------------------------
  ✅ 5.2 RULES — bullets/steps/faq rulesets
----------------------------- */

function hasServiceLike(servicesList, pattern) {
  const p = pattern instanceof RegExp ? pattern : new RegExp(String(pattern), "i");
  return servicesList.some((s) => p.test(String(s)));
}

function buildBulletsRules({ domain, businessType, primaryGoal, goalDetail, servicesList }) {
  // Ecommerce guardrails: no prometer plazos si no están en servicios
  if (businessType === "ecommerce" || domain === "ecommerce") {
    const hasFastShip = hasServiceLike(servicesList, /(24\/48|24-48|24h|48h)/i);

    const b = [
      hasFastShip ? "Envío 24/48h (si aplica)" : "Envíos y seguimiento (según disponibilidad)",
      "Cambios y devoluciones claras",
      "Pago seguro y soporte rápido",
      "Guía de tallas y materiales (si aplica)",
    ];

    return b;
  }

  if (domain === "saas" && primaryGoal === "single_action") {
    const intent = classifySingleActionIntent(goalDetail);

    if (intent === "audit") {
      return [
        "Diagnóstico rápido del proceso",
        "Recomendaciones accionables",
        "Prioridades y roadmap",
        "Sin humo: foco en impacto",
      ];
    }
    if (intent === "trial") {
      return [
        "Prueba guiada con casos reales",
        "Configuración mínima",
        "Medición de resultados",
        "Decisión informada",
      ];
    }
    if (intent === "quote") {
      return [
        "Alcance claro antes de precio",
        "Opciones por tamaño de equipo",
        "Implantación y soporte",
        "Sin costes sorpresa",
      ];
    }
    if (intent === "call") {
      return [
        "Llamada breve y directa",
        "Entender contexto y objetivos",
        "Siguientes pasos claros",
        "Sin compromiso",
      ];
    }
    // demo/default
    return [
      "Implantación rápida sin fricción",
      "Visibilidad en tiempo real (KPIs)",
      "Automatización de tareas repetitivas",
      "Onboarding guiado",
    ];
  }

  // resto: deja lo base (5.1)
  return null;
}

function buildStepsForSaasIntent(intent) {
  if (intent === "audit") {
    return [
      { title: "Solicita auditoría", description: "Cuéntanos tu proceso actual y prioridades." },
      { title: "Analizamos", description: "Detectamos cuellos de botella y oportunidades." },
      { title: "Plan de acción", description: "Roadmap y próximos pasos claros." },
    ];
  }
  if (intent === "trial") {
    return [
      { title: "Solicita prueba", description: "Te damos acceso y contexto." },
      { title: "Configuración", description: "Ajustes mínimos para tu caso." },
      { title: "Evaluación", description: "Medimos impacto y decidimos." },
    ];
  }
  if (intent === "quote") {
    return [
      { title: "Define alcance", description: "Equipo, volumen y necesidades." },
      { title: "Propuesta", description: "Opciones claras y coste estimado." },
      { title: "Arranque", description: "Onboarding y primeros resultados." },
    ];
  }
  if (intent === "call") {
    return [
      { title: "Agenda llamada", description: "15–30 min para entender tu caso." },
      { title: "Recomendación", description: "Qué hacer primero y por qué." },
      { title: "Siguiente paso", description: "Roadmap rápido." },
    ];
  }
  // demo/default
  return [
    { title: "Solicita demo", description: "Cuéntanos tu caso y tu stack actual." },
    { title: "Te la mostramos", description: "Demo guiada con ejemplos reales." },
    { title: "Arranque", description: "Onboarding y primeros resultados en días." },
  ];
}

function buildFAQRules({ domain, primaryGoal, goalDetail }) {
  if (domain === "saas" && primaryGoal === "single_action") {
    const intent = classifySingleActionIntent(goalDetail);

    if (intent === "audit") {
      return {
        title: "Preguntas frecuentes",
        items: [
          { q: "¿En qué consiste la auditoría?", a: "Revisamos proceso, herramientas y puntos de fricción para proponer mejoras accionables." },
          { q: "¿Qué necesito preparar?", a: "Un resumen de tu flujo actual y objetivos. Si hay métricas, mejor, pero no es obligatorio." },
          { q: "¿Qué obtengo al final?", a: "Prioridades, recomendaciones y un roadmap por fases." },
          { q: "¿Es compatible con mi stack?", a: "Lo validamos en la primera llamada y adaptamos el plan." },
        ],
      };
    }

    if (intent === "trial") {
      return {
        title: "Preguntas frecuentes",
        items: [
          { q: "¿Hay prueba?", a: "Podemos plantear un piloto/periodo de prueba según el caso y alcance." },
          { q: "¿Cuánto tarda en estar listo?", a: "Depende de integraciones y volumen, pero priorizamos un arranque rápido." },
          { q: "¿Qué integraciones soportáis?", a: "Email y herramientas habituales; lo revisamos para tu caso." },
          { q: "¿Hay soporte?", a: "Sí, onboarding y soporte para asegurar adopción." },
        ],
      };
    }

    if (intent === "quote") {
      return {
        title: "Preguntas frecuentes",
        items: [
          { q: "¿Cómo se calcula el precio?", a: "Depende de usuarios, volumen e integraciones. Primero definimos alcance." },
          { q: "¿Hay permanencia?", a: "Depende de la propuesta. Lo dejamos claro antes de empezar." },
          { q: "¿Incluye onboarding?", a: "Sí, para asegurar que el equipo lo usa desde el inicio." },
          { q: "¿Qué pasa si necesito integraciones?", a: "Las evaluamos y priorizamos; algunas pueden requerir trabajo adicional." },
        ],
      };
    }

    if (intent === "call") {
      return {
        title: "Preguntas frecuentes",
        items: [
          { q: "¿Cuánto dura la llamada?", a: "Normalmente 15–30 minutos, con foco en objetivos y contexto." },
          { q: "¿Qué debo preparar?", a: "Tu flujo actual, herramientas y 2–3 problemas principales." },
          { q: "¿Qué ocurre después?", a: "Te proponemos el siguiente paso más eficiente (demo, piloto o plan)." },
          { q: "¿Es sin compromiso?", a: "Sí, la llamada es informativa." },
        ],
      };
    }

    // demo/default
    return {
      title: "Preguntas frecuentes",
      items: [
        { q: "¿Cuánto tarda la implantación?", a: "Normalmente días, dependiendo de integraciones y volumen." },
        { q: "¿Qué integraciones soportáis?", a: "Email y herramientas habituales; lo revisamos en la demo." },
        { q: "¿Es seguro y cumple?", a: "Aplicamos buenas prácticas y revisamos necesidades de cumplimiento." },
        { q: "¿Tenéis soporte y onboarding?", a: "Sí, guiado para que el equipo lo adopte rápido." },
      ],
    };
  }

  return null;
}

/* -----------------------------
  Copy builder (5.1 + 5.2 rules injection)
----------------------------- */

function buildCopyV1({ sector, location, target, goal, businessType, personality, servicesList }) {
  const domain = detectDomain(sector);
  const g = goal?.primary_goal || "capture_leads";
  const goalDetail = goal?.goal_detail || "";

  const servicesTitle =
    domain === "health" ? "Tratamientos y servicios"
    : domain === "saas" ? "Soluciones"
    : domain === "legal" ? "Áreas de práctica"
    : "Servicios";

  const cardsTitle =
    businessType === "ecommerce" ? "Categorías"
    : domain === "saas" ? "Módulos"
    : domain === "hospitality" ? "Especialidades"
    : domain === "health" ? "Tratamientos"
    : domain === "legal" ? "Áreas"
    : "Catálogo";

  // base bullets 5.1
  let bullets = [];
  if (domain === "health") {
    bullets = [
      "Atención cercana y profesional",
      "Transparencia en el plan de tratamiento",
      "Seguimiento y recordatorios de cita",
      location ? `Ubicación cómoda en ${location}` : "Ubicación cómoda y accesible",
    ];
  } else if (domain === "legal") {
    bullets = [
      "Estrategia clara desde el primer día",
      "Documentación y plazos bajo control",
      "Trato directo, sin intermediarios",
      "Presupuesto orientativo antes de iniciar",
    ];
  } else if (domain === "saas") {
    bullets = [
      "Implantación rápida sin fricción",
      "Visibilidad en tiempo real (KPIs)",
      "Automatización de tareas repetitivas",
      "Soporte y onboarding guiado",
    ];
  } else if (domain === "hospitality") {
    bullets = [
      "Producto de temporada",
      "Ambiente cuidado y auténtico",
      "Opciones para grupos y eventos",
      "Reserva fácil por contacto",
    ];
  } else if (businessType === "ecommerce") {
    bullets = [
      "Envíos y seguimiento (según disponibilidad)",
      "Cambios y devoluciones claras",
      "Pago seguro y soporte rápido",
      "Guía de tallas y materiales (si aplica)",
    ];
  } else {
    bullets = ["Profesionalidad", "Respuesta rápida", "Calidad y confianza"];
  }

  // ✅ 5.2-rules bullets override
  const bulletsOverride = buildBulletsRules({
    domain,
    businessType,
    primaryGoal: g,
    goalDetail,
    servicesList,
  });
  if (Array.isArray(bulletsOverride) && bulletsOverride.length) bullets = bulletsOverride;

  if (g === "single_action") {
    // keep compact pero sin perder sentido
    bullets = bullets.slice(0, 4);
    if (!bullets.some((x) => norm(x).includes("acción") || norm(x).includes("sin"))) {
      bullets.unshift("Una única acción, sin distracciones");
      bullets = bullets.slice(0, 4);
    }
  }

  const audienceLine = target ? `Orientado a ${target}.` : "";
  const sectorLine = sector ? `Especialistas en ${sector}.` : "";
  const locationLine = location ? `Atendemos en ${location} y alrededores.` : "";

  let valueLine = "";
  if (domain === "health") valueLine = "Cuidamos cada detalle para que tu experiencia sea cómoda, clara y sin sorpresas.";
  else if (domain === "legal") valueLine = "Convertimos un proceso complejo en un plan claro: pasos, plazos y opciones.";
  else if (domain === "saas") valueLine = "Reduce tiempos operativos y gana control con procesos simples y medibles.";
  else if (domain === "hospitality") valueLine = "Tradición y producto bien tratado, con un servicio cercano.";
  else if (businessType === "ecommerce") valueLine = "Compra rápida con información clara: envíos, cambios y soporte.";
  else valueLine = "Una propuesta clara, enfocada a resultados y a una experiencia de cliente impecable.";

  let toneLine = "";
  if (personality === "bold_street") toneLine = "Piezas que destacan. Stock que vuela. Decide rápido.";
  else if (personality === "tech_clean") toneLine = "Menos fricción. Más claridad. Todo medible.";
  else if (personality === "trust_authority") toneLine = "Confianza, rigor y respuesta rápida cuando importa.";
  else if (personality === "artisan_warm") toneLine = "Hecho con intención, con materiales y procesos honestos.";

  const servicesHint =
    servicesList.length >= 3
      ? `Servicios clave: ${servicesList.slice(0, 3).map(titleize).join(", ")}.`
      : "";

  // extra ecommerce info neutra (no promete)
  const ecommerceHint =
    businessType === "ecommerce"
      ? "Consulta tallas, materiales y condiciones antes de comprar."
      : "";

  const textBody = [
    firstNonEmpty(sectorLine, ""),
    firstNonEmpty(locationLine, ""),
    firstNonEmpty(audienceLine, ""),
    valueLine,
    servicesHint,
    ecommerceHint,
    toneLine,
  ]
    .map((x) => safeTrim(x))
    .filter(Boolean)
    .join(" ");

  const contactNote =
    g === "single_action"
      ? formatSingleActionNote(goal?.goal_detail)
      : g === "sell_online"
      ? "¿Dudas de talla, envíos o disponibilidad? Escríbenos y te ayudamos."
      : g === "book_appointments"
      ? "Reserva una cita y te confirmamos lo antes posible."
      : g === "show_catalog"
      ? "Pídenos información y te orientamos según tu caso."
      : "Escríbenos y te respondemos en breve.";

  return { servicesTitle, cardsTitle, bullets, textBody, contactNote, domain };
}

/* -----------------------------
  Proof generators (con 5.2 rules en FAQ SaaS single_action)
----------------------------- */

function buildTestimonials(domain, primaryGoal) {
  if (domain === "health" || primaryGoal === "book_appointments") {
    return {
      title: "Opiniones de pacientes",
      items: [
        { name: "Paciente verificado", role: "Tratamiento dental", quote: "Trato impecable y explicaciones claras. La cita fue rápida y sin sorpresas." },
        { name: "Laura G.", role: "Ortodoncia", quote: "Muy profesionales. Me dieron un plan claro y seguimiento en todo momento." },
        { name: "Iñaki M.", role: "Implantes", quote: "Instalaciones cuidadas y atención cercana. Repetiría sin dudar." },
      ],
    };
  }

  if (domain === "saas" || primaryGoal === "single_action") {
    return {
      title: "Equipos que ya lo usan",
      items: [
        { name: "Ops Manager", role: "Pyme 80 empleados", quote: "Reducimos tiempos de gestión y ahora vemos el estado de todo en minutos." },
        { name: "Responsable IT", role: "Servicios", quote: "Onboarding rápido y métricas claras. El equipo lo adoptó sin fricción." },
        { name: "COO", role: "Industria", quote: "Automatizamos asignaciones y mejoramos SLA desde la primera semana." },
      ],
    };
  }

  return {
    title: "Clientes satisfechos",
    items: [
      { name: "Cliente", role: "Servicio", quote: "Respuesta rápida y un servicio muy profesional." },
      { name: "Cliente", role: "Proyecto", quote: "Todo claro desde el principio. Buena comunicación." },
      { name: "Cliente", role: "Empresa", quote: "Resultados sólidos y trato cercano." },
    ],
  };
}

function buildFAQ(domain, primaryGoal, goalDetail) {
  // ✅ 5.2 rules override para SaaS landing
  const override = buildFAQRules({ domain, primaryGoal, goalDetail });
  if (override) return override;

  if (domain === "health" || primaryGoal === "book_appointments") {
    return {
      title: "Preguntas frecuentes",
      items: [
        { q: "¿Cómo reservo una cita?", a: "Escríbenos desde el formulario y te confirmamos la primera disponibilidad." },
        { q: "¿Atendéis urgencias?", a: "Sí, indícalo en el mensaje y priorizamos la respuesta." },
        { q: "¿Cuánto dura la primera visita?", a: "Suele durar 30–45 min, según el caso." },
        { q: "¿Ofrecéis financiación?", a: "Podemos ofrecer opciones según tratamiento. Consúltanos." },
      ],
    };
  }

  if (domain === "saas" || primaryGoal === "single_action") {
    return {
      title: "Preguntas frecuentes",
      items: [
        { q: "¿Cuánto tarda la implantación?", a: "Normalmente días, dependiendo de integraciones y volumen." },
        { q: "¿Qué integraciones soportáis?", a: "Email y herramientas habituales; lo revisamos en la demo." },
        { q: "¿Es seguro y cumple?", a: "Aplicamos buenas prácticas y revisamos necesidades de cumplimiento." },
        { q: "¿Tenéis soporte y onboarding?", a: "Sí, guiado para que el equipo lo adopte rápido." },
      ],
    };
  }

  return {
    title: "Preguntas frecuentes",
    items: [
      { q: "¿Cómo contacto?", a: "Rellena el formulario y te respondemos en breve." },
      { q: "¿Cuánto tarda?", a: "Depende del caso; te damos un primer feedback rápido." },
      { q: "¿Ofrecéis presupuesto?", a: "Sí, te orientamos según necesidad." },
      { q: "¿Trabajáis con empresas?", a: "Sí, particulares y pymes según el servicio." },
    ],
  };
}

/* -----------------------------
  Main
----------------------------- */

export async function generateSiteV2(clientBrief) {
  const businessName = safeTrim(clientBrief?.business_name) || "Next Business";
  const sector = safeTrim(clientBrief?.sector);
  const location = safeTrim(clientBrief?.location);
  const target = safeTrim(clientBrief?.target_audience);

  const servicesInput = servicesFromUserInput(clientBrief?.services);
  const tone = safeTrim(clientBrief?.tone) || "neutral";
  const seedRaw = safeTrim(clientBrief?.seed);
  const seed = seedRaw ? Number(seedRaw) || 0 : 0;

  const goal = clientBrief?.goal || {
    primary_goal: "capture_leads",
    conversion_mode: "quote_or_contact",
    goal_text: "Captar contactos / presupuesto",
    goal_detail: "",
  };

  function pickPrimaryCTA(goal) {
    const g = goal?.primary_goal || "capture_leads";
    const detail = safeTrim(goal?.goal_detail);

    if (g === "single_action" && detail) return detail;
    if (g === "sell_online") return "Comprar";
    if (g === "book_appointments") return "Reservar cita";
    if (g === "show_catalog") return "Ver catálogo";
    if (g === "present_brand") return "Conocer la empresa";
    if (g === "capture_leads") return "Solicitar presupuesto";
    return "Contactar";
  }

  const businessType = pickBusinessTypeFromGoal(goal);
  const pack = pickPack(businessType, goal);
  const personality = pickPersonality(businessType, goal, sector);

  const slug = slugify(businessName);
  const primaryGoal = goal?.primary_goal || "capture_leads";
  const archetype = pickArchetype(primaryGoal, pack);

  const domain = detectDomain(sector);
  const goalDetail = safeTrim(goal?.goal_detail);

  // ✅ Servicios semánticos: si el usuario no mete, defaults por dominio
  const servicesList = servicesInput.length ? servicesInput : smartDefaultServices(domain);

  // ✅ Cards semánticas (categorías/módulos/tratamientos/áreas)
  const smartCards = smartCardsForDomain({
    domain,
    businessType,
    servicesList,
    sector,
  });

  const copy = buildCopyV1({
    sector,
    location,
    target,
    goal,
    businessType,
    personality,
    servicesList,
  });

  // ✅ 5.2 rules: steps SaaS según intent
  const saasIntent = domain === "saas" && primaryGoal === "single_action"
    ? classifySingleActionIntent(goalDetail)
    : null;

  const stepsItems =
    primaryGoal === "book_appointments"
      ? [
          { title: "Elige tu hora", description: "Cuéntanos qué día te encaja y el motivo de la visita." },
          { title: "Confirmación rápida", description: "Te confirmamos la cita y lo que necesitas traer." },
          { title: "Te atendemos", description: "Tratamiento claro y recomendaciones personalizadas." },
        ]
      : saasIntent
      ? buildStepsForSaasIntent(saasIntent)
      : [
          { title: "Cuéntanos tu caso", description: "Un par de detalles para entender tu necesidad." },
          { title: "Te proponemos la mejor opción", description: "Respuesta clara y sin rodeos." },
          { title: "Empezamos", description: "Te guiamos en los siguientes pasos." },
        ];

  const testimonials = buildTestimonials(domain, primaryGoal);
  const faq = buildFAQ(domain, primaryGoal, goalDetail);

  const spec = {
    version: "2.0",
    meta: {
      locale: "es-ES",
      site_id: slug,
      seed,
    },

    business: {
      name: businessName,
      slug,
      type: businessType,
      sector,
      location,
      target_audience: target,
    },

    strategy: {
      web_strategy: pack,
      primary_goal: primaryGoal,
      conversion_mode: goal.conversion_mode || "quote_or_contact",
      goal_text: goal.goal_text || "",
      goal_detail: goal.goal_detail || "",
    },

    brand: {
      brand_personality: personality,
      brand_expression: {
        tone,
        imagery_style: businessType === "ecommerce" ? "product" : "mixed",
        layout_risk: "safe",
        density: "medium",
        visual_energy: "balanced",
        boldness: "medium",
      },
      design_tokens: {
        colors: {
          bg: "#ffffff",
          text: "#111111",
          primary: "#111111",
          muted: "#666666",
        },
      },
    },

    layout: {
      pack,
      archetype,
      pages: {
        home: {
          sections: buildHomeSectionsForGoal(goal, pack, archetype),
        },
      },
    },

    modules: {
      hero_auto: {
        headline: businessName,
        subheadline: sector
          ? `${sector}${location ? ` · ${location}` : ""}`
          : location
          ? location
          : "Sitio generado automáticamente",
        cta_primary: pickPrimaryCTA(goal),
        cta_secondary: "Saber más",
      },

      services_auto: {
        title: copy.servicesTitle || "Servicios",
        items: servicesList.map((s) => ({ title: titleize(s) })),
      },

      bullets_auto: {
        title: "Por qué elegirnos",
        items: (copy.bullets || ["Profesionalidad", "Respuesta rápida", "Calidad y confianza"])
          .slice(0, 4)
          .map((t) => ({ title: t })),
      },

      cards_auto: {
        title: copy.cardsTitle || (businessType === "ecommerce" ? "Categorías" : "Catálogo"),
        items: smartCards.map((it) => ({
          title: titleize(it.title),
          description: safeTrim(it.description),
        })),
      },

      text_auto: {
        title: "Sobre nosotros",
        body: copy.textBody || "Una propuesta clara, enfocada a resultados y a una experiencia de cliente impecable.",
      },

      steps_auto: {
        title: "Cómo funciona",
        items: stepsItems,
      },

      testimonials_auto: testimonials,
      faq_auto: faq,

      contact_auto: {
        title: "Contacto",
        note: copy.contactNote || "Escríbenos y te respondemos en breve.",
      },
    },

    contact: {
      phone: "",
      email: "",
      address: location || "",
    },

    seo: {
      title: businessName,
      description: sector ? `${businessName} · ${sector}` : businessName,
    },
  };

  return spec;
}
