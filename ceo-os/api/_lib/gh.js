// El repo es la base de datos: leer = GitHub contents API, escribir = un commit.
// Modo local (solo desarrollo): con LOCAL_REPO=<ruta> lee/escribe el filesystem en vez de GitHub.
import fs from 'node:fs';
import nodePath from 'node:path';
import crypto from 'node:crypto';
const LOCAL = process.env.LOCAL_REPO;
// En Vercel se lee la copia que hace el build (scripts/snapshot.mjs).
let SNAP;
function snap() {
  if (SNAP !== undefined) return SNAP;
  try { SNAP = JSON.parse(fs.readFileSync(new URL('../_data/repo.json', import.meta.url), 'utf8')); } catch { SNAP = null; }
  return SNAP;
}
const useSnap = () => !LOCAL && snap();
export const repoSource = () => (LOCAL ? 'local' : snap() ? 'build' : process.env.GITHUB_TOKEN ? 'github' : 'none');
const lp = (p) => nodePath.join(LOCAL, p);
const sha1 = (c) => crypto.createHash('sha1').update(c).digest('hex');
const cfg = () => ({
  repo: process.env.GITHUB_REPO || 'medinaoliva4-tech/Inherent-HQ',
  branch: process.env.GITHUB_BRANCH || 'main',
  token: process.env.GITHUB_TOKEN,
});
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');

async function gh(path, init = {}) {
  const { repo, token } = cfg();
  if (!token) throw new Error('GITHUB_TOKEN no está configurado');
  return fetch(`https://api.github.com/repos/${repo}/${path}`, {
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

export async function readFile(path) {
  if (LOCAL) { try { const c = fs.readFileSync(lp(path), 'utf8'); return { content: c, sha: sha1(c) }; } catch { return null; } }
  if (useSnap()) { const c = SNAP.files[path]; return c == null ? null : { content: c, sha: sha1(c) }; }
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
  if (!r.ok) throw new Error(`GitHub ${r.status} escribiendo ${path}`);
  return { sha: (await r.json()).content.sha };
}

export async function deleteFile(path, sha, message) {
  if (LOCAL) { try { fs.unlinkSync(lp(path)); } catch {} return { ok: true }; }
  const r = await gh(`contents/${enc(path)}`, {
    method: 'DELETE',
    body: JSON.stringify({ message: `ceo-os: ${message || 'borra ' + path}`, sha, branch: cfg().branch }),
  });
  if (r.status === 409 || r.status === 422) return { conflict: true };
  if (!r.ok) throw new Error(`GitHub ${r.status} borrando ${path}`);
  return { ok: true };
}
