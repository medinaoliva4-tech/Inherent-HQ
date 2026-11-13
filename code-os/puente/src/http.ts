import { existsSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import { COOKIE, makeAuthenticator, traeCredencial } from './auth.js';
import { firmar, verificar } from './pase.js';
import type { Config } from './config.js';
import type { Services } from './services.js';
import { serveStatic } from './static.js';
import * as fx from './files.js';
import { acceptWebSocket } from './ws.js';
import { openTerminal } from './terminal.js';
import { listSkills } from './skills.js';
import type { SessionManager } from './manager.js';
import type { ModelCatalog } from './models.js';
import { HttpError } from './types.js';
import { catalogoModelos, presets } from './catalogo-modelos.js';
import { modelAllowed } from './auth.js';
import { esRutaHerramientas, manejarHerramientas } from 'code-os-herramientas';

const MAX_BODY = 1_000_000;

async function readJson(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = []; let n = 0;
  for await (const c of req) { n += (c as Buffer).length; if (n > MAX_BODY) throw new HttpError(413, 'Cuerpo demasiado grande'); chunks.push(c as Buffer); }
  if (!n) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new HttpError(400, 'JSON inválido'); }
}
function send(res: ServerResponse, status: number, body: unknown) {
  const s = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(s), 'cache-control': 'no-store' });
  res.end(s);
}

const API = /^\/(sessions|models|me|cuotas|health|mcp|skills|capacidades|entrar|salir|clientes|calc)(\/|$)/;
const PAGE = (body: string) => `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Code OS · Entrar</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0b;color:#eee;font:16px system-ui">${body}`;
const LOGIN = (err = '') => PAGE(`<form method=post action=/entrar style="width:min(360px,90vw);display:grid;gap:12px"><h1 style="font-size:20px;margin:0">Code OS</h1><input name=token type=password autocomplete=current-password placeholder="Tu token" autofocus required style="padding:12px;border-radius:8px;border:1px solid #444;background:#151515;color:#eee"><button style="padding:12px;border-radius:8px;border:0;background:#eee;color:#111;font-weight:600">Entrar</button>${err ? `<p style="color:#f88;margin:0">${err}</p>` : '<p style="color:#888;margin:0;font-size:13px">Solo hace falta una vez en este navegador.</p>'}</form>`);

