// El conector de Claude (MCP) de Inherent OS. Cada persona tiene SU link (Mi perfil (tu foto arriba) →
// «Conectar con Claude»): Claude actúa como esa persona y solo ve y hace lo que su perfil permite.
// Es para consultas y cosas puntuales (pendientes, una cotización, armar un proyecto), no trabajo pesado.
import crypto from 'node:crypto';
import * as db from './db.js';
import { userFor, effective, viewsDoc, scoper, inScope, levelOf } from './access.js';
import { readFile, listDir } from './gh.js';
import { parsePlanContratado } from './parse.js';
import { levelName as nivelName } from '../../public/js/levels.js';
import { estadoDe, archivado, conEstado } from '../../public/js/element.js';
import { consciencia as concienciaDe, CONSCIENCIA } from '../../public/js/calendario-contenido.js';
import * as content from './content.js';
import * as flow from './flow.js';
import * as google from './google.js';
import * as leads from './leads.js';
import * as recipes from './recipes.js';
import * as recurring from './recurring.js';
import * as results from './results.js';
import * as facturasLib from './facturas.js';
import * as layaLib from './laya.js';
import { estadoFactura, totales as totalesFacturas, ESTADOS as ESTADOS_FACTURA } from '../../public/js/facturas.js';
import { repeatText, RECIPE_TYPES, KINDS as RECIPE_KINDS, RECIPE_ROLES } from '../../public/js/recipes.js';
import { phasesFor, meetingsFor, tasksFor, holders, roleToWork, DEPTS, hoursAt, svcHours, svcCost, svcPrice, svcAuto, growthText, includesAt, daysAt, addDays } from '../../public/js/cycle.js';

// Los 5 niveles de Research (los tres últimos nombres, nicho/referente/agregado, son los viejos y se siguen aceptando).
export const RESEARCH_TIPOS = ['competencia', 'referente-similar', 'referente-aspiracional', 'referente-crecimiento', 'propia', 'nicho', 'referente', 'agregado'];
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
// La misma regla que la app: areas, views (profundidad), scope (alcance) y start ya vienen aplicados.
export async function userOf(email) {
  if (!email) return null;
  const u = effective(await userFor(email), await viewsDoc());
  return u.active && u.role !== 'client' ? u : null;
}
async function userOfToken(t) {
  if (!/^[\w-]{20,60}$/.test(String(t || ''))) return null;
  return userOf(await db.vaultGet('mcp:' + tokenHash(t)));
}

const slugOk = (s) => /^[\w-]{2,60}$/.test(String(s || ''));
const today = () => new Date().toISOString().slice(0, 10);
const TASK_TIPOS = ['Delivery', 'Comercial', 'Interna', 'Personal'];
const sopOk = (v) => { const s = String(v || '').trim(); return /^https?:\/\/\S+$/i.test(s) || /^[\w.@+-]{1,120}$/.test(s) ? s.slice(0, 500) : ''; };
const seesTask = (u, t) => { if (t?.tipo === 'Personal') return String(t._meta?.created_by || t.assignee || '').toLowerCase() === u.email; const vis = t?.visibility || 'all'; if (vis === 'all') return true; return [t._meta?.created_by, t.assignee, ...(vis === 'people' ? [t.accountable, ...(t.viewers || [])] : [])].filter(Boolean).map((x) => String(x).toLowerCase()).includes(u.email); };
const pick = (t, ps = []) => ({ id: t.id, titulo: t.title, estado: t.status || 'Por empezar', persona: t.assignee || '', vence: t.due || '', proyecto: ps.find((p) => p.id === t.project_id)?.name || '', depto: t.dept || '', tipo: t.tipo || '', sop: t.sop || '', ...(t.origen === 'estrategia' ? { encargo: { area: t.area || '', cliente: t.cliente || '' } } : {}) });
// El mismo precio que la app: automático (horas × costo/h × multiplicador × complejidad) salvo que tenga precio fijo.
const priceAt = (s, lv, rates) => (!s.price_fixed && !(s.price && !s.prices) ? svcAuto(s, rates, lv) : null) ?? svcPrice(s, lv);
const growthOf = (s) => (s.growth_type ? { type: s.growth_type, pct: +s.growth_pct || 10, how: s.growth_how || '' } : null);
const teamOf = async () => (await db.list('team')).filter((p) => p.role !== 'client' && p.active !== false).map((p) => ({ ...p, email: p.email || p.id }));

