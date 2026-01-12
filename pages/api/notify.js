export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { companyName, previewUrl, layout } = req.body || {};
  const endpoint = process.env.NB_NOTIFY_FORMSPREE || "https://formspree.io/f/xkgkpepa";

  try {
    // Mandamos un "mensaje" a tu mismo Formspree para que te llegue a ti
    const form = new URLSearchParams();
    form.set("name", "Notificación automática");
    form.set("email", "no-reply@nextbusiness.local");
    form.set("message", `Nuevo preview generado:
Empresa: ${companyName}
Layout: ${layout}
Preview: ${previewUrl}`);

    const r = await fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    if (!r.ok) return res.status(500).json({ error: "Failed to notify" });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Notify error" });
  }
}
