import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AlmacenJson, AlmacenMemoria, type Almacen } from '../src/almacen.js';
import { Memoria } from '../src/memoria.js';
import { ErrorHerramienta } from '../src/errores.js';
import { ICP_COMPLETO } from './fixtures.js';

const tmp = () => mkdtempSync(join(tmpdir(), 'herr-'));

/** Hilo de ejemplo: producto → icp → dolor-1, dolor-2 → pilar-1 (de dolor-2) → angulo-1 → pieza-1. */
async function hilo(alm: Almacen = new AlmacenMemoria()) {
  const mem = new Memoria(alm);
  const prod = await mem.crear('akai', { tipo: 'producto', titulo: 'Bowls de poke', fuente: 'https://akai.gt/menu' }, 'ana');
  const icp = await mem.crear('akai', { tipo: 'icp', titulo: 'Oficinistas zona 10', contenido: { moneda: 'GTQ', ticket_promedio: 85 }, viene_de: [prod.id] }, 'ana');
  const d1 = await mem.crear('akai', { tipo: 'dolor', titulo: 'No hay comida sana rápida', viene_de: [icp.id] }, 'ana');
  const d2 = await mem.crear('akai', { tipo: 'dolor', titulo: 'Comer en el escritorio', viene_de: [icp.id] }, 'ana');
  const pilar = await mem.crear('akai', { tipo: 'pilar', titulo: 'Pausa real', viene_de: [d2.id] }, 'ana');
  const ang = await mem.crear('akai', { tipo: 'angulo', titulo: '15 minutos que sí son tuyos', viene_de: [pilar.id, d1.id] }, 'ana');
  const pieza = await mem.crear('akai', { tipo: 'pieza', titulo: 'Reel escritorio vs. bowl', viene_de: [ang.id] }, 'bea');
  return { mem, alm, prod, icp, d1, d2, pilar, ang, pieza };
}

test('nodos: forma, id estable legible, número por tipo, estado hipótesis y fuente por defecto', async () => {
  const { d1, d2, pieza, prod } = await hilo();
  assert.equal(d1.id, 'dolor-1'); assert.equal(d2.id, 'dolor-2'); assert.equal(d2.numero, 2);
  assert.equal(d2.cliente, 'akai'); assert.equal(d2.tipo, 'dolor');
  assert.equal(d2.estado, 'hipotesis'); assert.equal(d2.version, 1);
  assert.equal(d2.fuente, 'hipótesis'); assert.equal(prod.fuente, 'https://akai.gt/menu');
  assert.deepEqual(d2.viene_de, ['icp-1']);
  assert.ok(Date.parse(d2.actualizado) > 0 && Date.parse(d2.creado) > 0);
  assert.equal(pieza.actualizado_por, 'bea');
  assert.deepEqual(d2.leido_por, []);
});

test('nodos: validaciones (tipo, cliente, viene_de inexistente, id repetido, ICP mal formado)', async () => {
  const { mem } = await hilo();
  const err = async (p: Promise<unknown>, status: number, re: RegExp) => { await assert.rejects(p, (e: any) => e instanceof ErrorHerramienta && e.status === status && re.test(e.message)); };
  await err(mem.crear('akai', { tipo: 'banana' as any, titulo: 'x' }, 'ana'), 400, /tipo/);
  await err(mem.crear('../etc', { tipo: 'dolor', titulo: 'x' }, 'ana'), 400, /cliente/);
  await err(mem.crear('akai', { tipo: 'dolor', titulo: '' }, 'ana'), 400, /titulo/);
  await err(mem.crear('akai', { tipo: 'dolor', titulo: 'x', viene_de: ['no-existe'] }, 'ana'), 400, /no-existe/);
  await err(mem.crear('akai', { tipo: 'dolor', titulo: 'x', id: 'dolor-1' }, 'ana'), 409, /existe/);
  await err(mem.crear('akai', { tipo: 'icp', titulo: 'x', contenido: { margen: 3 } }, 'ana'), 400, /ICP/);
  await err(mem.obtener('akai', 'nada'), 404, /no existe/);
});

test('versiones: cada cambio sube la versión y guarda la anterior en el historial', async () => {
  const { mem, d2 } = await hilo();
  const { nodo } = await mem.actualizar('akai', d2.id, { titulo: 'Comer frente a la compu', version: 1 }, 'ana');
  assert.equal(nodo.version, 2);
  const { historial } = await mem.leer('akai', d2.id, 'ana');
  assert.deepEqual(historial.map((h) => [h.version, h.titulo]), [[1, 'Comer en el escritorio']]);
  // concurrencia optimista: versión vieja → 409
  await assert.rejects(mem.actualizar('akai', d2.id, { titulo: 'otra', version: 1 }, 'bea'), (e: any) => e.status === 409);
  // sin cambios reales no sube la versión
  const igual = await mem.actualizar('akai', d2.id, { titulo: 'Comer frente a la compu' }, 'ana');
  assert.equal(igual.nodo.version, 2); assert.deepEqual(igual.avisos, []);
});

