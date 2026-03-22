import fs from "fs";
import path from "path";

const IS_PROD = (process.env.NODE_ENV || "development") === "production";

function sanitizeId(id) {
  return (id ?? "").toString().trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function getFsDir() {
  return path.join(process.cwd(), "data", "sites");
}

function getFsIndexFile() {
  return path.join(getFsDir(), `_index.json`);
}

function fsReadIndex() {
  const f = getFsIndexFile();
  if (!fs.existsSync(f)) return [];
  try {
    const raw = fs.readFileSync(f, "utf8");
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function fsWriteIndex(arr) {
  fs.mkdirSync(getFsDir(), { recursive: true });
  fs.writeFileSync(getFsIndexFile(), JSON.stringify(arr, null, 2), "utf8");
}

// ---------------- KV helpers ----------------
function getKvConfig() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("KV not configured (missing KV_REST_API_URL / KV_REST_API_TOKEN).");
  }
  return { url, token };
}

async function kvGet(key) {
  const { url, token } = getKvConfig();
  const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`KV get failed (${r.status})`);
  const data = await r.json().catch(() => null);
  return data?.result ?? null;
}

async function kvDel(key) {
  const { url, token } = getKvConfig();
  const r = await fetch(`${url}/del/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`KV del failed (${r.status})`);
}

async function kvSRem(key, member) {
  const { url, token } = getKvConfig();
  const r = await fetch(`${url}/srem/${encodeURIComponent(key)}/${encodeURIComponent(member)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`KV srem failed (${r.status})`);
}

export default async function handler(req, res) {
  const id = sanitizeId(req.query.id);

  if (!id) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }

  // ---------------- GET ----------------
  if (req.method === "GET") {
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

      const file = path.join(getFsDir(), `${id}.json`);
      if (!fs.existsSync(file)) {
        res.status(404).json({ error: "Not found." });
        return;
      }

      const raw = fs.readFileSync(file, "utf8");
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(raw);
      return;
    } catch (e) {
      res.status(500).json({ error: e?.message || "Read failed." });
      return;
    }
  }

  // ---------------- DELETE ----------------
  if (req.method === "DELETE") {
    try {
      if (IS_PROD) {
        await kvDel(`nb:site:${id}`);
        await kvDel(`nb:site_meta:${id}`);
        await kvSRem("nb:sites:index", id);

        res.status(200).json({ ok: true, id });
        return;
      }

      const file = path.join(getFsDir(), `${id}.json`);
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }

      const nextIndex = fsReadIndex().filter((x) => x?.id !== id);
      fsWriteIndex(nextIndex);

      res.status(200).json({ ok: true, id });
      return;
    } catch (e) {
      res.status(500).json({ error: e?.message || "Delete failed." });
      return;
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
