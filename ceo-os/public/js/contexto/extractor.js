// Contexto vivo (puro: sin DOM, sin red; lo comparten el servidor y las pruebas).
// Convierte lo que se habló con un cliente en memoria que la empresa ya sabe, SIN pegarlo a mano:
//   parsearTranscripcion   texto (Zoom · Meet · Granola · Gong · Fireflies) → turnos { quien, t, texto }
//   extraerCompromisos     turnos → qué se prometió, quién, para cuándo; cada uno con su CITA EXACTA
//   extraerSenales         turnos → lo que el cliente quiere, sus dolores, objeciones, riesgos y lo que le funcionó
//   memoriaDelCliente      todas las fuentes → { quiere, dolores, prometido, funciono, riesgos, ultimoContacto }
//
// REGLA DE ORO: nunca se inventa. Sin cita literal de la transcripción no hay compromiso ni señal; todo nace como
// 'hipotesis'. Las reglas de confianza son explicables (cada ítem trae su `razon`). Las fechas relativas se resuelven con
// la fecha de la reunión y el huso de Guatemala (UTC-6): sin fecha clara, `para_cuando` es null.
import { parteDeFecha } from '../ciclo.js';

export const SIN_DATOS = '⚠️ SIN DATOS · conecta reuniones';
export const TIPOS = ['entrega', 'reunion', 'dato', 'decision', 'riesgo'];
export const CONFIANZAS = ['alta', 'media', 'baja'];

// ---------- utilidades ----------
const quitaMarcas = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const fold = (s) => quitaMarcas(String(s ?? '').toLowerCase());
const pad = (n) => String(n).padStart(2, '0');
// Un patrón escrito con acentos acepta también la versión sin acento (las transcripciones los pierden), pero lo que NO
// lleva acento en el patrón no acepta el acento: «te mando» sí, «te mandó» (ya lo hizo otro) no.
const ACENTO = { á: '[aá]', é: '[eé]', í: '[ií]', ó: '[oó]', ú: '[uú]', ñ: '[nñ]' };
// `\b` de JavaScript no reconoce las letras con acento como letras: aquí vale la frontera de palabra con Unicode.
const FRONTERA = '(?:(?<![\\p{L}\\p{N}_])(?=[\\p{L}\\p{N}_])|(?<=[\\p{L}\\p{N}_])(?![\\p{L}\\p{N}_]))';
const R = (src, flags = 'iu') => new RegExp(src.replace(/\\b/g, () => FRONTERA).replace(/[áéíóúñ]/g, (c) => ACENTO[c]), flags);
const corta = (s, n) => String(s ?? '').slice(0, n);

