// Lote de imágenes: estimar, comprobar topes, generar N variantes, validar, guardar con metadatos y registrar el gasto.
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { estimarLote, costoReal, TABLA } from './precios.mjs';
import { resolverNivel, generarUna, configDesdeEnv } from './cliente.mjs';
import { validarPng } from './validar.mjs';
import { parseTamano } from './precios.mjs';

export const PROVEEDOR_CUOTAS = { openai: 'openai_imagen', google: 'google_imagen', nvidia: 'nvidia_imagen' };
const letras = 'abcdefghijklmnopqrstuvwxyz';
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function configLote(env = process.env) {
  return {
    salida: env.IMAGEN_SALIDA ?? './imagenes',
    gasto: env.IMAGEN_GASTO ?? './gasto.jsonl',
    topeLoteUsd: env.IMAGEN_TOPE_LOTE_USD ? Number(env.IMAGEN_TOPE_LOTE_USD) : 5,
    topeMesUsd: env.IMAGEN_TOPE_MES_USD ? Number(env.IMAGEN_TOPE_MES_USD) : 50,
    cuotasUrl: env.CUOTAS_URL ?? null, cuotasToken: env.CUOTAS_TOKEN ?? null,
  };
}

/** Suma del gasto de imágenes del mes UTC en gasto.jsonl (costo real si existe, si no el estimado). */
export function gastoDelMes(ruta, ahora = Date.now()) {
  if (!existsSync(ruta)) return 0;
  const d = new Date(ahora); const desde = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  let s = 0;
  for (const l of readFileSync(ruta, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    try { const e = JSON.parse(l); if (e.tipo === 'imagen' && e.ts >= desde) s += e.costo_usd ?? 0; } catch { /* línea rota: se ignora */ }
  }
  return +s.toFixed(6);
}

export function estimar(p) {
  const nv = resolverNivel(p.nivel);
  const e = estimarLote({ modelo: nv.modelo, calidad: p.calidad ?? nv.calidad, tamano: p.tamano, cantidad: p.cantidad ?? 1, precioUsd: p.precioUsd });
  return { ...e, nivel: nv.nivel, transparente_soportado: nv.transparente };
}

const siguienteVersion = (dir, prefijo) => {
  if (!existsSync(dir)) return 1;
  let max = 0;
  for (const f of readdirSync(dir)) { const m = new RegExp(`^${prefijo}-v(\\d+)-[a-z]\\.png$`).exec(f); if (m) max = Math.max(max, Number(m[1])); }
  return max + 1;
};

async function avisarCuotas(cfg, ev, f) {
  if (!cfg.cuotasUrl) return;
  try { await f(`${cfg.cuotasUrl.replace(/\/$/, '')}/evento`, { method: 'POST', headers: { 'content-type': 'application/json', ...(cfg.cuotasToken ? { authorization: `Bearer ${cfg.cuotasToken}` } : {}) }, body: JSON.stringify(ev), signal: AbortSignal.timeout(3000) }); } catch { /* medir nunca rompe */ }
}

/**
 * p: { nivel, prompt, tamano, cantidad, calidad, transparente, paleta, tolerancia, pieza, asset, referencias:[ruta], seed,
 *      aprobadoUsd (obligatorio para generar), precioUsd, estimarSolo }
 * c: configLote() ; cliente: configDesdeEnv() ; f: fetch
 */
export async function generarLote(p, c = configLote(), cliente = configDesdeEnv(), f = globalThis.fetch, ahora = () => Date.now()) {
  const nv = resolverNivel(p.nivel);
  const tamano = p.tamano ?? '1024x1024'; const cantidad = p.cantidad ?? 4; const transparente = !!p.transparente;
  parseTamano(tamano);
  const est = estimar({ ...p, tamano, cantidad });
  const base = { nivel: nv.nivel, modelo: nv.modelo, tamano, cantidad, estimacion: est };
  if (!est.ok) return { ...base, estado: 'bloqueado', motivo: est.motivo };
  if (transparente && !nv.transparente) return { ...base, estado: 'bloqueado', motivo: `${nv.nivel} (${nv.modelo}) no soporta fondo transparente; use imagen-media o imagen-alta` };
  if (p.referencias?.length && !nv.edita) return { ...base, estado: 'bloqueado', motivo: `${nv.nivel} no edita con imagen de referencia` };
  const mes = gastoDelMes(c.gasto, ahora());
  const topes = { lote_usd: c.topeLoteUsd, mes_usd: c.topeMesUsd, gastado_mes_usd: mes };
  if (est.total_usd > c.topeLoteUsd) return { ...base, estado: 'bloqueado_tope', motivo: `el lote (${est.total_usd} USD) excede el tope por lote (${c.topeLoteUsd} USD)`, topes };
  if (mes + est.total_usd > c.topeMesUsd) return { ...base, estado: 'bloqueado_tope', motivo: `con este lote el mes pasaría de ${c.topeMesUsd} USD (ya van ${mes})`, topes };
  if (p.estimarSolo) return { ...base, estado: 'estimado', topes };
  if (typeof p.aprobadoUsd !== 'number' || p.aprobadoUsd < est.total_usd) {
    return { ...base, estado: 'falta_ok', motivo: `falta el OK de la persona: confirme un costo aprobado ≥ ${est.total_usd} USD`, topes };
  }

  const dir = c.salida; mkdirSync(dir, { recursive: true });
  const pieza = slug(p.pieza ?? 'sin-pieza'); const asset = slug(p.asset ?? 'asset'); const prefijo = `${pieza}-${asset}`;
  const ver = siguienteVersion(dir, prefijo);
  const referencias = (p.referencias ?? []).map((r) => ({ nombre: basename(r), buf: readFileSync(r) }));
  const [W, H] = tamano.split('x').map(Number);
  const lote = randomUUID(); const salida = []; let real = 0; let realFuente = 'api'; let error = null; let http = 200;

  for (let i = 0; i < cantidad; i++) {
    let r;
    try { r = await generarUna({ nivel: nv.nivel, prompt: p.prompt, tamano, calidad: p.calidad ?? nv.calidad, transparente, referencias, seed: p.seed !== undefined ? p.seed + i : undefined }, cliente, f); }
    catch (e) { error = { mensaje: e.message, http: e.http ?? null, sin_llave: !!e.sinLlave }; http = e.http ?? (e.sinLlave ? 0 : 500); break; }
    const nombre = `${prefijo}-v${ver}-${letras[i]}.png`;
    const validacion = validarPng(r.buf, { ancho: W, alto: H, transparente, paleta: p.paleta, tolerancia: p.tolerancia });
    const r1 = r.costo_header_usd ?? costoReal({ modelo: nv.modelo, usage: r.usage });
    let costoImg = r1; let fuente = r.costo_header_usd !== null ? 'litellm' : r1 !== null ? 'tokens' : 'estimado';
    if (costoImg === null) { costoImg = est.por_imagen_usd; realFuente = 'mixto: parte estimada'; }
    real += costoImg;
    writeFileSync(join(dir, nombre), r.buf);
    const meta = {
      archivo: nombre, fecha: new Date(ahora()).toISOString(), lote, pieza: p.pieza ?? null, asset: p.asset ?? null,
      prompt: p.prompt, prompt_revisado: r.revisado ?? null, nivel: nv.nivel, modelo: nv.modelo, tamano, calidad: p.calidad ?? nv.calidad, transparente,
      referencias: referencias.map((x) => x.nombre), seed: r.seed, costo_estimado_usd: est.por_imagen_usd, costo_real_usd: +costoImg.toFixed(6), costo_real_fuente: fuente,
      bytes: r.buf.length, sha256: createHash('sha256').update(r.buf).digest('hex'), validacion,
    };
    writeFileSync(join(dir, nombre.replace(/\.png$/, '.json')), JSON.stringify(meta, null, 2));
    salida.push({ archivo: join(dir, nombre), ok: validacion.ok, validacion, costo_real_usd: meta.costo_real_usd, seed: r.seed });
  }

  const proveedor = PROVEEDOR_CUOTAS[TABLA.modelos[nv.modelo]?.proveedor] ?? 'otro_imagen';
  // Formato compatible con code-os/cuotas (eventos.jsonl): ts, proveedor, costo_usd, http, error_tipo; el resto son campos extra.
  const ev = { ts: ahora(), proveedor, tipo: 'imagen', modelo: nv.modelo, nivel: nv.nivel, http, costo_usd: +real.toFixed(6), costo_estimado_usd: est.total_usd, cantidad: salida.length, cantidad_pedida: cantidad, pieza: p.pieza ?? null, asset: p.asset ?? null, lote, tamano, calidad: p.calidad ?? nv.calidad, costo_fuente: realFuente, ...(error ? { error_tipo: error.sin_llave ? 'sin_llave' : 'error', error: error.mensaje } : {}) };
  mkdirSync(join(c.gasto, '..'), { recursive: true });
  appendFileSync(c.gasto, JSON.stringify(ev) + '\n');
  await avisarCuotas(c, ev, f);
  return { ...base, estado: error ? (salida.length ? 'parcial' : 'error') : 'generado', lote, version: ver, imagenes: salida, costo_real_usd: +real.toFixed(6), error, topes: { ...topes, gastado_mes_usd: +(mes + real).toFixed(6) } };
}
