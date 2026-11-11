import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarIcp } from '../src/icp.js';
import { ICP_COMPLETO } from './fixtures.js';

test('ICP completo y sano: ok, completo, sin alertas', () => {
  const r = validarIcp(ICP_COMPLETO);
  assert.deepEqual(r.errores, []);
  assert.equal(r.ok, true); assert.equal(r.completo, true);
  assert.deepEqual(r.alertas, []);
});

test('ICP parcial (hipótesis): tipos válidos pero incompleto; dice qué falta', () => {
  const r = validarIcp({ moneda: 'GTQ', ticket_promedio: 120, industrias: ['clínicas'] });
  assert.equal(r.ok, true); assert.equal(r.completo, false);
  assert.ok(r.faltan.includes('facturacion_mensual') && r.faltan.includes('decisor') && r.faltan.includes('regla_guia'));
});

test('ICP con tipos malos: errores por campo', () => {
  const r = validarIcp({ ...ICP_COMPLETO, margen: 1.4, demanda: 'altísima', industrias: [], ciclo_comercial: { dias: -3 }, moneda: 'dolares', extra: 1 } as any);
  assert.equal(r.ok, false);
  const campos = r.errores.map((e) => e.campo).sort();
  assert.deepEqual(campos, ['ciclo_comercial', 'demanda', 'extra', 'industrias', 'margen', 'moneda']);
  assert.equal(validarIcp('hola' as any).ok, false);
});

test('ICP: la regla guía y los criterios del §6 generan alertas (no bloquean)', () => {
  const r = validarIcp({ ...ICP_COMPLETO, facturacion_mensual: { min: 10_000 }, demanda: 'media', ciclo_comercial: { dias: 90 }, margen: 0.1 });
  assert.equal(r.ok, true);
  const txt = r.alertas.join(' | ');
  assert.match(txt, /10×|10x/); // 10 000 < 10 × 2 400
  assert.match(txt, /demanda/i);
  assert.match(txt, /ciclo/i);
  assert.match(txt, /margen/i); // 10 000 × 0.10 = 1 000 < 2 400
});
