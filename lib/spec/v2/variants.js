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
    // ✅ NUEVO: variante para composición B (split)
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
    // Bridge: “auto_v1” mientras migramos
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

    // ✅ Variantes ecommerce (A/B)
    categories_grid_min_v1: {
      personalities: ["modern_minimal"],
      density: ["light"],
      risk: ["safe"],
    },
    // ✅ NUEVO: scroller para composición B
    categories_scroller_min_v1: {
      personalities: ["modern_minimal"],
      density: ["light"],
      risk: ["safe"],
    },

    benefits_inline_min_v1: {
      personalities: ["modern_minimal"],
      density: ["light", "medium"],
      risk: ["safe"],
    },
    // ✅ NUEVO: beneficios en cards para composición B
    benefits_cards_min_v1: {
      personalities: ["modern_minimal"],
      density: ["light", "medium"],
      risk: ["safe"],
    },

    contact_split_min_v1: {
      personalities: ["modern_minimal"],
      density: ["light", "medium"],
      risk: ["safe"],
    },
    // ✅ NUEVO: contacto centrado para composición B
    contact_center_min_v1: {
      personalities: ["modern_minimal"],
      density: ["light", "medium"],
      risk: ["safe"],
    },

    // (reservadas para futuras personalidades)
    categories_grid_bold_v1: { personalities: ["bold_disruptive"], density: ["medium"], risk: ["creative"] },
    benefits_cards_bold_v1: { personalities: ["bold_disruptive"], density: ["medium"], risk: ["creative"] },
  },
};
