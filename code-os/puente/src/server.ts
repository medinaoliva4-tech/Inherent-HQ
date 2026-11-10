import { readFileSync, mkdirSync } from 'node:fs';
import { loadConfig } from './config.js';
import { createApp } from './http.js';
import { SessionManager } from './manager.js';
import { makeModelCatalog } from './models.js';
import { realQuery } from './sdk.js';
import { SessionStore } from './store.js';

const cfg = loadConfig(process.env, (p) => JSON.parse(readFileSync(p, 'utf8')));
mkdirSync(`${cfg.dataDir}/home`, { recursive: true });
mkdirSync(cfg.workspacesDir, { recursive: true });
const models = makeModelCatalog(cfg);
const mgr = new SessionManager(cfg, new SessionStore(cfg.dataDir), models, realQuery);
createApp(cfg, mgr, models).listen(cfg.port, cfg.host, () => console.log(`[puente] escuchando en http://${cfg.host}:${cfg.port} · modelo por defecto ${cfg.defaultModel}`));
