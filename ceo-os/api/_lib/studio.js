// Studio (servidor): la curva de retención y los mejores clips (public/js/studio/). Quien ve Content (marketing/creative/production).
//   POST /api/studio/retencion         {texto | srt, duracion?, cortes?}  → la curva, las caídas con su razón y la evidencia
//   POST /api/studio/clips             {texto | srt, minS?, maxS?, n?, cortes?} → los mejores momentos
//   POST /api/studio/retencion/real    {entrada, real:[{t,s}], plataforma?, titulo?}  → guarda la retención REAL de un video publicado (solo se agrega)
//   POST /api/studio/retencion/calibrar  (CEO/COO) → ajusta el modelo con las muestras y lo guarda SOLO si mejora fuera de muestra
//   GET  /api/studio/retencion/modelo  → el modelo vigente y cuántas muestras hay
// El modelo vigente vive en `settings` (id retencion_modelo). Las muestras en `ret_muestras`: nunca por /api/db.
import * as db from './db.js';
import { guard } from './access.js';
import { body } from './http.js';
import { analizar, calibrar, lineaDeTiempoDesdeTexto, desdeSubtitulos, MODELO, PESOS_BASE, RIESGO_BASE } from '../../public/js/studio/retencion.js';
import { mejoresMomentos } from '../../public/js/studio/clips.js';

export const COLL_MUESTRAS = 'ret_muestras', DOC_MODELO = 'retencion_modelo';
const MAX_CHARS = 200_000, MAX_SEG = 6000;
const clean = (s) => String(s ?? '').slice(0, MAX_CHARS);
const fail = (res, status, error, code) => res.status(status).json({ error, code });

export async function modeloVigente() {
  const d = await db.get('settings', DOC_MODELO);
  return d?.pesos ? { pesos: d.pesos, riesgo: d.riesgo, modelo: d.modelo } : { pesos: PESOS_BASE, riesgo: RIESGO_BASE, modelo: MODELO };
}
// De lo que manda la persona a la entrada del motor. Tope de tamaño; números saneados.
export function entradaDe(b) {
  let e;
  if (b.srt) e = desdeSubtitulos(clean(b.srt));
  else if (b.texto) e = lineaDeTiempoDesdeTexto(clean(b.texto));
  else if (Array.isArray(b.segmentos)) e = { segmentos: b.segmentos.slice(0, MAX_SEG).map((s) => ({ t0: +s.t0, t1: +s.t1, texto: clean(s.texto).slice(0, 2000) })), duracion: Number.isFinite(+b.duracion) ? +b.duracion : undefined };
  else return null;
  if (e.segmentos.length > MAX_SEG) return null;
  const cortes = Array.isArray(b.cortes) ? b.cortes.slice(0, 5000).map(Number).filter(Number.isFinite) : null;
  return { ...e, ...(cortes ? { cortes } : {}), ...(Number.isFinite(+b.duracion) && +b.duracion > 0 ? { duracion: +b.duracion } : {}) };
}

export function rutas(on) {
  const abre = (req, res, write = false) => guard(req, res, 'content', { write });
  on('POST', 'studio/retencion', async (req, res) => {
    const u = await abre(req, res); if (!u) return;
    const e = entradaDe(body(req)); if (!e) return fail(res, 400, 'Pega un guion, una transcripción (SRT/VTT) o los segmentos con tiempos', 'ENTRADA');
    res.json(analizar(e, await modeloVigente()));
  });
  on('POST', 'studio/clips', async (req, res) => {
    const u = await abre(req, res); if (!u) return;
    const b = body(req), e = entradaDe(b); if (!e) return fail(res, 400, 'Pega la transcripción con tiempos (SRT/VTT)', 'ENTRADA');
    const m = await modeloVigente(), n = Math.min(10, Math.max(1, +b.n || 5));
    res.json(mejoresMomentos(e, { minS: Math.max(5, +b.minS || 20), maxS: Math.min(120, +b.maxS || 55), n, cortes: e.cortes || [] }, m));
  });
  on('POST', 'studio/retencion/real', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    const b = body(req), e = entradaDe(b.entrada || {}), real = (Array.isArray(b.real) ? b.real : []).slice(0, 2000).map((r) => ({ t: +r.t, s: +r.s })).filter((r) => Number.isFinite(r.t) && Number.isFinite(r.s) && r.s >= 0 && r.s <= 1);
    if (!e || real.length < 3) return fail(res, 400, 'Hace falta el guion con tiempos y al menos 3 puntos de retención real (fracción entre 0 y 1)', 'MUESTRA');
    const d = await db.create(COLL_MUESTRAS, { entrada: e, real, plataforma: String(b.plataforma || '').slice(0, 30), titulo: String(b.titulo || '').slice(0, 120), por: u.email }, u.email);
    res.json({ id: d.id, muestras: (await db.list(COLL_MUESTRAS)).length });
  });
  on('POST', 'studio/retencion/calibrar', async (req, res) => {
    const u = await abre(req, res, true); if (!u) return;
    if (!['ceo', 'coo'].includes(u.role)) return fail(res, 403, 'Solo el CEO o el COO calibran el modelo', 'ROL');
    const muestras = await db.list(COLL_MUESTRAS), r = calibrar(muestras.map((m) => ({ entrada: m.entrada, real: m.real })));
    if (r.calibrado) await db.upsert('settings', DOC_MODELO, { pesos: r.pesos, riesgo: r.riesgo, modelo: r.modelo, calibrado_por: u.email, en: new Date().toISOString() }, u.email);
    res.json({ calibrado: r.calibrado, motivo: r.motivo, muestras: muestras.length, error_base: r.error_base ?? null, error_fuera_de_muestra: r.error_fuera_de_muestra ?? null });
  });
  on('GET', 'studio/retencion/modelo', async (req, res) => {
    const u = await abre(req, res); if (!u) return;
    const m = await modeloVigente(); res.json({ ...m, muestras: (await db.list(COLL_MUESTRAS)).length });
  });
}
