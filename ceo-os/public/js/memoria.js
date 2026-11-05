// Memoria y mejora (PLAN-GATEWAY §21): lo que el equipo corrige se vuelve regla del agente solo si alguien la aprueba. Puro.
export const MAX_REGLAS = 12, MAX_REGLA = 240;
const corto = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const CORRECCION = new Set(['ajuste', 'corregir']), GENERICA = 'Resultado corregido a mano';
// Los ajustes y correcciones escritos en los trabajos de un agente, de lo más nuevo a lo más viejo.
export function correccionesDe(runs = []) {
  const xs = [];
  for (const r of runs) for (const h of r.historial || []) {
    if (!CORRECCION.has(h.accion) || !h.nota || h.nota === GENERICA) continue;
    xs.push({ nota: corto(h.nota, 400), etapa: r.etapas?.[h.etapa]?.nombre || '', at: h.at || '', cliente: r.cliente_nombre || r.cliente || '' });
  }
  return xs.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
export function agregarRegla(reglas = [], texto, por, at) {
  const t = corto(texto, MAX_REGLA);
  if (!t) return { error: 'Escribe la regla' };
  if (reglas.length >= MAX_REGLAS) return { error: `Máximo ${MAX_REGLAS} reglas: quita una primero` };
  if (reglas.some((r) => r.texto.toLowerCase() === t.toLowerCase())) return { error: 'Esa regla ya existe' };
  return { reglas: [...reglas, { texto: t, por, at }] };
}
export const bloqueReglas = (reglas = []) => (reglas.length ? `\n\nREGLAS DE ESTE AGENTE (aprobadas por el equipo a partir de correcciones reales; síguelas):\n${reglas.slice(0, MAX_REGLAS).map((r) => `- ${corto(r.texto, MAX_REGLA)}`).join('\n')}` : '');
