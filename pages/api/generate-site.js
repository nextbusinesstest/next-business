// pages/api/generate-site.js
import { normalizeV2 } from "../../lib/spec/v2/normalize";
import { resolveV2Layout } from "../../lib/spec/v2/resolveLayout";

/* -----------------------------
 Helpers de parsing
----------------------------- */

function s(v) {
  return (v ?? "").toString().trim();
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    const t = s(v);
    if (t) return t;
  }
  return "";
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

function splitLines(val) {
  const txt = s(val);
  if (!txt) return [];
  return txt
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function pickGoal(raw) {
  const g = s(raw).toLowerCase();
  // posibles valores del select (depende de tu form)
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
    sec.includes("e-commerce") ||
    sec.includes("ecommerce") ||
    sec.includes("tienda") ||
    bt.includes("tienda") ||
    bt.includes("marca") ||
    goal === "purchase"
  ) {
    return "ecommerce";
  }
  if (bt.includes("instal") || bt.includes("mantenimiento") || bt.includes("servicio") || sec.includes("servicio")) {
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
    return {
      boldness: "low",
      visual_energy: "balanced",
      layout_risk: "safe",
      imagery_style: "human",
      tone: "assertive",
      density: "medium",
    };
  }
  if (personality === "premium_elegant") {
    return {
      boldness: "low",
      visual_energy: "calm",
      layout_risk: "safe",
      imagery_style: "lifestyle",
      tone: "neutral",
      density: "light",
    };
  }
  // modern_minimal
  return {
    boldness: "low",
    visual_energy: "balanced",
    layout_risk: "safe",
    imagery_style: "product",
    tone: "neutral",
    density: "light",
  };
}

/* -----------------------------
 Copy helpers (ecommerce)
----------------------------- */

function buildEcommerceHero({ name, typeText, location, idealClient, items }) {
  const baseHeadline = name ? `${name}` : "Tienda online";
  const typeSuffix = typeText ? ` · ${typeText}` : "";
  const headline = `${baseHeadline}${typeSuffix}`;

  // subheadline: mezcla de cliente ideal + valor
  const who = idealClient ? idealClient.split(".")[0].trim() : "";
  const value = "Compra fácil, condiciones claras y soporte cuando lo necesitas.";
  const loc = location ? `Desde ${location}.` : "";

  const subheadline = [who, value, loc].filter(Boolean).join(" ");

  const primary_cta = { label: "Ver categorías", href: "#categories" };
  const secondary_cta = { label: "Contacto", href: "#contact" };

  return { headline, subheadline, primary_cta, secondary_cta };
}

function categoriesFromItems(items, fallbackLabel = "Categorías") {
  // Si el usuario mete cosas como "Zapatillas urbanas..." lo convertimos en categorías humanas
  // Reglas muy simples (luego las refinamos)
  const mapped = items.map((line) => {
    const low = line.toLowerCase();
    if (low.includes("infantil")) return { name: "Infantil", description: "Resistencia, comodidad y buen ajuste." };
    if (low.includes("adult")) return { name: "Adulto", description: "Cómodo para diario y para caminar." };
    if (low.includes("zapat")) return { name: "Zapatillas", description: "Urbanas, cómodas y versátiles." };
    if (low.includes("limitad") || low.includes("edicion")) return { name: "Ediciones limitadas", description: "Drops y unidades seleccionadas." };
    if (low.includes("devol")) return { name: "Devoluciones", description: "Condiciones claras y sencillas." };
    if (low.includes("envío") || low.includes("envio")) return { name: "Envíos", description: "Opciones rápidas y seguimiento." };
    if (low.includes("talla")) return { name: "Guía de tallas", description: "Elige bien a la primera." };
    // default: título capitalizado corto
    const short = line.length > 28 ? line.slice(0, 28).trim() + "…" : line;
    return { name: short.charAt(0).toUpperCase() + short.slice(1), description: "Explora opciones y encuentra lo ideal." };
  });

  // quedarnos con 3-5 items máximo para cards
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
  if (!sliced.length) {
    return {
      title: fallbackLabel,
      items: [
        { name: "Novedades", description: "Lo más reciente y destacado." },
        { name: "Básicos", description: "Imprescindibles para el día a día." },
        { name: "Ofertas", description: "Selección con buena relación calidad/precio." },
      ],
    };
  }

  return { title: "Compra por categorías", items: sliced };
}

function benefitsForEcommerce(items) {
  const lowAll = items.join(" ").toLowerCase();

  const benefits = [];
  // derivación simple a partir de items
  if (lowAll.includes("24/48") || lowAll.includes("48h") || lowAll.includes("envío") || lowAll.includes("envio")) {
    benefits.push("Envío rápido con seguimiento");
  } else {
    benefits.push("Envíos con condiciones claras");
  }

  if (lowAll.includes("devol")) {
    benefits.push("Devoluciones fáciles y transparentes");
  } else {
    benefits.push("Cambios y devoluciones sin complicaciones");
  }

  if (lowAll.includes("talla")) {
    benefits.push("Guía de tallas y ayuda antes de comprar");
  } else {
    benefits.push("Soporte para resolver dudas antes de comprar");
  }

  benefits.push("Compra segura: información clara y sin letra pequeña");

  return {
    title: "Compra sin complicaciones",
    bullets: benefits.slice(0, 5),
  };
}

