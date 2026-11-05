// Modo conversación del Chat (PLAN-GATEWAY §22): hablar y escuchar como en una llamada. Aquí va lo puro; la pantalla está en conversacion-ui.js.
const ETIQUETA = { escuchando: 'Escuchando…', pensando: 'Pensando…', hablando: 'Hablando…', pausa: 'En pausa' };
export const etiquetaDe = (estado) => ETIQUETA[estado] || '';

// Qué sigue según lo que pasó. El mic grande depende del momento: pausa, detiene o interrumpe.
export function siguiente(estado, evento) {
  if (evento === 'mic') return { escuchando: 'pausa', pausa: 'escuchando', pensando: 'escuchando', hablando: 'escuchando' }[estado] || estado;
  if (evento === 'enviado') return 'pensando';
  if (evento === 'voz') return estado === 'pensando' ? 'hablando' : estado;
  if (evento === 'fin') return estado === 'pausa' ? 'pausa' : 'escuchando';
  return estado;
}

// Lo que se lee en voz alta: sin código, enlaces, tablas ni marcas de formato.
export function limpiarParaVoz(md) {
  return String(md || '')
    .replace(/```[\s\S]*?(```|$)/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/^\s*\|.*\|\s*$/gm, ' ')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/[*_~#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Las frases completas que faltan por decir mientras llega la respuesta. Al final se dice también lo que quedó sin punto.
export function frasesNuevas(texto, dichas, { fin = false } = {}) {
  const resto = String(texto || '').slice(dichas);
  const frases = []; let usado = 0;
  for (const m of resto.matchAll(/[^.!?…\n]+[.!?…\n]+["»)]*\s*/g)) { frases.push(m[0].trim()); usado = m.index + m[0].length; }
  if (fin && resto.slice(usado).trim()) { frases.push(resto.slice(usado).trim()); usado = resto.length; }
  return { frases: frases.filter((f) => /[\p{L}\p{N}]/u.test(f)), dichas: dichas + usado };
}

// El aro: qué tan fuerte brilla un punto a cierta distancia del centro. 0 fuera del aro.
export function brilloDelAro(dist, radio, ancho) {
  const d = Math.abs(dist - radio) / ancho;
  return d >= 1 ? 0 : (1 - d) ** 2;
}

// Cómo debe responder el modelo cuando la respuesta se va a escuchar.
export const PROMPT_VOZ = 'Esta conversación es hablada: responde como en una llamada, en frases cortas y naturales, máximo tres o cuatro. Sin listas, tablas, código, enlaces ni tarjetas. Si hace falta algo largo, resume y ofrece dejarlo escrito en el chat.';
