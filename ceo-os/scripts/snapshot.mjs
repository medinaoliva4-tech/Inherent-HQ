// Build (Vercel): copia del repo SOLO lo que la app lee a api/_data/repo.json, que viaja dentro de
// la función (nunca en public/). Cada push a main redeploya y la copia se actualiza.
//   · economía y operación · el plan contratado de cada cliente
//   · por perfil (Inherent y cada cliente): LINKS, la investigación y lo que hay en 04-contenido
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..', '..');
const out = path.join(here, '..', 'api', '_data', 'repo.json');
const files = {}; const dirs = { clients: [] };
const take = (p) => { try { files[p] = fs.readFileSync(path.join(repo, p), 'utf8'); } catch {} };
const walk = (p, ok) => { let ents = []; try { ents = fs.readdirSync(path.join(repo, p), { withFileTypes: true }); } catch {} for (const e of ents) { const q = p + '/' + e.name; if (e.isDirectory()) walk(q, ok); else if (ok(q)) take(q); } };
const text = (q) => /\.(md|csv)$/i.test(q);

take('inherent/06-ECONOMIA.md');
take('inherent/05-OPERACION.md');
const profiles = ['inherent/inherent-social-media'];
try {
  for (const d of fs.readdirSync(path.join(repo, 'clients'), { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    dirs.clients.push(d.name);
    take(`clients/${d.name}/00-onboarding/plan-contratado.md`);
    if (!d.name.startsWith('_')) profiles.push(`clients/${d.name}`);
  }
} catch {}
for (const p of profiles) {
  take(`${p}/00-onboarding/LINKS.md`);
  walk(`${p}/99-referencias/investigacion`, text);
  walk(`${p}/04-contenido`, (q) => text(q) && !/\/CONTEXTO\.md$|\/AAAA-MM\//.test(q));
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), files, dirs }));
console.log(`snapshot: ${Object.keys(files).length} archivos, ${dirs.clients.length} clientes`);
if (!files['inherent/06-ECONOMIA.md']) console.warn('⚠️ snapshot: no encontré inherent/06-ECONOMIA.md — ¿Vercel incluye los archivos fuera de ceo-os/?');
