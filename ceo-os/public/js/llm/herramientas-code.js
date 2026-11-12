// La pestaña «Herramientas» del panel derecho del Chat: Code OS embebido (iframe de code.inherentglobal.com/?embed=1).
// Contrato: code-os/ui/docs/embebido.md (PR #298). El OS es la única puerta: emite el pase (POST /api/code/pase), lo manda por
// postMessage y lo renueva; manda el contexto (cliente, sesión del puente, rol, tema, nivel, aislada); y atiende «codeos:al-chat».
// Seguridad: solo se aceptan mensajes del iframe (e.source) y de SU origen exacto (e.origin); se responde solo a ese origen.
// La parte pura (sin DOM ni red) la prueba scripts/test-herramientas-code.mjs; montarHerramientas es la parte de pantalla.

import { RAPIDAS } from '../laya.js';

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
 * «codeos:juicio» (extensión del contrato que propone este PR): una herramienta pide un juicio rápido de Laya sobre un texto.
 * { id, puerta: 'prospecto'|'dolor_deseo'|'gancho'|'quemado'|'voz', texto, contexto?: { marca, icp, voz, referencias } }.
 * El OS es el que habla con el puente local de Laya de cada persona (127.0.0.1:7357): el iframe no puede ni debe tocarlo.
 * → { id, puerta, entrada } limpio, o null.
 */
export function leerJuicio(d, rapidas = []) {
  const id = typeof d?.id === 'string' && /^[\w-]{1,64}$/.test(d.id) ? d.id : ''; if (!id) return null;
  const puerta = rapidas.includes(d.puerta) ? d.puerta : ''; if (!puerta) return null;
  const texto = typeof d.texto === 'string' ? d.texto.trim().slice(0, 4000) : ''; if (!texto) return null;
  const c = d.contexto && typeof d.contexto === 'object' ? d.contexto : {};
  const contexto = Object.fromEntries(['marca', 'icp', 'voz', 'referencias'].filter((k) => typeof c[k] === 'string' && c[k].trim()).map((k) => [k, c[k].trim().slice(0, 2000)]));
  return { id, puerta, entrada: { texto, contexto } };
}
/**
 * Qué hacer con un mensaje ya validado → [{ hacer: 'pase', forzar } | { hacer: 'contexto' } | { hacer: 'al-chat', ... }].
 * Puro: la pantalla ejecuta las acciones (montarHerramientas).
 */
export function acciones(d, { rapidas = RAPIDAS } = {}) {
  switch (d?.tipo) {
    case 'codeos:juicio': { const x = leerJuicio(d, rapidas); return x ? [{ hacer: 'juicio', ...x }] : typeof d?.id === 'string' && /^[\w-]{1,64}$/.test(d.id) ? [{ hacer: 'juicio-invalido', id: d.id }] : []; }
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
  try { p = await opts.pase(false); } catch (e) { console.warn('Herramientas: no se pudo pedir el pase', e); opts.alError?.(e.status === 503 ? 'Code no está configurado todavía. Avísale al CEO.' : 'No se pudieron abrir las herramientas. Intenta de nuevo.'); return null; }
  const origen = origenDe(p.ui || p.url), src = urlEmbebida(p.ui || p.url, p.pase);
  if (!origen || !src) { console.warn('Herramientas: CODEOS_UI_URL/CODEOS_URL no es https', p.ui || p.url); opts.alError?.('No se pudo abrir las herramientas. Revisa la dirección configurada.'); return null; }
  const iframe = document.createElement('iframe');
  Object.assign(iframe, { src, title: 'Herramientas' });
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
      else if (a.hacer === 'juicio-invalido') enviar({ tipo: 'codeos:juicio-resultado', id: a.id, ok: false, aviso: 'Pedido de juicio inválido: puerta o texto' });
      else if (a.hacer === 'juicio') {
        // Nunca bloquea: sin Laya, la respuesta dice por qué y la herramienta sigue.
        let r; try { r = opts.juicio ? await opts.juicio(a.puerta, a.entrada) : { ok: false, aviso: 'Este OS no tiene Laya' }; } catch (er) { r = { ok: false, aviso: er.message || 'Laya no pudo' }; }
        enviar({ tipo: 'codeos:juicio-resultado', id: a.id, puerta: a.puerta, ...r });
      }
    }
  }
  window.addEventListener('message', alMensaje);
  caja.replaceChildren(iframe);
  return { iframe, contexto: mandarContexto, destruir: () => { window.removeEventListener('message', alMensaje); iframe.remove(); } };
}
