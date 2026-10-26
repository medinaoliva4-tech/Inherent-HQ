// Qué puede leer cada persona de una colección: las mismas reglas para GET db/:coll, el conector, los indicadores y los
// Avisos (una sola definición: si cambia aquí, cambia en todos). Antes vivían repetidas en index.js, mcp.js y results.js.
import * as db from './db.js';
import { COLLS, READ_ALSO, SCOPED, canRead, sees, scoper, inScope, summaryOf, stripAccesos, stripCosts } from './access.js';

const lc = (x) => String(x || '').toLowerCase();
// Tareas: «solo yo» la ven quien la creó y a quien se asignó; «ciertas personas» suma a las elegidas.
// Una tarea «Personal» la ve solo quien la creó (aunque su visibilidad diga «todos»).
export const seesTask = (u, t) => {
  if (t?.tipo === 'Personal') return lc(t._meta?.created_by || t.assignee) === u.email;
  const vis = t?.visibility || 'all'; if (vis === 'all') return true;
  return [t._meta?.created_by, t.assignee, ...(vis === 'people' ? [t.accountable, ...(Array.isArray(t.viewers) ? t.viewers : [])] : [])].filter(Boolean).map(lc).includes(u.email);
};
// La marca personal del CEO es privada: su contenido (Research, planner, calendario, conexiones) solo lo ve él.
export const personalOk = (u, slug) => slug !== 'personal' || u.role === 'ceo';
// Los docs de «sources» (scrape-, refs-, ads-, ideas-…<perfil>) no siempre traen el campo profile: el perfil sale también del id.
export const profOf = (coll, d) => (coll === 'sources' ? d?.profile || String(d?.id || '').replace(/^(cfg|scrape|analytics|ideas|refs|ads)-/, '') : d?.profile);
// El link de la hoja de Finanzas solo lo lee quien ve Finanzas.
// El margen objetivo de las propuestas (settings «pricing», Finanzas → Precios) es costo/margen: solo el CEO.
export const visible = (u, coll, d) => (coll !== 'tasks' || seesTask(u, d)) && (!['content', 'sources'].includes(coll) || personalOk(u, profOf(coll, d))) && (coll !== 'brand_boards' || personalOk(u, String(d?.id || ''))) && (coll !== 'settings' || ((d?.id !== 'finance_sheet' || u.areas.includes('finanzas')) && (d?.id !== 'pricing' || u.role === 'ceo')));
// El alcance (todos · asignados · propio) filtra proyectos, tareas, cuentas de clientes y leads.
export const scopeOf = (u, coll) => (SCOPED.includes(coll) || ['content', 'sources'].includes(coll) ? scoper(u) : null);
// Content y sources llevan el perfil (un cliente, inherent o personal): con alcance «asignados» o «propio» solo entran los de sus clientes.
export const profInScope = (sc, coll, d) => { if (!sc || !['content', 'sources'].includes(coll)) return true; const p = profOf(coll, d); return !p || p === 'inherent' || sc.client(p); };
// Los niveles editables (settings «levels»): los lee todo el equipo, pero el baseline (el piso interno de precio) solo el CEO.
export const levelsFor = (u, d) => (u.role === 'ceo' ? d : { ...d, levels: Object.fromEntries(Object.entries(d.levels || {}).map(([k, l]) => { const { usd, gtq, ...rest } = l || {}; return [k, rest]; })) });
// Lo que sale de un doc según quién lo pide: «resumen» recorta o no entrega (summaryOf) y los accesos de un cliente
// solo llegan a quien los puede ver. null = para esa persona no existe.
export const shape = (u, coll, d, sc, sum = summaryOf(u, coll)) => {
  if (!d) return null;
  if (sum) { d = sum(d); if (!d) return null; }
  return coll === 'accounts' ? stripAccesos(u, d, sc) : coll === 'budgets' ? stripCosts(u, d) : coll === 'settings' && d.id === 'levels' ? levelsFor(u, d) : d;
};
// ¿Puede leer esta colección por la ruta genérica? (el área de la colección o una de las que la leen también)
export const leeColeccion = (u, coll) => Boolean(COLLS[coll]) && canRead(u.role, coll) && [COLLS[coll], ...(READ_ALSO[coll] || [])].some((a) => sees(u, a));
// La colección tal como la recibiría esa persona por GET db/:coll ([] si no la puede leer). pre: listas ya leídas.
export async function leer(u, coll, { pre = null, sc } = {}) {
  if (!leeColeccion(u, coll)) return [];
  const s = sc !== undefined ? sc : await scopeOf(u, coll), sum = summaryOf(u, coll);
  return (pre || (await db.list(coll))).filter((d) => visible(u, coll, d) && inScope(s, coll, d) && profInScope(s, coll, d)).map((d) => shape(u, coll, d, s, sum)).filter(Boolean);
}
