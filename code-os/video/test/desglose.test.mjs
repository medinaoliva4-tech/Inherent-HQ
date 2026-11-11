import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { leerCortes, planos, armarDesglose, cortesPorNegro, desgloseAReceta, crearVision } from '../desglose.mjs';
import { cargarReferencias, validarReferencia, desdeRadar } from '../referencias.mjs';
import { aplicarEstilo, validarEstilo } from '../estilos.mjs';
import { normalizarCorte } from '../corte.mjs';

test('cortes y planos: une planos de menos de 0.3 s', () => {
  assert.deepEqual(leerCortes('x pts_time:0 y pts_time:3.2 z pts_time:3.3 w pts_time:7'), [3.2, 3.3, 7]);
  assert.deepEqual(planos([3.2, 3.3, 7], 9), [[0, 3.3], [3.3, 7], [7, 9]]); // el plano de 0.1 s se suma al anterior
  assert.deepEqual(planos([], 4), [[0, 4]]);
});

test('corte por fundido desde negro aunque la toma anterior sea oscura', () => {
  const serie = [3, 2.8, 2.9, 0, 36, 78, 120, 160];
  assert.deepEqual(cortesPorNegro(serie, 10), [0.3]);
  assert.deepEqual(cortesPorNegro([100, 100, 100], 10), []);
});

test('desglose: roles, ritmo y formato', () => {
  const d = armarDesglose({ fuente: 'a.mp4', duracion: 10, ancho: 1080, alto: 1920, tramos: [[0, 2], [2, 6], [6, 10]], metodo: 'sin-ia' });
  assert.deepEqual(d.escenas.map((e) => e.rol), ['gancho', 'cuerpo', 'cierre']);
  assert.equal(d.formato, '9:16');
  assert.equal(d.ritmo.escenas_por_minuto, 18);
  assert.equal(d.ritmo.lectura, 'medio');
});

test('desglose → receta válida que imita orden, ritmo, texto, zoom y fundido', () => {
  const d = armarDesglose({ fuente: 'ref.mp4', duracion: 6, ancho: 1080, alto: 1920, tramos: [[0, 1.5], [1.5, 4], [4, 6]], metodo: 'ia',
    porEscena: [{ plano: 'primer plano', texto: 'No hagas esto', posicion_texto: 'arriba', efecto: 'zoom-in' }, { plano: 'b-roll', efecto: 'ninguno' }, { plano: 'plano medio', texto: 'Síguenos', fundido_entrada: true }] });
  const r = validarEstilo(desgloseAReceta(d, { id: 'imitar-x', nombre: 'Imitar X' }));
  assert.equal(r.categoria, 'cortos');
  assert.deepEqual(r.escenas_plantilla.map((p) => p.duracion), [1.5, 2.5, 2]);
  assert.equal(r.escenas_plantilla[0].capas[0].y, 0.2);
  assert.equal(r.escenas_plantilla[1].capas.length, 0, 'el b-roll sin texto queda sin texto');
  assert.match(r.escenas_plantilla[0].referencia, /primer plano · texto «No hagas esto» · zoom-in/);
  const corte = normalizarCorte({ escenas: [0, 1, 2].map((i) => ({ id: `e${i}`, clip: 'c.mp4', inicio: 0, fin: 5, texto: `F${i}` })) });
  const { corte: c } = aplicarEstilo(corte, r);
  assert.deepEqual(c.escenas.map((e) => e.fin), [1.5, 2.5, 2]);
  assert.equal(c.escenas[0].estilos[0].tipo, 'zoom');
  assert.ok(c.escenas[2].estilos.some((s) => s.tipo === 'transicion'));
  assert.equal(c.escenas[1].texto, null);
  // sin IA no se sabe si había texto: se conserva el del guion
  const sinIA = desgloseAReceta({ ...d, metodo: 'sin-ia', escenas: d.escenas.map((e) => ({ ...e, texto: null })) });
  assert.ok(sinIA.escenas_plantilla.every((p) => p.capas.length === 1));
});

test('visión por LiteLLM: arma el pedido y limpia la respuesta; sin modelo no se usa', async () => {
  assert.equal(crearVision({ modelo: '', key: 'k' }), null);
  const dir = mkdtempSync(join(tmpdir(), 'vision-'));
  const jpg = join(dir, 'f.jpg'); writeFileSync(jpg, Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
  let pedido;
  const vision = crearVision({ base: 'http://gw/v1', key: 'k', modelo: 'nivel-vision', fetchImpl: async (url, o) => {
    pedido = { url, cuerpo: JSON.parse(o.body), auth: o.headers.authorization };
    return { ok: true, json: async () => ({ choices: [{ message: { content: '```json\n{"plano":"plano medio","texto":"Hola","posicion_texto":"abajo","efecto":"volar","persona":true}\n```' } }] }) };
  } });
  const r = await vision(jpg, { inicio: 0, fin: 2 });
  rmSync(dir, { recursive: true, force: true });
  assert.equal(pedido.url, 'http://gw/v1/chat/completions');
  assert.equal(pedido.cuerpo.model, 'nivel-vision');
  assert.equal(pedido.auth, 'Bearer k');
  assert.match(pedido.cuerpo.messages[1].content[1].image_url.url, /^data:image\/jpeg;base64,/);
  assert.deepEqual(r, { plano: 'plano medio', texto: 'Hola', posicion_texto: 'abajo', efecto: null, persona: true });
});

test('referencias: semilla válida, solo enlaces https y radar → referencias', () => {
  const refs = cargarReferencias();
  assert.ok(refs.length >= 5);
  for (const r of refs) { assert.match(r.fuente_url, /^https:\/\/www\.youtube\.com\/watch\?v=/); assert.ok(r.por_que_funciona && r.estilo_sugerido); }
  assert.throws(() => validarReferencia({ id: 'x', titulo: 't', plataforma: 'youtube', fuente_url: 'http://a', duracion: 3 }), /https/);
  const radar = { posts: [
    { clave: 'yt:abc', id: 'abc', plataforma: 'youtube', cuenta: '@marca', url: 'https://www.youtube.com/shorts/abc', titulo: 'Tip', duracion_s: 28, gancho: { gancho: 'No hagas esto', por_que: 'abre con un error común' }, metricas: { puntaje: 2.1, winner: true } },
    { clave: 'yt:def', id: 'def', plataforma: 'youtube', url: 'https://www.youtube.com/watch?v=def', duracion_s: 600, metricas: { puntaje: 0.4, winner: false } },
  ] };
  const r = desdeRadar(radar);
  assert.equal(r.length, 1);
  assert.deepEqual([r[0].id, r[0].origen, r[0].estilo_sugerido, r[0].por_que_funciona], ['radar-youtube-abc', 'radar', 'caja-subtitulos', 'abre con un error común']);
  assert.equal(desdeRadar(radar, { soloWinners: false })[1].estilo_sugerido, 'entrevista-larga');
});
