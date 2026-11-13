// Pruebas del Chat con capacidades: un solo motor por conversación (PATCH entre turnos), los chips y su estado, la
// activación por intención (casos en español), los presets planifica/ejecuta, el gasto aprobado y la caída al chat de siempre.
// npm run test:capacidades
import assert from 'node:assert/strict';
import { detectarCapacidades, rutear } from '../public/js/llm/router-code.js';
import { CAPACIDADES, CAPACIDADES_RESPALDO, normalizarCapacidades, vacias, alternar, chips, activas, porIntencion, reglaSinCapacidad, modoMotor, parcheTurno, normalizarModelos, agrupar, planDePreset, lineaPlan, disponibleO, costoDe, dinero, respuestaCosto, plegar, contextoPuente } from '../public/js/llm/capacidades.js';
import { COCINA, MODELOS_RESPALDO, PRESETS_RESPALDO } from '../public/js/llm/modelos-tabla.js';
import { traducir } from '../public/js/chat-code-puro.js';

let ok = 0; const t = async (n, f) => { await f(); ok++; console.log('✓', n); };
const ids = (s) => detectarCapacidades(s).map((x) => x.id);

// Un catálogo como el que mandará el puente (contrato real).
const REAL = normalizarCapacidades({ capacidades: [
  { id: 'codigo', nombre: 'Código', estado: 'lista' }, { id: 'figwright', nombre: 'Figwright', estado: 'lista' },
  { id: 'imagen', nombre: 'Imágenes', estado: 'lista' }, { id: 'radar', nombre: 'Radar', estado: 'apagada', motivo: 'Apagada por el CEO' },
  { id: 'video', nombre: 'Video', estado: 'sin_conexion', motivo: 'Falta la llave de video' },
] });

await t('intención: Figma y Figwright, en español y sin falsos positivos', () => {
  assert.deepEqual(ids('Entra a Figma y hazme este diseño'), ['figwright']);
  assert.deepEqual(ids('diseña en figma la portada del carrusel'), ['figwright']);
  assert.deepEqual(ids('usa Figwright para armar las stories'), ['figwright']);
  assert.deepEqual(ids('hazlo sin Figma, solo descríbelo'), [], 'una negación no prende nada');
  assert.deepEqual(ids('no uses figwright esta vez'), []);
  assert.deepEqual(ids('¿Qué opinas del plan de marketing de octubre?'), []);
});
await t('intención: imágenes, video, código, radar y herramientas', () => {
  assert.deepEqual(ids('Genera una imagen del platillo con luz de tarde'), ['imagen']);
  assert.deepEqual(ids('hazme unas imágenes para el post'), ['imagen']);
  assert.deepEqual(ids('crea un archivo con la lista de precios'), ['codigo']);
  assert.deepEqual(ids('corre las pruebas del OS'), ['codigo']);
  assert.deepEqual(ids('Corre npm test y dime qué falla'), ['codigo']);
  assert.deepEqual(ids('edita el video del lanzamiento'), ['video']);
  assert.deepEqual(ids('qué está funcionando en TikTok para restaurantes, mira el radar'), ['radar']);
  assert.deepEqual(ids('investiga la competencia de Akai'), ['radar']);
  assert.deepEqual(ids('usa tus herramientas para agendarlo'), ['herramientas']);
  assert.deepEqual(ids('entra a Figma y genera una imagen para la portada'), ['figwright', 'imagen'], 'varias a la vez, en orden');
  assert.deepEqual(ids('un reel sobre el menú'), [], 'hablar de un reel no es editar video');
});
await t('rutear sigue igual y además trae capacidades y preset (Auto)', () => {
  const r = rutear('Planea cómo construir el módulo de reportes y crea los archivos');
  assert.equal(r.cocinero, 'chef'); assert.equal(r.nivel, 'nivel-alto');
  assert.deepEqual(r.capacidades.map((x) => x.id), ['codigo']);
  assert.equal(r.preset, 'planifica-fuerte', 'trabajo fuerte con capacidades: planifica fuerte, ejecuta barato');
  assert.equal(rutear('Renombra la variable cliente y crea el archivo de constantes').preset, 'rapido-gratis', 'lo mecánico va rápido y gratis');
  assert.equal(rutear('Haz una auditoría de seguridad del login').preset, 'maxima-calidad');
  assert.equal(rutear('¿Cómo va la semana?').preset, null, 'una plática no se planifica');
});

