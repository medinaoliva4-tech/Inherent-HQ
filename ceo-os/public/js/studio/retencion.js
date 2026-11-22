// Curva de retención (puro: sin DOM ni red). NO es una animación: es un MODELO de supervivencia calculado segundo a segundo.
//
//   guion / transcripción con tiempos  ──▶  7 características por segundo  ──▶  estímulo s(t) ∈ [0,1]
//   estímulo  ──▶  riesgo de abandono  h(t) = h0(t)·(1 − 0.9·s(t))   con h0(t) = a + b·e^(−t/τ)   (el riesgo es enorme al principio)
//   retención  S(t+1) = S(t)·(1 − h(t))     →  la curva de «quién sigue viendo»
//
// Las 7 características (todas en [0,1], calculables solo con texto + tiempos; los cortes son opcionales):
//   ritmo     palabras por minuto (U invertida alrededor de 160: ni muerto ni atropellado)      cortes    cambios visuales por segundo (U invertida) y tiempo sin cambio
//   emocion   carga emocional (léxico con intensidad, signos, mayúsculas)                       novedad   palabras de contenido que no se habían dicho
//   tension   promesas abiertas: preguntas, «pero…», «ahora vas a ver…» − las que ya se cerraron   directo   le habla a la persona (tú/te/tu)
//   relleno   1 − muletillas («o sea», «básicamente», «eh»)
// Los primeros 3 s pesan por el GANCHO (pregunta, cifra, contraste, curiosidad, brevedad, segunda persona).
//
// HONESTIDAD: el modelo nace con pesos de partida («heurístico, sin calibrar»). Sirve para COMPARAR guiones y ubicar caídas con su razón,
// no para prometer una cifra. `calibrar()` ajusta los pesos con la retención REAL de las plataformas y solo declara «calibrado» si mejora
// FUERA de muestra (validación dejando uno fuera). Sin dato, un número es `null`, nunca 0.

export const MODELO = { version: 'heuristico-1', calibrado: false };
export const CARACTERISTICAS = ['ritmo', 'cortes', 'emocion', 'novedad', 'tension', 'directo', 'relleno'];
export const PESOS_BASE = { ritmo: 0.14, cortes: 0.2, emocion: 0.18, novedad: 0.18, tension: 0.14, directo: 0.1, relleno: 0.06 };
export const RIESGO_BASE = { a: 0.014, b: 0.14, tau: 2.2 }; // h0(t) = a + b·e^(−t/τ)
const MIN_MUESTRAS = 5;
const WPM_IDEAL = 160, WPM_ANCHO = 55, CORTES_IDEAL = 0.35, CORTES_ANCHO = 0.28;

// ---------- Texto ----------
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const limpio = (s) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const palabras = (s) => norm(limpio(s)).match(/[a-zñ0-9]+/g) || [];
const PARADAS = new Set('el la los las un una unos unas de del al a en y o u que se su sus lo le les me mi es son fue ser esta este esto estos estas con por para como mas pero si no ya muy tambien'.split(' '));
const POS = ['increib', 'brutal', 'genial', 'gratis', 'facil', 'rapid', 'secret', 'ganar', 'exit', 'mejor', 'logr', 'dinero', 'crec', 'tripl', 'dupl', 'impresion', 'poder', 'perfect', 'nuev', 'ahorr', 'amor', 'feliz', 'sueno', 'libert'];
const NEG = ['error', 'miedo', 'perd', 'mentir', 'nunca', 'nadie', 'peligr', 'fracas', 'problem', 'culp', 'dolor', 'caro', 'urgent', 'cuidad', 'fall', 'arruin', 'desastr', 'riesg', 'estaf', 'odi', 'tarde', 'basta'];
const FILLERS = [/\bo sea\b/g, /\bbasicamente\b/g, /\beh+\b/g, /\bem+\b/g, /\bcomo que\b/g, /\bbueno\b/g, /\beste\b(?= *,)/g, /\bdigamos\b/g, /\bpues\b(?= *,)/g];
const SEGUNDA = new Set(['tu', 'tus', 'te', 'ti', 'usted', 'ustedes', 'vos', 'tuyo', 'contigo']);
const ABRE = [/\?/, /\bpero\b/, /\bhasta que\b/, /\bahora vas a ver\b/, /\bte voy a (mostrar|contar|decir|explicar)\b/, /\bpor que\b/, /\bel secreto\b/, /\blo que nadie\b/, /\bespera\b/, /\bpero antes\b/, /\b\d+ (cosas|errores|razones|pasos|formas|claves|trucos)\b/];
const CIERRA = [/\bpor eso\b/, /\ben resumen\b/, /\bel resultado\b/, /\basi que\b/, /\bpor lo tanto\b/, /\by eso es todo\b/, /\bresulta que\b/, /\bla respuesta es\b/];
const cuenta = (texto, res) => res.reduce((n, re) => n + (texto.match(re) || []).length, 0);
const intensidad = (w) => (POS.some((p) => w.startsWith(p)) ? 1 : NEG.some((p) => w.startsWith(p)) ? -1 : 0);

