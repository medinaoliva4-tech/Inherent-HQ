// Avisos de tu compu: lo que Vercel no puede ver (nunca habla con Hermes ni con el puente; ceo-os/PROPOSITOS.md §3).
// Devuelve avisos con la misma forma que los del servidor (avisos-reglas/base.js · aviso), en el grupo «La plataforma».
// Aquí se junta lo que ve el navegador; qué aviso sale y qué dice lo decide avisos-reglas/compu.js (puro, con sus pruebas).
// Para no hacerle saltar a todos el permiso de red local de Chrome: en el navegador solo se toca 127.0.0.1 si la persona
// ya usa esas partes (pegó su llave de Hermes o su token, tiene Estrategia, o Marcas · contenido en completo o edita) o si
// abre #/avisos (forzar). Dentro de la app de Mac se revisa siempre.
import { api } from './core.js';
import { hermesDe, saludHermes, modelosHermes } from './hermes.js';
import { aviso } from './avisos-reglas/base.js';
import { usosPuente, avisoPuente, avisoAppMac, avisoCelularAqui } from './avisos-reglas/compu.js';
import { healthPuente, estadoToken, tokenDe, chromeBloquea } from './puente-chat.js';
import { sistemaDe } from './laya.js';
import { TERMINAL } from './llm/modos.js';

const enApp = () => Boolean(window.inherentEscritorio);
let MEM = { at: 0, k: '', v: [] }, abrioAvisos = false; // después de abrir #/avisos una vez, la campanita cuenta lo mismo que la página

// pla-hermes · Hermes no está encendido / falta la llave / no tiene modelo. Sale solo el primer paso que falla.
const HERMES = { id: 'pla-hermes', grupo: 'plataforma', area: 'todas', urgencia: 'alta' };
async function hermes(me) {
  const s = await saludHermes(me);
  if (!s.on) {
    const instalar = TERMINAL.find(([k]) => /instalar/i.test(k))?.[1] || '';
    return [aviso(HERMES, { clave: 'pla-hermes', titulo: 'Hermes no está encendido en tu compu: el Chat no puede contestar', detalle: enApp() ? 'En la app: menú Puente › Instalar Hermes (o ábrelo si ya lo tienes).' : 'Instálalo o ábrelo con el comando de la Terminal.', huella: 'off', accion: enApp() ? { label: 'Ya lo hice', abre: 'revisar' } : instalar ? { label: 'Copiar el comando', copiar: instalar } : { label: 'Ya lo hice', abre: 'revisar' } })];
  }
  if (!s.auth) return [aviso(HERMES, { clave: 'pla-hermes', titulo: 'Falta conectar la llave de Hermes', detalle: 'En la Terminal: cat ~/.inherent/hermes/api-key y pégala en el Chat › ajustes.', huella: 'llave', accion: { label: 'Copiar el comando', copiar: 'cat ~/.inherent/hermes/api-key' }, accion2: { label: 'Abrir el Chat', href: '#/chat' } })];
  const m = await modelosHermes(me).catch(() => null);
  const hay = m && (m.actual?.model || (m.proveedores || []).some((p) => p.listo && p.modelos.length));
  if (!hay) return [aviso(HERMES, { clave: 'pla-hermes', titulo: 'Hermes no tiene ningún modelo conectado', detalle: 'En la Terminal: inherent model (elige Claude, ChatGPT o uno de tu compu).', huella: 'modelo', accion: { label: 'Copiar el comando', copiar: 'inherent model' } })];
  return [];
}

// pla-puente · el puente de Laya (127.0.0.1:7357): los chats de Estrategia y Diseño, y la copia del repo que lee Hermes.
// Lee el /health completo (puente-chat.js, el mismo del primer día), el token (y si sirve, con /chat/estado) y lo que le falta
// al motor elegido (motor-ui.js). Solo pregunta lo que hace falta para el paso siguiente.
let bajandoDesde = 0; // desde cuándo el puente dice «bajando_repo»: si pasa de unos minutos, algo se trabó
async function puente(me) {
  const { motorDe, faltaMotor } = await import('./motor-ui.js');
  const usos = usosPuente(me, { motor: motorDe(me).motor, hermes: Boolean(hermesDe(me)) });
  if (!usos.alguno) return [];
  const salud = await healthPuente(4000), chat = salud?.status === 'ok' ? salud.chat || null : null, token = tokenDe(me);
  bajandoDesde = chat?.ayuda === 'bajando_repo' ? bajandoDesde || Date.now() : 0;
  const chats = usos.estrategia || usos.diseno, listo = Boolean(chat?.motores);
  return avisoPuente({
    usos, salud, bloquea: chromeBloquea(), token: Boolean(token), enApp: enApp(), so: sistemaDe(navigator.userAgent || ''),
    estado: chats && listo && token ? await estadoToken(token) : 0,
    falta: chats && listo ? faltaMotor(me, chat, { diseno: !usos.estrategia }) : null,
    bajandoMin: bajandoDesde ? (Date.now() - bajandoDesde) / 60_000 : 0,
  });
}

// pla-app-mac · dentro de la app: la versión instalada (preload.js) contra la última publicada (GET escritorio/version).
async function appMac() {
  if (!enApp()) return [];
  const ultima = await api('escritorio/version').catch(() => null);
  return avisoAppMac({ enApp: true, instalada: String(window.inherentEscritorio?.version || ''), ultima, puedeActualizar: typeof window.inherentEscritorio?.actualizar === 'function' });
}

// pla-avisos-celular, la parte de este dispositivo: los avisos bloqueados aquí. No toca 127.0.0.1; solo pregunta al servidor
// (avisos/clave) si de verdad están bloqueados.
async function celularAqui() {
  if (!('Notification' in window) || Notification.permission !== 'denied') return [];
  const { estadoAvisos } = await import('./avisos.js');
  return avisoCelularAqui(await estadoAvisos());
}

// Las reglas de la compu, en orden. Cada una devuelve [aviso]. Una que falla no tumba las demás.
// usa: si en el navegador (fuera de la app y sin abrir #/avisos) se puede revisar sin hacer saltar el permiso de red local.
const REGLAS_COMPU = [
  { id: 'pla-hermes', usa: (me) => enApp() || Boolean(hermesDe(me)), correr: hermes },
  { id: 'pla-puente', usa: (me) => Boolean(tokenDe(me)) || usosPuente(me, { hermes: Boolean(hermesDe(me)) }).alguno, correr: puente },
  { id: 'pla-app-mac', usa: enApp, correr: appMac },
  { id: 'pla-avisos-celular', usa: () => true, correr: celularAqui },
];

export async function avisosCompu(me, { forzar = false } = {}) {
  if (!me || me.role === 'client') return [];
  if (forzar) abrioAvisos = true; else forzar = abrioAvisos;
  const k = `${me.email}|${forzar ? 1 : 0}`;
  if (MEM.k === k && Date.now() - MEM.at < 3 * 60_000) return MEM.v;
  const out = [];
  for (const r of REGLAS_COMPU) { if (!forzar && !enApp() && !r.usa(me)) continue; try { out.push(...(await r.correr(me))); } catch {} }
  MEM = { at: Date.now(), k, v: out };
  return out;
}
export const olvidarCompu = () => { MEM = { at: 0, k: '', v: [] }; };
