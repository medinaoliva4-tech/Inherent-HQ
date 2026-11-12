// Pruebas del lint de CSS (scripts/lint-css.mjs): detecta lo nuevo fuera de token y deja pasar lo existente.
import assert from 'node:assert/strict';
import { medir, nuevos } from './lint-css.mjs';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };

t('mide hex, radios y font-size sueltos; ignora tokens, comentarios y url()', () => {
  const r = medir('/* #abc */ .a{color:#FFF;border-radius:12px;font-size:13px;background:url(data:x#fff)} .b{border-radius:var(--r-2);font-size:var(--fs-b);border-radius:0;--c:#123456}');
  assert.deepEqual(r.hex, { '#fff': 1, '#123456': 1 });
  assert.deepEqual(r.radio, { '12px': 1 });
  assert.deepEqual(r.fuente, { '13px': 1 });
});
t('radios de cuatro valores se cuentan por valor', () => {
  assert.deepEqual(medir('.a{border-radius:12px 12px 0 0}').radio, { '12px': 2 });
});
t('los selectores con # no son hex', () => {
  assert.deepEqual(medir('#main,#add .x{color:var(--ui-ink)}').hex, {});
});
t('falla solo en lo nuevo; mover o igualar no falla', () => {
  const base = { 'a.css': medir('.a{color:#fff;border-radius:10px}') };
  assert.deepEqual(nuevos({ 'a.css': medir('.z{border-radius:10px}.q{color:#fff}') }, base), []);
  assert.equal(nuevos({ 'a.css': medir('.a{color:#fff;color:#000}') }, base).length, 1);
  assert.equal(nuevos({ 'a.css': medir('.a{border-radius:11px;font-size:12px}') }, base).length, 2);
  assert.equal(nuevos({ 'a.css': medir('.a{color:red!important}') }, base).length, 1);
});
t('cuenta los alias viejos', () => {
  assert.deepEqual(medir('.a{color:var(--ink);background:var(--ui-surf)}').viejo, { '--ink': 1 });
});
console.log(`${ok} pruebas del lint de CSS bien`);
