// Prueba pura (sin red): elección de driver, TLS estricto y forma de la consulta.
import assert from 'node:assert/strict';
import { esNeon, opcionesSsl, crearSql } from '../api/_lib/db-cliente.js';

assert.equal(esNeon('postgres://u:p@ep-steep-cake-123.eu-central-1.aws.neon.tech/db'), true);
assert.equal(esNeon('postgres://u:p@aws-0-us-east-1.pooler.supabase.com:6543/postgres'), false);
assert.equal(esNeon('postgres://u:p@db.example.com/neon.tech.fake'), false);

assert.deepEqual(opcionesSsl('postgres://u:p@localhost:5432/x', {}), false);
assert.deepEqual(opcionesSsl('postgres://u:p@aws-0.pooler.supabase.com:6543/postgres', {}), { rejectUnauthorized: true });
const conCa = opcionesSsl('postgres://u:p@aws-0.pooler.supabase.com:6543/postgres', { DB_SSL_CA: 'A\\nB' });
assert.equal(conCa.ca, 'A\nB'); assert.equal(conCa.rejectUnauthorized, true); // nunca se desactiva la verificación

let visto;
class PoolFalso { constructor(o) { visto = { opts: o, llamadas: [] }; } on() {} async query(q) { visto.llamadas.push(q); return { rows: [{ ok: 1 }] }; } }
const sql = await crearSql('postgres://u:p@aws-0.pooler.supabase.com:6543/postgres', { PgPool: PoolFalso, env: {} });
assert.deepEqual(await sql.query('SELECT $1::int AS ok', [1], { fetchOptions: {} }), [{ ok: 1 }]);
assert.equal(visto.opts.max, 1); assert.equal(visto.opts.ssl.rejectUnauthorized, true);
assert.deepEqual(visto.llamadas[0].values, [1]);
console.log('db-cliente: ok');
import { writeFileSync, mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const f = join(mkdtempSync(join(tmpdir(), 'ca-')), 'ca.pem'); writeFileSync(f, 'PEM');
assert.equal(opcionesSsl('postgres://u:p@h.supabase.com:6543/postgres', { DB_SSL_CA_FILE: f }).ca, 'PEM');
console.log('db-cliente (CA desde archivo): ok');
