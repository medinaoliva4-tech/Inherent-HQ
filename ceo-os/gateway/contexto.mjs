// Que el pedido quepa en cualquier modelo (PLAN-GATEWAY §24). Sin red: se prueba con test-agentes.
const estimar = (t) => Math.ceil(String(t ?? '').length / 3.4);
export const tokensDe = (messages, tools) => estimar(JSON.stringify(messages)) + (tools?.length ? estimar(JSON.stringify(tools)) : 0);
// «allowed on your plan is 32768 tokens», «maximum context length is 8192»: el error dice el tope real.
export function leerLimite(texto) {
  const t = String(texto || '');
  if (!/context.?length|context window|too many tokens|prompt is too long/i.test(t)) return null;
  const m = t.match(/(?:is|of|limit(?:\s+is)?)\s+(\d{4,7})\s*tokens/i) || t.match(/(\d{4,7})\s*tokens/);
  return { limite: m ? Number(m[1]) : 0 };
}
const NOTA = '\n\n[… recortado para que quepa en este modelo …]\n\n';
export function recortarTexto(t, tope) {
  const s = String(t ?? ''), max = Math.max(200, Math.floor(tope * 3.4));
  if (s.length <= max) return s;
  const pie = Math.floor(max * 0.3);
  return s.slice(0, max - pie - NOTA.length) + NOTA + s.slice(-pie);
}
const texto = (m) => typeof m.content === 'string';
// Cuida por orden: primero lo que menos importa. El sistema y el último mensaje de la persona siempre quedan.
export function ajustarAlTope(messages, tope, tools) {
  const xs = messages.map((m) => ({ ...m }));
  const medir = () => tokensDe(xs, tools);
  if (medir() <= tope) return xs;
  // 1. Resultados de herramientas viejos.
  for (const m of xs) if (m.role === 'tool' && texto(m) && medir() > tope) m.content = recortarTexto(m.content, 300);
  // 2. Mensajes viejos. Una llamada a herramienta se va junto con sus resultados.
  const ultimoUser = () => xs.map((m) => m.role).lastIndexOf('user');
  for (let i = 1; medir() > tope && i < ultimoUser();) {
    xs.splice(i, 1);
    while (xs[i]?.role === 'tool') xs.splice(i, 1);
  }
  // 3. El sistema, hasta la mitad del tope.
  if (medir() > tope && xs[0]?.role === 'system') xs[0].content = recortarTexto(xs[0].content, Math.floor(tope * 0.5));
  // 4. Lo que queda, parejo y sin tirarlo: un archivo grande conserva inicio y final.
  const resto = xs.slice(1).filter(texto);
  if (medir() > tope && resto.length) { const cuota = Math.max(300, Math.floor(tope * 0.45 / resto.length)); for (const m of resto) m.content = recortarTexto(m.content, cuota); }
  return xs;
}
