// Constructor de agentes con banco de pruebas + Router de costo: especificación, rúbrica, banco con precios inyectados, activación, router, presupuesto y rutas.
// Sin red, con PGlite temporal. Nada de lo de aquí gasta: el «modelo» es un ejecutor falso.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-agentes-banco-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
process.env.SESSION_SECRET ||= 'vision-test-only-secret-01234567890123456789';
const P = await import('../public/js/sistemas/agente-spec.js'), AB = await import('../api/_lib/agentes-banco.js');
const db = await import('../api/_lib/db.js'), session = await import('../api/_lib/session.js'), WR = await import('../api/_lib/workflow-rutas.js');
let count = 0;
const test = async (n, fn) => { await fn(); console.log('✓', n); count++; };
const T0 = Date.UTC(2026, 10, 22, 12), dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const SPEC = {
  id: 'revenue-leads', nombre: 'Revenue · calificar leads',
  resultado: { que: 'Califica cada lead nuevo y propone el siguiente paso', medida: 'El 90 % de los leads salen con puntaje y siguiente paso' },
  fuentes: ['hilo', 'ficha-oferta'], acciones: ['crearTarea', 'copiar'], modelo: 'nivel-medio', harness: 'herramientas',
  contexto: { biblioteca: ['sop-leads'], hilo: true, rol: 'revenue', cliente: 'acme' }, presupuesto: { por_corrida: 0.5, por_mes: 20 },
};
const con = (cambio) => ({ ...structuredClone(SPEC), ...cambio });
const casos = (n = 5, extra = {}) => Array.from({ length: n }, (_, i) => ({ id: `c${i + 1}`, entrada: `Lead número ${i + 1}`, debeIncluir: ['puntaje'], noDebeIncluir: ['garantizado'], ...extra }));
const PRECIOS = { 'nivel-medio': { in: 1, out: 3 }, 'nivel-bajo': { in: 0, out: 0 } };
const BUENA = { texto: 'Puntaje 80. Siguiente paso: llamar al lead.', tokens_in: 1000, tokens_out: 500 };

