// Contexto vivo: parseo de transcripciones, compromisos con cita literal, fechas con huso de Guatemala, señales, memoria del cliente,
// y el servidor (ingesta idempotente, aceptar/descartar, versión, acceso por marca y rol, lo interno). Sin red; PGlite temporal.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-contexto-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
process.env.SESSION_SECRET = 'vision-test-only-secret-01234567890123456789'; process.env.ADMIN_EMAILS = 'ceo@inherentglobal.com';
const X = await import('../public/js/contexto/extractor.js'), C = await import('../api/_lib/contexto-vivo.js'), db = await import('../api/_lib/db.js'), session = await import('../api/_lib/session.js'), api = (await import('../api/index.js')).default;
const { fail: failHttp } = await import('../api/_lib/http.js');
let count = 0;
const test = async (n, fn) => { await fn(); console.log('✓', n); count++; };
const { parsearTranscripcion: parse, extraerCompromisos: comp, extraerSenales: sen, memoriaDelCliente: mem, fechaDe } = X;

// ---------- Textos de prueba (tres formatos) ----------
const T_ZOOM = `[00:00:05] Ana Pérez: Hola Luis, gracias por conectarte.
[00:00:12] Luis Gómez: Con gusto. Te mando la propuesta el viernes.
[00:01:40] Ana Pérez: Perfecto. Quedamos en que la próxima semana te paso el calendario de contenido.
[00:02:10] Luis Gómez: Necesitamos que nos pasen los accesos de Instagram mañana.
[00:03:00] Ana Pérez: Claro. Hoy hace calor, ¿verdad?`;
const T_MEET = `Ana Pérez (00:05): Buenos días.
Luis Gómez (00:20): Voy a revisar el presupuesto con mi socio.
Ana Pérez (01:02): Ana se encarga de armar el brief. Lo tengo el lunes.
Luis Gómez (01:30): Me preocupa que sea muy caro. Queremos vender más en diciembre.`;
const T_GRANOLA = `Ana Pérez
00:05
Hola, todo bien.
Voy a agendar la sesión de fotos.
Luis Gómez
00:40
Nos vemos el 15 de diciembre en la oficina.
Nos encantó el último video, quedó genial.`;
const P = ['Ana Pérez', 'Luis Gómez'];
const SUELTAS = `Te mando el brief mañana
Quedamos en que lo veo el viernes`;

await test('parseo: [hh:mm:ss] Nombre: texto (Zoom/Gong) con segundos y hablante', () => {
  const t = parse(T_ZOOM);
  assert.equal(t.length, 5); assert.deepEqual(t[1], { quien: 'Luis Gómez', t: 12, texto: 'Con gusto. Te mando la propuesta el viernes.' });
  assert.equal(t[2].t, 100);
});
await test('parseo: Nombre (mm:ss): texto (Meet) y encabezado «Nombre / 00:05 / texto» (Fireflies/Granola)', () => {
  const m = parse(T_MEET); assert.equal(m.length, 4); assert.equal(m[1].quien, 'Luis Gómez'); assert.equal(m[1].t, 20);
  const g = parse(T_GRANOLA); assert.equal(g.length, 2); assert.equal(g[0].quien, 'Ana Pérez'); assert.match(g[0].texto, /Hola, todo bien\.\nVoy a agendar/);
});
await test('parseo: líneas sueltas = turnos sin hablante; texto vacío o etiquetas («Importante:») no inventan hablante', () => {
  const s = parse(SUELTAS); assert.equal(s.length, 2); assert.ok(s.every((x) => x.quien === null && x.t === null));
  assert.deepEqual(parse(''), []); assert.deepEqual(parse(null), []);
  const e = parse('Importante: Ana manda el brief el lunes'); assert.equal(e[0].quien, null);
  assert.equal(parse('Quedamos en lo siguiente: te mando el brief').at(0).quien, null);
});

