// Brand DNA Studio (herramienta brand-dna-studio de Creative): territorio y arquetipo (es / no es), ejes de personalidad, voz
// (tono en 3 palabras, pares bien/mal, palabras sí/no) y 3 a 5 activos distintivos, cada uno con su prueba. Módulo puro (sin DOM
// ni red): lo comparten la vista, la IA y las pruebas. Su casa es brand_boards.dna. Sin dato no hay valor: ⚠️ SIN DATOS, nunca 0.
import { plano, corta, entero, textos, leerHerramienta, contextoPrompt, SIN_DATOS, sinDatos, celda } from '../consulting/marcos.js';

export const BLOQUE = 'dna';
export const SECCIONES = [
  { id: 'territorio', nombre: 'Territorio y arquetipo', agente: 'br-territorio' },
  { id: 'personalidad', nombre: 'Personalidad', agente: 'br-territorio' },
  { id: 'voz', nombre: 'Voz', agente: 'br-voz' },
  { id: 'activos', nombre: 'Activos distintivos', agente: 'br-activos' },
];
// Los 6 ejes fijos (de 0 a 10; null = sin ubicar). Fijos para que el radar compare marcas entre sí.
export const EJES = [
  { id: 'cercania', izq: 'Formal', der: 'Cercana' },
  { id: 'tiempo', izq: 'Clásica', der: 'Moderna' },
  { id: 'expresion', izq: 'Sobria', der: 'Expresiva' },
  { id: 'acceso', izq: 'Exclusiva', der: 'Accesible' },
  { id: 'energia', izq: 'Calmada', der: 'Enérgica' },
  { id: 'humor', izq: 'Seria', der: 'Juguetona' },
];
export const MIN_ACTIVOS = 3, MAX_ACTIVOS = 5, TONO_N = 3;
const ids = (xs) => xs.map((x) => x.id);

export function vacio() {
  return {
    territorio: { territorio: '', arquetipo: '', es: [], no_es: [] },
    personalidad: EJES.map((e) => ({ eje: e.id, valor: null })),
    voz: { tono: [], pares: [], si: [], no: [] },
    activos: [],
  };
}

// Solo lo conocido, con su tipo y su tamaño. El HTML que traiga queda como texto (html`…` lo escapa al pintar).
export function limpiar(c) {
  const o = plano(c) ? c : {}, t = plano(o.territorio) ? o.territorio : {}, v = plano(o.voz) ? o.voz : {};
  const vistos = new Map();
  for (const x of Array.isArray(o.personalidad) ? o.personalidad : []) if (plano(x) && ids(EJES).includes(x.eje) && !vistos.has(x.eje)) vistos.set(x.eje, entero(x.valor, 0, 10));
  const pares = (Array.isArray(v.pares) ? v.pares : []).filter(plano).map((p) => ({ bien: corta(p.bien, 160), mal: corta(p.mal, 160) })).filter((p) => p.bien || p.mal).slice(0, 5);
  const activos = (Array.isArray(o.activos) ? o.activos : []).filter(plano).map((a) => ({ nombre: corta(a.nombre, 80), que: corta(a.que, 240), prueba: corta(a.prueba, 240) })).filter((a) => a.nombre || a.que || a.prueba).slice(0, MAX_ACTIVOS);
  return {
    territorio: { territorio: corta(t.territorio, 300), arquetipo: corta(t.arquetipo, 120), es: textos(t.es, 6, 120), no_es: textos(t.no_es, 6, 120) },
    personalidad: EJES.map((e) => ({ eje: e.id, valor: vistos.get(e.id) ?? null })),
    voz: { tono: textos(v.tono, TONO_N, 40), pares, si: textos(v.si, 10, 40), no: textos(v.no, 10, 40) },
    activos,
  };
}

