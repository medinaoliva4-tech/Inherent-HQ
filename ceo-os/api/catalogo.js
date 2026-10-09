// Para Sales: precios y volumen de los planes. Sin costos ni márgenes — eso solo lo ve el CEO.
import { guard } from './_lib/access.js';
import { readFile } from './_lib/gh.js';
import { parseEconomia } from './_lib/parse.js';
import { fail } from './_lib/http.js';

export default async function handler(req, res) {
  const s = guard(req, res, 'sales');
  if (!s) return;
  try {
    const eco = await readFile('inherent/06-ECONOMIA.md');
    if (!eco) return res.status(404).json({ error: '06-ECONOMIA.md no existe en la rama configurada' });
    const { plans, tipoCambio } = parseEconomia(eco.content);
    res.json({
      tipoCambio,
      plans: plans.map((p) => ({
        id: p.id, name: p.name, precio: p.precio, precioUsd: p.precioUsd, volumen: p.volumen,
        promete: p.promete, hace: p.hace, incluye: p.incluye,
        ...(s.role === 'ceo' ? { costo: p.costo, utilidad: p.utilidad, margen: p.margen } : {}),
      })),
    });
  } catch (e) { fail(res, e); }
}
