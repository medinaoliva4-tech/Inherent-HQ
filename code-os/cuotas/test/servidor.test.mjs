import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crearServidor } from '../servidor.mjs';

test('GET /cuotas lee el jsonl y /evento agrega', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cuotas-'));
  const eventos = join(dir, 'e.jsonl'), limites = join(dir, 'l.json');
  const ahora = () => Date.parse('2026-11-10T10:00:00Z');
  writeFileSync(limites, JSON.stringify({ modelscope: { ventanas: { dia: { llamadas: 2 } } } }));
  writeFileSync(eventos, JSON.stringify({ ts: '2026-11-10T09:59:00Z', api_base: 'https://api-inference.modelscope.cn/v1', http: 200 }) + '\nbasura\n');
  const srv = crearServidor({ eventos, limites, token: 'x', avisosRuta: join(dir, 'a.jsonl'), ahora });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  assert.equal((await fetch(base + '/cuotas')).status, 401);
  const h = { authorization: 'Bearer x', 'content-type': 'application/json' };
  let j = await (await fetch(base + '/cuotas', { headers: h })).json();
  const ms = j.proveedores.find((p) => p.id === 'modelscope');
  assert.equal(ms.ventanas.dia.llamadas, 1); assert.equal(ms.ventanas.dia.nivel, 'ok');
  await fetch(base + '/evento', { method: 'POST', headers: h, body: JSON.stringify({ proveedor: 'modelscope', http: 200 }) });
  j = await (await fetch(base + '/cuotas', { headers: h })).json();
  assert.equal(j.proveedores.find((p) => p.id === 'modelscope').nivel, 'agotado');
  assert.equal((await fetch(base + '/salud')).status, 200);
  srv.closeAllConnections(); srv.close();
});
