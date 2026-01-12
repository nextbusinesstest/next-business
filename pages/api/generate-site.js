// pages/api/generate-site.js
import { normalizeV2 } from "../../lib/spec/v2/normalize";
import { resolveV2Layout } from "../../lib/spec/v2/resolveLayout";

function safeStr(v) {
  return (v || "").toString().trim();
}

function pickBusinessTypeFromIndustry(industry) {
  const i = safeStr(industry).toLowerCase();
  if (i.includes("e-commerce") || i.includes("ecommerce") || i.includes("tienda online")) return "ecommerce";
  if (i.includes("comercio") || i.includes("retail")) return "ecommerce";
  if (i.includes("servicio") || i.includes("instal") || i.includes("mantenimiento") || i.includes("reformas")) return "local_service";
  return "generic";
}

function pickPack(businessType) {
  if (businessType === "ecommerce") return "ecommerce_conversion";
  if (businessType === "local_service") return "local_service_trust";
  return "brand_premium";
}

function pickPersonality(businessType, goal) {
  if (businessType === "local_service") return "trust_authority";
  if (businessType === "ecommerce") return "modern_minimal";
  if (goal === "brand") return "premium_elegant";
  return "modern_minimal";
}

function defaultExpression(personality) {
  switch (personality) {
    case "trust_authority":
      return {
        boldness: "low",
        visual_energy: "balanced",
        layout_risk: "safe",
        imagery_style: "human",
        tone: "assertive",
        density: "medium",
      };
    case "premium_elegant":
      return {
        boldness: "low",
        visual_energy: "calm",
        layout_risk: "safe",
        imagery_style: "lifestyle",
        tone: "neutral",
        density: "light",
      };
    case "bold_disruptive":
      return {
        boldness: "high",
        visual_energy: "dynamic",
        layout_risk: "creative",
        imagery_style: "lifestyle",
        tone: "assertive",
        density: "medium",
      };
    case "modern_minimal":
    default:
      return {
        boldness: "low",
        visual_energy: "balanced",
        layout_risk: "safe",
        imagery_style: "product",
        tone: "neutral",
        density: "light",
      };
  }
}

function mapThemeToTokens(theme) {
  if (!theme) return {};
  return { colors: theme };
}

function sectionsFromBrief(businessType, services = []) {
  // La idea: composición base por tipo. Luego resolveLayout inyecta hero/variantes.
  if (businessType === "ecommerce") {
    return [
      { id: "categories", type: "cards" },
      { id: "benefits", type: "bullets" },
      { id: "services", type: "services_grid" },
      { id: "about", type: "text" },
      { id: "contact_section", type: "contact" },
    ];
  }

  if (businessType === "local_service") {
    return [
      { id: "services", type: "services_grid" },
      { id: "process", type: "steps" }, // aunque aún no lo renderice PacksRouter, se verá en fallback (debug)
      { id: "trust", type: "bullets" },
      { id: "about", type: "text" },
      { id: "contact_section", type: "contact" },
    ];
  }

  return [
    { id: "services", type: "services_grid" },
    { id: "about", type: "text" },
    { id: "contact_section", type: "contact" },
  ];
}

function buildModulesFromBrief(brief, businessType) {
  const name = safeStr(brief.business_name || brief.businessName || "Empresa");
  const services = Array.isArray(brief.services) ? brief.services : [];

  const modules = {};

  // Categories (si ecommerce)
  if (businessType === "ecommerce") {
    modules.categories = {
      id: "categories",
      type: "cards",
      title: "Compra por categorías",
      items: [
        { name: "Novedades", description: "Lo más reciente y destacado." },
        { name: "Básicos", description: "Imprescindibles para el día a día." },
        { name: "Ofertas", description: "Selección con buena relación calidad/precio." },
      ],
    };

    modules.benefits = {
      id: "benefits",
      type: "bullets",
      title: "Compra sin complicaciones",
      bullets: [
        "Proceso de compra sencillo y claro",
        "Ayuda para resolver dudas antes de comprar",
        "Condiciones transparentes",
      ],
    };
  }

  modules.services = {
    id: "services",
    type: "services_grid",
    title: businessType === "ecommerce" ? "Qué encontrarás" : "Servicios",
    items: services.length
      ? services.map((s) => ({
          name: safeStr(s),
          description: `Información y opciones sobre ${safeStr(s).toLowerCase()} pensadas para facilitar la decisión del cliente.`,
        }))
      : [
          {
            name: "Servicio principal",
            description: "Descripción breve del servicio principal.",
          },
        ],
  };

  modules.about = {
    id: "about",
    type: "text",
    title: `Sobre ${name}`,
    body: `${name} ofrece ${safeStr(brief.business_type || brief.type || "sus servicios")} con un enfoque profesional: información clara, buena experiencia y atención directa cuando hace falta.`,
  };

  modules.contact_section = {
    id: "contact_section",
    type: "contact",
    title: "Contacto",
    body: "Ponte en contacto para resolver dudas o solicitar más información.",
    form: { enabled: businessType !== "ecommerce" }, // ejemplo: servicios suelen usar form
  };

  return modules;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { client_brief, ...rest } = req.body || {};
    const brief = client_brief || rest || {};

    const name = safeStr(brief.business_name || brief.businessName);
    const slug = safeStr(brief.slug) || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const industry = safeStr(brief.industry);
    const goal = safeStr(brief.goal);

    const business_type = pickBusinessTypeFromIndustry(industry || brief.business_type || brief.type);
    const pack = pickPack(business_type);

    const personality = pickPersonality(business_type, goal);
    const expression = defaultExpression(personality);

    // Tema (si viene) -> tokens
    const themeTokens = mapThemeToTokens(brief.theme);

    // Construcción de sections V2
    const baseSections = sectionsFromBrief(business_type, brief.services);

    // Montar V2 mínimo
    let specV2 = {
      version: "2.0",
      meta: {
        locale: "es-ES",
        site_id: slug || "nb-site",
        seed: Math.floor(Math.random() * 100000),
      },
      business: {
        name: name || "Empresa",
        slug: slug || "empresa",
        business_type,
      },
      strategy: {
        web_strategy: business_type === "ecommerce" ? "fast_conversion" : "lead_generation",
        primary_goal: business_type === "ecommerce" ? "purchase" : "request_quote",
        trust_level_required: business_type === "local_service" ? "high" : "medium",
      },
      brand: {
        brand_personality: personality,
        brand_expression: expression,
        design_tokens: themeTokens,
      },
      seo: {
        title: `${name || "Empresa"} | ${industry || "Negocio"}`,
        description: `${name || "Empresa"} · Información clara, contacto directo y una presencia online pensada para convertir.`,
      },
      navigation: { items: [], ctas: {} },
      layout: {
        pack,
        header_variant: business_type === "local_service" ? "header_trust_v1" : "header_minimal_v1",
        footer_variant: "footer_simple_v1",
        pages: {
          home: {
            sections: baseSections.map((s) => ({
              module: s.type,
              variant: `${s.type}_auto_v1`,
              props_ref: `modules.${s.id}`,
            })),
          },
        },
      },
      modules: buildModulesFromBrief(brief, business_type),
      contact: {
        phone: safeStr(brief.phone),
        email: safeStr(brief.email),
        address: safeStr(brief.address),
        socials: [],
      },
    };

    // Normaliza y resuelve layout (inyecta hero, etc.)
    specV2 = normalizeV2(specV2);
    specV2 = resolveV2Layout(specV2);

    return res.status(200).json({ site_spec: specV2 });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal error" });
  }
}