// ---------- Del texto a una línea de tiempo ----------
// segmento = { t0, t1, texto, cortes?:[t…] }. Las palabras se reparten parejo dentro de su segmento.
export function lineaDeTiempoDesdeTexto(texto, { wps = 2.7, cortes } = {}) {
  const frases = limpio(texto).split(/(?<=[.!?¿¡…])\s+|\n+|\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
  let t = 0; const segmentos = [];
  for (const f of frases) { const n = Math.max(1, palabras(f).length), d = n / wps; segmentos.push({ t0: t, t1: t + d, texto: f }); t += d; }
  return { segmentos, duracion: t, ...(Array.isArray(cortes) ? { cortes } : {}) };
}
// SRT/VTT → segmentos con tiempos reales.
export function desdeSubtitulos(srt) {
  const seg = [], bloques = String(srt ?? '').replace(/\r/g, '').split(/\n{2,}/);
  const seg2s = (h) => { const m = /(?:(\d+):)?(\d+):(\d+)[.,](\d+)/.exec(h); return m ? (+m[1] || 0) * 3600 + +m[2] * 60 + +m[3] + +m[4] / 10 ** m[4].length : null; };
  for (const b of bloques) { const l = b.split('\n'), i = l.findIndex((x) => x.includes('-->')); if (i < 0) continue; const [a, z] = l[i].split('-->'); const t0 = seg2s(a), t1 = seg2s(z); if (t0 == null || t1 == null || t1 <= t0) continue; seg.push({ t0, t1, texto: limpio(l.slice(i + 1).join(' ')) }); }
  return { segmentos: seg, duracion: seg.length ? seg[seg.length - 1].t1 : 0 };
}

// ---------- El gancho ----------
export function puntuarGancho(texto) {
  const primera = limpio(texto).split(/(?<=[.!?¿¡…])\s+/)[0] || '', n = norm(primera), ws = palabras(primera), fs = [];
  const f = (clave, valor, peso, porQue) => fs.push({ clave, valor, peso, porQue });
  f('pregunta', /\?|¿/.test(primera) ? 1 : 0, 0.2, 'abre con una pregunta');
  f('cifra', /\d/.test(primera) ? 1 : 0, 0.15, 'trae una cifra');
  f('directo', ws.some((w) => SEGUNDA.has(w)) ? 1 : 0, 0.15, 'le habla a la persona');
  f('contraste', /\b(nadie|nunca|error|mentira|deja de|no (hagas|sigas|compres|cometas)|en vez de|sin)\b/.test(n) ? 1 : 0, 0.15, 'plantea un contraste o un error');
  f('curiosidad', /\b(secreto|lo que nadie|por que|la razon|resulta que|lo que pasa|descubri|nunca (te|lo)|asi (es|se))\b/.test(n) ? 1 : 0, 0.2, 'deja una curiosidad abierta');
  f('brevedad', ws.length && ws.length <= 12 ? 1 : ws.length <= 18 ? 0.5 : 0, 0.1, 'es corto');
  f('promesa', /\b(como|aprende|logra|consigue|ahorra|gana|evita)\b/.test(n) ? 1 : 0, 0.05, 'promete un beneficio');
  const puntos = fs.reduce((a, x) => a + x.valor * x.peso, 0);
  return { puntos: Math.round(puntos * 1000) / 1000, razones: fs.filter((x) => x.valor).map((x) => x.porQue), faltan: fs.filter((x) => !x.valor).map((x) => x.clave) };
}

// ---------- Características por segundo ----------
const U = (x, ideal, ancho) => Math.exp(-(((x - ideal) / ancho) ** 2));
function caracteristicas({ segmentos = [], duracion, cortes }) {
  const T = Math.ceil(duracion ?? (segmentos.length ? Math.max(...segmentos.map((s) => s.t1)) : 0));
  if (!(T > 0)) return null;
  // cada palabra con su segundo
  const porSeg = Array.from({ length: T }, () => []); const crudoPorSeg = Array.from({ length: T }, () => '');
  for (const s of segmentos) {
    const ws = palabras(s.texto), d = Math.max(0.001, s.t1 - s.t0);
    ws.forEach((w, i) => { const t = Math.min(T - 1, Math.max(0, Math.floor(s.t0 + ((i + 0.5) / ws.length) * d))); porSeg[t].push(w); });
    const t = Math.min(T - 1, Math.max(0, Math.floor(s.t0))); crudoPorSeg[t] += ' ' + limpio(s.texto);
  }
  const cortesTodos = [...(Array.isArray(cortes) ? cortes : []), ...segmentos.flatMap((s) => s.cortes || [])].filter((x) => Number.isFinite(x)).sort((a, z) => a - z);
  const hayCortes = cortesTodos.length > 0 || Array.isArray(cortes);
  const vistos = new Set(), F = CARACTERISTICAS.reduce((o, k) => ({ ...o, [k]: [] }), {}), val = [], aro = [];
  let abiertas = 0;
  for (let i = 0; i < T; i++) {
    const lo = Math.max(0, i - 2), hi = Math.min(T - 1, i + 2), win = []; for (let j = lo; j <= hi; j++) win.push(...porSeg[j]);
    const winTxt = norm(crudoPorSeg.slice(lo, hi + 1).join(' ')), secs = hi - lo + 1, n = win.length;
    // ritmo
    const wpm = (n / secs) * 60; F.ritmo.push(n === 0 ? 0.15 : U(wpm, WPM_IDEAL, WPM_ANCHO));
    // cortes
    if (hayCortes) {
      const c = cortesTodos.filter((x) => x >= lo && x < hi + 1).length / secs, ult = [...cortesTodos].reverse().find((x) => x <= i + 1), sin = ult == null ? i : i - ult;
      F.cortes.push(U(c, CORTES_IDEAL, CORTES_ANCHO) * (sin > 6 ? Math.max(0.3, 1 - (sin - 6) / 10) : 1));
    } else F.cortes.push(null);
    // emoción
    let pos = 0, neg = 0; for (const w of win) { const x = intensidad(w); if (x > 0) pos++; else if (x < 0) neg++; }
    const exc = (winTxt.match(/[!¡]/g) || []).length, mayus = (limpio(crudoPorSeg.slice(lo, hi + 1).join(' ')).match(/\b[A-ZÁÉÍÓÚÑ]{4,}\b/g) || []).length;
    const a = Math.min(1, n ? ((pos + neg) / n) * 5 + exc * 0.1 + mayus * 0.1 : 0); aro.push(a); val.push((pos - neg) / (pos + neg + 1)); F.emocion.push(a);
    // novedad
    const cont = win.filter((w) => !PARADAS.has(w) && w.length > 2), nuevas = cont.filter((w) => !vistos.has(w)).length;
    F.novedad.push(cont.length ? Math.min(1, (nuevas / cont.length) * 1.4) : 0.2); for (const w of porSeg[i]) vistos.add(w);
    // tensión (promesas abiertas)
    const prop = norm(crudoPorSeg[i]); abiertas = Math.max(0, abiertas + Math.min(2, cuenta(prop, ABRE)) - Math.min(abiertas + 2, cuenta(prop, CIERRA)));
    F.tension.push(0.3 + 0.7 * Math.min(1, abiertas / 2));
    // directo y relleno
    F.directo.push(n ? Math.min(1, (win.filter((w) => SEGUNDA.has(w)).length / n) * 8) : 0);
    F.relleno.push(n ? 1 - Math.min(1, (cuenta(winTxt, FILLERS) / n) * 6) : 0.5);
  }
  const wpmSeg = (i) => { const lo = Math.max(0, i - 2), hi = Math.min(T - 1, i + 2); let n = 0; for (let j = lo; j <= hi; j++) n += porSeg[j].length; return (n / (hi - lo + 1)) * 60; };
  const sinCambioEn = (i) => { if (!hayCortes) return null; const ult = [...cortesTodos].reverse().find((x) => x <= i + 1); return Math.round(ult == null ? i : i - ult); };
  return { T, F, val, aro, hayCortes, wpmSeg, sinCambioEn, primerTexto: segmentos.length ? segmentos.slice(0, 2).map((s) => s.texto).join(' ') : '' };
}

// ---------- Del estímulo a la retención ----------
function curvaDesde(car, pesos, riesgo, hook) {
  const ks = CARACTERISTICAS.filter((k) => car.F[k].some((x) => x != null)), sw = ks.reduce((a, k) => a + (pesos[k] || 0), 0) || 1;
  const s = [], h = [], S = [1];
  for (let i = 0; i < car.T; i++) {
    let est = ks.reduce((a, k) => a + (pesos[k] || 0) * (car.F[k][i] ?? 0), 0) / sw;
    if (i < 3 && hook != null) est = 0.55 * hook + 0.45 * est;
    const hz = Math.min(0.95, (riesgo.a + riesgo.b * Math.exp(-i / riesgo.tau)) * (1 - 0.9 * Math.max(0, Math.min(1, est))));
    s.push(est); h.push(hz); S.push(S[i] * (1 - hz));
  }
  return { s, h, S };
}
const cuantil = (xs, q) => { const a = [...xs].sort((p, z) => p - z); return a.length ? a[Math.min(a.length - 1, Math.floor(q * (a.length - 1)))] : 0; };
const redondea = (x, d = 4) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);

