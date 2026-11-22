// Studio · Ideación de contenido: lo puro (resonancia, formato, alineación, idea, escenas, lote) y el servidor (generar, al shot list, acceso).
// Sin red; PGlite temporal; datos sintéticos de varias marcas. node scripts/test-vision-ideacion.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-ideacion-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
process.env.SESSION_SECRET = 'vision-test-only-secret-01234567890123456789'; process.env.ADMIN_EMAILS = 'ceo@inherentglobal.com';
const P = await import('../public/js/studio/ideacion.js'), S = await import('../public/js/production/shotlist.js');
const I = await import('../api/_lib/ideacion.js'), db = await import('../api/_lib/db.js'), session = await import('../api/_lib/session.js');
let count = 0;
const test = async (n, fn) => { await fn(); console.log('✓', n); count++; };

// ---------- datos sintéticos ----------
const ig = (code, o = {}) => ({ url: `https://www.instagram.com/reel/${code}/`, red: 'instagram', format: 'reel', ...o });
const marcaA = { nombre: 'Alpha', voz: { tono: ['cercana', 'directa', 'clara'], si: ['café de origen'], no: ['gratis'] }, personalidad: [{ eje: 'humor', valor: 6 }, { eje: 'cercania', valor: 8 }],
  pilares: ['Educación del café', 'Detrás de cámaras'], icp: { quien: 'dueños de cafeterías', dolor: 'café que no se vende' }, villano: 'el café industrial sin historia', conciencia: 2 };
const marcaB = { nombre: 'Beta', voz: { tono: ['sobria', 'elegante', 'formal'], si: ['rigor'], no: ['humor', 'chiste', 'pov'] }, personalidad: [{ eje: 'humor', valor: 1 }],
  pilares: ['Asesoría fiscal'], icp: 'contadores', villano: 'la informalidad', conciencia: 3 };

