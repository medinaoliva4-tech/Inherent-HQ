#!/usr/bin/env node
// Asistente de arranque de Code OS (corre en el VPS). Uso:
//   asistente.sh                     revisa todo y, si todo pasa, activa la interfaz
//   asistente.sh usuario <id> [--email nombre@inherentglobal.com] [--niveles nivel-alto,nivel-medio,nivel-bajo] [--directos cp-,nv-] [--presupuesto 5] [--dias 30]
//   asistente.sh desactivar          apaga la interfaz (quita el flag)
// Nunca imprime ni lee contraseñas, tokens de login ni llaves: solo dice si están o no.
import { createHash, randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, statfsSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const NIVELES = ['nivel-alto', 'nivel-medio', 'nivel-bajo'];
const LLAVES = [
  ['LITELLM_MASTER_KEY', 'la llave maestra del Gateway', true],
  ['CLINE_API_KEY', 'Cline Pass (nivel medio y respaldo del alto)', true],
  ['NVIDIA_API_KEY', 'NVIDIA (nivel bajo, gratis)', true],
  ['DEEPSEEK_API_KEY', 'DeepSeek (válvula de pago, opcional)', false],
];

export function entorno(e = process.env) {
  const home = e.HOME ?? homedir();
  const data = e.PUENTE_DATA_DIR ?? join(home, 'code-os-data');
  return {
    home, data,
    envFile: e.GATEWAY_ENV ?? join(home, 'gateway/.env'),
    litellm: (e.LITELLM_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, ''),
    cuotas: (e.CUOTAS_URL ?? 'http://127.0.0.1:4200').replace(/\/$/, ''),
    puente: (e.PUENTE_URL ?? 'http://127.0.0.1:4300').replace(/\/$/, ''),
    litellmYaml: e.LITELLM_YAML ?? join(home, 'gateway/litellm.yaml'),
    usersFile: e.PUENTE_USERS_FILE ?? join(data, 'users.json'),
    flag: e.PUENTE_FLAG_FILE ?? join(data, 'interfaz-activada'),
    claude: e.PUENTE_CLAUDE_PATH ?? 'claude',
    setKeys: e.SET_KEYS ?? join(home, 'set-keys.sh'),
    units: (e.ASISTENTE_UNITS ?? 'litellm,gw-worker,cuotas,code-os-puente').split(','),
    minDiscoGB: Number(e.ASISTENTE_MIN_DISCO_GB ?? 5),
  };
}

/** Lee solo los NOMBRES con valor del .env (los valores se usan en memoria y no se imprimen). */
export function leerEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const l of readFileSync(path, 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim());
    if (m && m[2]) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

// Respaldos por nivel (espejo de router_settings.fallbacks de litellm.yaml). La llave virtual debe incluirlos:
// LiteLLM revisa el acceso del modelo de respaldo con la llave de quien llama, y sin ellos el respaldo falla.
const FALLBACKS = {
  'nivel-alto': ['cp-kimi-k3.1-pro', 'cp-kimi-k3', 'cp-glm-5.3', 'cp-deepseek-v4-pro', 'cp-minimax-m3', 'nv-nemotron-3-ultra', 'nv-mistral-large-4'],
  'nivel-medio': ['cp-glm-5.3', 'cp-deepseek-v4-pro', 'cp-minimax-m3', 'nv-nemotron-3-ultra', 'nv-mistral-large-4'],
  'nivel-bajo': ['nv-mistral-large-4', 'nv-nemotron-lightning', 'nv-deepseek-v4.1-flash'],
};
export function respaldos(yamlPath) {
  const out = { ...FALLBACKS };
  try { for (const m of readFileSync(yamlPath, 'utf8').matchAll(/^\s*-\s*(nivel-[a-z-]+):\s*\[([^\]]*)\]/gm)) out[m[1]] = m[2].split(',').map((x) => x.trim()).filter(Boolean); } catch { /* sin yaml: valores por defecto */ }
  return out;
}

