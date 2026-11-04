// Avisos de tu compu: lo que Vercel no puede ver (nunca habla con el puente; ceo-os/PROPOSITOS.md §3).
// Devuelve avisos con la misma forma que los del servidor (avisos-reglas/base.js · aviso), en el grupo «La plataforma».
// Aquí se junta lo que ve el navegador; qué aviso sale y qué dice lo decide avisos-reglas/compu.js (puro, con sus pruebas).
// Para no hacerle saltar a todos el permiso de red local de Chrome: en el navegador solo se toca 127.0.0.1 si la persona
// ya usa esas partes (pegó su token, usa Estrategia por el puente, o Marcas · contenido en completo o edita) o si
// abre #/avisos (forzar). Dentro de la app de Mac se revisa siempre.
import { api } from './core.js';
import { aviso } from './avisos-reglas/base.js';
import { usosPuente, avisoPuente, avisoAppMac, avisoCelularAqui } from './avisos-reglas/compu.js';
import { healthPuente, estadoToken, tokenDe, chromeBloquea } from './puente-chat.js';
import { sistemaDe } from './laya.js';

const enApp = () => Boolean(window.inherentEscritorio);
let MEM = { at: 0, k: '', v: [] }, abrioAvisos = false; // después de abrir #/avisos una vez, la campanita cuenta lo mismo que la página

// pla-puente · el puente de Laya (127.0.0.1:7357): los chats de Estrategia (si no corren en el servidor) y Diseño.
// Lee el /health completo (puente-chat.js, el mismo del primer día), el token (y si sirve, con /chat/estado) y lo que le falta
// al motor elegido (motor-ui.js). Solo pregunta lo que hace falta para el paso siguiente.
let bajandoDesde = 0; // desde cuándo el puente dice «bajando_repo»: si pasa de unos minutos, algo se trabó
async function puente(me) {
  const { motorDe, faltaMotor } = await import('./motor-ui.js');
  const usos = usosPuente(me, { motor: motorDe(me).motor });
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
  { id: 'pla-puente', usa: (me) => Boolean(tokenDe(me)) || usosPuente(me, { motor: (() => { try { return JSON.parse(localStorage.getItem(`os.motor.${me.email}`) || 'null')?.motor || 'servidor'; } catch { return 'servidor'; } })() }).alguno, correr: puente },
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
