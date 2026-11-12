// Comparaciones humanas entre piezas de un mismo entregable. Elo ordena preferencias;
// no estima el efecto causal de publicar una pieza ni sustituye sus métricas.
export const RATING_INICIAL = 1500;
export const K = 24;
export const MAX_COMPARACIONES = 120;

export const probabilidad = (a, b) => 1 / (1 + 10 ** ((b - a) / 400));

export function actualizar(a, b, resultado) {
  const s = resultado === 'a' ? 1 : resultado === 'b' ? 0 : resultado === 'empate' ? 0.5 : null;
  if (s === null) return [a, b];
  const delta = K * (s - probabilidad(a, b));
  return [a + delta, b - delta];
}

export function limpiarComparaciones(piezas, eventos) {
  const ids = new Set((Array.isArray(piezas) ? piezas : []).map((p) => p?.id).filter(Boolean));
  const vistos = new Set();
  return (Array.isArray(eventos) ? eventos : []).filter((e) => e && typeof e === 'object').map((e) => ({
    id: String(e.id ?? '').slice(0, 80), a: String(e.a ?? '').slice(0, 60), b: String(e.b ?? '').slice(0, 60),
    resultado: e.resultado, fecha: String(e.fecha ?? '').slice(0, 30), nota: String(e.nota ?? '').slice(0, 240),
  })).filter((e) => e.id && !vistos.has(e.id) && vistos.add(e.id) && ids.has(e.a) && ids.has(e.b) && e.a !== e.b && ['a', 'b', 'empate'].includes(e.resultado)).slice(-MAX_COMPARACIONES);
}

export function clasificar(piezas, eventos) {
  const ps = (Array.isArray(piezas) ? piezas : []).filter((p) => p?.id);
  const validos = limpiarComparaciones(ps, eventos);
  const mapa = new Map(ps.map((p) => [p.id, { id: p.id, titulo: p.titulo || p.id, rating: RATING_INICIAL, n: 0, ganadas: 0 }]));
  for (const e of validos) {
    const a = mapa.get(e.a), b = mapa.get(e.b);
    [a.rating, b.rating] = actualizar(a.rating, b.rating, e.resultado);
    a.n++; b.n++;
    if (e.resultado === 'a') a.ganadas++;
    if (e.resultado === 'b') b.ganadas++;
  }
  return [...mapa.values()].map((x) => ({ ...x, rating: Math.round(x.rating), provisional: x.n < 5 }))
    .sort((a, b) => b.rating - a.rating || b.n - a.n || a.titulo.localeCompare(b.titulo));
}

// Elegir pares poco vistos evita repetir siempre el supuesto favorito. No es un bandit:
// todavía no hay recompensa observada ni asignación aleatoria de exposición.
export function siguientePar(piezas, eventos) {
  const lista = clasificar(piezas, eventos), validos = limpiarComparaciones(piezas, eventos);
  if (lista.length < 2) return null;
  const pares = [];
  for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) {
    const a = lista[i], b = lista[j], n = validos.filter((e) => (e.a === a.id && e.b === b.id) || (e.a === b.id && e.b === a.id)).length;
    pares.push({ a, b, n, total: a.n + b.n, distancia: Math.abs(a.rating - b.rating) });
  }
  pares.sort((x, y) => x.n - y.n || x.total - y.total || x.distancia - y.distancia || x.a.id.localeCompare(y.a.id) || x.b.id.localeCompare(y.b.id));
  return pares[0];
}

// Beta(1,1) por par: resume cuánto sabemos de la preferencia A sobre B.
// No se usa como probabilidad de rendimiento real ni para comparar pares distintos.
export function evidenciaPar(a, b, eventos) {
  let favor = 0, contra = 0;
  for (const e of Array.isArray(eventos) ? eventos : []) {
    if (e.a !== a && e.b !== a || e.a !== b && e.b !== b) continue;
    if (e.resultado === 'empate') { favor += 0.5; contra += 0.5; }
    else if ((e.resultado === 'a' && e.a === a) || (e.resultado === 'b' && e.b === a)) favor++;
    else contra++;
  }
  const alpha = 1 + favor, beta = 1 + contra;
  return { n: favor + contra, media: alpha / (alpha + beta), varianza: alpha * beta / ((alpha + beta) ** 2 * (alpha + beta + 1)) };
}
