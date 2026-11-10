// Prueba real del Agent SDK contra LiteLLM. Uso: node prueba-real.mjs <alias>
// Lee LITELLM_MASTER_KEY del entorno (nunca la imprime).
import { query } from '@anthropic-ai/claude-agent-sdk';
import { mkdirSync, writeFileSync } from 'node:fs';

const alias = process.argv[2];
const key = process.env.LITELLM_MASTER_KEY;
if (!alias || !key) { console.error('falta alias o LITELLM_MASTER_KEY'); process.exit(2); }
const cwd = `${process.env.HOME}/exp-sdk/trabajo-${alias}`;
mkdirSync(cwd, { recursive: true });
writeFileSync(`${cwd}/nota.txt`, 'El codigo secreto de la prueba es PUENTE-42.\n');

const permisos = [];
const t0 = Date.now();
const eventos = { texto: 0, razonamiento: 0, herramienta: 0, resultado: 0 };
let final = null;
const q = query({
  prompt: 'Lee el archivo nota.txt de esta carpeta y dime el codigo secreto en una frase corta.',
  options: {
    cwd,
    model: alias,
    maxTurns: 6,
    strictMcpConfig: true,
    settingSources: [],
    persistSession: false,
    permissionMode: 'default',
    includePartialMessages: true,
    canUseTool: async (tool, input) => {
      permisos.push(tool);
      return tool === 'Read' ? { behavior: 'allow', updatedInput: input } : { behavior: 'deny', message: 'no permitido en la prueba' };
    },
    env: {
      ...process.env,
      ANTHROPIC_BASE_URL: 'http://127.0.0.1:4000',
      ANTHROPIC_AUTH_TOKEN: key,
      ANTHROPIC_API_KEY: '',
      ANTHROPIC_CUSTOM_MODEL_OPTION: alias,
      ANTHROPIC_DEFAULT_SONNET_MODEL: alias,
      ANTHROPIC_DEFAULT_OPUS_MODEL: alias,
      ANTHROPIC_DEFAULT_HAIKU_MODEL: alias,
      CLAUDE_CODE_SUBAGENT_MODEL: alias,
      DISABLE_TELEMETRY: '1',
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    },
  },
});
for await (const m of q) {
  if (m.type === 'stream_event') {
    const d = m.event?.delta;
    if (d?.type === 'text_delta') eventos.texto++;
    if (d?.type === 'thinking_delta') eventos.razonamiento++;
  } else if (m.type === 'assistant') {
    for (const b of m.message.content) if (b.type === 'tool_use') eventos.herramienta++;
  } else if (m.type === 'user') {
    for (const b of m.message.content ?? []) if (b?.type === 'tool_result') eventos.resultado++;
  } else if (m.type === 'result') final = m;
}
console.log(JSON.stringify({
  alias, segundos: +((Date.now() - t0) / 1000).toFixed(1),
  subtype: final?.subtype, turnos: final?.num_turns, usage: final?.usage,
  costo_reportado: final?.total_cost_usd, permisos_pedidos: permisos, eventos,
  respuesta: String(final?.result ?? '').slice(0, 200),
}, null, 1));
