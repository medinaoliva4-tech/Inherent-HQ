// Build (Vercel): copia del repo SOLO lo que la app lee a api/_data/repo.json, que viaja dentro de
// la función (nunca en public/). Cada push a main redeploya y la copia se actualiza.
//   · economía y operación · el plan contratado de cada cliente
//   · por perfil (Inherent y cada cliente): LINKS, la investigación y lo que hay en 04-contenido
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { esIntel } from '../public/js/intel-mapa.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..', '..');
const out = path.join(here, '..', 'api', '_data', 'repo.json');
const files = {}; const dirs = { clients: [] }; const dates = {};
const take = (p) => { try { files[p] = fs.readFileSync(path.join(repo, p), 'utf8'); } catch {} };
const walk = (p, ok) => { let ents = []; try { ents = fs.readdirSync(path.join(repo, p), { withFileTypes: true }); } catch {} for (const e of ents) { const q = p + '/' + e.name; if (e.isDirectory()) walk(q, ok); else if (ok(q)) take(q); } };
const text = (q) => /\.(md|csv)$/i.test(q);

take('inherent/06-ECONOMIA.md');
take('inherent/05-OPERACION.md');
take('inherent/00-PRINCIPIOS.md'); // lo lee api/_lib/conocimiento.js para los agentes del servidor
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
  // El design system de la marca (Marca › Diseño › Design system): su sistema visual y los logos en SVG.
  take(`${p}/02-marca/sistema-visual.md`);
  walk(`${p}/02-marca/logos`, (q) => /\.svg$/i.test(q));
}

// Agent Area: el WORKFLOW.md de cada agente (las etapas de cada flujo los lee api/_lib/agentes.js con agentes-flujos.js).
try { for (const d of fs.readdirSync(path.join(repo, 'agents'), { withFileTypes: true })) if (d.isDirectory() && /^\d/.test(d.name)) take(`agents/${d.name}/brain/WORKFLOW.md`); } catch {}

// Agentes del servidor: el SKILL.md de cada skill (sin sus referencias). Lo lee api/_lib/conocimiento.js.
try { for (const d of fs.readdirSync(path.join(repo, 'agents'), { withFileTypes: true })) if (d.isDirectory() && /^\d/.test(d.name)) walk(`agents/${d.name}/brain/skills`, (q) => /\/SKILL\.md$/.test(q)); } catch {}
// Las skills comunes (recepcion, resultados) y el router (/inherent) viven fuera de las carpetas numeradas.
for (const c of ['_comun', '_router']) walk(`agents/${c}/skills`, (q) => /\/SKILL\.md$/.test(q));

// Intel: solo los archivos del mapa de entregables (public/js/intel-mapa.js), de cada cliente y de Inherent. Nada más del folder
// (nada de 10-finanzas ni de lo que no es un entregable). Su fecha es la del último commit, si git está disponible en el build.
for (const p of profiles) walk(p, (q) => text(q) && esIntel(q.slice(p.length + 1)));
for (const f of Object.keys(files)) {
  if (!/^(clients|inherent)\/[^/]+\/.*\.(md|csv)$|^inherent\/inherent-social-media\//.test(f)) continue;
  try { const d = execFileSync('git', ['log', '-1', '--format=%cI', '--', f], { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 4000 }).trim().slice(0, 10); if (d) dates[f] = d; } catch {}
}

// App 02 · Estrategia: la biblioteca de Hormozi (libros, roadmap y SOPs, ~5 MB) es DATO del OS en ceo-os/data/hormozi (ya no es una
// skill de agents/) y va aparte, en api/_data/fuentes.json: solo lo lee la ruta de fuentes (api/_lib/estrategia.js), así el resto de la
// API no la carga. Las rutas son relativas a esa carpeta (books/…, roadmap/…, sops/…, briefs/…); README.md e INDEX.md no viajan.
{
  const ref = path.join(repo, 'ceo-os/data/hormozi'), fuentes = {};
  const rd = (rel) => { let ents = []; try { ents = fs.readdirSync(path.join(ref, rel), { withFileTypes: true }); } catch {} for (const e of ents) { const q = rel ? rel + '/' + e.name : e.name; if (e.isDirectory()) rd(q); else if (/\.md$/i.test(q) && q.includes('/')) fuentes[q] = fs.readFileSync(path.join(ref, q), 'utf8'); } };
  rd('');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(path.join(path.dirname(out), 'fuentes.json'), JSON.stringify({ at: new Date().toISOString(), files: fuentes }));
  console.log(`snapshot: ${Object.keys(fuentes).length} fuentes de la biblioteca de Hormozi`);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), files, dirs, dates }));
console.log(`snapshot: ${Object.keys(files).length} archivos, ${dirs.clients.length} clientes`);
if (!files['inherent/06-ECONOMIA.md']) console.warn('⚠️ snapshot: no encontré inherent/06-ECONOMIA.md — ¿Vercel incluye los archivos fuera de ceo-os/?');