// Library: los tipos de documento (los mismos de la pantalla) y los formatos de archivo más comunes.
const KINDS = ['SOP', 'Playbook', 'Entrevista', 'Prompt', 'Diagrama', 'Video', 'Nota'];
// Research: los tipos de formato (los mismos de la pantalla).
const STYLES = ['montaje', 'talking head', 'una toma', 'day in the life', 'voz en off + b-roll', 'meme + montaje', 'lista/tutorial', 'antes-después', 'POV', 'otro'];
const TALKW = { 'sin hablar': 'no', 'no habla': 'no', 'sin voz': 'no', 'voz en off': 'voz', 'voz': 'voz', 'habla a cámara': 'si', 'hablando a cámara': 'si', 'a cámara': 'si', 'talking head': 'si' };
const PILLAR_COLORS = ['#795c45', '#a18770', '#594231', '#8f877b', '#b5651d', '#6b7a5a', '#4a3628', '#c49a6c'];
// Los perfiles válidos (Inherent, la marca personal y cada cliente). Se guardan 5 minutos para no leer el repo en cada llamada.
let profCache = null;
async function perfiles() {
  if (!profCache || Date.now() - profCache.at > 300_000) profCache = { at: Date.now(), list: await content.profiles() };
  return profCache.list;
}
// Los perfiles que ve esta persona: la marca personal solo el CEO; los clientes, según su alcance.
async function perfilesDe(u) {
  const sc = await scoper(u);
  return (await perfiles()).filter((x) => (x.slug !== 'personal' || u.role === 'ceo') && (!sc || x.slug === 'inherent' || sc.client(x.slug)));
}
async function perfilOk(slug, u) {
  const list = u ? await perfilesDe(u) : await perfiles(), s = String(slug || '');
  if (!list.some((x) => x.slug === s)) throw new Error(`Perfil «${s}» no existe o no está entre los tuyos. Los válidos: ${list.map((x) => x.slug).join(', ')}`);
  return s;
}
// Guarda una imagen en la base (las del CDN de Instagram caducan en días). Devuelve la ruta propia, o null si no se pudo.
export async function keepImg(src, who) {
  if (!/^https:\/\/[^\s'"()]+$/.test(String(src || ''))) return null;
  const id = 'img-' + crypto.createHash('sha256').update(String(src).replace(/[?#].*$/, '')).digest('hex').slice(0, 24);
  if (await db.get('media', id)) return `/api/media/${id}`;
  try {
    const r = await fetch(src, { signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'Mozilla/5.0' } });
    const mime = (r.headers.get('content-type') || '').split(';')[0];
    if (!r.ok || !/^image\/(jpeg|png|webp|gif|heic|avif)$/.test(mime)) return null;
    const buf = Buffer.from(await r.arrayBuffer()); if (!buf.length || buf.length > 2_500_000) return null;
    await db.upsert('media', id, { mime, b64: buf.toString('base64'), src: String(src).replace(/[?#].*$/, '').slice(0, 300) }, who);
    return `/api/media/${id}`;
  } catch { return null; }
}
const isLocal = (x) => /^\/api\/media\/img-[a-f0-9]{24}$/.test(String(x || ''));
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
  ['tareas', 'work', 'Busca tareas. Filtros opcionales: persona (correo), estado (Por empezar, En curso, En revisión, Hecha), cliente (slug), tipo (Delivery, Comercial, Interna, Personal). Las Personal solo las ve quien las creó.', { persona: { type: 'string' }, estado: { type: 'string' }, cliente: { type: 'string' }, tipo: { type: 'string', enum: TASK_TIPOS } }],
  ['crear_tarea', 'work', 'Crea una tarea. Si no se dice persona, es para mí.', { titulo: { type: 'string' }, persona: { type: 'string', description: 'correo' }, vence: { type: 'string', description: 'AAAA-MM-DD' }, proyecto_id: { type: 'string' }, descripcion: { type: 'string' }, tipo: { type: 'string', enum: TASK_TIPOS, description: 'Delivery (trabajo para el cliente), Comercial, Interna o Personal (solo la ves tú)' }, sop: { type: 'string', description: 'id de un documento SOP de la Library, o un link https' } }, ['titulo']],
  ['actualizar_tarea', 'work', 'Cambia el estado, la fecha, la persona (para reasignarla), el tipo o el SOP de una tarea, o le deja un comentario.', { id: { type: 'string' }, persona: { type: 'string', description: 'correo de a quién se reasigna' }, estado: { type: 'string', enum: ['Por empezar', 'En curso', 'En revisión', 'Hecha'] }, vence: { type: 'string' }, comentario: { type: 'string' }, tipo: { type: 'string', enum: TASK_TIPOS }, sop: { type: 'string', description: 'id de un SOP de la Library o link https; vacío lo quita' } }, ['id']],
  ['clientes', 'operations', 'Los clientes de Inherent con su nivel (Brand Foundation, Brand Growth o Growth Partnership; «plan» trae el texto de su ficha y «nivel» su traducción).', {}],
  ['cliente', 'clients', 'Todo de un cliente: roadmap (metas y checkpoints), proyectos, reuniones y tareas.', { slug: { type: 'string' } }, ['slug']],
  ['resumen', 'operations', 'Panorama: proyectos activos, tareas abiertas por persona y próximas reuniones.', {}],
  ['catalogo', 'sales', 'Los servicios que vendemos: qué incluyen y cuánto tardan y cuestan en nivel 3 (básico), 5 (sencillo), 8 y 10 (fuerte).', {}],
  ['crear_cotizacion', 'sales', 'Arma una cotización con servicios del catálogo y su nivel de entrega (5 sencillo a 10 fuerte). El precio lo calcula la app.', { cliente: { type: 'string' }, contacto: { type: 'string' }, servicios: { type: 'array', items: { type: 'object', properties: { servicio: { type: 'string', description: 'nombre o id del catálogo' }, nivel: { type: 'number' }, cantidad: { type: 'number' } }, required: ['servicio'] } }, moneda: { type: 'string', description: 'código ISO, ej. GTQ o USD' }, notas: { type: 'string' } }, ['cliente', 'servicios']],
  ['leads', 'sales', 'El CRM: los leads con su etapa, fuente, responsable (rol) y siguiente paso. Los vencidos van primero. Filtros opcionales: etapa (Prospecto, Nuevo, Contactado = Respondido, Reunión = Entendiendo el caso, Propuesta = Propuesta con alcance, Ganado, Perdido), fuente (nombre), vencidos=true (siguiente paso con fecha pasada), buscar (texto).', { etapa: { type: 'string', enum: leads.STAGE_INPUTS }, fuente: { type: 'string' }, vencidos: { type: 'boolean' }, buscar: { type: 'string' } }],
  ['crear_lead', 'sales', 'Crea un lead en el CRM. Si ya existe uno con el mismo WhatsApp, correo o cuenta de IG, no lo duplica: le agrega la actividad y te devuelve el que ya estaba. Un lead abierto necesita siguiente paso y fecha (si no los mandas, queda «Responder y calificar» para hoy).', { nombre: { type: 'string', description: 'empresa o marca' }, contacto: { type: 'string', description: 'con quién hablamos' }, telefono: { type: 'string', description: 'WhatsApp' }, correo: { type: 'string' }, cuenta_ig: { type: 'string' }, fuente: { type: 'string', description: 'de dónde llegó: WhatsApp, Instagram, Web, Referido, Evento, LinkedIn, o el nombre de una fuente' }, interesado_en: { type: 'string' }, interes: { type: 'number', description: '1 frío a 5 listo para cerrar' }, etapa: { type: 'string', enum: leads.STAGE_INPUTS }, siguiente_paso: { type: 'string' }, fecha: { type: 'string', description: 'AAAA-MM-DD del siguiente paso' }, notas: { type: 'string' }, responsable: { type: 'string', description: 'rol; por defecto ventas' } }, ['nombre']],
  ['actualizar_lead', 'sales', 'Mueve un lead de etapa o cambia su siguiente paso, fecha, notas, interés, valor mensual o responsable (rol). Para pasarlo a Perdido es obligatorio el motivo: precio, tiempo, no era el momento, se fue con otro, otro. Todo cambio queda en el historial.', { id: { type: 'string' }, etapa: { type: 'string', enum: leads.STAGE_INPUTS }, siguiente_paso: { type: 'string' }, fecha: { type: 'string', description: 'AAAA-MM-DD' }, notas: { type: 'string', description: 'reemplaza las notas' }, motivo_perdida: { type: 'string', enum: leads.LOST }, interes: { type: 'number' }, valor_usd: { type: 'number', description: 'valor mensual en USD' }, responsable: { type: 'string', description: 'rol' }, interesado_en: { type: 'string' } }, ['id']],
  ['registrar_actividad', 'sales', 'Anota en el historial de un lead lo que pasó: una llamada, un mensaje, una reunión. El historial solo se agrega, nunca se borra.', { id: { type: 'string' }, texto: { type: 'string' } }, ['id', 'texto']],
  ['importar_prospectos', 'sales', 'Mete un lote de prospectos (hasta 100, de scraping o de una lista) a la bandeja de Prospectos del CRM. Entran como Prospecto saliente, sin contar como lead hasta que respondan. No duplica por WhatsApp, correo o cuenta de IG. «fuente» es el nombre de una fuente de Comercial → Fuentes (o un nombre libre, ej. «Apify · restaurantes zona 10»).', { fuente: { type: 'string' }, prospectos: { type: 'array', items: { type: 'object', properties: { nombre: { type: 'string' }, cuenta_ig: { type: 'string' }, telefono: { type: 'string' }, correo: { type: 'string' }, contacto: { type: 'string' }, ciudad: { type: 'string' }, industria: { type: 'string' }, url: { type: 'string' }, notas: { type: 'string' } } } } }, ['prospectos']],
  ['crear_proyecto', 'operations', 'Crea un proyecto con sus fases, reuniones y tareas; todo sale de las recetas (ver recetas). Tipo: Ciclo mensual, Proyecto, Growth o Custom (Custom sale de una cotización; para un paquete o el alcance contratado del cliente usa activar_paquete).', { cliente: { type: 'string', description: 'slug del cliente, o inherent' }, tipo: { type: 'string', enum: ['Ciclo mensual', 'Proyecto', 'Growth', 'Custom'] }, inicio: { type: 'string', description: 'AAAA-MM-DD' }, cotizacion_id: { type: 'string' }, nombre: { type: 'string' } }, ['cliente', 'tipo']],
  ['contenido_semana', 'content', 'Lo que encontró el scraper para un perfil: ganadores del nicho, referentes, competencia y lo propio.', { perfil: { type: 'string' } }, ['perfil']],
  ['planner', 'content', 'El planner de un perfil: piezas con fecha, pilar y estado; pilares, audiencia, referentes y competencia.', { perfil: { type: 'string' }, mes: { type: 'string', description: 'AAAA-MM' } }, ['perfil']],
  ['library', 'library', 'La Library: carpetas y documentos (SOPs, playbooks, entrevistas, notas, archivos). Filtros opcionales: carpeta (nombre o id) y buscar (texto).', { carpeta: { type: 'string' }, buscar: { type: 'string' } }],
  ['leer_documento', 'library', 'Lee un documento de la Library: su contenido y, si es entrevista, sus respuestas y su diagnóstico.', { id: { type: 'string' } }, ['id']],
  ['subir_documento', 'library', `Sube a la Library un documento de texto: un SOP, un playbook, una entrevista, una nota. El contenido va en Markdown; también acepta texto plano, CSV, JSON o HTML (se guarda tal cual en un bloque). Si la carpeta no existe, se crea. Con id, reemplaza ese documento. Una entrevista lleva temas numerados («## 1 · Tema»), preguntas numeradas («1. …») y, debajo, «   > Lo ideal: …»; sus respuestas van en «respuestas» con la llave «tema.pregunta» (ej. {"1.2": "…"}).`, { titulo: { type: 'string' }, contenido: { type: 'string' }, tipo: { type: 'string', enum: KINDS }, carpeta: { type: 'string', description: 'nombre o id; si no existe se crea' }, formato: { type: 'string', enum: ['md', 'txt', 'csv', 'json', 'html'] }, id: { type: 'string', description: 'para reemplazar un documento que ya existe' }, respuestas: { type: 'object', description: 'solo entrevistas: {"tema.pregunta": "respuesta"}' }, diagnostico: { type: 'string', description: 'solo entrevistas, en Markdown' } }, ['titulo', 'contenido']],
  ['subir_archivo', 'library', 'Sube un archivo de cualquier formato (PDF, Word, Excel, PowerPoint, imagen, audio…) al Google Drive de la carpeta de la Library, y lo deja enlazado como documento en esa carpeta. Va en base64, de hasta 3 MB. Para texto (SOP, entrevista, nota) usa subir_documento.', { nombre: { type: 'string', description: 'nombre del archivo con extensión, ej. entrevista.pdf' }, base64: { type: 'string' }, carpeta: { type: 'string', description: 'nombre o id; si no existe se crea' }, titulo: { type: 'string' }, tipo: { type: 'string', enum: KINDS } }, ['nombre', 'base64']],
  ['perfiles', 'content', 'Los perfiles válidos (slug y nombre): Inherent, la marca personal y cada cliente. Úsalo antes de guardar algo para no equivocarte de perfil.', {}],
  ['actualizar_perfil', 'content', 'Cambia la audiencia, los pilares, los referentes o la competencia de un perfil. Solo cambia los campos que mandes; lo demás queda igual. Referentes y competencia reemplazan su lista completa.', { perfil: { type: 'string' }, audiencia: { type: 'object', properties: { general: { type: 'string' }, nicho: { type: 'string' }, exacto: { type: 'string' } } }, pilares: { type: 'array', items: { type: 'string' }, description: 'hasta 8' }, referentes: { type: 'array', items: { type: 'string' }, description: '@cuenta o link del perfil' }, competencia: { type: 'array', items: { type: 'string' } } }, ['perfil']],
  ['leer_research', 'content', 'Un post de Research completo: métricas, etiquetas, hook, tu versión, receta, clips, por qué funcionó y la plantilla si ya tiene.', { perfil: { type: 'string' }, url: { type: 'string' } }, ['perfil', 'url']],
  ['listar_research', 'content', 'Lo que ya está en Research de un perfil: url, título, formato, etiquetas, si tiene análisis y si el equipo lo marcó «Usar como formato» (replicar), para verificar y no duplicar. Filtro opcional: tipo (nivel: competencia, referente-similar, referente-aspiracional, referente-crecimiento, propia).', { perfil: { type: 'string' }, tipo: { type: 'string', enum: RESEARCH_TIPOS } }, ['perfil']],
  ['guardar_research', 'content', 'Guarda reels, carruseles y posts estáticos en Research de un perfil (Contenido → Research). Manda una lista en «posts» (hasta 40 por llamada). Si el url ya está, lo actualiza. El servidor descarga y guarda la miniatura y las láminas (las del CDN caducan). Los filtros de Research se arman solos con los tags que mandes.', { perfil: { type: 'string', description: 'slug del perfil; ver perfiles()' }, posts: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, formato: { type: 'string', enum: ['reel', 'carrusel', 'estatico'] }, creador: { type: 'string', description: '@cuenta' }, red: { type: 'string', enum: ['instagram', 'tiktok', 'linkedin', 'youtube', 'otra'] }, fecha: { type: 'string', description: 'AAAA-MM-DD' }, titulo: { type: 'string', description: 'nombre corto del formato' }, tipo: { type: 'string', enum: RESEARCH_TIPOS, description: 'nivel de la investigación: competencia (local) · referente-similar (mercados parecidos al del cliente) · referente-aspiracional · referente-crecimiento (crecimiento/engagement) · propia' }, metricas: { type: 'object', properties: { vistas: { type: 'number' }, likes: { type: 'number' }, comentarios: { type: 'number' }, compartidos: { type: 'number' }, duracion_s: { type: 'number' }, multiplicador: { type: 'number', description: 'veces su mediana' }, engagement_pct: { type: 'number' } } }, miniatura: { type: 'string', description: 'url https; el servidor la descarga y la guarda' }, slides: { type: 'array', items: { type: 'string' }, description: 'carruseles: urls https de cada lámina, en orden; se guardan' }, caption: { type: 'string' }, por_que_funciono: { type: 'object', properties: { hook: { type: 'string' }, retencion: { type: 'string' }, estructura: { description: 'texto o lista de beats' }, por_que: { type: 'string' }, adaptacion: { type: 'string', description: 'Tu versión para la marca. Markdown: el primer párrafo es «Tu versión»; lo demás (texto en pantalla, clips, receta) va a Análisis' }, inferido: { type: 'boolean' } } }, tags: { type: 'array', items: { type: 'string' }, description: 'pilar, tipo de formato, «resonancia alta|media|baja», «sin hablar|voz en off|hablando a cámara» y lo que sirva para filtrar' }, dificultad: { type: 'number', description: '1 a 5' }, tiempo_grabacion: { type: 'string', description: 'ej. «15 min»' }, receta: { type: 'array', items: { type: 'string' } }, clips: { type: 'array', items: { type: 'object', properties: { tiempo: { type: 'string' }, que: { type: 'string' } } } }, plantilla: { type: 'string', description: 'plantilla terminada para la marca, en Markdown' }, probado: { type: 'boolean' } }, required: ['url'] } } }, ['perfil', 'posts']],
  ['borrar_research', 'content', 'Quita posts de Research de un perfil: los urls que digas, o todo con todo=true.', { perfil: { type: 'string' }, urls: { type: 'array', items: { type: 'string' } }, todo: { type: 'boolean' } }, ['perfil']],
  ['calendario', 'content', 'Los calendarios de un perfil en un mes: publicación (qué sale y cuándo) y grabación (qué se graba cada día).', { perfil: { type: 'string' }, mes: { type: 'string', description: 'AAAA-MM; por defecto el actual' } }, ['perfil']],
  ['agendar', 'content', 'Agenda en el calendario de un perfil: una grabación (qué se graba, cuándo y dónde) o una publicación (una pieza con su fecha).', { perfil: { type: 'string' }, calendario: { type: 'string', enum: ['grabacion', 'publicacion'] }, titulo: { type: 'string' }, fecha: { type: 'string', description: 'AAAA-MM-DD' }, hora: { type: 'string', description: 'HH:MM, solo grabación' }, lugar: { type: 'string' }, quien: { type: 'string' }, piezas: { type: 'string', description: 'solo grabación: piezas y tomas, una por línea' }, formato: { type: 'string', enum: ['Reel', 'Carrusel', 'TikTok', 'Story', 'Estático', 'YouTube'], description: 'solo publicación' }, pilar: { type: 'string' }, campana: { type: 'string', description: 'solo publicación: la campaña, si la pieza es de una' }, consciencia: { type: 'string', enum: CONSCIENCIA, description: 'solo publicación: el nivel de consciencia al que le habla' }, replica_de: { type: 'string', description: 'solo publicación: el id del post de Research que replica' }, notas: { type: 'string' } }, ['perfil', 'calendario', 'titulo', 'fecha']],
  ['actualizar_idea', 'content', 'Cambia una idea o pieza del planner: título, fecha, formato, pilar, texto, estado o hasta de perfil (para moverla al correcto). Los ids salen de planner.', { id: { type: 'string' }, perfil: { type: 'string', description: 'muévela a este perfil' }, titulo: { type: 'string' }, fecha: { type: 'string', description: 'AAAA-MM-DD, o vacío para quitarla' }, formato: { type: 'string', enum: ['Reel', 'Carrusel', 'TikTok', 'Story', 'Estático', 'YouTube'] }, pilar: { type: 'string' }, texto: { type: 'string' }, estado: { type: 'string', description: 'Idea · En proceso · Listo · Publicado · Archivado (los viejos Grabado, Editado y Programado se leen como En proceso y Listo)' } }, ['id']],
  ['borrar_idea', 'content', 'Borra ideas o piezas del planner por id (los ids salen de planner). Acepta varias.', { ids: { type: 'array', items: { type: 'string' } } }, ['ids']],
  ['crear_idea', 'content', 'Agrega una idea al planner de un perfil.', { perfil: { type: 'string' }, titulo: { type: 'string' }, formato: { type: 'string', enum: ['Reel', 'Carrusel', 'TikTok', 'Story', 'Estático', 'YouTube'] }, pilar: { type: 'string' }, texto: { type: 'string' }, fecha: { type: 'string' } }, ['perfil', 'titulo', 'formato']],
  ['recetas', 'operations', 'Las recetas con las que se arma el trabajo: ciclo mensual, Business Growth, proyecto, custom, las de cada servicio y las responsabilidades recurrentes de Inherent. Sin id las lista; con id trae la receta completa: tareas (perfil, quién revisa, día, horas, SOP, tipo y de qué dependen), reuniones y lo que se pide al cliente.', { id: { type: 'string' } }],
  ['guardar_receta', 'operations', 'SOLO EL CEO. Crea o cambia una receta. Manda la receta completa en «receta»; con «id» cambia esa (el id de una de siempre la reemplaza; sin id crea una nueva). Con restablecer=true y un id vuelve a la receta de siempre (o borra una propia). Tipos: proyecto (kind: Ciclo mensual, Growth, Proyecto, Custom), servicio (service_id del catálogo: sus tareas salen al activar un paquete o una cotización) e interna (repeat: semanal con dow 1-7, mensual con from y to, anual con month y day; genera tareas tipo Interna; en el título «{mes}» se cambia por el mes). En tasks, «day» es el día del ciclo (unit dia) o los días hábiles desde que arranca (unit habil); «after» son las key de las tareas que van antes.', { id: { type: 'string' }, restablecer: { type: 'boolean' }, receta: { type: 'object', properties: {
    name: { type: 'string' }, type: { type: 'string', enum: RECIPE_TYPES.map(([k]) => k) }, kind: { type: 'string', enum: RECIPE_KINDS }, service_id: { type: 'string' }, active: { type: 'boolean' }, unit: { type: 'string', enum: ['dia', 'habil'] }, note: { type: 'string' },
    repeat: { type: 'object', properties: { freq: { type: 'string', enum: ['semanal', 'mensual', 'anual'] }, dow: { type: 'number' }, from: { type: 'number' }, to: { type: 'number' }, month: { type: 'number' }, day: { type: 'number' } } },
    tasks: { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, title: { type: 'string' }, role: { type: 'string', enum: RECIPE_ROLES.map(([k]) => k) }, reviewer: { type: 'string', description: 'perfil que revisa, o vacío' }, day: { type: 'number' }, hours: { type: 'number' }, sop: { type: 'string', description: 'id de un SOP de la Library o link https' }, tipo: { type: 'string', enum: TASK_TIPOS }, after: { type: 'array', items: { type: 'string' } }, desc: { type: 'string' }, dept: { type: 'string', description: 'código del departamento, ej. ④' } }, required: ['title', 'role'] } },
    meetings: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, day: { type: 'number' }, who: { type: 'array', items: { type: 'string' } }, topics: { type: 'array', items: { type: 'string' } }, approves: { type: 'string' } }, required: ['name', 'day'] } },
    ask: { type: 'array', items: { type: 'string' }, description: 'lo que se le pide al cliente' } }, required: ['name', 'type'] } }],
  ['resultados', 'resultados', 'Los números reales de Inherent: leads y cierre por fuente, tiempo de respuesta, valor del pipeline por etapa, motivos de pérdida, entregas a tiempo, ingresos del mes y las metas de cada cliente (meta vs. real). Solo trae los bloques de las secciones que tu perfil ve. Lo que no tiene dato viene en null con de dónde saldrá; nunca es cero. Con «cliente» (slug) suma sus redes de Instagram de 30 días (Windsor).', { dias: { type: 'number', enum: [30, 90, 365], description: 'periodo de leads y entregas; por defecto 90' }, cliente: { type: 'string', description: 'slug del cliente para traer sus redes' } }],
  ['paquetes', 'operations', 'Los paquetes armados (servicios con su nivel), sin costos. Sus ids sirven para activar_paquete.', {}],
  ['activar_paquete', 'operations', 'Activa un paquete (paquete_id) o el alcance contratado del cliente según su nivel (plan=true; niveles: Brand Foundation, Brand Growth, Growth Partnership): arma el proyecto con las tareas de las recetas de sus servicios, cada una con dueño por perfil, revisor, fecha, SOP, tipo Delivery y dependencias. El alcance arma el ciclo mensual con los departamentos de su pipeline (y Business Growth en Growth Partnership). Respeta el alcance de tu perfil.', { cliente: { type: 'string', description: 'slug del cliente, o inherent' }, paquete_id: { type: 'string' }, plan: { type: 'boolean' }, inicio: { type: 'string', description: 'AAAA-MM-DD' }, nombre: { type: 'string' } }, ['cliente']],
  ['asignar_rol', 'operations', 'Cambia quién cubre un rol en un proyecto y reasigna las tareas abiertas de ese rol (queda en el historial de cada tarea y del proyecto). Sin persona, muestra la tabla de roles del proyecto.', { proyecto_id: { type: 'string' }, rol: { type: 'string', enum: RECIPE_ROLES.map(([k]) => k) }, persona: { type: 'string', description: 'correo' } }, ['proyecto_id']],
  ['generar_recurrentes', 'operations', 'SOLO CEO O COO. Deja creadas las tareas de las responsabilidades recurrentes (recetas internas activas) que ya toca hacer. No duplica: se puede correr las veces que sea.', {}],
  ['facturas', 'finanzas', 'SOLO EL CEO. Las facturas de Inherent: por cobrar (a clientes) y por pagar (a proveedores), con su estado (pendiente, vencida, pagada o anulada; «vencida» = pendiente con fecha pasada) y los totales en quetzales. Filtros opcionales: tipo y estado.', { tipo: { type: 'string', enum: ['cobrar', 'pagar'] }, estado: { type: 'string', enum: ESTADOS_FACTURA } }],
  ['registrar_factura', 'finanzas', 'SOLO EL CEO. Registra una factura. Pensado para la skill ap-processor: lee los correos con factura de un proveedor y regístrala aquí (tipo pagar). No duplica: si ya existe una del mismo proveedor, monto y fecha, devuelve esa. Por cobrar lleva el slug del cliente. Montos en quetzales salvo moneda USD.', { tipo: { type: 'string', enum: ['pagar', 'cobrar'], description: 'por defecto pagar' }, proveedor: { type: 'string', description: 'quién nos cobra (tipo pagar)' }, cliente: { type: 'string', description: 'slug del cliente (tipo cobrar)' }, concepto: { type: 'string' }, monto: { type: 'number' }, moneda: { type: 'string', enum: ['GTQ', 'USD'] }, emitida: { type: 'string', description: 'AAAA-MM-DD' }, vence: { type: 'string', description: 'AAAA-MM-DD' }, archivo: { type: 'string', description: 'link https al PDF o al correo' }, notas: { type: 'string', description: 'número de factura, NIT u otro dato' } }, ['concepto', 'monto', 'vence']],
  ['marcar_pagada', 'finanzas', 'SOLO EL CEO. Marca una factura como pagada, con la fecha del pago y la referencia del banco si se saben. Los ids salen de facturas. Queda registrado solo: un cobro pagado crea su ingreso en Finanzas y, si es del plan mensual, los costos del mes del cliente (su receta de costos) como facturas por pagar; un pago a proveedor crea su gasto. Sin duplicar.', { id: { type: 'string' }, fecha: { type: 'string', description: 'AAAA-MM-DD; por defecto hoy' }, referencia: { type: 'string', description: 'referencia del banco' } }, ['id']],
  ...layaLib.TOOLS, // Fase 3 · Laya: juicios_pendientes y guardar_juicio
];
// Las herramientas que cambian algo: hace falta nivel «edita» en su área (la matriz del CEO). Las demás, con ver basta.
const WRITE = new Set(['guardar_juicio', 'crear_tarea', 'actualizar_tarea', 'crear_cotizacion', 'crear_lead', 'actualizar_lead', 'registrar_actividad', 'importar_prospectos', 'crear_proyecto', 'subir_documento', 'subir_archivo', 'actualizar_perfil', 'guardar_research', 'borrar_research', 'agendar', 'actualizar_idea', 'borrar_idea', 'crear_idea', 'guardar_receta', 'activar_paquete', 'asignar_rol', 'generar_recurrentes', 'registrar_factura', 'marcar_pagada']);
// Sin views (pruebas que pasan el usuario a mano), el área visible alcanza, como antes.
const mayWrite = (u, name, area) => !WRITE.has(name) || !area || !u.views || levelOf(u, area) === 'edita';
// «Resumen» también aquí: lo que la pantalla no muestra en resumen, el conector no lo entrega
// (Comercial: sin catálogo ni precios; Contenido: solo rendimiento, sin Research, planner ni calendario).
const SUMMARY_HIDES = { sales: ['catalogo'], content: ['contenido_semana', 'planner', 'calendario', 'listar_research', 'leer_research'] };
const hiddenBySummary = (u, name) => u.role !== 'ceo' && Boolean(u.views) && Object.entries(SUMMARY_HIDES).some(([area, l]) => l.includes(name) && levelOf(u, area) === 'resumen');
// Las facturas (por cobrar y por pagar, con el banco) son solo del CEO, aunque otro perfil vea Finanzas en resumen.
const CEO_ONLY = new Set(['facturas', 'registrar_factura', 'marcar_pagada']);
const toolsFor = (u) => TOOLS.filter(([name, a]) => (!a || u.areas.includes(a)) && mayWrite(u, name, a) && !hiddenBySummary(u, name) && (!CEO_ONLY.has(name) || u.role === 'ceo')).map(([name, , description, properties, required]) => ({ name, description, inputSchema: { type: 'object', properties, ...(required ? { required } : {}) } }));

