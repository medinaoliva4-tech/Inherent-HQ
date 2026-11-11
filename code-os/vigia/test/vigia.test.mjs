import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { leerFeed } from '../lib/rss.mjs';
import { normalizarUrl, deduplicar, clasificar, coincidencias, evaluarRepo, recomendar, candidatos } from '../lib/clasificar.mjs';
import { repoDeUrl, traerGithubBusqueda, traerHn, traerMcpRegistro } from '../lib/fuentes.mjs';
import { configIa, clasificarConIa, leerRespuesta } from '../lib/ia.mjs';
import { extraerCurado } from '../lib/informe.mjs';
import { correr, leerArgs } from '../vigia.mjs';

const AHORA = Date.parse('2026-11-10T12:00:00Z');
const TEMAS = {
  departamentos: {
    ads: { nombre: 'Ads', porque: 'Operar campañas', palabras: ['meta ads', 'ads', 'google ads'] },
    produccion: { nombre: 'Production', porque: 'Primer corte', palabras: ['video editor', 'ffmpeg'] },
    sistema: { nombre: 'Sistema', porque: 'Base', palabras: ['mcp', 'agent'] },
  },
  ruido: ['crypto'],
};
const repo = (o = {}) => ({ nombre: 'a/b', estrellas: 1200, licencia: 'MIT', ultimo_commit: '2026-11-08T00:00:00Z', archivado: false, temas: [], ...o });

const RSS = `<?xml version="1.0"?><rss><channel><title>Blog</title>
<item><title><![CDATA[Meta Ads &amp; MCP]]></title><link>https://x.com/a?utm_source=rss</link><pubDate>Mon, 09 Nov 2026 10:00:00 GMT</pubDate><description>&lt;p&gt;Nuevo &lt;b&gt;servidor&lt;/b&gt;&lt;/p&gt;</description></item>
<item><title>Viejo</title><link>https://x.com/viejo</link><pubDate>Mon, 01 Jun 2026 10:00:00 GMT</pubDate></item>
</channel></rss>`;
const ATOM = `<feed xmlns="http://www.w3.org/2005/Atom"><title>T</title>
<entry><title>v2.1</title><link rel="alternate" href="https://github.com/o/r/releases/tag/v2.1"/><updated>2026-11-10T02:00:00Z</updated><summary>notas</summary></entry></feed>`;

test('lee RSS 2.0 con CDATA, entidades y HTML', () => {
  const [a] = leerFeed(RSS);
  assert.equal(a.titulo, 'Meta Ads & MCP');
  assert.equal(a.resumen, 'Nuevo servidor');
  assert.equal(a.fecha, '2026-11-09T10:00:00.000Z');
});
test('lee Atom con link href', () => {
  const [a] = leerFeed(ATOM);
  assert.equal(a.url, 'https://github.com/o/r/releases/tag/v2.1');
  assert.equal(a.fecha, '2026-11-10T02:00:00.000Z');
});

test('normaliza URL: quita utm, www, slash final y mayúsculas de GitHub', () => {
  assert.equal(normalizarUrl('https://www.Example.com/a/?utm_source=x&id=2#h'), 'https://example.com/a?id=2');
  assert.equal(normalizarUrl('https://github.com/Foo/Bar.git'), 'https://github.com/foo/bar');
});
test('deduplica por URL, por título y contra lo ya visto', () => {
  const r = deduplicar([
    { titulo: 'Un servidor MCP nuevo', url: 'https://a.com/1?utm_medium=x' },
    { titulo: 'Otro', url: 'https://a.com/1' },
    { titulo: 'Un servidor MCP nuevo!', url: 'https://b.com/2' },
    { titulo: 'Visto', url: 'https://c.com/3' },
  ], { 'https://c.com/3': '2026-11-01' });
  assert.deepEqual(r.map((x) => x.id), ['https://a.com/1']);
});