const SUGERENCIA = {
  ritmo: (c, t) => { const w = Math.round(c.wpmSeg(t)); return w < 120 ? { detalle: `El ritmo baja (${w} palabras por minuto)`, accion: 'Acorta la frase, quita la pausa o corta aquí.' } : { detalle: `Demasiado rápido (${w} palabras por minuto)`, accion: 'Respira: divide la idea en dos y deja un segundo de aire.' }; },
  cortes: (c, t) => { const s = c.sinCambioEn(t); return { detalle: s != null && s > 4 ? `Llevas ${s} s sin cambio visual` : 'El ritmo de cortes no acompaña', accion: 'Añade un corte, un reencuadre o texto en pantalla.' }; },
  emocion: () => ({ detalle: 'Sin carga emocional', accion: 'Agrega una consecuencia, una cifra o una emoción concreta.' }),
  novedad: () => ({ detalle: 'Repites lo que ya dijiste', accion: 'Aporta un dato nuevo o pasa a la siguiente idea.' }),
  tension: () => ({ detalle: 'No queda ninguna promesa abierta', accion: 'Abre una pregunta o anuncia lo que viene («ahora vas a ver…»).' }),
  directo: () => ({ detalle: 'No le hablas a la persona', accion: 'Háblale directo: «tú», «tu».' }),
  relleno: () => ({ detalle: 'Muchas muletillas', accion: 'Recórtalas: di la idea sin «o sea» ni «básicamente».' }),
};

