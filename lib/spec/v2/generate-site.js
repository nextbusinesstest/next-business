// lib/spec/v2/generate-site.js

function safeTrim(v) {
  return (v ?? "").toString().trim();
}

function slugify(input) {
  const s = safeTrim(input).toLowerCase();
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita acentos
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
  // El único pack “especial” que tu código usa hoy en resolveLayout es ecommerce_conversion
  if (businessType === "ecommerce" || goal?.primary_goal === "sell_online")
    return "ecommerce_conversion";
  return "generic";
}

function pickPersonality(businessType, goal, sector) {
  // OJO: ahora la personalidad “real” la aplica pages/api/generate-site.js con auto_personality.
  // Aquí lo mantenemos como fallback razonable.
  const g = goal?.primary_goal || "";
  const s = (sector || "").toLowerCase();

  if (businessType === "ecommerce") return "modern_minimal";

  if (g === "present_brand") return "corporate_b2b";
  if (g === "capture_leads" || g === "book_appointments")
    return "trust_authority";

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

function buildHomeSectionsForGoal(goal, pack) {
  const g = goal?.primary_goal || "capture_leads";

  // Ecommerce (pack especial)
  if (pack === "ecommerce_conversion") {
    return [
      { module: "hero", variant: "hero_product_minimal_v1", props_ref: "modules.hero_auto" },
      { module: "cards", variant: "cards_auto_v1", props_ref: "modules.cards_auto" },
      { module: "bullets", variant: "bullets_auto_v1", props_ref: "modules.bullets_auto" },
      { module: "text", variant: "text_auto_v1", props_ref: "modules.text_auto" },
      { module: "contact", variant: "contact_auto_v1", props_ref: "modules.contact_auto" },
    ];
  }

  // ✅ Landing / acción única (v2: añadimos steps)
  if (g === "single_action") {
    return [
      { module: "hero", variant: "hero_product_minimal_v1", props_ref: "modules.hero_auto" },
      { module: "bullets", variant: "bullets_auto_v1", props_ref: "modules.bullets_auto" },
      { module: "steps", variant: "steps_auto_v1", props_ref: "modules.steps_auto" }, // ✅ nuevo
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

  // ✅ Reservas / citas (v2: sustituimos text por steps para estructura)
  if (g === "book_appointments") {
    return [
      { module: "hero", variant: "hero_product_minimal_v1", props_ref: "modules.hero_auto" },
      { module: "services", variant: "services_grid_auto_v1", props_ref: "modules.services_auto" },
      { module: "steps", variant: "steps_auto_v1", props_ref: "modules.steps_auto" }, // ✅ nuevo
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

  if (
    s.includes("dental") ||
    s.includes("clín") ||
    s.includes("clin") ||
    s.includes("odont") ||
    s.includes("salud")
  ) {
    return "health";
  }
  if (
    s.includes("abog") ||
    s.includes("legal") ||
    s.includes("desp") ||
    s.includes("laboral") ||
    s.includes("civil")
  ) {
    return "legal";
  }
  if (
    s.includes("saas") ||
    s.includes("software") ||
    s.includes("plataforma") ||
    s.includes("incid") ||
    s.includes("ticket")
  ) {
    return "saas";
  }
  if (
    s.includes("rest") ||
    s.includes("asador") ||
    s.includes("bar") ||
    s.includes("cafe") ||
    s.includes("hostel")
  ) {
    return "hospitality";
  }
  if (
    s.includes("zapat") ||
    s.includes("ropa") ||
    s.includes("moda") ||
    s.includes("tienda") ||
    s.includes("ecommerce")
  ) {
    return "ecommerce";
  }
  return "generic";
}

function firstNonEmpty(...arr) {
  for (const v of arr) {
    const t = safeTrim(v);
    if (t) return t;
  }
  return "";
}

function buildCopyV1({
  businessName,
  sector,
  location,
  target,
  goal,
  businessType,
  personality,
}) {
  const domain = detectDomain(sector);
  const g = goal?.primary_goal || "capture_leads";

  // Titles
  const servicesTitle =
    domain === "health"
      ? "Tratamientos y servicios"
      : domain === "saas"
      ? "Soluciones"
      : domain === "legal"
      ? "Áreas de práctica"
      : "Servicios";

  const cardsTitle =
    businessType === "ecommerce"
      ? "Categorías"
      : domain === "saas"
      ? "Módulos"
      : domain === "hospitality"
      ? "Especialidades"
      : "Catálogo";

  // Bullets por dominio/goal
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

  // Ajustes por goal (para que no sea solo “genérico”)
  if (g === "single_action") {
    bullets = bullets.slice(0, 3);
    bullets.unshift("Una única acción, sin distracciones");
  }
  if (g === "book_appointments" && domain !== "health") {
    bullets = bullets.slice(0, 3);
    bullets.unshift("Reserva sencilla y confirmación rápida");
  }

  // Text body por dominio + personalidad
  const audienceLine = target ? `Orientado a ${target}.` : "";
  const sectorLine = sector ? `Especialistas en ${sector}.` : "";
  const locationLine = location ? `Atendemos en ${location} y alrededores.` : "";

  let valueLine = "";
  if (domain === "health")
    valueLine = "Cuidamos cada detalle para que tu experiencia sea cómoda, clara y sin sorpresas.";
  else if (domain === "legal")
    valueLine = "Convertimos un proceso complejo en un plan claro: pasos, plazos y opciones.";
  else if (domain === "saas")
    valueLine = "Reduce tiempos operativos y gana control con procesos simples y medibles.";
  else if (domain === "hospitality")
    valueLine = "Tradición y producto bien tratado, con un servicio cercano.";
  else if (businessType === "ecommerce")
    valueLine = "Diseño, calidad y disponibilidad: compra rápida, soporte real y políticas claras.";
  else
    valueLine = "Una propuesta clara, enfocada a resultados y a una experiencia de cliente impecable.";

  // “tono” por personalidad (ligero, no invasivo)
  let toneLine = "";
  if (personality === "bold_street")
    toneLine = "Piezas que destacan. Stock que vuela. Decide rápido.";
  else if (personality === "tech_clean")
    toneLine = "Menos fricción. Más claridad. Todo medible.";
  else if (personality === "trust_authority")
    toneLine = "Confianza, rigor y respuesta rápida cuando importa.";
  else if (personality === "artisan_warm")
    toneLine = "Hecho con intención, con materiales y procesos honestos.";

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

  function formatSingleActionNote(detail) {
    const d = safeTrim(detail);
    if (!d) return "Solicita una demo y te respondemos en breve.";

    const startsWithVerb =
      /^(solicita(r)?|pide(r)?|reserva(r)?|contacta(r)?|obt(e|é)n(er)?|descarga(r)?|agenda(r)?)\b/i.test(d);

    return startsWithVerb
      ? `${d} y te respondemos en breve.`
      : `Solicita ${d} y te respondemos en breve.`;
  }

  // Contact note por objetivo
  const contactNote =
    g === "book_appointments"
      ? "Reserva una cita y te confirmamos lo antes posible."
      : g === "single_action"
      ? (domain === "saas"
          ? "Solicita una demo y te respondemos en breve."
          : "Déjanos tus datos y te respondemos en breve.")
      : g === "sell_online"
      ? "¿Dudas de talla, envíos o disponibilidad? Escríbenos y te ayudamos."
      : g === "show_catalog"
      ? "Pídenos información y te orientamos según tu caso."
      : "Escríbenos y te respondemos en breve.";

  return {
    servicesTitle,
    cardsTitle,
    bullets,
    textBody,
    contactNote,
    domain,
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

  const copy = buildCopyV1({
    businessName,
    sector,
    location,
    target,
    goal,
    businessType,
    personality,
  });

  // ✅ Steps por objetivo / dominio (pequeño ajuste “premium”)
  const g = goal?.primary_goal || "capture_leads";
  const stepsItems =
    g === "book_appointments"
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
      primary_goal: goal.primary_goal || "capture_leads",
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
      pages: {
        home: {
          sections: buildHomeSectionsForGoal(goal, pack),
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

      // ✅ módulo nuevo
      steps_auto: {
        title: "Cómo funciona",
        items: stepsItems,
      },

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
