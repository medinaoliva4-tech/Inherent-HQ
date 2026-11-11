// Pruebas con un servidor FALSO de imágenes (no se llama a ningún proveedor real, no se gasta nada).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { codificarPng, decodificarPng } from '../src/png.mjs';
import { validarPng } from '../src/validar.mjs';
import { estimar } from '../src/lote.mjs';
import { generarLote, gastoDelMes } from '../src/lote.mjs';
import { manejar } from '../src/mcp.mjs';

/** Círculo `color` sobre transparente; `halo` pinta un anillo blanco semitransparente en el borde. */
function circulo(w, h, color, { halo = false, opaco = false } = {}) {
  const rgba = Buffer.alloc(w * h * 4);
  const cx = w / 2; const cy = h / 2; const r = Math.min(w, h) * 0.35;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot(x - cx, y - cy); const i = (y * w + x) * 4;
    if (d <= r) { rgba.set([...color, 255], i); }
    else if (halo && d <= r + 4) { rgba.set([255, 255, 255, 140], i); }
    else if (opaco) rgba.set([255, 255, 255, 255], i);
  }
  return { ancho: w, alto: h, rgba };
}
const NEGRO = [14, 14, 14];
const pngBueno = (w = 64, h = 64) => codificarPng(circulo(w, h, NEGRO));

test('png: ida y vuelta', () => {
  const d = decodificarPng(pngBueno(10, 8));
  assert.equal(d.ancho, 10); assert.equal(d.alto, 8); assert.equal(d.canalAlfa, true);
  assert.equal(d.rgba[3], 0); // esquina transparente
});

test('validar: PNG transparente correcto pasa tamaño, alfa, halo y paleta', () => {
  const r = validarPng(pngBueno(), { ancho: 64, alto: 64, transparente: true, paleta: ['#0E0E0E', '#F2EBDD'] });
  assert.equal(r.ok, true, JSON.stringify(r.checks));
});

test('validar: tamaño distinto falla', () => {
  const r = validarPng(pngBueno(), { ancho: 128, alto: 128 });
  assert.equal(r.checks.find((c) => c.id === 'tamano').ok, false);
});

test('validar: fondo opaco sin alfa falla cuando se pidió transparente', () => {
  const r = validarPng(codificarPng(circulo(64, 64, NEGRO, { opaco: true }), { conAlfa: false }), { transparente: true });
  assert.equal(r.ok, false);
  assert.equal(r.checks.find((c) => c.id === 'canal_alfa').ok, false);
});

test('validar: halo blanco en el borde se detecta', () => {
  const r = validarPng(codificarPng(circulo(128, 128, NEGRO, { halo: true })), { transparente: true });
  assert.equal(r.checks.find((c) => c.id === 'sin_halo').ok, false);
});

test('validar: color fuera de paleta falla', () => {
  const r = validarPng(codificarPng(circulo(64, 64, [255, 0, 0])), { paleta: ['#0E0E0E', '#F2EBDD'] });
  assert.equal(r.checks.find((c) => c.id === 'paleta').ok, false);
});

test('validar: peso excedido y archivo que no es PNG', () => {
  assert.equal(validarPng(pngBueno(), { maxBytes: 10 }).checks.find((c) => c.id === 'peso').ok, false);
  assert.equal(validarPng(Buffer.from('hola')).ok, false);
});

test('estimar: precio conocido, escalado aproximado y sin precio no inventa', () => {
  const a = estimar({ nivel: 'imagen-media', tamano: '1024x1024', cantidad: 4, calidad: 'medium' });
  assert.equal(a.ok, true); assert.equal(a.total_usd, +(0.01317 * 4).toFixed(5));
  assert.equal(estimar({ nivel: 'imagen-media', tamano: '1080x1350', cantidad: 1, calidad: 'medium' }).aproximado, true);
  const b = estimar({ nivel: 'imagen-media', tamano: '1024x1024', cantidad: 1, calidad: 'xhigh' });
  assert.equal(b.ok, false); assert.match(b.motivo, /sin precio/);
  assert.equal(estimar({ nivel: 'imagen-gratis', tamano: '1024x1024', cantidad: 3 }).total_usd, 0);
  assert.equal(estimar({ nivel: 'imagen-google', tamano: '1024x1024', cantidad: 2 }).total_usd, 0.0672);
});

