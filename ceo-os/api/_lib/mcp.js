// El conector de Claude (MCP) de Inherent OS. Cada persona tiene SU link (Team → Mi perfil →
// «Conectar con Claude»): Claude actúa como esa persona y solo ve y hace lo que su perfil permite.
// Es para consultas y cosas puntuales (pendientes, una cotización, armar un proyecto), no trabajo pesado.
import crypto from 'node:crypto';
import * as db from './db.js';
import { userFor, areasFor } from './access.js';
import { readFile, listDir } from './gh.js';
import { parsePlanContratado } from './parse.js';
import * as content from './content.js';
import * as flow from './flow.js';
import { phasesFor, meetingsFor, tasksFor, holders, roleToWork, DEPTS, hoursAt, svcHours, svcCost, svcPrice, includesAt, daysAt, addDays } from '../../public/js/cycle.js';

export const tokenHash = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
export async function newToken(email) {
  const t = crypto.randomBytes(24).toString('base64url');
  const me = await db.get('team', email);
  if (me?.mcp_hash) await db.vaultSet('mcp:' + me.mcp_hash, '');
  const h = tokenHash(t);
  await db.vaultSet('mcp:' + h, email);
  await db.upsert('team', email, { mcp_hash: h, mcp_at: new Date().toISOString() }, email);
  return t;
}
export async function revoke(email) {
  const me = await db.get('team', email);
  if (me?.mcp_hash) await db.vaultSet('mcp:' + me.mcp_hash, '');
  await db.upsert('team', email, { mcp_hash: null, mcp_at: null }, email);
}
export async function userOf(email) {
  if (!email) return null;
  const u = await userFor(email);
  return u.active && u.role !== 'client' ? { ...u, areas: areasFor(u.role, u.roles) } : null;
}
async function userOfToken(t) {
  if (!/^[\w-]{20,60}$/.test(String(t || ''))) return null;
  return userOf(await db.vaultGet('mcp:' + tokenHash(t)));
}

const slugOk = (s) => /^[\w-]{2,60}$/.test(String(s || ''));
const today = () => new Date().toISOString().slice(0, 10);
const seesTask = (u, t) => { const vis = t?.visibility || 'all'; if (vis === 'all') return true; return [t._meta?.created_by, t.assignee, ...(vis === 'people' ? [t.accountable, ...(t.viewers || [])] : [])].filter(Boolean).map((x) => String(x).toLowerCase()).includes(u.email); };
const pick = (t, ps = []) => ({ id: t.id, titulo: t.title, estado: t.status || 'Por empezar', persona: t.assignee || '', vence: t.due || '', proyecto: ps.find((p) => p.id === t.project_id)?.name || '', depto: t.dept || '' });
const priceAt = (s, lv, rates) => svcPrice(s, lv) ?? (() => { const c = svcCost(s, rates, lv); return c && !c.miss.length && c.cost ? Math.round((c.cost * (+s.markup || 2.2)) / 50) * 50 : null; })();
const teamOf = async () => (await db.list('team')).filter((p) => p.role !== 'client' && p.active !== false).map((p) => ({ ...p, email: p.email || p.id }));

