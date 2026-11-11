// La pestaña «Herramientas» del panel derecho del Chat: Code OS embebido (iframe de code.inherentglobal.com/?embed=1).
// Contrato: code-os/ui/docs/embebido.md (PR #298). El OS es la única puerta: emite el pase (POST /api/code/pase), lo manda por
// postMessage y lo renueva; manda el contexto (cliente, sesión del puente, rol, tema, nivel, aislada); y atiende «codeos:al-chat».
// Seguridad: solo se aceptan mensajes del iframe (e.source) y de SU origen exacto (e.origin); se responde solo a ese origen.
// La parte pura (sin DOM ni red) la prueba scripts/test-herramientas-code.mjs; montarHerramientas es la parte de pantalla.

export const VERSION_CONTRATO = 1;
export const NIVELES_AL_CHAT = ['nivel-alto', 'nivel-medio', 'nivel-bajo'];
const ROLES = ['ceo', 'coo', 'estrategia', 'creativo', 'produccion', 'editor', 'diseno'];
const SECCIONES = ['cliente', 'agentes', 'herramientas', 'codigo'];
const MAX_TEXTO = 20000;

/** El origen exacto de la interfaz (https, o http://localhost para probar); '' si la URL no sirve. */
export function origenDe(url) {
  try { const u = new URL(String(url || '')); return u.protocol === 'https:' || (u.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(u.hostname)) ? u.origin : ''; } catch { return ''; }
}
/** La URL del iframe: modo embebido y el pase de la primera carga (la interfaz lo quita de la barra al cargar). */
export function urlEmbebida(base, pase = '') {
  const o = origenDe(base); if (!o) return '';
  const u = new URL(String(base)); u.searchParams.set('embed', '1'); if (pase) u.searchParams.set('pase', pase);
  return u.toString();
}
/** ¿Este mensaje es de nuestro iframe y trae un tipo del contrato? */
export function mensajeValido(e, { origen, ventana }) {
  if (!e || !origen || e.origin !== origen) return false;
  if (!ventana || e.source !== ventana) return false;
  const d = e.data; return Boolean(d && typeof d === 'object' && typeof d.tipo === 'string' && d.tipo.startsWith('codeos:'));
}
/** El rol del OS → el rol que entiende Code OS («Ver como»). */
export function rolCodeOS({ role = '', roles = [], title = '', modo = '' } = {}) {
  if (role === 'ceo' || role === 'coo') return role;
  if (/editor|edici[oó]n/i.test(title)) return 'editor';
  if (role === 'prod' || roles.includes('prod') || modo === 'produccion') return 'produccion';
  if (modo === 'estrategia' || modo === 'consulting') return 'estrategia';
  if (modo === 'diseno') return 'diseno';
  return 'creativo';
}
/** El mensaje «codeos:contexto», solo con los campos válidos (todos opcionales: se mezclan con lo anterior). */
export function contextoCodeOS({ cliente, sesion, rol, tema, seccion, nivel, aislada } = {}) {
  const out = { tipo: 'codeos:contexto' };
  if (typeof cliente === 'string' && /^[a-z0-9_-]{0,63}$/.test(cliente)) out.cliente = cliente;
  if (typeof sesion === 'string' && /^[0-9a-f-]{8,64}$/i.test(sesion)) out.sesion = sesion;
  if (ROLES.includes(rol)) out.rol = rol;
  if (tema === 'dark' || tema === 'light') out.tema = tema;
  if (SECCIONES.includes(seccion)) out.seccion = seccion;
  if (NIVELES_AL_CHAT.includes(nivel)) out.nivel = nivel;
  if (typeof aislada === 'boolean') out.aislada = aislada;
  return out;
}
/** «codeos:al-chat» → { texto, enviar, modelo } limpio, o null si no sirve. Un modelo que no es un nivel se ignora. */
export function leerAlChat(d) {
  const texto = typeof d?.texto === 'string' ? d.texto.trim().slice(0, MAX_TEXTO) : ''; if (!texto) return null;
  return { texto, enviar: d.enviar === true, modelo: NIVELES_AL_CHAT.includes(d.modelo) ? d.modelo : '' };
}
/**
 * Qué hacer con un mensaje ya validado → [{ hacer: 'pase', forzar } | { hacer: 'contexto' } | { hacer: 'al-chat', ... }].
 * Puro: la pantalla ejecuta las acciones (montarHerramientas).
 */
export function acciones(d) {
  switch (d?.tipo) {
    case 'codeos:listo': return [{ hacer: 'pase', forzar: false }, { hacer: 'contexto' }];
    case 'codeos:pedir-pase': return [{ hacer: 'pase', forzar: true }];
    case 'codeos:al-chat': { const x = leerAlChat(d); return x ? [{ hacer: 'al-chat', ...x }] : []; }
    default: return [];
  }
}

/**
 * Monta el iframe en `caja`. opts = { pase(forzar) → { pase, expira, ui }, contexto() → objeto para contextoCodeOS, alChat(x),
 * alError(texto) }. → { iframe, contexto(), destruir() }. El iframe se crea UNA vez: moverlo en el DOM lo recarga.
 */
export async function montarHerramientas(caja, opts) {
  let p;
  try { p = await opts.pase(false); } catch (e) { opts.alError?.(e.message || 'No pude pedir el pase de Code'); return null; }
  const origen = origenDe(p.ui || p.url), src = urlEmbebida(p.ui || p.url, p.pase);
  if (!origen || !src) { opts.alError?.('La dirección de Code OS no es válida'); return null; }
  const iframe = document.createElement('iframe');
  Object.assign(iframe, { src, title: 'Code OS · Herramientas' });
  iframe.setAttribute('allow', 'clipboard-write');
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  iframe.className = 'llm-herr-if';
  const enviar = (msg) => iframe.contentWindow?.postMessage(msg, origen);
  const mandarContexto = () => enviar(contextoCodeOS(opts.contexto()));
  async function alMensaje(e) {
    if (!mensajeValido(e, { origen, ventana: iframe.contentWindow })) return;
    for (const a of acciones(e.data)) {
      if (a.hacer === 'pase') { try { const q = await opts.pase(a.forzar); enviar({ tipo: 'codeos:pase', pase: q.pase, expira: q.expira }); } catch (er) { opts.alError?.(er.message || 'No pude renovar el pase'); } }
      else if (a.hacer === 'contexto') mandarContexto();
      else if (a.hacer === 'al-chat') opts.alChat({ texto: a.texto, enviar: a.enviar, modelo: a.modelo });
    }
  }
  window.addEventListener('message', alMensaje);
  caja.replaceChildren(iframe);
  return { iframe, contexto: mandarContexto, destruir: () => { window.removeEventListener('message', alMensaje); iframe.remove(); } };
}