/** Servidor falso: imitates LiteLLM (generations/edits) y NVIDIA. Cuenta llamadas. */
async function fake({ png = pngBueno(64, 64), costo = '0.0132' } = {}) {
  const st = { llamadas: [], auth: [] };
  const srv = createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c); const cuerpo = Buffer.concat(chunks);
    st.llamadas.push({ url: req.url, tipo: req.headers['content-type'], cuerpo: cuerpo.toString('latin1') }); st.auth.push(req.headers.authorization);
    res.setHeader('content-type', 'application/json');
    if (req.url === '/v1/images/generations' || req.url === '/v1/images/edits') {
      res.setHeader('x-litellm-response-cost', costo);
      return res.end(JSON.stringify({ data: [{ b64_json: png.toString('base64') }], usage: { input_tokens: 10, output_tokens: 100 } }));
    }
    if (req.url === '/nvidia') return res.end(JSON.stringify({ artifacts: [{ base64: png.toString('base64'), seed: 7 }] }));
    res.statusCode = 404; res.end('{}');
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return { st, url: `http://127.0.0.1:${srv.address().port}`, cerrar: () => { srv.close(); srv.closeAllConnections(); } };
}
const entorno = (url, extra = {}) => {
  const d = mkdtempSync(join(tmpdir(), 'imagen-'));
  return { d, c: { salida: join(d, 'out'), gasto: join(d, 'gasto.jsonl'), topeLoteUsd: 1, topeMesUsd: 2, cuotasUrl: null, ...extra }, cli: { baseUrl: url, llave: 'sk-prueba', nvidiaUrl: `${url}/nvidia`, nvidiaLlave: 'nv-prueba', timeoutMs: 5000 } };
};
const base = { nivel: 'imagen-media', prompt: 'ondas suaves', tamano: '64x64', cantidad: 3, transparente: true, pieza: 'IG Oct 03', asset: 'Ondas', paleta: ['#0E0E0E'] };

test('generar: sin OK de la persona no genera ni gasta', async () => {
  const s = await fake(); const e = entorno(s.url);
  const r = await generarLote(base, e.c, e.cli);
  assert.equal(r.estado, 'falta_ok'); assert.equal(s.st.llamadas.length, 0); assert.equal(existsSync(e.c.gasto), false); s.cerrar();
});