// ===================== PURO =====================
await test('spec: una especificación completa pasa y sale normalizada, con las acciones externas marcadas', () => {
  const v = P.validarSpec(con({ acciones: ['CREARTAREA', { nombre: 'zernio-publicar' }] }));
  assert.equal(v.ok, true, v.errores.join()); assert.equal(v.externo, true);
  assert.deepEqual(v.spec.acciones, [{ nombre: 'crearTarea', externa: false, aprobacion: 'ninguna' }, { nombre: 'zernio-publicar', externa: true, aprobacion: 'humana' }]);
  assert.equal(P.validarSpec(SPEC).externo, false);
});
await test('spec: rechaza acciones fuera del catálogo, fuentes, modelo y harness que no existen', () => {
  const v = (c) => P.validarSpec(con(c)).errores.join(' | ');
  assert.match(v({ acciones: ['borrarTodo'] }), /no está en el catálogo cerrado/);
  assert.match(v({ acciones: ['crearTarea', 'crearTarea'] }), /repetida/);
  assert.match(v({ fuentes: ['finanzas'] }), /lista cerrada/);
  assert.match(v({ fuentes: [] }), /fuentes/);
  assert.match(v({ modelo: 'gpt-secreto' }), /nivel/);
  assert.match(v({ harness: 'libre' }), /harness/);
  assert.equal(P.validarSpec(con({ modelo: 'alto' })).ok, true, 'un nivel vale');
  assert.equal(P.validarSpec(con({ modelo: 'kimi-k2' }), { modelos: ['kimi-k2'] }).ok, true, 'el puente puede publicar otros ids');
  for (const a of P.ACCIONES_EXTERNAS) assert.equal(P.validarSpec(con({ acciones: [a] })).externo, true);
});
await test('spec: rechaza secretos en texto, prototipos, campos ajenos y tamaños absurdos', () => {
  const v = (c) => P.validarSpec(con(c));
  assert.match(v({ nombre: 'Agente con token: abc123 dentro' }).errores.join(), /secreto/);
  assert.match(v({ resultado: { que: 'Usa la llave sk-abcdefghijklmnopqrstuvwx para publicar', medida: 'que salga' } }).errores.join(), /secreto/);
  const malo = P.validarSpec(JSON.parse(`{"id":"x-y","__proto__":{"admin":true}}`)); assert.equal(malo.ok, false); assert.match(malo.errores.join(), /__proto__/);
  assert.match(v({ contexto: JSON.parse('{"hilo":true,"rol":"revenue","constructor":{"x":1}}') }).errores.join(), /constructor/);
  assert.equal({}.admin, undefined, 'no se contaminó Object.prototype');
  assert.match(v({ campoExtra: 1 }).errores.join(), /no existe en un agente/);
  assert.match(v({ nombre: 'x'.repeat(5000) }).errores.join(), /demasiado largo/);
  assert.match(v({ presupuesto: { por_corrida: 5000, por_mes: 10 } }).errores.join(), /0 y 1000/);
  assert.match(v({ presupuesto: { por_corrida: 5, por_mes: 2 } }).errores.join(), /no puede pasar/);
  assert.match(v({ presupuesto: { por_corrida: 0, por_mes: 2 } }).errores.join(), /0 y 1000/);
  assert.equal(P.validarSpec(null).ok, false); assert.equal(P.validarSpec('x').ok, false);
});
await test('spec: lo externo exige aprobación humana siempre y no se le puede quitar; coincide con los adaptadores externos del motor', () => {
  assert.match(P.validarSpec(con({ acciones: [{ nombre: 'meta-pauta', externa: false }] })).errores.join(), /no se le puede quitar la aprobación humana/);
  const externosDelMotor = Object.entries(WR.ADAPTADORES).filter(([, a]) => a.externo).map(([k]) => k).sort();
  assert.deepEqual([...P.ACCIONES_EXTERNAS].sort(), externosDelMotor, 'la lista de externas es la del motor de workflows');
  assert.equal(P.puedeActivar({ n: 5, calidad: 1, fallas_criticas: 0, costo_por_caso: 0.1, externo: true }).modo, 'borrador');
});
await test('rúbrica: debe incluir, no debe incluir (sin acentos ni mayúsculas) y puntos', () => {
  const caso = { debeIncluir: ['Siguiente paso', 'ÚLTIMA'], noDebeIncluir: ['garantizado'] };
  const ok = P.evaluarCaso(caso, 'Siguiente PASO: llamar. Última llamada hoy.'); assert.equal(ok.pasa, true); assert.equal(ok.puntos, 1);
  const mal = P.evaluarCaso(caso, 'Resultado garantizado. Siguiente paso: nada.');
  assert.equal(mal.pasa, false); assert.deepEqual(mal.fallas.map((f) => f.regla).sort(), ['debe_incluir', 'no_debe_incluir']); assert.equal(mal.puntos, 0.3333);
  assert.equal(P.evaluarCaso({}, 'x').fallas[0].regla, 'sin_rubrica');
  assert.equal(mal.fallas.some((f) => f.critica), false); assert.equal(P.evaluarCaso({ ...caso, critico: true }, 'nada').fallas.every((f) => f.critica), true);
});
await test('rúbrica: formato (JSON con esquema, máx. de palabras, idioma) y acciones esperadas', () => {
  const f = (formato, texto, extra = {}) => P.evaluarCaso({ formato, ...extra }, texto);
  const esq = { tipo: 'json', esquema: { puntaje: 'number', pasos: 'array' } };
  assert.equal(f(esq, '{"puntaje": 80, "pasos": ["llamar"]}').pasa, true);
  assert.equal(f(esq, '```json\n{"puntaje": 80, "pasos": []}\n```').pasa, true, 'acepta el bloque de código');
  assert.match(f(esq, 'no soy json').fallas[0].detalle, /JSON válido/);
  assert.match(f(esq, '{"puntaje": "80", "pasos": []}').fallas[0].detalle, /debía ser number y es string/);
  assert.match(f(esq, '{"puntaje": 1}').fallas[0].detalle, /falta el campo «pasos»/);
  assert.equal(f({ maxPalabras: 5 }, 'uno dos tres cuatro cinco').pasa, true); assert.equal(f({ maxPalabras: 5 }, 'uno dos tres cuatro cinco seis').pasa, false);
  assert.equal(f({ idioma: 'es' }, 'Este es el resumen de la propuesta para el cliente').pasa, true);
  assert.equal(f({ idioma: 'es' }, 'This is the summary of the proposal for the client').pasa, false);
  const acc = { accionesEsperadas: ['crearTarea'] };
  assert.equal(P.evaluarCaso(acc, { texto: 'ok', acciones: [{ nombre: 'creartarea' }] }).pasa, true);
  assert.equal(P.evaluarCaso(acc, { texto: 'ok', acciones: [] }).pasa, false);
  const fuera = P.evaluarCaso({ debeIncluir: ['ok'] }, { texto: 'ok', acciones: ['meta-pauta'] }, { permitidas: ['crearTarea'] });
  assert.equal(fuera.pasa, false); assert.equal(fuera.fallas[0].regla, 'accion_no_permitida'); assert.equal(fuera.fallas[0].critica, true);
  assert.equal(P.evaluarCaso({ debeIncluir: ['hola'] }, 'hola. token: abc12345').fallas[0].regla, 'secreto_en_salida');
});
await test('banco: calidad y costo con precios INYECTADOS; el juez opcional se suma; el costo sale por caso y total', async () => {
  const spec = P.validarSpec(SPEC).spec, vistos = [];
  const ejecutar = async (s, caso) => { vistos.push(caso.id); return caso.id === 'c4' ? { texto: 'Sin nada útil', tokens_in: 1000, tokens_out: 500, modelo: 'nivel-medio', ms: 400 } : { ...BUENA, modelo: 'nivel-medio', ms: 100 * Number(caso.id.slice(1)) }; };
  const r = await P.correrBanco(spec, casos(5), { ejecutar, precios: PRECIOS });
  assert.equal(r.n, 5); assert.equal(r.calidad, 0.8); assert.equal(r.fallas.length, 1); assert.equal(r.fallas[0].caso, 'c4'); assert.equal(r.fallas_criticas, 0);
  assert.equal(r.costo_total, 0.0125); assert.equal(r.costo_por_caso, 0.0025); assert.equal(r.costo_etiqueta, 'US$ 0.0025'); assert.equal(r.p95_ms, 500);
  assert.equal(r.porCaso.length, 5); assert.deepEqual(vistos, ['c1', 'c2', 'c3', 'c4', 'c5']);
  const conJuez = await P.correrBanco(spec, casos(2), { ejecutar: async () => ({ ...BUENA, modelo: 'nivel-medio', ms: 1 }), precios: PRECIOS, juez: async () => ({ pasa: false, motivo: 'tono frío' }) });
  assert.equal(conJuez.calidad, 0); assert.match(conJuez.fallas[0].detalle, /tono frío/);
  const juezRoto = await P.correrBanco(spec, casos(1), { ejecutar: async () => ({ ...BUENA, ms: 1 }), precios: PRECIOS, juez: async () => { throw new Error('caído'); } });
  assert.equal(juezRoto.calidad, 0, 'si el juez no puede revisar, no se da por bueno');
  await assert.rejects(P.correrBanco(spec, casos(1), {}), (e) => e.code === 'SIN_EJECUTOR');
});
await test('banco: sin precio el costo es null y «sin dato», nunca 0; un precio 0 aprobado sí es 0', async () => {
  const spec = P.validarSpec(SPEC).spec, ejecutar = async () => ({ ...BUENA, modelo: 'nivel-medio', ms: 10 });
  const sin = await P.correrBanco(spec, casos(3), { ejecutar, precios: {} });
  assert.equal(sin.costo_total, null); assert.equal(sin.costo_por_caso, null); assert.equal(sin.costo_etiqueta, 'sin dato'); assert.equal(sin.casos_sin_precio, 3); assert.equal(sin.porCaso[0].costo, null);
  const gratis = await P.correrBanco(spec, casos(3), { ejecutar, precios: { 'nivel-medio': { in: 0, out: 0 } } }); assert.equal(gratis.costo_total, 0);
  assert.equal(P.costoDe({ tokens_in: 10, tokens_out: 10, modelo: 'nivel-medio' }, { 'nivel-medio': { in: 1 } }), null, 'precio incompleto = sin dato');
  assert.equal(P.costoDe({ modelo: 'nivel-medio' }, PRECIOS), null, 'sin tokens = sin dato');
  assert.equal(P.costoDe({ tokens_in: 1, tokens_out: 1, modelo: 'constructor' }, PRECIOS), null, 'una clave del prototipo no es un modelo');
  const parcial = await P.correrBanco(spec, casos(2), { ejecutar: async (s, c) => ({ ...BUENA, modelo: c.id === 'c1' ? 'nivel-medio' : 'otro', ms: 1 }), precios: PRECIOS });
  assert.equal(parcial.costo_total, null, 'si a un caso le falta precio, no se da un total a medias'); assert.equal(parcial.casos_sin_precio, 1);
  const caro = await P.correrBanco({ ...spec, presupuesto: { por_corrida: 0.001, por_mes: 5 } }, casos(1), { ejecutar, precios: PRECIOS });
  assert.equal(caro.fallas[0].regla, 'presupuesto_corrida'); assert.equal(caro.fallas_criticas, 1);
  const roto = await P.correrBanco(spec, casos(2), { ejecutar: async () => { throw new Error('se cayó con Bearer abcdefghijklmnop1234'); }, precios: PRECIOS });
  assert.equal(roto.calidad, 0); assert.equal(roto.n_corridos, 0); assert.equal(roto.costo_total, null); assert.doesNotMatch(JSON.stringify(roto), /abcdefghijklmnop1234/);
});
await test('activar: NO se activa sin banco, con pocos casos, calidad baja, fallas críticas o sin costo visible', () => {
  const bueno = { n: 5, calidad: 0.9, fallas_criticas: 0, costo_por_caso: 0.01, externo: false };
  assert.equal(P.puedeActivar(null).ok, false); assert.match(P.puedeActivar(null).razones[0], /No tiene banco/);
  assert.equal(P.puedeActivar({ ...bueno, n: 0 }).ok, false);
  assert.match(P.puedeActivar({ ...bueno, n: 3 }).razones.join(), /Pocos casos/);
  assert.match(P.puedeActivar({ ...bueno, calidad: 0.6 }).razones.join(), /Calidad 60 %/);
  assert.match(P.puedeActivar({ ...bueno, fallas_criticas: 1 }).razones.join(), /fallas críticas/);
  assert.match(P.puedeActivar({ ...bueno, costo_por_caso: null }).razones.join(), /sin dato/);
  assert.equal(P.puedeActivar({ ...bueno, costo_por_caso: null }, { exigirCosto: false }).ok, true, 'la política del CEO puede relajarlo');
  assert.deepEqual(P.puedeActivar(bueno), { ok: true, modo: 'activo', razones: [] });
  assert.equal(P.puedeActivar(bueno, { minCasos: 10 }).ok, false); assert.equal(P.puedeActivar({ ...bueno, calidad: 0.5 }, { calidadMin: 0.5 }).ok, true);
});
await test('activar: lo que toca algo externo activa en BORRADOR hasta que el CEO/COO lo pase a activo', () => {
  const ext = { n: 5, calidad: 1, fallas_criticas: 0, costo_por_caso: 0.01, externo: true };
  const b = P.puedeActivar(ext); assert.equal(b.ok, true); assert.equal(b.modo, 'borrador'); assert.match(b.razones[0], /aprobación humana/);
  assert.equal(P.puedeActivar(ext, { pasarAActivo: true }).modo, 'activo');
  assert.equal(P.puedeActivar({ ...ext, calidad: 0.1 }, { pasarAActivo: true }).ok, false, 'ni el CEO se salta el banco');
});
await test('router de costo: el modelo MÁS BARATO que cumple la calidad mínima, y explica por qué', () => {
  const h = [
    { modelo: 'nivel-alto', calidad: 0.98, costo_por_caso: 0.03, n: 5 },
    { modelo: 'nivel-medio', calidad: 0.9, costo_por_caso: 0.0025, n: 5 },
    { modelo: 'nivel-bajo', calidad: 0.6, costo_por_caso: 0, n: 5 },
  ];
  const r = P.elegirModelo(h, { calidadMin: 0.8 });
  assert.equal(r.modelo, 'nivel-medio'); assert.equal(r.base, 'historial'); assert.match(r.motivo, /más barato/); assert.match(r.motivo, /90 %/); assert.equal(r.comparados.length, 3);
  assert.equal(P.elegirModelo(h, { calidadMin: 0.95 }).modelo, 'nivel-alto'); assert.equal(P.elegirModelo(h, { calidadMin: 0.5 }).modelo, 'nivel-bajo');
  assert.equal(P.elegirModelo(h.map((x) => ({ ...x, costo_por_caso: null })), { calidadMin: 0.8 }).modelo, 'nivel-medio', 'sin precios compara por el costo relativo de la tabla');
  assert.match(P.elegirModelo(h.map((x) => ({ ...x, costo_por_caso: null })), { calidadMin: 0.8 }).motivo, /costo relativo/);
  assert.equal(P.elegirModelo([...h, { modelo: 'nivel-medio', calidad: 0.5, costo_por_caso: 0.0025, n: 5 }], { calidadMin: 0.8 }).comparados.find((c) => c.modelo === 'nivel-medio').calidad, 0.7, 'junta los bancos de un mismo modelo');
  const pocos = P.elegirModelo([{ modelo: 'nivel-bajo', calidad: 1, costo_por_caso: 0, n: 1 }], { calidadMin: 0.8 });
  assert.equal(pocos.modelo, null); assert.equal(pocos.base, 'insuficiente'); assert.match(pocos.motivo, /al menos 3 casos/);
  assert.equal(P.elegirModelo(h, { calidadMin: 1 }).modelo, null, 'si nadie llega, no inventa uno');
});
await test('router de costo: sin historial usa el nivel MEDIO y lo dice', () => {
  for (const h of [[], null, undefined, [{ modelo: '', calidad: 1, n: 3 }]]) { const r = P.elegirModelo(h); assert.equal(r.modelo, 'nivel-medio'); assert.equal(r.nivel, 'medio'); assert.equal(r.base, 'sin-historial'); assert.match(r.motivo, /nivel medio/); }
});
await test('presupuesto: aviso al 80 %, corte al 100 %, null sin tope aprobado, el mes nuevo empieza en cero', () => {
  const est = (gastado, extra = {}) => ({ persona: { tope: 10, gastado, mes: '2026-11' }, ...extra });
  const ok = P.tomarPresupuesto(est(2), 3, T0); assert.equal(ok.ok, true); assert.equal(ok.estado, 'ok'); assert.equal(ok.siguiente.persona.gastado, 5); assert.equal(ok.alcances.persona.restante, 8);
  const aviso = P.tomarPresupuesto(est(5), 3, T0); assert.equal(aviso.estado, 'aviso'); assert.equal(aviso.ok, true); assert.match(aviso.mensajes[0], /80 %/); assert.equal(aviso.siguiente.persona.gastado, 8);
  const justo = P.tomarPresupuesto(est(5), 5, T0); assert.equal(justo.ok, true); assert.match(justo.mensajes[0], /100 %/);
  const corte = P.tomarPresupuesto(est(9), 2, T0); assert.equal(corte.ok, false); assert.equal(corte.estado, 'corte'); assert.equal(corte.siguiente.persona.gastado, 9, 'al cortar no se toma nada');
  assert.equal(P.tomarPresupuesto({ persona: { tope: null, gastado: 0, mes: '2026-11' } }, 1, T0), null); assert.equal(P.tomarPresupuesto({}, 1, T0), null); assert.equal(P.tomarPresupuesto(null, 1, T0), null);
  assert.equal(P.tomarPresupuesto({ persona: { gastado: 999 } }, 1, T0), null, 'sin tope no se inventa uno');
  const dos = P.tomarPresupuesto({ persona: { tope: 10, gastado: 0, mes: '2026-11' }, cliente: { tope: null, gastado: 0, mes: '2026-11' } }, 1, T0); assert.equal(dos.alcances.cliente, null); assert.equal(dos.ok, true);
  const corteCliente = P.tomarPresupuesto({ persona: { tope: 10, gastado: 0, mes: '2026-11' }, cliente: { tope: 1, gastado: 0.9, mes: '2026-11' } }, 0.5, T0); assert.equal(corteCliente.ok, false); assert.match(corteCliente.mensajes[0], /cliente/);
  const nuevoMes = P.tomarPresupuesto({ persona: { tope: 10, gastado: 9.9, mes: '2026-10' } }, 1, T0); assert.equal(nuevoMes.ok, true); assert.equal(nuevoMes.siguiente.persona.gastado, 1);
  assert.equal(P.tomarPresupuesto(est(0), null, T0).estado, 'monto_invalido'); assert.equal(P.tomarPresupuesto(est(0), -1, T0).ok, false); assert.equal(P.tomarPresupuesto(est(0), NaN, T0).ok, false);
  assert.equal(P.tomarPresupuesto(est(5, { aviso: 0.5 }), 0.1, T0).estado, 'aviso', 'el aviso es configurable');
  assert.equal(P.estadoDeTope(8, 10), 'aviso'); assert.equal(P.estadoDeTope(10, 10), 'corte'); assert.equal(P.estadoDeTope(1, null), 'sin_tope');
});

