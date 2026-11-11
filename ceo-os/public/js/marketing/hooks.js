// Hook Laboratory (herramienta hook-laboratory de Marketing): la biblioteca de hooks (las 7 cajas de mc-campanas-piezas × consciencia × pilar)
// y la matriz de pruebas (hooks × variantes, con métrica real). Se guarda como un entregable (contenido = { hooks, variantes, pruebas }).
// Existe para que el hook, su limpieza, lo que falta, la matriz, el pedido a la IA y la lectura de su respuesta vivan en un solo módulo
// puro (sin DOM ni red) que comparten la vista, el servidor y las pruebas. Los hooks SALEN del research sin reescribirlos (hookDe).
// Sin dato no hay número: multiplicador y métrica null dicen ⚠️ SIN DATOS y de dónde sale (nunca 0); sin puente Laya dice «pendiente».
// La salida de un modelo es dato no confiable: limpiar() deja solo texto y números; nunca entra a raw().
import { hookDe, resonanciaDe, claveDe } from './patrones.js';
import { plano, corta, entero, numeroONull, sinAcentos, SIN_DATOS, armarPrompt, leerHerramienta, celda } from '../consulting/marcos.js';

export const BLOQUE = 'hooks';
export const MAX_HOOKS = 60, MAX_VARIANTES = 6;
// Las 7 cajas de mc-campanas-piezas (agents/03-marketing-creative/brain/skills/mc-campanas-piezas/SKILL.md § 1).
export const CAJAS = [
  { id: 'pattern-interrupt', nombre: 'Pattern Interrupt', activa: 'Desconcierto → atención', pide: 'define el frame 1 visual', cierre: false },
  { id: 'list-number', nombre: 'List / Number', activa: 'Promesa de estructura', pide: 'cada número = un slide o una toma', cierre: false },
  { id: 'curiosity-gap', nombre: 'Curiosity Gap', activa: 'Necesidad de cerrar', pide: 'el cierre va en el mismo brief', cierre: true },
  { id: 'question', nombre: 'Question', activa: 'Autoselección', pide: 'lenguaje literal del comprador', cierre: false },
  { id: 'pain', nombre: 'Pain / Frustration', activa: 'Reconocimiento', pide: 'el dolor real del avatar', cierre: false },
  { id: 'bold-claim', nombre: 'Bold Claim', activa: 'Provocación', pide: 'con dato o promesa: OK de Branding o Ads', cierre: false },
  { id: 'story-tease', nombre: 'Story / Tease', activa: 'Arco abierto', pide: 'el cierre va en el mismo brief', cierre: true },
];
const CAJA_IDS = CAJAS.map((c) => c.id);
export const cajaDe = (id) => CAJAS.find((c) => c.id === id) || null;
export const CONSCIENCIAS = ['Inconsciente', 'Consciente del problema', 'Consciente de la solución', 'Consciente del producto', 'Listo para comprar'];
// De dónde salió el hook: del research (clave del post real), del banco propio que ya ganó, o escrito nuevo (sin multiplicador).
export const FUENTES = [['research', 'Research'], ['ganador', 'Banco propio'], ['nuevo', 'Nuevo']];
const FUENTE_IDS = FUENTES.map(([k]) => k);
export const METRICAS = [['hook_rate', 'Hook rate (% que pasa el seg. 3)'], ['retencion', 'Retención 3 s'], ['ctr', 'CTR'], ['hook_lost', 'Hook lost']];
const METRICA_IDS = METRICAS.map(([k]) => k);
export const SD_METRICA = 'sale de los analytics de la pieza (hook lost) o de Ads';
export const SD_MULT = 'sale de la Investigación (resonancia ×N del post)';

const idOk = (v) => (/^[\w.-]{1,60}$/.test(String(v ?? '')) ? String(v) : '');
const norm = (s) => sinAcentos(s).replace(/\s+/g, ' ');

export const vacio = () => ({ hooks: [], variantes: [], pruebas: [] });

