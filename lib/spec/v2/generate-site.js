// lib/spec/v2/generate-site.js

function safeTrim(v) {
  return (v ?? "").toString().trim();
}

function slugify(input) {
  const s = safeTrim(input).toLowerCase();
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "nb-site";
}

function pickBusinessTypeFromGoal(goal) {
  const g = goal?.primary_goal || "";
  if (g === "sell_online") return "ecommerce";
  if (g === "book_appointments") return "local_service";
  return "generic";
}

function pickPack(businessType, goal) {
  // El único pack “especial” que tu código usa hoy en resolveLayout es ecommerce_conversion
  if (businessType === "ecommerce" || goal?.primary_goal === "sell_online") return "ecommerce_conversion";
  return "generic";
}

function pickPersonality(businessType, goal, sector) {
  const g = goal?.primary_goal || "";
  const s = (sector || "").toLowerCase();

  // Reglas simples y estables (sin humo)
  if (businessType === "ecommerce") return "modern_minimal";

  // Corporate / B2B suele requerir “confianza”
  if (g === "present_brand") return "corporate_b2b";
  if (g === "capture_leads" || g === "book_appointments") return "trust_authority";

  // Landing puede ir más “premium” o más “bold” según sector (por ahora premium)
  if (g === "single_action") return "premium_elegant";

  // Catálogo / informativa
  if (g === "show_catalog") return "premium_elegant";

  // Si detectamos sectores muy “serios”
  if (s.includes("abogado") || s.includes("asesor") || s.includes("ingenier") || s.includes("consult")) {
    return "corporate_b2b";
  }

  return "premium_elegant";
}

function buildHomeSectionsForGoal(goal, pack) {
  const g = goal?.primary_goal || "capture_leads";

  // Módulos soportados por PacksRouter hoy:
  // hero, cards, bullets, services, text, contact
  // Variants: resolveLayout reescribe variantes en pack ecommerce_conversion.

  // Ecommerce (pack especial)
  if (pack === "ecommerce_conversion") {
    return [
      { module: "hero", variant: "hero_product_minimal_v1", props_ref: "modules.hero_auto" },
      { module: "cards", variant: "cards_auto_v1", props_ref: "modules.cards_auto" },      // categorías/productos
      { module: "bullets", variant: "bullets_auto_v1", props_ref: "modules.bullets_auto" }, // beneficios
      { module: "text", variant: "text_auto_v1", props_ref: "modules.text_auto" },          // historia / valor
      { module: "contact", variant: "contact_auto_v1", props_ref: "modules.contact_auto" }, // WhatsApp / contacto
    ];
  }

  // Landing / acción única
  if (g === "single_action") {
    return [
      { module: "hero", variant: "hero_product_minimal_v1", props_ref: "modules.hero_auto" },
      { module: "bullets", variant: "bullets_auto_v1", props_ref: "modules.bullets_auto" },
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

  // Reservas / citas
  if (g === "book_appointments") {
    return [
      { module: "hero", variant: "hero_product_minimal_v1", props_ref: "modules.hero_auto" },
      { module: "services", variant: "services_grid_auto_v1", props_ref: "modules.services_auto" },
      { module: "text", variant: "text_auto_v1", props_ref: "modules.text_auto" },
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

  const businessType = pickBusinessTypeFromGoal(goal);
  const pack = pickPack(businessType, goal);
  const personality = pickPersonality(businessType, goal, sector);

  const slug = slugify(businessName);

  // Spec V2 mínimo y compatible: preview lo normaliza y resolveLayout ajusta variantes
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
        // Tokens mínimos: PacksRouter usa CSS vars; si faltan, no rompe (normalizeV2 también mete defaults)
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
        subheadline:
          sector
            ? `${sector}${location ? ` · ${location}` : ""}`
            : location
              ? location
              : "Sitio generado automáticamente",
        cta_primary: goal.primary_goal === "sell_online" ? "Comprar" : "Contactar",
        cta_secondary: "Saber más",
      },

      services_auto: {
        title: "Servicios",
        items: services.length
          ? services.map((s) => ({ title: safeTrim(s) }))
          : [{ title: "Servicio 1" }, { title: "Servicio 2" }, { title: "Servicio 3" }],
      },

      bullets_auto: {
        title: "Por qué elegirnos",
        items: [
          { title: "Profesionalidad" },
          { title: "Respuesta rápida" },
          { title: "Calidad y confianza" },
        ],
      },

      cards_auto: {
        title: businessType === "ecommerce" ? "Categorías" : "Catálogo",
        items: [
          { title: "Opción 1", description: "" },
          { title: "Opción 2", description: "" },
          { title: "Opción 3", description: "" },
        ],
      },

      text_auto: {
        title: "Sobre nosotros",
        body:
          "Presentación breve del negocio, su propuesta de valor y lo que lo hace diferente. " +
          "Este texto se refinará con generación semántica premium en el siguiente paso.",
      },

      contact_auto: {
        title: "Contacto",
        note:
          goal.primary_goal === "book_appointments"
            ? "Reserva una cita y te confirmamos lo antes posible."
            : "Escríbenos y te respondemos en breve.",
      },
    },

    contact: {
      // Esto se puede completar luego desde el form (tel/email/whatsapp)
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
