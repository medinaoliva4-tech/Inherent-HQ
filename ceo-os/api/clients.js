// Clientes y planes: se LEEN de clients/*/00-onboarding/plan-contratado.md, nunca se suponen.
import { guard } from './_lib/access.js';
import { listDir, readFile } from './_lib/gh.js';
import { parsePlanContratado } from './_lib/parse.js';
import { fail } from './_lib/http.js';

export default async function handler(req, res) {
  const s = guard(req, res, 'operations');
  if (!s) return;
  try {
    const dirs = (await listDir('clients')).filter((d) => d.type === 'dir' && !d.name.startsWith('_'));
    const clients = await Promise.all(dirs.map(async (d) => {
      const f = await readFile(`clients/${d.name}/00-onboarding/plan-contratado.md`);
      return f ? { slug: d.name, hasPlan: true, ...parsePlanContratado(f.content, s.role) }
               : { slug: d.name, hasPlan: false };
    }));
    res.json({ clients });
  } catch (e) { fail(res, e); }
}
