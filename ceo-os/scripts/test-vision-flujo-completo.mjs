// Flujo completo de punta a punta (servidor, PGlite temporal, sin red ni envíos reales: adaptadores falsos).
// Ideación → shot list → hilo · aprobación → Decide → revisión de descendientes · Contexto vivo → tarea · Lead Engine → envío aprobado ·
// candados (cliente del portal y rol sin Finance) · Canales (lo sensible nunca por Telegram).
// Si un eslabón NO está conectado de verdad se marca «no conectado» y se lista al final: nunca se pasa en falso. node scripts/test-vision-flujo-completo.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-flujo-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
for (const k of ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET', 'CANALES_SECRETO', 'WHATSAPP_TOKEN']) delete process.env[k];
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
process.env.SESSION_SECRET = 'vision-test-only-secret-01234567890123456789'; process.env.ADMIN_EMAILS = 'ceo@inherentglobal.com'; process.env.APP_URL = 'https://os.example';
const db = await import('../api/_lib/db.js'), session = await import('../api/_lib/session.js'), api = (await import('../api/index.js')).default;
const E = await import('../api/_lib/lead-engine.js'), C = await import('../api/_lib/canales.js'), M = await import('../public/js/canales/mensajeria.js');
let count = 0; const noConectado = [];
const test = async (n, fn) => { await fn(); console.log('✓', n); count++; };
const marcar = (eslabon, razon) => { noConectado.push(`${eslabon}: ${razon}`); console.log('○ NO CONECTADO ·', eslabon, '—', razon); };

// ---------- Utilidades ----------
const email = (r) => `${r}@inherentglobal.com`;
const correoFalso = { calls: [], async enviar(x) { this.calls.push(x); return { id: `m-${this.calls.length}` }; } };
const lead = []; E.rutas((method, pattern, fn) => lead.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn }), {
  redactor: async (p) => { const e = /empresa: ([^\n]+)/.exec(p.user)?.[1] || ''; return `Asunto: Una idea para ${e}\n\nHola,\n\nVi que ${e} en Guatemala está contratando. En un caso parecido, Casa Verde pasó de 40 a 55 reservas al mes. ¿Te cuento cómo?\n\nAna Pérez`; },
  correo: correoFalso, ahora: () => T, remitente: { nombre: 'Ana Pérez', cargo: 'CEO', empresa: 'Inherent', email: 'ana@inherent.example' }, config: { calentados: [] } });
const T = Date.UTC(2026, 10, 24, 15, 0, 0); // martes 09:00 Guatemala
async function req(who, route, method = 'GET', b = {}, headers = { 'x-ceoos': '1' }) {
  const h = { host: 'localhost', ...headers }, jar = new Map(), res = { statusCode: 200, getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; }, writeHead(n) { this.statusCode = n; return this; }, write() {}, end() {} };
  const q = { url: `/api/${route}`, method, headers: h, body: b, query: Object.fromEntries(new URL(`http://x/${route}`).searchParams), params: {} };
  if (who) { session.issue(q, res, { email: who.includes('@') ? who : email(who) }); h.cookie = jar.get('Set-Cookie').split(';')[0]; }
  const path_ = route.split('?')[0], hit = headers.__real ? null : lead.find((x) => x.method === method && x.re.test(path_));
  if (hit) { q.params = { ...hit.re.exec(path_).groups }; await hit.fn(q, res); } else await api(q, res);
  return { status: res.statusCode, data: res.data };
}
const ficha = (slug, filas = '') => { const d = path.join(process.env.LOCAL_REPO, `clients/${slug}/00-onboarding`); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'plan-contratado.md'), `# Ficha — ${slug}\n\n| Campo | Valor |\n|---|---|\n| Plan | Brand Growth |\n${filas}\n## Qué incluye\n\n| Entregable | Cantidad |\n|---|---|\n| Volumen | 2 piezas |\n`); };

