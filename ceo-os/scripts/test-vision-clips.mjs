// Inherent Media: los mejores momentos de una transcripción larga, con el motor de retención.
import assert from 'node:assert/strict';
import { mejoresMomentos } from '../public/js/studio/clips.js';
import { desdeSubtitulos } from '../public/js/studio/retencion.js';
let count = 0; const t = (n, fn) => { fn(); console.log('✓', n); count++; };

const RELLENO = ['Bueno, eh, o sea, es un tema importante y hay muchas formas de verlo con calma.', 'Y luego fuimos a la casa y luego volvimos a la casa y comimos algo.', 'Creo que es bueno hablar de eso, digamos, con tiempo y con paciencia.', 'Es importante, básicamente, y cada quien lo hace como puede.'];
const ORO = ['¿Sabías que el 80% de los negocios pierde a su cliente en 3 segundos?', 'Nadie te cuenta este error caro, pero hoy te lo muestro.', 'Mira: tres cosas cambian todo y la tercera es la que nadie hace.', 'Primero, abre con una consecuencia, no con tu nombre.', 'Segundo, corta cada dos segundos sin miedo a perder la atención.', 'Por eso funciona: tu cerebro odia dejar algo sin resolver.'];
function episodio() { // 5 min: relleno, un tramo de oro (min 2:00–2:40), más relleno
  const seg = []; let t0 = 0; const add = (txt) => { const d = txt.split(/\s+/).length / 2.7; seg.push({ t0, t1: t0 + d, texto: txt }); t0 += d; };
  for (let i = 0; t0 < 120; i++) add(RELLENO[i % RELLENO.length]);
  const inicioOro = t0; for (const f of ORO) add(f);
  const finOro = t0; for (let i = 0; t0 < 300; i++) add(RELLENO[i % RELLENO.length]);
  return { segmentos: seg, inicioOro, finOro };
}
t('encuentra el tramo bueno de un episodio de relleno: el mejor clip cae sobre él', () => {
  const e = episodio(), r = mejoresMomentos(e, { minS: 20, maxS: 45, n: 3 }); assert.ok(r.clips.length >= 1);
  const mejor = r.clips[0]; assert.ok(mejor.t0 >= e.inicioOro - 1 && mejor.t0 <= e.finOro, `${mejor.t0} fuera de ${e.inicioOro}–${e.finOro}`); assert.match(mejor.texto, /Sabías|Nadie te cuenta|tres cosas/); assert.ok(mejor.porQue.some((x) => /Gancho/.test(x)));
});
t('los clips respetan el largo, no se solapan y vienen ordenados por puntaje', () => {
  const r = mejoresMomentos(episodio(), { minS: 20, maxS: 45, n: 4 });
  for (const c of r.clips) assert.ok(c.duracion >= 20 && c.duracion <= 45 + 1e-6, c.duracion);
  for (let i = 0; i < r.clips.length; i++) { if (i) assert.ok(r.clips[i].puntaje <= r.clips[i - 1].puntaje); for (let j = i + 1; j < r.clips.length; j++) assert.ok(r.clips[i].t1 <= r.clips[j].t0 || r.clips[i].t0 >= r.clips[j].t1, 'solapados'); }
});
t('sin datos: vacío honesto; con cortes de video se usa la característica y no se avisa de su falta', () => {
  assert.deepEqual(mejoresMomentos({ segmentos: [] }).clips, []); assert.match(mejoresMomentos(null).advertencias[0], /SIN DATOS/);
  const e = episodio(), a = mejoresMomentos(e, { n: 1 }), b = mejoresMomentos(e, { n: 1, cortes: Array.from({ length: 100 }, (_, i) => (i + 1) * 3) });
  assert.ok(a.advertencias.some((x) => /Sin cortes/.test(x))); assert.ok(!b.advertencias.some((x) => /Sin cortes/.test(x)));
});
t('lee subtítulos reales (SRT) y no cuelga en transcripciones largas (1 hora)', () => {
  const srt = Array.from({ length: 4 }, (_, i) => `${i + 1}\n00:00:${String(i * 8).padStart(2, '0')},000 --> 00:00:${String(i * 8 + 7).padStart(2, '0')},000\n${ORO[i]}`).join('\n\n');
  assert.ok(mejoresMomentos(desdeSubtitulos(srt), { minS: 10, maxS: 40 }).clips.length >= 1);
  const largo = { segmentos: Array.from({ length: 1200 }, (_, i) => ({ t0: i * 3, t1: i * 3 + 3, texto: (i % 17 === 0 ? ORO : RELLENO)[i % 4] })) };
  const ini = Date.now(); const r = mejoresMomentos(largo, { n: 5 }); assert.ok(Date.now() - ini < 15000, 'tarda demasiado'); assert.ok(r.clips.length >= 1);
});
t('el HTML de la transcripción no se cuela en el texto del clip', () => {
  const r = mejoresMomentos({ segmentos: [{ t0: 0, t1: 12, texto: '¿Sabías que <script>x()</script> nadie te cuenta esto?' }, { t0: 12, t1: 30, texto: 'Mira: <img src=x onerror=a()> tres errores caros que debes evitar hoy mismo.' }] }, { minS: 10, maxS: 40 });
  assert.doesNotMatch(JSON.stringify(r), /<script|onerror|<img/);
});
console.log(`${count} pruebas de clips OK`);
