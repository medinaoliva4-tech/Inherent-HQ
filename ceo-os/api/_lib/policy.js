// Qué rutas del repo puede tocar el endpoint genérico /api/file, y de qué área son.
// El manual (inherent/*.md) NUNCA se sirve crudo: solo por los endpoints que lo parsean y filtran.
const DATA = /^ceo-os\/data\/(finanzas|conocimiento|content|sales|strategy|operations)\/[A-Za-z0-9_\-.\/ ]+$/;
const CRM = /^inherent\/administracion\/crm\/(contactos|oportunidades|actividad)\.csv$/;

export function areaOf(path) {
  if (typeof path !== 'string' || path.includes('..') || path.includes('//') || path.length > 200) return null;
  const d = DATA.exec(path);
  if (d) return d[1];
  if (CRM.test(path)) return 'sales';
  return null;
}
