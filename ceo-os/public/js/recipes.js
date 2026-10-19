// Las recetas: cómo se arma el trabajo de Inherent, como datos que el CEO edita (Administración → Recetas).
// Las comparten el servidor (flow.js, recurring.js, mcp.js) y la interfaz; la misma regla en los dos lados.
//
// Una receta tiene un tipo:
//   proyecto   el trabajo de un tipo de proyecto (Ciclo mensual, Growth, Proyecto, Custom)
//   servicio   el trabajo de un servicio del catálogo (service_id); al activar un paquete o una cotización, sus tareas salen de aquí
//   paquete    las responsabilidades propias de un paquete (bundle_id), además de las de sus servicios; salen al activar ese paquete
//   interna    una responsabilidad recurrente de Inherent (semanal, mensual, fecha fija) que genera tareas tipo Interna
// y trae sus tareas (título, perfil, quién revisa, día, horas, SOP, tipo y de qué dependen), sus reuniones
// y lo que se le pide al cliente. Las recetas de siempre son los valores por defecto: si nadie las edita, todo sigue igual.
// Las ediciones se guardan en la colección `recipes` (mismo id que la receta de siempre = la reemplaza).

export const iso = (d) => d.toISOString().slice(0, 10);
export const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); };
// n días hábiles después de `s` (lunes a viernes).
export const workdays = (s, n) => { const d = new Date(s + 'T12:00'); let k = 0; while (k < n) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) k++; } return iso(d); };

export const RECIPE_TYPES = [['proyecto', 'Proyecto'], ['servicio', 'Servicio'], ['paquete', 'Paquete'], ['interna', 'Interna recurrente']];
export const KINDS = ['Ciclo mensual', 'Growth', 'Proyecto', 'Custom'];
// Los perfiles que pueden hacer o revisar una tarea (los de Team + «prod», que sale del cargo de producción).
export const RECIPE_ROLES = [['ceo', 'CEO'], ['coo', 'COO'], ['content', 'Content'], ['video', 'Editor de video'], ['prod', 'Producción'], ['ads', 'Ads'], ['finance', 'Finance'], ['cobros', 'Cobros'], ['ventas', 'Ventas']];
export const WHO = { ceo: 'CEO', coo: 'COO', ads: 'Ads', content: 'Content', video: 'Editor de video', finance: 'Finance', prod: 'Producción', especialista: 'Especialista', cliente: 'Cliente' };
export const TASK_TIPOS = ['Delivery', 'Comercial', 'Interna', 'Personal'];
export const DEPT_CODES = ['①', '②', '②B', '③', '④', '⑤', '⑥A', '⑦', '⑧', '⑨', '⑩'];
export const DOW = [['1', 'lunes'], ['2', 'martes'], ['3', 'miércoles'], ['4', 'jueves'], ['5', 'viernes'], ['6', 'sábado'], ['7', 'domingo']];
export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// ---------- Las recetas de siempre ----------
// [clave, título, día, perfil, quién revisa, de qué depende]. «día» = día del ciclo en que vence.
const T = (key, title, day, role, reviewer, after = [], extra = {}) => ({ key, title, dept: DEPT_CODES.includes(key) ? key : '', day, role, reviewer, hours: 0, sop: '', tipo: 'Delivery', after, desc: '', ...extra });
const CICLO_DEPTS = [
  T('①', 'Reunión del día 1 y estrategia del ciclo', 3, 'ceo', ''),
  T('②', 'Elegir las ofertas que se empujan este ciclo', 3, 'ceo', '', ['①']),
  T('②B', 'Brand guidelines del ciclo', 6, 'content', 'coo', ['①']),
  T('③', 'Plan del ciclo: pilares, campañas y calendario', 3, 'ceo', '', ['①']),
  T('④', 'Ideas, guiones y shot list', 3, 'content', 'coo', ['③']),
  T('⑤', 'Producción: grabación y fotos (último día: 11)', 11, 'prod', 'coo', ['④']),
  T('⑥A', 'Diseño: estáticos, carruseles y stories', 15, 'content', 'coo', ['⑤']),
  T('⑦', 'Edición: reels y derivados', 15, 'video', 'coo', ['⑤']),
  T('⑧', 'Community: ficha y respuestas al día', 19, 'content', 'coo', ['⑨']),
  T('⑨', 'Posting: captions y programación', 19, 'content', 'coo', ['⑥A', '⑦']),
  T('⑩', 'Ads: plan y presupuesto para aprobar', 19, 'ads', 'ceo', ['③']),
];
const CICLO_FIN = [
  { ...T('QA', 'QA final del ciclo', 19, 'coo', '', ['⑥A', '⑦', '⑨', '⑧']), dept: '' },
  { ...T('PRES', 'Presentación al cliente (día 20)', 20, 'ceo', '', ['QA']), dept: '①' },
];
const GROWTH = [['Diagnóstico: números y mapa del negocio', 'finance', 'coo'], ['Auditoría con el especialista', 'finance', 'coo'], ['Plan: ganar más y gastar menos', 'finance', 'coo'], ['Implementación', 'finance', 'coo'], ['Revisión de resultados', 'ceo', '']]
  .map(([title, role, reviewer], i) => ({ ...T('g' + i, title, i * 7 + 7, role, reviewer, i ? ['g' + (i - 1)] : []), dept: '②' }));
