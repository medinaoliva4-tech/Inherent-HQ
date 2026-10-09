// 🔒 Solo CEO. Costos, márgenes y roles salen de 06-ECONOMIA y 05-OPERACION.
import { guard } from './_lib/access.js';
import { readFile } from './_lib/gh.js';
import { parseEconomia, parseOperacion } from './_lib/parse.js';
import { fail } from './_lib/http.js';

export default async function handler(req, res) {
  if (!guard(req, res, 'finanzas')) return;
  try {
    const [eco, op] = await Promise.all([readFile('inherent/06-ECONOMIA.md'), readFile('inherent/05-OPERACION.md')]);
    if (!eco) return res.status(404).json({ error: '06-ECONOMIA.md no existe en la rama configurada' });
    res.json({ ...parseEconomia(eco.content), ...(op ? parseOperacion(op.content) : { roles: [], slots: [] }) });
  } catch (e) { fail(res, e); }
}