// ===================== SERVIDOR =====================
// Un despachador como el de api/index.js, pero solo con las rutas de este módulo (el index lo cablea quien integra).
function montar(opts) {
  const routes = []; AB.rutas((method, pattern, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn }), { ahora: () => T0, ...opts });
  return async (email, route, method = 'GET', b = {}) => {
    const headers = { host: 'localhost', 'x-ceoos': '1' }, jar = new Map();
    const res = { statusCode: 200, getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; } };
    const url = new URL(`http://x/${route}`), req = { url: `/api/${route}`, method, headers, body: b, query: Object.fromEntries(url.searchParams) };
    session.issue(req, res, { email }); headers.cookie = jar.get('Set-Cookie').split(';')[0];
    const path = url.pathname.slice(1);
    for (const r of routes) { const m = r.method === method && r.re.exec(path); if (m) { req.params = m.groups || {}; await r.fn(req, res); return { status: res.statusCode, data: res.data }; } }
    return { status: 404, data: { error: 'Ruta desconocida' } };
  };
}
const E = { ceo: 'ceo@inherentglobal.com', coo: 'coo@inherentglobal.com', team: 'team@inherentglobal.com', ai: 'ai@inherentglobal.com', cliente: 'cliente@acme.com' };
await db.create('team', { role: 'ceo', roles: ['ceo'] }, 'fixture', E.ceo); await db.create('team', { role: 'coo', roles: ['coo'] }, 'fixture', E.coo);
await db.create('team', { role: 'team', roles: [] }, 'fixture', E.team); await db.create('team', { role: 'team', roles: ['ai-engineer'] }, 'fixture', E.ai);
await db.create('team', { role: 'client', client_slug: 'acme', external: true }, 'fixture', E.cliente);