// Reemplaza una sección (aceptar «de a una»); lo demás queda como estaba.
export function mezclar(actual, nuevo, seccion) {
  const a = limpiar(actual), n = limpiar(nuevo);
  if (seccion === 'territorio') a.territorio = n.territorio;
  else if (seccion === 'personalidad') a.personalidad = n.personalidad;
  else if (seccion === 'voz') a.voz = n.voz;
  else if (seccion === 'activos') a.activos = n.activos;
  return a;
}
// ¿Esta sección trae algo? (para no ofrecer aceptar una vacía)
export function seccionLlena(c, id) {
  const x = limpiar(c);
  if (id === 'territorio') return Boolean(x.territorio.territorio || x.territorio.arquetipo || x.territorio.es.length || x.territorio.no_es.length);
  if (id === 'personalidad') return x.personalidad.some((p) => p.valor !== null);
  if (id === 'voz') return Boolean(x.voz.tono.length || x.voz.pares.length || x.voz.si.length || x.voz.no.length);
  if (id === 'activos') return x.activos.length > 0;
  return false;
}

// ---------- Cálculos ----------
// Los puntos del radar (viewBox centrado en 0,0): solo los ejes con valor. Con menos de 3 no hay polígono (⚠️ SIN DATOS).
export function radar(c, r = 100) {
  const ps = limpiar(c).personalidad, n = ps.length;
  const punto = (i, k) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; return [Math.round(Math.cos(a) * r * k * 100) / 100, Math.round(Math.sin(a) * r * k * 100) / 100]; };
  const ejes = ps.map((p, i) => ({ ...EJES[i], valor: p.valor, fin: punto(i, 1), punta: p.valor === null ? null : punto(i, p.valor / 10) }));
  const con = ejes.filter((e) => e.punta);
  return { ejes, poligono: con.length >= 3 ? con.map((e) => e.punta.join(',')).join(' ') : '', ubicados: con.length };
}

// Lo que falta para validar. extra: { ficha: bool (¿hay ficha de oferta?), aprobada: bool (¿hay estrategia aprobada?) }.
export function faltas(c, extra = {}) {
  const x = limpiar(c), f = [];
  if (extra.ficha === false) f.push('Sin ficha de oferta no se valida: sale de clients/<cliente>/00-onboarding/plan-contratado.md');
  if (!x.territorio.territorio) f.push(`Falta el territorio (${SIN_DATOS})`);
  if (!x.territorio.arquetipo) f.push(`Falta el arquetipo (${SIN_DATOS})`);
  if (!x.territorio.es.length || !x.territorio.no_es.length) f.push('Falta lo que la marca es y lo que no es');
  const sin = x.personalidad.filter((p) => p.valor === null).length;
  if (sin) f.push(`Faltan ${sin} de ${x.personalidad.length} ejes de personalidad`);
  if (x.voz.tono.length < TONO_N) f.push(`El tono va en ${TONO_N} palabras (hay ${x.voz.tono.length})`);
  if (!x.voz.pares.some((p) => p.bien && p.mal)) f.push('Falta al menos un par bien / mal de la voz');
  if (!x.voz.si.length || !x.voz.no.length) f.push('Faltan las palabras que sí y las que no');
  if (x.activos.length < MIN_ACTIVOS) f.push(`Con menos de ${MIN_ACTIVOS} activos no se valida (hay ${x.activos.length})`);
  x.activos.forEach((a, i) => { if (!a.nombre || !a.prueba) f.push(`El activo ${i + 1} necesita nombre y su prueba`); });
  return f;
}

