// Pruebas de Ventas › Meta: la cascada de la meta, lo estancado y lo que llevamos.
// npm run test:ventas
import assert from 'node:assert/strict';
import { cascada, estancado, sinSiguiente, llevamos, pronostico, ganadoEn, tasasReales } from '../public/js/ventas-meta.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const now = Date.parse('2026-10-21T12:00:00Z');

t('La cascada va de la meta para atrás', () => {
  assert.deepEqual(cascada(60000, { ticket: 12000, cierre: 0.28, aPropuesta: 0.5, aConversacion: 0.5, respuesta: 0.2 }), { ventas: 5, propuestas: 18, conversaciones: 36, leads: 72, outreach: 360 });
  assert.equal(cascada(60000, {}), null);
});
t('Un trato sin tocar pasa a estancado según su etapa', () => {
  const l = { stage: 'Propuesta', activity: [{ at: '2026-10-10T12:00:00Z' }] };
  assert.equal(estancado(l, now), 11);
  assert.equal(estancado({ ...l, stage: 'Ganado' }, now), 0);
  assert.equal(sinSiguiente({ stage: 'Reunión' }), true);
});
t('Lo ganado del mes y el volumen salen del historial', () => {
  const leads = [
    { id: 'a', stage: 'Ganado', value_usd: 800, activity: [{ at: '2026-10-05T12:00:00Z', text: 'Etapa: Propuesta → Ganado' }] },
    { id: 'b', stage: 'Prospecto', activity: [{ at: '2026-10-20T12:00:00Z', kind: 'outreach' }, { at: '2026-10-21T09:00:00Z', kind: 'outreach' }] },
  ];
  const y = llevamos(leads, '2026-10', now);
  assert.equal(y.ventas, 1); assert.equal(y.ganado, 800); assert.equal(y.outreach, 2); assert.equal(y.semana.outreach, 2);
  assert.equal(ganadoEn(leads[1]), null);
});
t('El pronóstico pondera por la probabilidad de la etapa', () => {
  assert.equal(pronostico([{ stage: 'Propuesta', value_usd: 1000 }, { stage: 'Nuevo', value_usd: 1000 }, { stage: 'Perdido', value_usd: 1000 }]), 700);
});
t('Sin suficientes propuestas, el cierre real queda vacío', () => {
  assert.equal(tasasReales([{ stage: 'Ganado', value_usd: 500 }], now).cierre, null);
});
console.log(`\n${ok} pruebas pasaron`);
// Buscar leads: cada resultado de Apify se vuelve un prospecto y no se repite.
const { prospecto, llave } = await import('../api/_lib/buscar.js');
t('Un lugar de Google Maps se vuelve prospecto con sus datos', () => {
  const p = prospecto('maps', { title: 'Café Altura', phone: '+502 5555 1234', website: 'https://cafealtura.gt', categoryName: 'Cafetería', totalScore: 4.6, reviewsCount: 320, address: 'Zona 10' });
  assert.equal(p.name, 'Café Altura'); assert.match(p.notes, /4\.6★ \(320 reseñas\)/); assert.ok(llave(p).includes('55551234'));
});
t('Una cuenta de Instagram se vuelve prospecto', () => {
  const p = prospecto('instagram', { username: 'cafealtura', fullName: 'Café Altura', followersCount: 1200, biography: 'Café de especialidad' });
  assert.equal(p.ig, 'cafealtura'); assert.match(p.notes, /1200 seguidores/);
});
console.log(`${ok} pruebas pasaron en total`);
