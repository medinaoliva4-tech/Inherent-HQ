import { clean, latestAll, save } from "./_store.js";

// GET: última respuesta por video · POST: guarda una respuesta del cliente
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") return res.status(200).json(await latestAll());
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const rec = clean(body);
      await save(rec);
      return res.status(200).json({ ok: true, rec });
    }
    return res.status(405).json({ error: "method" });
  } catch (e) {
    return res.status(e.message === "video" ? 400 : 500).json({ error: "No se pudo guardar" });
  }
}
