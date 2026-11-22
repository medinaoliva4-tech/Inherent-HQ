// Constructor de agentes con banco de pruebas + Router de costo — la parte PURA (sin DOM, sin red, sin base).
// Un agente = resultado + fuentes + acciones + modelo + harness + contexto + presupuesto (PLAN-ORGANISMO §7).
//   · validarSpec     — la especificación: lo que no sea del catálogo cerrado, un secreto, un prototipo o un tamaño absurdo se rechaza;
//   · evaluarCaso     — la rúbrica DETERMINISTA de un caso (incluye · no incluye · formato · acciones); el juez es opcional e inyectable;
//   · correrBanco     — corre los casos con un ejecutor INYECTADO y arma el reporte (calidad, costo, p95, fallas). Sin precio = costo null;
//   · puedeActivar    — un agente no se activa sin banco; lo que toca algo externo se activa en BORRADOR hasta que el CEO/COO lo pase a activo;
//   · elegirModelo    — router de costo: el modelo MÁS BARATO que cumple la calidad mínima según los bancos pasados (y dice por qué);
//   · tomarPresupuesto — tope mensual por persona, cliente o agente: aviso al 80 %, corte al 100 %; null si no hay tope aprobado.
// Aquí NO hay precios ni topes: vienen inyectados (los aprueba el CEO). Nada de lo de aquí envía, publica ni gasta.
import { NOMBRES_ACCIONES } from '../llm/acciones-os.js';
import { MODELOS_RESPALDO, NIVELES } from '../llm/modelos-tabla.js';

