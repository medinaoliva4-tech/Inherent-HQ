import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularOutbound, probAlMenos, TEXTO_OUTBOUND } from '../src/outbound.js';

test('outbound: caso de referencia del diseño (m=5, c=1 %, P=95 %, w=4) → 913 / 229 / 46', () => {
  const r = calcularOutbound({ m: 5, c: 0.01, P: 0.95, w: 4 });
  assert.equal(r.n, 913);
  assert.equal(r.por_semana, 229);
  assert.equal(r.por_dia_habil, 46);
  assert.equal(r.texto, TEXTO_OUTBOUND);
  // 913 cumple y 912 no: es el MENOR n.
  assert.ok(probAlMenos(913, 0.01, 5) >= 0.95);
  assert.ok(probAlMenos(912, 0.01, 5) < 0.95);
  assert.ok(Math.abs(r.probabilidad - probAlMenos(913, 0.01, 5)) < 1e-12);
});

test('outbound: probAlMenos coincide con la suma directa en casos chicos', () => {
  const choose = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
  for (const [n, c, m] of [[10, 0.3, 2], [20, 0.5, 10], [7, 0.9, 7], [50, 0.02, 1]] as const) {
    let cdf = 0; for (let k = 0; k < m; k++) cdf += choose(n, k) * c ** k * (1 - c) ** (n - k);
    assert.ok(Math.abs(probAlMenos(n, c, m) - (1 - cdf)) < 1e-12, `${n},${c},${m}`);
  }
});

test('outbound: bordes (m=0, c=1, P muy alta, c muy chica, plazos)', () => {
  assert.deepEqual([calcularOutbound({ m: 0, c: 0.1, P: 0.95, w: 4 }).n, calcularOutbound({ m: 0, c: 0.1, P: 0.95, w: 4 }).por_semana], [0, 0]);
  assert.equal(calcularOutbound({ m: 7, c: 1, P: 0.99, w: 2 }).n, 7);
  const alta = calcularOutbound({ m: 5, c: 0.01, P: 0.999999, w: 4 });
  assert.ok(alta.n > 913 && probAlMenos(alta.n, 0.01, 5) >= 0.999999 && probAlMenos(alta.n - 1, 0.01, 5) < 0.999999);
  const t0 = Date.now();
  const chica = calcularOutbound({ m: 3, c: 1e-7, P: 0.9, w: 52 });
  assert.ok(chica.n > 1e7 && Number.isSafeInteger(chica.n) && Date.now() - t0 < 2000);
  assert.ok(probAlMenos(chica.n, 1e-7, 3) >= 0.9 && probAlMenos(chica.n - 1, 1e-7, 3) < 0.9);
  // plazos: semana y día hábil con ceil
  const r = calcularOutbound({ m: 1, c: 0.5, P: 0.5, w: 1 });
  assert.deepEqual([r.n, r.por_semana, r.por_dia_habil], [1, 1, 1]);
  const largo = calcularOutbound({ m: 5, c: 0.01, P: 0.95, w: 52 });
  assert.deepEqual([largo.por_semana, largo.por_dia_habil], [Math.ceil(913 / 52), Math.ceil(913 / 260)]);
});

test('outbound: entradas inválidas se rechazan con mensaje claro (sin bucles infinitos)', () => {
  const malas = [
    { m: 5, c: 0, P: 0.95, w: 4 }, { m: 5, c: 1.2, P: 0.95, w: 4 }, { m: 5, c: 0.1, P: 1, w: 4 },
    { m: 5, c: 0.1, P: 0, w: 4 }, { m: -1, c: 0.1, P: 0.9, w: 4 }, { m: 2.5, c: 0.1, P: 0.9, w: 4 },
    { m: 5, c: 0.1, P: 0.9, w: 0 }, { m: 5, c: Number.NaN, P: 0.9, w: 4 }, { m: 2_000_000, c: 0.1, P: 0.9, w: 4 },
  ];
  for (const e of malas) assert.throws(() => calcularOutbound(e as any), /outbound/i, JSON.stringify(e));
  // c tan chica que n no cabe en un entero seguro: error, no cuelgue
  assert.throws(() => calcularOutbound({ m: 50, c: 1e-15, P: 0.99, w: 4 }), /outbound/i);
});

test('outbound: guarda la sugerencia de conversión con su fuente y etiqueta', () => {
  const r = calcularOutbound({ m: 5, c: 0.01, P: 0.95, w: 4, oferta_comprobada: false, sugerencia: { c: 0.01, fuente: 'https://ejemplo.com/benchmark', etiqueta: 'hipótesis', autor: 'agente-strategy' } });
  assert.deepEqual(r.entradas.sugerencia, { c: 0.01, fuente: 'https://ejemplo.com/benchmark', etiqueta: 'hipótesis', autor: 'agente-strategy' });
  assert.equal(r.entradas.oferta_comprobada, false);
  assert.throws(() => calcularOutbound({ m: 5, c: 0.01, P: 0.95, w: 4, sugerencia: { c: 0.01, fuente: '', etiqueta: 'hipótesis' } } as any), /fuente/);
  assert.throws(() => calcularOutbound({ m: 5, c: 0.01, P: 0.95, w: 4, sugerencia: { c: 0.01, fuente: 'x', etiqueta: 'inventada' } } as any), /etiqueta/);
});
