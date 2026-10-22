// El motor de los chats (Estrategia, Plan del mes, Diseño): Claude, ChatGPT o un modelo local. Corren en tu compu por el
// puente de Laya, leen el repo y no cambian nada. ChatGPT y los locales van por Codex (el agente de OpenAI); los locales, con Ollama.
// La elección es de cada persona (localStorage) y vale para todos los chats.
import { html, raw, mount, ico } from './core.js';
import { junto } from './divisor.js';

export const MOTORES = [['claude', 'Claude'], ['chatgpt', 'ChatGPT'], ['local', 'Modelo local']];
// Los modelos de Claude que se eligen aquí (alias de Claude Code: siempre el más nuevo de cada uno). Vacío = el de tu cuenta.
export const CLAUDE_MODELOS = [['opus', 'Opus', 'El más capaz'], ['sonnet', 'Sonnet', 'Equilibrado y rápido'], ['haiku', 'Haiku', 'El más rápido']];
const K = (me) => `os.motor.${me.email}`;
export function motorDe(me) { try { const j = JSON.parse(localStorage.getItem(K(me)) || 'null'); if (j && MOTORES.some(([k]) => k === j.motor)) return { motor: j.motor, modelo: String(j.modelo || '') }; } catch {} return { motor: 'claude', modelo: '' }; }
export function setMotor(me, v) { try { localStorage.setItem(K(me), JSON.stringify({ motor: v.motor, modelo: v.modelo || '' })); } catch {} }
export const nombreMotor = (v) => (v.motor === 'local' ? (v.modelo ? `Local · ${v.modelo}` : 'Modelo local') : v.motor === 'claude' && v.modelo ? `Claude ${CLAUDE_MODELOS.find(([k]) => k === v.modelo)?.[1] || ''}`.trim() : MOTORES.find(([k]) => k === v.motor)?.[1] || 'Claude');
// Lo que va en el cuerpo de POST /chat.
export const cuerpoMotor = (me) => { const v = motorDe(me); return { motor: v.motor, ...((v.motor === 'local' || (v.motor === 'claude' && CLAUDE_MODELOS.some(([k]) => k === v.modelo))) && v.modelo ? { modelo: v.modelo } : {}) }; };
// La sesión de un chat es de un motor: si cambió, se empieza una conversación nueva.
export const claveMotor = (me) => { const v = motorDe(me); return `${v.motor}:${v.modelo}`; };

// Qué le falta al motor elegido en esta compu (o null si está listo). m = el bloque «motores» de /health.
export function faltaMotor(me, chat, { diseno = false } = {}) {
  const v = motorDe(me), m = chat?.motores;
  if (!m) return v.motor === 'claude' ? null : { t: 'Falta actualizar el puente', p: 'Tu puente todavía no trae ChatGPT ni los modelos locales. Corre otra vez el comando de instalar.', instalar: true };
  if (v.motor === 'claude') return m.claude ? null : { t: 'No encuentro Claude Code', p: 'Instálalo e inicia sesión con tu cuenta (en la Terminal: claude). O elige ChatGPT o un modelo local.' };
  if (diseno && v.motor === 'local') return { t: 'Los modelos locales no diseñan en Figma', p: 'Para Diseño usa Claude o ChatGPT.' };
  if (!m.chatgpt?.instalado) return { t: 'Falta Codex, el programa de ChatGPT', p: 'Es el mismo para ChatGPT y para los modelos locales. En la Terminal:', cmd: 'npm install -g @openai/codex' };
  if (v.motor === 'chatgpt') return m.chatgpt.sesion ? null : { t: 'Inicia la sesión de ChatGPT (una sola vez)', p: 'En la Terminal, corre esto y sigue lo que te pide en el navegador:', cmd: 'codex login' };
  if (!m.local?.modelos?.length) return { t: 'Falta un modelo local', p: 'Instala Ollama (ollama.com), ábrelo y baja un modelo que sepa usar herramientas. En la Terminal:', cmd: 'ollama pull gpt-oss:20b' };
  if (!v.modelo || !m.local.modelos.includes(v.modelo)) return { t: 'Elige qué modelo local usar', p: `En esta compu hay: ${m.local.modelos.join(', ')}.`, elegir: true };
  return null;
}
export const faltaHtml = (f, cmd) => html`<div class="es-setup"><b>${f.t}</b><p>${f.p}</p>${f.cmd ? cmd(f.cmd) : ''}<div class="row" style="gap:8px">${f.cmd || f.instalar ? html`<button class="btn xs" data-act="reintentar">Ya lo hice</button>` : ''}<button class="btn ghost xs" data-act="motor">${f.elegir ? 'Elegir modelo' : 'Cambiar de modelo'}</button></div></div>`;

