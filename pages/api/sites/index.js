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

// ---------------- KV Helpers (Upstash REST) ----------------
function getKvConfig() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("KV not configured (missing KV_REST_API_URL / KV_REST_API_TOKEN).");
  return { url, token };
}

async function kvGet(key) {
  const { url, token } = getKvConfig();
  const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`KV get failed (${r.status})`);
  const data = await r.json().catch(() => null);
  return data?.result ?? null;
}

async function kvSet(key, value) {
  const { url, token } = getKvConfig();
  const r = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: value,
  });
  if (!r.ok) throw new Error(`KV set failed (${r.status})`);
}

async function kvSAdd(key, member) {
  const { url, token } = getKvConfig();
  const r = await fetch(`${url}/sadd/${encodeURIComponent(key)}/${encodeURIComponent(member)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`KV sadd failed (${r.status})`);
}

async function kvSMembers(key) {
  const { url, token } = getKvConfig();
  const r = await fetch(`${url}/smembers/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`KV smembers failed (${r.status})`);
  const data = await r.json().catch(() => null);
  return Array.isArray(data?.result) ? data.result : [];
}

// ---------------- Meta extraction ----------------
function extractMetaFromSpec(spec) {
  const id = sanitizeId(spec?.meta?.site_id);
  const business = spec?.business || {};
  const strategy = spec?.strategy || {};
  const layout = spec?.layout || {};
  const brand = spec?.brand || {};

  return {
    id,
    name: clampStr(business?.name, 120) || id,
    sector: clampStr(business?.sector, 80),
    location: clampStr(business?.location, 80),
    goal: clampStr(strategy?.primary_goal, 40),
    pack: clampStr(layout?.pack, 60),
    archetype: clampStr(layout?.archetype, 60),
    personality: clampStr(brand?.brand_personality, 60),
    published_at: new Date().toISOString(),
  };
}

// ---------------- DEV FS index helpers ----------------
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
  ensureDir(getFsDir());
  fs.writeFileSync(getFsIndexFile(), JSON.stringify(arr, null, 2), "utf8");
}

export default async function handler(req, res) {
  // ---------- GET: list sites ----------
  if (req.method === "GET") {
    try {
      if (IS_PROD) {
        const ids = await kvSMembers("nb:sites:index");
        // cargar metas (limitamos a 200 para MVP)
        const metas = [];
        for (const id of ids.slice(0, 200)) {
          const raw = await kvGet(`nb:site_meta:${id}`);
          if (!raw) continue;
          try {
            metas.push(JSON.parse(raw));
          } catch {}
        }
        // orden: más recientes primero
        metas.sort((a, b) => String(b.published_at || "").localeCompare(String(a.published_at || "")));
        res.status(200).json({ items: metas });
        return;
      }

      // DEV: leer index + metas del fs
      const index = fsReadIndex(); // array de meta objects
      index.sort((a, b) => String(b.published_at || "").localeCompare(String(a.published_at || "")));
      res.status(200).json({ items: index });
      return;
    } catch (e) {
      res.status(500).json({ error: e?.message || "List failed." });
      return;
    }
  }

  // ---------- POST: publish spec ----------
  if (req.method === "POST") {
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

    const meta = extractMetaFromSpec(spec);

    try {
      if (IS_PROD) {
        // spec + meta
        await kvSet(`nb:site:${id}`, raw);
        await kvSet(`nb:site_meta:${id}`, JSON.stringify(meta));
        await kvSAdd("nb:sites:index", id);
      } else {
        // DEV filesystem
        const dir = getFsDir();
        ensureDir(dir);
        fs.writeFileSync(path.join(dir, `${id}.json`), raw, "utf8");

        // index = array de metas (únicas por id)
        const index = fsReadIndex().filter((x) => x?.id !== id);
        index.unshift(meta); // newest first
        fsWriteIndex(index);
      }

      res.status(200).json({ id, url: `/s/${id}`, meta });
      return;
    } catch (e) {
      res.status(500).json({ error: e?.message || "Publish failed." });
      return;
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