await t('estado de chips: lista, sin conexión y apagada; solo viajan las listas', () => {
  let c = alternar(vacias(), 'figwright', true); c = alternar(c, 'video', true);
  const xs = chips(c, REAL), f = xs.find((x) => x.id === 'figwright'), v = xs.find((x) => x.id === 'video');
  assert.equal(xs.length, CAPACIDADES.length);
  assert.ok(f.on && f.estado === 'lista');
  assert.ok(!v.on && v.pedida && v.estado === 'sin_conexion' && v.motivo === 'Falta la llave de video', 'pedida pero sin conexión no se prende');
  assert.equal(xs.find((x) => x.id === 'radar').estado, 'apagada');
  assert.equal(xs.find((x) => x.id === 'herramientas').estado, 'sin_conexion', 'lo que el puente no menciona queda sin conexión');
  assert.deepEqual(activas(c, REAL), ['figwright']);
  c = alternar(c, 'figwright', false);
  assert.deepEqual(c.apagadas, ['figwright'], 'apagar a mano se recuerda');
  assert.deepEqual(activas(c, REAL), []);
});
await t('respaldo (mock) marcado: solo Código lista, el resto dice por qué', () => {
  assert.ok(CAPACIDADES_RESPALDO.every((c) => c.mock));
  assert.equal(CAPACIDADES_RESPALDO.find((c) => c.id === 'codigo').estado, 'lista');
  assert.ok(CAPACIDADES_RESPALDO.filter((c) => c.id !== 'codigo').every((c) => c.estado === 'sin_conexion' && /capacidades/.test(c.motivo)));
});
await t('por intención: prende la lista, propone la apagada a mano y dice claro la que falta', () => {
  const { caps, avisos } = porIntencion(vacias(), detectarCapacidades('Entra a Figma y hazme este diseño'), REAL);
  assert.deepEqual(caps.on, ['figwright']); assert.deepEqual(caps.auto, ['figwright']);
  assert.equal(avisos[0].tipo, 'activada'); assert.match(avisos[0].texto, /^Figwright activado: entro a tu Figma/);
  // La persona la apaga: la intención ya no la prende sola, solo la propone.
  const apagada = alternar(caps, 'figwright', false);
  const p = porIntencion(apagada, detectarCapacidades('ahora entra a figma otra vez'), REAL);
  assert.deepEqual(p.caps.on, []); assert.equal(p.avisos[0].tipo, 'propuesta');
  // Sin Figwright: no se prende, se dice y se ofrecen alternativas (y el modelo recibe la regla de no fingir).
  const sin = porIntencion(vacias(), detectarCapacidades('Entra a Figma y hazme este diseño'), CAPACIDADES_RESPALDO);
  assert.deepEqual(sin.caps.on, []); assert.equal(sin.avisos[0].tipo, 'sin');
  assert.match(sin.avisos[0].texto, /Figwright no está conectado ahora/);
  assert.ok(sin.avisos[0].alternativas.length >= 2);
  assert.match(reglaSinCapacidad(sin.avisos), /No digas que lo hiciste/);
  assert.equal(reglaSinCapacidad(porIntencion(vacias(), detectarCapacidades('genera una imagen'), REAL).avisos), '');
  assert.equal(porIntencion(vacias(), detectarCapacidades('edita el video'), REAL).avisos[0].tipo, 'sin');
});

await t('PATCH entre turnos: una sola sesión, solo viaja lo que cambió', () => {
  const t1 = { model: 'sonnet', mode: modoMotor([]), capacidades: [], plan_ejecucion: false };
  assert.equal(t1.mode, 'chat', 'sin capacidades es el mismo motor en modo chat');
  assert.deepEqual(parcheTurno(t1, t1), {}, 'nada cambió: sin PATCH');
  const t2 = { model: 'opus-5.5', mode: modoMotor(['figwright']), capacidades: ['figwright'], plan_ejecucion: { planifica: 'opus-5.5', ejecuta: 'haiku-5.5' } };
  assert.deepEqual(parcheTurno(t1, t2), { model: 'opus-5.5', mode: 'code', capacidades: ['figwright'], plan_ejecucion: { planifica: 'opus-5.5', ejecuta: 'haiku-5.5' } });
  const t3 = { ...t2, capacidades: ['figwright', 'codigo'] };
  assert.deepEqual(parcheTurno(t2, t3), { capacidades: ['figwright', 'codigo'] });
  assert.deepEqual(parcheTurno(t3, { ...t3, capacidades: ['codigo', 'figwright'] }), {}, 'el orden no cuenta');
  assert.deepEqual(parcheTurno(null, t2, { conContrato: false }), { model: 'opus-5.5', mode: 'code' }, 'puente viejo: solo model y mode');
  assert.deepEqual(Object.keys(parcheTurno(null, t1)).sort(), ['capacidades', 'mode', 'model'], 'sesión reanudada: se manda todo');
});

