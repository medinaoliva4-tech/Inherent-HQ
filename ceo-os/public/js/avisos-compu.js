// Avisos de tu compu: lo que Vercel no puede ver (nunca habla con Hermes ni con el puente; ceo-os/PROPOSITOS.md §3).
// Devuelve avisos con la misma forma que los del servidor (avisos-reglas/base.js · aviso), en el grupo «La plataforma».
// Para no hacerle saltar a todos el permiso de red local de Chrome: en el navegador solo se toca 127.0.0.1 si la persona
// ya usa esas partes (pegó su llave de Hermes) o si abre #/avisos (forzar). Dentro de la app de Mac se revisa siempre.
import { hermesDe, saludHermes, modelosHermes } from './hermes.js';
import { aviso } from './avisos-reglas/base.js';
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

// Las reglas de la compu, en orden. Cada una devuelve [aviso]. Una que falla no tumba las demás.
const REGLAS_COMPU = [
  { id: 'pla-hermes', usa: (me) => enApp() || Boolean(hermesDe(me)), correr: hermes },
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
