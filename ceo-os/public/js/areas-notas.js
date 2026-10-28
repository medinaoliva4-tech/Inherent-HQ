// Las notas de cada área (Strategy, Marketing, Creative, Consulting, Production): lo que el área sabe y lo importante, fijado.
// Puro: sin DOM ni red (lo prueba scripts/test-areas.mjs). Viven en la colección «area_notes» (por /api/db, con su v y su audit);
// la pantalla es screens/areas.js. Nada se borra: una nota se archiva.
// Cada nota puede llevar fecha y estado (Por hacer · En curso · Hecho) y se ve en Lista, Tablero (por estado) o Calendario (por fecha).

// Las cinco áreas: las mismas de herramientas.js (WORKSPACES) por su id, su color (--ui-m-<id> en app.css) y su modo del Chat.
export const AREAS_INFO = [
  { id: 'strategy', nombre: 'Strategy', sub: 'La estrategia de cada cliente', icono: 'nav-strategy', color: '--ui-m-strategy', modo: 'estrategia' },
  { id: 'marketing', nombre: 'Marketing', sub: 'La demanda y los canales de cada cliente', icono: 'nav-marketing', color: '--ui-m-marketing', modo: 'marketing' },
  { id: 'creative', nombre: 'Creative', sub: 'La identidad y las piezas de cada marca', icono: 'nav-creative', color: '--ui-m-creative', modo: 'diseno' },
  { id: 'consulting', nombre: 'Consulting', sub: 'Que la empresa aguante lo que crece', icono: 'nav-consulting', color: '--ui-m-consulting', modo: 'consulting' },
  { id: 'production', nombre: 'Production', sub: 'Grabar y entregar cada producción', icono: 'nav-production', color: '--ui-m-production', modo: 'produccion' },
];
// Un área que no existe es la primera (igual que la ruta #/areas/<id>).
export const areaInfo = (id) => AREAS_INFO.find((a) => a.id === id) || AREAS_INFO[0];

export const TIPOS = ['nota', 'link', 'archivo', 'decision'];
export const TIPO_NOMBRE = { nota: 'Nota', link: 'Link', archivo: 'Archivo', decision: 'Decisión' };
export const TIPO_ICONO = { nota: 'file-text', link: 'link', archivo: 'paperclip', decision: 'circle-check' };
// Valor del filtro de cliente para «las que no son de ningún cliente». Empieza con «_»: ningún slug de cliente lo hace.
export const SIN_CLIENTE = '_ninguno';

// El estado de una nota (opcional: '' = sin estado) y las tres formas de verlas.
export const ESTADOS = ['Por hacer', 'En curso', 'Hecho'];
export const SIN_ESTADO = 'Sin estado';
export const VISTAS = ['lista', 'tablero', 'calendario'];
export const VISTA_NOMBRE = { lista: 'Lista', tablero: 'Tablero', calendario: 'Calendario' };
export const VISTA_ICONO = { lista: 'list', tablero: 'kanban', calendario: 'calendar-days' };
export const vistaOk = (v) => (VISTAS.includes(v) ? v : 'lista');
export const DIAS_PROXIMO = 14; // «Próximo»: lo que vence en las próximas dos semanas

export const LIMITES = { titulo: 120, texto: 20000, link: 800, nombre: 120, etiqueta: 30, etiquetas: 8, cliente: 60 };

