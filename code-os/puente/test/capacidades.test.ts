import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AlmacenJson, Memoria } from 'code-os-herramientas';
import { boot, fakeQuery, fakeServices, init, result, testConfig, USER_A, USER_B, TOKEN_B } from './helpers.js';
import { clasificar, makeSondeo, montajesSoloLectura, MOTIVO_MAC, resolverEntrada, type EstadoCap, type Sondeo } from '../src/capacidades.js';
import { hookPlan, resolverPlan } from '../src/plan.js';
import { llamarHerramientas } from '../src/herramientas-mcp.js';
import type { Config } from '../src/config.js';

const simple = async function* () { yield init(); yield result(); };
const CATALOGO = {
  figwright: { type: 'stdio', command: '/usr/bin/node', args: ['/opt/code-os-mcp/figwright/node_modules/@figwright/mcp/dist/index.mjs'], env: { FIGWRIGHT_PORT: '3055' }, description: 'Figma', 'x-puente': { ro: ['/opt/code-os-mcp/figwright'] } },
  imagen: { type: 'stdio', command: '/usr/bin/node', args: ['/srv/imagen/src/mcp.mjs'], env: { IMAGEN_LITELLM_URL: '${LITELLM_URL}', IMAGEN_LITELLM_KEY: '${USUARIO_LLAVE_LITELLM}', IMAGEN_SALIDA: '${PROYECTO}/imagenes', IMAGEN_GASTO: '${HOME_USUARIO}/imagen-gasto.jsonl' } },
};
/** Sondeo falso: todas listas salvo las que se indiquen. */
const sondeoFalso = (fuera: Record<string, string> = {}): Sondeo => async () => (['codigo', 'figwright', 'imagen', 'radar', 'video', 'herramientas'] as const).map((id) => ({ id, nombre: id, descripcion: 'd', pesada: ['codigo', 'figwright', 'imagen'].includes(id), ...(fuera[id] ? { estado: 'sin_conexion', motivo: fuera[id] } : { estado: 'lista' }) }) as EstadoCap);
const conCaps = (script: any, seen: any[], over: Partial<Config> = {}, svc = {}) => boot(fakeQuery(script, seen), testConfig(undefined, { mcpCatalog: { ...CATALOGO }, ...over }), fakeServices({ sondeo: sondeoFalso(), ...svc }));

test('capacidades: se validan, se cambian entre turnos y el chat sin capacidades no tiene herramientas', async () => {
  const seen: any[] = [];
  const t = await conCaps(simple, seen);
  assert.equal((await t.api('POST', '/sessions', { projectId: 'demo', capacidades: ['figma-directo'] })).status, 400);
  assert.equal((await t.api('POST', '/sessions', { projectId: 'demo', capacidades: 'figwright' })).status, 400);
  const s = (await t.api('POST', '/sessions', { projectId: 'demo', mode: 'chat', capacidades: [] })).json;
  assert.deepEqual(s.capacidades, []);
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'hola' });
  await t.events(s.id, (e) => e.type === 'turn_end');
  assert.deepEqual(seen[0].tools, []); assert.equal(seen[0].mcpServers, undefined);
  // Misma sesión: se activan capacidades y el siguiente turno retoma la conversación del SDK.
  const p = await t.api('PATCH', `/sessions/${s.id}`, { capacidades: ['figwright', 'imagen'] });
  assert.equal(p.status, 200); assert.deepEqual(p.json.capacidades, ['figwright', 'imagen']);
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'entra a Figma' });
  const ev = await t.events(s.id, (e) => e.type === 'turn_end' && e.seq > 5);
  assert.ok(ev.some((e) => e.type === 'capacidades_changed'));
  assert.equal(seen[1].resume, 'sdk-sess-1');
  assert.deepEqual(Object.keys(seen[1].mcpServers).sort(), ['figwright', 'imagen']);
  assert.deepEqual(seen[1].tools, []); // sin `codigo` no hay Bash/Write/Edit
  assert.equal(seen[1].permissionMode, 'default');
  assert.match(seen[1].systemPrompt.append, /list_files/);
  await t.close();
});

