// La pantalla del modo conversación: un aro que respira, lo que se está diciendo y tres botones. La conversación queda guardada en el chat.
import { html, mount, ico, toast } from './core.js';
import { icoMic } from './voz.js';
import { etiquetaDe, siguiente, limpiarParaVoz, frasesNuevas, brilloDelAro } from './conversacion.js';

const SILENCIO_MS = 1300; // tras este silencio, lo dicho se envía
// En la app de Mac escucha el dictado del sistema: el texto entra a una caja invisible y aquí se lee igual que en el navegador.
class DictadoMac {
  start() {
    const t = document.createElement('textarea'); t.className = 'vz-oido'; t.setAttribute('aria-hidden', 'true'); t.tabIndex = -1;
    t.addEventListener('input', () => this.onresult?.({ results: [Object.assign([{ transcript: t.value }], { isFinal: false })] }));
    document.querySelector('.vz').append(t); this.caja = t; t.focus();
    window.inherentEscritorio.dictar();
  }
  abort() { this.caja?.remove(); this.caja = null; }
}
const reconocedor = () => (window.inherentEscritorio ? (window.inherentEscritorio.dictar ? DictadoMac : null) : window.SpeechRecognition || window.webkitSpeechRecognition || null);
export const vozDisponible = () => Boolean(reconocedor()) && 'speechSynthesis' in window;
const vozEspanol = () => {
  const xs = speechSynthesis.getVoices().filter((v) => /^es/i.test(v.lang));
  return xs.find((v) => /premium|enhanced|natural|google/i.test(v.name)) || xs.find((v) => /419|MX|US/i.test(v.lang)) || xs[0] || null;
};

function dibujarAro(cv, leer) {
  const c = cv.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2), L = 300, paso = 7;
  cv.width = L * dpr; cv.height = L * dpr; c.scale(dpr, dpr);
  const quieto = matchMedia('(prefers-reduced-motion:reduce)').matches;
  let e = 0.2, id = 0;
  const cuadro = (ms) => {
    const t = ms / 1000; e += (leer() - e) * 0.06;
    c.clearRect(0, 0, L, L);
    const radio = 92 + e * 10, ancho = 36 + e * 26;
    for (let y = paso / 2; y < L; y += paso) for (let x = paso / 2; x < L; x += paso) {
      const dx = x - L / 2, dy = y - L / 2, dist = Math.hypot(dx, dy), b = brilloDelAro(dist, radio, ancho);
      if (!b) continue;
      const a = Math.atan2(dy, dx), ola = 0.5 + 0.5 * Math.sin(a * 5 + t * (0.7 + e * 2)) * Math.sin(a * 3 - t * 0.9 + dist * 0.05);
      const fuerza = b * (0.25 + 0.75 * ola) * (0.35 + e * 0.6), lado = Math.min(paso - 2.5, 1 + fuerza * 4.5);
      c.fillStyle = `rgb(239 235 228 / ${Math.min(1, fuerza).toFixed(3)})`;
      c.fillRect(x - lado / 2, y - lado / 2, lado, lado);
    }
    if (!quieto) id = requestAnimationFrame(cuadro);
  };
  id = requestAnimationFrame(cuadro);
  return () => cancelAnimationFrame(id);
}

// La pantalla: un aro, lo que se dice y tres botones. La usan la voz real y la del navegador.
export function armarPantalla(titulo, energia) {
  const caja = document.createElement('div');
  caja.className = 'vz'; caja.dataset.popover = ''; caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-label', 'Conversación por voz');
  mount(caja, html`<header class="vz-h"><span class="vz-t">${titulo}</span></header>
    <canvas class="vz-aro" aria-hidden="true"></canvas>
    <p class="vz-txt" aria-live="polite"><b></b><span></span></p>
    <p class="vz-est"></p>
    <footer class="vz-b">
      <button type="button" class="vz-l" data-v="teclado" aria-label="Escribir en el chat">${ico('keyboard', 20)}</button>
      <button type="button" class="vz-m" data-v="mic">${icoMic()}</button>
      <button type="button" class="vz-l" data-v="cerrar" aria-label="Terminar la conversación">${ico('x', 20)}</button>
    </footer>`);
  document.body.append(caja);
  const parar = dibujarAro(caja.querySelector('.vz-aro'), energia);
  const claro = caja.querySelector('.vz-txt b'), tenue = caja.querySelector('.vz-txt span');
  return { caja, mic: caja.querySelector('.vz-m'), etiqueta: caja.querySelector('.vz-est'), texto: (a, b = '') => { claro.textContent = a; tenue.textContent = b; }, quitar: () => { parar(); caja.remove(); } };
}