// [nombre, área que hace falta (null = todos), descripción, esquema]
const TOOLS = [
  ['mis_pendientes', null, 'Lo que tengo que hacer: tareas atrasadas, de hoy y de la semana, y mis próximas reuniones.', {}],
  ['tareas', 'work', 'Busca tareas. Filtros opcionales: persona (correo), estado (Por empezar, En curso, En revisión, Hecha), cliente (slug).', { persona: { type: 'string' }, estado: { type: 'string' }, cliente: { type: 'string' } }],
  ['crear_tarea', 'work', 'Crea una tarea. Si no se dice persona, es para mí.', { titulo: { type: 'string' }, persona: { type: 'string', description: 'correo' }, vence: { type: 'string', description: 'AAAA-MM-DD' }, proyecto_id: { type: 'string' }, descripcion: { type: 'string' } }, ['titulo']],
  ['actualizar_tarea', 'work', 'Cambia el estado o la fecha de una tarea, o le deja un comentario.', { id: { type: 'string' }, estado: { type: 'string', enum: ['Por empezar', 'En curso', 'En revisión', 'Hecha'] }, vence: { type: 'string' }, comentario: { type: 'string' } }, ['id']],
  ['clientes', 'operations', 'Los clientes de Inherent con su plan.', {}],
  ['cliente', 'clients', 'Todo de un cliente: roadmap (metas y checkpoints), proyectos, reuniones y tareas.', { slug: { type: 'string' } }, ['slug']],
  ['resumen', 'operations', 'Panorama: proyectos activos, tareas abiertas por persona y próximas reuniones.', {}],
  ['catalogo', 'sales', 'Los servicios que vendemos: qué incluyen y cuánto tardan y cuestan en nivel 5 (sencillo), 8 y 10 (fuerte).', {}],
  ['crear_cotizacion', 'sales', 'Arma una cotización con servicios del catálogo y su nivel de entrega (5 sencillo a 10 fuerte). El precio lo calcula la app.', { cliente: { type: 'string' }, contacto: { type: 'string' }, servicios: { type: 'array', items: { type: 'object', properties: { servicio: { type: 'string', description: 'nombre o id del catálogo' }, nivel: { type: 'number' }, cantidad: { type: 'number' } }, required: ['servicio'] } }, moneda: { type: 'string', description: 'código ISO, ej. GTQ o USD' }, notas: { type: 'string' } }, ['cliente', 'servicios']],
  ['crear_proyecto', 'operations', 'Crea un proyecto con sus fases, reuniones y tareas. Tipo: Ciclo mensual, Proyecto, Growth o Custom (Custom sale de una cotización).', { cliente: { type: 'string', description: 'slug del cliente, o inherent' }, tipo: { type: 'string', enum: ['Ciclo mensual', 'Proyecto', 'Growth', 'Custom'] }, inicio: { type: 'string', description: 'AAAA-MM-DD' }, cotizacion_id: { type: 'string' }, nombre: { type: 'string' } }, ['cliente', 'tipo']],
  ['contenido_semana', 'content', 'Lo que encontró el scraper para un perfil: ganadores del nicho, referentes, competencia y lo propio.', { perfil: { type: 'string' } }, ['perfil']],
  ['planner', 'content', 'El planner de un perfil: piezas con fecha, pilar y estado; pilares, audiencia, referentes y competencia.', { perfil: { type: 'string' }, mes: { type: 'string', description: 'AAAA-MM' } }, ['perfil']],
  ['crear_idea', 'content', 'Agrega una idea al planner de un perfil.', { perfil: { type: 'string' }, titulo: { type: 'string' }, formato: { type: 'string', enum: ['Reel', 'Carrusel', 'TikTok', 'Story', 'Estático', 'YouTube'] }, pilar: { type: 'string' }, texto: { type: 'string' }, fecha: { type: 'string' } }, ['perfil', 'titulo', 'formato']],
];
const toolsFor = (u) => TOOLS.filter(([, a]) => !a || u.areas.includes(a)).map(([name, , description, properties, required]) => ({ name, description, inputSchema: { type: 'object', properties, ...(required ? { required } : {}) } }));

