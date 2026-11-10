import { spawn, type ChildProcess } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SpawnOptions } from '@anthropic-ai/claude-agent-sdk';
import { userHome } from './claude.js';
import type { Config, UserRecord } from './config.js';
import type { Spawner } from './services.js';
import type { WS } from './ws.js';

const SHIM = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'pty-shim.py');

/**
 * Terminal real en la carpeta del proyecto. Corre un shell en un pty (`pty-shim.py`) DENTRO de la misma jaula (bwrap)
 * que las sesiones: ve su proyecto y su HOME y nada más; sin llaves en el entorno.
 * Protocolo WebSocket: del cliente, trama binaria/texto = teclas; texto JSON {"t":"resize","cols":N,"rows":N} = tamaño.
 * Del servidor, tramas binarias = salida del terminal.
 */
export function openTerminal(cfg: Config, user: UserRecord, cwd: string, spawner: Spawner | undefined, ws: WS): ChildProcess | null {
  const env: Record<string, string> = { PATH: '/usr/local/bin:/usr/bin:/bin', HOME: userHome(cfg, user), TERM: 'xterm-256color', LANG: 'C.UTF-8', SHELL_BIN: '/bin/bash', PS1: '\\[\\e[2m\\]\\w\\[\\e[0m\\] $ ' };
  const opts: SpawnOptions = { command: 'python3', args: [SHIM], cwd, env, signal: new AbortController().signal };
  const child = (spawner ? (spawner(opts) as unknown as ChildProcess) : spawn(opts.command, opts.args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] }));
  const dataFrame = (b: Buffer) => { const h = Buffer.alloc(3); h[0] = 0x44; h.writeUInt16BE(b.length, 1); return Buffer.concat([h, b]); };
  child.stdout?.on('data', (d: Buffer) => ws.send(d));
  child.stderr?.on('data', () => {});
  child.on('exit', () => ws.close(1000));
  child.on('error', () => ws.close(1011));
  ws.onMessage((d, text) => {
    if (text) {
      try { const j = JSON.parse(d.toString('utf8')); if (j.t === 'resize' && Number.isInteger(j.cols) && Number.isInteger(j.rows) && j.cols > 0 && j.rows > 0 && j.cols < 1000 && j.rows < 1000) { const b = Buffer.alloc(5); b[0] = 0x52; b.writeUInt16BE(j.cols, 1); b.writeUInt16BE(j.rows, 3); child.stdin?.write(b); return; } } catch { /* era texto normal */ }
    }
    for (let i = 0; i < d.length; i += 60000) child.stdin?.write(dataFrame(d.subarray(i, i + 60000)));
  });
  ws.onClose(() => { try { child.stdin?.end(); child.kill('SIGHUP'); } catch { /* ya terminó */ } });
  return child;
}
