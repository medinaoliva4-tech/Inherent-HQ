// Avisos · La plataforma: cada regla de plataforma.js con datos armados y el día fijo (que sale, que no sale cuando el dato
// está bien y quién la ve), lo de tu compu que se decide en avisos-reglas/compu.js (el puente, la app de Mac y los avisos
// bloqueados en este dispositivo) y el cálculo del Arranque (arranque.js), que comparten la pantalla y el aviso.
// Puro: no toca la base, ni la red, ni el navegador. Uso: node scripts/test-avisos-plataforma.mjs
import assert from 'node:assert/strict';
import { personaDe, correr } from '../public/js/avisos-reglas/base.js';
import { PLATAFORMA, PEDIDO_LAYA, subOk } from '../public/js/avisos-reglas/plataforma.js';
import { usosPuente, avisoPuente, avisoAppMac, avisoCelularAqui, mayor } from '../public/js/avisos-reglas/compu.js';
import { SOPS, tituloSop, filasEquipo, hechosArranque } from '../public/js/arranque.js';
import { INSTALAR_MAC, INSTALAR_WIN, APP_MAC } from '../public/js/laya.js';
import { PASOS_COPIA_VIEJA } from '../public/js/puente-chat.js';

let n = 0;
const t = (nombre, fn) => { fn(); n++; console.log('✓', nombre); };
const vacio = { tasks: [], projects: [], team: [], leads: [], quotes: [], invoices: [], accounts: [], content: [], campaigns: [], mentors: [], strategy: [], plans: [], campanas: [], ad_variants: [], judgments: [], clientes: [], yo: {}, settings: {}, guias: [], env: null, push: { listo: false } };
const datos = (o = {}) => ({ ...vacio, ...o });
const HOY = '2026-10-26';
const regla = (id) => PLATAFORMA.find((r) => r.id === id) || assert.fail('falta la regla ' + id);
const corre = (id, d, p = CEO, hoy = HOY) => { const r = correr([regla(id)], datos(d), p, hoy); assert.deepEqual(r.errores, [], id); return r.items; };

// Las personas (como las arma el servidor: rol, áreas y niveles de su perfil).
const CEO = personaDe({ email: 'ceo@x.com', nombre: 'Dirección General', role: 'ceo' });
const COO = personaDe({ email: 'coo@x.com', role: 'coo', areas: ['home', 'control', 'clients', 'sales', 'operations', 'work', 'content', 'estrategia', 'resultados', 'library', 'team'] });
const ANA = personaDe({ email: 'ana@x.com', role: 'team', areas: ['home', 'work', 'content', 'library', 'team'] });
const VENTAS = personaDe({ email: 'ven@x.com', role: 'team', areas: ['home', 'work', 'sales', 'team'] });
const CLIENTE = personaDe({ email: 'cli@nao.com', role: 'client', areas: ['portal'] });
const TODOS = [CEO, COO, ANA, VENTAS, CLIENTE];
const yoDe = (p, o = {}) => ({ id: p.email, email: p.email, ...o });
const SUB = { endpoint: 'https://push.example.com/abc', keys: { p256dh: 'p', auth: 'a' } };
// Una persona con todo listo: Google, el celular, la IA conectada, los videos vistos y su primer día.
const listo = (p, o = {}) => yoDe(p, { google: { calendar: true, drive: true, gmail: true }, push: [SUB], mcp_hash: 'h', vistos: { g1: '2026-10-01' }, roles: ['content'], primer_dia: { hecho_at: '2026-10-01' }, ...o });

// ---------- Con todo vacío o todo bien, nada ----------
t('con todo vacío, ninguna regla de la plataforma falla ni avisa (para ninguna persona)', () => {
  for (const p of TODOS) { const r = correr(PLATAFORMA, datos({ yo: { primer_dia: { hecho_at: '2026-01-01' } } }), p, HOY); assert.deepEqual(r.errores, []); assert.deepEqual(r.items, [], p.role); }
});

