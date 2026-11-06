// La conversación con voz real: micrófono al modelo, voz de vuelta y lo dicho en pantalla. Se puede interrumpir hablando.
import { api, toast } from './core.js';
import { armarPantalla } from './conversacion-ui.js';
import { etiquetaDe } from './conversacion.js';
import { urlVoz, setupVoz, aPcm16, aFloat, aB64, deB64, leerMensaje, AUDIO_ENTRADA } from './voz-gemini.js';

export async function abrirVozViva({ titulo, sistema, salida, alTeclado, alCerrar }) {
  let cred;
  try { cred = await api('chat/voz/token', { method: 'POST', body: {} }); } catch (e) { if (e.code === 'NO_VOZ' || e.status === 503) return false; toast(e.message, true); return true; }
  let mic;
  if (window.inherentEscritorio?.microfono && !(await window.inherentEscritorio.microfono())) { toast('Activa el micrófono en Ajustes del Sistema › Privacidad › Micrófono.', true); return true; }
  try { mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); } catch { toast('Dale permiso al micrófono para conversar.', true); return true; }
  const entrada = new (window.AudioContext || window.webkitAudioContext)();
  await entrada.resume(); await salida.resume();
  let estado = 'pensando', nivel = 0;
  const p = armarPantalla(titulo, () => ({ escuchando: 0.3 + nivel, pensando: 0.45, hablando: 0.85, pausa: 0.08 }[estado] ?? 0.3));
  const poner = (e) => { estado = e; p.caja.dataset.estado = e; p.etiqueta.textContent = etiquetaDe(e); p.mic.setAttribute('aria-label', e === 'pausa' ? 'Seguir escuchando' : 'Pausar'); };
  poner('pensando'); p.etiqueta.textContent = 'Conectando…';

  let ws = null, handle = '', abierta = true, reintentos = 0, siguiente = 0, oido = '', dicho = '', turnoListo = false, pendiente = [];
  const fuentes = new Set(), mensajes = [];
  const callar = () => { for (const f of fuentes) { f.onended = null; try { f.stop(); } catch {} } fuentes.clear(); siguiente = 0; };
  const guardarTurno = () => {
    if (oido.trim()) mensajes.push({ role: 'user', content: oido.trim() });
    if (dicho.trim()) mensajes.push({ role: 'assistant', content: dicho.trim() });
    oido = ''; dicho = '';
  };
  const reproducir = (b64) => {
    const f = aFloat(deB64(b64)); if (!f.length) return;
    const b = salida.createBuffer(1, f.length, 24000); b.copyToChannel(f, 0);
    const s = salida.createBufferSource(); s.buffer = b; s.connect(salida.destination);
    const t = Math.max(salida.currentTime + 0.02, siguiente); s.start(t); siguiente = t + b.duration;
    fuentes.add(s); if (estado !== 'pausa') poner('hablando');
    s.onended = () => { fuentes.delete(s); if (!fuentes.size && turnoListo && estado === 'hablando') poner('escuchando'); };
  };
  const conectar = () => {
    ws = new WebSocket(urlVoz(cred.token));
    ws.onopen = () => ws.send(JSON.stringify(setupVoz({ modelo: cred.modelo, voz: cred.voz, sistema: `${sistema}${cred.contexto || ''}`, handle })));
    ws.onmessage = async (e) => {
      const m = leerMensaje(JSON.parse(typeof e.data === 'string' ? e.data : await e.data.text()));
      if (m.listo) { reintentos = 0; if (estado !== 'pausa') poner('escuchando'); return; }
      if (m.handle) handle = m.handle;
      if (m.salir && ws) { const w = ws; ws = null; w.onclose = null; w.close(); return conectar(); }
      if (m.oido) { if (turnoListo) { turnoListo = false; p.texto('', ''); } oido += m.oido; if (!dicho) p.texto(oido, ''); }
      if (m.dicho) { dicho += m.dicho; p.texto(dicho, ''); }
      if (m.interrumpido) { callar(); guardarTurno(); poner('escuchando'); }
      m.audio.forEach(reproducir);
      if (m.fin) { turnoListo = true; guardarTurno(); if (!fuentes.size && estado === 'hablando') poner('escuchando'); }
    };
    ws.onclose = () => {
      if (!abierta) return;
      if (handle && reintentos < 3) { reintentos += 1; return setTimeout(conectar, 400); }
      toast('La conversación se cortó. Lo hablado quedó guardado.', true); cerrar();
    };
  };
  await entrada.audioWorklet.addModule('/js/mic-worklet.js');
  const fuente = entrada.createMediaStreamSource(mic), nodo = new AudioWorkletNode(entrada, 'mic'), mudo = entrada.createGain();
  mudo.gain.value = 0; fuente.connect(nodo); nodo.connect(mudo); mudo.connect(entrada.destination);
  nodo.port.onmessage = (e) => {
    const c = e.data; let r = 0; for (let i = 0; i < c.length; i += 16) r += c[i] * c[i];
    nivel = Math.min(0.5, Math.sqrt(r / (c.length / 16)) * 3);
    if (estado === 'pausa' || ws?.readyState !== 1) return;
    pendiente.push(...aPcm16(c, entrada.sampleRate));
    if (pendiente.length < 1600) return;
    const bytes = new Uint8Array(Int16Array.from(pendiente).buffer); pendiente = [];
    ws.send(JSON.stringify({ realtimeInput: { audio: { data: aB64(bytes), mimeType: AUDIO_ENTRADA } } }));
  };
  function cerrar() {
    if (!abierta) return; abierta = false; guardarTurno(); callar();
    removeEventListener('keydown', tecla); try { ws?.close(); } catch {}
    mic.getTracks().forEach((t) => t.stop()); entrada.close(); salida.close(); p.quitar();
    alCerrar?.(mensajes);
  }
  const tecla = (e) => { if (e.key === 'Escape') cerrar(); };
  addEventListener('keydown', tecla);
  p.caja.addEventListener('click', (e) => {
    const v = e.target.closest('[data-v]')?.dataset.v; if (!v) return;
    if (v === 'cerrar') return cerrar();
    if (v === 'teclado') { cerrar(); return alTeclado?.(); }
    if (estado === 'hablando') { callar(); return poner('escuchando'); }
    poner(estado === 'pausa' ? 'escuchando' : 'pausa');
  });
  conectar();
  return true;
}
