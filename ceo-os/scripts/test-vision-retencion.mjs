// Curva de retención: modelo de supervivencia por segundo (público/js/studio/retencion.js). Sin red, determinista.
import assert from 'node:assert/strict';
import { analizar, compararGuiones, calibrar, evaluar, puntuarGancho, lineaDeTiempoDesdeTexto, desdeSubtitulos, PESOS_BASE, RIESGO_BASE, CARACTERISTICAS } from '../public/js/studio/retencion.js';
let count = 0;
const t = (n, fn) => { fn(); console.log('✓', n); count++; };

const DINAMICO = '¿Sabías que el 80% de los reels pierden a la gente en 3 segundos? Nadie te lo dice, pero es un error caro. Hoy te voy a mostrar 3 cosas que cambian todo. Primero: abre con una consecuencia, no con tu nombre. Segundo: corta cada dos segundos, sin miedo. Tercero, y esto es lo que nadie hace: cierra con una pregunta. Por eso funciona: tu cerebro odia dejar algo sin resolver. ¿Y tú, qué vas a cambiar hoy?';
const PLANO = 'Hola, bueno, eh, mi nombre es Carlos y hoy quiero hablar un poco, o sea, de varias cosas que, básicamente, tienen que ver con el contenido. Este es un tema que, digamos, es importante para la gente. Eh, bueno, hay muchas formas de hacer contenido y cada quien hace lo que puede con lo que tiene. Es un tema importante y creo que es bueno hablar de eso con calma y con tiempo.';
const cortesCada = (T, cada) => Array.from({ length: Math.floor(T / cada) }, (_, i) => (i + 1) * cada);
const entrada = (texto, cada) => { const l = lineaDeTiempoDesdeTexto(texto); return { ...l, ...(cada ? { cortes: cortesCada(l.duracion, cada) } : {}) }; };