test('generar: crea N variantes con nombre estable, metadatos, validación y gasto.jsonl', async () => {
  const s = await fake(); const e = entorno(s.url);
  const r = await generarLote({ ...base, aprobadoUsd: 0.05 }, e.c, e.cli);
  assert.equal(r.estado, 'generado'); assert.equal(r.imagenes.length, 3); assert.ok(r.imagenes.every((i) => i.ok));
  const archivos = readdirSync(e.c.salida).sort();
  assert.deepEqual(archivos.filter((f) => f.endsWith('.png')), ['ig-oct-03-ondas-v1-a.png', 'ig-oct-03-ondas-v1-b.png', 'ig-oct-03-ondas-v1-c.png']);
  const meta = JSON.parse(readFileSync(join(e.c.salida, 'ig-oct-03-ondas-v1-a.json'), 'utf8'));
  assert.equal(meta.prompt, 'ondas suaves'); assert.equal(meta.modelo, 'gpt-image-2.5-flare'); assert.equal(meta.costo_real_usd, 0.0132); assert.equal(meta.costo_real_fuente, 'litellm'); assert.ok(meta.costo_estimado_usd > 0);
  const gasto = readFileSync(e.c.gasto, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(gasto.length, 1); assert.equal(gasto[0].proveedor, 'openai_imagen'); assert.equal(gasto[0].cantidad, 3); assert.equal(gasto[0].costo_usd, 0.0396); assert.equal(gasto[0].pieza, 'IG Oct 03');
  assert.equal(gastoDelMes(e.c.gasto), 0.0396);
  // La llave viaja solo en el encabezado y se pidió transparencia.
  assert.equal(s.st.auth[0], 'Bearer sk-prueba'); assert.match(s.st.llamadas[0].cuerpo, /"background":"transparent"/); assert.match(s.st.llamadas[0].cuerpo, /"output_format":"png"/);
  // Segundo lote: no sobreescribe, sube a v2.
  const r2 = await generarLote({ ...base, cantidad: 1, aprobadoUsd: 0.05 }, e.c, e.cli);
  assert.equal(r2.version, 2); assert.ok(existsSync(join(e.c.salida, 'ig-oct-03-ondas-v2-a.png'))); s.cerrar();
});

test('generar: un PNG malo se guarda marcado como no válido', async () => {
  const s = await fake({ png: codificarPng(circulo(64, 64, NEGRO, { halo: true, opaco: false }), { conAlfa: true }) }); const e = entorno(s.url);
  const r = await generarLote({ ...base, tamano: '64x64', cantidad: 1, paleta: ['#FF0000'], aprobadoUsd: 1 }, e.c, e.cli);
  assert.equal(r.imagenes[0].ok, false); s.cerrar();
});

test('tope: bloquea por lote y por mes antes de llamar a la API', async () => {
  const s = await fake(); const e = entorno(s.url, { topeLoteUsd: 0.02 });
  let r = await generarLote({ ...base, tamano: '1024x1024', aprobadoUsd: 9 }, e.c, e.cli);
  assert.equal(r.estado, 'bloqueado_tope'); assert.match(r.motivo, /por lote/);
  e.c.topeLoteUsd = 1; e.c.topeMesUsd = 0.05;
  writeFileSync(e.c.gasto, JSON.stringify({ ts: Date.now(), tipo: 'imagen', costo_usd: 0.03 }) + '\n');
  r = await generarLote({ ...base, tamano: '1024x1024', aprobadoUsd: 9 }, e.c, e.cli);
  assert.equal(r.estado, 'bloqueado_tope'); assert.match(r.motivo, /mes/); assert.equal(s.st.llamadas.length, 0); s.cerrar();
});

test('bloqueos: transparente en nivel sin alfa, sin precio y gratis con referencia', async () => {
  const s = await fake(); const e = entorno(s.url);
  assert.match((await generarLote({ ...base, nivel: 'imagen-google', aprobadoUsd: 9 }, e.c, e.cli)).motivo, /no soporta fondo transparente/);
  assert.match((await generarLote({ ...base, calidad: 'max', aprobadoUsd: 9 }, e.c, e.cli)).motivo, /sin precio/);
  assert.equal((await generarLote({ ...base, nivel: 'imagen-gratis', transparente: false, referencias: ['x.png'], aprobadoUsd: 0 }, e.c, e.cli)).estado, 'bloqueado'); s.cerrar();
});

test('variantes: usa /v1/images/edits con multipart y la referencia', async () => {
  const s = await fake(); const e = entorno(s.url);
  const ref = join(e.d, 'ref.png'); writeFileSync(ref, pngBueno());
  const r = await generarLote({ ...base, cantidad: 2, referencias: [ref], aprobadoUsd: 1 }, e.c, e.cli);
  assert.equal(r.estado, 'generado'); assert.equal(s.st.llamadas[0].url, '/v1/images/edits'); assert.match(s.st.llamadas[0].tipo, /multipart\/form-data/);
  assert.match(s.st.llamadas[0].cuerpo, /name="image"; filename="ref.png"/); s.cerrar();
});

test('nivel gratis: llamada directa a NVIDIA, costo 0, seed registrada', async () => {
  const s = await fake({ png: codificarPng(circulo(64, 64, NEGRO, { opaco: true }), { conAlfa: false }) }); const e = entorno(s.url);
  const r = await generarLote({ ...base, nivel: 'imagen-gratis', transparente: false, cantidad: 1, aprobadoUsd: 0, seed: 11 }, e.c, e.cli);
  assert.equal(r.estado, 'generado'); assert.equal(r.costo_real_usd, 0); assert.equal(s.st.auth[0], 'Bearer nv-prueba'); assert.equal(r.imagenes[0].seed, 7);
  assert.equal(JSON.parse(readFileSync(e.c.gasto, 'utf8')).proveedor, 'nvidia_imagen'); s.cerrar();
});

test('sin llave: error claro y registrado como sin_llave (no cuenta cupo en el medidor)', async () => {
  const s = await fake(); const e = entorno(s.url); e.cli.llave = '';
  const r = await generarLote({ ...base, aprobadoUsd: 1 }, e.c, e.cli);
  assert.equal(r.estado, 'error'); assert.match(r.error.mensaje, /falta IMAGEN_LITELLM_KEY/);
  assert.equal(JSON.parse(readFileSync(e.c.gasto, 'utf8')).error_tipo, 'sin_llave'); s.cerrar();
});

test('mcp: initialize, tools/list y tools/call (estimar y validar)', async () => {
  const i = await manejar({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
  assert.equal(i.result.serverInfo.name, 'code-os-imagen');
  const l = await manejar({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.deepEqual(l.result.tools.map((t) => t.name), ['imagen_estimar', 'imagen_generar', 'imagen_variantes', 'imagen_validar']);
  const e = await manejar({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'imagen_estimar', arguments: { nivel: 'imagen-media', tamano: '1024x1024', cantidad: 4, calidad: 'medium' } } }, { salida: '.', gasto: join(tmpdir(), 'no-existe-gasto.jsonl'), topeLoteUsd: 5, topeMesUsd: 50 });
  assert.equal(JSON.parse(e.result.content[0].text).estado, 'estimado');
  const d = mkdtempSync(join(tmpdir(), 'imagen-')); const p = join(d, 'a.png'); writeFileSync(p, pngBueno());
  const v = await manejar({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'imagen_validar', arguments: { archivo: p, tamano: '64x64', transparente: true } } });
  assert.equal(JSON.parse(v.result.content[0].text).ok, true);
  assert.equal(await manejar({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
});

test('mcp por stdio: proceso real responde a tools/list', async () => {
  const p = spawn(process.execPath, [new URL('../src/mcp.mjs', import.meta.url).pathname], { stdio: ['pipe', 'pipe', 'inherit'] });
  const linea = new Promise((ok) => p.stdout.once('data', (d) => ok(JSON.parse(d.toString().split('\n')[0]))));
  p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) + '\n');
  assert.equal((await linea).result.tools.length, 4); p.kill();
});
