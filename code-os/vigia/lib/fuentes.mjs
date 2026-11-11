// Traer lo nuevo de cada tipo de fuente. Todo es gratis: RSS, HN (Algolia), GitHub vía `gh`, registro MCP.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { leerFeed } from './rss.mjs';

const exec = promisify(execFile);
export const UA = 'inherent-vigia/0.1 (radar semanal; RSS)';

async function http(url, { json = false, timeout = 20000, fetchFn = fetch } = {}) {
  const r = await fetchFn(url, { headers: { 'user-agent': UA, accept: json ? 'application/json' : '*/*' }, signal: AbortSignal.timeout(timeout) });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
  return json ? r.json() : r.text();
}

/** gh api con argumentos; devuelve JSON. Inyectable para pruebas. */
export async function ghApi(args) {
  const { stdout } = await exec('gh', ['api', ...args], { maxBuffer: 20 * 1024 * 1024 });
  return JSON.parse(stdout);
}

const dia = (d) => new Date(d).toISOString().slice(0, 10);

export async function traerRss(f, { desde, fetchFn } = {}) {
  const xml = await http(f.url, { fetchFn });
  return leerFeed(xml)
    .filter((x) => !x.fecha || !desde || x.fecha >= desde)
    .slice(0, f.max ?? 40)
    .map((x) => ({ ...x, fuente: f.id, tipo: 'articulo' }));
}

export async function traerHn(f, { desde, fetchFn } = {}) {
  const seg = Math.floor(new Date(desde).getTime() / 1000);
  const out = [];
  for (const q of f.consultas) {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story`
      + `&numericFilters=${encodeURIComponent(`points>=${f.puntos_min ?? 50},created_at_i>${seg}`)}&hitsPerPage=${f.max ?? 20}`;
    const j = await http(url, { json: true, fetchFn });
    for (const h of j.hits ?? []) {
      out.push({
        titulo: h.title, url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        fecha: h.created_at, resumen: `${h.points} puntos · ${h.num_comments ?? 0} comentarios en HN`,
        fuente: f.id, tipo: 'articulo', hn: `https://news.ycombinator.com/item?id=${h.objectID}`,
      });
    }
  }
  return out;
}

export function repoDesdeApi(r) {
  return {
    titulo: r.full_name, url: r.html_url, fecha: r.created_at, resumen: (r.description ?? '').slice(0, 300),
    tipo: 'repo',
    repo: { nombre: r.full_name, estrellas: r.stargazers_count, licencia: r.license?.spdx_id ?? 'SIN LICENCIA',
      ultimo_commit: r.pushed_at, creado: r.created_at, archivado: !!r.archived, temas: r.topics ?? [] },
  };
}

/** Búsqueda de repos: `{{desde}}` en la consulta se reemplaza por la fecha de la última corrida. */
export async function traerGithubBusqueda(f, { desde, gh = ghApi } = {}) {
  const out = [];
  for (const q0 of f.consultas) {
    const q = q0.replaceAll('{{desde}}', dia(desde));
    const j = await gh(['-X', 'GET', 'search/repositories', '-f', `q=${q}`, '-f', 'sort=stars', '-f', 'order=desc', '-f', `per_page=${f.max ?? 15}`]);
    for (const r of j.items ?? []) {
      if (r.stargazers_count < (f.estrellas_min ?? 0)) continue;
      out.push({ ...repoDesdeApi(r), fuente: f.id });
    }
  }
  return out;
}

/** Repos vigilados: avisa de releases nuevas desde la última corrida. */
export async function traerGithubReleases(f, { desde, gh = ghApi } = {}) {
  const out = [];
  for (const nombre of f.repos) {
    let rels = [];
    try { rels = await gh([`repos/${nombre}/releases?per_page=5`]); } catch { continue; }
    for (const rel of rels) {
      const fecha = rel.published_at ?? rel.created_at;
      if (rel.draft || (desde && fecha < desde)) continue;
      out.push({ titulo: `${nombre} ${rel.tag_name}${rel.name && rel.name !== rel.tag_name ? ` — ${rel.name}` : ''}`,
        url: rel.html_url, fecha, resumen: (rel.body ?? '').replace(/\s+/g, ' ').slice(0, 300), fuente: f.id, tipo: 'release',
        repo_ref: nombre });
    }
  }
  return out;
}

/** Registro oficial de MCP: servidores publicados o actualizados desde la última corrida. */
export async function traerMcpRegistro(f, { desde, fetchFn } = {}) {
  const out = [];
  let cursor = '';
  for (let pag = 0; pag < (f.paginas ?? 5); pag++) {
    const url = `${f.url}?limit=100&updated_since=${encodeURIComponent(new Date(desde).toISOString())}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    const j = await http(url, { json: true, fetchFn });
    for (const { server: s, _meta: m } of j.servers ?? []) {
      const meta = m?.['io.modelcontextprotocol.registry/official'] ?? {};
      if (meta.isLatest === false) continue;
      const repo = s.repository?.url;
      out.push({ titulo: s.title ? `${s.title} (${s.name})` : s.name, url: repo || s.websiteUrl || `${f.url}/${encodeURIComponent(s.name)}`,
        fecha: meta.updatedAt ?? meta.publishedAt ?? null, resumen: (s.description ?? '').slice(0, 300), fuente: f.id, tipo: 'mcp',
        remoto: (s.remotes ?? []).length > 0 });
    }
    cursor = j.metadata?.nextCursor;
    if (!cursor) break;
  }
  return out;
}

export const TIPOS = { rss: traerRss, hn: traerHn, github_busqueda: traerGithubBusqueda, github_releases: traerGithubReleases, mcp_registro: traerMcpRegistro };

/** Datos de repo (estrellas, licencia, último commit) para enlaces a github.com. Con caché. */
export async function enriquecerRepos(items, { gh = ghApi, max = 60 } = {}) {
  const cache = new Map();
  let llamadas = 0;
  for (const it of items) {
    if (it.repo) continue;
    const nombre = it.repo_ref ?? repoDeUrl(it.url);
    if (!nombre) continue;
    if (!cache.has(nombre)) {
      if (llamadas >= max) continue;
      llamadas++;
      try { cache.set(nombre, repoDesdeApi(await gh([`repos/${nombre}`])).repo); } catch { cache.set(nombre, null); }
    }
    if (cache.get(nombre)) it.repo = cache.get(nombre);
  }
  return items;
}

export function repoDeUrl(url = '') {
  const m = url.match(/^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/i);
  if (!m || ['orgs', 'topics', 'sponsors', 'features', 'marketplace', 'collections', 'trending'].includes(m[1].toLowerCase())) return null;
  return `${m[1]}/${m[2]}`;
}
