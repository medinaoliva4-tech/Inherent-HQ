import test from 'node:test';
import assert from 'node:assert/strict';
import { ventana, reiniciaEn } from '../ventanas.mjs';
import { crearMedidor } from '../medidor.mjs';
import { proveedorDe, cargarConfig } from '../config.mjs';

const H = 3600e3;
const T0 = Date.parse('2026-11-10T10:00:00Z'); // 18:00 en UTC+8

test('día UTC+8: reinicia a las 16:00 UTC (00:00 UTC+8)', () => {
  const v = ventana({ tipo: 'dia_utc8' }, T0);
  assert.equal(new Date(v.hasta).toISOString(), '2026-11-10T16:00:00.000Z');
  assert.equal(new Date(v.desde).toISOString(), '2026-11-09T16:00:00.000Z');
});
test('día UTC+8 justo después de medianoche local', () => {
  const t = Date.parse('2026-11-09T16:00:01Z');
  assert.equal(new Date(ventana({ tipo: 'dia_utc8' }, t).desde).toISOString(), '2026-11-09T16:00:00.000Z');
});
test('mes UTC', () => {
  assert.equal(new Date(ventana({ tipo: 'mes_utc' }, T0).hasta).toISOString(), '2026-12-01T00:00:00.000Z');
});
test('rodante 5h reinicia cuando sale el evento más viejo', () => {
  assert.equal(reiniciaEn({ tipo: 'rodante', horas: 5 }, T0, [T0 - 2 * H, T0 - 1 * H]), T0 + 3 * H);
});

function medidor(limites) {
  const config = cargarConfig();
  Object.assign(config.nvidia.ventanas.dia, limites?.ms ?? {});
  return crearMedidor({ config, ahora: () => T0 });
}
test('NVIDIA: aviso al 80% y agotado al 100%', () => {
  const m = medidor({ ms: { llamadas: 10 } });
  for (let i = 0; i < 7; i++) m.registrar({ proveedor: 'nvidia', ts: T0 - i * 1000, http: 200 });
  assert.equal(m.estadoProveedor('nvidia').ventanas.dia.nivel, 'ok');
  m.registrar({ proveedor: 'nvidia', ts: T0, http: 200 });
  const w = m.estadoProveedor('nvidia').ventanas.dia;
  assert.equal(w.nivel, 'aviso'); assert.equal(w.pct, 0.8);
  assert.ok(m.estado().avisos.some((a) => a.proveedor === 'nvidia' && a.nivel === 'aviso'));
  m.registrar({ proveedor: 'nvidia', ts: T0, http: 200 }); m.registrar({ proveedor: 'nvidia', ts: T0, http: 200 });
  assert.equal(m.estadoProveedor('nvidia').ventanas.dia.nivel, 'agotado');
  assert.equal(m.restante('nvidia', 'dia').llamadas, 0);
});
test('llamadas de ayer (antes de las 00:00 UTC) no cuentan', () => {
  const m = medidor({ ms: { llamadas: 10 } });
  m.registrar({ proveedor: 'nvidia', ts: Date.parse('2026-11-09T23:59:00Z'), http: 200 });
  assert.equal(m.estadoProveedor('nvidia').ventanas.dia.llamadas, 0);
});
test('Cline sin tope conocido: un 429 reciente lo marca agotado', () => {
  const m = medidor();
  m.registrar({ proveedor: 'cline', ts: T0 - 60e3, http: 200 });
  assert.equal(m.estadoProveedor('cline').nivel, 'sin_tope');
  m.registrar({ proveedor: 'cline', ts: T0 - 30e3, http: 429 });
  assert.equal(m.estadoProveedor('cline').nivel, 'agotado');
});
test('un 429 de hace más de 10 min ya no marca agotado', () => {
  const m = medidor();
  m.registrar({ proveedor: 'cline', ts: T0 - 20 * 60e3, http: 429 });
  assert.equal(m.estadoProveedor('cline').nivel, 'sin_tope');
});
test('DeepSeek por gasto: 80% de tope USD avisa', () => {
  const config = cargarConfig(); config.deepseek.ventanas.dia.usd = 5;
  const m = crearMedidor({ config, ahora: () => T0 });
  m.registrar({ proveedor: 'deepseek', ts: T0 - 1000, http: 200, costo_usd: 4.2 });
  assert.equal(m.estadoProveedor('deepseek').ventanas.dia.nivel, 'aviso');
  assert.ok(Math.abs(m.restante('deepseek', 'dia').usd - 0.8) < 1e-9);
});
test('llamada sin llave no gasta cupo', () => {
  const m = medidor({ ms: { llamadas: 10 } });
  m.registrar({ proveedor: 'nvidia', ts: T0, http: 401, error_tipo: 'sin_llave' });
  assert.equal(m.estadoProveedor('nvidia').ventanas.dia.llamadas, 0);
});
test('proveedorDe', () => {
  assert.equal(proveedorDe({ api_base: 'https://api.cline.bot/api/v1' }), 'cline');
  assert.equal(proveedorDe({ api_base: 'https://integrate.api.nvidia.com/v1' }), 'nvidia');
  assert.equal(proveedorDe({ modelo: 'deepseek/deepseek-v4-flash' }), 'deepseek');
  assert.equal(proveedorDe({ modelo: 'openai/FRONTIER-POR-ELEGIR' }), 'frontier');
});