const SLOTS = [{ slot: 'CEO', hoy: 'Dirección General' }, { slot: 'COO', hoy: 'Operaciones Uno' }, { slot: 'Editor de video', hoy: 'Luis Video' }, { slot: 'Secretaria', hoy: 'Recepción — agente `00-account`' }, { slot: 'IA', hoy: 'Claude' }, { slot: 'Diseño', hoy: 'Figma' }];
const EQUIPO = [
  { id: 'ceo@x.com', email: 'ceo@x.com', name: 'Dirección General', role: 'ceo', last_login: '2026-10-25', primer_dia: { hecho_at: '2026-10-01' }, google: { calendar: true, drive: true } },
  { id: 'coo@x.com', email: 'coo@x.com', name: 'Operaciones Uno', role: 'coo', last_login: '2026-10-25', primer_dia: { hecho_at: '2026-10-02' }, google: { calendar: true, drive: true } },
  { id: 'luis@x.com', email: 'luis@x.com', name: 'Luis Video', role: 'team', roles: ['video'], last_login: '2026-10-20', primer_dia: { hecho_at: '2026-10-03' }, google: { calendar: true, drive: true } },
];
const DOCS = SOPS.map((s, i) => ({ id: 'd' + i, title: tituloSop(s) }));
const NAO = { slug: 'nao', nombre: 'NAO', ficha: { hay: true, nivel: { id: 'growth' } } };
const bien = (p) => datos({
  yo: listo(p), tieneGoogle: true, push: { listo: true }, env: p.esCeo ? { push: true, cron: true, github: true, portal: true } : null,
  settings: { drive: p.esCeo ? { id: 'drive', root: 'https://drive.google.com/drive/folders/abcdefghijklmnopqrstu' } : null, brief_open: null },
  slots: p.esCeo ? SLOTS : null, docs: p.esCeo ? DOCS : null, team: EQUIPO, clientes: [{ slug: 'inherent', nombre: 'Inherent', ficha: { hay: true } }, NAO],
  projects: [{ id: 'pr1', client_slug: 'nao', cycle: '2026-10' }], tasks: [{ id: 't1', cycle: '2026-10', status: 'Por empezar' }],
  guias: [{ id: 'g1', title: 'Mis tareas', guia: 'hoy', roles: [] }], judgments: [{ id: 'j9', status: 'hecho', gate: 'lead' }],
});
t('con todo bien, ninguna regla de la plataforma avisa (para ninguna persona)', () => {
  for (const p of TODOS) { const r = correr(PLATAFORMA, bien(p), p, HOY); assert.deepEqual(r.errores, []); assert.deepEqual(r.items.map((x) => x.id), [], p.role); }
});

// ---------- pla-google ----------
t('pla-google: el permiso que falta, alta, con «Conectar Google»; el cliente y el externo no lo ven', () => {
  const [x] = corre('pla-google', { yo: listo(ANA, { google: { calendar: false, drive: true } }), tieneGoogle: true }, ANA);
  assert.equal(x.titulo, 'Tu Google no tiene permiso de Calendar'); assert.equal(x.urgencia, 'alta');
  assert.match(x.detalle, /no agenda en tu Calendar/); assert.deepEqual(x.accion, { label: 'Conectar Google', href: '/api/auth/google' });
  assert.equal(corre('pla-google', { yo: listo(ANA, { google: { calendar: false, drive: false } }), tieneGoogle: true }, ANA)[0].titulo, 'Tu Google no tiene permiso de Calendar y Drive');
  const [llave] = corre('pla-google', { yo: listo(ANA), tieneGoogle: false }, ANA);
  assert.equal(llave.titulo, 'Conecta tu Google otra vez: el OS no llega a tu Drive ni a tu Calendar'); assert.equal(llave.huella, 'llave');
  assert.deepEqual(corre('pla-google', { yo: listo(ANA), tieneGoogle: true }, ANA), [], 'con todo, no sale');
  assert.deepEqual(corre('pla-google', { yo: listo(ANA, { external: true, google: { calendar: false } }), tieneGoogle: false }, ANA), [], 'un externo no guarda llave: no se le avisa');
  assert.deepEqual(corre('pla-google', { yo: listo(CLIENTE, { google: { calendar: false } }), tieneGoogle: false }, CLIENTE), [], 'el cliente no lo ve');
});
t('pla-google: Gmail solo cuenta para el CEO y el COO; si es lo único que falta, media', () => {
  const sinGmail = (p) => ({ yo: listo(p, { google: { calendar: true, drive: true, gmail: false } }), tieneGoogle: true });
  const [x] = corre('pla-google', sinGmail(CEO));
  assert.equal(x.urgencia, 'media'); assert.equal(x.titulo, 'Falta el permiso de Gmail: la bienvenida al cliente no sale de tu correo'); assert.equal(x.huella, 'gmail');
  assert.equal(corre('pla-google', sinGmail(COO), COO).length, 1);
  assert.deepEqual(corre('pla-google', sinGmail(ANA), ANA), [], 'al resto del equipo Gmail no le hace falta');
  const [y] = corre('pla-google', { yo: listo(COO, { google: { calendar: false, drive: true, gmail: false } }), tieneGoogle: true }, COO);
  assert.equal(y.titulo, 'Tu Google no tiene permiso de Calendar y Gmail'); assert.equal(y.urgencia, 'alta'); assert.match(y.detalle, /bienvenida al cliente no sale de tu Gmail/);
});

