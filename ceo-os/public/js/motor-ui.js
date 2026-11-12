// El motor de los chats (Estrategia, Plan del mes, Diseño): el SERVIDOR de Inherent (por defecto: siempre encendido, con
// web y las conexiones de la persona; PLAN-GATEWAY F3) o, por el puente de Laya en tu compu, Claude, ChatGPT o un modelo
// local (leen el repo y no cambian nada; ChatGPT y los locales van por Codex; los locales, con Ollama). Hermes se retiró.
// La elección es de cada persona (localStorage) y vale para todos los chats.
import { html, raw, mount, ico } from './core.js';
import { menu } from './ui.js';

export const MOTORES = [['servidor', 'Servidor'], ['claude', 'Claude'], ['chatgpt', 'ChatGPT'], ['local', 'Modelo local']];
// servidor: el Gateway del VPS (chat-gateway.js). modelo = el modelo del servidor ('' = el de por defecto).
// Los modelos de Claude que se eligen aquí (alias de Claude Code: siempre el más nuevo de cada uno). Vacío = el de tu cuenta.
export const CLAUDE_MODELOS = [['opus', 'Opus', 'El más capaz'], ['sonnet', 'Sonnet', 'Equilibrado y rápido'], ['haiku', 'Haiku', 'El más rápido']];
const K = (me) => `os.motor.${me.email}`;
// Quien tenía Hermes (ya retirado) pasa al servidor.
export function motorDe(me) { try { const j = JSON.parse(localStorage.getItem(K(me)) || 'null'); if (j?.motor === 'hermes') return { motor: 'servidor', modelo: '', provider: '' }; if (j && MOTORES.some(([k]) => k === j.motor)) return { motor: j.motor, modelo: String(j.modelo || ''), provider: String(j.provider || '') }; } catch {} return { motor: 'servidor', modelo: '' }; }
export function setMotor(me, v) { try { localStorage.setItem(K(me), JSON.stringify({ motor: v.motor, modelo: v.modelo || '', provider: v.provider || '' })); } catch {} }
export const esServidor = (me) => motorDe(me).motor === 'servidor';
const corto = (m) => String(m || '').split('/').pop().slice(0, 28);
export const nombreMotor = (v) => (v.motor === 'servidor' ? (v.modelo ? `Servidor · ${corto(v.modelo)}` : 'Servidor') : v.motor === 'local' ? (v.modelo ? `Local · ${v.modelo}` : 'Modelo local') : v.motor === 'claude' && v.modelo ? `Claude ${CLAUDE_MODELOS.find(([k]) => k === v.modelo)?.[1] || ''}`.trim() : MOTORES.find(([k]) => k === v.motor)?.[1] || 'Claude');
// Lo que va en el cuerpo de POST /chat.
// El puente solo conoce claude, chatgpt y local: quien eligió el servidor y usa un chat del puente (Diseño, con Figma) va con Claude.
export const cuerpoMotor = (me) => { const v0 = motorDe(me), v = v0.motor === 'servidor' ? { motor: 'claude', modelo: '' } : v0; return { motor: v.motor, ...((v.motor === 'local' || (v.motor === 'claude' && CLAUDE_MODELOS.some(([k]) => k === v.modelo))) && v.modelo ? { modelo: v.modelo } : {}) }; };
// La sesión de un chat es de un motor: si cambió, se empieza una conversación nueva.
export const claveMotor = (me) => { const v = motorDe(me); return `${v.motor}:${v.modelo}`; };

// Qué le falta al motor elegido en esta compu (o null si está listo). m = el bloque «motores» de /health.
export function faltaMotor(me, chat, { diseno = false } = {}) {
  const v0 = motorDe(me), m = chat?.motores, v = v0.motor === 'servidor' && diseno ? { motor: 'claude', modelo: '' } : v0;
  if (v.motor === 'servidor') return null; // lo revisa la pantalla con saludServidor (chat-gateway.js)
  if (!m) return v.motor === 'claude' ? null : { t: 'Falta actualizar el puente', p: 'Tu puente todavía no trae ChatGPT ni los modelos locales. Corre otra vez el comando de instalar.', instalar: true };
  if (v.motor === 'claude') return m.claude ? null : { t: 'No encuentro Claude Code', p: 'Instálalo e inicia sesión con tu cuenta (en la Terminal: claude). O elige ChatGPT o un modelo local.' };
  if (diseno && v.motor === 'local') return { t: 'Los modelos locales no diseñan en Figma', p: 'Para Diseño usa Claude o ChatGPT.' };
  if (!m.chatgpt?.instalado) return { t: 'Falta Codex, el programa de ChatGPT', p: 'Es el mismo para ChatGPT y para los modelos locales. En la Terminal:', cmd: 'npm install -g @openai/codex' };
  if (v.motor === 'chatgpt') return m.chatgpt.sesion ? null : { t: 'Inicia la sesión de ChatGPT (una sola vez)', p: 'En la Terminal, corre esto y sigue lo que te pide en el navegador:', cmd: 'codex login' };
  if (!m.local?.modelos?.length) return { t: 'Falta un modelo local', p: 'Instala Ollama (ollama.com), ábrelo y baja un modelo que sepa usar herramientas. En la Terminal:', cmd: 'ollama pull gpt-oss:20b' };
  if (!v.modelo || !m.local.modelos.includes(v.modelo)) return { t: 'Elige qué modelo local usar', p: `En esta compu hay: ${m.local.modelos.join(', ')}.`, elegir: true };
  return null;
}
export const faltaHtml = (f, cmd) => html`<div class="es-setup"><b>${f.t}</b><p>${f.p}</p>${f.cmd ? cmd(f.cmd) : ''}<div class="row" style="gap:8px">${f.cmd || f.instalar ? html`<button class="btn sm" data-act="reintentar">Ya lo hice</button>` : ''}<button class="btn ghost sm" data-act="motor">${f.elegir ? 'Elegir modelo' : 'Cambiar de modelo'}</button></div></div>`;