test('dependientes: recursivos por viene_de, con distancia y ruta, sin repetir', async () => {
  const { mem, icp, d2, d1 } = await hilo();
  const deps = await mem.dependientes('akai', d2.id);
  assert.deepEqual(deps.map((d) => [d.id, d.distancia]), [['pilar-1', 1], ['angulo-1', 2], ['pieza-1', 3]]);
  assert.deepEqual(deps[2]!.ruta, ['dolor-2', 'pilar-1', 'angulo-1', 'pieza-1']);
  const deIcp = await mem.dependientes('akai', icp.id);
  assert.deepEqual(deIcp.map((d) => d.id).sort(), ['angulo-1', 'dolor-1', 'dolor-2', 'pieza-1', 'pilar-1']);
  assert.equal(deIcp.find((d) => d.id === 'angulo-1')!.distancia, 2); // por dolor-1 (camino más corto)
  assert.deepEqual(await mem.dependientes('akai', 'pieza-1'), []);
  void d1;
});

test('ciclos: viene_de no puede cerrar un ciclo ni apuntar a sí mismo', async () => {
  const { mem, icp } = await hilo();
  await assert.rejects(mem.actualizar('akai', icp.id, { viene_de: ['producto-1', 'pieza-1'] }, 'ana'), (e: any) => e.status === 400 && /ciclo/.test(e.message));
  await assert.rejects(mem.actualizar('akai', icp.id, { viene_de: ['icp-1'] }, 'ana'), (e: any) => e.status === 400);
});