await t('turnoCode: crea UNA sesión, PATCH entre turnos y caída marcada si el puente no tiene el contrato', async () => {
  const llamadas = []; const mem = {};
  globalThis.localStorage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
  const sse = (evs) => new Response(new ReadableStream({ start(c) { for (const e of evs) c.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(e)}\n\n`)); c.close(); } }));
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url), m = init.method || 'GET';
    if (u.endsWith('/api/code/pase')) return Response.json({ pase: 'p', expira: Date.now() + 600000, url: 'https://puente.test' });
    llamadas.push([m, u.replace('https://puente.test', ''), init.body ? JSON.parse(init.body) : null]);
    if (u.endsWith('/capacidades')) return Response.json({ error: 'no existe' }, { status: 404 });
    if (u.endsWith('/models')) return Response.json({ default: 'nivel-medio', models: [{ id: 'nivel-medio' }] });
    if (m === 'POST' && u.endsWith('/sessions')) return Response.json({ id: 's1' }, { status: 201 });
    if (m === 'PATCH') return Response.json({ id: 's1' });
    if (u.endsWith('/messages')) return Response.json({ turnId: 'u1' });
    if (u.endsWith('/events')) return sse([{ type: 'turn_start', turnId: 'u1', model: 'opus-5.5', planner: 'Opus 5.5', executor: 'Haiku 5.5' }, { type: 'tool_call', toolUseId: 'a', name: 'Task', input: {} }, { type: 'tool_call', toolUseId: 'b', name: 'Write', input: { file_path: 'x' }, parentToolUseId: 'a' }, { type: 'text_delta', text: 'Listo' }, { type: 'turn_end', turnId: 'u1', ok: true, result: 'Listo' }]);
    return Response.json({});
  };
  globalThis.document ||= { addEventListener() {}, querySelector: () => null, documentElement: { dataset: {} } }; // core.js escucha el teclado al cargar
  const { turnoCode, capacidadesPuente, catalogoPuente } = await import('../public/js/chat-code.js');
  const cap = await capacidadesPuente({ fresco: true });
  assert.ok(cap.mock && !cap.real && cap.puente, 'puente sin /capacidades: respaldo marcado, el puente sí está');
  const cat = await catalogoPuente({ fresco: true });
  assert.ok(cat.mock && cat.modelos === MODELOS_RESPALDO, 'sin catálogo: respaldo marcado');
  const vistos = []; const on = { plan: (p) => vistos.push(['plan', p]), tool: (p) => vistos.push(['tool', p]) };
  await turnoCode('conv-1', { email: 'a@b.c', mensaje: 'hola', proyecto: 'akai', modelo: 'sonnet', modo: 'chat', capacidades: [], planEjecucion: false, on });
  await turnoCode('conv-1', { email: 'a@b.c', mensaje: 'entra a figma', proyecto: 'akai', modelo: 'opus-5.5', modo: 'code', capacidades: ['figwright'], planEjecucion: { planifica: 'opus-5.5', ejecuta: 'haiku-5.5' }, on });
  const crea = llamadas.filter(([m, u]) => m === 'POST' && u === '/sessions'), parches = llamadas.filter(([m]) => m === 'PATCH');
  assert.equal(crea.length, 1, 'una sola sesión por conversación');
  assert.deepEqual(crea[0][2].capacidades, []); assert.equal(crea[0][2].mode, 'chat'); assert.equal(crea[0][2].plan_ejecucion, false);
  assert.equal(parches.length, 1, 'el primer turno no manda PATCH; el segundo sí');
  assert.deepEqual(parches[0][2], { model: 'opus-5.5', mode: 'code', capacidades: ['figwright'], plan_ejecucion: { planifica: 'opus-5.5', ejecuta: 'haiku-5.5' } });
  assert.deepEqual(vistos.find(([k]) => k === 'plan')[1], { planner: 'Opus 5.5', executor: 'Haiku 5.5' });
  assert.equal(vistos.filter(([k, p]) => k === 'tool' && p.padre === 'a').length, 2, 'los pasos del ejecutor llegan con su padre');
});

await t('presets: el destacado, planifica/ejecuta y la línea del hilo', () => {
  const cat = normalizarModelos({ modelos: [
    { id: 'opus-5.5', nombre: 'Opus 5.5', nivel: 'alto', roles: ['planifica', 'ejecuta'], disponible: true, costo_relativo: 4, via: 'claude_login' },
    { id: 'haiku-5.5', nombre: 'Haiku 5.5', nivel: 'bajo', roles: ['ejecuta'], disponible: true, costo_relativo: 1, via: 'claude_login' },
    { id: 'fable', nombre: 'Fable', nivel: 'alto', roles: ['planifica'], disponible: false, costo_relativo: 5, via: 'claude_login' },
    { id: 'nivel-bajo', nombre: 'Nivel bajo', nivel: 'bajo', roles: ['ejecuta'], disponible: true, costo_relativo: 0, via: 'gateway' },
    { id: 'sonnet', nombre: 'Sonnet', nivel: 'medio', disponible: true, costo_relativo: 2 },
  ] });
  assert.equal(cat.mock, false); assert.equal(cat.presets.length, 3, 'sin presets del puente, los de la tabla');
  assert.deepEqual(agrupar(cat.modelos).map((g) => g.nombre), ['Altos', 'Medios', 'Bajos']);
  assert.equal(agrupar(cat.modelos)[0].modelos[0].id, 'opus-5.5', 'los disponibles primero');
  const pf = planDePreset(cat, 'planifica-fuerte');
  assert.deepEqual(pf.plan_ejecucion, { planifica: 'opus-5.5', ejecuta: 'haiku-5.5' }); assert.equal(pf.model, 'opus-5.5');
  assert.equal(pf.linea, 'Opus planifica · Haiku ejecuta');
  assert.equal(planDePreset(cat, 'rapido-gratis').plan_ejecucion, false, 'mismo modelo: sin plan');
  assert.deepEqual([planDePreset(cat, 'maxima-calidad').model, planDePreset(cat, 'maxima-calidad').plan_ejecucion], ['opus-5.5', false], 'sin Fable ni Astra, el chef cae a Opus (y sin dos modelos distintos no hay plan)');
  assert.equal(disponibleO(cat, 'fable'), 'opus-5.5', 'Fable no está: cae a otro disponible del mismo nivel');
  assert.equal(planDePreset(cat, 'planifica-fuerte', { conCaps: false }).plan_ejecucion, false, 'una plática no se planifica');
  assert.equal(lineaPlan('Nivel alto del Gateway', 'Nivel bajo del Gateway (gratis)'), 'Nivel alto planifica · Nivel bajo ejecuta');
  assert.ok(PRESETS_RESPALDO[0].destacado && PRESETS_RESPALDO[0].nombre === 'Planifica fuerte, ejecuta barato');
  assert.deepEqual(PRESETS_RESPALDO.map((p) => p.nombre), ['Planifica fuerte, ejecuta barato', 'Todo rápido y gratis', 'Máxima calidad']);
  assert.deepEqual(COCINA.chef.modelos, ['fable', 'astra']); assert.deepEqual(COCINA.sous.modelos, ['sonnet']);
  assert.deepEqual(COCINA.linea.modelos, ['opus-5.5']); assert.deepEqual(COCINA.prep.modelos, ['haiku-5.5']);
  // Respaldo (puente viejo): todo cae a los niveles del Gateway, que el puente de hoy sí acepta.
  const mock = normalizarModelos(null);
  assert.ok(planDePreset(mock, 'planifica-fuerte').model.startsWith('nivel-'));
  assert.ok(planDePreset(mock, 'planifica-fuerte').plan_ejecucion.ejecuta.startsWith('nivel-'));
});

await t('pasos del ejecutor plegados bajo el plan; contexto para la sesión del puente', () => {
  const est = { texto: '' };
  const evs = [{ type: 'tool_call', toolUseId: 'p', name: 'Task', input: {} }, { type: 'tool_call', toolUseId: 'h1', name: 'Write', input: { file_path: 'a' }, parentToolUseId: 'p' }, { type: 'tool_result', toolUseId: 'h1', content: 'ok', parentToolUseId: 'p' }, { type: 'tool_call', toolUseId: 'h2', name: 'Bash', input: { command: 'ls' }, parentToolUseId: 'zz' }];
  const tools = evs.flatMap((e) => traducir(e, est)).filter(([k]) => k === 'tool').map(([, p]) => p).filter((p) => p.fase === 'inicio');
  const { pasos, sueltos } = plegar(tools);
  assert.equal(pasos.length, 1); assert.equal(pasos[0].hijos.length, 1); assert.equal(sueltos.length, 1);
  assert.deepEqual(traducir({ type: 'turn_start', via: 'litellm', model: 'm', planner: 'Opus', executor: 'Haiku' }, est)[1], ['plan', { planner: 'Opus', executor: 'Haiku' }]);
  const msgs = [{ r: 'u', t: 'hola' }, { r: 'a', t: 'qué tal', motor: 'puente' }, { r: 'u', t: 'por el chat de siempre' }, { r: 'a', t: 'respuesta del gateway' }];
  assert.equal(contextoPuente(msgs), 'PERSONA: por el chat de siempre\n\nCHAT: respuesta del gateway', 'solo lo que la sesión del puente no tiene');
  assert.match(contextoPuente(msgs, { nueva: true }), /^PERSONA: hola/, 'sesión nueva: todo lo hablado');
});

await t('aprobar gasto: costo estimado, solo «allow» con el monto o «deny»', () => {
  const e = { type: 'permission_request', requestId: 'r', tool: 'generar_imagen', input: { prompt: 'x', aprobado_usd: 0.04 } };
  const [[k, p]] = traducir(e, { texto: '' });
  assert.equal(k, 'permiso'); assert.equal(p.costo, 0.04);
  assert.equal(costoDe({ costo_usd: '0.12' }), 0.12); assert.equal(costoDe({ entrada: { prompt: 'x' } }), null);
  assert.equal(traducir({ type: 'permission_request', requestId: 'r', tool: 'Bash', input: { command: 'ls' } }, { texto: '' })[0][1].costo, undefined, 'sin costo: la tarjeta de siempre');
  assert.equal(dinero(0.04), '$0.04'); assert.equal(dinero(0.001), 'menos de $0.01');
  assert.deepEqual(respuestaCosto('allow', 0.04), { decision: 'allow', aprobado_usd: 0.04 });
  assert.deepEqual(respuestaCosto('allow_all', 0.04), { decision: 'deny' }, 'lo que cuesta nunca se aprueba para siempre');
});

await t('la pantalla: un solo motor, chips, caída al chat de siempre y la ruta que guarda los turnos del puente', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../public/js/screens/llm.js', import.meta.url), 'utf8');
  assert.match(src, /turnoCode\(S\.sesion, \{/, 'la conversación usa su propia sesión del puente (no otra por modo)');
  assert.match(src, /msg\.caida = `El motor con capacidades no respondió/, 'cae al chat de siempre con aviso claro');
  assert.match(src, /if \(e\.name === 'AbortError' \|\| msg\.t \|\| !gatewayOn\(\)\) throw e;/, 'solo cae si nada llegó y el chat está en línea');
  assert.match(src, /data-a="cap"/); assert.match(src, /popover\(b, cuerpo/, 'el motivo va en un popover de ui.js');
  assert.match(src, /accion: \{ texto: 'Apagar'/, 'lo prendido por intención se apaga al instante desde el aviso');
  assert.match(src, /chat\/sesiones\/\$\{enc\(S\.sesion\)\}\/motor/);
  const api = fs.readFileSync(new URL('../api/_lib/chat.js', import.meta.url), 'utf8');
  assert.match(api, /on\('POST', 'chat\/sesiones\/:id\/motor'/);
});

console.log(`\n${ok} pruebas de capacidades OK`);