t('la curva es válida: empieza en 1, nunca sube, todo en [0,1], y trae el resumen', () => {
  const r = analizar(entrada(DINAMICO, 3)); assert.ok(r.curva.length > 10);
  let prev = 1; for (const p of r.curva) { assert.ok(p.retencion <= prev + 1e-9 && p.retencion >= 0, `t=${p.t}`); assert.ok(p.estimulo >= 0 && p.estimulo <= 1); assert.ok(p.riesgo >= 0 && p.riesgo < 1); prev = p.retencion; }
  assert.ok(r.resumen.retencion_3s < 1 && r.resumen.retencion_final <= r.resumen.retencion_3s); assert.equal(r.duracion_s, r.curva.length);
});
t('el gancho manda: un buen primer renglón retiene más en 3 s que uno flojo', () => {
  const fuerte = puntuarGancho('¿Sabías que el 80% pierde a su cliente en 3 segundos? Nadie te lo dice.'), flojo = puntuarGancho('Hola, bueno, mi nombre es Carlos y hoy voy a hablar un poco de varios temas que me parecen interesantes para ustedes.');
  assert.ok(fuerte.puntos >= 0.4 && flojo.puntos <= 0.15 && fuerte.puntos >= flojo.puntos * 2.5, `${fuerte.puntos} vs ${flojo.puntos}`);
  assert.ok(puntuarGancho('¿Sabías que nadie te cuenta este error caro de tu negocio?').puntos >= 0.6, 'pregunta + tú + contraste + brevedad'); assert.ok(fuerte.razones.includes('abre con una pregunta') && fuerte.razones.includes('trae una cifra'));
  const a = analizar(entrada(DINAMICO, 3)), b = analizar(entrada(PLANO, 3)); assert.ok(a.resumen.retencion_3s > b.resumen.retencion_3s);
});
t('un guion con ritmo, tensión y cortes retiene más que uno plano y con muletillas', () => {
  const r = compararGuiones(entrada(PLANO, 3), entrada(DINAMICO, 3)); assert.equal(r.mejor, 'b'); assert.ok(r.diferencia > 0.05, `dif ${r.diferencia}`);
  assert.equal(compararGuiones(entrada(DINAMICO, 3), entrada(PLANO, 3)).mejor, 'a');
});
t('los cortes son una U invertida: ni ninguno ni uno por segundo, sino cada ~3 s', () => {
  const m = (cada) => analizar(entrada(DINAMICO, cada)).resumen.retencion_media, ninguno = analizar({ ...entrada(DINAMICO), cortes: [] }).resumen.retencion_media;
  assert.ok(m(3) > ninguno, 'sin cortes pierde'); assert.ok(m(3) > m(0.5), 'un corte cada 0.5 s también pierde'); assert.ok(m(3) > m(14), 'uno cada 14 s no sostiene');
});
t('las caídas traen el segundo, la causa y qué hacer; un bache de 12 s sin cambio aparece', () => {
  const seg = [{ t0: 0, t1: 3, texto: '¿Sabías que nadie te cuenta esto sobre el 90% de los negocios?' }, { t0: 3, t1: 8, texto: 'Mira esto: tres errores que arruinan tu mes y cómo evitarlos ahora mismo.' }, { t0: 8, t1: 24, texto: 'Es un tema importante y creo que es bueno tenerlo en cuenta con calma porque es un tema importante' }, { t0: 24, t1: 30, texto: '¡Por eso hoy cambias esto! ¿Listo para empezar?' }];
  const r = analizar({ segmentos: seg, duracion: 30, cortes: [2, 5, 8, 26, 28] });
  const c = r.caidas.find((x) => x.t0 >= 10 && x.t0 <= 24); assert.ok(c, JSON.stringify(r.caidas)); assert.ok(['cortes', 'ritmo', 'novedad', 'emocion', 'tension', 'directo'].includes(c.causa)); assert.ok(c.detalle && c.accion && c.t1 > c.t0);
});
t('un gancho flojo se marca como caída de 0 a 3 s con qué poner', () => {
  const r = analizar(entrada(PLANO, 3)); const g = r.caidas.find((x) => x.causa === 'gancho'); assert.ok(g && g.t0 === 0 && g.t1 === 3); assert.match(g.accion, /pregunta|cifra|contraste|curiosidad/);
});
t('sin cortes no se inventa: se avisa y los pesos se reparten entre las demás', () => {
  const r = analizar(entrada(DINAMICO)); assert.ok(r.advertencias.some((x) => /Sin dato de cortes/.test(x))); assert.ok(r.curva.length && r.resumen.retencion_media > 0);
});
t('sin datos no truena ni inventa: vacío con «SIN DATOS»', () => {
  for (const x of [null, undefined, {}, { segmentos: [] }, { segmentos: [{ t0: 0, t1: 0, texto: '' }], duracion: 0 }, 'texto']) { const r = analizar(x); assert.deepEqual(r.curva, []); assert.equal(r.resumen, null); assert.match(r.advertencias[0], /SIN DATOS/); }
});
t('es determinista y no cambia la entrada', () => {
  const e = entrada(DINAMICO, 3), copia = JSON.stringify(e); assert.equal(JSON.stringify(analizar(e)), JSON.stringify(analizar(e))); assert.equal(JSON.stringify(e), copia);
});
t('acentos y HTML: «increíble» = «increible»; el HTML no se cuela en las sugerencias', () => {
  const a = analizar({ segmentos: [{ t0: 0, t1: 6, texto: 'Esto es increíble, brutal y gratis' }], duracion: 6 }), b = analizar({ segmentos: [{ t0: 0, t1: 6, texto: 'Esto es increible, brutal y gratis' }], duracion: 6 });
  assert.deepEqual(a.curva, b.curva);
  const x = analizar({ segmentos: [{ t0: 0, t1: 20, texto: '<img src=x onerror=alert(1)> <script>malo()</script> hola hola hola hola' }], duracion: 20 }); assert.doesNotMatch(JSON.stringify(x), /<script|onerror|<img/);
});
t('de texto a tiempos: la duración es proporcional a las palabras; y SRT/VTT con tiempos reales', () => {
  const l = lineaDeTiempoDesdeTexto('Una dos tres cuatro cinco seis. Siete ocho nueve diez.', { wps: 2 }); assert.equal(l.segmentos.length, 2); assert.ok(Math.abs(l.segmentos[0].t1 - 3) < 1e-9); assert.ok(Math.abs(l.duracion - 5) < 1e-9);
  const s = desdeSubtitulos('1\n00:00:00,000 --> 00:00:02,500\nHola ¿qué tal?\n\n2\n00:00:02,500 --> 00:00:06,000\nTe cuento <b>algo</b>\n'); assert.equal(s.segmentos.length, 2); assert.equal(s.segmentos[1].texto, 'Te cuento algo'); assert.equal(s.duracion, 6);
});
t('la forma emocional: plana se avisa; con giros no', () => {
  const plano = analizar(entrada('y luego fuimos a la casa y luego comimos algo y luego volvimos a la casa y luego vimos una serie y luego dormimos un rato y luego salimos a caminar por la calle del parque', 3));
  assert.equal(plano.resumen.forma_emocional, 'plana'); assert.ok(plano.advertencias.some((x) => /plana/.test(x)));
  assert.notEqual(analizar(entrada(DINAMICO, 3)).resumen.forma_emocional, 'plana');
});
t('la evidencia es honesta: «sin calibrar» y confianza baja hasta que se calibre', () => {
  const r = analizar(entrada(DINAMICO, 3)); assert.match(r.evidencia.etiqueta, /SIN calibrar/); assert.equal(r.evidencia.confianza, 'baja'); assert.equal(r.modelo.calibrado, false);
});
t('evaluar: perfecta = error 0 y correlación 1; con pocos puntos, null (no 0)', () => {
  const p = [{ t: 1, s: 0.9 }, { t: 2, s: 0.8 }, { t: 3, s: 0.6 }, { t: 4, s: 0.5 }]; assert.deepEqual(evaluar(p, p), { rmse: 0, correlacion: 1, n: 4 });
  assert.equal(evaluar(p, [{ t: 1, s: 0.9 }]).rmse, null);
});

