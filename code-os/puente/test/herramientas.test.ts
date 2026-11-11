import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AlmacenJson, Memoria } from 'code-os-herramientas';
import { boot, fakeQuery, fakeServices, init, result, testConfig, TOKEN_B } from './helpers.js';

const simple = async function* () { yield init(); yield result(); };
const conHerramientas = () => boot(fakeQuery(simple), testConfig(), fakeServices({ herramientas: new Memoria(new AlmacenJson(mkdtempSync(join(tmpdir(), 'herr-')))) }));

test('herramientas: todas las rutas exigen token (como las demás)', async () => {
  const t = await conHerramientas();
  for (const [m, p] of [['GET', '/clientes'], ['GET', '/clientes/akai/nodos'], ['POST', '/calc/outbound'], ['POST', '/clientes/akai/calibrar'], ['GET', '/clientes/akai/avisos']] as const)
    assert.equal((await t.api(m, p, m === 'POST' ? {} : undefined, null)).status, 401, `${m} ${p}`);
  await t.close();
});

test('herramientas: flujo por HTTP y regla de leer antes de aprobar por persona', async () => {
  const t = await conHerramientas();
  assert.deepEqual((await t.api('GET', '/clientes')).json, { clientes: [] });
  const c = await t.api('POST', '/clientes/akai/nodos', { tipo: 'dolor', titulo: 'Sin tiempo para comer' });
  assert.equal(c.status, 201); assert.equal(c.json.nodo.actualizado_por, 'ana');
  await t.api('POST', '/clientes/akai/nodos', { tipo: 'pilar', titulo: 'Pausa real', viene_de: ['dolor-1'] });
  // bea abre el nodo; ana no puede aprobar sin abrirlo ella
  assert.equal((await t.api('GET', '/clientes/akai/nodos/dolor-1', undefined, TOKEN_B)).status, 200);
  assert.equal((await t.api('POST', '/clientes/akai/nodos/dolor-1/aprobar')).status, 409);
  assert.equal((await t.api('POST', '/clientes/akai/nodos/dolor-1/aprobar', undefined, TOKEN_B)).json.nodo.aprobado_por, 'bea');
  const put = await t.api('PUT', '/clientes/akai/nodos/dolor-1', { contenido: 'Comen frente a la compu', version: 1 });
  assert.equal(put.json.nodo.estado, 'hipotesis');
  assert.equal(put.json.avisos[0].mensaje, 'cambió Strategy: dolor #1 «Sin tiempo para comer» → revisa pilar #1 «Pausa real»');
  assert.equal((await t.api('GET', '/clientes/akai/nodos/dolor-1/dependientes')).json.dependientes[0].id, 'pilar-1');
  assert.equal((await t.api('GET', '/clientes/akai/avisos')).json.avisos.length, 1);
  assert.equal((await t.api('GET', '/clientes/akai/nodos/nada')).status, 404);
  assert.equal((await t.api('POST', '/calc/outbound', { m: 5, c: 0.01, P: 0.95, w: 4 })).json.resultado.n, 913);
  assert.equal((await t.api('POST', '/calc/inbound', { clientes_meta: 1, tasas: { clic: 0.1, lead: 0.1, cliente: 0.1 }, engagement_objetivo: 0.05 })).json.resultado.alcance, 1000);
  await t.close();
});

test('herramientas: sin memoria configurada responde 503 y no rompe el resto', async () => {
  const t = await boot(fakeQuery(simple));
  assert.equal((await t.api('GET', '/clientes')).status, 503);
  assert.equal((await t.api('GET', '/models')).status, 200);
  await t.close();
});
