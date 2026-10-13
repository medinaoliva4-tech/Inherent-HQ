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
  '⑩': ['Ads: plan y presupuesto para aprobar', 19, 'ads'],
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
  // Sin alguien de Ads, la pauta la lleva el CEO.
  return (role) => (role === 'prod' ? prod() : holder(role) || (role === 'ads' ? holder('ceo') || meEmail : role === 'ceo' ? meEmail : null));
}
// ---------- Dependencias: qué tiene que estar hecho antes ----------
// En el ciclo: la estrategia manda, luego el plan, las ideas, producir, montar, programar, QA y presentar.
const DEP = { '②': ['①'], '②B': ['①'], '③': ['①'], '④': ['③'], '⑤': ['④'], '⑥A': ['⑤'], '⑦': ['⑤'], '⑨': ['⑥A', '⑦'], '⑧': ['⑨'], '⑩': ['③'], QA: ['⑥A', '⑦', '⑨', '⑧'], PRES: ['QA'] };
// Si un departamento no corre, se salta: se depende de lo que él dependía.
const depsIn = (k, keys) => (DEP[k] || []).flatMap((d) => (keys.has(d) ? [d] : depsIn(d, keys)));

// Las tareas que le faltan a un proyecto (no repite las que ya existen). Cada una trae `key` y `after`
// (las keys de las que depende); `createLinked` las convierte en `depends_on` con los ids reales.
export function tasksFor(p, team, existing, meEmail) {
  const who = holders(team, meEmail), coo = who('coo') || '';
  const s = p.phases?.[0]?.start || new Date().toISOString().slice(0, 10);
  const has = (re) => existing.some((t) => t.project_id === p.id && re.test(t.title + ' ' + (t.dept || '')));
  const out = [];
  if (p.kind === 'Growth' || p.line === 'growth') {
    GROWTH_TASKS.forEach(([title, w, role], i) => { if (!has(new RegExp('^' + title.split(':')[0]))) out.push({ key: 'g' + i, after: i ? ['g' + (i - 1)] : [], title, project_id: p.id, dept: '② Growth', assignee: who(role) || '', accountable: role === 'ceo' ? '' : coo, due: addDays(s, w * 7 + 6), status: 'Por empezar', cycle: p.cycle || '' }); });
    return out;
  }
  for (const [n, name] of DEPTS) {
    if (p.pipeline?.[n]?.status === 'off' || !TASKS[n] || has(new RegExp(`(^|\\s)${n} `))) continue;
    const [title, day, role] = TASKS[n];
    out.push({ key: n, title, project_id: p.id, dept: `${n} ${name}`, assignee: who(role) || '', accountable: role === 'ceo' ? '' : role === 'ads' ? who('ceo') || '' : coo, due: addDays(s, day - 1), status: 'Por empezar', cycle: p.cycle || '' });
  }
  if (p.kind === 'Ciclo mensual') {
    if (!has(/QA final/)) out.push({ key: 'QA', title: 'QA final del ciclo', project_id: p.id, dept: '', assignee: coo, accountable: '', due: addDays(s, 18), status: 'Por empezar', cycle: p.cycle || '' });
    if (!has(/Presentaci/)) out.push({ key: 'PRES', title: 'Presentación al cliente (día 20)', project_id: p.id, dept: '① Strategy', assignee: who('ceo') || meEmail, accountable: '', due: addDays(s, 19), status: 'Por empezar', cycle: p.cycle || '' });
  }
  const keys = new Set(out.map((t) => t.key));
  out.forEach((t) => (t.after = depsIn(t.key, keys)));
  return out;
}

