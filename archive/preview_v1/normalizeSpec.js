export function normalizeSpec(input) {
  if (!input) return null;

  // Si ya viene v2
  const isV2 = input.version && input.design_tokens && input.modules;

  if (isV2) return input;

  // v1 -> “v2-like”
  const theme = input.theme || {};
  const layout = input.layout || "premiumBrand";

  const design_tokens = {
    colors: {
      primary: theme.primaryColor || "#0b3d91",
      secondary: theme.secondaryColor || "#e5f0ff",
      accent: theme.accentColor || "#0fb7c1",
      background: theme.backgroundColor || "#ffffff",
      text: theme.textColor || "#111827",
    },
    typography: {
      heading: "sans",
      body: "sans",
    },
    radius: "xl",
    shadow: "soft",
    spacing: "comfortable",
  };

  // v1 sections -> modules (mapeo directo)
  const modules =
    (input.sections || []).map((s) => ({
      ...s,
      // garantía de shape mínima
      id: s.id || s.type || "section",
      type: s.type || "text",
      title: s.title || "",
    })) || [];

  return {
    version: "2.0-compat",
    slug: input.slug || "preview",
    layout_pack: mapLayoutToPack(layout),
    meta: input.meta || {
      title: input.company?.name ? `${input.company.name}` : "Preview",
      description: "",
    },
    brand: input.brand || {},
    design_tokens,
    hero: input.hero || null,
    navigation: input.navigation || null,
    modules,
    contact: input.contact || input.contact_info || {},
    qa_report: input.qa_report || { status: "NEEDS_REVIEW", score: 0, notes: [] },
  };
}

function mapLayoutToPack(layout) {
  const key = String(layout).toLowerCase();

  // compat con tus 3 actuales
  if (key.includes("local")) return "local_service_trust";
  if (key.includes("ecommerce")) return "ecommerce_retail_conversion";

  // default premium
  return "brand_premium";
}
