export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { password } = req.body || {};
  const expected = process.env.NB_PORTAL_PASSWORD;

  if (!expected) {
    return res.status(500).json({ error: "Missing NB_PORTAL_PASSWORD in env" });
  }

  if (password !== expected) {
    return res.status(401).json({ error: "Invalid password" });
  }

  // cookie simple
  res.setHeader("Set-Cookie", `nb_auth=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
  return res.status(200).json({ ok: true });
}
