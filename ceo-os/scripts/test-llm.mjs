// Pruebas del Inherent LLM: el harness de cada modo, los comandos «/», las tarjetas (criterios y pregunta) y las sesiones.
// npm run test:llm
import assert from 'node:assert/strict';
import { MODOS, modoDe, sistemaDe, HARNESS, REGLAS_COMUNES, SUGERENCIAS, COMANDOS, leerComando, TERMINAL, textoVisible, leerTarjetas, idSesion, leerIdSesion, tituloDe, grupoFecha, ESFUERZOS, nombreEsfuerzo } from '../public/js/llm/modos.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };

t('tres modos, cada uno con su harness y sus sugerencias', () => {
  assert.deepEqual(MODOS.map((m) => m.id), ['estrategia', 'organizacion', 'diseno']);
  for (const m of MODOS) {
    const h = HARNESS[m.id];
    assert.ok(h.rol && h.como.length && h.herramientas && h.criterios.length >= 3, m.id);
    assert.equal(SUGERENCIAS[m.id].length, 4, m.id);
  }
  assert.equal(modoDe('nada').id, 'estrategia');
});

t('el system prompt lleva reglas, harness, criterios, protocolo y el contexto como datos', () => {
  const s = sistemaDe('estrategia', { persona: 'Ana', puesto: 'CEO', fecha: '2026-10-26', cliente: 'Akai', carpeta: 'clients/akai', nivel: 'Brand Growth', extra: ['Paso: 2'], instrucciones: 'BLOQUE ESTRATEGIA' });
  assert.match(s, /^INHERENT LLM · MODO ESTRATEGIA \(① Strategy\)/);
  for (const r of REGLAS_COMUNES) assert.ok(s.includes(r));
  assert.ok(s.includes('hormozi-brain'));
  assert.ok(s.includes('CRITERIOS DE ACEPTACIÓN DE ESTE MODO'));
  assert.ok(s.includes('```criterios') && s.includes('```pregunta'));
  assert.ok(s.indexOf('BLOQUE ESTRATEGIA') < s.indexOf('CONTEXTO DE ESTA CONVERSACIÓN'));
  assert.match(s, /- Cliente: Akai \(clients\/akai\)/);
  assert.match(s, /- Nivel contratado: Brand Growth/);
  assert.match(s, /- Paso: 2$/);
  assert.match(sistemaDe('diseno', { cliente: 'Inherent' }), /- Marca: Inherent/);
  assert.ok(!sistemaDe('organizacion').includes('CONTEXTO DE ESTA CONVERSACIÓN'));
});

t('el harness nunca abre la puerta a pautar, publicar, borrar o editar el repo', () => {
  const s = sistemaDe('organizacion');
  assert.match(s, /Nunca: costos, márgenes/);
  assert.match(s, /El repo NO se edita desde aquí/);
  assert.match(s, /Nunca borres/);
});

t('comandos «/»: con y sin acento, con argumento, y lo demás es texto', () => {
  assert.deepEqual(leerComando('/diseño arma un carrusel'), { cmd: '/diseno', arg: 'arma un carrusel' });
  assert.deepEqual(leerComando('  /Organizacion '), { cmd: '/organizacion', arg: '' });
  assert.deepEqual(leerComando('/skill hormozi'), { cmd: '/skill', arg: 'hormozi' });
  assert.equal(leerComando('/inventado'), null);
  assert.equal(leerComando('hola /nuevo'), null);
  assert.equal(COMANDOS.length, 9);
  assert.deepEqual(leerComando('/privado'), { cmd: '/privado', arg: '' });
  assert.deepEqual(leerComando('/ramificar'), { cmd: '/ramificar', arg: '' });
  assert.ok(TERMINAL.every(([l, c]) => l && c && !/sk-|key=/.test(c)));
});