export const HARNESS = ['chat', 'herramientas', 'planifica-ejecuta'];
// Lo que un agente puede LEER: lista cerrada. Nada de finanzas, costos, nómina ni notas internas de otro cliente.
export const FUENTES = ['biblioteca', 'hilo', 'ficha-oferta', 'estrategia', 'marca', 'contenido', 'entregables', 'tareas', 'proyectos', 'investigacion'];
// Lo que un agente puede PEDIR: las acciones del OS (acciones-os.js) más los adaptadores que envían, publican o gastan
// (api/_lib/workflow-rutas.js, los que tienen `externo: true`). Estos últimos piden aprobación humana SIEMPRE.
export const ACCIONES_EXTERNAS = ['zernio-publicar', 'meta-pauta'];
export const ACCIONES_CATALOGO = [...NOMBRES_ACCIONES, ...ACCIONES_EXTERNAS];
export const NIVELES_IDS = NIVELES.map(([k]) => k);
export const MODELOS_IDS = [...NIVELES_IDS, ...MODELOS_RESPALDO.map((m) => m.id)];
export const POLITICA_BASE = { minCasos: 5, calidadMin: 0.8, maxCriticas: 0, exigirCosto: true };
export const AVISO_BASE = 0.8;
export const MAX_CASOS = 50;

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const esObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const redondea = (x, d = 6) => Math.round(x * 10 ** d) / 10 ** d;
const txt = (x) => (typeof x === 'string' ? x : '');
const ID = /^[a-z0-9][\w-]{0,59}$/;
const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MODELO_ID = /^[a-z0-9][a-z0-9._:/-]{0,63}$/;
const PROTO = ['__proto__', 'constructor', 'prototype'];
// Los mismos patrones de secreto que la bitácora del motor (workflow.js): llaves de API, tokens, contraseñas.
const SECRETOS = /(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{12,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{30,}|xox[abp]-[A-Za-z0-9-]{10,}|(?:password|contraseña|secret|token|api[_-]?key|llave)\s*[:=]\s*\S+)/i;
export const tieneSecreto = (s) => SECRETOS.test(String(s ?? ''));
const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
export const mesDe = (ahora = Date.now()) => new Date(ahora).toISOString().slice(0, 7);

// Recorre cualquier valor: prototipos, secretos en texto, profundidad, listas y textos absurdos. Devuelve los errores.
function revisar(x, ruta, errs, prof = 0, cuenta = { n: 0 }) {
  if (++cuenta.n > 800) { if (cuenta.n === 801) errs.push('la especificación es demasiado grande'); return; }
  if (prof > 6) { errs.push(`${ruta}: demasiado anidado`); return; }
  if (typeof x === 'string') {
    if (x.length > 4000) errs.push(`${ruta}: texto demasiado largo`);
    if (tieneSecreto(x)) errs.push(`${ruta}: parece traer un secreto (llave, token o contraseña): quítalo`);
  } else if (Array.isArray(x)) {
    if (x.length > 100) errs.push(`${ruta}: lista demasiado larga`);
    x.slice(0, 100).forEach((v, i) => revisar(v, `${ruta}[${i}]`, errs, prof + 1, cuenta));
  } else if (x && typeof x === 'object') {
    for (const k of Object.getOwnPropertyNames(x)) {
      if (PROTO.includes(k)) { errs.push(`${ruta}: la clave «${k}» no se permite`); continue; }
      revisar(x[k], `${ruta}.${k}`, errs, prof + 1, cuenta);
    }
  } else if (typeof x === 'function' || typeof x === 'symbol' || typeof x === 'bigint') errs.push(`${ruta}: tipo no permitido`);
}

// ---------- 1 · La especificación ----------
const CAMPOS = ['id', 'nombre', 'resultado', 'fuentes', 'acciones', 'modelo', 'harness', 'contexto', 'presupuesto'];
const largo = (s, min, max) => typeof s === 'string' && s.trim().length >= min && s.trim().length <= max;
const nombreAccion = (a) => NOMBRES_ACCIONES.find((k) => k.toLowerCase() === norm(a)) || ACCIONES_EXTERNAS.find((k) => k === norm(a)) || null;

// → { ok, errores, spec (normalizada), externo }. `modelos` (opcional) = los ids que el puente publica hoy; por defecto la tabla de respaldo.
export function validarSpec(spec, { modelos = MODELOS_IDS } = {}) {
  const errores = [];
  if (!esObj(spec)) return { ok: false, errores: ['la especificación debe ser un objeto'], spec: null, externo: false };
  revisar(spec, 'spec', errores);
  if (errores.some((e) => /clave «/.test(e) && /__proto__|constructor|prototype/.test(e))) return { ok: false, errores, spec: null, externo: false };
  for (const k of Object.keys(spec)) if (!CAMPOS.includes(k)) errores.push(`el campo «${k}» no existe en un agente`);
  if (!ID.test(txt(spec.id))) errores.push('el id debe ir en minúsculas, números y guiones (máx. 60)');
  if (!largo(spec.nombre, 3, 80)) errores.push('el nombre debe tener entre 3 y 80 letras');

  const r = esObj(spec.resultado) ? spec.resultado : null;
  if (!r || !largo(r.que, 10, 600)) errores.push('el resultado: di qué debe producir (10 a 600 letras)');
  if (!r || !largo(r.medida, 5, 300)) errores.push('el resultado: di cómo se mide que salió bien');

  const fuentes = Array.isArray(spec.fuentes) ? spec.fuentes.map((f) => norm(f)) : null;
  if (!fuentes || !fuentes.length || fuentes.length > FUENTES.length) errores.push('las fuentes: elige de 1 a 10 de la lista cerrada');
  else {
    for (const f of fuentes) if (!FUENTES.includes(f)) errores.push(`la fuente «${f.slice(0, 40)}» no está en la lista cerrada`);
    if (new Set(fuentes).size !== fuentes.length) errores.push('las fuentes no pueden repetirse');
  }

  const accs = [];
  if (!Array.isArray(spec.acciones) || spec.acciones.length > 10) errores.push('las acciones: una lista de hasta 10');
  else for (const a of spec.acciones) {
    const pedido = typeof a === 'string' ? { nombre: a } : esObj(a) ? a : null;
    const nombre = pedido ? nombreAccion(pedido.nombre) : null;
    if (!nombre) { errores.push(`la acción «${String(pedido?.nombre ?? a).slice(0, 40)}» no está en el catálogo cerrado del OS`); continue; }
    const externa = ACCIONES_EXTERNAS.includes(nombre);
    if (externa && pedido.externa === false) errores.push(`la acción «${nombre}» envía, publica o gasta: no se le puede quitar la aprobación humana`);
    if (accs.some((x) => x.nombre === nombre)) errores.push(`la acción «${nombre}» está repetida`);
    accs.push({ nombre, externa, aprobacion: externa ? 'humana' : 'ninguna' });
  }

  const modelo = txt(spec.modelo).trim().toLowerCase();
  if (!modelo || !MODELO_ID.test(modelo) || !modelos.includes(modelo)) errores.push('el modelo debe ser un nivel (alto, medio, bajo) o un modelo de la tabla');
  if (!HARNESS.includes(spec.harness)) errores.push(`el harness debe ser uno de: ${HARNESS.join(', ')}`);

  const c = esObj(spec.contexto) ? spec.contexto : null, contexto = { biblioteca: [], hilo: false, rol: '', cliente: '' };
  if (!c) errores.push('el contexto: dile qué lee de la Biblioteca o del hilo, y para qué rol');
  else {
    for (const k of Object.keys(c)) if (!['biblioteca', 'hilo', 'rol', 'cliente'].includes(k)) errores.push(`el contexto no lleva «${k}»`);
    contexto.biblioteca = Array.isArray(c.biblioteca) ? c.biblioteca.map((x) => txt(x).trim()) : [];
    if (c.biblioteca != null && !Array.isArray(c.biblioteca)) errores.push('el contexto: la Biblioteca es una lista de ids de documentos');
    if (contexto.biblioteca.length > 20 || contexto.biblioteca.some((x) => !/^[\w.@+-]{1,120}$/.test(x))) errores.push('el contexto: hasta 20 ids de documentos, sin espacios');
    contexto.hilo = c.hilo === true;
    if (c.hilo != null && typeof c.hilo !== 'boolean') errores.push('el contexto: «hilo» es sí o no');
    if (!contexto.biblioteca.length && !contexto.hilo) errores.push('el contexto: al menos algo de la Biblioteca o el hilo del cliente');
    contexto.rol = txt(c.rol).trim().toLowerCase();
    if (!SLUG.test(contexto.rol)) errores.push('el contexto es por rol: di para qué rol es (ej. revenue, creative)');
    contexto.cliente = txt(c.cliente).trim().toLowerCase();
    if (contexto.cliente && !SLUG.test(contexto.cliente)) errores.push('el contexto: el cliente es su slug (minúsculas y guiones)');
  }

  const p = esObj(spec.presupuesto) ? spec.presupuesto : null;
  const porCorrida = num(p?.por_corrida), porMes = num(p?.por_mes);
  if (p) for (const k of Object.keys(p)) if (!['por_corrida', 'por_mes'].includes(k)) errores.push(`el presupuesto no lleva «${k}»`);
  if (porCorrida == null || porCorrida <= 0 || porCorrida > 1000) errores.push('el presupuesto por corrida debe ser un número entre 0 y 1000 (USD)');
  if (porMes == null || porMes <= 0 || porMes > 100000) errores.push('el presupuesto por mes debe ser un número entre 0 y 100000 (USD)');
  if (porCorrida != null && porMes != null && porCorrida > porMes) errores.push('el presupuesto por corrida no puede pasar el de todo el mes');

  const ok = !errores.length;
  const out = ok ? { id: spec.id, nombre: spec.nombre.trim(), resultado: { que: r.que.trim(), medida: r.medida.trim() }, fuentes: fuentes.slice(), acciones: accs, modelo, harness: spec.harness, contexto, presupuesto: { por_corrida: porCorrida, por_mes: porMes } } : null;
  return { ok, errores, spec: out, externo: accs.some((a) => a.externa) };
}
export const esExterno = (spec) => (spec?.acciones || []).some((a) => ACCIONES_EXTERNAS.includes(typeof a === 'string' ? a : a?.nombre));

// ---------- 2 · Los casos y su rúbrica ----------
// caso = { id, entrada, debeIncluir?:[], noDebeIncluir?:[], formato?:{ tipo:'json'|'texto', esquema?:{campo:tipo}, maxPalabras?, idioma?:'es'|'en' },
//          accionesEsperadas?:[], critico?:bool }
const TIPOS = ['string', 'number', 'boolean', 'array', 'object'];
export function validarCasos(casos) {
  const errores = [];
  if (!Array.isArray(casos) || !casos.length) return { ok: false, errores: ['manda al menos un caso'], casos: [] };
  if (casos.length > MAX_CASOS) return { ok: false, errores: [`máximo ${MAX_CASOS} casos por banco`], casos: [] };
  const ids = new Set(), out = [], lista = (x, ruta) => {
    if (x == null) return [];
    if (!Array.isArray(x) || x.length > 20 || x.some((s) => typeof s !== 'string' || !s.trim() || s.length > 200)) { errores.push(`${ruta} debe ser una lista de hasta 20 textos cortos`); return []; }
    return x.map((s) => s.trim());
  };
  casos.forEach((c, i) => {
    const ruta = `caso ${i + 1}`;
    if (!esObj(c)) { errores.push(`${ruta}: no es un objeto`); return; }
    const pre = [];
    revisar(c, ruta, pre); if (pre.length) { errores.push(...pre); return; }
    for (const k of Object.keys(c)) if (!['id', 'entrada', 'debeIncluir', 'noDebeIncluir', 'formato', 'accionesEsperadas', 'critico'].includes(k)) errores.push(`${ruta}: el campo «${k}» no existe`);
    const id = txt(c.id) || `c${i + 1}`; if (!ID.test(id) || ids.has(id)) errores.push(`${ruta}: id repetido o inválido`); ids.add(id);
    if (!largo(c.entrada, 1, 4000)) errores.push(`${ruta}: falta la entrada (1 a 4000 letras)`);
    const f = c.formato == null ? null : esObj(c.formato) ? c.formato : (errores.push(`${ruta}: el formato es un objeto`), null);
    let formato = null;
    if (f) {
      for (const k of Object.keys(f)) if (!['tipo', 'esquema', 'maxPalabras', 'idioma'].includes(k)) errores.push(`${ruta}: el formato no lleva «${k}»`);
      if (f.tipo != null && !['json', 'texto'].includes(f.tipo)) errores.push(`${ruta}: el formato es json o texto`);
      if (f.idioma != null && !['es', 'en'].includes(f.idioma)) errores.push(`${ruta}: el idioma es es o en`);
      if (f.maxPalabras != null && !(Number.isInteger(f.maxPalabras) && f.maxPalabras > 0 && f.maxPalabras <= 5000)) errores.push(`${ruta}: máx. de palabras inválido`);
      if (f.esquema != null && (f.tipo !== 'json' || !esObj(f.esquema) || Object.keys(f.esquema).length > 30 || Object.values(f.esquema).some((t) => !TIPOS.includes(t)))) errores.push(`${ruta}: el esquema solo va con formato json y sus tipos son ${TIPOS.join(', ')}`);
      formato = { tipo: f.tipo || 'texto', ...(f.esquema ? { esquema: { ...f.esquema } } : {}), ...(f.maxPalabras ? { maxPalabras: f.maxPalabras } : {}), ...(f.idioma ? { idioma: f.idioma } : {}) };
    }
    const debeIncluir = lista(c.debeIncluir, `${ruta}: debeIncluir`), noDebeIncluir = lista(c.noDebeIncluir, `${ruta}: noDebeIncluir`), esperadas = lista(c.accionesEsperadas, `${ruta}: accionesEsperadas`);
    for (const a of esperadas) if (!nombreAccion(a)) errores.push(`${ruta}: la acción esperada «${a.slice(0, 40)}» no está en el catálogo`);
    if (!debeIncluir.length && !noDebeIncluir.length && !formato && !esperadas.length) errores.push(`${ruta}: sin rúbrica (di qué debe o no debe incluir, el formato o las acciones)`);
    out.push({ id, entrada: txt(c.entrada).trim(), debeIncluir, noDebeIncluir, ...(formato ? { formato } : {}), accionesEsperadas: esperadas.map(nombreAccion).filter(Boolean), critico: c.critico === true });
  });
  return { ok: !errores.length, errores, casos: errores.length ? [] : out };
}

const PALABRAS = {
  es: new Set(['el', 'la', 'los', 'las', 'de', 'del', 'que', 'y', 'en', 'un', 'una', 'para', 'con', 'por', 'es', 'se', 'no', 'su', 'al', 'lo', 'como', 'más', 'mas', 'pero', 'este', 'esta', 'son', 'tu', 'te', 'le', 'ya']),
  en: new Set(['the', 'and', 'of', 'to', 'in', 'is', 'that', 'for', 'with', 'on', 'it', 'as', 'are', 'this', 'be', 'at', 'by', 'from', 'or', 'an', 'you', 'your', 'we', 'our', 'was', 'have', 'not', 'will']),
};
const palabras = (t) => String(t ?? '').split(/\s+/).filter(Boolean);
function extraerJson(t) {
  const s = String(t ?? '').trim(), cerca = s.match(/^```(?:json)?\s*([\s\S]*?)```$/i), cuerpo = (cerca ? cerca[1] : s).trim();
  try { return { ok: true, valor: JSON.parse(cuerpo) }; } catch { return { ok: false }; }
}
const tipoDe = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);