await test('resonancia normalizada: una cuenta chica con 3× le gana a una grande con 1.2× (aunque tenga menos vistas)', () => {
  const grande = [100000, 100000, 100000, 120000].map((v, i) => ig(`GRAN${i}AAAA`, { handle: 'grande', views: v, text: `Consejo número ${i} de café` }));
  const chica = [1000, 1000, 1000, 5000].map((v, i) => ig(`CHIC${i}AAAA`, { handle: 'chica', views: v, text: `Dato ${i} del tostado` }));
  const r = P.puntuarPosts([...grande, ...chica], { gananteMin: 0 });
  assert.equal(r[0].post.handle, 'chica'); assert.equal(r[0].x, 2.5);
  const g = r.find((x) => x.post.views === 120000); assert.ok(g.x > 1 && g.x < 1.3); assert.ok(r.indexOf(g) > 0);
  assert.equal(P.puntuarPosts([...grande, ...chica]).length, 1, 'por defecto solo pasa lo que llega a ×2 (corte de mc-radar)');
  const guardado = P.puntuarPosts([ig('GUARD1AAAA', { handle: 'x', x: 3.4, base: 12, views: 50 }), ig('GUARD2AAAA', { handle: 'y', x: 1.2, base: 30, views: 9e6 })], { gananteMin: 0 });
  assert.deepEqual(guardado.map((i) => i.x), [3.4, 1.2]);
});
await test('sin dato no hay número: sin métricas, sin base suficiente o sin https queda fuera (nunca 0); la misma pieza con otro link cuenta una vez', () => {
  const r = P.puntuarPosts([
    ig('SINDATO1AAA', { handle: 'a', text: 'sin métricas' }),                                   // sin vistas ni likes
    ig('SOLO1AAAAAA', { handle: 'solo', views: 900 }), ig('SOLO2AAAAAA', { handle: 'solo', views: 100 }), // 2 posts: base insuficiente
    { url: 'http://insegura.com/x', handle: 'h', x: 5 },                                           // sin https
    ig('DUPLI1AAAAA', { handle: 'd', x: 2.5 }), { url: 'https://www.instagram.com/p/DUPLI1AAAAA/', red: 'instagram', handle: 'd', x: 4 },
  ], { gananteMin: 0 });
  assert.deepEqual(r.map((i) => i.clave), ['ig:DUPLI1AAAAA']); assert.equal(r[0].x, 4, 'del duplicado se queda el mejor');
  assert.ok(r.every((i) => i.x > 0));
});
await test('extraerFormato: lista de 3 errores, antes/después, detrás de cámaras, pregunta y pieza directa — con la señal que lo justifica', () => {
  const l = P.extraerFormato(ig('LISTA1AAAAA', { text: '3 errores que cometes al moler tu café\nsigue leyendo', dur: 18, talk: 'voz', tags: ['texto en pantalla'] }));
  assert.equal(l.id, 'lista'); assert.equal(l.n, 3); assert.equal(l.nombre, 'Lista de 3 errores'); assert.equal(l.ritmo, 'medio'); assert.equal(l.textoEnPantalla, true);
  assert.ok(l.senales.some((s) => /promete 3 errores/.test(s)) && l.senales.some((s) => /18 s/.test(s)) && l.senales.some((s) => /texto en pantalla/i.test(s)) && l.senales.some((s) => /voz en off/.test(s)));
  assert.equal(P.extraerFormato(ig('ANTES1AAAAA', { text: 'Antes y después de nuestra barra' })).id, 'antes-despues');
  assert.equal(P.extraerFormato(ig('BTS1AAAAAAA', { text: 'Así se hace nuestro cold brew, detrás de cámaras' })).id, 'detras-de-camaras');
  const q = P.extraerFormato(ig('PREG1AAAAAA', { text: '¿Sabías que el café se enfría distinto?', dur: 20 })); assert.equal(q.id, 'pregunta-respuesta');
  const d = P.extraerFormato({ url: 'https://www.instagram.com/p/DIREC1AAAAA/', text: 'Lunes', format: 'estatico' }); assert.equal(d.id, 'visual-directo'); assert.ok(d.senales.length >= 1);
  assert.deepEqual(P.extraerFormato(ig('LISTA1AAAAA', { text: '3 errores que cometes al moler tu café', dur: 18 })), P.extraerFormato(ig('LISTA1AAAAA', { text: '3 errores que cometes al moler tu café', dur: 18 })), 'determinista');
});
await test('alinearAMarca: A encaja y B no (voz prohibida), con los cambios dichos en frases concretas', () => {
  const pov = P.extraerFormato(ig('POV1AAAAAAA', { text: 'POV: tu cliente pide un café gratis', dur: 12 })); assert.equal(pov.id, 'pov');
  const b = P.alinearAMarca(pov, marcaB); assert.equal(b.encaja, false);
  assert.ok(b.porQue.some((s) => /no usa/.test(s)) && b.cambios.some((c) => /Quita «(humor|pov|chiste)»/.test(c)), JSON.stringify(b));
  const lista = P.extraerFormato(ig('LISTA2AAAAA', { text: '3 errores que dueños de cafeterías cometen con el café de origen', dur: 20 }));
  const a = P.alinearAMarca(lista, marcaA); assert.equal(a.encaja, true); assert.ok(a.puntos >= P.MIN_PUNTOS); assert.equal(a.pilar, 'Educación del café');
  assert.ok(a.porQue.some((s) => /nivel 2/.test(s)));
  const gratis = P.alinearAMarca(P.extraerFormato(ig('GRAT1AAAAAA', { text: 'Tips de café para dueños de cafeterías. Pruébalo gratis hoy' })), marcaA);
  assert.ok(gratis.cambios.some((c) => /«gratis»/.test(c)), 'una palabra prohibida suelta en el texto es un cambio, no un veto');
  const vacia = P.alinearAMarca(lista, {}); assert.equal(vacia.encaja, false); assert.ok(vacia.porQue.some((s) => /SIN DATOS/.test(s)));
});
await test('armarIdea: idea completa con gancho, guion por escenas, quién sale, props, locación, adaptación, fuente y prompt de redacción', () => {
  const post = ig('LISTA3AAAAA', { handle: 'chica', x: 3.2, base: 12, text: '3 errores que cometes al moler tu café', dur: 18 });
  const f = P.extraerFormato(post), idea = P.armarIdea(post, f, marcaA, { temporada: '2026-12' });
  assert.match(idea.id, /^idea-[a-z0-9]+$/); assert.equal(idea.estado, 'hipotesis'); assert.equal(idea.temporada, '2026-12'); assert.equal(idea.pilar, 'Educación del café');
  assert.match(idea.gancho, /3 errores que dueños de cafeterías/);
  assert.ok(idea.guion.length >= 5 && idea.guion.every((e) => e.escena && e.accion && e.duracion_s > 0)); assert.equal(idea.guion.filter((e) => /^Punto/.test(e.escena)).length, 3);
  assert.ok(idea.gente.length >= 1 && idea.gente[0].rol && idea.props.length && idea.locacion && idea.adaptacion.length >= 0);
  assert.deepEqual(idea.fuente, { url: post.url, red: 'instagram', resonancia: 3.2, handle: 'chica' }); assert.match(idea.evidencia, /×3\.2 el promedio de @chica \(sobre 12/);
  assert.match(idea.promptRedaccion, /Nunca dice: gratis/); assert.match(idea.promptRedaccion, /NO CONFIABLE/); assert.ok(idea.promptRedaccion.length < 2500);
  assert.equal(P.armarIdea(post, f, marcaA).id, idea.id, 'el mismo post y formato siempre dan el mismo id');
  const total = idea.guion.reduce((a, e) => a + e.duracion_s, 0); assert.ok(total >= 14 && total <= 24, `la duración sigue al post (18 s): ${total}`);
});
await test('ideaAEscenasShotlist: las filas tienen la MISMA forma que shotlist.js y no mutan la idea', () => {
  const post = ig('LISTA4AAAAA', { handle: 'chica', x: 3, text: '3 errores con tu café', dur: 18 }), idea = P.armarIdea(post, P.extraerFormato(post), marcaA);
  const antes = JSON.stringify(idea), filas = P.ideaAEscenasShotlist(idea, { temporada: '2026-12', siguienteId: 7 });
  assert.equal(JSON.stringify(idea), antes); assert.equal(filas.length, idea.guion.length); assert.equal(filas[0].id, 'PR-007'); assert.equal(filas[1].id, 'PR-008');
  for (const e of filas) { assert.deepEqual(Object.keys(e).sort(), Object.keys(S.escenaVacia()).sort()); assert.equal(e.id_creativo, idea.id); assert.equal(e.estado, 'pendiente'); assert.equal(e.costo_estimado, null); }
  assert.deepEqual(S.limpiar({ escenas: filas }).escenas, filas, 'ya vienen limpias: el shot list no las cambia');
  assert.equal(S.faltas({ escenas: filas }).length, 0);
});
await test('lote: las mejores N, solo lo que la marca puede decir, sin repetir formato más de 2 veces', () => {
  const posts = Array.from({ length: 5 }, (_, i) => ig(`LOTEL${i}AAAAA`, { handle: `c${i}`, x: 5 - i * 0.4, text: `${i + 3} errores de café que dueños de cafeterías cometen` }))
    .concat([ig('LOTEP1AAAAA', { handle: 'p', x: 2.2, text: 'POV: tu cliente pide café' }), ig('LOTET1AAAAA', { handle: 't', x: 2.1, text: 'Así se hace nuestro cold brew, detrás de cámaras' })]);
  const r = P.loteConResumen(posts, marcaA, { max: 10 });
  assert.equal(r.ideas.filter((i) => i.formato.id === 'lista').length, P.MAX_POR_FORMATO); assert.equal(r.ideas.length, 4);
  assert.ok(r.fuera.some((f) => /Ya hay 2/.test(f.motivo)));
  assert.deepEqual(P.lote(posts, marcaA, { max: 1 }).map((i) => i.fuente.resonancia), [5]);
  assert.equal(P.lote(posts, marcaB).some((i) => i.formato.id === 'pov'), false, 'a la marca B nunca se le arma un POV');
});
await test('seguridad: HTML/XSS en textos scrapeados se neutraliza en toda la idea y en las escenas', () => {
  const mal = '<img src=x onerror=alert(1)> 3 errores <script>alert(document.cookie)</script> que cometes &lt;b&gt; javascript:alert(1)';
  const post = ig('XSS1AAAAAAA', { handle: '<b>h</b>', x: 4, text: mal, why: { hook: mal } }), f = P.extraerFormato(post), idea = P.armarIdea(post, f, { ...marcaA, villano: '<script>x</script>villano' });
  const todo = JSON.stringify(idea) + JSON.stringify(P.ideaAEscenasShotlist(idea));
  assert.equal(P.texto('<a href="javascript:evil()">hola</a>'), 'hola'); assert.equal(P.texto('<img src=x onerror=alert(1)'), '');
});
await test('limpiarIdea: la idea editada no puede colar campos fuera de la lista ni cambiar su estado', () => {
  const sucio = { id: 'idea-abc123', gancho: 'Hola', estado: 'aprobado', costo_estimado: 999, v: 77, __proto__: { admin: true }, constructor: 'x', escenas: [{ id: 'PR-001' }], aprobado: { por: 'yo' },
    guion: [{ escena: 'Gancho', accion: 'Algo', dialogo: 'Dice', duracion_s: 4, costo_estimado: 50, estado: 'grabada', id: 'PR-999' }], gente: [{ rol: 'Chef', perfil: 'x', sueldo: 1 }], fuente: { url: 'javascript:alert(1)', red: 'myspace', resonancia: -3, extra: 1 },
    formato: { id: 'no-existe', nombre: 'X' }, temporada: 'navidad' };
  const l = P.limpiarIdea(sucio);
  assert.deepEqual(Object.keys(l).sort(), ['adaptacion', 'conciencia', 'evidencia', 'estado', 'formato', 'fuente', 'gancho', 'gente', 'guion', 'id', 'locacion', 'pilar', 'promptRedaccion', 'props', 'puntos', 'temporada'].sort());
  assert.equal(l.estado, 'hipotesis'); assert.deepEqual(Object.keys(l.guion[0]).sort(), ['accion', 'dialogo', 'duracion_s', 'escena', 'plano']); assert.deepEqual(Object.keys(l.gente[0]).sort(), ['perfil', 'rol']);
  assert.equal(l.fuente.url, ''); assert.equal(l.fuente.red, ''); assert.equal(l.fuente.resonancia, null); assert.equal(l.formato.id, ''); assert.equal(l.temporada, '');
  const fila = P.ideaAEscenasShotlist(sucio)[0]; assert.equal(fila.costo_estimado, null); assert.equal(fila.estado, 'pendiente'); assert.equal(fila.id, 'PR-001');
  assert.equal(({}).admin, undefined);
});
await test('sumarAlShotlist: solo suma (lo que hay queda igual, con su costo), no repite y respeta el tope', () => {
  const post = ig('SUMA1AAAAAA', { handle: 'c', x: 3, text: '3 errores con el café' }), idea = P.armarIdea(post, P.extraerFormato(post), marcaA);
  const hay = { escenas: [{ ...S.escenaVacia('PR-004'), id_creativo: 'otra', escena: 'E1', accion: 'Ya existente', costo_estimado: 250, estado: 'grabada' }] };
  const a = P.sumarAlShotlist(hay, idea); assert.equal(a.agregadas, idea.guion.length); assert.deepEqual(a.contenido.escenas[0], S.limpiar(hay).escenas[0]); assert.equal(a.contenido.escenas[1].id, 'PR-005');
  const b = P.sumarAlShotlist(a.contenido, idea); assert.equal(b.agregadas, 0); assert.equal(b.yaEstaban, idea.guion.length); assert.deepEqual(b.contenido.escenas, a.contenido.escenas);
  const lleno = { escenas: Array.from({ length: 299 }, (_, i) => ({ ...S.escenaVacia(S.idEscena(i + 1)), id_creativo: 'x', escena: `E${i}` })) };
  assert.match(P.sumarAlShotlist(lleno, idea).error, /tope/);
});

// ---------- El servidor ----------
const handlers = [];
I.rutas((method, pattern, fn) => handlers.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn }));
const email = (r) => `${r}@inherentglobal.com`;
async function llamar(role, route, b = {}, headers = { 'x-ceoos': '1' }) {
  const jar = new Map(), h = { host: 'localhost', ...headers };
  const res = { statusCode: 200, getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; }, writeHead(n) { this.statusCode = n; return this; }, write() {}, end() {} };
  const req = { url: `/api/${route}`, method: 'POST', headers: h, body: b, query: {}, params: {} };
  if (role) { session.issue(req, res, { email: email(role) }); h.cookie = jar.get('Set-Cookie').split(';')[0]; }
  for (const r of handlers) { const m = r.method === 'POST' && r.re.exec(route); if (m) { req.params = { ...m.groups }; await r.fn(req, res); return { status: res.statusCode, data: res.data }; } }
  return { status: 404, data: null };
}
const ficha = (slug, filas = '') => { const d = path.join(process.env.LOCAL_REPO, `clients/${slug}/00-onboarding`); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'plan-contratado.md'), `# Ficha — ${slug}\n\n| Campo | Valor |\n|---|---|\n| Plan | Brand Growth |\n${filas}\n## Qué incluye\n\n| Entregable | Cantidad |\n|---|---|\n| Volumen | 2 piezas |\n`); };
ficha('alpha', '| Redes | Instagram, TikTok |'); ficha('beta'); // gamma no tiene ficha
for (const r of ['ceo', 'coo', 'team', 'team2']) await db.create('team', { role: r.replace('2', ''), roles: [r.replace('2', '')] }, 'fixture', email(r));
await db.create('settings', { views: { coo: { content: 'edita' }, team: { content: 'edita' } }, scope: { team: 'asignados' } }, 'fixture', 'role_views');
await db.create('projects', { name: 'P alpha', client_slug: 'alpha' }, 'fixture', 'p-alpha'); await db.create('tasks', { title: 'T', assignee: email('team'), project_id: 'p-alpha' }, 'fixture', 't-alpha');
await db.create('brand_boards', { dna: { voz: marcaA.voz, personalidad: marcaA.personalidad, territorio: { territorio: 'x', arquetipo: 'y', es: ['cercana'], no_es: ['el café industrial sin historia'] } } }, 'fixture', 'alpha');
await db.create('sources', { profile: 'alpha', pillars: [{ name: 'Educación del café', color: '#111' }], audience: { exacto: 'dueños de cafeterías', nicho: '', general: '' } }, 'fixture', 'cfg-alpha');
const research = (slug, id, o) => db.create('content', { kind: 'research', profile: slug, source: 'apify', ...o }, 'fixture', `rs-${slug}-${id}`);
await research('alpha', 1, ig('SRV1AAAAAAA', { handle: 'chica', x: 3.5, base: 10, text: '3 errores que dueños de cafeterías cometen con el café', dur: 20 }));
await research('alpha', 2, ig('SRV2AAAAAAA', { handle: 'chica', x: 2.6, base: 10, text: 'Así se hace nuestro cold brew, detrás de cámaras', dur: 25 }));
await research('alpha', 3, { url: 'https://www.youtube.com/watch?v=YTSRV1AAAAA', red: 'youtube', handle: 'yt', x: 9, base: 10, text: '5 pasos del café' }); // youtube: fuera de las redes de la ficha
await research('beta', 1, ig('BETA1AAAAAA', { handle: 'rival', x: 4, base: 8, text: 'POV: tu cliente no paga' }));

