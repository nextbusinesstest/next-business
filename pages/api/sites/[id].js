import fs from "fs";
import path from "path";

function getDataDir() {
  return path.join(process.cwd(), "data", "sites");
}

function sanitizeId(id) {
  return (id ?? "").toString().trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
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

  const file = path.join(getDataDir(), `${id}.json`);
  if (!fs.existsSync(file)) {
    res.status(404).json({ error: "Not found." });
    return;
  }

  const raw = fs.readFileSync(file, "utf8");
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(raw);
}