// → { pasa, puntos (0..1: reglas cumplidas / reglas), fallas:[{ regla, detalle, critica }], reglas }
// `permitidas`: las acciones que la especificación del agente puede pedir; pedir otra es una falla crítica.
export function evaluarCaso(caso, salida, { permitidas = null } = {}) {
  const texto = typeof salida === 'string' ? salida : txt(salida?.texto);
  const pedidas = (Array.isArray(salida?.acciones) ? salida.acciones : []).map((a) => nombreAccion(typeof a === 'string' ? a : a?.nombre) || `«${String(a?.nombre ?? a).slice(0, 40)}»`);
  const fallas = []; let total = 0, buenas = 0;
  const regla = (nombre, ok, detalle, critica = caso?.critico === true) => { total++; if (ok) buenas++; else fallas.push({ regla: nombre, detalle, critica: Boolean(critica) }); };
  const t = norm(texto);
  for (const s of caso?.debeIncluir || []) regla('debe_incluir', t.includes(norm(s)), `falta «${s}»`);
  for (const s of caso?.noDebeIncluir || []) regla('no_debe_incluir', !t.includes(norm(s)), `trae «${s}», que no debía`);
  const f = caso?.formato;
  if (f) {
    if (f.tipo === 'json') {
      const j = extraerJson(texto);
      regla('formato_json', j.ok, 'la salida no es JSON válido');
      if (j.ok && f.esquema) for (const [campo, tipo] of Object.entries(f.esquema)) {
        const v = esObj(j.valor) && hasOwn(j.valor, campo) ? j.valor[campo] : undefined;
        regla('esquema', v !== undefined && tipoDe(v) === tipo, v === undefined ? `falta el campo «${campo}»` : `«${campo}» debía ser ${tipo} y es ${tipoDe(v)}`);
      }
    }
    if (f.maxPalabras) { const n = palabras(texto).length; regla('max_palabras', n <= f.maxPalabras, `tiene ${n} palabras y el máximo es ${f.maxPalabras}`); }
    if (f.idioma) {
      const otro = f.idioma === 'es' ? 'en' : 'es', ws = palabras(t.replace(/[^\p{L}\s]/gu, ' ')), cuenta = (k) => ws.filter((w) => PALABRAS[k].has(w)).length;
      regla('idioma', cuenta(otro) <= cuenta(f.idioma), `parece estar en ${otro === 'es' ? 'español' : 'inglés'} y debía ir en ${f.idioma === 'es' ? 'español' : 'inglés'}`);
    }
  }
  for (const a of caso?.accionesEsperadas || []) regla('accion_esperada', pedidas.includes(nombreAccion(a) || a), `no pidió la acción «${a}»`);
  if (Array.isArray(permitidas)) for (const a of new Set(pedidas)) if (!permitidas.includes(a)) regla('accion_no_permitida', false, `pidió «${a}», que su especificación no incluye`, true);
  if (tieneSecreto(texto)) regla('secreto_en_salida', false, 'la salida trae algo que parece un secreto', true);
  if (!total) return { pasa: false, puntos: 0, reglas: 0, fallas: [{ regla: 'sin_rubrica', detalle: 'el caso no tiene qué medir', critica: false }] };
  return { pasa: !fallas.length, puntos: redondea(buenas / total, 4), reglas: total, fallas };
}
// El juez (un modelo que revisa lo que la rúbrica no puede) es OPCIONAL: su veredicto { pasa, motivo?, critica? } se suma, no reemplaza.
export function combinarJuez(ev, veredicto) {
  if (!esObj(veredicto)) return ev;
  const total = ev.reglas + 1, buenas = Math.round(ev.puntos * ev.reglas) + (veredicto.pasa === true ? 1 : 0);
  const fallas = veredicto.pasa === true ? ev.fallas : [...ev.fallas, { regla: 'juez', detalle: txt(veredicto.motivo).slice(0, 300) || 'el juez no lo aprobó', critica: veredicto.critica === true }];
  return { pasa: !fallas.length, puntos: redondea(buenas / total, 4), reglas: total, fallas };
}

