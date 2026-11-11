// Métricas: engagement relativo a la propia cuenta y ranking de winners. Puro (sin red ni disco).
import { mediana } from './util.mjs';

const DIA = 86_400_000;
const suma = (...xs) => {
  const v = xs.filter((x) => Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) : null;
};
const r3 = (x) => (Number.isFinite(x) ? Math.round(x * 1000) / 1000 : null);

/**
 * Para cada publicación:
 *  - engagement = (likes + comentarios + compartidos) / vistas
 *  - x_cuenta   = alcance / mediana del alcance de SU cuenta (alcance = vistas; si no hay, likes)
 *  - x_engagement = engagement / mediana del engagement de su cuenta
 *  - puntaje    = x_cuenta × √x_engagement  (manda la atención; el engagement afina)
 * Comparar contra la propia cuenta evita que un canal grande gane solo por tamaño.
 */
export function calcularMetricas(posts, { ahora = Date.now(), umbralWinner = 1.5 } = {}) {
  const porCuenta = new Map();
  for (const p of posts) {
    const k = `${p.plataforma}:${p.cuenta}`;
    if (!porCuenta.has(k)) porCuenta.set(k, []);
    porCuenta.get(k).push(p);
  }
  const out = [];
  for (const grupo of porCuenta.values()) {
    const alcance = (p) => p.vistas ?? p.likes ?? null;
    const interacciones = (p) => suma(p.likes, p.comentarios, p.compartidos);
    const eng = (p) => (p.vistas ? (interacciones(p) ?? 0) / p.vistas : null);
    const medAlc = mediana(grupo.map(alcance));
    const medEng = mediana(grupo.map(eng));
    for (const p of grupo) {
      const e = eng(p);
      const xc = medAlc ? alcance(p) / medAlc : null;
      const xe = medEng && e !== null ? e / medEng : null;
      const puntaje = xc === null ? null : xc * Math.sqrt(xe ?? 1);
      const edadDias = p.fecha ? (ahora - Date.parse(p.fecha)) / DIA : null;
      out.push({
        ...p,
        metricas: {
          interacciones: interacciones(p),
          engagement: r3(e),
          x_cuenta: r3(xc),
          x_engagement: r3(xe),
          por_seguidor: p.seguidores && alcance(p) !== null ? r3(alcance(p) / p.seguidores) : null,
          puntaje: r3(puntaje),
          mediana_cuenta: medAlc,
          muestras_cuenta: grupo.length,
          joven: edadDias !== null && edadDias < 3, // métricas aún creciendo
        },
      });
    }
  }
  return rankear(out, umbralWinner);
}

export function rankear(posts, umbralWinner = 1.5) {
  const orden = [...posts].sort((a, b) => (b.metricas.puntaje ?? -1) - (a.metricas.puntaje ?? -1));
  return orden.map((p, i) => ({
    ...p,
    rango: i + 1,
    winner: (p.metricas.puntaje ?? 0) >= umbralWinner && p.metricas.muestras_cuenta >= 3,
  }));
}
