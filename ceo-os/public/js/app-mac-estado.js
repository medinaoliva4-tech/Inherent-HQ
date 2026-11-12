// ¿Hay algo nuevo que ofrecer? Puro, sin pantalla. Dos casos: la app de Mac (versión + número de armado) y el OS web (despliegue).
const partes = (v) => String(v || '').split('.').map(Number);
// instalada: «0.1.11» · build: el número de armado de la app instalada (0 o nada = app sin dato: se trata como más vieja)
// ultima: lo que responde escritorio/version ({ version, n }). Compara major.minor.patch y, si empatan, el número de armado.
export function estadoApp(instalada, ultima, build) {
  if (!ultima?.version) return 'aldia';
  const a = partes(ultima.version), b = partes(instalada);
  for (let i = 0; i < 3; i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0) ? 'nueva' : 'aldia';
  return Number(ultima.n || 0) > Number(build || 0) ? 'nueva' : 'aldia';
}
export const nombreVersion = (u) => (u?.n ? `${u.version} (${u.n})` : String(u?.version || ''));

// Cambios web: el id del despliegue que se vio al abrir contra el que responde el servidor ahora. Sin id de alguno de los dos
// (servidor local, ruta caída) no se avisa de nada.
export const hayCambiosWeb = (inicial, actual) => Boolean(inicial && actual && inicial !== actual);

export const MAS_TARDE_MS = 6 * 3600_000;
// Qué panel toca mostrar. La app de Mac manda sobre el aviso web (al actualizar, la app vuelve a abrir con lo último).
// silencioHasta: la hora hasta la que «Más tarde» lo tiene callado (0 = no lo pidió).
export function panelActual({ enApp, instalada, build, ultima, inicialWeb, actualWeb, silencioHasta = 0, ahora = Date.now() }) {
  if (ahora < silencioHasta) return null;
  if (enApp && estadoApp(instalada, ultima, build) === 'nueva') return 'app';
  if (hayCambiosWeb(inicialWeb, actualWeb)) return 'web';
  return null;
}
