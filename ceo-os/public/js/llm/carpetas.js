// Las carpetas del Chat (PLAN-GATEWAY §22): cada cliente es una carpeta y cada conversación vive en una. Puro y sin pantalla.
import { leerIdSesion } from './modos.js';

const FIJAS = { inherent: 'Inherent', personal: 'Personal' };
// El cliente de una conversación: el que se le puso al moverla o el que nació en su id. Sin cliente, es de Inherent.
export function carpetaDe(s = {}) {
  const c = s.cliente || leerIdSesion(s.id)?.slug || '';
  return !c || c === 'general' ? 'inherent' : c;
}
const titulo = (s) => String(s).split(/[-_]/).filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join(' ');
const cuando = (s) => String(s.last_active || s.started_at || '');

// sesiones → [{ id, nombre, conv, pendientes }]: primero los clientes con actividad reciente; Inherent y Personal al final.
// clientes: [{ slug, nombre }]. Un cliente sin conversaciones también sale: ahí se empieza la primera.
export function carpetas(sesiones = [], clientes = [], { personal = false } = {}) {
  const nombres = new Map(clientes.map((c) => [c.slug, c.nombre])), mapa = new Map();
  const de = (id) => { if (!mapa.has(id)) mapa.set(id, { id, nombre: FIJAS[id] || nombres.get(id) || titulo(id), conv: [], pendientes: 0 }); return mapa.get(id); };
  for (const c of clientes) if (!(c.slug in FIJAS)) de(c.slug);
  for (const s of [...sesiones].sort((a, b) => cuando(b).localeCompare(cuando(a)))) {
    const c = de(carpetaDe(s)); c.conv.push(s); if (s.agente?.estado === 'decidir') c.pendientes++;
  }
  de('inherent'); if (personal) de('personal');
  const reciente = (c) => cuando(c.conv[0] || {});
  const fijo = (c) => (c.id === 'personal' ? 2 : c.id === 'inherent' ? 1 : 0);
  return [...mapa.values()].sort((a, b) => fijo(a) - fijo(b) || reciente(b).localeCompare(reciente(a)) || a.nombre.localeCompare(b.nombre));
}

// El estado que se ve en la fila, del trabajo más urgente ligado a la conversación.
const PESO = { decidir: 3, trabajando: 2, listo: 1 };
export function estadoDeTrabajo(run = {}) {
  const xs = run.etapas || [], e = xs.find((x) => x.estado !== 'aprobada');
  if (!e) return xs.length ? 'listo' : '';
  if (['revision', 'pregunta', 'detenida'].includes(e.estado)) return 'decidir';
  if (['en_cola', 'trabajando'].includes(e.estado)) return 'trabajando';
  return '';
}
export function agenteDeSesion(ligados = [], runs = []) {
  let mejor = null;
  for (const a of ligados) {
    const r = runs.find((x) => x.id === a.run); if (!r || r.archivado) continue;
    const estado = estadoDeTrabajo(r);
    if (estado && (!mejor || PESO[estado] > PESO[mejor.estado])) mejor = { nombre: r.flujo?.agente || r.flujo?.nombre || 'Agente', estado };
  }
  return mejor;
}
export const ESTADO_FILA = { decidir: ['Espera tu decisión', 'alert'], trabajando: ['Trabajando', 'loader-circle'], listo: ['Listo para leer', 'check'] };
