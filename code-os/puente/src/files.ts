import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { isInside } from './workspace.js';
import { HttpError } from './types.js';

export type NodoArchivo = { nombre: string; ruta: string; tipo: 'carpeta' | 'archivo'; hijos?: NodoArchivo[] };
export type ArchivoDiff = { ruta: string; anterior?: string; nuevo?: string; diff: string; mas: number; menos: number };

const IGNORAR = new Set(['.git', 'node_modules', '.next', 'dist', '.venv', '__pycache__']);
const MAX_LEER = 1_000_000, MAX_ESCRIBIR = 2_000_000, MAX_NODOS = 2000, MAX_PROF = 6;

/** Resuelve una ruta relativa a la carpeta del proyecto o rechaza (.., absolutas, symlinks que escapan, .git). */
export function resolverRuta(cwd: string, ruta: string): string {
  if (!ruta || ruta.includes('\0')) throw new HttpError(400, 'Ruta inválida');
  const abs = join(cwd, ruta);
  const rel = relative(cwd, abs);
  if (ruta.startsWith('/') || !isInside(cwd, abs) || rel.split('/')[0] === '.git') throw new HttpError(403, `Ruta fuera de la carpeta del proyecto: ${ruta}`);
  // si el propio archivo es un symlink, no se sigue (ni para leer ni para escribir)
  return abs;
}

export function arbol(cwd: string): NodoArchivo[] {
  let n = 0;
  const walk = (dir: string, prof: number): NodoArchivo[] => {
    if (prof > MAX_PROF) return [];
    return readdirSync(dir, { withFileTypes: true }).filter((e) => !IGNORAR.has(e.name)).sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name)).flatMap((e): NodoArchivo[] => {
      if (n++ > MAX_NODOS) return [];
      const abs = join(dir, e.name); const ruta = relative(cwd, abs);
      if (e.isDirectory()) return [{ nombre: e.name, ruta, tipo: 'carpeta' as const, hijos: walk(abs, prof + 1) }];
      return [{ nombre: e.name, ruta, tipo: 'archivo' as const }];
    });
  };
  return walk(cwd, 0);
}

export function leer(cwd: string, ruta: string): string {
  const abs = resolverRuta(cwd, ruta);
  if (!existsSync(abs)) throw new HttpError(404, 'No existe');
  const st = statSync(abs);
  if (!st.isFile()) throw new HttpError(400, 'No es un archivo');
  if (st.size > MAX_LEER) throw new HttpError(413, 'Archivo demasiado grande para el editor');
  const b = readFileSync(abs);
  if (b.includes(0)) throw new HttpError(415, 'Archivo binario');
  return b.toString('utf8');
}

export function escribir(cwd: string, ruta: string, contenido: unknown) {
  if (typeof contenido !== 'string') throw new HttpError(400, 'contenido debe ser texto');
  if (Buffer.byteLength(contenido) > MAX_ESCRIBIR) throw new HttpError(413, 'Contenido demasiado grande');
  const abs = resolverRuta(cwd, ruta);
  mkdirSync(dirname(abs), { recursive: true });
  if (!isInside(cwd, dirname(abs))) throw new HttpError(403, 'Ruta fuera de la carpeta del proyecto');
  writeFileSync(abs, contenido);
}

// ---- diff con git, endurecido: nada de fsmonitor, hooks, programas externos ni configuración global ----
const GIT_SEGURO = ['-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null', '-c', 'core.pager=cat', '-c', 'core.sshCommand=false', '-c', 'protocol.allow=never', '-c', 'user.name=code-os', '-c', 'user.email=code-os@localhost', '-c', 'commit.gpgsign=false', '--no-pager', '--no-optional-locks'];
const gitR = (cwd: string, args: string[]) => new Promise<{ code: number; out: string }>((resolve) => {
  execFile('git', [...GIT_SEGURO, ...args], { cwd, timeout: 30000, maxBuffer: 8_000_000, env: { PATH: process.env.PATH ?? '/usr/bin:/bin', HOME: '/nonexistent', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_TERMINAL_PROMPT: '0' } }, (e, out, err) => resolve({ code: e ? ((e as any).code ?? 1) : 0, out: String(out ?? '') + (e ? String(err ?? '') : '') }));
});
const git = async (cwd: string, args: string[]) => (await gitR(cwd, args)).out;

