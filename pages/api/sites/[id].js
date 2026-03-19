import fs from "fs";
import path from "path";

const IS_PROD = (process.env.NODE_ENV || "development") === "production";

function sanitizeId(id) {
  return (id ?? "").toString().trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function getFsDir() {
  return path.join(process.cwd(), "data", "sites");
}

async function kvGet(key) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("KV not configured (missing KV_REST_API_URL / KV_REST_API_TOKEN).");

  const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`KV get failed (${r.status})`);

  const data = await r.json().catch(() => null);
  // Upstash devuelve { result: "..." } o { result: null }
  return data?.result ?? null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const id = sanitizeId(req.query.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  try {
    if (IS_PROD) {
      const raw = await kvGet(`nb:site:${id}`);
      if (!raw) {
        res.status(404).json({ error: "Not found." });
        return;
      }
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(raw);
      return;
    }

    // DEV filesystem
    const file = path.join(getFsDir(), `${id}.json`);
    if (!fs.existsSync(file)) {
      res.status(404).json({ error: "Not found." });
      return;
    }

    const raw = fs.readFileSync(file, "utf8");
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(raw);
  } catch (e) {
    res.status(500).json({ error: e?.message || "Read failed." });
  }
}
