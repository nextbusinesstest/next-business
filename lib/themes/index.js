// lib/themes/index.js
// Themes v2: diferenciación real por personalidad (sin reescribir componentes)
// - Backward compatible con keys antiguas: trust/elegant/modern
// - Mapeo 1:1 por brand_personality + fallback seguro
// - Respeta spec.brand.design_tokens.colors como override

function clampHex(x) {
  const s = String(x || "").trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s) ? s : "";
}

function applyColorOverrides(vars, colors) {
  if (!colors || typeof colors !== "object") return vars;
  const v = { ...vars };

  // soporta ambos nombres: bg/text/primary/accent/muted
  const bg = clampHex(colors.bg);
  const text = clampHex(colors.text);
  const primary = clampHex(colors.primary);
  const accent = clampHex(colors.accent);
  const muted = clampHex(colors.muted);

  if (bg) v["--c-bg"] = bg;
  if (text) v["--c-text"] = text;
  if (primary) v["--c-primary"] = primary;
  if (accent) v["--c-accent"] = accent;
  if (muted) v["--c-muted"] = muted;

  // Si el usuario pasa algo “dark” (bg muy oscuro) pero no pasa surfaces,
  // mantenemos surfaces coherentes (sin intentar “adivinar” demasiado).
  return v;
}