test('capacidades: el catálogo se resuelve por persona (su llave virtual, su proyecto) y no filtra claves del puente', () => {
  const cfg = testConfig(undefined, { mcpCatalog: CATALOGO });
  const e = resolverEntrada(CATALOGO.imagen, { cfg, user: USER_A, cwd: '/w/ana/p', home: '/h/ana' }) as any;
  assert.equal(e.env.IMAGEN_LITELLM_KEY, 'sk-ana-limitada');
  assert.equal(e.env.IMAGEN_SALIDA, '/w/ana/p/imagenes');
  assert.equal(e.env.IMAGEN_GASTO, '/h/ana/imagen-gasto.jsonl');
  const f = resolverEntrada(CATALOGO.figwright, { cfg, user: USER_A, cwd: '/w', home: '/h' }) as any;
  assert.equal(f.description, undefined); assert.equal(f['x-puente'], undefined);
  // Montajes de solo lectura: nunca la carpeta de datos ni algo que la contenga.
  const d = mkdtempSync(join(tmpdir(), 'ro-'));
  const c2 = { dataDir: join(d, 'data'), mcpCatalog: { a: { 'x-puente': { ro: [d, '/', 'relativa', join(d, 'no-existe'), tmpdir()] } } } };
  assert.deepEqual(montajesSoloLectura(c2 as any, ['a']).filter((x) => x.includes('ro-')), []);
});

test('capacidades: la que no está lista se omite del turno y turn_start dice por qué', async () => {
  const seen: any[] = [];
  const t = await conCaps(simple, seen, {}, { sondeo: sondeoFalso({ figwright: MOTIVO_MAC }) });
  const s = (await t.api('POST', '/sessions', { projectId: 'demo', mode: 'chat', capacidades: ['figwright'] })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'diseña' });
  const ev = await t.events(s.id, (e) => e.type === 'turn_end');
  const st = ev.find((e) => e.type === 'turn_start');
  assert.deepEqual(st.capacidades, []); assert.equal(st.capacidadesOmitidas[0].id, 'figwright'); assert.match(st.capacidadesOmitidas[0].motivo, /Mac/);
  assert.equal(seen[0].mcpServers, undefined); assert.match(seen[0].systemPrompt.append, /No disponibles ahora/);
  await t.close();
});

test('GET /capacidades: sondeo real de Figwright (túnel), imagen por llave y apagadas sin catálogo', async () => {
  const pings: Record<string, any> = { up: { ok: true, plugins: 2 }, vacio: { ok: true, plugins: 0 } };
  let modo = 'down';
  const fetchFn = (async (url: string) => {
    if (String(url).includes(':3055/ping')) { if (modo === 'down') throw new Error('ECONNREFUSED'); return new Response(JSON.stringify(pings[modo])); }
    throw new Error('x');
  }) as unknown as typeof fetch;
  const models = { list: async (u: any) => (u.id === 'ana' ? [{ id: 'imagen-media' }, { id: 'nivel-medio' }] : [{ id: 'nivel-bajo' }]), has: async () => true };
  const mk = (cfg: Config) => makeSondeo({ cfg, models: models as any, confined: () => true, herramientas: false, fetchFn, ttlMs: 0 });
  const s = mk(testConfig(undefined, { mcpCatalog: CATALOGO }));
  const est = (l: EstadoCap[], id: string) => l.find((x) => x.id === id)!;
  let l = await s(USER_A);
  assert.equal(est(l, 'figwright').estado, 'sin_conexion'); assert.equal(est(l, 'figwright').motivo, MOTIVO_MAC);
  modo = 'vacio'; l = await s(USER_A); assert.match(est(l, 'figwright').motivo!, /plugin/);
  modo = 'up'; l = await s(USER_A); assert.equal(est(l, 'figwright').estado, 'lista');
  assert.equal(est(l, 'imagen').estado, 'lista');
  assert.equal(est(await s(USER_B), 'imagen').estado, 'sin_conexion');
  assert.equal(est(l, 'radar').estado, 'apagada'); assert.match(est(l, 'radar').motivo!, /PUENTE_MCP_CONFIG/);
  assert.equal(est(l, 'herramientas').estado, 'apagada');
  assert.equal(est(l, 'codigo').estado, 'lista');
  // Sin bwrap y con confinamiento obligatorio: todo lo que lanza procesos queda apagado.
  const sinJaula = makeSondeo({ cfg: testConfig(undefined, { mcpCatalog: CATALOGO, requireConfine: true }), models: models as any, confined: () => false, herramientas: true, fetchFn, ttlMs: 0 });
  const l2 = await sinJaula(USER_A);
  assert.equal(est(l2, 'codigo').estado, 'apagada'); assert.equal(est(l2, 'figwright').estado, 'apagada'); assert.equal(est(l2, 'herramientas').estado, 'lista');
  // Por HTTP (con el sondeo inyectado)
  const t = await conCaps(simple, []);
  const r = await t.api('GET', '/capacidades');
  assert.equal(r.status, 200); assert.equal(r.json.capacidades.length, 6);
  for (const c of r.json.capacidades) assert.ok(c.id && c.nombre && c.descripcion && ['lista', 'sin_conexion', 'apagada'].includes(c.estado));
  assert.equal((await t.api('GET', '/capacidades', undefined, null)).status, 401);
  await t.close();
});