const TODAS = [T_ZOOM, T_MEET, T_GRANOLA, SUELTAS, '[00:01] Sam: I\'ll send the deck by Friday. We need you to share the logo tomorrow.\n[00:02] Mia: Let me check and get back to you next week.'];
await test('REGLA DE ORO: cada compromiso y cada señal trae su cita LITERAL contenida en la transcripción', () => {
  let n = 0;
  for (const txt of TODAS) {
    const turnos = parse(txt), cs = comp(turnos, { participantes: P, fecha: '2026-11-26' });
    for (const c of cs) { assert.ok(c.cita && txt.includes(c.cita), `cita no literal: ${c.cita}`); assert.equal(c.estado, 'hipotesis'); n++; }
    for (const lista of Object.values(sen(turnos, { participantes: P }))) for (const s of lista) { assert.ok(txt.includes(s.cita), `señal no literal: ${s.cita}`); n++; }
  }
  assert.ok(n >= 12, `se esperaban varios ítems, hubo ${n}`);
});
await test('compromisos en español e inglés con tipo, quien y confianza explicable', () => {
  const z = comp(parse(T_ZOOM), { participantes: P, fecha: '2026-11-26' });
  const mando = z.find((c) => /Te mando la propuesta/.test(c.cita)), pasa = z.find((c) => /te paso el calendario/.test(c.cita)), nec = z.find((c) => /Necesitamos que/.test(c.cita));
  assert.equal(mando.quien, 'Luis Gómez'); assert.equal(mando.tipo, 'entrega'); assert.equal(mando.confianza, 'alta'); assert.match(mando.razon, /fecha/);
  assert.equal(pasa.quien, 'Ana Pérez'); assert.equal(nec.quien, null, 'el pedido a la otra parte no tiene responsable claro'); assert.equal(nec.tipo, 'dato');
  assert.ok(z.some((c) => c.tipo === 'decision' || /Quedamos/.test(c.cita)));
  const en = comp(parse(TODAS[4]), { participantes: ['Sam Lee', 'Mia Ruiz'], fecha: '2026-11-26' });
  assert.ok(en.find((c) => /send the deck/.test(c.cita)).para_cuando === '2026-11-27'); assert.equal(en.find((c) => /send the deck/.test(c.cita)).quien, 'Sam Lee');
  assert.ok(en.some((c) => /Let me check/.test(c.cita)));
});
await test('fechas relativas con huso de Guatemala: reunión un jueves (mañana, el viernes, la próxima semana, fin de mes)', () => {
  const j = '2026-11-26'; // jueves
  assert.deepEqual([fechaDe('te mando esto mañana', j).fecha, fechaDe('lo tengo el viernes', j).fecha, fechaDe('te aviso hoy', j).fecha], ['2026-11-27', '2026-11-27', '2026-11-26']);
  const sem = fechaDe('te lo paso la próxima semana', j); assert.equal(sem.fecha, '2026-12-04'); assert.equal(sem.precision, 'semana');
  assert.equal(fechaDe('el jueves lo vemos', j).fecha, '2026-12-03', 'el mismo día de la semana = el de la semana que viene');
  assert.equal(fechaDe('el viernes de la próxima semana', j).fecha, '2026-12-04'); assert.equal(fechaDe('pasado mañana', j).fecha, '2026-11-28');
  assert.equal(fechaDe('a fin de mes', j).fecha, '2026-11-30'); assert.equal(fechaDe('lo entrego en 3 días', j).fecha, '2026-11-29'); assert.equal(fechaDe('el 15 de diciembre', j).fecha, '2026-12-15');
  assert.equal(fechaDe('el 3 de enero', j).fecha, '2027-01-03', 'una fecha sin año ya pasada es del año que viene');
  assert.equal(fechaDe('por la mañana te escribo', j), null, '«la mañana» es la hora del día, no una fecha');
});
await test('fechas en fin de mes y de año, y la hora de Guatemala (UTC-6) cambia el día', () => {
  const f = '2026-12-31'; // jueves
  assert.equal(fechaDe('mañana', f).fecha, '2027-01-01'); assert.equal(fechaDe('el viernes', f).fecha, '2027-01-01'); assert.equal(fechaDe('la próxima semana', f).fecha, '2027-01-08');
  assert.equal(fechaDe('el 5', f).fecha, '2027-01-05');
  // 03:30 UTC del 27 = 21:30 del jueves 26 en Guatemala: «mañana» es el viernes 27, no el sábado.
  assert.equal(fechaDe('mañana', '2026-11-27T03:30:00Z').fecha, '2026-11-27'); assert.equal(fechaDe('hoy', '2026-11-27T03:30:00Z').fecha, '2026-11-26');
  assert.equal(fechaDe('hoy', new Date('2026-11-27T05:59:00Z')).fecha, '2026-11-26'); assert.equal(fechaDe('hoy', new Date('2026-11-27T06:00:00Z')).fecha, '2026-11-27');
  assert.equal(fechaDe('mañana', 'no-es-fecha'), null);
  const c = comp(parse('[00:01] Ana: Te mando el brief mañana.'), { participantes: P, fecha: '2026-12-31T20:00:00-06:00' })[0]; assert.equal(c.para_cuando, '2027-01-01');
});
await test('sin cita = sin compromiso: charla trivial, preguntas, negaciones y frases sin disparador dan 0', () => {
  const trivial = `[00:00:01] Ana: Hola, ¿cómo estás?\n[00:00:04] Luis: Bien, gracias. Hace calor hoy.\n[00:00:09] Ana: Sí, mucho. ¿Te mando el brief?\n[00:00:12] Luis: No te mando nada hoy.\n[00:00:20] Ana: El viernes fue un día largo. Mañana veremos.\n[00:00:30] Luis: Lo tengo claro.\nImportante: reunión corta.`;
  assert.equal(comp(parse(trivial), { participantes: P, fecha: '2026-11-26' }).length, 0);
  assert.equal(comp([], {}).length, 0); assert.equal(comp(parse('voy a ser honesto contigo, no sé'), { fecha: '2026-11-26' }).length, 0);
  assert.equal(comp(parse('Ana: Te mandó el correo ayer.'), { participantes: P, fecha: '2026-11-26' }).length, 0, 'lo que ya hizo otro no es una promesa');
});
await test('quien se resuelve contra los participantes o es null; condicional y sin fecha bajan la confianza', () => {
  assert.equal(X.resolverQuien('luis', P), 'Luis Gómez'); assert.equal(X.resolverQuien('Pedro', P), null); assert.equal(X.resolverQuien('', P), null);
  const a = comp(parse('Pedro: Te mando el brief el viernes.'), { participantes: P, fecha: '2026-11-26' })[0]; assert.equal(a.quien, null);
  const b = comp(parse('Luis: Te mando el brief.'), { participantes: P, fecha: '2026-11-26' })[0]; assert.equal(b.para_cuando, null); assert.equal(b.confianza, 'media');
  const c = comp(parse('Luis: Si quieres, te mando el brief el viernes.'), { participantes: P, fecha: '2026-11-26' })[0]; assert.equal(c.confianza, 'baja'); assert.match(c.razon, /condicional/);
  const d = comp(parse('Ana Pérez (01:02): Luis se encarga de armar el brief el lunes.'), { participantes: P, fecha: '2026-11-26' })[0]; assert.equal(d.quien, 'Luis Gómez');
});
await test('señales: lo que quiere, dolores, objeciones, riesgos y lo que funcionó, cada una con cita; solo cuenta el cliente si hay lados', () => {
  const t = parse(`Luis Gómez (00:10): Queremos vender más en diciembre. Me preocupa que sea muy caro.\nLuis Gómez (00:40): No tenemos tiempo, estamos a contrarreloj. Ya nos fallaron con otra agencia.\nLuis Gómez (01:00): Nos encantó el último video.\nAna Pérez (01:30): Queremos proponerte un plan nuevo.`);
  const s = sen(t); assert.ok(s.quiere.length >= 1 && s.dolores.length === 1 && s.riesgos.length >= 2 && s.funciono.length === 1);
  assert.ok(s.riesgos.some((r) => r.tema === 'tiempo') && s.riesgos.some((r) => r.tema === 'desconfianza'));
  const lados = sen(t, { participantes: [{ nombre: 'Luis Gómez', lado: 'cliente' }, { nombre: 'Ana Pérez', lado: 'inherent' }] });
  assert.ok(!lados.quiere.some((q) => /proponerte/.test(q.cita)), 'lo que dice el equipo no es lo que quiere el cliente');
  assert.equal(sen(parse('Hola, qué tal. Todo bien por acá.')).quiere.length, 0);
});