export function hookNuevo(o = {}) {
  return limpiarHook({ id: o.id || `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, ...o });
}
export function limpiarHook(h) {
  const x = plano(h) ? h : {}, l = plano(x.laya) ? x.laya : {};
  const fuente = FUENTE_IDS.includes(x.fuente) ? x.fuente : 'nuevo';
  const caja = sinAcentos(x.caja).replace(/[^a-z]+/g, '-');
  const puntaje = entero(l.puntaje, 1, 4);
  return {
    id: idOk(x.id), texto: corta(x.texto, 240), caja: CAJA_IDS.includes(caja) ? caja : CAJA_IDS.includes(x.caja) ? x.caja : '',
    consciencia: entero(x.consciencia, 1, 5), pilar: corta(x.pilar, 60), fuente, clave: fuente === 'research' ? corta(x.clave, 300) : '',
    origen: corta(x.origen, 160), multiplicador: numeroONull(x.multiplicador, { min: 0.01, max: 100000 }),
    cierre: corta(x.cierre, 240), frame1: corta(x.frame1, 240), aprobacion: corta(x.aprobacion, 120),
    laya: { puntaje, chip: puntaje ? corta(l.chip, 80) : '' }, archivado: x.archivado === true,
  };
}
export function limpiar(c) {
  const o = plano(c) ? c : {}, vistos = new Set();
  const hooks = (Array.isArray(o.hooks) ? o.hooks : []).map(limpiarHook).filter((h) => h.id && h.texto && !vistos.has(h.id) && vistos.add(h.id)).slice(0, MAX_HOOKS);
  const vv = new Set();
  const variantes = (Array.isArray(o.variantes) ? o.variantes : []).filter(plano).map((v) => ({ id: idOk(v.id), nombre: corta(v.nombre, 60) }))
    .filter((v) => v.id && v.nombre && !vv.has(v.id) && vv.add(v.id)).slice(0, MAX_VARIANTES);
  const pr = new Set(), pruebas = [];
  for (const p of Array.isArray(o.pruebas) ? o.pruebas : []) {
    if (!plano(p) || !vistos.has(p.hook) || !vv.has(p.variante)) continue;
    const k = `${p.hook}|${p.variante}`; if (pr.has(k)) continue; pr.add(k);
    pruebas.push({ hook: p.hook, variante: p.variante, metrica: METRICA_IDS.includes(p.metrica) ? p.metrica : '', valor: numeroONull(p.valor, { min: 0, max: 100000 }), fuente: corta(p.fuente, 160) });
  }
  return { hooks, variantes, pruebas };
}
export const vivos = (c) => (c?.hooks || []).filter((h) => !h.archivado);

// ---------- Del research, sin reescribir ----------
// Un hook por cada post con gancho (hookDe: why.hook, o la primera línea). El texto es EXACTAMENTE el del post; el multiplicador es el del post.
export function desdeResearch(items, ya = []) {
  const claves = new Set((ya || []).map((h) => h.clave).filter(Boolean)), out = [];
  for (const it of Array.isArray(items) ? items : []) {
    const clave = claveDe(it), texto = hookDe(it);
    if (!clave || !texto || claves.has(clave)) continue; claves.add(clave);
    out.push(limpiarHook({ id: `r${out.length + 1}${clave.replace(/[^\w]/g, '').slice(-6)}`, texto, fuente: 'research', clave, origen: it.handle ? `@${it.handle}` : '', multiplicador: resonanciaDe(it) }));
  }
  return out;
}
export const reescrito = (h, items) => {
  if (h.fuente !== 'research' || !h.clave) return false;
  const it = (items || []).find((x) => claveDe(x) === h.clave);
  return Boolean(it) && norm(hookDe(it)) !== norm(h.texto);
};

// ---------- Cálculos ----------
// La grilla: filas = cajas, columnas = consciencia (1-5); cada celda = los hooks vivos de esa caja y ese nivel. Sin nivel va aparte.
export function grilla(c, { pilar = '' } = {}) {
  const lista = vivos(c).filter((h) => !pilar || h.pilar === pilar);
  const celdas = CAJAS.map((k) => ({ caja: k.id, niveles: [0, 1, 2, 3, 4, 5].map((n) => lista.filter((h) => h.caja === k.id && (h.consciencia || 0) === n)) }));
  return { celdas, sinCaja: lista.filter((h) => !h.caja), pilares: [...new Set(vivos(c).map((h) => h.pilar).filter(Boolean))] };
}
// Texto de Laya: el puntaje (1-4) o «pendiente» (sin puente no se inventa).
export const layaTexto = (h) => (h?.laya?.puntaje ? `${h.laya.puntaje} / 4${h.laya.chip ? ` · ${h.laya.chip}` : ''}` : 'pendiente');
export const multTexto = (h) => (h?.multiplicador == null ? `${SIN_DATOS}: ${SD_MULT}` : `×${Math.round(h.multiplicador * 10) / 10}`);
// La celda de la matriz: el valor real con su métrica, o ⚠️ SIN DATOS y su fuente (la que dice la celda o la de siempre).
export const celdaPrueba = (c, hookId, varId) => (c?.pruebas || []).find((p) => p.hook === hookId && p.variante === varId) || null;
export function celdaTexto(p) {
  if (!p || p.valor === null) return `${SIN_DATOS}: ${corta(p?.fuente, 120) || SD_METRICA}`;
  const m = METRICAS.find(([k]) => k === p.metrica);
  return `${p.valor}${p.metrica === 'hook_lost' || !p.metrica ? '' : '%'}${m ? ` · ${m[1].split(' (')[0]}` : ''}${p.fuente ? ` · ${corta(p.fuente, 80)}` : ''}`;
}
// El mejor hook de una variante (por valor; en hook_lost gana el menor). null si ninguna celda tiene dato.
export function ganadorDe(c, varId) {
  const v = (c?.pruebas || []).filter((p) => p.variante === varId && p.valor !== null);
  if (v.length < 2) return null;
  const menor = v.every((p) => p.metrica === 'hook_lost');
  return v.slice().sort((a, b) => (menor ? a.valor - b.valor : b.valor - a.valor))[0].hook;
}

// Lo que falta para poder aprobar. extra.research = los posts de la Investigación (para cuidar que no se reescriban).
export function faltas(contenido, extra = {}) {
  const c = limpiar(contenido), f = [], L = vivos(c);
  if (!L.length) f.push('No hay hooks: saca al menos uno de la Investigación');
  for (const h of L) {
    const q = `«${corta(h.texto, 40)}»`, caja = cajaDe(h.caja);
    if (!caja) f.push(`${q} no tiene caja: elige una de las 7`);
    if (!h.consciencia) f.push(`${q} no dice el nivel de consciencia`);
    if (h.fuente === 'research' && !h.clave) f.push(`${q} dice que sale de la Investigación pero no liga ningún post`);
    if (reescrito(h, extra.research)) f.push(`${q} está reescrito: un hook de la Investigación va igual que el post`);
    if (caja?.cierre && !h.cierre) f.push(`${q} (${caja.nombre}) necesita su cierre escrito en el mismo brief`);
    if (h.caja === 'bold-claim' && /\d/.test(h.texto) && !h.aprobacion) f.push(`${q} lleva un dato o promesa: falta el OK de Branding o Ads`);
    if (h.fuente === 'nuevo' && h.multiplicador !== null) f.push(`${q} es nuevo pero trae multiplicador: sin post real no hay multiplicador`);
  }
  if (L.length >= 3 && new Set(L.map((h) => h.caja)).size === 1) f.push('Todos los hooks son de la misma caja: la audiencia se acostumbra, varía');
  for (const p of c.pruebas) if (p.valor !== null && !p.metrica) f.push('Hay una celda con valor pero sin saber qué métrica es');
  return f;
}

export function resumen(contenido) {
  const c = limpiar(contenido), L = vivos(c), conDato = c.pruebas.filter((p) => p.valor !== null).length;
  return `${L.length} hook${L.length === 1 ? '' : 's'} · ${new Set(L.map((h) => h.caja).filter(Boolean)).size} de 7 cajas · ${conDato} prueba${conDato === 1 ? '' : 's'} con dato`;
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
export function prompt(ctx) {
  const research = (Array.isArray(ctx?.research) ? ctx.research : []).slice(0, 8).map((x) => `«${corta(x.texto, 110)}»${x.mult ? ` ×${x.mult}` : ''}`).filter(Boolean);
  const cuerpo = [
    'MÉTODO',
    'Lee agents/03-marketing-creative/brain/skills/mc-campanas-piezas/SKILL.md (§ 1 las 7 cajas y § 1B el gancho por consciencia).',
    `1) Los hooks SALEN del research y van IGUAL, palabra por palabra: no los reescribas. fuente "research" con la clave del post; si no hay post real, fuente "nuevo" y multiplicador null (⚠️ SIN DATOS).${research.length ? ` Hooks del research hoy: ${research.join(' · ')}` : ''}`,
    `2) Cada hook va en UNA de las 7 cajas (${CAJA_IDS.join(', ')}), con su nivel de consciencia (1 a 5) y su pilar. Curiosity Gap y Story/Tease traen su "cierre". Pattern Interrupt trae su "frame1" (qué se ve antes del texto).`,
    '3) No repitas la misma caja en todo el ciclo. Un Bold Claim con dato o promesa pide el OK de Branding o Ads: déjalo en "aprobacion" vacío, no lo apruebes tú.',
    `4) Matriz de pruebas: variantes de la prueba (máx. ${MAX_VARIANTES}); "valor" solo si hay métrica real con su fuente; si no, null.`,
    '5) Laya califica cada hook con la puerta «Hook o copy»; no pongas puntaje: lo pone Laya (sin puente queda pendiente).',
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"hooks":[{"id":"h1","texto":"…","caja":"question","consciencia":2,"pilar":"…","fuente":"research","clave":"ig:AAAAA1","origen":"@cuenta","multiplicador":3.2,"cierre":"","frame1":""}],"variantes":[{"id":"v1","nombre":"Con texto en pantalla"}],"pruebas":[{"hook":"h1","variante":"v1","metrica":"hook_rate","valor":null,"fuente":"analytics de la pieza"}]}',
    F,
    `${F}criterios`,
    '{"entregable":"Biblioteca de hooks","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armarPrompt({ intro: `Eres Marketing de Inherent. Arma la BIBLIOTECA DE HOOKS de «${corta(ctx?.cliente?.nombre, 80) || 'la marca'}» y su matriz de pruebas.`, cuerpo, salida }, ctx);
}
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), L = vivos(c), nombre = (id) => cajaDe(id)?.nombre || 'sin caja';
  const out = ['# Biblioteca de hooks', '', '| Hook | Caja | Consciencia | Pilar | Fuente | Multiplicador | Laya |', '|---|---|---|---|---|---|---|'];
  for (const h of L) out.push(`| ${celda(h.texto)} | ${nombre(h.caja)} | ${h.consciencia ? CONSCIENCIAS[h.consciencia - 1] : SIN_DATOS} | ${celda(h.pilar) || SIN_DATOS} | ${celda(FUENTES.find(([k]) => k === h.fuente)[1] + (h.origen ? ` ${h.origen}` : ''))} | ${celda(multTexto(h))} | ${layaTexto(h)} |`);
  if (!L.length) out.push(`| ${SIN_DATOS} | | | | | | |`);
  out.push('', '## Matriz de pruebas', '');
  if (!c.variantes.length) out.push(`${SIN_DATOS}: aún no hay variantes de prueba.`);
  else {
    out.push(`| Hook | ${c.variantes.map((v) => celda(v.nombre)).join(' | ')} |`, `|---|${c.variantes.map(() => '---').join('|')}|`);
    for (const h of L) out.push(`| ${celda(corta(h.texto, 60))} | ${c.variantes.map((v) => celda(celdaTexto(celdaPrueba(c, h.id, v.id)))).join(' | ')} |`);
  }
  return out.join('\n');
}
