// Los 3 niveles de Inherent — un solo lugar. Los datos guardados (leads, clientes, paquetes, fichas) pueden traer
// nombres o ids del esquema anterior; aquí se traducen al nivel nuevo. El id viejo sigue funcionando: nada se migra.
export const LEVELS = [
  { id: 'foundation', name: 'Brand Foundation', tag: 'creamos la marca cool', who: 'Marca nueva, reposicionamiento u oferta poco clara.', how: 'Proyecto con inicio y cierre.' },
  { id: 'growth', name: 'Brand Growth', tag: 'hacemos más cool la marca que ya está', who: 'Marca con oferta que necesita crear demanda y mejorar cómo se presenta y promociona.', how: 'Colaboración mensual.' },
  { id: 'partnership', name: 'Growth Partnership', tag: 'nos metemos full', who: 'Empresa que necesita conectar marca y marketing con ventas, experiencia de cliente y sistemas comerciales.', how: 'Colaboración integrada.' },
];
export const LEVEL_NAMES = LEVELS.map((l) => l.name);
// Nombre o id viejo → id del nivel nuevo. Orden importa: lo más específico primero.
const LEGACY = [
  [/brand\s*foundation|foundation/i, 'foundation'],
  [/growth\s*partnership|partnership|accelerate|compound/i, 'partnership'],
  [/brand\s*growth|marketing\s*pro|mkt\s*pro|marketing_pro|^pro$|^marketing$|\bmarketing\b/i, 'growth'],
];
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^[^\p{L}]+/u, '').trim();
// Devuelve el nivel ({id,name,…}) de un texto o id, viejo o nuevo; null si no corresponde a ninguno (Tailor Made, «No sé todavía», vacío).
export function levelOf(text) {
  const t = norm(text); if (!t) return null;
  const hit = LEGACY.find(([re]) => re.test(t)); return hit ? LEVELS.find((l) => l.id === hit[1]) : null;
}
export const levelName = (text) => levelOf(text)?.name || String(text ?? '');
export const sameLevel = (a, b) => { const x = levelOf(a), y = levelOf(b); return x && y ? x.id === y.id : String(a ?? '').trim() === String(b ?? '').trim(); };
// ¿El cliente está en el nivel Growth Partnership? (antes Accelerate y Compound; también la línea «Growth» de la ficha.)
export const isPartnership = (plan, linea = '') => levelOf(plan)?.id === 'partnership' || /^🟨/u.test(String(linea || ''));