// ---------- Prompt ----------
// seccion (opcional, ctx.seccion): una sola sección, para el paso a paso br-territorio → br-voz → br-activos.
// La estrategia aprobada llega en ctx.aprobada (texto corto); sin ella la vista no deja generar.
export function prompt(ctx) {
  const c = plano(ctx) ? ctx : {}, sec = SECCIONES.find((s) => s.id === c.seccion);
  const pasos = sec ? [`Hoy solo pides la sección «${sec.nombre}» (${sec.agente}); las demás van vacías.`] : ['Pasos: ① br-territorio (territorio, arquetipo y ejes) → ② br-voz → ③ br-activos.'];
  const antes = [
    'Eres ②A Branding de Inherent: armas el ADN de la marca de un cliente con su estrategia APROBADA. Trabajas en SOLO LECTURA: lo que escribes es un borrador que la persona acepta sección por sección.',
    'REGLAS: valores que se ejecutan, no adjetivos. Evidencia o etiqueta: lo que no tiene fuente va como [dice el cliente, sin verificar] o queda vacío (null), nunca 0. Nada de costos ni 06-ECONOMIA de Inherent. Roles, no nombres. Español de «tú», corto y humano. El repo no se edita desde aquí.',
    ...pasos,
  ].join('\n');
  const aprobada = corta(c.aprobada, 700) ? [`Estrategia aprobada: ${corta(c.aprobada, 700)}`] : [`Estrategia aprobada: ${sinDatos('Strategy (aprobar la estrategia en vivo)')}`];
  const previo = plano(c.dna) ? [`Lo ya aceptado del ADN: ${corta(JSON.stringify(limpiar(c.dna)), 600)}`] : [];
  const despues = [
    '',
    'CÓMO CONTESTAR: un bloque ```dna con este JSON y luego un bloque ```criterios.',
    '```dna',
    '{"territorio":{"territorio":"…","arquetipo":"…","es":["…"],"no_es":["…"]},"personalidad":[{"eje":"cercania|tiempo|expresion|acceso|energia|humor","valor":0-10}],"voz":{"tono":["3 palabras"],"pares":[{"bien":"…","mal":"…"}],"si":["…"],"no":["…"]},"activos":[{"nombre":"…","que":"…","prueba":"cómo se ve que es distintivo"}]}',
    '```',
    '- Ejes: 0 es el extremo izquierdo y 10 el derecho de cada par (formal–cercana, clásica–moderna, sobria–expresiva, exclusiva–accesible, calmada–enérgica, seria–juguetona).',
    `- Activos: de ${MIN_ACTIVOS} a ${MAX_ACTIVOS}; cada uno con su prueba (dónde se reconoce sin el logo).`,
    '```criterios',
    '{"entregable":"Brand DNA","cumple":["…"],"falta":["…"]}',
    '```',
  ].join('\n');
  return `${antes}\n\n${contextoPrompt(c, Math.max(300, 4800 - antes.length - despues.length - 1100), aprobada.concat(previo))}\n${despues}`.slice(0, 4990);
}

export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Markdown ----------
export function aMd(c, { cliente = '' } = {}) {
  const x = limpiar(c), L = [`# Guía de marca${cliente ? ` · ${celda(cliente)}` : ''}`, ''];
  L.push('## Territorio y arquetipo', '', `**Territorio:** ${x.territorio.territorio || SIN_DATOS}`, `**Arquetipo:** ${x.territorio.arquetipo || SIN_DATOS}`, '');
  L.push('**Es:**', ...(x.territorio.es.length ? x.territorio.es.map((e) => `- ${e}`) : [`- ${SIN_DATOS}`]), '', '**No es:**', ...(x.territorio.no_es.length ? x.territorio.no_es.map((e) => `- ${e}`) : [`- ${SIN_DATOS}`]), '');
  L.push('## Personalidad', '', '| Eje | Valor (0–10) |', '| --- | --- |');
  x.personalidad.forEach((p, i) => L.push(`| ${EJES[i].izq} ↔ ${EJES[i].der} | ${p.valor === null ? SIN_DATOS : p.valor} |`));
  L.push('', '## Voz', '', `**Tono:** ${x.voz.tono.join(' · ') || SIN_DATOS}`, '');
  if (x.voz.pares.length) L.push('| Se dice así | No así |', '| --- | --- |', ...x.voz.pares.map((p) => `| ${celda(p.bien)} | ${celda(p.mal)} |`), '');
  L.push(`**Palabras sí:** ${x.voz.si.join(', ') || SIN_DATOS}`, `**Palabras no:** ${x.voz.no.join(', ') || SIN_DATOS}`, '', '## Activos distintivos', '');
  if (x.activos.length) x.activos.forEach((a, i) => L.push(`${i + 1}. **${a.nombre || SIN_DATOS}** — ${a.que || ''}`, `   - Prueba: ${a.prueba || SIN_DATOS}`));
  else L.push(SIN_DATOS);
  return L.join('\n') + '\n';
}
export const resumen = (c) => { const x = limpiar(c); return x.territorio.arquetipo ? `${x.territorio.arquetipo} · ${x.activos.length} activos` : `${SIN_DATOS}: sin arquetipo`; };