async function call(u, name, a = {}) {
  const tool = TOOLS.find((t) => t[0] === name); if (!tool) throw new Error('Herramienta desconocida');
  if (tool[1] && !u.areas.includes(tool[1])) throw new Error('Tu perfil no tiene acceso a esto');
  const T = today();
  if (name === 'mis_pendientes') {
    const [tasks, projects, team] = await Promise.all([db.list('tasks'), db.list('projects'), teamOf()]);
    const mine = tasks.filter((t) => t.assignee === u.email && t.status !== 'Hecha' && seesTask(u, t));
    const wk = addDays(T, 7); const who = holders(team, u.email);
    const meetings = projects.flatMap((p) => (p.meetings || []).filter((m) => m.status !== 'hecha' && m.date >= T && m.date <= wk && (m.who || []).some((r) => who(r) === u.email)).map((m) => ({ fecha: m.date, reunion: m.name, cliente: p.client || p.name, temas: m.topics, aprueba: m.approves || '' })));
    return { hoy: T, atrasadas: mine.filter((t) => t.due && t.due < T).map((t) => pick(t, projects)), hoy_vencen: mine.filter((t) => t.due === T).map((t) => pick(t, projects)), esta_semana: mine.filter((t) => t.due > T && t.due <= wk).map((t) => pick(t, projects)), sin_fecha: mine.filter((t) => !t.due).map((t) => pick(t, projects)), en_revision_esperando_mi_ok: tasks.filter((t) => t.accountable === u.email && t.status === 'En revisión').map((t) => pick(t, projects)), reuniones: meetings };
  }
  if (name === 'tareas') {
    const [tasks, projects] = await Promise.all([db.list('tasks'), db.list('projects')]);
    const pid = a.cliente ? new Set(projects.filter((p) => p.client_slug === a.cliente).map((p) => p.id)) : null;
    return tasks.filter((t) => seesTask(u, t) && (!a.persona || t.assignee === a.persona) && (!a.estado || (t.status || 'Por empezar') === a.estado) && (!pid || pid.has(t.project_id))).slice(0, 150).map((t) => pick(t, projects));
  }
  if (name === 'crear_tarea') {
    if (!String(a.titulo || '').trim()) throw new Error('Falta el título');
    const t = await db.create('tasks', { title: String(a.titulo).slice(0, 200), assignee: a.persona || u.email, due: /^\d{4}-\d{2}-\d{2}$/.test(a.vence || '') ? a.vence : '', project_id: a.proyecto_id || '', description: String(a.descripcion || '').slice(0, 4000), status: 'Por empezar', visibility: 'all', checklist: [], comments: [] }, u.email);
    return { ok: true, id: t.id, titulo: t.title, para: t.assignee };
  }
  if (name === 'actualizar_tarea') {
    const t = await db.get('tasks', String(a.id || '')); if (!t || !seesTask(u, t)) throw new Error('No encontré esa tarea');
    if (![t.assignee, t.accountable, t._meta?.created_by].includes(u.email) && !['ceo', 'coo'].includes(u.role)) throw new Error('Solo quien la hace, quien la revisa o el COO/CEO la pueden cambiar');
    const patch = { ...t };
    if (a.estado) patch.status = a.estado;
    if (/^\d{4}-\d{2}-\d{2}$/.test(a.vence || '')) patch.due = a.vence;
    if (a.comentario) patch.comments = [...(t.comments || []), { who: u.name, at: new Date().toISOString(), text: String(a.comentario).slice(0, 2000) }];
    const r = await db.update('tasks', t.id, patch, t.v, u.email); if (!r) throw new Error('Alguien la cambió justo ahora; intenta de nuevo');
    return { ok: true, id: r.id, estado: r.status, vence: r.due || '' };
  }
  if (name === 'clientes') {
    const dirs = (await listDir('clients')).filter((d) => d.type === 'dir' && !d.name.startsWith('_'));
    return Promise.all(dirs.map(async (d) => { const f = await readFile(`clients/${d.name}/00-onboarding/plan-contratado.md`); return { slug: d.name, plan: f ? parsePlanContratado(f.content, 'team').plan || '' : 'en onboarding' }; }));
  }
  if (name === 'cliente') {
    const slug = String(a.slug || ''); if (!slugOk(slug)) throw new Error('slug inválido');
    const [acc, projects, tasks] = await Promise.all([db.get('accounts', 'acc-' + slug), db.list('projects'), db.list('tasks')]);
    const ps = projects.filter((p) => p.client_slug === slug);
    return { slug, roadmap: acc?.goals || acc?.roadmap || [], drive: acc?.drive_dirs || null, proyectos: ps.map((p) => ({ id: p.id, nombre: p.name, tipo: p.kind, fases: p.phases, reuniones: p.meetings || [], servicios: (p.services || []).map(({ name, level, days, includes }) => ({ name, level, days, includes })) })), tareas: tasks.filter((t) => seesTask(u, t) && ps.some((p) => p.id === t.project_id)).map((t) => pick(t, ps)) };
  }
  if (name === 'resumen') {
    const [projects, tasks] = await Promise.all([db.list('projects'), db.list('tasks')]);
    const open = tasks.filter((t) => seesTask(u, t) && t.status !== 'Hecha'); const by = {}; open.forEach((t) => { by[t.assignee || 'sin asignar'] = (by[t.assignee || 'sin asignar'] || 0) + 1; });
    return { proyectos_activos: projects.filter((p) => (p.phases || []).some((x) => x.status !== 'done')).map((p) => ({ id: p.id, nombre: p.name, tipo: p.kind, cliente: p.client_slug || '' })), tareas_abiertas: open.length, atrasadas: open.filter((t) => t.due && t.due < T).length, por_persona: by,
      proximas_reuniones: projects.flatMap((p) => (p.meetings || []).filter((m) => m.status !== 'hecha' && m.date >= T).map((m) => ({ fecha: m.date, reunion: m.name, cliente: p.client || p.name, quienes: m.who }))).sort((x, z) => x.fecha.localeCompare(z.fecha)).slice(0, 10) };
  }
  if (name === 'catalogo') {
    const [services, rates] = await Promise.all([db.list('services'), db.get('rates', 'default')]);
    return services.map((s) => ({ id: s.id, nombre: s.name, categoria: s.category || '', unidad: s.unit || 'proyecto', niveles: [5, 8, 10].map((lv) => ({ nivel: lv, precio_q: priceAt(s, lv, rates), horas: svcHours(s, lv), dias: daysAt(s, lv), incluye: includesAt(s, lv), ...(u.role === 'ceo' ? { costo_q: svcCost(s, rates, lv)?.cost ?? null } : {}) })) }));
  }
  if (name === 'crear_cotizacion') {
    const [services, rates, quotes] = await Promise.all([db.list('services'), db.get('rates', 'default'), db.list('quotes')]);
    const items = []; const faltan = [];
    for (const x of Array.isArray(a.servicios) ? a.servicios : []) {
      const k = String(x.servicio || '').toLowerCase(); const s = services.find((y) => y.id === x.servicio) || services.find((y) => y.name.toLowerCase() === k) || services.find((y) => y.name.toLowerCase().includes(k));
      if (!s) { faltan.push(x.servicio); continue; }
      const lv = Math.max(5, Math.min(10, Math.round(+x.nivel || s.level || 5))); const price = priceAt(s, lv, rates);
      if (price == null) faltan.push(`${s.name} (no tiene precio en el catálogo)`);
      items.push({ service_id: s.id, name: s.name, description: s.description || '', qty: Math.max(1, +x.cantidad || 1), level: lv, price });
    }
    if (!items.length) throw new Error('No encontré esos servicios en el catálogo' + (faltan.length ? ': ' + faltan.join(', ') : ''));
    const y = new Date().getFullYear(); const number = `COT-${y}-${String(quotes.filter((q) => String(q.number || '').startsWith(`COT-${y}-`)).length + 1).padStart(3, '0')}`;
    const cur = /^[A-Z]{3}$/.test(String(a.moneda || '').toUpperCase()) ? String(a.moneda).toUpperCase() : 'GTQ';
    const q = await db.create('quotes', { number, date: T, valid_days: 15, status: 'Borrador', discount_pct: 0, items, notes: String(a.notas || '').slice(0, 2000), client: String(a.cliente).slice(0, 120), contact: String(a.contacto || '').slice(0, 120), currency: cur, rate: cur === 'GTQ' ? 1 : null }, u.email);
    const total = items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
    return { ok: true, id: q.id, numero: number, total_q: total, moneda: cur, ...(cur !== 'GTQ' ? { aviso: 'Abre la cotización en la app para fijar el tipo de cambio.' } : {}), servicios: items.map((i) => ({ servicio: i.name, nivel: i.level, cantidad: i.qty, precio_q: i.price })), ...(faltan.length ? { revisar: faltan } : {}), abrir: '/#/sales/quotes' };
  }
  if (name === 'crear_proyecto') {
    const slug = String(a.cliente || ''); if (!slugOk(slug)) throw new Error('cliente inválido');
    const kind = ['Ciclo mensual', 'Proyecto', 'Growth', 'Custom'].includes(a.tipo) ? a.tipo : 'Proyecto';
    const start = /^\d{4}-\d{2}-\d{2}$/.test(a.inicio || '') ? a.inicio : T;
    const quote = a.cotizacion_id ? await db.get('quotes', a.cotizacion_id) : null;
    if (kind === 'Custom' && !quote) throw new Error('Para un proyecto Custom dime la cotizacion_id');
    const { project: p, tasks: made } = await flow.createProject(u, { slug, kind, start, quote, name: a.nombre });
    return { ok: true, id: p.id, nombre: p.name, fases: p.phases.map((f) => `${f.name} (${f.start} → ${f.end})`), reuniones: p.meetings.length, tareas: made.length, con_dependencias: made.filter((t) => t.depends_on?.length).length, abrir: '/#/control' };
  }
  if (name === 'contenido_semana') {
    const slug = String(a.perfil || ''); if (!slugOk(slug)) throw new Error('perfil inválido');
    const r = (await db.get('sources', 'scrape-' + slug))?.result; if (!r) return { aviso: 'Este perfil todavía no tiene scrape.' };
    const slim = (l = []) => l.map((x) => ({ cuenta: '@' + x.handle, tipo: x.kind, url: x.url, texto: x.text, vistas: x.views, likes: x.likes, veces_su_promedio: x.x, fecha: x.at }));
    return { semana: r.week, ganadores: slim(r.top), referentes: slim(r.refs), competencia: slim(r.comp), propios: slim((r.own || []).slice(0, 10)) };
  }
  if (name === 'planner') {
    const slug = String(a.perfil || ''); if (!slugOk(slug)) throw new Error('perfil inválido');
    const [posts, c] = await Promise.all([db.list('content'), content.cfg(slug)]);
    return { pilares: c.pillars, audiencia: c.audience, referentes: c.accounts.filter((x) => x.kind === 'referente').map((x) => '@' + x.handle), competencia: c.accounts.filter((x) => x.kind !== 'referente').map((x) => '@' + x.handle),
      piezas: posts.filter((p) => p.kind === 'post' && p.profile === slug && (!a.mes || String(p.date || '').startsWith(a.mes))).map((p) => ({ titulo: p.title, formato: p.format, pilar: p.pillar || '', fecha: p.date || '', estado: p.status || 'Idea', en_drive: Boolean(p.drive_id || p.url) })) };
  }
  if (name === 'crear_idea') {
    const slug = String(a.perfil || ''); if (!slugOk(slug) || !String(a.titulo || '').trim()) throw new Error('Faltan perfil o título');
    const p = await db.create('content', { kind: 'post', profile: slug, title: String(a.titulo).slice(0, 200), format: a.formato || 'Reel', pillar: a.pilar || '', caption: String(a.texto || '').slice(0, 4000), date: /^\d{4}-\d{2}-\d{2}$/.test(a.fecha || '') ? a.fecha : '', status: 'Idea' }, u.email);
    return { ok: true, id: p.id, titulo: p.title };
  }
  throw new Error('Herramienta desconocida');
}