// Proyecto custom (sale de una cotización): kickoff → por cada servicio, sus roles en orden
// (estrategia → contenido/finanzas → producción → edición) → QA y entrega.
const STAGE = { ceo: 0, content: 1, finance: 1, prod: 2, video: 3, ads: 3, coo: 4 };
export function customTasks(p, items, team, meEmail) {
  const who = holders(team, meEmail), coo = who('coo') || '', ceo = who('ceo') || meEmail;
  const start = p.phases?.[0]?.start || new Date().toISOString().slice(0, 10), end = p.phases?.[p.phases.length - 1]?.end || start;
  // Si el servicio dice cuánto tarda, la tarea vence ese día (días hábiles desde que arranca el proyecto).
  const workdays = (n) => { const d = new Date(start + 'T12:00'); let k = 0; while (k < n) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) k++; } return d.toISOString().slice(0, 10); };
  const out = [{ key: 'kick', after: [], title: 'Kickoff con el cliente: alcance, fechas y material', project_id: p.id, dept: '', assignee: ceo, accountable: '', due: start, status: 'Por empezar' }];
  items.forEach((i, si) => {
    const rows = i.roles.map((r, ri) => ({ r, ri, st: STAGE[roleToWork(r.role)] ?? 1 }));
    // Fechas en escalera: cada etapa vence cuando se acumulan sus horas dentro de lo que tarda el servicio.
    const stages = [...new Set(rows.map((x) => x.st))].sort((a, z) => a - z), tot = rows.reduce((a, x) => a + (+x.r.hours || 0), 0) || 1;
    const dueOf = (st) => { if (!i.days) return end; const h = rows.filter((x) => x.st <= st).reduce((a, x) => a + (+x.r.hours || 0), 0); return workdays(Math.max(1, Math.round((i.days * h) / tot))); };
    rows.forEach(({ r, ri, st }) => {
      const prev = rows.filter((x) => x.st < st); const top = Math.max(-1, ...prev.map((x) => x.st));
      out.push({ key: `s${si}r${ri}`, after: top < 0 ? ['kick'] : prev.filter((x) => x.st === top).map((x) => `s${si}r${x.ri}`), title: `${i.name} · ${r.role} (${r.hours} h)`, service_id: i.id, service: i.name, project_id: p.id, dept: '', assignee: who(roleToWork(r.role)) || meEmail, accountable: coo, due: dueOf(st), checklist: (i.includes || []).map((x) => ({ t: x, done: false })), hours: r.hours, level: i.level, status: 'Por empezar' });
    });
  });
  const last = out.map((t) => t.due).sort().at(-1); const qaDue = items.every((i) => i.days) && last ? (() => { const d = new Date(last + 'T12:00'); let k = 0; while (k < 2) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) k++; } return d.toISOString().slice(0, 10); })() : end;
  // Cierre: el COO revisa lo entregado, lo ve con el CEO y se entrega al cliente.
  const plus = (iso, n) => { const d = new Date(iso + 'T12:00'); let k = 0; while (k < n) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) k++; } return d.toISOString().slice(0, 10); };
  out.push({ key: 'qa', after: out.filter((t) => t.key !== 'kick').map((t) => t.key), title: 'QA del COO: revisar los entregables', description: 'Revisa cada entregable contra su checklist y su SOP. Si algo falta, regrésalo a quien lo hizo.', project_id: p.id, dept: '', assignee: coo || ceo, accountable: ceo === coo ? '' : ceo, due: qaDue, status: 'Por empezar' });
  out.push({ key: 'meet', after: ['qa'], title: 'Reunión COO + CEO: revisar antes de entregar', description: 'El COO agenda la reunión y presenta lo entregado. El CEO da el visto bueno.', project_id: p.id, dept: '', assignee: coo || ceo, accountable: ceo === coo ? '' : ceo, due: plus(qaDue, 1), status: 'Por empezar' });
  out.push({ key: 'deliver', after: ['meet'], title: 'Entregar al cliente', description: 'Entrega lo aprobado al cliente y deja constancia en su portal.', project_id: p.id, dept: '', assignee: coo || ceo, accountable: ceo === coo ? '' : ceo, due: plus(qaDue, 2), status: 'Por empezar' });
  return out;
}