const sh = (bin, args, env, ms = 8000) => new Promise((res) => execFile(bin, args, { env, timeout: ms }, (err, out) => res({ code: err ? (err.code === 'ENOENT' ? -1 : 1) : 0, out: String(out ?? '') })));
const j = async (url, init = {}, ms = 20000) => { const t0 = Date.now(); const r = await fetch(url, { ...init, signal: AbortSignal.timeout(ms) }); let body = null; try { body = await r.json(); } catch { /* no json */ } return { status: r.status, ok: r.ok, body, ms: Date.now() - t0 }; };

export function leerUsuarios(path) { return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { users: [] }; }
function guardarUsuarios(path, data) {
  mkdirSync(join(path, '..'), { recursive: true });
  const tmp = `${path}.tmp`; writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 }); chmodSync(tmp, 0o600); renameSync(tmp, path);
}

/** Crea (o rota) un usuario: llave virtual en LiteLLM con presupuesto y modelos limitados + token del puente (solo se muestra una vez). */
export async function crearUsuario(env, master, id, { niveles = NIVELES, directos = [], presupuesto = 5, dias = 30, emails } = {}) {
  if (!/^[a-z0-9][a-z0-9_-]{0,31}$/.test(id ?? '')) throw new Error('El id debe ser en minúsculas, números, - o _ (máx. 32)');
  if (niveles.some((n) => !NIVELES.concat('nivel-bajo-pago').includes(n))) throw new Error('Nivel desconocido');
  const auth = { authorization: `Bearer ${master}`, 'content-type': 'application/json' };
  const ms = await j(`${env.litellm}/v1/models`, { headers: auth });
  const todos = (ms.body?.data ?? []).map((m) => m.id);
  const fb = respaldos(env.litellmYaml);
  const modelos = [...new Set([...niveles, ...niveles.flatMap((n) => fb[n] ?? []), ...todos.filter((m) => directos.some((p) => m.startsWith(p)))])].filter((m) => niveles.includes(m) || todos.includes(m));
  const datos = leerUsuarios(env.usersFile);
  const previo = datos.users.find((u) => u.id === id);
  // Rotar: borra la llave anterior de este usuario (por llave y por alias) antes de crear la nueva.
  await j(`${env.litellm}/key/delete`, { method: 'POST', headers: auth, body: JSON.stringify(previo?.litellmKey ? { keys: [previo.litellmKey] } : { key_aliases: [`code-os-${id}`] }) }).catch(() => {});
  const k = await j(`${env.litellm}/key/generate`, { method: 'POST', headers: auth, body: JSON.stringify({ key_alias: `code-os-${id}`, user_id: id, models: modelos, max_budget: presupuesto, budget_duration: `${dias}d`, max_parallel_requests: 3, metadata: { origen: 'code-os-asistente' } }) });
  if (!k.ok || !k.body?.key) throw new Error(`LiteLLM no creó la llave (HTTP ${k.status}: ${String(k.body?.error?.message ?? '').slice(0, 160)}). ¿Tiene base de datos conectada?`);
  const token = randomBytes(24).toString('base64url');
  const reg = { id, tokenHash: createHash('sha256').update(token).digest('hex'), litellmKey: k.body.key, levels: niveles, modelPrefixes: directos, emails: (emails ?? previo?.emails ?? []).map((e) => e.toLowerCase()) };
  datos.users = datos.users.filter((u) => u.id !== id).concat(reg);
  guardarUsuarios(env.usersFile, datos);
  mkdirSync(join(env.data, 'users', id, 'home'), { recursive: true });
  return { token, modelos, presupuesto, dias };
}