// ---------- API principal ----------
// entrada: { segmentos:[{t0,t1,texto,cortes?}], duracion?, cortes?:[s…] }  ·  opciones: { pesos, riesgo }
export function analizar(entrada, { pesos = PESOS_BASE, riesgo = RIESGO_BASE, modelo = MODELO } = {}) {
  const advertencias = [], car = entrada && typeof entrada === 'object' ? caracteristicas(entrada) : null;
  if (!car) return { modelo, duracion_s: 0, curva: [], resumen: null, caidas: [], advertencias: ['⚠️ SIN DATOS · falta el guion o la transcripción con tiempos'], evidencia: evidenciaDe(modelo) };
  if (!car.hayCortes) advertencias.push('Sin dato de cortes: la característica «cortes» no cuenta y los pesos se reparten entre las demás. Pasa los cortes (o detecta escenas con ffmpeg) para afinar.');
  const gancho = puntuarGancho(car.primerTexto), { s, h, S } = curvaDesde(car, pesos, riesgo, gancho.puntos);
  const arSuave = car.aro.map((_, i) => { const lo = Math.max(0, i - 1), hi = Math.min(car.T - 1, i + 1); let a = 0; for (let j = lo; j <= hi; j++) a += car.aro[j]; return a / (hi - lo + 1); });
  const curva = s.map((e, i) => ({ t: i, retencion: redondea(S[i + 1]), estimulo: redondea(e), riesgo: redondea(h[i]), emocion: redondea(arSuave[i]), valencia: redondea(car.val[i]) }));
  // caídas: el riesgo de ese segundo supera 1.35× el de los mejores tramos del video, con estímulo bajo
  // El riesgo de ese segundo (no la pérdida absoluta, que se achica sola al irse la gente) contra lo que logra el video en sus MEJORES tramos
  // (cuartil bajo del riesgo después del gancho): así un bache largo no se esconde detrás de sí mismo.
  const perdidas = S.slice(0, -1).map((x, i) => x - S[i + 1]), ref = cuantil(h.slice(3), 0.25), caidas = [];
  for (let i = 3; i < car.T; i++) {
    if (!(h[i] > 1.35 * ref && s[i] < 0.5)) continue;
    const peor = CARACTERISTICAS.filter((k) => car.F[k][i] != null).map((k) => ({ k, falta: (pesos[k] || 0) * (1 - car.F[k][i]) })).sort((a, z) => z.falta - a.falta)[0];
    const ult = caidas[caidas.length - 1];
    if (ult && i - ult.t1 <= 1 && ult.causa === peor.k) { ult.t1 = i + 1; ult.perdida = redondea(ult.perdida + perdidas[i]); continue; }
    caidas.push({ t0: i, t1: i + 1, perdida: redondea(perdidas[i]), causa: peor.k, ...SUGERENCIA[peor.k](car, i) });
  }
  if (gancho.puntos < 0.4) caidas.unshift({ t0: 0, t1: 3, perdida: redondea(1 - S[3]), causa: 'gancho', detalle: 'El gancho no engancha', accion: `Abre con ${gancho.faltan.filter((x) => ['pregunta', 'cifra', 'contraste', 'curiosidad'].includes(x)).slice(0, 2).join(' o ') || 'una pregunta'}: lo que está en juego, en menos de 12 palabras.` });
  const ar = arSuave, media = ar.reduce((a, x) => a + x, 0) / ar.length, variacion = Math.sqrt(ar.reduce((a, x) => a + (x - media) ** 2, 0) / ar.length);
  const pico = ar.indexOf(Math.max(...ar)), forma = variacion < 0.05 ? 'plana' : pico / car.T > 0.55 && pico / car.T < 0.9 ? 'arco' : pico / car.T <= 0.35 ? 'decreciente' : 'irregular';
  if (forma === 'plana') advertencias.push('La emoción es plana de principio a fin: un giro o una consecuencia a mitad del video suele sostener la atención.');
  const media_ret = S.slice(1).reduce((a, x) => a + x, 0) / car.T;
  return { modelo, duracion_s: car.T, curva, caidas, advertencias, evidencia: evidenciaDe(modelo),
    resumen: { gancho: gancho.puntos, ganchoRazones: gancho.razones, retencion_3s: redondea(S[Math.min(3, car.T)]), retencion_media: redondea(media_ret), retencion_final: redondea(S[car.T]), forma_emocional: forma, variacion_emocional: redondea(variacion) } };
}
const evidenciaDe = (m) => (m.calibrado ? { etiqueta: `Modelo calibrado con retención real (${m.muestras} videos)`, confianza: 'media', error_fuera_de_muestra: m.error_fuera_de_muestra }
  : { etiqueta: 'Predicción de un modelo heurístico SIN calibrar: sirve para comparar guiones entre sí y ubicar caídas, no para prometer una cifra', confianza: 'baja', error_fuera_de_muestra: null });

