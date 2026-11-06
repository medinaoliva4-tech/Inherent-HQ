// Se monta en el OS completo: sigue avisando aunque hayas salido de la conversación.
import { api, html, mount, events } from './core.js';
import { estadoAvisos, activarAvisos } from './avisos.js';

export function instalarAvisosChat(me) {
  if (!me || me.role === 'client') return () => {};
  const key = `chat.avisos.vistos:${me.email}`;
  let vistos; try { vistos = new Set(JSON.parse(sessionStorage.getItem(key) || '[]')); } catch { vistos = new Set(); }
  const ctrl = new AbortController(); let ocupado = false, push = false;
  estadoAvisos().then((s) => { push = s.activo; }).catch(() => {});
  const caja = document.createElement('section'); caja.className = 'chat-avisos'; caja.setAttribute('aria-label', 'Avisos del Chat'); document.body.append(caja);
  const guardar = (id) => { vistos.add(id); try { sessionStorage.setItem(key, JSON.stringify([...vistos].slice(-200))); } catch {} };
  async function mostrar(a) {
    if (ctrl.signal.aborted || vistos.has(a.id)) return;
    const ruta = a.url.slice(1);
    if (!/^#\/chat\/(?:trabajo\/)?[^/#?]+$/.test(ruta)) return;
    guardar(a.id);
    if (document.visibilityState === 'visible' && location.hash === ruta) return;
    const tarjeta = document.createElement('div'); tarjeta.className = 'chat-aviso'; tarjeta.setAttribute('role', 'status');
    mount(tarjeta, html`<a href="${ruta}"><b>${a.title}</b><span>${a.body}</span></a><button type="button" aria-label="Cerrar aviso">×</button>`);
    tarjeta.querySelector('button').onclick = () => tarjeta.remove();
    tarjeta.querySelector('a').onclick = () => tarjeta.remove();
    caja.prepend(tarjeta); while (caja.children.length > 3) caja.lastElementChild.remove();
    events.dispatchEvent(new Event('avisos'));
    // Web push ya avisa en los dispositivos suscritos. En Electron basta la API web,
    // sin un puente privilegiado ni una nueva versión de la app.
    if (!push && 'Notification' in window && Notification.permission === 'granted') {
      try { const n = new Notification(a.title, { body: a.body, tag: a.tag }); n.onclick = () => { window.focus(); location.hash = ruta; n.close(); tarjeta.remove(); }; } catch {}
    } else if ('Notification' in window && Notification.permission === 'default') {
      const permiso = document.createElement('button'); permiso.className = 'chat-aviso-permiso'; permiso.textContent = 'Activar avisos del dispositivo';
      permiso.onclick = async () => {
        try {
          if (window.inherentEscritorio) await Notification.requestPermission();
          else { await activarAvisos(); push = true; }
          permiso.remove();
        } catch { permiso.textContent = 'Configura los avisos en Mi perfil'; permiso.onclick = () => { location.hash = '#/me'; }; }
      }; tarjeta.append(permiso);
    }
  }
  async function revisar() {
    if (ocupado || ctrl.signal.aborted) return; ocupado = true;
    try { const r = await api('avisos/chat', { signal: AbortSignal.any([ctrl.signal, AbortSignal.timeout(10000)]) }); for (const a of (r.items || []).slice().reverse()) await mostrar(a); } catch {} finally { ocupado = false; }
  }
  const timer = setInterval(revisar, 20000);
  const quitar = () => { ctrl.abort(); clearInterval(timer); caja.remove(); };
  events.addEventListener('logout', quitar, { signal: ctrl.signal, once: true });
  document.addEventListener('visibilitychange', revisar, { signal: ctrl.signal });
  window.addEventListener('online', revisar, { signal: ctrl.signal });
  revisar();
  return quitar;
}
