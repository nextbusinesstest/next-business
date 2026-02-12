// lib/spec/v2/auto_personality.js

function norm(s = "") {
  return String(s).toLowerCase().trim();
}

function includesAny(text, arr) {
  const t = norm(text);
  return arr.some((k) => t.includes(k));
}

// hash simple determinista (sin deps)
function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

function pickByHash(key, options) {
  if (!options.length) return null;
  const idx = hash32(key) % options.length;
  return options[idx];
}

/**
 * Decide personalidad automáticamente.
 * - determinista por site_id/slug + inputs
 * - reglas por tipo + sector + goal
 */
export function autoPickPersonality({ site_id, business, strategy }) {
  const type = norm(business?.type);
  const sector = norm(business?.sector);
  const audience = norm(business?.target_audience);
  const goal = norm(strategy?.primary_goal);

  const key = `${site_id || business?.slug || business?.name || "site"}|${type}|${sector}|${goal}|${audience}`;

  // --- ecommerce
  if (type === "ecommerce") {
    // urbano / moda / drops
    if (includesAny(sector, ["urb", "moda", "street", "drops", "edicion", "limitad", "sneaker"])) {
      return "bold_street";
    }
    // eco / artesanal
    if (includesAny(sector, ["artes", "handmade", "eco", "natural", "sosten", "craft"])) {
      return "artisan_warm";
    }
    // fallback: variación determinista
    return pickByHash(key, ["modern_minimal", "bold_street", "artisan_warm"]) || "modern_minimal";
  }

  // --- local_service
  if (type === "local_service") {
    // salud / cuidado
    if (includesAny(sector, ["clin", "dental", "salud", "fisio", "medic", "estet", "bienestar"])) {
      return pickByHash(key, ["trust_authority", "calm_care"]) || "trust_authority";
    }
    return pickByHash(key, ["friendly_local", "trust_authority", "calm_care"]) || "friendly_local";
  }

  // --- generic: detectar SaaS / B2B
  const looksSaaS = includesAny(sector, ["saas", "software", "plataforma", "gestion", "tickets", "crm", "erp"]);
  if (looksSaaS || goal === "single_action") {
    return pickByHash(key, ["tech_clean", "enterprise_solid"]) || "tech_clean";
  }

  // --- generic: legal/finanzas/serio
  if (includesAny(sector, ["abog", "legal", "asesor", "fiscal", "finan", "seguros"])) {
    return "trust_authority";
  }

  // --- generic: restaurantes / ocio
  if (includesAny(sector, ["rest", "asador", "bar", "caf", "comida", "hostel", "turis"])) {
    return pickByHash(key, ["friendly_local", "artisan_warm", "premium_elegant"]) || "friendly_local";
  }

  // fallback general
  return pickByHash(key, ["premium_elegant", "trust_authority", "tech_clean", "friendly_local"]) || "premium_elegant";
}

/**
 * Devuelve brand_expression y tokens por personalidad.
 * (Esto es lo que hace que se note distinto SIN tocar aún el layout por objetivo)
 */
export function personalityPreset(personality) {
  switch (personality) {
    case "trust_authority":
      return {
        brand_expression: {
          tone: "professional",
          imagery_style: "mixed",
          layout_risk: "safe",
          density: "medium",
          visual_energy: "calm",
          boldness: "low",
        },
        design_tokens: {
          colors: { bg: "#ffffff", text: "#0f172a", primary: "#0f172a", muted: "#475569", accent: "#1d4ed8" },
        },
      };

    case "calm_care":
      return {
        brand_expression: {
          tone: "friendly",
          imagery_style: "mixed",
          layout_risk: "safe",
          density: "comfortable",
          visual_energy: "calm",
          boldness: "low",
        },
        design_tokens: {
          colors: { bg: "#ffffff", text: "#0f172a", primary: "#0f172a", muted: "#64748b", accent: "#0ea5e9" },
        },
      };

    case "friendly_local":
      return {
        brand_expression: {
          tone: "friendly",
          imagery_style: "mixed",
          layout_risk: "safe",
          density: "comfortable",
          visual_energy: "warm",
          boldness: "medium",
        },
        design_tokens: {
          colors: { bg: "#ffffff", text: "#111827", primary: "#111827", muted: "#6b7280", accent: "#16a34a" },
        },
      };

    case "tech_clean":
      return {
        brand_expression: {
          tone: "professional",
          imagery_style: "mixed",
          layout_risk: "safe",
          density: "tight",
          visual_energy: "balanced",
          boldness: "medium",
        },
        design_tokens: {
          colors: { bg: "#ffffff", text: "#0f172a", primary: "#0f172a", muted: "#475569", accent: "#7c3aed" },
        },
      };

    case "enterprise_solid":
      return {
        brand_expression: {
          tone: "professional",
          imagery_style: "mixed",
          layout_risk: "safe",
          density: "medium",
          visual_energy: "low",
          boldness: "low",
        },
        design_tokens: {
          colors: { bg: "#ffffff", text: "#0b1220", primary: "#0b1220", muted: "#334155", accent: "#0f766e" },
        },
      };

    case "bold_street":
      return {
        brand_expression: {
          tone: "bold",
          imagery_style: "product",
          layout_risk: "bold",
          density: "tight",
          visual_energy: "high",
          boldness: "high",
        },
        design_tokens: {
          colors: { bg: "#0b0b0f", text: "#ffffff", primary: "#ffffff", muted: "#a1a1aa", accent: "#22c55e" },
        },
      };

    case "artisan_warm":
      return {
        brand_expression: {
          tone: "friendly",
          imagery_style: "mixed",
          layout_risk: "safe",
          density: "comfortable",
          visual_energy: "warm",
          boldness: "medium",
        },
        design_tokens: {
          colors: { bg: "#fffaf5", text: "#1f2937", primary: "#1f2937", muted: "#6b7280", accent: "#ea580c" },
        },
      };

    case "modern_minimal":
    default:
      return {
        brand_expression: {
          tone: "bold",
          imagery_style: "product",
          layout_risk: "safe",
          density: "medium",
          visual_energy: "balanced",
          boldness: "medium",
        },
        design_tokens: {
          colors: { bg: "#ffffff", text: "#111111", primary: "#111111", muted: "#666666", accent: "#111111" },
        },
      };
  }
}