// El botón del motor (va junto a los demás de la caja) y su menú.
export const motorBtn = (me) => html`<button type="button" class="es-pick" data-act="motor" aria-haspopup="listbox" title="Qué modelo responde">${ico('spark', 12)} ${nombreMotor(motorDe(me))} ▾</button>`;
export function menuMotor(anchor, me, chat, onPick, { diseno = false, laya = null } = {}) {
  document.querySelector('.es-menu')?.remove();
  const box = anchor.closest('.es-box') || anchor.closest('.es-setup') || anchor.parentElement;
  const m = chat?.motores || {}, v = motorDe(me);
  const op = (motor, modelo, label, sub, off) => ({ motor, modelo, label, sub, off, on: v.motor === motor && (motor === 'chatgpt' || v.modelo === modelo) });
  const sinClaude = m.claude === false, conModelos = Boolean(chat?.claude_modelos);
  const items = [
    op('claude', '', 'Claude', sinClaude ? 'No está instalado en esta compu' : 'El modelo de tu cuenta', false),
    ...(conModelos && !sinClaude ? CLAUDE_MODELOS.map(([k, n, sub]) => op('claude', k, `Claude ${n}`, sub, false)) : []),
    op('chatgpt', '', 'ChatGPT', !m.chatgpt?.instalado ? 'Falta Codex' : m.chatgpt.sesion ? 'Codex, con tu cuenta de ChatGPT' : 'Falta iniciar la sesión', false),
    ...(diseno ? [] : (m.local?.modelos?.length ? m.local.modelos.map((x) => op('local', x, `Local · ${x}`, 'Ollama, en tu compu', false)) : [op('local', '', 'Modelo local', m.local?.instalado ? 'Falta Ollama o un modelo' : 'Falta Codex y Ollama', false)])),
  ];
  const el = document.createElement('div'); el.className = 'es-menu'; el.setAttribute('role', 'listbox');
  mount(el, html`<span class="lbl" style="display:block;padding:6px 10px 2px">Qué modelo responde</span>${items.map((x, i) => html`<a href="#" role="option" class="${x.on ? 'on' : ''}" data-i="${i}"><b></b><span>${x.label}</span><small>${x.sub}</small></a>`)}${diseno ? html`<p class="mut sm" style="margin:4px 10px 6px">Los modelos locales no diseñan en Figma.</p>` : ''}
    ${conModelos || sinClaude ? '' : html`<p class="mut sm" style="margin:4px 10px 6px">Para elegir Opus, Sonnet o Haiku, actualiza el puente (o usa la app de Mac).</p>`}
    ${laya ? html`<p class="mm-laya ${laya.listo ? 'ok' : ''}"><i></i>${laya.listo ? 'Laya lista' : laya.cargando ? 'Laya cargando…' : 'Laya no está instalada en esta compu'}<small>${laya.listo ? 'Juzga y enruta en tu compu' : laya.cargando ? 'La primera vez baja su modelo' : (window.inherentEscritorio ? 'Menú Puente › Instalar Laya' : 'La app de Mac la instala sola')}</small></p>${laya.ojo ? html`<p class="mm-laya ${laya.ojo.listo ? 'ok' : ''}"><i></i>${laya.ojo.listo ? 'Ojo visual listo' : laya.ojo.cargando ? 'Ojo visual cargando…' : laya.ojo.disponible ? 'Ojo visual apagado' : 'Ojo visual no instalado'}<small>${laya.ojo.listo ? 'Dice si una imagen se ve de la marca' : laya.ojo.disponible ? 'La primera vez baja su modelo (~600 MB)' : 'Vuelve a correr el instalador de Laya'}</small></p>` : ''}` : ''}`);
  box.append(el); junto(el, anchor, box);
  el.addEventListener('click', (e) => { const a = e.target.closest('a[data-i]'); if (!a) return; e.preventDefault(); const x = items[+a.dataset.i]; el.remove(); setMotor(me, { motor: x.motor, modelo: x.modelo }); onPick(); });
  const cerrar = (e) => { if (!el.contains(e.target) && e.target !== anchor) { el.remove(); document.removeEventListener('pointerdown', cerrar); } };
  setTimeout(() => document.addEventListener('pointerdown', cerrar));
}

// El botón del modelo en la caja, como en ChatGPT: el nombre y un punto que dice si tu compu está conectada.
export const modeloBtn = (me, ok) => html`<button type="button" class="cx-model" data-act="motor" aria-haspopup="listbox" title="${ok ? 'Corre en tu compu · conectado' : 'Tu compu no está conectada'}"><i class="cx-dot ${ok ? 'on' : ''}"></i>${nombreMotor(motorDe(me))} <span class="cx-car">▾</span></button>`;
