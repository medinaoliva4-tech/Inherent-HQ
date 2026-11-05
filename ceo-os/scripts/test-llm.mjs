// Pruebas del Inherent LLM: el harness de cada modo, los comandos «/», las tarjetas (criterios, pregunta y encargos), las sesiones,
// las áreas (los workspaces de herramientas.js más Organización) y el switch de IA.
// npm run test:llm
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { leerMeta, crearBrujula, progreso, tareaActual, marcar, aplicarAvance, contarGiro, desviado, contextoBrujula, ritmoSemana, inicioSemana, usosDe } from '../public/js/llm/brujula.js';
import { MODOS, MODO_LIBRE, SISTEMA_LIBRE, modosDe, modoDe, sistemaDe, HARNESS, REGLAS_COMUNES, SUGERENCIAS, COMANDOS, leerComando, textoVisible, leerTarjetas, idSesion, leerIdSesion, tituloDe, grupoFecha, ESFUERZOS, nombreEsfuerzo, CONSULTING, alcanceConsulting, consultingAbierto, leerEncargo, tareaDeEncargo, encargosDe } from '../public/js/llm/modos.js';
import { AREAS, areaDe, areaDeModo } from '../public/js/areas.js';
import { IAS, iaDe, iasListas, modelosDeIa, fuertesDe, esLocal } from '../public/js/llm/ias.js';

import { carpetaDe, carpetas, estadoDeTrabajo, agenteDeSesion } from '../public/js/llm/carpetas.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };

t('seis modos, cada uno con su harness y sus sugerencias', () => {
  assert.deepEqual(MODOS.map((m) => m.id), ['estrategia', 'organizacion', 'marketing', 'diseno', 'consulting', 'produccion']);
  assert.deepEqual(MODOS.map((m) => m.nombre), ['Strategy', 'Organization', 'Marketing', 'Creative', 'Consulting', 'Production'], 'los nombres del CEO; los ids no cambian');
  for (const m of MODOS) {
    const h = HARNESS[m.id];
    assert.ok(h.rol && h.como.length && h.herramientas && h.criterios.length >= 3, m.id);
    assert.equal(SUGERENCIAS[m.id].length, 4, m.id);
  }
  assert.equal(modoDe('nada').id, 'estrategia');
});

t('el system prompt lleva reglas, harness, criterios, protocolo y el contexto como datos', () => {
  const s = sistemaDe('estrategia', { persona: 'Ana', puesto: 'CEO', fecha: '2026-10-26', cliente: 'Akai', carpeta: 'clients/akai', nivel: 'Brand Growth', extra: ['Paso: 2'], instrucciones: 'BLOQUE ESTRATEGIA' });
  assert.match(s, /^INHERENT LLM · MODO STRATEGY \(① Strategy\)/);
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
  assert.match(s, /Nunca: los costos y márgenes de Inherent \(inherent\/06-ECONOMIA\.md\)/);
  assert.match(s, /El repo NO se edita desde aquí/);
  assert.match(s, /Nunca borres/);
});

t('comandos «/»: con y sin acento, con argumento, y lo demás es texto', () => {
  assert.deepEqual(leerComando('/diseño arma un carrusel'), { cmd: '/diseno', arg: 'arma un carrusel' });
  assert.deepEqual(leerComando('  /Organizacion '), { cmd: '/organizacion', arg: '' });
  assert.deepEqual(leerComando('/ajustes x'), { cmd: '/ajustes', arg: 'x' });
  assert.equal(leerComando('/inventado'), null);
  assert.equal(leerComando('hola /nuevo'), null);
  assert.equal(COMANDOS.length, 12);
  assert.deepEqual(leerComando('/producción'), { cmd: '/produccion', arg: '' });
  assert.deepEqual(leerComando('/marketing'), { cmd: '/marketing', arg: '' });
  assert.deepEqual(leerComando('/consulting nao'), { cmd: '/consulting', arg: 'nao' });
  assert.deepEqual(leerComando('/brújula'), { cmd: '/brujula', arg: '' });
  assert.deepEqual(leerComando('/privado'), { cmd: '/privado', arg: '' });
  assert.deepEqual(leerComando('/ramificar'), { cmd: '/ramificar', arg: '' });
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
  assert.deepEqual(leerTarjetas('```pregunta\n{roto}\n```'), { criterios: null, pregunta: null, meta: null, avance: null, encargos: [], plan: null, campanas: [] });
  // El bloque de estrategia tampoco se ve (lo guarda el OS).
  assert.equal(textoVisible('Listo.\n```estrategia\n{"meta":"x"}\n```'), 'Listo.');
});

