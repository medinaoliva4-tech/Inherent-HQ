// Fuentes: de un referente {plataforma, usuario} a publicaciones con métricas PÚBLICAS.
// YouTube y TikTok: yt-dlp (Unlicense), sin login. Instagram: API oficial Graph «Business Discovery»
// (gratis, necesita una cuenta profesional propia y su token). Nunca se usan cookies, cuentas
// ajenas, proxies rotativos ni nada que esquive un bloqueo: si la plataforma frena, el radar para.
import { correr } from './util.mjs';

export const PLATAFORMAS = ['youtube', 'tiktok', 'instagram'];

// Señales de que la plataforma nos está frenando o pidiendo login: se para, no se insiste.
const BLOQUEO = /HTTP Error 429|Too Many Requests|rate.?limit|captcha|confirm you.?re not a bot|sign in to confirm|login required|log in to|requires authentication|use --cookies|blocked|HTTP Error 403/i;

export class ErrorFuente extends Error {
  constructor(codigo, mensaje) { super(mensaje); this.codigo = codigo; }
}

export function clasificarError(stderr = '') {
  if (BLOQUEO.test(stderr)) return 'BLOQUEO';
  if (/Unable to extract|Unsupported URL|does not exist|not found|404/i.test(stderr)) return 'NO_DISPONIBLE';
  return 'ERROR';
}

export function urlCuenta({ plataforma, usuario, seccion }) {
  const u = String(usuario ?? '').trim();
  if (/^https?:\/\//.test(u)) return u;
  const h = u.replace(/^@/, '');
  if (plataforma === 'youtube') return `https://www.youtube.com/@${h}/${seccion ?? 'shorts'}`;
  if (plataforma === 'tiktok') return `https://www.tiktok.com/@${h}`;
  if (plataforma === 'instagram') return `https://www.instagram.com/${h}/`;
  throw new ErrorFuente('NO_SOPORTADA', `plataforma no soportada: ${plataforma}`);
}

const n = (x) => (Number.isFinite(x) ? x : null);
const fechaDe = (e) => {
  if (Number.isFinite(e.timestamp)) return new Date(e.timestamp * 1000).toISOString();
  if (/^\d{8}$/.test(e.upload_date ?? '')) return `${e.upload_date.slice(0, 4)}-${e.upload_date.slice(4, 6)}-${e.upload_date.slice(6, 8)}T00:00:00.000Z`;
  return null;
};

/** Normaliza una entrada de yt-dlp (lista plana o detalle) al formato del radar. */
export function normalizarYtdlp(e, ref) {
  const id = String(e.id);
  return {
    clave: `${ref.plataforma}:${id}`,
    id,
    plataforma: ref.plataforma,
    cuenta: String(ref.usuario).replace(/^@/, ''),
    rol: ref.rol ?? null,
    url: e.webpage_url ?? e.url ?? null,
    titulo: e.title ?? e.description ?? '',
    fecha: fechaDe(e),
    vistas: n(e.view_count),
    likes: n(e.like_count),
    comentarios: n(e.comment_count),
    compartidos: n(e.repost_count),
    duracion_s: n(e.duration),
    seguidores: n(e.channel_follower_count),
  };
}

/** Mezcla el detalle sobre lo listado sin borrar datos que el detalle no trae. */
export function mezclar(base, extra) {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra)) if (v !== null && v !== undefined && v !== '') out[k] = v;
  return out;
}

export function crearFuentes(cfg, { cache, turno, ejecutar = correr, fetchImpl = fetch } = {}) {
  async function ytdlpJson(plataforma, args) {
    await turno(plataforma);
    try {
      const { stdout } = await ejecutar(cfg.bin.ytdlp, ['--no-update', '--no-warnings', '--ignore-config', ...args], { timeout: 120_000 });
      return JSON.parse(stdout);
    } catch (err) {
      const codigo = clasificarError(err.stderr ?? err.message);
      throw new ErrorFuente(codigo, (err.stderr || err.message || '').split('\n').filter(Boolean).slice(-1)[0]?.slice(0, 300) ?? 'error');
    }
  }

  async function listarYtdlp(ref, max) {
    const url = urlCuenta(ref);
    const { v } = await cache.memo(`lista:${url}:${max}`, cfg.ttlListaH, () => ytdlpJson(ref.plataforma, ['--flat-playlist', '-I', `1:${max}`, '-J', url]));
    return (v.entries ?? []).filter(Boolean).slice(0, max).map((e) => ({
      ...normalizarYtdlp(e, ref),
      seguidores: n(e.channel_follower_count) ?? n(v.channel_follower_count),
    }));
  }

  async function detalle(post) {
    if (post.plataforma === 'instagram') return { post, deCache: true };
    const { v, deCache } = await cache.memo(`detalle:${post.clave}`, cfg.ttlDetalleH, async () => {
      const e = await ytdlpJson(post.plataforma, ['-J', '--skip-download', post.url]);
      return normalizarYtdlp(e, { plataforma: post.plataforma, usuario: post.cuenta, rol: post.rol });
    });
    return { post: mezclar(post, { ...v, cuenta: post.cuenta, rol: post.rol }), deCache };
  }

  async function listarInstagram(ref, max) {
    const { token, userId, version } = cfg.instagram;
    if (!token || !userId) {
      throw new ErrorFuente('NO_DISPONIBLE', 'Instagram sin login no da datos útiles; configura IG_GRAPH_TOKEN e IG_USER_ID (API oficial Business Discovery, gratis)');
    }
    const h = String(ref.usuario).replace(/^@/, '');
    const campos = `business_discovery.username(${h}){followers_count,media_count,media.limit(${max}){id,caption,comments_count,like_count,media_type,media_product_type,permalink,timestamp,media_url}}`;
    const url = `https://graph.facebook.com/${version}/${userId}?fields=${encodeURIComponent(campos)}`;
    const { v } = await cache.memo(`lista:ig:${h}:${max}`, cfg.ttlListaH, async () => {
      await turno('instagram');
      const r = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new ErrorFuente(r.status === 429 || j?.error?.code === 4 ? 'BLOQUEO' : 'ERROR', j?.error?.message ?? `HTTP ${r.status}`);
      return j.business_discovery ?? {};
    });
    return (v.media?.data ?? []).slice(0, max).map((m) => ({
      clave: `instagram:${m.id}`,
      id: String(m.id),
      plataforma: 'instagram',
      cuenta: h,
      rol: ref.rol ?? null,
      url: m.permalink ?? null,
      titulo: m.caption ?? '',
      fecha: m.timestamp ? new Date(m.timestamp).toISOString() : null,
      vistas: null, // Business Discovery no da reproducciones de cuentas ajenas
      likes: n(m.like_count),
      comentarios: n(m.comments_count),
      compartidos: null,
      duracion_s: null,
      seguidores: n(v.followers_count),
      tipo: m.media_product_type ?? m.media_type ?? null,
      media_url: m.media_url ?? null,
    }));
  }

  async function listar(ref, max = cfg.maxPorCuenta) {
    if (!PLATAFORMAS.includes(ref.plataforma)) throw new ErrorFuente('NO_SOPORTADA', `plataforma no soportada: ${ref.plataforma}`);
    return ref.plataforma === 'instagram' ? listarInstagram(ref, max) : listarYtdlp(ref, max);
  }

  return { listar, detalle, ytdlpJson };
}
