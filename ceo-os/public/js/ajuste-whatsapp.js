import { pricesOf } from './cycle.js';

// Deja el «Agente de WhatsApp con IA» como lo tenía el CEO: 6 h en nivel 5 y 18 h en nivel 10 (Q2,000 → Q7,450).
// El reparto por rol no se guardó: se escala el original (Estrategia · Tech · Operador) y se edita después en el servicio.
const ID = 'mv13anz199ee3e15';
const TAREAS = [{ role: 'Estrategia', hours: 1, hours10: 3 }, { role: 'Dev / Tech', hours: 4, hours10: 12 }, { role: 'Operador', hours: 1, hours10: 3 }];

export async function ajustarWhatsApp(S, services, rates = null) {
  const sv = services.find((x) => x.id === ID);
  if (!sv) throw new Error('No encontré el Agente de WhatsApp');
  const doc = { ...sv, tasks: TAREAS.map((t) => ({ ...t })), level: sv.level || 5, price_fixed: null };
  const prices = rates ? pricesOf(doc, rates) : null;
  if (prices) { doc.prices = prices; doc.price = prices[doc.level]; }
  const saved = await S.save(doc);
  return { saved, services: services.map((x) => (x.id === ID ? saved : x)) };
}
