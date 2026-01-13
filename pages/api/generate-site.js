// pages/api/generate-site.js
import { normalizeV2 } from "../../lib/spec/v2/normalize";
import { resolveV2Layout } from "../../lib/spec/v2/resolveLayout";

/* -----------------------------
 Helpers
----------------------------- */
function s(v) {
  return (v ?? "").toString().trim();
}

function slugify(input) {
  return s(input)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function pickGoal(raw) {
  const g = s(raw).toLowerCase();
  if (g.includes("vender") || g.includes("e-commerce") || g.includes("ecommerce") || g.includes("online")) return "purchase";
  if (g.includes("presupuesto") || g.includes("contact") || g.includes("solicitud")) return "request_quote";
  if (g.includes("reserva") || g.includes("cita")) return "book";
  if (g.includes("presentación") || g.includes("corporativa")) return "brand";
  if (g.includes("catálogo") || g.includes("informativa")) return "catalog";
  return "request_quote";
}

function inferBusinessType({ sector, businessType, goal }) {
  const sec = s(sector).toLowerCase();
  const bt = s(businessType).toLowerCase();
  if (
    goal === "purchase" ||
    sec.includes("e-commerce") ||
    sec.includes("ecommerce") ||
    sec.includes("tienda") ||
    sec.includes("moda") ||
    bt.includes("tienda") ||
    bt.includes("e-commerce") ||
    bt.includes("marca") ||
    bt.includes("zapat") ||
    bt.includes("calzado")
  ) return "ecommerce";

  if (bt.includes("instal") || bt.includes("mantenimiento") || bt.includes("electric") || sec.includes("servicio")) {
    return "local_service";
  }
  return "generic";
}

function pickPack(business_type) {
  if (business_type === "ecommerce") return "ecommerce_conversion";
  if (business_type === "local_service") return "local_service_trust";
  return "brand_premium";
}

function pickPersonality(business_type) {
  if (business_type === "local_service") return "trust_authority";
  if (business_type === "ecommerce") return "modern_minimal";
  return "premium_elegant";
}

function defaultExpression(personality) {
  if (personality === "trust_authority") {
    return { boldness: "low", visual_energy: "balanced", layout_risk: "safe", imagery_style: "human", tone: "assertive", density: "medium" };
  }
  if (personality === "premium_elegant") {
    return { boldness: "low", visual_energy: "calm", layout_risk: "safe", imagery_style: "lifestyle", tone: "neutral", density: "light" };
  }
  return { boldness: "low", visual_energy: "balanced", layout_risk: "safe", imagery_style: "product", tone: "neutral", density: "light" };
}

/* -----------------------------
 Ecommerce copy helpers
----------------------------- */
function buildEcommerceHero({ name, typeText, location, idealClient }) {
  const headline = `${name || "Tienda online"}${typeText ? ` · ${typeText}` : ""}`;
  const who = idealClient ? idealClient.split(".")[0].trim() : "";
  const value = "Compra fácil, condiciones claras y soporte cuando lo necesitas.";
  const loc = location ? `Desde ${location}.` : "";
  const subheadline = [who, value, loc].filter(Boolean).join(" ");

  return {
    headline,
    subheadline,
    primary_cta: { label: "Ver categorías", href: "#categories" },
    secondary_cta: { label: "Contacto", href: "#contact" },
  };
}

function categoriesFromItems(items) {
  const mapped = items.map((line) => {
    const low = line.toLowerCase();
    if (low.includes("infantil")) return { name: "Infantil", description: "Resistencia, comodidad y buen ajuste." };
    if (low.includes("adult")) return { name: "Adulto", description: "Confort para el día a día." };
    if (low.includes("zapat")) return { name: "Zapatillas", description: "Urbanas, cómodas y versátiles." };
    if (low.includes("limitad") || low.includes("edicion")) return { name: "Ediciones limitadas", description: "Drops y unidades seleccionadas." };
    if (low.includes("devol")) return { name: "Devoluciones", description: "Condiciones claras y sencillas." };
    if (low.includes("envío") || low.includes("envio")) return { name: "Envíos", description: "Opciones rápidas y seguimiento." };
    if (low.includes("talla")) return { name: "Guía de tallas", description: "Elige bien a la primera." };
    const short = line.length > 28 ? line.slice(0, 28).trim() + "…" : line;
    return { name: short.charAt(0).toUpperCase() + short.slice(1), description: "Explora opciones y encuentra lo ideal." };
  });

  const unique = [];
  const seen = new Set();
  for (const it of mapped) {
    const k = it.name.toLowerCase();
    if (!seen.has(k)) {
      unique.push(it);
      seen.add(k);
    }
  }

  const sliced = unique.slice(0, 5);
  return {
    id: "categories",
    type: "cards",
    title: "Compra por categorías",
    items: sliced.length
      ? sliced
      : [
          { name: "Novedades", description: "Lo más reciente y destacado." },
          { name: "Básicos", description: "Imprescindibles para el día a día." },
          { name: "Ofertas", description: "Selección con buena relación calidad/precio." },
        ],
  };
}

function benefitsForEcommerce(items) {
  const lowAll = items.join(" ").toLowerCase();
  const benefits = [];

  if (lowAll.includes("24/48") || lowAll.includes("48h") || lowAll.includes("envío") || lowAll.includes("envio")) benefits.push("Envío rápido con seguimiento");
  else benefits.push("Envíos con condiciones claras");

  if (lowAll.includes("devol")) benefits.push("Devoluciones fáciles y transparentes");
  else benefits.push("Cambios y devoluciones sin complicaciones");

  if (lowAll.includes("talla")) benefits.push("Guía de tallas y ayuda antes de comprar");
  else benefits.push("Soporte para resolver dudas antes de comprar");

  benefits.push("Compra segura: información clara y sin letra pequeña");

  return { id: "benefits", type: "bullets", title: "Compra sin complicaciones", bullets: benefits.slice(0, 5) };
}

function collectionsFromItems(items) {
  const base = items
    .filter((x) => x.length > 4)
    .slice(0, 6)
    .map((line) => ({
      name: line,
      description: `Explora ${line.toLowerCase()} con opciones pensadas para facilitar la decisión.`,
    }));

  if (!base.length) {
    return [
      { name: "Colección destacada", description: "Selección cuidada para comprar fácil y rápido." },
      { name: "Novedades", description: "Lo último incorporado a la tienda." },
      { name: "Top ventas", description: "Lo más elegido por clientes." },
    ];
  }
  return base;
}

/* -----------------------------
 Handler
----------------------------- */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = req.body || {};
    const brief = body.client_brief || body;

    // ✅ TU ESTRUCTURA REAL (clientBrief)
    const company = brief.company || {};
    const contactInfo = brief.contact_info || {};
    const brand = brief.brand || {};

    const name = s(company.name) || "Empresa";
    const location = s(company.location);
    const sector = s(company.sector);
    const businessTypeText = s(company.business_type);

    const goalRaw = s(brief.website_goal);
    const primary_goal = pickGoal(goalRaw);

    const servicesList = Array.isArray(brief.services) ? brief.services.map(s).filter(Boolean) : [];
    const idealClient = s(brief.target_audience);

    const phone = s(contactInfo.phone);
    const email = s(contactInfo.email);
    const address = s(contactInfo.address);

    const slug = slugify(name);
    const business_type = inferBusinessType({ sector, businessType: businessTypeText, goal: primary_goal });
    const pack = pickPack(business_type);
    const personality = pickPersonality(business_type);
    const expression = defaultExpression(personality);

    const seed = Number.isFinite(Number(brief.seed)) ? Number(brief.seed) : Math.floor(Math.random() * 100000);
    const logoDataUrl = brand.logoDataUrl || null;

    const modules = {};

    if (business_type === "ecommerce") {
      modules.hero_auto = buildEcommerceHero({
        name,
        typeText: businessTypeText || "Tienda online",
        location,
        idealClient,
      });

      modules.categories = categoriesFromItems(servicesList);
      modules.benefits = benefitsForEcommerce(servicesList);

      modules.services = {
        id: "services",
        type: "services_grid",
        title: "Destacados",
        items: collectionsFromItems(servicesList),
      };

      modules.about = {
        id: "about",
        type: "text",
        title: `Sobre ${name}`,
        body: [
          `${name} es ${businessTypeText || "una tienda online"} pensada para comprar sin fricción.`,
          idealClient ? `Ideal para: ${idealClient}` : "",
          location ? `Operamos desde ${location} con atención clara y directa.` : "",
        ].filter(Boolean).join(" "),
      };

      modules.contact_section = {
        id: "contact_section",
        type: "contact",
        title: "Contacto",
        body: "Escríbenos para dudas de tallas, envíos, devoluciones o disponibilidad.",
        form: { enabled: false },
      };
    } else {
      modules.hero_auto = {
        headline: `${name} · ${businessTypeText || "Servicios"}`,
        subheadline: `${name} · Información clara, contacto directo y una presencia online pensada para convertir.`,
        primary_cta: { label: "Solicitar información", href: "#contact" },
        secondary_cta: { label: "Ver servicios", href: "#services" },
      };

      modules.services = {
        id: "services",
        type: "services_grid",
        title: "Servicios",
        items: servicesList.length
          ? servicesList.map((line) => ({
              name: line,
              description: `Información y opciones sobre ${line.toLowerCase()} pensadas para facilitar la decisión.`,
            }))
          : [{ name: "Servicio principal", description: "Descripción breve del servicio." }],
      };

      modules.about = {
        id: "about",
        type: "text",
        title: "Sobre la empresa",
        body: `${name} ofrece ${businessTypeText || "sus servicios"} con un enfoque profesional: información clara, buena experiencia y atención directa cuando hace falta.`,
      };

      modules.contact_section = {
        id: "contact_section",
        type: "contact",
        title: "Contacto",
        body: "Ponte en contacto para resolver dudas o solicitar más información.",
        form: { enabled: true },
      };
    }

    const homeSections =
      business_type === "ecommerce"
        ? [
            { module: "hero", variant: "hero_product_minimal_v1", props_ref: "modules.hero_auto" },
            { module: "cards", variant: "categories_grid_min_v1", props_ref: "modules.categories" },
            { module: "bullets", variant: "benefits_inline_min_v1", props_ref: "modules.benefits" },
            { module: "services_grid", variant: "services_grid_auto_v1", props_ref: "modules.services" },
            { module: "text", variant: "text_auto_v1", props_ref: "modules.about" },
            { module: "contact", variant: "contact_split_min_v1", props_ref: "modules.contact_section" },
          ]
        : [
            { module: "hero", variant: "hero_product_minimal_v1", props_ref: "modules.hero_auto" },
            { module: "services_grid", variant: "services_grid_auto_v1", props_ref: "modules.services" },
            { module: "text", variant: "text_auto_v1", props_ref: "modules.about" },
            { module: "contact", variant: "contact_auto_v1", props_ref: "modules.contact_section" },
          ];

    let specV2 = {
      version: "2.0",
      meta: { locale: "es-ES", site_id: slug, seed },
      business: { name, slug, business_type },
      strategy: {
        web_strategy: business_type === "ecommerce" ? "fast_conversion" : "lead_generation",
        primary_goal,
        trust_level_required: business_type === "local_service" ? "high" : "medium",
      },
      brand: {
        brand_personality: personality,
        brand_expression: expression,
        design_tokens: {},
      },
      navigation: { items: [], ctas: {} },
      layout: {
        pack,
        header_variant: business_type === "local_service" ? "header_trust_v1" : "header_minimal_v1",
        footer_variant: "footer_simple_v1",
        pages: { home: { sections: homeSections } },
      },
      modules,
      contact: { phone, email, address, socials: [] },
      seo: {
        title: `${name} | ${sector || businessTypeText || "Negocio"}`,
        description:
          business_type === "ecommerce"
            ? `${name} · Compra fácil, condiciones claras y una experiencia pensada para convertir.`
            : `${name} · Información clara, contacto directo y una presencia online pensada para convertir.`,
      },
      // opcional: para tu header/logo actual si lo usas en preview
      brand_asset: { logoDataUrl },
    };

    specV2 = normalizeV2(specV2);
    specV2 = resolveV2Layout(specV2);

    return res.status(200).json({ site_spec: specV2 });
  } catch (e) {
    console.error("generate-site error:", e);
    return res.status(500).json({ error: "Internal error" });
  }
}