export function compararGuiones(a, b, o) {
  const x = analizar(a, o), y = analizar(b, o); if (!x.resumen || !y.resumen) return { mejor: null, motivo: 'Falta un guion con datos' };
  const d = y.resumen.retencion_media - x.resumen.retencion_media;
  return { mejor: Math.abs(d) < 0.01 ? 'empate' : d > 0 ? 'b' : 'a', diferencia: redondea(d), a: x.resumen, b: y.resumen };
}

// ---------- Contra la realidad ----------
// pred y real: [{t, s}] con s = fracción que sigue viendo.
export function evaluar(pred, real) {
  const m = new Map((pred || []).map((p) => [Math.round(p.t), p.s])), pares = (real || []).map((r) => [m.get(Math.round(r.t)), r.s]).filter(([p, r]) => p != null && Number.isFinite(r));
  if (pares.length < 3) return { rmse: null, correlacion: null, n: pares.length };
  const n = pares.length, mp = pares.reduce((a, [p]) => a + p, 0) / n, mr = pares.reduce((a, [, r]) => a + r, 0) / n;
  const rmse = Math.sqrt(pares.reduce((a, [p, r]) => a + (p - r) ** 2, 0) / n), sp = Math.sqrt(pares.reduce((a, [p]) => a + (p - mp) ** 2, 0)), sr = Math.sqrt(pares.reduce((a, [, r]) => a + (r - mr) ** 2, 0));
  return { rmse: redondea(rmse), correlacion: sp && sr ? redondea(pares.reduce((a, [p, r]) => a + (p - mp) * (r - mr), 0) / (sp * sr)) : null, n };
}
const prediccion = (curva) => curva.map((c) => ({ t: c.t + 1, s: c.retencion }));

