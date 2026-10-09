// Base de datos: Postgres (Neon en Vercel). En local, PGlite (el mismo Postgres, en WASM).
// Todo vive en una tabla de documentos: (colección, id) → JSON, con versión para no pisar cambios.
import crypto from 'node:crypto';

let q;
async function conn() {
  if (q) return q;
  if (process.env.DATABASE_URL) {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    q = (text, params = []) => sql.query(text, params);
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
export async function create(coll, data, who, id = newId()) {
  const r = (await (await conn())('INSERT INTO docs (coll,id,data,created_by,updated_by) VALUES ($1,$2,$3::jsonb,$4,$4) RETURNING *', [coll, id, JSON.stringify(clean(data)), who]))[0];
  await audit(who, 'create', coll, id);
  return row(r);
}
// v = la versión que el cliente leyó. Si alguien la cambió antes, no se pisa: devuelve null.
export async function update(coll, id, data, v, who) {
  const r = (await (await conn())('UPDATE docs SET data=$3::jsonb, v=v+1, updated_at=now(), updated_by=$5 WHERE coll=$1 AND id=$2 AND v=$4 RETURNING *', [coll, id, JSON.stringify(clean(data)), v, who]))[0];
  if (r) await audit(who, 'update', coll, id);
  return row(r) || null;
}
export async function upsert(coll, id, data, who) {
  const r = (await (await conn())(`INSERT INTO docs (coll,id,data,created_by,updated_by) VALUES ($1,$2,$3::jsonb,$4,$4)
    ON CONFLICT (coll,id) DO UPDATE SET data=docs.data || EXCLUDED.data, v=docs.v+1, updated_at=now(), updated_by=$4 RETURNING *`, [coll, id, JSON.stringify(clean(data)), who]))[0];
  return row(r);
}
export async function remove(coll, id, who) {
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