// JSON-RPC del protocolo MCP (HTTP). Devuelve { status, json } para la ruta.
export async function handle(token, m) {
  const u = await userOfToken(token); if (!u) return { status: 401, json: { error: 'Link inválido o revocado. Conecta de nuevo con https://<app>/mcp' } };
  return run(u, m);
}
// Lo que responde el servidor MCP a una persona ya identificada (por OAuth o por el link viejo).
export async function run(u, m, base = '') {
  if (!m || m.id === undefined) return { status: 202 };
  const ok = (result) => ({ status: 200, json: { jsonrpc: '2.0', id: m.id, result } });
  if (m.method === 'initialize') return ok({ protocolVersion: m.params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'inherent-os', title: 'Inherent OS', version: '1.2.0', ...(base ? { websiteUrl: base, icons: [{ src: `${base}/brand/icon-512.png`, mimeType: 'image/png', sizes: ['512x512'] }, { src: `${base}/brand/emblem-dark.svg`, mimeType: 'image/svg+xml', sizes: ['any'] }] } : {}) }, instructions: `Inherent OS de ${u.name} (${u.role}). Úsalo para ver pendientes, tareas, clientes y contenido, y para crear tareas, ideas, cotizaciones o proyectos. Fechas en formato AAAA-MM-DD; hoy es ${today()}. Precios en quetzales salvo que se diga otra moneda.` });
  if (m.method === 'ping') return ok({});
  if (m.method === 'tools/list') return ok({ tools: toolsFor(u) });
  if (m.method === 'tools/call') {
    try { return ok({ content: [{ type: 'text', text: JSON.stringify(await call(u, m.params?.name, m.params?.arguments || {}), null, 1) }] }); }
    catch (e) { return ok({ content: [{ type: 'text', text: e.message }], isError: true }); }
  }
  return { status: 200, json: { jsonrpc: '2.0', id: m.id, error: { code: -32601, message: 'Método no soportado' } } };
}
