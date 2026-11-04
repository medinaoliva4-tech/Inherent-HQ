// Avisos · La plataforma, lo que vive en tu compu (puro). Vercel nunca habla con el puente ni con la app (ceo-os/PROPOSITOS.md
// §3): avisos-compu.js junta en el navegador lo que ve —el /health del puente, el token, el motor elegido, la versión de la app,
// el permiso de avisos de este dispositivo— y aquí se decide qué aviso sale y qué dice. Sin DOM ni red (lo prueba
// scripts/test-avisos-plataforma.mjs). No va en REGLAS (index.js): estas no se calculan en el servidor.
import { aviso } from './base.js';
import { INSTALAR_MAC, INSTALAR_WIN, APP_MAC } from '../laya.js';
import { PASOS_COPIA_VIEJA } from '../puente-chat.js';

// ¿Para qué usa esta persona el puente? El chat de Estrategia (cuando eligió un motor de su compu, no el servidor) y el chat
// de Diseño (Marcas · contenido en completo o edita: Figma corre en la compu). Hermes se retiró.
// me = lo de GET /api/me (role, areas, views) · motor = motorDe(me).motor.
export function usosPuente(me, { motor = 'servidor' } = {}) {
  const areas = me?.areas || [], ceo = me?.role === 'ceo';
  const estrategia = (ceo || areas.includes('estrategia')) && !['servidor', 'hermes'].includes(motor);
  const diseno = ceo || (areas.includes('content') && me?.views?.content !== 'resumen');
  return { estrategia, diseno, alguno: estrategia || diseno };
}
const queNo = (u) => (u.estrategia && u.diseno ? 'los chats de Estrategia y Diseño no corren' : u.estrategia ? 'el chat de Estrategia no corre' : 'el chat de Diseño no corre');
const corta = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

// pla-puente · ceo-os/PROPOSITOS.md §3 y §4 «La app de Mac» (el puente va adentro y no hay que emparejar) e INSTALAR.md
// § «Si el chat de Estrategia no conecta». Sale solo el primer paso que falla, en el orden de screens/strategy.js (fase):
// (1) no responde · (2) es viejo · (3) la compu no está emparejada · (4) no tiene la copia del repo · (5) le falta el motor.
// h = { usos (usosPuente), salud (el /health completo o null), bloquea (chromeBloquea), token (hay), estado (lo que respondió
// /chat/estado: 200, 401… o 0), falta (faltaMotor o null), enApp, so ('mac'|'win'|'linux'), bajandoMin (cuánto lleva «bajando_repo») }.
export const PUENTE_R = { id: 'pla-puente', grupo: 'plataforma', area: 'todas', urgencia: 'alta' };
const TOKEN_MAC = 'cat ~/.inherent/laya/chat-token', TOKEN_WIN = 'Get-Content "$HOME\\.inherent\\laya\\chat-token"';
export function avisoPuente(h) {
  const u = h.usos || {}; if (!u.alguno) return [];
  const no = queNo(u), inst = h.so === 'win' ? INSTALAR_WIN : INSTALAR_MAC;
  const sale = (huella, titulo, detalle, accion = null, accion2 = null) => [aviso(PUENTE_R, { clave: 'pla-puente', titulo, detalle, huella, accion, accion2 })];
  const otra = { label: 'Ya lo hice', abre: 'revisar' }, copiar = (c) => ({ label: 'Copiar el comando', copiar: c });
  const s = h.salud, c = s?.chat || null;
  // (1) No responde. En la app se reinicia desde el menú; en una Mac sin la app, la app (o el comando); si no, el comando.
  if (!s || s.status !== 'ok') {
    if (h.bloquea) return sale('bloquea', `Chrome está bloqueando a tu compu: ${no}`, PASOS_COPIA_VIEJA, otra);
    if (h.enApp) return sale('off', `El puente de tu compu no responde: ${no}`, 'En el menú de arriba: Puente › Reiniciar el puente. Si sigue igual, cierra la app y ábrela otra vez.', { label: 'Revisar otra vez', abre: 'revisar' });
    if (h.so === 'mac') return sale('off', `El puente de tu compu no responde: ${no}`, 'Baja la app de Mac: trae el puente adentro y se prende sola. O, sin la app, enciéndelo con un comando en la Terminal.', { label: 'Bajar la app de Mac', href: APP_MAC }, copiar(inst));
    return sale('off', `El puente de tu compu no responde: ${no}`, 'Enciéndelo con un comando en la Terminal: queda corriendo siempre.', copiar(inst), otra);
  }
  // (2) Es viejo: no trae el chat ni sus motores. En la app, el puente viene con ella.
  if (!c || !c.motores) return h.enApp
    ? sale('viejo', `Actualiza la app de Mac: su puente es viejo y ${no}`, 'Menú Inherent OS › Buscar actualizaciones…: se baja, se cambia y la app se vuelve a abrir sola.', otra)
    : sale('viejo', `Actualiza el puente: ${no}`, 'Tu puente todavía no trae el chat. Corre otra vez el comando de instalar: se actualiza solo.', copiar(inst), otra);
  // (3) Sin emparejar (solo para quien tiene dónde emparejar: el chat de Estrategia o el de Diseño). En la app, el token llega solo.
  const donde = u.estrategia ? ['Estrategia', '#/estrategia'] : u.diseno ? ['Diseño', '#/marcas/diseno'] : null;
  if (donde && (!h.token || h.estado === 401)) return h.enApp
    ? sale('token', `Tu compu no está emparejada: ${no}`, 'La app empareja sola: en el menú de arriba, Puente › Reiniciar el puente.', otra)
    : sale('token', `Tu compu no está emparejada: ${no}`, `${h.token ? 'El token que pegaste ya no sirve. ' : ''}Copia el token de tu compu con este comando y pégalo en el chat de ${donde[0]} › Emparejar.`, copiar(h.so === 'win' ? TOKEN_WIN : TOKEN_MAC), { label: 'Emparejar', href: donde[1] });
  // (4) La copia del repo que leen los chats del puente.
  const ay = c.ayuda;
  if (ay === 'sin_github') return sale('sin_github', 'El puente no tiene la copia del repo: inicia sesión en GitHub (una sola vez)', 'El repo es privado y el puente necesita tu permiso para leerlo. Corre otra vez el comando de instalar y sigue lo que te pide el navegador.', copiar(inst), otra);
  if (ay === 'repo_error') return sale('repo_error', 'El puente no pudo bajar la copia del repo', `${corta(c.error_repo || 'Revisa tu internet.', 160)} Se reintenta solo en un minuto; si sigue, corre otra vez el comando de instalar.`, copiar(inst), otra);
  if (ay === 'repo_invalido') return sale('repo_invalido', 'El puente no tiene la copia del repo: su ruta no es el repo de Inherent', 'Quita la línea INHERENT_REPO de ~/.inherent/laya/config para que use su copia automática, y corre otra vez el comando de instalar.', copiar(inst), otra);
  if (ay === 'sin_repo') return sale('sin_repo', `Actualiza el puente: ${no}`, 'El puente nuevo baja solo una copia del repo y la pone al día antes de cada chat. Corre otra vez el comando de instalar.', copiar(inst), otra);
  if (ay === 'bajando_repo' && h.bajandoMin >= 5) return sale('bajando_repo', 'El puente lleva rato bajando la copia del repo', 'La primera vez tarda un minuto. Si no termina, corre otra vez el comando de instalar.', copiar(inst), otra);
  // (5) Al motor elegido le falta algo en esta compu (faltaMotor de motor-ui.js: Claude Code, Codex, la sesión, un modelo local).
  const f = h.falta;
  if (f) return sale(`motor:${f.t}`, `${f.t}: ${no}`, f.p, f.cmd ? copiar(f.cmd) : f.instalar ? copiar(inst) : f.elegir && donde ? { label: 'Elegir el modelo', href: donde[1] } : otra, f.cmd || f.instalar ? otra : null);
  return [];
}