// ---------- pla-avisos-celular (servidor y este dispositivo) ----------
t('pla-avisos-celular: sin ningún dispositivo con avisos; media para Ventas, baja para el resto; no sin las claves', () => {
  const d = (p, push = []) => ({ yo: listo(p, { push }), push: { listo: true } });
  const [v] = corre('pla-avisos-celular', d(VENTAS), VENTAS);
  assert.equal(v.urgencia, 'media'); assert.equal(v.titulo, 'No tienes avisos en el celular: un lead nuevo no te llega'); assert.deepEqual(v.accion, { label: 'Activar en tu celular', href: '#/me' });
  assert.equal(corre('pla-avisos-celular', d(ANA), ANA)[0].urgencia, 'baja');
  assert.equal(corre('pla-avisos-celular', d(CEO))[0].urgencia, 'media', 'el CEO ve Ventas');
  assert.deepEqual(corre('pla-avisos-celular', d(VENTAS, [SUB]), VENTAS), [], 'con un dispositivo, no sale');
  assert.equal(corre('pla-avisos-celular', d(VENTAS, [{ endpoint: 'http://x', keys: {} }]), VENTAS).length, 1, 'una suscripción rota no cuenta');
  assert.deepEqual(corre('pla-avisos-celular', { yo: listo(VENTAS, { push: [] }), push: { listo: false } }, VENTAS), [], 'sin las claves VAPID no se puede activar: eso va en pla-servidor-claves');
  assert.ok(subOk(SUB) && !subOk({ endpoint: 'https://x' }));
});
t('pla-avisos-celular en este dispositivo: solo si aquí están bloqueados y sí hay otro dispositivo (si no, ya sale el del servidor)', () => {
  const e = { soporta: true, permiso: 'denied', servidor: true, dispositivos: 1 };
  const [x] = avisoCelularAqui(e);
  assert.equal(x.clave, 'pla-avisos-celular:este'); assert.equal(x.grupo, 'plataforma'); assert.equal(x.urgencia, 'baja'); assert.equal(x.accion.href, '#/me');
  assert.deepEqual(avisoCelularAqui({ ...e, dispositivos: 0 }), [], 'sin dispositivos avisa el servidor: no dos veces');
  assert.deepEqual(avisoCelularAqui({ ...e, permiso: 'granted' }), []);
  assert.deepEqual(avisoCelularAqui({ ...e, servidor: false }), [], 'sin claves en el servidor, no hay avisos que bloquear');
  assert.deepEqual(avisoCelularAqui({ ...e, soporta: false }), [], 'un navegador sin avisos no está «bloqueado»');
});

// ---------- pla-mcp y pla-videos ----------
t('pla-mcp: mientras no conectes ninguna IA, baja, con «Conectar»', () => {
  const [x] = corre('pla-mcp', { yo: yoDe(ANA) }, ANA);
  assert.equal(x.urgencia, 'baja'); assert.equal(x.titulo, 'Conecta tu IA a Inherent OS'); assert.deepEqual(x.accion, { label: 'Conectar', abre: 'conectar' });
  assert.deepEqual(corre('pla-mcp', { yo: yoDe(ANA, { mcp_hash: 'h' }) }, ANA), []);
  assert.deepEqual(corre('pla-mcp', { yo: yoDe(ANA, { mcp_grants: [{ g: 'x', name: 'Claude' }] }) }, ANA), []);
  assert.deepEqual(corre('pla-mcp', { yo: yoDe(CLIENTE) }, CLIENTE), [], 'el cliente no');
});
t('pla-videos: los de tu puesto que no has visto, con el siguiente; el CEO ve todos', () => {
  const guias = [{ id: 'g1', title: 'Mis tareas', guia: 'hoy', roles: [] }, { id: 'g2', title: 'El Design system', guia: 'design', roles: ['content'] }, { id: 'g3', title: 'Editar video', guia: 'video', roles: ['video'] }];
  const [x] = corre('pla-videos', { guias, yo: yoDe(ANA, { roles: ['content'], vistos: { g1: '2026-10-01' } }) }, ANA);
  assert.equal(x.titulo, 'Te falta 1 video de «Cómo se usa» de tu puesto'); assert.equal(x.detalle, 'El siguiente: «El Design system» · Marca · Design system.');
  assert.equal(x.urgencia, 'baja'); assert.equal(x.accion.abre, 'guia'); assert.equal(x.accion2.href, '#/me'); assert.equal(x.huella, 'g2');
  assert.equal(corre('pla-videos', { guias, yo: yoDe(CEO) })[0].titulo, 'Te faltan 3 videos de «Cómo se usa» de tu puesto');
  assert.deepEqual(corre('pla-videos', { guias, yo: yoDe(ANA, { roles: ['content'], vistos: { g1: 1, g2: 1 } }) }, ANA), [], 'todo visto');
});

