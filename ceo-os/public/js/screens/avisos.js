// Avisos (#/avisos): lo que pide atención, en tres grupos: Tu trabajo · Clientes · La plataforma. Cada aviso dice qué
// pasa y trae un solo botón para resolverlo. Lo del servidor llega ya filtrado con lo que esta persona ve; lo de su compu
// (Hermes, el puente) lo revisa el navegador. Posponer: mañana o en una semana (uno urgente, solo un día; algunos, nunca).
import { html, mount, api, toast, ico, skel } from '../core.js';
import { GRUPOS, ordenar, masDias, hoyGT } from '../avisos-reglas/base.js';
import { leerAvisos, cuentaDe, pintarCampana, avisar } from '../avisos-ui.js';
import { olvidarCompu } from '../avisos-compu.js';
import { abrirEnChat } from '../areas.js';
import { updateWaits } from '../ventas-flujo.js';

export const esqueleto = () => skel('pagina');
const URG = { alta: 'Urgente', media: 'Pronto', baja: 'Cuando puedas' };

export async function render(el, { me, alive }) {
  let x = await leerAvisos(me, { fresco: true, compu: true });
  if (!alive()) return;
  let verPos = false;
  const todos = () => ordenar([...(x.r?.items || []), ...(x.compu || [])]);
  const boton = (a, cls, k) => {
    if (!a) return '';
    // Un link de afuera (la app de Mac en GitHub, Google) abre en otra pestaña: el OS no se va.
    if (a.href) return /^https?:/.test(a.href) ? html`<a class="btn sm ${cls}" href="${a.href}" target="_blank" rel="noopener">${a.label}</a>` : html`<a class="btn sm ${cls}" href="${a.href}">${a.label}</a>`;
    return html`<button type="button" class="btn sm ${cls}" data-av="${k}">${a.label}</button>`;
  };
  const fila = (v) => html`<article class="avi" data-u="${v.urgencia}" data-clave="${v.clave}">
    <span class="avi-dot" title="${URG[v.urgencia]}"></span>
    <div class="avi-t"><b>${v.titulo}${v.vivo?.desde ? html` <span class="avi-reloj" data-wait="${v.vivo.desde}"></span>` : ''}</b>${v.detalle ? html`<small>${v.detalle}</small>` : ''}${v.cliente ? html`<span class="avi-cli">${v.clienteNombre || v.cliente}</span>` : ''}</div>
    <div class="avi-ops">${boton(v.accion, '', 'a')}${boton(v.accion2, 'ghost', 'b')}${v.fijo ? '' : html`<button type="button" class="btn ghost sm avi-pos" data-av="pos" aria-haspopup="menu" title="Posponer">${ico('clock', 14)}<span>Después</span></button>`}</div></article>`;
  const pintar = () => {
    const xs = todos(), n = cuentaDe(x), pos = x.r?.pospuestos || [];
    pintarCampana(n);
    mount(el, html`<div class="avs">
      <header class="avs-h"><div><h1>Avisos</h1><p>${n ? html`<b>${n}</b> ${n === 1 ? 'pide' : 'piden'} atención.` : 'Nada urgente por ahora.'} Lo que falta en tu trabajo, en cada cliente y en la plataforma.</p></div>
        <button type="button" class="btn ghost sm" data-av="revisar">${ico('redo', 14)} Revisar otra vez</button></header>
      ${x.r?.error ? html`<div class="avi-err">${ico('alert', 14)} No pude leer los avisos del servidor: ${x.r.error}</div>` : ''}
      ${GRUPOS.map(([g, nombre]) => { const ys = xs.filter((v) => v.grupo === g); return html`<section class="avs-g" data-g="${g}"><h2>${nombre}${ys.length ? html` <span class="avs-n">${ys.length}</span>` : ''}</h2>
        ${ys.length ? html`<div class="avs-l">${ys.map(fila)}</div>` : html`<p class="avs-vacio">${ico('check', 14)} ${g === 'trabajo' ? 'Tu trabajo está al día.' : g === 'clientes' ? 'Ningún cliente tiene algo pendiente que veas tú.' : 'Todo conectado.'}</p>`}</section>`; })}
      ${pos.length ? html`<section class="avs-g avs-p"><button type="button" class="avs-pt" data-av="ver-pos" aria-expanded="${verPos}">${ico(verPos ? 'down' : 'right', 14)} Pospuestos <span class="avs-n">${pos.length}</span></button>
        ${verPos ? html`<div class="avs-l">${pos.map((v) => html`<article class="avi" data-u="${v.urgencia}" data-clave="${v.clave}"><span class="avi-dot"></span><div class="avi-t"><b>${v.titulo}</b></div><div class="avi-ops"><button type="button" class="btn ghost sm" data-av="volver">Regresar</button></div></article>`)}</div>` : ''}</section>` : ''}
      ${x.r?.errores?.length ? html`<details class="avi-err"><summary>${x.r.errores.length} reglas fallaron (solo lo ves tú)</summary><ul>${x.r.errores.map((e) => html`<li><code>${e}</code></li>`)}</ul></details>` : ''}
    </div>`);
  };
  pintar();
  // El reloj de lo que espera (un lead sin responder) corre en vivo mientras la pantalla está abierta.
  const reloj = setInterval(() => { if (!el.isConnected) return clearInterval(reloj); updateWaits(el.querySelectorAll('[data-wait]')); }, 1000);
  updateWaits(el.querySelectorAll('[data-wait]'));

  const recargar = async () => { olvidarCompu(); x = await leerAvisos(me, { fresco: true, compu: true }); if (alive()) { pintar(); updateWaits(el.querySelectorAll('[data-wait]')); } avisar(); };
  const hacer = async (a) => {
    if (a.copiar) { try { await navigator.clipboard.writeText(a.copiar); toast('Copiado: pégalo en la Terminal'); } catch { toast(a.copiar); } return; }
    if (a.chat) return abrirEnChat(me.email, a.chat);
    if (a.api) { try { await api(a.api.ruta, { method: a.api.method || 'POST', body: a.api.body }); toast(a.hecho || 'Listo'); } catch (e) { toast(e.message, true); } return recargar(); }
    if (a.abre === 'revisar') return recargar();
    if (a.abre === 'primer-dia') { const { abrirPrimerDia } = await import('../primer-dia.js'); return abrirPrimerDia(me); }
    if (a.abre === 'conectar') { const { openConnect } = await import('../connectai.js'); return openConnect(me, recargar); }
    if (a.abre === 'tarea') {
      const { openDelivery } = await import('../taskcard.js'); const t = await api('db/tasks/' + encodeURIComponent(a.id)).catch(() => null);
      if (!t) return toast('No encontré esa tarea', true);
      const [projects, team] = await Promise.all([api('db/projects').then((r) => r.items).catch(() => []), api('db/team').then((r) => r.items).catch(() => [])]);
      // Quien revisa sale de la misma cadena que Mis tareas (el responsable, si no su jefe directo, si no el CEO).
      const { cadenaDe } = await import('../tareas-cadena.js');
      return openDelivery(t, { me, projects, team, canApprove: cadenaDe(team, me.email).accOf(t) === me.email }, recargar);
    }
    if (a.abre === 'comprobante') { const { openProof } = await import('../flowui.js'); return openProof(a.id); }
    if (a.abre === 'agendar') {
      const { schedule } = await import('../meetings.js');
      const [p, team] = await Promise.all([api('db/projects/' + encodeURIComponent(a.proyecto)).catch(() => null), api('db/team').then((r) => r.items).catch(() => [])]);
      if (!p?.meetings?.[a.i]) return toast('No encontré esa reunión', true);
      await schedule(p, a.i, team, me); return recargar();
    }
    // El chat de Diseño gráfico en una etapa y un mes (diseno-chat.js lee os.dg.etapa al abrir la marca).
    if (a.abre === 'diseno') { try { localStorage.setItem('os.dg.etapa', JSON.stringify({ slug: a.slug, etapa: a.etapa, mes: a.mes })); } catch {} location.hash = '#/marcas/diseno/' + encodeURIComponent(a.slug); return; }
    // El calendario de la marca con un solo filtro prendido (content.js lee os.cal.marca.off).
    if (a.abre === 'calendario') { try { localStorage.setItem('os.cal.marca.off', JSON.stringify(['operativo', 'planificacion', 'programado'].filter((k) => k !== a.filtro))); } catch {} location.hash = '#/marcas/' + encodeURIComponent(a.slug) + '/calendario'; return; }
    if (a.abre === 'actualizar-app') { window.inherentEscritorio?.actualizar?.(); toast('Buscando la versión nueva de la app…'); return; }
    if (a.abre === 'guia') { const { cargarGuias, abrirGuia } = await import('../guia.js'); const G = await cargarGuias(); const d = (G?.items || []).find((y) => y.id === a.id); return d ? abrirGuia(d, me) : toast('Ese video ya no está', true); }
    if (a.abre === 'pago') { const { payDialog } = await import('../flowui.js'); await payDialog(a.datos || {}); return recargar(); }
    if (a.abre === 'confirmar-pago') { const { confirmarYArrancar } = await import('../flowui.js'); const q = await api('db/quotes/' + encodeURIComponent(a.id)).catch(() => null); if (q) await confirmarYArrancar(q); return recargar(); }
  };
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-av]'); if (!b) return;
    const k = b.dataset.av, card = b.closest('[data-clave]'), v = card && [...todos(), ...(x.r?.pospuestos || [])].find((y) => y.clave === card.dataset.clave);
    if (k === 'revisar') return recargar();
    if (k === 'ver-pos') { verPos = !verPos; return pintar(); }
    if (!v) return;
    if (k === 'a' || k === 'b') return hacer(k === 'a' ? v.accion : v.accion2);
    if (k === 'volver') { await api('avisos', { method: 'POST', body: { clave: v.clave, volver: true } }).catch((er) => toast(er.message, true)); return recargar(); }
    if (k === 'pos') {
      document.querySelector('.avi-menu')?.remove();
      const hoy = hoyGT(), m = document.createElement('div'); m.className = 'avi-menu'; m.setAttribute('role', 'menu');
      const ops = v.urgencia === 'alta' ? [['Mañana', masDias(hoy, 1)]] : [['Mañana', masDias(hoy, 1)], ['En una semana', masDias(hoy, 7)]];
      mount(m, html`${ops.map(([l, d]) => html`<button type="button" role="menuitem" data-d="${d}">${l}</button>`)}`);
      const r = b.getBoundingClientRect(); m.style.top = r.bottom + 4 + 'px'; m.style.right = document.documentElement.clientWidth - r.right + 'px';
      document.body.append(m);
      m.onclick = async (ev) => {
        const d = ev.target.closest('[data-d]')?.dataset.d; if (!d) return; m.remove();
        const deCompu = x.compu.some((y) => y.clave === v.clave);
        try { await api('avisos', { method: 'POST', body: { clave: v.clave, hasta: d, huella: v.huella, ...(deCompu ? { compu: { urgencia: v.urgencia, huella: v.huella } } : {}) } }); toast('Lo vuelves a ver ' + (d === masDias(hoy, 1) ? 'mañana' : 'en una semana')); } catch (er) { toast(er.message, true); }
        recargar();
      };
      setTimeout(() => document.addEventListener('click', function fuera(ev) { if (!m.contains(ev.target)) { m.remove(); document.removeEventListener('click', fuera); } }), 0);
    }
  });
}
