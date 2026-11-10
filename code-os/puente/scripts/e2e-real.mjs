// E2E real contra un puente en marcha (con LiteLLM de verdad). Uso:
//   PUENTE_URL=http://127.0.0.1:4200 PUENTE_TOKEN=... node scripts/e2e-real.mjs cp-glm-5.3 [modo]
const base = process.env.PUENTE_URL ?? 'http://127.0.0.1:4200';
const H = { authorization: `Bearer ${process.env.PUENTE_TOKEN}`, 'content-type': 'application/json' };
const [model, mode = 'code'] = process.argv.slice(2);
const api = async (m, p, b) => { const r = await fetch(base + p, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, json: await r.json() }; };

const s = (await api('POST', '/sessions', { projectId: `e2e-${model.replace(/[^a-z0-9]/g, '-')}-${mode}`, model, mode })).json;
if (!s.id) { console.error('no se creó la sesión', s); process.exit(1); }
const prompt = mode === 'chat' ? 'Responde en una frase: ¿qué es un puente?'
  : mode === 'plan' ? 'Planea (sin ejecutar) cómo crearías un archivo hola.txt con la palabra hola.'
  : 'Crea el archivo hola.txt con el texto "hola desde el puente" y luego ejecuta `env | grep -c -E "LITELLM|ANTHROPIC|PUENTE"` con Bash y dime el número que imprime.';
const t0 = Date.now();
await api('POST', `/sessions/${s.id}/messages`, { text: prompt });
const res = await fetch(`${base}/sessions/${s.id}/events`, { headers: H });
const counts = {}; const perms = []; let end, tools = [], buf = '';
const dec = new TextDecoder();
outer: for await (const chunk of res.body) {
  buf += dec.decode(chunk, { stream: true });
  let i;
  while ((i = buf.indexOf('\n\n')) >= 0) {
    const block = buf.slice(0, i); buf = buf.slice(i + 2);
    const d = block.split('\n').find((l) => l.startsWith('data: ')); if (!d) continue;
    const e = JSON.parse(d.slice(6)); counts[e.type] = (counts[e.type] ?? 0) + 1;
    if (e.type === 'tool_call') tools.push(e.name);
    if (e.type === 'tool_result') console.log('  resultado', e.isError ? '(error)' : '', e.content.slice(0, 120).replace(/\n/g, ' '));
    if (e.type === 'permission_request') { perms.push(e.tool); await api('POST', `/sessions/${s.id}/permissions/${e.requestId}`, { decision: e.tool === 'ExitPlanMode' ? 'deny' : 'allow', message: 'solo planear' }); }
    if (e.type === 'turn_end') { end = e; break outer; }
  }
}
console.log(JSON.stringify({ model, mode, segundos: +((Date.now() - t0) / 1000).toFixed(1), ok: end?.ok, reason: end?.reason, turnos: end?.turns, usage: end?.usage, herramientas: tools, permisos: perms, eventos: counts, respuesta: (end?.result ?? end?.error ?? '').slice(0, 300) }, null, 1));
