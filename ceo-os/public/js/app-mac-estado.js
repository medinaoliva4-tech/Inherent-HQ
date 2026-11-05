// ¿Hay una versión más nueva de la app de Mac? Puro, sin pantalla.
const partes = (v) => String(v || '').split('.').map(Number);
export function estadoApp(instalada, ultima) {
  if (!ultima?.version) return 'aldia';
  const a = partes(ultima.version), b = partes(instalada);
  for (let i = 0; i < 3; i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0) ? 'nueva' : 'aldia';
  return 'aldia';
}
