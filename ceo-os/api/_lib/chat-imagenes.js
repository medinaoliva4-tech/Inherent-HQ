import * as db from './db.js';
import { MAX_IMAGENES, MAX_IMAGEN_BYTES, MAX_LADO } from '../../public/js/chat-imagenes.js';
export const IMAGENES = 'chat_imagenes';
// Las dimensiones se leen del JPEG, no de campos controlados por el navegador.
export function validarImagen(x) {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(x?.data || '');
  if (!m || m[1].length > Math.ceil(MAX_IMAGEN_BYTES / 3) * 4) throw new Error('La imagen no es un JPEG válido o supera 180 KB.');
  const b = Buffer.from(m[1], 'base64'); let w = 0, h = 0;
  if (b[0] !== 255 || b[1] !== 216 || b.at(-2) !== 255 || b.at(-1) !== 217) throw new Error('La imagen está dañada.');
  for (let i = 2; i + 4 < b.length;) {
    if (b[i] !== 255) break;
    const marker = b[i + 1], len = b.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > b.length) break;
    if ([192, 193, 194].includes(marker) && len >= 8) { h = b.readUInt16BE(i + 5); w = b.readUInt16BE(i + 7); break; }
    i += 2 + len;
  }
  if (!w || !h || w > MAX_LADO || h > MAX_LADO) throw new Error('La imagen debe medir hasta 1280 píxeles por lado.');
  return { nombre: String(x.nombre || 'imagen.jpg').slice(0, 120), data: x.data, width: w, height: h };
}
export function validarImagenes(xs) {
  if (xs === undefined) return [];
  if (!Array.isArray(xs) || xs.length > MAX_IMAGENES) throw new Error('Máximo dos imágenes por mensaje.');
  return xs.map(validarImagen);
}
export async function guardarImagenes(xs, owner, sesion) {
  const ids = [];
  try {
    for (const x of xs) { const id = db.newId(); ids.push(id); await db.create(IMAGENES, { ...x, owner, sesion }, owner, id); }
    return xs.map((x, i) => ({ id: ids[i], nombre: x.nombre, width: x.width, height: x.height }));
  } catch (e) { await Promise.all(ids.map((id) => db.remove(IMAGENES, id, owner).catch(() => {}))); throw e; }
}
export async function cargarImagen(s, id) {
  if (!(s.mensajes || []).some((m) => (m.imagenes || []).some((x) => x.id === id))) return null;
  const x = await db.get(IMAGENES, id);
  return x && x.owner === s.owner ? x : null;
}
