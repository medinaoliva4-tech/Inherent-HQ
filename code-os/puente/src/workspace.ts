import { mkdirSync, realpathSync, existsSync } from 'node:fs';
import { dirname, resolve, sep, basename } from 'node:path';
import { HttpError } from './types.js';

const ID_RE = /^[a-z0-9][a-z0-9_-]{0,62}$/;

/** Carpeta de trabajo aislada por usuario y proyecto: <workspacesDir>/<userId>/<projectId>. */
export function workspaceFor(root: string, userId: string, projectId: string): string {
  if (typeof projectId !== 'string' || !ID_RE.test(projectId)) throw new HttpError(400, 'projectId inválido (a-z, 0-9, _ y -, máx. 63)');
  const userDir = resolve(root, userId);
  const dir = resolve(userDir, projectId);
  if (dirname(userDir) !== resolve(root) || dirname(dir) !== userDir || basename(dir) !== projectId) throw new HttpError(400, 'projectId inválido');
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Resuelve el camino real del ancestro existente más profundo (para detectar symlinks que escapan). */
function realish(p: string): string {
  let cur = resolve(p);
  const rest: string[] = [];
  while (!existsSync(cur)) { rest.unshift(basename(cur)); const up = dirname(cur); if (up === cur) break; cur = up; }
  return resolve(realpathSync(cur), ...rest);
}

export function isInside(cwd: string, target: string): boolean {
  const base = realish(cwd);
  const t = realish(resolve(cwd, target));
  return t === base || t.startsWith(base + sep);
}