// ---------- Memoria ----------
const fuenteA = { id: 'f1', tipo: 'reunion', titulo: 'Kickoff', fecha: '2026-11-10', texto: '[00:01] Luis Gómez: Te mando la propuesta el viernes.\n[00:02] Luis Gómez: Queremos vender más en diciembre. Me preocupa que sea muy caro.', participantes: P };
const fuenteB = { id: 'f2', tipo: 'reunion', titulo: 'Seguimiento', fecha: '2026-11-17', texto: '[00:01] Luis Gómez: La propuesta la tengo el lunes.\n[00:05] Luis Gómez: Nos encantó el video.', participantes: P };
await test('memoria: cada ítem con fuente, fecha y confianza; ordenada con lo aprobado arriba; último contacto', () => {
  const m = mem([fuenteA, fuenteB, { id: 'e1', tipo: 'entregable', titulo: 'Moodboard', fecha: '2026-11-18', estado: 'Aprobado', aprobadoPorCliente: true, resultados: [{ metrica: 'Alcance', valor: '12k' }] }], { hoy: '2026-11-22' });
  for (const k of ['quiere', 'prometido', 'funciono', 'riesgos']) { assert.ok(m[k].length > 0, k); for (const it of m[k]) { assert.ok(it.fuente?.id, k); assert.match(it.fecha, /^\d{4}-\d{2}-\d{2}$/); assert.ok(['alta', 'media', 'baja'].includes(it.confianza)); assert.ok(['aprobado', 'hipotesis'].includes(it.conocimiento)); } }
  assert.equal(m.funciono[0].conocimiento, 'aprobado'); assert.equal(m.funciono[0].fuente.tipo, 'entregable');
  assert.deepEqual(m.ultimoContacto, { fecha: '2026-11-17', fuente: { id: 'f2', tipo: 'reunion', titulo: 'Seguimiento' }, hace_dias: 5 });
  const apr = mem([{ ...fuenteA, compromisos: [{ id: 'x1', cita: 'Te mando la propuesta el viernes.', estado: 'aprobado', confianza: 'baja', para_cuando: '2026-11-13' }, { id: 'x2', cita: 'Te paso el calendario.', estado: 'hipotesis', confianza: 'alta' }] }], { hoy: '2026-11-22' });
  assert.equal(apr.prometido[0].id, 'x1', 'lo aprobado pesa más que la hipótesis aunque tenga menos confianza'); assert.equal(apr.prometido[0].vencido, true);
});
await test('memoria vacía = [] con «⚠️ SIN DATOS · conecta reuniones»; nada de relleno; un compromiso descartado no cuenta', () => {
  const v = mem([], { hoy: '2026-11-22' });
  for (const k of ['quiere', 'dolores', 'prometido', 'funciono', 'riesgos']) { assert.deepEqual(v[k], []); assert.equal(v.sinDatos[k], '⚠️ SIN DATOS · conecta reuniones'); }
  assert.equal(v.ultimoContacto, null); assert.equal(v.sinDatos.ultimoContacto, X.SIN_DATOS);
  const d = mem([{ id: 'f', tipo: 'reunion', fecha: '2026-11-10', compromisos: [{ cita: 'Te mando algo.', estado: 'descartado' }], senales: {} }]); assert.deepEqual(d.prometido, []);
});
await test('memoria: dos fechas distintas para lo mismo se marcan como contradicción (y lo distinto no)', () => {
  const m = mem([fuenteA, fuenteB], { hoy: '2026-11-22' });
  assert.equal(m.contradicciones.length, 1); assert.equal(m.contradicciones[0].motivo, 'Dos fechas distintas para lo mismo');
  assert.deepEqual([...m.contradicciones[0].fechas].sort(), ['2026-11-13', '2026-11-23'].sort());
  assert.ok(m.prometido.every((p) => Array.isArray(p.contradice) && p.contradice.length === 1));
  const otro = mem([fuenteA, { id: 'f3', tipo: 'reunion', fecha: '2026-11-17', texto: '[00:01] Luis Gómez: El calendario lo tengo el lunes.', participantes: P }], { hoy: '2026-11-22' });
  assert.equal(otro.contradicciones.length, 0);
});
await test('memoria: lo interno no entra salvo que se permita', () => {
  const n = { id: 'n1', tipo: 'nota', fecha: '2026-11-12', interno: true, texto: 'El cliente es difícil. Le prometimos 20% de descuento: te mando la cotización el lunes.' };
  assert.equal(mem([n]).prometido.length, 0); const p = mem([n], { permite: () => true }); assert.ok(p.prometido.length === 1 && p.prometido[0].interno === true);
});