test('coincidencias: palabra completa, sin acentos ni mayúsculas', () => {
  assert.deepEqual(coincidencias('Nuevo editor: FFmpeg + Vídeo Editor', ['ffmpeg', 'video editor']), ['ffmpeg', 'video editor']);
  assert.deepEqual(coincidencias('uploads and downloads', ['ads']), []);
});
test('clasifica: el departamento de negocio gana a sistema; el ruido resta', () => {
  const it = clasificar({ titulo: 'Meta Ads MCP server', resumen: 'agent' }, TEMAS, 1);
  assert.equal(it.departamentos[0].id, 'ads');
  assert.ok(it.departamentos.some((d) => d.id === 'sistema'));
  const r = clasificar({ titulo: 'crypto ads bot' }, TEMAS, 1);
  assert.equal(r.ruido, true);
  assert.equal(recomendar(r, AHORA), 'ignorar');
});

test('evalúa riesgo de repo: permisivo y activo = bajo; AGPL viejo = alto', () => {
  assert.equal(evaluarRepo(repo(), AHORA).riesgo, 'bajo');
  const e = evaluarRepo(repo({ licencia: 'AGPL-3.0', ultimo_commit: '2026-01-01T00:00:00Z', estrellas: 20 }), AHORA);
  assert.equal(e.riesgo, 'alto');
  assert.ok(e.razones.length >= 3);
  assert.match(evaluarRepo(repo({ licencia: 'NOASSERTION' }), AHORA).coste, /confirmar/);
});
test('candidatos: solo repos populares, relevantes y de bajo riesgo', () => {
  const a = clasificar({ titulo: 'Google Ads MCP', resumen: 'meta ads y google ads para agent', url: 'u1', repo: repo() }, TEMAS, 1);
  const b = clasificar({ titulo: 'Google Ads MCP chico', resumen: 'ads', url: 'u2', repo: repo({ estrellas: 40 }) }, TEMAS, 1);
  const c = clasificar({ titulo: 'Sin repo ads', url: 'u3' }, TEMAS, 1);
  const r = candidatos([a, b, c], { ahora: AHORA });
  assert.deepEqual(r.map((x) => x.url), ['u1']);
  assert.equal(r[0].evaluacion.riesgo, 'bajo');
});

test('registro MCP sin comunidad se ignora; releases se agrupan por repo y no son candidatos', async () => {
  const mcp = clasificar({ titulo: 'X ads', tipo: 'mcp', url: 'm', repo: repo({ estrellas: 0 }) }, TEMAS, 1);
  assert.equal(recomendar(mcp, AHORA), 'ignorar');
  const { renderInforme } = await import('../lib/informe.mjs');
  const rel = (v, f) => clasificar({ titulo: `o/ffmpeg ${v}`, tipo: 'release', repo_ref: 'o/ffmpeg', url: `https://github.com/o/ffmpeg/releases/tag/${v}`, fecha: f, repo: repo() }, TEMAS, 2);
  const md = renderInforme({ fecha: '2026-11-10', desde: '2026-11-03', items: [rel('v1', '2026-11-04'), rel('v2', '2026-11-08'), mcp], temas: TEMAS, fuentes: [], ahora: AHORA });
  assert.match(md, /## Novedades de herramientas vigiladas\n\n- \*\*\[o\/ffmpeg v2\][^\n]*2 versiones/);
  assert.doesNotMatch(md, /o\/ffmpeg v1/);
  assert.match(md, /Nada nuevo pasa el filtro/);
  assert.doesNotMatch(md, /X ads/);
});

test('repoDeUrl reconoce repos y descarta rutas de GitHub que no lo son', () => {
  assert.equal(repoDeUrl('https://github.com/storytold/filmcraft/releases/tag/v1'), 'storytold/filmcraft');
  assert.equal(repoDeUrl('https://github.com/topics/mcp'), null);
  assert.equal(repoDeUrl('https://example.com/a/b'), null);
});

test('búsqueda en GitHub reemplaza {{desde}} y filtra por estrellas', async () => {
  let q;
  const gh = async (args) => { q = args.find((a) => a.startsWith('q=')); return { items: [
    { full_name: 'x/uno', html_url: 'https://github.com/x/uno', stargazers_count: 500, license: { spdx_id: 'MIT' }, pushed_at: '2026-11-09T00:00:00Z', created_at: '2026-11-05T00:00:00Z', description: 'video editor' },
    { full_name: 'x/dos', html_url: 'https://github.com/x/dos', stargazers_count: 5, license: null, pushed_at: '2026-11-09T00:00:00Z', created_at: '2026-11-05T00:00:00Z' },
  ] }; };
  const r = await traerGithubBusqueda({ id: 'g', consultas: ['topic:mcp created:>{{desde}}'], estrellas_min: 100 }, { desde: '2026-11-03T00:00:00Z', gh });
  assert.equal(q, 'q=topic:mcp created:>2026-11-03');
  assert.equal(r.length, 1);
  assert.equal(r[0].repo.licencia, 'MIT');
});

const respuesta = (cuerpo) => ({ ok: true, status: 200, json: async () => cuerpo, text: async () => (typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo)) });

