import { createReadStream, readFileSync, statSync } from 'node:fs';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';
import type { ServerResponse } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

const TYPES: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8', '.map': 'application/json', '.webp': 'image/webp' };

/** Sirve la interfaz compilada. Sin salirse de `root`; rutas sin extensión caen en index.html (SPA). Devuelve false si no manejó. */
const COMPRIMIBLE = /^(text\/|application\/json|image\/svg)|javascript/;
const cache = new Map<string, Buffer>();
/** Comprime una vez por archivo y versión (el enlace al VPS es lento: el bundle de 1.5 MB baja a ~400 KB). */
function comprimido(file: string, mtime: number, enc: 'br' | 'gzip'): Buffer {
  const k = `${file}|${mtime}|${enc}`;
  let b = cache.get(k);
  if (!b) {
    const raw = readFileSync(file);
    b = enc === 'br' ? brotliCompressSync(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: 6 } }) : gzipSync(raw, { level: 9 });
    if (cache.size > 400) cache.clear();
    cache.set(k, b);
  }
  return b;
}

export function serveStatic(root: string, rawPath: string, res: ServerResponse, acceptEncoding = ''): boolean {
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
  const type = TYPES[extname(file)] ?? 'application/octet-stream';
  const headers: Record<string, string | number> = { 'content-type': type, 'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache', 'x-content-type-options': 'nosniff', vary: 'accept-encoding' };
  const enc = COMPRIMIBLE.test(type) && st.size > 1024 ? (/\bbr\b/.test(acceptEncoding) ? 'br' : /\bgzip\b/.test(acceptEncoding) ? 'gzip' : null) : null;
  if (enc) {
    const body = comprimido(file, st.mtimeMs, enc);
    res.writeHead(200, { ...headers, 'content-encoding': enc, 'content-length': body.length });
    res.end(body);
    return true;
  }
  res.writeHead(200, { ...headers, 'content-length': st.size });
  createReadStream(file).pipe(res);
  return true;
}