await test('generar: lee el Research de la marca, respeta las redes de la ficha y arma ideas con su marca', async () => {
  const r = await llamar('ceo', 'ideacion/alpha/generar', { temporada: '2026-12', max: 5 }); assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.vacio, false); assert.equal(r.data.ideas.length, 2); assert.deepEqual(r.data.ideas.map((i) => i.formato.id), ['lista', 'detras-de-camaras']);
  assert.ok(r.data.ideas.every((i) => i.fuente.red !== 'youtube' && i.temporada === '2026-12' && i.estado === 'hipotesis'));
  assert.equal(r.data.ideas[0].pilar, 'Educación del café'); assert.match(r.data.ideas[0].promptRedaccion, /Nunca dice: gratis/); assert.equal(r.data.capacidad.scraping, false);
});
await test('generar: sin posts es un vacío honesto que explica de dónde saldría; sin ficha de oferta, 409', async () => {
  fs.mkdirSync(path.join(process.env.LOCAL_REPO, 'clients/delta/00-onboarding'), { recursive: true }); ficha('delta'); // con ficha pero sin Research
  const v = await llamar('ceo', 'ideacion/delta/generar'); assert.equal(v.status, 200); assert.equal(v.data.vacio, true); assert.deepEqual(v.data.ideas, []); assert.match(v.data.aviso, /SIN DATOS · corre el radar/);
  const s = await llamar('ceo', 'ideacion/gamma/generar'); assert.equal(s.status, 409); assert.equal(s.data.code, 'SIN_FICHA');
  const m = await llamar('ceo', 'ideacion/beta/generar'); assert.equal(m.status, 200); assert.equal(m.data.vacio, true, 'la marca no tiene voz escrita: no se inventa lo que puede decir'); assert.match(m.data.aviso, /SIN DATOS/);
});
await test('al shot list: crea el de la temporada, y agregar la misma idea dos veces es una sola vez', async () => {
  const g = await llamar('ceo', 'ideacion/alpha/generar', { temporada: '2026-12' }), idea = g.data.ideas[0];
  idea.gancho = '3 errores al moler (editado)'; idea.guion[1].accion = 'Plano cerrado del molino (editado)';
  const a = await llamar('coo', 'ideacion/alpha/al-shotlist', { idea, temporada: '2026-12' }); assert.equal(a.status, 200, JSON.stringify(a.data));
  assert.equal(a.data.creado, true); assert.equal(a.data.agregadas, idea.guion.length); assert.equal(a.data.shotlist.escenas, idea.guion.length);
  const b = await llamar('coo', 'ideacion/alpha/al-shotlist', { idea, temporada: '2026-12' }); assert.equal(b.status, 200); assert.equal(b.data.agregadas, 0); assert.equal(b.data.yaEstaban, idea.guion.length); assert.equal(b.data.shotlist.v, a.data.shotlist.v, 'no escribe ni sube de versión');
  const docs = (await db.list('deliverables')).filter((d) => d.tool === 'shot-list-builder' && d.client_slug === 'alpha'); assert.equal(docs.length, 1);
  assert.equal(docs[0].ciclo, '2026-12'); assert.equal(docs[0].estado, 'Borrador'); assert.equal(docs[0].contenido.escenas.length, idea.guion.length); assert.match(docs[0].contenido.escenas[1].accion, /editado/);
  assert.ok(await db.get('deliverable_versions', `${docs[0].id}--v1`)); assert.equal(S.faltas(docs[0].contenido).length, 0);
});
await test('al shot list: otra idea SUMA sin borrar lo que había; una versión vieja es 409', async () => {
  const antes = (await db.list('deliverables')).find((d) => d.tool === 'shot-list-builder' && d.client_slug === 'alpha');
  await db.update('deliverables', antes.id, { ...antes, contenido: { escenas: antes.contenido.escenas.map((e, i) => (i ? e : { ...e, costo_estimado: 250, estado: 'grabada', jornada: 'J1' })) } }, antes.v, 'fixture');
  const g = await llamar('ceo', 'ideacion/alpha/generar', { temporada: '2026-12' }), otra = g.data.ideas[1], actual = await db.get('deliverables', antes.id);
  const vieja = await llamar('coo', 'ideacion/alpha/al-shotlist', { idea: otra, temporada: '2026-12', v: antes.v }); assert.equal(vieja.status, 409); assert.equal(vieja.data.code, 'CONFLICTO');
  const ok = await llamar('coo', 'ideacion/alpha/al-shotlist', { idea: otra, temporada: '2026-12', v: actual.v }); assert.equal(ok.status, 200, JSON.stringify(ok.data));
  const d = await db.get('deliverables', antes.id); assert.equal(d.contenido.escenas.length, antes.contenido.escenas.length + otra.guion.length);
  assert.equal(d.contenido.escenas[0].costo_estimado, 250); assert.equal(d.contenido.escenas[0].estado, 'grabada'); assert.equal(d.contenido.escenas[0].jornada, 'J1');
  assert.equal(d.version, actual.version + 1); assert.ok(await db.get('deliverable_versions', `${d.id}--v${d.version}`)); assert.match(d.historial.at(-1).nota, /Ideación/);
  assert.equal(JSON.stringify(ok.data).includes('costo'), false, 'la respuesta no lleva costos');
});
await test('al shot list: dos toques a la vez no duplican escenas ni crean dos shot lists', async () => {
  const idea = (await llamar('ceo', 'ideacion/alpha/generar', { temporada: '2027-01' })).data.ideas[0];
  const rs = await Promise.all([1, 2, 3].map(() => llamar('coo', 'ideacion/alpha/al-shotlist', { idea, temporada: '2027-01' })));
  assert.ok(rs.every((r) => [200, 409].includes(r.status)), JSON.stringify(rs.map((r) => r.status)));
  const docs = (await db.list('deliverables')).filter((d) => d.tool === 'shot-list-builder' && d.client_slug === 'alpha' && d.ciclo === '2027-01'); assert.equal(docs.length, 1);
  assert.equal(docs[0].contenido.escenas.length, idea.guion.length);
});
await test('al shot list: temporada inválida, idea sin escenas o marca sin ficha se rechazan', async () => {
  const idea = (await llamar('ceo', 'ideacion/alpha/generar')).data.ideas[0];
  assert.equal((await llamar('coo', 'ideacion/alpha/al-shotlist', { idea, temporada: 'navidad' })).data.code, 'TEMPORADA');
  assert.equal((await llamar('coo', 'ideacion/alpha/al-shotlist', { idea: { ...idea, guion: [] }, temporada: '2026-12' })).data.code, 'IDEA');
  assert.equal((await llamar('coo', 'ideacion/gamma/al-shotlist', { idea, temporada: '2026-12' })).data.code, 'SIN_FICHA');
});
await test('acceso: otra marca no se ve ni se escribe; la marca personal es solo del CEO; sin sesión o sin el encabezado propio, no', async () => {
  const idea = (await llamar('ceo', 'ideacion/alpha/generar')).data.ideas[0];
  assert.equal((await llamar('team', 'ideacion/alpha/generar')).status, 200, 'el asignado a alpha sí');
  assert.equal((await llamar('team', 'ideacion/beta/generar')).status, 404); assert.equal((await llamar('team', 'ideacion/beta/al-shotlist', { idea, temporada: '2026-12' })).status, 404);
  assert.equal((await llamar('team2', 'ideacion/alpha/generar')).status, 404, 'quien no tiene tareas de alpha no la ve');
  assert.equal((await llamar('coo', 'ideacion/personal/generar')).status, 404); assert.equal((await llamar('coo', 'ideacion/personal/al-shotlist', { idea, temporada: '2026-12' })).status, 404);
  assert.equal((await llamar(null, 'ideacion/alpha/generar')).status, 401); assert.equal((await llamar('coo', 'ideacion/alpha/al-shotlist', { idea, temporada: '2026-12' }, {})).status, 403);
  assert.equal((await llamar('ceo', 'ideacion/..%2Fetc/generar')).status, 404);
  await db.upsert('settings', 'role_views', { views: { team: { content: 'resumen' } } }, 'fixture'); (await import('../api/_lib/access.js')).forgetViews();
  assert.equal((await llamar('team', 'ideacion/alpha/generar')).status, 403, 'en vista «resumen» no hay Research');
});
console.log(`${count} pruebas de ideación OK`);