// ---------- Datos sintéticos ----------
ficha('alpha', '| Redes | Instagram, TikTok |'); ficha('beta');
for (const [r, role, roles] of [['ceo', 'ceo', ['ceo']], ['coo', 'coo', ['coo']], ['ventas', 'team', ['ventas']], ['ops', 'team', ['content']], ['nada', 'team', ['design']]]) await db.create('team', { role, roles, active: true }, 'fixture', email(r));
await db.create('team', { role: 'client', client_slug: 'alpha', external: true, active: true }, 'fixture', 'cliente@alpha.com');
await db.create('settings', { views: { coo: { content: 'edita', sales: 'edita', work: 'edita', clients: 'edita' }, ventas: { sales: 'edita' }, content: { content: 'edita' } }, scope: { ventas: 'asignados', content: 'asignados' } }, 'fixture', 'role_views');
await db.create('projects', { name: 'Alpha', client_slug: 'alpha', people: [email('ventas'), email('ops')] }, 'fixture', 'p-alpha');
await db.create('brand_boards', { dna: { voz: { tono: ['cercana', 'directa', 'clara'], si: ['café de origen'], no: ['gratis'] }, personalidad: [{ eje: 'humor', valor: 6 }, { eje: 'cercania', valor: 8 }], territorio: { territorio: 'x', arquetipo: 'y', es: ['cercana'], no_es: ['el café industrial sin historia'] } } }, 'fixture', 'alpha');
await db.create('sources', { profile: 'alpha', pillars: [{ name: 'Educación del café', color: '#111' }], audience: { exacto: 'dueños de cafeterías', nicho: '', general: '' } }, 'fixture', 'cfg-alpha');
const ig = (code, o = {}) => ({ url: `https://www.instagram.com/reel/${code}/`, red: 'instagram', format: 'reel', ...o });
await db.create('content', { kind: 'research', profile: 'alpha', source: 'apify', ...ig('FLU1AAAAAAA', { handle: 'chica', x: 3.5, base: 10, text: '3 errores que dueños de cafeterías cometen con el café', dur: 20 }) }, 'fixture', 'rs-alpha-1');
await db.create('avatars', { profile: 'alpha', estado: 'aprobado', nombre: 'ICP' }, 'fixture');

let shot, idea;
// ================= (a) Ideación → shot list → hilo =================
await test('(a) Ideación genera ideas y «al shot list» crea el entregable shot-list-builder del ciclo; GET /api/hilo lo muestra', async () => {
  const g = await req('ceo', 'ideacion/alpha/generar', 'POST', { temporada: '2026-12' }); assert.equal(g.status, 200, JSON.stringify(g.data)); assert.ok(g.data.ideas.length >= 1);
  idea = g.data.ideas[0];
  const a = await req('coo', 'ideacion/alpha/al-shotlist', 'POST', { idea, temporada: '2026-12' }); assert.equal(a.status, 200, JSON.stringify(a.data)); assert.equal(a.data.creado, true);
  shot = (await db.list('deliverables')).find((d) => d.tool === 'shot-list-builder' && d.client_slug === 'alpha' && d.ciclo === '2026-12'); assert.ok(shot, 'el shot list existe');
  assert.equal(shot.estado, 'Borrador'); assert.equal(shot.contenido.escenas.length, idea.guion.length);
  const h = await req('ceo', 'hilo?slug=alpha'); assert.equal(h.status, 200); assert.ok(h.data.nodes.some((n) => n.id === shot.id), 'el hilo muestra el shot list');
  assert.equal('contenido' in h.data.nodes[0], false, 'el hilo no lleva contenido');
  if (g.data.capacidad?.scraping === false) marcar('Ideación · scraping de referentes', 'las ideas salen del Research ya guardado; no hay scraping conectado');
});