/** Ejecuta las revisiones. Devuelve [{ok, aviso, texto, siguiente, critico}]. */
export async function revisar(env, { llamar = true } = {}) {
  const r = []; const add = (ok, texto, siguiente, critico = true, aviso = false) => r.push({ ok, aviso, texto, siguiente, critico });
  const llaves = leerEnv(env.envFile); const master = llaves.LITELLM_MASTER_KEY;
  const auth = { authorization: `Bearer ${master}` };

  // 1. Llaves presentes (sin imprimirlas)
  const faltan = LLAVES.filter(([k, , req]) => req && !llaves[k]);
  const opc = LLAVES.filter(([k, , req]) => !req && !llaves[k]).map(([, d]) => d);
  add(!faltan.length, faltan.length ? `Faltan llaves: ${faltan.map(([, d]) => d).join(', ')}` : `Llaves presentes (${LLAVES.filter(([k]) => llaves[k]).length}/${LLAVES.length}${opc.length ? `; opcional sin poner: ${opc.join(', ')}` : ''})`,
    `Pégalas ocultas con: bash ${env.setKeys}  (luego: sudo systemctl restart litellm)`);

  // 2. LiteLLM + base de datos
  let db = false, vivo = false;
  try { const h = await j(`${env.litellm}/health/readiness`, {}, 8000); vivo = h.ok; db = h.body?.db === 'connected'; } catch { /* caído */ }
  add(vivo, vivo ? 'LiteLLM responde' : 'LiteLLM no responde', 'sudo systemctl restart litellm && journalctl -u litellm -n 30');
  add(db, db ? 'LiteLLM tiene base de datos (llaves virtuales disponibles)' : 'LiteLLM sin base de datos: no se pueden crear llaves por usuario', 'Revisa DATABASE_URL en ~/gateway/litellm-db.env y que `docker ps` muestre litellm-pg');

  // 3. Los tres niveles, con una llamada real a cada uno
  if (vivo && master && llamar) {
    for (const n of NIVELES) {
      try {
        const c = await j(`${env.litellm}/v1/chat/completions`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ model: n, max_tokens: 24, messages: [{ role: 'user', content: 'Responde solo: ok' }] }) }, 70000);
        const quien = c.body?.model ? ` · respondió ${c.body.model}` : '';
        add(c.ok, c.ok ? `${n}: responde en ${(c.ms / 1000).toFixed(1)} s${quien}` : `${n}: falló (HTTP ${c.status})`, `Mira los avisos del medidor y 'journalctl -u litellm -n 50'; el respaldo del nivel debería tomarlo solo`);
      } catch (e) { add(false, `${n}: sin respuesta (${e.name === 'TimeoutError' ? 'tiempo agotado' : e.message})`, `journalctl -u litellm -n 50`); }
    }
  } else add(false, 'Niveles: no se pudieron probar (falta LiteLLM o la llave maestra)', 'Arregla lo anterior y vuelve a correr el asistente');

  // 4. Claude logueado (cada persona, por su cuenta)
  const usuarios = leerUsuarios(env.usersFile).users;
  const ver = await sh(env.claude, ['--version'], { PATH: process.env.PATH });
  if (ver.code === -1) add(false, 'El cliente oficial `claude` no está instalado', 'sudo npm i -g @anthropic-ai/claude-code', false, true);
  else {
    const act = [];
    for (const u of usuarios) {
      const home = join(env.data, 'users', u.id, 'home');
      const s = await sh(env.claude, ['auth', 'status', '--json'], { PATH: process.env.PATH, HOME: home, CLAUDE_CONFIG_DIR: join(home, '.claude') });
      try { if (JSON.parse(s.out).loggedIn) act.push(u.id); } catch { /* sin sesión */ }
    }
    const sin = usuarios.filter((u) => !act.includes(u.id)).map((u) => u.id);
    add(!sin.length && usuarios.length > 0, usuarios.length ? `Sesión de Claude: activa para ${act.join(', ') || 'nadie'}${sin.length ? ` · falta ${sin.join(', ')}` : ''}` : 'Sesión de Claude: aún no hay usuarios', sin.length ? `Cada persona corre en la terminal del servidor: code-os-login ${sin[0]}   (inicia sesión con SU cuenta en el navegador; yo no veo ni pido contraseñas)` : 'Crea un usuario primero', false, true);
  }

  // 5. Cuotas
  try { const c = await j(`${env.cuotas}/cuotas`, {}, 6000); add(c.ok, c.ok ? 'Medidor de cuotas activo' : `Medidor de cuotas respondió ${c.status}`, 'sudo systemctl restart cuotas'); }
  catch { add(false, 'Medidor de cuotas caído', 'sudo systemctl enable --now cuotas'); }

  // 6. Servicios y disco
  for (const u of env.units) {
    const s = await sh('systemctl', ['is-active', u], process.env);
    const activo = s.out.trim() === 'active';
    add(activo, `${u}: ${s.out.trim() || 'desconocido'}`, `sudo systemctl restart ${u} && journalctl -u ${u} -n 30`, u !== 'code-os-puente' || true);
  }
  try { const f = statfsSync(env.home); const libre = (f.bavail * f.bsize) / 2 ** 30; add(libre >= env.minDiscoGB, `Disco libre: ${libre.toFixed(0)} GB`, `Libera espacio (docker system prune, journalctl --vacuum-size=200M)`); } catch { add(false, 'No pude leer el disco', 'df -h'); }

  // 7. Puente: salud, confinamiento, usuarios
  try {
    const h = await j(`${env.puente}/health`, {}, 5000); add(h.ok, h.ok ? 'Puente responde' : 'Puente no responde', 'sudo systemctl restart code-os-puente');
  } catch { add(false, 'Puente no responde', 'sudo systemctl restart code-os-puente && journalctl -u code-os-puente -n 30'); }
  const bw = await sh('bwrap', ['--ro-bind', '/usr', '/usr', '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/lib', '/lib', '--symlink', 'usr/lib64', '/lib64', '--proc', '/proc', '--dev', '/dev', '--unshare-pid', '/usr/bin/true']);
  add(bw.code === 0, bw.code === 0 ? 'Confinamiento (bubblewrap) activo: Code y Plan habilitados' : 'Confinamiento (bubblewrap) no funciona: Code y Plan quedan apagados (Chat sí funciona)', 'Una sola vez, con sudo: bash ~/code-os/despliegue/habilitar-bwrap.sh  (perfil de AppArmor solo para /usr/bin/bwrap)');
  add(usuarios.length > 0, usuarios.length ? `Usuarios: ${usuarios.map((u) => u.id).join(', ')}` : 'No hay usuarios', 'Crea el primero: asistente.sh usuario <tu-nombre>');
  return r;
}