test('capacidades: sin bubblewrap, las que lanzan procesos dan 503; herramientas (en proceso) sí', async () => {
  const t = await boot(fakeQuery(simple), testConfig(undefined, { requireConfine: true, mcpCatalog: CATALOGO }), fakeServices({ herramientas: new Memoria(new AlmacenJson(mkdtempSync(join(tmpdir(), 'h-')))) }));
  assert.equal((await t.api('POST', '/sessions', { projectId: 'demo', mode: 'chat', capacidades: ['figwright'] })).status, 503);
  const s = await t.api('POST', '/sessions', { projectId: 'demo', mode: 'chat', capacidades: ['herramientas'] });
  assert.equal(s.status, 201);
  assert.equal((await t.api('PATCH', `/sessions/${s.json.id}`, { capacidades: ['codigo'] })).status, 503);
  await t.close();
});

test('Figwright: no escribe sin archivo fijado con use_file; lecturas sin preguntar; borrar pide permiso aunque haya «sí a todo»', async () => {
  const r: string[] = [];
  const script = async function* (o: any, ctx: any) {
    yield init();
    const c = (tool: string, input: any, id: string) => o.canUseTool(tool, input, { signal: ctx.signal, toolUseID: id });
    r.push((await c('mcp__figwright__create_frame', { name: 'x' }, 'a')).behavior);
    r.push((await c('mcp__figwright__get_document', {}, 'b')).behavior);
    yield { type: 'assistant', message: { content: [{ type: 'tool_use', id: 'uf', name: 'mcp__figwright__use_file', input: { fileName: 'akai - brand world' } }] } };
    yield { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'uf', content: 'bound' }] } };
    r.push((await c('mcp__figwright__create_frame', { name: 'x' }, 'c')).behavior); // pide permiso → allow_all
    r.push((await c('mcp__figwright__set_fills', {}, 'd')).behavior); // automático por allow_all
    r.push((await c('mcp__figwright__delete_nodes', { ids: ['1:2'] }, 'e')).behavior); // irreversible: pregunta otra vez
    yield result();
  };
  const t = await conCaps(script, []);
  const s = (await t.api('POST', '/sessions', { projectId: 'demo', mode: 'chat', capacidades: ['figwright'] })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'x' });
  const asks: any[] = [];
  const ev = await t.events(s.id, (e) => e.type === 'turn_end', 0, async (e) => {
    if (e.type === 'permission_request') { asks.push(e); await t.api('POST', `/sessions/${s.id}/permissions/${e.requestId}`, { decision: e.tipo === 'irreversible' ? 'deny' : 'allow_all' }); }
  });
  assert.deepEqual(r, ['deny', 'allow', 'allow', 'allow', 'deny']);
  assert.equal(asks.length, 2);
  assert.equal(asks[0].archivo, 'akai - brand world'); assert.equal(asks[0].capacidad, 'figwright'); assert.equal(asks[0].tipo, 'escritura');
  assert.equal(asks[1].tipo, 'irreversible');
  assert.ok(ev.some((e) => e.type === 'figma_archivo' && e.archivo === 'akai - brand world'));
  assert.equal((await t.api('GET', `/sessions/${s.id}`)).json.figmaArchivo, 'akai - brand world');
  await t.close();
});

