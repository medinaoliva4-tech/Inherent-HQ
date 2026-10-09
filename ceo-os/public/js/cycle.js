// El ciclo de contenido y sus tareas: lo usan el Arranque y el asistente de «+ Proyecto».
export const CYCLE = [['Reunión día 1', 1, 1], ['Plan', 1, 3], ['Calendario y shot list', 2, 3], ['Brand guidelines', 3, 6], ['Producción', 6, 11], ['Montaje', 12, 15], ['Cambios y programación', 16, 19], ['Presentación al cliente', 20, 20]];
export const PROJECT_PHASES = ['Descubrimiento', 'Estrategia', 'Build', 'Entrega'];
export const GROWTH_PHASES = ['Diagnóstico', 'Auditoría con el especialista', 'Plan', 'Implementación', 'Revisión'];
export const DEPTS = [['①', 'Strategy'], ['②', 'Growth'], ['②B', 'Branding'], ['③', 'Marketing'], ['④', 'Creatividad'], ['⑤', 'Producción'], ['⑥A', 'Diseño gráfico'], ['⑦', 'Video Editing'], ['⑧', 'Community'], ['⑨', 'Posting'], ['⑩', 'Ads']];
// [tarea, día del ciclo en que vence, perfil que la hace]
export const TASKS = {
  '①': ['Reunión del día 1 y estrategia del ciclo', 3, 'ceo'],
  '②': ['Elegir las ofertas que se empujan este ciclo', 3, 'ceo'],
  '②B': ['Brand guidelines del ciclo', 6, 'content'],
  '③': ['Plan del ciclo: pilares, campañas y calendario', 3, 'ceo'],
  '④': ['Ideas, guiones y shot list', 3, 'content'],
  '⑤': ['Producción: grabación y fotos (último día: 11)', 11, 'prod'],
  '⑥A': ['Diseño: estáticos, carruseles y stories', 15, 'content'],
  '⑦': ['Edición: reels y derivados', 15, 'video'],
  '⑧': ['Community: ficha y respuestas al día', 19, 'content'],
  '⑨': ['Posting: captions y programación', 19, 'content'],
  '⑩': ['Ads: plan y presupuesto para aprobar', 19, 'ceo'],
};
export const GROWTH_TASKS = [['Diagnóstico: números y mapa del negocio', 0, 'finance'], ['Auditoría con el especialista', 1, 'finance'], ['Plan: ganar más y gastar menos', 2, 'finance'], ['Implementación', 3, 'finance'], ['Revisión de resultados', 4, 'ceo']];
export const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
export const deptsOfPlan = (c) => (c?.pipeline?.length ? c.pipeline.map((r) => (r.paso.match(/^[①-⑩][A-Z]?/) || [''])[0]).filter(Boolean) : DEPTS.map(([d]) => d));

export function phasesFor(kind, start) {
  if (kind === 'Ciclo mensual') return CYCLE.map(([name, a, z], i) => ({ name, start: addDays(start, a - 1), end: addDays(start, z - 1), status: i === 0 ? 'now' : 'todo' }));
  return (kind === 'Growth' ? GROWTH_PHASES : PROJECT_PHASES).map((name, i) => ({ name, start: addDays(start, i * 7), end: addDays(start, i * 7 + 6), status: i === 0 ? 'now' : 'todo' }));
}
export function holders(team, meEmail) {
  const holder = (role) => { const p = team.find((x) => x.active !== false && (x.roles || []).includes(role)); return p ? p.email || p.id : null; };
  const prod = () => { const p = team.find((x) => /producci|grabaci/i.test(x.title || '')); return p ? p.email || p.id : holder('content'); };
  return (role) => (role === 'prod' ? prod() : holder(role) || (role === 'ceo' ? meEmail : null));
}
// Las tareas que le faltan a un proyecto (no repite las que ya existen).
export function tasksFor(p, team, existing, meEmail) {
  const who = holders(team, meEmail), coo = who('coo') || '';
  const s = p.phases?.[0]?.start || new Date().toISOString().slice(0, 10);
  const has = (re) => existing.some((t) => t.project_id === p.id && re.test(t.title + ' ' + (t.dept || '')));
  const out = [];
  if (p.kind === 'Growth' || p.line === 'growth') {
    GROWTH_TASKS.forEach(([title, w, role]) => { if (!has(new RegExp('^' + title.split(':')[0]))) out.push({ title, project_id: p.id, dept: '② Growth', assignee: who(role) || '', accountable: role === 'ceo' ? '' : coo, due: addDays(s, w * 7 + 6), status: 'Por empezar', cycle: p.cycle || '' }); });
    return out;
  }
  for (const [n, name] of DEPTS) {
    if (p.pipeline?.[n]?.status === 'off' || !TASKS[n] || has(new RegExp(`(^|\\s)${n} `))) continue;
    const [title, day, role] = TASKS[n];
    out.push({ title, project_id: p.id, dept: `${n} ${name}`, assignee: who(role) || '', accountable: role === 'ceo' ? '' : coo, due: addDays(s, day - 1), status: 'Por empezar', cycle: p.cycle || '' });
  }
  if (p.kind === 'Ciclo mensual') {
    if (!has(/QA final/)) out.push({ title: 'QA final del ciclo', project_id: p.id, dept: '', assignee: coo, accountable: '', due: addDays(s, 18), status: 'Por empezar', cycle: p.cycle || '' });
    if (!has(/Presentaci/)) out.push({ title: 'Presentación al cliente (día 20)', project_id: p.id, dept: '① Strategy', assignee: who('ceo') || meEmail, accountable: '', due: addDays(s, 19), status: 'Por empezar', cycle: p.cycle || '' });
  }
  return out;
}