// ---------- pla-servidor-claves ----------
t('pla-servidor-claves: solo al CEO, solo los nombres de lo que falta, nunca un valor, sin botón', () => {
  const [x] = corre('pla-servidor-claves', { env: { push: false, cron: false, github: true, portal: true, VAPID_PRIVATE_KEY: 'shh-no-sale' } });
  assert.equal(x.titulo, 'Al servidor le faltan claves: los avisos al celular y el cron no funcionan'); assert.equal(x.urgencia, 'alta');
  assert.match(x.detalle, /^En Vercel → Settings → Environment Variables: VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY \(los avisos al celular\) · CRON_SECRET/);
  assert.ok(!JSON.stringify(x).includes('shh-no-sale')); assert.equal(x.accion, null); assert.equal(x.huella, 'push,cron');
  assert.equal(corre('pla-servidor-claves', { env: { push: true, cron: true, github: false, portal: true } })[0].titulo, 'Al servidor le faltan claves: escribir en el repo no funciona');
  assert.deepEqual(corre('pla-servidor-claves', { env: { push: true, cron: true, github: true, portal: true } }), []);
  for (const p of [COO, ANA, VENTAS]) assert.deepEqual(corre('pla-servidor-claves', { env: { push: false } }, p), [], 'solo el CEO');
});

// ---------- pla-arranque y el Arranque ----------
t('arranque.js: las personas del manual con su perfil y los 5 pasos (lo mismo que pinta el Arranque)', () => {
  const rows = filasEquipo(SLOTS, EQUIPO.slice(0, 2), { email: 'ceo@x.com', name: 'Dirección General' });
  assert.deepEqual(rows.map((r) => [r.name, Boolean(r.cur), r.ia]), [['Dirección General', true, false], ['Operaciones Uno', true, false], ['Luis Video', false, false], ['Recepción', false, true]], 'IA, Diseño y Scraping no son personas; «agente» es un agente IA');
  assert.deepEqual(rows[2].roles, ['video']);
  const h = hechosArranque({ drive: { root: 'x' }, team: EQUIPO.slice(0, 2), rows, clients: [NAO], projects: [{ client_slug: 'nao', cycle: '2026-10' }], tasks: [], docs: DOCS.slice(1), mes: '2026-10' });
  assert.deepEqual(h, { drive: true, team: false, ciclo: true, tareas: false, lib: false });
  assert.equal(hechosArranque({ drive: null, team: [], rows: [], clients: [], projects: [], tasks: [], docs: [], mes: '2026-10' }).ciclo, false, 'sin clientes no cuenta como hecho');
});
t('pla-arranque: sin la carpeta de entregas, alta; con ella, media por el equipo o la Library; solo el CEO', () => {
  const base = bien(CEO);
  const [x] = corre('pla-arranque', { ...base, settings: { drive: null } });
  assert.equal(x.titulo, 'Falta la carpeta de entregas en Drive: el OS no puede crear las carpetas de los clientes'); assert.equal(x.urgencia, 'alta');
  assert.deepEqual(x.accion, { label: 'Ir al Arranque', href: '#/org/setup' });
  assert.equal(corre('pla-arranque', { ...base, settings: { drive: undefined, brief_open: null } }).length, 1, 'db.get sin doc da undefined: también falta');
  assert.equal(corre('pla-arranque', { ...base, settings: { drive: { id: 'drive', root: '' } } }).length, 1, 'el doc sin link también');
  const [y] = corre('pla-arranque', { ...base, team: EQUIPO.slice(0, 2) });
  assert.equal(y.urgencia, 'media'); assert.equal(y.titulo, 'El Arranque va en 4 de 5: falta 1 persona del equipo'); assert.equal(y.detalle, 'Sin perfil: Luis Video.');
  const [z] = corre('pla-arranque', { ...base, team: EQUIPO.slice(0, 2), docs: DOCS.slice(0, 3) });
  assert.equal(z.titulo, 'El Arranque va en 3 de 5: falta 1 persona del equipo y faltan 3 SOPs base');
  assert.match(z.detalle, /^Sin perfil: Luis Video\. En la Library: «Matriz de publicaciones y static ads» · «Setup de community» y 1 más\.$/);
  assert.match(corre('pla-arranque', { ...base, settings: { drive: null }, docs: DOCS.slice(1) })[0].detalle, /También falta 1 SOP base\.$/);
  assert.deepEqual(corre('pla-arranque', base), [], 'con todo, no sale');
  assert.deepEqual(corre('pla-arranque', { ...base, slots: undefined, docs: undefined }), [], 'sin la tabla de slots ni la Library, solo se revisa el Drive');
  assert.deepEqual(corre('pla-arranque', { ...base, settings: { drive: null } }, COO), [], 'solo el CEO');
});

