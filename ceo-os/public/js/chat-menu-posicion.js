// Medidas del menú dentro del rectángulo visible (también con teclado virtual).
export function espacioMenu(anchor, frame, viewport, ancho = 300) {
  const borde = 8;
  const top = Math.max(frame.top, viewport.top) + borde;
  const bottom = Math.min(frame.bottom, viewport.bottom) - borde;
  const left = Math.max(frame.left, viewport.left) + borde;
  const right = Math.min(frame.right, viewport.right) - borde;
  const width = Math.max(0, Math.min(ancho, right - left));
  const arriba = Math.max(0, anchor.top - borde - top);
  const abajo = Math.max(0, bottom - anchor.bottom - borde);
  const sobre = arriba >= Math.min(320, abajo);
  const maxHeight = Math.max(0, Math.min(420, sobre ? arriba : abajo));
  return { left: Math.max(left, Math.min(anchor.left, right - width)) - frame.left,
    top: (sobre ? anchor.top - borde - maxHeight : anchor.bottom + borde) - frame.top,
    width, maxHeight, sobre };
}