// servidor = { en_linea, modelos } (saludServidor) cuando la pantalla lo averiguó.
export function menuMotor(anchor, me, chat, onPick, { diseno = false, laya = null, servidor = null } = {}) {
  const m = chat?.motores || {}, v = motorDe(me);
  const op = (motor, modelo, label, sub, off, provider = '') => ({ motor, modelo, provider, label, sub, off, on: v.motor === motor && (motor === 'chatgpt' || v.modelo === modelo) });
  // El servidor: siempre encendido, con web y las conexiones de la persona. Sus modelos (los primeros 4) o el de por defecto.
  const srv = servidor?.on ? [op('servidor', '', 'Servidor · siempre encendido', 'Responde aunque tu compu esté apagada', false), ...(servidor.modelos || []).slice(0, 4).map((x) => op('servidor', x, `Servidor · ${x}`, 'Modelo del servidor', false))]
    : [op('servidor', '', 'Servidor', servidor ? 'Fuera de línea ahora' : 'Siempre encendido', false)];
  const sinClaude = m.claude === false, conModelos = Boolean(chat?.claude_modelos);
  const items = [
    ...(diseno ? [] : srv),
    op('claude', '', 'Claude', sinClaude ? 'No está instalado en esta compu' : 'El modelo de tu cuenta', false),
    ...(conModelos && !sinClaude ? CLAUDE_MODELOS.map(([k, n, sub]) => op('claude', k, `Claude ${n}`, sub, false)) : []),
    op('chatgpt', '', 'ChatGPT', !m.chatgpt?.instalado ? 'Falta Codex' : m.chatgpt.sesion ? 'Codex, con tu cuenta de ChatGPT' : 'Falta iniciar la sesión', false),
    ...(diseno ? [] : (m.local?.modelos?.length ? m.local.modelos.map((x) => op('local', x, `Local · ${x}`, 'Ollama, en tu compu', false)) : [op('local', '', 'Modelo local', m.local?.instalado ? 'Falta Ollama o un modelo' : 'Falta Codex y Ollama', false)])),
  ];
  // El ui.menu del OS: el modelo de ahora con ✓, notas y el estado de Laya abajo.
  const pie = html`${diseno ? html`<p class="ui-menu-nota">Los modelos locales no diseñan en Figma.</p>` : ''}
    ${conModelos || sinClaude ? '' : html`<p class="ui-menu-nota">Para elegir Opus, Sonnet o Haiku, actualiza el puente (o usa la app de Mac).</p>`}
    ${laya ? html`<p class="mm-laya ${laya.listo ? 'ok' : ''}"><i></i>${laya.listo ? 'Laya lista' : laya.cargando ? 'Laya cargando…' : 'Laya no está instalada en esta compu'}<small>${laya.listo ? 'Juzga y enruta en tu compu' : laya.cargando ? 'La primera vez baja su modelo' : (window.inherentEscritorio ? 'Menú Puente › Instalar Laya' : 'La app de Mac la instala sola')}</small></p>${laya.ojo ? html`<p class="mm-laya ${laya.ojo.listo ? 'ok' : ''}"><i></i>${laya.ojo.listo ? 'Ojo visual listo' : laya.ojo.cargando ? 'Ojo visual cargando…' : laya.ojo.disponible ? 'Ojo visual apagado' : 'Ojo visual no instalado'}<small>${laya.ojo.listo ? 'Dice si una imagen se ve de la marca' : laya.ojo.disponible ? 'La primera vez baja su modelo (~600 MB)' : 'Vuelve a correr el instalador de Laya'}</small></p>` : ''}` : ''}`;
  menu(anchor, items.map((x) => ({ label: x.label, sub: x.sub, disabled: x.off, checked: Boolean(x.on), onSelect: () => { setMotor(me, { motor: x.motor, modelo: x.modelo, provider: x.provider }); onPick(); } })),
    { titulo: 'Qué modelo responde', pie, ancho: 320 });
}

// El botón del modelo en la caja, como en ChatGPT: el nombre y un punto que dice si tu compu está conectada.
export const modeloBtn = (me, ok) => html`<button type="button" class="cx-model" data-act="motor" aria-haspopup="listbox" title="${esServidor(me) ? (ok ? 'Servidor · en línea' : 'Servidor fuera de línea') : ok ? 'Corre en tu compu · conectado' : 'Tu compu no está conectada'}"><i class="cx-dot ${ok ? 'on' : ''}"></i>${nombreMotor(motorDe(me))} <span class="cx-car">▾</span></button>`;
