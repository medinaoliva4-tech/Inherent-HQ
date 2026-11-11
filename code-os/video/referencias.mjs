#!/usr/bin/env node
// Biblioteca de videos de referencia: videos ya hechos (de otros o propios) para jalar o imitar.
// Solo metadatos y enlace: nunca se guardan videos de terceros en el repo.
//
// { id, titulo, autor, fuente_url, plataforma: 'youtube'|'tiktok'|'instagram'|'propio', duracion (s),
//   miniatura_url?, por_que_funciona, estilo_sugerido (id del catálogo), origen: 'curada'|'radar'|'propio',
//   metricas?: { puntaje, winner }, breakdown?: <desglose de desglose.mjs> }
//
// Semilla curada: code-os/video/referencias/*.json (repo). Lo que alimenta el radar y los desgloses
// van en <datos>/referencias/*.json y pisan a la semilla con el mismo id.
//   node code-os/video/referencias.mjs importar-radar <radar.json> <datos>/referencias [--todos]
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIR_REFERENCIAS = join(dirname(fileURLToPath(import.meta.url)), 'referencias');
export const PLATAFORMAS = ['youtube', 'tiktok', 'instagram', 'propio'];
export class ErrorReferencia extends Error {}

export function validarReferencia(r, origen = '') {
  const donde = origen ? ` (${origen})` : '';
  if (!r || typeof r !== 'object') throw new ErrorReferencia(`referencia inválida${donde}`);
  if (!/^[a-z0-9-]+$/.test(r.id ?? '')) throw new ErrorReferencia(`referencia ${r.id ?? '?'}: id solo con minúsculas, números y guiones${donde}`);
  if (!r.titulo) throw new ErrorReferencia(`referencia ${r.id}: falta titulo`);
  if (!PLATAFORMAS.includes(r.plataforma)) throw new ErrorReferencia(`referencia ${r.id}: plataforma «${r.plataforma}» (usa ${PLATAFORMAS.join(', ')})`);
  if (r.plataforma !== 'propio' && !/^https:\/\//.test(r.fuente_url ?? '')) throw new ErrorReferencia(`referencia ${r.id}: fuente_url debe ser https`);
  if (!(r.duracion > 0)) throw new ErrorReferencia(`referencia ${r.id}: duracion en segundos`);
  if (r.breakdown && !Array.isArray(r.breakdown.escenas)) throw new ErrorReferencia(`referencia ${r.id}: breakdown sin escenas`);
  return r;
}

const leerDir = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => validarReferencia(JSON.parse(readFileSync(join(dir, f), 'utf8')), f)) : []);

/** Semilla del repo + las de datos (radar, desgloses). Las de datos pisan por id. */
export function cargarReferencias({ semilla = DIR_REFERENCIAS, datos } = {}) {
  const m = new Map(leerDir(semilla).map((r) => [r.id, r]));
  for (const r of datos ? leerDir(datos) : []) m.set(r.id, { ...m.get(r.id), ...r });
  return [...m.values()];
}

export function guardarReferencia(dir, r) {
  validarReferencia(r);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${r.id}.json`), JSON.stringify(r, null, 2) + '\n');
  return r;
}

/** Estilo sugerido por duración y forma, si nadie eligió otro. */
export const estiloSugerido = ({ duracion_s }) => (duracion_s > 120 ? 'entrevista-larga' : 'caja-subtitulos');

/** Publicaciones del radar (code-os/radar, salida `posts[]`) → referencias. Por defecto solo los winners. */
export function desdeRadar(salida, { soloWinners = true } = {}) {
  const posts = Array.isArray(salida) ? salida : salida?.posts ?? [];
  return posts.filter((p) => p?.url && (!soloWinners || p.metricas?.winner)).map((p) => {
    const plataforma = PLATAFORMAS.includes(p.plataforma) ? p.plataforma : 'youtube';
    const id = `radar-${plataforma}-${String(p.id ?? p.clave ?? p.url).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(-40)}`;
    return {
      id, titulo: String(p.titulo ?? p.gancho?.gancho ?? 'Publicación del radar').slice(0, 140), autor: p.cuenta ?? null,
      fuente_url: p.url, plataforma, duracion: Number(p.duracion_s) || 30,
      miniatura_url: p.miniatura ?? p.thumbnail ?? null,
      por_que_funciona: p.gancho?.por_que ?? (p.gancho?.gancho ? `Gancho: «${String(p.gancho.gancho).slice(0, 100)}»` : 'Winner del radar por engagement relativo a su cuenta'),
      estilo_sugerido: estiloSugerido(p), origen: 'radar',
      metricas: { puntaje: p.metricas?.puntaje ?? null, winner: !!p.metricas?.winner },
    };
  }).map((r) => validarReferencia(r));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, entrada, destino, ...op] = process.argv.slice(2);
  if (cmd !== 'importar-radar' || !entrada || !destino) { console.error('uso: node referencias.mjs importar-radar <radar.json> <datos>/referencias [--todos]'); process.exit(2); }
  const refs = desdeRadar(JSON.parse(readFileSync(entrada, 'utf8')), { soloWinners: !op.includes('--todos') });
  for (const r of refs) guardarReferencia(destino, r);
  console.log(`${refs.length} referencias importadas en ${destino}`);
}
