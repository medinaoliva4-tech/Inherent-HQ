#!/usr/bin/env node
// Vigía: radar de tecnología de Inherent. Trae lo nuevo de fuentes.json, filtra por temas.json,
// deduplica y deja informes/AAAA-MM-DD.md. Uso:
//   node code-os/vigia/vigia.mjs [--sin-ia] [--nivel nivel-bajo] [--desde 2026-11-03] [--fecha 2026-11-10] [--seco]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TIPOS, enriquecerRepos, ghApi } from './lib/fuentes.mjs';
import { deduplicar, clasificar } from './lib/clasificar.mjs';
import { configIa, clasificarConIa } from './lib/ia.mjs';
import { renderInforme, extraerCurado } from './lib/informe.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIA = 864e5;

export function leerArgs(argv) {
  const a = { sinIa: false, seco: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--sin-ia') a.sinIa = true;
    else if (k === '--seco') a.seco = true;
    else if (['--nivel', '--desde', '--fecha', '--dir', '--max-llamadas'].includes(k)) a[k.slice(2).replace('-l', 'L')] = argv[++i];
    else throw new Error(`Opción desconocida: ${k}`);
  }
  return a;
}

const leerJson = async (p, def) => { try { return JSON.parse(await readFile(p, 'utf8')); } catch { return def; } };

/** Corre el radar. `deps` permite inyectar fetch/gh en pruebas. */
export async function correr(opc = {}, deps = {}) {
  const dir = opc.dir ?? AQUI;
  const ahora = deps.ahora ?? Date.now();
  const fecha = opc.fecha ?? new Date(ahora).toISOString().slice(0, 10);
  const { fuentes } = await leerJson(join(dir, 'fuentes.json'), { fuentes: [] });
  const temas = await leerJson(join(dir, 'temas.json'), null);
  if (!temas) throw new Error('Falta temas.json');
  const rutaEstado = join(dir, 'estado', 'estado.json');
  const estado = await leerJson(rutaEstado, { ultima_corrida: null, vistos: {} });
  const desde = opc.desde ? new Date(opc.desde).toISOString() : estado.ultima_corrida ?? new Date(ahora - 7 * DIA).toISOString();

  const gh = deps.gh ?? ghApi;
  const fetchFn = deps.fetchFn ?? fetch;
  const errores = [];
  let brutos = [];
  const activas = fuentes.filter((f) => f.activa !== false);
  for (const f of activas) {
    const traer = TIPOS[f.tipo];
    if (!traer) { errores.push(`${f.id}: tipo desconocido ${f.tipo}`); continue; }
    // Pausa opcional por fuente (Reddit limita a quien pide seguido sin cuenta).
    if (f.pausa_ms) await (deps.dormir ?? ((ms) => new Promise((ok) => setTimeout(ok, ms))))(f.pausa_ms);
    try {
      const r = await traer(f, { desde, gh, fetchFn });
      brutos.push(...r.map((x) => ({ ...x, peso: f.peso ?? 1 })));
    } catch (e) { errores.push(`${f.id}: ${e.message}`); }
  }

  let items = deduplicar(brutos, estado.vistos);
  if (!opc.sinRepos) await enriquecerRepos(items, { gh });
  items = items.map((it) => clasificar(it, temas, it.peso));

  const cfg = configIa(deps.env ?? process.env, { sinIa: opc.sinIa, nivel: opc.nivel, maxLlamadas: opc.maxLlamadas });
  let ia = null;
  if (cfg) {
    const relevantes = items.filter((it) => it.departamentos.length).sort((a, b) => b.puntaje - a.puntaje);
    const r = await clasificarConIa(relevantes, temas, cfg, fetchFn);
    const porId = new Map(r.items.map((x) => [x.id, x]));
    items = items.map((x) => porId.get(x.id) ?? x);
    ia = { modelo: cfg.modelo, llamadas: r.llamadas };
    errores.push(...r.errores.map((e) => `IA ${e}`));
  }

  const ruta = join(dir, 'informes', `${fecha}.md`);
  let previo = '';
  try { previo = await readFile(ruta, 'utf8'); } catch {}
  const texto = renderInforme({ fecha, desde, items, temas, fuentes: activas, errores, ia, curado: extraerCurado(previo), ahora });

  if (!opc.seco) {
    await mkdir(join(dir, 'informes'), { recursive: true });
    await writeFile(ruta, texto);
    const vistos = { ...estado.vistos };
    for (const it of items) vistos[it.id] = fecha;
    for (const [k, v] of Object.entries(vistos)) if (Date.parse(v) < ahora - 120 * DIA) delete vistos[k];
    await mkdir(dirname(rutaEstado), { recursive: true });
    await writeFile(rutaEstado, JSON.stringify({ ultima_corrida: new Date(ahora).toISOString(), vistos }, null, 1));
  }
  return { ruta, texto, items, errores };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = leerArgs(process.argv.slice(2));
  correr(args).then(({ ruta, items, errores, texto }) => {
    if (args.seco) console.log(texto);
    console.error(`Vigía: ${items.length} ítems nuevos → ${args.seco ? '(seco, no se escribió)' : ruta}`);
    if (errores.length) console.error(`Fuentes con error:\n- ${errores.join('\n- ')}`);
  }).catch((e) => { console.error(e.message); process.exit(1); });
}
