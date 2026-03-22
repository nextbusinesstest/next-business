import {
  DEFAULT_BRAND_EXPRESSION,
  DEFAULT_STRATEGY,
  DEFAULT_LAYOUT,
} from "./schema";

export function normalizeV2(spec) {
  const base = {
    version: "2.0",

    // ✅ IMPORTANTE:
    // preservamos meta existente y luego aplicamos defaults.
    // Así no perdemos forked_from, created_at, updated_at, revision, etc.
    meta: {
      ...(spec?.meta || {}),
      locale: spec?.meta?.locale || "es-ES",
      site_id: spec?.meta?.site_id || spec?.business?.slug || "nb-site",
      seed: spec?.meta?.seed ?? Math.floor(Math.random() * 100000),
    },

    business: spec?.business || {},

    strategy: {
      ...DEFAULT_STRATEGY,
      ...(spec?.strategy || {}),
    },

    brand: {
      brand_personality: spec?.brand?.brand_personality || "modern_minimal",
      brand_expression: {
        ...DEFAULT_BRAND_EXPRESSION,
        ...(spec?.brand?.brand_expression || {}),
      },
      design_tokens: spec?.brand?.design_tokens || {},
    },

    navigation: spec?.navigation || {},

    layout: {
      ...DEFAULT_LAYOUT,
      ...(spec?.layout || {}),
    },

    modules: spec?.modules || {},

    contact: spec?.contact || {},

    seo: spec?.seo || {},
  };

  // Default hero_auto (si el resolver lo inyecta y no existe)
  if (!base.modules.hero_auto) {
    base.modules.hero_auto = {
      headline: base.seo?.title || base.business?.name || "Bienvenido",
      subheadline: base.seo?.description || "Descubre lo que ofrecemos",
      primary_cta: { label: "Ver más", href: "#categories" },
      secondary_cta: { label: "Contacto", href: "#contact" },
    };
  }

  // --- Bridge opcional para packs antiguos (v1-like) ---
  const homeSections = base.layout?.pages?.home?.sections || [];
  const modulesByKey = base.modules;

  const heroRef = homeSections.find((s) => s.module === "hero")?.props_ref;
  const heroKey = heroRef ? heroRef.replace("modules.", "") : null;
  const bridgedHero = heroKey ? modulesByKey[heroKey] : null;

  const bridgedSections = homeSections
    .filter((s) => s.module !== "hero")
    .map((s) => {
      const key = (s.props_ref || "").replace("modules.", "");
      return modulesByKey[key] || null;
    })
    .filter(Boolean);

  return {
    ...base,
    hero: base.hero || (bridgedHero
      ? {
          headline: bridgedHero.headline,
          subheadline: bridgedHero.subheadline,
          primary_cta_label: bridgedHero.primary_cta?.label,
          secondary_cta_label: bridgedHero.secondary_cta?.label,
        }
      : undefined),
    sections: base.sections || (bridgedSections.length ? bridgedSections : undefined),
  };
}
