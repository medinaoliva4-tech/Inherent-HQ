// Marca › Crear › Plan del mes: el chat con ③ Marketing a la izquierda y el plan armándose a la derecha (como Estrategia).
// El chat corre con el Claude de tu compu por el puente de Laya, en solo lectura. Lo que Marketing decide llega en un bloque
// ```plan``` y se guarda en el OS; «Pasar a Creatividad» vuelve cada slot una pieza del calendario (estado Idea).
// Rutas: #/marcas/<marca>/plan · #/marcas/<marca>/plan/<AAAA-MM>
import { html, raw, mount, api, col, toast, ico, md, confirmAsk, $, $$ } from './core.js';
import { PUENTE, INSTALAR_MAC, INSTALAR_WIN, sistemaDe } from './laya.js';
import { chromeBloquea, PASOS_COPIA_VIEJA, sesionVencida, PASOS_LOGIN } from './puente-chat.js';
import { promptPlan, leerPlan, sinBloqueP, nombreMes, revisarSlots, sumaPilares, avancePlan, SECCIONES_P, NOMBRE_P } from './plan-mes.js';
import { textoRefs } from './diseno.js';
import { divisor } from './divisor.js';
import { motorBtn, menuMotor, faltaMotor, faltaHtml, cuerpoMotor, claveMotor } from './motor-ui.js';

let enVuelo = null;
const mesDe = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const RAPIDOS = ['Arma el plan del mes', '¿Este mes es campaña o pilar?', 'Reparte los slots por semana', '¿Qué canal sobra?'];
const PILAR_C = ['#2a1f17', '#8a6a50', '#c9b39b', '#5d7a46', '#3f6ea8', '#b4472f'];

