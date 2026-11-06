// El repo es la base de datos: leer = GitHub contents API, escribir = un commit.
// Modo local (solo desarrollo): con LOCAL_REPO=<ruta> lee/escribe el filesystem en vez de GitHub.
import fs from 'node:fs';
import nodePath from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const LOCAL = process.env.LOCAL_REPO;
// En Vercel se lee la copia que hace el build (scripts/snapshot.mjs).
let SNAP;
function snap() {
  if (SNAP !== undefined) return SNAP;
  try { SNAP = JSON.parse(fs.readFileSync(new URL('../_data/repo.json', import.meta.url), 'utf8')); } catch { SNAP = null; }
  return SNAP;
}
const useSnap = () => !LOCAL && snap();
// Lo que el OS escribió en el repo desde que se armó la copia del build: se lee de aquí hasta que Vercel publique otra vez.
const RECIENTES = new Map();
export const repoSource = () => (LOCAL ? 'local' : snap() ? 'build' : process.env.GITHUB_TOKEN ? 'github' : 'none');
const lp = (p) => nodePath.join(LOCAL, p);
const sha1 = (c) => crypto.createHash('sha1').update(c).digest('hex');
const cfg = () => ({
  repo: process.env.GITHUB_REPO || 'medinaoliva4-tech/Inherent-HQ',
  branch: process.env.GITHUB_BRANCH || 'main',
  token: process.env.GITHUB_TOKEN?.trim(),
});
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');
// Error de GitHub con una explicación que se entiende (sale tal cual en la app).
async function ghError(r, what) {
  let msg = ''; try { msg = (await r.json()).message || ''; } catch {}
  const human = r.status === 401 ? 'GitHub no aceptó el GITHUB_TOKEN: revisa que esté bien copiado (sin espacios) y vuelve a publicar en Vercel.'
    : r.status === 403 ? 'El GITHUB_TOKEN no tiene permiso para escribir: en GitHub dale «Contents: Read and write» sobre Inherent-HQ.'
    : r.status === 404 ? `GitHub no encuentra el repo ${cfg().repo} con ese token: en «Repository access» elige Inherent-HQ.`
    : `GitHub ${r.status} ${what}`;
  console.error('github', r.status, what, msg);
  return Object.assign(new Error(human + (msg ? ` (GitHub: ${msg})` : '')), { code: 'GH', ghStatus: r.status });
}

