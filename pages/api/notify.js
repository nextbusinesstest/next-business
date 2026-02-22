// Rate limit in-memory (mejor que nada en serverless)
const RL = globalThis.__NB_RL_NOTIFY__ || (globalThis.__NB_RL_NOTIFY__ = new Map());
const WINDOW_MS = 60_000;
const MAX_REQ = 20;

function getIP(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function rateLimit(req) {
  const ip = getIP(req);
  const now = Date.now();
  const e = RL.get(ip) || { n: 0, reset: now + WINDOW_MS };
  if (now > e.reset) {
    e.n = 0;
    e.reset = now + WINDOW_MS;
  }
  e.n += 1;
  RL.set(ip, e);
  return { ok: e.n <= MAX_REQ, retryAfterSec: Math.ceil((e.reset - now) / 1000) };
}

function clampStr(v, max) {
  const s = (v ?? "").toString().trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}

function isHttpUrl(u) {
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const rl = rateLimit(req);
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfterSec));
    return res.status(429).json({ error: "Too many requests" });
  }

  // ✅ Protección: cookie nb_auth o token
  const authCookie = req.cookies?.nb_auth;
  const token = process.env.NB_NOTIFY_TOKEN; // opcional pero recomendado
  const headerToken = req.headers["x-nb-notify-token"];

  const tokenOk = token ? String(headerToken || "") === String(token) : false;
  const cookieOk = authCookie === "1";

  // Si hay token configurado, permitimos token OR cookie.
  // Si NO hay token, exigimos cookie.
  if (token ? !(tokenOk || cookieOk) : !cookieOk) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const endpoint = process.env.NB_NOTIFY_FORMSPREE;
  if (!endpoint) {
    // ✅ Quitamos fallback hardcodeado (esto era peligroso)
    return res.status(500).json({ error: "Missing NB_NOTIFY_FORMSPREE in env" });
  }

  const { companyName, previewUrl, layout } = req.body || {};

  const safeCompany = clampStr(companyName, 120);
  const safeLayout = clampStr(layout, 120);
  const safePreview = clampStr(previewUrl, 500);

  if (!safeCompany || !safePreview || !isHttpUrl(safePreview)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    const form = new URLSearchParams();
    form.set("name", "Notificación automática");
    form.set("email", "no-reply@nextbusiness.local");
    form.set(
      "message",
      `Nuevo preview generado:
Empresa: ${safeCompany}
Layout: ${safeLayout || "—"}
Preview: ${safePreview}`
    );

    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    if (!r.ok) return res.status(500).json({ error: "Failed to notify" });

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Notify error" });
  }
}
