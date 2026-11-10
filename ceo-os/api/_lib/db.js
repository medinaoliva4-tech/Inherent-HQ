// Base de datos: Postgres (Supabase, o Neon si la URL es de Neon). En local, PGlite (el mismo Postgres, en WASM).
// Todo vive en una tabla de documentos: (colección, id) → JSON, con versión para no pisar cambios.
import crypto from 'node:crypto';
import { consultar } from './db-transporte.js';
import { crearSql } from './db-cliente.js';

let q, conectando;
async function conn() {
  if (q) return q;
  if (!conectando) conectando = abrir().then((ejecutar) => (q = ejecutar)).finally(() => { conectando = null; });
  return conectando;
}
async function abrir() {
  let q;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    const sql = await crearSql(url);
    q = (text, params = []) => consultar(sql, text, params);
  } else if (process.env.LOCAL_DB && !process.env.VERCEL) {
    const mod = '@electric-sql/pglite';
    const { PGlite } = await import(mod);
    const db = new PGlite(process.env.LOCAL_DB);
    q = async (text, params = []) => (await db.query(text, params)).rows;
  } else {
    throw Object.assign(new Error('La base de datos no está conectada (falta DATABASE_URL)'), { code: 'NO_DB' });
  }
  await q(`CREATE TABLE IF NOT EXISTS docs (
    coll text NOT NULL, id text NOT NULL, data jsonb NOT NULL, v int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
    created_by text, updated_by text, PRIMARY KEY (coll, id))`);
  await q(`CREATE TABLE IF NOT EXISTS vault (k text PRIMARY KEY, val text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`);
  await q(`CREATE TABLE IF NOT EXISTS audit (id bigserial PRIMARY KEY, at timestamptz NOT NULL DEFAULT now(), who text, action text, coll text, doc text)`);
  return q;
}

const row = (r) => r && ({ id: r.id, v: r.v, ...r.data, _meta: { created_at: r.created_at, updated_at: r.updated_at, created_by: r.created_by, updated_by: r.updated_by } });
export const newId = () => Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
const audit = async (who, action, coll, id) => (await conn())('INSERT INTO audit (who, action, coll, doc) VALUES ($1,$2,$3,$4)', [who, action, coll, id]);

export async function list(coll) {
  return (await (await conn())('SELECT * FROM docs WHERE coll=$1 ORDER BY created_at', [coll])).map(row);
}
export async function get(coll, id) {
  return row((await (await conn())('SELECT * FROM docs WHERE coll=$1 AND id=$2', [coll, id]))[0]);
}
// Solo metadatos: no cargar los historiales de todas las conversaciones para sondear.
export async function avisosChat({ owner, pendientes = false } = {}) {
  if (!owner && !pendientes) return [];
  return (await conn())(`SELECT coll, id, data->'aviso_chat' AS aviso,
    data->>'owner' AS owner, data->>'creado_por' AS creado_por, data->>'cliente' AS cliente FROM docs
    WHERE coll IN ('chat_sesiones','agent_runs') AND data->'aviso_chat' IS NOT NULL
    AND coalesce(data->>'archivado','false') <> 'true' AND coalesce(data->>'oculto','false') <> 'true'
    AND data->'aviso_chat'->>'at' > $1
    ${owner ? "AND lower(data->'aviso_chat'->>'owner') = $2" : "AND data->'aviso_chat'->>'enviado' = 'false'"}
    ORDER BY data->'aviso_chat'->>'at' DESC LIMIT 40`, [new Date(Date.now() - 7 * 86400000).toISOString(), ...(owner ? [owner.toLowerCase()] : [])]);
}
export async function avisoChatEntregado(coll, id, evento) {
  await (await conn())(`UPDATE docs SET data=jsonb_set(data,'{aviso_chat,enviado}','true'), v=v+1
    WHERE coll=$1 AND id=$2 AND data->'aviso_chat'->>'id'=$3`, [coll, id, evento]);
}
// Para cancelar una generación sin releer todo el historial.
export async function estadoChat(id) {
  return (await (await conn())("SELECT data->'turno'->>'estado' AS estado FROM docs WHERE coll='chat_sesiones' AND id=$1", [id]))[0]?.estado;
}
// Cuántas escrituras hubo en esta instancia: las memorias cortas (los Avisos) se olvidan cuando cambia.
let escrituras = 0;
export const version = () => escrituras;
export async function create(coll, data, who, id = newId()) {
  escrituras++;
  const r = (await (await conn())('INSERT INTO docs (coll,id,data,created_by,updated_by) VALUES ($1,$2,$3::jsonb,$4,$4) RETURNING *', [coll, id, JSON.stringify(clean(data)), who]))[0];
  await audit(who, 'create', coll, id);
  return row(r);
}
// v = la versión que el cliente leyó. Si alguien la cambió antes, no se pisa: devuelve null.
export async function update(coll, id, data, v, who) {
  escrituras++;
  const r = (await (await conn())('UPDATE docs SET data=$3::jsonb, v=v+1, updated_at=now(), updated_by=$5 WHERE coll=$1 AND id=$2 AND v=$4 RETURNING *', [coll, id, JSON.stringify(clean(data)), v, who]))[0];
  if (r) await audit(who, 'update', coll, id);
  return row(r) || null;
}
export async function upsert(coll, id, data, who) {
  escrituras++;
  const r = (await (await conn())(`INSERT INTO docs (coll,id,data,created_by,updated_by) VALUES ($1,$2,$3::jsonb,$4,$4)
    ON CONFLICT (coll,id) DO UPDATE SET data=docs.data || EXCLUDED.data, v=docs.v+1, updated_at=now(), updated_by=$4 RETURNING *`, [coll, id, JSON.stringify(clean(data)), who]))[0];
  return row(r);
}
export async function remove(coll, id, who) {
  escrituras++;
  const r = await (await conn())('DELETE FROM docs WHERE coll=$1 AND id=$2 RETURNING id', [coll, id]);
  if (r.length) await audit(who, 'delete', coll, id);
  return r.length > 0;
}
export async function vaultGet(k) { return (await (await conn())('SELECT val FROM vault WHERE k=$1', [k]))[0]?.val ?? null; }
export async function vaultSet(k, val) {
  await (await conn())('INSERT INTO vault (k,val) VALUES ($1,$2) ON CONFLICT (k) DO UPDATE SET val=EXCLUDED.val, updated_at=now()', [k, val]);
}
export async function ping() { await (await conn())('SELECT 1'); return true; }

// Nunca se guardan los campos internos que manda el cliente.
function clean(d) { const { id, v, _meta, ...rest } = d || {}; return rest; }
