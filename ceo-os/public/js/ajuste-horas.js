import { pricesOf } from './cycle.js';

// Devuelve tres servicios a las horas que tenían antes de la restauración (las que el CEO había puesto):
//   Agente de WhatsApp con IA         6 h nivel 5 · 18 h nivel 10  (Q2,000 → Q7,450)
//   Landing de conversión             5 h nivel 5 · 44 h nivel 10  (Q1,650 → Q18,150)
//   Sistema mensual de contenido corto 6 h nivel 5 · 16 h nivel 10 (Q2,000 → Q6,600)
// El reparto por rol no se guardó: se escala el original y se edita después en cada servicio. Solo cambia las horas.
const T = (role, hours, hours10) => ({ role, hours, hours10 });
const AJUSTES = {
  mv13anz199ee3e15: [T('Estrategia', 1, 3), T('Dev / Tech', 4, 12), T('Operador', 1, 3)],
  mv13aobkc03abfbf: [T('Diseño', 2, 20), T('Dev / Tech', 3, 24)],
  mv64o53r10307f83: [T('Estrategia', 1, 4), T('Producción', 1, 3), T('Edición', 2, 5), T('Diseño', 1, 2), T('Operador', 1, 2)],
};

export async function ajustarHoras(S, services, rates = null) {
  let out = [...services], n = 0; const faltan = [];
  for (const [id, tasks] of Object.entries(AJUSTES)) {
    const sv = out.find((x) => x.id === id);
    if (!sv) { faltan.push(id); continue; }
    const doc = { ...sv, tasks: tasks.map((t) => ({ ...t })), level: sv.level || 5, price_fixed: null };
    const prices = rates ? pricesOf(doc, rates) : null;
    if (prices) { doc.prices = prices; doc.price = prices[doc.level]; }
    const saved = await S.save(doc); out = out.map((x) => (x.id === id ? saved : x)); n++;
  }
  return { n, faltan, services: out };
}
