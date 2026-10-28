// Fase 5 · Marcas: crear. Las reglas puras de Formatos y Creación. Uso: node scripts/test-fase5.mjs
import assert from 'node:assert/strict';
import { BASE, limpiarFormato, limpiarGuion, tramosDe, etapaDeNivel, lleno, promptGuion, leerGuionClaude, ESQ_POR_NIVEL, limpiarFrames, limpiarVersiones, versionNueva, frameNuevo, duracionObjetivo, duracionFrames, excesoFrames, avisoExceso, escenasDeGuion, mezclarEscenas, claveEscena } from '../public/js/formatos.js';

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

// ---------- Script & Storyboard Studio: frames y versiones ----------
ok('Los frames se limpian: ids únicos, plano y movimiento de la lista, imagen solo de Drive con https', () => {
  const l = limpiarFrames([{ id: 'a', tramo: 'HOOK', plano: 'Raro', movimiento: 'Paneo', seg: '2.55', texto: ' Hola ', imagen: { id: 'abcdefghij1234', nombre: 'x.jpg', link: 'javascript:alert(1)' } }, { id: 'a', seg: -3 }, { tramo: 'CTA', imagen: { id: '<b>' } }]);
  assert.equal(l.length, 3); assert.equal(new Set(l.map((x) => x.id)).size, 3);
  assert.equal(l[0].plano, ''); assert.equal(l[0].movimiento, 'Paneo'); assert.equal(l[0].seg, 2.6); assert.equal(l[0].texto, 'Hola'); assert.equal(l[0].imagen.link, ''); assert.equal(l[0].imagen.id, 'abcdefghij1234');
  assert.equal(l[1].seg, null); assert.equal(l[2].imagen, null); assert.equal(limpiarFrames('x').length, 0);
  const g = limpiarGuion({ titulo: 'T', frames: [{ id: 'f1', tramo: 'HOOK', seg: 3 }], versiones: [{ v: 2, nota: 'n', tramos: [] }] });
  assert.equal(g.frames.length, 1); assert.equal(g.versiones[0].via, 'manual');
});
ok('Las versiones solo se agregan y guardan la foto del guion', () => {
  const g0 = limpiarGuion({ titulo: 'Idea', caption: 'c1', tramos: tramosDe(BASE[0]), frames: [{ id: 'f1', tramo: 'HOOK', seg: 3 }] });
  const v1 = versionNueva(g0, { por: 'a@x.com', via: 'puente', nota: 'Claude', en: '2026-10-27T10:00:00Z' });
  assert.equal(v1.length, 1); assert.equal(v1[0].v, 1); assert.equal(v1[0].frames[0].id, 'f1');
  const v2 = versionNueva({ ...g0, caption: 'c2', versiones: v1 }, { via: 'raro' });
  assert.deepEqual(v2.map((x) => x.v), [1, 2]); assert.equal(v2[0].caption, 'c1'); assert.equal(v2[1].caption, 'c2'); assert.equal(v2[1].via, 'manual');
  let g = { ...g0, versiones: [] }; for (let i = 0; i < 40; i++) g = { ...g, versiones: versionNueva(g) };
  assert.equal(g.versiones.length, 30); assert.equal(g.versiones.at(-1).v, 40);
  assert.equal(limpiarVersiones([{ v: 0 }, { nota: 'sin v' }]).length, 0);
});
ok('Un frame de más contra la duración avisa antes de «Listo para grabar»', () => {
  assert.equal(duracionObjetivo({ duracion: 20, partes: [] }), 20); assert.equal(duracionObjetivo({ partes: [{ seg: '0-3 s' }, { seg: '25-30 s' }] }), 30); assert.equal(duracionObjetivo({ partes: [{ nombre: 'x' }] }), null);
  const f = { duracion: 10, partes: [] }, g = { frames: [{ id: 'a', seg: 6 }, { id: 'b', seg: 4 }] };
  assert.equal(duracionFrames(g), 10); assert.equal(excesoFrames(g, f), null);
  const g2 = { frames: [...g.frames, { id: 'c', seg: 2.5 }, { id: 'd', seg: 9, archivado: true }] };
  assert.deepEqual(excesoFrames(g2, f), { total: 12.5, objetivo: 10, sobra: 2.5 }); assert.match(avisoExceso(excesoFrames(g2, f)), /sobran 2\.5 s/); assert.equal(avisoExceso(null), '');
  assert.equal(excesoFrames({ frames: [{ id: 'a' }] }, f), null); // sin segundos no hay aviso (y la vista dice «SIN DATOS»)
});
ok('Enviar al shot list no duplica: la llave es la pieza + el frame, en el esquema del Shot List Builder', () => {
  const g = { id: 'g1', titulo: 'Sushi', tramos: [{ nombre: 'HOOK', visual: 'Se ve el rollo', dice: 'Hola' }], frames: [{ id: 'f1', tramo: 'HOOK', plano: 'Detalle', movimiento: 'Fijo', seg: 3, texto: 'Hambre', vo: '' }] };
  const e1 = escenasDeGuion(g); assert.equal(e1.length, 1); assert.equal(e1[0].id_creativo, 'g1'); assert.equal(e1[0].escena, 'HOOK · f1'); assert.equal(e1[0].plano, 'Detalle · Fijo'); assert.equal(e1[0].duracion_s, 3);
  assert.match(e1[0].accion, /Se ve el rollo \| En pantalla: Hambre \| VO: Hola/);
  const m1 = mezclarEscenas([{ id: 'PR-007', id_creativo: 'otra', escena: 'x' }], e1); assert.equal(m1.escenas.length, 2); assert.equal(m1.agregadas, 1); assert.equal(m1.escenas[1].id, 'PR-008');
  const g2 = { ...g, frames: [{ ...g.frames[0], seg: 5 }, { id: 'f2', tramo: 'HOOK', seg: 2 }] };
  const m2 = mezclarEscenas(m1.escenas.map((x) => ({ ...x, jornada: 'J1', estado: 'grabada' })), escenasDeGuion(g2));
  assert.equal(m2.escenas.length, 3); assert.equal(m2.puestas, 1); assert.equal(m2.agregadas, 1);
  const uno = m2.escenas.find((x) => x.id === 'PR-008'); assert.equal(uno.duracion_s, 5); assert.equal(uno.jornada, 'J1'); assert.equal(uno.estado, 'grabada');
  const g3 = { ...g2, frames: [{ ...g2.frames[0], archivado: true }, g2.frames[1]] };
  const m3 = mezclarEscenas(m2.escenas, escenasDeGuion(g3)); assert.equal(m3.escenas.length, 3); assert.equal(m3.agregadas, 0); // nada se borra
});
ok('La respuesta de la IA se lee con el bloque json o el bloque guion', () => {
  const r = leerGuionClaude('hola\n```guion\n{"titulo":"T","tramos":[{"nombre":"HOOK","dice":"a"}],"frames":[{"id":"x1","tramo":"HOOK","seg":2}],"caption":"c"}\n```');
  assert.equal(r.tramos[0].dice, 'a'); assert.equal(r.frames[0].seg, 2); assert.equal(frameNuevo('CTA', [{ id: 'f1' }]).id, 'f2');
});
console.log(`\n${n} pruebas de la Fase 5 pasaron.`);