/** Sesión aislada: un worktree del proyecto en <proyecto>/.codeos/wt/<id>, con su rama. Las sesiones del mismo cliente no se pisan. */
export async function crearWorktree(repo: string, dir: string, branch: string) {
  await asegurarBase(repo);
  const ex = join(repo, '.git', 'info', 'exclude');
  try { const cur = existsSync(ex) ? readFileSync(ex, 'utf8') : ''; if (!/^\.codeos\/$/m.test(cur)) { mkdirSync(dirname(ex), { recursive: true }); writeFileSync(ex, cur + (cur.endsWith('\n') || !cur ? '' : '\n') + '.codeos/\n'); } } catch { /* sin exclude */ }
  mkdirSync(dirname(dir), { recursive: true });
  const r = await gitR(repo, ['worktree', 'add', '-q', '-b', branch, dir, 'HEAD']);
  if (r.code !== 0) throw new HttpError(500, `No pude crear la copia aislada: ${r.out.slice(0, 200)}`);
}

/** Lo que el .git de un worktree necesita: la carpeta .git del proyecto (el worktree trae un archivo .git que apunta a ella). */
export function gitDirDe(cwd: string): string[] {
  try { const m = /^gitdir:\s*(.+)$/m.exec(readFileSync(join(cwd, '.git'), 'utf8')); return m ? [dirname(dirname(m[1]!.trim()))] : []; } catch { return []; }
}

/** Guarda lo hecho en la rama de la sesión y lo fusiona al proyecto. Con conflicto no deja nada a medias. */
export async function fusionar(repo: string, wt: string, branch: string, titulo = 'sesión') {
  await gitR(wt, ['add', '-A']);
  const c = await gitR(wt, ['commit', '-q', '-m', `Code: ${titulo}`.slice(0, 100)]);
  const hay = c.code === 0;
  const m = await gitR(repo, ['merge', '--no-ff', '--no-edit', '-m', `Fusionar ${branch}`, branch]);
  if (m.code === 0) return { ok: true as const, vacio: !hay && /Already up to date/i.test(m.out) };
  const conflictos = (await gitR(repo, ['diff', '--name-only', '--diff-filter=U'])).out.split('\n').filter(Boolean);
  await gitR(repo, ['merge', '--abort']);
  return { ok: false as const, conflicto: conflictos.length > 0, archivos: conflictos, mensaje: conflictos.length ? `Hay cambios que chocan en: ${conflictos.join(', ')}. Resuélvelo en la sesión y vuelve a fusionar.` : `No se pudo fusionar: ${m.out.slice(0, 200)}` };
}

/** Foto inicial de la carpeta (si aún no es un repo) para poder mostrar después qué cambió. */
export async function asegurarBase(cwd: string) {
  if (existsSync(join(cwd, '.git'))) return;
  await git(cwd, ['init', '-q']);
  await git(cwd, ['commit', '-q', '--allow-empty', '-m', 'base de la sesión']);
}

export async function diff(cwd: string): Promise<ArchivoDiff[]> {
  await asegurarBase(cwd);
  await git(cwd, ['add', '-N', '-A']);
  const names = (await git(cwd, ['diff', 'HEAD', '--name-only', '-z', '--no-ext-diff', '--no-textconv'])).split('\0').filter(Boolean);
  const out: ArchivoDiff[] = [];
  for (const ruta of names.slice(0, 200)) {
    const d = await git(cwd, ['diff', 'HEAD', '--no-ext-diff', '--no-textconv', '--', ruta]);
    const ant = (await git(cwd, ['show', `HEAD:${ruta}`])).slice(0, 200_000);
    let nuevo: string | undefined; try { nuevo = leer(cwd, ruta); } catch { /* borrado o binario */ }
    out.push({ ruta, anterior: ant || undefined, nuevo, diff: d.slice(0, 200_000), mas: (d.match(/^\+(?!\+\+)/gm) ?? []).length, menos: (d.match(/^-(?!--)/gm) ?? []).length });
  }
  return out;
}
