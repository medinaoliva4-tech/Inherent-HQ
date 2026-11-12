// Fase 4 · Investigación: lo puro (sin DOM ni red) que comparten la app y el servidor.
//   categorías → los 5 niveles de mc-radar (agents/03-marketing-creative/brain/skills/mc-radar)
//   cuenta     → un @ o un link de perfil de IG, TikTok, YouTube o LinkedIn → { red, handle, url }
//   clavePost  → la misma publicación vista con dos links distintos es la misma (sin duplicados)
//   resonancia → el rendimiento de un post contra el PROMEDIO DE SU PROPIA CUENTA (el «multiplicador»)

// [clave, nombre corto, qué es]. «propia» son las cuentas de la marca (cfg.own); las otras cuatro, cfg.accounts.
export const CATS = [
  ['competencia', 'Competencia', 'Le venden a la misma gente, en su mercado'],
  ['referente-similar', 'Mercado parecido', 'Ya ganan en la categoría, en mercados como el suyo'],
  ['referente-aspiracional', 'Aspiracional', 'Lo mejor de la categoría, a donde quiere llegar'],
  ['referente-crecimiento', 'Crecimiento', 'Crecen o enganchan más rápido que su categoría'],
  ['propia', 'Lo propio', 'Las cuentas de la marca'],
];
export const CAT_KEYS = CATS.map(([k]) => k);
export const catNombre = (k) => CATS.find(([x]) => x === k)?.[1] || '';
// El nombre viejo «referente» (antes de los 5 niveles) se lee como aspiracional.
export const catDe = (kind) => (kind === 'referente' ? 'referente-aspiracional' : CAT_KEYS.includes(kind) ? kind : 'competencia');
// mc-radar: 5 cuentas por nivel, 25 por cliente.
export const POR_CAT = 5;
// mc-radar: un orgánico es ganador si rinde 2x o más el promedio de su cuenta.
export const GANADOR = 2;

export const REDES = [['instagram', 'Instagram', 'IG'], ['tiktok', 'TikTok', 'TikTok'], ['youtube', 'YouTube', 'YouTube'], ['linkedin', 'LinkedIn', 'LinkedIn']];
export const RED_KEYS = REDES.map(([k]) => k);
export const redNombre = (k) => REDES.find(([x]) => x === k)?.[1] || k || '';

