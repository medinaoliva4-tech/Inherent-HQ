// Grabar como Loom: pantalla + micrófono, con tu cámara en una burbuja flotante (picture-in-picture)
// que queda dentro de la grabación. El video sube directo a tu Google Drive y entra a la Library.
import { html, raw, mount, toast, uploadToDrive, $ } from './core.js';

const pick = () => ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';

export function recorder({ onDone }) {
  if (!navigator.mediaDevices?.getDisplayMedia && !navigator.mediaDevices?.getUserMedia) return toast('Este navegador no deja grabar. Usa Chrome en computadora.', true);
  const v = document.createElement('div'); v.className = 'rec';
  let mode = 'screen+cam', mic = true, pauseAt = 0, streams = [], rec = null, chunks = [], t0 = 0, tick = null, blob = null, camVideo = null, paused = false;
  const stopAll = () => { streams.forEach((s) => s.getTracks().forEach((t) => t.stop())); streams = []; clearInterval(tick); if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {}); };
  const close = () => { stopAll(); v.remove(); };
  const fmt = (ms) => { const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

  function setup() {
    mount(v, html`<div class="recbox"><div class="row"><b style="font-size:18px;font-weight:500">● Grabar video</b><div class="sp"></div><button class="arrow light" data-r="x">✕</button></div>
      <div class="mut sm" style="margin:4px 0 14px">Como Loom: se graba tu pantalla con tu voz y tu cámara en una burbuja. Se guarda en tu Drive y en la Library.</div>
      <div class="recopts">${[['screen+cam', '🖥️ + 🙂', 'Pantalla y cámara'], ['screen', '🖥️', 'Solo pantalla'], ['cam', '🙂', 'Solo cámara']].map(([k, i, l]) => html`<button class="${k === mode ? 'on' : ''}" data-r="mode" data-m="${k}"><span style="font-size:20px">${i}</span>${l}</button>`)}</div>
      <label class="check" style="margin-top:10px"><input type="checkbox" id="recMic" ${mic ? raw('checked') : ''}> Grabar mi micrófono</label>
      ${mode !== 'cam' ? html`<div class="mut sm">Tip: elige «Pantalla completa» para que la burbuja de tu cámara salga en el video.</div>` : ''}
      <button class="btn" data-r="start" style="width:100%;margin-top:14px;justify-content:center">Empezar a grabar</button></div>`);
  }
  async function start() {
    mic = $('#recMic', v).checked;
    try {
      let screen = null, cam = null;
      if (mode !== 'cam') { screen = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true }); streams.push(screen); }
      if (mode !== 'screen' || mic) { cam = await navigator.mediaDevices.getUserMedia({ video: mode === 'screen' ? false : { width: 640, height: 640, facingMode: 'user' }, audio: mic }); streams.push(cam); }
      // Audio: micrófono + sonido de la pantalla, mezclados.
      const ac = new AudioContext(); const dest = ac.createMediaStreamDestination();
      [screen, cam].forEach((s) => s?.getAudioTracks().length && ac.createMediaStreamSource(new MediaStream(s.getAudioTracks())).connect(dest));
      const videoTrack = mode === 'cam' ? cam.getVideoTracks()[0] : screen.getVideoTracks()[0];
      const out = new MediaStream([videoTrack, ...dest.stream.getAudioTracks()]);
      if (mode === 'screen+cam' && cam?.getVideoTracks().length) {
        camVideo = document.createElement('video'); camVideo.muted = true; camVideo.playsInline = true; camVideo.srcObject = new MediaStream(cam.getVideoTracks()); await camVideo.play();
        try { await camVideo.requestPictureInPicture(); } catch { toast('Tu navegador no dejó flotar la cámara: se graba solo la pantalla con tu voz.'); }
      }
      chunks = []; rec = new MediaRecorder(out, pick() ? { mimeType: pick(), videoBitsPerSecond: 2_500_000 } : undefined);
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => { blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' }); stopAll(); review(); };
      videoTrack.addEventListener('ended', () => rec?.state !== 'inactive' && rec.stop());
      rec.start(1000); t0 = Date.now(); recording();
    } catch (e) { stopAll(); toast(e.name === 'NotAllowedError' ? 'Cancelaste o no diste permiso para grabar.' : e.message, true); setup(); }
  }
  function recording() {
    mount(v, html`<div class="recbar"><i class="recdot"></i><b id="recT">00:00</b><button class="btn ghost xs" data-r="pause">${paused ? 'Seguir' : 'Pausa'}</button><button class="btn xs" data-r="stop">■ Terminar</button><button class="btn ghost xs" data-r="cancel">Descartar</button></div>`);
    v.classList.add('min');
    clearInterval(tick); tick = setInterval(() => { const el = $('#recT', v); if (el && !paused) el.textContent = fmt(Date.now() - t0); }, 500);
  }
  function review() {
    v.classList.remove('min');
    const url = URL.createObjectURL(blob);
    mount(v, html`<div class="recbox"><div class="row"><b style="font-size:18px;font-weight:500">Tu video</b><div class="sp"></div><button class="arrow light" data-r="x">✕</button></div>
      <video src="${url}" controls playsinline style="width:100%;border-radius:16px;margin:12px 0;background:#1a120c;max-height:46vh"></video>
      <input class="in" id="recTitle" placeholder="Título (ej. Cómo entregar el ciclo)" style="margin-bottom:8px">
      <div class="wkbar" id="recBar" hidden><i style="width:0%"></i></div>
      <div class="row" style="margin-top:10px"><button class="btn" data-r="save">⇪ Guardar en la Library</button><button class="btn ghost" data-r="redo">Grabar otra vez</button><div class="sp"></div><span class="mut sm">${(blob.size / 1e6).toFixed(1)} MB</span></div></div>`);
  }
  async function save() {
    const title = $('#recTitle', v).value.trim() || `Video ${new Date().toLocaleString('es-GT')}`;
    const bar = $('#recBar', v); bar.hidden = false; $('[data-r=save]', v).disabled = true;
    try {
      const ext = (blob.type || '').includes('mp4') ? 'mp4' : 'webm';
      const f = await uploadToDrive(new File([blob], `${title}.${ext}`, { type: blob.type || 'video/webm' }), `${title}.${ext}`, (p) => { bar.firstElementChild.style.width = Math.round(p * 100) + '%'; }, { client: 'Inherent', sub: 'Library' });
      close(); onDone?.({ title, link: f.link, id: f.id });
    } catch (e) { $('[data-r=save]', v).disabled = false; toast(e.message, true); }
  }
  v.onclick = (e) => {
    const t = e.target.closest('[data-r]'); if (!t) return;
    const r = t.dataset.r;
    if (r === 'x') close();
    if (r === 'mode') { mode = t.dataset.m; mic = $('#recMic', v).checked; setup(); }
    if (r === 'start') start();
    if (r === 'stop') rec?.state !== 'inactive' && rec.stop();
    if (r === 'pause') { if (rec.state === 'recording') { rec.pause(); paused = true; pauseAt = Date.now(); } else { rec.resume(); paused = false; t0 += Date.now() - pauseAt; } recording(); }
    if (r === 'cancel') { rec.onstop = null; rec.stop(); close(); }
    if (r === 'redo') { blob = null; setup(); }
    if (r === 'save') save();
  };
  document.body.append(v); setup();
}
