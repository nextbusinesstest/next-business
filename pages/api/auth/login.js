import crypto from "crypto";

// Rate limit in-memory (mejor que nada en serverless)
const RL = globalThis.__NB_RL_LOGIN__ || (globalThis.__NB_RL_LOGIN__ = new Map());
const WINDOW_MS = 60_000;
const MAX_REQ = 10;

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

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const rl = rateLimit(req);
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfterSec));
    return res.status(429).json({ error: "Too many requests" });
  }

  const { password } = req.body || {};
  const expected = process.env.NB_PORTAL_PASSWORD;

  if (!expected) {
    return res.status(500).json({ error: "Missing NB_PORTAL_PASSWORD in env" });
  }

  if (!safeEqual(String(password || ""), String(expected))) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const secure = process.env.NODE_ENV === "production";
  const cookie = [
    "nb_auth=1",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=604800",
    "Priority=High",
    secure ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");

  res.setHeader("Set-Cookie", cookie);
  return res.status(200).json({ ok: true });
}
