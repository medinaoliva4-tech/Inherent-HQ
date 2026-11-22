// Login dentro de la app nativa (cápsula de Apple, carpeta ios/). Google no deja iniciar sesión en una web embebida, así que el login abre
// el NAVEGADOR DEL SISTEMA y vuelve con inherent://auth?code=… (api/_lib/auth-native.js: código de un uso + PKCE). En un navegador normal
// nada de esto corre: esNativo() es falso y el login sigue siendo el de siempre.
// Los plugins llegan por el puente de Capacitor (`Capacitor.Plugins.*`), sin empaquetar nada: la web sigue siendo una sola.
const cap = () => globalThis.Capacitor;
export const esNativo = () => Boolean(cap()?.isNativePlatform?.());
const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const CLAVE = 'nativo.verifier';

// El par PKCE: `verifier` (43 caracteres, solo en la app) y `challenge` = SHA-256 del verifier. El servidor solo ve el challenge al salir.
export async function nuevoPar() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  return { verifier, challenge };
}
export async function iniciar({ portal = false } = {}) {
  const { verifier, challenge } = await nuevoPar();
  try { sessionStorage.setItem(CLAVE, verifier); } catch { throw new Error('Esta app no puede guardar el login en curso'); }
  const url = `${location.origin}/api/auth/google?native=1&challenge=${challenge}${portal ? '&portal=1' : ''}`;
  await cap().Plugins.Browser.open({ url });
}
// El código que vuelve en la URL: solo inherent://auth?code=<43 caracteres>. Cualquier otra cosa se ignora.
export function codigoDe(url) {
  const m = /^inherent:\/\/auth\?(.*)$/.exec(String(url || '')); if (!m) return '';
  const c = new URLSearchParams(m[1]).get('code') || '';
  return /^[A-Za-z0-9_-]{43}$/.test(c) ? c : '';
}
let escuchando = false;
// alEntrar(): la sesión ya quedó puesta en esta web. alFallar(mensaje): se explica, no se queda en blanco.
export function escucharRetorno({ alEntrar, alFallar }) {
  if (!esNativo() || escuchando) return; escuchando = true;
  cap().Plugins.App.addListener('appUrlOpen', async ({ url }) => {
    const code = codigoDe(url); if (!code) return;
    let verifier = ''; try { verifier = sessionStorage.getItem(CLAVE) || ''; sessionStorage.removeItem(CLAVE); } catch { /* sin memoria */ }
    try { await cap().Plugins.Browser.close(); } catch { /* ya estaba cerrado */ }
    if (!verifier) return alFallar?.('Se perdió el login en curso. Vuelve a entrar.');
    try {
      const r = await fetch('/api/auth/native/exchange', { method: 'POST', headers: { 'content-type': 'application/json', 'x-ceoos': '1' }, body: JSON.stringify({ code, verifier }) });
      if (!r.ok) return alFallar?.((await r.json().catch(() => ({}))).error || 'No se pudo entrar. Vuelve a intentarlo.');
      alEntrar?.();
    } catch { alFallar?.('Sin conexión. Vuelve a intentarlo.'); }
  });
}
// Haptics con sentido (un toque suave al aprobar): no hace nada fuera de la app.
export const toque = (estilo = 'LIGHT') => { try { cap()?.Plugins?.Haptics?.impact({ style: estilo }); } catch { /* sin háptica */ } };
