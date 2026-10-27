// La cadena de mando de una tarea (inherent/05-OPERACION.md §2): quién la hace, quién la revisa y a quién le rinde cuentas.
// Puro (sin DOM ni red): lo usan Mis tareas (screens/work.js) y Avisos (avisos-reglas/trabajo.js), para que los dos digan
// exactamente lo mismo. También el OK del CEO a la pauta de un cliente (gate ⑩), que vale para un mes y un presupuesto.

// La clave de una persona del equipo: su correo (o su id, que también es el correo).
export const keyOf = (p) => p?.email || p?.id;

// team: la colección team. yo: la clave de quien mira; si nadie en el equipo es el CEO (sin jefe), cuenta como el CEO.
// → { person, ceoKey, cooKey, bossOf, accOf, chain }
//   bossOf(k): el jefe directo de esa persona (team.reports_to) o null.
//   accOf(t):  quién revisa la tarea: t.accountable; si está vacío, el jefe directo de quien la hace; si no hay, el CEO.
//   chain(t):  quien la hace → quien la revisa → sus jefes, hasta el CEO (máximo 6).
export function cadenaDe(team = [], yo = '') {
  const person = (k) => team.find((p) => p.id === k || p.email === k);
  const ceoKey = keyOf(team.find((p) => !p.reports_to && p.role === 'ceo') || { id: yo });
  const cooKey = keyOf(team.find((p) => (p.roles || []).includes('coo')) || { id: ceoKey });
  const bossOf = (k) => { const p = person(k); const b = p?.reports_to && person(p.reports_to); return b ? keyOf(b) : null; };
  const accOf = (t) => t.accountable || bossOf(t.assignee) || ceoKey;
  const chain = (t) => { const out = [t.assignee || null]; let k = accOf(t); const seen = new Set(out); while (k && !seen.has(k) && out.length < 6) { out.push(k); seen.add(k); k = bossOf(k); } if (!seen.has(ceoKey)) out.push(ceoKey); return out.filter(Boolean); };
  return { person, ceoKey, cooKey, bossOf, accOf, chain };
}

// El OK del CEO a la pauta (accounts «acc-<slug>».ads.ok): vale para ese mes (AAAA-MM) y para ese presupuesto.
// Si cambia el monto o el mes, se vuelve a pedir (gate 2). → el OK vigente o null.
export const okOf = (a, mes) => (a?.ok && a.ok.month === mes && a.ok.budget === (a.budget || null) ? a.ok : null);
