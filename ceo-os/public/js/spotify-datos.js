// Lo que el OS necesita saber de Spotify, sin pantalla ni red.
export const ACCIONES = { play: ['PUT', 'play'], pause: ['PUT', 'pause'], next: ['POST', 'next'], previous: ['POST', 'previous'] };
export const leerReproduccion = (j) => {
  const t = j?.item;
  if (!t) return { sonando: false, titulo: '', artista: '', portada: '', dispositivo: j?.device?.name || '' };
  const fotos = t.album?.images || t.images || [];
  return { sonando: Boolean(j.is_playing), titulo: t.name || '', artista: (t.artists || []).map((a) => a.name).join(', ') || t.show?.name || '', portada: fotos[fotos.length - 1]?.url || '', dispositivo: j.device?.name || '' };
};
