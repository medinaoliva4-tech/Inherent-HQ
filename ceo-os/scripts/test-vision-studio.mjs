// Studio (servidor): retención y clips por /api/studio/*, muestras reales y calibración (solo CEO/COO).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vision-studio-'));
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = path.join(tmp, 'db'); process.env.LOCAL_REPO = path.join(tmp, 'repo');
process.env.SESSION_SECRET = 'vision-test-only-secret-01234567890123456789'; process.env.ADMIN_EMAILS = 'ceo@inherentglobal.com';
const db = await import('../api/_lib/db.js'), session = await import('../api/_lib/session.js'), api = (await import('../api/index.js')).default;
const R = await import('../public/js/studio/retencion.js');
let count = 0; const test = async (n, fn) => { await fn(); console.log('✓', n); count++; };
const email = (r) => `${r}@inherentglobal.com`;
async function req(role, route, method = 'POST', b = {}) {
  const headers = { host: 'localhost', 'x-ceoos': '1' }, jar = new Map(), res = { statusCode: 200, getHeader: (k) => jar.get(k), setHeader: (k, v) => jar.set(k, v), status(n) { this.statusCode = n; return this; }, json(x) { this.data = x; }, writeHead(n) { this.statusCode = n; return this; }, write() {}, end() {} };
  const r = { url: `/api/${route}`, method, headers, body: b, query: {}, params: {} }; session.issue(r, res, { email: email(role) }); headers.cookie = jar.get('Set-Cookie').split(';')[0];
  await api(r, res); return { status: res.statusCode, data: res.data };
}
for (const r of ['ceo', 'coo', 'team', 'ajeno']) await db.create('team', { role: r === 'ajeno' ? 'client' : r, roles: [r === 'ajeno' ? 'client' : r] }, 'fixture', email(r));
await db.create('settings', { views: { coo: { content: 'edita' }, team: { content: 'edita' }, ajeno: {} } }, 'fixture', 'role_views');
const GUION = '¿Sabías que el 80% de los reels pierde a la gente en 3 segundos? Nadie te lo dice, pero es un error caro. Hoy te muestro 3 cosas que cambian todo. Por eso funciona: tu cerebro odia dejar algo sin resolver. ¿Y tú, qué vas a cambiar hoy?';

await test('retención: de un guion sale la curva, las caídas y la evidencia honesta', async () => {
  const r = await req('team', 'studio/retencion', 'POST', { texto: GUION }); assert.equal(r.status, 200); assert.ok(r.data.curva.length > 5); assert.ok(r.data.resumen.gancho >= 0.4); assert.match(r.data.evidencia.etiqueta, /SIN calibrar/);
});
await test('retención: entrada vacía o gigante se rechaza; sin permiso a Content, no entra', async () => {
  assert.equal((await req('team', 'studio/retencion', 'POST', {})).status, 400); assert.equal((await req('team', 'studio/retencion', 'POST', { srt: 'x'.repeat(300_000) })).status, 200, 'se recorta, no revienta');
  assert.ok([403, 404].includes((await req('ajeno', 'studio/retencion', 'POST', { texto: GUION })).status));
});
await test('clips: de una transcripción con tiempos salen los mejores momentos', async () => {
  const srt = Array.from({ length: 12 }, (_, i) => `${i + 1}\n00:00:${String(i * 6).padStart(2, '0')},000 --> 00:00:${String(i * 6 + 5).padStart(2, '0')},000\n${i === 4 ? '¿Sabías que nadie te cuenta este error caro?' : 'Es un tema importante y hay muchas formas con calma.'} ${i === 5 ? 'Mira, tres cosas cambian todo.' : ''}.`).join('\n\n');
  const r = await req('team', 'studio/clips', 'POST', { srt, minS: 10, maxS: 40, n: 2 }); assert.equal(r.status, 200); assert.ok(Array.isArray(r.data.clips));
});
const entrada = (i) => { const l = R.lineaDeTiempoDesdeTexto(`${GUION} ${'Y luego fuimos a la casa. '.repeat(i % 4)}`); return { segmentos: l.segmentos, duracion: l.duracion }; };
await test('muestras reales: se guardan validadas; con pocas, calibrar NO inventa', async () => {
  const mal = await req('team', 'studio/retencion/real', 'POST', { entrada: entrada(1), real: [{ t: 1, s: 5 }] }); assert.equal(mal.status, 400);
  for (let i = 0; i < 3; i++) { const e = entrada(i), real = R.analizar(e).curva.map((c) => ({ t: c.t + 1, s: c.retencion })); assert.equal((await req('team', 'studio/retencion/real', 'POST', { entrada: e, real, plataforma: 'instagram' })).status, 200); }
  assert.equal((await req('team', 'studio/retencion/calibrar')).status, 403);
  const c = await req('coo', 'studio/retencion/calibrar'); assert.equal(c.status, 200); assert.equal(c.data.calibrado, false); assert.equal(c.data.muestras, 3);
});
await test('calibrar con suficientes muestras reales: se guarda el modelo SOLO si mejora fuera de muestra, y el análisis lo usa', async () => {
  const VERDAD = { pesos: { ritmo: 0.05, cortes: 0.12, emocion: 0.4, novedad: 0.08, tension: 0.2, directo: 0.1, relleno: 0.05 }, riesgo: { a: 0.02, b: 0.12, tau: 2.2 } };
  const POOL = ['¿Sabías que el 70% pierde dinero así?', 'Nadie te cuenta este error caro.', 'Bueno, eh, o sea, es un tema importante.', 'Por eso funciona: tu cerebro odia lo inconcluso.', '¡Increíble! Gana el doble sin miedo.', 'Y luego fuimos a la casa y luego volvimos.', '¿Y tú qué vas a cambiar?'];
  for (let i = 0; i < 10; i++) { const txt = Array.from({ length: 7 }, (_, k) => POOL[(i * 3 + k * 5) % POOL.length]).join(' '), l = R.lineaDeTiempoDesdeTexto(txt), e = { segmentos: l.segmentos, duracion: l.duracion, cortes: Array.from({ length: Math.floor(l.duracion / (2 + (i % 3))) }, (_, k) => (k + 1) * (2 + (i % 3))) };
    const real = R.analizar(e, VERDAD).curva.map((c) => ({ t: c.t + 1, s: c.retencion })); await req('team', 'studio/retencion/real', 'POST', { entrada: e, real }); }
  const c = await req('ceo', 'studio/retencion/calibrar'); assert.equal(c.status, 200); assert.equal(c.data.muestras, 13); assert.equal(c.data.calibrado, true, c.data.motivo);
  const m = await req('team', 'studio/retencion/modelo', 'GET'); assert.equal(m.data.modelo.calibrado, true); assert.equal(m.data.muestras, 13);
  const a = await req('team', 'studio/retencion', 'POST', { texto: GUION }); assert.match(a.data.evidencia.etiqueta, /calibrado con retención real/); assert.equal(a.data.evidencia.confianza, 'media');
});
await test('las colecciones de Studio no salen por /api/db', async () => { for (const m of ['GET', 'POST']) assert.ok([403, 404].includes((await req('ceo', 'db/ret_muestras', m, { x: 1 })).status)); });
console.log(`${count} pruebas de Studio (servidor) OK`);