function collectionsFromItems(items) {
  // para services_grid: “Destacados / Colecciones”
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

    // Soportar múltiples nombres de campos (por si tu form usa camelCase)
    const name = firstNonEmpty(
      brief.business_name,
      brief.businessName,
      brief.name,
      brief.business,
      brief.company_name
    );

    const location = firstNonEmpty(brief.location, brief.city, brief.ubication, brief.ubicacion);
    const sector = firstNonEmpty(brief.industry, brief.sector, brief.category);
    const businessTypeText = firstNonEmpty(brief.business_type, brief.businessType, brief.type, brief.tipo_negocio);

    const goalRaw = firstNonEmpty(brief.goal, brief.objective, brief.objetivo_web);
    const primary_goal = pickGoal(goalRaw);

    // servicios/productos puede venir como array o como textarea string
    const servicesList =
      Array.isArray(brief.services) ? brief.services.map(s) : splitLines(firstNonEmpty(brief.services_text, brief.servicesText, brief.services_products, brief.servicesProducts, brief.services));

    const idealClient = firstNonEmpty(brief.ideal_client, brief.idealClient, brief.client, brief.target, brief.cliente_ideal);

    const phone = firstNonEmpty(brief.phone, brief.telefono, brief.tel);
    const email = firstNonEmpty(brief.email, brief.mail);
    const address = firstNonEmpty(brief.address, brief.direccion);

    const slug = firstNonEmpty(brief.slug, slugify(name || "empresa"));

    const business_type = inferBusinessType({
      sector,
      businessType: businessTypeText,
      goal: primary_goal,
    });

    const pack = pickPack(business_type);
    const personality = pickPersonality(business_type);
    const expression = defaultExpression(personality);

    // Seed: si no viene, random. (si quieres test A/B, luego lo forzamos)
    const seed = Number.isFinite(Number(brief.seed)) ? Number(brief.seed) : Math.floor(Math.random() * 100000);

    // Design tokens: si tu form pasa theme/colors lo respetamos
    const theme = brief.theme || null;
    const design_tokens = theme ? { colors: theme } : undefined;

    /* -----------------------------
      Construcción de módulos por tipo
    ----------------------------- */

    const modules = {};

    // HERO AUTO (siempre)
    if (business_type === "ecommerce") {
      modules.hero_auto = buildEcommerceHero({
        name,
        typeText: businessTypeText || "Tienda online",
        location,
        idealClient,
        items: servicesList,
      });

      const cats = categoriesFromItems(servicesList);
      modules.categories = { id: "categories", type: "cards", ...cats };

      const bens = benefitsForEcommerce(servicesList);
      modules.benefits = { id: "benefits", type: "bullets", ...bens };

      modules.services = {
        id: "services",
        type: "services_grid",
        title: "Destacados",
        items: collectionsFromItems(servicesList),
      };

      modules.about = {
        id: "about",
        type: "text",
        title: `Sobre ${name || "la tienda"}`,
        body: [
          `${name || "Esta tienda"} es ${businessTypeText || "una tienda online"} pensada para comprar sin fricción.`,
          idealClient ? `Ideal para: ${idealClient}` : "",
          location ? `Operamos desde ${location} con atención clara y directa.` : "",
        ]
          .filter(Boolean)
          .join(" "),
      };

      modules.contact_section = {
        id: "contact_section",
        type: "contact",
        title: "Contacto",
        body: "Escríbenos para dudas de tallas, envíos, devoluciones o disponibilidad.",
        form: { enabled: false },
      };
    } else {
      // generic/local_service baseline
      modules.hero_auto = {
        headline: `${name || "Empresa"} · ${businessTypeText || "Servicios"}`,
        subheadline: `${name || "Empresa"} · Información clara, contacto directo y una presencia online pensada para convertir.`,
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
        title: `Sobre ${name || "la empresa"}`,
        body: `${name || "Empresa"} ofrece ${businessTypeText || "sus servicios"} con un enfoque profesional: información clara, buena experiencia y atención directa cuando hace falta.`,
      };

      modules.contact_section = {
        id: "contact_section",
        type: "contact",
        title: "Contacto",
        body: "Ponte en contacto para resolver dudas o solicitar más información.",
        form: { enabled: true },
      };
    }

    /* -----------------------------
      Layout (V2)
    ----------------------------- */

    // Sections: ecommerce vs others
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
      meta: {
        locale: "es-ES",
        site_id: slug || "nb-site",
        seed,
      },
      business: {
        name: name || "Empresa",
        slug: slug || "empresa",
        business_type,
      },
      strategy: {
        web_strategy: business_type === "ecommerce" ? "fast_conversion" : "lead_generation",
        primary_goal: primary_goal,
        trust_level_required: business_type === "local_service" ? "high" : "medium",
      },
      brand: {
        brand_personality: personality,
        brand_expression: expression,
        ...(design_tokens ? { design_tokens } : {}),
      },
      seo: {
        title: `${name || "Empresa"} | ${sector || businessTypeText || "Negocio"}`,
        description:
          business_type === "ecommerce"
            ? `${name || "Tienda online"} · Compra fácil, condiciones claras y una experiencia pensada para convertir.`
            : `${name || "Empresa"} · Información clara, contacto directo y una presencia online pensada para convertir.`,
      },
      navigation: { items: [], ctas: {} },
      layout: {
        pack,
        header_variant: business_type === "local_service" ? "header_trust_v1" : "header_minimal_v1",
        footer_variant: "footer_simple_v1",
        pages: {
          home: {
            sections: homeSections,
          },
        },
      },
      modules,
      contact: {
        phone: phone || "",
        email: email || "",
        address: address || "",
        socials: [],
      },
    };

    // Normalizar + resolver layout (esto aplicará A/B por seed si lo tienes en resolveLayout)
    specV2 = normalizeV2(specV2);
    specV2 = resolveV2Layout(specV2);

    return res.status(200).json({ site_spec: specV2 });
  } catch (e) {
    console.error("generate-site error:", e);
    return res.status(500).json({ error: "Internal error" });
  }
}
