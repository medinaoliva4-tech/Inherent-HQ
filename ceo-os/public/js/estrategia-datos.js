// Strategy por cliente: la distancia a la meta, lo que haría falta para llegar y lo que dice el comprador con sus palabras. Puro.
export const TIPOS_VOZ = ['Dolor', 'Deseo', 'Objeción', 'Por qué compró'];
const num = (v) => { const n = Number(String(v ?? '').replace(/[^\d.]/g, '')); return Number.isFinite(n) ? n : 0; };
const txt = (v, n = 160) => String(v ?? '').trim().slice(0, n);
export function limpiarEstrategia(b = {}) {
  return {
    client_slug: txt(b.client_slug, 80), meta: num(b.meta), actual: num(b.actual), ticket: num(b.ticket), leads: num(b.leads), cierre_pct: Math.min(100, num(b.cierre_pct)), fecha: /^\d{4}-\d{2}-\d{2}$/.test(b.fecha || '') ? b.fecha : '',
    pasos: (Array.isArray(b.pasos) ? b.pasos : []).slice(0, 3).map((p) => ({ texto: txt(p?.texto), hecho: Boolean(p?.hecho) })).filter((p) => p.texto),
    voces: (Array.isArray(b.voces) ? b.voces : []).slice(0, 200).map((v) => ({ frase: txt(v?.frase, 400), tipo: TIPOS_VOZ.includes(v?.tipo) ? v.tipo : TIPOS_VOZ[0], tema: txt(v?.tema, 40), fuente: txt(v?.fuente, 80) })).filter((v) => v.frase),
  };
}
// Para llegar moviendo una sola palanca. Ventas es lo que falta en clientes; si una palanca exige más de 100% de cierre, no alcanza sola.
export function analizarMeta(d) {
  const { meta, actual, ticket, leads, cierre_pct } = d;
  const falta = Math.max(0, meta - actual), avance = meta > 0 ? Math.min(1, actual / meta) : 0;
  const cierre = cierre_pct / 100, ventas = ticket > 0 ? actual / ticket : 0, ventasMeta = ticket > 0 ? Math.ceil(meta / ticket) : 0;
  const listo = meta > 0 && actual > 0 && ticket > 0 && leads > 0 && cierre > 0;
  if (!listo) return { falta, avance, ventas, ventasMeta, listo, palancas: [] };
  const factor = meta / actual, cierreNuevo = cierre * factor;
  const palancas = falta ? [
    { nombre: 'Más leads', de: leads, a: Math.ceil(leads * factor), unidad: 'n', posible: true },
    { nombre: 'Mejor cierre', de: cierre, a: cierreNuevo, unidad: 'pct', posible: cierreNuevo <= 1 },
    { nombre: 'Ticket más alto', de: ticket, a: Math.ceil(ticket * factor), unidad: 'q', posible: true },
  ] : [];
  return { falta, avance, ventas, ventasMeta, listo, palancas };
}
export function resumenVoces(voces) {
  const porTipo = Object.fromEntries(TIPOS_VOZ.map((t) => [t, voces.filter((v) => v.tipo === t).length]));
  const cuenta = new Map();
  for (const v of voces) { const k = v.tema.toLowerCase(); if (k) cuenta.set(k, { tema: cuenta.get(k)?.tema || v.tema, n: (cuenta.get(k)?.n || 0) + 1 }); }
  return { porTipo, temas: [...cuenta.values()].sort((a, b) => b.n - a.n).slice(0, 5) };
}