t('las tarjetas: criterios y pregunta salen del texto; lo visible no las muestra', () => {
  const r = 'Aquí va el plan.\n\n```criterios\n{"entregable":"Plan","cumple":["Tiene dueño"],"falta":["Falta fecha — no la dio"]}\n```\n```pregunta\n{"texto":"¿Para cuándo?","por_que":"Sin fecha no entra","opciones":["Hoy","Mañana","",1]}\n```';
  const k = leerTarjetas(r);
  assert.deepEqual(k.criterios, { entregable: 'Plan', cumple: ['Tiene dueño'], falta: ['Falta fecha — no la dio'] });
  assert.deepEqual(k.pregunta, { texto: '¿Para cuándo?', por_que: 'Sin fecha no entra', opciones: ['Hoy', 'Mañana', '1'] });
  assert.equal(textoVisible(r), 'Aquí va el plan.');
  // A medio escribir (streaming): el bloque abierto no se ve.
  assert.equal(textoVisible('Hola\n```criterios\n{"entre'), 'Hola');
  // JSON roto: no hay tarjeta, y no se rompe.
  assert.deepEqual(leerTarjetas('```pregunta\n{roto}\n```'), { criterios: null, pregunta: null });
  // El bloque de estrategia tampoco se ve (lo guarda el OS).
  assert.equal(textoVisible('Listo.\n```estrategia\n{"meta":"x"}\n```'), 'Listo.');
});

t('las sesiones: id con modo y cliente, se lee de vuelta; lo ajeno no', () => {
  const id = idSesion('diseno', 'Akai Café!', 1767225600000, 0.5);
  assert.match(id, /^inh-diseno-akaicaf-[a-z0-9]+$/);
  assert.deepEqual(leerIdSesion(id), { modo: 'diseno', slug: 'akaicaf' });
  assert.deepEqual(leerIdSesion(idSesion('organizacion', '')), { modo: 'organizacion', slug: '' });
  assert.equal(leerIdSesion('20260101_abc'), null);
  assert.equal(leerIdSesion('inh-otro-x-1'), null);
});

t('títulos y grupos de fecha como la barra de Hermes', () => {
  assert.equal(tituloDe('  Arma el roadmap\nde 90 días'), 'Arma el roadmap');
  assert.equal(tituloDe(''), 'Conversación nueva');
  assert.equal(tituloDe('x'.repeat(90)).length, 60);
  const ahora = new Date(2026, 9, 26, 15, 0).getTime();
  assert.equal(grupoFecha(new Date(2026, 9, 26, 9).getTime(), ahora), 'Hoy');
  assert.equal(grupoFecha(new Date(2026, 9, 25, 22).getTime() / 1000, ahora), 'Ayer'); // segundos (Hermes)
  assert.equal(grupoFecha(new Date(2026, 9, 21).toISOString(), ahora), 'Últimos 7 días');
  assert.equal(grupoFecha(new Date(2026, 8, 1).getTime(), ahora), 'Antes');
  assert.equal(grupoFecha(null, ahora), 'Antes');
});

t('modo privado y cuánto piensa', () => {
  assert.match(sistemaDe('organizacion', { privado: true }), /Modo privado: respondes con un modelo que corre en esta compu/);
  assert.ok(!sistemaDe('organizacion', { privado: false }).includes('Modo privado'));
  assert.deepEqual(ESFUERZOS.map(([k]) => k), ['low', '', 'high']);
  assert.equal(nombreEsfuerzo('high'), 'A fondo');
  assert.equal(nombreEsfuerzo(''), 'Normal');
  assert.equal(nombreEsfuerzo('raro'), 'Normal');
  assert.ok(TERMINAL.some(([, c]) => c.includes('ollama_num_ctx 65536')), 'la Terminal dice cómo darle 64K al modelo local');
  assert.ok(TERMINAL.some(([, c]) => c === 'inherent update'));
});

console.log(`\n${ok} pruebas del Inherent LLM pasaron`);