async function call(u, name, a = {}) {
  if (name === 'research') name = 'listar_research'; // el nombre viejo
  const tool = TOOLS.find((t) => t[0] === name); if (!tool) throw new Error('Herramienta desconocida');
  if (tool[1] && !u.areas.includes(tool[1])) throw new Error('Tu perfil no tiene acceso a esto');
  if (!mayWrite(u, name, tool[1])) throw new Error('Tu perfil solo puede ver esto, no cambiarlo');
  if (hiddenBySummary(u, name)) throw new Error('Tu perfil ve esta sección en «resumen»: esto no entra');
  if (CEO_ONLY.has(name) && u.role !== 'ceo') throw new Error('Solo el CEO usa las facturas');
  if (name === 'juicios_pendientes' || name === 'guardar_juicio') return layaLib.mcp(u, name, a);
  const T = today();
  const sc = await scoper(u); // el alcance: null = todo
  const inS = (coll, d) => inScope(sc, coll, d);
  if (name === 'mis_pendientes') {
    const [tasks, projects, team] = await Promise.all([db.list('tasks'), db.list('projects'), teamOf()]);
    const mine = tasks.filter((t) => t.assignee === u.email && t.status !== 'Hecha' && seesTask(u, t));
    const wk = addDays(T, 7);
    const meetings = projects.flatMap((p) => { const who = holders(team, u.email, p.roles_map); return (p.meetings || []).filter((m) => m.status !== 'hecha' && m.date >= T && m.date <= wk && (m.who || []).some((r) => who(r) === u.email)).map((m) => ({ fecha: m.date, reunion: m.name, cliente: p.client || p.name, temas: m.topics, aprueba: m.approves || '' })); });
    return { hoy: T, atrasadas: mine.filter((t) => t.due && t.due < T).map((t) => pick(t, projects)), hoy_vencen: mine.filter((t) => t.due === T).map((t) => pick(t, projects)), esta_semana: mine.filter((t) => t.due > T && t.due <= wk).map((t) => pick(t, projects)), sin_fecha: mine.filter((t) => !t.due).map((t) => pick(t, projects)), en_revision_esperando_mi_ok: tasks.filter((t) => t.accountable === u.email && t.status === 'En revisión' && seesTask(u, t)).map((t) => pick(t, projects)), reuniones: meetings };
  }
  if (name === 'tareas') {
    const [tasks, projects] = await Promise.all([db.list('tasks'), db.list('projects')]);
    const pid = a.cliente ? new Set(projects.filter((p) => p.client_slug === a.cliente).map((p) => p.id)) : null;
    return tasks.filter((t) => seesTask(u, t) && inS('tasks', t) && (!a.persona || t.assignee === a.persona) && (!a.estado || (t.status || 'Por empezar') === a.estado) && (!pid || pid.has(t.project_id)) && (!a.tipo || t.tipo === a.tipo)).slice(0, 150).map((t) => pick(t, projects));
  }
  if (name === 'crear_tarea') {
    if (!String(a.titulo || '').trim()) throw new Error('Falta el título');
    if (a.tipo && !TASK_TIPOS.includes(a.tipo)) throw new Error('tipo: Delivery, Comercial, Interna o Personal');
    if (a.proyecto_id) { const pr = await db.get('projects', String(a.proyecto_id)); if (pr && !inS('projects', pr)) throw new Error('Ese proyecto no está entre los tuyos'); }
    let sop = '';
    if (a.sop) { sop = sopOk(a.sop); if (!sop) throw new Error('sop: manda el id de un documento de la Library o un link https'); if (!/^https?:/i.test(sop) && !(await db.get('docs', sop))) throw new Error('Ese SOP no está en la Library (revisa el id con library())'); }
    const t = await db.create('tasks', { ...(a.tipo ? { tipo: a.tipo } : {}), ...(sop ? { sop } : {}), title: String(a.titulo).slice(0, 200), assignee: a.tipo === 'Personal' ? u.email : a.persona || u.email, due: /^\d{4}-\d{2}-\d{2}$/.test(a.vence || '') ? a.vence : '', project_id: a.proyecto_id || '', description: String(a.descripcion || '').slice(0, 4000), status: 'Por empezar', visibility: 'all', checklist: [], comments: [] }, u.email);
    return { ok: true, id: t.id, titulo: t.title, para: t.assignee, tipo: t.tipo || '', sop: t.sop || '' };
  }
  if (name === 'actualizar_tarea') {
    const t = await db.get('tasks', String(a.id || '')); if (!t || !seesTask(u, t) || !inS('tasks', t)) throw new Error('No encontré esa tarea');
    if (![t.assignee, t.accountable, t._meta?.created_by].includes(u.email) && !['ceo', 'coo'].includes(u.role)) throw new Error('Solo quien la hace, quien la revisa o el COO/CEO la pueden cambiar');
    const patch = { ...t };
    if (a.estado) { patch.status = a.estado; results.stampDone(t, patch); } // el día en que quedó «Hecha»
    if (a.persona) { const to = String(a.persona).trim().toLowerCase(), team = await teamOf(); if (!team.some((p) => p.email.toLowerCase() === to)) throw new Error(`«${a.persona}» no está en el equipo. Usa el correo de la persona.`); patch.assignee = to; }
    if (/^\d{4}-\d{2}-\d{2}$/.test(a.vence || '')) patch.due = a.vence;
    if (a.tipo) { if (!TASK_TIPOS.includes(a.tipo)) throw new Error('tipo: Delivery, Comercial, Interna o Personal'); patch.tipo = a.tipo; }
    if ('sop' in a) { if (!a.sop) delete patch.sop; else { const sop = sopOk(a.sop); if (!sop) throw new Error('sop: manda el id de un documento de la Library o un link https'); if (!/^https?:/i.test(sop) && !(await db.get('docs', sop))) throw new Error('Ese SOP no está en la Library (revisa el id con library())'); patch.sop = sop; } }
    if (a.comentario) patch.comments = [...(t.comments || []), { who: u.name, at: new Date().toISOString(), text: String(a.comentario).slice(0, 2000) }];
    const r = await db.update('tasks', t.id, patch, t.v, u.email); if (!r) throw new Error('Alguien la cambió justo ahora; intenta de nuevo');
    return { ok: true, id: r.id, estado: r.status, vence: r.due || '', persona: r.assignee || '', tipo: r.tipo || '', sop: r.sop || '' };
  }
  if (name === 'resultados') {
    const r = await results.compute(u, { dias: a.dias });
    if (a.cliente) {
      const slug = String(a.cliente); if (!slugOk(slug) || slug === 'personal') throw new Error('cliente inválido');
      if (!u.areas.includes('clients')) throw new Error('Tu perfil no ve Clientes');
      if (sc && !sc.client(slug)) throw new Error('Ese cliente no está entre los tuyos');
      r.redes = { cliente: slug, ...(await results.redes(slug)) };
    }
    const vacio = 'sin datos todavía';
    if (r.comercial && !r.comercial.leads) r.comercial.nota = `${vacio}: salen de los leads del CRM (Comercial) que entren en el periodo`;
    if (r.comercial && r.comercial.respuesta.mediana_horas == null) r.comercial.respuesta.nota = `${vacio}: se mide del alta de cada lead entrante a su primera acción en el historial`;
    if (r.entregas && !r.entregas.medidas) r.entregas.nota = `${vacio}: se mide con las tareas marcadas «Hecha» que tienen fecha límite (desde que guardan su día de entrega)`;
    if (r.finanzas && r.finanzas.ingresos_q == null) r.finanzas.nota = `${vacio}: salen de los movimientos de ingreso del mes en Finanzas (hoja de Google o a mano)`;
    return r;
  }
  if (name === 'clientes') {
    const dirs = (await listDir('clients')).filter((d) => d.type === 'dir' && !d.name.startsWith('_') && (!sc || sc.client(d.name)));
    return Promise.all(dirs.map(async (d) => { const f = await readFile(`clients/${d.name}/00-onboarding/plan-contratado.md`); const plan = f ? parsePlanContratado(f.content, 'team').plan || '' : 'en onboarding'; return { slug: d.name, plan, nivel: f ? nivelName(plan.replace(/^[⬜🔷🟨]️?\s*/u, '')) : plan }; }));
  }
  if (name === 'cliente') {
    const slug = String(a.slug || ''); if (!slugOk(slug)) throw new Error('slug inválido');
    if (sc && !sc.client(slug)) throw new Error('Ese cliente no está entre los tuyos');
    const [acc, projects, tasks] = await Promise.all([db.get('accounts', 'acc-' + slug), db.list('projects'), db.list('tasks')]);
    const ps = projects.filter((p) => p.client_slug === slug && inS('projects', p));
    // Nunca los accesos del cliente (usuarios y dónde están las claves); el Drive no entra en «resumen».
    return { slug, roadmap: acc?.goals || acc?.roadmap || [], drive: levelOf(u, 'clients') === 'resumen' ? null : acc?.drive_dirs || null, proyectos: ps.map((p) => ({ id: p.id, nombre: p.name, tipo: p.kind, roles: p.roles_map || {}, fases: p.phases, reuniones: p.meetings || [], servicios: (p.services || []).map(({ name, level, days, includes }) => ({ name, level, days, includes })) })), tareas: tasks.filter((t) => seesTask(u, t) && inS('tasks', t) && ps.some((p) => p.id === t.project_id)).map((t) => pick(t, ps)) };
  }
  if (name === 'resumen') {
    const [projects, tasks] = await Promise.all([db.list('projects').then((l) => l.filter((p) => inS('projects', p))), db.list('tasks').then((l) => l.filter((t) => inS('tasks', t)))]);
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
  if (name === 'leads') {
    const all = (await db.list('leads')).filter((l) => inS('leads', l)), q = String(a.buscar || '').toLowerCase();
    const list = all.filter((l) => (!a.etapa || (l.stage || 'Nuevo') === leads.stageKey(a.etapa)) && (!a.fuente || String(l.source || '').toLowerCase().includes(String(a.fuente).toLowerCase())) && (!a.vencidos || (leads.OPEN.includes(l.stage || 'Nuevo') && l.next_date && l.next_date < T)) && (!q || [l.name, l.contact, l.company, l.wants, l.notes, l.phone, l.email, l.ig].join(' ').toLowerCase().includes(q)));
    const late = (l) => leads.OPEN.includes(l.stage || 'Nuevo') && l.next_date && l.next_date < T;
    return list.sort((x, z) => (late(z) - late(x)) || String(x.next_date || '9').localeCompare(String(z.next_date || '9'))).slice(0, 200).map((l) => ({ id: l.id, nombre: l.name, contacto: l.contact || '', empresa: l.company || '', etapa: l.stage || 'Nuevo', fuente: l.source || '', responsable: l.owner_role || leads.DEFAULT_ROLE, interes: l.interest || 0, interesado_en: l.wants || '', valor_usd: l.value_usd ?? null, siguiente_paso: l.next_step || '', fecha: l.next_date || '', vencido: Boolean(late(l)), telefono: l.phone || '', correo: l.email || '', ig: l.ig ? '@' + l.ig : '', ...(l.stage === 'Perdido' ? { motivo_perdida: l.lost_reason || '' } : {}), ...(l.plan ? { plan_sugerido: l.plan, puntaje: l.score ?? null } : {}), ultimo: (l.activity || []).at(-1)?.text || '' }));
  }
  if (name === 'crear_lead') {
    if (!String(a.nombre || '').trim()) throw new Error('Falta el nombre');
    const { lead: l, duplicate } = await leads.createOrTouch({ name: a.nombre, contact: a.contacto || '', phone: a.telefono || '', email: a.correo || '', ig: a.cuenta_ig || '', source: a.fuente || 'Manual', wants: a.interesado_en || '', interest: a.interes || 0, stage: a.etapa || 'Nuevo', next_step: a.siguiente_paso || '', next_date: a.fecha || '', notes: a.notas || '', owner_role: a.responsable || leads.DEFAULT_ROLE, tags: (+a.interes || 0) >= 4 ? ['Interesado'] : [] }, u.email, a.fuente ? String(a.fuente) : 'el conector');
    return { ok: true, id: l.id, nombre: l.name, etapa: l.stage, ...(duplicate ? { duplicado: true, aviso: 'Ya existía un lead con ese WhatsApp, correo o cuenta: se le agregó la actividad.' } : {}), siguiente_paso: l.next_step || '', fecha: l.next_date || '', abrir: '/#/sales/crm' };
  }
  if (name === 'actualizar_lead' || name === 'registrar_actividad') {
    const l = await db.get('leads', String(a.id || '')); if (!l || !inS('leads', l)) throw new Error('No encontré ese lead (los ids salen de leads)');
    const patch = { ...l }, notes = [];
    if (name === 'registrar_actividad') { if (!String(a.texto || '').trim()) throw new Error('Falta el texto'); notes.push(String(a.texto)); }
    else {
      if (a.etapa && leads.stageKey(a.etapa) !== (l.stage || 'Nuevo')) { patch.stage = leads.stageKey(a.etapa); notes.push(`Etapa: ${l.stage || 'Nuevo'} → ${patch.stage}`); }
      if (a.motivo_perdida) patch.lost_reason = a.motivo_perdida;
      if (a.siguiente_paso != null) patch.next_step = String(a.siguiente_paso);
      if (a.fecha != null) patch.next_date = String(a.fecha);
      if (a.notas != null) patch.notes = String(a.notas);
      if (a.interes != null) patch.interest = +a.interes;
      if (a.valor_usd != null) patch.value_usd = +a.valor_usd;
      if (a.interesado_en != null) patch.wants = String(a.interesado_en);
      if (a.responsable) { patch.owner_role = String(a.responsable); notes.push(`Responsable: ${l.owner_role || leads.DEFAULT_ROLE} → ${a.responsable}`); }
      if (patch.stage === 'Perdido' && patch.lost_reason) notes.push(`Motivo de pérdida: ${patch.lost_reason}`);
      if (a.siguiente_paso != null || a.fecha != null) notes.push(`Siguiente paso: ${patch.next_step || '—'}${patch.next_date ? ` · ${patch.next_date}` : ''}`);
      if (!notes.length && a.notas == null && a.interes == null && a.valor_usd == null && a.interesado_en == null) throw new Error('No mandaste nada que cambiar');
    }
    const d = leads.normalize(patch); d.activity = leads.mergeActivity(l.activity, notes.map((t) => leads.entry(u.name, t)));
    const bad = leads.check(d); if (bad) throw new Error(bad);
    const r = await db.update('leads', l.id, d, l.v, u.email); if (!r) throw new Error('Alguien lo cambió justo ahora; intenta de nuevo');
    return { ok: true, id: r.id, nombre: r.name, etapa: r.stage, siguiente_paso: r.next_step || '', fecha: r.next_date || '', ...(r.stage === 'Perdido' ? { motivo_perdida: r.lost_reason } : {}), historial: r.activity.length };
  }
  if (name === 'importar_prospectos') {
    const list = (Array.isArray(a.prospectos) ? a.prospectos : []).slice(0, 100); if (!list.length) throw new Error('Faltan los prospectos');
    const srcs = await db.list('lead_sources'), k = String(a.fuente || '').toLowerCase();
    const src = k ? srcs.find((x) => x.id === a.fuente) || srcs.find((x) => String(x.name || '').toLowerCase() === k) : null;
    const name = src?.name || String(a.fuente || 'Scraping').slice(0, 80);
    let nuevos = 0, repetidos = 0; const malos = [];
    for (const p of list) {
      const notes = [p.ciudad && `Ciudad: ${p.ciudad}`, p.industria && `Industria: ${p.industria}`, p.url && `Link: ${p.url}`, p.notas].filter(Boolean).join('\n');
      try { const r = await leads.createOrTouch({ name: p.nombre || '', contact: p.contacto || '', ig: p.cuenta_ig || '', phone: p.telefono || '', email: p.correo || '', notes, source: name, source_id: src?.id || '', direction: 'out', stage: src?.stage_in || 'Prospecto', owner_role: src?.role || leads.DEFAULT_ROLE, tags: [] }, u.email, name); r.duplicate ? repetidos++ : nuevos++; }
      catch (e) { malos.push(`${p.nombre || p.cuenta_ig || p.telefono || '?'}: ${e.message}`); }
    }
    if (src) await leads.logSource(src, { ok: true, name: `Lote de ${list.length} (${nuevos} nuevos, ${repetidos} repetidos)` }, u.email).catch(() => {});
    return { ok: true, fuente: name, nuevos, repetidos, ...(malos.length ? { sin_guardar: malos } : {}), abrir: '/#/sales/crm' };
  }
  if (name === 'crear_proyecto') {
    const slug = String(a.cliente || ''); if (!slugOk(slug)) throw new Error('cliente inválido');
    if (sc && slug !== 'inherent' && !sc.client(slug)) throw new Error('Ese cliente no está entre los tuyos');
    const kind = ['Ciclo mensual', 'Proyecto', 'Growth', 'Custom'].includes(a.tipo) ? a.tipo : 'Proyecto';
    const start = /^\d{4}-\d{2}-\d{2}$/.test(a.inicio || '') ? a.inicio : T;
    const quote = a.cotizacion_id ? await db.get('quotes', a.cotizacion_id) : null;
    if (quote && !inS('quotes', quote)) throw new Error('Esa cotización no está entre las tuyas');
    if (kind === 'Custom' && !quote) throw new Error('Para un proyecto Custom dime la cotizacion_id');
    const { project: p, tasks: made } = await flow.createProject(u, { slug, kind, start, quote, name: a.nombre });
    return { ok: true, id: p.id, nombre: p.name, fases: p.phases.map((f) => `${f.name} (${f.start} → ${f.end})`), reuniones: p.meetings.length, tareas: made.length, con_dependencias: made.filter((t) => t.depends_on?.length).length, abrir: '/#/control' };
  }
  if (name === 'recetas') {
    const [R, services] = await Promise.all([recipes.load(), db.list('services')]);
    if (a.id) { const r = R.find((x) => x.id === a.id); if (!r) throw new Error('No encontré esa receta (los ids salen de recetas)'); return r; }
    return R.map((r) => ({ id: r.id, nombre: r.name, tipo: r.type, ...(r.kind ? { proyecto: r.kind } : {}), ...(r.service_id ? { servicio: services.find((s) => s.id === r.service_id)?.name || r.service_id } : {}), ...(r.repeat ? { frecuencia: repeatText(r.repeat) } : {}), activa: r.active !== false, tareas: (r.tasks || []).length, reuniones: (r.meetings || []).length, editada: Boolean(r.edited) }));
  }
  if (name === 'guardar_receta') {
    if (u.role !== 'ceo') throw new Error('Solo el CEO edita las recetas');
    if (a.restablecer) { if (!a.id) throw new Error('Dime el id de la receta'); return { ok: true, restablecida: await recipes.reset(u, a.id) }; }
    if (!a.receta || typeof a.receta !== 'object') throw new Error('Manda la receta completa en «receta»');
    const d = await recipes.save(u, { ...a.receta, id: a.id || a.receta.id });
    return { ok: true, id: d.id, nombre: d.name, tipo: d.type, tareas: (d.tasks || []).length, abrir: '/#/team' };
  }
  if (name === 'paquetes') return flow.bundleList();
  if (name === 'activar_paquete') {
    const slug = flow.slugify(a.cliente); if (!slugOk(slug)) throw new Error('cliente inválido');
    if (sc && slug !== 'inherent' && !sc.client(slug)) throw new Error('Ese cliente no está entre los tuyos');
    if (!a.paquete_id && !a.plan) throw new Error('Dime qué activar: paquete_id (ver paquetes) o plan=true (el alcance contratado)');
    let r; try { r = await flow.activate(u, { bundle_id: a.paquete_id, plan: Boolean(a.plan) && !a.paquete_id, slug, start: a.inicio, name: a.nombre }); } catch (e) { throw new Error(e.message); }
    return { ok: true, proyectos: r.projects.map((p) => ({ id: p.id, nombre: p.name, tipo: p.kind })), tareas: r.tasks.length, con_dependencias: r.tasks.filter((t) => t.depends_on?.length).length, con_sop: r.tasks.filter((t) => t.sop).length, sin_dueno: r.tasks.filter((t) => !t.assignee).length, ...(r.plan ? { plan: r.plan } : {}), abrir: '/#/operations' };
  }
  if (name === 'asignar_rol') {
    const p = await db.get('projects', String(a.proyecto_id || '')); if (!p || !inS('projects', p)) throw new Error('No encontré ese proyecto (los ids salen de resumen o cliente)');
    if (!a.persona) return { proyecto: p.name, roles: p.roles_map || {}, nota: 'Manda rol y persona para cambiar quién cubre un rol.' };
    if (!a.rol) throw new Error('Dime el rol');
    try { return await flow.setRole(u, { project_id: p.id, role: a.rol, email: a.persona }); } catch (e) { throw new Error(e.message); }
  }
  if (name === 'generar_recurrentes') {
    if (!['ceo', 'coo'].includes(u.role)) throw new Error('Solo el CEO o el COO generan lo recurrente');
    return recurring.run(u.email);
  }
  if (name === 'contenido_semana') {
    const slug = await perfilOk(a.perfil, u);
    const r = (await db.get('sources', 'scrape-' + slug))?.result; if (!r) return { aviso: 'Este perfil todavía no tiene scrape.' };
    const slim = (l = []) => l.map((x) => ({ cuenta: '@' + x.handle, tipo: x.kind, url: x.url, texto: x.text, vistas: x.views, likes: x.likes, veces_su_promedio: x.x, fecha: x.at }));
    return { semana: r.week, ganadores: slim(r.top), referentes: slim(r.refs), competencia: slim(r.comp), propios: slim((r.own || []).slice(0, 10)) };
  }
  if (name === 'planner') {
    const slug = await perfilOk(a.perfil, u);
    const [posts, c] = await Promise.all([db.list('content'), content.cfg(slug)]);
    return { pilares: c.pillars, audiencia: c.audience, diana: c.bullseye, referentes: c.accounts.filter((x) => x.kind === 'referente').map((x) => '@' + x.handle), competencia: c.accounts.filter((x) => x.kind !== 'referente').map((x) => '@' + x.handle),
      piezas: posts.filter((p) => p.kind === 'post' && p.profile === slug && (!a.mes || String(p.date || '').startsWith(a.mes))).map((p) => ({ id: p.id, titulo: p.title, formato: p.format, pilar: p.pillar || '', fecha: p.date || '', estado: estadoDe(p), archivada: archivado(p), en_drive: Boolean(p.drive_id || p.url) })) };
  }
  if (name === 'library') {
    const [folders, docs] = await Promise.all([db.list('folders'), db.list('docs')]);
    const f = a.carpeta ? await libFolder(u, a.carpeta, false) : null; if (a.carpeta && !f) throw new Error('No encontré esa carpeta');
    const q = String(a.buscar || '').toLowerCase();
    const list = docs.filter((d) => (!f || d.folder_id === f.id) && (!q || `${d.title} ${d.body || ''}`.toLowerCase().includes(q)));
    return { carpetas: folders.map((x) => ({ id: x.id, nombre: x.name, ...(x.parent_id ? { dentro_de: folders.find((y) => y.id === x.parent_id)?.name || x.parent_id } : {}), documentos: docs.filter((d) => d.folder_id === x.id).length, drive: x.drive || null })),
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
    let token; try { token = await google.accessToken(u.email); } catch { throw new Error('Para subir archivos conecta tu Google Drive en la app (Mi perfil: tu foto arriba)'); }
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
  if (name === 'perfiles') return (await perfilesDe(u)).map(({ slug, name: nombre }) => ({ perfil: slug, nombre }));
  if (name === 'actualizar_perfil') {
    const slug = await perfilOk(a.perfil, u);
    const cur = (await db.get('sources', 'cfg-' + slug)) || {}, patch = { profile: slug }, t = (v) => String(v || '').trim().slice(0, 400);
    if (a.audiencia && typeof a.audiencia === 'object') patch.audience = { ...(cur.audience || { general: '', nicho: '', exacto: '' }), ...Object.fromEntries(['general', 'nicho', 'exacto'].filter((k) => k in a.audiencia).map((k) => [k, t(a.audiencia[k])])) };
    if (Array.isArray(a.pilares)) { const old = new Map((cur.pillars || []).map((x) => [x.name.toLowerCase(), x.color])); patch.pillars = [...new Set(a.pilares.map((x) => String(x || '').trim().slice(0, 40)).filter(Boolean))].slice(0, 8).map((name, i) => ({ name, color: old.get(name.toLowerCase()) || PILLAR_COLORS[i % PILLAR_COLORS.length] })); }
    const accs = (list, kind) => (Array.isArray(list) ? list : []).map((x) => ({ red: /tiktok\.com/i.test(x) ? 'tiktok' : 'instagram', handle: content.handleOf(x), kind })).filter((x) => x.handle);
    if (Array.isArray(a.referentes) || Array.isArray(a.competencia)) {
      const keep = (kind) => (cur.accounts || []).filter((x) => (x.kind === 'referente' ? 'referente' : 'competencia') === kind);
      const all = [...(Array.isArray(a.referentes) ? accs(a.referentes, 'referente') : keep('referente')), ...(Array.isArray(a.competencia) ? accs(a.competencia, 'competencia') : keep('competencia'))];
      patch.accounts = [...new Map(all.map((x) => [x.red + ':' + x.handle, x])).values()].slice(0, 30);
    }
    if (Object.keys(patch).length === 1) throw new Error('No mandaste nada que cambiar: audiencia, pilares, referentes o competencia');
    await db.upsert('sources', 'cfg-' + slug, patch, u.email);
    const c = await content.cfg(slug);
    return { ok: true, perfil: slug, cambiado: Object.keys(patch).filter((k) => k !== 'profile').map((k) => ({ audience: 'audiencia', pillars: 'pilares', accounts: 'referentes/competencia' }[k])), audiencia: c.audience, pilares: c.pillars.map((x) => x.name), referentes: c.accounts.filter((x) => x.kind === 'referente').map((x) => '@' + x.handle), competencia: c.accounts.filter((x) => x.kind !== 'referente').map((x) => '@' + x.handle) };
  }
  if (name === 'leer_research') {
    const slug = await perfilOk(a.perfil, u), k = (x) => String(x || '').replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();
    const x = (await db.list('content')).find((d) => d.kind === 'research' && d.profile === slug && k(d.url) === k(a.url)); if (!x) throw new Error('Ese url no está en Research de ese perfil');
    return { url: x.url, titulo: x.title || '', creador: x.handle ? '@' + x.handle : '', formato: x.format || '', fecha: x.at || '', metricas: { vistas: x.views ?? null, likes: x.likes ?? null, comentarios: x.comments ?? null, duracion_s: x.dur ?? null, multiplicador: x.x ?? null, engagement_pct: x.er ?? null }, pilar: x.pillar || '', estilo: x.style || '', habla: x.talk || '', resonancia: x.resonance || '', tags: x.tags || [], dificultad: x.diff ?? null, tiempo_grabacion: x.rec || '', caption: x.text || '', receta: x.receta || [], clips: (x.clips || []).map((c) => ({ tiempo: c.t, que: c.que })), por_que_funciono: x.why || null, plantilla: x.plantilla || '', replicar: Boolean(x.replicar) };
  }
  if (name === 'listar_research') {
    const slug = await perfilOk(a.perfil, u);
    return (await db.list('content')).filter((x) => x.kind === 'research' && x.profile === slug && (!a.tipo || x.tipo === a.tipo)).slice(0, 400)
      .map((x) => ({ url: x.url, titulo: x.title || '', creador: x.handle ? '@' + x.handle : '', formato: x.format || '', tipo: x.tipo || '', tags: [x.pillar, x.style, x.resonance && 'resonancia ' + x.resonance, { no: 'sin hablar', voz: 'voz en off', si: 'hablando a cámara' }[x.talk], ...(x.tags || [])].filter(Boolean), vistas: x.views ?? null, multiplicador: x.x ?? null, con_analisis: Boolean(x.why), con_plantilla: Boolean(x.plantilla), miniatura_guardada: isLocal(x.thumb), replicar: Boolean(x.replicar), subido: x._meta?.updated_at || x._meta?.created_at }));
  }
  if (name === 'guardar_research') {
    const slug = await perfilOk(a.perfil, u);
    const list = (Array.isArray(a.posts) ? a.posts : Array.isArray(a.videos) ? a.videos : []).slice(0, 40); if (!list.length) throw new Error('Faltan los posts');
    const num = (v) => (v !== '' && v != null && Number.isFinite(+v) ? +v : undefined);
    const https = (v) => (/^https:\/\/[^\s'"()]+$/.test(String(v || '')) ? String(v) : undefined);
    const secs = (v) => { const m = String(v ?? '').trim().match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/); return m ? (+(m[1] || 0)) * 60 + Math.round(+m[2]) || undefined : undefined; };
    const cfg = await content.cfg(slug), mine = (await db.list('content')).filter((x) => x.kind === 'research' && x.profile === slug);
    const pillars = new Map([...cfg.pillars.map((x) => x.name), ...mine.map((x) => x.pillar)].filter(Boolean).map((x) => [x.toLowerCase(), x]));
    const styles = new Map([...STYLES, ...mine.map((x) => x.style)].filter(Boolean).map((x) => [x.toLowerCase(), x]));
    const t0 = Date.now(), jobs = [], nuevos = [], actualizados = [], malos = [];
    let sinImg = 0;
    const docs = [];
    for (const v of list) {
      const url = https(v.url); if (!url) { malos.push(v.url || '(sin url)'); continue; }
      const m = v.metricas && typeof v.metricas === 'object' ? v.metricas : v;
      const w = v.por_que_funciono && typeof v.por_que_funciono === 'object' ? v.por_que_funciono : null;
      const est = w ? (Array.isArray(w.estructura) ? w.estructura : String(w.estructura || '').split(/\n+|\s*→\s*/)).map((x) => String(x).replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim()).filter(Boolean) : [];
      // Los tags se reparten: pilar, tipo de formato, resonancia y si se habla; lo demás queda como etiqueta libre para filtrar.
      let pillar = v.pilar ? String(v.pilar).slice(0, 80) : undefined, style = v.estilo ? String(v.estilo).slice(0, 40) : undefined, resonance = ['alta', 'media', 'baja'].includes(v.resonancia) ? v.resonancia : undefined, talk = ['no', 'voz', 'si'].includes(v.habla) ? v.habla : undefined;
      const extra = [];
      for (const raw of Array.isArray(v.tags) ? v.tags : []) {
        const tg = String(raw || '').trim().slice(0, 40), k = tg.toLowerCase().replace(/^#/, ''); if (!k) continue;
        const r = k.match(/^resonancia\s*:?\s*(alta|media|baja)$/);
        if (r) resonance ||= r[1]; else if (TALKW[k]) talk ||= TALKW[k]; else if (pillars.has(k) && !pillar) pillar = pillars.get(k); else if (styles.has(k) && !style) style = styles.get(k); else extra.push(tg);
      }
      const red = v.red || (/tiktok\.com/.test(url) ? 'tiktok' : /instagram\.com/.test(url) ? 'instagram' : /linkedin\.com/.test(url) ? 'linkedin' : /youtu/.test(url) ? 'youtube' : 'otra');
      const id = 'rs-' + crypto.createHash('sha256').update(slug + '|' + url.replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase()).digest('hex').slice(0, 20);
      const doc = { kind: 'research', profile: slug, url, red, handle: String(v.creador || v.cuenta || '').replace(/^@/, '').toLowerCase().slice(0, 60) || undefined, tipo: RESEARCH_TIPOS.includes(v.tipo) ? v.tipo : undefined,
        format: ['reel', 'carrusel', 'estatico'].includes(v.formato) ? v.formato : undefined, pillar, resonance, talk, style, tags: extra.length ? [...new Set(extra)].slice(0, 12) : undefined, tested: typeof v.probado === 'boolean' ? v.probado : undefined,
        views: num(m.vistas), likes: num(m.likes), comments: num(m.comentarios), shares: num(m.compartidos), x: num(m.multiplicador ?? m.veces_promedio), er: num(m.engagement_pct), dur: num(m.duracion_s) ? Math.round(+m.duracion_s) : secs(v.duracion),
        at: /^\d{4}-\d{2}-\d{2}/.test(v.fecha || '') ? String(v.fecha).slice(0, 10) : undefined, text: (v.caption || v.texto) ? String(v.caption || v.texto).slice(0, 2000) : undefined,
        title: v.titulo ? String(v.titulo).slice(0, 120) : undefined, diff: num(v.dificultad) ? Math.min(5, Math.max(1, Math.round(+v.dificultad))) : undefined, rec: v.tiempo_grabacion ? String(v.tiempo_grabacion).replace(/\s*grabando\s*$/i, '').slice(0, 40) : undefined,
        receta: Array.isArray(v.receta) && v.receta.length ? v.receta.map((x) => String(x).slice(0, 300)).slice(0, 15) : undefined,
        clips: Array.isArray(v.clips) && v.clips.length ? v.clips.map((c) => (typeof c === 'string' ? { t: '', que: c.slice(0, 300) } : { t: String(c?.tiempo || '').slice(0, 20), que: String(c?.que || '').slice(0, 300) })).filter((c) => c.que).slice(0, 20) : undefined,
        why: w ? { hook: String(w.hook || '').slice(0, 1000), retencion: String(w.retencion || '').slice(0, 1000), estructura: est.map((x) => x.slice(0, 200)).slice(0, 15), por_que: String(w.por_que || '').slice(0, 2000), adaptacion: String(w.adaptacion || '').slice(0, 8000), inferido: Boolean(w.inferido) } : undefined,
        ...(v.plantilla ? { plantilla: String(v.plantilla).slice(0, 40_000), plantilla_at: T } : {}) };
      const had = mine.find((x) => x.id === id) || null;
      // Imágenes: se descargan en paralelo; si una no baja, queda la que ya estaba guardada o el link original.
      const thumb = https(v.miniatura), slides = (Array.isArray(v.slides) ? v.slides : Array.isArray(v.imagenes) ? v.imagenes : []).map(https).filter(Boolean).slice(0, 12);
      if (thumb) jobs.push(async () => { const l = await keepImg(thumb, u.email); if (l) doc.thumb = l; else { sinImg++; if (!isLocal(had?.thumb)) doc.thumb = thumb; } });
      if (slides.length) { const out = [...slides]; doc.slides = out; slides.forEach((s2, i) => jobs.push(async () => { const l = await keepImg(s2, u.email); if (l) out[i] = l; else { sinImg++; if (isLocal(had?.slides?.[i])) out[i] = had.slides[i]; } })); }
      docs.push({ id, doc, had });
    }
    const queue = [...jobs]; const worker = async () => { while (queue.length) { const j = queue.shift(); if (Date.now() - t0 > 45_000) { sinImg++; continue; } await j(); } };
    await Promise.all(Array.from({ length: 6 }, worker));
    for (const { id, doc, had } of docs) {
      await db.upsert('content', id, Object.fromEntries(Object.entries(doc).filter(([, x]) => x !== undefined)), u.email);
      (had ? actualizados : nuevos).push(doc.url);
    }
    return { ok: true, perfil: slug, nuevos: nuevos.length, actualizados: actualizados.length, ...(sinImg ? { imagenes_sin_guardar: sinImg, aviso: 'Algunas imágenes no se pudieron descargar; vuelve a mandar esos posts con su miniatura para reintentar.' } : {}), ...(malos.length ? { sin_url_valida: malos } : {}), abrir: `/#/marcas/${slug}/investigacion` };
  }
  if (name === 'borrar_research') {
    const slug = await perfilOk(a.perfil, u);
    const k = (x) => String(x || '').replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();
    const want = new Set((Array.isArray(a.urls) ? a.urls : []).map(k));
    if (!a.todo && !want.size) throw new Error('Dime los urls a quitar, o todo=true');
    const list = (await db.list('content')).filter((x) => x.kind === 'research' && x.profile === slug && (a.todo || want.has(k(x.url))));
    for (const x of list) await db.remove('content', x.id, u.email);
    return { ok: true, quitados: list.length, abrir: `/#/marcas/${slug}/investigacion` };
  }
  if (name === 'calendario') {
    const slug = await perfilOk(a.perfil, u);
    const mes = /^\d{4}-\d{2}$/.test(a.mes || '') ? a.mes : T.slice(0, 7);
    const all = (await db.list('content')).filter((x) => x.profile === slug && String(x.date || '').startsWith(mes)).sort((x, z) => String(x.date).localeCompare(String(z.date)));
    return { mes, publicacion: all.filter((x) => x.kind === 'post').map((x) => ({ fecha: x.date, titulo: x.title, formato: x.format || '', pilar: x.pillar || '', campana: x.campana || '', consciencia: concienciaDe(x), replica_de: x.replica_de || '', estado: estadoDe(x) })),
      grabacion: all.filter((x) => x.kind === 'shoot').map((x) => ({ fecha: x.date, hora: x.time || '', titulo: x.title, lugar: x.place || '', quien: x.crew || '', piezas: x.pieces || '', estado: x.status || 'Por grabar' })) };
  }
  if (name === 'agendar') {
    const slug = await perfilOk(a.perfil, u);
    const title = String(a.titulo || '').trim().slice(0, 200), date = /^\d{4}-\d{2}-\d{2}$/.test(a.fecha || '') ? a.fecha : null;
    if (!title || !date) throw new Error('Faltan el título o la fecha (AAAA-MM-DD)');
    if (a.calendario === 'grabacion') {
      const r = await db.create('content', { kind: 'shoot', profile: slug, title, date, time: /^\d{1,2}:\d{2}$/.test(a.hora || '') ? a.hora.padStart(5, '0') : '', place: String(a.lugar || '').slice(0, 200), crew: String(a.quien || '').slice(0, 200), pieces: String(a.piezas || '').slice(0, 4000), notes: String(a.notas || '').slice(0, 4000), status: 'Por grabar' }, u.email);
      return { ok: true, id: r.id, calendario: 'grabación', fecha: date, titulo: title, abrir: `/#/marcas/${slug}/calendario` };
    }
    const r = await db.create('content', { kind: 'post', profile: slug, title, format: ['Reel', 'Carrusel', 'TikTok', 'Story', 'Estático', 'YouTube'].includes(a.formato) ? a.formato : 'Reel', pillar: String(a.pilar || ''), ...(a.campana ? { campana: String(a.campana).slice(0, 80) } : {}), ...(concienciaDe(a.consciencia) ? { consciencia: concienciaDe(a.consciencia) } : {}), ...(a.replica_de ? { replica_de: String(a.replica_de).slice(0, 80) } : {}), caption: String(a.notas || '').slice(0, 4000), date, status: 'Idea' }, u.email);
    return { ok: true, id: r.id, calendario: 'publicación', fecha: date, titulo: title, abrir: `/#/marcas/${slug}/calendario` };
  }
  if (name === 'actualizar_idea' || name === 'borrar_idea') {
    const ids = name === 'borrar_idea' ? (Array.isArray(a.ids) ? a.ids : [a.ids]).map(String).filter(Boolean).slice(0, 100) : [String(a.id || '')];
    const out = [], faltan = [], mios = new Set((await perfilesDe(u)).map((x) => x.slug)); // la marca personal y los clientes fuera de tu alcance no existen para ti
    for (const id of ids) {
      const p = await db.get('content', id); if (!p || p.kind !== 'post' || !mios.has(p.profile)) { faltan.push(id); continue; }
      if (name === 'borrar_idea') { await db.remove('content', id, u.email); out.push(id); continue; }
      let patch = { ...p };
      if (a.perfil) patch.profile = await perfilOk(a.perfil, u);
      if (a.titulo) patch.title = String(a.titulo).slice(0, 200);
      if ('fecha' in a) patch.date = /^\d{4}-\d{2}-\d{2}$/.test(a.fecha || '') ? a.fecha : '';
      if (['Reel', 'Carrusel', 'TikTok', 'Story', 'Estático', 'YouTube'].includes(a.formato)) patch.format = a.formato;
      if ('pilar' in a) patch.pillar = String(a.pilar || '').slice(0, 80);
      if ('texto' in a) patch.caption = String(a.texto || '').slice(0, 4000);
      if (a.estado) patch = conEstado(patch, String(a.estado).slice(0, 40));
      const r = await db.update('content', id, patch, p.v, u.email); if (!r) throw new Error('Alguien la cambió justo ahora; intenta de nuevo');
      return { ok: true, id, titulo: r.title, perfil: r.profile, fecha: r.date || '', estado: estadoDe(r) };
    }
    if (name === 'actualizar_idea') throw new Error('No encontré esa idea');
    return { ok: true, borradas: out.length, ...(faltan.length ? { no_encontradas: faltan } : {}) };
  }
  if (name === 'crear_idea') {
    const slug = await perfilOk(a.perfil, u); if (!String(a.titulo || '').trim()) throw new Error('Falta el título');
    const p = await db.create('content', { kind: 'post', profile: slug, title: String(a.titulo).slice(0, 200), format: a.formato || 'Reel', pillar: a.pilar || '', caption: String(a.texto || '').slice(0, 4000), date: /^\d{4}-\d{2}-\d{2}$/.test(a.fecha || '') ? a.fecha : '', status: 'Idea' }, u.email);
    return { ok: true, id: p.id, titulo: p.title };
  }
  if (name === 'facturas') {
    const all = await db.list('invoices');
    const l = all.filter((i) => (!a.tipo || i.kind === a.tipo) && (!a.estado || estadoFactura(i, T) === a.estado)).sort((x, z) => String(x.due || '9').localeCompare(String(z.due || '9')));
    return { hoy: T, totales: totalesFacturas(all, T), facturas: l.slice(0, 200).map(facturaOut(T)) };
  }
  if (name === 'registrar_factura') {
    const kind = a.tipo === 'cobrar' ? 'cobrar' : 'pagar';
    if (kind === 'cobrar') { const c = String(a.cliente || '').trim().toLowerCase(), dirs = (await listDir('clients')).map((d) => d.name), accs = (await db.list('accounts')).map((x) => x.slug || String(x.id).replace(/^acc-/, '')); if (!dirs.includes(c) && !accs.includes(c)) throw new Error(`Cliente «${a.cliente || ''}» no existe. Usa su slug (ver clientes()).`); }
    const r = await facturasLib.registrar(u, { kind, client: a.cliente, vendor: a.proveedor, concept: a.concepto, amount: a.monto, currency: a.moneda, issued: a.emitida, due: a.vence, file_url: a.archivo, notes: a.notas }, 'claude');
    return { ok: true, ...(r.ya_existia ? { ya_existia: true } : {}), factura: facturaOut(T)(r), abrir: '/#/finanzas/fact' };
  }
  if (name === 'marcar_pagada') {
    const r = await facturasLib.marcarPagada(u, a.id, { paid_at: a.fecha, bank_ref: String(a.referencia || '').slice(0, 120) });
    const ef = r.efectos || {}; // lo que se registró solo: el ingreso o el gasto en Finanzas y los costos del mes del cliente
    return { ok: true, ...(r.ya_estaba ? { ya_estaba: true } : {}), factura: facturaOut(T)(r), registrado: { ...(r.kind === 'cobrar' ? { ingreso: Boolean(ef.ingreso), costos_del_mes: (ef.costos || []).length, ...(ef.sinReceta ? { sin_receta: true } : {}), ...(ef.sinMonto ? { lineas_sin_monto: ef.sinMonto } : {}) } : { gasto: Boolean(ef.gasto) }) } };
  }
  throw new Error('Herramienta desconocida');
}
// Una factura como la entrega el conector: en español y con su estado calculado (vencida no se guarda).
const facturaOut = (T) => (i) => ({ id: i.id, tipo: i.kind, ...(i.kind === 'cobrar' ? { cliente: i.client } : { proveedor: i.vendor }), concepto: i.concept, monto: i.amount, moneda: i.currency, emitida: i.issued, vence: i.due, estado: estadoFactura(i, T), ...(i.paid_at ? { pagada_el: i.paid_at } : {}), ...(i.bank_ref ? { referencia_banco: i.bank_ref } : {}), origen: i.source, ...(i.period ? { mes: i.period } : {}), ...(i.file_url ? { archivo: i.file_url } : {}), ...(i.notes ? { notas: i.notes } : {}) });

// JSON-RPC del protocolo MCP (HTTP). Devuelve { status, json } para la ruta.
export async function handle(token, m) {
  const u = await userOfToken(token); if (!u) return { status: 401, json: { error: 'Link inválido o revocado. Conecta de nuevo con https://<app>/mcp' } };
  return run(u, m);
}
// Lo que responde el servidor MCP a una persona ya identificada (por OAuth o por el link viejo).
export async function run(u, m, base = '') {
  if (!m || m.id === undefined) return { status: 202 };
  const ok = (result) => ({ status: 200, json: { jsonrpc: '2.0', id: m.id, result } });
  if (m.method === 'initialize') return ok({ protocolVersion: m.params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'inherent-os', title: 'Inherent OS', version: '1.6.0', ...(base ? { websiteUrl: base, icons: [{ src: `${base}/brand/icon-512.png`, mimeType: 'image/png', sizes: ['512x512'] }, { src: `${base}/brand/emblem-dark.svg`, mimeType: 'image/svg+xml', sizes: ['any'] }] } : {}) }, instructions: `Inherent OS de ${u.name} (${u.role}${u.scope && u.scope !== 'todos' ? `, alcance: ${u.scope === 'propio' ? 'solo lo suyo' : 'solo sus clientes'}` : ''}). Solo ve y cambia lo que su perfil permite (lo decide el CEO en Administración → Vistas por rol). Úsalo para ver pendientes, tareas, clientes, el CRM y contenido; para crear tareas, ideas, cotizaciones o proyectos; para crear y mover leads, anotar su historial e importar prospectos; para ver los resultados (leads por fuente, entregas a tiempo, ingresos del mes, metas de clientes); para guardar videos en Research y agendar grabaciones y publicaciones; y para subir a la Library documentos (SOPs, entrevistas, notas) y archivos de cualquier formato. Antes de guardar contenido, confirma el perfil con perfiles(). Fechas en formato AAAA-MM-DD; hoy es ${today()}. Precios en quetzales salvo que se diga otra moneda.` });
  if (m.method === 'ping') return ok({});
  if (m.method === 'tools/list') return ok({ tools: toolsFor(u) });
  if (m.method === 'tools/call') {
    try { return ok({ content: [{ type: 'text', text: JSON.stringify(await call(u, m.params?.name, m.params?.arguments || {}), null, 1) }] }); }
    catch (e) { return ok({ content: [{ type: 'text', text: e.message }], isError: true }); }
  }
  return { status: 200, json: { jsonrpc: '2.0', id: m.id, error: { code: -32601, message: 'Método no soportado' } } };
}