// ---------- Servidor ----------
// Las rutas se montan en un enrutador de prueba (api/index.js no se toca aquí): el mismo `rutas(on)` que se enchufará allí.
const rutasT = [], on = (method, pattern, fn) => rutasT.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn });
let conectado = C.conectorReuniones.capability();
C.rutas(on, { conector: { capability: () => conectado } });
async function manejar(req, res) {
  try {
    const url = new URL(req.url, 'http://x'), p = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
    req.query = Object.fromEntries(url.searchParams);
    for (const r of rutasT) { const m = r.method === req.method && r.re.exec(p); if (m) { req.params = Object.fromEntries(Object.entries(m.groups || {}).map(([k, v]) => [k, decodeURIComponent(v)])); return await r.fn(req, res); } }
    return await api(req, res); // lo que no es mío (p. ej. /api/db) lo contesta el API real
  } catch (e) { failHttp(res, e); }
}
const email = (r) => `${r}@inherentglobal.com`;
async function req(role, route, method = 'GET', b = {}, headers = { 'x-ceoos': '1' }) {
  const h = { host: 'localhost', ...headers }, jar = new Map(), res = { statusCode: 200, getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; }, writeHead(n) { this.statusCode = n; return this; }, write() {}, end() {} };
  const r = { url: `/api/${route}`, method, headers: h, body: b, query: {}, params: {} };
  if (role) { session.issue(r, res, { email: email(role) }); h.cookie = jar.get('Set-Cookie').split(';')[0]; }
  await manejar(r, res); return { status: res.statusCode, data: res.data };
}
for (const s of ['alpha', 'beta']) { fs.mkdirSync(path.join(process.env.LOCAL_REPO, `clients/${s}/00-onboarding`), { recursive: true }); fs.writeFileSync(path.join(process.env.LOCAL_REPO, `clients/${s}/00-onboarding/plan-contratado.md`), `# Ficha — ${s}\n\n| Campo | Valor |\n|---|---|\n| Plan | Brand Growth |\n`); }
for (const r of ['ceo', 'coo', 'team', 'solo', 'ops', 'nada']) await db.create('team', { role: ['solo', 'ops', 'nada'].includes(r) ? 'team' : r, roles: r === 'ops' ? ['content'] : r === 'solo' ? ['ventas'] : r === 'nada' ? ['design'] : [r] }, 'fixture', email(r));
await db.create('team', { role: 'client', client_slug: 'alpha', external: true }, 'fixture', 'cliente@alpha.com');
await db.create('settings', { views: { coo: { content: 'edita', clients: 'edita' }, team: { content: 'edita' }, ventas: { sales: 'completo', content: 'oculto', clients: 'oculto' }, content: { content: 'edita' } }, scope: { content: 'asignados', ventas: 'asignados' } }, 'fixture', 'role_views');
await db.create('projects', { name: 'Alpha', client_slug: 'alpha', people: [email('ops')] }, 'fixture');
const ZOOM = { texto: T_ZOOM, fecha: '2026-11-26', participantes: P, origen: 'reunion', titulo: 'Kickoff Alpha' };

