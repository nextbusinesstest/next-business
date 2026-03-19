import fs from "fs";
import path from "path";

const IS_PROD = (process.env.NODE_ENV || "development") === "production";

function clampStr(v, max) {
  const s = (v ?? "").toString().trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}

function sanitizeId(id) {
  return clampStr(id, 80).replace(/[^a-zA-Z0-9_-]/g, "");
}

function isValidSpec(spec) {
  if (!spec || typeof spec !== "object") return false;
  if (spec.version !== "2.0") return false;
  if (!spec.meta || typeof spec.meta !== "object") return false;
  if (!spec.meta.site_id || typeof spec.meta.site_id !== "string") return false;
  if (!spec.layout || typeof spec.layout !== "object") return false;
  if (!spec.layout.pages || typeof spec.layout.pages !== "object") return false;
  return true;
}

function getFsDir() {
  return path.join(process.cwd(), "data", "sites");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function kvSet(key, value) {
  // Vercel KV (Upstash) REST API
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("KV not configured (missing KV_REST_API_URL / KV_REST_API_TOKEN).");

  const r = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: value,
  });
  if (!r.ok) throw new Error(`KV set failed (${r.status})`);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body || {};
  const spec = body.site_spec || body.spec || body;

  const raw = JSON.stringify(spec || {});
  if (raw.length > 220_000) {
    res.status(413).json({ error: "Spec too large." });
    return;
  }

  if (!isValidSpec(spec)) {
    res.status(400).json({ error: "Invalid site_spec." });
    return;
  }

  const id = sanitizeId(spec.meta.site_id);
  if (!id) {
    res.status(400).json({ error: "Invalid site_id." });
    return;
  }

  try {
    if (IS_PROD) {
      // ✅ PRODUCTION: guardar en Vercel KV
      await kvSet(`nb:site:${id}`, raw);
    } else {
      // ✅ DEV: guardar en filesystem
      const dir = getFsDir();
      ensureDir(dir);
      const file = path.join(dir, `${id}.json`);
      fs.writeFileSync(file, raw, "utf8");
    }

    res.status(200).json({ id, url: `/s/${id}` });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Publish failed." });
  }
}
