// Las notas de cada área (Strategy, Marketing, Creative, Consulting, Production): lo que el área sabe y lo importante, fijado.
// Puro: sin DOM ni red (lo prueba scripts/test-areas.mjs). Viven en la colección «area_notes» (por /api/db, con su v y su audit);
// la pantalla es screens/areas.js. Nada se borra: una nota se archiva.

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