t('sin modo: solo el CEO lo ve y va sin instrucciones de Inherent', () => {
  assert.ok(modosDe('ceo', MODOS).some((m) => m.id === 'libre'));
  for (const r of ['team', 'coo', 'client']) assert.ok(!modosDe(r, MODOS).some((m) => m.id === 'libre'), r);
  assert.equal(sistemaDe('libre', { persona: 'x', cliente: 'y' }), SISTEMA_LIBRE);
  assert.ok(!/Inherent/.test(SISTEMA_LIBRE));
  assert.equal(MODO_LIBRE.pide, '');
  assert.equal(leerIdSesion(idSesion('libre', '')).modo, 'libre');
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
  // En Partnership, Finanzas va «según acuerdo»: solo si la ficha la nombra.
  const gp = { id: 'partnership', nombre: 'Growth Partnership' };
  assert.equal(alcanceConsulting(gp, { incluye: [{ k: 'Áreas', v: '1 a 10' }] }), 'sin-finanzas');
  assert.equal(alcanceConsulting(gp, { incluye: [{ k: '11 · Finanzas vinculadas al crecimiento', v: 'sí' }] }), 'si');
  assert.deepEqual(['si', 'sin-finanzas', 'ficha', 'fuera', 'sin-ficha'].map(consultingAbierto), [true, true, true, false, false]);
  assert.match(s, /inherent\/06-ECONOMIA\.md no se lee/, 'Consulting trabaja los números del cliente, nunca los de Inherent');
  assert.match(sistemaDe('estrategia'), /A Consulting solo se manda si el nivel del cliente lo trae/);
});