// Crea las tareas en orden y guarda de quién depende cada una (`depends_on` = ids).
export async function createLinked(list, create) {
  const ids = {}, made = [], left = [...list];
  while (left.length) { // primero las que no esperan a nadie que falte crear
    const i = Math.max(0, left.findIndex((t) => (t.after || []).every((k) => k in ids || !left.some((x) => x.key === k))));
    const { key, after = [], ...t } = left.splice(i, 1)[0];
    const doc = await create({ checklist: [], comments: [], visibility: 'all', ...t, depends_on: after.map((k) => ids[k]).filter(Boolean) });
    if (key) ids[key] = doc.id; made.push(doc);
  }
  return made;
}
// Lo que frena una tarea: sus dependencias que todavía no están hechas.
export const blockersOf = (t, tasks) => (t?.depends_on || []).map((id) => tasks.find((x) => x.id === id)).filter((x) => x && x.status !== 'Hecha');
export const unlocksOf = (t, tasks) => tasks.filter((x) => (x.depends_on || []).includes(t.id));

// ---------- Reuniones por tipo de proyecto ----------
// Son las del plan: cuándo, quiénes, de qué se habla y qué se aprueba. Día = día desde que arranca.
// [reunión, día, quiénes, temas, qué se aprueba]
export const WHO = { ceo: 'CEO', coo: 'COO', ads: 'Ads', content: 'Content', video: 'Editor de video', finance: 'Finance', prod: 'Producción', especialista: 'Especialista', cliente: 'Cliente' };
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
// Nivel 3 (básico): menos que el sencillo. Si no tiene horas propias, usa el 60% del nivel 5.
const h3Of = (t) => (t.hours3 == null || t.hours3 === '' ? Math.max(0.5, Math.round((+t.hours || 0) * 0.6 * 2) / 2) : +t.hours3);
export const hoursAt = (t, lv = 5) => { const h5 = +t.hours || 0; if (lv < 5) { const h3 = h3Of(t); return Math.round((h3 + ((h5 - h3) * (lv - 3)) / 2) * 2) / 2; } const h10 = t.hours10 == null || t.hours10 === '' ? h5 * 2 : +t.hours10; return Math.round((h5 + ((h10 - h5) * (lv - 5)) / 5) * 2) / 2; };
export const svcHours = (s, lv = s.level || 5) => (s.tasks || []).reduce((a, t) => a + hoursAt(t, lv), 0);
// Costo por hora de un rol según el nivel: «rate» es el del nivel 5; rate3 y rate10 son opcionales (si faltan, igual al 5).
export function rateAt(rates, role, lv = 5) {
  const r = rates?.roles?.find((x) => x.role === role); if (!r || r.rate == null) return null;
  const r5 = +r.rate, r3 = r.rate3 == null || r.rate3 === '' ? r5 : +r.rate3, r10 = r.rate10 == null || r.rate10 === '' ? r5 : +r.rate10;
  return lv < 5 ? r3 + ((r5 - r3) * (lv - 3)) / 2 : r5 + ((r10 - r5) * (lv - 5)) / 5;
}
export function svcCost(s, rates, lv = s.level || 5) {
  if (!rates) return null;
  const rate = (role) => rateAt(rates, role, lv); const miss = [];
  const cost = (s.tasks || []).reduce((a, t) => { const r = rate(t.role); if (r == null) miss.push(t.role); return a + (r || 0) * hoursAt(t, lv); }, 0);
  return { cost, miss };
}
// Margen objetivo (en %): el precio sale del costo, así todos los servicios y niveles dejan el mismo margen.
export const marginOf = (rates) => { const m = +rates?.margin; return m >= 1 && m <= 95 ? m : 75; };
const r50 = (n) => Math.round(n / 50) * 50;
// Precio automático: horas del experto × costo por hora × multiplicador × complejidad del nivel.
export function svcAuto(s, rates, lv = s.level || 5) { const c = svcCost(s, rates, lv); return c && !c.miss.length && c.cost ? r50(c.cost / (1 - marginOf(rates) / 100)) : null; }
// Los precios de los 8 niveles (3 a 10), para que el equipo (que no ve costos) también los vea.
export const pricesOf = (s, rates) => { const o = {}; for (let lv = 3; lv <= 10; lv++) { const p = svcAuto(s, rates, lv); if (p == null) return null; o[lv] = p; } return o; };
// El precio de un servicio en un nivel: fijo (si se escribió uno, escala con las horas), o el automático guardado.
export const svcPrice = (s, lv = s.level || 5) => { const base = svcHours(s, s.level || 5), fixed = s.price_fixed ?? (s.prices ? null : s.price);
  if (fixed) return base ? r50((fixed * svcHours(s, lv)) / base) : +fixed; return s.prices?.[lv] ?? null; };
