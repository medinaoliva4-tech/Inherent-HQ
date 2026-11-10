import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import { makeAuthenticator } from './auth.js';
import type { Config } from './config.js';
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

export function createApp(cfg: Config, mgr: SessionManager, models: ModelCatalog): Server {
  const authed = makeAuthenticator(cfg.tokens);
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://x');
      const path = url.pathname.replace(/\/+$/, '') || '/';
      const method = req.method ?? 'GET';
      if (method === 'GET' && path === '/health') return send(res, 200, { ok: true });
      if (!authed(req)) { res.setHeader('www-authenticate', 'Bearer'); return send(res, 401, { error: 'Token inválido o ausente' }); }

      if (method === 'GET' && path === '/models') return send(res, 200, { default: cfg.defaultModel, models: await models.list().catch((e) => { throw new HttpError(502, e.message); }) });
      if (method === 'POST' && path === '/sessions') { const s = await mgr.create(await readJson(req)); return send(res, 201, s.summary()); }
      if (method === 'GET' && path === '/sessions') return send(res, 200, { sessions: mgr.list(url.searchParams.get('projectId') ?? undefined) });

      const m = /^\/sessions\/([0-9a-f-]{36})(?:\/([a-z]+)(?:\/([0-9a-f-]{36}))?)?$/.exec(path);
      if (!m) throw new HttpError(404, 'Ruta no encontrada');
      const [, id, sub, sub2] = m as unknown as [string, string, string?, string?];

      if (!sub) {
        if (method === 'GET') return send(res, 200, mgr.get(id).summary());
        if (method === 'PATCH') return send(res, 200, (await mgr.update(id, await readJson(req))).summary());
        if (method === 'DELETE') { await mgr.close(id); return send(res, 200, { ok: true }); }
      }
      if (sub === 'messages' && method === 'POST') {
        const b = await readJson(req);
        if (typeof b.text !== 'string' || !b.text.trim()) throw new HttpError(400, 'text es obligatorio');
        if (b.text.length > 100_000) throw new HttpError(413, 'text demasiado largo');
        return send(res, 202, { turnId: mgr.get(id).sendMessage(b.text) });
      }
      if (sub === 'interrupt' && method === 'POST') { await mgr.get(id).interrupt(); return send(res, 200, { ok: true }); }
      if (sub === 'permissions' && method === 'GET' && !sub2) return send(res, 200, { pending: mgr.get(id).pendingPermissions() });
      if (sub === 'permissions' && method === 'POST' && sub2) {
        const b = await readJson(req);
        if (!['allow', 'deny', 'allow_all'].includes(b.decision)) throw new HttpError(400, 'decision debe ser allow, deny o allow_all');
        mgr.get(id).answer(sub2, { decision: b.decision, message: typeof b.message === 'string' ? b.message : undefined, updatedInput: b.updatedInput && typeof b.updatedInput === 'object' ? b.updatedInput : undefined });
        return send(res, 200, { ok: true });
      }
      if (sub === 'events' && method === 'GET') {
        const s = mgr.get(id);
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
