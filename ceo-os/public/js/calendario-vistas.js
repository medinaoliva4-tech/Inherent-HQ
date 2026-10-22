// El calendario de una marca: se ve igual que el de Proyectos (calendario-trabajo.js), con tres filtros que se prenden y apagan.
//   Operativo     → lo que hay que hacer para que el contenido exista: las grabaciones, las tareas con fecha de sus proyectos,
//                   las fases y reuniones de esos proyectos, y los días 1, 11 y 20 del ciclo.
//   Planificación → las piezas que todavía no están listas (Idea o En proceso), en el día en que salen.
//   Programado    → las piezas listas o ya publicadas, con su hora y su red (marca las que no las tienen).
// Lo atrasado sale en rojo, igual que en Proyectos. Sin DOM: lo usan la pantalla y las pruebas.
import { estadoDe } from './element.js';
import { hitosCiclo } from './calendario-trabajo.js';

export const TIPOS_MARCA = [['operativo', 'Operativo'], ['planificacion', 'Planificación'], ['programado', 'Programado']];
export const REDES = ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Facebook', 'WhatsApp'];
// La red de una pieza: la que se le puso, o el canal de su slot del Plan del mes. Nunca se adivina por el formato.
export const redDe = (p) => p?.red || p?.slot?.canal || '';

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
// p: { posts, shoots, tasks, projects, slug, from, to, hoy }. Devuelve eventos con la misma forma que los de Proyectos.
export function eventosMarca({ posts = [], shoots = [], tasks = [], projects = [], slug, from, to, hoy = new Date().toISOString().slice(0, 10) } = {}) {
  const out = [], inR = (d) => isDate(d) && d >= from && d <= to;
  // ---- Operativo ----
  for (const x of shoots) {
    if (!x || x.profile !== slug || x.status === 'Cancelado' || !inR(x.date)) continue;
    out.push({ k: `s-${x.id}`, tipo: 'operativo', date: x.date, time: x.time || '', title: `Grabación · ${x.title || ''}`.trim(), sub: x.place || '', late: x.date < hoy && x.status !== 'Grabado', go: { act: 'sedit', id: x.id } });
  }
  const suyos = projects.filter((p) => p?.client_slug === slug), ids = new Set(suyos.map((p) => p.id));
  for (const t of tasks) {
    if (!t || t.status === 'Hecha' || !inR(t.due) || !(ids.has(t.project_id) || t.client_slug === slug)) continue;
    out.push({ k: `t-${t.id}`, tipo: 'operativo', date: t.due, time: '', title: t.title || 'Tarea', sub: t.dept || 'Tarea', late: t.due < hoy, go: { href: t.project_id ? `#/operations/p/${encodeURIComponent(t.project_id)}` : '#/operations' } });
  }
  for (const p of suyos) {
    const href = `#/operations/p/${encodeURIComponent(p.id)}`;
    (p.phases || []).forEach((ph, j) => { if (inR(ph.start) && ph.status !== 'done') out.push({ k: `f-${p.id}-${j}`, tipo: 'operativo', date: ph.start, time: '', title: `${ph.name} · ${p.name}`, sub: 'Fase', go: { href } }); });
    (p.meetings || []).forEach((m, j) => { if (inR(m.date) && m.status !== 'hecha') out.push({ k: `m-${p.id}-${j}`, tipo: 'operativo', date: m.date, time: m.time || '', title: `${m.name} · ${p.client || p.name}`, sub: 'Reunión', go: { href } }); });
  }
  out.push(...hitosCiclo(from, to).map((h) => ({ ...h, tipo: 'operativo', ciclo: true })));
  // ---- Planificación y Programado: las piezas ----
  for (const p of posts) {
    if (!p || (p.kind && p.kind !== 'post') || !inR(p.date)) continue;
    const e = estadoDe(p);
    if (e === 'Archivado') continue;
    if (e === 'Idea' || e === 'En proceso') out.push({ k: `p-${p.id}`, tipo: 'planificacion', date: p.date, time: '', title: p.title || 'Sin título', sub: [p.format, e].filter(Boolean).join(' · '), late: p.date < hoy, go: { act: 'pedit', id: p.id } });
    else {
      const falta = [!p.time && 'sin hora', !redDe(p) && 'sin red'].filter(Boolean);
      out.push({ k: `p-${p.id}`, tipo: 'programado', date: p.date, time: p.time || '', title: `${p.title || 'Sin título'}${falta.length && e === 'Listo' ? ` · ${falta.join(' y ')}` : ''}`, sub: [redDe(p), p.format, e === 'Publicado' ? 'ya salió' : ''].filter(Boolean).join(' · '), late: e === 'Listo' && p.date < hoy, falta: e === 'Listo' && falta.length > 0, go: { act: 'pedit', id: p.id } });
    }
  }
  const ORD = { operativo: 0, planificacion: 1, programado: 2 };
  return out.sort((a, z) => a.date.localeCompare(z.date) || (a.ciclo ? -1 : z.ciclo ? 1 : 0) || String(a.time || '').localeCompare(String(z.time || '')) || ORD[a.tipo] - ORD[z.tipo]);
}