// Qué crecimiento causa un servicio y sobre qué se cobra su %.
export const GROWTH = { Ventas: 'las ventas nuevas atribuidas', Leads: 'las ventas que vengan de los leads generados', 'Ticket promedio': 'el aumento del ticket promedio', Recompra: 'las ventas de recompra atribuidas', Conversión: 'las ventas extra por mejor conversión', 'Ahorro de costos': 'el ahorro mensual que genere' };
export const growthText = (g) => (g?.type && +g.pct ? `${+g.pct}% de ${GROWTH[g.type] || g.type.toLowerCase()}` : '');
// El perfil de trabajo que suele cubrir cada rol del catálogo (para asignar las tareas del proyecto Custom).
export const roleToWork = (r) => (/pauta|\bads\b|anuncio|campaña/i.test(r) ? 'ads' : /video|edici/i.test(r) ? 'video' : /producci|grabaci|foto/i.test(r) ? 'prod' : /financ|contab/i.test(r) ? 'finance' : /estrateg|ceo/i.test(r) ? 'ceo' : /conten|creativ|diseñ|community|copy|operador/i.test(r) ? 'content' : 'coo');
// Qué incluye un servicio en cada nivel: lo del sencillo siempre, y lo del fuerte se va sumando al subir.
const lines = (t) => String(t || '').split('\n').map((x) => x.replace(/^[-•·\s]+/, '').trim()).filter(Boolean);
export function includesAt(s, lv = s.level || 5) {
  const base = lines(s.includes5), extra = lines(s.includes10);
  if (lv < 5) { const b3 = lines(s.includes3); return b3.length ? b3 : base.slice(0, Math.max(2, Math.ceil(base.length * 0.6))); }
  return [...base, ...extra.slice(0, Math.round(((lv - 5) / 5) * extra.length))];
}
// Cuánto tarda (días hábiles): de los días en nivel 5 a los de nivel 10.
export const daysAt = (s, lv = s.level || 5) => { const d5 = +s.days5 || 0, d10 = +s.days10 || d5; if (lv < 5) return d5 ? (+s.days3 || Math.max(1, Math.round(d5 * 0.6))) : null; return d5 ? Math.round(d5 + ((d10 - d5) * (lv - 5)) / 5) : null; };

// ---------- Onboarding del cliente: lo que necesitamos de él, según lo que contrató ----------
// Cada servicio del catálogo dice qué necesita (campo «onboarding»); los tipos de proyecto traen lo básico.
export const ONBOARDING = {
  'Ciclo mensual': ['Acceso a tus redes: agrega a Inherent como admin en Meta Business Suite y TikTok', 'Tu logo, tipografías y manual de marca (o lo que tengas)', 'Fotos y videos de tu producto o servicio', 'Quién aprueba el contenido de tu lado', 'Días y horarios para grabar'],
  Growth: ['Ventas de los últimos 12 meses, por mes y por línea', 'Tus costos fijos y variables (o tu estado de resultados)', 'Acceso de lectura a tu contabilidad o punto de venta', 'Tus precios y paquetes de hoy', 'Quién decide de tu lado'],
  Proyecto: ['Quién decide de tu lado', 'Lo que ya tienes: referencias, materiales y accesos'],
};
export function onboardingFor(kind, services = []) {
  const fromSvc = services.flatMap((s) => lines(s.onboarding));
  const base = kind === 'Custom' ? (fromSvc.length ? fromSvc : ['Quién decide de tu lado']) : [...(ONBOARDING[kind] || []), ...fromSvc];
  return [...new Set(base)].map((t) => ({ t, done: false, note: '' }));
}