// ================= (b) Aprobación → Decide → descendientes =================
await test('(b) el shot list pasa a revisión, aparece en Decide, se aprueba con la versión leída y deja de aparecer', async () => {
  const r = await req('ceo', `entregables/${shot.id}/estado`, 'POST', { a: 'En revisión', v: shot.v }); assert.equal(r.status, 200, JSON.stringify(r.data));
  const d1 = await req('ceo', 'decide'); const item = d1.data.items.find((x) => x.id === shot.id); assert.ok(item, 'Decide lo ve');
  const ok = await req('ceo', `entregables/${shot.id}/estado`, 'POST', { a: 'Aprobado', v: item.v });
  assert.equal(ok.status, 200, JSON.stringify(ok.data)); assert.equal(ok.data.estado ?? ok.data.doc?.estado, 'Aprobado');
  assert.equal((await req('ceo', 'decide')).data.items.some((x) => x.id === shot.id), false, 'Decide ya no lo ve');
  shot = await db.get('deliverables', shot.id);
});
await test('(b) marcar una escena «grabada» no devuelve a Borrador el shot list aprobado; cambiar la acción sí', async () => {
  const esc = shot.contenido.escenas.map((e, i) => (i ? e : { ...e, estado: 'grabada' }));
  const r = await req('ceo', `entregables/${shot.id}`, 'PUT', { contenido: { escenas: esc }, v: shot.v }); assert.equal(r.status, 200, JSON.stringify(r.data));
  const cur = await db.get('deliverables', shot.id); assert.equal(cur.estado, 'Aprobado'); assert.equal(cur.version, shot.version); assert.equal(cur.contenido.escenas[0].estado, 'grabada'); assert.ok(cur.aprobado);
  const cambia = await req('ceo', `entregables/${shot.id}`, 'PUT', { contenido: { escenas: esc.map((e, i) => (i ? e : { ...e, accion: `${e.accion} (otra)` })) }, v: cur.v }); assert.equal(cambia.status, 200);
  const nuevo = await db.get('deliverables', shot.id); assert.equal(nuevo.estado, 'Borrador'); assert.equal(nuevo.version, shot.version + 1); assert.equal(nuevo.aprobado, null);
});
await test('(b) editar un ancestro marca a revisar a sus descendientes, con la razón', async () => {
  const base = { client_slug: 'alpha', version: 1, aprobado: { version: 1 }, historial: [], criterios: { cumple: [], falta: [] }, contenido: {}, ia: { via: 'manual', modelo: '' } };
  const icp = await db.create('deliverables', { ...base, tool: 'customer-bullseye', ws: 'strategy', pestana: 'research', titulo: 'ICP', estado: 'Aprobado', entradas: [] }, 'fixture');
  const hijo = await db.create('deliverables', { ...base, tool: 'moodboard-studio', ws: 'creative', pestana: 'concepts', titulo: 'Moodboard', estado: 'Aprobado', entradas: [{ deliverable_id: icp.id, version: 1, tool: 'customer-bullseye' }] }, 'fixture');
  const sano = (await req('ceo', 'hilo?slug=alpha')).data.nodes.find((n) => n.id === hijo.id); assert.equal(sano.revisar, false);
  await db.update('deliverables', icp.id, { ...icp, version: 2, estado: 'Aprobado', aprobado: { version: 2 }, contenido: { cambio: 'sí' } }, icp.v, 'fixture');
  const n = (await req('ceo', 'hilo?slug=alpha')).data.nodes.find((x) => x.id === hijo.id); assert.equal(n.revisar, true); assert.match(n.razon, /v1 → v2/);
});

