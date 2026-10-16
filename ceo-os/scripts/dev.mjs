// Dev local: sirve public/ y la API con la base local (PGlite) y login de prueba sin Google.
// Uso: npm run dev  →  http://localhost:3000  (entra con «Entrar en modo prueba»)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
process.env.LOCAL_REPO ||= path.join(root, '..');
process.env.LOCAL_DB ||= path.join(root, '.devdb');
process.env.DEV_LOGIN = '1';
process.env.SESSION_SECRET ||= 'dev-only-secret-dev-only-secret-0123456789';
process.env.ADMIN_EMAILS ||= 'ceo@inherentglobal.com';
const SEC = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).headers[0].headers.map((h) => [h.key, h.value]));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };
const api = (await import(pathToFileURL(path.join(root, 'api/index.js')).href)).default;

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  for (const [k, v] of Object.entries(SEC)) res.setHeader(k, v);
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
  const atRoot = u.pathname === '/' && String(req.headers.accept || '').includes('text/event-stream'); // MCP en la raíz
  const route = atRoot ? 'mcp' : u.pathname.startsWith('/api/') ? u.pathname.slice(5) : u.pathname === '/mcp' || u.pathname.startsWith('/.well-known/') ? u.pathname.slice(1) : null;
  if (route !== null) {
    req.query = { ...Object.fromEntries(u.searchParams), route, ...(atRoot ? { at: 'root' } : {}) };
    const chunks = []; for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString();
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = String(req.headers['content-type'] || '').includes('urlencoded') ? Object.fromEntries(new URLSearchParams(raw)) : {}; }
    return api(req, res);
  }
  // /diagnostico es la página pública del quiz (en Vercel lo hace el rewrite de vercel.json).
  let p = path.join(root, 'public', u.pathname === '/' ? 'index.html' : u.pathname === '/diagnostico' ? 'diagnostico.html' : u.pathname);
  if (!p.startsWith(path.join(root, 'public')) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(root, 'public', 'index.html');
  res.setHeader('Content-Type', MIME[path.extname(p)] || 'application/octet-stream'); res.end(fs.readFileSync(p));
}).listen(3000, () => console.log('CEO OS dev → http://localhost:3000'));