test('imagen: el monto lo fija la persona, nunca el modelo', async () => {
  const out: any[] = [];
  const script = async function* (o: any, ctx: any) {
    yield init();
    out.push(await o.canUseTool('mcp__imagen__imagen_generar', { nivel: 'imagen-media', cantidad: 3, aprobado_usd: 99 }, { signal: ctx.signal, toolUseID: 'g1' }));
    out.push(await o.canUseTool('mcp__imagen__imagen_generar', { nivel: 'imagen-media', cantidad: 3, aprobado_usd: 99 }, { signal: ctx.signal, toolUseID: 'g2' }));
    out.push(await o.canUseTool('mcp__imagen__imagen_estimar', { nivel: 'imagen-media' }, { signal: ctx.signal, toolUseID: 'g3' }));
    yield result();
  };
  const t = await conCaps(script, []);
  const s = (await t.api('POST', '/sessions', { projectId: 'demo', mode: 'chat', capacidades: ['imagen'] })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'x' });
  let n = 0;
  await t.events(s.id, (e) => e.type === 'turn_end', 0, async (e) => {
    if (e.type !== 'permission_request') return;
    assert.equal(e.requiereAprobadoUsd, true); assert.equal(e.input.aprobado_usd, undefined, 'el monto del modelo no se muestra como aprobado');
    if (n++ === 0) await t.api('POST', `/sessions/${s.id}/permissions/${e.requestId}`, { decision: 'allow_all' });
    else { assert.equal((await t.api('POST', `/sessions/${s.id}/permissions/${e.requestId}`, { decision: 'allow', aprobado_usd: -1 })).status, 400); await t.api('POST', `/sessions/${s.id}/permissions/${e.requestId}`, { decision: 'allow', aprobado_usd: 0.12 }); }
  });
  assert.equal(out[0].behavior, 'deny'); assert.match(out[0].message, /monto aprobado/);
  assert.equal(out[1].behavior, 'allow'); assert.equal(out[1].updatedInput.aprobado_usd, 0.12);
  assert.equal(out[2].behavior, 'allow');
  await t.close();
});

