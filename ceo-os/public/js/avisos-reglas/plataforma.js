// Avisos · La plataforma: lo que falta conectar o terminar (ver index.js). Lo de tu compu (Hermes, el puente, la app de
// Mac y el permiso de avisos de este dispositivo) no está aquí: lo revisa el navegador (avisos-compu.js, con compu.js).
// Cada regla: { id, grupo, area, urgencia, necesita?, calcular(datos, persona, hoy, ciclo) → [aviso] }. Los datos llegan ya
// filtrados con lo que la persona ve (api/_lib/avisos-datos.js). datos.yo = su doc del equipo: sin él (yo.email) no se avisa.
import { aviso, plural } from './base.js';
import { PASOS_PRIMER_DIA } from '../primer-dia-pasos.js';
import { videosDe, nombreSeccion } from '../guia-secciones.js';
import { SOPS, tituloSop, filasEquipo, hechosArranque } from '../arranque.js';
import { PUERTAS } from '../laya.js';
import { rolesOf } from '../roleviews.js';

const lc = (x) => String(x || '').toLowerCase();
const yLista = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}`);
const corta = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
// Hasta n y «y N más».
const algunos = (xs, n = 3) => (xs.length > n ? `${xs.slice(0, n).join(' · ')} y ${xs.length - n} más` : xs.join(' · '));
const conPerfil = (d, p) => p.role !== 'client' && Boolean(d.yo?.email);

// pla-primer-dia · ceo-os/PROPOSITOS.md §4 «El primer día». Cada quien el suyo, hasta que lo termine.
const PRIMER_DIA = { id: 'pla-primer-dia', grupo: 'plataforma', area: 'todas', urgencia: 'media' };
PRIMER_DIA.calcular = (d, p) => {
  if (p.role === 'client' || d.yo?.primer_dia?.hecho_at) return [];
  const h = d.yo?.primer_dia?.hechos || {}, n = PASOS_PRIMER_DIA.filter(([k]) => h[k]).length;
  return [aviso(PRIMER_DIA, { clave: 'pla-primer-dia', titulo: `Tu primer día va en ${n} de ${PASOS_PRIMER_DIA.length}: termina de dejar todo listo`, huella: String(n), accion: { label: 'Seguir tu primer día', abre: 'primer-dia' } })];
};

// pla-google · CLAUDE.md § «Dónde vive cada cosa» (el material vive en Google Drive, conectado a Inherent OS) e
// inherent/05-OPERACION.md §7 «El Drive de cada cliente». Los permisos se guardan en cada login (team.google); sin la llave
// del vault (tieneGoogle), el OS no llega a tu Google. Al CEO y al COO también Gmail: la bienvenida y la invitación al cliente
// salen del correo de quien confirma el pago (ceo-os/MAPA.md); si es lo único que falta, media. Un externo no guarda llave.
const GOOGLE = { id: 'pla-google', grupo: 'plataforma', area: 'todas', urgencia: 'alta' };
const SIN_GOOGLE = { ambos: 'el OS no guarda en tu Drive ni agenda en tu Calendar', Drive: 'el OS no guarda en tu Drive', Calendar: 'el OS no agenda en tu Calendar' };
GOOGLE.calcular = (d, p) => {
  if (!conPerfil(d, p) || d.yo.external) return [];
  const g = d.yo.google || {}, sinLlave = d.tieneGoogle === false, gmail = (p.esCeo || p.esCoo) && g.gmail === false;
  const faltan = [g.calendar === false && 'Calendar', g.drive === false && 'Drive'].filter(Boolean);
  if (!faltan.length && !sinLlave && !gmail) return [];
  const accion = { label: 'Conectar Google', href: '/api/auth/google' };
  if (!faltan.length && !sinLlave) return [aviso(GOOGLE, {
    clave: 'pla-google', urgencia: 'media', titulo: 'Falta el permiso de Gmail: la bienvenida al cliente no sale de tu correo',
    detalle: 'Al confirmar un pago, la bienvenida y la invitación al portal salen de tu Gmail. Vuelve a entrar con Google y acepta todos los permisos.', huella: 'gmail', accion,
  })];
  const sin = SIN_GOOGLE[sinLlave || faltan.length === 2 ? 'ambos' : faltan[0]];
  return [aviso(GOOGLE, {
    clave: 'pla-google', titulo: faltan.length ? `Tu Google no tiene permiso de ${yLista([...faltan, ...(gmail ? ['Gmail'] : [])])}` : 'Conecta tu Google otra vez: el OS no llega a tu Drive ni a tu Calendar',
    detalle: `Sin eso, ${sin}${gmail ? ', y la bienvenida al cliente no sale de tu Gmail' : ''}. Vuelve a entrar con Google y acepta todos los permisos.`,
    huella: [sinLlave && 'llave', ...faltan, gmail && 'Gmail'].filter(Boolean).join(','), accion,
  })];
};

// pla-avisos-celular · ceo-os/PROPOSITOS.md §4 «El celular» (cada quien lo enciende en su perfil) e inherent/05-OPERACION.md §3
// «Primer contacto: un minuto». Con las claves puestas (push.listo) y ningún dispositivo con avisos (team.push). Media para
// quien ve Ventas (el lead nuevo le llega al celular); baja para el resto (solo el resumen de la mañana). La parte de este
// dispositivo (los avisos bloqueados en el navegador) la revisa avisos-compu.js.
const CELULAR = { id: 'pla-avisos-celular', grupo: 'plataforma', area: 'organizacion', urgencia: 'media' };
// Una suscripción que sirve: la misma subOk de api/_lib/avisos.js.
export const subOk = (s) => Boolean(s && typeof s.endpoint === 'string' && /^https:\/\//.test(s.endpoint) && s.keys?.p256dh && s.keys?.auth);
CELULAR.calcular = (d, p) => {
  if (!conPerfil(d, p) || !d.push?.listo || (d.yo.push || []).some(subOk)) return [];
  const ventas = p.ve('sales');
  return [aviso(CELULAR, {
    clave: 'pla-avisos-celular', urgencia: ventas ? 'media' : 'baja', titulo: ventas ? 'No tienes avisos en el celular: un lead nuevo no te llega' : 'No tienes avisos en el celular: lo urgente de la mañana no te llega',
    detalle: 'En tu celular abre el OS y ve a Mi perfil › Avisos en este dispositivo. En iPhone, primero Compartir → «Agregar a inicio».', huella: 'sin-dispositivos',
    accion: { label: 'Activar en tu celular', href: '#/me' },
  })];
};

// pla-mcp · ceo-os/PROPOSITOS.md §4 «El conector MCP». Mientras no haya conectado ninguna IA (ni team.mcp_hash ni mcp_grants).
// «Después» hace lo que hacía el «Ahora no» del aviso de connectai.js, pero guardado en el servidor.
const MCP = { id: 'pla-mcp', grupo: 'plataforma', area: 'todas', urgencia: 'baja' };
MCP.calcular = (d, p) => (!conPerfil(d, p) || d.yo.mcp_hash || d.yo.mcp_grants?.length ? [] : [aviso(MCP, {
  clave: 'pla-mcp', titulo: 'Conecta tu IA a Inherent OS', detalle: 'Desde Claude o ChatGPT: pregúntale tus pendientes, pídele una cotización o que arme un proyecto.',
  huella: 'sin-conectar', accion: { label: 'Conectar', abre: 'conectar' },
})]);

// pla-videos · ceo-os/PROPOSITOS.md §4 «El primer día y Cómo se usa»: el OS sabe qué videos vio cada quien (team.vistos).
// Los de su puesto, en el orden en que se ven (videosDe, el mismo filtro de Mi perfil). El CEO, todos.
const VIDEOS = { id: 'pla-videos', grupo: 'plataforma', area: 'todas', urgencia: 'baja' };
// Los perfiles de trabajo como los ve Mi perfil (rolesOf, lo mismo que api/_lib/access.js · userFor): sin roles en su doc del
// equipo, el CEO cuenta como «ceo» y el COO como «coo». Así el aviso cuenta los mismos videos que la pantalla.
VIDEOS.calcular = (d, p) => {
  if (!conPerfil(d, p)) return [];
  const vistos = d.yo.vistos || {}, xs = videosDe(d.guias || [], { role: p.role, roles: rolesOf({ role: p.role, roles: d.yo.roles }) }).filter((g) => !vistos[g.id]);
  if (!xs.length) return [];
  return [aviso(VIDEOS, {
    clave: 'pla-videos', titulo: `Te ${xs.length === 1 ? 'falta' : 'faltan'} ${plural(xs.length, 'video', 'videos')} de «Cómo se usa» de tu puesto`,
    detalle: `El siguiente: «${corta(xs[0].title, 90)}» · ${nombreSeccion(xs[0].guia)}.`, huella: xs.map((g) => g.id).join(','),
    accion: { label: 'Ver el siguiente', abre: 'guia', id: xs[0].id }, accion2: { label: 'Todos los videos', href: '#/me' },
  })];
};

// pla-servidor-claves · ceo-os/README.md § «Variables de entorno (Vercel → Production)». Solo el CEO, y solo el nombre de lo
// que falta: datos.env dice si cada una está o no, nunca su valor. No hay botón: se ponen en Vercel.
const CLAVES = { id: 'pla-servidor-claves', grupo: 'plataforma', area: 'organizacion', urgencia: 'alta', necesita: { rol: ['ceo'] } };
const VARIABLES = [ // [campo de datos.env, las variables, qué no funciona (corto), para qué sirven]
  ['push', 'VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY', 'los avisos al celular', 'los avisos al celular'],
  ['cron', 'CRON_SECRET', 'el cron', 'el resumen de la mañana y el scraping del lunes'],
  ['github', 'GITHUB_TOKEN', 'escribir en el repo', 'escribir la ficha en el repo y saber si hay versión nueva de la app'],
  ['portal', 'GOOGLE_PORTAL_CLIENT_ID y GOOGLE_PORTAL_CLIENT_SECRET', 'el portal del cliente', 'el login del portal del cliente'],
];
CLAVES.calcular = (d) => {
  const xs = d.env ? VARIABLES.filter(([k]) => d.env[k] === false) : [];
  if (!xs.length) return [];
  return [aviso(CLAVES, {
    clave: 'pla-servidor-claves', titulo: `Al servidor le faltan claves: ${yLista(xs.map((x) => x[2]))} no ${xs.length > 1 || xs[0][0] === 'push' ? 'funcionan' : 'funciona'}`,
    detalle: `En Vercel → Settings → Environment Variables: ${xs.map(([, v, , para]) => `${v} (${para})`).join(' · ')}.`, huella: xs.map((x) => x[0]).join(','),
  })];
};

// pla-arranque · inherent/05-OPERACION.md §7 «El Drive de cada cliente» (Inherent OS crea las carpetas y las conecta) y CLAUDE.md
// § «Dónde vive cada cosa». Sin la carpeta de entregas (settings «drive»), POST drive/client no puede crear la de un cliente:
// alta. Con ella, como media: alguien de la tabla de slots sin perfil en el equipo o un SOP base que falta en la Library, con
// el mismo cálculo del Arranque (arranque.js). Solo el CEO: settings solo lo escribe él y el Arranque es suyo.
// datos.slots (la tabla de slots) y datos.docs (los títulos de la Library): sin ellos, esa parte no se revisa. Sin la clave
// «drive» en datos.settings tampoco se sabe nada del Drive; con ella, null o undefined (db.get sin doc) es que falta.
const ARRANQUE = { id: 'pla-arranque', grupo: 'plataforma', area: 'organizacion', urgencia: 'alta', necesita: { rol: ['ceo'] } };
ARRANQUE.calcular = (d, p, hoy, c) => {
  const hayDrive = Boolean(d.settings) && 'drive' in d.settings, drive = d.settings?.drive || null;
  const slots = Array.isArray(d.slots) ? d.slots : null, docs = Array.isArray(d.docs) ? d.docs : null;
  if (!hayDrive && !slots && !docs) return [];
  const team = (d.team || []).filter((x) => x.role !== 'client'), rows = slots ? filasEquipo(slots, team, { email: p.email, name: p.nombre }) : [];
  const clients = (d.clientes || []).filter((x) => x.slug !== 'inherent' && x.ficha?.hay);
  const h = hechosArranque({ drive, team, rows, clients, projects: d.projects || [], tasks: d.tasks || [], docs: docs || [], mes: c.M });
  const equipo = Boolean(slots) && !h.team, lib = Boolean(docs) && !h.lib;
  const sinPerfil = rows.filter((r) => !r.ia && !r.cur).map((r) => r.name), sinSop = docs ? SOPS.filter((s) => !docs.some((x) => x.title === tituloSop(s))) : [];
  const falta = [equipo && (sinPerfil.length ? `${sinPerfil.length === 1 ? 'falta' : 'faltan'} ${plural(sinPerfil.length, 'persona', 'personas')} del equipo` : 'falta el equipo'),
    lib && `${sinSop.length === 1 ? 'falta' : 'faltan'} ${plural(sinSop.length, 'SOP base', 'SOPs base')}`].filter(Boolean);
  const accion = { label: 'Ir al Arranque', href: '#/org/setup' };
  if (hayDrive && !h.drive) return [aviso(ARRANQUE, {
    clave: 'pla-arranque', titulo: 'Falta la carpeta de entregas en Drive: el OS no puede crear las carpetas de los clientes',
    detalle: `En el Arranque, pega el link de una carpeta de Drive compartida como Editor con el equipo.${falta.length ? ` También ${yLista(falta)}.` : ''}`,
    huella: ['drive', ...falta].join('|'), accion,
  })];
  if (!falta.length) return [];
  const cuales = [equipo && (sinPerfil.length ? `Sin perfil: ${algunos(sinPerfil)}` : 'En el equipo solo estás tú: «Guardar equipo» lo arma con la tabla de slots'),
    lib && `En la Library: ${algunos(sinSop.map((s) => `«${s[2]}»`), 2)}`].filter(Boolean).join('. ');
  return [aviso(ARRANQUE, {
    clave: 'pla-arranque', urgencia: 'media', titulo: slots && docs && hayDrive ? `El Arranque va en ${Object.values(h).filter(Boolean).length} de 5: ${yLista(falta)}` : `El Arranque: ${yLista(falta)}`,
    detalle: `${cuales}.`, huella: [...sinPerfil, ...sinSop.map((s) => s[2])].join('|') || 'equipo', accion,
  })];
};

// pla-equipo-arranque · CLAUDE.md § «Los roles» (el COO organiza y coordina al equipo) y ceo-os/PROPOSITOS.md §4 «El primer día»
// (el OS muestra en Equipo quién vio qué). Las personas activas que no han terminado de arrancar: nunca entraron, sin Google o
// sin su primer día (lo mismo que pinta Equipo). Sin contarte a ti: lo tuyo va en pla-primer-dia y pla-google.
const EQUIPO = { id: 'pla-equipo-arranque', grupo: 'plataforma', area: 'organizacion', urgencia: 'baja', necesita: { rol: ['ceo', 'coo'] } };
const pendienteDe = (t) => (!t.last_login ? ['nunca entró'] : [!t.primer_dia?.hecho_at && 'su primer día', !(t.external || t.kind === 'externo') && !(t.google?.calendar && t.google?.drive) && 'Google'].filter(Boolean));
EQUIPO.calcular = (d, p) => {
  const xs = (d.team || []).filter((t) => t.role !== 'client' && t.kind !== 'ia' && t.active !== false && t.email && lc(t.email) !== p.email)
    .map((t) => ({ t, f: pendienteDe(t) })).filter((x) => x.f.length).sort((a, b) => String(a.t.name || a.t.email).localeCompare(String(b.t.name || b.t.email)));
  if (!xs.length) return [];
  const linea = ({ t, f }) => `${t.name || t.email.split('@')[0]}: ${f[0] === 'nunca entró' ? 'nunca entró' : `le falta ${yLista(f)}`}`;
  return [aviso(EQUIPO, {
    clave: 'pla-equipo-arranque', titulo: `Hay ${plural(xs.length, 'persona del equipo que no ha', 'personas del equipo que no han')} terminado de arrancar`,
    detalle: algunos(xs.map(linea)), huella: xs.map(({ t, f }) => `${lc(t.email)}:${f.join('+')}`).join(','), accion: { label: 'Ver el equipo', href: '#/org/team' },
  })];
};

// pla-laya-pendientes · ceo-os/MAPA.md: «Sin puente, el juicio queda en espera; lo resuelve una sesión de Claude Code con Laya
// por MCP». Los pendientes de lo que esta persona ve (datos.judgments ya viene filtrado con verObjetivo) y puede resolver:
// pedirlo desde el elemento y guardar_juicio piden «edita» en el área del elemento (api/_lib/laya.js · puedePedir; es el área
// de su puerta). Lo que no puede resolver no la bloquea: no sale. El CEO los resuelve en Inherent › Laya; el pedido para
// Claude Code solo va a quien tiene el conector para hacerlo (juicios_pendientes y guardar_juicio piden Mis tareas en edita).
const LAYA = { id: 'pla-laya-pendientes', grupo: 'plataforma', area: 'todas', urgencia: 'baja' };
export const PEDIDO_LAYA = 'Corre juicios_pendientes y guarda cada uno con guardar_juicio.';
LAYA.calcular = (d, p) => {
  if (p.role === 'client') return [];
  const resuelve = (j) => p.esCeo || p.edita(PUERTAS[j.gate]?.area);
  const xs = (d.judgments || []).filter((j) => j.status === 'pendiente' && resuelve(j)).sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
  if (!xs.length) return [];
  const que = (j) => `${PUERTAS[j.gate]?.label || 'Elemento'}: ${corta(j.target_label || j.target?.id, 40)}`;
  const mcp = p.esCeo || p.edita('work'), copiar = mcp ? { label: 'Copiar el pedido', copiar: PEDIDO_LAYA } : null;
  return [aviso(LAYA, {
    clave: 'pla-laya-pendientes', titulo: xs.length === 1 ? 'Hay 1 juicio de Laya esperando: se pidió sin el puente' : `Hay ${xs.length} juicios de Laya esperando: se pidieron sin el puente`,
    detalle: `${algunos(xs.map(que))}. Con el puente encendido, pídelo otra vez desde el elemento${mcp ? '; sin puente, pásale el pedido a Claude Code con Laya por MCP' : ''}.`,
    desde: xs[0].at || '', huella: xs.map((j) => j.id).join(','),
    accion: p.esCeo ? { label: 'Resolver', href: '#/org/team/laya' } : copiar, accion2: p.esCeo ? copiar : null,
  })];
};

export const PLATAFORMA = [PRIMER_DIA, GOOGLE, CELULAR, MCP, VIDEOS, CLAVES, ARRANQUE, EQUIPO, LAYA];
