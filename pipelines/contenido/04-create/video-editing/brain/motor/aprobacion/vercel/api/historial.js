import { history, latestAll } from "./_store.js";

// Solo para Inherent: requiere ?k=ADMIN_KEY
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.ADMIN_KEY || req.query.k !== process.env.ADMIN_KEY) return res.status(401).json({ error: "clave" });
  try {
    return res.status(200).json({ ultimo: await latestAll(), historial: await history() });
  } catch (e) {
    return res.status(500).json({ error: "lectura" });
  }
}