test('planifica/ejecuta: automático con capacidad pesada y nivel alto; por LiteLLM y por login de Claude; se puede apagar', async () => {
  const seen: any[] = [];
  const t = await conCaps(simple, seen);
  const turno = async (body: any, claude = false) => {
    (t.svc as any).claudeActive.ana = claude;
    const s = (await t.api('POST', '/sessions', { projectId: 'demo', mode: 'chat', ...body })).json;
    await t.api('POST', `/sessions/${s.id}/messages`, { text: 'x' });
    const ev = await t.events(s.id, (e) => e.type === 'turn_end');
    return { st: ev.find((e) => e.type === 'turn_start'), o: seen.at(-1) };
  };
  let { st, o } = await turno({ model: 'nivel-alto', capacidades: ['figwright'] });
  assert.equal(st.planEjecucion, true); assert.equal(st.planner, 'nivel-alto'); assert.equal(st.executor, 'nivel-medio');
  assert.equal(o.agents.ejecutor.model, 'nivel-medio'); assert.deepEqual(o.tools, ['Agent']); assert.ok(o.hooks.PreToolUse);
  assert.equal(o.env.ANTHROPIC_DEFAULT_OPUS_MODEL, 'nivel-alto'); assert.equal(o.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'nivel-medio'); assert.equal(o.env.CLAUDE_CODE_SUBAGENT_MODEL, 'nivel-medio');
  assert.match(o.systemPrompt.append, /PLANIFICADOR/);
  // Con login de Claude: opus planea, haiku ejecuta (alias nativos), sin llaves en el entorno.
  ({ st, o } = await turno({ model: 'nivel-alto', capacidades: ['figwright'] }, true));
  assert.equal(st.via, 'claude_login'); assert.equal(st.planner, 'opus'); assert.equal(st.executor, 'haiku');
  assert.equal(o.agents.ejecutor.model, 'haiku'); assert.equal(o.env.CLAUDE_CODE_SUBAGENT_MODEL, 'haiku'); assert.equal(o.env.ANTHROPIC_AUTH_TOKEN, undefined);
  // Sin capacidad pesada o con modelo medio: no se reparte. Apagado explícito: tampoco.
  ({ st, o } = await turno({ model: 'nivel-alto', capacidades: ['herramientas'] })); assert.equal(st.planEjecucion, false); assert.equal(o.agents, undefined);
  ({ st } = await turno({ model: 'nivel-medio', capacidades: ['figwright'] })); assert.equal(st.planEjecucion, false);
  ({ st } = await turno({ model: 'nivel-alto', capacidades: ['figwright'], plan_ejecucion: false })); assert.equal(st.planEjecucion, false);
  // Explícito con modelos elegidos: planifica `opus` (sin login cae a nivel-alto), ejecuta nivel-bajo.
  ({ st, o } = await turno({ model: 'nivel-medio', capacidades: ['codigo'], plan_ejecucion: { planifica: 'opus', ejecuta: 'nivel-bajo' } }));
  assert.equal(st.planner, 'nivel-alto'); assert.equal(st.executor, 'nivel-bajo'); assert.equal(o.tools, undefined);
  // Modelos fuera de su permiso: 403 al fijarlos.
  assert.equal((await t.api('POST', '/sessions', { projectId: 'demo', capacidades: ['codigo'], plan_ejecucion: { ejecuta: 'cp-glm-5.3' } }, TOKEN_B)).status, 403);
  assert.equal((await t.api('POST', '/sessions', { projectId: 'demo', plan_ejecucion: 'si' })).status, 400);
  await t.close();
});

test('planifica/ejecuta: el reparto se resuelve sin ejecutor no permitido y el hook obliga a delegar', async () => {
  const route = { via: 'litellm' as const, model: 'nivel-alto' };
  const r = resolverPlan({ pe: true, caps: ['figwright'], route, planifica: 'nivel-alto', user: USER_B, defaults: { claude: 'haiku', litellm: 'nivel-medio' } });
  assert.equal(r.activo, false); assert.match(r.motivo!, /no tiene permitido/);
  const h = hookPlan();
  const deny: any = await h({ tool_name: 'mcp__figwright__create_frame', tool_input: {} });
  assert.equal(deny.hookSpecificOutput.permissionDecision, 'deny');
  assert.deepEqual(await h({ tool_name: 'mcp__figwright__create_frame', tool_input: {}, agent_id: 'a1' }), { continue: true });
  assert.deepEqual(await h({ tool_name: 'mcp__figwright__get_node', tool_input: {} }), { continue: true });
  const ag: any = await h({ tool_name: 'Agent', tool_input: { subagent_type: 'ejecutor', prompt: 'p', description: 'd', model: 'opus', isolation: 'remote' } });
  assert.deepEqual(ag.hookSpecificOutput.updatedInput, { subagent_type: 'ejecutor', prompt: 'p', description: 'd', run_in_background: false });
  assert.deepEqual(clasificar('Bash'), { cap: 'codigo', tipo: 'escritura' });
  assert.equal(clasificar('mcp__herramientas__herramientas_api', { metodo: 'GET' }).tipo, 'lectura');
  assert.equal(clasificar('mcp__imagen__imagen_variantes').tipo, 'gasto');
});

