// Las recetas en uso: las de siempre (public/js/recipes.js) reemplazadas por lo que el CEO editó (colección «recipes»).
// Solo el CEO las escribe; el servidor las lee al armar proyectos, activar paquetes y generar lo recurrente.
import * as db from './db.js';
import { recipesWith, cleanRecipe, isDefaultId } from '../../public/js/recipes.js';
const slugify = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

export const load = async () => recipesWith(await db.list('recipes'));
export { cleanRecipe, isDefaultId };

// Guarda una receta (la edita si ya existe, la crea si no). Para las de siempre, el mismo id las reemplaza.
export async function save(u, b = {}) {
  const clean = cleanRecipe(b);
  let id = String(b.id || '').toLowerCase();
  if (!id) { id = slugify(clean.name) || 'receta'; const all = await db.list('recipes'); let n = id, i = 2; while (all.some((r) => r.id === n) || isDefaultId(n)) n = `${id}-${i++}`; id = n; }
  if (!/^[\w.@+-]{3,120}$/.test(id)) throw Object.assign(new Error('El id de la receta no es válido'), { status: 400 });
  const cur = await db.get('recipes', id);
  const d = cur ? await db.update('recipes', id, clean, cur.v, u.email) : await db.create('recipes', clean, u.email, id);
  if (!d) throw Object.assign(new Error('Alguien más cambió esta receta. Vuelve a abrirla.'), { status: 409 });
  return d;
}
// Vuelve a la receta de siempre (o borra una propia).
export async function reset(u, id) { return db.remove('recipes', String(id), u.email); }
