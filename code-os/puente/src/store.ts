import { mkdirSync, readFileSync, readdirSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { SessionMeta } from './types.js';

/** Metadatos de sesión en disco (un JSON por sesión) para poder reanudar tras reiniciar el puente. */
export class SessionStore {
  private dir: string;
  constructor(dataDir: string) { this.dir = join(dataDir, 'sessions'); mkdirSync(this.dir, { recursive: true }); }
  private file(id: string) { return join(this.dir, `${id}.json`); }
  save(m: SessionMeta) { const tmp = this.file(m.id) + '.tmp'; writeFileSync(tmp, JSON.stringify(m, null, 2)); renameSync(tmp, this.file(m.id)); }
  load(id: string): SessionMeta | null {
    if (!/^[0-9a-f-]{36}$/.test(id) || !existsSync(this.file(id))) return null;
    return JSON.parse(readFileSync(this.file(id), 'utf8')) as SessionMeta;
  }
  list(projectId?: string): SessionMeta[] {
    const out = readdirSync(this.dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(this.dir, f), 'utf8')) as SessionMeta);
    return out.filter((m) => !projectId || m.projectId === projectId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}