// ---------- pla-equipo-arranque ----------
t('pla-equipo-arranque: quién no ha terminado de arrancar, sin contarte a ti; al CEO y al COO', () => {
  const team = [...EQUIPO,
    { id: 'mar@x.com', email: 'mar@x.com', name: 'María Foto', role: 'team', last_login: '2026-10-10', google: { calendar: false, drive: true } },
    { id: 'nue@x.com', email: 'nue@x.com', name: 'Nuevo Ingreso', role: 'team' },
    { id: 'ext@x.com', email: 'ext@x.com', name: 'Externa', role: 'team', external: true, kind: 'externo', last_login: '2026-10-10', primer_dia: { hecho_at: '2026-10-10' } },
    { id: 'ia1', name: 'Agente', kind: 'ia', active: true }, { id: 'old@x.com', email: 'old@x.com', name: 'Ya no está', active: false },
    { id: 'cli@nao.com', email: 'cli@nao.com', name: 'Cliente', role: 'client' }];
  const [x] = corre('pla-equipo-arranque', { team: [...team.map((p) => (p.id === 'ceo@x.com' ? { ...p, primer_dia: null } : p))] });
  assert.equal(x.titulo, 'Hay 2 personas del equipo que no han terminado de arrancar'); assert.equal(x.urgencia, 'baja');
  assert.equal(x.detalle, 'María Foto: le falta su primer día y Google · Nuevo Ingreso: nunca entró'); assert.equal(x.accion.href, '#/org/team');
  assert.equal(corre('pla-equipo-arranque', { team }, COO).length, 1);
  assert.deepEqual(corre('pla-equipo-arranque', { team }, ANA), [], 'solo el CEO y el COO');
  assert.equal(corre('pla-equipo-arranque', { team: [...EQUIPO, team[4]] })[0].titulo, 'Hay 1 persona del equipo que no ha terminado de arrancar');
  assert.deepEqual(corre('pla-equipo-arranque', { team: EQUIPO }), []);
});

// ---------- pla-laya-pendientes ----------
t('pla-laya-pendientes: los juicios en espera que ves; el CEO los resuelve en Laya, todos tienen el pedido para Claude Code', () => {
  const judgments = [{ id: 'j3', status: 'pendiente', gate: 'idea', target: { coll: 'content', id: 'c1' }, target_label: 'Hook de prueba', at: '2026-10-21' },
    { id: 'j1', status: 'pendiente', gate: 'lead', target: { coll: 'leads', id: 'l1' }, target_label: 'Café Nao', at: '2026-10-20' }, { id: 'j2', status: 'hecho', gate: 'lead' }];
  const [x] = corre('pla-laya-pendientes', { judgments });
  assert.equal(x.titulo, 'Hay 2 juicios de Laya esperando: se pidieron sin el puente'); assert.equal(x.urgencia, 'baja');
  assert.match(x.detalle, /^Lead: Café Nao · Hook o copy: Hook de prueba\. /); assert.equal(x.desde, '2026-10-20'); assert.equal(x.huella, 'j1,j3');
  assert.deepEqual(x.accion, { label: 'Resolver', href: '#/org/team/laya' }); assert.deepEqual(x.accion2, { label: 'Copiar el pedido', copiar: PEDIDO_LAYA });
  const [y] = corre('pla-laya-pendientes', { judgments: [judgments[0], judgments[2]] }, ANA); // a ANA (sin Ventas) solo le llega el de contenido
  assert.equal(y.titulo, 'Hay 1 juicio de Laya esperando: se pidió sin el puente'); assert.deepEqual(y.accion, { label: 'Copiar el pedido', copiar: PEDIDO_LAYA }); assert.equal(y.accion2, null);
  assert.deepEqual(corre('pla-laya-pendientes', { judgments: [judgments[2]] }), [], 'sin pendientes');
  assert.deepEqual(corre('pla-laya-pendientes', { judgments }, CLIENTE), []);
});