// ---------- 3 · El banco ----------
// uso = { texto, tokens_in, tokens_out, modelo, ms } · precios[modelo] = { in, out } en USD por 1M de tokens.
// Sin precio o sin tokens → null (nunca 0): «sin dato».
export function costoDe(uso, precios, modeloBase = '') {
  const modelo = txt(uso?.modelo) || modeloBase, p = precios && hasOwn(precios, modelo) ? precios[modelo] : null;
  const pin = num(p?.in), pout = num(p?.out), tin = num(uso?.tokens_in), tout = num(uso?.tokens_out);
  if (pin == null || pout == null || pin < 0 || pout < 0 || tin == null || tout == null || tin < 0 || tout < 0) return null;
  return redondea((tin * pin + tout * pout) / 1e6, 8);
}
export const etiquetaCosto = (c) => (c == null ? 'sin dato' : `US$ ${c.toFixed(4)}`);
const p95 = (xs) => { const s = xs.filter((x) => Number.isFinite(x)).sort((a, z) => a - z); return s.length ? s[Math.ceil(0.95 * s.length) - 1] : null; };

export async function correrBanco(spec, casos, { ejecutar, precios = {}, juez = null } = {}) {
  if (typeof ejecutar !== 'function') throw Object.assign(new Error('No hay ejecutor conectado'), { code: 'SIN_EJECUTOR' });
  const permitidas = (spec?.acciones || []).map((a) => (typeof a === 'string' ? a : a?.nombre)).filter(Boolean);
  const topeCorrida = num(spec?.presupuesto?.por_corrida);
  const porCaso = [];
  for (const caso of casos || []) {
    let r = null, error = null;
    try { r = await ejecutar(spec, caso); } catch (e) { error = e; }
    if (error || !esObj(r)) {
      const msg = String(error?.message || 'el ejecutor no devolvió nada').replace(SECRETOS, '«secreto»').slice(0, 200);
      porCaso.push({ id: caso.id, corrio: false, pasa: false, puntos: 0, costo: null, ms: null, modelo: spec?.modelo || null, texto: '', fallas: [{ regla: error?.code === 'PRESUPUESTO' ? 'presupuesto' : 'ejecucion', detalle: msg, critica: true }] });
      continue;
    }
    let ev = evaluarCaso(caso, r, { permitidas });
    if (typeof juez === 'function') { try { ev = combinarJuez(ev, await juez(caso, r)); } catch { ev = combinarJuez(ev, { pasa: false, motivo: 'el juez no pudo revisarlo' }); } }
    const costo = costoDe(r, precios, spec?.modelo), ms = num(r.ms);
    if (costo != null && topeCorrida != null && costo > topeCorrida) ev = { ...ev, pasa: false, fallas: [...ev.fallas, { regla: 'presupuesto_corrida', detalle: `costó ${etiquetaCosto(costo)} y el tope por corrida es ${etiquetaCosto(topeCorrida)}`, critica: true }] };
    porCaso.push({ id: caso.id, corrio: true, pasa: ev.pasa, puntos: ev.puntos, costo, ms, modelo: txt(r.modelo) || spec?.modelo || null, texto: txt(r.texto).slice(0, 300), fallas: ev.fallas });
  }
  const n = porCaso.length, corridos = porCaso.filter((c) => c.corrio), sinPrecio = corridos.filter((c) => c.costo == null).length;
  const costoTotal = corridos.length && !sinPrecio ? redondea(corridos.reduce((s, c) => s + c.costo, 0), 8) : null;
  const fallas = porCaso.flatMap((c) => c.fallas.map((f) => ({ caso: c.id, ...f })));
  return {
    n, n_corridos: corridos.length,
    calidad: n ? redondea(porCaso.filter((c) => c.pasa).length / n, 4) : null, // la tasa de casos que pasan
    puntos: n ? redondea(porCaso.reduce((s, c) => s + c.puntos, 0) / n, 4) : null, // el promedio de reglas cumplidas
    costo_por_caso: costoTotal == null ? null : redondea(costoTotal / corridos.length, 8),
    costo_total: costoTotal,
    costo_etiqueta: costoTotal == null ? 'sin dato' : etiquetaCosto(costoTotal / corridos.length),
    casos_sin_precio: sinPrecio,
    p95_ms: p95(corridos.map((c) => c.ms)),
    fallas, fallas_criticas: fallas.filter((f) => f.critica).length,
    modelo: spec?.modelo || null, externo: esExterno(spec), porCaso,
  };
}

