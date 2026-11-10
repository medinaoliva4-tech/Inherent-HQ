import { createReadStream, statSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

const TYPES: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8', '.map': 'application/json', '.webp': 'image/webp' };

/** Sirve la interfaz compilada. Sin salirse de `root`; rutas sin extensión caen en index.html (SPA). Devuelve false si no manejó. */
export function serveStatic(root: string, rawPath: string, res: ServerResponse): boolean {
  let p: string;
  try { p = decodeURIComponent(rawPath); } catch { return false; }
  if (p.includes('\0')) return false;
  const base = resolve(root);
  let file = resolve(join(base, p));
  if (file !== base && !file.startsWith(base + sep)) return false;
  let st = (() => { try { return statSync(file); } catch { return null; } })();
  if (st?.isDirectory()) { file = join(file, 'index.html'); st = (() => { try { return statSync(file); } catch { return null; } })(); }
  if (!st?.isFile()) {
    if (extname(p)) return false;
    file = join(base, 'index.html'); st = (() => { try { return statSync(file); } catch { return null; } })();
    if (!st?.isFile()) return false;
  }
  const hashed = /\/assets\//.test(file);
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'content-length': st.size, 'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache', 'x-content-type-options': 'nosniff' });
  createReadStream(file).pipe(res);
  return true;
}
