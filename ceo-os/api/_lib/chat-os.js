import { leer, leeColeccion } from './leer.js';
import { carpetaDe } from '../../public/js/llm/carpetas.js';
import { ACCIONES_OS } from '../../public/js/chat-os-datos.js';
const lc = v => String(v || '').toLowerCase();
const texto = v => String(v ?? '').slice(0, 240);
const numeros = new Set(['costo','ticket','margen_pct','ingreso','n']);
const campos = (d, ks) => Object.fromEntries(ks.filter(k => d[k] != null).map(k => [k, numeros.has(k) ? (d[k] !== '' && Number.isFinite(Number(d[k])) ? Number(d[k]) : null) : texto(d[k])]));
const activo = d => !d.archivado && !d.archived;
const slug = d => lc(d.client_slug || d.cliente || 'inherent');
const colecciones = { clientes: 'accounts', proyectos: 'projects', leads: 'leads', tareas: 'tasks', movimientos: 'movimientos', embudo: 'embudos' };
export async function leerOS(u, sesion, args = {}) {
  if (!u || u.active === false || u.role === 'client' || lc(sesion?.owner) !== lc(u.email)) throw new Error('Esta persona no puede leer esta conversación.');
  if (!ACCIONES_OS.includes(args.accion) || Object.keys(args).some(k => !['accion','desde'].includes(k))) throw new Error('Elige una lectura permitida del OS.');
  const desde = args.desde ?? 0;
  if (!Number.isInteger(desde) || desde < 0 || desde > 10000) throw new Error('Página inválida.');
  const cliente = lc(carpetaDe(sesion)), coll = colecciones[args.accion];
  if (cliente === 'personal' && (u.role !== 'ceo' || coll !== 'tasks')) throw new Error('En Personal solo se consultan tus tareas personales.');
  if (!leeColeccion(u, coll)) throw new Error('Tu perfil no puede leer esa sección del OS.');
  let xs = (await leer(u, coll)).filter(activo), items;
  if (coll === 'accounts') {
    xs = xs.filter(d => cliente === 'inherent' || lc(d.slug || String(d.id).replace(/^acc-/,'')) === cliente);
    items = xs.map(d => ({ id: d.id, slug: texto(d.slug || String(d.id).replace(/^acc-/,'')), nombre: texto(d.name) }));
  } else if (coll === 'tasks') {
    const proyectos = await leer(u, 'projects'), porId = new Map(proyectos.map(p => [p.id, slug(p)]));
    xs = xs.filter(t => cliente === 'personal' ? t.tipo === 'Personal' : t.tipo !== 'Personal' && (t.project_id ? porId.get(t.project_id) === cliente : slug(t) === cliente) && (!t.client_slug || lc(t.client_slug) === cliente) && (!t.cliente || lc(t.cliente) === cliente));
    items = xs.map(d => campos(d, ['id','title','status','due','project_id','tipo','assignee']));
  } else {
    xs = xs.filter(d => slug(d) === cliente);
    if (coll === 'projects') items = xs.map(d => ({ ...campos(d,['id','name','status','kind','client_slug']), fases: (d.phases || []).slice(0,12).map(p => campos(p,['name','status'])) }));
    if (coll === 'leads') items = xs.map(d => campos(d,['id','name','company','stage','owner_role']));
    if (coll === 'movimientos') items = xs.map(d => campos(d,['id','titulo','area','espera','paso','decision','fecha', ...(u.role === 'ceo' ? ['costo'] : [])]));
    if (coll === 'embudos') items = xs.map(d => ({ ...campos(d,['id','mes', ...(u.role === 'ceo' ? ['ticket','margen_pct'] : [])]), etapas: (d.etapas || []).slice(0,5).map(e => campos(e,['nombre','n'])), ...(u.role === 'ceo' ? { lineas: (d.lineas || []).slice(0,5).map(l => campos(l,['nombre','tipo','ingreso','costo'])) } : {}) }));
  }
  items.sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  // Limita tanto las filas como los caracteres para no llenar la ventana con un resultado.
  const pagina=[]; let chars=0;
  for (const item of items.slice(desde,desde+20)) { const n=JSON.stringify(item).length; if (pagina.length && chars+n>5000) break; pagina.push(item);chars+=n; }
  return { fuente: 'Inherent OS', accion: args.accion, cliente, consultado: new Date().toISOString(), total: items.length, items: pagina, siguiente: desde+pagina.length<items.length ? desde+pagina.length : null };
}
