export function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}
export function fail(res, e) {
  console.error(e);
  res.status(500).json({ error: 'Error del servidor' });
}