export const THEMES = {
  // ---- LEGACY KEYS (compat) ----
  trust: {
    name: "trust",
    vars: {
      "--c-bg": "#ffffff",
      "--c-text": "#0f172a",
      "--c-primary": "#0f172a",
      "--c-accent": "#1d4ed8",
      "--c-muted": "#64748b",

      "--surface": "#ffffff",
      "--surface-2": "#f8fafc",
      "--border": "#e5e7eb",
      "--shadow": "0_16px_50px_rgba(15,23,42,0.10)",

      "--r-sm": "12px",
      "--r-md": "16px",
      "--r-lg": "22px",

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
      "--c-muted": "#6b7280",

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
      "--c-muted": "#a1a1aa",

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

  // ---- V2 PERSONALITY THEMES ----

  trust_authority: {
    name: "trust_authority",
    vars: {
      "--c-bg": "#ffffff",
      "--c-text": "#0b1220",
      "--c-primary": "#0b1220",
      "--c-accent": "#1d4ed8",
      "--c-muted": "#6b7280",

      "--surface": "#ffffff",
      "--surface-2": "#f8fafc",
      "--border": "#e5e7eb",
      "--shadow": "0_16px_55px_rgba(15,23,42,0.10)",

      "--r-sm": "12px",
      "--r-md": "16px",
      "--r-lg": "22px",

      "--section-py": "72px",
    },
  },

  clinical_calm: {
    name: "clinical_calm",
    vars: {
      "--c-bg": "#ffffff",
      "--c-text": "#0f172a",
      "--c-primary": "#0f172a",
      "--c-accent": "#0ea5e9",
      "--c-muted": "#64748b",

      "--surface": "#ffffff",
      "--surface-2": "#f0f9ff",
      "--border": "#cfe8ff",
      "--shadow": "0_18px_60px_rgba(2,132,199,0.12)",

      "--r-sm": "16px",
      "--r-md": "22px",
      "--r-lg": "30px",

      "--section-py": "80px",
    },
  },

  tech_clean: {
    name: "tech_clean",
    vars: {
      "--c-bg": "#0b1020",
      "--c-text": "#e5e7eb",
      "--c-primary": "#e5e7eb",
      "--c-accent": "#38bdf8",
      "--c-muted": "#a1a1aa",

      "--surface": "#0f172a",
      "--surface-2": "#111827",
      "--border": "#1f2937",
      "--shadow": "0_24px_90px_rgba(0,0,0,0.40)",

      "--r-sm": "14px",
      "--r-md": "20px",
      "--r-lg": "28px",

      "--section-py": "60px",
    },
  },

  bold_street: {
    name: "bold_street",
    vars: {
      "--c-bg": "#0b0b0f",
      "--c-text": "#ffffff",
      "--c-primary": "#ffffff",
      "--c-accent": "#22c55e",
      "--c-muted": "#a1a1aa",

      "--surface": "#0f0f14",
      "--surface-2": "#12121a",
      "--border": "#23232d",
      "--shadow": "0_26px_100px_rgba(0,0,0,0.55)",

      "--r-sm": "999px",
      "--r-md": "24px",
      "--r-lg": "36px",

      "--section-py": "56px",
    },
  },

  artisan_warm: {
    name: "artisan_warm",
    vars: {
      "--c-bg": "#fffaf3",
      "--c-text": "#2a1f17",
      "--c-primary": "#2a1f17",
      "--c-accent": "#b45309",
      "--c-muted": "#6b4b3a",

      "--surface": "#fffaf3",
      "--surface-2": "#fff1dc",
      "--border": "#f2d9c4",
      "--shadow": "0_18px_60px_rgba(180,83,9,0.18)",

      "--r-sm": "18px",
      "--r-md": "24px",
      "--r-lg": "34px",

      "--section-py": "78px",
    },
  },

  industrial_solid: {
    name: "industrial_solid",
    vars: {
      "--c-bg": "#0b1220",
      "--c-text": "#e5e7eb",
      "--c-primary": "#e5e7eb",
      "--c-accent": "#f59e0b",
      "--c-muted": "#9ca3af",

      "--surface": "#0f172a",
      "--surface-2": "#111827",
      "--border": "#273244",
      "--shadow": "0_26px_90px_rgba(0,0,0,0.45)",

      "--r-sm": "10px",
      "--r-md": "14px",
      "--r-lg": "18px",

      "--section-py": "64px",
    },
  },

  service_local_friendly: {
    name: "service_local_friendly",
    vars: {
      "--c-bg": "#ffffff",
      "--c-text": "#0f172a",
      "--c-primary": "#0f172a",
      "--c-accent": "#10b981",
      "--c-muted": "#64748b",

      "--surface": "#ffffff",
      "--surface-2": "#ecfdf5",
      "--border": "#bbf7d0",
      "--shadow": "0_18px_55px_rgba(16,185,129,0.12)",

      "--r-sm": "16px",
      "--r-md": "22px",
      "--r-lg": "30px",

      "--section-py": "70px",
    },
  },

  premium_elegant: {
    name: "premium_elegant",
    vars: {
      "--c-bg": "#ffffff",
      "--c-text": "#111827",
      "--c-primary": "#111827",
      "--c-accent": "#7c3aed",
      "--c-muted": "#6b7280",

      "--surface": "#ffffff",
      "--surface-2": "#f8fafc",
      "--border": "#e5e7eb",
      "--shadow": "0_26px_90px_rgba(17,24,39,0.14)",

      "--r-sm": "18px",
      "--r-md": "26px",
      "--r-lg": "34px",

      "--section-py": "82px",
    },
  },

  modern_minimal: {
    name: "modern_minimal",
    vars: {
      "--c-bg": "#ffffff",
      "--c-text": "#111827",
      "--c-primary": "#111827",
      "--c-accent": "#111827",
      "--c-muted": "#6b7280",

      "--surface": "#ffffff",
      "--surface-2": "#f8fafc",
      "--border": "#e5e7eb",
      "--shadow": "0_16px_55px_rgba(2,6,23,0.08)",

      "--r-sm": "14px",
      "--r-md": "18px",
      "--r-lg": "26px",

      "--section-py": "64px",
    },
  },

  dark_luxury: {
    name: "dark_luxury",
    vars: {
      "--c-bg": "#07070a",
      "--c-text": "#f5f5f4",
      "--c-primary": "#f5f5f4",
      "--c-accent": "#fbbf24",
      "--c-muted": "#a8a29e",

      "--surface": "#0b0b10",
      "--surface-2": "#12121a",
      "--border": "#2a2a33",
      "--shadow": "0_28px_110px_rgba(0,0,0,0.65)",

      "--r-sm": "14px",
      "--r-md": "22px",
      "--r-lg": "34px",

      "--section-py": "70px",
    },
  },
};

export function themeKeyFromPersonality(personality) {
  const p = (personality || "").toLowerCase().trim();

  // ✅ exact / canonical
  if (THEMES[p]) return p;

  // ✅ compat (tus personalidades existentes)
  if (p === "trust_authority") return "trust_authority";
  if (p === "premium_elegant") return "premium_elegant";
  if (p === "modern_minimal") return "modern_minimal";
  if (p === "bold_street") return "bold_street";
  if (p === "tech_clean") return "tech_clean";
  if (p === "artisan_warm") return "artisan_warm";
  if (p === "industrial_solid") return "industrial_solid";
  if (p === "service_local_friendly") return "service_local_friendly";
  if (p === "clinical_calm") return "clinical_calm";

  // ✅ legacy includes (por si quedan restos)
  if (p.includes("trust") || p.includes("authority")) return "trust_authority";
  if (p.includes("clinical") || p.includes("health")) return "clinical_calm";
  if (p.includes("tech") || p.includes("saas")) return "tech_clean";
  if (p.includes("street") || p.includes("bold")) return "bold_street";
  if (p.includes("artisan") || p.includes("warm")) return "artisan_warm";
  if (p.includes("industrial") || p.includes("metal")) return "industrial_solid";
  if (p.includes("service") || p.includes("local")) return "service_local_friendly";
  if (p.includes("elegant") || p.includes("premium")) return "premium_elegant";
  if (p.includes("modern") || p.includes("minimal")) return "modern_minimal";
  if (p.includes("luxury") || p.includes("dark")) return "dark_luxury";

  // fallback seguro
  return "trust_authority";
}

export function resolveTheme(spec) {
  const explicit = spec?.brand?.theme_key;
  const colors = spec?.brand?.design_tokens?.colors;

  const personality = spec?.brand?.brand_personality;
  const key = explicit && THEMES[explicit] ? explicit : themeKeyFromPersonality(personality);

  const base = THEMES[key] || THEMES.trust_authority;
  const vars = applyColorOverrides(base.vars, colors);

  return { ...base, vars };
}

export function toStyleVars(vars) {
  // listo para <div style={...}>
  return { ...vars };
}
