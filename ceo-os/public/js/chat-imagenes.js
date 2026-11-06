// Entrada acotada: JPEG comprimido por el navegador, sin URLs remotas ni SVG.
export const MAX_IMAGENES = 2, MAX_IMAGEN_BYTES = 180000, MAX_LADO = 1280;
export const esImagen = (f) => /^image\/(png|jpeg|webp)$/.test(f?.type || '') || /\.(png|jpe?g|webp)$/i.test(f?.name || '');
export async function prepararImagen(file) {
  if (file.size > 12 * 1024 * 1024) throw new Error('La imagen supera 12 MB. Reduce su tamaño.');
  const bitmap = await createImageBitmap(file);
  try {
    const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * escala)); canvas.height = Math.max(1, Math.round(bitmap.height * escala));
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let data;
    for (const calidad of [.88, .75, .6, .45]) { data = canvas.toDataURL('image/jpeg', calidad); if ((data.length - 23) * .75 <= MAX_IMAGEN_BYTES) break; }
    if ((data.length - 23) * .75 > MAX_IMAGEN_BYTES) throw new Error('La imagen sigue siendo muy grande. Recórtala o divide la captura.');
    return { nombre: String(file.name || 'imagen.jpg').slice(0, 120), data };
  } finally { bitmap.close(); }
}
export const urlImagen = (sesion, imagen) => imagen.data || `/api/chat/sesiones/${encodeURIComponent(sesion)}/imagenes/${encodeURIComponent(imagen.id)}`;