const MEET = {
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
const meets = (k) => MEET[k].map(([name, day, who, topics, approves]) => ({ name, day, who, topics, approves }));
const ASK = {
  'Ciclo mensual': ['Acceso a tus redes: agrega a Inherent como admin en Meta Business Suite y TikTok', 'Tu logo, tipografías y manual de marca (o lo que tengas)', 'Fotos y videos de tu producto o servicio', 'Quién aprueba el contenido de tu lado', 'Días y horarios para grabar'],
  Growth: ['Ventas de los últimos 12 meses, por mes y por línea', 'Tus costos fijos y variables (o tu estado de resultados)', 'Acceso de lectura a tu contabilidad o punto de venta', 'Tus precios y paquetes de hoy', 'Quién decide de tu lado'],
  Proyecto: ['Quién decide de tu lado', 'Lo que ya tienes: referencias, materiales y accesos'],
};
// Los checklists del ciclo de cada perfil (el Workspace los marca por mes).
const CHECKS = {
    coo: ['Confirmar alcance, entregables y fechas del ciclo', 'Definir responsable y quién rinde cuentas por tarea', 'Armar dependencias del ciclo (qué espera a qué)', 'Revisar la carga del equipo y resolver bloqueos', 'Validar entregables contra su checklist (QA final)', 'Preparar la presentación del día 20', 'Cerrar el ciclo y documentar aprendizajes'],
    video: ['Abrir calendario y brief vigente del cliente', 'Confirmar formato, objetivo y fecha de entrega', 'Preparar el prompt con la plantilla aprobada', 'Generar el borrador con el agente de video', 'Revisar edición, audio, subtítulos y marca', 'Exportar versiones para orgánico y Ads', 'Subir los finales para QA del COO'],
    content: ['Idea aprobada: enfoque y objetivo', 'Hook y ángulo validados', 'Guion y copy con el tono de la marca', 'Formato y piezas por canal', 'Assets listos: diseño, copy y links', 'Matriz de publicaciones de la semana', 'Static ads del ciclo'],
    ads: ['Brief y objetivo de la campaña (sale del plan ③)', 'Audiencias por plataforma: Meta, Google, LinkedIn', 'Creativos y copies aprobados por ②B Branding', 'Plan y presupuesto → aprobación del CEO (gate ⑩)', 'Píxel y conversiones verificadas', 'Lanzar y revisar a las 48 h', 'Reporte: gasto, CPA y ROAS'],
    finance: ['Leer los números del cliente', 'Mapa del negocio: procesos y equipo', 'Proyecto para que ganen más', 'Proyecto para que gasten menos', 'Entregar el reporte y el plan'],
};
const base = (id, name, kind, extra) => ({ id, name, type: 'proyecto', kind, active: true, unit: 'dia', tasks: [], meetings: [], ask: [], ...extra });
const REC = (id, name, repeat, role, extra = {}) => ({ id, name, type: 'interna', active: false, unit: 'dia', repeat, tasks: [{ ...T('r', name, 1, role, '', [], { tipo: 'Interna' }), ...extra }], meetings: [], ask: [] });

export const DEFAULT_RECIPES = [
  base('ciclo-mensual', 'Ciclo mensual', 'Ciclo mensual', { tasks: [...CICLO_DEPTS, ...CICLO_FIN], meetings: meets('Ciclo mensual'), ask: ASK['Ciclo mensual'], checks: CHECKS }),
  base('growth', 'Business Growth', 'Growth', { tasks: GROWTH, meetings: meets('Growth'), ask: ASK.Growth }),
  base('proyecto', 'Proyecto por fases', 'Proyecto', { tasks: CICLO_DEPTS, meetings: meets('Proyecto'), ask: ASK.Proyecto }),
  // Custom: lo que sale de los servicios va en medio; aquí viven el arranque y el cierre. En el cierre, «día» = días hábiles
  // después de la última entrega de los servicios (2 = el QA).
  base('custom', 'Proyecto custom', 'Custom', { unit: 'habil', tasks: [
    { ...T('kick', 'Kickoff con el cliente: alcance, fechas y material', 0, 'ceo', ''), pos: 'inicio' },
    { ...T('qa', 'QA del COO: revisar los entregables', 2, 'coo', 'ceo', ['*'], { desc: 'Revisa cada entregable contra su checklist y su SOP. Si algo falta, regrésalo a quien lo hizo.' }), pos: 'fin' },
    { ...T('meet', 'Reunión COO + CEO: revisar antes de entregar', 3, 'coo', 'ceo', ['qa'], { desc: 'El COO agenda la reunión y presenta lo entregado. El CEO da el visto bueno.' }), pos: 'fin' },
    { ...T('deliver', 'Entregar al cliente', 4, 'coo', 'ceo', ['meet'], { desc: 'Entrega lo aprobado al cliente y deja constancia en su portal.' }), pos: 'fin' },
  ], meetings: meets('Proyecto'), ask: ['Quién decide de tu lado'] }),
  // Las responsabilidades de Inherent: vienen apagadas; el CEO las enciende en Administración → Recetas.
  REC('rec-gastos', 'Revisar gastos sin comprobante', { freq: 'semanal', dow: 1 }, 'ceo', { desc: 'Revisa en Finanzas los gastos de la semana que no tienen comprobante y pídelo a quien corresponde.' }),
  REC('rec-cierre', 'Cierre del mes {mes}', { freq: 'mensual', from: 1, to: 5 }, 'ceo', { desc: 'Cierra los números del mes anterior: ingresos, gastos y pagos pendientes.' }),
  REC('rec-contador', 'Paquete al contador · {mes}', { freq: 'mensual', from: 5, to: 5 }, 'ceo', { desc: 'Envía al contador facturas, comprobantes y el cierre del mes.' }),
  REC('rec-sat', 'Declaración del SAT · {mes}', { freq: 'mensual', from: 10, to: 10 }, 'ceo', { desc: 'Día de ejemplo: ponle el que marque tu calendario del SAT.' }),
];

// Las recetas que se usan: las de siempre, reemplazadas por las que el CEO editó (mismo id), y las que él agregó.
export function recipesWith(docs = []) {
  const byId = new Map((docs || []).filter((d) => d && d.id).map((d) => [d.id, d]));
  const out = DEFAULT_RECIPES.map((r) => (byId.has(r.id) ? { ...byId.get(r.id), edited: true } : { ...r, edited: false }));
  for (const d of byId.values()) if (!DEFAULT_RECIPES.some((r) => r.id === d.id)) out.push({ ...d, edited: true, own: true });
  return out;
}
export const isDefaultId = (id) => DEFAULT_RECIPES.some((r) => r.id === id);
export const defaultRecipe = (id) => DEFAULT_RECIPES.find((r) => r.id === id) || null;
// La receta de un tipo de proyecto.
export const recipeFor = (R, kind) => (R || DEFAULT_RECIPES).find((r) => r.type === 'proyecto' && r.kind === kind && r.active !== false) || (R || DEFAULT_RECIPES).find((r) => r.type === 'proyecto' && r.kind === 'Proyecto') || DEFAULT_RECIPES[2];
// La receta de un servicio del catálogo (si el CEO la escribió).
export const serviceRecipe = (R, serviceId) => (R || []).find((r) => r.type === 'servicio' && r.service_id === serviceId && r.active !== false && (r.tasks || []).length) || null;
// Las responsabilidades propias de un paquete (si el CEO las escribió).
export const bundleRecipe = (R, bundleId) => (bundleId && (R || []).find((r) => r.type === 'paquete' && r.bundle_id === bundleId && r.active !== false && (r.tasks || []).length)) || null;
export const checksFor = (R, role) => (recipeFor(R, 'Ciclo mensual').checks || CHECKS)[role] || [];

// ---------- Recurrentes: qué fechas toca ----------
// Devuelve las veces que toca entre `from` y `to` (AAAA-MM-DD): { period, start, due }.
// semanal → cada vez que cae ese día de la semana · mensual → del día `from` al `to` de cada mes · anual → ese día de ese mes.
// Una vez toca si todavía no venció (due >= from) y ya empezó o empieza en la ventana (start <= to).
const pad = (n) => String(n).padStart(2, '0');
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
export function occurrences(repeat, from, to) {
  const out = [];
  if (!repeat || !from || !to) return out;
  const push = (period, start, due) => { if (due >= from && start <= to) out.push({ period, start, due }); };
  if (repeat.freq === 'semanal') {
    const dow = Math.min(7, Math.max(1, +repeat.dow || 1));
    for (let d = from, n = 0; d <= to && n < 60; d = addDays(d, 1), n++) { const w = new Date(d + 'T12:00').getDay() || 7; if (w === dow) push(d, d, d); }
  } else if (repeat.freq === 'mensual') {
    const a = Math.min(31, Math.max(1, +repeat.from || 1)), b = Math.min(31, Math.max(a, +repeat.to || a));
    let [y, m] = from.slice(0, 7).split('-').map(Number);
    for (let i = 0; i < 14; i++) { const ld = lastDay(y, m), ym = `${y}-${pad(m)}`; const s = `${ym}-${pad(Math.min(a, ld))}`; if (s > to) break; push(ym, s, `${ym}-${pad(Math.min(b, ld))}`); m++; if (m > 12) { m = 1; y++; } }
  } else if (repeat.freq === 'anual') {
    const m = Math.min(12, Math.max(1, +repeat.month || 1)), y0 = +from.slice(0, 4);
    for (const y of [y0, y0 + 1]) { const d = `${y}-${pad(m)}-${pad(Math.min(Math.max(1, +repeat.day || 1), lastDay(y, m)))}`; push(String(y), d, d); }
  }
  return out;
}
// El texto de la frecuencia, para mostrarla.
export function repeatText(r) {
  if (!r) return '';
  if (r.freq === 'semanal') return `Cada ${DOW.find(([k]) => +k === +r.dow)?.[1] || 'lunes'}`;
  if (r.freq === 'mensual') return +r.to && +r.to !== +r.from ? `Cada mes, del día ${+r.from} al ${+r.to}` : `Cada mes, el día ${+r.from}`;
  if (r.freq === 'anual') return `Cada año, el ${+r.day} de ${MONTHS[(+r.month || 1) - 1]}`;
  return '';
}
// «{mes}» en el título se cambia por el mes de la fecha límite («octubre 2026»).
export const titleFor = (title, due) => String(title || '').replace(/\{mes\}/g, () => { const [y, m] = String(due).slice(0, 7).split('-').map(Number); return `${MONTHS[(m || 1) - 1]} ${y}`; });

// ---------- Validar una receta (servidor y editor) ----------
const sopOk = (v) => { const s = String(v || '').trim(); return /^https?:\/\/\S+$/i.test(s) || /^[\w.@+-]{1,120}$/.test(s) ? s.slice(0, 500) : ''; };
const str = (v, n) => String(v ?? '').trim().slice(0, n);
const list = (v, n, m) => (Array.isArray(v) ? v : []).map((x) => str(x, m)).filter(Boolean).slice(0, n);
const roleOk = (v) => (/^[a-z][\w-]{0,29}$/.test(String(v || '')) ? String(v) : '');
const int = (v, a, z, d) => { const n = Math.round(+v); return Number.isFinite(n) ? Math.min(z, Math.max(a, n)) : d; };
export function cleanRecipe(b) {
  const bad = (m) => { throw Object.assign(new Error(m), { status: 400 }); };
  b = b || {};
  const name = str(b.name, 80); if (!name) bad('La receta necesita un nombre');
  const type = RECIPE_TYPES.some(([k]) => k === b.type) ? b.type : bad('Tipo de receta: proyecto, servicio, paquete o interna');
  const out = { name, type, active: b.active !== false, unit: b.unit === 'habil' ? 'habil' : 'dia', note: str(b.note, 600) };
  if (type === 'proyecto') { out.kind = KINDS.includes(b.kind) ? b.kind : bad('Tipo de proyecto: Ciclo mensual, Growth, Proyecto o Custom'); }
  if (type === 'servicio') { out.service_id = str(b.service_id, 120); if (!out.service_id) bad('Una receta de servicio dice de cuál servicio es'); out.unit = 'habil'; }
  if (type === 'paquete') { out.bundle_id = str(b.bundle_id, 120); if (!out.bundle_id) bad('Una receta de paquete dice de cuál paquete es'); out.unit = 'habil'; }
  if (type === 'interna') {
    const r = b.repeat || {}, f = ['semanal', 'mensual', 'anual'].includes(r.freq) ? r.freq : bad('Frecuencia: semanal, mensual o anual');
    out.repeat = f === 'semanal' ? { freq: f, dow: int(r.dow, 1, 7, 1) } : f === 'mensual' ? (() => { const a = int(r.from, 1, 31, 1); return { freq: f, from: a, to: int(r.to, a, 31, a) }; })() : { freq: f, month: int(r.month, 1, 12, 1), day: int(r.day, 1, 31, 1) };
  }
  const keys = new Set();
  const rows = (Array.isArray(b.tasks) ? b.tasks : []).slice(0, 40);
  out.tasks = rows.map((t, i) => {
    let key = str(t.key, 20).replace(/[^\w①-⑩-]/g, '') || 't' + (i + 1); while (keys.has(key) || key === '*') key += 'x'; keys.add(key);
    const title = str(t.title, 200); if (!title) bad(`La tarea ${i + 1} necesita título`);
    const row = { key, title, dept: DEPT_CODES.includes(t.dept) ? t.dept : '', day: int(t.day, 0, 365, 1), role: roleOk(t.role) || bad(`La tarea «${title}» necesita un perfil`), reviewer: roleOk(t.reviewer), hours: Math.max(0, Math.min(500, Math.round((+t.hours || 0) * 2) / 2)), sop: sopOk(t.sop), tipo: TASK_TIPOS.includes(t.tipo) ? t.tipo : type === 'interna' ? 'Interna' : 'Delivery', after: Array.isArray(t.after) ? t.after.map((x) => str(x, 20)).filter(Boolean).slice(0, 12) : [], desc: str(t.desc, 2000) };
    const ck = list(t.check, 20, 160); if (ck.length) row.check = ck;
    if (t.pos === 'inicio' || t.pos === 'fin') row.pos = t.pos;
    return row;
  });
  // Las dependencias solo apuntan a tareas de la misma receta (o «*» = todo lo anterior).
  // Sin ciclos: una dependencia que cerraría un círculo (A espera a B y B a A) se descarta.
  const edges = {}, reach = (from, to, seen = new Set()) => from === to || (!seen.has(from) && (seen.add(from), (edges[from] || []).some((d) => reach(d, to, seen))));
  out.tasks.forEach((t) => { edges[t.key] = []; t.after = t.after.filter((k) => { if (k === '*') return true; if (k === t.key || !keys.has(k) || reach(k, t.key)) return false; edges[t.key].push(k); return true; }); });
  out.meetings = (Array.isArray(b.meetings) ? b.meetings : []).slice(0, 20).map((m) => ({ name: str(m.name, 120) || bad('Cada reunión necesita nombre'), day: int(m.day, 1, 365, 1), who: (Array.isArray(m.who) ? m.who : []).filter((x) => x in WHO).slice(0, 10), topics: list(m.topics, 12, 200), approves: str(m.approves, 200) }));
  out.ask = list(b.ask, 30, 300);
  if (b.checks && typeof b.checks === 'object') { out.checks = {}; for (const [r, v] of Object.entries(b.checks).slice(0, 12)) { const k = roleOk(r); if (k) out.checks[k] = list(v, 20, 200); } }
  if (type === 'servicio' && !out.tasks.length) bad('Una receta de servicio necesita al menos una tarea');
  if (type === 'paquete' && !out.tasks.length) bad('Una receta de paquete necesita al menos una responsabilidad');
  if (type === 'interna' && !out.tasks.length) bad('Una receta interna necesita su tarea');
  return out;
}
