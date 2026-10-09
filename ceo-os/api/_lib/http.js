export function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}
export function fail(res, e) {
  if (e?.code === 'NO_DB' || e?.code === 'NO_APIFY' || e?.code === 'NO_GOOGLE' || e?.code === 'NO_GOOGLE_TOKEN') return res.status(503).json({ error: e.message, code: e.code });
  if (e?.status === 401 || e?.status === 403) return res.status(e.status === 401 ? 503 : 403).json({ error: 'Google no dio acceso. Sal y vuelve a entrar con Google para dar permiso.', code: 'NO_GOOGLE_TOKEN' });
  if (e?.code === 'GH') return res.status(502).json({ error: e.message, code: 'GH' });
  console.error(e);
  res.status(500).json({ error: 'Error del servidor' });
}
