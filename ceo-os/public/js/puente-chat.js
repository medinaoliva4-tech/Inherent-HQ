// Hablar con el Claude de esta compu por el puente local de Laya (puerto 7357), en SOLO LECTURA (la regla vive en puente.py).
// Lo usan las pantallas que piden algo a Claude fuera de Estrategia (ej. Cliente ideal). El token es el mismo con el que se
// emparejó la compu en Estrategia.
import { PUENTE } from './laya.js';

export const tokenDe = (me) => { try { return localStorage.getItem(`os.estrategia.token.${me.email}`) || ''; } catch { return ''; } };

// ¿El puente está encendido y con chat? → { on, listo, ayuda }
export async function saludPuente() {
  const c = new AbortController(), t = setTimeout(() => c.abort(), 1500);
  try { const r = await fetch(PUENTE + '/health', { signal: c.signal, credentials: 'omit', cache: 'no-store' }); if (!r.ok) return { on: false }; const j = await r.json(); return { on: j.status === 'ok', listo: Boolean(j.chat?.listo), ayuda: j.chat?.ayuda || null }; }
  catch { return { on: false }; } finally { clearTimeout(t); }
}

// Manda el prompt y va entregando el texto (onDelta) y lo que Claude lee (onTool). Devuelve el texto final.
export async function preguntar({ prompt, token, signal, onDelta = () => {}, onTool = () => {} }) {
  const r = await fetch(PUENTE + '/chat', { method: 'POST', credentials: 'omit', cache: 'no-store', signal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ prompt }) });
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
  if (fallo) throw new Error(fallo.error || 'Claude no pudo responder');
  return texto;
}