// ---------- 4 · Activar ----------
// → { ok, modo: 'activo'|'borrador'|null, razones:[] }. Sin banco, o con un banco que no alcanza, no hay activación.
// Si el agente toca algo externo, se activa en BORRADOR; pasa a activo solo cuando el CEO/COO lo pide (`pasarAActivo`).
export function puedeActivar(reporte, politica = {}) {
  const pol = { ...POLITICA_BASE, ...(esObj(politica) ? politica : {}) }, razones = [];
  if (!esObj(reporte) || !Number.isFinite(reporte.n) || reporte.n === 0) return { ok: false, modo: null, razones: ['No tiene banco de pruebas: corre los casos antes de activarlo'] };
  if (reporte.n < pol.minCasos) razones.push(`Pocos casos: tiene ${reporte.n} y el mínimo es ${pol.minCasos}`);
  if (!Number.isFinite(reporte.calidad) || reporte.calidad < pol.calidadMin) razones.push(`Calidad ${Number.isFinite(reporte.calidad) ? Math.round(reporte.calidad * 100) : '—'} % y el mínimo es ${Math.round(pol.calidadMin * 100)} %`);
  if ((reporte.fallas_criticas || 0) > pol.maxCriticas) razones.push(`Tiene ${reporte.fallas_criticas} fallas críticas y el máximo es ${pol.maxCriticas}`);
  if (pol.exigirCosto && !Number.isFinite(reporte.costo_por_caso)) razones.push('El costo está «sin dato»: falta el precio del modelo (lo aprueba el CEO) para mostrar el costo estimado');
  if (razones.length) return { ok: false, modo: null, razones };
  const externo = reporte.externo === true;
  return { ok: true, modo: externo && pol.pasarAActivo !== true ? 'borrador' : 'activo', razones: externo && pol.pasarAActivo !== true ? ['Toca algo externo: queda en borrador hasta que el CEO o el COO lo pase a activo. Cada envío, publicación o gasto siempre pide aprobación humana.'] : [] };
}

