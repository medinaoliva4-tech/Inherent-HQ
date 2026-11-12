// Agent Area · la vista por etapas (#/ai/agentes/<agente>/trabajos/<run>/etapas): historial y detalle de un trabajo, SOLO LECTURA.
//   Se trabaja en el Chat (PLAN-GATEWAY §20): ahí se llama al agente, se lee el documento y se aprueba. Aquí queda lo que pasó:
//   la línea de etapas · Inputs y evidencia · Actividad del agente · Resultado. Se puede pausar, archivar o restaurar.
import { html, raw, mount, ico, skel, toast, api, md, drawer, closeDrawer, confirmAsk } from './core.js';
import { activa, completo, progreso, leerOutput, CONEXIONES, enServidor } from './agentes-flujos.js';
import { rutaAgente, rutaTrabajo } from './agentes-ui.js';
import { fallo } from './visual.js';

const enc = encodeURIComponent;
const VIA = { gateway: 'Servidor', servidor: 'Servidor', os: 'IA del OS', hermes: 'Hermes (retirado)', puente: 'Claude · suscripción (puente)', 'claude-web': 'claude.ai (pegar)', simulado: 'Simulado' };
const ACC = { crear: 'creó el run', ejecutar: 'ejecutó la etapa', aprobar: 'aprobó', corregir: 'corrigió el resultado', ajuste: 'pidió un ajuste', input: 'agregó un input', 'quitar-input': 'quitó un input', verificar: 'verificó una fuente', desverificar: 'quitó la verificación', 'quitar-fuente': 'quitó una fuente', leer: 'abrió el documento', plan: 'platicó el plan', 'leer-chat': 'leyó la conversación', archivar: 'archivó el run', restaurar: 'restauró el run', pausar: 'pausó el agente', reanudar: 'reanudó el agente', encolar: 'mandó la etapa al servidor', cancelar: 'la sacó de la cola', tomar: 'la tomó', fallo: 'falló en' };
const quien = (e) => String(e || '').split('@')[0];
const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : '');
const cuando = (iso) => (iso ? new Date(iso).toLocaleString('es-GT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const ICO_IN = { texto: 'file-text', link: 'link', archivo: 'file-text' };

export async function pintarRun(el, me, id, alive) {
  mount(el, skel('pagina'));
  let run, sel = null, verMd = false;
  try { ({ run } = await api('agentes/runs/' + enc(id))); }
  catch (e) { if (alive()) mount(el, html`${fallo({ titulo: 'No pude abrir este trabajo', linea: e.message, boton: { texto: 'Volver a Agentes', href: '#/ai/agentes' } })}`); return; }
  if (!alive()) return;

  const pinta = () => {
    const act = activa(run), n = sel ?? act, e = run.etapas[n], sig = run.etapas[act + 1];
    const esActiva = n === act && !run.archivado && !completo(run);
    const o = leerOutput(e.entrega || e.output, e.nombre);
    const evi = (run.evidencia || []).filter((x) => x.etapa === n && !x.quitada);
    const inputs = (run.inputs || []).filter((x) => !x.archivado);
    const pr = progreso(run);
    const srv = esActiva && enServidor(e); // la trabaja el servidor: la actividad llega de la base
    const acts = e.actividades || [];
    const con = (e.herramientas || []).map((h) => CONEXIONES.find((c) => c.id === h)?.nombre || h);

    const paso = (a, i, arr) => {
      const corriendo = srv && esActiva && i === arr.length - 1;
      return html`<li class="ag-tl ${a.aviso ? 't-warn' : corriendo ? 't-run' : 't-ok'}">
        <span class="ag-tl-dot">${a.aviso ? ico('triangle-alert', 11) : corriendo ? ico('loader-circle', 11) : ico('check', 11)}</span>
        <div class="ag-tl-b"><div class="ag-tl-h"><b>${a.titulo}</b><span class="xs mut">${hora(a.at)}</span></div>${a.detalle ? html`<p class="sm mut">${a.detalle}</p>` : ''}
        ${a.pasos?.length ? html`<ul class="ag-sub">${a.pasos.map((p) => html`<li>${ico('search', 11)} ${p}</li>`)}</ul>` : ''}</div></li>`;
    };
    const finalTl = !esActiva ? (e.estado === 'aprobada' ? html`<li class="ag-tl t-ok"><span class="ag-tl-dot">${ico('check', 11)}</span><div class="ag-tl-b"><div class="ag-tl-h"><b>Aprobada</b><span class="xs mut">${hora(e.aprobada_en)}</span></div><p class="sm mut">Por ${quien(e.aprobada_por)}</p></div></li>` : '')
      : srv ? html`<li class="ag-tl t-wait"><span class="ag-tl-dot"></span><div class="ag-tl-b"><b>${e.estado === 'en_cola' ? 'En cola en el servidor' : 'El servidor la está trabajando'}</b><p class="sm mut">${e.modelo || ''}</p></div></li>`
      : e.estado === 'revision' ? html`<li class="ag-tl t-wait"><span class="ag-tl-dot"></span><div class="ag-tl-b"><b>Esperando aprobación</b><p class="sm mut">Se revisa y se aprueba en el Chat.</p></div></li>` : '';

    const filaCampo = (c) => html`<div class="ag-cmp"><div class="ag-cmp-h"><b>${c.campo}</b><span class="chip sm2 ${c.estado === 'evidencia' ? 'ok' : 'warn'}">${c.estado === 'evidencia' ? 'Con evidencia' : 'Hipótesis'}</span></div>
      ${c.valor ? html`<p class="sm">${c.valor}</p>` : ''}${c.items?.length ? html`<ul class="ag-ul">${c.items.map((x) => html`<li>${x}</li>`)}</ul>` : ''}
      ${c.fuentes?.length ? html`<span class="xs mut">Fuentes: ${c.fuentes.join(', ')}</span>` : ''}</div>`;

    mount(el, html`<div class="ag-run-view">
      <header class="ag-head">
        <div class="ag-head-t"><nav class="wfe-crumb ag-crumb"><a href="#/ai/agentes">Agentes</a>${ico('chevron-right', 12)}<a href="${rutaAgente(run.flujo.id)}">${run.flujo.nombre}</a>${ico('chevron-right', 12)}<span>Trabajo</span></nav>
          <h1>${run.titulo}</h1>
          <span class="mut sm">${run.cliente ? run.cliente_nombre || run.cliente : 'Inherent'} · ${run.objetivo || run.flujo.nombre}</span>
          <span class="mut sm xs">${ico('play', 12)} Run: una ejecución concreta del agente, etapa por etapa, con tu aprobación en cada gate.</span></div>
        <div class="ag-head-a"><a class="btn sm" href="${rutaTrabajo(run.flujo.id, run.id)}">${ico('chat', 13)} Abrir en el Chat</a>
          ${run.archivado ? html`<button class="btn ghost sm" data-act="restaurar">Restaurar</button>` : html`<button class="btn sm ${run.pausado ? '' : 'ag-dark'}" data-act="pausa">${ico(run.pausado ? 'play' : 'pause', 13)} ${run.pausado ? 'Reanudar agente' : 'Pausar agente'}</button>
          <button class="btn ghost sm" data-act="mas" aria-label="Más">${ico('more', 14)}</button>`}</div>
      </header>

      <ol class="ag-stepper" aria-label="Etapas">${run.etapas.map((x, i) => html`<li class="${x.estado} ${i === n ? 'sel' : ''} ${i === act && !completo(run) ? 'act' : ''}">
        <button type="button" data-act="ver" data-n="${i}"><span class="ag-dot">${x.estado === 'aprobada' ? ico('check', 12) : String(i + 1)}</span><span class="ag-step-t">${x.nombre}${x.gate ? ' 🚦' : ''}</span></button></li>`)}</ol>
            ${run.pausado ? html`<div class="ag-aviso sm">${ico('pause', 13)} El agente está en pausa: no se ejecuta nada hasta que lo reanudes.</div>` : ''}

      <div class="ag-cols">
        <section class="card ag-col">
          <div class="ag-col-h"><div><h2>Inputs y evidencia</h2><p class="sm mut">Información disponible para el agente.</p></div><span class="ag-count">${inputs.length + evi.length}</span></div>
          ${inputs.map((x) => html`<div class="ag-in"><span class="ag-in-ic ${x.tipo}">${ico(ICO_IN[x.tipo] || 'file-text', 15)}</span>
            <div class="ag-in-b"><b>${x.titulo}</b><span class="xs mut">${x.meta || (x.tipo === 'link' ? x.url.replace(/^https?:\/\//, '').slice(0, 48) : x.texto ? `${x.texto.length.toLocaleString('es-GT')} caracteres` : '')}</span><span class="chip sm2">${x.interna ? 'Fuente interna' : 'Fuente externa'}</span></div>
</div>`)}
          ${evi.length ? html`<div class="ag-k">Fuentes que usó el agente</div>${evi.map((x) => html`<div class="ag-in"><span class="ag-in-ic link">${ico('globe', 15)}</span>
            <div class="ag-in-b"><b>${x.titulo}</b>${x.url ? (/^https?:/.test(x.url) ? html`<a class="xs" href="${x.url}" target="_blank" rel="noreferrer">${x.url.replace(/^https?:\/\//, '').slice(0, 56)}</a>` : html`<code class="xs">${x.url}</code>`) : ''}${x.extracto ? html`<span class="xs mut">${x.extracto}</span>` : ''}
            <span class="xs mut">${x.verificada ? 'Verificada' : 'Sin verificar'}</span></div></div>`)}` : ''}
          ${!inputs.length && !evi.length ? html`<p class="sm mut">Sin inputs todavía. Sin fuentes, todo lo que proponga el agente será hipótesis.</p>` : ''}
        </section>

        <section class="card ag-col">
          <div class="ag-col-h"><div><h2>Actividad del agente</h2><p class="sm mut">${srv && esActiva ? 'En el servidor…' : `Etapa ${n + 1} · ${e.nombre}`}${e.via && !srv ? html` · <span class="chip sm2 ${e.stub ? 'warn' : ''}">${e.stub ? 'STUB · simulado' : `${VIA[e.via] || e.via}${e.modelo ? ` · ${e.modelo}` : ''}`}</span>` : ''}</p></div></div>
          <ol class="ag-tline">${acts.map(paso)}${finalTl}</ol>
          ${!acts.length && !finalTl ? html`<p class="sm mut">Esta etapa se desbloquea cuando se aprueben las anteriores.</p>` : ''}
        </section>

        <section class="card ag-col">
          <div class="ag-col-h"><div><h2>Resultado en trabajo</h2><p class="sm mut">${e.salida ? `Propuesta de ${o.titulo} para revisión.` : `Se entregará: ${o.titulo}.`}</p></div>${e.salida ? html`<button type="button" class="btn ghost xs" data-act="md">${verMd ? 'Ver campos' : 'Ver documento'}</button>` : ''}</div>
          <div class="ag-out">
            <div class="ag-out-h"><b>${o.titulo}</b>${e.salida ? html`<span class="chip sm2 ${e.confianza >= 70 ? 'ok' : e.confianza ? 'warn' : ''}">${ico('chart', 11)} ${e.confianza ? `${e.confianza}% confianza` : 'Sin evidencia'}</span>` : ''}</div>
            ${e.salida ? (verMd || !e.campos?.length ? html`<div class="ag-md">${raw(md(e.salida))}</div>` : e.campos.map(filaCampo))
              : html`${o.campos.map((c) => html`<div class="ag-cmp vacio"><div class="ag-cmp-h"><b>${c}</b></div><p class="xs mut">Pendiente</p></div>`)}${o.campos.length ? '' : html`<p class="sm mut">Sin campos definidos: el agente entregará un documento.</p>`}`}
            ${e.faltantes?.length ? html`<div class="ag-falta"><b class="sm">${ico('triangle-alert', 12)} Falta evidencia</b><ul class="ag-ul">${e.faltantes.map((x) => html`<li>${x}</li>`)}</ul></div>` : ''}
          </div>
        </section>
      </div>

      <footer class="ag-foot">
        <span class="sm">Paso ${Math.min(act + 1, run.etapas.length)} de ${run.etapas.length}</span>
        <span class="ag-prog"><i style="width:${pr.pct}%"></i></span><span class="sm mut">${pr.pct}%</span>
        <span class="ag-foot-sp"></span>
        ${n !== act && !completo(run) && !(n === act - 1 && run.etapas[act].estado === 'pendiente') ? html`<button class="btn ghost sm" data-act="ir">Ir a la etapa activa</button>` : ''}
        ${run.archivado || completo(run) ? html`<span class="chip ${completo(run) ? 'ok' : ''}">${completo(run) ? 'Trabajo completo' : 'Archivado'}</span>` : ''}
      </footer></div>`);
  };

  const guardar = async (ruta, cuerpo, ok) => {
    try { ({ run } = await api(`agentes/runs/${enc(run.id)}/${ruta}`, { method: 'POST', body: cuerpo || {} })); if (ok) toast(ok); }
    catch (e) { toast(e.message, true); if (e.status === 409) ({ run } = await api('agentes/runs/' + enc(run.id))); }
    if (alive()) pinta();
  };

  // Mientras el servidor trabaja una etapa, se relee el trabajo cada 2.5 s (la actividad llega de la base).
  let vigilando = false;
  async function vigilar() {
    if (vigilando) return; vigilando = true;
    try {
      while (alive() && enServidor(run.etapas[activa(run)])) {
        await new Promise((r) => setTimeout(r, 2500));
        if (!alive()) return;
        try { const antes = run.etapas[activa(run)]; ({ run } = await api('agentes/runs/' + enc(run.id))); const n = run.etapas.indexOf(run.etapas.find((x) => x.id === antes.id)); if (n >= 0 && run.etapas[n].estado === 'revision') toast('El servidor terminó la etapa: revísala y aprueba'); else if (n >= 0 && antes.estado !== 'pendiente' && ['pendiente', 'ajuste'].includes(run.etapas[n].estado) && run.etapas[n].actividades?.at(-1)?.aviso) toast(run.etapas[n].actividades.at(-1).detalle || 'Falló en el servidor', true); } catch {}
        if (alive()) pinta();
      }
    } finally { vigilando = false; }
  }

  const mapa = {
    ver: (b) => { sel = Number(b.dataset.n); verMd = false; pinta(); },
    ir: () => { sel = null; pinta(); },
    md: () => { verMd = !verMd; pinta(); },
    pausa: async () => { await guardar('pausa', { pausado: !run.pausado }, run.pausado ? 'Agente reanudado' : 'Agente en pausa'); },
    mas: () => drawer(html`<div class="ag-rev"><h1>Trabajo</h1><p class="sm mut">Creado por ${quien(run.creado_por)} · workflow «${run.flujo.nombre}»</p>
        <div class="ag-rev-a"><a class="btn ghost" href="${rutaAgente(run.flujo.id, 'workflow')}" data-act="close">${ico('pencil', 14)} Ver el workflow del agente</a><button class="btn ghost" data-act="archivar">Archivar trabajo</button></div>
        <h2 class="sm">Historial</h2><ol class="ag-hist">${[...(run.historial || [])].reverse().slice(0, 80).map((h) => html`<li><b>${quien(h.quien)}</b> ${ACC[h.accion] || h.accion}${h.etapa != null && run.etapas[h.etapa] ? html` <span class="mut">· ${run.etapas[h.etapa].nombre}</span>` : ''}<span class="mut xs">${cuando(h.at)}</span>${h.nota ? html`<span class="ag-nota xs">${h.nota}</span>` : ''}</li>`)}</ol></div>`,
      { archivar: async () => { if (!(await confirmAsk('¿Archivar este trabajo? Nada se borra.'))) return; closeDrawer(); await guardar('archivar', { archivado: true }, 'Trabajo archivado'); } }, { title: 'Trabajo' }),
    restaurar: () => guardar('archivar', { archivado: false }, 'Trabajo restaurado'),
  };
  el.addEventListener('click', (ev) => { const t = ev.target.closest('[data-act]'); if (t && el.contains(t)) mapa[t.dataset.act]?.(t, ev); });
  pinta();
  if (enServidor(run.etapas[activa(run)])) vigilar();
}