export function imprimir(r, log = console.log) {
  for (const x of r) { log(`${x.ok ? '✓' : x.aviso ? '!' : '✗'} ${x.texto}`); if (!x.ok) log(`   → ${x.siguiente}`); }
  const fallos = r.filter((x) => !x.ok && x.critico);
  return fallos.length === 0;
}

export async function main(argv = process.argv.slice(2), e = process.env, log = console.log) {
  const env = entorno(e); const [cmd, ...rest] = argv;
  if (cmd === 'usuario') {
    const id = rest[0]; const o = {}; for (let i = 1; i < rest.length; i += 2) o[rest[i].replace(/^--/, '')] = rest[i + 1];
    const master = leerEnv(env.envFile).LITELLM_MASTER_KEY; if (!master) { log('✗ No encuentro la llave maestra en el .env del Gateway'); return 1; }
    const u = await crearUsuario(env, master, id, { niveles: o.niveles?.split(','), directos: o.directos?.split(',').filter(Boolean), presupuesto: o.presupuesto ? Number(o.presupuesto) : undefined, dias: o.dias ? Number(o.dias) : undefined, emails: o.email?.split(',').filter(Boolean) });
    log(`✓ Usuario ${id} creado: llave virtual con tope de $${u.presupuesto} cada ${u.dias} días y ${u.modelos.length} modelos/niveles.`);
    log(`  Su token del puente (se muestra UNA vez, guárdalo en su gestor de contraseñas):\n\n    ${u.token}\n`);
    log(`→ Siguiente: sudo systemctl restart code-os-puente · luego la persona corre: code-os-login ${id}`);
    return 0;
  }
  if (cmd === 'desactivar') { if (existsSync(env.flag)) unlinkSync(env.flag); log('✓ Interfaz desactivada'); return 0; }
  log('Code OS · revisión de arranque\n');
  const ok = imprimir(await revisar(env), log);
  log('');
  if (ok) { mkdirSync(join(env.flag, '..'), { recursive: true }); writeFileSync(env.flag, new Date().toISOString() + '\n'); log('✓ Todo en orden: interfaz ACTIVADA.'); return 0; }
  if (existsSync(env.flag)) unlinkSync(env.flag);
  log('✗ Hay cosas por arreglar (marcadas con →). La interfaz queda DESACTIVADA. Arregla y vuelve a correr este comando.');
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main().then((c) => process.exit(c), (e) => { console.error('✗', e.message); process.exit(1); });
