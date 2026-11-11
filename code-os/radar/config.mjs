// Configuración del radar. Todo sale del entorno con valores por defecto conservadores.
// Las llaves se leen del entorno (en el VPS: ~/gateway/.env) y nunca se imprimen.
import { homedir } from 'node:os';
import { join } from 'node:path';

const num = (v, d) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v));

export function cargarConfig(e = process.env, extra = {}) {
  const home = e.HOME ?? homedir();
  const c = {
    cacheDir: e.RADAR_CACHE_DIR ?? join(home, '.cache', 'inherent-radar'),
    maxPorCuenta: num(e.RADAR_MAX_POR_CUENTA, 5),
    // Pausa mínima entre peticiones a la misma plataforma (ms). Educado a propósito.
    pausasMs: {
      youtube: num(e.RADAR_PAUSA_YOUTUBE_MS, 2500),
      tiktok: num(e.RADAR_PAUSA_TIKTOK_MS, 5000),
      instagram: num(e.RADAR_PAUSA_INSTAGRAM_MS, 3000),
    },
    ttlListaH: num(e.RADAR_TTL_LISTA_H, 12), // lista de publicaciones de una cuenta
    ttlDetalleH: num(e.RADAR_TTL_DETALLE_H, 24), // métricas de una publicación
    presupuesto: {
      usd: num(e.RADAR_PRESUPUESTO_USD, 0), // 0 = solo modelos gratis (nivel-bajo es NVIDIA gratis)
      llamadasIA: num(e.RADAR_MAX_LLAMADAS_IA, 30),
      descargaMB: num(e.RADAR_MAX_DESCARGA_MB, 400), // tope total de video bajado por corrida
      videoPorPublicacionMB: num(e.RADAR_MAX_MB_VIDEO, 60),
      segundosAnalisis: num(e.RADAR_SEG_ANALISIS, 60), // solo se analizan los primeros N s
    },
    litellm: {
      base: (e.LITELLM_BASE ?? 'http://127.0.0.1:4000/v1').replace(/\/$/, ''),
      key: e.LITELLM_MASTER_KEY ?? '',
      nivel: e.RADAR_NIVEL_IA ?? 'nivel-bajo',
      nivelVision: e.RADAR_NIVEL_VISION ?? '', // vacío = no manda fotogramas al modelo
      usdPorMTokens: num(e.RADAR_USD_POR_MTOK, 0),
      timeoutMs: num(e.RADAR_TIMEOUT_IA_MS, 60_000),
    },
    bin: {
      ytdlp: e.YTDLP_BIN ?? 'yt-dlp',
      ffmpeg: e.FFMPEG_BIN ?? 'ffmpeg',
      fpcalc: e.FPCALC_BIN ?? 'fpcalc',
      whisper: e.WHISPER_BIN ?? 'whisper-cli',
    },
    whisperModelo: e.WHISPER_MODEL ?? '', // p. ej. ~/modelos/ggml-base.bin; vacío = sin whisper
    idiomasSubs: e.RADAR_SUB_LANGS ?? '.*-orig,es,en',
    instagram: { token: e.IG_GRAPH_TOKEN ?? '', userId: e.IG_USER_ID ?? '', version: e.IG_GRAPH_VERSION ?? 'v21.0' },
    umbrales: {
      visual: num(e.RADAR_UMBRAL_VISUAL, 0.6),
      audio: num(e.RADAR_UMBRAL_AUDIO, 0.7),
      texto: num(e.RADAR_UMBRAL_TEXTO, 0.5),
      cuentasQuemado: num(e.RADAR_CUENTAS_QUEMADO, 2), // en cuántas OTRAS cuentas/plataformas debe aparecer
      winner: num(e.RADAR_UMBRAL_WINNER, 1.5), // rinde ≥ 1.5× la mediana de su cuenta
    },
  };
  return fusionar(c, extra);
}

function fusionar(a, b) {
  for (const [k, v] of Object.entries(b ?? {})) {
    a[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' ? fusionar({ ...a[k] }, v) : v;
  }
  return a;
}