t('encargos: Estrategia manda trabajo a Consulting o a Diseño y queda como tarea', () => {
  assert.match(sistemaDe('estrategia'), /```encargo/, 'el harness de Estrategia enseña el bloque');
  const r = 'Hay que verlo.\n```encargo\n{"area":"consulting","titulo":"Crear el BMC de Nao","por_que":"Ver de dónde sale la utilidad","vence":"2099-11-05"}\n```\n```encargo\n{"area":"Diseño","titulo":"Carrusel de lanzamiento"}\n```\n```encargo\n{"area":"ventas","titulo":"Sin área"}\n```';
  const k = leerTarjetas(r);
  assert.deepEqual(k.encargos, [{ area: 'consulting', titulo: 'Crear el BMC de Nao', por_que: 'Ver de dónde sale la utilidad', vence: '2099-11-05' }, { area: 'diseno', titulo: 'Carrusel de lanzamiento', por_que: '', vence: '' }, { area: '', titulo: 'Sin área', por_que: '', vence: '' }], 'un área que no se entiende no se pierde: sale sin área');
  assert.deepEqual(['finanzas', 'Operaciones', 'equipo', ' consulting ', 'Diseño gráfico', 'campañas', 'evento'].map((a) => leerEncargo({ area: a, titulo: 'x' }).area), ['consulting', 'consulting', 'consulting', 'consulting', 'diseno', 'marketing', 'marketing'], 'los sinónimos van a su área');
  assert.equal(leerEncargo({ area: 'consulting', titulo: 'x', vence: '2026-02-31' }, '2026-01-01').vence, '', 'una fecha que no existe se ignora');
  assert.equal(leerEncargo({ area: 'consulting', titulo: 'x', vence: '2026-01-02' }, '2026-03-01').vence, '', 'una fecha pasada se ignora');
  assert.equal(textoVisible(r), 'Hay que verlo.');
  assert.equal(textoVisible('Va\n```encargo\n{"area":"cons'), 'Va', 'a medio escribir no se ve');
  assert.equal(leerEncargo({ area: 'consulting', titulo: '' }), null);
  assert.equal(leerEncargo({ area: 'consulting', titulo: 'x', vence: 'mañana' }).vence, '', 'una fecha que no es fecha se ignora');
  assert.equal(leerTarjetas(Array(5).fill('```encargo\n{"area":"diseno","titulo":"x"}\n```').join('\n')).encargos.length, 3, 'máximo 3');
  const t0 = tareaDeEncargo(k.encargos[0], { cliente: 'nao', nombre: 'Nao', email: 'ceo@x.com' });
  assert.equal(t0.area, 'consulting'); assert.equal(t0.cliente, 'nao'); assert.equal(t0.origen, 'estrategia'); assert.equal(t0.assignee, 'ceo@x.com');
  assert.equal(t0.due, '2099-11-05'); assert.equal(t0.status, 'Por empezar'); assert.equal(t0.dept, '');
  assert.equal(t0.visibility, 'private', 'el porqué es de la estrategia: solo lo ven quien lo manda y a quien se asigna');
  assert.equal(t0.client_slug, 'nao', 'Mis tareas y el conector saben de qué cliente es');
  assert.equal(tareaDeEncargo(k.encargos[1], { cliente: 'nao', email: 'a' }).dept, '⑥A Diseño gráfico');
  const E = { origen: 'estrategia' }, f = (d) => ({ _meta: { created_at: d } });
  const xs = encargosDe([{ ...E, area: 'consulting', cliente: 'nao', status: 'Hecha', title: 'a' }, { ...E, ...f('2026-01-01'), area: 'consulting', cliente: 'nao', status: 'Por empezar', title: 'viejo' }, { ...E, ...f('2026-03-01'), area: 'consulting', cliente: 'nao', title: 'nuevo' },
    { ...E, area: 'diseno', cliente: 'nao', title: 'c' }, { ...E, area: 'consulting', cliente: 'akai', title: 'd' }, { area: 'consulting', cliente: 'nao', title: 'no es de Estrategia' }], 'consulting', 'nao');
  assert.deepEqual(xs.map((x) => x.title), ['nuevo', 'viejo', 'a'], 'abiertas primero y las nuevas arriba; solo de Estrategia, del área y del cliente');
});

t('Marketing: el plan del mes y las campañas salen del Chat como bloques', () => {
  const s = sistemaDe('marketing', { cliente: 'Nao', carpeta: 'clients/nao' });
  assert.match(s, /^INHERENT LLM · MODO MARKETING \(③ Marketing\)/);
  assert.ok(s.includes('```plan') && s.includes('```campana') && s.includes('mk-campana'));
  const r = 'Va.\n```plan\n{"pilares":[{"nombre":"Autoridad","peso":40}],"inventado":1}\n```\n```campana\n{"nombre":"Apertura","tipo":"Apertura o inauguración","ancla":"2026-12-12"}\n```\n```campana\n{"nombre":"Otra","tipo":"evento"}\n```\n```campana\n{"nombre":"Tercera"}\n```';
  const k = leerTarjetas(r);
  assert.deepEqual(Object.keys(k.plan), ['pilares'], 'solo secciones conocidas del plan');
  assert.equal(k.campanas.length, 2, 'dos campañas como máximo por respuesta (mk-campana § 2)');
  assert.equal(k.campanas[0].tipo, 'apertura');
  assert.equal(textoVisible(r), 'Va.');
  assert.equal(tareaDeEncargo({ area: 'marketing', titulo: 'Campaña de apertura' }, { cliente: 'nao', email: 'a' }).dept, '③ Marketing');
});

t('las áreas: los workspaces por su modo, más Organización', () => {
  assert.deepEqual(AREAS.map((a) => a.id), ['estrategia', 'organizacion', 'marketing', 'diseno', 'consulting', 'produccion']);
  for (const a of AREAS) assert.ok(MODOS.some((m) => m.id === a.modo), `${a.id} tiene modo en el Chat`);
  for (const a of AREAS) assert.ok(a.nombre && a.sub && a.icono && typeof a.ws === 'string', `${a.id} completa`);
  assert.equal(areaDeModo('consulting').ws, 'consulting');
  assert.equal(areaDeModo('produccion').ws, 'production');
  assert.equal(areaDeModo('organizacion').ws, '', 'Organización no es un workspace, pero sí un modo del Chat');
  assert.equal(areaDe('nada'), null);
  assert.equal(areaDeModo('nada'), null);
});

t('Production: brief, guion, shot list, grabación y edición, con el ciclo y la ficha como techo', () => {
  const s = sistemaDe('produccion', { cliente: 'Akai', carpeta: 'clients/akai' });
  assert.match(s, /^INHERENT LLM · MODO PRODUCTION \(⑤ Producción · ⑦ Video Editing\)/);
  assert.match(s, /día 11/); assert.match(s, /FUERA DEL ALCANCE/); assert.match(s, /id_creativo/);
  assert.match(s, /- Marca: Akai \(clients\/akai\)/);
  assert.match(s, /Hook en los primeros 3 segundos/); assert.match(s, /safe zones/); assert.match(s, /marca de agua/);
  assert.match(s, /Nunca tarifas ni costos/);
  assert.equal(SUGERENCIAS.produccion.length, 4);
  assert.deepEqual(leerIdSesion(idSesion('produccion', 'akai', 1767225600000, 0.5)), { modo: 'produccion', slug: 'akai' }, 'las de Production se reabren');
  assert.deepEqual(leerComando('/produccion'), { cmd: '/produccion', arg: '' });
  assert.deepEqual(leerComando('/produccion guion del reel'), { cmd: '/produccion', arg: 'guion del reel' });
});

t('el switch de IA: qué empresa responde, aparte del modelo', () => {
  assert.equal(iaDe('anthropic'), 'claude'); assert.equal(iaDe('openai-codex'), 'chatgpt'); assert.equal(iaDe('openai'), 'chatgpt');
  assert.equal(iaDe('lmstudio'), 'local'); assert.equal(iaDe('ollama-cloud'), 'otras'); assert.equal(iaDe('openrouter'), 'otras');
  assert.ok(esLocal('ollama') && !esLocal('ollama-cloud'));
  const ms = { proveedores: [{ slug: 'openai-codex', listo: true, modelos: ['gpt'] }, { slug: 'anthropic', listo: false, modelos: ['c'] }, { slug: 'xai', listo: true, modelos: [] }] };
  assert.deepEqual(iasListas(ms).map(([id]) => id), ['chatgpt', 'local'], 'solo las listas con modelos; en tu compu siempre');
  assert.ok(IAS.every(([id, n, ic]) => id && n && ic));
  // Con una pasarela (Kilo Pass, OpenRouter…), la IA sale de la empresa del modelo.
  assert.equal(iaDe('kilocode', 'anthropic/claude-sonnet-4.5'), 'claude'); assert.equal(iaDe('openrouter', 'openai/gpt-5'), 'chatgpt'); assert.equal(iaDe('kilocode', 'google/gemini-2.5-pro'), 'gemini');
  assert.equal(iaDe('kilocode', 'qwen/qwen3-coder'), 'otras'); assert.equal(iaDe('kilocode'), 'otras'); assert.equal(iaDe('anthropic', 'claude-opus'), 'claude');
  const kilo = { proveedores: [{ slug: 'kilocode', listo: true, modelos: ['anthropic/claude-opus', 'google/gemini-pro', 'qwen/qwen3'] }, { slug: 'ollama', listo: true, modelos: ['qwen3:8b'] }] };
  assert.deepEqual(iasListas(kilo).map(([id]) => id), ['claude', 'gemini', 'local', 'otras'], 'con Kilo, cada empresa sale en su IA');
  assert.deepEqual(modelosDeIa(kilo, 'claude'), [{ provider: 'kilocode', model: 'anthropic/claude-opus' }]);
  assert.deepEqual(modelosDeIa(kilo, 'local'), [{ provider: 'ollama', model: 'qwen3:8b' }]);
  assert.deepEqual(fuertesDe('anthropic/claude-opus-5.5'), ['estrategia', 'diseno']); assert.deepEqual(fuertesDe('moonshotai/kimi-k3'), ['diseno', 'consulting']); assert.deepEqual(fuertesDe('qwen/qwen3'), []);
});

t('carpetas: cada conversación vive en su cliente; sin cliente, en Inherent', () => {
  assert.equal(carpetaDe({ id: 'inh-diseno-akai-mw1' }), 'akai');
  assert.equal(carpetaDe({ id: 'inh-organizacion-general-mw1' }), 'inherent');
  assert.equal(carpetaDe({ id: 'inh-organizacion-general-mw1', cliente: 'nao' }), 'nao');
});
t('carpetas: primero lo reciente, luego Inherent y Personal; un cliente vacío también sale', () => {
  const xs = carpetas([
    { id: 'inh-diseno-akai-mw1', last_active: '2026-11-01' },
    { id: 'inh-diseno-nao-mw2', last_active: '2026-11-03', agente: { nombre: 'Creative', estado: 'decidir' } },
    { id: 'inh-organizacion-general-mw3', last_active: '2026-11-05' },
  ], [{ slug: 'akai', nombre: 'AKAI' }, { slug: 'nao', nombre: 'NAO' }, { slug: 'atelier', nombre: 'Atelier' }], { personal: true });
  assert.deepEqual(xs.map((c) => c.nombre), ['NAO', 'AKAI', 'Atelier', 'Inherent', 'Personal']);
  assert.equal(xs[0].pendientes, 1);
  assert.deepEqual(carpetas([], []).map((c) => c.id), ['inherent']);
});
t('carpetas: la fila muestra el trabajo más urgente', () => {
  assert.equal(estadoDeTrabajo({ etapas: [{ estado: 'aprobada' }, { estado: 'revision' }] }), 'decidir');
  assert.equal(estadoDeTrabajo({ etapas: [{ estado: 'en_cola' }] }), 'trabajando');
  assert.equal(estadoDeTrabajo({ etapas: [{ estado: 'aprobada' }] }), 'listo');
  const runs = [{ id: 'a', flujo: { agente: 'Creative' }, etapas: [{ estado: 'trabajando' }] }, { id: 'b', flujo: { agente: 'Ads' }, etapas: [{ estado: 'pregunta' }] }, { id: 'c', archivado: true, etapas: [{ estado: 'revision' }] }];
  assert.deepEqual(agenteDeSesion([{ run: 'a' }, { run: 'b' }, { run: 'c' }], runs), { nombre: 'Ads', estado: 'decidir' });
  assert.equal(agenteDeSesion([], runs), null);
});

console.log(`\n${ok} pruebas del Inherent LLM pasaron`);
