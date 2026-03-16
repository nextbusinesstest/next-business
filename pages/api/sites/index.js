import fs from "fs";
import path from "path";

function safeJsonParse(str) {
  try {
    return { ok: true, value: JSON.parse(str) };
  } catch {
    return { ok: false, value: null };
  }
}

function getDataDir() {
  return path.join(process.cwd(), "data", "sites");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function clampStr(v, max) {
  const s = (v ?? "").toString().trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}

function isValidSpec(spec) {
  // Validador mínimo, seguro (sin depender de libs)
  if (!spec || typeof spec !== "object") return false;
  if (spec.version !== "2.0") return false;
  if (!spec.meta || typeof spec.meta !== "object") return false;
  if (!spec.meta.site_id || typeof spec.meta.site_id !== "string") return false;
  if (!spec.layout || typeof spec.layout !== "object") return false;
  if (!spec.layout.pages || typeof spec.layout.pages !== "object") return false;
  return true;
}

function sanitizeId(id) {
  // solo ids seguros para filename
  return clampStr(id, 80).replace(/[^a-zA-Z0-9_-]/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Auth simple MVP: solo en dev permitimos sin cookie.
  // En prod lo cerraremos con nb_auth o token.
  const env = process.env.NODE_ENV || "development";
  if (env === "production") {
    // Si ya tienes nb_auth, aquí lo validamos.
    // Por ahora lo bloqueamos en prod hasta implementar auth.
    res.status(403).json({ error: "Publishing disabled in production (MVP safety)." });
    return;
  }

  // Acepta JSON directo o string JSON
  const body = req.body || {};
  const spec =
    typeof body === "string"
      ? safeJsonParse(body).value
      : body.site_spec || body.spec || body;

  // Size limit defensivo
  const raw = JSON.stringify(spec || {});
  if (raw.length > 220_000) {
    res.status(413).json({ error: "Spec too large." });
    return;
  }

  if (!isValidSpec(spec)) {
    res.status(400).json({ error: "Invalid site_spec." });
    return;
  }

  const dir = getDataDir();
  ensureDir(dir);

  const id = sanitizeId(spec.meta.site_id);
  if (!id) {
    res.status(400).json({ error: "Invalid site_id." });
    return;
  }

  const file = path.join(dir, `${id}.json`);
  fs.writeFileSync(file, raw, "utf8");

  res.status(200).json({ id, url: `/s/${id}` });
}