test('avisos: al cambiar un dolor, todo lo que depende de él recibe un aviso legible; sin duplicados', async () => {
  const { mem, d2 } = await hilo();
  const { avisos } = await mem.actualizar('akai', d2.id, { contenido: 'Comen frente a la compu por miedo a parecer flojos' }, 'ana');
  assert.deepEqual(avisos.map((a) => a.nodo), ['pilar-1', 'angulo-1', 'pieza-1']);
  assert.equal(avisos[0]!.mensaje, 'cambió Strategy: dolor #2 «Comer en el escritorio» → revisa pilar #1 «Pausa real»');
  assert.match(avisos[2]!.mensaje, /revisa pieza #1 .* \(vía pilar #1, ángulo #1\)$/);
  assert.equal(avisos[0]!.origen, 'dolor-2'); assert.equal(avisos[0]!.origen_version, 2); assert.equal(avisos[0]!.resuelto, false);
  // un segundo cambio actualiza el aviso pendiente en vez de duplicarlo
  await mem.actualizar('akai', d2.id, { titulo: 'Comer en el escritorio (v3)' }, 'ana');
  const pend = await mem.avisos('akai');
  assert.equal(pend.length, 3);
  assert.equal(pend.find((a) => a.nodo === 'pilar-1')!.origen_version, 3);
  // revisar (editar) el pilar resuelve su aviso y avisa a SUS dependientes
  const r = await mem.actualizar('akai', 'pilar-1', { titulo: 'Pausa real, sin culpa' }, 'bea');
  assert.deepEqual(r.avisos.map((a) => [a.nodo, a.origen]), [['angulo-1', 'pilar-1'], ['pieza-1', 'pilar-1']]);
  const ahora = await mem.avisos('akai');
  assert.ok(!ahora.some((a) => a.nodo === 'pilar-1'));
  // resolver a mano
  const a = ahora[0]!;
  const res = await mem.resolverAviso('akai', a.id, 'ana');
  assert.equal(res.resuelto, true); assert.equal(res.resuelto_por, 'ana');
  assert.equal((await mem.avisos('akai')).length, ahora.length - 1);
  assert.equal((await mem.avisos('akai', { todos: true })).length, ahora.length + 1);
});

test('aprobar: solo si quien aprueba abrió (leyó) la versión actual — regla F4.5', async () => {
  const { mem, d2 } = await hilo();
  await assert.rejects(mem.aprobar('akai', d2.id, 'ana'), (e: any) => e.status === 409 && /abr/.test(e.message));
  await mem.leer('akai', d2.id, 'bea');
  await assert.rejects(mem.aprobar('akai', d2.id, 'ana'), (e: any) => e.status === 409); // leyó otra persona
  const { nodo: leido } = await mem.leer('akai', d2.id, 'ana');
  assert.deepEqual(leido.leido_por.map((l) => [l.usuario, l.version]), [['bea', 1], ['ana', 1]]);
  const ok = await mem.aprobar('akai', d2.id, 'ana');
  assert.equal(ok.estado, 'aprobado'); assert.equal(ok.aprobado_por, 'ana');
  // editar lo aprobado lo regresa a hipótesis y exige volver a leer
  const { nodo } = await mem.actualizar('akai', d2.id, { contenido: 'nuevo' }, 'bea');
  assert.equal(nodo.estado, 'hipotesis'); assert.equal(nodo.aprobado_por, undefined);
  await assert.rejects(mem.aprobar('akai', d2.id, 'ana'), (e: any) => e.status === 409);
});

test('aprobar ICP: exige el perfil completo (criterios del §6)', async () => {
  const { mem, icp } = await hilo();
  await mem.leer('akai', icp.id, 'ana');
  await assert.rejects(mem.aprobar('akai', icp.id, 'ana'), (e: any) => e.status === 409 && /ICP/.test(e.message));
  await mem.actualizar('akai', icp.id, { contenido: ICP_COMPLETO }, 'ana');
  await mem.leer('akai', icp.id, 'ana');
  assert.equal((await mem.aprobar('akai', icp.id, 'ana')).estado, 'aprobado');
});

test('clientes: lista con conteos; listar nodos por tipo', async () => {
  const { mem, d2 } = await hilo();
  await mem.crear('nao', { tipo: 'producto', titulo: 'Cerámica' }, 'ana');
  await mem.actualizar('akai', d2.id, { contenido: 'x' }, 'ana');
  const cs = await mem.clientes();
  assert.deepEqual(cs.map((c) => [c.id, c.nodos, c.avisos_pendientes]), [['akai', 7, 3], ['nao', 1, 0]]);
  assert.deepEqual((await mem.listar('akai', { tipo: 'dolor' })).map((n) => n.id), ['dolor-1', 'dolor-2']);
  assert.deepEqual(await mem.listar('vacio'), []);
});

test('almacén JSON: persiste por cliente en archivos (modo 600, escritura atómica) y sobrevive a reinicios', async () => {
  const dir = tmp();
  const { d2 } = await hilo(new AlmacenJson(dir));
  const mem2 = new Memoria(new AlmacenJson(dir));
  assert.equal((await mem2.obtener('akai', d2.id)).titulo, 'Comer en el escritorio');
  assert.deepEqual(readdirSync(dir).sort(), ['akai.json']);
  assert.equal(statSync(join(dir, 'akai.json')).mode & 0o777, 0o600);
  const raw = JSON.parse(readFileSync(join(dir, 'akai.json'), 'utf8'));
  assert.equal(raw.formato, 1); assert.ok(raw.nodos['dolor-2']);
  // escrituras simultáneas no se pisan
  await Promise.all(Array.from({ length: 20 }, (_, i) => mem2.crear('akai', { tipo: 'pieza', titulo: `p${i}` }, 'ana')));
  assert.equal((await new Memoria(new AlmacenJson(dir)).listar('akai', { tipo: 'pieza' })).length, 21);
});

test('grafo: exporta graph.json para graphify (node-link) y un Markdown legible', async () => {
  const { mem } = await hilo();
  const g = await mem.grafo('akai');
  assert.equal(g.directed, false); // graphify recorre en ambos sentidos; la dirección queda en source → target
  assert.equal(g.nodes.length, 7);
  const n = g.nodes.find((x) => x.id === 'akai:dolor-2')!;
  assert.equal(n.label, 'dolor #2 · Comer en el escritorio');
  assert.equal(n.file_type, 'concept'); assert.equal(n.estado, 'hipotesis');
  assert.equal(n.norm_label, 'dolor #2 · comer en el escritorio');
  const l = g.links.find((x) => x.source === 'akai:pilar-1')!;
  assert.deepEqual([l.target, l.relation, l.confidence, l.confidence_score], ['akai:dolor-2', 'viene_de', 'EXTRACTED', 1]);
  assert.equal(g.links.length, 7); // icp←prod, d1←icp, d2←icp, pilar←d2, ang←pilar, ang←d1, pieza←ang
  const md = await mem.grafoMarkdown('akai');
  assert.match(md, /^# Hilo de akai/m);
  assert.match(md, /- \*\*pilar #1\*\* «Pausa real» · hipótesis · v1 — viene de: dolor #2/);
});
