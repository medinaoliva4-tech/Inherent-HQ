// Pruebas del Inherent LLM: el harness de cada modo, los comandos «/», las tarjetas (criterios, pregunta y encargos), las sesiones,
// las áreas (las mismas del Tablero) y el switch de IA.
// npm run test:llm
import assert from 'node:assert/strict';
import { leerMeta, crearBrujula, progreso, tareaActual, marcar, aplicarAvance, contarGiro, desviado, contextoBrujula, ritmoSemana, inicioSemana, usosDe } from '../public/js/llm/brujula.js';
import { MODOS, modoDe, sistemaDe, HARNESS, REGLAS_COMUNES, SUGERENCIAS, COMANDOS, leerComando, TERMINAL, textoVisible, leerTarjetas, idSesion, leerIdSesion, tituloDe, grupoFecha, ESFUERZOS, nombreEsfuerzo, CONSULTING, alcanceConsulting, leerEncargo, tareaDeEncargo, encargosDe } from '../public/js/llm/modos.js';
import { AREAS, areasDe, areaDe, areaDeModo, areaDeEspacio, switchHtml, areaConFlecha } from '../public/js/areas.js';
import { IAS, iaDe, iasListas, esLocal } from '../public/js/llm/ias.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };

t('cuatro modos, cada uno con su harness y sus sugerencias', () => {
  assert.deepEqual(MODOS.map((m) => m.id), ['estrategia', 'organizacion', 'diseno', 'consulting']);
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
  assert.equal(COMANDOS.length, 11);
  assert.deepEqual(leerComando('/consulting nao'), { cmd: '/consulting', arg: 'nao' });
  assert.deepEqual(leerComando('/brújula'), { cmd: '/brujula', arg: '' });
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
  assert.deepEqual(leerTarjetas('```pregunta\n{roto}\n```'), { criterios: null, pregunta: null, meta: null, avance: null, encargos: [] });
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
  assert.deepEqual(leerIdSesion(idSesion('consulting', 'nao', 1767225600000, 0.5)), { modo: 'consulting', slug: 'nao' }, 'las de Consulting se reabren');
  assert.equal(leerIdSesion('inh-nao-abc'), null, 'las del chat viejo de Estrategia no son del Chat');
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

t('la brújula: la meta, sus tareas, el avance y el aviso de desvío', () => {
  const m = leerMeta({ por_que: '«Mejorar» no se puede medir.', propuesta: 'Publicar 12 piezas antes del viernes 30', meta: '12 piezas publicadas', medida: 'piezas publicadas', vence: 'viernes 30', tareas: [{ t: 'Definir 12 temas' }, { t: 'Redactar 12 copies' }, { t: 'Enviar al cliente', quien: 'tú' }] });
  assert.equal(m.tareas[2].quien, 'tu');
  assert.equal(leerMeta({ tareas: [] }), null, 'sin propuesta no hay meta');
  let b = crearBrujula(m, 1);
  assert.deepEqual(progreso(b), { hechas: 0, total: 3, pct: 0 });
  assert.equal(tareaActual(b).t, 'Definir 12 temas');
  // Tres turnos sin mover nada → desvío; mover una tarea lo reinicia
  b = contarGiro(contarGiro(contarGiro(b)));
  assert.ok(desviado(b));
  assert.match(contextoBrujula(b), /Llevan 3 turnos sin mover ninguna tarea/);
  b = aplicarAvance(b, { hechas: ['definir 12 TEMAS'] }); // sin importar mayúsculas ni acentos
  assert.equal(b.giros, 0); assert.ok(!desviado(b));
  assert.deepEqual(progreso(b), { hechas: 1, total: 3, pct: 33 });
  assert.equal(tareaActual(b).t, 'Redactar 12 copies');
  assert.equal(aplicarAvance(b, { hechas: ['algo que no existe'] }), b, 'lo que no está en la brújula no cambia nada');
  b = marcar(marcar(b, 1), 2);
  assert.equal(progreso(b).pct, 100); assert.equal(tareaActual(b), null);
  assert.match(contextoBrujula(b), /Todas las tareas están hechas/);
  assert.match(contextoBrujula(marcar(b, 0, false)), /TAREA ACTUAL: Definir 12 temas/);
  // El harness la lleva al agente
  assert.match(sistemaDe('organizacion', { brujula: contextoBrujula(b) }), /BRÚJULA DE ESTA CONVERSACIÓN/);
  assert.match(sistemaDe('organizacion'), /```meta/, 'el protocolo enseña a proponer la meta');
});

t('el uso de la semana: contra tu límite y al ritmo de la semana', () => {
  const lunes = new Date(2026, 9, 26, 0, 0).getTime(), jueves = new Date(2026, 9, 29, 12, 0).getTime();
  assert.equal(inicioSemana(jueves), lunes);
  assert.equal(inicioSemana(new Date(2026, 10, 1, 23, 0).getTime()), lunes, 'el domingo sigue siendo la misma semana');
  const r = ritmoSemana({ usados: 126, limite: 300, ahora: jueves });
  assert.equal(r.pct, 42); assert.equal(r.ideal, 50); assert.equal(r.dias, 4); assert.equal(r.porDia, 15);
  assert.equal(ritmoSemana({ usados: 10, limite: 0, ahora: jueves }).pct, null, 'sin límite no hay %');
  assert.equal(ritmoSemana({ usados: 400, limite: 300, ahora: jueves }).porDia, 0);
  assert.equal(usosDe({ api_call_count: 7, message_count: 40 }), 7);
  assert.equal(usosDe({ message_count: 9 }), 5);
});

t('Consulting: operaciones, finanzas y equipo de un cliente, con el techo del nivel', () => {
  const s = sistemaDe('consulting', { cliente: 'Nao', carpeta: 'clients/nao', nivel: 'Brand Growth' });
  assert.match(s, /^INHERENT LLM · MODO CONSULTING/);
  assert.match(s, /OPERATIONS OS/); assert.match(s, /FUERA DEL ALCANCE/); assert.match(s, /⚠️ SIN DATOS/);
  assert.match(s, /- Cliente: Nao \(clients\/nao\)/);
  assert.deepEqual(CONSULTING.map(([id]) => id), ['operaciones', 'finanzas', 'equipo']);
  assert.ok(CONSULTING.find(([id]) => id === 'finanzas')[3].some(([t]) => t.includes('BMC')), 'el BMC está en Finanzas');
  assert.ok(CONSULTING.every(([, , , ts]) => ts.length >= 3 && ts.every(([t, q]) => t && q)));
  assert.equal(alcanceConsulting({ id: 'partnership', nombre: 'Growth Partnership' }), 'si');
  assert.equal(alcanceConsulting({ id: 'growth', nombre: 'Brand Growth' }), 'fuera');
  assert.equal(alcanceConsulting({ id: 'medida', nombre: 'A la medida' }), 'ficha');
  assert.equal(alcanceConsulting(null), 'sin-ficha');
});

t('encargos: Estrategia manda trabajo a Consulting o a Diseño y queda como tarea', () => {
  assert.match(sistemaDe('estrategia'), /```encargo/, 'el harness de Estrategia enseña el bloque');
  const r = 'Hay que verlo.\n```encargo\n{"area":"consulting","titulo":"Crear el BMC de Nao","por_que":"Ver de dónde sale la utilidad","vence":"2026-11-05"}\n```\n```encargo\n{"area":"Diseño","titulo":"Carrusel de lanzamiento"}\n```\n```encargo\n{"area":"ventas","titulo":"No existe"}\n```';
  const k = leerTarjetas(r);
  assert.deepEqual(k.encargos, [{ area: 'consulting', titulo: 'Crear el BMC de Nao', por_que: 'Ver de dónde sale la utilidad', vence: '2026-11-05' }, { area: 'diseno', titulo: 'Carrusel de lanzamiento', por_que: '', vence: '' }]);
  assert.equal(textoVisible(r), 'Hay que verlo.');
  assert.equal(textoVisible('Va\n```encargo\n{"area":"cons'), 'Va', 'a medio escribir no se ve');
  assert.equal(leerEncargo({ area: 'consulting', titulo: '' }), null);
  assert.equal(leerEncargo({ area: 'consulting', titulo: 'x', vence: 'mañana' }).vence, '', 'una fecha que no es fecha se ignora');
  assert.equal(leerTarjetas(Array(5).fill('```encargo\n{"area":"diseno","titulo":"x"}\n```').join('\n')).encargos.length, 3, 'máximo 3');
  const t0 = tareaDeEncargo(k.encargos[0], { cliente: 'nao', nombre: 'Nao', email: 'ceo@x.com' });
  assert.equal(t0.area, 'consulting'); assert.equal(t0.cliente, 'nao'); assert.equal(t0.origen, 'estrategia'); assert.equal(t0.assignee, 'ceo@x.com');
  assert.equal(t0.due, '2026-11-05'); assert.equal(t0.status, 'Por empezar'); assert.equal(t0.dept, '');
  assert.equal(tareaDeEncargo(k.encargos[1], { cliente: 'nao', email: 'a' }).dept, '⑥A Diseño gráfico');
  const xs = encargosDe([{ area: 'consulting', cliente: 'nao', status: 'Hecha', title: 'a' }, { area: 'consulting', cliente: 'nao', status: 'Por empezar', title: 'b' }, { area: 'diseno', cliente: 'nao', title: 'c' }, { area: 'consulting', cliente: 'akai', title: 'd' }], 'consulting', 'nao');
  assert.deepEqual(xs.map((x) => x.title), ['b', 'a'], 'abiertas primero, solo del área y del cliente');
});

t('las áreas: las mismas del Tablero y del Chat, con su switch', () => {
  assert.deepEqual(AREAS.map((a) => a.id), ['estrategia', 'organizacion', 'diseno', 'consulting']);
  for (const a of AREAS) assert.ok(MODOS.some((m) => m.id === a.modo), `${a.id} tiene modo en el Chat`);
  assert.equal(areaDeEspacio('marcas').id, 'diseno'); assert.equal(areaDeEspacio('org').id, 'organizacion'); assert.equal(areaDeModo('consulting').espacio, 'consulting');
  const xs = areasDe({ organizacion: true, diseno: true });
  assert.deepEqual(xs.map((a) => a.id), ['organizacion', 'diseno']);
  assert.equal(areaConFlecha(xs, 'diseno', 'ArrowRight'), 'organizacion', 'da la vuelta');
  assert.equal(areaConFlecha(xs, 'organizacion', 'ArrowLeft'), 'diseno');
  assert.equal(areaConFlecha(xs, 'organizacion', 'Enter'), null);
  const h = switchHtml(xs, 'diseno', (n) => `<svg data-i="${n}"></svg>`);
  assert.match(h, /role="radiogroup"/); assert.match(h, /--n:2;--i:1/);
  assert.equal((h.match(/aria-checked="true"/g) || []).length, 1);
  assert.match(h, /data-area="diseno" aria-checked="true" tabindex="0"/);
  assert.equal(areaDe('nada'), null);
});

t('el switch de IA: qué empresa responde, aparte del modelo', () => {
  assert.equal(iaDe('anthropic'), 'claude'); assert.equal(iaDe('openai-codex'), 'chatgpt'); assert.equal(iaDe('openai'), 'chatgpt');
  assert.equal(iaDe('lmstudio'), 'local'); assert.equal(iaDe('ollama-cloud'), 'otras'); assert.equal(iaDe('openrouter'), 'otras');
  assert.ok(esLocal('ollama') && !esLocal('ollama-cloud'));
  const ms = { proveedores: [{ slug: 'openai-codex', listo: true, modelos: ['gpt'] }, { slug: 'anthropic', listo: false, modelos: ['c'] }, { slug: 'xai', listo: true, modelos: [] }] };
  assert.deepEqual(iasListas(ms).map(([id]) => id), ['chatgpt', 'local'], 'solo las listas con modelos; en tu compu siempre');
  assert.ok(IAS.every(([id, n, ic]) => id && n && ic));
});

console.log(`\n${ok} pruebas del Inherent LLM pasaron`);
