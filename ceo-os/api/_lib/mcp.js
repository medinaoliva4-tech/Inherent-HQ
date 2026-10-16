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
import * as google from './google.js';
import { phasesFor, meetingsFor, tasksFor, holders, roleToWork, DEPTS, hoursAt, svcHours, svcCost, svcPrice, svcAuto, growthText, includesAt, daysAt, addDays } from '../../public/js/cycle.js';

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
// El mismo precio que la app: automático (horas × costo/h × multiplicador × complejidad) salvo que tenga precio fijo.
const priceAt = (s, lv, rates) => (!s.price_fixed && !(s.price && !s.prices) ? svcAuto(s, rates, lv) : null) ?? svcPrice(s, lv);
const growthOf = (s) => (s.growth_type ? { type: s.growth_type, pct: +s.growth_pct || 10, how: s.growth_how || '' } : null);
const teamOf = async () => (await db.list('team')).filter((p) => p.role !== 'client' && p.active !== false).map((p) => ({ ...p, email: p.email || p.id }));

// Library: los tipos de documento (los mismos de la pantalla) y los formatos de archivo más comunes.
const KINDS = ['SOP', 'Playbook', 'Entrevista', 'Prompt', 'Diagrama', 'Video', 'Nota'];
// Research: los tipos de formato (los mismos de la pantalla).
const STYLES = ['montaje', 'talking head', 'una toma', 'day in the life', 'voz en off + b-roll', 'meme + montaje', 'lista/tutorial', 'antes-después', 'POV', 'otro'];
const MIMES = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', csv: 'text/csv', txt: 'text/plain', md: 'text/markdown', json: 'application/json', html: 'text/html', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', mp4: 'video/mp4', mov: 'video/quicktime', zip: 'application/zip' };
const DRIVE = 'https://www.googleapis.com/drive/v3/files';
const driveId = (s) => (String(s || '').match(/[-\w]{20,}/) || [])[0] || null;
// La carpeta de la Library por nombre (sin importar mayúsculas) o id; si no existe y se pide, se crea.
async function libFolder(u, ref, make) {
  const k = String(ref || '').trim(); if (!k) return null;
  const all = await db.list('folders');
  const f = all.find((x) => x.id === k) || all.find((x) => String(x.name || '').toLowerCase() === k.toLowerCase());
  if (f || !make) return f || null;
  return db.create('folders', { name: k.slice(0, 80), tone: 'gris', desc: '' }, u.email);
}
// Sin carpeta de Drive conectada, el archivo cae en la carpeta de entregas de la persona (la misma de la app).
async function myDriveFolder(u) {
  const me = await db.get('team', u.email); if (me?.drive_folder) return me.drive_folder;
  const name = 'Inherent OS · Entregas';
  const q = new URLSearchParams({ q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false and 'root' in parents`, fields: 'files(id)', pageSize: '1' });
  let id = (await google.gapi(u.email, `${DRIVE}?${q}`)).files?.[0]?.id;
  if (!id) id = (await google.gapi(u.email, `${DRIVE}?fields=id`, { method: 'POST', body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder' }) })).id;
  await db.upsert('team', u.email, { drive_folder: id }, u.email);
  return id;
}
const fence = (fmt, text) => (fmt && fmt !== 'md' ? '```' + fmt + '\n' + text + '\n```\n' : text);

// [nombre, área que hace falta (null = todos), descripción, esquema]
const TOOLS = [
  ['mis_pendientes', null, 'Lo que tengo que hacer: tareas atrasadas, de hoy y de la semana, y mis próximas reuniones.', {}],
  ['tareas', 'work', 'Busca tareas. Filtros opcionales: persona (correo), estado (Por empezar, En curso, En revisión, Hecha), cliente (slug).', { persona: { type: 'string' }, estado: { type: 'string' }, cliente: { type: 'string' } }],
  ['crear_tarea', 'work', 'Crea una tarea. Si no se dice persona, es para mí.', { titulo: { type: 'string' }, persona: { type: 'string', description: 'correo' }, vence: { type: 'string', description: 'AAAA-MM-DD' }, proyecto_id: { type: 'string' }, descripcion: { type: 'string' } }, ['titulo']],
  ['actualizar_tarea', 'work', 'Cambia el estado o la fecha de una tarea, o le deja un comentario.', { id: { type: 'string' }, estado: { type: 'string', enum: ['Por empezar', 'En curso', 'En revisión', 'Hecha'] }, vence: { type: 'string' }, comentario: { type: 'string' } }, ['id']],
  ['clientes', 'operations', 'Los clientes de Inherent con su plan.', {}],
  ['cliente', 'clients', 'Todo de un cliente: roadmap (metas y checkpoints), proyectos, reuniones y tareas.', { slug: { type: 'string' } }, ['slug']],
  ['resumen', 'operations', 'Panorama: proyectos activos, tareas abiertas por persona y próximas reuniones.', {}],
  ['catalogo', 'sales', 'Los servicios que vendemos: qué incluyen y cuánto tardan y cuestan en nivel 3 (básico), 5 (sencillo), 8 y 10 (fuerte).', {}],
  ['crear_cotizacion', 'sales', 'Arma una cotización con servicios del catálogo y su nivel de entrega (5 sencillo a 10 fuerte). El precio lo calcula la app.', { cliente: { type: 'string' }, contacto: { type: 'string' }, servicios: { type: 'array', items: { type: 'object', properties: { servicio: { type: 'string', description: 'nombre o id del catálogo' }, nivel: { type: 'number' }, cantidad: { type: 'number' } }, required: ['servicio'] } }, moneda: { type: 'string', description: 'código ISO, ej. GTQ o USD' }, notas: { type: 'string' } }, ['cliente', 'servicios']],
  ['crear_proyecto', 'operations', 'Crea un proyecto con sus fases, reuniones y tareas. Tipo: Ciclo mensual, Proyecto, Growth o Custom (Custom sale de una cotización).', { cliente: { type: 'string', description: 'slug del cliente, o inherent' }, tipo: { type: 'string', enum: ['Ciclo mensual', 'Proyecto', 'Growth', 'Custom'] }, inicio: { type: 'string', description: 'AAAA-MM-DD' }, cotizacion_id: { type: 'string' }, nombre: { type: 'string' } }, ['cliente', 'tipo']],
  ['contenido_semana', 'content', 'Lo que encontró el scraper para un perfil: ganadores del nicho, referentes, competencia y lo propio.', { perfil: { type: 'string' } }, ['perfil']],
  ['planner', 'content', 'El planner de un perfil: piezas con fecha, pilar y estado; pilares, audiencia, referentes y competencia.', { perfil: { type: 'string' }, mes: { type: 'string', description: 'AAAA-MM' } }, ['perfil']],
  ['library', 'library', 'La Library: carpetas y documentos (SOPs, playbooks, entrevistas, notas, archivos). Filtros opcionales: carpeta (nombre o id) y buscar (texto).', { carpeta: { type: 'string' }, buscar: { type: 'string' } }],
  ['leer_documento', 'library', 'Lee un documento de la Library: su contenido y, si es entrevista, sus respuestas y su diagnóstico.', { id: { type: 'string' } }, ['id']],
  ['subir_documento', 'library', `Sube a la Library un documento de texto: un SOP, un playbook, una entrevista, una nota. El contenido va en Markdown; también acepta texto plano, CSV, JSON o HTML (se guarda tal cual en un bloque). Si la carpeta no existe, se crea. Con id, reemplaza ese documento. Una entrevista lleva temas numerados («## 1 · Tema»), preguntas numeradas («1. …») y, debajo, «   > Lo ideal: …»; sus respuestas van en «respuestas» con la llave «tema.pregunta» (ej. {"1.2": "…"}).`, { titulo: { type: 'string' }, contenido: { type: 'string' }, tipo: { type: 'string', enum: KINDS }, carpeta: { type: 'string', description: 'nombre o id; si no existe se crea' }, formato: { type: 'string', enum: ['md', 'txt', 'csv', 'json', 'html'] }, id: { type: 'string', description: 'para reemplazar un documento que ya existe' }, respuestas: { type: 'object', description: 'solo entrevistas: {"tema.pregunta": "respuesta"}' }, diagnostico: { type: 'string', description: 'solo entrevistas, en Markdown' } }, ['titulo', 'contenido']],
  ['subir_archivo', 'library', 'Sube un archivo de cualquier formato (PDF, Word, Excel, PowerPoint, imagen, audio…) al Google Drive de la carpeta de la Library, y lo deja enlazado como documento en esa carpeta. Va en base64, de hasta 3 MB. Para texto (SOP, entrevista, nota) usa subir_documento.', { nombre: { type: 'string', description: 'nombre del archivo con extensión, ej. entrevista.pdf' }, base64: { type: 'string' }, carpeta: { type: 'string', description: 'nombre o id; si no existe se crea' }, titulo: { type: 'string' }, tipo: { type: 'string', enum: KINDS } }, ['nombre', 'base64']],
  ['research', 'content', 'Los videos de Research de un perfil: los que guardó el conector (con su análisis y su plantilla). Filtro opcional: tipo.', { perfil: { type: 'string' }, tipo: { type: 'string', enum: ['nicho', 'referente', 'competencia', 'propia', 'agregado'] } }, ['perfil']],
  ['guardar_research', 'content', 'Guarda reels, carruseles y posts estáticos en Research de un perfil (Content → Research). Si ya está (mismo url), lo actualiza. Cada video puede llevar sus métricas, «por qué funcionó» y una plantilla para la marca (en Markdown). Hasta 60 por llamada.', { perfil: { type: 'string', description: 'slug del perfil (la marca)' }, videos: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, red: { type: 'string', enum: ['instagram', 'tiktok', 'youtube', 'otra'] }, cuenta: { type: 'string', description: 'sin @' }, tipo: { type: 'string', enum: ['nicho', 'referente', 'competencia', 'propia', 'agregado'], description: 'nicho = ganador del nicho' }, formato: { type: 'string', enum: ['reel', 'carrusel', 'estatico'] }, pilar: { type: 'string', description: 'el pilar de contenido de la marca al que sirve' }, resonancia: { type: 'string', enum: ['alta', 'media', 'baja'], description: 'qué tanto conecta con la audiencia de la marca' }, habla: { type: 'string', enum: ['no', 'voz', 'si'], description: '¿hay que hablar a cámara? no · voz (voz en off) · si' }, estilo: { type: 'string', enum: STYLES, description: 'el tipo de formato' }, probado: { type: 'boolean', description: 'si la marca ya lo probó' }, imagenes: { type: 'array', items: { type: 'string' }, description: 'solo carruseles: las urls https de cada slide, en orden' }, miniatura: { type: 'string', description: 'url https de la imagen' }, vistas: { type: 'number' }, likes: { type: 'number' }, comentarios: { type: 'number' }, compartidos: { type: 'number' }, veces_promedio: { type: 'number', description: 'cuántas veces superó la mediana de vistas de su cuenta (se muestra «×36 su mediana»)' }, titulo: { type: 'string', description: 'nombre corto del formato, ej. «Una toma corriendo hacia cámara»' }, duracion: { type: 'string', description: 'duración del video: «0:22» o segundos' }, dificultad: { type: 'number', description: 'qué tan difícil es de producir, de 1 a 5' }, tiempo_grabacion: { type: 'string', description: 'cuánto toma grabarlo, ej. «15 min»' }, receta: { type: 'array', items: { type: 'string' }, description: 'los pasos para hacerlo, en orden' }, clips: { type: 'array', items: { type: 'object', properties: { tiempo: { type: 'string', description: 'ej. «0:00-0:03»' }, que: { type: 'string', description: 'qué se ve o se dice en ese clip' } } }, description: 'el desglose clip por clip' }, fecha: { type: 'string', description: 'AAAA-MM-DD' }, texto: { type: 'string' }, por_que_funciono: { type: 'object', properties: { hook: { type: 'string' }, retencion: { type: 'string' }, estructura: { type: 'array', items: { type: 'string' } }, por_que: { type: 'string' }, adaptacion: { type: 'string' }, inferido: { type: 'boolean' } } }, plantilla: { type: 'string', description: 'la plantilla terminada para la marca, en Markdown' } }, required: ['url'] } } }, ['perfil', 'videos']],
  ['borrar_research', 'content', 'Quita posts de Research de un perfil: los urls que digas, o todo con todo=true.', { perfil: { type: 'string' }, urls: { type: 'array', items: { type: 'string' } }, todo: { type: 'boolean' } }, ['perfil']],
  ['calendario', 'content', 'Los calendarios de un perfil en un mes: publicación (qué sale y cuándo) y grabación (qué se graba cada día).', { perfil: { type: 'string' }, mes: { type: 'string', description: 'AAAA-MM; por defecto el actual' } }, ['perfil']],
  ['agendar', 'content', 'Agenda en el calendario de un perfil: una grabación (qué se graba, cuándo y dónde) o una publicación (una pieza con su fecha).', { perfil: { type: 'string' }, calendario: { type: 'string', enum: ['grabacion', 'publicacion'] }, titulo: { type: 'string' }, fecha: { type: 'string', description: 'AAAA-MM-DD' }, hora: { type: 'string', description: 'HH:MM, solo grabación' }, lugar: { type: 'string' }, quien: { type: 'string' }, piezas: { type: 'string', description: 'solo grabación: piezas y tomas, una por línea' }, formato: { type: 'string', enum: ['Reel', 'Carrusel', 'TikTok', 'Story', 'Estático', 'YouTube'], description: 'solo publicación' }, pilar: { type: 'string' }, notas: { type: 'string' } }, ['perfil', 'calendario', 'titulo', 'fecha']],
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
    return services.map((s) => ({ id: s.id, nombre: s.name, categoria: s.category || '', unidad: s.unit || 'proyecto', fee_por_crecimiento: growthText(growthOf(s)) || null, niveles: [3, 5, 8, 10].map((lv) => ({ nivel: lv, precio_q: priceAt(s, lv, rates), horas: svcHours(s, lv), dias: daysAt(s, lv), incluye: includesAt(s, lv), ...(u.role === 'ceo' ? { costo_q: svcCost(s, rates, lv)?.cost ?? null } : {}) })) }));
  }
  if (name === 'crear_cotizacion') {
    const [services, rates, quotes] = await Promise.all([db.list('services'), db.get('rates', 'default'), db.list('quotes')]);
    const items = []; const faltan = [];
    for (const x of Array.isArray(a.servicios) ? a.servicios : []) {
      const k = String(x.servicio || '').toLowerCase(); const s = services.find((y) => y.id === x.servicio) || services.find((y) => y.name.toLowerCase() === k) || services.find((y) => y.name.toLowerCase().includes(k));
      if (!s) { faltan.push(x.servicio); continue; }
      const lv = Math.max(3, Math.min(10, Math.round(+x.nivel || s.level || 5))); const price = priceAt(s, lv, rates);
      if (price == null) faltan.push(`${s.name} (no tiene precio en el catálogo)`);
      items.push({ service_id: s.id, name: s.name, description: s.description || '', qty: Math.max(1, +x.cantidad || 1), level: lv, price, ...(growthOf(s) ? { growth: growthOf(s) } : {}) });
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
    return { pilares: c.pillars, audiencia: c.audience, diana: c.bullseye, referentes: c.accounts.filter((x) => x.kind === 'referente').map((x) => '@' + x.handle), competencia: c.accounts.filter((x) => x.kind !== 'referente').map((x) => '@' + x.handle),
      piezas: posts.filter((p) => p.kind === 'post' && p.profile === slug && (!a.mes || String(p.date || '').startsWith(a.mes))).map((p) => ({ titulo: p.title, formato: p.format, pilar: p.pillar || '', fecha: p.date || '', estado: p.status || 'Idea', en_drive: Boolean(p.drive_id || p.url) })) };
  }
  if (name === 'library') {
    const [folders, docs] = await Promise.all([db.list('folders'), db.list('docs')]);
    const f = a.carpeta ? await libFolder(u, a.carpeta, false) : null; if (a.carpeta && !f) throw new Error('No encontré esa carpeta');
    const q = String(a.buscar || '').toLowerCase();
    const list = docs.filter((d) => (!f || d.folder_id === f.id) && (!q || `${d.title} ${d.body || ''}`.toLowerCase().includes(q)));
    return { carpetas: folders.map((x) => ({ id: x.id, nombre: x.name, documentos: docs.filter((d) => d.folder_id === x.id).length, drive: x.drive || null })),
      documentos: list.slice(0, 100).map((d) => ({ id: d.id, titulo: d.title, tipo: d.kind || 'Nota', carpeta: folders.find((x) => x.id === d.folder_id)?.name || '', actualizado: d._meta?.updated_at ? new Date(d._meta.updated_at).toISOString().slice(0, 10) : '', ...(d.url ? { link: d.url } : {}) })) };
  }
  if (name === 'leer_documento') {
    const d = await db.get('docs', String(a.id || '')); if (!d) throw new Error('No encontré ese documento');
    return { id: d.id, titulo: d.title, tipo: d.kind || 'Nota', link: d.url || null, contenido: d.body || '', ...(d.kind === 'Entrevista' ? { respuestas: d.answers || {}, diagnostico: d.diagnosis || null } : {}), abrir: `/#/library/${d.folder_id || '_'}/${d.id}` };
  }
  if (name === 'subir_documento') {
    const title = String(a.titulo || '').trim().slice(0, 200), text = String(a.contenido || '');
    if (!title || !text.trim()) throw new Error('Faltan el título o el contenido');
    if (text.length > 300_000) throw new Error('El contenido es muy largo (máximo 300 mil caracteres). Divídelo en varios documentos');
    const kind = KINDS.includes(a.tipo) ? a.tipo : 'Nota';
    const body = fence(['txt', 'csv', 'json', 'html'].includes(a.formato) ? a.formato : 'md', text);
    const extra = { ...(a.respuestas && typeof a.respuestas === 'object' ? { answers: Object.fromEntries(Object.entries(a.respuestas).filter(([k]) => /^\d+\.\d+$/.test(k)).map(([k, v]) => [k, String(v).slice(0, 8000)])) } : {}), ...(a.diagnostico ? { diagnosis: String(a.diagnostico).slice(0, 60_000), diagnosis_at: T } : {}) };
    if (a.id) {
      const d = await db.get('docs', String(a.id)); if (!d) throw new Error('No encontré ese documento');
      const f = a.carpeta ? await libFolder(u, a.carpeta, true) : null;
      const r = await db.update('docs', d.id, { ...d, title, kind, body, ...(f ? { folder_id: f.id } : {}), ...extra, answers: { ...(d.answers || {}), ...(extra.answers || {}) } }, d.v, u.email);
      if (!r) throw new Error('Alguien lo cambió justo ahora; intenta de nuevo');
      return { ok: true, id: r.id, titulo: r.title, reemplazado: true, abrir: `/#/library/${r.folder_id || '_'}/${r.id}` };
    }
    const f = await libFolder(u, a.carpeta, true);
    const d = await db.create('docs', { title, kind, url: '', roles: [], folder_id: f?.id || '', body, ...extra }, u.email);
    return { ok: true, id: d.id, titulo: d.title, tipo: kind, carpeta: f?.name || 'sin carpeta', abrir: `/#/library/${d.folder_id || '_'}/${d.id}` };
  }
  if (name === 'subir_archivo') {
    const file = String(a.nombre || '').replace(/[\\/]/g, '-').trim().slice(0, 180); if (!file) throw new Error('Falta el nombre del archivo');
    const b64 = String(a.base64 || '').replace(/^data:[^,]*,/, '').replace(/\s/g, '');
    if (!b64 || !/^[A-Za-z0-9+/=]+$/.test(b64)) throw new Error('El archivo no viene en base64');
    const buf = Buffer.from(b64, 'base64'); if (!buf.length) throw new Error('El archivo está vacío');
    if (buf.length > 3 * 1024 * 1024) throw new Error('El archivo pesa más de 3 MB. Súbelo desde la Library de la app, que no tiene ese límite');
    const mime = MIMES[(file.split('.').pop() || '').toLowerCase()] || 'application/octet-stream';
    let token; try { token = await google.accessToken(u.email); } catch { throw new Error('Para subir archivos conecta tu Google Drive en la app (Team → Mi perfil)'); }
    const f = await libFolder(u, a.carpeta, true);
    const parent = driveId(f?.drive) || (await myDriveFolder(u));
    const bound = 'inh' + crypto.randomBytes(8).toString('hex');
    const payload = Buffer.concat([Buffer.from(`--${bound}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: file, parents: [parent] })}\r\n--${bound}\r\nContent-Type: ${mime}\r\n\r\n`), buf, Buffer.from(`\r\n--${bound}--`)]);
    const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': `multipart/related; boundary=${bound}` }, body: payload });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`Drive no aceptó el archivo: ${j.error?.message || r.status}`);
    // Como en la app: lo ve cualquiera del dominio que tenga el link.
    await google.gapi(u.email, `${DRIVE}/${j.id}/permissions?supportsAllDrives=true&sendNotificationEmail=false`, { method: 'POST', body: JSON.stringify({ type: 'domain', role: 'reader', domain: u.email.split('@')[1], allowFileDiscovery: false }) }).catch(() => null);
    const title = String(a.titulo || file.replace(/\.[^.]+$/, '')).trim().slice(0, 200);
    const d = await db.create('docs', { title, kind: KINDS.includes(a.tipo) ? a.tipo : 'Nota', url: j.webViewLink, roles: [], folder_id: f?.id || '', body: `> Archivo en Drive: [${file}](${j.webViewLink})\n` }, u.email);
    return { ok: true, id: d.id, titulo: title, archivo: file, drive: j.webViewLink, carpeta: f?.name || 'sin carpeta', abrir: `/#/library/${d.folder_id || '_'}/${d.id}` };
  }
  if (name === 'research') {
    const slug = String(a.perfil || ''); if (!slugOk(slug)) throw new Error('perfil inválido');
    return (await db.list('content')).filter((x) => x.kind === 'research' && x.profile === slug && (!a.tipo || x.tipo === a.tipo)).slice(0, 200)
      .map((x) => ({ url: x.url, titulo: x.title || '', red: x.red || '', cuenta: x.handle || '', tipo: x.tipo || '', formato: x.format || '', pilar: x.pillar || '', resonancia: x.resonance || '', habla: x.talk || '', estilo: x.style || '', probado: Boolean(x.tested), vistas: x.views ?? null, veces_promedio: x.x ?? null, con_analisis: Boolean(x.why), con_plantilla: Boolean(x.plantilla) }));
  }
  if (name === 'guardar_research') {
    const slug = String(a.perfil || ''); if (!slugOk(slug)) throw new Error('perfil inválido');
    const list = Array.isArray(a.videos) ? a.videos.slice(0, 60) : []; if (!list.length) throw new Error('Faltan los videos');
    const num = (v) => (Number.isFinite(+v) && v !== '' && v != null ? +v : undefined);
    const https = (v) => (/^https:\/\/[^\s'"()]+$/.test(String(v || '')) ? String(v) : undefined);
    const secs = (v) => { const m = String(v ?? '').trim().match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/); return m ? (+(m[1] || 0)) * 60 + Math.round(+m[2]) || undefined : undefined; };
    const nuevos = [], actualizados = [], malos = [];
    for (const v of list) {
      const url = https(v.url); if (!url) { malos.push(v.url || '(sin url)'); continue; }
      const red = v.red || (/tiktok\.com/.test(url) ? 'tiktok' : /instagram\.com/.test(url) ? 'instagram' : /youtu/.test(url) ? 'youtube' : 'otra');
      const w = v.por_que_funciono && typeof v.por_que_funciono === 'object' ? v.por_que_funciono : null;
      const doc = { kind: 'research', profile: slug, url, red, handle: String(v.cuenta || '').replace(/^@/, '').toLowerCase().slice(0, 60) || undefined, tipo: ['nicho', 'referente', 'competencia', 'propia', 'agregado'].includes(v.tipo) ? v.tipo : undefined,
        format: ['reel', 'carrusel', 'estatico'].includes(v.formato) ? v.formato : undefined, pillar: v.pilar ? String(v.pilar).slice(0, 80) : undefined, resonance: ['alta', 'media', 'baja'].includes(v.resonancia) ? v.resonancia : undefined, talk: ['no', 'voz', 'si'].includes(v.habla) ? v.habla : undefined, style: STYLES.includes(v.estilo) ? v.estilo : undefined, tested: typeof v.probado === 'boolean' ? v.probado : undefined, slides: Array.isArray(v.imagenes) && v.imagenes.length ? v.imagenes.map(https).filter(Boolean).slice(0, 20) : undefined,
        thumb: https(v.miniatura), views: num(v.vistas), likes: num(v.likes), comments: num(v.comentarios), shares: num(v.compartidos), x: num(v.veces_promedio), at: /^\d{4}-\d{2}-\d{2}/.test(v.fecha || '') ? String(v.fecha).slice(0, 10) : undefined, text: v.texto ? String(v.texto).slice(0, 600) : undefined,
        title: v.titulo ? String(v.titulo).slice(0, 120) : undefined, dur: secs(v.duracion), diff: num(v.dificultad) ? Math.min(5, Math.max(1, Math.round(+v.dificultad))) : undefined, rec: v.tiempo_grabacion ? String(v.tiempo_grabacion).replace(/\s*grabando\s*$/i, '').slice(0, 40) : undefined,
        receta: Array.isArray(v.receta) && v.receta.length ? v.receta.map((x) => String(x).slice(0, 300)).slice(0, 15) : undefined,
        clips: Array.isArray(v.clips) && v.clips.length ? v.clips.map((c) => (typeof c === 'string' ? { t: '', que: c.slice(0, 300) } : { t: String(c?.tiempo || '').slice(0, 20), que: String(c?.que || '').slice(0, 300) })).filter((c) => c.que).slice(0, 20) : undefined,
        why: w ? { hook: String(w.hook || '').slice(0, 600), retencion: String(w.retencion || '').slice(0, 600), estructura: (Array.isArray(w.estructura) ? w.estructura : []).map((x) => String(x).slice(0, 200)).slice(0, 12), por_que: String(w.por_que || '').slice(0, 1200), adaptacion: String(w.adaptacion || '').slice(0, 1200), inferido: Boolean(w.inferido) } : undefined,
        ...(v.plantilla ? { plantilla: String(v.plantilla).slice(0, 40_000), plantilla_at: T } : {}) };
      const id = 'rs-' + crypto.createHash('sha256').update(slug + '|' + url.replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase()).digest('hex').slice(0, 20);
      const had = await db.get('content', id);
      await db.upsert('content', id, Object.fromEntries(Object.entries(doc).filter(([, x]) => x !== undefined)), u.email);
      (had ? actualizados : nuevos).push(url);
    }
    return { ok: true, nuevos: nuevos.length, actualizados: actualizados.length, ...(malos.length ? { sin_url_valida: malos } : {}), abrir: `/#/content/research/${slug}` };
  }
  if (name === 'borrar_research') {
    const slug = String(a.perfil || ''); if (!slugOk(slug)) throw new Error('perfil inválido');
    const k = (x) => String(x || '').replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();
    const want = new Set((Array.isArray(a.urls) ? a.urls : []).map(k));
    if (!a.todo && !want.size) throw new Error('Dime los urls a quitar, o todo=true');
    const list = (await db.list('content')).filter((x) => x.kind === 'research' && x.profile === slug && (a.todo || want.has(k(x.url))));
    for (const x of list) await db.remove('content', x.id, u.email);
    return { ok: true, quitados: list.length, abrir: `/#/content/research/${slug}` };
  }
  if (name === 'calendario') {
    const slug = String(a.perfil || ''); if (!slugOk(slug)) throw new Error('perfil inválido');
    const mes = /^\d{4}-\d{2}$/.test(a.mes || '') ? a.mes : T.slice(0, 7);
    const all = (await db.list('content')).filter((x) => x.profile === slug && String(x.date || '').startsWith(mes)).sort((x, z) => String(x.date).localeCompare(String(z.date)));
    return { mes, publicacion: all.filter((x) => x.kind === 'post').map((x) => ({ fecha: x.date, titulo: x.title, formato: x.format || '', pilar: x.pillar || '', estado: x.status || 'Idea' })),
      grabacion: all.filter((x) => x.kind === 'shoot').map((x) => ({ fecha: x.date, hora: x.time || '', titulo: x.title, lugar: x.place || '', quien: x.crew || '', piezas: x.pieces || '', estado: x.status || 'Por grabar' })) };
  }
  if (name === 'agendar') {
    const slug = String(a.perfil || ''); if (!slugOk(slug)) throw new Error('perfil inválido');
    const title = String(a.titulo || '').trim().slice(0, 200), date = /^\d{4}-\d{2}-\d{2}$/.test(a.fecha || '') ? a.fecha : null;
    if (!title || !date) throw new Error('Faltan el título o la fecha (AAAA-MM-DD)');
    if (a.calendario === 'grabacion') {
      const r = await db.create('content', { kind: 'shoot', profile: slug, title, date, time: /^\d{1,2}:\d{2}$/.test(a.hora || '') ? a.hora.padStart(5, '0') : '', place: String(a.lugar || '').slice(0, 200), crew: String(a.quien || '').slice(0, 200), pieces: String(a.piezas || '').slice(0, 4000), notes: String(a.notas || '').slice(0, 4000), status: 'Por grabar' }, u.email);
      return { ok: true, id: r.id, calendario: 'grabación', fecha: date, titulo: title, abrir: `/#/content/calendario/${slug}` };
    }
    const r = await db.create('content', { kind: 'post', profile: slug, title, format: ['Reel', 'Carrusel', 'TikTok', 'Story', 'Estático', 'YouTube'].includes(a.formato) ? a.formato : 'Reel', pillar: String(a.pilar || ''), caption: String(a.notas || '').slice(0, 4000), date, status: 'Idea' }, u.email);
    return { ok: true, id: r.id, calendario: 'publicación', fecha: date, titulo: title, abrir: `/#/content/calendario/${slug}` };
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
  if (m.method === 'initialize') return ok({ protocolVersion: m.params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'inherent-os', title: 'Inherent OS', version: '1.4.0', ...(base ? { websiteUrl: base, icons: [{ src: `${base}/brand/icon-512.png`, mimeType: 'image/png', sizes: ['512x512'] }, { src: `${base}/brand/emblem-dark.svg`, mimeType: 'image/svg+xml', sizes: ['any'] }] } : {}) }, instructions: `Inherent OS de ${u.name} (${u.role}). Úsalo para ver pendientes, tareas, clientes y contenido; para crear tareas, ideas, cotizaciones o proyectos; para guardar videos en Research y agendar grabaciones y publicaciones; y para subir a la Library documentos (SOPs, entrevistas, notas) y archivos de cualquier formato. Fechas en formato AAAA-MM-DD; hoy es ${today()}. Precios en quetzales salvo que se diga otra moneda.` });
  if (m.method === 'ping') return ok({});
  if (m.method === 'tools/list') return ok({ tools: toolsFor(u) });
  if (m.method === 'tools/call') {
    try { return ok({ content: [{ type: 'text', text: JSON.stringify(await call(u, m.params?.name, m.params?.arguments || {}), null, 1) }] }); }
    catch (e) { return ok({ content: [{ type: 'text', text: e.message }], isError: true }); }
  }
  return { status: 200, json: { jsonrpc: '2.0', id: m.id, error: { code: -32601, message: 'Método no soportado' } } };
}
