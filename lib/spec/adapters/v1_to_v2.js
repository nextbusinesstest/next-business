export function v1ToV2(v1) {
  const isEcommerce = v1.layout === "ecommerceRetail";
  const isLocalService = v1.layout === "localService";

  return {
    version: "2.0",

    meta: {
      site_id: v1.slug,
      locale: "es-ES",
    },

    business: {
      name: v1.brand?.name,
      slug: v1.slug,
      business_type: isEcommerce ? "ecommerce" : "local_service",
    },

    strategy: {
      web_strategy: isEcommerce ? "fast_conversion" : "lead_generation",
      primary_goal: isEcommerce ? "purchase" : "request_quote",
      trust_level_required: isLocalService ? "high" : "medium",
    },

    brand: {
      brand_personality: isEcommerce
        ? "modern_minimal"
        : "trust_authority",

      brand_expression: isEcommerce
        ? {
            boldness: "low",
            visual_energy: "balanced",
            layout_risk: "safe",
            imagery_style: "product",
            tone: "neutral",
            density: "light",
          }
        : {
            boldness: "low",
            visual_energy: "balanced",
            layout_risk: "safe",
            imagery_style: "human",
            tone: "assertive",
            density: "medium",
          },

      design_tokens: {
        colors: v1.theme,
      },
    },

    seo: {
      title: v1.meta?.title,
      description: v1.meta?.description,
    },

    navigation: {
      items: v1.nav?.items || [],
      ctas: {
        primary: v1.nav?.cta,
        secondary: v1.nav?.secondaryCta,
      },
    },

    layout: {
      pack: isEcommerce
        ? "ecommerce_conversion"
        : "local_service_trust",

      header_variant: isEcommerce
        ? "header_minimal_v1"
        : "header_trust_v1",

      footer_variant: "footer_simple_v1",

      pages: {
        home: {
          sections: v1.sections.map((s, i) => ({
            module: s.type,
            variant: `${s.type}_auto_v1`,
            props_ref: `modules.${s.id || `section_${i}`}`,
          })),
        },
      },
    },

    modules: Object.fromEntries(
      v1.sections.map((s, i) => [
        s.id || `section_${i}`,
        s,
      ])
    ),

    contact: v1.contact,
  };
}