export async function planMesUI(el, { me, b, alive, rest = [] }) {
  if (enVuelo) { try { enVuelo.abort(); } catch {} enVuelo = null; }
  el.dataset.island = '1';
  const hoy = new Date(), M0 = mesDe(hoy), M1 = mesDe(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)), Mm = mesDe(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));
  const mes = /^\d{4}-\d{2}$/.test(rest[0] || '') ? rest[0] : M0;
  if (/iPhone|iPod|Android.+Mobile/i.test(navigator.userAgent || '')) return mount(el, html`<div class="empty es-solo-compu"><span class="es-hint-i">${ico('target', 22)}</span><b>Disponible solo en tu compu</b>El Plan del mes trabaja con el Claude de tu computadora. Ábrelo desde ahí.</div>`);
  mount(el, html`<p class="loading">Cargando…</p>`);
  let d;
  try { d = await api(`plan/${encodeURIComponent(b.slug)}/${mes}`); } catch (e) { return mount(el, html`<div class="empty"><b>No pude abrir el plan</b>${e.message}</div>`); }
  if (!alive()) return;
  let plan = d.plan || {}, fresh = [];
  const edit = Boolean(d.puede?.editar);
  const key = `os.plan.chat.${me.email}.${b.slug}.${mes}`;
  const chat = (() => { try { const j = JSON.parse(localStorage.getItem(key) || 'null'); if (j && Array.isArray(j.msgs)) return { msgs: j.msgs, sesion: j.sesion || null, motor: j.motor || 'claude:' }; } catch {} return { msgs: [], sesion: null, motor: '' }; })();
  const guardarChat = () => { try { localStorage.setItem(key, JSON.stringify({ msgs: chat.msgs.slice(-30).map(({ r, t, err, pregunta, aplicado }) => ({ r, t, ...(err ? { err } : {}), ...(pregunta ? { pregunta } : {}), ...(aplicado ? { aplicado } : {}) })), sesion: chat.sesion, motor: chat.motor })); } catch {} };
  const tok = () => { try { return localStorage.getItem(`os.estrategia.token.${me.email}`) || ''; } catch { return ''; } };
  const setTok = (t) => { try { if (t) localStorage.setItem(`os.estrategia.token.${me.email}`, t); else localStorage.removeItem(`os.estrategia.token.${me.email}`); } catch {} };
  const S = { salud: null, pareo: '', pasando: false, piezas: d.piezas || 0 };

  mount(el, html`<div class="pm"><section class="es-chat pm-chat" id="pm-chat"></section><section class="pm-pane" id="pm-pane"></section></div>`);
  const root = $('.pm', el), chatEl = $('#pm-chat', el), paneEl = $('#pm-pane', el);

  // ---------- El puente (el mismo del chat de Estrategia: solo lectura) ----------
  async function salud(ms = 4000) {
    let v = { on: false };
    try { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { const r = await fetch(PUENTE + '/health', { signal: c.signal, credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback' }); if (r.ok) { const j = await r.json(); v = { on: j.status === 'ok', chat: j.chat || null }; } } finally { clearTimeout(t); } } catch { /* apagado */ }
    S.salud = v; return v;
  }
  function fase() {
    const s = S.salud; if (!s) return 'cargando';
    if (!s.on) return 'apagado';
    if (!s.chat) return 'viejo';
    if (s.chat.ayuda) return s.chat.ayuda;
    if (!tok()) return 'sin-token';
    if (faltaMotor(me, s.chat)) return 'motor';
    return 'listo';
  }
  const cmd = (c) => html`<div class="es-cmd"><code>${c}</code><button type="button" class="btn ghost xs" data-act="copiar" data-t="${c}">${ico('copy', 13)} Copiar</button></div>`;
  function setup(f) {
    const inst = sistemaDe(navigator.userAgent || '') === 'win' ? INSTALAR_WIN : INSTALAR_MAC, otra = html`<button class="btn xs" data-act="reintentar">Ya lo hice</button>`;
    if (f === 'cargando') return html`<div class="es-setup"><p class="mut">Buscando el puente en tu compu…</p></div>`;
    if (f === 'apagado') return chromeBloquea() ? html`<div class="es-setup"><b>Chrome está bloqueando a tu compu</b><p>${PASOS_COPIA_VIEJA}</p>${otra}</div>` : html`<div class="es-setup"><b>El chat corre en tu compu</b><p>Enciende el puente de Laya. Un comando, y queda corriendo siempre:</p>${cmd(inst)}${otra}</div>`;
    if (f === 'viejo') return html`<div class="es-setup"><b>Falta actualizar el puente</b><p>Corre otra vez el comando y se actualiza solo:</p>${cmd(inst)}${otra}</div>`;
    if (f === 'motor') return faltaHtml(faltaMotor(me, S.salud?.chat), cmd);
    if (f === 'sin_claude') return html`<div class="es-setup"><b>No encuentro Claude Code</b><p>Instálalo e inicia sesión con tu cuenta (comando <code>claude</code>). Luego vuelve aquí.</p>${otra}</div>`;
    if (f !== 'sin-token') return html`<div class="es-setup"><b>El puente está preparando el repo</b><p>${S.salud?.chat?.error_repo || 'Si en un minuto sigue igual, corre otra vez el comando de instalar.'}</p>${cmd(inst)}${otra}</div>`;
    return html`<div class="es-setup"><b>Empareja tu compu (una sola vez)</b><p>Es el mismo token del chat de Estrategia. Para verlo:</p>${cmd(sistemaDe(navigator.userAgent || '') === 'win' ? 'Get-Content "$HOME\\.inherent\\laya\\chat-token"' : 'cat ~/.inherent/laya/chat-token')}
      <form class="es-pair" data-act="pair"><input class="in" name="t" type="password" autocomplete="off" spellcheck="false" placeholder="Pega el token" aria-label="Token del puente"><button class="btn xs" type="submit">Emparejar</button></form>${S.pareo ? html`<p class="es-err">${S.pareo}</p>` : ''}</div>`;
  }

  // ---------- El chat ----------
  const mesPick = () => html`<button type="button" class="es-pick" data-act="mes" aria-haspopup="listbox">${nombreMes(mes).replace(/^./, (c) => c.toUpperCase())} ▾</button>`;
  function paintChat() {
    const f = fase(), ok = f === 'listo';
    const pill = html`<span class="es-pill ${ok ? 'on' : ''}"><i></i>${ok ? 'En tu compu' : f === 'cargando' ? '…' : 'Sin conectar'}</span>`;
    mount(chatEl, html`<div class="es-msgs" id="pm-msgs" aria-live="polite"></div>
      ${ok ? html`<div class="es-box"><form class="es-form" id="pm-form"><textarea class="in" id="pm-in" rows="1" placeholder="Opina, agrega un dato o pide más detalle…" aria-label="Mensaje para Marketing"></textarea><button class="btn es-send" type="submit" aria-label="Enviar">${ico('right', 16)}</button></form>
        <div class="es-foot"><div class="dz-picks">${mesPick()}${motorBtn(me)}</div>${pill}</div></div>` : html`${setup(f)}<div class="es-foot">${pill}</div>`}`);
    paintMsgs();
    const ta = $('#pm-in', chatEl); if (ta) ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.min(160, ta.scrollHeight) + 'px'; };
  }
  function paintMsgs() {
    const box = $('#pm-msgs', chatEl); if (!box) return;
    chatEl.classList.toggle('vacio', !chat.msgs.length);
    mount(box, chat.msgs.length ? chat.msgs.map((m, i) => msgHtml(m, i)) : html`<div class="es-hint"><span class="es-hint-i">${ico('target', 22)}</span><b>El plan de ${nombreMes(mes)}</b><p>Marketing reparte la estrategia en el tiempo y en los canales: qué se dice, dónde, en qué semana y para qué sirve cada pieza.</p>
      <div class="dz-sug">${RAPIDOS.map((s) => html`<button type="button" data-act="rapido" data-t="${s}">${s}</button>`)}</div></div>`);
    box.scrollTop = box.scrollHeight;
  }
  function msgHtml(m, i) {
    if (m.r === 'u') return html`<div class="es-m u"><div class="es-b">${m.t}</div></div>`;
    const busy = m.stream, ult = i === chat.msgs.length - 1;
    return html`<div class="es-m a"><div class="es-b">${m.tools?.length && busy && !m.t ? html`<p class="es-tool">${ico('doc', 12)} ${m.tools[m.tools.length - 1]}</p>` : ''}${m.t ? md(m.t) : busy ? html`<span class="es-dots-t"><i></i><i></i><i></i></span>` : ''}
      ${m.err ? html`<p class="es-err">${m.err}</p>` : ''}${m.aplicado?.length ? html`<span class="es-upd"><i>✦</i>Plan · ${m.aplicado.join(', ')} actualizado</span>` : ''}
      ${m.pregunta ? html`<div class="es-q ${ult ? '' : 'hecha'}"><span class="lbl">Una pregunta antes de seguir</span><b>${m.pregunta.texto}</b>${m.pregunta.opciones.length ? html`<div class="es-opts">${m.pregunta.opciones.map((o) => html`<button type="button" data-act="opcion" data-t="${o}" ${ult ? '' : raw('disabled')}>${o}</button>`)}</div>` : ''}</div>` : ''}</div>
      ${busy && ult ? html`<div class="es-act"><button type="button" class="btn ghost xs" data-act="detener">${ico('dot', 12)} Detener</button></div>` : ''}</div>`;
  }
  async function contextoInicial() {
    let estrategia = '', investigacion = '';
    try {
      const e = await api(`estrategia/${encodeURIComponent(b.slug)}`), v = e.viva || {};
      const partes = { nivel: e.nivel?.nombre, etapa: e.etapa?.n, aprobada: e.vivaAprobada, meta: v.meta, contexto: v.contexto?.conclusion, analisis: v.analisis, inversa: v.inversa, contenido: v.contenido, pauta: v.pauta, riesgos: v.riesgos, metodologia: v.metodologia, roadmap: v.roadmap };
      estrategia = JSON.stringify(partes, (k, x) => (x === undefined || x === null || x === '' ? undefined : x));
    } catch { /* sin acceso a Estrategia: Claude la busca en el repo */ }
    try { investigacion = textoRefs((await col('content').list()).filter((x) => x.kind === 'research' && x.profile === b.slug)); } catch { /* sin Investigación */ }
    return { estrategia, investigacion };
  }
  async function enviar(texto) {
    texto = String(texto || '').trim(); if (!texto || enVuelo) return;
    if (fase() !== 'listo') return toast('Primero conecta tu compu', true);
    const ctrl = new AbortController(); enVuelo = ctrl;
    if (chat.motor !== claveMotor(me)) { chat.sesion = null; chat.motor = claveMotor(me); }
    const primera = !chat.sesion;
    chat.msgs.push({ r: 'u', t: texto }); chat.msgs.push({ r: 'a', t: '', stream: true, tools: [] });
    const msg = chat.msgs[chat.msgs.length - 1]; paintMsgs();
    const ctx = primera ? await contextoInicial() : {};
    const prompt = promptPlan({ marca: b.name, slug: b.slug, mes, plan, ...ctx, pedido: texto, primera });
    let raw0 = '', fallo = null;
    try {
      const r = await fetch(PUENTE + '/chat', { method: 'POST', credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback', signal: ctrl.signal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() }, body: JSON.stringify({ prompt, ...cuerpoMotor(me), ...(chat.sesion ? { resume: chat.sesion } : {}) }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw Object.assign(new Error(j.error || `El puente respondió ${r.status}`), { status: r.status }); }
      const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '';
      for (;;) {
        const { value, done } = await rd.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let k; while ((k = buf.indexOf('\n\n')) >= 0) {
          const bloq = buf.slice(0, k); buf = buf.slice(k + 2);
          const ev = /^event: (\w+)/m.exec(bloq)?.[1]; let x = {}; try { x = JSON.parse(/^data: (.*)$/m.exec(bloq)?.[1] || '{}'); } catch {}
          if (ev === 'inicio' && x.sesion) chat.sesion = x.sesion;
          else if (ev === 'delta') { raw0 += x.texto || ''; msg.t = sinBloqueP(raw0); paintMsgs(); }
          else if (ev === 'herramienta') { msg.tools.push(`${x.nombre === 'Read' ? 'Leyendo' : 'Buscando'} ${x.detalle || ''}`.trim()); if (!msg.t) paintMsgs(); }
          else if (ev === 'fin') { raw0 = x.texto || raw0; if (x.sesion) chat.sesion = x.sesion; }
          else if (ev === 'error') fallo = x;
        }
      }
      if (fallo) { if (!primera && /session|conversation|resume/i.test(fallo.error || '')) chat.sesion = null; msg.err = sesionVencida(fallo.error) ? PASOS_LOGIN : fallo.error || 'Claude no pudo responder'; }
    } catch (e) {
      if (e.name === 'AbortError') msg.err = 'Interrumpido.';
      else if (e.status === 401) { setTok(''); S.pareo = 'Ese token ya no sirve. Pega el actual.'; msg.err = 'El puente no reconoció tu token.'; }
      else msg.err = chromeBloquea() ? PASOS_COPIA_VIEJA : sesionVencida(e.message) ? PASOS_LOGIN : e.message && e.message !== 'Failed to fetch' ? e.message : 'No pude hablar con el puente. ¿Sigue encendido?';
      if (e.status === 401 || e.status === 412) await salud();
    } finally { enVuelo = null; msg.stream = false; }
    const { texto: limpio, parche, pregunta } = leerPlan(raw0);
    msg.t = limpio; if (pregunta) msg.pregunta = pregunta;
    if (Object.keys(parche).length) {
      if (!edit) msg.aviso = 'Tu perfil no puede cambiar el plan.';
      else { try { const r = await api(`plan/${encodeURIComponent(b.slug)}/${mes}`, { method: 'PUT', body: { parche } }); plan = r.plan || plan; fresh = r.cambiadas || []; msg.aplicado = fresh.map((k) => NOMBRE_P[k] || k); } catch (er) { msg.err = `No pude guardar el plan: ${er.message}`; } }
    }
    guardarChat();
    if (!alive()) return;
    if (fase() !== 'listo') paintChat(); else paintMsgs();
    paintPane(); $('#pm-in', chatEl)?.focus();
  }

  // ---------- El plan ----------
  function paintPane() {
    const p = plan, n = avancePlan(p), fr = (k) => (fresh.includes(k) ? 'fresh' : '');
    const avisos = revisarSlots(p.slots || [], p.canales || []), aviso = (id) => avisos.find((a) => a.id === id)?.avisos || [];
    const suma = sumaPilares(p.pilares || []);
    const vacio = (t) => html`<p class="ev-vacio">${t}</p>`;
    mount(paneEl, html`<div class="pm-bar"><div style="min-width:0"><span class="lbl" style="margin:0">Plan de ${nombreMes(mes)} · ③ Marketing</span>
        <h2>${p.campana?.nombre ? `«${p.campana.nombre}»` : 'Todavía sin idea del mes'}</h2></div><span class="sp"></span>
        ${p.campana?.traza ? html`<span class="pm-tag g">Traza a ${p.campana.traza}</span>` : ''}${p.campana?.tipo ? html`<span class="pm-tag">${p.campana.tipo === 'pilar' ? 'Pilar' : 'Campaña'}</span>` : ''}
        <div class="ev-prog" title="${n} de 5 partes">${SECCIONES_P.map((k) => html`<span class="${(k === 'campana' ? p.campana?.nombre : p[k]?.length) ? 'ok' : ''}"><i></i>${NOMBRE_P[k].replace(/^(La|El|Los) /, '')}</span>`)}</div></div>
      <div class="pm-body">
      <section class="ev-sec ${fr('campana')}"><header><b>La idea del mes</b></header>${p.campana?.idea ? html`<p class="ev-concl">${p.campana.idea}${p.campana.meta ? html` <span class="mut">· Meta: ${p.campana.meta}</span>` : ''}</p>` : vacio('Marketing decide si el mes es campaña (un mensaje que tiene que llegar) o pilar (lo de siempre), y la idea que lo amarra.')}</section>
      <section class="ev-sec ${fr('mensaje')}"><header><b>El mensaje, en orden</b></header>${p.mensaje?.length ? html`<div class="ev-g3">${p.mensaje.map((m, i) => html`<div class="ev-c"><span class="lbl" style="margin:0">${i + 1}</span><b>${m.titulo}</b>${m.para ? html`<small class="mut">${m.para}</small>` : ''}</div>`)}</div>` : vacio('Qué se dice primero, qué lo prueba y qué se pide.')}</section>
      <section class="ev-sec ${fr('pilares')}"><header><b>Los pilares y su peso</b>${p.pilares?.length && suma !== 100 ? html`<span class="pm-warn">Suman ${suma}%, no 100%</span>` : ''}</header>${p.pilares?.length ? html`<div class="pm-pbar">${p.pilares.map((x, i) => html`<i style="width:${suma ? (x.peso / Math.max(suma, 100)) * 100 : 0}%;background:${PILAR_C[i % PILAR_C.length]}"></i>`)}</div><div class="pm-leg">${p.pilares.map((x, i) => html`<span title="${x.para || ''}"><i style="background:${PILAR_C[i % PILAR_C.length]}"></i>${x.nombre} ${x.peso}%</span>`)}</div>` : vacio('De qué se habla y cuánto pesa cada tema en el mes.')}</section>
      <section class="ev-sec ${fr('canales')}"><header><b>Cada canal, su función</b></header>${p.canales?.length ? html`<div class="ev-g3">${p.canales.map((c) => html`<div class="ev-c"><b>${c.canal}</b><small class="mut">${[c.funcion, c.frecuencia, c.formatos].filter(Boolean).join(' · ')}</small>${c.no ? html`<small class="mut">No: ${c.no}</small>` : ''}</div>`)}</div>` : vacio('Para qué sirve cada canal y qué no se hace ahí. Dos canales con la misma función: sobra uno.')}</section>
      <section class="ev-sec ${fr('slots')}"><header><b>Los slots del mes${p.slots?.length ? ` · ${p.slots.length} piezas` : ''}</b>${avisos.length ? html`<span class="pm-warn">${avisos.length} por revisar</span>` : ''}</header>
        ${p.slots?.length ? html`<div class="pm-tbl"><table><thead><tr><th>Sem.</th><th>Canal</th><th>Formato</th><th>Función</th><th>A quién</th><th>Consciencia</th><th>Para qué</th><th>Traza</th></tr></thead><tbody>${p.slots.map((s) => html`<tr class="${aviso(s.id).length ? 'mal' : ''}"><td>${s.semana}</td><td>${s.canal}</td><td>${s.formato}</td><td>${s.funcion ? html`<span class="pm-tag">${s.funcion}</span>` : ''}</td><td>${s.temperatura}</td><td>${s.consciencia}</td><td>${s.objetivo}${aviso(s.id).map((a) => html`<small class="pm-warn">${a}</small>`)}</td><td>${s.traza}</td></tr>`)}</tbody></table></div>` : vacio('Una fila por pieza: semana, canal, formato y el trabajo que hace. El día exacto lo pone Creatividad.')}</section>
      </div>
      <footer class="pm-foot"><span>${S.piezas ? `${S.piezas} pieza${S.piezas === 1 ? '' : 's'} de este plan ya están en el calendario.` : 'Marketing no escribe piezas: decide qué se dice, dónde y cuándo.'}</span><span class="sp"></span>
        ${p.slots?.length && edit ? html`<button class="btn" data-act="pasar" ${S.pasando ? raw('disabled') : ''}>${S.pasando ? 'Pasando…' : `${S.piezas ? 'Poner al día' : 'Pasar'} los ${p.slots.length} slots a Creatividad`} ${ico('right', 13)}</button>` : ''}
        ${S.piezas ? html`<a class="btn ghost xs" href="#/marcas/${b.slug}/ideas">Ver en Ideas</a>` : ''}</footer>`);
    if (fresh.length) setTimeout(() => { fresh = []; $$('.ev-sec.fresh', paneEl).forEach((x) => x.classList.remove('fresh')); }, 4000);
  }
  async function pasar() {
    const avisos = revisarSlots(plan.slots || [], plan.canales || []);
    if (avisos.length && !(await confirmAsk(`${avisos.length} slot${avisos.length === 1 ? '' : 's'} tienen algo por revisar (se marcan en rojo). ¿Los paso así a Creatividad?`))) return;
    S.pasando = true; paintPane();
    try { const r = await api(`plan/${encodeURIComponent(b.slug)}/${mes}/a-creatividad`, { method: 'POST', body: {} }); S.piezas = r.nuevas + r.puestas; toast(r.nuevas ? `${r.nuevas} piezas nuevas en el calendario${r.puestas ? ` · ${r.puestas} puestas al día` : ''}` : `${r.puestas} piezas puestas al día`); }
    catch (e) { toast(e.message, true); }
    S.pasando = false; if (alive()) paintPane();
  }

  // ---------- Clics ----------
  root.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-act]'); if (!t || !root.contains(t)) return;
    const a = t.dataset.act;
    if (a === 'copiar') { try { await navigator.clipboard.writeText(t.dataset.t); toast('Copiado'); } catch { toast('Selecciona el texto y cópialo', true); } return; }
    if (a === 'mes') {
      document.querySelector('.es-menu')?.remove();
      const m = document.createElement('div'); m.className = 'es-menu'; m.setAttribute('role', 'listbox');
      mount(m, html`${[Mm, M0, M1].map((x) => html`<a href="#/marcas/${b.slug}/plan/${x}" class="${x === mes ? 'on' : ''}" role="option"><b></b><span>${nombreMes(x).replace(/^./, (c) => c.toUpperCase())}</span><small>${x === M0 ? 'Este mes' : x === M1 ? 'El siguiente' : 'El anterior'}</small></a>`)}`);
      t.closest('.es-box').append(m);
      const cerrar = (ev) => { if (!m.contains(ev.target) && ev.target !== t) { m.remove(); document.removeEventListener('pointerdown', cerrar); } };
      setTimeout(() => document.addEventListener('pointerdown', cerrar)); return;
    }
    if (a === 'motor') return menuMotor(t, me, S.salud?.chat, () => paintChat());
    if (a === 'opcion') { t.closest('.es-q')?.classList.add('hecha'); return enviar(t.dataset.t); }
    if (a === 'rapido') return enviar(t.dataset.t);
    if (a === 'detener') { try { enVuelo?.abort(); } catch {} return; }
    if (a === 'pasar') return pasar();
    if (a === 'reintentar') { t.disabled = true; await salud(30000); if (!S.salud?.on) toast(chromeBloquea() ? PASOS_COPIA_VIEJA : 'Tu compu no respondió. Abre el OS en Chrome y dale permiso si lo pide.', true); return paintChat(); }
  });
  root.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (e.target.id === 'pm-form') { const ta = $('#pm-in', chatEl); const v = ta.value; ta.value = ''; ta.style.height = 'auto'; return enviar(v); }
    if (e.target.dataset.act === 'pair') {
      const v = new FormData(e.target).get('t')?.toString().trim(); if (!v) return;
      try { const r = await fetch(PUENTE + '/chat/estado', { headers: { Authorization: 'Bearer ' + v }, credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback' }); if (r.ok) { setTok(v); S.pareo = ''; toast('Listo: tu compu quedó emparejada'); } else S.pareo = r.status === 401 ? 'Ese token no es el del puente.' : `El puente respondió ${r.status}.`; }
      catch { S.pareo = 'No pude hablar con el puente.'; }
      return paintChat();
    }
  });
  root.addEventListener('keydown', (e) => { if (e.target.id === 'pm-in' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#pm-form', root)?.requestSubmit(); } });

  divisor(root, chatEl, { key: 'plan' });
  paintChat(); paintPane(); salud().then(() => { if (alive()) paintChat(); });
}