test('HN arma filtros de puntos y fecha', async () => {
  let url;
  const fetchFn = async (u) => { url = u; return respuesta({ hits: [{ title: 'MCP x', url: 'https://a.com', objectID: '1', points: 120, created_at: '2026-11-09T00:00:00Z' }] }); };
  const r = await traerHn({ id: 'hn', consultas: ['MCP'], puntos_min: 80 }, { desde: '2026-11-03T00:00:00Z', fetchFn });
  assert.match(decodeURIComponent(url), new RegExp(`points>=80,created_at_i>${Date.parse('2026-11-03T00:00:00Z') / 1000}`));
  assert.equal(r[0].hn, 'https://news.ycombinator.com/item?id=1');
});
test('registro MCP: pagina con cursor y salta versiones viejas', async () => {
  const paginas = [
    { servers: [{ server: { name: 'io.a/x', title: 'X', description: 'meta ads', repository: { url: 'https://github.com/a/x' } }, _meta: { 'io.modelcontextprotocol.registry/official': { isLatest: true, updatedAt: '2026-11-09T00:00:00Z' } } },
      { server: { name: 'io.a/y' }, _meta: { 'io.modelcontextprotocol.registry/official': { isLatest: false } } }], metadata: { nextCursor: 'c1' } },
    { servers: [{ server: { name: 'io.b/z', websiteUrl: 'https://z.dev', remotes: [{ type: 'streamable-http' }] }, _meta: {} }], metadata: {} },
  ];
  const urls = [];
  const fetchFn = async (u) => { urls.push(u); return respuesta(paginas[urls.length - 1]); };
  const r = await traerMcpRegistro({ id: 'reg', url: 'https://r.io/v0.1/servers' }, { desde: '2026-11-03T00:00:00Z', fetchFn });
  assert.equal(r.length, 2);
  assert.equal(r[1].remoto, true);
  assert.match(urls[1], /cursor=c1/);
});

