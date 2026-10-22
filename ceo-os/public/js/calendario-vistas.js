// Las 3 vistas del calendario de una marca: Operativo · Planificación · Programado.
//   Operativo     → lo que hay que hacer para que cada pieza exista (grabar, editar, diseñar, revisar, programar), con su
//                   departamento y los límites del ciclo: el día 11 es el último para producir y el 20 se presenta.
//                   El ciclo de un mes produce lo que sale el mes siguiente (inherent/05-OPERACION.md › El calendario del ciclo).
//   Planificación → el mes con cada pieza y su estado, de Idea a Publicada (el planner de siempre).
//   Programado    → solo lo que está listo, con su día, su hora y su red.
// Sin DOM: lo usan la pantalla y las pruebas.
import { estadoDe } from './element.js';

export const VISTAS = [
  ['operativo', 'Operativo', 'Lo que hay que hacer para que cada pieza exista: grabar, editar, diseñar, revisar y programar, con su departamento y los límites del ciclo (día 11, último para producir · día 20, presentación).'],
  ['planificacion', 'Planificación', 'Lo que se va a publicar y en qué va cada pieza, de Idea a Publicada. Se llena con las ideas que pasan de Creatividad.'],
  ['programado', 'Programado', 'Solo lo que ya está listo, con su día, su hora y su red. Es lo que se presenta el día 20 y sale desde el 1 del mes siguiente.'],
];
export const vistaDe = (k) => (VISTAS.some(([x]) => x === k) ? k : k === 'grabacion' ? 'operativo' : 'planificacion');

// Los límites del ciclo (los días del mes en que se produce).
export const LIMITES = { producir: 11, presentar: 20 };
export const FASES = [
  { k: 'plan', l: 'Plan y calendario', d: [1, 3] },
  { k: 'producir', l: 'Producir', d: [6, 11] },
  { k: 'montar', l: 'Montar', d: [12, 15] },
  { k: 'cambios', l: 'Cambios y programación', d: [16, 19] },
  { k: 'presentar', l: 'Presentación', d: [20, 20] },
];
export const REDES = ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Facebook', 'WhatsApp'];

const VIDEO = /reel|tiktok|youtube|video|short/i;
export const esVideo = (p) => VIDEO.test(String(p?.format || ''));
// Las tareas de una pieza, en el orden del ciclo. dep: el departamento, con número y nombre.
export function tareasDe(p) {
  const t = [];
  if (esVideo(p)) t.push({ k: 'grabar', l: 'Grabar', dep: '⑤ Producción', d: [6, 11] }, { k: 'editar', l: 'Editar', dep: '⑦ Video Editing', d: [12, 15] });
  else {
    if (p?.material === 'foto') t.push({ k: 'foto', l: 'Fotografiar', dep: '⑤ Producción', d: [6, 11] });
    t.push({ k: 'disenar', l: 'Diseñar', dep: '⑥A Diseño gráfico', d: [12, 15] });
  }
  t.push({ k: 'revisar', l: 'Revisa', dep: '②B Branding', d: [16, 17] }, { k: 'programar', l: 'Programar', dep: '⑨ Posting', d: [18, 19] });
  // Cómo va cada tarea, según el estado de la pieza: Idea → todo por hacer · En proceso → la primera en curso · Listo o Publicado → hecho.
  const e = estadoDe(p);
  return t.map((x, i) => ({ ...x, estado: e === 'Listo' || e === 'Publicado' ? 'hecha' : e === 'En proceso' && i === 0 ? 'curso' : 'pendiente' }));
}

export const mesSig = (m) => { const [y, n] = m.split('-').map(Number); return n === 12 ? `${y + 1}-01` : `${y}-${String(n + 1).padStart(2, '0')}`; };
export const diasDelMes = (m) => { const [y, n] = m.split('-').map(Number); return new Date(y, n, 0).getDate(); };

// Operativo de un mes: las piezas que salen el mes siguiente (las que este ciclo produce), con sus tareas.
export function operativo(posts, mes) {
  const sale = mesSig(mes);
  return posts.filter((p) => String(p.date || '').slice(0, 7) === sale && estadoDe(p) !== 'Publicado' && estadoDe(p) !== 'Archivado')
    .sort((a, z) => String(a.date).localeCompare(String(z.date)))
    .map((p) => ({ p, tareas: tareasDe(p) }));
}

// Programado de una semana: lo listo (y lo ya publicado), por día y por hora.
export function programado(posts, desde, hasta) {
  const l = posts.filter((p) => p.date && p.date >= desde && p.date <= hasta && ['Listo', 'Publicado'].includes(estadoDe(p)))
    .sort((a, z) => `${a.date} ${a.time || '99'}`.localeCompare(`${z.date} ${z.time || '99'}`));
  return { piezas: l, sinHora: l.filter((p) => !p.time).length, sinRed: l.filter((p) => !redDe(p)).length };
}
// La red de una pieza: la que se le puso, o el canal de su slot del Plan del mes. Nunca se adivina por el formato.
export const redDe = (p) => p?.red || p?.slot?.canal || '';
