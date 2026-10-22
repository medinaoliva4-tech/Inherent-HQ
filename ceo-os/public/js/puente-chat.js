// Hablar con el Claude de esta compu por el puente local de Laya (puerto 7357), en SOLO LECTURA (la regla vive en puente.py).
// Lo usan las pantallas que piden algo a Claude fuera de Estrategia (ej. Cliente ideal). El token es el mismo con el que se
// emparejó la compu en Estrategia.
import { PUENTE } from './laya.js';

// Dos fallas que la gente no puede adivinar, con sus pasos (los mismos de INSTALAR.md › «Si el chat no conecta»).
// 1) Chrome guardó una copia vieja del OS con una regla de seguridad que no deja hablar con la compu.
let bloqueado = false;
if (typeof document !== 'undefined') document.addEventListener('securitypolicyviolation', (e) => { if (String(e.blockedURI || '').includes(':7357')) bloqueado = true; });
export const chromeBloquea = () => bloqueado;
export const PASOS_COPIA_VIEJA = 'Chrome guardó una versión vieja del OS. Toca el ícono a la izquierda de la dirección → «Configuración del sitio» → «Borrar datos». Cierra la pestaña, ábrela de nuevo y vuelve a emparejar la compu.';
// 2) La sesión de Claude Code en esa compu se venció.
export const sesionVencida = (m) => /oauth|authenticat|login|not logged|session expired|unauthorized/i.test(String(m || ''));
export const PASOS_LOGIN = 'Se venció la sesión de Claude en tu compu. Abre la Terminal, escribe claude y Enter, luego /login y Enter, e inicia sesión en el navegador. Después vuelve aquí y manda el mensaje otra vez.';

export const tokenDe = (me) => { try { return window.inherentEscritorio?.token || localStorage.getItem(`os.estrategia.token.${me.email}`) || ''; } catch { return ''; } };

// ¿El puente está encendido y con chat? → { on, listo, ayuda }
export async function saludPuente(ms = 15000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(PUENTE + '/health', { signal: c.signal, credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback' }); if (!r.ok) return { on: false }; const j = await r.json(); return { on: j.status === 'ok', listo: Boolean(j.chat?.listo), ayuda: j.chat?.ayuda || null }; }
  catch { return { on: false, bloqueado: bloqueado }; } finally { clearTimeout(t); }
}

// Manda el prompt y va entregando el texto (onDelta) y lo que Claude lee (onTool). Devuelve el texto final.
export async function preguntar({ prompt, token, signal, onDelta = () => {}, onTool = () => {} }) {
  const r = await fetch(PUENTE + '/chat', { method: 'POST', credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback', signal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ prompt }) });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw Object.assign(new Error(j.error || `El puente respondió ${r.status}`), { status: r.status }); }
  const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '', texto = '', fallo = null;
  for (;;) {
    const { value, done } = await rd.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let k; while ((k = buf.indexOf('\n\n')) >= 0) {
      const bloq = buf.slice(0, k); buf = buf.slice(k + 2);
      const ev = /^event: (\w+)/m.exec(bloq)?.[1]; let d = {}; try { d = JSON.parse(/^data: (.*)$/m.exec(bloq)?.[1] || '{}'); } catch {}
      if (ev === 'delta') { texto += d.texto || ''; onDelta(texto); }
      else if (ev === 'herramienta') onTool(`${d.nombre === 'Read' ? 'Leyendo' : 'Buscando'} ${d.detalle || ''}`.trim());
      else if (ev === 'fin') texto = d.texto || texto;
      else if (ev === 'error') fallo = d;
    }
  }
  if (fallo) throw new Error(sesionVencida(fallo.error) ? PASOS_LOGIN : fallo.error || 'Claude no pudo responder');
  return texto;
}
