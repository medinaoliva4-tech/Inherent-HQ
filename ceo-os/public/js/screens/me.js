// Mi perfil: se abre al tocar tu foto. Tu foto, tu cumpleaños, cómo te contactan, tus conexiones y salir.
import { html, raw, mount, api, toast, cropImage, initials, roleName, IC, LOGO, $, ico } from '../core.js';
import { purposeCard } from '../purpose.js';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const bdayText = (bd) => (bd ? `${+bd.slice(3)} de ${MESES[+bd.slice(0, 2) - 1]}` : '');

export async function render(el, { me }) {
  const client = me.role === 'client';
  // Tu primer día y los videos «Cómo se usa» que le tocan a tu puesto.
  const { cargarGuias, listaVideos, vistosDe, clickVideo } = await import('../guia.js');
  const { videosDe } = await import('../guia-secciones.js');
  const { abrirPrimerDia, avancePrimerDia, primerDiaHecho } = await import('../primer-dia.js');
  const G = client ? { items: [], vistos: {} } : await cargarGuias();
  const mios = videosDe(G.items, me);
  const primerDiaHtml = () => { const a = avancePrimerDia(me), ok = primerDiaHecho(me); return html`<div class="card" style="margin-top:14px"><h3 class="profh">Tu primer día</h3>
    <div class="row" style="gap:10px;flex-wrap:wrap"><span class="chip ${ok ? 'ok' : ''}">${ok ? html`${ico('check', 13)} Terminado` : `${a.n} de ${a.total} pasos`}</span><button class="btn ghost xs" data-p="pd">${ok ? 'Volver a verlo' : 'Seguir el recorrido'}</button></div></div>`; };
  // Los avisos en este dispositivo (web push): se activan aquí; el estado se lee del navegador y del servidor.
  const AV = client ? null : await import('../avisos.js');
  let av = AV ? await AV.estadoAvisos() : null;
  const avisosHtml = () => !av ? '' : html`<div class="card" style="margin-top:14px"><h3 class="profh">Avisos en este dispositivo</h3>
    <p class="mut sm" style="margin:0 0 10px">Cuando entra un lead y, cada mañana, lo que necesita tu atención. ${av.ios && !av.instalada ? 'En iPhone: primero agrega el OS a la pantalla de inicio (Compartir → «Agregar a inicio») y ábrelo desde ahí.' : ''}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap">${av.activo ? html`<span class="chip ok">${ico('check', 13)} Activos aquí</span><button class="btn ghost xs" data-p="av-probar">Mandar uno de prueba</button><button class="btn ghost xs" data-p="av-quitar">Quitar</button>` : html`<button class="btn xs" data-p="av-on" ${!av.soporta || !av.servidor ? raw('disabled') : ''}>Activar avisos</button>${!av.servidor ? html`<span class="mut sm">Faltan las claves de avisos en el servidor.</span>` : !av.soporta ? html`<span class="mut sm">Este navegador no recibe avisos.</span>` : av.permiso === 'denied' ? html`<span class="mut sm">Bloqueaste los avisos en el navegador: cámbialo en sus ajustes.</span>` : ''}`}${av.dispositivos > (av.activo ? 1 : 0) ? html`<span class="mut sm">· ${av.dispositivos - (av.activo ? 1 : 0)} ${av.dispositivos - (av.activo ? 1 : 0) === 1 ? 'otro dispositivo' : 'otros dispositivos'}</span>` : ''}</div></div>`;
  const videosHtml = () => { const v = vistosDe(mios, me.vistos || G.vistos); return html`<div class="card" style="margin-top:14px"><h3 class="profh">Cómo se usa · ${v.vistos} de ${v.total} vistos</h3>${listaVideos(mios, me.vistos || G.vistos, me)}</div>`; };
  const paint = () => {
    const [mm, dd] = (me.birthday || '-').split('-');
    mount(el, html`<div class="myprof">
      <div class="card profhead">
        <label class="profpic" title="Cambiar foto">${me.picture ? html`<img src="${me.picture}" alt="" referrerpolicy="no-referrer">` : html`<span>${initials(me.name)}</span>`}
          <input type="file" accept="image/*" id="ppic" hidden><i>Cambiar</i></label>
        <div class="grow" style="min-width:0"><h1>${me.name}</h1>
          <div class="mut">${client ? 'Cliente de Inherent' : me.title || (me.roles || []).map(roleName).join(' · ') || me.role.toUpperCase()}</div>
          <div class="mut sm">${me.email}${me.birthday ? html` · ${ico('cake')} ${bdayText(me.birthday)}` : ''}</div>
          ${me.picture ? html`<button class="sm mut linkish" data-p="nopic">Quitar foto</button>` : ''}</div>
      </div>
      <div style="margin-top:14px">${purposeCard(me, { open: true })}</div>
      ${client ? '' : html`${primerDiaHtml()}${avisosHtml()}${videosHtml()}`}

      ${client ? '' : html`<div class="card" style="margin-top:14px"><h3 class="profh">Sobre ti</h3>
        <div class="form">
          <div class="two"><div><label class="f">Cumpleaños</label><div class="row" style="gap:8px;flex-wrap:nowrap">
              <select class="in" id="bdd"><option value="">Día</option>${Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => html`<option ${d === dd ? raw('selected') : ''}>${d}</option>`)}</select>
              <select class="in" id="bdm"><option value="">Mes</option>${MESES.map((m, i) => { const v = String(i + 1).padStart(2, '0'); return html`<option value="${v}" ${v === mm ? raw('selected') : ''}>${m}</option>`; })}</select></div>
              <div class="mut sm" style="margin-top:4px">Solo día y mes. El equipo te felicita en Home ${ico('spark')}</div></div>
            <div><label class="f">Teléfono / WhatsApp</label><input class="in" id="pphone" value="${me.phone || ''}" placeholder="+502 …"></div></div>
          <div><label class="f">Sobre mí</label><textarea class="in" id="pbio" placeholder="Qué haces en Inherent, en qué eres bueno, qué te gusta…">${me.bio || ''}</textarea></div>
          <div class="row"><button class="btn" data-p="save">Guardar</button></div>
        </div></div>

      <div class="card" style="margin-top:14px"><h3 class="profh">Tus conexiones</h3>
        <div class="row" style="gap:8px;flex-wrap:wrap">${[['calendar', 'Google Calendar', IC.cal], ['drive', 'Google Drive', IC.drive], ['gmail', 'Gmail (mandar correos)', ico('mail')]].map(([k, l, ic]) => html`<span class="gbadge ${me.google?.[k] ? '' : 'off'}">${ic} ${l} ${me.google?.[k] ? ico('check', 13) : '· falta'}</span>`)}</div>
        ${['calendar', 'drive', 'gmail'].some((k) => !me.google?.[k]) ? html`<div class="mut sm" style="margin-top:8px">Para dar el permiso que falta: <b>Cerrar sesión</b> y vuelve a entrar con Google.</div>` : ''}
        <button class="profrow" data-p="ai"><span class="ailogos">${['claude', 'chatgpt', 'codex'].map((k) => html`<span class="ailogo sm">${LOGO[k]}</span>`)}</span><span class="grow">Habla con Inherent OS desde tu IA</span><span class="mut">${me.mcp ? html`Conectado ${ico('check', 13)}` : 'Conectar →'}</span></button>
      </div>`}

      <div class="card" style="margin-top:14px">
        ${me.role === 'ceo' ? html`<a class="profrow" href="#/setup"><span>${ico('gear')}</span><span class="grow">Arranque de la app</span><span class="mut">→</span></a>` : ''}
        ${client ? '' : html`<a class="profrow" href="#/team"><span>${ico('users')}</span><span class="grow">El equipo</span><span class="mut">→</span></a>`}
        <button class="profrow" data-p="out"><span>↩</span><span class="grow">Cerrar sesión</span></button>
      </div></div>`);
  };
  paint();

  el.addEventListener('change', async (e) => {
    if (e.target.id !== 'ppic' || !e.target.files[0]) return;
    try { const photo = await cropImage(e.target.files[0]); e.target.value = ''; if (!photo) return; await api('me/photo', { method: 'PUT', body: { photo } }); me.picture = photo; toast('Foto actualizada'); paint(); refreshAvatar(me); }
    catch (err) { toast(err.message, true); }
  });
  el.addEventListener('click', clickVideo(me));
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-p]'); if (!b) return;
    const a = b.dataset.p;
    if (a === 'pd') return abrirPrimerDia(me);
    if (a === 'av-on') { try { await AV.activarAvisos(); toast('Avisos activados en este dispositivo'); } catch (err) { toast(err.message, true); } av = await AV.estadoAvisos(); paint(); return; }
    if (a === 'av-quitar') { await AV.quitarAvisos(); toast('Avisos quitados'); av = await AV.estadoAvisos(); paint(); return; }
    if (a === 'av-probar') { try { const r = await AV.probarAvisos(); toast(r.mandados ? 'Te mandé un aviso' : 'No llegó a ningún dispositivo', !r.mandados); } catch (err) { toast(err.message, true); } return; }
    if (a === 'save') {
      const d = $('#bdd', el).value, m = $('#bdm', el).value;
      if (Boolean(d) !== Boolean(m)) return toast('Elige día y mes', true);
      const v = { birthday: d && m ? `${m}-${d}` : '', phone: $('#pphone', el).value.trim(), bio: $('#pbio', el).value.trim() };
      try { await api('me/profile', { method: 'PUT', body: v }); Object.assign(me, v); toast('Perfil guardado'); paint(); } catch (err) { toast(err.message, true); }
    } else if (a === 'nopic') {
      try { await api('me/photo', { method: 'PUT', body: { photo: '' } }); me.picture = null; paint(); refreshAvatar(me); } catch (err) { toast(err.message, true); }
    } else if (a === 'ai') { const { openConnect } = await import('../connectai.js'); openConnect(me, paint); }
    else if (a === 'out') { await api('auth/logout', { method: 'POST' }).catch(() => {}); location.href = '/'; }
  });
}
function refreshAvatar(me) {
  const av = $('#avatar'); if (!av) return;
  mount(av, me.picture ? html`<img src="${me.picture}" alt="" referrerpolicy="no-referrer" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : html`${initials(me.name)}`);
}