// ---------- Calibrar con retención REAL ----------
// muestras = [{ entrada, real:[{t,s}] }]. Ajusta pesos y riesgo por descenso por coordenadas con un ancla a los valores de partida (ridge),
// y valida DEJANDO UNO FUERA: solo declara «calibrado» si el error fuera de muestra mejora al menos 10 %.
const LIMITES = { a: [0.003, 0.05], b: [0.02, 0.4], tau: [0.8, 6] };
const normaliza = (p) => { const s = CARACTERISTICAS.reduce((a, k) => a + p[k], 0) || 1; return CARACTERISTICAS.reduce((o, k) => ({ ...o, [k]: p[k] / s }), {}); };
function error(cars, reales, hooks, th, lambda, th0) {
  let e = 0, n = 0;
  cars.forEach((car, j) => { const { S } = curvaDesde(car, th.pesos, th.riesgo, hooks[j]); for (const r of reales[j]) { const i = Math.round(r.t); if (i >= 0 && i < S.length) { e += (S[i] - r.s) ** 2; n++; } } });
  const reg = CARACTERISTICAS.reduce((a, k) => a + (th.pesos[k] - th0.pesos[k]) ** 2, 0) + (((th.riesgo.a - th0.riesgo.a) / th0.riesgo.a) ** 2 + ((th.riesgo.b - th0.riesgo.b) / th0.riesgo.b) ** 2 + ((th.riesgo.tau - th0.riesgo.tau) / th0.riesgo.tau) ** 2) * 0.1;
  return (n ? e / n : Infinity) + lambda * reg;
}
function ajustar(cars, reales, hooks, th0, lambda) {
  let th = { pesos: { ...th0.pesos }, riesgo: { ...th0.riesgo } }, mejor = error(cars, reales, hooks, th, lambda, th0);
  for (let paso = 0.08; paso > 0.004; paso *= 0.6) for (let ronda = 0; ronda < 6; ronda++) {
    let mejoro = false;
    for (const k of CARACTERISTICAS) for (const sg of [1, -1]) { const c = { pesos: normaliza({ ...th.pesos, [k]: Math.max(0.01, th.pesos[k] + sg * paso) }), riesgo: th.riesgo }, e = error(cars, reales, hooks, c, lambda, th0); if (e < mejor - 1e-12) { th = c; mejor = e; mejoro = true; } }
    for (const k of ['a', 'b', 'tau']) for (const sg of [1, -1]) { const v = Math.min(LIMITES[k][1], Math.max(LIMITES[k][0], th.riesgo[k] * (1 + sg * paso))), c = { pesos: th.pesos, riesgo: { ...th.riesgo, [k]: v } }, e = error(cars, reales, hooks, c, lambda, th0); if (e < mejor - 1e-12) { th = c; mejor = e; mejoro = true; } }
    if (!mejoro) break;
  }
  return th;
}
export function calibrar(muestras, { pesos = PESOS_BASE, riesgo = RIESGO_BASE, lambda = 0.002 } = {}) {
  const validas = (muestras || []).map((m) => ({ car: caracteristicas(m?.entrada || {}), real: (m?.real || []).filter((r) => Number.isFinite(r?.t) && Number.isFinite(r?.s)) })).filter((m) => m.car && m.real.length >= 3);
  if (validas.length < MIN_MUESTRAS) return { calibrado: false, motivo: `Hacen falta al menos ${MIN_MUESTRAS} videos con su retención real (hay ${validas.length}). Se siguen usando los pesos de partida.`, pesos, riesgo, modelo: MODELO };
  const th0 = { pesos: normaliza({ ...pesos }), riesgo: { ...riesgo } }, cars = validas.map((m) => m.car), reales = validas.map((m) => m.real), hooks = validas.map((m) => puntuarGancho(m.car.primerTexto).puntos);
  const th = ajustar(cars, reales, hooks, th0, lambda);
  // validación dejando uno fuera: error en el video que NO se usó para ajustar
  const sinCal = [], conCal = [];
  validas.forEach((_, j) => {
    const idx = validas.map((__, i) => i).filter((i) => i !== j), t = ajustar(idx.map((i) => cars[i]), idx.map((i) => reales[i]), idx.map((i) => hooks[i]), th0, lambda);
    sinCal.push(error([cars[j]], [reales[j]], [hooks[j]], th0, 0, th0)); conCal.push(error([cars[j]], [reales[j]], [hooks[j]], t, 0, th0));
  });
  const base = Math.sqrt(sinCal.reduce((a, x) => a + x, 0) / sinCal.length), loo = Math.sqrt(conCal.reduce((a, x) => a + x, 0) / conCal.length), mejora = base > 0 ? 1 - loo / base : 0;
  const ok = mejora >= 0.1;
  return { calibrado: ok, motivo: ok ? `Mejora ${Math.round(mejora * 100)} % fuera de muestra` : 'No mejora fuera de muestra: se conservan los pesos de partida (más datos ayudan)', pesos: ok ? th.pesos : th0.pesos, riesgo: ok ? th.riesgo : th0.riesgo,
    error_base: redondea(base), error_fuera_de_muestra: redondea(loo), muestras: validas.length, modelo: ok ? { version: MODELO.version, calibrado: true, muestras: validas.length, error_fuera_de_muestra: redondea(loo) } : MODELO };
}
