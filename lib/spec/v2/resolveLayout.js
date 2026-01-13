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

function pickSectionVariant(module, spec, seed, fallback) {
  // Busca variantes de sections que “encajen” y empiecen por el módulo
  const options = Object.entries(VARIANTS.sections)
    .filter(([key, rule]) => key.startsWith(module) && matches(rule, spec))
    .map(([key]) => key);

  return pickBySeed(options, seed) || fallback;
}

export function resolveV2Layout(spec) {
  const seed = spec.meta?.seed ?? 0;
  const pack = spec.layout?.pack;

  // 1) Header por personalidad/expresión
  const headerOptions = Object.entries(VARIANTS.header)
    .filter(([, rule]) => matches(rule, spec))
    .map(([key]) => key);

  const header_variant =
    pickBySeed(headerOptions, seed) || spec.layout?.header_variant || "header_minimal_v1";

  // 2) Composición A/B para ecommerce (MISMO PACK, distinta estructura visual)
  const ecommerceComposition = seed % 2 === 0 ? "A" : "B";

  // 3) Hero variant (ecommerce A/B)
  let hero_variant = pickBySeed(
    Object.entries(VARIANTS.hero)
      .filter(([, rule]) => matches(rule, spec))
      .map(([key]) => key),
    seed + 7
  ) || "hero_product_minimal_v1";

  if (pack === "ecommerce_conversion") {
    hero_variant = ecommerceComposition === "A" ? "hero_product_minimal_v1" : "hero_product_split_v1";
  }

  const home = spec.layout?.pages?.home || { sections: [] };
  const hasHero = home.sections?.some((s) => s.module === "hero");

  let sections = hasHero
    ? home.sections
    : [{ module: "hero", variant: hero_variant, props_ref: "modules.hero_auto" }, ...home.sections];

  // 4) Re-escribir variantes de secciones para ecommerce A/B (gran diferencia visual)
  if (pack === "ecommerce_conversion") {
    sections = sections.map((s) => {
      if (s.module === "hero") return { ...s, variant: hero_variant };

      // Módulos clave: categories, benefits, contact
      if (s.module === "cards") {
        return {
          ...s,
          variant: ecommerceComposition === "A" ? "categories_grid_min_v1" : "categories_scroller_min_v1",
        };
      }

      if (s.module === "bullets") {
        return {
          ...s,
          variant: ecommerceComposition === "A" ? "benefits_inline_min_v1" : "benefits_cards_min_v1",
        };
      }

      if (s.module === "contact") {
        return {
          ...s,
          variant: ecommerceComposition === "A" ? "contact_split_min_v1" : "contact_center_min_v1",
        };
      }

      // resto: intenta elegir algo compatible si existe, si no deja lo que venga
      return {
        ...s,
        variant: pickSectionVariant(s.module, spec, seed + 13, s.variant),
      };
    });

    // Extra: cambiar orden en B para que se note aún más
    if (ecommerceComposition === "B") {
      const hero = sections.find((x) => x.module === "hero");
      const rest = sections.filter((x) => x.module !== "hero");
      // mueve contact antes del about si existe
      const contactIdx = rest.findIndex((x) => x.module === "contact");
      const textIdx = rest.findIndex((x) => x.module === "text");
      if (contactIdx !== -1 && textIdx !== -1 && contactIdx > textIdx) {
        const copy = [...rest];
        const [contact] = copy.splice(contactIdx, 1);
        copy.splice(textIdx, 0, contact);
        sections = [hero, ...copy].filter(Boolean);
      } else {
        sections = [hero, ...rest].filter(Boolean);
      }
    }
  }

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
