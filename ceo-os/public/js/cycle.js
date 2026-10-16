// El ciclo de contenido y sus tareas: lo usan el Arranque y el asistente de «+ Proyecto».
// Las tareas, reuniones y lo que se pide al cliente ya no viven aquí: salen de las recetas (recipes.js), que el CEO edita.
import { addDays, workdays, recipeFor, serviceRecipe, DEFAULT_RECIPES, WHO } from './recipes.js';
export { addDays, WHO };
export const CYCLE = [['Reunión día 1', 1, 1], ['Plan', 1, 3], ['Calendario y shot list', 2, 3], ['Brand guidelines', 3, 6], ['Producción', 6, 11], ['Montaje', 12, 15], ['Cambios y programación', 16, 19], ['Presentación al cliente', 20, 20]];
export const PROJECT_PHASES = ['Descubrimiento', 'Estrategia', 'Build', 'Entrega'];
export const GROWTH_PHASES = ['Diagnóstico', 'Auditoría con el especialista', 'Plan', 'Implementación', 'Revisión'];
export const DEPTS = [['①', 'Strategy'], ['②', 'Growth'], ['②B', 'Branding'], ['③', 'Marketing'], ['④', 'Creatividad'], ['⑤', 'Producción'], ['⑥A', 'Diseño gráfico'], ['⑦', 'Video Editing'], ['⑧', 'Community'], ['⑨', 'Posting'], ['⑩', 'Ads']];
export const deptsOfPlan = (c) => (c?.pipeline?.length ? c.pipeline.map((r) => (r.paso.match(/^[①-⑩][A-Z]?/) || [''])[0]).filter(Boolean) : DEPTS.map(([d]) => d));

export function phasesFor(kind, start) {
  if (kind === 'Ciclo mensual') return CYCLE.map(([name, a, z], i) => ({ name, start: addDays(start, a - 1), end: addDays(start, z - 1), status: i === 0 ? 'now' : 'todo' }));
  return (kind === 'Growth' ? GROWTH_PHASES : PROJECT_PHASES).map((name, i) => ({ name, start: addDays(start, i * 7), end: addDays(start, i * 7 + 6), status: i === 0 ? 'now' : 'todo' }));
}
// Quién cubre cada rol. `map` es la tabla rol → persona del proyecto (project.roles_map): si el CEO eligió a alguien para ese rol, gana.
export function holders(team, meEmail, map = null) {
  const holder = (role) => { const p = team.find((x) => x.active !== false && (x.roles || []).includes(role)); return p ? p.email || p.id : null; };
  const prod = () => { const p = team.find((x) => /producci|grabaci/i.test(x.title || '')); return p ? p.email || p.id : holder('content'); };
  // Sin alguien de Ads, la pauta la lleva el CEO.
  const base = (role) => (role === 'prod' ? prod() : holder(role) || (role === 'ads' ? holder('ceo') || meEmail : role === 'ceo' ? meEmail : null));
  return (role) => { const m = map?.[role]; return m && team.some((x) => x.active !== false && (x.email || x.id) === m) ? m : base(role); };
}
// ---------- Las tareas salen de las recetas ----------
// Cada fila de una receta es una tarea con su ficha completa: dueño por perfil, quién revisa, fecha, SOP, tipo,
// horas y de qué depende. `after` son las claves de las tareas que tienen que estar hechas antes.
const DEPT_NAME = Object.fromEntries(DEPTS);
const deptLabel = (code) => (code ? `${code} ${DEPT_NAME[code] || ''}`.trim() : '');
const isDeptRow = (r) => Boolean(r.dept) && r.key === r.dept;
const dueOf = (rec, start, row) => (rec.unit === 'habil' ? workdays(start, Math.max(0, +row.day || 0)) : addDays(start, Math.max(1, +row.day || 1) - 1));
// La ficha de una tarea a partir de su fila.
function ficha(row, p, who, extra = {}) {
  const rev = row.reviewer ? who(row.reviewer) || '' : '';
  return { title: row.title, project_id: p.id, dept: deptLabel(row.dept), role: row.role, assignee: who(row.role) || '', accountable: rev, status: 'Por empezar', tipo: row.tipo || 'Delivery',
    ...(row.sop ? { sop: row.sop } : {}), ...(row.hours ? { hours: row.hours } : {}), ...(row.desc ? { description: row.desc } : {}), ...(row.check?.length ? { checklist: row.check.map((t) => ({ t, done: false })) } : {}), ...extra };
}
// Si un departamento no corre, se salta: se depende de lo que él dependía.
const depsIn = (k, keys, by, seen = new Set()) => { if (seen.has(k)) return []; seen.add(k); return (by[k]?.after || []).filter((d) => d !== '*').flatMap((d) => (keys.has(d) ? [d] : depsIn(d, keys, by, seen))); };