// ---------- una cuenta: el @ o el link del perfil ----------
const NO = new Set(['https', 'http', 'www', 'p', 'reel', 'reels', 'explore', 'stories', 'tv', 'video', 'instagram', 'tiktok', 'youtube', 'linkedin', 'watch', 'shorts', 'feed', 'posts']);
const POST = /instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv|stories)\/|tiktok\.com\/@[^/]+\/(video|photo)\/|youtube\.com\/(watch|shorts\/)|youtu\.be\/|linkedin\.com\/(posts|feed\/update|pulse)\//i;
export function urlDe(a) {
  if (!a?.handle) return '';
  if (/^https:\/\//.test(String(a.url || '')) && (a.red === 'youtube' || a.red === 'linkedin')) return a.url;
  if (a.red === 'tiktok') return `https://www.tiktok.com/@${a.handle}`;
  if (a.red === 'youtube') return /^UC[\w-]{20,24}$/.test(a.handle) ? `https://www.youtube.com/channel/${a.handle}` : `https://www.youtube.com/@${a.handle}`;
  if (a.red === 'linkedin') return `https://www.linkedin.com/company/${a.handle}/`;
  return `https://www.instagram.com/${a.handle}/`;
}
// Devuelve { ok:true, red, handle, url } o { ok:false, error } (en español, para mostrarlo tal cual).
// redHint: la red elegida en la app cuando se pega solo el @.
export function cuenta(input, redHint = 'instagram') {
  const s = String(input ?? '').trim().replace(/\s+/g, '');
  if (!s) return { ok: false, error: 'Pega el @ o el link del perfil' };
  if (POST.test(s)) return { ok: false, error: 'Ese link es de un post. Pega el link del perfil o el @' };
  const done = (red, handle, url) => {
    const h = String(handle || '').replace(/^@/, '').replace(/\.$/, '');
    if (!h || NO.has(h.toLowerCase())) return { ok: false, error: 'No entendí esa cuenta. Escribe @cuenta o pega el link del perfil' };
    const a = { red, handle: red === 'youtube' && /^UC[\w-]{20,24}$/.test(h) ? h : h.toLowerCase() };
    return { ok: true, ...a, url: url || urlDe(a) };
  };
  let m;
  if ((m = s.match(/instagram\.com\/([A-Za-z0-9._]{2,30})(?:[/?#]|$)/i))) return done('instagram', m[1]);
  if ((m = s.match(/tiktok\.com\/@([A-Za-z0-9._]{2,30})(?:[/?#]|$)/i))) return done('tiktok', m[1]);
  if ((m = s.match(/youtube\.com\/@([\w.-]{2,60})(?:[/?#]|$)/i))) return done('youtube', m[1]);
  if ((m = s.match(/youtube\.com\/channel\/(UC[\w-]{20,24})(?:[/?#]|$)/))) return done('youtube', m[1]);
  if ((m = s.match(/youtube\.com\/(c|user)\/([\w.-]{2,60})(?:[/?#]|$)/i))) return done('youtube', m[2], `https://www.youtube.com/${m[1].toLowerCase()}/${m[2]}`);
  if ((m = s.match(/linkedin\.com\/(company|in|school|showcase)\/([\w%.-]{2,100})(?:[/?#]|$)/i))) return done('linkedin', decodeURIComponent(m[2]), `https://www.linkedin.com/${m[1].toLowerCase()}/${decodeURIComponent(m[2]).toLowerCase()}/`);
  if (/^https?:\/\//i.test(s) || /\.(com|net|org)\b/i.test(s)) return { ok: false, error: 'Ese link no es un perfil de Instagram, TikTok, YouTube o LinkedIn' };
  const red = RED_KEYS.includes(redHint) ? redHint : 'instagram';
  if ((m = s.match(red === 'linkedin' || red === 'youtube' ? /^@?([\w.-]{2,60})$/ : /^@?([A-Za-z0-9._]{2,30})$/))) return done(red, m[1]);
  return { ok: false, error: 'No entendí esa cuenta. Escribe @cuenta o pega el link del perfil' };
}
export const claveCuenta = (a) => `${a.red}:${String(a.handle || '').toLowerCase()}`;

// ---------- una publicación ----------
// La misma pieza con dos links (IG /p/ y /reel/, un TikTok con ?query) → la misma clave.
export function clavePost(url) {
  const u = String(url || '');
  let m;
  if ((m = u.match(/instagram\.com\/(?:[\w.]+\/)?(?:p|reel|reels|tv)\/([\w-]{5,})/i))) return 'ig:' + m[1];
  if ((m = u.match(/tiktok\.com\/@[^/]+\/(?:video|photo)\/(\d{6,})/i))) return 'tt:' + m[1];
  if ((m = u.match(/(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/i))) return 'yt:' + m[1];
  if ((m = u.match(/linkedin\.com\/.*?(?:activity|ugcPost|share)[:-](\d{10,})/i))) return 'li:' + m[1];
  return 'url:' + u.replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();
}
// La URL con la que se calcula el id del post (la misma regla que guardar_research): sin query, sin «/» final, en minúsculas.
export const urlLimpia = (u) => String(u || '').replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();

// ---------- la resonancia (mc-radar: «2x o más las vistas o interacciones del promedio de esa cuenta») ----------
const num = (v) => (Number.isFinite(+v) && +v > 0 ? +v : 0);
// Con vistas se compara contra las vistas; sin vistas (un carrusel, un post de LinkedIn), contra las interacciones.
export const metricaDe = (x) => (num(x?.views) ? ['v', num(x.views)] : ['i', num(x?.likes) + num(x?.comments) + num(x?.shares)]);
// base: las publicaciones de esa cuenta (las guardadas + las nuevas). Devuelve { x, base } o null si no hay con qué comparar.
export function resonancia(post, base) {
  const [k, v] = metricaDe(post); if (!v) return null;
  const vals = (base || []).map(metricaDe).filter(([kk, vv]) => kk === k && vv > 0).map(([, vv]) => vv);
  if (!vals.length) return null;
  const avg = vals.reduce((a, z) => a + z, 0) / vals.length;
  return { x: Math.round((v / avg) * 10) / 10, base: vals.length };
}
