import { VARIANTS } from "./variants";

function pickBySeed(list, seed) {
  if (!list.length) return null;
  const idx = seed % list.length;
  return list[idx];
}

function matches(rule, spec) {
  const p = spec.brand?.brand_personality;
  const e = spec.brand?.brand_expression || {};

  if (rule.personalities && !rule.personalities.includes(p)) return false;
  if (rule.risk && !rule.risk.includes(e.layout_risk)) return false;
  if (rule.density && !rule.density.includes(e.density)) return false;
  if (rule.imagery && !rule.imagery.includes(e.imagery_style)) return false;

  return true;
}

export function resolveV2Layout(spec) {
  const seed = spec.meta?.seed ?? 0;

  // 1) Header por personalidad/expresión
  const headerOptions = Object.entries(VARIANTS.header)
    .filter(([, rule]) => matches(rule, spec))
    .map(([key]) => key);

  const header_variant =
    pickBySeed(headerOptions, seed) || spec.layout?.header_variant || "header_minimal_v1";

  // 2) Hero: si no existe sección hero, inyectarla
  const heroOptions = Object.entries(VARIANTS.hero)
    .filter(([, rule]) => matches(rule, spec))
    .map(([key]) => key);

  const hero_variant =
    pickBySeed(heroOptions, seed + 7) || "hero_product_minimal_v1";

  const home = spec.layout?.pages?.home || { sections: [] };
  const hasHero = home.sections?.some((s) => s.module === "hero");

  const sections = hasHero
    ? home.sections
    : [
        { module: "hero", variant: hero_variant, props_ref: "modules.hero_auto" },
        ...home.sections,
      ];

  // 3) De momento no tocamos tus sections auto_v1 (las mejoraremos luego)
  return {
    ...spec,
    layout: {
      ...spec.layout,
      header_variant,
      pages: {
        ...spec.layout.pages,
        home: { ...home, sections },
      },
    },
  };
}
