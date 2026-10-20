// App 01 · Marca › Entender › Cliente ideal: los avatares de una marca. Lo comparten el servidor (api/_lib/avatares.js) y la interfaz.
// El método (del CEO, completado con Hormozi, Schwartz, Jobs-to-be-Done y Copyhackers):
//   precio → ingreso (regla interna: el avatar gana unas 10 veces lo que cuesta la oferta) → a qué se dedica → zona → edad →
//   etapa de vida → nicho e intereses → el para qué: dónde está, qué le duele, qué desea y qué oferta no puede rechazar.
// Una marca puede tener varios avatares, cada uno con su % de peso: el principal recibe más contenido y más pauta.
// Las señales del video: Meta lleva el video a quien el video describe; por eso se dice y se muestra quién es.
import { CONSCIENCIA } from './calendario-contenido.js';

export const COLL = 'avatars';
export const REGLA_X = 10; // regla interna del CEO: ingreso ≈ 10× el precio
export const ANGULOS = ['Dolor', 'Deseo', 'Identidad', 'Objeción rota', 'Comparación', 'Prueba', 'Mecanismo único', 'Momento de vida', 'Temporada'];
export const ANGULO_AYUDA = {
  Dolor: '«Si te pasa X…»', Deseo: 'El resultado que quiere', Identidad: '«Para el que…»', 'Objeción rota': 'Lo que casi lo frena, resuelto',
  Comparación: 'Contra lo que usa hoy', Prueba: 'Un caso, un número, un antes y después', 'Mecanismo único': 'Por qué esto funciona distinto',
  'Momento de vida': 'Lo que le está pasando ahora', Temporada: 'Quincena, aguinaldo, Semana Santa…',
};
export const MERCADO = [['dolor', 'Dolor', 'Qué tanto le duele'], ['poder', 'Poder de compra', 'Puede pagarlo'], ['facil', 'Fácil de encontrar', 'Se le puede segmentar'], ['crece', 'Mercado que crece', 'Hay más cada año']];

// [id, nombre, ayuda, campos]. Campo: [clave, etiqueta, tipo, ayuda?]. Tipos: num · txt · area · lista (una por línea) · score · nivel.
export const SECCIONES = [
  ['pago', 'Capacidad de pago', `Tu regla interna: el avatar gana unas ${REGLA_X} veces lo que cuesta la oferta. De ahí sale a qué se dedica.`, [
    ['precio', 'Precio de la oferta (Q)', 'num'], ['ingreso', 'Ingreso mensual del avatar (Q)', 'num'], ['ocupacion', 'A qué se dedica', 'txt'],
    ['decide', 'Quién paga y quién decide', 'txt'], ['empresa', 'Si es B2B: industria, tamaño, facturación y rol', 'area']]],
  ['quien', 'Quién es', 'Dónde vive, cuántos años tiene y qué le está pasando en la vida por su edad.', [
    ['zona', 'Zona', 'txt'], ['edad', 'Edad', 'txt', 'Ej. 28 a 40'], ['etapa', 'Qué le pasa en la vida', 'area'], ['nse', 'Nivel socioeconómico', 'txt', 'Ej. A/B, C+']]],
  ['interes', 'Qué le interesa', 'El nicho, sus otros intereses y las cuentas que sigue: de ahí sale cómo habla.', [
    ['nicho', 'Nicho', 'txt'], ['intereses', 'Otros intereses', 'area'], ['cuentas', 'Cuentas que sigue (@ de Instagram, TikTok…)', 'lista'],
    ['identidad', 'Quién quiere ser', 'txt'], ['valores', 'Valores y miedos', 'area']]],
  ['mercado', 'Mercado', 'El puntaje de Hormozi, de 1 a 5. Un buen mercado tiene dolor, puede pagar, se le encuentra fácil y crece.', [
    ...MERCADO.map(([k, l, a]) => [k, l, 'score', a])]],
  ['momento', 'El momento', 'Qué lo dispara a buscar, qué trabajo nos contrata para hacer y qué usa hoy en vez de nosotros.', [
    ['disparador', 'Qué lo dispara a buscar', 'area'], ['tarea', 'Qué trabajo nos contrata para hacer', 'area'], ['alternativas', 'Qué usa hoy en vez de nosotros', 'area']]],
  ['dolor', 'Dolor y deseo', 'Con sus palabras literales: comentarios, reseñas, mensajes. Una por línea.', [
    ['dolores', 'Lo que le duele', 'lista'], ['deseos', 'El resultado que desea', 'lista'], ['objeciones', 'Lo que casi lo frena', 'lista'], ['frases', 'Frases literales del cliente', 'lista']]],
  ['consciencia', 'Consciencia', 'Qué tanto sabe de su problema y de nosotros: decide si le hablamos del problema o directo de la oferta.', [
    ['nivel', 'Nivel de consciencia', 'nivel'], ['sofisticacion', 'Qué tanto ha visto ya (sofisticación del mercado)', 'txt']]],
  ['donde', 'Dónde está', 'Dónde aparecerle enfrente.', [['canales', 'Redes y lugares', 'lista'], ['meta', 'Intereses para segmentar en Meta', 'area']]],
  ['mensaje', 'Qué le decimos', 'La oferta (servicio) o la experiencia (restaurante, tienda) que no puede rechazar, y cómo se lo decimos.', [
    ['oferta', 'Oferta o experiencia irresistible', 'area'], ['tono', 'Tono', 'txt'], ['prohibidas', 'Palabras que no usamos', 'txt']]],
  ['video', 'Señales en el video', 'Meta lleva el video a quien el video describe. Di y muestra quién es: edad, situación, lugar, detalles. Mientras más específico, mejor llega.', [
    ['decir', 'Qué decir en el video', 'lista'], ['mostrar', 'Qué mostrar en el video', 'lista']]],
];
export const CAMPOS = SECCIONES.flatMap(([, , , c]) => c);
const TIPO = Object.fromEntries(CAMPOS.map(([k, , t]) => [k, t]));