// ---------- 5 · Router de costo ----------
// historial = [{ modelo, calidad, costo_por_caso (o null), n }] sacado de los bancos pasados. `niveles` = la tabla de modelos (id, nivel, costo_relativo).
// → { modelo, nivel, base: 'historial'|'sin-historial'|'insuficiente', motivo, comparados }
export function elegirModelo(historial, { calidadMin = POLITICA_BASE.calidadMin, niveles = MODELOS_RESPALDO, nMin = 3 } = {}) {
  const info = (id) => niveles.find((m) => m.id === id) || null;
  const datos = (Array.isArray(historial) ? historial : []).filter((h) => esObj(h) && txt(h.modelo) && Number.isFinite(h.calidad) && Number.isFinite(h.n) && h.n > 0);
  if (!datos.length) {
    const medio = niveles.find((m) => m.nivel === 'medio' && m.disponible !== false) || niveles.find((m) => m.nivel === 'medio');
    return { modelo: medio?.id || 'medio', nivel: 'medio', base: 'sin-historial', motivo: 'Todavía no hay bancos de prueba: se usa el nivel medio hasta probar otros.', comparados: [] };
  }
  // Un modelo junta todos sus bancos (promedio ponderado por casos).
  const por = new Map();
  for (const h of datos) { const a = por.get(h.modelo) || { modelo: h.modelo, n: 0, calidadSuma: 0, costoSuma: 0, costoN: 0 }; a.n += h.n; a.calidadSuma += h.calidad * h.n; if (Number.isFinite(h.costo_por_caso)) { a.costoSuma += h.costo_por_caso * h.n; a.costoN += h.n; } por.set(h.modelo, a); }
  const comp = [...por.values()].map((a) => ({ modelo: a.modelo, n: a.n, calidad: redondea(a.calidadSuma / a.n, 4), costo_por_caso: a.costoN === a.n ? redondea(a.costoSuma / a.n, 8) : null, nivel: info(a.modelo)?.nivel || (NIVELES_IDS.includes(a.modelo) ? a.modelo : null), costo_relativo: info(a.modelo)?.costo_relativo ?? null }));
  const validos = comp.filter((c) => c.n >= nMin && c.calidad >= calidadMin);
  if (!validos.length) {
    const mejor = [...comp].sort((a, z) => z.calidad - a.calidad)[0];
    return { modelo: null, nivel: null, base: 'insuficiente', motivo: `Ningún modelo probado llega a ${Math.round(calidadMin * 100)} % con al menos ${nMin} casos (el mejor, ${mejor.modelo}, va en ${Math.round(mejor.calidad * 100)} % con ${mejor.n}). Prueba otro modelo o más casos.`, mejor: mejor.modelo, comparados: comp };
  }
  const reales = validos.every((c) => c.costo_por_caso != null), clave = (c) => (reales ? c.costo_por_caso : c.costo_relativo ?? Infinity);
  const orden = [...validos].sort((a, z) => clave(a) - clave(z) || z.calidad - a.calidad || a.modelo.localeCompare(z.modelo)), g = orden[0];
  const baseTxt = reales ? `costo medido de ${etiquetaCosto(g.costo_por_caso)} por caso` : 'el costo relativo de la tabla (faltan precios para comparar en dinero)';
  return { modelo: g.modelo, nivel: g.nivel, base: 'historial', motivo: `${g.modelo} es el más barato que llega a ${Math.round(calidadMin * 100)} % (tiene ${Math.round(g.calidad * 100)} % en ${g.n} casos), según ${baseTxt}.${validos.length === 1 ? ' Es el único que cumple.' : ''}`, comparados: comp };
}

