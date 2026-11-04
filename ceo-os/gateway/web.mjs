// Investigación web del Gateway (PLAN-GATEWAY F3). Determinista: el código busca y lee; el modelo solo escribe las búsquedas
// y, después, la etapa con lo que se leyó. Nada de bucles de herramientas.
//   · buscar(q)          → SearXNG propio del VPS (127.0.0.1:8888, solo dentro del servidor)
//   · leer(url)          → la página como texto plano, sin scripts ni menús. NUNCA entra a direcciones internas (SSRF):
//                          solo http(s), sin IPs privadas, de loopback ni link-local, y revisa cada redirección.
//   · investigar(...)    → búsquedas → mejores resultados → páginas leídas → fuentes { id: 'w1', titulo, url, texto }
// Lo que dice una página es dato, no instrucción: entra como fuente citable y el modelo no tiene herramientas que ejecutar.
import dns from 'node:dns/promises';
import net from 'node:net';

const SEARX = process.env.GW_SEARXNG || 'http://127.0.0.1:8888';
const UA = 'Mozilla/5.0 (compatible; InherentGateway/1.0; +https://inherentglobal.com)';
const MAX_BYTES = 1_500_000;
// Redes sociales y buscadores: casi siempre piden login o no dan texto útil.
const SALTAR = /(^|\.)(facebook|instagram|tiktok|x|twitter|linkedin|pinterest|google|youtube)\.com$/i;

function privada(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const x = ip.toLowerCase();
  return x === '::1' || x === '::' || x.startsWith('fc') || x.startsWith('fd') || x.startsWith('fe80') || x.startsWith('::ffff:127.') || x.startsWith('::ffff:10.') || x.startsWith('::ffff:192.168.');
}
async function urlSegura(u) {
  let x; try { x = new URL(u); } catch { return null; }
  if (!['http:', 'https:'].includes(x.protocol) || x.username || x.password) return null;
  if (x.port && !['80', '443'].includes(x.port)) return null;
  const host = x.hostname.replace(/^\[|\]$/g, '');
  const ips = net.isIP(host) ? [host] : (await dns.lookup(host, { all: true }).catch(() => [])).map((r) => r.address);
  if (!ips.length || ips.some(privada)) return null;
  return x;
}

export async function buscar(q, n = 6) {
  const r = await fetch(`${SEARX}/search?${new URLSearchParams({ q, format: 'json', language: 'es' })}`, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`El buscador respondió ${r.status}`);
  const j = await r.json();
  return (j.results || []).filter((x) => x.url && /^https?:/.test(x.url)).slice(0, n).map((x) => ({ titulo: String(x.title || x.url).slice(0, 200), url: x.url, resumen: String(x.content || '').slice(0, 400) }));
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const entidades = (s) => s.replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENT[e.toLowerCase()] ?? ' '));
export function aTexto(html) {
  const titulo = entidades((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || '').replace(/\s+/g, ' ').trim());
  const t = entidades(html
    .replace(/<(script|style|noscript|svg|nav|header|footer|form|iframe|template)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|br)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t\r\f\v]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim());
  return { titulo, texto: t };
}

export async function leer(url, maxChars = 6000) {
  let actual = url;
  for (let salto = 0; salto < 4; salto++) {
    const x = await urlSegura(actual); if (!x) throw new Error('Dirección no permitida');
    if (SALTAR.test(x.hostname)) throw new Error('Sitio que pide login');
    const r = await fetch(x, { redirect: 'manual', headers: { 'User-Agent': UA, Accept: 'text/html,text/plain;q=0.9' }, signal: AbortSignal.timeout(12000) });
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { actual = new URL(r.headers.get('location'), x).toString(); continue; }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const tipo = r.headers.get('content-type') || '';
    if (!/text\/html|text\/plain|application\/xhtml/i.test(tipo)) throw new Error(`No es una página (${tipo.split(';')[0]})`);
    const buf = []; let n = 0;
    for await (const c of r.body) { n += c.length; if (n > MAX_BYTES) break; buf.push(c); }
    const { titulo, texto } = aTexto(Buffer.concat(buf).toString('utf8'));
    return { url: x.toString(), titulo, texto: texto.slice(0, maxChars) };
  }
  throw new Error('Demasiadas redirecciones');
}

// pedirBusquedas(): el modelo que escribe las búsquedas (inyectado para no atar este módulo al motor).
export async function investigar({ tema, pedirBusquedas, maxFuentes = 6, onPaso = () => {} }) {
  let qs = [];
  try { qs = (await pedirBusquedas(tema)).filter(Boolean).slice(0, 3); } catch {}
  if (!qs.length) qs = [tema.slice(0, 120)];
  await onPaso({ titulo: 'Buscando en la web', detalle: qs.join(' · ') });
  const vistos = new Set(), candidatos = [];
  for (const q of qs) {
    let rs = []; try { rs = await buscar(q, 8); } catch (e) { await onPaso({ titulo: 'El buscador no respondió', detalle: `${q}: ${e.message}`, aviso: true }); }
    for (const x of rs) { const k = x.url.replace(/[#?].*$/, ''); if (!vistos.has(k)) { vistos.add(k); candidatos.push(x); } }
  }
  const fuentes = [];
  for (const c of candidatos) {
    if (fuentes.length >= maxFuentes) break;
    try {
      const p = await leer(c.url);
      if (p.texto.length < 300) continue; // página vacía o solo menús
      fuentes.push({ id: `w${fuentes.length + 1}`, titulo: (p.titulo || c.titulo).slice(0, 200), url: p.url, texto: p.texto });
      await onPaso({ titulo: 'Leyendo fuentes', detalle: `${fuentes.length} de ${maxFuentes}: ${(p.titulo || c.titulo).slice(0, 80)}` });
    } catch { /* la página que no se deja leer no tumba la etapa */ }
  }
  return { busquedas: qs, fuentes };
}