async function gh(path, init = {}, repoFijo = '') {
  const { repo: repoCfg, token } = cfg(), repo = repoFijo || repoCfg;
  if (!token) throw Object.assign(new Error('Falta GITHUB_TOKEN en Vercel para escribir en el repo'), { code: 'GH' });
  return fetch(`https://api.github.com/repos/${repo}${path ? '/' + path : ''}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

// Otras llamadas a la API de GitHub sobre el repo (ej. las versiones de la app de escritorio). Devuelve la respuesta tal cual.
export const ghApi = (path, init, repo) => gh(path, init, repo);

export async function readFile(path) {
  if (LOCAL) { try { const c = fs.readFileSync(lp(path), 'utf8'); return { content: c, sha: sha1(c) }; } catch { return null; } }
  if (useSnap()) { const c = RECIENTES.has(path) ? RECIENTES.get(path) : SNAP.files[path]; return c == null ? null : { content: c, sha: sha1(c) }; }
  const r = await gh(`contents/${enc(path)}?ref=${encodeURIComponent(cfg().branch)}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub ${r.status} leyendo ${path}`);
  const j = await r.json();
  if (Array.isArray(j) || j.type !== 'file') return null;
  return { content: Buffer.from(j.content || '', 'base64').toString('utf8'), sha: j.sha };
}

export async function listDir(path) {
  if (LOCAL) { try { return fs.readdirSync(lp(path), { withFileTypes: true }).map((d) => ({ name: d.name, path: path + '/' + d.name, type: d.isDirectory() ? 'dir' : 'file', size: 0 })); } catch { return []; } }
  if (useSnap()) return (SNAP.dirs[path] || []).map((n) => ({ name: n, path: path + '/' + n, type: 'dir', size: 0 }));
  const r = await gh(`contents/${enc(path)}?ref=${encodeURIComponent(cfg().branch)}`);
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`GitHub ${r.status} listando ${path}`);
  const j = await r.json();
  return Array.isArray(j) ? j.map((f) => ({ name: f.name, path: f.path, type: f.type, size: f.size })) : [];
}

export async function writeFile(path, content, sha, message) {
  if (LOCAL) {
    let cur = null; try { cur = fs.readFileSync(lp(path), 'utf8'); } catch {}
    if (cur !== null && sha && sha1(cur) !== sha) return { conflict: true };
    fs.mkdirSync(nodePath.dirname(lp(path)), { recursive: true }); fs.writeFileSync(lp(path), content);
    return { sha: sha1(content) };
  }
  const r = await gh(`contents/${enc(path)}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `ceo-os: ${message || 'actualiza ' + path}`,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch: cfg().branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (r.status === 409 || r.status === 422) return { conflict: true };
  if (!r.ok) throw await ghError(r, 'escribiendo ' + path);
  return { sha: (await r.json()).content.sha };
}

// Todos los archivos bajo una carpeta (recursivo). Desde la copia del build o, en local, del disco.
export function listFiles(prefix) {
  if (LOCAL) {
    const out = [];
    const walk = (p) => { let ents = []; try { ents = fs.readdirSync(lp(p), { withFileTypes: true }); } catch {} for (const e of ents) { const q = p + '/' + e.name; e.isDirectory() ? walk(q) : out.push(q); } };
    walk(prefix); return out;
  }
  return snap() ? Object.keys(SNAP.files).filter((k) => k.startsWith(prefix + '/')) : [];
}

// Cuándo se tocó por última vez un archivo (AAAA-MM-DD): el último commit. En local, de git; en Vercel, de la copia del build
// (scripts/snapshot.mjs la guarda si git estaba disponible). Con la API de GitHub no se consulta (sería un llamado por archivo): null.
const DATES = new Map();
export function fileDate(path) {
  if (!LOCAL) return useSnap() ? SNAP.dates?.[path] || null : null;
  if (DATES.has(path)) return DATES.get(path);
  let d = null;
  try { d = execFileSync('git', ['log', '-1', '--format=%cI', '--', path], { cwd: LOCAL, encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'ignore'] }).trim().slice(0, 10) || null; } catch {}
  DATES.set(path, d); return d;
}

// Escribir un archivo que alguien vio en el OS: «base» es la huella (sha1) de lo que vio. Si el archivo cambió desde entonces,
// no se pisa (conflict). Se compara contra lo que hay hoy en GitHub, no contra la copia del build.
export async function escribirSeguro(path, content, base, message) {
  if (LOCAL) { let cur = null; try { cur = fs.readFileSync(lp(path), 'utf8'); } catch {} if ((cur === null) !== !base || (cur !== null && sha1(cur) !== base)) return { conflict: true }; return writeFile(path, content, null, message); }
  const r = await gh(`contents/${enc(path)}?ref=${encodeURIComponent(cfg().branch)}`);
  let actual = null;
  if (r.ok) { const j = await r.json(); if (Array.isArray(j) || j.type !== 'file') return { conflict: true }; actual = { sha: j.sha, content: Buffer.from(j.content || '', 'base64').toString('utf8') }; }
  else if (r.status !== 404) throw await ghError(r, 'leyendo ' + path);
  if ((actual === null) !== !base || (actual && sha1(actual.content) !== base)) return { conflict: true };
  const w = await writeFile(path, content, actual?.sha, message);
  if (!w.conflict) RECIENTES.set(path, content);
  return w;
}
export const huella = (c) => sha1(String(c));