test('GET /models: conserva default/models y agrega modelos (con Claude por login) y presets', async () => {
  const t = await conCaps(simple, []);
  let m = (await t.api('GET', '/models')).json;
  assert.equal(m.default, 'cp-glm-5.3'); assert.ok(Array.isArray(m.models));
  const ids = m.modelos.map((x: any) => x.id);
  for (const id of ['opus', 'sonnet', 'haiku', 'nivel-alto', 'nivel-medio', 'nivel-bajo', 'cp-glm-5.3', 'nv-x']) assert.ok(ids.includes(id), id);
  for (const x of m.modelos) { assert.ok(['alto', 'medio', 'bajo'].includes(x.nivel)); assert.ok(['claude_login', 'litellm'].includes(x.via)); assert.equal(typeof x.costo_relativo, 'number'); assert.ok(x.roles.length); }
  assert.equal(m.modelos.find((x: any) => x.id === 'opus').disponible, false);
  assert.deepEqual(m.modelos.find((x: any) => x.id === 'nivel-alto').respaldos.slice(0, 1), ['cp-kimi-k3.1-pro']);
  assert.deepEqual(m.presets.map((p: any) => p.id), ['planifica-fuerte', 'rapido-gratis', 'maxima-calidad']);
  assert.equal(m.presets[0].planifica, 'nivel-alto');
  (t.svc as any).claudeActive.ana = true;
  m = (await t.api('GET', '/models')).json;
  assert.equal(m.modelos.find((x: any) => x.id === 'opus').disponible, true); assert.equal(m.presets[0].planifica, 'opus'); assert.equal(m.presets[0].ejecuta, 'haiku');
  // El alias de Claude se acepta como modelo de sesión
  assert.equal((await t.api('POST', '/sessions', { projectId: 'demo', model: 'opus' })).status, 201);
  assert.equal((await t.api('POST', '/sessions', { projectId: 'demo', model: 'opus' }, TOKEN_B)).status, 403);
  await t.close();
});

test('herramientas como capacidad: MCP en el proceso del puente; aprobar queda fuera', async () => {
  const mem = new Memoria(new AlmacenJson(mkdtempSync(join(tmpdir(), 'hm-'))));
  const c = await llamarHerramientas(mem, 'ana', { metodo: 'POST', ruta: '/clientes/akai/nodos', cuerpo: { tipo: 'dolor', titulo: 'Sin tiempo' } });
  assert.equal(c.isError, false); assert.match(c.content[0]!.text, /dolor-1/);
  assert.equal((await llamarHerramientas(mem, 'ana', { metodo: 'GET', ruta: '/clientes/akai/nodos?tipo=dolor' })).isError, false);
  assert.equal((await llamarHerramientas(mem, 'ana', { metodo: 'POST', ruta: '/clientes/akai/nodos/dolor-1/aprobar' })).isError, true);
  assert.equal((await llamarHerramientas(mem, 'ana', { metodo: 'GET', ruta: '/sessions' })).isError, true);
  const seen: any[] = [];
  const t = await conCaps(simple, seen, {}, { herramientas: mem });
  const s = (await t.api('POST', '/sessions', { projectId: 'demo', mode: 'chat', capacidades: ['herramientas'] })).json;
  await t.api('POST', `/sessions/${s.id}/messages`, { text: 'x' });
  await t.events(s.id, (e) => e.type === 'turn_end');
  assert.equal(seen[0].mcpServers.herramientas.type, 'sdk');
  await t.close();
});

test('la plantilla code-os/despliegue/puente-mcp.json carga como catálogo y solo monta /opt/code-os-mcp', async () => {
  const { loadConfig } = await import('../src/config.js');
  const { fileURLToPath } = await import('node:url');
  const plantilla = fileURLToPath(new URL('../../despliegue/puente-mcp.json', import.meta.url));
  const cfg = loadConfig({ PUENTE_MCP_CONFIG: plantilla, PUENTE_DATA_DIR: mkdtempSync(join(tmpdir(), 'pl-')) } as any, () => ({ users: [USER_A] }));
  assert.deepEqual(Object.keys(cfg.mcpCatalog).sort(), ['figwright', 'imagen']);
  for (const e of Object.values(cfg.mcpCatalog) as any[]) {
    assert.equal(e.command, '/usr/bin/node');
    for (const r of e['x-puente'].ro) assert.ok(r.startsWith('/opt/code-os-mcp/'));
    assert.ok(!JSON.stringify(e).match(/MASTER|sk-/));
  }
  const img = resolverEntrada(cfg.mcpCatalog.imagen, { cfg, user: USER_A, cwd: '/w', home: '/h' }) as any;
  assert.equal(img.env.IMAGEN_LITELLM_KEY, USER_A.litellmKey);
});
