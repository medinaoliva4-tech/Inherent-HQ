// Build (Vercel): copia del repo SOLO lo que la app lee —economía, operación y el plan de cada
// cliente— a api/_data/repo.json, que viaja dentro de la función (nunca en public/).
// Así la app lee el repo sin token: cada push a main redeploya y la copia se actualiza.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..', '..');
const out = path.join(here, '..', 'api', '_data', 'repo.json');
const files = {}; const dirs = { clients: [] };
const take = (p) => { try { files[p] = fs.readFileSync(path.join(repo, p), 'utf8'); } catch {} };

take('inherent/06-ECONOMIA.md');
take('inherent/05-OPERACION.md');
try {
  for (const d of fs.readdirSync(path.join(repo, 'clients'), { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    dirs.clients.push(d.name);
    take(`clients/${d.name}/00-onboarding/plan-contratado.md`);
  }
} catch {}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), files, dirs }));
console.log(`snapshot: ${Object.keys(files).length} archivos, ${dirs.clients.length} clientes`);
if (!files['inherent/06-ECONOMIA.md']) console.warn('⚠️ snapshot: no encontré inherent/06-ECONOMIA.md — ¿Vercel incluye los archivos fuera de ceo-os/?');
