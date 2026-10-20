// El modelo de elemento: lo que comparte todo lo que se crea en una marca (ideas y piezas del calendario).
// Tres reglas: el estado siempre se ve, el nombre se arma solo y lo terminado se archiva solo.
// Este archivo no toca la pantalla: lo usan la interfaz, el servidor (buscador) y el conector de Claude.

// Los estados de un contenido, en orden. «Archivado» no es una etapa: es salir de las vistas normales.
export const ESTADOS = ['Idea', 'En proceso', 'Listo', 'Publicado'];
export const ARCHIVADO = 'Archivado';
export const ESTADOS_TODOS = [...ESTADOS, ARCHIVADO];
// Qué quiere decir cada uno, en una frase (para la ayuda y el portal).
export const ESTADO_AYUDA = {
  Idea: 'Todavía es una idea: falta guion o material',
  'En proceso': 'Se está grabando, diseñando o editando',
  Listo: 'Aprobado y listo para salir (o ya programado)',
  Publicado: 'Ya salió',
  Archivado: 'Fuera de las vistas normales; se ve en Archivo',
};
// El tono del chip de cada estado (clases de chip que ya existen).
export const ESTADO_CLS = { Idea: '', 'En proceso': 'amber', Listo: 'lime', Publicado: 'green', Archivado: '' };

// Los estados viejos (y los que escribe Claude con otras palabras) se leen como los nuevos. Nada se reescribe en la base.
const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
const VIEJOS = {
  idea: 'Idea', ideas: 'Idea', borrador: 'Idea', 'por grabar': 'Idea', pendiente: 'Idea',
  grabado: 'En proceso', editado: 'En proceso', 'en proceso': 'En proceso', 'en produccion': 'En proceso', 'en curso': 'En proceso', grabando: 'En proceso', editando: 'En proceso', 'en revision': 'En proceso', 'en diseno': 'En proceso',
  programado: 'Listo', listo: 'Listo', aprobado: 'Listo', 'listo para publicar': 'Listo',
  publicado: 'Publicado', publicada: 'Publicado',
  archivado: 'Archivado', archivada: 'Archivado',
};
// El estado de un elemento (o de un texto de estado). Sin estado → «Idea».
export function estadoDe(x) {
  const s = typeof x === 'string' || x == null ? x : x.status;
  if (x && typeof x === 'object' && x.archived === true) return ARCHIVADO;
  return VIEJOS[fold(s)] || 'Idea';
}
// Para guardar: el texto que se escribe en `status` (siempre uno de los nuevos).
export const estadoParaGuardar = (s) => estadoDe(String(s ?? ''));

// ---------- El nombre automático: «Marca – Formato – Tema» ----------
const limpio = (s) => String(s ?? '').replace(/\s+/g, ' ').replace(/\s*[–—]\s*/g, ' - ').trim();
export function nombreAuto(marca, formato, tema) {
  return [marca, formato, tema].map(limpio).filter(Boolean).join(' – ');
}
// El nombre de la marca de un perfil de contenido, cuando no se tiene a mano el nombre real.
export const marcaDe = (slug, nombres = {}) => nombres[slug] || (slug === 'inherent' ? 'Inherent' : slug === 'personal' ? 'Mi marca' : String(slug || '').toUpperCase());
// El nombre que se muestra de un elemento: el guardado o el automático.
export const nombreDe = (x, marca) => x?.name || nombreAuto(marca ?? marcaDe(x?.profile), x?.format, x?.title);

// ---------- El archivo: lo Publicado hace más de 30 días o marcado «Archivado» ----------
export const ARCHIVO_DIAS = 30;
const DIA = 864e5;
const isoDia = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d || '').slice(0, 10));
// La fecha en que salió: la que se marcó al publicarlo; si no hay, la fecha programada.
export const fechaPublicado = (x) => isoDia(x?.published_at || x?.date || '');
export function archivado(x, hoy = new Date()) {
  const e = estadoDe(x);
  if (e === ARCHIVADO) return true;
  if (e !== 'Publicado') return false;
  const d = fechaPublicado(x); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  return (Date.parse(isoDia(hoy) + 'T12:00:00Z') - Date.parse(d + 'T12:00:00Z')) / DIA > ARCHIVO_DIAS;
}
// Separa una lista en lo que se ve normalmente y lo que va al Archivo.
export function separar(list, hoy = new Date()) {
  const vivos = [], archivo = [];
  for (const x of list || []) (archivado(x, hoy) ? archivo : vivos).push(x);
  return { vivos, archivo };
}
// Al cambiar de estado: Publicado deja su fecha de salida (una vez); salir de Publicado la quita.
export function conEstado(x, estado, hoy = new Date()) {
  const s = estadoParaGuardar(estado), out = { ...x, status: s };
  if (s === 'Publicado') out.published_at = x?.published_at || isoDia(hoy);
  else if (s !== ARCHIVADO) delete out.published_at;
  if (s !== 'En proceso') delete out.por_aprobar; // «Por aprobar» solo vale mientras la pieza sigue «En proceso»
  return out;
}