// Las tareas que le faltan a un proyecto (no repite las que ya existen). Cada una trae `key` y `after`
// (las keys de las que depende); `createLinked` las convierte en `depends_on` con los ids reales.
// `R` son las recetas en uso (recipesWith); sin ellas, las de siempre.
export function tasksFor(p, team, existing, meEmail, R) {
  const who = holders(team, meEmail, p.roles_map);
  const s = p.phases?.[0]?.start || new Date().toISOString().slice(0, 10);
  const rec = recipeFor(R, p.kind === 'Growth' || p.line === 'growth' ? 'Growth' : p.kind);
  const mine = (existing || []).filter((t) => t.project_id === p.id);
  const has = (r) => mine.some((t) => (isDeptRow(r) ? new RegExp(`(^|\\s)${r.dept} `).test(t.title + ' ' + (t.dept || '')) : String(t.title || '').startsWith(r.title.split(/[:(]/)[0].trim())));
  const rows = (rec.tasks || []).filter((r) => !r.pos && !(isDeptRow(r) && p.pipeline?.[r.dept]?.status === 'off') && !has(r));
  const by = Object.fromEntries((rec.tasks || []).map((r) => [r.key, r])), keys = new Set(rows.map((r) => r.key));
  return rows.map((r) => ({ key: r.key, after: depsIn(r.key, keys, by), ...ficha(r, p, who, { due: dueOf(rec, s, r), cycle: p.cycle || '' }) }));
}

// Proyecto custom (sale de una cotización o de un paquete): arranque → por cada servicio sus tareas
// (las de su receta, o un rol tras otro: estrategia → contenido/finanzas → producción → edición) → QA, reunión y entrega.
const STAGE = { ceo: 0, content: 1, finance: 1, prod: 2, video: 3, ads: 3, coo: 4 };
export function customTasks(p, items, team, meEmail, R) {
  const who = holders(team, meEmail, p.roles_map), coo = who('coo') || '', ceo = who('ceo') || meEmail;
  let rec = recipeFor(R, 'Custom'); if (!(rec.tasks || []).some((t) => t.pos)) rec = DEFAULT_RECIPES.find((r) => r.id === 'custom');
  const start = p.phases?.[0]?.start || new Date().toISOString().slice(0, 10), end = p.phases?.[p.phases.length - 1]?.end || start;
  const ini = rec.tasks.filter((t) => t.pos === 'inicio'), fin = rec.tasks.filter((t) => t.pos === 'fin');
  const out = ini.map((r) => ({ key: r.key, after: [], ...ficha(r, p, who, { due: workdays(start, Math.max(0, +r.day || 0)), assignee: who(r.role) || ceo }) }));
  const iniKeys = ini.map((r) => r.key);
  items.forEach((i, si) => {
    const sr = serviceRecipe(R, i.id);
    // Con receta del servicio: sus tareas, con su ficha completa y sus dependencias.
    if (sr) {
      const mk = (k) => `s${si}:${k}`, own = (k) => sr.tasks.some((x) => x.key === k);
      sr.tasks.forEach((r) => { const dep = (r.after || []).filter(own); out.push({ key: mk(r.key), after: dep.length ? dep.map(mk) : iniKeys,
        ...ficha({ ...r, title: `${i.name} · ${r.title}` }, p, who, { service_id: i.id, service: i.name, level: i.level, due: workdays(start, Math.max(0, +r.day || 0)), assignee: who(r.role) || meEmail, accountable: r.reviewer ? who(r.reviewer) || coo : coo }) }); });
      return;
    }
    const rows = i.roles.map((r, ri) => ({ r, ri, st: STAGE[roleToWork(r.role)] ?? 1 }));
    // Fechas en escalera: cada etapa vence cuando se acumulan sus horas dentro de lo que tarda el servicio.
    const tot = rows.reduce((a, x) => a + (+x.r.hours || 0), 0) || 1;
    const dueAt = (st) => { if (!i.days) return end; const h = rows.filter((x) => x.st <= st).reduce((a, x) => a + (+x.r.hours || 0), 0); return workdays(start, Math.max(1, Math.round((i.days * h) / tot))); };
    rows.forEach(({ r, ri, st }) => {
      const prev = rows.filter((x) => x.st < st); const top = Math.max(-1, ...prev.map((x) => x.st));
      const role = roleToWork(r.role);
      out.push({ key: `s${si}r${ri}`, after: top < 0 ? iniKeys : prev.filter((x) => x.st === top).map((x) => `s${si}r${x.ri}`), title: `${i.name} · ${r.role}${+r.hours ? ` (${r.hours} h)` : ''}`, service_id: i.id, service: i.name, project_id: p.id, dept: '', role, assignee: who(role) || meEmail, accountable: coo, due: dueAt(st), checklist: (i.includes || []).map((x) => ({ t: x, done: false })), hours: r.hours, level: i.level, status: 'Por empezar', tipo: 'Delivery' });
    });
  });
  const last = out.map((t) => t.due).sort().at(-1);
  const qaDue = items.every((i) => i.days) && last ? workdays(last, 2) : end;
  // Cierre: el COO revisa lo entregado, lo ve con el CEO y se entrega al cliente.
  const body = out.filter((t) => !iniKeys.includes(t.key)).map((t) => t.key);
  fin.forEach((r) => {
    const mine = who(r.role) || '', rev = r.reviewer ? who(r.reviewer) || '' : '';
    out.push({ key: r.key, after: (r.after || []).flatMap((k) => (k === '*' ? body : [k])), ...ficha(r, p, who, { due: workdays(qaDue, Math.max(0, (+r.day || 2) - 2)), assignee: mine || ceo, accountable: rev && rev === mine ? '' : rev }) });
  });
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
// Son las de la receta: cuándo, quiénes, de qué se habla y qué se aprueba. Día = día desde que arranca.
export const meetingsFor = (kind, start, R) => (recipeFor(R, kind).meetings || []).map(({ name, day, who, topics, approves }) => ({ name, date: addDays(start, (+day || 1) - 1), who: [...(who || [])], topics: [...(topics || [])], approves: approves || '', status: 'todo' }));

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
// Cada servicio del catálogo dice qué necesita (campo «onboarding»); la receta del tipo de proyecto trae lo básico.
export function onboardingFor(kind, services = [], R) {
  const fromSvc = services.flatMap((s) => lines(s.onboarding)), ask = recipeFor(R, kind).ask || [];
  const base = kind === 'Custom' ? (fromSvc.length ? fromSvc : ask.length ? ask : ['Quién decide de tu lado']) : [...ask, ...fromSvc];
  return [...new Set(base)].map((t) => ({ t, done: false, note: '' }));
}
