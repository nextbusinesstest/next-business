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

// ✅ Bloque 4.4: arquetipo ecommerce premium
function pickArchetype(primaryGoal, pack) {
  if (pack === "ecommerce_conversion") return "ecommerce_premium_v1";
  if (primaryGoal === "book_appointments") return "booking_trust_v1";
  if (primaryGoal === "single_action") return "saas_landing_v1";
  return "default_v1";
}

/**
 * ✅ Bloque 4.4: ecommerce premium variants reales
 * - hero_product_split_v1
 * - categories_scroller_min_v1
 * - benefits_cards_min_v1
 * - contact_center_min_v1
 */
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
  Copy premium v1 (sin LLM)
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

function formatSingleActionNote(detail) {
  const d = safeTrim(detail);
  if (!d) return "Solicita una demo y te respondemos en breve.";

  const startsWithVerb =
    /^(solicita(r)?|pide(r)?|reserva(r)?|contacta(r)?|obt(e|é)n(er)?|descarga(r)?|agenda(r)?)\b/i.test(d);

  if (startsWithVerb) {
    if (/^solicitar\b/i.test(d)) return "Solicita una demo y te respondemos en breve.";
    if (/^pedir\b/i.test(d)) return "Pide información y te respondemos en breve.";
    if (/^reservar\b/i.test(d)) return "Reserva una cita y te respondemos en breve.";
    return `${d} y te respondemos en breve.`;
  }

  return `Solicita ${d} y te respondemos en breve.`;
}

function buildCopyV1({ sector, location, target, goal, businessType, personality }) {
  const domain = detectDomain(sector);
  const g = goal?.primary_goal || "capture_leads";

  const servicesTitle =
    domain === "health" ? "Tratamientos y servicios"
    : domain === "saas" ? "Soluciones"
    : domain === "legal" ? "Áreas de práctica"
    : "Servicios";

  const cardsTitle =
    businessType === "ecommerce" ? "Categorías"
    : domain === "saas" ? "Módulos"
    : domain === "hospitality" ? "Especialidades"
    : "Catálogo";

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
      "Envío 24/48h en península*",
      "Cambios y devoluciones claras",
      "Pago seguro y soporte rápido",
      "Drops / stock limitado (si aplica)",
    ];
  } else {
    bullets = ["Profesionalidad", "Respuesta rápida", "Calidad y confianza"];
  }

  if (g === "single_action") {
    bullets = bullets.slice(0, 3);
    bullets.unshift("Una única acción, sin distracciones");
  }

  const audienceLine = target ? `Orientado a ${target}.` : "";
  const sectorLine = sector ? `Especialistas en ${sector}.` : "";
  const locationLine = location ? `Atendemos en ${location} y alrededores.` : "";

  let valueLine = "";
  if (domain === "health") valueLine = "Cuidamos cada detalle para que tu experiencia sea cómoda, clara y sin sorpresas.";
  else if (domain === "legal") valueLine = "Convertimos un proceso complejo en un plan claro: pasos, plazos y opciones.";
  else if (domain === "saas") valueLine = "Reduce tiempos operativos y gana control con procesos simples y medibles.";
  else if (domain === "hospitality") valueLine = "Tradición y producto bien tratado, con un servicio cercano.";
  else if (businessType === "ecommerce") valueLine = "Diseño, calidad y disponibilidad: compra rápida, soporte real y políticas claras.";
  else valueLine = "Una propuesta clara, enfocada a resultados y a una experiencia de cliente impecable.";

  let toneLine = "";
  if (personality === "bold_street") toneLine = "Piezas que destacan. Stock que vuela. Decide rápido.";
  else if (personality === "tech_clean") toneLine = "Menos fricción. Más claridad. Todo medible.";
  else if (personality === "trust_authority") toneLine = "Confianza, rigor y respuesta rápida cuando importa.";
  else if (personality === "artisan_warm") toneLine = "Hecho con intención, con materiales y procesos honestos.";

  const textBody = [
    firstNonEmpty(sectorLine, ""),
    firstNonEmpty(locationLine, ""),
    firstNonEmpty(audienceLine, ""),
    valueLine,
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
  Proof generators (igual)
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

function buildFAQ(domain, primaryGoal) {
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

export async function generateSiteV2(clientBrief) {
  const businessName = safeTrim(clientBrief?.business_name) || "Next Business";
  const sector = safeTrim(clientBrief?.sector);
  const location = safeTrim(clientBrief?.location);
  const target = safeTrim(clientBrief?.target_audience);

  const services = Array.isArray(clientBrief?.services) ? clientBrief.services : [];
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

  const copy = buildCopyV1({
    sector,
    location,
    target,
    goal,
    businessType,
    personality,
  });

  const stepsItems =
    primaryGoal === "book_appointments"
      ? [
          { title: "Elige tu hora", description: "Cuéntanos qué día te encaja y el motivo de la visita." },
          { title: "Confirmación rápida", description: "Te confirmamos la cita y lo que necesitas traer." },
          { title: "Te atendemos", description: "Tratamiento claro y recomendaciones personalizadas." },
        ]
      : copy.domain === "saas"
      ? [
          { title: "Solicita demo", description: "Cuéntanos tu caso y tu stack actual." },
          { title: "Te la mostramos", description: "Demo guiada con ejemplos reales." },
          { title: "Arranque", description: "Onboarding y primeros resultados en días." },
        ]
      : [
          { title: "Cuéntanos tu caso", description: "Un par de detalles para entender tu necesidad." },
          { title: "Te proponemos la mejor opción", description: "Respuesta clara y sin rodeos." },
          { title: "Empezamos", description: "Te guiamos en los siguientes pasos." },
        ];

  const testimonials = buildTestimonials(copy.domain, primaryGoal);
  const faq = buildFAQ(copy.domain, primaryGoal);

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
        items: services.length
          ? services.map((s) => ({ title: safeTrim(s) }))
          : [{ title: "Servicio 1" }, { title: "Servicio 2" }, { title: "Servicio 3" }],
      },

      bullets_auto: {
        title: "Por qué elegirnos",
        items: (copy.bullets || ["Profesionalidad", "Respuesta rápida", "Calidad y confianza"])
          .slice(0, 4)
          .map((t) => ({ title: t })),
      },

      cards_auto: {
        title: copy.cardsTitle || (businessType === "ecommerce" ? "Categorías" : "Catálogo"),
        items: [
          { title: "Opción 1", description: "" },
          { title: "Opción 2", description: "" },
          { title: "Opción 3", description: "" },
        ],
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
