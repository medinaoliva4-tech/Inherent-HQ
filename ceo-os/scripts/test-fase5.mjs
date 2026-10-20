// Fase 5 · Marcas: crear. Las reglas puras de Formatos y Creación. Uso: node scripts/test-fase5.mjs
import assert from 'node:assert/strict';
import { BASE, limpiarFormato, limpiarGuion, tramosDe, etapaDeNivel, lleno, promptGuion, leerGuionClaude, ESQ_POR_NIVEL } from '../public/js/formatos.js';

let n = 0; const ok = (nombre, fn) => { fn(); n++; console.log('✅', nombre); };
ok('Las plantillas base salen del método', () => {
  assert.equal(BASE.filter((f) => f.tipo === 'reel').length, 6); assert.equal(BASE.filter((f) => f.tipo === 'story').length, 5);
  for (const f of BASE.filter((x) => x.tipo === 'reel')) assert.deepEqual(f.partes.map((p) => p.nombre), ['HOOK', 'BODY', 'PAYOFF', 'CTA']);
  assert.match(BASE[0].partes[0].que, /legible en mute, sin saludo/);
  assert.equal(new Set(BASE.map((f) => f.id)).size, BASE.length);
});
ok('Un formato se limpia', () => {
  const f = limpiarFormato({ nombre: ' Mío ', tipo: 'raro', duracion: 999, partes: [{ nombre: 'HOOK', seg: '0-3 s', que: 'x' }, { nombre: '' }] });
  assert.equal(f.nombre, 'Mío'); assert.equal(f.tipo, 'reel'); assert.equal(f.duracion, 180); assert.equal(f.partes.length, 2); assert.equal(f.partes[1].nombre, 'Tramo');
});
ok('Un guion empieza con los tramos de su formato', () => {
  const t = tramosDe(BASE[0]); assert.deepEqual(t.map((x) => x.nombre), ['HOOK', 'BODY', 'PAYOFF', 'CTA']); assert.equal(t[0].dice, '');
  const g = limpiarGuion({ titulo: 'Idea', consciencia: 9, estado: 'Otro', tramos: t }); assert.equal(g.consciencia, null); assert.equal(g.estado, 'Borrador');
  assert.equal(lleno({ tramos: [{ dice: 'a' }, { dice: '' }] }), 50);
});
ok('Etapa y esqueletos por nivel de consciencia', () => {
  assert.equal(etapaDeNivel(1), 'TOF'); assert.equal(etapaDeNivel(4), 'MOF'); assert.equal(etapaDeNivel(5), 'BOF');
  assert.deepEqual(ESQ_POR_NIVEL[2], ['Proceso', 'Antes y después']);
});
ok('El prompt lleva el método y el contexto, y se lee la respuesta', () => {
  const p = promptGuion({ marca: 'Akai', carpeta: 'clients/akai', formato: BASE[0], guion: { titulo: 'Sushi', consciencia: 2, angulo: 'Dolor · x', tramos: tramosDe(BASE[0]) }, avatar: { nombre: 'Godín', peso: 60, campos: { decir: ['tiene 30'], mostrar: ['oficina'] } }, mes: '2026-10' });
  assert.match(p, /SOLO LECTURA/); assert.match(p, /HOOK \(0-3 s\)/); assert.match(p, /se corta el BODY/); assert.match(p, /Señales para que Meta/); assert.match(p, /TOF/); assert.match(p, /brief-del-ciclo\.md/);
  const r = leerGuionClaude('ok\n```json\n{"titulo":"T","tramos":[{"nombre":"HOOK","dice":"¿Hambre?"}],"caption":"c"}\n```');
  assert.equal(r.tramos[0].dice, '¿Hambre?'); assert.equal(leerGuionClaude('nada'), null);
});
console.log(`\n${n} pruebas de la Fase 5 pasaron.`);
