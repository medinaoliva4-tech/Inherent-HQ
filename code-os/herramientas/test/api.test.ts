import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AlmacenMemoria } from '../src/almacen.js';
import { Memoria } from '../src/memoria.js';
import { manejarHerramientas, esRutaHerramientas } from '../src/api.js';

const nueva = () => {
  const mem = new Memoria(new AlmacenMemoria());
  const crudo = (method: string, ruta: string, body?: unknown, usuario = 'ana') => {
    const u = new URL(ruta, 'http://x');
    return manejarHerramientas(mem, { method, path: u.pathname, query: u.searchParams, body, usuario });
  };
  const q = async (method: string, ruta: string, body?: unknown, usuario = 'ana') => (await crudo(method, ruta, body, usuario))!;
  return { mem, q, crudo };
};

test('rutas: reconoce solo /clientes y /calc', () => {
  assert.ok(esRutaHerramientas('/clientes') && esRutaHerramientas('/clientes/akai/nodos') && esRutaHerramientas('/calc/outbound'));
  assert.ok(!esRutaHerramientas('/sessions') && !esRutaHerramientas('/clientesx'));
});

test('API: flujo completo crear → leer → editar → dependientes → avisos → aprobar', async () => {
  const { q } = nueva();
  assert.deepEqual(await q('GET', '/clientes'), { status: 200, body: { clientes: [] } });
  const p = await q('POST', '/clientes/akai/nodos', { tipo: 'dolor', titulo: 'Sin tiempo' });
  assert.equal(p.status, 201); assert.equal(p.body.nodo.id, 'dolor-1');
  const h = await q('POST', '/clientes/akai/nodos', { tipo: 'pilar', titulo: 'Pausa', viene_de: ['dolor-1'] });
  assert.equal(h.body.nodo.id, 'pilar-1');
  assert.deepEqual((await q('GET', '/clientes/akai/nodos?tipo=pilar')).body.nodos.map((n: any) => n.id), ['pilar-1']);
  assert.equal((await q('POST', '/clientes/akai/nodos/dolor-1/aprobar')).status, 409);
  const r = await q('GET', '/clientes/akai/nodos/dolor-1');
  assert.equal(r.status, 200); assert.deepEqual(r.body.historial, []); assert.equal(r.body.nodo.leido_por[0].usuario, 'ana');
  const put = await q('PUT', '/clientes/akai/nodos/dolor-1', { contenido: 'nuevo', version: 1 });
  assert.equal(put.body.nodo.version, 2); assert.equal(put.body.avisos.length, 1);
  assert.equal((await q('PUT', '/clientes/akai/nodos/dolor-1', { contenido: 'x', version: 1 })).status, 409);
  const deps = await q('GET', '/clientes/akai/nodos/dolor-1/dependientes');
  assert.deepEqual(deps.body, { nodo: 'dolor-1', dependientes: [{ id: 'pilar-1', tipo: 'pilar', numero: 1, titulo: 'Pausa', estado: 'hipotesis', distancia: 1, ruta: ['dolor-1', 'pilar-1'] }] });
  const av = await q('GET', '/clientes/akai/avisos');
  assert.equal(av.body.avisos.length, 1);
  const res = await q('POST', `/clientes/akai/avisos/${av.body.avisos[0].id}/resolver`);
  assert.equal(res.body.aviso.resuelto, true);
  assert.equal((await q('GET', '/clientes/akai/avisos?todos=1')).body.avisos.length, 1);
  await q('GET', '/clientes/akai/nodos/dolor-1');
  const ok = await q('POST', '/clientes/akai/nodos/dolor-1/aprobar');
  assert.equal(ok.status, 200); assert.equal(ok.body.nodo.estado, 'aprobado');
  assert.deepEqual((await q('GET', '/clientes')).body.clientes.map((c: any) => [c.id, c.nodos]), [['akai', 2]]);
  const g = await q('GET', '/clientes/akai/grafo');
  assert.equal(g.body.nodes.length, 2);
  assert.match((await q('GET', '/clientes/akai/grafo?formato=markdown')).body.markdown, /# Hilo de akai/);
});

test('API: errores con status y mensaje; rutas ajenas devuelven null', async () => {
  const { q, crudo } = nueva();
  assert.equal((await q('GET', '/clientes/akai/nodos/nada')).status, 404);
  assert.equal((await q('POST', '/clientes/AKAI/nodos', { tipo: 'dolor', titulo: 'x' })).status, 400);
  assert.equal((await q('POST', '/clientes/akai/nodos', { tipo: 'icp', titulo: 'x', contenido: { margen: 9 } })).body.detalle.errores[0].campo, 'margen');
  assert.equal((await q('DELETE', '/clientes/akai/nodos/x')).status, 405);
  assert.equal(await crudo('GET', '/sessions'), null);
  assert.equal((await q('GET', '/clientes/akai/grafo?formato=pdf')).status, 400);
});

test('API: calculadoras', async () => {
  const { q } = nueva();
  const o = await q('POST', '/calc/outbound', { m: 5, c: 0.01, P: 0.95, w: 4 });
  assert.deepEqual([o.status, o.body.resultado.n, o.body.resultado.por_semana, o.body.resultado.por_dia_habil], [200, 913, 229, 46]);
  assert.equal((await q('POST', '/calc/outbound', { m: 5, c: 0, P: 0.95, w: 4 })).status, 400);
  const i = await q('POST', '/calc/inbound', { clientes_meta: 10, tasas: { clic: 0.01, lead: 0.2, cliente: 0.1 }, engagement_objetivo: 0.05 });
  assert.equal(i.body.resultado.alcance, 50_000);
  const icp = await q('POST', '/calc/icp', { moneda: 'USD' });
  assert.equal(icp.body.validacion.ok, true); assert.equal(icp.body.validacion.completo, false);
});

test('API: calibrar con analytics de Zernio y guardar en el nodo de adquisición', async () => {
  const { q } = nueva();
  await q('POST', '/clientes/akai/nodos', { tipo: 'adquisicion', titulo: 'Plan inbound', contenido: { nota: 'v1' } });
  const body = {
    entradas: { clientes_meta: 10, tasas: { clic: 0.01, lead: 0.2, cliente: 0.1 }, engagement_objetivo: 0.05 },
    analytics: { dateRange: { from: '2026-10-01', to: '2026-10-31' }, totals: { impressions: 120_000, reach: 80_000, clicks: 1200, likes: 3000 } },
    extras: { leads: 60 },
    guardar_en: 'adquisicion-1',
  };
  const r = await q('POST', '/clientes/akai/calibrar', body);
  assert.equal(r.status, 200);
  assert.equal(r.body.resultado.origen.clic.fuente, 'real');
  assert.equal(r.body.resultado.origen.cliente.fuente, 'supuesto');
  assert.equal(r.body.calibracion.metricas.leads, 60);
  assert.equal(r.body.nodo.version, 2);
  assert.equal(r.body.nodo.contenido.nota, 'v1');
  assert.equal(r.body.nodo.contenido.inbound.alcance, r.body.resultado.alcance);
  assert.equal(r.body.nodo.fuente, 'Zernio analytics 2026-10-01 a 2026-10-31');
  assert.equal((await q('POST', '/clientes/akai/calibrar', { ...body, guardar_en: 'nada' })).status, 404);
  assert.equal((await q('POST', '/clientes/akai/calibrar', { entradas: body.entradas })).status, 400);
});
