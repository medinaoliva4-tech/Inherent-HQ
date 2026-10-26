// Avisos · Tu trabajo: lo que te toca a ti (ver index.js y el catálogo en el comentario de cada regla).
// Cada regla: { id, grupo, area, urgencia, fijo?, necesita?, calcular(datos, persona, hoy, ciclo) → [aviso] }.
// Los datos llegan ya filtrados con lo que la persona ve (api/_lib/avisos-datos.js): aquí no se vuelve a filtrar el alcance.
import { aviso, plural } from './base.js';
import { isWaiting, createdAt } from '../ventas-flujo.js';

const lc = (x) => String(x || '').toLowerCase();

// lead-sin-responder · inherent/05-OPERACION.md §3 «Primer contacto: un minuto». Uno por lead esperando, del más viejo
// al más nuevo; el reloj corre en vivo (vivo.desde). Se apaga solo al guardar la primera respuesta. No se pospone.
const LEAD = { id: 'lead-sin-responder', grupo: 'trabajo', area: 'organizacion', urgencia: 'alta', fijo: true, necesita: { area: 'sales' } };
LEAD.calcular = (d) => (d.leads || []).filter(isWaiting).sort((a, b) => createdAt(a) - createdAt(b)).map((l) => aviso(LEAD, {
  clave: `lead-sin-responder:${l.id}`, titulo: `${l.name || 'Un lead'} escribió y nadie le ha respondido`, detalle: [l.source, l.need || l.note].filter(Boolean).join(' · '),
  vivo: { desde: createdAt(l) }, desde: new Date(createdAt(l)).toISOString(), huella: l.id, accion: { label: 'Responder', href: `#/org/sales/crm/${encodeURIComponent(l.id)}` },
}));

// tareas-vencidas · inherent/05-OPERACION.md §4 «Los dos límites». Las tuyas con fecha de hoy o atrasadas (las de cobro
// van en falta-pago). Hasta 3, una por tarea; con más, un solo aviso con el número.
const VENCIDAS = { id: 'tareas-vencidas', grupo: 'trabajo', area: 'todas', urgencia: 'alta' };
VENCIDAS.calcular = (d, p, hoy) => {
  const xs = (d.tasks || []).filter((t) => lc(t.assignee) === p.email && t.status !== 'Hecha' && /^\d{4}-\d{2}-\d{2}$/.test(String(t.due || '')) && t.due <= hoy && t.kind !== 'pago')
    .sort((a, b) => a.due.localeCompare(b.due));
  if (!xs.length) return [];
  const atras = xs.filter((t) => t.due < hoy).length, deHoy = xs.length - atras;
  if (xs.length <= 3) return xs.map((t) => aviso(VENCIDAS, {
    clave: `tareas-vencidas:${t.id}`, titulo: t.due < hoy ? `Atrasada: «${t.title}»` : `Para hoy: «${t.title}»`, detalle: [t.dept, t.due < hoy ? `vencía el ${t.due.slice(8)}/${t.due.slice(5, 7)}` : ''].filter(Boolean).join(' · '),
    urgencia: 'alta', desde: t.due, huella: `${t.status}|${t.due}`, cliente: t.client_slug || '', accion: { label: 'Abrir', abre: 'tarea', id: t.id },
  }));
  return [aviso(VENCIDAS, {
    clave: 'tareas-vencidas', titulo: `Tienes ${[deHoy ? plural(deHoy, 'tarea para hoy', 'tareas para hoy') : '', atras ? plural(atras, 'atrasada', 'atrasadas') : ''].filter(Boolean).join(' y ')}`,
    desde: xs[0].due, huella: xs.map((t) => t.id).join(','), accion: { label: 'Ver', href: atras ? '#/org/work/atrasadas' : '#/org/work/hoy' },
  })];
};

export const TRABAJO = [LEAD, VENCIDAS];