const sinModelo = montar({});
let respuestas = 0;
const ejecutor = async (spec, caso) => {
  respuestas++; if (String(caso.entrada).includes('LENTO')) await dormir(80);
  const bien = spec.id !== 'agente-malo';
  return { texto: bien ? BUENA.texto : 'No sé', tokens_in: 1000, tokens_out: 500, modelo: spec.modelo, ms: 120 };
};
const api = montar({ ejecutor });

await test('permisos: el equipo común no construye (403), el CEO, el COO y el perfil AI engineer sí, y el cliente del portal ve 404', async () => {
  const b = { spec: SPEC };
  assert.equal((await api(E.team, 'sistemas/agentes', 'POST', b)).status, 403);
  assert.equal((await api(E.team, 'sistemas/agentes/revenue-leads/banco', 'POST', { casos: casos() })).status, 403);
  assert.equal((await api(E.team, 'sistemas/agentes/revenue-leads/activar', 'POST', {})).status, 403);
  for (const [m, r] of [['GET', 'sistemas/agentes'], ['POST', 'sistemas/agentes'], ['GET', 'sistemas/costo'], ['POST', 'sistemas/costo'], ['GET', 'sistemas/agentes/revenue-leads'], ['POST', 'sistemas/agentes/revenue-leads/banco']]) assert.equal((await api(E.cliente, r, m, { spec: SPEC })).status, 404, `${m} ${r} para el cliente`);
  assert.equal((await api(E.team, 'sistemas/agentes')).status, 200, 'el equipo puede ver la lista');
  assert.equal((await api('nadie@gmail.com', 'sistemas/agentes')).status, 401, 'sin cuenta, nada');
  assert.equal((await api(E.coo, 'sistemas/agentes', 'POST', { spec: con({ id: 'del-coo' }) })).status, 200);
  assert.equal((await api(E.team, 'sistemas/agentes', 'POST', { spec: con({ id: 'x' }) })).status, 403);
  const malo = await api(E.ai, 'sistemas/agentes', 'POST', { spec: con({ acciones: ['borrarTodo'] }) }); assert.equal(malo.status, 400); assert.match(malo.data.errores.join(), /catálogo/);
  assert.equal((await api(E.team, 'sistemas/costo', 'POST', { aviso: 0.5 })).status, 403, 'precios y topes solo del CEO'); assert.equal((await api(E.coo, 'sistemas/costo', 'POST', { aviso: 0.5 })).status, 403);
});
await test('versiones: editar crea la versión siguiente; la anterior no cambia; la misma especificación no duplica', async () => {
  const v1 = await api(E.ai, 'sistemas/agentes', 'POST', { spec: SPEC }); assert.equal(v1.status, 200); assert.equal(v1.data.version, 1); assert.equal(v1.data.repetida, false);
  const otra = await api(E.ai, 'sistemas/agentes', 'POST', { spec: SPEC }); assert.equal(otra.data.version, 1); assert.equal(otra.data.repetida, true);
  const antes = await db.get(AB.COLL_SPEC, 'revenue-leads--v1');
  const v2 = await api(E.coo, 'sistemas/agentes', 'POST', { spec: con({ presupuesto: { por_corrida: 0.4, por_mes: 20 } }) }); assert.equal(v2.data.version, 2); assert.notEqual(v2.data.hash, v1.data.hash);
  const despues = await db.get(AB.COLL_SPEC, 'revenue-leads--v1'); assert.equal(despues.v, antes.v, 'la versión 1 no se tocó'); assert.deepEqual(despues.spec, antes.spec); assert.equal(despues.spec.presupuesto.por_corrida, 0.5);
  const lista = (await api(E.ai, 'sistemas/agentes')).data.agentes.find((a) => a.id === 'revenue-leads'); assert.equal(lista.version, 2); assert.equal(lista.estado, 'sin_activar');
  assert.equal((await api(E.ai, 'sistemas/agentes/revenue-leads?version=1')).data.spec.presupuesto.por_corrida, 0.5); assert.deepEqual((await api(E.ai, 'sistemas/agentes/revenue-leads')).data.versiones, [1, 2]);
  const ids = await Promise.all([1, 2, 3].map((i) => api(E.ceo, 'sistemas/agentes', 'POST', { spec: con({ id: 'carrera', nombre: `Carrera ${i} de versiones` }) }))); // tres a la vez: tres versiones distintas
  assert.deepEqual(ids.map((r) => r.data.version).sort(), [1, 2, 3]);
  assert.equal((await api(E.ai, 'sistemas/agentes/no-existe')).status, 404);
});
await test('las colecciones del constructor no se leen ni se escriben por /api/db (igual que wf_runs)', async () => {
  const handler = (await import('../api/index.js')).default;
  const viaDb = async (route, method, b) => {
    const headers = { host: 'localhost', 'x-ceoos': '1' }, jar = new Map(), res = { statusCode: 200, getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; }, writeHead(n) { this.statusCode = n; return this; }, write() {}, end() {} };
    const req = { url: `/api/${route}`, method, headers, body: b, query: {} }; session.issue(req, res, { email: E.ceo }); headers.cookie = jar.get('Set-Cookie').split(';')[0]; await handler(req, res); return res.statusCode;
  };
  for (const c of ['wf_runs', 'agent_specs', 'agent_benchmarks', 'ai_budgets']) for (const m of ['GET', 'POST']) assert.equal(await viaDb(`db/${c}`, m, { x: 1 }), 404, `${m} ${c}`);
  assert.equal(await viaDb('db/agent_specs/revenue-leads--v1', 'GET'), 404);
});
await test('banco: sin ejecutor conectado dice «disconnected» y no inventa nada', async () => {
  const r = await sinModelo(E.ai, 'sistemas/agentes/revenue-leads/banco', 'POST', { casos: casos() });
  assert.equal(r.status, 503); assert.equal(r.data.code, 'disconnected'); assert.match(r.data.error, /disconnected/);
  assert.equal((await db.list(AB.COLL_BANCO)).filter((b) => b.tipo === 'banco').length, 0, 'no se guardó ningún banco');
  const mal = await api(E.ai, 'sistemas/agentes/revenue-leads/banco', 'POST', { casos: [{ id: 'a', entrada: 'x' }] }); assert.equal(mal.status, 400); assert.match(mal.data.errores.join(), /sin rúbrica/);
  assert.equal((await api(E.ai, 'sistemas/agentes/revenue-leads/banco', 'POST', { casos: [] })).status, 400);
  assert.equal((await api(E.ai, 'sistemas/agentes/revenue-leads/banco', 'POST', { casos: casos(), modelo: 'inventado' })).status, 400);
});
await test('banco sin precios aprobados: costo «sin dato» y NO se activa; con el precio del CEO, sí, y el panel de costo lo registra', async () => {
  const sin = await api(E.ai, 'sistemas/agentes/revenue-leads/banco', 'POST', { casos: casos(5), version: 2 });
  assert.equal(sin.status, 200); assert.equal(sin.data.reporte.calidad, 1); assert.equal(sin.data.reporte.costo_por_caso, null); assert.equal(sin.data.reporte.costo_etiqueta, 'sin dato'); assert.match(sin.data.presupuesto.sin_tope, /No hay topes aprobados/);
  const no = await api(E.ai, 'sistemas/agentes/revenue-leads/activar', 'POST', {}); assert.equal(no.status, 409); assert.match(no.data.razones.join(), /sin dato/);
  assert.equal((await api(E.ceo, 'sistemas/costo', 'POST', { precios: PRECIOS })).status, 200);
  assert.equal((await api(E.ceo, 'sistemas/costo', 'POST', { precios: { 'nivel-medio': { in: -1, out: 1 } } })).status, 400);
  const con$ = await api(E.ai, 'sistemas/agentes/revenue-leads/banco', 'POST', { casos: casos(5) });
  assert.equal(con$.data.reporte.costo_total, 0.0125); assert.equal(con$.data.reporte.costo_etiqueta, 'US$ 0.0025'); assert.equal(con$.data.presupuesto.cortado, false);
  const ok = await api(E.ai, 'sistemas/agentes/revenue-leads/activar', 'POST', {}); assert.equal(ok.status, 200, JSON.stringify(ok.data)); assert.equal(ok.data.modo, 'activo'); assert.equal(ok.data.costo_etiqueta, 'US$ 0.0025');
  assert.equal((await api(E.ai, 'sistemas/agentes')).data.agentes.find((a) => a.id === 'revenue-leads').estado, 'activo');
  const costo = (await api(E.ceo, 'sistemas/costo')).data;
  assert.equal(costo.mes, '2026-11'); assert.equal(costo.sin_precio, 5, 'las 5 corridas sin precio quedaron «sin dato», no en cero');
  const tarea = costo.por_tarea.find((t) => t.clave === 'banco:revenue-leads--v2'); assert.equal(tarea.gastado, 0.0125); assert.equal(tarea.sin_dato, 5);
});
await test('activar: calidad baja → 409; pocos casos → 409; una versión nueva sin banco → 409 aunque la anterior esté activa', async () => {
  await api(E.ai, 'sistemas/agentes', 'POST', { spec: con({ id: 'agente-malo', nombre: 'Agente malo' }) });
  const b = await api(E.ai, 'sistemas/agentes/agente-malo/banco', 'POST', { casos: casos(5) }); assert.equal(b.data.reporte.calidad, 0);
  const r = await api(E.ai, 'sistemas/agentes/agente-malo/activar', 'POST', {}); assert.equal(r.status, 409); assert.match(r.data.razones.join(), /Calidad 0 %/);
  await api(E.ai, 'sistemas/agentes', 'POST', { spec: con({ id: 'pocos', nombre: 'Pocos casos' }) });
  await api(E.ai, 'sistemas/agentes/pocos/banco', 'POST', { casos: casos(2) });
  assert.match((await api(E.ai, 'sistemas/agentes/pocos/activar', 'POST', {})).data.razones.join(), /Pocos casos/);
  const v3 = await api(E.ai, 'sistemas/agentes', 'POST', { spec: con({ nombre: 'Revenue · calificar leads v3' }) }); assert.equal(v3.data.version, 3);
  const sinBanco = await api(E.ai, 'sistemas/agentes/revenue-leads/activar', 'POST', {}); assert.equal(sinBanco.status, 409); assert.match(sinBanco.data.razones.join(), /No tiene banco/);
  assert.equal((await api(E.ai, 'sistemas/agentes/pocos/activar', 'POST', { banco_id: 'inexistente' })).status, 409);
  assert.equal((await api(E.ai, 'sistemas/agentes/revenue-leads')).data.estado, 'sin_activar', 'la v3 no hereda la activación de la v2');
});
await test('activar: lo externo queda en BORRADOR; el perfil AI engineer no lo pasa a activo (403); el COO sí; sigue pidiendo aprobación', async () => {
  const ext = con({ id: 'publicador', nombre: 'Publicador del ciclo', acciones: ['crearTarea', 'zernio-publicar'] });
  assert.equal((await api(E.ai, 'sistemas/agentes', 'POST', { spec: ext })).status, 200);
  await api(E.ai, 'sistemas/agentes/publicador/banco', 'POST', { casos: casos(5) });
  const b = await api(E.ai, 'sistemas/agentes/publicador/activar', 'POST', {}); assert.equal(b.status, 200); assert.equal(b.data.modo, 'borrador'); assert.match(b.data.avisos[0], /aprobación humana/);
  const pide = await api(E.ai, 'sistemas/agentes/publicador/activar', 'POST', { modo: 'activo' }); assert.equal(pide.status, 403);
  assert.equal((await api(E.ai, 'sistemas/agentes')).data.agentes.find((a) => a.id === 'publicador').estado, 'borrador');
  const a = await api(E.coo, 'sistemas/agentes/publicador/activar', 'POST', { modo: 'activo' }); assert.equal(a.status, 200); assert.equal(a.data.modo, 'activo');
  assert.equal((await api(E.ai, 'sistemas/agentes/publicador')).data.estado, 'activo');
  const detalle = (await api(E.ai, 'sistemas/agentes/publicador')).data; assert.equal(detalle.spec.acciones.find((x) => x.nombre === 'zernio-publicar').aprobacion, 'humana');
  await api(E.ai, 'sistemas/agentes', 'POST', { spec: con({ id: 'publicador', nombre: 'Publicador del ciclo', acciones: ['crearTarea', 'zernio-publicar'], harness: 'chat' }) });
  const roto = await api(E.coo, 'sistemas/agentes/publicador/activar', 'POST', { modo: 'activo' }); assert.equal(roto.status, 409, 'ni el COO se salta el banco de la versión nueva');
});
await test('router de costo por ruta: prueba otro modelo con la misma especificación y elige el más barato que cumple', async () => {
  const antes = (await api(E.ai, 'sistemas/agentes/pocos/modelo')).data; assert.equal(antes.base, 'insuficiente', 'con 2 casos no alcanza para decidir');
  assert.equal((await api(E.ai, 'sistemas/agentes', 'POST', { spec: con({ id: 'router', nombre: 'Agente del router' }) })).status, 200);
  const nuevo = (await api(E.ai, 'sistemas/agentes/router/modelo')).data; assert.equal(nuevo.base, 'sin-historial'); assert.equal(nuevo.modelo, 'nivel-medio'); assert.match(nuevo.motivo, /nivel medio/);
  await api(E.ai, 'sistemas/agentes/router/banco', 'POST', { casos: casos(5) });
  const bajo = await api(E.ai, 'sistemas/agentes/router/banco', 'POST', { casos: casos(5), modelo: 'nivel-bajo' }); assert.equal(bajo.data.modelo, 'nivel-bajo'); assert.equal(bajo.data.reporte.costo_total, 0);
  const r = (await api(E.ai, 'sistemas/agentes/router/modelo')).data; assert.equal(r.modelo, 'nivel-bajo'); assert.equal(r.base, 'historial'); assert.equal(r.comparados.length, 2); assert.match(r.motivo, /más barato/);
  assert.equal((await api(E.ai, 'sistemas/agentes/router/modelo?calidadMin=1')).data.modelo, 'nivel-bajo');
});
await test('presupuesto atómico: dos peticiones a la vez con lugar para UNA — una pasa y la otra se corta', async () => {
  assert.equal((await api(E.ceo, 'sistemas/costo', 'POST', { topes: { persona: { [E.ai]: 0.5 } }, aviso: 0.8 })).status, 200);
  const dos = await Promise.all([1, 2].map((i) => api(E.ai, 'sistemas/agentes/revenue-leads/banco', 'POST', { version: 2, casos: [{ id: 'uno', entrada: `LENTO ${i}`, debeIncluir: ['puntaje'] }] })));
  const corrieron = dos.map((r) => r.data.reporte.porCaso[0].corrio).sort();
  assert.deepEqual(corrieron, [false, true], 'una corrió y la otra se cortó');
  const cortada = dos.find((r) => !r.data.reporte.porCaso[0].corrio); assert.equal(cortada.data.reporte.porCaso[0].fallas[0].regla, 'presupuesto'); assert.equal(cortada.data.presupuesto.cortado, true); assert.equal(cortada.data.reporte.fallas_criticas, 1);
  const g = await db.get(AB.COLL_PRESUPUESTO, 'g--persona--ai@inherentglobal.com--2026-11'); assert.ok(g.gastado <= 0.5, `lo gastado (${g.gastado}) no pasa del tope`);
  assert.ok(g.gastado < 0.2, 'lo reservado se devolvió al liquidar: queda lo realmente gastado');
  assert.equal((await api(E.ai, 'sistemas/agentes/revenue-leads/activar', 'POST', { banco_id: cortada.data.id })).status, 409, 'un banco cortado no activa nada');
});
await test('presupuesto: aviso al 80 %, corte, y si un alcance corta se devuelve lo tomado en los otros', async () => {
  const cfg = { topes: { persona: { 'x@y.co': 1 }, cliente: {} }, aviso: 0.8 };
  const a = await AB.reservar({ persona: 'x@y.co' }, 0.85, { ahora: T0, config: cfg }); assert.equal(a.ok, true); assert.match(a.avisos[0], /85 %/); assert.deepEqual(a.sinTope, []);
  const b = await AB.reservar({ persona: 'x@y.co' }, 0.2, { ahora: T0, config: cfg }); assert.equal(b.ok, false); assert.equal(b.alcance, 'persona');
  await AB.liberar(a); assert.equal((await db.get(AB.COLL_PRESUPUESTO, 'g--persona--x@y.co--2026-11')).gastado, 0);
  const cfg2 = { topes: { persona: { 'p@y.co': 10 }, cliente: { acme: 0.1 } }, aviso: 0.8 };
  const c = await AB.reservar({ persona: 'p@y.co', cliente: 'acme' }, 0.5, { ahora: T0, config: cfg2 }); assert.equal(c.ok, false); assert.equal(c.alcance, 'cliente');
  assert.equal((await db.get(AB.COLL_PRESUPUESTO, 'g--persona--p@y.co--2026-11')).gastado, 0, 'la persona recuperó lo que se le había tomado');
  const sin = await AB.reservar({ persona: 'sin@tope.co', cliente: 'otro' }, 5, { ahora: T0, config: cfg }); assert.equal(sin.ok, true); assert.deepEqual(sin.sinTope, ['persona', 'cliente'], 'sin tope aprobado no se inventa uno: se dice');
  const dosYa = await Promise.all([1, 2].map(() => AB.reservar({ persona: 'carrera@y.co' }, 0.6, { ahora: T0, config: { topes: { persona: { 'carrera@y.co': 1 } }, aviso: 0.8 } })));
  assert.equal(dosYa.filter((r) => r.ok).length, 1, 'de dos reservas simultáneas, una sola cabe');
  assert.equal((await db.get(AB.COLL_PRESUPUESTO, 'g--persona--carrera@y.co--2026-11')).gastado, 0.6);
});
await test('panel de costo: gasto por tarea, persona, cliente y agente; tope null donde nadie lo aprobó; el equipo ve solo lo suyo', async () => {
  const c = (await api(E.ceo, 'sistemas/costo')).data;
  const ai = c.por_persona.find((p) => p.clave === E.ai); assert.equal(ai.tope, 0.5); assert.ok(ai.gastado > 0); assert.ok(['ok', 'aviso'].includes(ai.estado));
  const acme = c.por_cliente.find((p) => p.clave === 'acme'); assert.equal(acme.tope, null); assert.equal(acme.estado, 'sin_tope'); assert.equal(acme.pct, null);
  assert.ok(c.por_agente.some((a) => a.clave === 'revenue-leads')); assert.ok(c.por_tarea.length >= 3); assert.equal(c.topes_aprobados, true);
  const propio = (await api(E.ai, 'sistemas/costo')).data; assert.ok(propio.por_persona.every((p) => p.clave === E.ai)); assert.ok(propio.por_tarea.length >= 3);
  const ajeno = (await api(E.team, 'sistemas/costo')).data; assert.equal(ajeno.por_persona.length, 0); assert.equal(ajeno.por_tarea.length, 0, 'lo que gastó otra persona no se ve');
  const otroMes = (await api(E.ceo, 'sistemas/costo?mes=2026-10')).data; assert.equal(otroMes.por_tarea.length, 0);
  assert.equal(JSON.stringify(c).includes('"monto":0,'), false);
});
await test('alcance: quien solo ve «sus clientes» no crea ni ve agentes de un cliente que no es suyo', async () => {
  await db.create('settings', { views: {}, scope: { 'ai-engineer': 'asignados' } }, 'fixture', 'role_views');
  (await import('../api/_lib/access.js')).forgetViews();
  const r = await api(E.ai, 'sistemas/agentes', 'POST', { spec: con({ id: 'ajeno', nombre: 'Agente de otro cliente', contexto: { hilo: true, rol: 'revenue', cliente: 'zeta' } }) });
  assert.equal(r.status, 403); assert.equal(r.data.code, 'ALCANCE');
  assert.equal((await api(E.ceo, 'sistemas/agentes', 'POST', { spec: con({ id: 'ajeno', nombre: 'Agente de otro cliente', contexto: { hilo: true, rol: 'revenue', cliente: 'zeta' } }) })).status, 200);
  assert.equal((await api(E.ai, 'sistemas/agentes/ajeno')).status, 404, 'no lo ve');
  assert.ok(!(await api(E.ai, 'sistemas/agentes')).data.agentes.some((a) => a.id === 'ajeno'));
  assert.equal((await api(E.ai, 'sistemas/agentes', 'POST', { spec: con({ id: 'sin-cliente', nombre: 'Plantilla de rol', contexto: { hilo: true, rol: 'revenue' } }) })).status, 200, 'una plantilla de rol, sin cliente, sí');
});
console.log(`${count} pruebas del constructor de agentes y el router de costo OK`);
