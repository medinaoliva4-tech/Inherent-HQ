// Lo que el OS necesita saber de Spotify, sin pantalla ni red.
const FIJAS = { play: ['PUT', 'play'], pause: ['PUT', 'pause'], next: ['POST', 'next'], previous: ['POST', 'previous'] };
const entero = (v) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? n : null; };
// Devuelve [método, ruta] o null si la acción no es válida.
export function rutaAccion(accion, valor) {
  if (Object.hasOwn(FIJAS, accion)) return FIJAS[accion];
  const n = entero(valor); if (n === null) return null;
  if (accion === 'volumen') return ['PUT', `volume?volume_percent=${Math.min(100, Math.max(0, n))}`];
  if (accion === 'buscar') return ['PUT', `seek?position_ms=${Math.max(0, n)}`];
  return null;
}
export const leerReproduccion = (j) => {
  const t = j?.item, dev = j?.device, volumen = dev?.supports_volume === false ? null : dev?.volume_percent ?? null;
  const base = { sonando: false, titulo: '', artista: '', portada: '', dispositivo: dev?.name || '', progreso: 0, duracion: 0, volumen };
  if (!t) return base;
  const fotos = t.album?.images || t.images || [];
  return { ...base, sonando: Boolean(j.is_playing), titulo: t.name || '', artista: (t.artists || []).map((a) => a.name).join(', ') || t.show?.name || '', portada: fotos[1]?.url || fotos[0]?.url || '', progreso: j.progress_ms || 0, duracion: t.duration_ms || 0 };
};
// El motivo real de Spotify, en palabras de persona. Sin esto todo parecía una falla nuestra.
export function motivoSpotify(status, razon) {
  if (razon === 'PREMIUM_REQUIRED') return 'Spotify pide Premium para controlar la música.';
  if (status === 404 || razon === 'NO_ACTIVE_DEVICE') return 'Abre Spotify en algún equipo y dale play una vez.';
  if (status === 401) return 'Vuelve a conectar Spotify.';
  if (status === 403) return 'Spotify no permite eso con lo que está sonando.';
  if (status === 429) return 'Spotify pidió esperar un momento.';
  return 'Spotify no respondió. Intenta otra vez.';
}
export const tiempo = (ms) => { const s = Math.floor((ms || 0) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
