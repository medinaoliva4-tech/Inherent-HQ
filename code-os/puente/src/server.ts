import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeClaudeProbe, userHome } from './claude.js';
import { loadConfig } from './config.js';
import { bwrapWorks, makeBwrapSpawner } from './confine.js';
import { makeCuotasClient } from './cuotas.js';
import { createApp } from './http.js';
import { gitDirDe } from './files.js';
import { verifyUserKeys } from './keys.js';
import { SessionManager } from './manager.js';
import { makeModelCatalog } from './models.js';
import { realQuery } from './sdk.js';
import type { Services } from './services.js';
import { SessionStore } from './store.js';
import { AlmacenJson, Memoria } from 'code-os-herramientas';

const cfg = loadConfig();
mkdirSync(cfg.workspacesDir, { recursive: true });
for (const u of cfg.users) mkdirSync(userHome(cfg, u), { recursive: true });

// Ninguna llave de usuario puede ser administrador de LiteLLM (la master nunca entra al puente).
await verifyUserKeys(cfg.litellmUrl, cfg.users).catch((e) => { console.error('[puente] llaves:', e.message); process.exit(1); });

// Confinamiento: bubblewrap por sesión. Sin él, Code y Plan se rechazan (Chat no usa herramientas).
const here = join(dirname(fileURLToPath(import.meta.url)), '..');
const canBwrap = cfg.confine !== 'none' && bwrapWorks();
if (cfg.confine === 'bwrap' && !canBwrap) { console.error('[puente] PUENTE_CONFINE=bwrap pero bubblewrap no funciona aquí'); process.exit(1); }
const svc: Services = {
  claude: makeClaudeProbe(cfg),
  cuotas: makeCuotasClient(cfg),
  // Solo lectura extra: node_modules del puente y las carpetas que el catálogo MCP declara (`x-puente.ro`, ya validadas).
  spawner: canBwrap ? (u, cwd, ro = []) => makeBwrapSpawner({ workspace: cwd, home: userHome(cfg, u), readOnly: [join(here, 'node_modules'), ...ro], rw: gitDirDe(cwd) }) : undefined,
  // Memoria viva del cliente: un JSON por cliente en <data>/herramientas (fuera de los workspaces que ven los agentes).
  herramientas: new Memoria(new AlmacenJson(join(cfg.dataDir, 'herramientas'))),
};
const models = makeModelCatalog(cfg);
const mgr = new SessionManager(cfg, new SessionStore(cfg.dataDir), models, realQuery, svc);
createApp(cfg, mgr, models, svc).listen(cfg.port, cfg.host, () =>
  console.log(`[puente] escuchando en http://${cfg.host}:${cfg.port} · usuarios: ${cfg.users.map((u) => u.id).join(', ')} · confinamiento: ${canBwrap ? 'bwrap' : 'NINGUNO (Code/Plan deshabilitados)'} · interfaz: ${cfg.uiDir ?? 'no'}`));
