// Los 3 niveles de Inherent — un solo lugar. Los datos guardados (leads, clientes, paquetes, fichas) pueden traer
// nombres o ids del esquema anterior; aquí se traducen al nivel nuevo. El id viejo sigue funcionando: nada se migra.
export const LEVELS = [
  { id: 'foundation', name: 'Brand Foundation', tag: 'creamos la marca cool', who: 'Marca nueva, reposicionamiento u oferta poco clara.', how: 'Proyecto con inicio y cierre.' },
  { id: 'growth', name: 'Brand Growth', tag: 'hacemos más cool la marca que ya está', who: 'Marca con oferta que necesita crear demanda y mejorar cómo se presenta y promociona.', how: 'Colaboración mensual.' },
  { id: 'partnership', name: 'Growth Partnership', tag: 'nos metemos full', who: 'Empresa que necesita conectar marca y marketing con ventas, experiencia de cliente y sistemas comerciales.', how: 'Colaboración integrada.' },
];
export const LEVEL_NAMES = LEVELS.map((l) => l.name);
// El baseline de cada nivel (inherent/CLAUDE.md → «La economía»): el piso interno desde el que se cotiza. Solo lo ve el CEO; nunca sale en la web.
export const BASELINE = { foundation: { usd: 1200, gtq: 9240, per: 'por proyecto' }, growth: { usd: 2400, gtq: 18480, per: 'al mes' }, partnership: { usd: 4200, gtq: 32340, per: 'al mes' } };
// Nombre o id viejo → id del nivel nuevo. Orden importa: lo más específico primero.
const LEGACY = [
  [/brand\s*foundation|foundation/i, 'foundation'],
  [/growth\s*partnership|partnership|accelerate|compound/i, 'partnership'],
  [/brand\s*growth|marketing\s*pro|mkt\s*pro|marketing_pro|^pro$|^marketing$|\bmarketing\b/i, 'growth'],
];
// Lo editable de cada nivel (settings «levels», solo el CEO escribe; Servicios → Paquetes → lápiz). Lo de arriba es el valor
// por defecto: lo que el CEO cambia se aplica encima, en el mismo objeto, así todo lo que usa levelName/BASELINE lo refleja.
// El quiz público (/diagnostico) usa LEVEL_NAMES, que se queda fijo.
export const LEVELS_ID = 'levels';
export const USD_GTQ = 7.7;
const DEFAULTS = JSON.parse(JSON.stringify({ levels: LEVELS, base: BASELINE }));
export const levelDefaults = (id) => { const l = DEFAULTS.levels.find((x) => x.id === id), b = DEFAULTS.base[id]; return l ? { ...l, usd: b?.usd ?? null, per: b?.per || '' } : null; };
// doc: { id: 'levels', levels: { <id>: { name, tag, who, how, usd, per } } }. Sin doc (o sin un campo), vuelve al defecto.
export function applyLevels(doc) {
  const cfg = doc && typeof doc.levels === 'object' ? doc.levels : {};
  for (const l of LEVELS) {
    const d = DEFAULTS.levels.find((x) => x.id === l.id), c = cfg[l.id] || {}, b0 = DEFAULTS.base[l.id];
    for (const k of ['name', 'tag', 'who', 'how']) l[k] = String(c[k] || '').trim() || d[k];
    const usd = Number.isFinite(+c.usd) && +c.usd > 0 && c.usd !== '' && c.usd != null ? Math.round(+c.usd) : b0.usd;
    BASELINE[l.id] = { usd, gtq: Math.round(usd * USD_GTQ), per: String(c.per || '').trim() || b0.per };
  }
  return LEVELS;
}
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^[^\p{L}]+/u, '').trim();
// Devuelve el nivel ({id,name,…}) de un texto o id, viejo o nuevo; null si no corresponde a ninguno (Tailor Made, «No sé todavía», vacío).
export function levelOf(text) {
  const t = norm(text); if (!t) return null;
  // El nombre que el CEO le puso (si lo cambió) también cuenta.
  const own = LEVELS.find((l) => norm(l.name).toLowerCase() === t.toLowerCase()); if (own) return own;
  const hit = LEGACY.find(([re]) => re.test(t)); return hit ? LEVELS.find((l) => l.id === hit[1]) : null;
}
export const levelName = (text) => levelOf(text)?.name || String(text ?? '');
export const sameLevel = (a, b) => { const x = levelOf(a), y = levelOf(b); return x && y ? x.id === y.id : String(a ?? '').trim() === String(b ?? '').trim(); };
// ¿El cliente está en el nivel Growth Partnership? (antes Accelerate y Compound; también la línea «Growth» de la ficha.)
export const isPartnership = (plan, linea = '') => levelOf(plan)?.id === 'partnership' || /^🟨/u.test(String(linea || ''));
