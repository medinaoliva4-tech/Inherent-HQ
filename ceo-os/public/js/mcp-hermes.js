// Los comandos para agregar, probar y quitar un MCP en Hermes (el perfil «inherent» de esta compu). PURO: sin DOM ni red.
// Hermes no tiene API para esto: los MCPs se agregan en la Terminal. Aquí solo se arman los comandos, ya validados, para copiarlos.
// Reglas: nada que venga de la persona entra a un comando sin pasar por nombreValido/urlValida (juego de caracteres cerrado, sin
// comillas, ; $ ` | & ni espacios), y la llave NUNCA va en el comando: se deja <tu-llave> para pegarla en la Terminal, no en el OS.
// Lo prueba scripts/test-mcp.mjs (npm run test:mcp).

export const BIN = 'inherent';
export const MARCADOR_LLAVE = '<tu-llave>';
export const COMANDO_LISTA = `${BIN} mcp list`;
export const AUTORIZACIONES = [['oauth', 'OAuth', 'Se abre el navegador y das permiso'], ['llave', 'Llave', 'La pegas tú en la Terminal'], ['ninguna', 'Ninguna', 'MCP abierto, sin permiso']];

// Los MCPs que sí existen y están probados; no se inventan URLs de terceros.
export const SUGERIDOS = [
  { nombre: 'inherent', url: 'https://inherent-work.vercel.app/mcp', auth: 'oauth', que: 'Inherent OS: tus tareas, clientes y CRM desde el Chat' },
];

const limpio = (s) => (typeof s === 'string' ? s.trim() : '');

// Nombre del MCP: minúsculas, números y guion; 2 a 40; no empieza con guion (sería una opción del comando).
export const nombreValido = (n) => /^[a-z0-9][a-z0-9-]{1,39}$/.test(limpio(n));

// URL del MCP: https, o http solo hacia esta compu (127.0.0.1 / localhost). Juego de caracteres cerrado: sin ? # @ = &,
// así no cabe una llave dentro de la URL ni nada que la shell interprete.
const URL_SEGURA = /^https?:\/\/[a-z0-9][a-z0-9._~:/%+-]{3,290}$/i; // tras «://» va el host de inmediato (https:///x no vale)
export function urlValida(u) {
  const s = limpio(u);
  if (!URL_SEGURA.test(s)) return false;
  let x; try { x = new URL(s); } catch { return false; }
  if (x.username || x.password || x.search || x.hash || !x.hostname) return false;
  if (x.protocol === 'https:') return true;
  return x.protocol === 'http:' && (x.hostname === '127.0.0.1' || x.hostname === 'localhost');
}

// Qué decirle a la persona cuando algo no pasa (vacío = está bien).
export const errorNombre = (n) => (!limpio(n) ? 'Falta el nombre.' : nombreValido(n) ? '' : 'El nombre va en minúsculas, números y guion (de 2 a 40 letras).');
export const errorUrl = (u) => (!limpio(u) ? 'Falta la URL.' : urlValida(u) ? '' : 'La URL empieza con https:// (o http://127.0.0.1 o localhost) y no lleva ?, # ni llaves.');

const autValida = (a) => AUTORIZACIONES.some(([k]) => k === a);

// Agregar un MCP → comandos en orden ([] si el nombre, la URL o la autorización no sirven).
// auth: 'oauth' (se abre el navegador) · 'llave' (se pega en la Terminal) · 'ninguna'.
export function comandosAgregar(datos) {
  const { nombre, url, auth } = datos || {}, n = limpio(nombre), u = limpio(url);
  if (!nombreValido(n) || !urlValida(u) || !autValida(auth)) return [];
  const base = `${BIN} config set mcp_servers.${n}`;
  return [
    `${base}.url ${u}`,
    ...(auth === 'oauth' ? [`${base}.auth oauth`, `${BIN} mcp login ${n}`] : []),
    ...(auth === 'llave' ? [`${base}.headers.Authorization "Bearer ${MARCADOR_LLAVE}"`] : []),
    `${BIN} mcp test ${n}`,
  ];
}
// Lo que hay que saber antes de pegarlos.
export const notaAgregar = (auth) => (auth === 'llave' ? `Cambia ${MARCADOR_LLAVE} por tu llave y pégalo en la Terminal, no en el OS: el OS nunca la ve ni la guarda.`
  : auth === 'oauth' ? 'Se abre el navegador para que des permiso; al volver, el último comando prueba la conexión.'
  : auth === 'ninguna' ? 'Sin permiso ni llave: úsalo solo con MCPs abiertos de los que te fíes.' : '');

export const comandosProbar = (nombre) => (nombreValido(nombre) ? [`${BIN} mcp test ${limpio(nombre)}`] : []);
export const comandosAutorizar = (nombre) => (nombreValido(nombre) ? [`${BIN} mcp login ${limpio(nombre)}`] : []);
export const comandosQuitar = (nombre) => (nombreValido(nombre) ? [`${BIN} mcp remove ${limpio(nombre)}`] : []);