// ---------- Limpiar lo que llega (servidor y Claude) ----------
const txt = (v, n = 400) => String(v ?? '').replace(/\s+$/g, '').slice(0, n);
export function limpiarCampos(c = {}) {
  const out = {};
  for (const [k, t] of Object.entries(TIPO)) {
    if (!(k in c)) continue;
    const v = c[k];
    if (t === 'num') { const n = Math.round(+String(v ?? '').replace(/[^\d.]/g, '')); if (n > 0) out[k] = n; else if (v === '' || v == null) out[k] = null; }
    else if (t === 'score') { const n = Math.round(+v); out[k] = n >= 1 && n <= 5 ? n : null; }
    else if (t === 'nivel') { const n = Math.round(+v); out[k] = n >= 1 && n <= CONSCIENCIA.length ? n : null; }
    else if (t === 'lista') out[k] = (Array.isArray(v) ? v : String(v ?? '').split('\n')).map((x) => txt(x, 300).trim()).filter(Boolean).slice(0, 30);
    else out[k] = txt(v, t === 'area' ? 2000 : 300);
  }
  return out;
}
export const limpiarAngulos = (l) => (Array.isArray(l) ? l : []).map((a) => ({ tipo: ANGULOS.includes(a?.tipo) ? a.tipo : 'Dolor', texto: txt(a?.texto, 400).trim() })).filter((a) => a.texto).slice(0, 30);
export const pesoOk = (v) => { const n = Math.round(+v); return n >= 0 && n <= 100 ? n : 0; };

// ---------- Lecturas ----------
export const vivos = (l = []) => l.filter((a) => !a.archivado).sort((a, z) => (z.peso || 0) - (a.peso || 0) || String(a.nombre).localeCompare(String(z.nombre)));
export const sumaPesos = (l = []) => vivos(l).reduce((s, a) => s + (a.peso || 0), 0);
export const principal = (l = []) => vivos(l)[0] || null;
// La regla del 10×: ¿el ingreso alcanza para el precio? null si falta un dato.
export function reglaX(c = {}) {
  if (!(c.precio > 0) || !(c.ingreso > 0)) return null;
  const x = c.ingreso / c.precio;
  return { x: Math.round(x * 10) / 10, ok: x >= REGLA_X, sugerido: c.precio * REGLA_X };
}
export const mercado = (c = {}) => { const v = MERCADO.map(([k]) => c[k]).filter((n) => n >= 1); return v.length ? { suma: v.reduce((s, n) => s + n, 0), de: v.length * 5, completo: v.length === MERCADO.length } : null; };
// Qué tan completa está la ficha (para el chip): campos con algo / campos totales.
export function avance(a) {
  const c = a?.campos || {}, llenos = CAMPOS.filter(([k, , t]) => { const v = c[k]; return t === 'lista' ? v?.length : v != null && v !== ''; }).length;
  return Math.round((llenos / CAMPOS.length) * 100);
}
// Una línea por avatar: lo que leen Laya y el chat.
export function resumenAvatar(a) {
  const c = a?.campos || {}, j = (l) => (l || []).slice(0, 3).join('; ');
  return [`${a.nombre}${a.peso ? ` (${a.peso}%)` : ''}`, [c.ocupacion, c.edad && `${c.edad} años`, c.zona].filter(Boolean).join(', '),
    c.dolores?.length && `le duele: ${j(c.dolores)}`, c.deseos?.length && `desea: ${j(c.deseos)}`, c.nivel && `consciencia: ${CONSCIENCIA[c.nivel - 1]}`].filter(Boolean).join(' · ');
}

