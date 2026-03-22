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
    cache: "no-store",
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

// ---------------- Meta extraction / versioning ----------------
function extractBaseMetaFromSpec(spec) {
  const id = sanitizeId(spec?.meta?.site_id);
  const business = spec?.business || {};
  const strategy = spec?.strategy || {};
  const layout = spec?.layout || {};
  const brand = spec?.brand || {};
  const meta = spec?.meta || {};

  return {
    id,
    name: clampStr(business?.name, 120) || id,
    sector: clampStr(business?.sector, 80),
    location: clampStr(business?.location, 80),
    goal: clampStr(strategy?.primary_goal, 40),
    pack: clampStr(layout?.pack, 60),
    archetype: clampStr(layout?.archetype, 60),
    personality: clampStr(brand?.brand_personality, 60),
    forked_from: clampStr(meta?.forked_from, 80),
  };
}

function mergeVersioning(existingMeta, nextBaseMeta) {
  const now = new Date().toISOString();

  const createdAt = existingMeta?.created_at || now;
  const updatedAt = now;
  const prevRevision = Number(existingMeta?.revision || 0);
  const revision = prevRevision > 0 ? prevRevision + 1 : 1;

  return {
    ...nextBaseMeta,
    created_at: createdAt,
    updated_at: updatedAt,
    published_at: updatedAt, // compat con tu dashboard actual
    revision,
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
        const metas = [];

        for (const id of ids.slice(0, 300)) {
          const raw = await kvGet(`nb:site_meta:${id}`);
          if (!raw) continue;
          try {
            metas.push(JSON.parse(raw));
          } catch {}
        }

        metas.sort((a, b) =>
          String(b.updated_at || b.published_at || "").localeCompare(
            String(a.updated_at || a.published_at || "")
          )
        );

        res.status(200).json({ items: metas });
        return;
      }

      const index = fsReadIndex();
      index.sort((a, b) =>
        String(b.updated_at || b.published_at || "").localeCompare(
          String(a.updated_at || a.published_at || "")
        )
      );
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

    try {
      let existingMeta = null;

      if (IS_PROD) {
        const existingRaw = await kvGet(`nb:site_meta:${id}`);
        if (existingRaw) {
          try {
            existingMeta = JSON.parse(existingRaw);
          } catch {}
        }
      } else {
        existingMeta = fsReadIndex().find((x) => x?.id === id) || null;
      }

      const baseMeta = extractBaseMetaFromSpec(spec);
      const meta = mergeVersioning(existingMeta, baseMeta);

      // reflejamos versionado también dentro del propio spec.meta
      spec.meta.created_at = meta.created_at;
      spec.meta.updated_at = meta.updated_at;
      spec.meta.revision = meta.revision;
      if (meta.forked_from) {
        spec.meta.forked_from = meta.forked_from;
      }

      const finalRaw = JSON.stringify(spec);

      if (IS_PROD) {
        await kvSet(`nb:site:${id}`, finalRaw);
        await kvSet(`nb:site_meta:${id}`, JSON.stringify(meta));
        await kvSAdd("nb:sites:index", id);
      } else {
        const dir = getFsDir();
        ensureDir(dir);
        fs.writeFileSync(path.join(dir, `${id}.json`), finalRaw, "utf8");

        const index = fsReadIndex().filter((x) => x?.id !== id);
        index.unshift(meta);
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
