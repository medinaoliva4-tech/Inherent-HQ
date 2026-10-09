// Dev local: sirve public/ y monta api/* leyendo el repo del disco (LOCAL_REPO). Uso: npm run dev
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { hashPassword } from '../api/_lib/auth.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
process.env.LOCAL_REPO ||= path.join(root, '..');
process.env.SESSION_SECRET ||= 'dev-only-secret-dev-only-secret-0123456789';
process.env.AUTH_USERS ||= JSON.stringify([
  { user: 'ceo', name: 'CEO (dev)', role: 'ceo', hash: hashPassword('dev-ceo-pass') },
  { user: 'coo', name: 'COO (dev)', role: 'coo', hash: hashPassword('dev-coo-pass') },
  { user: 'team', name: 'Team (dev)', role: 'team', hash: hashPassword('dev-team-pass') },
]);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain' };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
  if (u.pathname.startsWith('/api/')) {
    const f = path.join(root, u.pathname + '.js');
    if (!fs.existsSync(f) || u.pathname.includes('_lib')) return res.status(404).end();
    req.query = Object.fromEntries(u.searchParams);
    const chunks = []; for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString();
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    return (await import(pathToFileURL(f).href)).default(req, res);
  }
  const p = path.join(root, 'public', u.pathname === '/' ? 'index.html' : u.pathname);
  if (!p.startsWith(path.join(root, 'public')) || !fs.existsSync(p)) return res.status(404).end('404');
  res.setHeader('Content-Type', MIME[path.extname(p)] || 'application/octet-stream'); res.end(fs.readFileSync(p));
}).listen(3000, () => console.log('CEO OS dev → http://localhost:3000  (ceo / dev-ceo-pass)'));