// ---------- Lo de tu compu: el puente ----------
const ME_CEO = { role: 'ceo', areas: [] }, ME_ANA = { role: 'team', areas: ['home', 'work', 'content'] };
t('usosPuente: quién usa el puente (Estrategia sin Hermes, Diseño en completo o edita, Hermes)', () => {
  assert.deepEqual(usosPuente(ME_CEO), { estrategia: true, diseno: true, hermes: false, alguno: true });
  assert.deepEqual(usosPuente(ME_ANA), { estrategia: false, diseno: true, hermes: false, alguno: true });
  assert.equal(usosPuente({ ...ME_ANA, views: { content: 'resumen' } }).alguno, false, 'Marcas en resumen no abre el chat de Diseño');
  assert.equal(usosPuente({ role: 'team', areas: ['estrategia'] }, { motor: 'hermes' }).estrategia, false, 'con Hermes, Estrategia no usa el chat del puente');
  assert.deepEqual(usosPuente({ role: 'team', areas: ['work'] }, { hermes: true }), { estrategia: false, diseno: false, hermes: true, alguno: true });
  assert.equal(usosPuente({ role: 'team', areas: ['work', 'sales'] }).alguno, false);
});
const OK = { status: 'ok', chat: { listo: true, ayuda: null, motores: { claude: true, chatgpt: { instalado: false }, local: { modelos: [] } } } };
const h = (o = {}) => ({ usos: usosPuente(ME_CEO), salud: OK, bloquea: false, token: true, estado: 200, falta: null, enApp: false, so: 'mac', bajandoMin: 0, ...o });
const uno = (o) => { const xs = avisoPuente(h(o)); assert.equal(xs.length, 1); assert.equal(xs[0].clave, 'pla-puente'); assert.equal(xs[0].grupo, 'plataforma'); assert.equal(xs[0].urgencia, 'alta'); return xs[0]; };
t('pla-puente: con todo bien no sale, y a quien no usa el puente nunca', () => {
  assert.deepEqual(avisoPuente(h()), []);
  assert.deepEqual(avisoPuente(h({ usos: usosPuente({ role: 'team', areas: ['work'] }), salud: null })), []);
});
t('pla-puente (1): no responde — Chrome lo bloquea, en la app, en una Mac sin la app o con el comando', () => {
  const b = uno({ salud: null, bloquea: true });
  assert.equal(b.titulo, 'Chrome está bloqueando a tu compu: los chats de Estrategia y Diseño no corren'); assert.equal(b.detalle, PASOS_COPIA_VIEJA); assert.deepEqual(b.accion, { label: 'Ya lo hice', abre: 'revisar' });
  const a = uno({ salud: null, enApp: true });
  assert.equal(a.titulo, 'El puente de tu compu no responde: los chats de Estrategia y Diseño no corren'); assert.match(a.detalle, /Puente › Reiniciar el puente/);
  const m = uno({ salud: null });
  assert.deepEqual(m.accion, { label: 'Bajar la app de Mac', href: APP_MAC }); assert.deepEqual(m.accion2, { label: 'Copiar el comando', copiar: INSTALAR_MAC });
  assert.deepEqual(uno({ salud: { status: 'error' }, so: 'win' }).accion, { label: 'Copiar el comando', copiar: INSTALAR_WIN });
  assert.equal(uno({ salud: null, usos: usosPuente(ME_ANA) }).titulo, 'El puente de tu compu no responde: el chat de Diseño no corre');
  assert.equal(uno({ salud: null, usos: usosPuente({ role: 'team', areas: ['work'] }, { hermes: true }) }).titulo, 'El puente de tu compu no responde: Hermes no lee el repo al día');
});
t('pla-puente (2): el puente es viejo (sin el chat o sin sus motores)', () => {
  const x = uno({ salud: { status: 'ok' } });
  assert.equal(x.titulo, 'Actualiza el puente: los chats de Estrategia y Diseño no corren'); assert.deepEqual(x.accion, { label: 'Copiar el comando', copiar: INSTALAR_MAC });
  assert.equal(uno({ salud: { status: 'ok', chat: { listo: false, ayuda: 'apagado' } }, enApp: true }).titulo, 'Actualiza la app de Mac: su puente es viejo y los chats de Estrategia y Diseño no corren');
});
t('pla-puente (3): la compu no está emparejada (sin token o el token ya no sirve); a quien solo usa Hermes no se le pide', () => {
  const x = uno({ token: false });
  assert.equal(x.titulo, 'Tu compu no está emparejada: los chats de Estrategia y Diseño no corren');
  assert.deepEqual(x.accion, { label: 'Copiar el comando', copiar: 'cat ~/.inherent/laya/chat-token' }); assert.deepEqual(x.accion2, { label: 'Emparejar', href: '#/estrategia' });
  assert.match(uno({ estado: 401 }).detalle, /^El token que pegaste ya no sirve\./);
  assert.equal(uno({ token: false, so: 'win', usos: usosPuente(ME_ANA) }).accion.copiar, 'Get-Content "$HOME\\.inherent\\laya\\chat-token"');
  assert.equal(uno({ token: false, usos: usosPuente(ME_ANA) }).accion2.href, '#/marcas/diseno');
  assert.match(uno({ token: false, enApp: true }).detalle, /La app empareja sola/);
  assert.deepEqual(avisoPuente(h({ token: false, usos: usosPuente({ role: 'team', areas: ['work'] }, { hermes: true }) })), []);
});
t('pla-puente (4): la copia del repo (GitHub, error, ruta mala, puente viejo y «bajando» que no termina)', () => {
  const con = (ayuda, o = {}) => ({ salud: { status: 'ok', chat: { ...OK.chat, listo: false, ayuda, ...o } } });
  assert.equal(uno(con('sin_github')).titulo, 'El puente no tiene la copia del repo: inicia sesión en GitHub (una sola vez)');
  assert.match(uno(con('repo_error', { error_repo: 'fatal: no se pudo resolver github.com' })).detalle, /^fatal: no se pudo resolver github\.com Se reintenta solo/);
  assert.match(uno(con('repo_invalido')).detalle, /INHERENT_REPO/);
  assert.equal(uno(con('sin_repo')).huella, 'sin_repo');
  assert.deepEqual(avisoPuente(h({ ...con('bajando_repo'), bajandoMin: 2 })), [], 'la primera vez tarda un minuto');
  assert.equal(uno({ ...con('bajando_repo'), bajandoMin: 6 }).titulo, 'El puente lleva rato bajando la copia del repo');
});
t('pla-puente (5): al motor elegido le falta algo en esta compu (faltaMotor)', () => {
  const x = uno({ falta: { t: 'Falta Codex, el programa de ChatGPT', p: 'Es el mismo para ChatGPT y para los modelos locales. En la Terminal:', cmd: 'npm install -g @openai/codex' } });
  assert.equal(x.titulo, 'Falta Codex, el programa de ChatGPT: los chats de Estrategia y Diseño no corren');
  assert.deepEqual(x.accion, { label: 'Copiar el comando', copiar: 'npm install -g @openai/codex' }); assert.deepEqual(x.accion2, { label: 'Ya lo hice', abre: 'revisar' });
  assert.deepEqual(uno({ falta: { t: 'Elige qué modelo local usar', p: 'En esta compu hay: gemma3:4b.', elegir: true } }).accion, { label: 'Elegir el modelo', href: '#/estrategia' });
  assert.deepEqual(uno({ falta: { t: 'No encuentro Claude Code', p: 'Instálalo e inicia sesión.' } }).accion, { label: 'Ya lo hice', abre: 'revisar' });
});