// pla-app-mac · ceo-os/PROPOSITOS.md §4 «La app de Mac»: se actualiza sola. Cubre a quien dijo «Después» en el diálogo de la app.
// Solo dentro de la app. instalada = la versión que pasa el preload · ultima = lo que responde GET /api/escritorio/version.
// mayor: la misma comparación de escritorio/main.js. Una app sin ese campo es la SIN_VERSION o una más vieja: se compara
// contra esa, porque el diálogo de la app no ofrece la misma versión («Ya tienes la última»).
export const APP_MAC_R = { id: 'pla-app-mac', grupo: 'plataforma', area: 'todas', urgencia: 'media' };
export const SIN_VERSION = '0.1.4'; // la última app cuyo preload no pasa su versión (escritorio/package.json antes del campo)
export const mayor = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
export function avisoAppMac({ enApp, instalada, ultima, puedeActualizar = false }) {
  const v = ultima?.version;
  if (!enApp || !v || !mayor(v, instalada || SIN_VERSION)) return [];
  return [aviso(APP_MAC_R, {
    clave: 'pla-app-mac', titulo: `Hay una versión nueva de la app de Mac (${v})`, huella: v,
    detalle: `${instalada ? `Tienes la ${instalada}. ` : ''}${puedeActualizar ? 'Se baja, se cambia y la app se vuelve a abrir sola.' : 'Menú Inherent OS › Buscar actualizaciones…: se baja, se cambia y la app se vuelve a abrir sola.'}`,
    accion: puedeActualizar ? { label: 'Actualizar la app', abre: 'actualizar-app' } : null,
  })];
}

// pla-avisos-celular, la parte de este dispositivo · ceo-os/PROPOSITOS.md §4 «El celular». La del servidor sale cuando no tienes
// ningún dispositivo con avisos; esta, cuando sí tienes en otro pero aquí los bloqueaste (Notification.permission «denied»).
// e = lo que devuelve estadoAvisos() de public/js/avisos.js.
export const CELULAR_R = { id: 'pla-avisos-celular', grupo: 'plataforma', area: 'organizacion', urgencia: 'baja' };
export function avisoCelularAqui(e) {
  if (!e?.soporta || e.permiso !== 'denied' || !e.servidor || !(e.dispositivos > 0)) return [];
  return [aviso(CELULAR_R, {
    clave: 'pla-avisos-celular:este', titulo: 'En este dispositivo bloqueaste los avisos', huella: 'denied',
    detalle: 'Te llegan en tus otros dispositivos. Para recibirlos aquí, permite las notificaciones en los ajustes del navegador (el candado junto a la dirección) y actívalos en Mi perfil.',
    accion: { label: 'Ir a Mi perfil', href: '#/me' },
  })];
}
