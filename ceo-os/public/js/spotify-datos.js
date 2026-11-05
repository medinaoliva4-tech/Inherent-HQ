// Lo que el OS necesita saber de Spotify, sin pantalla ni red.
// La portada pasa por nuestro servidor: así no depende de la red de cada equipo. Solo fotos de Spotify.
export const fotoPermitida = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && /(^|\.)(scdn\.co|spotifycdn\.com)$/.test(x.hostname); } catch { return false; } };
export const rutaPortada = (u) => (fotoPermitida(u) ? `/api/spotify/portada?u=${encodeURIComponent(u)}` : '');
export const leerEquipos = (j) => (j?.devices || []).filter((d) => d.id && !d.is_restricted).map((d) => ({ id: d.id, nombre: d.name || 'Equipo', tipo: d.type || '', activo: Boolean(d.is_active) }));
export const idEquipo = (v) => (/^[\w-]{1,80}$/.test(String(v || '')) ? String(v) : '');
// A qué equipo mandar la música: el activo, si no una compu, y al final cualquiera disponible.
export function elegirEquipo(lista = []) {
  const xs = lista.filter((d) => d.id && !d.is_restricted);
  return xs.find((d) => d.is_active) || xs.find((d) => d.type === 'Computer') || xs[0] || null;
}
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
  const base = { sonando: false, titulo: '', artista: '', portada: '', dispositivo: dev?.name || '', activo: Boolean(dev?.is_active), progreso: 0, duracion: 0, volumen };
  if (!t) return base;
  const fotos = t.album?.images || t.images || [];
  return { ...base, sonando: Boolean(j.is_playing), titulo: t.name || '', artista: (t.artists || []).map((a) => a.name).join(', ') || t.show?.name || '', portada: fotos[1]?.url || fotos[0]?.url || '', enlace: t.external_urls?.spotify || '', progreso: j.progress_ms || 0, duracion: t.duration_ms || 0 };
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
