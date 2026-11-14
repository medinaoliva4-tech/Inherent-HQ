// Propuestas MCP externas: ninguna tool corre desde el texto del modelo. La persona aprueba contenido exacto.
import crypto from 'node:crypto';
import * as db from './db.js';
import { seal, open } from './vault.js';
import { scoper } from './access.js';
import { canon } from '../../public/js/entregables.js';
const COLL = 'external_actions';
const hash = (x) => crypto.createHash('sha256').update(canon(x)).digest('hex');
const fail = (status, code, message) => { throw Object.assign(new Error(message), { status, code }); };
const toolHash = (t) => hash({ conector: t.conector, name: t.tool.name, schema: t.tool.inputSchema || {} });
const actionHash = (u, tool, args, scope) => hash({ owner: u.email, tool, args, scope });
const payload = (d) => JSON.parse(open(d.payload));
async function scopeOK(u, slug) {
  if (!slug) return u.role === 'ceo' || u.role === 'coo';
  if (!/^[\w-]{2,60}$/.test(slug) || (slug === 'personal' && u.role !== 'ceo')) return false;
  const sc = await scoper(u); return !sc || slug === 'inherent' || sc.client(slug);
}
export function validArgs(value, schema = {}, depth = 0) {
  if (depth > 12 || value === undefined) return false;
  if (schema.enum && !schema.enum.some((x) => canon(x) === canon(value))) return false;
  const type = schema.type;
  if (Array.isArray(type)) return type.some((t) => validArgs(value, { ...schema, type: t }, depth + 1));
  if (type === 'null') return value === null;
  if (type === 'string') return typeof value === 'string' && value.length <= (schema.maxLength ?? 60000);
  if (type === 'boolean') return typeof value === 'boolean';
  if (['number', 'integer'].includes(type)) return typeof value === 'number' && Number.isFinite(value) && (type !== 'integer' || Number.isInteger(value)) && (schema.minimum == null || value >= schema.minimum) && (schema.maximum == null || value <= schema.maximum);
  if (type === 'array' || Array.isArray(value)) return Array.isArray(value) && value.length <= (schema.maxItems ?? 200) && value.every((x) => validArgs(x, schema.items || {}, depth + 1));
  if (type === 'object' || (value !== null && typeof value === 'object')) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    if ((schema.required || []).some((k) => !(k in value))) return false;
    return Object.keys(value).every((k) => !['__proto__', 'constructor', 'prototype'].includes(k) && (schema.additionalProperties !== false || k in (schema.properties || {})) && validArgs(value[k], schema.properties?.[k] || {}, depth + 1));
  }
  return !type && (value === null || ['string', 'number', 'boolean'].includes(typeof value));
}
export async function proponerAccion(u, t, args, { scope = '', key = crypto.randomUUID() } = {}) {
  if (!t?.conector || !t?.tool?.name) fail(400, 'TOOL_DESCONOCIDA', 'Herramienta desconocida');
  if (!(await scopeOK(u, scope))) fail(403, 'ALCANCE', 'Elige una marca dentro de tu alcance');
  if (!validArgs(args, t.tool.inputSchema || { type: 'object' }) || canon(args).length > 100000) fail(400, 'PARAMETROS', 'Los parámetros no cumplen el contrato de la herramienta');
  const catalog = toolHash(t), digest = actionHash(u, catalog, args, scope), id = hash({ owner: u.email, key, digest });
  let d = await db.get(COLL, id);
  if (!d) {
    try { d = await db.create(COLL, { owner: u.email, conector: t.conector, tool: t.tool.name, catalog, digest, scope, payload: seal(canon(args)), estado: 'needs_approval', expires: Date.now() + 15 * 60000 }, u.email, id); }
    catch (e) { if (!/duplicate|unique/i.test(e.message)) throw e; d = await db.get(COLL, id); }
  }
  return { id: d.id, version: d.v, hash: d.digest, conector: d.conector, tool: d.tool, scope: d.scope, params: payload(d), estado: d.estado, expires: d.expires };
}
export async function leerAccion(u, id) {
  const d = await db.get(COLL, id); if (!d || d.owner !== u.email) fail(404, 'NO_EXISTE', 'La acción no existe');
  if (!(await scopeOK(u, d.scope))) fail(403, 'ALCANCE', 'Ya no tienes acceso a esta marca');
  return d;
}
export async function ejecutarAccion(u, id, approval, { catalogo, ejecutar }) {
  let d = await leerAccion(u, id);
  if (d.digest !== approval.hash || d.v !== Number(approval.expected_version)) fail(409, 'CONFLICTO', 'La acción cambió: vuelve a revisarla');
  if (d.estado !== 'needs_approval') return { id, estado: d.estado }; // no vuelve a ejecutar
  if (d.expires <= Date.now()) fail(410, 'EXPIRADA', 'La aprobación expiró; prepara otra propuesta');
  const available = await catalogo(u.email, [d.conector]), t = available.find((x) => x.conector === d.conector && x.tool.name === d.tool);
  if (!t || toolHash(t) !== d.catalog) fail(409, 'CATALOGO_CAMBIO', 'La herramienta cambió o está desconectada: prepara otra propuesta');
  const args = payload(d);
  if (d.digest !== actionHash(u, toolHash(t), args, d.scope)) fail(409, 'CONFLICTO', 'El contenido de la acción cambió');
  const claimed = await db.update(COLL, id, { ...d, estado: 'executing', approval: { por: u.email, at: Date.now(), hash: d.digest, scope: d.scope, version: d.v } }, d.v, u.email);
  if (!claimed) fail(409, 'CONFLICTO', 'Otra solicitud ya tomó esta acción');
  let estado, out;
  try { out = await ejecutar(t.cx, t.sesion, t.tool.name, args); estado = out.error ? 'failed' : 'succeeded'; }
  catch { estado = 'resultado_desconocido'; }
  await db.update(COLL, id, { ...claimed, estado, finished: Date.now() }, claimed.v, u.email);
  return { id, estado, ...(out ? { texto: out.texto } : { texto: 'El proveedor pudo recibir la acción. Revisa allí el resultado antes de preparar otra.' }) };
}
