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
    // “auto_v1” es puente; luego lo mataremos
    cards_auto_v1: { personalities: ["modern_minimal", "friendly_human", "trust_authority", "corporate_b2b", "premium_elegant", "bold_disruptive"] },
    bullets_auto_v1: { personalities: ["modern_minimal", "friendly_human", "trust_authority", "corporate_b2b", "premium_elegant", "bold_disruptive"] },
    services_grid_auto_v1: { personalities: ["modern_minimal", "friendly_human", "trust_authority", "corporate_b2b", "premium_elegant", "bold_disruptive"] },
    text_auto_v1: { personalities: ["modern_minimal", "friendly_human", "trust_authority", "corporate_b2b", "premium_elegant", "bold_disruptive"] },
    contact_auto_v1: { personalities: ["modern_minimal", "friendly_human", "trust_authority", "corporate_b2b", "premium_elegant", "bold_disruptive"] },

    // Variantes nuevas (las iremos creando)
    categories_grid_min_v1: { personalities: ["modern_minimal"], density: ["light"], risk: ["safe"] },
    categories_grid_bold_v1: { personalities: ["bold_disruptive"], density: ["medium"], risk: ["creative"] },

    benefits_inline_min_v1: { personalities: ["modern_minimal"], density: ["light"], risk: ["safe"] },
    benefits_cards_bold_v1: { personalities: ["bold_disruptive"], density: ["medium"], risk: ["creative"] },

    contact_split_min_v1: { personalities: ["modern_minimal"], density: ["light", "medium"], risk: ["safe"] },
  },
};
