import { generateSiteV2 } from "../../lib/spec/v2/generate-site";
import {
  autoPickPersonality,
  personalityPreset,
} from "../../lib/spec/v2/auto_personality";

function safeTrim(v) {
  return (v ?? "").toString().trim();
}

function clampStr(s, max) {
  const v = safeTrim(s);
  if (!v) return "";
  return v.length > max ? v.slice(0, max) : v;
}

function sanitizeList(arr, maxItems, maxLen) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const item of arr) {
    const v = clampStr(item, maxLen);
    if (v) out.push(v);
    if (out.length >= maxItems) break;
  }
  return out;
}

/**
 * Goal mapping: unifica lo que el usuario pide en el form y lo traduce
 * a un modelo interno consistente (strategy.goal + conversion_mode + secciones)
 */
function pickGoal(raw, rawDetail) {
  const g = safeTrim(raw).toLowerCase();
  const detail = clampStr(rawDetail, 160);

  switch (g) {
    case "ecommerce":
      return {
        primary_goal: "sell_online",
        conversion_mode: "checkout_or_message",
        goal_text: "Vender online",
        goal_detail: detail,
      };

    case "leads":
      return {
        primary_goal: "capture_leads",
        conversion_mode: "quote_or_contact",
        goal_text: "Captar contactos / presupuesto",
        goal_detail: detail,
      };

    case "bookings":
      return {
        primary_goal: "book_appointments",
        conversion_mode: "booking",
        goal_text: "Reservas / citas",
        goal_detail: detail,
      };

    case "catalog":
      return {
        primary_goal: "show_catalog",
        conversion_mode: "informative",
        goal_text: "Informativa / catálogo",
        goal_detail: detail,
      };

    case "corporate":
      return {
        primary_goal: "present_brand",
        conversion_mode: "trust_and_contact",
        goal_text: "Presentación corporativa",
        goal_detail: detail,
      };

    case "landing":
      return {
        primary_goal: "single_action",
        conversion_mode: "landing",
        goal_text: "Conversión / Landing",
        goal_detail: detail,
      };

    case "other":
      return {
        primary_goal: "custom",
        conversion_mode: "custom",
        goal_text: "Otro",
        goal_detail: detail || "Objetivo personalizado",
      };

    default:
      // fallback razonable: leads
      return {
        primary_goal: "capture_leads",
        conversion_mode: "quote_or_contact",
        goal_text: "Captar contactos / presupuesto",
        goal_detail: detail,
      };
  }
}

/**
 * Rate limiting baseline (in-memory).
 * En serverless se resetea; en producción migrar a Redis/Upstash.
 */
const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQ = 25;
const buckets = globalThis.__NB_RL_BUCKETS__ || new Map();
globalThis.__NB_RL_BUCKETS__ = buckets;

function getIP(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf) return xf.split(",")[0].trim();
  if (Array.isArray(xf) && xf.length) return xf[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function rateLimit(req, res) {
  const now = Date.now();
  const ip = getIP(req);

  const b = buckets.get(ip) || { count: 0, start: now };
  if (now - b.start > WINDOW_MS) {
    b.count = 0;
    b.start = now;
  }
  b.count += 1;
  buckets.set(ip, b);

  const remaining = Math.max(0, MAX_REQ - b.count);
  const reset = Math.ceil((b.start + WINDOW_MS - now) / 1000);

  res.setHeader("X-RateLimit-Limit", String(MAX_REQ));
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  res.setHeader("X-RateLimit-Reset", String(reset));

  if (b.count > MAX_REQ) {
    res.status(429).json({ error: "Too many requests. Try again later." });
    return false;
  }
  return true;
}

/**
 * Aplica personalidad automática al site_spec ya generado (sin romper packs existentes).
 * - deterministic (no cambia si repites el mismo negocio)
 * - ajusta brand_expression + design_tokens
 * - define header/footer si no existen
 */
function applyAutoPersonality(site_spec) {
  if (!site_spec || typeof site_spec !== "object") return site_spec;

  const site_id =
    site_spec?.meta?.site_id ||
    site_spec?.business?.slug ||
    site_spec?.business?.name ||
    "site";

  const picked = autoPickPersonality({
    site_id,
    business: site_spec?.business,
    strategy: site_spec?.strategy,
  });

  const preset = personalityPreset(picked);

  site_spec.brand = site_spec.brand || {};

  // personalidad + expresión
  site_spec.brand.brand_personality = picked;
  site_spec.brand.brand_expression = {
    ...(site_spec.brand.brand_expression || {}),
    ...(preset.brand_expression || {}),
  };

  // tokens (colores)
  site_spec.brand.design_tokens = site_spec.brand.design_tokens || {};
  site_spec.brand.design_tokens.colors = {
    ...(site_spec.brand.design_tokens.colors || {}),
    ...(preset.design_tokens?.colors || {}),
  };

  // layout variants mínimos (sin forzar pack ni secciones)
  site_spec.layout = site_spec.layout || {};
  if (!site_spec.layout.header_variant) {
    site_spec.layout.header_variant =
      picked === "trust_authority" || picked === "enterprise_solid"
        ? "header_trust_v1"
        : "header_minimal_v1";
  }
  if (!site_spec.layout.footer_variant) {
    site_spec.layout.footer_variant = "footer_simple_v1";
  }

  return site_spec;
}

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Rate limit baseline
  if (!rateLimit(req, res)) return;

  try {
    const body = req.body || {};

    // Validación/sanitización estricta (baseline)
    const business_name = clampStr(body.business_name, 80);
    const sector = clampStr(body.sector, 80);
    const location = clampStr(body.location, 80);
    const target_audience = clampStr(body.target_audience, 120);

    const website_goal = clampStr(body.website_goal, 30);
    const website_goal_detail = clampStr(body.website_goal_detail, 160);

    const tone = clampStr(body.tone, 24);
    const seed = clampStr(body.seed, 24);

    const services = sanitizeList(body.services, 20, 80);

    if (!business_name || !sector || !website_goal) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }
    if (website_goal === "other" && !website_goal_detail) {
      res
        .status(400)
        .json({ error: "Goal detail is required for 'Other'." });
      return;
    }

    // Protección básica contra payloads gigantes (p. ej. dataurl logo)
    const logo = safeTrim(body.logo);
    if (logo && logo.startsWith("data:") && logo.length > 150_000) {
      res.status(413).json({ error: "Payload too large." });
      return;
    }

    const goal = pickGoal(website_goal, website_goal_detail);

    // Pasamos un brief normalizado al generador V2
    const client_brief = {
      business_name,
      sector,
      location,
      target_audience,
      services,
      tone,
      seed,

      // NUEVO: objetivo ya normalizado
      goal,
    };

    let site_spec = await generateSiteV2(client_brief);

    // ✅ NUEVO: aplica personalidad automática (premium)
    site_spec = applyAutoPersonality(site_spec);

    res.status(200).json(site_spec);
  } catch (err) {
    // Error genérico (no filtrar stack al cliente)
    res.status(500).json({ error: "Internal server error" });
  }
}