export function createApp(cfg: Config, mgr: SessionManager, models: ModelCatalog, svc: Services): Server {
  const authed = makeAuthenticator(cfg.users, cfg.paseSecret);
  // Límite de intentos fallidos por IP (en memoria): tras `maxAuthFailures` en 10 min, todo da 429 durante esa ventana.
  const fallos = new Map<string, { n: number; desde: number }>();
  const ipDe = (req: IncomingMessage) => {
    const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '');
    const xff = String(req.headers['x-forwarded-for'] ?? '').split(',')[0]!.trim();
    return local && xff ? xff : (req.socket.remoteAddress ?? '?');
  };
  const bloqueada = (ip: string) => { const f = fallos.get(ip); if (!f) return false; if (Date.now() - f.desde > 600_000) { fallos.delete(ip); return false; } return f.n >= cfg.maxAuthFailures; };
  const falla = (ip: string) => { const f = fallos.get(ip); if (!f || Date.now() - f.desde > 600_000) fallos.set(ip, { n: 1, desde: Date.now() }); else f.n++; if (fallos.size > 5000) fallos.clear(); };
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://x');
      const path = url.pathname.replace(/\/+$/, '') || '/';
      const method = req.method ?? 'GET';
      const origin = req.headers.origin;
      if (origin && cfg.allowedOrigins.includes(origin)) {
        res.setHeader('access-control-allow-origin', origin); res.setHeader('vary', 'Origin');
        if (method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE', 'access-control-allow-headers': 'authorization, content-type, last-event-id', 'access-control-max-age': '600' }); res.end(); return; }
      }
      const ip = ipDe(req);
      if (API.test(path) && path !== '/health' && bloqueada(ip)) { res.setHeader('retry-after', '600'); return send(res, 429, { error: 'Demasiados intentos fallidos; espera unos minutos' }); }
      if (method === 'GET' && path === '/health') {
        // Sin token solo dice que está vivo; con token válido añade el estado de la sesión de Claude de esa persona.
        const u = authed(req);
        const claude = u ? await svc.claude.status(u).catch(() => null) : null;
        return send(res, 200, { ok: true, ...(claude ? { claude: { activa: claude.active, instalada: claude.installed } } : {}) });
      }
      if (path === '/entrar' && method === 'GET' && url.searchParams.has('pase')) {
        const c = cfg.paseSecret ? verificar(cfg.paseSecret, url.searchParams.get('pase')!, 'pase') : null;
        const u = c ? cfg.users.find((x) => x.emails.includes(c.sub.toLowerCase())) : null;
        if (!c || !u) { falla(ip); res.writeHead(401, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(LOGIN('Ese pase no es válido o caducó. Vuelve a entrar desde el OS.')); return; }
        const sesion = firmar(cfg.paseSecret!, { typ: 'sesion', sub: c.sub, exp: Math.floor(Date.now() / 1000) + 7 * 86400 });
        const seguro = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
        res.writeHead(303, { location: '/', 'set-cookie': `${COOKIE}=${encodeURIComponent(sesion)}; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax${seguro}`, 'cache-control': 'no-store' }); res.end(); return;
      }
      if (path === '/entrar' && method === 'GET') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(LOGIN()); return; }
      if (path === '/entrar' && method === 'POST') {
        const chunks: Buffer[] = []; let n = 0;
        for await (const c of req) { n += (c as Buffer).length; if (n > 4096) throw new HttpError(413, 'Cuerpo demasiado grande'); chunks.push(c as Buffer); }
        const token = (new URLSearchParams(Buffer.concat(chunks).toString('utf8')).get('token') ?? '').trim();
        const fake = { headers: { authorization: `Bearer ${token}` } } as IncomingMessage;
        if (!token || !authed(fake)) { falla(ip); res.writeHead(401, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(LOGIN('Ese token no es válido.')); return; }
        res.writeHead(303, { location: '/', 'set-cookie': `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Strict`, 'cache-control': 'no-store' }); res.end(); return;
      }
      if (path === '/salir') { res.writeHead(303, { location: '/entrar', 'set-cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict` }); res.end(); return; }
      if (!API.test(path) && cfg.uiDir && (method === 'GET' || method === 'HEAD')) {
        // La página (no los assets) exige entrar: sin sesión se manda a /entrar.
        if (!/\.[a-z0-9]{1,6}$/i.test(path) && !authed(req)) { res.writeHead(302, { location: '/entrar', 'cache-control': 'no-store' }); res.end(); return; }
        if (cfg.flagFile && !existsSync(cfg.flagFile)) {
          const msg = '<!doctype html><meta charset=utf-8><title>Code OS</title><body style="font:16px system-ui;padding:3rem"><h1>Code OS aún no está activado</h1><p>Falta correr el asistente en el servidor: <code>asistente.sh</code></p>';
          res.writeHead(503, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(msg); return;
        }
        if (serveStatic(cfg.uiDir, url.pathname, res, String(req.headers['accept-encoding'] ?? ''))) return;
      }
      const user = authed(req);
      if (!user && traeCredencial(req)) falla(ip);
      if (!user) { res.setHeader('www-authenticate', 'Bearer'); return send(res, 401, { error: 'Token inválido o ausente' }); }

      if (method === 'GET' && path === '/me') {
        const claude = await svc.claude.status(user, url.searchParams.get('refresh') === '1').catch(() => ({ installed: false, active: false }));
        return send(res, 200, { user: user.id, levels: user.levels, modelPrefixes: user.modelPrefixes, defaultModel: cfg.defaultModel, claude, confinamiento: { activo: mgr.confined, modo: mgr.confined ? 'bwrap' : 'ninguno', code: !cfg.requireConfine || mgr.confined } });
      }
      if (method === 'GET' && path === '/mcp') return send(res, 200, { mcp: Object.keys(cfg.mcpCatalog).map((n) => ({ nombre: n, descripcion: String((cfg.mcpCatalog[n] as any)?.description ?? 'Servidor MCP del catálogo'), estado: 'activo' })) });
      if (method === 'GET' && path === '/skills') return send(res, 200, { skills: listSkills(cfg.skillsDir) });
      if (method === 'GET' && path === '/cuotas') {
        const c = await svc.cuotas.get();
        if (!c) throw new HttpError(503, 'El medidor de cuotas no responde');
        return send(res, 200, c);
      }
      if (esRutaHerramientas(path)) {
        // Memoria viva del cliente y calculadoras: misma autenticación (ya resuelta arriba); la lógica vive en code-os/herramientas.
        if (!svc.herramientas) throw new HttpError(503, 'Las herramientas no están activas en este servidor');
        const body = method === 'POST' || method === 'PUT' ? await readJson(req) : undefined;
        const r = await manejarHerramientas(svc.herramientas, { method, path, query: url.searchParams, body, usuario: user.id });
        if (r) return send(res, r.status, r.body);
      }
      if (method === 'GET' && path === '/models') {
        const lista = await models.list(user).catch((e) => { throw new HttpError(502, e.message); });
        const claude = await svc.claude.status(user).catch(() => ({ installed: false, active: false }));
        const modelos = catalogoModelos(lista, claude, (id) => modelAllowed(user, id));
        return send(res, 200, { default: cfg.defaultModel, models: lista, modelos, presets: presets(modelos, claude.active) });
      }
      if (method === 'GET' && path === '/capacidades') return send(res, 200, { capacidades: await mgr.sondeo(user, url.searchParams.get('refresh') === '1') });
      if (method === 'POST' && path === '/sessions') { const s = await mgr.create(user, await readJson(req)); return send(res, 201, s.summary()); }
      if (method === 'GET' && path === '/sessions') return send(res, 200, { sessions: mgr.list(user, url.searchParams.get('projectId') ?? undefined) });

      const fm = /^\/sessions\/([0-9a-f-]{36})\/(files|diff|merge)(?:\/(.*))?$/.exec(url.pathname.replace(/\/+$/, ''));
      if (fm) {
        const sesion = mgr.get(user, fm[1]!); const cwd = sesion.meta.cwd;
        if (fm[2] === 'merge' && method === 'POST') { const w = sesion.meta.worktree; if (!w) throw new HttpError(409, 'Esta sesión no es aislada: no hay nada que fusionar'); if (sesion.running) throw new HttpError(409, 'Hay un turno en curso; espera a que termine'); return send(res, 200, await fx.fusionar(w.repo, cwd, w.branch, sesion.meta.title)); }
        if (fm[2] === 'diff' && method === 'GET') return send(res, 200, { archivos: await fx.diff(cwd) });
        const q = url.searchParams.get('path');
        if (fm[2] === 'files' && !fm[3] && q && method === 'GET') return send(res, 200, { ruta: q, contenido: fx.leer(cwd, q) });
        if (fm[2] === 'files' && !fm[3] && q && method === 'PUT') { fx.escribir(cwd, q, (await readJson(req)).contenido); return send(res, 200, { ok: true }); }
        if (fm[2] === 'files' && !fm[3] && method === 'GET') return send(res, 200, { archivos: fx.arbol(cwd) });
        if (fm[2] === 'files' && fm[3] && method === 'GET') { const ruta = decodeURIComponent(fm[3]); return send(res, 200, { ruta, contenido: fx.leer(cwd, ruta) }); }
        if (fm[2] === 'files' && fm[3] && method === 'PUT') { fx.escribir(cwd, decodeURIComponent(fm[3]), (await readJson(req)).contenido); return send(res, 200, { ok: true }); }
        throw new HttpError(404, 'Ruta no encontrada');
      }
      const m = /^\/sessions\/([0-9a-f-]{36})(?:\/([a-z]+)(?:\/([0-9a-f-]{36}))?)?$/.exec(path);
      if (!m) throw new HttpError(404, 'Ruta no encontrada');
      const [, id, sub, sub2] = m as unknown as [string, string, string?, string?];

      if (!sub) {
        if (method === 'GET') return send(res, 200, mgr.get(user, id).summary());
        if (method === 'PATCH') return send(res, 200, (await mgr.update(user, id, await readJson(req))).summary());
        if (method === 'DELETE') { await mgr.close(user, id); return send(res, 200, { ok: true }); }
      }
      if (sub === 'messages' && method === 'POST') {
        const b = await readJson(req);
        if (typeof b.text !== 'string' || !b.text.trim()) throw new HttpError(400, 'text es obligatorio');
        if (b.text.length > 100_000) throw new HttpError(413, 'text demasiado largo');
        const ses = mgr.get(user, id); const queued = b.queue === true && ses.running;
        return send(res, 202, { turnId: ses.sendMessage(b.text, b.queue === true), ...(queued ? { queued: true } : {}) });
      }
      if (sub === 'history' && method === 'GET') return send(res, 200, { events: mgr.get(user, id).history(Number(url.searchParams.get('after') ?? 0) || 0) });
      if (sub === 'interrupt' && method === 'POST') { await mgr.get(user, id).interrupt(); return send(res, 200, { ok: true }); }
      if (sub === 'permissions' && method === 'GET' && !sub2) return send(res, 200, { pending: mgr.get(user, id).pendingPermissions() });
      if (sub === 'permissions' && method === 'POST' && sub2) {
        const b = await readJson(req);
        if (!['allow', 'deny', 'allow_all'].includes(b.decision)) throw new HttpError(400, 'decision debe ser allow, deny o allow_all');
        if (b.aprobado_usd !== undefined && (typeof b.aprobado_usd !== 'number' || !(b.aprobado_usd > 0) || b.aprobado_usd > 1000)) throw new HttpError(400, 'aprobado_usd debe ser un número mayor que 0');
        mgr.get(user, id).answer(sub2, { decision: b.decision, message: typeof b.message === 'string' ? b.message : undefined, updatedInput: b.updatedInput && typeof b.updatedInput === 'object' ? b.updatedInput : undefined, aprobadoUsd: b.aprobado_usd });
        return send(res, 200, { ok: true });
      }
      if (sub === 'events' && method === 'GET') {
        const s = mgr.get(user, id);
        const last = Number(req.headers['last-event-id'] ?? url.searchParams.get('after') ?? 0) || 0;
        res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' });
        res.write(`retry: 2000\n: conectado\n\n`);
        const off = s.subscribe(last, (e) => { res.write(`id: ${e.seq}\nevent: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`); });
        const hb = setInterval(() => res.write(': latido\n\n'), 15_000);
        req.on('close', () => { clearInterval(hb); off(); });
        return;
      }
      throw new HttpError(404, 'Ruta no encontrada');
    } catch (err) {
      if (res.headersSent) { res.end(); return; }
      if (err instanceof HttpError) return send(res, err.status, { error: err.message });
      console.error('[puente] error interno', err);
      send(res, 500, { error: 'Error interno' });
    }
  });
  // Terminal real por WebSocket: GET /sessions/:id/terminal (Upgrade). Misma autenticación que la API (token o cookie).
  const sockets = new Set<import('node:stream').Duplex>();
  const cerrarTodo = server.closeAllConnections.bind(server);
  server.closeAllConnections = () => { cerrarTodo(); for (const s of sockets) s.destroy(); };
  server.on('upgrade', (req, socket) => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket));
    const refuse = (code: number, msg: string) => { socket.end(`HTTP/1.1 ${code} ${msg}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`); };
    try {
      const m = /^\/sessions\/([0-9a-f-]{36})\/terminal$/.exec(new URL(req.url ?? '/', 'http://x').pathname);
      if (!m) return refuse(404, 'Not Found');
      const user = authed(req);
      if (!user) return refuse(401, 'Unauthorized');
      const origin = req.headers.origin;
      if (origin && !req.headers.authorization && !cfg.allowedOrigins.includes(origin) && !new URL(req.url ?? '/', 'http://x').searchParams.has('pase') && new URL(origin).host !== req.headers.host) return refuse(403, 'Forbidden'); // CSRF por cookie
      const ses = mgr.get(user, m[1]!);
      if (cfg.requireConfine && !mgr.confined) return refuse(503, 'Service Unavailable');
      const ws = acceptWebSocket(req, socket);
      if (!ws) return refuse(400, 'Bad Request');
      openTerminal(cfg, user, ses.meta.cwd, svc.spawner?.(user, ses.meta.cwd), ws);
    } catch (e) { refuse(e instanceof HttpError ? e.status : 500, 'Error'); }
  });
  return server;
}
