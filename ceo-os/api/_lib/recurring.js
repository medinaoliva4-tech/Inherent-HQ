// Responsabilidades recurrentes de Inherent: cada receta interna activa (semanal, mensual en días X, fecha fija) deja su tarea
// tipo Interna, con su SOP y su fecha, a tiempo para hacerla. Es idempotente: cada vez que toca tiene una clave
// («rec:receta:tarea:periodo») y un id propio, así que correrlo dos veces —al cargar, en el cron, a mano— no duplica nada.
import crypto from 'node:crypto';
import * as db from './db.js';
import * as recipes from './recipes.js';
import { holders, addDays } from '../../public/js/cycle.js';
import { occurrences, titleFor } from '../../public/js/recipes.js';

const AHEAD = 7; // las tareas aparecen hasta 7 días antes de que toquen
const today = () => new Date().toISOString().slice(0, 10);
export const keyOf = (r, row, period) => `rec:${r.id}:${row.key}:${period}`;
export const idOf = (key) => 'rec-' + crypto.createHash('sha1').update(key).digest('hex').slice(0, 20);

export async function run(by = 'sistema', on = today()) {
  const [R, team] = await Promise.all([recipes.load(), db.list('team').then((l) => l.filter((p) => p.role !== 'client' && p.active !== false).map((p) => ({ ...p, email: p.email || p.id })))]);
  const admin = String(process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean)[0];
  const who = holders(team, team.find((p) => p.role === 'ceo')?.email || admin || null);
  const made = []; const to = addDays(on, AHEAD);
  for (const r of R.filter((x) => x.type === 'interna' && x.active !== false && x.repeat)) {
    for (const occ of occurrences(r.repeat, on, to)) for (const row of r.tasks || []) {
      const key = keyOf(r, row, occ.period);
      const data = { title: titleFor(row.title, occ.due), description: row.desc || '', project_id: '', dept: '', role: row.role, assignee: who(row.role) || '', accountable: row.reviewer ? who(row.reviewer) || '' : '', due: occ.due, status: 'Por empezar', tipo: row.tipo || 'Interna',
        ...(row.sop ? { sop: row.sop } : {}), ...(row.hours ? { hours: row.hours } : {}), visibility: 'all', checklist: (row.check || []).map((t) => ({ t, done: false })), comments: [], recurring: key, recipe_id: r.id, assigned_at: new Date().toISOString() };
      try { const t = await db.create('tasks', data, by, idOf(key)); made.push({ id: t.id, titulo: t.title, vence: t.due, persona: t.assignee, receta: r.name }); }
      catch (e) { if (!/duplicate|unique/i.test(e.message)) throw e; } // ya existía: nada que hacer
    }
  }
  if (made.length) console.log(JSON.stringify({ evt: 'recurring', n: made.length, by }));
  return { ok: true, creadas: made.length, tareas: made };
}
