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

// ---------- Reuniones por tipo de proyecto ----------
// Son las del plan: cuándo, quiénes, de qué se habla y qué se aprueba. Día = día desde que arranca.
// [reunión, día, quiénes, temas, qué se aprueba]
export const WHO = { ceo: 'CEO', coo: 'COO', content: 'Content', video: 'Editor de video', finance: 'Finance', prod: 'Producción', especialista: 'Especialista', cliente: 'Cliente' };
export const MEETINGS = {
  'Ciclo mensual': [
    ['Arranque del ciclo', 1, ['ceo', 'coo', 'cliente'], ['Resultados del mes pasado', 'Meta y foco del ciclo', 'Ofertas que se empujan', 'Fechas clave y lanzamientos'], 'La estrategia del ciclo'],
    ['Plan y calendario', 3, ['ceo', 'content'], ['Pilares y campañas', 'Calendario y shot list', 'Qué se graba y dónde'], 'El plan del ciclo'],
    ['Pre-producción', 5, ['coo', 'content', 'prod'], ['Locaciones y talento', 'Call sheet', 'Material del cliente que falta'], ''],
    ['Revisión interna', 15, ['coo', 'content', 'video'], ['Piezas montadas', 'Cambios', 'Captions y programación'], 'Las piezas pasan a cambios'],
    ['Presentación al cliente', 20, ['ceo', 'coo', 'cliente'], ['Piezas del mes', 'Calendario de publicación', 'Cambios finales'], 'Lo que se publica desde el día 1'],
  ],
  Growth: [
    ['Arranque y diagnóstico', 1, ['ceo', 'finance', 'cliente'], ['Meta financiera', 'Números de hoy', 'Dónde está trabado el negocio'], ''],
    ['Auditoría con el especialista', 8, ['ceo', 'especialista', 'cliente'], ['«¿Qué harías si fuera tu empresa?»', 'Hallazgos'], ''],
    ['Presentación del plan', 15, ['ceo', 'finance', 'cliente'], ['Oferta y precio', 'Canales', 'Metas y cómo se miden'], 'El plan de crecimiento'],
    ['Seguimiento de implementación', 22, ['coo', 'finance'], ['Avance de tareas', 'Bloqueos'], ''],
    ['Revisión de resultados', 29, ['ceo', 'finance', 'cliente'], ['Metas contra lo real', 'Qué se ajusta'], 'Los ajustes del siguiente mes'],
  ],
  Proyecto: [
    ['Kickoff', 1, ['ceo', 'coo', 'cliente'], ['Objetivo y alcance', 'Entregables y fechas', 'Quién decide del lado del cliente'], 'El alcance'],
    ['Aprobación de la estrategia', 8, ['ceo', 'cliente'], ['La propuesta', 'Riesgos'], 'La estrategia'],
    ['Revisión de avance', 15, ['coo', 'cliente'], ['Lo construido', 'Cambios'], ''],
    ['Entrega', 22, ['ceo', 'coo', 'cliente'], ['Entrega final', 'Siguientes pasos'], 'La entrega'],
  ],
};
MEETINGS.Custom = MEETINGS.Proyecto;
export const meetingsFor = (kind, start) => (MEETINGS[kind] || []).map(([name, day, who, topics, approves]) => ({ name, date: addDays(start, day - 1), who, topics, approves, status: 'todo' }));

// ---------- Servicios: nivel de entrega 5 (sencillo) a 10 (fuerte) ----------
// Cada rol tiene sus horas en nivel 5 y en nivel 10; en medio se reparte parejo.
export const LV = [5, 10];
export const hoursAt = (t, lv = 5) => { const h5 = +t.hours || 0; const h10 = t.hours10 == null || t.hours10 === '' ? h5 * 2 : +t.hours10; return Math.round((h5 + ((h10 - h5) * (lv - 5)) / 5) * 2) / 2; };
export const svcHours = (s, lv = s.level || 5) => (s.tasks || []).reduce((a, t) => a + hoursAt(t, lv), 0);
export function svcCost(s, rates, lv = s.level || 5) {
  if (!rates) return null;
  const rate = (role) => rates.roles?.find((r) => r.role === role)?.rate ?? null; const miss = [];
  const cost = (s.tasks || []).reduce((a, t) => { const r = rate(t.role); if (r == null) miss.push(t.role); return a + (r || 0) * hoursAt(t, lv); }, 0);
  return { cost, miss };
}
// El precio guardado es el del nivel del servicio; en otro nivel sube o baja con las horas.
export const svcPrice = (s, lv) => { const base = svcHours(s, s.level || 5); return s.price && base ? Math.round((s.price * svcHours(s, lv)) / base / 50) * 50 : null; };
// El perfil de trabajo que suele cubrir cada rol del catálogo (para asignar las tareas del proyecto Custom).
export const roleToWork = (r) => (/video|edici/i.test(r) ? 'video' : /producci|grabaci|foto/i.test(r) ? 'prod' : /financ|contab/i.test(r) ? 'finance' : /estrateg|ceo/i.test(r) ? 'ceo' : /conten|creativ|diseñ|community|copy|pauta|operador/i.test(r) ? 'content' : 'coo');
