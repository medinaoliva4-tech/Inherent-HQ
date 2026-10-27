// Pruebas del servidor de Strategy (Fase 3a): leen los archivos como texto (sin base ni red) y comprueban que las reglas
// del plan están donde deben estar. La conducta (PGlite) se probó a mano y no va en el repo.
// npm run test:strategy  (junto con scripts/test-strategy.mjs, la parte pura)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cleanBullseye } from '../api/_lib/content.js';
import * as diana from '../public/js/strategy/diana.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const leer = (rel) => fs.readFileSync(new URL('../' + rel, import.meta.url), 'utf8');
const estrategia = leer('api/_lib/estrategia.js'), entregables = leer('api/_lib/entregables.js'), avatares = leer('api/_lib/avatares.js'), content = leer('api/_lib/content.js'), viva = leer('public/js/estrategia-viva.js');
// El texto de una ruta: desde su on(...) hasta el siguiente on( (o el final del archivo).
const ruta = (src, metodo, patron) => {
  const ini = src.indexOf(`on('${metodo}', '${patron}'`); assert.ok(ini >= 0, `${metodo} ${patron}: no existe`);
  const sig = src.indexOf('\n  on(', ini + 10); return src.slice(ini, sig < 0 ? undefined : sig);
};

t('PUT estrategia/:slug/bullseye existe con el guard de Estrategia (y la marca personal solo para el CEO)', () => {
  const r = ruta(estrategia, 'PUT', 'estrategia/:slug/bullseye');
  assert.match(r, /accesoMarca\(req, res, slug, \{ write: true \}\)/);
  assert.match(estrategia, /async function accesoMarca[\s\S]*?guard\(req, res, 'estrategia', opts\)[\s\S]*?u\.role !== 'ceo'/);
  assert.match(estrategia, /async function acceso\([\s\S]*?guard\(req, res, 'estrategia', \{ write \}\)[\s\S]*?scoper\(u\)/);
  assert.match(r, /guardarDiana\(/); assert.match(r, /espejoDiana\(/); assert.match(r, /APROBADO/); assert.match(r, /SIN_FICHA/);
  assert.ok(!/client: true/.test(r));
});
t('guardarDiana (content.js) usa cleanBullseye, deja «audience» al día y escribe con db.update (v), no con upsert', () => {
  const f = content.slice(content.indexOf('export async function guardarDiana'), content.indexOf('export async function profile('));
  assert.match(f, /cleanBullseye\(crudo\)/); assert.match(f, /audienciaDe\(bx\)/); assert.match(f, /db\.update\('sources'/); assert.ok(!/upsert/.test(f));
});
t('Entregables: la oferta no se aprueba por su estado (409 APRUEBA_BLOQUE) y Brand Growth no cambia partes bloqueadas (403)', () => {
  assert.match(entregables, /APRUEBA_BLOQUE/); assert.match(entregables, /Se aprueba con el bloque Oferta \(solo el CEO\)/);
  assert.match(entregables, /cambiaBloqueado/); assert.match(entregables, /FUERA_DEL_ALCANCE/);
  const est = ruta(entregables, 'POST', 'entregables/:id/estado');
  assert.ok(est.indexOf('APRUEBA_BLOQUE') < est.indexOf('pasoPermitido'), 'APRUEBA_BLOQUE va antes de revisar el paso');
});
t('Entregables: la diana y el X-Ray se dejan en su casa al guardar (POST y PUT) y Strategy aprobada sale APROBADO en la lista', () => {
  assert.match(entregables, /dianaASuCasa/); assert.match(entregables, /xrayAViva/);
  assert.equal((entregables.match(/aSuCasa\(u,/g) || []).length >= 4, true, 'POST, PUT (con y sin cambios) llaman a aSuCasa');
  assert.match(entregables, /code: 'APROBADO', texto: TEXTO_APROBADA/); assert.match(entregables, /La estrategia está aprobada: solo lectura hasta que el CEO la reabra/);
});
t('Aprobar o reabrir Oferta/Modelo sella el entregable de Offer Architect con db.update (v), pide la v que leyó el CEO, corre faltas y reabre solo si ningún bloque queda aprobado', () => {
  const a = ruta(estrategia, 'POST', 'estrategia/:slug/:bloque/aprobar');
  assert.match(a, /sellarOferta\(slug, u, true, \{ v: x\.v \}\)/); assert.match(a, /sellarOferta\(slug, u, false\)/);
  assert.match(a, /!\(await otroDeOfertaAprobado\(slug, b\.id\)\)/, 'reabrir un bloque no regresa a Borrador el espejo si el otro sigue aprobado');
  assert.match(a, /res\.status\(r\.status\)\.json\(\{ error: r\.error, code: r\.code/, 'los 400 FALTA_V y FALTAS y el 409 salen tal cual');
  const f = estrategia.slice(estrategia.indexOf('export async function sellarOferta'), estrategia.indexOf('export async function ofertaAprobada'));
  assert.match(f, /db\.update\(COLL_ENT, cur\.id[\s\S]*?cur\.v/); assert.match(f, /aprobado: \{ por: u\.email, en: ahora\(\), version: cur\.version \}/);
  assert.match(f, /estado: 'Borrador', aprobado: null/); assert.ok(!/upsert/.test(f));
  assert.match(f, /'FALTA_V'/); assert.match(f, /Number\(v\) !== cur\.v/); assert.match(f, /malSello\(409, 'CONFLICTO'/);
  assert.match(f, /faltasDe\(cur, \{ nivelId: \(await nivelDeOferta\(slug\)\)\?\.id \}\)/); assert.match(f, /'FALTAS'/);
  assert.match(f, /conContenido\(cur\)\) return \{ ok: true, espejo: null \}/, 'un espejo vacío no se sella');
  assert.match(f, /\(await selladoDe\(slug\)\) \|\| \(await ultimoDe\('offer-architect', slug\)\)/, 'reabrir va al espejo con el OK (aprobado.version), no al más reciente a secas');
  assert.match(estrategia, /async function selladoDe\(slug\)[\s\S]*?esAprobado\(d\)[\s\S]*?aprobado\?\.en/);
});
t('Entregables: con la oferta aprobada ni un Borrador nuevo (POST y «Enviar a…») ni archivar el espejo la esquivan (409 APROBADO)', () => {
  assert.match(entregables, /async function ofertaCerrada\(res, slug\)[\s\S]*?ofertaAprobada\(slug\)[\s\S]*?code: 'APROBADO'/);
  const crear = ruta(entregables, 'POST', 'entregables');
  assert.match(crear, /tool\.id === 'offer-architect' && \(await ofertaCerrada\(res, slug\)\)/); assert.ok(crear.indexOf('ofertaCerrada') < crear.indexOf('limpiarEntregable'), 'se revisa antes de limpiar y guardar');
  const arch = ruta(entregables, 'POST', 'entregables/:id/archivar');
  assert.match(arch, /cur\.tool === 'offer-architect' && \(await ofertaCerrada\(res, cur\.client_slug\)\)/); assert.ok(arch.indexOf('ofertaCerrada') < arch.indexOf('guardar('), 'se revisa antes de archivar o desarchivar');
  assert.match(ruta(entregables, 'POST', 'entregables/:id/siguiente'), /nuevo\.tool === 'offer-architect' && \(await ofertaCerrada\(res, cur\.client_slug\)\)/);
  assert.match(ruta(entregables, 'PUT', 'entregables/:id'), /cambio\.version !== cur\.version && \(await ofertaCerrada\(res, cur\.client_slug\)\)/);
});
t('Entregables: una ficha sin nivel reconocido no deja cambiar stack, variaciones ni escalera (cae en Brand Growth); solo pasan «A la medida» y las marcas sin ficha', () => {
  const f = entregables.slice(entregables.indexOf('async function ofertaMal'), entregables.indexOf('async function ofertaCerrada'));
  assert.match(f, /const n = await nivelDeOferta\(slug\);\s*if \(!n \|\| n\.id === 'medida'\) return null;/); assert.ok(!/nivel\?\.id/.test(f), 'ya no se deja pasar por no reconocer el nivel');
  const n = estrategia.slice(estrategia.indexOf('export async function nivelDeOferta'), estrategia.indexOf('async function selladoDe'));
  assert.match(n, /if \(!f\.hay\) return null;/); assert.match(n, /id: 'growth', nombre: 'Brand Growth', supuesto: true/);
});
t('viva/aprobar: sin filas no se aprueba (400), cuenta las filas viejas y los items', () => {
  const r = ruta(estrategia, 'POST', 'estrategia/:slug/viva/aprobar');
  assert.match(r, /Sin filas no se aprueba/); assert.match(r, /rm\?\.items\?\.length \|\| rm\?\.filas\?\.length/); assert.match(r, /status\(400\)/);
});
t('PUT viva y viva/aprobar escriben con db.update y la v que leyeron (reintento y 409), nunca con upsert, y el parche no manda aprobado:null', () => {
  const put = ruta(estrategia, 'PUT', 'estrategia/:slug/viva'), ap = ruta(estrategia, 'POST', 'estrategia/:slug/viva/aprobar');
  for (const [n, r] of [['PUT viva', put], ['viva/aprobar', ap]]) {
    assert.ok(!/upsert/.test(r.replace(/\/\/.*$/gm, '')), `${n} no usa upsert`); assert.match(r, /for \(let i = 0; i < 2; i\+\+\)/, `${n} reintenta una vez`);
    assert.match(r, /escribe\(COLL, id, cur,/, `${n} escribe con la v de lo que leyó (db.update)`); assert.match(r, /code: 'CONFLICTO'/, `${n} responde 409 si no pudo`);
  }
  assert.ok(!/aprobado: null/.test(put.replace(/\/\/.*$/gm, '')), 'el parche de PUT viva no desaprueba nada (si estaba aprobada ya salió 409)');
  assert.match(put, /cur\?\.aprobado\) return res\.status\(409\)[\s\S]*?code: 'APROBADO'/);
  assert.match(ap, /\.\.\.cur, slug, bloque: 'viva', aprobado:/, 'aprobar conserva el resto del documento (viva, etc.)');
  assert.ok(ap.indexOf("'Sin filas no se aprueba'") < ap.indexOf('escribe('), 'las filas se revisan sobre el documento que se va a escribir');
});
t('Avatares: con la estrategia aprobada crear, cambiar y archivar da 409 APROBADO (también a Contenido); leer y aprobar o reabrir siguen abiertos', () => {
  assert.match(avatares, /import \{ estrategiaCerrada \} from '\.\/estrategia\.js'/);
  assert.match(avatares, /async function abre\(req, res, slug, write = false, cierra = write\)[\s\S]*?puedeVer\(u, slug\)[\s\S]*?write && cierra && \(await estrategiaCerrada\(slug\)\)[\s\S]*?code: 'APROBADO'/, 'el 409 va después del guard, la vista y el alcance (404)');
  assert.match(ruta(avatares, 'POST', 'avatares'), /abre\(req, res, slug, true\)/); assert.match(ruta(avatares, 'PUT', 'avatares/:id'), /abre\(req, res, cur\.profile, true\)/);
  assert.match(ruta(avatares, 'POST', 'avatares/:id/archivar'), /abre\(req, res, cur\.profile, true\)/);
  assert.match(ruta(avatares, 'POST', 'avatares/:id/aprobar'), /abre\(req, res, cur\.profile, true, false\)/, 'aprobar y reabrir (CEO) no cambian la ficha: pasan');
  assert.match(ruta(avatares, 'GET', 'avatares'), /abre\(req, res, slug\)/);
});
t('Avatares: guardAny de Contenido o Estrategia, con el mismo scoper, y el journey limpio', () => {
  assert.match(avatares, /const AREAS = \['content', 'estrategia'\]/); assert.match(avatares, /guardAny\(req, res, AREAS, \{ write \}\)/);
  assert.ok(!/\bguard\(/.test(avatares.replace(/guardAny\(/g, '')), 'ya no usa guard() de un solo área');
  assert.match(avatares, /scoper\(u\)/); assert.match(avatares, /limpiarJourney\(b\.journey\)/);
  assert.match(avatares, /'journey' in b/);
});
t('Ninguna ruta nueva usa { client: true } ni db.upsert en lo que lleva historial', () => {
  for (const [n, src] of [['entregables.js', entregables], ['avatares.js', avatares]]) { assert.ok(!/client: true/.test(src), n); assert.ok(!/db\.upsert/.test(src), n); }
  const nuevo = estrategia.slice(estrategia.indexOf('// ---------- Strategy en «deliverables»'), estrategia.indexOf('// ---------- El texto que se le da a Laya')).replace(/\/\/.*$/gm, ''); // sin los comentarios
  assert.ok(nuevo.length > 1000 && !/upsert/.test(nuevo) && !/client: true/.test(nuevo), 'los espejos de Strategy no usan upsert');
  assert.ok(!/client: true/.test(ruta(estrategia, 'PUT', 'estrategia/:slug/bullseye')));
});
t('limpiarParche acepta roadmap.items y roadmap.hitos con el módulo puro del roadmap', () => {
  assert.match(viva, /import \{ limpiarItems, limpiarHitos(, areaDe)? \} from '\.\/strategy\/roadmap\.js'/);
  assert.match(viva, /limpiarItems\(rm\.items\)/); assert.match(viva, /limpiarHitos\(h\)/);
});
t('La diana de la herramienta pasa por cleanBullseye con la misma forma (los mensajes se quedan en el entregable)', () => {
  const x = { center: 'Dueña de un café de especialidad que quiere llenar su local entre semana', buyer: 'ella misma', mensajes: [{ anillo: 0, mensaje: 'Tu café lleno un martes', angulo: 'Deseo' }],
    rings: [0, 1, 2, 3, 4].map((i) => ({ label: `Nivel ${i}`, relaxed: i ? 'la ciudad' : '', size: '1x', conversion: 'alta', competition: 'media', search: ['café de especialidad'] })), mix: [{ topic: 'a' }, { topic: 'b' }, { topic: 'c' }, { topic: 'd' }, { topic: 'e' }] };
  const c = diana.limpiar(x), bx = cleanBullseye(c);
  assert.ok(bx, 'cleanBullseye acepta la diana limpia'); assert.equal(bx.rings.length, 5); assert.equal(bx.center, c.center);
  assert.equal('mensajes' in bx, false, 'sources conserva la forma de siempre (el conector devuelve la misma)');
  assert.equal(c.mensajes[0].angulo, 'Deseo');
  assert.equal(cleanBullseye(diana.limpiar({})), null, 'una diana vacía no se pasa a sources');
});
t('Avatares: PUT y aprobar respetan la v que se leyó (409 si cambió); sin v usan la de ahora', () => {
  assert.match(avatares, /const vDe = \(b, cur\) =>/);
  assert.match(ruta(avatares, 'PUT', 'avatares/:id'), /vDe\(b, cur\)/); assert.match(ruta(avatares, 'POST', 'avatares/:id/aprobar'), /vDe\(b, cur\)/);
});
t('Integración: el hero se repinta (os:estrategia) y el panel de Estrategia lee las filas nuevas sin pintar hitos objeto como dinero', () => {
  assert.match(leer('public/js/strategy/roadmap-ui.js'), /dispatchEvent\(new Event\('os:estrategia'\)\)/);
  assert.match(leer('public/js/strategy/xray-ui.js'), /dispatchEvent\(new Event\('os:estrategia'\)\)/);
  const panel = leer('public/js/estrategia-viva-ui.js');
  assert.match(panel, /aFilas\(rm\.items \|\| \[\]\)/); assert.match(panel, /typeof x === 'number'/);
  assert.ok(!/rm\.hitos\.map/.test(panel), 'el panel ya no hace dinero() a cualquier hito');
});
console.log(`\n${ok} pruebas pasaron`);
