// Lectura/escritura genérica de ceo-os/data/** y el CRM. Cada escritura es un commit.
import { guard } from './_lib/access.js';
import { areaOf } from './_lib/policy.js';
import { readFile, writeFile, deleteFile, listDir } from './_lib/gh.js';
import { body, fail } from './_lib/http.js';

export default async function handler(req, res) {
  try {
    const b = req.method === 'GET' ? req.query : body(req);
    const path = String(b.path || '').replace(/\/$/, '');
    const a = areaOf(b.list ? path + '/x' : path);
    if (!a) return res.status(400).json({ error: 'Ruta no permitida' });
    const sess = guard(req, res, a);
    if (!sess) return;
    const who = (m) => `${m || 'actualiza ' + path} · por ${sess.user}`;

    if (req.method === 'GET' && b.list) return res.json({ files: await listDir(path) });
    if (req.method === 'GET') {
      const f = await readFile(path);
      return res.json(f ? f : { content: null, sha: null });
    }
    if (req.method === 'PUT') {
      if (typeof b.content !== 'string' || b.content.length > 900_000) return res.status(400).json({ error: 'Contenido inválido o muy grande' });
      const r = await writeFile(path, b.content, b.sha || undefined, who(b.message));
      return r.conflict ? res.status(409).json({ error: 'Alguien más cambió este archivo. Recarga.' }) : res.json(r);
    }
    if (req.method === 'DELETE') {
      if (!b.sha) return res.status(400).json({ error: 'Falta sha' });
      const r = await deleteFile(path, b.sha, who(b.message));
      return r.conflict ? res.status(409).json({ error: 'Conflicto. Recarga.' }) : res.json(r);
    }
    res.status(405).end();
  } catch (e) { fail(res, e); }
}
