import { existsSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import { makeAuthenticator } from './auth.js';
import type { Config } from './config.js';
import type { Services } from './services.js';
import { serveStatic } from './static.js';
import * as fx from './files.js';
import type { SessionManager } from './manager.js';
import type { ModelCatalog } from './models.js';
import { HttpError } from './types.js';

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

const API = /^\/(sessions|models|me|cuotas|health)(\/|$)/;

export function createApp(cfg: Config, mgr: SessionManager, models: ModelCatalog, svc: Services): Server {
  const authed = makeAuthenticator(cfg.users);
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://x');
      const path = url.pathname.replace(/\/+$/, '') || '/';
      const method = req.method ?? 'GET';
      if (method === 'GET' && path === '/health') {
        // Sin token solo dice que está vivo; con token válido añade el estado de la sesión de Claude de esa persona.
        const u = authed(req);
        const claude = u ? await svc.claude.status(u).catch(() => null) : null;
        return send(res, 200, { ok: true, ...(claude ? { claude: { activa: claude.active, instalada: claude.installed } } : {}) });
      }
      if (!API.test(path) && cfg.uiDir && (method === 'GET' || method === 'HEAD')) {
        if (cfg.flagFile && !existsSync(cfg.flagFile)) {
          const msg = '<!doctype html><meta charset=utf-8><title>Code OS</title><body style="font:16px system-ui;padding:3rem"><h1>Code OS aún no está activado</h1><p>Falta correr el asistente en el servidor: <code>asistente.sh</code></p>';
          res.writeHead(503, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(msg); return;
        }
        if (serveStatic(cfg.uiDir, url.pathname, res)) return;
      }
      const user = authed(req);
      if (!user) { res.setHeader('www-authenticate', 'Bearer'); return send(res, 401, { error: 'Token inválido o ausente' }); }

      if (method === 'GET' && path === '/me') {
        const claude = await svc.claude.status(user, url.searchParams.get('refresh') === '1').catch(() => ({ installed: false, active: false }));
        return send(res, 200, { user: user.id, levels: user.levels, modelPrefixes: user.modelPrefixes, defaultModel: cfg.defaultModel, claude, confinamiento: { activo: mgr.confined, modo: mgr.confined ? 'bwrap' : 'ninguno', code: !cfg.requireConfine || mgr.confined } });
      }
      if (method === 'GET' && path === '/cuotas') {
        const c = await svc.cuotas.get();
        if (!c) throw new HttpError(503, 'El medidor de cuotas no responde');
        return send(res, 200, c);
      }
      if (method === 'GET' && path === '/models') return send(res, 200, { default: cfg.defaultModel, models: await models.list(user).catch((e) => { throw new HttpError(502, e.message); }) });
      if (method === 'POST' && path === '/sessions') { const s = await mgr.create(user, await readJson(req)); return send(res, 201, s.summary()); }
      if (method === 'GET' && path === '/sessions') return send(res, 200, { sessions: mgr.list(user, url.searchParams.get('projectId') ?? undefined) });

      const fm = /^\/sessions\/([0-9a-f-]{36})\/(files|diff)(?:\/(.*))?$/.exec(url.pathname.replace(/\/+$/, ''));
      if (fm) {
        const cwd = mgr.get(user, fm[1]!).meta.cwd;
        if (fm[2] === 'diff' && method === 'GET') return send(res, 200, { archivos: await fx.diff(cwd) });
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
        return send(res, 202, { turnId: mgr.get(user, id).sendMessage(b.text) });
      }
      if (sub === 'interrupt' && method === 'POST') { await mgr.get(user, id).interrupt(); return send(res, 200, { ok: true }); }
      if (sub === 'permissions' && method === 'GET' && !sub2) return send(res, 200, { pending: mgr.get(user, id).pendingPermissions() });
      if (sub === 'permissions' && method === 'POST' && sub2) {
        const b = await readJson(req);
        if (!['allow', 'deny', 'allow_all'].includes(b.decision)) throw new HttpError(400, 'decision debe ser allow, deny o allow_all');
        mgr.get(user, id).answer(sub2, { decision: b.decision, message: typeof b.message === 'string' ? b.message : undefined, updatedInput: b.updatedInput && typeof b.updatedInput === 'object' ? b.updatedInput : undefined });
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
}
