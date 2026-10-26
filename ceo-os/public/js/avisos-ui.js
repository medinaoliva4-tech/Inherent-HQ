// Avisos en el navegador: la campanita (cuántos piden atención) y lo que hace cada botón de un aviso.
// Lo del servidor llega ya calculado y filtrado (GET /api/avisos); lo de tu compu lo revisa avisos-compu.js.
// La campanita cuenta alta + media, se pone al día al abrir el OS, al volver a la pestaña, cada 3 minutos y cuando
// algo cambia (el evento «avisos» de events).
import { api, events } from './core.js';
import { avisosCompu } from './avisos-compu.js';
import { aplicarPospuestos, hoyGT } from './avisos-reglas/base.js';

let ultimo = { at: 0, r: null, compu: [] }, enVuelo = null;
// Los avisos de esta persona (servidor + compu). fresco: sin la memoria de 30 s.
export async function leerAvisos(me, { fresco = false, compu = false } = {}) {
  if (!fresco && ultimo.r && Date.now() - ultimo.at < 30_000 && (!compu || ultimo.conCompu)) return ultimo;
  if (enVuelo && !fresco) return enVuelo;
  enVuelo = (async () => {
    const [r, c] = await Promise.all([api('avisos').catch((e) => ({ items: [], pospuestos: [], n: {}, error: e.message })), avisosCompu(me, { forzar: compu }).catch(() => [])]);
    // Lo que pospusiste de tu compu se guarda en el servidor como lo demás; aquí se aplica.
    const pc = aplicarPospuestos(c, r.pos || {}, hoyGT());
    r.pospuestos = [...(r.pospuestos || []), ...pc.pospuestos];
    ultimo = { at: Date.now(), r, compu: pc.visibles, conCompu: compu || ultimo.conCompu };
    return ultimo;
  })();
  try { return await enVuelo; } finally { enVuelo = null; }
}
export const cuentaDe = ({ r, compu = [] } = {}) => [...(r?.items || []), ...compu].filter((x) => x.urgencia !== 'baja').length;

// Pinta el número en cada campanita (la de la barra lateral y la de arriba).
export function pintarCampana(n) {
  for (const b of document.querySelectorAll('[data-avisos-n]')) { b.hidden = !n; b.textContent = n > 99 ? '99+' : String(n || ''); }
  for (const a of document.querySelectorAll('[data-avisos]')) a.setAttribute('aria-label', n ? `Avisos: ${n} piden atención` : 'Avisos');
}
export async function contarAvisos(me, opts) { if (!me || me.role === 'client') return; const x = await leerAvisos(me, opts); pintarCampana(cuentaDe(x)); return x; }

// Se instala una vez: al volver a la pestaña, cada 3 minutos y cuando algo cambia.
export function instalarCampana(me) {
  if (!me || me.role === 'client') return;
  contarAvisos(me);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') contarAvisos(me); });
  setInterval(() => { if (document.visibilityState === 'visible') contarAvisos(me); }, 3 * 60_000);
  events.addEventListener('avisos', () => contarAvisos(me, { fresco: true }));
}
export const avisar = () => events.dispatchEvent(new Event('avisos'));