// ---------- Lo que se le pide a Claude ----------
// Claude corre en la compu de cada persona (puente local), en SOLO LECTURA, dentro del repo: puede leer la carpeta del cliente.
export function promptAvatar({ marca, carpeta, avatar, otros = [], pedido = '' }) {
  const campos = CAMPOS.map(([k, l, t]) => `  "${k}": ${t === 'lista' ? '["…"]' : t === 'num' || t === 'score' || t === 'nivel' ? 'número' : '"…"'}  // ${l}${t === 'score' ? ' (1 a 5)' : t === 'nivel' ? ` (1 a 5: ${CONSCIENCIA.join(', ')})` : ''}`).join('\n');
  return [
    `Eres ① Strategy de Inherent. Trabajas en SOLO LECTURA: no crees ni cambies archivos. Vas a completar la ficha de un avatar (cliente ideal) de la marca ${marca}.`,
    `Lee primero, si existen: inherent/00-PRINCIPIOS.md, ${carpeta}/00-onboarding/plan-contratado.md, lo que haya del avatar o la comprensión en ${carpeta}/ (Grep «avatar», «ICP», «cliente ideal») y ${carpeta}/99-referencias/investigacion/.`,
    '',
    'El método, en este orden:',
    `1. Precio de la oferta → ingreso del avatar (regla interna de Inherent: gana unas ${REGLA_X} veces el precio) → a qué se dedica.`,
    '2. Zona → edad → qué le está pasando en la vida por su edad → nivel socioeconómico.',
    '3. Nicho, otros intereses, cuentas que sigue (@) y quién quiere ser.',
    '4. Puntaje de mercado de Hormozi (1 a 5): dolor, poder de compra, fácil de encontrar, mercado que crece.',
    '5. El momento (Jobs-to-be-Done): qué lo dispara a buscar, qué trabajo nos contrata para hacer, qué usa hoy en vez de nosotros.',
    '6. Dolor y deseo con sus palabras literales (Copyhackers): lo que le duele, el resultado que desea, lo que casi lo frena, frases literales.',
    '7. Nivel de consciencia (Schwartz) y sofisticación del mercado.',
    '8. Dónde está (redes y lugares, intereses para segmentar en Meta) y qué le decimos (oferta o experiencia irresistible, tono).',
    '9. Señales en el video: Meta lleva el video a quien el video describe. Lista qué decir y qué mostrar para que se note a quién le habla (edad, situación, lugar, detalles concretos).',
    '10. Ángulos de contenido para este avatar, uno por tipo que aplique: ' + ANGULOS.join(', ') + '.',
    '',
    'Reglas: evidencia o etiqueta. Lo que no salga del repo o de los datos, márcalo al final del texto con [hipótesis]. Nunca inventes cifras del cliente: si no hay precio, deja precio vacío. Español de «tú».',
    otros.length ? `Otros avatares de esta marca (no los repitas):\n${otros.map((o) => '- ' + resumenAvatar(o)).join('\n')}` : '',
    `El avatar que completas: «${avatar.nombre}». Lo que ya tiene (respétalo y mejóralo):\n${JSON.stringify(avatar.campos || {}, null, 1)}`,
    pedido ? `Pedido de la persona: ${pedido}` : '',
    '',
    'Responde con un resumen de 3 líneas y, al final, UN bloque ```json con esta forma exacta (solo las claves que puedas llenar):',
    '```json\n{\n "campos": {\n' + campos + '\n },\n "angulos": [{ "tipo": "Dolor", "texto": "…" }]\n}\n```',
  ].filter((x) => x !== '').join('\n');
}
// El bloque JSON de la respuesta de Claude → { campos, angulos } limpios, o null.
export function leerPropuesta(texto) {
  const m = [...String(texto || '').matchAll(/```json\s*([\s\S]*?)```/g)].at(-1);
  if (!m) return null;
  try { const j = JSON.parse(m[1]); return { campos: limpiarCampos(j.campos || {}), angulos: limpiarAngulos(j.angulos) }; } catch { return null; }
}
