// Mi perfil: se abre al tocar tu foto. Tu foto, tu cumpleaños, cómo te contactan, tus conexiones y salir.
import { html, raw, mount, api, toast, cropImage, initials, roleName, IC, LOGO, $, ico } from '../core.js';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const bdayText = (bd) => (bd ? `${+bd.slice(3)} de ${MESES[+bd.slice(0, 2) - 1]}` : '');

export async function render(el, { me }) {
  const client = me.role === 'client';
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
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-p]'); if (!b) return;
    const a = b.dataset.p;
    if (a === 'save') {
      const d = $('#e9dfd2', el).value, m = $('#bdm', el).value;
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
