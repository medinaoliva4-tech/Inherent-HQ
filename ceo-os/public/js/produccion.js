// Lo común de Production, sin DOM ni red: las 16 columnas del plan de producción, el techo de realidad que dicen las horas y sesiones de la
// ficha (un video planificado = 20 min de cámara) y la lectura de la shot list de ④ (plan-de-contenido.csv + ideas-<formato>.md).
// Existe para que el Production Brief, el Shot List Builder y la pantalla de contenido lean lo mismo. Sin dato no hay cifra: null, nunca 0.

// Las 16 columnas de agents/05-production/brain/entregables/plan-de-produccion.csv (el orden es el del método).
export const COLUMNAS_CSV = ['id', 'id_creativo', 'campana', 'escena', 'accion', 'encuadre', 'duracion_s', 'locacion', 'talento', 'recursos', 'equipo', 'jornada', 'costo_estimado', 'riesgo', 'destino', 'estado'];
export const MIN_POR_VIDEO = 20;

const sinAcentos = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const num = (v) => { const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.').trim()); return String(v ?? '').trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null; };

// ---------- Techo de realidad ----------
// Las horas y sesiones salen de la ficha (texto de «Qué incluye»): «8 horas de grabación», «2 sesiones». Si la ficha no las dice: null.
// `declarada` = lo que declara el cliente (si es menor, manda la menor).
export function techo(ficha, declarada = {}) {
  const lineas = [];
  if (typeof ficha === 'string') lineas.push(ficha);
  else if (ficha && typeof ficha === 'object') for (const x of Array.isArray(ficha.incluye) ? ficha.incluye : []) lineas.push(typeof x === 'string' ? x : `${x?.k ?? ''}: ${x?.v ?? ''}`);
  const t = lineas.join('\n');
  const h = t.match(/(\d+(?:[.,]\d+)?)\s*(?:h\b|hrs?\b|horas?)/i), s = t.match(/(\d+)\s*sesion(?:es)?/i);
  const menor = (a, b) => (a === null ? b : b === null ? a : Math.min(a, b));
  const horas = menor(h ? num(h[1]) : null, num(declarada?.horas)), sesiones = menor(s ? num(s[1]) : null, num(declarada?.sesiones));
  return { horas, sesiones, fuente: h || s ? 'la ficha de oferta' : '' };
}

// Cuánto pide la lista de piezas contra el techo: los videos que se pueden producir (producible sí o ajuste) × 20 min.
export function carga(piezas, t) {
  const videos = (Array.isArray(piezas) ? piezas : []).filter((p) => p?.material === 'video' && p.producible !== 'no').length;
  const horas = Math.round((videos * MIN_POR_VIDEO / 60) * 100) / 100, th = num(t?.horas), ts = num(t?.sesiones);
  const porSesion = th !== null && ts ? th / ts : null;
  const sesiones = porSesion ? Math.ceil(horas / porSesion - 1e-9) : null;
  const pasa = th !== null && horas > th + 1e-9, pasaSesiones = ts !== null && sesiones !== null && sesiones > ts;
  return { videos, horas, techoHoras: th, techoSesiones: ts, sesiones, pct: th ? Math.round((horas / th) * 100) : null, pasa: pasa || pasaSesiones, sobran: pasa ? Math.round((horas - th) * 100) / 100 : 0,
    caben: th === null ? null : Math.floor(th * 60 / MIN_POR_VIDEO + 1e-9) };
}

// ---------- CSV ----------
export function csv(texto) {
  const filas = []; let fila = [], c = '', q = false; const t = String(texto ?? '').replace(/^﻿/, '');
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { fila.push(c); c = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; fila.push(c); filas.push(fila); fila = []; c = ''; }
    else c += ch;
  }
  if (c || fila.length) { fila.push(c); filas.push(fila); }
  return filas;
}
const esc = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
// filas = [{ id, … }] con las 16 columnas; lo que falte va vacío. costos = false vacía costo_estimado (quien no ve costos).
export function aCsv(filas, { costos = false } = {}) {
  const L = [COLUMNAS_CSV.join(',')];
  for (const f of Array.isArray(filas) ? filas : []) L.push(COLUMNAS_CSV.map((k) => esc(k === 'costo_estimado' && !costos ? '' : f?.[k])).join(','));
  return L.join('\n');
}

// ---------- Lo que entregó ④ en el repo ----------
const COLS_PLAN = ['id', 'campana', 'fecha', 'canal', 'formato', 'pilar', 'funcion', 'concepto', 'mezcla', 'traza', 'material', 'estado', 'trial'];
const ALIAS = { concepto: ['concepto', 'idea', 'titulo', 'title'], campana: ['campana', 'campaign'] };
// months = [{ mes, files: [{ name, content }] }] (repo/content?profile=…) → { ms, m, rows } con las filas de plan-de-contenido.csv del mes (o del primero).
export function shotData(months, mes = null) {
  const ms = (Array.isArray(months) ? months : []).filter((m) => (m?.files || []).some((f) => f.name === 'plan-de-contenido.csv'));
  const m = ms.find((x) => x.mes === mes) || ms[0];
  if (!m) return { ms, m: null, rows: [] };
  const f = m.files.find((x) => x.name === 'plan-de-contenido.csv');
  const [head = [], ...body] = csv(f.content), H = head.map(sinAcentos);
  const val = (r, k) => { for (const a of ALIAS[k] || [k]) { const i = H.indexOf(a); if (i >= 0 && r[i]) return r[i].trim(); } return ''; };
  const rows = body.filter((r) => r.some(Boolean)).map((r, i) => { const o = Object.fromEntries(COLS_PLAN.map((k) => [k, val(r, k)])); o.material = sinAcentos(o.material); o.id ||= `#${i + 1}`; return o; });
  return { ms, m, rows };
}
// La sección de una pieza en su ideas-<formato>.md: desde la línea con su id hasta la siguiente pieza. null si no está.
export function pieceText(m, row) {
  const slugF = (x) => sinAcentos(x).replace(/[^a-z0-9]+/g, '-');
  const files = m?.files || [];
  const f = files.find((x) => x.name === `ideas-${slugF(row?.formato)}.md`) || files.find((x) => /^ideas-.*\.md$/.test(x.name) && String(x.content).includes(row?.id));
  if (!f) return null;
  const L = String(f.content).split('\n'), i = L.findIndex((l) => /^#{1,4}\s/.test(l) && l.includes(row.id)); if (i < 0) return null;
  const lvl = L[i].match(/^#+/)[0].length; let j = i + 1; while (j < L.length && !(new RegExp(`^#{1,${lvl}}\\s`).test(L[j]))) j++;
  return L.slice(i, j).join('\n');
}
