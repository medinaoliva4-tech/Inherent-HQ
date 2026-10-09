export function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}
export function fail(res, e) {
  if (e?.code === 'NO_DB' || e?.code === 'NO_GOOGLE' || e?.code === 'NO_GOOGLE_TOKEN') return res.status(503).json({ error: e.message, code: e.code });
  console.error(e);
  res.status(500).json({ error: 'Error del servidor' });
}