// ---------- Lo de tu compu: la app de Mac ----------
t('pla-app-mac: solo en la app, si la publicada es más nueva (o la app no dice su versión)', () => {
  const [x] = avisoAppMac({ enApp: true, instalada: '0.1.4', ultima: { version: '0.1.5' } });
  assert.equal(x.clave, 'pla-app-mac'); assert.equal(x.urgencia, 'media'); assert.equal(x.titulo, 'Hay una versión nueva de la app de Mac (0.1.5)'); assert.match(x.detalle, /^Tienes la 0\.1\.4\. Menú Inherent OS › Buscar actualizaciones…/);
  assert.equal(x.huella, '0.1.5');
  assert.deepEqual(avisoAppMac({ enApp: true, instalada: '0.1.5', ultima: { version: '0.1.5' } }), []);
  assert.deepEqual(avisoAppMac({ enApp: true, instalada: '0.2.0', ultima: { version: '0.1.9' } }), []);
  assert.equal(avisoAppMac({ enApp: true, instalada: '0.1.9', ultima: { version: '0.1.10' } }).length, 1, 'se compara por número, no por texto');
  assert.match(avisoAppMac({ enApp: true, instalada: '', ultima: { version: '0.1.5' } })[0].detalle, /^Menú Inherent OS/, 'una app sin versión en el preload es más vieja');
  assert.deepEqual(avisoAppMac({ enApp: false, instalada: '0.1.4', ultima: { version: '0.1.5' } }), [], 'en el navegador no sale');
  assert.deepEqual(avisoAppMac({ enApp: true, instalada: '0.1.4', ultima: null }), [], 'si el OS no sabe la última, no se adivina');
  assert.deepEqual(avisoAppMac({ enApp: true, instalada: '0.1.4', ultima: { version: null } }), []);
  assert.ok(mayor('1.0.0', '0.9.9') && !mayor('0.1.4', '0.1.4') && !mayor('0.1.3', '0.1.4'));
});

