// Plan de crecimiento 90 días (herramienta solution-blueprint-builder de Consulting): un tablero de filas, cada una con su objetivo
// (verbo + área + de X a Y + fecha), la restricción que ataca, el sistema, el tipo de innovación, el dueño (un rol), el primer
// paso y la métrica. Módulo puro (sin DOM ni red) para que lo compartan la interfaz, el servidor y las pruebas. De aquí salen las
// tareas (el primer paso de cada fila) y las metas del cliente (la métrica de cada fila); nada se escribe solo.
import { INNOVACION, SISTEMAS, SISTEMAS_IDS, SIN_DATOS, objetivoFaltas, armarPrompt, corta, verdadero, sinAcentos, plano as esObjeto, leerBloque, leerHerramienta } from './marcos.js';

export const BLOQUE = 'blueprint';
export const TIPOS = ['capacidad', 'demanda'];
export const MESES = [1, 2, 3];
export const MAX_FILAS = 12;
export const MENSAJE_CAPACIDAD = 'Con la capacidad en rojo, primero las filas de capacidad.';

// ---------- Utilidades ----------
const INNOVACION_IDS = INNOVACION.map((i) => i.id);
// Cada enumerado se lee por su id o por el inicio de su nombre («Conversion OS», «operaciones», «modelo de negocio»); si no es ninguno, ''.
const porInicio = (v, ids) => { const s = sinAcentos(v); return ids.find((id) => id === s) || (s.length >= 4 ? ids.find((id) => id.startsWith(s.slice(0, 4))) : '') || ''; };
const sistema = (v) => porInicio(v, SISTEMAS_IDS) || (sinAcentos(v).startsWith('dinero') ? 'money' : '');
const mes = (v) => { const n = typeof v === 'number' ? v : parseInt(String(v ?? '').replace(/\D/g, ''), 10); return Number.isFinite(n) ? Math.min(3, Math.max(1, Math.round(n))) : 1; };
const idLimpio = (v) => String(v ?? '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
// Cada fila lleva un id estable (la clave de «convertir en tareas» es el entregable + este id): sin id, o repetido, recibe uno nuevo.
function asignarIds(filas) {
  const usados = new Set();
  const ids = filas.map((f) => { const id = idLimpio(f.id); if (id && !usados.has(id)) { usados.add(id); return id; } return ''; });
  let n = 0;
  return ids.map((id) => { if (id) return id; do { n++; } while (usados.has(`f${n}`)); usados.add(`f${n}`); return `f${n}`; });
}

// ---------- El contenido ----------
export function vacio() { return { horizontes: { h12: '', h35: '' }, filas: [] }; }
// Una fila en blanco para «Agregar fila», con un id que no usa ninguna otra.
export function filaVacia(filas = []) {
  const usados = new Set((filas || []).map((f) => f?.id)); let n = 1;
  while (usados.has(`f${n}`)) n++;
  return { id: `f${n}`, objetivo: '', restriccion_ref: '', sistema: '', innovacion: '', dueno: '', primer_paso: '', metrica: '', mes: 1, fuera_alcance: false, tipo: '' };
}
const limpiarFila = (f, id) => ({
  id, objetivo: corta(f.objetivo, 240), restriccion_ref: corta(f.restriccion_ref, 160), sistema: sistema(f.sistema), innovacion: porInicio(f.innovacion, INNOVACION_IDS),
  dueno: corta(f.dueno, 60), primer_paso: corta(f.primer_paso, 200), metrica: corta(f.metrica, 160), mes: mes(f.mes), fuera_alcance: verdadero(f.fuera_alcance), tipo: porInicio(f.tipo, TIPOS),
});
// Deja solo lo conocido, con tipo y tamaño. Lo que la IA o la pantalla manden de más (v, _meta, llaves raras, HTML) no entra; el texto queda como texto.
export function limpiar(contenido) {
  const c = esObjeto(contenido) ? contenido : {}, h = esObjeto(c.horizontes) ? c.horizontes : {};
  const filas = (Array.isArray(c.filas) ? c.filas : []).filter(esObjeto).slice(0, MAX_FILAS), ids = asignarIds(filas);
  return { horizontes: { h12: corta(h.h12, 600), h35: corta(h.h35, 600) }, filas: filas.map((f, i) => limpiarFila(f, ids[i])) };
}

// ---------- Lo que falta (bloquea aprobar) ----------
// extra.capacidadRoja: el medidor del Diagnóstico está en rojo → las filas de capacidad van antes que las de demanda.
export function faltas(contenido, extra = {}) {
  const c = limpiar(contenido), out = [];
  if (!c.filas.length) out.push('Agrega al menos una fila al plan.');
  c.filas.forEach((f, i) => {
    const n = `Fila ${i + 1}`, motivos = objetivoFaltas(f.objetivo);
    if (motivos.length) out.push(`${n}: el objetivo no cumple la fórmula (${motivos.join('; ')}).`);
    if (!f.dueno) out.push(`${n}: falta el dueño (un rol).`);
    if (!f.primer_paso) out.push(`${n}: falta el primer paso.`);
    if (!f.metrica) out.push(`${n}: falta la métrica.`);
  });
  if (extra?.capacidadRoja) {
    const demanda = c.filas.filter((f) => f.tipo === 'demanda'), capacidad = c.filas.filter((f) => f.tipo === 'capacidad');
    // Demanda en un mes anterior a alguna fila de capacidad, o demanda sin una sola fila de capacidad que la preceda.
    if (demanda.some((d) => (capacidad.length ? capacidad.some((k) => k.mes > d.mes) : true))) out.push(MENSAJE_CAPACIDAD);
  }
  return out;
}

// ---------- De las filas a tareas y a metas ----------
// Una tarea por fila: el primer paso. Las filas fuera de alcance no se convierten (se escalan al CEO), las que no tienen primer paso
// no tienen qué hacer y un id repetido no vuelve a crear la tarea (la clave de «convertir en tareas» es el entregable + la fila).
export function tareasDe(contenido) {
  const vistos = new Set(), out = [];
  for (const f of limpiar(contenido).filas) {
    if (f.fuera_alcance || !f.primer_paso || vistos.has(f.id)) continue;
    vistos.add(f.id);
    out.push({ title: f.primer_paso, due: '', dept: '', fila: f.id, por_que: f.objetivo });
  }
  return out;
}
const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const iso = (a, m, d) => { const f = new Date(Date.UTC(a, m - 1, d)); return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d ? f.toISOString().slice(0, 10) : ''; };
// «de X a Y» con números: X es un dato con dígitos (con su moneda) y Y llega hasta la fecha, el plazo o el fin de la frase.
const DATO = String.raw`(?:[A-Za-z$€£]{1,3}\.?\s?)?\d`;
const RE_DE_A = new RegExp(String.raw`\bde\s+(${DATO}[^\s]*(?:\s+(?:mil|mill[a-záéíóúñ]*|k)\b)?)\s+a\s+(${DATO}.*?)(?=\s+(?:para|antes|al|hasta|el|en|dentro)\b|[.;,](?:\s|$)|$)`, 'i');
// De «Aumentar las ventas de $1M a $1.5M para el 31/12/2027» → { de: '$1M', a: '$1.5M', fecha: '2027-12-31' }. Lo que no se entiende sale vacío.
export function partesObjetivo(objetivo) {
  const t = String(objetivo ?? ''), p = sinAcentos(t), x = RE_DE_A.exec(t);
  let fecha = '', m = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(p);
  if (m) fecha = iso(+m[1], +m[2], +m[3]);
  else if ((m = /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/.exec(p))) fecha = iso(+m[3], +m[2], +m[1]);
  else if ((m = new RegExp(String.raw`\b(\d{1,2}) de (${MESES_ES.join('|')})(?: de| del)? (\d{4})\b`).exec(p))) fecha = iso(+m[3], MESES_ES.indexOf(m[2]) + 1, +m[1]);
  return { de: x ? corta(x[1], 60) : '', a: x ? corta(x[2], 60) : '', fecha };
}
// Las metas de las filas con métrica, con la forma de goals.js, para mandarlas a accounts.goals. Las fuera de alcance no pasan.
// blueprint_ref + blueprint_fila es la clave para no duplicar. note queda vacío: sale en el PDF del cliente.
export function aMetas(contenido, { deliverable_id = '' } = {}) {
  const vistos = new Set(), out = [];
  for (const f of limpiar(contenido).filas) {
    if (f.fuera_alcance || !f.metrica || vistos.has(f.id)) continue;
    vistos.add(f.id);
    const p = partesObjetivo(f.objetivo);
    out.push({
      titulo: f.metrica, goal: f.objetivo || f.metrica, metric: f.metrica, baseline: p.de, target: p.a, current: p.de, due: p.fecha, status: 'now', note: '', every: '', tasks: [], checks: [],
      origen: 'consulting', blueprint_ref: String(deliverable_id || ''), blueprint_fila: f.id,
    });
  }
  return out;
}

// ---------- La IA ----------
export const SEMILLAS = [
  { id: 'plan90', titulo: 'Plan de 90 días', prompt: 'Con el diagnóstico y el árbol aprobados, arma el plan de crecimiento de 90 días: una fila por restricción, con dueño, primer paso y métrica.' },
  { id: 'capacidad', titulo: 'Primero capacidad', prompt: '¿Qué filas de capacidad van antes de pedir más demanda? Ordénalas por mes.' },
];
const F = '`'.repeat(3);
const resumen = (e) => { let s = ''; try { s = JSON.stringify(e?.contenido ?? {}); } catch { s = ''; } return `Entrada aprobada · ${corta(e?.tool, 40)} «${corta(e?.titulo, 80)}» v${Number(e?.version) || 1}: ${s.slice(0, 380)}`; };
// El pedido a la IA (< 5 000 caracteres): las reglas comunes de Consulting, el contexto del cliente (lo único que se recorta) y el método.
export const prompt = (ctx = {}) => armarPrompt({
  intro: `Eres Consulting de Inherent. Arma el PLAN DE CRECIMIENTO DE 90 DÍAS de «${corta(ctx?.cliente?.nombre, 80) || 'el cliente'}»: convierte el diagnóstico y el árbol aprobados (están en las entradas) en filas que se ejecutan, una por restricción que se ataca y no una por idea.`,
  cuerpo: [
    'Cada fila lleva:',
    '- objetivo con la fórmula: verbo en infinitivo + área + de X a Y + fecha. Ej.: «Aumentar las ventas de $1M a $1.5M para el 31/12/2027».',
    '- restriccion_ref: la restricción del Diagnóstico o del Árbol que ataca (cítala).',
    `- sistema: ${SISTEMAS_IDS.join(', ')}. innovacion: ${INNOVACION_IDS.join(', ')}.`,
    '- dueno: un ROL, nunca el nombre de una persona. primer_paso: la primera acción concreta, que cabe en una tarea. metrica: el número que dice si funcionó (ventas, margen, CAC, LTV o caja).',
    '- mes: 1, 2 o 3 (los 90 días van al frente). tipo: capacidad (que la empresa aguante) o demanda (más leads o ventas). fuera_alcance: true si el plan lo pide y la ficha no lo incluye; no se vuelve tarea y se escala al CEO.',
    'Primero capacidad: ninguna fila de demanda en un mes anterior a una de capacidad; con la capacidad en rojo, las de capacidad van primero.',
    'horizontes.h12 y h35: los objetivos a 1-2 y a 3-5 años que ya tiene Strategy, solo de contexto. Si no los tienes, vacíos.',
  ],
  salida: [
    'Al final, UN bloque (textos cortos) y otro de criterios:',
    `${F}${BLOQUE}`,
    '{"horizontes":{"h12":"…","h35":"…"},"filas":[{"id":"f1","objetivo":"Reducir el CAC de Q180 a Q120 para el 31/12/2026","restriccion_ref":"Diagnóstico: leads","sistema":"conversion","innovacion":"proceso","dueno":"Marketing","primer_paso":"…","metrica":"CAC","mes":1,"fuera_alcance":false,"tipo":"demanda"}]}',
    F,
    `${F}criterios`,
    '{"entregable":"Plan de crecimiento 90 días","cumple":["…"],"falta":["…"]}',
    F,
  ],
  extra: (ctx?.entradas || []).slice(0, 3).map(resumen),
}, ctx);
// Busca el bloque ```blueprint en la respuesta (el último bueno). JSON roto, bloque a medias o un objeto sin nada conocido → null.
export function leer(texto) {
  const j = leerBloque(texto, BLOQUE);
  return j && ('filas' in j || 'horizontes' in j) ? leerHerramienta(texto, BLOQUE, limpiar) : null;
}

// ---------- Exportar ----------
const FALTA = `${SIN_DATOS}: falta definirlo`;
export function aMd(contenido) {
  const c = limpiar(contenido), sinHorizonte = `${SIN_DATOS}: los objetivos los define Strategy`;
  const L = ['# Plan de crecimiento 90 días', '', '## Contexto (de Strategy)', '', `- A 1-2 años: ${c.horizontes.h12 || sinHorizonte}`, `- A 3-5 años: ${c.horizontes.h35 || sinHorizonte}`];
  for (const m of MESES) {
    const filas = c.filas.filter((f) => f.mes === m);
    L.push('', `## Mes ${m}`, '');
    if (!filas.length) { L.push('Sin filas este mes.'); continue; }
    for (const f of filas) {
      L.push(`### ${f.objetivo || FALTA}`, '', `- Restricción que ataca: ${f.restriccion_ref || FALTA}`);
      L.push(`- Sistema: ${SISTEMAS[f.sistema]?.nombre || '—'} · Innovación: ${f.innovacion || '—'} · Tipo: ${f.tipo || '—'}`);
      L.push(`- Dueño (rol): ${f.dueno || FALTA}`, `- Primer paso: ${f.primer_paso || FALTA}`, `- Métrica: ${f.metrica || FALTA}`);
      if (f.fuera_alcance) L.push('- ⚠️ FUERA DEL ALCANCE: no se convierte en tarea; se escala al CEO.');
      L.push('');
    }
  }
  return L.join('\n');
}
