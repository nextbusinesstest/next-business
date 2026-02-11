// lib/themes/index.js
// Themes v1: tokens mínimos pero impactantes (cambia carácter sin reescribir componentes)

export const THEMES = {
  trust: {
    name: "trust",
    vars: {
      // colores
      "--c-bg": "#ffffff",
      "--c-text": "#0f172a",
      "--c-primary": "#0f172a",
      "--c-accent": "#1d4ed8",

      // superficies / borde / sombra
      "--surface": "#ffffff",
      "--surface-2": "#f8fafc",
      "--border": "#e5e7eb",
      "--shadow": "0_16px_50px_rgba(15,23,42,0.10)",

      // radios (más “corporate”)
      "--r-sm": "12px",
      "--r-md": "16px",
      "--r-lg": "22px",

      // spacing
      "--section-py": "64px",
    },
  },

  elegant: {
    name: "elegant",
    vars: {
      "--c-bg": "#ffffff",
      "--c-text": "#111827",
      "--c-primary": "#111827",
      "--c-accent": "#7c3aed",

      "--surface": "#ffffff",
      "--surface-2": "#faf5ff",
      "--border": "#e9d5ff",
      "--shadow": "0_20px_70px_rgba(124,58,237,0.10)",

      "--r-sm": "16px",
      "--r-md": "22px",
      "--r-lg": "30px",

      "--section-py": "72px",
    },
  },

  modern: {
    name: "modern",
    vars: {
      "--c-bg": "#0b0f19",
      "--c-text": "#e5e7eb",
      "--c-primary": "#e5e7eb",
      "--c-accent": "#22c55e",

      "--surface": "#0f172a",
      "--surface-2": "#111827",
      "--border": "#1f2937",
      "--shadow": "0_22px_80px_rgba(0,0,0,0.35)",

      "--r-sm": "999px",
      "--r-md": "28px",
      "--r-lg": "36px",

      "--section-py": "72px",
    },
  },
};

export function themeKeyFromPersonality(personality) {
  const p = (personality || "").toLowerCase();

  // mapeo inicial (simple y estable)
  if (p.includes("trust") || p.includes("authority")) return "trust";
  if (p.includes("elegant") || p.includes("premium")) return "elegant";
  if (p.includes("modern") || p.includes("minimal")) return "modern";

  // fallback razonable
  return "trust";
}

export function resolveTheme(spec) {
  // prioridad: spec.brand.theme_key explícito (futuro)
  const explicit = spec?.brand?.theme_key;
  if (explicit && THEMES[explicit]) return THEMES[explicit];

  const personality = spec?.brand?.brand_personality;
  const key = themeKeyFromPersonality(personality);
  return THEMES[key] || THEMES.trust;
}

export function toStyleVars(vars) {
  // devuelve un objeto listo para <div style={...}>
  return { ...vars };
}