// ---------- Lo que encontró la revisión ----------
t('pla-app-mac: una app sin versión en el preload es la 0.1.4 o más vieja; si la última publicada es la 0.1.4, no se avisa', () => {
  // La 0.1.4 de hoy no pasa su versión: si la última sigue siendo la 0.1.4, el diálogo de la app diría «Ya tienes la última».
  assert.deepEqual(avisoAppMac({ enApp: true, instalada: '', ultima: { version: '0.1.4' } }), [], 'no se le pide actualizar a la misma versión');
  assert.deepEqual(avisoAppMac({ enApp: true, instalada: undefined, ultima: { version: '0.1.3' } }), []);
  assert.equal(avisoAppMac({ enApp: true, instalada: '', ultima: { version: '0.1.5' } }).length, 1, 'con una versión nueva de verdad, sí');
});
t('pla-videos: al COO sin perfiles en su doc le tocan los videos del COO, como en Mi perfil (userFor le pone «coo»)', () => {
  const guias = [{ id: 'g1', title: 'Mis tareas', guia: 'hoy', roles: [] }, { id: 'g4', title: 'Activar el ciclo', guia: 'proyectos', roles: ['coo'] }];
  const [x] = corre('pla-videos', { guias, yo: yoDe(COO, { vistos: { g1: 1 } }) }, COO);
  assert.ok(x, 'el COO tiene un video de su puesto sin ver'); assert.equal(x.huella, 'g4');
  assert.deepEqual(corre('pla-videos', { guias, yo: yoDe(ANA, { vistos: { g1: 1 } }) }, ANA), [], 'a quien no tiene perfiles no le toca el del COO');
  assert.deepEqual(corre('pla-videos', { guias, yo: yoDe(COO, { roles: ['content'], vistos: { g1: 1 } }) }, COO), [], 'con sus perfiles puestos, cuentan esos');
});
t('pla-laya-pendientes: solo lo que puedes resolver (edita en el área del elemento) y el pedido solo con Mis tareas en edita', () => {
  const lead = { id: 'j1', status: 'pendiente', gate: 'lead', target: { coll: 'leads', id: 'l1' }, target_label: 'Café Nao', at: '2026-10-20' };
  const idea = { id: 'j3', status: 'pendiente', gate: 'idea', target: { coll: 'content', id: 'c1' }, target_label: 'Hook de prueba', at: '2026-10-21' };
  const MIRA = personaDe({ email: 'mira@x.com', role: 'team', areas: ['home', 'work', 'sales', 'content'], niveles: { home: 'edita', work: 'edita', sales: 'completo', content: 'edita' } });
  const [x] = corre('pla-laya-pendientes', { judgments: [lead, idea] }, MIRA);
  assert.equal(x.titulo, 'Hay 1 juicio de Laya esperando: se pidió sin el puente');
  assert.equal(x.huella, 'j3', 'el del lead lo ve en completo, pero guardar_juicio y pedirlo desde el lead piden Ventas en edita');
  assert.deepEqual(x.accion, { label: 'Copiar el pedido', copiar: PEDIDO_LAYA });
  assert.deepEqual(corre('pla-laya-pendientes', { judgments: [lead] }, MIRA), [], 'lo que no puede resolver no le bloquea nada: no sale');
  const SIN_WORK = personaDe({ email: 's@x.com', role: 'team', areas: ['home', 'work', 'content'], niveles: { home: 'edita', work: 'completo', content: 'edita' } });
  const [y] = corre('pla-laya-pendientes', { judgments: [idea] }, SIN_WORK);
  assert.equal(y.accion, null, 'el conector pide Mis tareas en edita: sin eso, no hay pedido que copiar');
  assert.doesNotMatch(y.detalle, /Claude Code/); assert.match(y.detalle, /pídelo otra vez desde el elemento\.$/);
  const [z] = corre('pla-laya-pendientes', { judgments: [lead, idea] });
  assert.equal(z.huella, 'j1,j3', 'el CEO resuelve todos'); assert.deepEqual(z.accion, { label: 'Resolver', href: '#/org/team/laya' });
});

console.log(`\n${n} pruebas de Avisos · La plataforma pasaron`);
