// El trabajador no debe martillar la base: consulta ligera, espera creciente y una pausa larga si se acabó la cuota.
// La consulta se valida contra un Postgres real (pglite), no contra un simulacro.
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { SQL_ETAPAS_PENDIENTES } from '../gateway/consultas.mjs';
import { cuotaAgotada, siguienteEspera } from '../gateway/resiliencia.mjs';
let ok = 0;
const t = async (nombre, f) => { await f(); ok++; console.log('✓', nombre); };

const pg = new PGlite();
await pg.exec('CREATE TABLE docs (coll text NOT NULL, id text NOT NULL, data jsonb NOT NULL, PRIMARY KEY (coll, id))');
const pon = (coll, id, data) => pg.query('INSERT INTO docs (coll, id, data) VALUES ($1, $2, $3::jsonb)', [coll, id, JSON.stringify(data)]);
const E = (...estados) => estados.map((estado) => ({ estado }));
await pon('agent_runs', 'espera', { etapas: E('aprobada', 'en_cola', 'pendiente') });
await pon('agent_runs', 'trabajando', { etapas: E('trabajando') });
await pon('agent_runs', 'terminada', { etapas: E('aprobada', 'aprobada') });
await pon('agent_runs', 'en-revision', { etapas: E('aprobada', 'revision', 'pendiente') });
await pon('agent_runs', 'archivada', { archivado: true, etapas: E('en_cola') });
await pon('agent_runs', 'pausada', { pausado: true, etapas: E('en_cola') });
await pon('agent_runs', 'sin-etapas', { titulo: 'x' });
await pon('agent_runs', 'etapas-objeto', { etapas: { estado: 'en_cola' } });
await pon('agent_runs', 'archivado-falso', { archivado: false, pausado: false, etapas: E('en_cola') });
await pon('chat_sesiones', 'otra-coleccion', { etapas: E('en_cola') });

await t('la consulta devuelve solo las corridas con una etapa esperando o colgada', async () => {
  const ids = (await pg.query(SQL_ETAPAS_PENDIENTES, ['agent_runs'])).rows.map((r) => r.id).sort();
  assert.deepEqual(ids, ['archivado-falso', 'espera', 'trabajando']);
});
await t('no falla con etapas ausentes o mal formadas, ni mezcla otras colecciones', async () => {
  const ids = (await pg.query(SQL_ETAPAS_PENDIENTES, ['agent_runs'])).rows.map((r) => r.id);
  for (const malo of ['sin-etapas', 'etapas-objeto', 'otra-coleccion', 'archivada', 'pausada', 'terminada', 'en-revision']) assert.ok(!ids.includes(malo), malo);
});
await t('la consulta no trae el contenido de las corridas, solo su id', async () => {
  const r = (await pg.query(SQL_ETAPAS_PENDIENTES, ['agent_runs'])).rows[0];
  assert.deepEqual(Object.keys(r), ['id']);
});
await t('la espera sube al doble con cada fallo y se detiene a los 5 minutos', () => {
  assert.equal(siguienteEspera({ fallos: 0 }), 3000);
  assert.deepEqual([1, 2, 3, 4].map((fallos) => siguienteEspera({ fallos })), [6000, 12000, 24000, 48000]);
  assert.equal(siguienteEspera({ fallos: 50 }), 5 * 60 * 1000);
  assert.equal(siguienteEspera({ normal: 1000, fallos: 2 }), 4000);
});
await t('si se acabó la cuota espera 10 minutos aunque sea el primer fallo', () => {
  assert.equal(siguienteEspera({ fallos: 1, cuota: true }), 10 * 60 * 1000);
  assert.equal(siguienteEspera({ fallos: 0, cuota: true }), 10 * 60 * 1000);
});
await t('reconoce el error real de cuota de Neon y no confunde un corte de red', () => {
  const real = new Error('Server error (HTTP status 402): {"message":"Your account or project has exceeded the quota. Upgrade your plan to increase limits."}');
  assert.equal(cuotaAgotada(real), true);
  assert.equal(cuotaAgotada(Object.assign(new Error('x'), { cause: new Error('exceeded the quota') })), true);
  assert.equal(cuotaAgotada(new TypeError('fetch failed')), false);
  assert.equal(cuotaAgotada(new Error('connection timeout after 402 ms')), false);
  assert.equal(cuotaAgotada(null), false);
});
console.log(`${ok} pruebas del trabajador y la base OK`);
process.exit(0);
