// «Decide»: lo que solo tú puedes resolver (puro). El servidor arma las decisiones de cada rol (api/_lib/decide.js) y aquí se
// ordenan por el reloj del ciclo y se recortan: 3 en Hoy, 1 por vez en el teléfono. No hay tabla ni lista de tareas.
import { cicloDe, frasesDeHito } from './ciclo.js';

export const MAX_HOY = 3;
export const VACIO = 'Nada espera por ti. Disfruta.';
export const ACCIONES = ['aprobar', 'cambios', 'escalar'];
const dias = (desde, hoy) => { const t = Date.parse(desde || ''); return Number.isFinite(t) ? Math.max(0, Math.floor((hoy - t) / 864e5)) : 0; };

// Qué tan arriba va una decisión. Más puntos = antes. Cuatro cosas pesan, en este orden:
//   1 · el reloj: cuanto más cerca el 11 o el 20, más sube lo que los frena;  2 · el foco del día (producir el 6, montar el 12…);
//   3 · si alguien te la escaló;  4 · cuánto lleva esperando.
export function prioridad(item, ciclo, ahora = Date.now()) {
  let p = 40 - Math.min(ciclo.diasAlHito, 20) * 1.5 + ciclo.presion * 20;
  const razones = [];
  if (ciclo.presion) razones.push(frasesDeHito(ciclo));
  if (item.area && ciclo.foco.includes(item.area)) { p += 15; razones.push(`Hoy toca: ${ciclo.fase.nombre.toLowerCase()}`); }
  if (item.escaladoPor) { p += 12; razones.push('Te la escalaron'); }
  const espera = dias(item.desde, ahora); p += Math.min(espera, 10);
  if (espera >= 3) razones.push(`Lleva ${espera} días esperando`);
  return { puntos: Math.round(p * 10) / 10, razon: razones[0] || '' };
}

// items = lo que devolvió GET /api/decide. Devuelve todo ordenado, con su prioridad y su razón.
export function ordenar(items = [], { hoy = new Date(), ahora = Date.now() } = {}) {
  const ciclo = cicloDe(hoy);
  return (Array.isArray(items) ? items : []).map((x) => ({ ...x, prioridad: prioridad(x, ciclo, ahora) }))
    .sort((a, z) => z.prioridad.puntos - a.prioridad.puntos || String(a.desde || '').localeCompare(String(z.desde || '')) || String(a.id).localeCompare(String(z.id)));
}
// La selección que se pinta. Teléfono: UNA decisión y cuántas quedan. Hoy en el escritorio: tres.
export function seleccion(items = [], { movil = false, ...o } = {}) {
  const todas = ordenar(items, o), n = movil ? 1 : MAX_HOY;
  return { visibles: todas.slice(0, n), resto: Math.max(0, todas.length - n), total: todas.length, vacio: todas.length ? '' : VACIO };
}
// Las acciones de una decisión, según lo que el servidor dijo que se puede (el navegador nunca concede permiso).
export function accionesDe(item) {
  const puede = item?.puede || {};
  const bloq = Array.isArray(item?.faltas) && item.faltas.length ? item.faltas.join(' · ') : '';
  return [
    { id: 'aprobar', label: 'Aprobar', disabled: !puede.aprobar || Boolean(bloq), motivo: !puede.aprobar ? 'Esto lo aprueba otro rol' : bloq ? `Falta: ${bloq}` : '' },
    { id: 'cambios', label: 'Pedir cambios', disabled: !puede.cambios, motivo: puede.cambios ? '' : 'No puedes pedir cambios aquí' },
    { id: 'escalar', label: 'Escalar', disabled: !puede.escalar, motivo: puede.escalar ? '' : 'Ya está en tu nivel' },
  ];
}
// A quién se escala: precio, alcance y fechas → el CEO; lo demás → el COO (CLAUDE.md · «Escalar no es bloquear»).
export const escalaA = (tema) => (['precio', 'alcance', 'fechas'].includes(String(tema || '').toLowerCase()) ? 'ceo' : 'coo');
