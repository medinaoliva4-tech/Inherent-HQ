#!/usr/bin/env node
// CLI: imagen generar|estimar|variantes|validar  (ver docs/imagen.md)
import { readFileSync } from 'node:fs';
import { generarLote, estimar, configLote } from './lote.mjs';
import { validarPng } from './validar.mjs';
import { NIVELES } from './cliente.mjs';

const AYUDA = `uso:
  imagen generar  --nivel imagen-media --prompt "..." --tamano 1080x1350 [--n 4] [--transparente] [--paleta "#0E0E0E,#F2EBDD"]
                  --pieza ig-oct-03 --asset ondas [--salida ./generados] [--ref ref.png] --ok-usd 0.06
  imagen generar ... --estimar     calcula el costo sin generar (no necesita --ok-usd)
  imagen estimar  --nivel imagen-alta --tamano 1024x1024 --n 4 [--calidad high]
  imagen variantes --ref asset.png --prompt "misma forma, otro ritmo" --nivel imagen-media --n 3 --ok-usd 0.05
  imagen validar  archivo.png [--tamano 1080x1350] [--transparente] [--paleta "#hex,#hex"]
niveles: ${Object.keys(NIVELES).join(', ')}
topes (env): IMAGEN_TOPE_LOTE_USD (def. 5) · IMAGEN_TOPE_MES_USD (def. 50) · gasto en IMAGEN_GASTO`;

function flags(argv) {
  const o = { _: [], ref: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { o._.push(a); continue; }
    const k = a.slice(2); const bool = ['transparente', 'estimar', 'json'].includes(k);
    const v = bool ? true : argv[++i];
    if (k === 'ref') o.ref.push(v); else o[k] = v;
  }
  return o;
}

export function aParams(f) {
  return {
    nivel: f.nivel ?? 'imagen-media', prompt: f.prompt, tamano: f.tamano ?? '1024x1024', cantidad: f.n ? Number(f.n) : 4, calidad: f.calidad,
    transparente: !!f.transparente, paleta: f.paleta ? f.paleta.split(',').map((s) => s.trim()) : undefined, tolerancia: f.tolerancia ? Number(f.tolerancia) : undefined,
    pieza: f.pieza, asset: f.asset, referencias: f.ref, seed: f.seed !== undefined ? Number(f.seed) : undefined,
    aprobadoUsd: f['ok-usd'] !== undefined ? Number(f['ok-usd']) : undefined, precioUsd: f['precio-usd'] !== undefined ? Number(f['precio-usd']) : undefined, estimarSolo: !!f.estimar,
  };
}

async function main(argv) {
  const [cmd, ...resto] = argv; const f = flags(resto);
  const c = configLote(); if (f.salida) c.salida = f.salida; if (f['tope-lote']) c.topeLoteUsd = Number(f['tope-lote']);
  const out = (o) => console.log(JSON.stringify(o, null, 2));
  if (cmd === 'estimar') return out(estimar(aParams(f)));
  if (cmd === 'validar') {
    const arch = f._[0]; if (!arch) throw new Error('falta el archivo');
    const [w, h] = (f.tamano ?? '').split('x').map(Number);
    const r = validarPng(readFileSync(arch), { ancho: w || undefined, alto: h || undefined, transparente: !!f.transparente, paleta: f.paleta?.split(',') });
    out(r); return r.ok ? 0 : 1;
  }
  if (cmd === 'generar' || cmd === 'variantes') {
    const p = aParams(f);
    if (!p.prompt) throw new Error('falta --prompt');
    if (cmd === 'variantes' && !p.referencias.length) throw new Error('variantes necesita --ref');
    const r = await generarLote(p, c);
    out(r); return ['generado', 'estimado'].includes(r.estado) ? 0 : 2;
  }
  console.log(AYUDA); return cmd ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2)).then((c) => process.exit(c ?? 0), (e) => { console.error(`error: ${e.message}`); process.exit(1); });
