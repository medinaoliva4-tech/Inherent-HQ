import test from 'node:test';
import assert from 'node:assert/strict';
import { planificar } from '../planificador.mjs';
import { capacidadDesdeMedidor } from '../capacidad.mjs';
import { crearMedidor } from '../../cuotas/medidor.mjs';
import { cargarConfig } from '../../cuotas/config.mjs';

const T0 = Date.parse('2026-11-10T10:00:00Z');
const DIA = 24 * 3600e3;
const en = (d) => new Date(T0 + d * DIA).toISOString();
const cap = (c) => (nivel) => c[nivel] ?? 0;

test('alcanza: reserva con margen del 20% y estado ok', () => {
  const r = planificar({ ahora: T0, capacidad: cap({ medio: 1000, bajo: 5000 }),
    trabajos: [{ id: 'a', deadline: en(5), partes: [{ nivel: 'medio', llamadas: 100 }, { nivel: 'bajo', llamadas: 50 }] }] });
  const a = r.trabajos[0];
  assert.equal(a.estado, 'ok'); assert.equal(a.reserva.medio, 120); assert.equal(a.reserva.bajo, 60);
  assert.deepEqual(a.aprobaciones_pendientes, []);
});
test('justo cuando usa ≥80% de lo disponible', () => {
  const r = planificar({ ahora: T0, capacidad: cap({ medio: 130 }), trabajos: [{ id: 'a', deadline: en(2), partes: [{ nivel: 'medio', llamadas: 100 }] }] });
  assert.equal(r.trabajos[0].estado, 'justo');
});
test('baja de nivel lo repetitivo cuando falta cupo en medio', () => {
  const r = planificar({ ahora: T0, capacidad: cap({ medio: 100, bajo: 1000 }),
    trabajos: [{ id: 'a', deadline: en(3), partes: [{ nivel: 'medio', llamadas: 60, nombre: 'planear' }, { nivel: 'medio', llamadas: 200, repetitivo: true, nombre: 'reescrituras' }] }] });
  const a = r.trabajos[0];
  assert.deepEqual(a.bajados.map((b) => [b.parte, b.de, b.a]), [['reescrituras', 'medio', 'bajo']]);
  assert.equal(a.reserva.medio, 72); assert.equal(a.reserva.bajo, 240);
  assert.notEqual(a.estado, 'no_alcanza');
  assert.ok(a.avisos.some((x) => x.gravedad === 'info'));
});
test('lo no repetitivo no se baja: pide aprobación de pago y avisa temprano', () => {
  const r = planificar({ ahora: T0, capacidad: cap({ medio: 50 }),
    trabajos: [{ id: 'a', titulo: 'Informe', deadline: en(6), partes: [{ nivel: 'medio', llamadas: 200 }] }] });
  const a = r.trabajos[0];
  assert.equal(a.estado, 'requiere_aprobacion');
  assert.equal(a.aprobaciones_pendientes[0].motivo, 'pago_por_token');
  assert.equal(a.pago, null);
  assert.ok(a.avisos.some((x) => x.gravedad === 'advertencia'));
});
test('con aprobación suficiente el gasto se asigna; sin ella nunca', () => {
  const base = { ahora: T0, capacidad: cap({ medio: 0 }), trabajos: [{ id: 'a', deadline: en(6), partes: [{ nivel: 'medio', llamadas: 100 }] }] };
  const sin = planificar(base).trabajos[0];
  assert.equal(sin.pago, null);
  const usd = sin.aprobaciones_pendientes[0].usd_estimado;
  assert.equal(planificar({ ...base, aprobaciones: { a: { usd: usd - 0.01 } } }).trabajos[0].pago, null);
  const con = planificar({ ...base, aprobaciones: { a: { usd } } }).trabajos[0];
  assert.equal(con.pago.aprobado, true); assert.notEqual(con.estado, 'requiere_aprobacion');
});
test('aviso crítico si quedan menos de 2 días', () => {
  const r = planificar({ ahora: T0, capacidad: cap({}), trabajos: [{ id: 'a', deadline: en(1), partes: [{ nivel: 'bajo', llamadas: 10 }] }] });
  assert.equal(r.trabajos[0].avisos.find((x) => x.gravedad === 'critico') !== undefined, true);
});
test('deadline vencido', () => {
  const r = planificar({ ahora: T0, capacidad: cap({ bajo: 100 }), trabajos: [{ id: 'a', deadline: en(-1), partes: [{ nivel: 'bajo', llamadas: 1 }] }] });
  assert.equal(r.trabajos[0].estado, 'no_alcanza');
});
test('deadlines compiten por el mismo cupo: el más cercano se reserva primero', () => {
  const r = planificar({ ahora: T0, capacidad: cap({ medio: 150 }), trabajos: [
    { id: 'tarde', deadline: en(10), partes: [{ nivel: 'medio', llamadas: 100 }] },
    { id: 'pronto', deadline: en(2), partes: [{ nivel: 'medio', llamadas: 100 }] }] });
  assert.equal(r.trabajos[0].id, 'pronto'); assert.equal(r.trabajos[0].estado, 'justo');
  assert.equal(r.trabajos[1].id, 'tarde'); assert.equal(r.trabajos[1].estado, 'requiere_aprobacion');
});

test('capacidad desde medidor: NVIDIA supuesto 1,000/día, reinicia 00:00 UTC', () => {
  const config = cargarConfig();
  const m = crearMedidor({ config, ahora: () => T0 });
  for (let i = 0; i < 300; i++) m.registrar({ proveedor: 'nvidia', ts: T0 - 1000, http: 200 });
  const c = capacidadDesdeMedidor(m, { config });
  assert.equal(c('bajo', T0, T0 + 3600e3), 700); // 1000 supuestos − 300 usados hoy
  assert.equal(c('bajo', T0, T0 + 2 * DIA) - 700, 2 * 1000); // 2 reinicios a las 00:00 UTC
  assert.equal(c('alto', T0, T0 + DIA), 0);
});