// ---------- 6 · Presupuesto ----------
// estado = { <alcance>: { tope, gastado, mes }, …, aviso? } con alcances como persona, cliente o agente. El tope se aprueba afuera: aquí no se inventa.
// → null si ningún alcance tiene tope aprobado. Si no: { ok, estado: 'ok'|'aviso'|'corte'|'monto_invalido', alcances, mensajes, siguiente }
//   alcances[x] = null (sin tope) o { tope, antes, despues, pct, restante, estado }; siguiente[x] = el estado nuevo (sin cambios si se cortó).
const esTope = (t) => typeof t === 'number' && Number.isFinite(t) && t >= 0;
export function estadoDeTope(gastado, tope, aviso = AVISO_BASE) {
  if (!esTope(tope)) return 'sin_tope';
  return gastado >= tope ? 'corte' : gastado >= tope * aviso ? 'aviso' : 'ok';
}
export function tomarPresupuesto(estado, monto, ahora = Date.now()) {
  const mes = mesDe(ahora), a = num(estado?.aviso), aviso = a != null && a > 0 && a <= 1 ? a : AVISO_BASE;
  const alcances = Object.entries(esObj(estado) ? estado : {}).filter(([k, v]) => k !== 'aviso' && esObj(v));
  if (!alcances.some(([, v]) => esTope(v.tope))) return null;
  const detalle = {}, siguiente = {}, mensajes = [];
  if (num(monto) == null || monto < 0) {
    for (const [k, v] of alcances) { detalle[k] = esTope(v.tope) ? { tope: v.tope, estado: 'monto_invalido' } : null; }
    return { ok: false, estado: 'monto_invalido', alcances: detalle, mensajes: ['El monto no es un número válido: no se puede tomar presupuesto.'], siguiente: {} };
  }
  let peor = 'ok';
  const orden = { ok: 0, aviso: 1, corte: 2 };
  for (const [k, v] of alcances) {
    if (!esTope(v.tope)) { detalle[k] = null; continue; }
    const antes = v.mes === mes ? Math.max(0, num(v.gastado) ?? 0) : 0, despues = redondea(antes + monto);
    const est = despues > v.tope ? 'corte' : despues >= v.tope * aviso ? 'aviso' : 'ok';
    detalle[k] = { tope: v.tope, antes, despues, pct: v.tope > 0 ? redondea(despues / v.tope, 4) : null, restante: redondea(Math.max(0, v.tope - antes)), estado: est };
    if (orden[est] > orden[peor]) peor = est;
    if (est === 'corte') mensajes.push(`Se cortó: el tope mensual de ${k} (${etiquetaCosto(v.tope)}) no alcanza para ${etiquetaCosto(monto)} más.`);
    else if (est === 'aviso') mensajes.push(despues >= v.tope ? `Llegó al 100 % del tope mensual de ${k}: lo siguiente se corta.` : `Aviso: ${k} lleva ${Math.round(despues / v.tope * 100)} % de su tope mensual.`);
  }
  const ok = peor !== 'corte';
  for (const [k, v] of alcances) if (detalle[k]) siguiente[k] = { tope: v.tope, gastado: ok ? detalle[k].despues : detalle[k].antes, mes };
  return { ok, estado: peor, alcances: detalle, mensajes, siguiente };
}