// ================= (c) Contexto vivo → tarea =================
await test('(c) transcripción → compromiso con cita (hipótesis) → aceptar → existe la tarea', async () => {
  const texto = '[00:00:05] Ana Pérez: Hola Luis.\n[00:00:12] Luis Gómez: Con gusto. Te mando la propuesta el viernes.';
  const t = await req('coo', 'contexto/alpha/transcripcion', 'POST', { texto, fecha: '2026-11-26', participantes: ['Ana Pérez', 'Luis Gómez'], origen: 'reunion', titulo: 'Kickoff' });
  assert.equal(t.status, 200, JSON.stringify(t.data)); const c = t.data.compromisos.find((x) => /propuesta/.test(x.cita)); assert.ok(c); assert.equal(c.estado, 'hipotesis'); assert.ok(texto.includes(c.cita));
  const a = await req('coo', `contexto/compromisos/${c.id}/aceptar`, 'POST', { v: c.v }); assert.equal(a.status, 200);
  const tarea = await db.get('tasks', a.data.tarea_id); assert.ok(tarea); assert.equal(tarea.client_slug, 'alpha'); assert.ok(tarea.description.includes(c.cita));
  if (t.data.conector?.conectado === false) marcar('Contexto vivo · conector de reuniones', 'la transcripción se pega a mano; no hay Zoom/Meet/Granola conectado');
});

// ================= (d) Lead Engine =================
await test('(d) ICP aprobado → lote → redactar → solicitar-envío → OK del CEO → el correo recibe SOLO lo aprobado, con tope; editar invalida el OK', async () => {
  const f = (company) => ({ name: company, contact: 'Ana Ruiz', company, email: `ana@${company.toLowerCase().replace(/\W/g, '')}.gt`, enrich: { industry: 'Restaurante', size: 20, location: 'Guatemala', signals: ['contratando'], contact_role: 'Dueña', email_verificado: true } });
  const icp = { industrias: ['restaurante'], tamano: { min: 5, max: 200 }, ubicaciones: ['Guatemala'], senales: ['contratando'] }, contexto = { oferta: 'Estrategia de crecimiento mensual', caso: { titulo: 'Casa Verde', resultado: 'pasó de 40 a 55 reservas al mes' }, marca: { nombre: 'Inherent' } };
  const l = await req('coo', 'revenue/lotes', 'POST', { slug: 'alpha', icp, leads: ['Uno SA', 'Dos SA', 'Tres SA', 'Cuatro SA', 'Cinco SA'].map(f) }); assert.equal(l.status, 200);
  assert.equal((await req('coo', 'revenue/lotes', 'POST', { slug: 'beta', icp, leads: [f('X')] })).data.code, 'SIN_ICP', 'sin ICP aprobado no corre');
  const rd = await req('coo', `revenue/lotes/${l.data.id}/redactar`, 'POST', { contexto }); assert.equal(rd.status, 200); assert.equal(rd.data.resumen.validos, 5);
  const s = await req('coo', `revenue/lotes/${l.data.id}/solicitar-envio`, 'POST'); assert.equal(s.status, 200); assert.equal(s.data.estado, 'esperando_aprobacion');
  assert.equal(correoFalso.calls.length, 0, 'antes del OK no sale nada');
  // edición invalida el OK
  const it = rd.data.items[0], ed = await req('coo', `revenue/lotes/${l.data.id}/borradores/${it.i}`, 'PUT', { cuerpo: it.borrador.cuerpo.replace('Hola,', 'Hola Ana,') });
  assert.equal(ed.data.ok_invalidado, true); assert.equal((await req('ceo', `revenue/lotes/${l.data.id}/aprobar`, 'POST', { hash: s.data.hash, v: s.data.v })).status, 409, 'el hash viejo ya no aprueba');
  const s2 = (await req('coo', `revenue/lotes/${l.data.id}/solicitar-envio`, 'POST')).data;
  assert.equal((await req('ventas', `revenue/lotes/${l.data.id}/aprobar`, 'POST', { hash: s2.hash, v: s2.v })).status, 403, 'ventas no aprueba');
  const ok = await req('ceo', `revenue/lotes/${l.data.id}/aprobar`, 'POST', { hash: s2.hash, v: s2.v }); assert.equal(ok.status, 200, JSON.stringify(ok.data));
  assert.equal(ok.data.resultado.enviados, 3, 'tope de 3 por hora sin calentar'); assert.equal(ok.data.resultado.en_cola, 2);
  assert.equal(correoFalso.calls.length, 3, 'el correo falso recibió solo lo aprobado y con tope');
  const llaves = correoFalso.calls.map((c) => c.llave); assert.equal(new Set(llaves).size, 3); assert.ok(correoFalso.calls.every((c) => /@\w+\.gt$/.test(c.para)));
});
// Lo que NO está conectado de verdad: la ruta real (sin adaptadores inyectados) lo dice.
await test('(d) en el API real el redactor y el correo dicen «disconnected» y nada sale', async () => {
  const r = await req('coo', 'revenue/lotes', 'GET', {}, { 'x-ceoos': '1', __real: '1' }); assert.equal(r.status, 200);
  for (const k of ['redactor', 'correo']) { assert.equal(r.data[k].estado, 'disconnected'); marcar(`Lead Engine · ${k}`, r.data[k].razon || 'sin conectar'); }
  marcar('Lead Engine · scraping de leads', 'los prospectos se cargan a mano o por CSV; no hay scraping conectado');
});

