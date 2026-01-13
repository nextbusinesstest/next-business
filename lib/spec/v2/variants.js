/**
 * Catálogo de variantes (V2)
 * Se usa por resolveLayout.js para elegir variantes compatibles con:
 * - brand_personality
 * - brand_expression (risk/density/imagery)
 *
 * ✅ Cambios ya incluidos:
 * - hero_product_split_v1
 * - categories_scroller_min_v1
 * - benefits_cards_min_v1
 * - contact_center_min_v1
 *
 * Nota: El “motor” de elección está en resolveLayout.js (A/B por seed).
 */

export const VARIANTS = {
  header: {
    header_minimal_v1: {
      personalities: ["modern_minimal", "premium_elegant"],
      risk: ["safe", "creative"],
    },
    header_bold_v1: {
      personalities: ["bold_disruptive"],
      risk: ["creative"],
    },
    header_trust_v1: {
      personalities: ["trust_authority", "corporate_b2b"],
      risk: ["safe"],
    },
  },

  hero: {
    hero_product_minimal_v1: {
      personalities: ["modern_minimal"],
      imagery: ["product"],
      density: ["light", "medium"],
      risk: ["safe"],
    },

    // ✅ NUEVO (Composición B): hero “split”
    hero_product_split_v1: {
      personalities: ["modern_minimal"],
      imagery: ["product"],
      density: ["light", "medium"],
      risk: ["safe"],
    },

    hero_product_bold_v1: {
      personalities: ["bold_disruptive"],
      imagery: ["product", "lifestyle"],
      density: ["medium"],
      risk: ["creative"],
    },
    hero_brand_story_v1: {
      personalities: ["premium_elegant"],
      imagery: ["lifestyle", "abstract"],
      density: ["light"],
      risk: ["safe", "creative"],
    },
  },

  sections: {
    // Bridge: “auto_v1” mientras migramos (acepta casi todo)
    cards_auto_v1: {
      personalities: [
        "modern_minimal",
        "friendly_human",
        "trust_authority",
        "corporate_b2b",
        "premium_elegant",
        "bold_disruptive",
      ],
    },
    bullets_auto_v1: {
      personalities: [
        "modern_minimal",
        "friendly_human",
        "trust_authority",
        "corporate_b2b",
        "premium_elegant",
        "bold_disruptive",
      ],
    },
    services_grid_auto_v1: {
      personalities: [
        "modern_minimal",
        "friendly_human",
        "trust_authority",
        "corporate_b2b",
        "premium_elegant",
        "bold_disruptive",
      ],
    },
    text_auto_v1: {
      personalities: [
        "modern_minimal",
        "friendly_human",
        "trust_authority",
        "corporate_b2b",
        "premium_elegant",
        "bold_disruptive",
      ],
    },
    contact_auto_v1: {
      personalities: [
        "modern_minimal",
        "friendly_human",
        "trust_authority",
        "corporate_b2b",
        "premium_elegant",
        "bold_disruptive",
      ],
    },

    /* -----------------------------
      Ecommerce (modern_minimal) — A/B
    ----------------------------- */

    // Variante A: grid
    categories_grid_min_v1: {
      personalities: ["modern_minimal"],
      density: ["light"],
      risk: ["safe"],
    },

    // ✅ NUEVO (Variante B): scroller horizontal
    categories_scroller_min_v1: {
      personalities: ["modern_minimal"],
      density: ["light"],
      risk: ["safe"],
    },

    // Variante A: bullets inline
    benefits_inline_min_v1: {
      personalities: ["modern_minimal"],
      density: ["light", "medium"],
      risk: ["safe"],
    },

    // ✅ NUEVO (Variante B): beneficios en cards
    benefits_cards_min_v1: {
      personalities: ["modern_minimal"],
      density: ["light", "medium"],
      risk: ["safe"],
    },

    // Variante A: contacto split (texto + tarjetas)
    contact_split_min_v1: {
      personalities: ["modern_minimal"],
      density: ["light", "medium"],
      risk: ["safe"],
    },

    // ✅ NUEVO (Variante B): contacto centrado (bloque)
    contact_center_min_v1: {
      personalities: ["modern_minimal"],
      density: ["light", "medium"],
      risk: ["safe"],
    },

    /* -----------------------------
      Reservadas para futuro (bold_disruptive)
    ----------------------------- */

    categories_grid_bold_v1: {
      personalities: ["bold_disruptive"],
      density: ["medium"],
      risk: ["creative"],
    },
    benefits_cards_bold_v1: {
      personalities: ["bold_disruptive"],
      density: ["medium"],
      risk: ["creative"],
    },
  },
};
