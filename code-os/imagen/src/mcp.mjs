#!/usr/bin/env node
// Servidor MCP stdio mínimo (JSON-RPC por líneas). Herramientas: imagen_estimar, imagen_generar, imagen_variantes, imagen_validar.
import { createInterface } from 'node:readline';
import { readFileSync } from 'node:fs';
import { generarLote, estimar, configLote } from './lote.mjs';
import { validarPng } from './validar.mjs';
import { NIVELES } from './cliente.mjs';

const niveles = Object.keys(NIVELES);
const comunes = {
  nivel: { type: 'string', enum: niveles, description: 'imagen-alta (transparencia + edición precisa), imagen-media (diario), imagen-google (opaco), imagen-gratis (borrador sin alfa)' },
  tamano: { type: 'string', description: 'ANCHOxALTO exacto, p. ej. 1080x1350' },
  cantidad: { type: 'integer', minimum: 1, maximum: 8, description: 'variantes (3 a 4 recomendado)' },
  calidad: { type: 'string', description: 'low|medium|high para gpt-image; 1K/2K/4K se deduce del tamaño en Google' },
  transparente: { type: 'boolean', description: 'PNG con fondo transparente (solo imagen-alta/media)' },
  paleta: { type: 'array', items: { type: 'string' }, description: 'hex de la paleta de marca para validar' },
};
const generacion = {
  ...comunes,
  prompt: { type: 'string' }, pieza: { type: 'string', description: 'id de la pieza, p. ej. ig-oct-03' }, asset: { type: 'string', description: 'nombre del asset, p. ej. ondas' },
  aprobado_usd: { type: 'number', description: 'costo que la persona aprobó para este lote. Sin él NO se genera: primero llama imagen_estimar y pide el OK.' },
  salida: { type: 'string', description: 'carpeta de destino (por defecto IMAGEN_SALIDA)' },
};
export const HERRAMIENTAS = [
  { name: 'imagen_estimar', description: 'Calcula el costo de un lote SIN generar y dice si pasa los topes. Úsala siempre antes de generar y muestra el total a la persona.', inputSchema: { type: 'object', properties: comunes, required: ['nivel', 'tamano', 'cantidad'] } },
  { name: 'imagen_generar', description: 'Genera N variantes (PNG), las valida, las guarda con metadatos y registra el gasto. Requiere aprobado_usd (el OK de la persona). Nunca para logos ni personas reales.', inputSchema: { type: 'object', properties: generacion, required: ['nivel', 'prompt', 'tamano', 'cantidad', 'pieza', 'asset', 'aprobado_usd'] } },
  { name: 'imagen_variantes', description: 'Variantes de una imagen existente (edición con referencia). Mismo contrato de costo que imagen_generar.', inputSchema: { type: 'object', properties: { ...generacion, referencias: { type: 'array', items: { type: 'string' }, description: 'rutas de PNG de referencia' } }, required: ['nivel', 'prompt', 'tamano', 'cantidad', 'pieza', 'asset', 'aprobado_usd', 'referencias'] } },
  { name: 'imagen_validar', description: 'Valida un PNG: tamaño exacto, canal alfa, esquinas transparentes, sin halo, paleta aproximada y peso.', inputSchema: { type: 'object', properties: { archivo: { type: 'string' }, tamano: comunes.tamano, transparente: comunes.transparente, paleta: comunes.paleta }, required: ['archivo'] } },
];

const aP = (a) => ({ nivel: a.nivel, prompt: a.prompt, tamano: a.tamano, cantidad: a.cantidad, calidad: a.calidad, transparente: !!a.transparente, paleta: a.paleta, pieza: a.pieza, asset: a.asset, referencias: a.referencias, aprobadoUsd: a.aprobado_usd });

export async function llamar(nombre, a, c = configLote(), f = globalThis.fetch) {
  if (a.salida) c = { ...c, salida: a.salida };
  if (nombre === 'imagen_estimar') return generarLote({ ...aP(a), estimarSolo: true }, c, undefined, f);
  if (nombre === 'imagen_generar') return generarLote({ ...aP(a), referencias: undefined }, c, undefined, f);
  if (nombre === 'imagen_variantes') return generarLote(aP(a), c, undefined, f);
  if (nombre === 'imagen_validar') { const [w, h] = (a.tamano ?? '').split('x').map(Number); return validarPng(readFileSync(a.archivo), { ancho: w || undefined, alto: h || undefined, transparente: !!a.transparente, paleta: a.paleta }); }
  throw new Error(`herramienta desconocida: ${nombre}`);
}

export async function manejar(msg, c, f) {
  const { id, method, params } = msg; const ok = (result) => ({ jsonrpc: '2.0', id, result }); const err = (code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
  if (method === 'initialize') return ok({ protocolVersion: params?.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'code-os-imagen', version: '0.1.0' } });
  if (method === 'tools/list') return ok({ tools: HERRAMIENTAS });
  if (method === 'ping') return ok({});
  if (method === 'tools/call') {
    try { const r = await llamar(params.name, params.arguments ?? {}, c, f); return ok({ content: [{ type: 'text', text: JSON.stringify(r, null, 2) }], isError: ['bloqueado', 'bloqueado_tope', 'error'].includes(r.estado) }); }
    catch (e) { return ok({ content: [{ type: 'text', text: `error: ${e.message}` }], isError: true }); }
  }
  if (id === undefined) return null; // notificaciones (notifications/initialized…)
  return err(-32601, `método no soportado: ${method}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rl = createInterface({ input: process.stdin });
  rl.on('line', async (l) => {
    if (!l.trim()) return;
    let m; try { m = JSON.parse(l); } catch { return process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON inválido' } }) + '\n'); }
    const r = await manejar(m); if (r) process.stdout.write(JSON.stringify(r) + '\n');
  });
}
