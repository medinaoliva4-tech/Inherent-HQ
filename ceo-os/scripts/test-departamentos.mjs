// Los 9 departamentos en el Chat (public/js/llm/departamentos.js): «@», niveles con el router por tarea, lineamientos acordes a
// las skills nuevas (PR #297), el gate de pasar a otro departamento (F4.5) y la ruta que guarda el turno en la conversación.
// npm run test:departamentos
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEPARTAMENTOS, departamentoDe, leerDepartamento, menuDepartamentos, nivelDe, leerPase, puedePasar, textoPase, sistemaDepartamento, contextoPara, mensajeConContexto } from '../public/js/llm/departamentos.js';
import { AGENTES } from '../public/js/harness/agentes.js';
import { MODOS, textoVisible, leerTarjetas } from '../public/js/llm/modos.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const AQUI = path.dirname(fileURLToPath(import.meta.url)), RAIZ = path.join(AQUI, '..', '..');
const LLM = fs.readFileSync(path.join(AQUI, '..', 'public/js/screens/llm.js'), 'utf8');
const CHAT = fs.readFileSync(path.join(AQUI, '..', 'api/_lib/chat.js'), 'utf8');

t('son los 9 de agents/ (PR #297), con «@» únicos y su modo del Chat real', () => {
  assert.equal(DEPARTAMENTOS.length, 9);
  assert.deepEqual(DEPARTAMENTOS.map((d) => d.arroba), ['account', 'estrategia', 'branding', 'marketing-creative', 'produccion', 'diseno', 'community', 'posting', 'ads']);
  const nombres = DEPARTAMENTOS.flatMap((d) => [d.arroba, ...d.alias]);
  assert.equal(new Set(nombres).size, nombres.length - 1, 'un solo alias repetido a propósito: produccion es su arroba y su alias');
  for (const d of DEPARTAMENTOS) assert.ok(!d.modo || MODOS.some((m) => m.id === d.modo), `${d.id}: modo ${d.modo}`);
  assert.deepEqual(AGENTES.map((a) => a.id), DEPARTAMENTOS.map((d) => d.id), 'harness/agentes.js sale de aquí');
});
t('cada orquestador y cada skill existe en agents/ (si el repo está con la reestructura)', () => {
  const agents = path.join(RAIZ, 'agents');
  if (!fs.existsSync(path.join(agents, '03-marketing-creative'))) return console.log('  (agents/ todavía es la estructura vieja: se salta)');
  for (const d of DEPARTAMENTOS) {
    assert.ok(fs.existsSync(path.join(RAIZ, d.carpeta, 'brain/WORKFLOW.md')), `${d.carpeta}brain/WORKFLOW.md`);
    for (const s of [d.orquestador, ...d.skills].filter(Boolean)) assert.ok(fs.existsSync(path.join(RAIZ, d.carpeta, 'brain/skills', s, 'SKILL.md')), `${d.id}: ${s}`);
  }
  for (const s of ['recepcion', 'resultados']) assert.ok(fs.existsSync(path.join(agents, '_comun/skills', s, 'SKILL.md')), s);
});
t('«@»: lee el departamento por su nombre o un alias, sin acentos; un correo o una @cuenta no son departamentos', () => {
  assert.equal(leerDepartamento('@estrategia arma el ICP de AKAI').dep.id, 'strategy');
  assert.equal(leerDepartamento('@estrategia arma el ICP de AKAI').resto, 'arma el ICP de AKAI');
  assert.equal(leerDepartamento('@Marketing-Creative la campaña').dep.id, 'marketing-creative');
  assert.equal(leerDepartamento('@diseño el carrusel').dep.id, 'graphic-design');
  assert.equal(leerDepartamento('@creativo, tres hooks').dep.id, 'marketing-creative');
  assert.equal(leerDepartamento('@produccion').resto, '');
  assert.equal(leerDepartamento('hola @estrategia'), null);
  assert.equal(leerDepartamento('@akai.oficial mira esto'), null);
  assert.equal(departamentoDe('nada'), null);
  assert.deepEqual(menuDepartamentos('@').length, 9);
  assert.deepEqual(menuDepartamentos('@mar').map((d) => d.id), ['branding', 'marketing-creative'], 'marca (alias de branding) y marketing');
  assert.deepEqual(menuDepartamentos('@pro').map((d) => d.id), ['production']);
});
t('niveles: el router por tarea decide, lo que lleva gate del CEO nunca va barato y fijar un nivel lo apaga', () => {
  assert.equal(nivelDe('strategy', 'hola').nivel, 'nivel-alto', 'Strategy tiene gate');
  assert.equal(nivelDe('ads', 'mira los anuncios').nivel, 'nivel-alto', 'Ads tiene gate');
  assert.equal(nivelDe('posting', 'escribe los hashtags y el alt text').nivel, 'nivel-bajo');
  assert.equal(nivelDe('community', 'contesta este comentario').nivel, 'nivel-bajo', 'el de partida de Community');
  assert.equal(nivelDe('marketing-creative', 'tres ideas de reel').nivel, 'nivel-medio');
  assert.equal(nivelDe('marketing-creative', 'arma la campaña del mes').nivel, 'nivel-alto');
  assert.equal(nivelDe('production', 'Planea cómo construir el editor').nivel, 'nivel-alto', 'chef del router de Code');
  assert.equal(nivelDe('marketing-creative', 'revisa este copy', { ultimo: 'nivel-alto' }).nivel, 'nivel-medio', 'la revisión la hace otro nivel');
  assert.deepEqual(nivelDe('strategy', 'arma el ICP', { fijo: 'nivel-bajo' }), { nivel: 'nivel-bajo', motivo: 'Fijado por ti' });
  assert.equal(nivelDe('posting', 'caption', { fijo: 'auto' }).nivel, 'nivel-bajo', '«auto» deja decidir al router');
});
t('lineamientos: método del repo, skills nuevas, F4.5 (preguntas en el Chat, pasar es propuesta) y ≤ 8000 para el puente', () => {
  for (const d of DEPARTAMENTOS) {
    const s = sistemaDepartamento(d, { cliente: 'akai' });
    assert.ok(s.length <= 8000, d.id);
    assert.ok(s.includes(`${d.carpeta}brain/WORKFLOW.md`), `${d.id}: su WORKFLOW`);
    for (const k of d.skills) assert.ok(s.includes(k), `${d.id}: ${k}`);
    assert.match(s, /```pregunta/); assert.match(s, /```pasar/); assert.match(s, /NO lo pases tú/);
    assert.match(s, /plan-contratado\.md/); assert.match(s, /06-ECONOMIA/); assert.match(s, /clients\/akai\//);
    assert.ok(!/02-growth|04-creative|07-video-editing|hormozi-brain/.test(s), `${d.id}: nada de la estructura vieja`);
  }
  assert.match(sistemaDepartamento('strategy'), /GATE: El CEO aprueba/);
  assert.match(sistemaDepartamento('strategy'), /ceo-os\/data\/hormozi/);
  assert.match(sistemaDepartamento('ads'), /GATE 1/);
  assert.equal(sistemaDepartamento('nada'), '');
});
t('pasar es un gate: leer antes, el CEO aprueba lo que sale de Strategy y lo que entra a Ads; la caja no se envía sola', () => {
  const r = 'Listo.\n```pasar\n{"a":"marketing-creative","que":"arma la campaña","resumen":"ICP: dueñas de restaurante"}\n```';
  assert.deepEqual(leerPase(r), { a: 'marketing-creative', que: 'arma la campaña', resumen: 'ICP: dueñas de restaurante' });
  assert.equal(leerPase('```pasar\n{"a":"nadie"}\n```'), null); assert.equal(leerPase('```pasar\nno es json\n```'), null);
  assert.equal(textoVisible(r), 'Listo.', 'el bloque no se ve como texto');
  assert.deepEqual(Object.keys(leerTarjetas(r)).includes('pasar'), false);
  assert.match(puedePasar({ de: 'marketing-creative', a: 'graphic-design', leido: false, rol: 'coo' }), /lee/);
  assert.equal(puedePasar({ de: 'marketing-creative', a: 'graphic-design', leido: true, rol: 'team' }), null);
  assert.match(puedePasar({ de: 'strategy', a: 'marketing-creative', leido: true, rol: 'coo' }), /CEO/);
  assert.equal(puedePasar({ de: 'strategy', a: 'marketing-creative', leido: true, rol: 'ceo' }), null);
  assert.match(puedePasar({ de: 'marketing-creative', a: 'ads', leido: true, rol: 'coo' }), /CEO/);
  assert.match(puedePasar({ de: 'branding', a: 'branding', leido: true, rol: 'ceo' }), /Ya estás/);
  const caja = textoPase(leerPase(r), 'strategy');
  assert.ok(caja.startsWith('@marketing-creative arma la campaña')); assert.match(caja, /Viene de ① Strategy \(leído y aprobado por una persona\)/);
  assert.equal(leerDepartamento(caja).dep.id, 'marketing-creative', 'lo que queda en la caja llama al siguiente');
});
t('contexto: lo hablado desde la última respuesta de ese departamento, recortado', () => {
  const msgs = [{ r: 'u', t: 'viejo' }, { r: 'a', dep: 'strategy', t: 'respuesta de strategy' }, { r: 'u', t: 'el ICP son restaurantes' }, { r: 'a', t: 'ok', dep: '' }, { r: 'plan', t: 'x' }];
  const c = contextoPara(msgs, 'strategy');
  assert.ok(!c.includes('viejo') && !c.includes('respuesta de strategy')); assert.match(c, /PERSONA: el ICP son restaurantes\n\nCHAT: ok/);
  assert.match(contextoPara(msgs, 'branding'), /① Strategy: respuesta de strategy/);
  assert.ok(contextoPara([{ r: 'u', t: 'x'.repeat(9000) }], 'ads').length <= 6000);
  assert.equal(mensajeConContexto('haz X', ''), 'haz X'); assert.match(mensajeConContexto('haz X', 'C'), /^LO HABLADO EN EL CHAT[\s\S]*PEDIDO:\nhaz X$/);
});
t('la pantalla: «@» trae los departamentos, el turno va al motor Code con systemPrompt y la tarjeta Pasar existe', () => {
  assert.match(LLM, /menuDepartamentos\(v\)/);
  assert.match(LLM, /turnoCode\(`\$\{S\.sesion\}::\$\{dep\.id\}`/);
  assert.match(LLM, /sistema: sistemaDepartamento\(dep/);
  assert.match(LLM, /nivelDe\(dep, pedido/);
  assert.match(LLM, /data-a|dep-pasar/); assert.match(LLM, /a === 'dep-leer'/); assert.match(LLM, /a === 'dep-pasar'/);
  assert.ok(!/turnoDepartamento[\s\S]{0,200}enviar\(texto\)/.test(LLM), 'pasar no envía solo');
});
t('la ruta del servidor guarda el turno con su departamento y su nivel (y no deja a un cliente del portal)', () => {
  assert.match(CHAT, /on\('POST', 'chat\/sesiones\/:id\/departamento'/);
  assert.match(CHAT, /u\.role === 'client'\) return res\.status\(403\)/);
  assert.match(CHAT, /departamentoDe\(b\.dep\)/);
  assert.match(CHAT, /dep: dep\.id, nivel/);
});

console.log(`\n${ok} pruebas de departamentos OK`);
