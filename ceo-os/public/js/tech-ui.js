// App 01 · Marca › Tech: la web, las landings y las herramientas de la marca, en tres partes.
//   Sitios: una tarjeta por sitio (link, estado, última actualización, de qué se alimenta). Una landing se conecta al CRM
//   (el CEO crea su fuente de leads) y da el formulario listo para pegar.
//   Web viva: el CEO la enciende y la web de la marca lee del OS lo que ya se publicó en redes.
//   Auditoría de SEO: se pide a Claude Code (plugin claude-seo) y el resultado se guarda aquí, con su puntaje.
import { html, raw, mount, api, toast, ico, ask, md, fdate, $, confirmAsk, drawer, closeDrawer, openClaude } from './core.js';
import { TIPOS_T, ESTADOS_T, formularioLanding, promptAuditoria, puntajeDe, httpsOk } from './tech.js';
import { fallo } from './visual.js';

const TONO = { 'En vivo': 'av-st-ok', 'En construcción': 'av-st-borr', Pausada: '' };
const copiar = async (t, msg = 'Copiado') => { try { await navigator.clipboard.writeText(t); toast(msg); } catch { toast('Selecciona el texto y cópialo', true); } };

export async function techUI(el, { b, alive }) {
  const S = { sitios: [], auditorias: [], viva: null, origen: '', puede: {} };
  mount(el, html`<p class="loading">Cargando…</p>`);
  const cargar = async () => Object.assign(S, await api(`tech?profile=${encodeURIComponent(b.slug)}`));
  try { await cargar(); } catch (e) { if (alive()) mount(el, html`${fallo({ titulo: 'No pude abrir Tech', linea: e.message })}`); return; }
  if (!alive()) return;
  const ed = () => Boolean(S.puede.editar), ceo = () => Boolean(S.puede.ceo);
  const feed = () => `${S.origen}/api/publico/${b.slug}/publicado`;

  function sitio(s) {
    return html`<article class="fm-card tc-card"><header><span class="chip sm2">${s.tipo}</span><span class="chip sm2 ${TONO[s.estado] || ''}">${s.estado}</span></header>
      <h3>${s.nombre}</h3>${s.url ? html`<a class="sm tc-url" href="${s.url}" target="_blank" rel="noopener noreferrer">${ico('link', 11)} ${s.url.replace(/^https:\/\//, '')}</a>` : html`<p class="mut sm">Sin link todavía</p>`}
      <p class="mut sm">${s.actualizado ? `Actualizada el ${fdate(s.actualizado)}` : 'Sin fecha de actualización'}${s.fuente ? ` · se alimenta de: ${s.fuente}` : ''}</p>
      ${s.tipo === 'Landing' ? (s.intake?.key ? html`<p class="sm">${ico('check', 11)} Conectada al CRM · fuente «${s.intake.nombre}»</p>` : html`<p class="mut sm">Sin conectar al CRM: los leads de su formulario no entran solos.</p>`) : ''}
      <footer>${s.tipo === 'Landing' && s.intake?.key ? html`<button class="btn xs" data-tc="form" data-id="${s.id}">${ico('copy', 13)} El formulario</button>` : ''}
        ${s.tipo === 'Landing' && !s.intake?.key && ceo() ? html`<button class="btn xs" data-tc="conectar" data-id="${s.id}">${ico('link', 13)} Conectar al CRM</button>` : ''}
        ${s.url ? html`<button class="btn ghost xs" data-tc="auditar" data-url="${s.url}">${ico('search', 13)} Auditar SEO</button>` : ''}
        ${ed() ? html`<button class="btn ghost xs" data-tc="editar" data-id="${s.id}">${ico('edit', 13)} Editar</button>` : ''}</footer></article>`;
  }
  function paint() {
    if (!alive()) return;
    const on = Boolean(S.viva?.on);
    mount(el, html`<div class="fm tc">
      <section><div class="fm-bar"><h2 class="fm-h" style="margin:0">Sitios y herramientas</h2><span class="sp"></span>${ed() ? html`<button class="btn xs" data-tc="nuevo">${ico('plus', 13)} Sitio</button>` : ''}</div>
        ${S.sitios.length ? html`<div class="fm-grid">${S.sitios.map(sitio)}</div>` : html`<p class="mut fm-vacio">Todavía no hay sitios. Agrega su web, cada landing de campaña y las herramientas que le construimos.</p>`}</section>
      <section class="tc-viva ${on ? 'on' : ''}"><div class="row" style="gap:10px;align-items:center"><span class="tc-dot"></span><h2 class="fm-h" style="margin:0">Web viva</h2><span class="chip sm2 ${on ? 'av-st-ok' : ''}">${on ? 'Encendida' : 'Apagada'}</span><span class="sp"></span>
          ${ceo() ? html`<button class="btn ${on ? 'ghost' : ''} xs" data-tc="viva">${on ? 'Apagar' : 'Encender'}</button>` : ''}</div>
        <p class="mut sm">${on ? 'La web de la marca puede leer lo que ya se publicó en sus redes (título, texto, fecha y formato) desde este link, sin sesión:' : 'Encendida, la web de la marca lee del OS lo que ya se publicó en redes, sin que nadie la actualice a mano. Solo se comparte lo publicado; nunca los links internos de Drive ni de Figma.'}</p>
        ${on ? html`<div class="es-cmd"><code>${feed()}</code><button type="button" class="btn ghost xs" data-tc="copiar" data-t="${feed()}">${ico('copy', 13)} Copiar</button></div>` : ''}</section>
      <section><div class="fm-bar"><h2 class="fm-h" style="margin:0">Auditoría de SEO</h2><span class="sp"></span>${ed() ? html`<button class="btn ghost xs" data-tc="auditar">${ico('search', 13)} Pedir auditoría</button><button class="btn xs" data-tc="guardarAud">${ico('plus', 13)} Guardar resultado</button>` : ''}</div>
        ${S.auditorias.length ? html`<div class="tc-auds">${S.auditorias.map((a) => html`<button type="button" class="tc-aud" data-tc="verAud" data-id="${a.id}"><span class="tc-pts ${a.puntaje == null ? '' : a.puntaje >= 80 ? 'ok' : a.puntaje >= 50 ? 'med' : 'bajo'}">${a.puntaje ?? '—'}</span><span><b>${a.url ? a.url.replace(/^https:\/\//, '') : 'Auditoría'}</b><span class="mut sm">${a.fecha ? fdate(a.fecha) : ''}</span></span></button>`)}</div>`
          : html`<p class="mut fm-vacio">Sin auditorías todavía. «Pedir auditoría» abre Claude Code con el pedido (plugin claude-seo); pega aquí lo que conteste.</p>`}</section></div>`);
  }

  async function editar(s0) {
    const s = { nombre: '', tipo: 'Web', url: '', estado: 'En construcción', actualizado: '', fuente: '', notas: '', ...s0 };
    const v = await ask(s.id ? `Editar ${s.nombre}` : `Nuevo sitio de ${b.name}`, [
      { k: 'nombre', l: 'Nombre', v: s.nombre, req: true }, { k: 'tipo', l: 'Tipo', t: 'select', opts: TIPOS_T.map((x) => [x, x]), v: s.tipo, half: true },
      { k: 'estado', l: 'Estado', t: 'select', opts: ESTADOS_T.map((x) => [x, x]), v: s.estado, half: true }, { k: 'url', l: 'Link (https://…)', v: s.url },
      { k: 'actualizado', l: 'Última actualización', t: 'date', v: s.actualizado, half: true }, { k: 'fuente', l: 'De qué datos del OS se alimenta', v: s.fuente, ph: 'Ej. Publicado en redes, casos, ofertas' },
      { k: 'notas', l: 'Notas', t: 'textarea', v: s.notas },
    ], 'Guardar');
    if (!v) return;
    if (v.url && !httpsOk(v.url)) return toast('El link tiene que empezar con https://', true);
    try { const d = s.id ? await api(`tech/${s.id}`, { method: 'PUT', body: { ...v, v: s.v } }) : await api('tech', { method: 'POST', body: { profile: b.slug, ...v } });
      S.sitios = [...S.sitios.filter((x) => x.id !== d.id), d]; toast('Guardado'); paint(); } catch (e) { toast(e.message, true); }
  }
  function formulario(s) {
    const f = formularioLanding(s.intake.key, S.origen, b.name);
    drawer(html`<article class="fm-ed"><span class="lbl">${s.nombre} · conectado al CRM</span><h2 style="margin:4px 0 10px">El formulario de la landing</h2>
      <p class="mut sm">Pégalo en la landing. Cada envío entra solo a Ventas como lead de la fuente «${s.intake.nombre}». El campo escondido atrapa a los bots.</p>
      <pre class="tc-code">${f}</pre><div class="row" style="gap:8px;margin-top:12px"><button class="btn" data-act="copiar">${ico('copy', 14)} Copiar</button><button class="btn ghost" data-act="cerrar">Cerrar</button></div></article>`,
    { copiar: () => copiar(f, 'Formulario copiado'), cerrar: () => closeDrawer() }, { section: 'Tech', title: 'El formulario' });
  }
  async function guardarAuditoria() {
    const v = await ask('Guardar la auditoría de SEO', [
      { k: 'url', l: 'La web auditada (https://…)', v: S.sitios.find((s) => s.url)?.url || '' },
      { k: 'resumen', l: 'Lo que contestó Claude (pégalo completo)', t: 'textarea', req: true },
    ], 'Guardar');
    if (!v) return;
    try { const d = await api('tech', { method: 'POST', body: { profile: b.slug, kind: 'auditoria', url: v.url, resumen: v.resumen, puntaje: puntajeDe(v.resumen) } });
      S.auditorias = [d, ...S.auditorias]; toast(d.puntaje != null ? `Guardada · ${d.puntaje}/100` : 'Guardada'); paint(); } catch (e) { toast(e.message, true); }
  }

  el.onclick = async (e) => {
    const t = e.target.closest('[data-tc]'); if (!t) return;
    const a = t.dataset.tc, s = S.sitios.find((x) => x.id === t.dataset.id);
    if (a === 'nuevo') return editar({});
    if (a === 'editar' && s) return editar(s);
    if (a === 'form' && s) return formulario(s);
    if (a === 'copiar') return copiar(t.dataset.t);
    if (a === 'conectar' && s) {
      if (!(await confirmAsk(`¿Conectar «${s.nombre}» al CRM? Se crea su fuente de leads en Ventas.`))) return;
      try { const d = await api(`tech/${s.id}/conectar`, { method: 'POST', body: {} }); S.sitios = S.sitios.map((x) => (x.id === d.id ? d : x)); paint(); formulario(d); } catch (err) { toast(err.message, true); }
      return;
    }
    if (a === 'viva') {
      const on = !S.viva?.on;
      if (on && !(await confirmAsk(`¿Encender la web viva de ${b.name}? Lo que ya se publicó en sus redes queda disponible sin sesión para su web.`))) return;
      try { S.viva = await api(`tech/viva/${encodeURIComponent(b.slug)}`, { method: 'PUT', body: { on } }); paint(); } catch (err) { toast(err.message, true); }
      return;
    }
    if (a === 'auditar') {
      let url = t.dataset.url;
      if (!url) { const v = await ask('Auditoría de SEO', [{ k: 'url', l: 'La web (https://…)', v: S.sitios.find((x) => x.url)?.url || '', req: true }], 'Abrir Claude Code'); if (!v) return; url = v.url; }
      if (!httpsOk(url)) return toast('El link tiene que empezar con https://', true);
      const cabe = openClaude(promptAuditoria(url, b.name));
      return toast(cabe ? 'Se abrió Claude Code con el pedido. Cuando conteste, toca «Guardar resultado».' : 'El pedido quedó copiado: pégalo en Claude Code.');
    }
    if (a === 'guardarAud') return guardarAuditoria();
    if (a === 'verAud') {
      const d = S.auditorias.find((x) => x.id === t.dataset.id); if (!d) return;
      drawer(html`<article class="es-doc"><span class="lbl">Auditoría de SEO · ${d.fecha ? fdate(d.fecha) : ''}</span><h1>${d.url || b.name}</h1>${d.puntaje != null ? html`<p><b>${d.puntaje}/100</b></p>` : ''}<div class="es-md">${md(d.resumen)}</div></article>`, {}, { section: 'Tech', title: 'Auditoría de SEO' });
    }
  };
  paint();
}