// ---------- Limpiar ----------
const una = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n); // texto de una línea
const bool = (v) => v === true || v === 'true' || v === 1;
// Solo https (nunca http, javascript:, data:…). Una URL larga de más se descarta, no se corta: cortada apuntaría a otro lado.
export function linkSeguro(v) {
  const s = String(v ?? '').trim();
  if (!s || s.length > LIMITES.link || /[\s"'<>]/.test(s)) return '';
  try { return new URL(s).protocol === 'https:' ? s : ''; } catch { return ''; }
}
export function hostDe(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } }
// Etiquetas: lista (o texto separado por comas), cortas, sin «#», sin repetir, hasta 8.
export function limpiarEtiquetas(v) {
  const l = Array.isArray(v) ? v : String(v ?? '').split(/[,;\n]/);
  const vistas = new Set(), out = [];
  for (const x of l) {
    const t = una(x, 60).replace(/^#+\s*/, '').slice(0, LIMITES.etiqueta).trim(), k = t.toLowerCase();
    if (!t || vistas.has(k)) continue; vistas.add(k); out.push(t);
  }
  return out.slice(0, LIMITES.etiquetas);
}
// ---------- Fechas ('AAAA-MM-DD', siempre del día, sin hora ni zona) ----------
// Una fecha que existe (2026-02-30 no) o ''.
export function fechaLimpia(v) {
  const s = String(v ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  const t = Date.parse(`${s}T12:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === s ? s : '';
}
const dos = (n) => String(n).padStart(2, '0');
// Hoy en la hora de la compu (no en UTC: de noche en Guatemala, UTC ya es mañana).
export const fechaHoy = (d = new Date()) => `${String(d.getFullYear()).padStart(4, '0')}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
// La fecha n días después (n puede ser negativo). '' si la fecha no es real.
export function sumarDias(fecha, n) {
  const f = fechaLimpia(fecha); if (!f) return '';
  return new Date(Date.parse(`${f}T12:00:00Z`) + Math.trunc(Number(n) || 0) * 86400000).toISOString().slice(0, 10);
}
// Días de hoy a la fecha (0 = hoy, 1 = mañana, negativo = ya pasó). null si alguna no es real.
export function diasHasta(fecha, hoy) {
  const a = fechaLimpia(fecha), b = fechaLimpia(hoy); if (!a || !b) return null;
  return Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86400000);
}
// ---------- Meses ('AAAA-MM') ----------
export const mesOk = (m) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(m ?? ''));
export const mesDe = (fecha) => fechaLimpia(fecha).slice(0, 7);
// El mes delta meses después (o antes). Si no es un mes, devuelve ''.
export function moverMes(mes, delta) {
  if (!mesOk(mes)) return '';
  const i = Number(mes.slice(0, 4)) * 12 + Number(mes.slice(5, 7)) - 1 + Math.trunc(Number(delta) || 0), y = Math.floor(i / 12);
  return y < 0 || y > 9999 ? mes : `${String(y).padStart(4, '0')}-${dos((i % 12) + 1)}`;
}
// Las semanas del mes para pintarlo (lunes a domingo): cada semana son 7 fechas, con los días de los meses de al lado para completar.
export function grillaMes(mes) {
  if (!mesOk(mes)) return [];
  const primero = `${mes}-01`, lead = (new Date(`${primero}T12:00:00Z`).getUTCDay() + 6) % 7;
  const dias = diasHasta(`${moverMes(mes, 1)}-01`, primero), semanas = Math.ceil((lead + dias) / 7), out = [];
  let d = sumarDias(primero, -lead);
  for (let s = 0; s < semanas; s++) { const w = []; for (let i = 0; i < 7; i++) { w.push(d); d = sumarDias(d, 1); } out.push(w); }
  return out;
}

const limpiarArchivo = (a) => {
  const url = linkSeguro(a?.url); if (!url) return null;
  return { url, nombre: una(a?.nombre, LIMITES.nombre) || 'Archivo' };
};
// Deja solo las llaves de una nota. El título es obligatorio (notaError lo dice); id, v y _meta los pone el servidor.
export function limpiarNota(b) {
  b = b && typeof b === 'object' ? b : {};
  const cliente = String(b.cliente ?? '').trim().toLowerCase();
  return {
    area: areaInfo(b.area).id,
    tipo: TIPOS.includes(b.tipo) ? b.tipo : 'nota',
    titulo: una(b.titulo, LIMITES.titulo),
    texto: String(b.texto ?? '').replace(/\r\n?/g, '\n').trim().slice(0, LIMITES.texto),
    link: linkSeguro(b.link),
    archivo: limpiarArchivo(b.archivo),
    cliente: /^[a-z0-9][a-z0-9_-]{0,59}$/.test(cliente) ? cliente : '',
    etiquetas: limpiarEtiquetas(b.etiquetas),
    fecha: fechaLimpia(b.fecha),
    estado: ESTADOS.includes(b.estado) ? b.estado : '',
    importante: bool(b.importante),
    archivado: bool(b.archivado),
  };
}
// Un documento de la base ya limpio, con lo que el servidor le pone (id, v, _meta).
export const leerNota = (d) => ({ ...limpiarNota(d), id: d?.id, v: d?.v, _meta: d?._meta });
// Lo que falta antes de guardar, en lenguaje humano ('' = está bien). Recibe lo que escribió la persona (sin limpiar).
export function notaError(b, { archivoNuevo = false } = {}) {
  const n = limpiarNota(b);
  if (!n.titulo) return 'Falta el título.';
  if (String(b?.link ?? '').trim() && !n.link) return 'El link tiene que empezar con https://';
  if (n.tipo === 'link' && !n.link) return 'Pega el link (empieza con https://).';
  if (n.tipo === 'archivo' && !n.archivo && !n.link && !archivoNuevo) return 'Sube el archivo o pega su link.';
  if (String(b?.fecha ?? '').trim() && !n.fecha) return 'La fecha no es válida. Elige un día del calendario.';
  return '';
}

// ---------- Ordenar y filtrar ----------
const cuando = (n) => Date.parse(n?._meta?.updated_at || n?._meta?.created_at || '') || 0;
// Las importantes primero; dentro de cada grupo, la más reciente arriba. No cambia la lista que recibe.
export const ordenar = (notas) => (Array.isArray(notas) ? [...notas] : []).sort((a, b) => Number(Boolean(b.importante)) - Number(Boolean(a.importante)) || cuando(b) - cuando(a));
const plano = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// q: todas las palabras (sin importar acentos ni mayúsculas) en título, texto, link, archivo o etiquetas.
// cliente: '' = todos · SIN_CLIENTE = las que no son de un cliente · un slug. tipo: '' = todos.
export function filtrar(notas, { q = '', cliente = '', tipo = '' } = {}) {
  const palabras = plano(q).split(/\s+/).filter(Boolean);
  return (Array.isArray(notas) ? notas : []).filter((n) => {
    if (tipo && n.tipo !== tipo) return false;
    if (cliente === SIN_CLIENTE ? Boolean(n.cliente) : Boolean(cliente) && n.cliente !== cliente) return false;
    if (!palabras.length) return true;
    const heno = plano([n.titulo, n.texto, n.link, n.archivo?.nombre, ...(n.etiquetas || [])].join('\n'));
    return palabras.every((p) => heno.includes(p));
  });
}
// Las de un área: las activas (por defecto), las archivadas (archivadas: true) o todas (archivadas: 'todas').
export const deArea = (notas, area, { archivadas = false } = {}) => (Array.isArray(notas) ? notas : []).filter((n) => n?.area === area && (archivadas === 'todas' || Boolean(n.archivado) === Boolean(archivadas)));

// ---------- Ver: por estado, por día, lo que viene ----------
// Las notas en sus columnas (Por hacer, En curso, Hecho y Sin estado), en el orden en que llegan.
export function porEstado(notas) {
  const out = Object.fromEntries([...ESTADOS, SIN_ESTADO].map((e) => [e, []]));
  for (const n of Array.isArray(notas) ? notas : []) if (n) out[ESTADOS.includes(n.estado) ? n.estado : SIN_ESTADO].push(n);
  return out;
}
// Las notas con fecha de un mes ('AAAA-MM'), por día: { 'AAAA-MM-DD': [notas] }. Las de otros meses y las sin fecha no entran.
export function porDia(notas, mes) {
  const out = {};
  if (!mesOk(mes)) return out;
  for (const n of Array.isArray(notas) ? notas : []) { const f = fechaLimpia(n?.fecha); if (f && f.startsWith(`${mes}-`)) (out[f] ||= []).push(n); }
  return out;
}
// Lo que vence de hoy a hoy + días (por defecto 14): con fecha, sin estar Hecho ni archivada; la más cercana primero (y, a igual día, la importante).
export function proximas(notas, hoy, dias = DIAS_PROXIMO) {
  const desde = fechaLimpia(hoy), n = dias == null ? DIAS_PROXIMO : Number(dias);
  if (!desde) return [];
  const hasta = sumarDias(desde, Number.isFinite(n) && n >= 0 ? n : DIAS_PROXIMO);
  return (Array.isArray(notas) ? notas : [])
    .filter((x) => { const f = fechaLimpia(x?.fecha); return f && f >= desde && f <= hasta && x.estado !== 'Hecho' && !x.archivado; })
    .sort((a, b) => fechaLimpia(a.fecha).localeCompare(fechaLimpia(b.fecha)) || Number(Boolean(b.importante)) - Number(Boolean(a.importante)));
}
// Ya pasó su fecha y no está Hecha.
export const vencida = (n, hoy) => { const f = fechaLimpia(n?.fecha), h = fechaLimpia(hoy); return Boolean(f && h) && f < h && n.estado !== 'Hecho'; };