// ================= (e) Candados =================
await test('(e) un cliente del portal y un rol sin áreas no ven nada de lo anterior (403/404)', async () => {
  const rutas = [['GET', 'hilo?slug=alpha'], ['GET', 'decide'], ['POST', 'ideacion/alpha/generar'], ['GET', 'contexto/alpha/memoria'], ['GET', 'revenue/lotes'], ['GET', 'workflow-runs'], ['GET', `entregables/${shot.id}`]];
  for (const quien of ['cliente@alpha.com', 'nada']) for (const [m, r] of rutas) { const x = await req(quien, r, m, {}, { 'x-ceoos': '1', __real: '1' }); if (r === 'workflow-runs' && x.status === 200) { assert.deepEqual(x.data.corridas, [], 'quien ve Operaciones solo ve sus corridas: ninguna'); continue; } assert.ok([401, 403, 404].includes(x.status), `${quien} ${m} ${r} → ${x.status}`); assert.doesNotMatch(JSON.stringify(x.data || {}), /Moodboard|Kickoff|Uno SA|propuesta/); }
  const sinFinance = await req('coo', 'db/finance', 'GET', {}, { 'x-ceoos': '1', __real: '1' }); assert.ok([403, 404].includes(sinFinance.status), 'Finance es solo CEO');
});
await test('(e) lo que ve el cliente (enlace de aprobación y su portal) no trae costos ni horas', async () => {
  await db.update('deliverables', shot.id, { ...(await db.get('deliverables', shot.id)), contenido: { escenas: [{ id: 'PR-001', id_creativo: 'C-1', escena: 'E', accion: 'x', costo_estimado: 999, horas: 8 }] }, estado: 'Aprobado', aprobado: { version: (await db.get('deliverables', shot.id)).version } }, (await db.get('deliverables', shot.id)).v, 'fixture');
  const en = await req('ceo', `entregables/${shot.id}/enlace`, 'POST', {}); assert.equal(en.status, 200, JSON.stringify(en.data));
  const token = en.data.token || String(en.data.url || en.data.enlace || '').split(/[#/=]/).pop(); assert.ok(token);
  const v = await req(null, 'portal/aprobacion/ver', 'POST', { token }); assert.equal(v.status, 200, JSON.stringify(v.data));
  assert.deepEqual(Object.keys(v.data).sort(), ['acciones', 'expira', 'herramienta', 'marca', 'titulo', 'version']);
  assert.doesNotMatch(JSON.stringify(v.data), /costo|margen|horas|999|presupuesto/i);
  const p = await req('cliente@alpha.com', 'portal/videos', 'GET', {}, { 'x-ceoos': '1', __real: '1' }); if (p.status === 200) assert.doesNotMatch(JSON.stringify(p.data), /costo|margen|horas|presupuesto/i);
});

// ================= (f) Canales =================
await test('(f) una decisión sensible nunca viaja por Telegram con botón de aprobar: solo «Abrir en el OS»', async () => {
  const sent = []; Object.assign(process.env, { TELEGRAM_BOT_TOKEN: 'tok-falso', TELEGRAM_WEBHOOK_SECRET: 'wh-falso', CANALES_SECRETO: 'cs-falso-123' });
  C.configurar({ enviarMensaje: async (m) => { sent.push(m); return { ok: true }; }, log: () => {} }); C.reiniciar();
  const v = await req('ceo', 'canales/vincular', 'POST', { canal: 'telegram' }); assert.equal(v.status, 200);
  const hook = (b) => req(null, 'canales/telegram/webhook', 'POST', b, { 'x-ceoos': '1', 'x-telegram-bot-api-secret-token': 'wh-falso' });
  await hook({ update_id: 1, message: { message_id: 1, from: { id: 111 }, chat: { id: 111, type: 'private' }, text: `/vincular ${v.data.codigo}` } });
  const base = { client_slug: 'alpha', version: 1, aprobado: null, entradas: [], historial: [], criterios: { cumple: [], falta: [] }, contenido: {}, ia: { via: 'manual', modelo: '' }, estado: 'En revisión' };
  const pauta = await db.create('deliverables', { ...base, tool: 'ads-intelligence', ws: 'marketing', pestana: 'campaigns', titulo: 'Plan de pauta de diciembre' }, 'fixture');
  const normal = await db.create('deliverables', { ...base, tool: 'moodboard-studio', ws: 'creative', pestana: 'concepts', titulo: 'Moodboard normal' }, 'fixture');
  sent.length = 0; await C.enviarDecision(email('ceo'), pauta); await C.enviarDecision(email('ceo'), normal);
  const t = sent.filter((m) => !m.ack); const sens = t.find((m) => /Plan de pauta/.test(m.texto)), nor = t.find((m) => /Moodboard normal/.test(m.texto));
  assert.ok(sens && nor, JSON.stringify(t.map((m) => m.texto)));
  assert.deepEqual(sens.botones.map((b) => b.id), ['abrir'], 'lo sensible solo trae «Abrir en el OS»'); assert.ok(nor.botones.some((b) => b.id === 'aprobar'), 'lo normal sí puede aprobarse');
  sent.length = 0; await hook({ update_id: 2, callback_query: { id: 'cb', from: { id: 111 }, data: M.firmarCallback({ accion: 'aprobar', id: pauta.id, v: pauta.v }, '111', 'cs-falso-123'), message: { message_id: 5, chat: { id: 111, type: 'private' } } } });
  assert.match(sent.filter((m) => !m.ack).map((m) => m.texto).join(' '), /se decide en el OS/); assert.equal((await db.get('deliverables', pauta.id)).estado, 'En revisión');
});
// El bot real tampoco está conectado en un entorno sin token.
await test('(f) sin token el canal real dice «disconnected»', async () => {
  delete process.env.TELEGRAM_BOT_TOKEN; const cap = C.adaptadores.telegram.capability(); assert.equal(cap.estado, 'disconnected');
  marcar('Canales · bot de Telegram', 'falta crear el bot con BotFather y poner su token en el entorno');
});
marcar('Agentes · modelo que ejecuta (declarado, no sondeado)', 'ningún modelo está conectado al ejecutor de agentes; las corridas son simuladas');
marcar('Presentación · enlaces a Drive (declarado, no sondeado)', 'el material vive en Drive pero el enlace por pieza aún no está conectado');

console.log(`\n${count} eslabones verificados · ${noConectado.length} NO conectados (no se pasan en falso):`);
for (const x of noConectado) console.log('  ○', x);
process.exit(0);
