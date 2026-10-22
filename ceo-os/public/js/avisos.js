// Los avisos en el celular: el OS instalado como app (pantalla de inicio) recibe un aviso cuando entra un lead y, cada
// mañana, lo que necesita atención. Se activan por dispositivo desde Mi perfil; el servidor guarda la suscripción.
import { api } from './core.js';

const soporta = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const ios = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const instalada = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

export async function registrarSW() {
  if (!('serviceWorker' in navigator)) return null;
  try { return await navigator.serviceWorker.register('/sw.js'); } catch { return null; }
}
const b64 = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4), r = (s + p).replace(/-/g, '+').replace(/_/g, '/'), raw = atob(r); return Uint8Array.from([...raw].map((c) => c.charCodeAt(0))); };

// → { soporta, ios, instalada, permiso, activo (este dispositivo), servidor (hay claves), dispositivos (cuántos tiene la persona) }
export async function estadoAvisos() {
  const st = { soporta: soporta(), ios: ios(), instalada: instalada(), permiso: 'Notification' in window ? Notification.permission : 'denied', activo: false, servidor: false, dispositivos: 0 };
  try { const r = await api('avisos/clave'); st.servidor = Boolean(r.clave); st.dispositivos = (r.dispositivos || []).length; if (st.soporta) { const reg = await navigator.serviceWorker.getRegistration('/sw.js'); const sub = await reg?.pushManager.getSubscription(); st.activo = Boolean(sub && (r.dispositivos || []).includes(sub.endpoint)); } } catch {}
  return st;
}
export async function activarAvisos() {
  if (!soporta()) throw new Error(ios() && !instalada() ? 'En iPhone primero agrega el OS a la pantalla de inicio: Compartir → «Agregar a inicio». Luego ábrelo desde ahí.' : 'Este navegador no recibe avisos. Usa Chrome, Safari o la app.');
  const { clave } = await api('avisos/clave'); if (!clave) throw new Error('Faltan las claves de avisos en el servidor. Pídele al CEO que las ponga en Vercel.');
  const reg = (await navigator.serviceWorker.getRegistration('/sw.js')) || (await registrarSW()); if (!reg) throw new Error('No se pudo preparar el navegador para avisos');
  await navigator.serviceWorker.ready;
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('No diste permiso para avisos. Puedes cambiarlo en los ajustes del navegador.');
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(clave) }));
  await api('avisos/suscribir', { method: 'POST', body: { sub: sub.toJSON() } });
  return true;
}
export async function quitarAvisos() {
  const reg = await navigator.serviceWorker?.getRegistration('/sw.js'); const sub = await reg?.pushManager.getSubscription();
  if (sub) { await api('avisos/quitar', { method: 'POST', body: { endpoint: sub.endpoint } }).catch(() => {}); await sub.unsubscribe().catch(() => {}); }
  return true;
}
export const probarAvisos = () => api('avisos/probar', { method: 'POST', body: {} });