// enviar(texto, { alDelta }) devuelve la respuesta completa; detener() corta la que va en camino.
export function abrirConversacion({ titulo, enviar, detener, alTeclado, alCerrar }) {
  const { caja, quitar } = armarPantalla(titulo, () => ({ escuchando: oido ? 0.55 : 0.3, pensando: 0.45, hablando: 0.85, pausa: 0.08 }[estado] ?? 0.3));
  const $b = caja.querySelector('.vz-txt b'), $s = caja.querySelector('.vz-txt span'), $e = caja.querySelector('.vz-est'), $m = caja.querySelector('.vz-m');
  let estado = 'pausa', rec = null, silencio = 0, oido = '', abierta = true, cola = 0, dichas = 0, plano = '', turno = 0;
  const texto = (claro, tenue = '') => { $b.textContent = claro; $s.textContent = tenue; };
  const poner = (e) => {
    estado = e; caja.dataset.estado = e; $e.textContent = etiquetaDe(e);
    $m.setAttribute('aria-label', { escuchando: 'Pausar', pausa: 'Seguir escuchando', pensando: 'Detener', hablando: 'Interrumpir' }[e]);
  };
  const callarMic = () => { clearTimeout(silencio); const r = rec; rec = null; if (r) { r.onend = null; r.onresult = null; r.onerror = null; try { r.abort(); } catch {} } };
  const callarVoz = () => { cola = 0; speechSynthesis.cancel(); };
  const escuchar = () => {
    callarMic(); callarVoz(); if (!abierta) return;
    poner('escuchando'); oido = ''; texto('', '');
    const SR = reconocedor(), r = new SR(); rec = r;
    r.lang = 'es-419'; r.interimResults = true; r.continuous = true;
    r.onresult = (ev) => {
      let fijo = '', va = '';
      for (const x of ev.results) (x.isFinal ? (fijo += x[0].transcript) : (va += x[0].transcript));
      oido = `${fijo}${va}`.trim(); texto(fijo.trim(), va ? ` ${va.trim()}` : '');
      clearTimeout(silencio); silencio = setTimeout(mandar, SILENCIO_MS);
    };
    r.onerror = (ev) => { if (ev.error === 'not-allowed') { toast('Dale permiso al micrófono para conversar.', true); cerrar(); } };
    r.onend = () => { if (rec === r && estado === 'escuchando') { try { r.start(); } catch {} } };
    try { r.start(); } catch { /* ya estaba escuchando */ }
  };
  const decir = (frases, alTerminar) => {
    for (const f of frases) {
      const u = new SpeechSynthesisUtterance(f), v = vozEspanol(); if (v) u.voice = v; u.lang = v?.lang || 'es-419'; u.rate = 1.03;
      const yo = turno; cola += 1;
      u.onstart = () => { if (yo === turno && estado === 'pensando') poner(siguiente(estado, 'voz')); };
      u.onend = () => { if (yo !== turno) return; cola -= 1; if (!cola) alTerminar(); };
      u.onerror = u.onend; // sin voz en el equipo, la conversación sigue
      speechSynthesis.speak(u);
    }
  };
  async function mandar() {
    const dicho = oido.trim(); if (!dicho || !abierta) return;
    callarMic(); poner(siguiente(estado, 'enviado')); texto(dicho);
    const yo = ++turno; dichas = 0; plano = ''; let llego = false;
    const alFin = () => { if (yo === turno && llego && !cola && abierta && estado !== 'pausa') escuchar(); };
    const avanzar = (fin) => { const r = frasesNuevas(plano, dichas, { fin }); dichas = r.dichas; texto(plano.slice(0, dichas), plano.slice(dichas)); decir(r.frases, alFin); };
    try {
      const final = await enviar(dicho, { alDelta: (t) => { if (yo !== turno) return; plano = limpiarParaVoz(t); avanzar(false); } });
      if (yo !== turno) return;
      if (final == null) { toast('No se pudo enviar. Revisa el chat.', true); return escuchar(); }
      plano = limpiarParaVoz(final); llego = true; avanzar(true); alFin();
    } catch { if (yo === turno) escuchar(); }
  }
  function cerrar() {
    if (!abierta) return; abierta = false; turno += 1; callarMic(); callarVoz(); removeEventListener('keydown', tecla); quitar(); alCerrar?.();
  }
  const tecla = (e) => { if (e.key === 'Escape') cerrar(); };
  addEventListener('keydown', tecla);
  caja.addEventListener('click', (e) => {
    const v = e.target.closest('[data-v]')?.dataset.v; if (!v) return;
    if (v === 'cerrar') return cerrar();
    if (v === 'teclado') { cerrar(); return alTeclado?.(); }
    if (estado === 'pensando') { turno += 1; detener?.(); return escuchar(); }
    if (estado === 'hablando') { turno += 1; detener?.(); return escuchar(); }
    if (estado === 'escuchando') { callarMic(); poner('pausa'); return; }
    escuchar();
  });
  poner('pausa'); escuchar();
  return cerrar;
}