let comp1;
await test('POST transcripción: guarda la fuente, deja los compromisos como HIPÓTESIS y avisa que el conector está desconectado', async () => {
  const r = await req('coo', 'contexto/alpha/transcripcion', 'POST', ZOOM);
  assert.equal(r.status, 200); assert.equal(r.data.fuente.duplicada, false); assert.ok(r.data.compromisos.length >= 3);
  assert.ok(r.data.compromisos.every((c) => c.estado === 'hipotesis' && ZOOM.texto.includes(c.cita) && c.tarea_id === null));
  assert.equal(r.data.conector.conectado, false); assert.match(r.data.conector.mensaje, /no está conectado/);
  comp1 = r.data.compromisos.find((c) => /propuesta/.test(c.cita)); assert.equal(comp1.para_cuando, '2026-11-27');
});
await test('el mismo contenido dos veces (aunque cambie el espacio) = UNA fuente y los mismos compromisos', async () => {
  const r = await req('ceo', 'contexto/alpha/transcripcion', 'POST', { ...ZOOM, texto: `${T_ZOOM.replace(/ /g, '  ')}\n\n`, titulo: 'Otra vez' });
  assert.equal(r.status, 200); assert.equal(r.data.fuente.duplicada, true);
  assert.equal((await db.list('ctx_fuentes')).filter((f) => f.slug === 'alpha').length, 1);
  const ids = (await db.list('ctx_compromisos')).filter((c) => c.slug === 'alpha'); assert.equal(ids.length, r.data.compromisos.length); assert.ok(r.data.compromisos.some((c) => c.id === comp1.id));
});
await test('validación: sin texto 400, origen/fecha inválidos 400, demasiado grande 413', async () => {
  assert.equal((await req('ceo', 'contexto/alpha/transcripcion', 'POST', { texto: '  ' })).status, 400);
  assert.equal((await req('ceo', 'contexto/alpha/transcripcion', 'POST', { texto: 'x', origen: 'whatsapp' })).data.code, 'ORIGEN');
  assert.equal((await req('ceo', 'contexto/alpha/transcripcion', 'POST', { texto: 'x', fecha: '2026-13-45' })).data.code, 'FECHA');
  assert.equal((await req('ceo', 'contexto/alpha/transcripcion', 'POST', { texto: 'a'.repeat(400_001) })).status, 413);
});
await test('GET memoria: trae fuente/fecha/confianza, los ids para Aceptar y el estado del conector', async () => {
  const r = await req('coo', 'contexto/alpha/memoria'); assert.equal(r.status, 200);
  const p = r.data.prometido.find((x) => x.id === comp1.id); assert.ok(p && p.v >= 1 && p.fuente.id && p.fecha === '2026-11-26' && p.confianza);
  assert.equal(r.data.ultimoContacto.fecha, '2026-11-26'); assert.equal(r.data.conector.conectado, false);
  conectado = { conectado: true, nombre: 'Granola' }; assert.equal((await req('coo', 'contexto/alpha/memoria')).data.conector.conectado, true); conectado = { conectado: false };
  const vacia = await req('coo', 'contexto/beta/memoria'); assert.deepEqual(vacia.data.prometido, []); assert.equal(vacia.data.sinDatos.prometido, '⚠️ SIN DATOS · conecta reuniones');
});
await test('aceptar crea UNA tarea ligada a la marca (origen contexto, con la cita) y marca el compromiso aprobado; repetir = la misma tarea', async () => {
  const a = await req('coo', `contexto/compromisos/${comp1.id}/aceptar`, 'POST', { v: comp1.v }); assert.equal(a.status, 200); assert.equal(a.data.ya, false); assert.equal(a.data.compromiso.estado, 'aprobado');
  const otra = await req('coo', `contexto/compromisos/${comp1.id}/aceptar`, 'POST', { v: comp1.v }); assert.equal(otra.status, 200); assert.equal(otra.data.ya, true); assert.equal(otra.data.tarea_id, a.data.tarea_id);
  const tareas = (await db.list('tasks')).filter((t) => t.compromiso_id === comp1.id); assert.equal(tareas.length, 1);
  assert.equal(tareas[0].origen, 'contexto'); assert.equal(tareas[0].client_slug, 'alpha'); assert.equal(tareas[0].cliente, 'alpha'); assert.equal(tareas[0].due, '2026-11-27'); assert.equal(tareas[0].status, 'Por empezar');
  assert.ok(tareas[0].description.includes(comp1.cita)); assert.equal(tareas[0]._meta.created_by, email('coo'));
  const m = await req('coo', 'contexto/alpha/memoria'); assert.equal(m.data.prometido.find((x) => x.id === comp1.id).conocimiento, 'aprobado');
});
await test('dos toques a la vez sobre otro compromiso: una sola tarea', async () => {
  const c = (await req('ceo', 'contexto/alpha/memoria')).data.prometido.find((x) => /calendario/.test(x.cita)); assert.ok(c);
  const rs = await Promise.all([1, 2, 3].map(() => req('ceo', `contexto/compromisos/${c.id}/aceptar`, 'POST', { v: c.v })));
  assert.ok(rs.every((r) => r.status === 200)); assert.equal(new Set(rs.map((r) => r.data.tarea_id)).size, 1);
  assert.equal((await db.list('tasks')).filter((t) => t.compromiso_id === c.id).length, 1);
});
await test('descartar archiva (no borra) y repetir es igual; uno aceptado no se descarta; uno descartado no se acepta', async () => {
  const m = (await req('ceo', 'contexto/alpha/memoria')).data.prometido, c = m.find((x) => /accesos/.test(x.cita));
  const d = await req('coo', `contexto/compromisos/${c.id}/descartar`, 'POST', { v: c.v }); assert.equal(d.status, 200); assert.equal(d.data.compromiso.estado, 'descartado');
  assert.equal((await req('coo', `contexto/compromisos/${c.id}/descartar`, 'POST', {})).data.ya, true);
  assert.equal((await db.get('ctx_compromisos', c.id)).estado, 'descartado', 'sigue en la base');
  assert.equal((await req('coo', `contexto/compromisos/${c.id}/aceptar`, 'POST', {})).data.code, 'DESCARTADO');
  assert.equal((await req('ceo', 'contexto/alpha/memoria')).data.prometido.some((x) => x.id === c.id), false, 'lo descartado sale de la memoria');
  assert.equal((await req('coo', `contexto/compromisos/${comp1.id}/descartar`, 'POST', {})).data.code, 'ACEPTADO');
});
await test('409 si la versión que leíste ya cambió', async () => {
  const r = await req('ceo', 'contexto/alpha/transcripcion', 'POST', { texto: '[00:01] Luis Gómez: Te confirmo los precios el lunes.', fecha: '2026-11-26', participantes: P });
  const c = r.data.compromisos[0], cur = await db.get('ctx_compromisos', c.id);
  await db.update('ctx_compromisos', c.id, { ...cur, nota: 'alguien lo tocó' }, cur.v, 'otro'); // sube la versión
  const a = await req('coo', `contexto/compromisos/${c.id}/aceptar`, 'POST', { v: c.v }); assert.equal(a.status, 409); assert.equal(a.data.code, 'CONFLICTO');
  assert.equal((await req('coo', `contexto/compromisos/${c.id}/descartar`, 'POST', { v: c.v })).status, 409);
  assert.equal((await db.list('tasks')).filter((t) => t.compromiso_id === c.id).length, 0, 'sin tarea si no se pudo');
  assert.equal((await req('coo', `contexto/compromisos/${c.id}/aceptar`, 'POST', { v: cur.v + 1 })).status, 200);
});
await test('acceso por marca: quien no ve a esa marca recibe 404 (memoria, ingesta, aceptar, descartar); un cliente inexistente también', async () => {
  // «ops» (contenido, asignados): solo ve alpha por su proyecto. Beta no es suya.
  assert.equal((await req('ops', 'contexto/alpha/memoria')).status, 200);
  const sb = await req('ceo', 'contexto/beta/transcripcion', 'POST', { texto: '[00:01] Luis Gómez: Te mando el secreto de Beta el lunes.', fecha: '2026-11-26', participantes: P });
  assert.equal((await req('ops', 'contexto/beta/memoria')).status, 404); assert.equal((await req('ops', 'contexto/beta/transcripcion', 'POST', ZOOM)).status, 404);
  assert.equal((await req('ops', `contexto/compromisos/${sb.data.compromisos[0].id}/aceptar`, 'POST', {})).status, 404); assert.equal((await req('ops', `contexto/compromisos/${sb.data.compromisos[0].id}/descartar`, 'POST', {})).status, 404);
  assert.equal((await req('ops', 'contexto/nadie/memoria')).status, 404); assert.equal((await req('ops', 'contexto/personal/memoria')).status, 404);
  assert.doesNotMatch(JSON.stringify((await req('ops', 'contexto/alpha/memoria')).data), /secreto de Beta/);
  assert.equal((await req('ceo', 'contexto/personal/memoria')).status, 200, 'la marca personal es del CEO');
  assert.equal((await req(null, 'contexto/alpha/memoria')).status, 401);
});
await test('un cliente del portal NUNCA entra (403), ni a leer ni a escribir; ni un rol que no abre marcas', async () => {
  const sesion = async (e) => { const jar = new Map(), res = { statusCode: 200, getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; } }, r = { url: '/api/x', method: 'GET', headers: { host: 'localhost' } }; session.issue(r, res, { email: e }); return jar.get('Set-Cookie').split(';')[0]; };
  const cookie = await sesion('cliente@alpha.com');
  for (const [m, ruta, b] of [['GET', 'contexto/alpha/memoria'], ['POST', 'contexto/alpha/transcripcion', ZOOM], ['POST', `contexto/compromisos/${comp1.id}/aceptar`, {}]]) {
    const r = await req(null, ruta, m, b || {}, { 'x-ceoos': '1', cookie }); assert.equal(r.status, 403, ruta);
  }
  assert.equal((await req('nada', 'contexto/alpha/memoria')).status, 403, 'un perfil sin áreas de marca'); assert.equal((await req('solo', 'contexto/alpha/memoria')).status, 404, 'ventas ve Ventas, pero alpha no es de sus clientes');
});
await test('lo interno no sale a un rol sin permiso: la nota del equipo solo la ven CEO, COO y quien edita Clientes; las notas del CRM, quien ve Ventas', async () => {
  const n = await req('coo', 'contexto/alpha/transcripcion', 'POST', { texto: 'El cliente es difícil y no paga a tiempo. Le prometimos 20% de descuento: te mando la cotización el lunes.', origen: 'nota', fecha: '2026-11-20', titulo: 'Nota del equipo' });
  assert.equal(n.status, 200); assert.equal(n.data.fuente.interno, true); const cid = n.data.compromisos[0].id;
  const ve = await req('coo', 'contexto/alpha/memoria'); assert.equal(ve.data.interno, true); assert.match(JSON.stringify(ve.data), /20% de descuento/);
  const no = await req('ops', 'contexto/alpha/memoria'); assert.equal(no.status, 200); assert.equal(no.data.interno, false); assert.doesNotMatch(JSON.stringify(no.data), /difícil|20% de descuento|Nota del equipo/);
  assert.equal((await req('ops', `contexto/compromisos/${cid}/aceptar`, 'POST', {})).status, 404, 'ni siquiera sabe que existe');
  const tarea = await req('coo', `contexto/compromisos/${cid}/aceptar`, 'POST', {}); assert.equal(tarea.status, 200);
  assert.equal((await db.get('tasks', tarea.data.tarea_id)).visibility, 'private', 'la tarea de algo interno no se abre a todos');
  // CRM: el lead de la marca entra como fuente interna, solo para quien ve Ventas.
  await db.create('leads', { name: 'Alpha', company: 'Alpha', stage: 'Ganado', notes: 'Margen del 71%, nos pidió rebaja. Quiere vender más en enero.', owner_role: 'ventas' }, 'fixture');
  assert.match(JSON.stringify((await req('ceo', 'contexto/alpha/memoria')).data), /vender más en enero/); assert.doesNotMatch(JSON.stringify((await req('ops', 'contexto/alpha/memoria')).data), /71%|rebaja|enero/);
});
await test('entregables: solo título, aprobación del cliente y resultados (nunca contenido ni costos), y solo de las áreas que ve quien pregunta', async () => {
  await db.create('deliverables', { client_slug: 'alpha', tool: 'moodboard-studio', ws: 'creative', titulo: 'Moodboard de diciembre', estado: 'Aprobado', version: 1, aprobado: { version: 1 }, entradas: [], historial: [], contenido: { costo: 'Q99,999', margen: '71%' }, aprobacion_cliente: { accion: 'aprobar', en: '2026-11-19T10:00:00.000Z' }, resultado: [{ metrica: 'Alcance', valor: '12k' }] }, 'fixture');
  const r = await req('coo', 'contexto/alpha/memoria'); assert.ok(r.data.funciono.some((f) => /Moodboard de diciembre/.test(f.texto) && f.conocimiento === 'aprobado' && f.confianza === 'alta'));
  assert.ok(r.data.funciono.some((f) => f.texto === 'Alcance: 12k')); assert.doesNotMatch(JSON.stringify(r.data), /Q99|71%\b.*costo|"costo"/);
  assert.equal((await req('ops', 'contexto/alpha/memoria')).data.funciono.some((f) => /Moodboard/.test(f.texto)), true, 'ops ve contenido → ve creative');
});
await test('ctx_fuentes y ctx_compromisos no se tocan por /api/db (404 en leer y escribir)', async () => {
  for (const c of ['ctx_fuentes', 'ctx_compromisos']) for (const [m, ruta] of [['GET', `db/${c}`], ['POST', `db/${c}`], ['GET', `db/${c}/x`], ['PUT', `db/${c}/x`], ['DELETE', `db/${c}/x`]]) {
    const r = await req('ceo', ruta, m, { texto: 'x' }); assert.equal(r.status, 404, `${m} ${ruta}`);
  }
  assert.equal((await db.list('ctx_fuentes')).length >= 2, true);
});
await test('las transcripciones no se imprimen: ni la ingesta ni la memoria escriben en consola', async () => {
  const log = console.log, errl = console.error, vistos = []; console.log = (...a) => vistos.push(a.join(' ')); console.error = (...a) => vistos.push(a.join(' '));
  try { await req('ceo', 'contexto/alpha/transcripcion', 'POST', { texto: '[00:01] Luis Gómez: Dato muy privado ZZTOP. Te mando todo el lunes.', fecha: '2026-11-26', participantes: P }); await req('ceo', 'contexto/alpha/memoria'); } finally { console.log = log; console.error = errl; }
  assert.doesNotMatch(vistos.join('\n'), /ZZTOP|privado/);
});
console.log(`${count} pruebas del contexto vivo OK`);
process.exit(0);