// ---------- fechas (huso de Guatemala) ----------
// 'AAAA-MM-DD', un Date o un ISO con hora ('2026-11-27T03:30:00Z' es el jueves 26 en Guatemala). Sin zona, la hora se toma como de Guatemala.
export function diaDe(fecha) {
  let p = null;
  try {
    if (fecha instanceof Date) p = parteDeFecha(fecha);
    else {
      const s = String(fecha ?? '').trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) p = parteDeFecha(s);
      else {
        const m = /^(\d{4}-\d{2}-\d{2})[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(s);
        if (m) p = m[2] ? parteDeFecha(new Date(s.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'))) : parteDeFecha(m[1]);
      }
    }
  } catch { return null; }
  return p && real(p.y, p.m, p.d) ? p : null;
}
const real = (y, m, d) => { const t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d; };
export const isoDe = (p) => (p ? `${p.y}-${pad(p.m)}-${pad(p.d)}` : null);
const suma = (p, dias) => { const t = new Date(Date.UTC(p.y, p.m - 1, p.d + dias)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
const diaSemana = (p) => new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay(); // 0 = domingo
const finDeMes = (y, m) => ({ y, m, d: new Date(Date.UTC(y, m, 0)).getUTCDate() });
const sumaMeses = (p, n) => { const t = new Date(Date.UTC(p.y, p.m - 1 + n, 1)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: Math.min(p.d, new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate()) }; };
const lunesDe = (p) => suma(p, -((diaSemana(p) + 6) % 7)); // la semana va de lunes a domingo
const antes = (a, b) => isoDe(a) < isoDe(b);

const DIAS = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
const MESES = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  january: 1, february: 2, march: 3, april: 4, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
const NUMS = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, quince: 15, veinte: 20, a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, ten: 10 };
const num = (s) => (/^\d+$/.test(s) ? Number(s) : NUMS[s] ?? null);
const reDias = '(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo|monday|tuesday|wednesday|thursday|friday|saturday|sunday)';
const reMeses = `(?:${Object.keys(MESES).join('|')})`;
const reSemSig = '(?:proxima semana|semana que viene|siguiente semana|semana proxima|next week)';

// La próxima vez que cae ese día de la semana: de mañana en adelante (si hoy es ese día, dentro de 7), salvo `incluyeHoy`.
const proximoDia = (base, wd, incluyeHoy = false) => { const d = (wd - diaSemana(base) + 7) % 7; return suma(base, d === 0 && !incluyeHoy ? 7 : d); };
// Año de una fecha sin año: este año, o el que viene si ya pasó (lo prometido es hacia adelante).
const conAnio = (base, m, d, y) => {
  if (y) return real(y, m, d) ? { y, m, d } : null;
  if (!real(base.y, m, d)) return null;
  const c = { y: base.y, m, d };
  return antes(c, base) ? (real(base.y + 1, m, d) ? { y: base.y + 1, m, d } : null) : c;
};

// Busca expresiones de fecha en la frase y devuelve la primera que se pueda resolver: { fecha:'AAAA-MM-DD', precision:'dia'|'semana'|'mes', expresion } o null.
// «Semana» y «mes» devuelven el último día de esa ventana (un «para la próxima semana» vence el viernes); la precisión lo dice.
export function fechaDe(frase, fechaReunion) {
  const base = diaDe(fechaReunion); if (!base) return null;
  const f = fold(frase), c = [];
  const pon = (m, p, precision = 'dia') => { if (p) c.push({ i: m.index, fin: m.index + m[0].length, p, precision, expresion: corta(m[0].trim(), 60) }); };
  const matches = (re) => [...f.matchAll(re)];

  // Combinaciones primero: «el viernes de la próxima semana» / «la próxima semana, el lunes».
  const combo = new RegExp(`\\b(${reDias})\\s+(?:de|en)\\s+la\\s+${reSemSig}|\\b${reSemSig},?\\s+(?:el\\s+)?(${reDias})\\b`, 'g');
  const dentro = [];
  for (const m of matches(combo)) { const wd = DIAS[m[1] || m[2]]; pon(m, suma(lunesDe(suma(lunesDe(base), 7)), (wd + 6) % 7)); dentro.push([m.index, m.index + m[0].length]); }
  const enCombo = (i) => dentro.some(([a, z]) => i >= a && i < z);

  for (const m of matches(/\bpasado manana\b|\bday after tomorrow\b/g)) pon(m, suma(base, 2));
  for (const m of matches(/\bmanana\b|\btomorrow\b/g)) {
    const previo = f.slice(Math.max(0, m.index - 12), m.index);
    if (/(?:\bla|\bde|\besta|\bpor la|\ben la|\bpasado)\s+$/.test(previo) || f.slice(m.index - 7, m.index) === 'pasado ') continue; // «en la mañana» es la hora del día
    pon(m, suma(base, 1));
  }
  for (const m of matches(/\bhoy\b|\besta noche\b|\besta tarde\b|\btoday\b|\btonight\b|\bend of (?:the )?day\b|\beod\b/g)) pon(m, base);
  for (const m of matches(new RegExp(`(?:\\b(este|el proximo|proximo|this|next|on|by)\\s+)?\\b(${reDias})\\b(\\s+que viene|\\s+proximo)?`, 'g'))) {
    if (enCombo(m.index)) continue;
    if (/\blos\s+$/.test(f.slice(Math.max(0, m.index - 6), m.index))) continue; // «los viernes» es costumbre, no fecha
    pon(m, proximoDia(base, DIAS[m[2]], m[1] === 'este' || m[1] === 'this'));
  }
  for (const m of matches(new RegExp(`\\b${reSemSig}\\b`, 'g'))) if (!enCombo(m.index)) pon(m, suma(lunesDe(suma(lunesDe(base), 7)), 4), 'semana');
  for (const m of matches(/\besta semana\b|\bthis week\b|\bend of (?:the )?week\b|\beow\b/g)) { const v = suma(lunesDe(base), 4); if (!antes(v, base)) pon(m, v, 'semana'); }
  for (const m of matches(/\b(?:a |hasta )?(?:fin|final|finales|cierre) (?:de|del) mes\b|\beste mes\b|\bend of (?:the )?month\b|\beom\b/g)) pon(m, finDeMes(base.y, base.m), 'mes');
  for (const m of matches(/\b(?:el )?proximo mes\b|\bel mes que viene\b|\bnext month\b/g)) { const s = sumaMeses({ ...base, d: 1 }, 1); pon(m, finDeMes(s.y, s.m), 'mes'); }
  for (const m of matches(/\b(?:en|dentro de|in)\s+(\d{1,3}|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|quince|veinte|a|one|two|three|four|five|six|seven|ten)\s+(dias?|semanas?|meses|mes|days?|weeks?|months?)\b/g)) {
    const n = num(m[1]); if (!n) continue;
    const u = m[2];
    pon(m, /^(?:dia|day)/.test(u) ? suma(base, n) : /^(?:sem|week)/.test(u) ? suma(base, 7 * n) : sumaMeses(base, n), /^(?:dia|day)/.test(u) ? 'dia' : /^(?:sem|week)/.test(u) ? 'semana' : 'mes');
  }
  // Con mes: «el 15 de diciembre», «3 de enero de 2027», «December 3rd».
  for (const m of matches(new RegExp(`\\b(\\d{1,2})\\s+de\\s+(${reMeses})(?:\\s+(?:de|del)\\s+(\\d{4}))?\\b`, 'g'))) pon(m, conAnio(base, MESES[m[2]], Number(m[1]), m[3] ? Number(m[3]) : 0));
  for (const m of matches(new RegExp(`\\b(${reMeses})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?!:)`, 'g'))) pon(m, conAnio(base, MESES[m[1]], Number(m[2]), 0));
  for (const m of matches(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) pon(m, real(+m[1], +m[2], +m[3]) ? { y: +m[1], m: +m[2], d: +m[3] } : null);
  // «el 15», «el día 15»: el próximo 15 (este mes si no ha pasado). No «el 3 por ciento», «el 5%» ni «el 2do».
  for (const m of matches(/\b(?:el|the)\s+(?:dia\s+)?(\d{1,2})(?:st|nd|rd|th)?\b(?!\s*(?:%|por\s+ciento|de\s|:|\d|[.,]\d|er\b|do\b|to\b|vo\b|mo\b|ro\b))/g)) {
    const d = Number(m[1]); if (d < 1 || d > 31) continue;
    const esteMes = real(base.y, base.m, d) ? { y: base.y, m: base.m, d } : null;
    if (esteMes && !antes(esteMes, base)) { pon(m, esteMes); continue; }
    const s = sumaMeses({ ...base, d: 1 }, 1); pon(m, real(s.y, s.m, d) ? { y: s.y, m: s.m, d } : null);
  }
  for (const m of matches(/(?<=\b(?:el|para|del|al|hasta)\s)(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g)) pon(m, conAnio(base, +m[2], +m[1], m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : 0));

  if (!c.length) return null;
  c.sort((a, z) => a.i - z.i);
  let el = c[0];
  // Lo vago («la próxima semana») cede ante lo preciso que sigue pegado («el jueves»).
  if (el.precision !== 'dia') { const mejor = c.find((x) => x.precision === 'dia' && x.i >= el.fin && x.i <= el.fin + 25); if (mejor) el = mejor; }
  return { fecha: isoDe(el.p), precision: el.precision, expresion: el.expresion };
}

// ---------- parseo de transcripciones ----------
const HORA = '\\d{1,2}:\\d{2}(?::\\d{2})?(?:[.,]\\d+)?';
const PARTICULA = '(?:de|del|la|las|los|van|von|da|di|y|e)';
const PALABRA = "\\p{Lu}[\\p{L}\\p{M}\\p{N}'’.\\-]*";
const NOMBRE = `${PALABRA}(?:\\s+(?:${PALABRA}|${PARTICULA})){0,3}`;
const RE_A = new RegExp(`^[\\[(]?(${HORA})[\\])]?\\s*[-–—]?\\s*(?:(${NOMBRE})\\s*:\\s*)?(.*)$`, 'u'); // [00:12:03] Ana: texto · 00:12:03 Ana: texto · [00:12:03] texto
const RE_B = new RegExp(`^(${NOMBRE})\\s*[\\[(](${HORA})[\\])]\\s*:?\\s*(.*)$`, 'u'); // Ana (00:12): texto · Ana [00:12:03] texto
const RE_D = new RegExp(`^(${NOMBRE})\\s+(${HORA})\\s*$`, 'u'); // «Ana Pérez  12:03» y el texto en la línea siguiente
const RE_C = new RegExp(`^(${NOMBRE})\\s*:\\s*(.*)$`, 'u'); // Ana: texto
const RE_SOLO_NOMBRE = new RegExp(`^${NOMBRE}$`, 'u'), RE_SOLA_HORA = new RegExp(`^${HORA}$`);
const ETIQUETAS = new Set(['importante', 'nota', 'notas', 'resumen', 'acuerdo', 'acuerdos', 'pendiente', 'pendientes', 'tarea', 'tareas', 'accion', 'acciones', 'action', 'actions', 'notes', 'summary', 'todo', 'ojo', 'tema', 'temas', 'agenda', 'objetivo', 'conclusion', 'conclusiones', 'decision', 'decisiones', 'fecha', 'hora', 'asistentes', 'participantes', 'titulo', 'siguientes pasos', 'proximos pasos', 'next steps', 'speaker', 'transcript', 'transcripcion', 'reunion', 'duracion', 'lugar', 'ejemplo', 'ps']);
const esEtiqueta = (n) => ETIQUETAS.has(fold(n).trim());
const aSegundos = (h) => { if (!h) return null; const p = String(h).split(/[:.,]/).slice(0, 3).map(Number); if (String(h).split(':').length === 3) return p[0] * 3600 + p[1] * 60 + p[2]; return p[0] * 60 + p[1]; };
const limpiaNombre = (n) => String(n ?? '').replace(/\s+/g, ' ').trim().replace(/[:.\-–]+$/, '').trim();

export function parsearTranscripcion(texto) {
  const crudas = String(texto ?? '').replace(/\r\n?/g, '\n').split('\n'), lineas = [];
  // Granola / Fireflies: «Ana Pérez» en una línea y «00:05» en la siguiente → «Ana Pérez 00:05».
  for (let i = 0; i < crudas.length; i++) {
    const a = crudas[i].trim(), z = (crudas[i + 1] || '').trim();
    if (RE_SOLO_NOMBRE.test(a) && !esEtiqueta(a) && RE_SOLA_HORA.test(z)) { lineas.push(`${a} ${z}`); i++; } else lineas.push(crudas[i]);
  }
  const clase = lineas.map((raw) => {
    const l = raw.trim(); if (!l) return { vacia: true };
    let m = RE_A.exec(l);
    if (m) {
      if (m[2] && esEtiqueta(m[2])) return { quien: null, t: aSegundos(m[1]), texto: l.slice(l.indexOf(m[2])), nuevo: true };
      return { quien: m[2] ? limpiaNombre(m[2]) : null, t: aSegundos(m[1]), texto: m[3].trim(), nuevo: true, habla: Boolean(m[2]) };
    }
    if ((m = RE_B.exec(l)) && !esEtiqueta(m[1])) return { quien: limpiaNombre(m[1]), t: aSegundos(m[2]), texto: m[3].trim(), nuevo: true, habla: true };
    if ((m = RE_D.exec(l)) && !esEtiqueta(m[1])) return { quien: limpiaNombre(m[1]), t: aSegundos(m[2]), texto: '', nuevo: true, habla: true };
    if ((m = RE_C.exec(l)) && !esEtiqueta(m[1])) return { quien: limpiaNombre(m[1]), t: null, texto: m[2].trim(), nuevo: true, habla: true };
    return { quien: null, t: null, texto: l, nuevo: false };
  });
  const hayHablantes = clase.some((x) => x.habla);
  const turnos = [];
  for (const x of clase) {
    if (x.vacia) continue;
    const ultimo = turnos[turnos.length - 1];
    if (!x.nuevo && ultimo && (hayHablantes || ultimo.t != null)) { ultimo.texto = ultimo.texto ? `${ultimo.texto}\n${x.texto}` : x.texto; continue; } // sigue lo que decía quien hablaba
    turnos.push({ quien: x.quien, t: x.t, texto: x.texto });
  }
  return turnos.filter((t) => t.texto);
}

// ---------- participantes ----------
const nombreDe = (p) => (typeof p === 'string' ? p : p?.nombre || p?.name || '');
const ladoDe = (p) => (typeof p === 'object' && p ? p.lado || p.side || '' : '');
const partes = (s) => fold(s).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
// Un nombre del texto → el nombre de un participante, o null. Con participantes, solo se acepta lo que coincide (completo, o nombre de pila único).
export function resolverQuien(nombre, participantes) {
  const n = limpiaNombre(nombre); if (!n) return null;
  const lista = (Array.isArray(participantes) ? participantes : []).map(nombreDe).map(limpiaNombre).filter(Boolean);
  if (!lista.length) return n; // sin lista: el nombre tal cual lo puso la transcripción
  const pn = partes(n).join(' '); if (!pn) return null;
  const exactos = lista.filter((x) => partes(x).join(' ') === pn); if (exactos.length === 1) return exactos[0];
  const primero = partes(n)[0], porPila = lista.filter((x) => partes(x)[0] === primero && (partes(n).length === 1 || partes(x).join(' ').includes(pn) || pn.includes(partes(x).join(' '))));
  return porPila.length === 1 ? porPila[0] : null;
}

// ---------- frases ----------
// Cada cita es un trozo LITERAL de una sola línea de la transcripción (nunca se junta ni se reescribe).
function frases(turnos) {
  const out = [];
  (Array.isArray(turnos) ? turnos : []).forEach((turno, ti) => {
    for (const linea of String(turno?.texto ?? '').split('\n')) {
      for (const parte of linea.split(/(?<=[.!?…])\s+/u)) {
        const cita = parte.trim(); if (cita.length >= 8) out.push({ cita: corta(cita, 400), turno, ti });
      }
    }
  });
  return out;
}
const esPregunta = (s) => /\?\s*$|^\s*¿/.test(s);
// ¿lo de antes del disparador lo niega? («no te mando», «nunca voy a»…)
const negado = (frase, i) => /\b(?:no|nunca|tampoco|jam[aá]s|not|never|won't|don't|can't)\s+(?:(?:te|le|les|me|lo|la|se|os|nos)\s+)*$/iu.test(frase.slice(Math.max(0, i - 22), i));
const incierto = (s) => /^\s*(?:si|if)\b|\b(?:quiz[aá]s?|tal vez|a ver si|ojal[aá]|maybe|perhaps|might|probablemente|igual y|capaz que)\b/iu.test(s);

// ---------- compromisos ----------
const VERBOS_PROMESA = 'mando|envío|paso|comparto|mandaré|enviaré|pasaré|compartiré|entrego|entregaré|subo|subiré|dejo|dejaré|confirmo|confirmaré|aviso|avisaré|escribo|escribiré|llamo|llamaré|preparo|prepararé|armo|armaré|hago llegar|haré llegar|agendo|agendaré|cotizo|cotizaré|reviso|revisaré|resuelvo|resolveré|programo|programaré';
const NO_PROMESA = new Set(['ser', 'estar', 'ir', 'tener', 'haber', 'poder', 'querer', 'decir', 'pensar', 'hacer falta', 'creer', 'saber', 'sentir', 'parecer', 'dar', 'ver si', 'ponerme', 'contar', 'ser']);
const REGLAS = [
  // fuerza 2 = promesa explícita de quien habla; 1 = más débil (grupo, decisión, otra persona).
  { id: 'te-mando', fuerza: 2, tipo: 'entrega', hablante: true, re: R(`\\b(?:te|les|le|os)\\s+(?:lo\\s+|la\\s+|los\\s+|las\\s+|se\\s+lo\\s+)?(?:${VERBOS_PROMESA})\\b`), motivo: 'promesa explícita' },
  { id: 'lo-mando', fuerza: 2, tipo: 'entrega', hablante: true, re: R(`\\b(?:se\\s+)?(?:lo|la|los|las)\\s+(?:mando|envío|paso|subo|dejo|entrego|armo|preparo|hago|reviso|mandaré|enviaré|pasaré|subiré|dejaré|entregaré|haré|revisaré)\\b`), motivo: 'promesa explícita' },
  { id: 'voy-a', fuerza: 2, tipo: 'entrega', hablante: true, re: R('\\bvoy a\\s+(\\p{L}+(?:ar|er|ir)(?:me|te|le|les|lo|la|los|las|se|nos)?)\\b'), motivo: 'promesa explícita', verbo: 1 },
  { id: 'me-encargo', fuerza: 2, tipo: 'entrega', hablante: true, re: R('\\b(?:yo\\s+)?me\\s+(?:encargo|comprometo|hago cargo)\\b'), motivo: 'se compromete quien habla' },
  { id: 'lo-tengo', fuerza: 2, tipo: 'entrega', hablante: true, requiereFecha: true, re: R('\\b(?:lo|la|los|las)\\s+(?:tengo|tenemos)(?:\\s+list[oa]s?)?\\b'), motivo: 'plazo propio' },
  { id: 'ill', fuerza: 2, tipo: 'entrega', hablante: true, re: /\bI(?:'ll|’ll| will)\s+(?:send|share|get|have|follow up|check|book|set up|circle back|prepare|draft|review|confirm|call|email|upload|deliver|put together|schedule)\b|\bI(?:'m| am) going to\s+(?:send|share|get|prepare|draft|review|confirm|call|email|upload|deliver|schedule|book|check)\b|\blet me\s+(?:send|check|get|find|follow up|confirm)\b/iu, motivo: 'promesa explícita' },
  { id: 'vamos-a', fuerza: 1, tipo: 'entrega', hablante: false, re: R('\\b(?:vamos a|nos toca|nos comprometemos a)\\s+(\\p{L}+(?:ar|er|ir)\\b)'), motivo: 'promesa de grupo', verbo: 1 },
  { id: 'well', fuerza: 1, tipo: 'entrega', hablante: false, re: /\bwe(?:'ll|’ll| will)\s+(?:send|share|get|have|deliver|follow up|prepare|book|schedule|confirm)\b/iu, motivo: 'promesa de grupo' },
  { id: 'necesitamos-que', fuerza: 1, tipo: 'entrega', hablante: false, re: R('\\b(?:necesitamos|necesito|necesitaría|necesitaríamos)\\s+que\\b|\\bwe need (?:you )?to\\b'), motivo: 'pedido a la otra parte', dato: true },
  { id: 'quedamos', fuerza: 1, tipo: 'decision', hablante: false, re: R('\\bquedamos\\s+(?:en|de|que)\\b|\\b(?:acordamos|decidimos)\\b|\\bwe (?:agreed|decided)\\b|\\bnos pusimos de acuerdo\\b'), motivo: 'acuerdo de las dos partes' },
  { id: 'reunion', fuerza: 1, tipo: 'reunion', hablante: false, requiereFecha: true, re: R('\\b(?:agendamos|agendemos|agendamos|nos vemos|nos reunimos|nos juntamos|quedamos de vernos|la próxima reunión|la siguiente reunión|let\'s meet|see you)\\b'), motivo: 'reunión con fecha' },
  { id: 'avisame', fuerza: 1, tipo: 'dato', hablante: false, re: R('\\b(?:avísame|avísanos|confírmame|confírmanos|mándame|mándanos|pásame|pásanos|compárteme|compártenos)\\b'), motivo: 'pedido a la otra parte', requiereFecha: true },
  { id: 'riesgo', fuerza: 1, tipo: 'riesgo', hablante: false, re: R('\\bsi no\\b.{0,80}\\b(?:se atrasa|se retrasa|no alcanzamos|no llegamos|se complica|se cae|se pierde)\\b|\\b(?:dependemos de|depende de)\\b'), motivo: 'dependencia que pone en riesgo' },
];
const DATO = /\b(?:datos?|informaci[oó]n|accesos?|contrase[nñ]as?|credenciales|fotos?|logo|archivos?|brief|materiales?|documentos?|facturas?|n[uú]meros?|cifras?)\b/iu;
// «Ana nos manda el brief el lunes»: una persona de la reunión, solo si se reconoce entre los participantes y hay fecha.
const RE_NOMBRADO = /(\p{Lu}[\p{L}'’-]+(?:\s+\p{Lu}[\p{L}'’-]+)?)\s+(?:nos\s+|me\s+|te\s+|les\s+)?(manda|envía|envia|pasa|comparte|entrega|confirma|prepara|revisa|se encarga de|va a)\b/u;

function compromisoDe(f, { participantes, base }) {
  const s = f.cita;
  if (esPregunta(s)) return null;
  let hit = null;
  for (const r of REGLAS) {
    const m = r.re.exec(s); if (!m) continue;
    if (negado(s, m.index)) continue;
    if (r.verbo && NO_PROMESA.has(fold(m[1]).replace(/(?:me|te|le|les|lo|la|los|las|se|nos)$/, ''))) continue;
    hit = { r, m }; break;
  }
  let quien = null, razon = [], fuerza, tipo, regla;
  if (hit) {
    const { r } = hit;
    fuerza = r.fuerza; tipo = r.tipo; regla = r.id; razon.push(r.motivo);
    if (r.dato && DATO.test(s)) tipo = 'dato';
    if (r.hablante && f.turno?.quien) quien = resolverQuien(f.turno.quien, participantes);
  } else {
    const n = RE_NOMBRADO.exec(s);
    if (!n || negado(s, n.index)) return null;
    const persona = resolverQuien(n[1], participantes);
    // Sin lista de participantes cualquier palabra con mayúscula pasaría por persona: aquí solo vale una persona reconocida.
    if (!persona || !(Array.isArray(participantes) && participantes.length)) return null;
    quien = persona; fuerza = 1; tipo = 'entrega'; regla = 'persona-nombrada'; razon.push('compromiso de una persona de la reunión');
  }
  const fecha = base ? fechaDe(s, base) : null;
  if (hit?.r.requiereFecha && !fecha) return null;
  if (regla === 'persona-nombrada' && !fecha) return null;
  if (hit?.r.id === 'riesgo' && fecha) tipo = 'riesgo';
  let puntos = fuerza + (fecha ? 1 : 0) + (quien ? 1 : 0);
  if (fecha) razon.push(`con fecha («${fecha.expresion}»)`); else razon.push('sin fecha');
  razon.push(quien ? 'con responsable' : 'sin responsable claro');
  if (incierto(s)) { puntos = Math.max(0, puntos - 3); razon.push('condicional o incierto'); }
  return {
    cita: s, quien, para_cuando: fecha?.fecha ?? null, precision: fecha?.precision ?? null, tipo,
    confianza: puntos >= 4 ? 'alta' : puntos >= 2 ? 'media' : 'baja', razon: razon.join(' · '),
    estado: 'hipotesis', t: f.turno?.t ?? null, turno: f.ti, regla,
  };
}

export function extraerCompromisos(turnos, { participantes = [], fecha = null } = {}) {
  const visto = new Set(), out = [];
  for (const f of frases(turnos)) {
    const c = compromisoDe(f, { participantes, base: fecha });
    if (!c) continue;
    const k = `${c.turno}|${fold(c.cita)}`; if (visto.has(k)) continue; visto.add(k);
    out.push(c);
  }
  return out;
}

// ---------- señales: lo que quiere, lo que le duele, lo que le frena ----------
const SENALES = {
  quiere: [{ re: R('\\b(?:quiere|quieren|quiero|queremos|quisiera|quisiéramos|me gustaría|nos gustaría|buscamos|busco|nuestro objetivo|mi objetivo|el objetivo es|la meta es|nuestra meta|apuntamos a|necesito(?! que\\b)|necesitamos(?! que\\b)|tenemos que lograr)\\b|\\b(?:we want|i want|we(?:\'re| are) looking (?:to|for)|our goal|the goal is)\\b'), conf: 'media' }],
  dolores: [{ re: R('\\b(?:me preocupa|nos preocupa|el problema es|el problema que tenemos|nos cuesta|me cuesta|no logramos|no hemos logrado|no hemos podido|estamos estancados|nos estancamos|perdemos (?:clientes|ventas|tiempo|dinero)|se nos complica|nos frustra|me frustra|no nos funciona|no nos ha funcionado|no está funcionando|nos duele|no vendemos|no nos llegan)\\b|\\b(?:the problem is|we struggle|we(?:\'re| are) struggling|not working|pain point)\\b'), conf: 'media' }],
  objeciones: [
    { re: R('\\b(?:es|está|esta|me parece|nos parece)\\s+(?:muy |demasiado |un poco )?(?:caro|cara)\\b|\\b(?:muy|demasiado) caro\\b|\\bmucho dinero\\b|\\bno (?:tenemos|tengo) presupuesto\\b|\\bno (?:me|nos) alcanza\\b|\\btoo expensive\\b'), conf: 'media', tema: 'precio' },
    { re: R('\\b(?:no estoy seguro|no estamos seguros|tengo dudas|tenemos dudas|no me convence|no nos convence|déjame pensarlo|déjanos pensarlo|lo (?:voy a|tengo que|tenemos que|vamos a) pensar|lo consulto con|consultarlo con|tengo que hablarlo con)\\b|\\b(?:not sure|need to think|let me think|talk to my (?:partner|team|boss))\\b'), conf: 'media', tema: 'duda' },
  ],
  riesgos: [
    { re: R('\\b(?:presupuesto (?:ajustado|limitado|reducido|chico|muy justo)|recort\\w+ (?:el )?presupuesto|bajar el presupuesto|sin presupuesto)\\b|\\b(?:tight budget|budget is (?:tight|limited))\\b'), conf: 'media', tema: 'precio' },
    { re: R('\\b(?:no tenemos tiempo|poco tiempo|muy justo de tiempo|tiempos muy justos|no (?:nos )?da el tiempo|no llegamos a tiempo|no alcanzamos|a contrarreloj)\\b|\\b(?:running out of time|deadline is (?:tight|close))\\b'), conf: 'media', tema: 'tiempo' },
    { re: R('\\b(?:es urgente|urge)\\b|\\bpara ya\\b'), conf: 'baja', tema: 'tiempo' },
    { re: R('\\b(?:no confío|no confiamos|ya nos fallaron|nos fallaron|mala experiencia|nos quemaron|nos estafaron|desconfi\\w+|no creo que funcione|ya probamos (?:con )?(?:otra|una) agencia)\\b|\\b(?:bad experience|burned|didn\'t deliver)\\b'), conf: 'media', tema: 'desconfianza' },
    { re: R('\\bnos prometieron\\b'), conf: 'baja', tema: 'desconfianza' },
  ],
  funciono: [{ re: R('\\b(?:me encantó|nos encantó|nos encanta|me encanta|quedó (?:muy |súper |super )?(?:bien|genial|increíble|perfecto|hermoso|lindo)|nos funcionó|nos ha funcionado|funcionó (?:muy )?bien|buen resultado|excelente resultado|gran resultado|estamos contentos|estoy contento|muy contentos)\\b|\\b(?:we loved|worked (?:really )?well|love it|great results?)\\b'), conf: 'media' }],
};
export const CATEGORIAS = Object.keys(SENALES);

// turnos → { quiere, dolores, objeciones, riesgos, funciono }, cada ítem con su cita. Si los participantes dicen quién es del cliente
// (`lado:'cliente'`), solo cuentan sus palabras (lo que dice el equipo de Inherent no es lo que el cliente quiere).
export function extraerSenales(turnos, { participantes = [] } = {}) {
  const soloCliente = (Array.isArray(participantes) ? participantes : []).some((p) => ladoDe(p) === 'cliente');
  const delCliente = (turno) => { const q = resolverQuien(turno?.quien, participantes); const p = (participantes || []).find((x) => nombreDe(x) === q); return Boolean(q) && ladoDe(p) === 'cliente'; };
  const out = Object.fromEntries(CATEGORIAS.map((k) => [k, []]));
  const visto = new Set();
  for (const f of frases(turnos)) {
    if (esPregunta(f.cita)) continue;
    if (soloCliente && !delCliente(f.turno)) continue;
    for (const cat of CATEGORIAS) {
      for (const p of SENALES[cat]) {
        const m = p.re.exec(f.cita); if (!m || negado(f.cita, m.index) && cat !== 'objeciones') continue;
        const k = `${cat}|${fold(f.cita)}`; if (visto.has(k)) break; visto.add(k);
        out[cat].push({ cita: f.cita, quien: resolverQuien(f.turno?.quien, participantes), t: f.turno?.t ?? null, ...(p.tema ? { tema: p.tema } : {}), confianza: incierto(f.cita) ? 'baja' : p.conf });
        break;
      }
    }
  }
  return out;
}

// ---------- memoria del cliente ----------
const PESO = { alta: 3, media: 2, baja: 1 };
const peso = (i) => (i.conocimiento === 'aprobado' ? 10 : 0) + (PESO[i.confianza] || 0);
const porPeso = (a, z) => peso(z) - peso(a) || String(z.fecha || '').localeCompare(String(a.fecha || ''));
const FUENTE_CONTACTO = new Set(['reunion', 'llamada', 'mensaje']);
const PARAS = new Set(['para', 'pero', 'como', 'esta', 'este', 'esto', 'estos', 'estas', 'esa', 'ese', 'eso', 'esos', 'esas', 'mando', 'envio', 'paso', 'comparto', 'tengo', 'tenemos', 'voy', 'vamos', 'listo', 'lista', 'quedamos', 'acordamos', 'decidimos', 'necesitamos', 'necesito', 'tambien', 'cuando', 'antes', 'luego', 'hoy', 'manana', 'semana', 'proxima', 'proximo', 'viene', 'fecha', 'mes', 'dias', 'dia', 'que', 'con', 'por', 'los', 'las', 'del', 'una', 'uno', 'unos', 'unas', 'les', 'nos', 'mas', 'muy', 'ver', 'hacer', 'sobre', 'entre', 'desde', 'hasta', 'ahora', 'asi', 'bien', 'solo', 'mucho', 'encargo', 'aviso', 'confirmo', 'entrego', 'subo', 'dejo', 'reviso', 'armo', 'preparo', 'escribo', 'llamo', 'agendo', 'will', 'send', 'share', 'have', 'need', 'the', 'and', 'you', 'for', 'this', 'that', 'with', 'next', 'week', 'month', 'tomorrow', 'today']);
const VOCAB_FECHA = new Set([...Object.keys(DIAS), ...Object.keys(MESES), ...Object.keys(NUMS)]);
// «De qué trata» un compromiso: sus palabras de contenido, sin fechas ni verbos de promesa. Sirve para ver si dos hablan de lo mismo.
export function temaDe(texto) {
  return new Set(fold(texto).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !PARAS.has(w) && !VOCAB_FECHA.has(w) && !/^\d+$/.test(w)).map((w) => w.replace(/(?:es|s)$/, '')));
}
const solapa = (a, b) => { if (!a.size || !b.size) return 0; let n = 0; for (const x of a) if (b.has(x)) n++; return n / Math.min(a.size, b.size); };

export function memoriaDelCliente(fuentes = [], { hoy = new Date(), permite = (f) => !f?.interno } = {}) {
  const hoyP = diaDe(hoy), hoyIso = isoDe(hoyP);
  const lista = (Array.isArray(fuentes) ? fuentes : []).filter((f) => f && f.id && permite(f));
  const cat = { quiere: [], dolores: [], prometido: [], funciono: [], riesgos: [] };
  let ultimo = null;

  for (const f of lista) {
    const dia = diaDe(f.fecha), fecha = isoDe(dia), ref = { id: f.id, tipo: f.tipo || 'nota', titulo: corta(f.titulo || '', 120) };
    const base = (extra) => ({ fuente: ref, fecha, confianza: 'baja', conocimiento: 'hipotesis', ...(f.interno ? { interno: true } : {}), ...extra });
    if (FUENTE_CONTACTO.has(f.tipo) && fecha && (!ultimo || fecha > ultimo.fecha)) ultimo = { fecha, fuente: ref };

    if (f.tipo === 'entregable') {
      const revisar = Boolean(f.revisar), conf = revisar ? 'media' : 'alta';
      if (f.aprobadoPorCliente) cat.funciono.push(base({ id: `${f.id}#cliente`, texto: `«${f.titulo || 'Entregable'}» lo aprobó el cliente`, confianza: conf, conocimiento: 'aprobado', razon: revisar ? 'algo de arriba cambió: revisar' : 'aprobación del cliente registrada' }));
      for (const [n, r] of (Array.isArray(f.resultados) ? f.resultados : []).entries()) {
        const texto = [r.metrica, r.valor].filter(Boolean).join(': '); if (!texto) continue;
        cat.funciono.push(base({ id: `${f.id}#res${n}`, texto: corta(texto, 200), ...(r.nota ? { nota: corta(r.nota, 300) } : {}), confianza: conf, conocimiento: 'aprobado', razon: 'resultado anotado en el entregable' }));
      }
      continue;
    }

    const turnos = Array.isArray(f.turnos) ? f.turnos : parsearTranscripcion(f.texto);
    const compromisos = Array.isArray(f.compromisos) ? f.compromisos : extraerCompromisos(turnos, { participantes: f.participantes, fecha: f.fecha });
    const senales = f.senales || extraerSenales(turnos, { participantes: f.participantes });
    compromisos.forEach((c, n) => {
      if (!c?.cita || c.estado === 'descartado') return;
      const hecha = c.estado === 'aprobado';
      cat.prometido.push(base({ ...(c.id ? { id: c.id } : { id: `${f.id}#c${n}` }), ...(c.v != null ? { v: c.v } : {}), texto: c.cita, cita: c.cita, quien: c.quien ?? null, para_cuando: c.para_cuando ?? null, precision: c.precision ?? null, tipo: c.tipo, estado: c.estado || 'hipotesis', ...(c.tarea_id ? { tarea_id: c.tarea_id } : {}),
        confianza: c.confianza || 'baja', conocimiento: hecha ? 'aprobado' : 'hipotesis', razon: c.razon, ...(c.para_cuando && hoyIso && c.para_cuando < hoyIso && !c.cumplido ? { vencido: true } : {}) }));
    });
    const mete = (destino, s, n, k) => destino.push(base({ id: `${f.id}#${k}${n}`, texto: s.cita, cita: s.cita, quien: s.quien ?? null, confianza: s.confianza || 'media', ...(s.tema ? { tema: s.tema } : {}), razon: 'frase del cliente que dice esto' }));
    (senales.quiere || []).forEach((s, n) => mete(cat.quiere, s, n, 'q'));
    (senales.dolores || []).forEach((s, n) => mete(cat.dolores, s, n, 'd'));
    (senales.funciono || []).forEach((s, n) => mete(cat.funciono, s, n, 'f'));
    (senales.riesgos || []).forEach((s, n) => mete(cat.riesgos, { ...s, tema: s.tema || 'riesgo' }, n, 'r'));
    (senales.objeciones || []).forEach((s, n) => mete(cat.riesgos, { ...s, tema: s.tema === 'precio' ? 'precio' : 'objecion' }, n, 'o'));
  }

  // Lo mismo dicho en varias fuentes: queda el que más pesa y se anota dónde más apareció.
  const unico = (items) => {
    const mapa = new Map();
    for (const it of items.sort(porPeso)) {
      const k = fold(it.texto).replace(/[^a-z0-9]/g, '');
      const ya = mapa.get(k); if (ya) { ya.tambien_en = [...(ya.tambien_en || []), it.fuente.id]; continue; }
      mapa.set(k, it);
    }
    return [...mapa.values()];
  };
  for (const k of Object.keys(cat)) cat[k] = unico(cat[k]);

  // Contradicciones: dos fechas distintas para lo mismo.
  const contradicciones = [], vivos = cat.prometido.filter((p) => p.para_cuando);
  const temas = new Map(vivos.map((p) => [p.id, temaDe(p.cita)]));
  for (let i = 0; i < vivos.length; i++) for (let j = i + 1; j < vivos.length; j++) {
    const a = vivos[i], b = vivos[j];
    if (a.para_cuando === b.para_cuando || solapa(temas.get(a.id), temas.get(b.id)) < 0.6) continue;
    (a.contradice ||= []).push(b.id); (b.contradice ||= []).push(a.id);
    contradicciones.push({ items: [a.id, b.id], fechas: [a.para_cuando, b.para_cuando], citas: [a.cita, b.cita], motivo: 'Dos fechas distintas para lo mismo' });
  }

  const sinDatos = {};
  for (const k of Object.keys(cat)) if (!cat[k].length) sinDatos[k] = SIN_DATOS;
  const dias = ultimo && hoyP ? Math.round((Date.UTC(hoyP.y, hoyP.m - 1, hoyP.d) - Date.UTC(...ultimo.fecha.split('-').map((x, i) => (i === 1 ? +x - 1 : +x)))) / 864e5) : null;
  if (!ultimo) sinDatos.ultimoContacto = SIN_DATOS;
  return { ...cat, ultimoContacto: ultimo ? { ...ultimo, hace_dias: dias } : null, contradicciones, sinDatos, fuentes: lista.length };
}