test('IA: sin URL o con --sin-ia no se usa; con respuesta mueve departamento y marca ruido', async () => {
  assert.equal(configIa({}, {}), null);
  assert.equal(configIa({ VIGIA_LLM_URL: 'http://x', VIGIA_LLM_KEY: 'k' }, { sinIa: true }), null);
  const cfg = configIa({ VIGIA_LLM_URL: 'http://x/', VIGIA_LLM_KEY: 'k' }, { nivel: 'nivel-bajo' });
  assert.equal(cfg.url, 'http://x');
  const items = [clasificar({ id: '1', titulo: 'agent para ffmpeg' }, TEMAS, 1), clasificar({ id: '2', titulo: 'agent raro' }, TEMAS, 1)];
  let cuerpo;
  const fetchFn = async (_u, o) => { cuerpo = JSON.parse(o.body); return respuesta({ choices: [{ message: { content: 'ok {"items":[{"i":0,"dep":"ads","rel":3,"porque":"Corta videos de anuncios"},{"i":1,"dep":null,"rel":0,"porque":""}]}' } }] }); };
  const r = await clasificarConIa(items, TEMAS, cfg, fetchFn);
  assert.equal(cuerpo.model, 'nivel-bajo');
  assert.equal(r.items[0].departamentos[0].id, 'ads');
  assert.equal(r.items[0].ia.porque, 'Corta videos de anuncios');
  assert.equal(r.items[1].ruido, true);
});
test('IA: si falla, devuelve los ítems intactos y anota el error', async () => {
  const cfg = configIa({ VIGIA_LLM_URL: 'http://x', VIGIA_LLM_KEY: 'k' });
  const items = [clasificar({ id: '1', titulo: 'ads' }, TEMAS, 1)];
  const r = await clasificarConIa(items, TEMAS, cfg, async () => ({ ok: false, status: 502 }));
  assert.equal(r.items[0].departamentos[0].id, 'ads');
  assert.equal(r.errores.length, 1);
  assert.deepEqual(leerRespuesta('sin json'), []);
});

test('args: opciones conocidas y error en desconocidas', () => {
  assert.deepEqual(leerArgs(['--sin-ia', '--nivel', 'nivel-medio', '--max-llamadas', '3']), { sinIa: true, seco: false, nivel: 'nivel-medio', maxLlamadas: '3' });
  assert.throws(() => leerArgs(['--x']));
});

test('corrida completa sin IA: informe, estado, bloque curado y sin repetir en la siguiente', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'vigia-'));
  await writeFile(join(dir, 'temas.json'), JSON.stringify(TEMAS));
  await writeFile(join(dir, 'fuentes.json'), JSON.stringify({ fuentes: [
    { id: 'blog', tipo: 'rss', url: 'https://blog/rss' },
    { id: 'gh', tipo: 'github_busqueda', consultas: ['q'] },
    { id: 'roto', tipo: 'rss', url: 'https://roto/rss' },
  ] }));
  await mkdir(join(dir, 'informes'));
  await writeFile(join(dir, 'informes', '2026-11-10.md'), 'viejo\n<!-- curado:inicio -->\nNOTA DEL CEO\n<!-- curado:fin -->\n');
  const fetchFn = async (u) => (u.includes('roto') ? { ok: false, status: 500 } : respuesta(RSS));
  const gh = async (args) => (args[0] === '-X' ? { items: [{ full_name: 'x/editor', html_url: 'https://github.com/x/editor', stargazers_count: 3000, license: { spdx_id: 'Apache-2.0' }, pushed_at: '2026-11-09T00:00:00Z', created_at: '2026-11-04T00:00:00Z', description: 'Open source video editor with ffmpeg and MCP agent' }] } : Promise.reject(new Error('no')));
  const deps = { fetchFn, gh, ahora: AHORA, env: {} };
  const r = await correr({ dir, fecha: '2026-11-10' }, deps);
  const md = await readFile(join(dir, 'informes', '2026-11-10.md'), 'utf8');
  assert.match(md, /NOTA DEL CEO/);
  assert.match(md, /## Candidatos a probar[\s\S]*x\/editor/);
  assert.match(md, /### Ads[\s\S]*Meta Ads & MCP/);
  assert.match(md, /★ 3\.0k · Apache-2\.0 · último commit 2026-11-09/);
  assert.match(md, /roto: HTTP 500/);
  assert.doesNotMatch(md, /Viejo/);
  assert.equal(r.items.length, 2);
  const estado = JSON.parse(await readFile(join(dir, 'estado', 'estado.json'), 'utf8'));
  assert.equal(estado.ultima_corrida, new Date(AHORA).toISOString());
  const r2 = await correr({ dir, fecha: '2026-11-11', desde: '2026-11-01' }, deps);
  assert.equal(r2.items.length, 0);
});