// ---------- Calibración contra una «realidad» sintética con otros pesos ----------
function prng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; }; }
const POOL = ['¿Sabías que el 70% de la gente pierde dinero así?', 'Nadie te cuenta este error caro.', 'Hoy te muestro 3 cosas que cambian todo.', 'Bueno, eh, o sea, básicamente es un tema importante.', 'Es importante y hay muchas formas de hacerlo con calma.', 'Por eso funciona: tu cerebro odia dejar algo sin resolver.', '¡Increíble! Gana el doble sin miedo a perder tu tiempo.', 'Y luego fuimos a la casa y luego volvimos a la casa.', '¿Y tú, qué vas a cambiar hoy?', 'Mira esto, pero antes espera: lo mejor viene ahora.'];
function guion(seed) { const r = prng(seed), n = 6 + Math.floor(r() * 5), partes = Array.from({ length: n }, () => POOL[Math.floor(r() * POOL.length)]); const l = lineaDeTiempoDesdeTexto(partes.join(' ')); return { ...l, cortes: cortesCada(l.duracion, 1.5 + r() * 4) }; }
const VERDAD = { pesos: { ritmo: 0.05, cortes: 0.12, emocion: 0.4, novedad: 0.08, tension: 0.2, directo: 0.1, relleno: 0.05 }, riesgo: { a: 0.02, b: 0.12, tau: 2.2 } };
const real = (g) => analizar(g, VERDAD).curva.map((c) => ({ t: c.t + 1, s: c.retencion }));
t('calibrar con < 5 videos no inventa: dice que faltan datos y conserva los pesos de partida', () => {
  const r = calibrar([1, 2, 3].map((i) => ({ entrada: guion(i), real: real(guion(i)) }))); assert.equal(r.calibrado, false); assert.match(r.motivo, /al menos 5/); assert.deepEqual(r.pesos, PESOS_BASE);
});
t('calibrar con retención real: se acerca a la verdad y MEJORA fuera de muestra (dejando uno fuera)', () => {
  const m = Array.from({ length: 12 }, (_, i) => ({ entrada: guion(100 + i), real: real(guion(100 + i)) })), r = calibrar(m);
  assert.equal(r.calibrado, true, r.motivo); assert.ok(r.error_fuera_de_muestra < r.error_base * 0.9, `${r.error_fuera_de_muestra} vs ${r.error_base}`);
  const dist = (p) => CARACTERISTICAS.reduce((a, k) => a + Math.abs(p[k] - VERDAD.pesos[k]), 0); assert.ok(dist(r.pesos) < dist(PESOS_BASE), `${dist(r.pesos)} vs ${dist(PESOS_BASE)}`);
  assert.ok(Math.abs(CARACTERISTICAS.reduce((a, k) => a + r.pesos[k], 0) - 1) < 1e-9, 'los pesos suman 1');
  // y un guion NUEVO (fuera de las 12) se predice mejor con lo calibrado que con lo de partida
  const nuevo = guion(777), rl = real(nuevo), conCal = evaluar(analizar(nuevo, { pesos: r.pesos, riesgo: r.riesgo, modelo: r.modelo }).curva.map((c) => ({ t: c.t + 1, s: c.retencion })), rl), sinCal = evaluar(analizar(nuevo).curva.map((c) => ({ t: c.t + 1, s: c.retencion })), rl);
  assert.ok(conCal.rmse < sinCal.rmse, `${conCal.rmse} vs ${sinCal.rmse}`);
  assert.match(analizar(nuevo, { pesos: r.pesos, riesgo: r.riesgo, modelo: r.modelo }).evidencia.etiqueta, /calibrado con retención real \(12 videos\)/);
});
t('si lo real es ruido sin relación con el guion, NO se declara calibrado (no se hace pasar por mejor)', () => {
  const r0 = prng(9), m = Array.from({ length: 8 }, (_, i) => ({ entrada: guion(300 + i), real: Array.from({ length: 20 }, (_, k) => ({ t: k + 1, s: Math.max(0.02, 1 - 0.04 * k + (r0() - 0.5) * 0.5) })) }));
  const r = calibrar(m); assert.equal(r.calibrado === true && r.error_fuera_de_muestra < r.error_base * 0.9, r.calibrado); if (!r.calibrado) assert.deepEqual(r.pesos, PESOS_BASE);
});
console.log(`${count} pruebas de la curva de retención OK`);
