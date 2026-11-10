import { spawn, spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute } from 'node:path';
import type { SpawnOptions, SpawnedProcess } from '@anthropic-ai/claude-agent-sdk';

export interface ConfineSpec {
  /** Carpeta del proyecto (lectura y escritura). Es lo único del usuario que ve el proceso, además de su HOME. */
  workspace: string;
  /** HOME propio de la persona (config de Claude, su login si lo hay). */
  home: string;
  /** Rutas extra de solo lectura (p. ej. donde vive el binario del arnés). */
  readOnly: string[];
  /** Rutas extra de lectura y escritura (p. ej. el .git del proyecto cuando la sesión corre en un worktree). */
  rw?: string[];
  bwrapPath?: string;
}
export interface ProcSpec { command: string; args: string[]; cwd?: string; env: Record<string, string | undefined> }

const ETC = ['resolv.conf', 'hosts', 'nsswitch.conf', 'passwd', 'group', 'localtime', 'ld.so.cache', 'ssl', 'ca-certificates', 'alternatives', 'ssl/certs'];

/**
 * Argumentos de bubblewrap: raíz vacía con /usr de solo lectura, /tmp privado, y solo dos carpetas escribibles
 * (el proyecto y el HOME de la persona). No se monta /home, /root, /var ni el código del servidor: el `.env`
 * de LiteLLM, las otras carpetas de proyectos y los otros usuarios no existen para el proceso.
 * Se conserva la red del anfitrión porque el arnés necesita llegar a LiteLLM en 127.0.0.1.
 */
export function bwrapArgv(spec: ConfineSpec, p: ProcSpec): string[] {
  const a: string[] = ['--unshare-pid', '--unshare-ipc', '--unshare-uts', '--unshare-cgroup-try', '--die-with-parent', '--new-session', '--clearenv'];
  a.push('--ro-bind', '/usr', '/usr', '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/sbin', '/sbin', '--symlink', 'usr/lib', '/lib', '--symlink', 'usr/lib64', '/lib64');
  for (const f of ETC) a.push('--ro-bind-try', `/etc/${f}`, `/etc/${f}`);
  a.push('--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp');
  for (const r of spec.readOnly) a.push('--ro-bind', r, r);
  a.push('--bind', spec.workspace, spec.workspace, '--bind', spec.home, spec.home);
  for (const r of spec.rw ?? []) a.push('--bind', r, r);
  for (const [k, v] of Object.entries(p.env)) if (v !== undefined) a.push('--setenv', k, v);
  a.push('--chdir', p.cwd ?? spec.workspace);
  a.push('--', p.command, ...p.args);
  return a;
}

const real = (p: string) => { try { return realpathSync(p); } catch { return p; } };

/** Lanzador para `spawnClaudeCodeProcess` del SDK: el arnés corre dentro de bwrap. */
export function makeBwrapSpawner(spec: ConfineSpec): (o: SpawnOptions) => SpawnedProcess {
  return (o) => {
    const ro = new Set(spec.readOnly.map(real));
    if (isAbsolute(o.command) && existsSync(o.command)) ro.add(dirname(real(o.command)));
    for (const x of o.args) if (isAbsolute(x) && existsSync(x)) ro.add(dirname(real(x)));
    const argv = bwrapArgv({ ...spec, readOnly: [...ro].filter((r) => !r.startsWith('/usr/')) }, { command: o.command, args: o.args, cwd: o.cwd, env: o.env });
    const child = spawn(spec.bwrapPath ?? 'bwrap', argv, { stdio: ['pipe', 'pipe', 'pipe'], env: { PATH: '/usr/bin:/bin' }, signal: o.signal });
    child.stderr?.on('data', (d) => { if (process.env.PUENTE_DEBUG) process.stderr.write(`[arnés] ${d}`); });
    return child as unknown as SpawnedProcess;
  };
}

/** ¿bwrap existe Y puede crear su sandbox aquí? (en Ubuntu 24.04 hace falta el perfil de AppArmor). */
export function bwrapWorks(bin = 'bwrap'): boolean {
  if (process.platform !== 'linux') return false;
  const r = spawnSync(bin, ['--ro-bind', '/usr', '/usr', '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/lib', '/lib', '--symlink', 'usr/lib64', '/lib64', '--proc', '/proc', '--dev', '/dev', '--unshare-pid', '--die-with-parent', '/usr/bin/true'], { timeout: 5000 });
  return r.status === 0;
}
