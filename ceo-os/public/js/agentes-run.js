// Agent Area · un run por etapas (#/ai/agentes/<run>), como el concepto de AGENTS IN OS.pdf:
//   arriba: el agente, el título, el cliente y «Pausar agente»; la línea de etapas numeradas.
//   tres columnas: Inputs y evidencia (lo que el equipo le da + las fuentes que usó) · Actividad del agente (en tiempo real,
//   con los pasos de Hermes mientras trabaja) · Resultado en trabajo (los campos de la entrega, cada uno Hipótesis o
//   Con evidencia, con su confianza).
//   abajo: «Paso N de M», el avance y la acción que toca (Ejecutar · Revisar y aprobar · Continuar a la siguiente).
// La IA es la de la persona (Hermes con el modelo y los MCPs que tenga, el puente o claude.ai) o el simulado (STUB).
import { html, raw, mount, ico, skel, toast, api, ask, md, esc, drawer, closeDrawer, uploadToDrive } from './core.js';
import { ESTADOS, activa, completo, progreso, puede, pedido, leerRespuesta, simular, leerOutput, CONEXIONES } from './agentes-flujos.js';
import { correrPedido, caminoIA } from './ia-herramienta.js';
import { hermesDe, modelosHermes, nombreProveedor, esLocal } from './hermes.js';
import { motorDe, nombreMotor } from './motor-ui.js';
import { correrOS } from './ia-os.js';
import { proveedorDe, iaDeUso } from './ia-proveedores.js';
import { rutaAgente } from './agentes-ui.js';

const enc = encodeURIComponent;
const VIA = { os: 'IA del OS', hermes: 'Hermes (tu compu)', puente: 'Claude · suscripción (puente)', 'claude-web': 'claude.ai (pegar)', simulado: 'Simulado' };
const ACC = { crear: 'creó el run', ejecutar: 'ejecutó la etapa', aprobar: 'aprobó', corregir: 'corrigió el resultado', ajuste: 'pidió un ajuste', input: 'agregó un input', 'quitar-input': 'quitó un input', verificar: 'verificó una fuente', desverificar: 'quitó la verificación', archivar: 'archivó el run', restaurar: 'restauró el run', pausar: 'pausó el agente', reanudar: 'reanudó el agente' };
const quien = (e) => String(e || '').split('@')[0];
const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : '');
const cuando = (iso) => (iso ? new Date(iso).toLocaleString('es-GT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const prefRunner = (me) => `os.agentes.runner.${me.email}`;
const TEXTO = /\.(txt|md|markdown|csv|json|tsv|html?)$/i;
const ICO_IN = { texto: 'file-text', link: 'link', archivo: 'file-text' };

export async function pintarRun(el, me, id, alive) {
  mount(el, skel('pagina'));
  let run, rol, sel = null, ocupado = false, vivo = [], verMd = false, ctrl = null;
  try { ({ run, rol } = await api('agentes/runs/' + enc(id))); }
  catch (e) { if (alive()) mount(el, html`<div class="empty card">${e.message}<a class="btn ghost sm" href="#/ai/agentes">Volver</a></div>`); return; }
  if (!alive()) return;

  // Con qué corre. Primero la IA del OS (Ajustes → IA: la del agente o la «IA para Agents»), después las demás conectadas,
  // y las de la compu de la persona (Hermes con sus modelos y MCPs, el puente de Claude, claude.ai a mano), y el simulado.
  const [ia, camino] = await Promise.all([api('ia/estado').catch(() => null), caminoIA(me).catch(() => 'claude-web')]);
  const modelos = hermesDe(me) ? await modelosHermes(me).catch(() => null) : null;
  const delChat = motorDe(me);
  const porDefecto = run.flujo?.ia?.proveedor ? run.flujo.ia : iaDeUso(ia, 'agents');
  const conectados = (ia?.proveedores || []).filter((p) => p.conectado);
  const opciones = [
    ...(porDefecto?.proveedor ? [['os', `IA del OS · ${proveedorDe(porDefecto.proveedor)?.nombre || porDefecto.proveedor}${porDefecto.modelo ? ` · ${porDefecto.modelo}` : ''}`]] : []),
    ...conectados.map((p) => [`IA del OS · ${proveedorDe(p.id)?.nombre || p.id}`, (p.modelos || []).slice(0, 60).map((m) => [`os|${p.id}|${m}`, m])]),
    ...((modelos?.proveedores || []).filter((p) => p.listo && p.modelos.length).map((p) => [`Hermes · ${nombreProveedor(p.slug)}${esLocal(p.slug) ? ' · en tu compu' : p.slug === 'custom' ? ' · endpoint propio' : ''}`, p.modelos.slice(0, 40).map((m) => [`hermes|${p.slug}|${m}`, m])])),
    ...(camino === 'hermes' ? [['hermes', `Hermes · ${delChat.motor === 'hermes' ? nombreMotor(delChat) : 'modelo del Chat'}`]] : []),
    ['puente', VIA.puente], ['claude-web', VIA['claude-web']], ['simulado', 'Simulado (stub, sin IA)'],
  ];
  const valores = opciones.flatMap((o) => (Array.isArray(o[1]) ? o[1].map((x) => x[0]) : [o[0]]));
  let runner = localStorage.getItem(prefRunner(me)) || (porDefecto?.proveedor ? 'os' : camino === 'hermes' ? 'hermes' : 'simulado');
  if (!valores.includes(runner)) runner = valores[0];
  const sinIA = !conectados.length && camino !== 'hermes';

  const selector = () => html`<label class="ag-runner"><span class="xs mut">Con qué corre</span><select class="in sm" data-ch="runner">${opciones.map(([k, v]) => (Array.isArray(v)
    ? html`<optgroup label="${k}">${v.map(([val, t]) => html`<option value="${val}" ${runner === val ? raw('selected') : ''}>${t}</option>`)}</optgroup>`
    : html`<option value="${k}" ${runner === k ? raw('selected') : ''}>${v}</option>`))}</select></label>`;

  const pinta = () => {
    const act = activa(run), n = sel ?? act, e = run.etapas[n], sig = run.etapas[act + 1];
    const esActiva = n === act && !run.archivado && !completo(run);
    const o = leerOutput(e.entrega || e.output, e.nombre);
    const evi = (run.evidencia || []).filter((x) => x.etapa === n);
    const inputs = (run.inputs || []).filter((x) => !x.archivado);
    const pr = progreso(run);
    const no = (a) => puede(run, n, a, { rol });
    const acts = ocupado && esActiva ? vivo : (e.actividades || []);
    const con = (e.herramientas || []).map((h) => CONEXIONES.find((c) => c.id === h)?.nombre || h);

    const paso = (a, i, arr) => {
      const corriendo = ocupado && esActiva && i === arr.length - 1;
      return html`<li class="ag-tl ${a.aviso ? 't-warn' : corriendo ? 't-run' : 't-ok'}">
        <span class="ag-tl-dot">${a.aviso ? ico('triangle-alert', 11) : corriendo ? ico('loader-circle', 11) : ico('check', 11)}</span>
        <div class="ag-tl-b"><div class="ag-tl-h"><b>${a.titulo}</b><span class="xs mut">${hora(a.at)}</span></div>${a.detalle ? html`<p class="sm mut">${a.detalle}</p>` : ''}
        ${a.pasos?.length ? html`<ul class="ag-sub">${a.pasos.map((p) => html`<li>${ico('search', 11)} ${p}</li>`)}</ul>` : ''}</div></li>`;
    };
    const finalTl = !esActiva ? (e.estado === 'aprobada' ? html`<li class="ag-tl t-ok"><span class="ag-tl-dot">${ico('check', 11)}</span><div class="ag-tl-b"><div class="ag-tl-h"><b>Aprobada</b><span class="xs mut">${hora(e.aprobada_en)}</span></div><p class="sm mut">Por ${quien(e.aprobada_por)}</p></div></li>` : '')
      : ocupado ? '' : e.estado === 'revision' ? html`<li class="ag-tl t-wait"><span class="ag-tl-dot"></span><div class="ag-tl-b ag-tl-cta"><div><b>Esperando aprobación</b><p class="sm mut">${e.gate ? `🚦 ${e.nota_gate || 'Gate del CEO'}` : sig ? `Finaliza ${o.titulo} y sigue con ${sig.nombre}.` : 'Es la última etapa.'}</p></div><button class="btn sm ag-cta" data-act="revisar">${ico('file-text', 13)} Revisar y aprobar</button></div></li>`
      : html`<li class="ag-tl t-wait"><span class="ag-tl-dot"></span><div class="ag-tl-b ag-tl-cta"><div><b>${e.estado === 'ajuste' ? 'Ajuste pedido' : 'Lista para ejecutar'}</b><p class="sm mut">${e.estado === 'ajuste' ? `«${e.ajuste}»` : con.length ? `Investigará con: ${con.join(', ')}` : 'Trabajará con los inputs y lo aprobado.'}</p></div><button class="btn sm" data-act="ejecutar" ${run.pausado ? raw('disabled title="El agente está en pausa"') : ''}>${ico(e.estado === 'ajuste' ? 'rotate-cw' : 'play', 13)} ${e.estado === 'ajuste' ? 'Re-ejecutar' : 'Ejecutar etapa'}</button></div></li>`;

    const filaCampo = (c) => html`<div class="ag-cmp"><div class="ag-cmp-h"><b>${c.campo}</b><span class="chip sm2 ${c.estado === 'evidencia' ? 'ok' : 'warn'}">${c.estado === 'evidencia' ? 'Con evidencia' : 'Hipótesis'}</span></div>
      ${c.valor ? html`<p class="sm">${c.valor}</p>` : ''}${c.items?.length ? html`<ul class="ag-ul">${c.items.map((x) => html`<li>${x}</li>`)}</ul>` : ''}
      ${c.fuentes?.length ? html`<span class="xs mut">Fuentes: ${c.fuentes.join(', ')}</span>` : ''}</div>`;

    mount(el, html`<div class="ag-run-view">
      <header class="ag-head">
        <div class="ag-head-t"><nav class="wfe-crumb ag-crumb"><a href="#/ai/agentes">Agentes</a>${ico('chevron-right', 12)}<a href="${rutaAgente(run.flujo.id)}">${run.flujo.nombre}</a>${ico('chevron-right', 12)}<span>Trabajo</span></nav>
          <h1>${run.titulo}</h1>
          <span class="mut sm">${run.cliente ? run.cliente_nombre || run.cliente : 'Inherent'} · ${run.objetivo || run.flujo.nombre}</span>
          <span class="mut sm xs">${ico('play', 12)} Run: una ejecución concreta del agente, etapa por etapa, con tu aprobación en cada gate.</span></div>
        <div class="ag-head-a">${selector()}
          ${run.archivado ? html`<button class="btn ghost sm" data-act="restaurar">Restaurar</button>` : html`<button class="btn sm ${run.pausado ? '' : 'ag-dark'}" data-act="pausa">${ico(run.pausado ? 'play' : 'pause', 13)} ${run.pausado ? 'Reanudar agente' : 'Pausar agente'}</button>
          <button class="btn ghost sm" data-act="mas" aria-label="Más">${ico('more', 14)}</button>`}</div>
      </header>

      <ol class="ag-stepper" aria-label="Etapas">${run.etapas.map((x, i) => html`<li class="${x.estado} ${i === n ? 'sel' : ''} ${i === act && !completo(run) ? 'act' : ''}">
        <button type="button" data-act="ver" data-n="${i}"><span class="ag-dot">${x.estado === 'aprobada' ? ico('check', 12) : String(i + 1)}</span><span class="ag-step-t">${x.nombre}${x.gate ? ' 🚦' : ''}</span></button></li>`)}</ol>
      ${sinIA ? html`<a class="ag-aviso ag-aviso-ia sm" href="#/ajustes/ia">${ico('sparkles', 13)} Todavía no hay una IA conectada: conéctala en Ajustes → IA en un minuto (por ahora corre en Simulado).</a>` : ''}
      ${run.pausado ? html`<div class="ag-aviso sm">${ico('pause', 13)} El agente está en pausa: no se ejecuta nada hasta que lo reanudes.</div>` : ''}

      <div class="ag-cols">
        <section class="card ag-col">
          <div class="ag-col-h"><div><h2>Inputs y evidencia</h2><p class="sm mut">Información disponible para el agente.</p></div><span class="ag-count">${inputs.length + evi.length}</span></div>
          ${run.archivado ? '' : html`<button type="button" class="ag-add" data-act="input">${ico('plus', 16)}<span><b>Añadir archivos o pegar contenido</b><span class="xs mut">Texto, enlaces o archivos</span></span></button>`}
          ${inputs.map((x) => html`<div class="ag-in"><span class="ag-in-ic ${x.tipo}">${ico(ICO_IN[x.tipo] || 'file-text', 15)}</span>
            <div class="ag-in-b"><b>${x.titulo}</b><span class="xs mut">${x.meta || (x.tipo === 'link' ? x.url.replace(/^https?:\/\//, '').slice(0, 48) : x.texto ? `${x.texto.length.toLocaleString('es-GT')} caracteres` : '')}</span><span class="chip sm2">${x.interna ? 'Fuente interna' : 'Fuente externa'}</span></div>
            ${run.archivado ? '' : html`<button type="button" class="ag-x" data-act="quitar-input" data-id="${x.id}" aria-label="Quitar">${ico('x', 12)}</button>`}</div>`)}
          ${evi.length ? html`<div class="ag-k">Fuentes que usó el agente</div>${evi.map((x) => html`<div class="ag-in"><span class="ag-in-ic link">${ico('globe', 15)}</span>
            <div class="ag-in-b"><b>${x.titulo}</b>${x.url ? (/^https?:/.test(x.url) ? html`<a class="xs" href="${x.url}" target="_blank" rel="noreferrer">${x.url.replace(/^https?:\/\//, '').slice(0, 56)}</a>` : html`<code class="xs">${x.url}</code>`) : ''}${x.extracto ? html`<span class="xs mut">${x.extracto}</span>` : ''}
            <label class="xs mut"><input type="checkbox" data-ch="verif" data-id="${x.id}" ${x.verificada ? raw('checked') : ''} ${run.archivado ? raw('disabled') : ''}> ${x.verificada ? 'Verificada' : 'Sin verificar · márcala si la revisaste'}</label></div></div>`)}` : ''}
          ${!inputs.length && !evi.length ? html`<p class="sm mut">Sin inputs todavía. Sin fuentes, todo lo que proponga el agente será hipótesis.</p>` : ''}
        </section>

        <section class="card ag-col">
          <div class="ag-col-h"><div><h2>Actividad del agente</h2><p class="sm mut">${ocupado && esActiva ? 'Trabajando ahora…' : `Etapa ${n + 1} · ${e.nombre}`}${e.via && !(ocupado && esActiva) ? html` · <span class="chip sm2 ${e.stub ? 'warn' : ''}">${e.stub ? 'STUB · simulado' : `${VIA[e.via] || e.via}${e.modelo ? ` · ${e.modelo}` : ''}`}</span>` : ''}</p></div></div>
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
        ${run.archivado || completo(run) ? html`<span class="chip ${completo(run) ? 'ok' : ''}">${completo(run) ? 'Trabajo completo' : 'Archivado'}</span>`
          : run.etapas[act].estado === 'revision' ? html`<button class="btn ag-dark" data-act="revisar">Revisar y aprobar ${ico('arrow-right', 14)}</button>`
          : act > 0 && run.etapas[act - 1].estado === 'aprobada' && run.etapas[act].estado === 'pendiente' ? html`<button class="btn ag-dark" data-act="continuar" ${ocupado || run.pausado ? raw('disabled') : ''}>Continuar a ${run.etapas[act].nombre} ${ico('arrow-right', 14)}</button>`
          : html`<button class="btn ag-dark" data-act="ejecutar" ${ocupado || run.pausado ? raw('disabled') : ''}>${ocupado ? 'Trabajando…' : run.etapas[act].estado === 'ajuste' ? 'Re-ejecutar con el ajuste' : `Ejecutar ${run.etapas[act].nombre}`} ${ico('arrow-right', 14)}</button>`}
      </footer></div>`);
  };

  const guardar = async (ruta, cuerpo, ok) => {
    try { ({ run } = await api(`agentes/runs/${enc(run.id)}/${ruta}`, { method: 'POST', body: cuerpo || {} })); if (ok) toast(ok); }
    catch (e) { toast(e.message, true); if (e.status === 409) ({ run } = await api('agentes/runs/' + enc(run.id))); }
    if (alive()) pinta();
  };

  async function ejecutar() {
    const n = activa(run); sel = null;
    ocupado = true; vivo = [{ titulo: 'Preparando la etapa', detalle: `${run.etapas[n].nombre} · ${VIA[runner.split('|')[0]] || 'tu IA'}`, at: new Date().toISOString() }]; pinta();
    let res;
    try {
      if (runner === 'simulado') {
        res = { ...simular(run, n), via: 'simulado', modelo: '' };
        // El simulado también se ve «en vivo»: una línea a la vez.
        const t0 = Date.now();
        for (const [k, a] of res.actividades.entries()) { await new Promise((r) => setTimeout(r, 350)); if (!alive()) return; vivo = [...vivo, { ...a, at: new Date(t0 + k * 350).toISOString() }]; pinta(); }
        res.actividades = vivo.slice(1);
      } else {
        const [tipo, provider, ...m] = runner.split('|');
        ctrl = new AbortController();
        if (tipo === 'os') {
          // La IA del OS. Si la etapa investiga en la web y hay una «IA para investigar», primero trae fuentes citadas.
          const e = run.etapas[n], elegido = provider ? { proveedor: provider, modelo: m.join('|') } : e.ia?.proveedor ? e.ia : porDefecto || {};
          let previo = '', citas = [];
          if ((e.herramientas || []).includes('web') && iaDeUso(ia, 'investigacion')) {
            const inv = iaDeUso(ia, 'investigacion'), paso = { titulo: 'Investigando en la web', detalle: `${proveedorDe(inv.proveedor)?.nombre || inv.proveedor} · ${inv.modelo}`, pasos: [], at: new Date().toISOString() };
            vivo = [...vivo, paso]; pinta();
            const r1 = await correrOS({ uso: 'investigacion', mensaje: `Investiga con fuentes reales y cítalas, para: ${e.nombre}. ${e.proposito || ''}\nObjetivo del trabajo: ${run.objetivo || run.titulo}${run.cliente ? `\nCliente: ${run.cliente_nombre || run.cliente}` : ''}\nResponde con hallazgos breves, cada uno con su fuente (URL).`, signal: ctrl.signal });
            citas = r1.citas; paso.pasos = citas.slice(0, 8).map((c) => c.titulo); paso.detalle += ` · ${citas.length} fuentes`;
            previo = `\n\nINVESTIGACIÓN WEB (fuentes reales; úsalas como evidencia con estos ids):\n${citas.map((c, k) => `[w${k + 1}] ${c.titulo} — ${c.url}`).join('\n')}\n\n${r1.texto.slice(0, 12000)}`;
            if (alive()) pinta();
          }
          vivo = [...vivo, { titulo: 'Trabajando la etapa', detalle: `${proveedorDe(elegido.proveedor)?.nombre || 'IA del OS'}${elegido.modelo ? ` · ${elegido.modelo}` : ''}`, at: new Date().toISOString() }]; pinta();
          // Los conectores MCP que pide la etapa (Notion, Canva, Figma…) y que quien corre tiene conectados: la IA los usa desde el servidor.
          const mcps = (e.herramientas || []).filter((h) => !['web', 'inherent', 'drive', 'browser'].includes(h));
          let usando = null;
          const out = await correrOS({ uso: 'agents', ...elegido, mensaje: pedido(run, n) + previo, conectores: mcps, signal: ctrl.signal,
            onPaso: (p) => { if (!usando) { usando = { titulo: 'Usando sus conexiones', detalle: 'MCPs conectados', pasos: [], at: new Date().toISOString() }; vivo = [...vivo, usando]; } usando.pasos = [...usando.pasos, p].slice(-12); if (alive()) pinta(); } });
          const r = leerRespuesta(out.texto), t = new Date().toISOString();
          const evidencia = [...r.evidencia, ...citas.map((c, k) => ({ id: `w${k + 1}`, titulo: c.titulo, url: c.url, extracto: c.extracto || '', verificada: false })).filter((c) => !r.evidencia.some((x) => x.id === c.id))];
          res = { ...r, evidencia, actividades: [...vivo.filter((a) => a.pasos?.length), ...r.actividades.map((a) => ({ ...a, at: t })), ...r.faltantes.map((f) => ({ titulo: 'Falta evidencia', detalle: f, aviso: true, at: t }))], via: 'os', modelo: out.modelo };
        } else {
        const elegido = tipo === 'hermes' && provider ? { preferir: 'hermes', modelo: { provider, model: m.join('|') } } : ['hermes', 'puente', 'claude-web'].includes(runner) ? { preferir: runner } : {};
        let ultimo = null;
        const out = await correrPedido(me, {
          modo: 'estrategia', slug: run.cliente, nombre: `${run.flujo.nombre} · ${run.etapas[n].nombre}`, mensaje: pedido(run, n), signal: ctrl.signal, ...elegido,
          // Los pasos reales de Hermes (buscar en la web, leer una página, un MCP…) entran a la actividad mientras trabaja.
          onTool: (nombre) => { const at = new Date().toISOString(); if (ultimo && ultimo.titulo === 'Usando sus conexiones') { ultimo.pasos = [...(ultimo.pasos || []), nombre].slice(-12); } else { ultimo = { titulo: 'Usando sus conexiones', detalle: 'Herramientas y MCPs de Hermes', pasos: [nombre], at }; vivo = [...vivo, ultimo]; } if (alive()) pinta(); },
          onDelta: () => { if (vivo.at(-1)?.titulo !== 'Redactando el resultado') { vivo = [...vivo, { titulo: 'Redactando el resultado', detalle: '', at: new Date().toISOString() }]; if (alive()) pinta(); } },
        });
        const r = leerRespuesta(out.texto), t = new Date().toISOString();
        res = { ...r, actividades: [...vivo.filter((a) => a.pasos?.length), ...r.actividades.map((a) => ({ ...a, at: t })), ...r.faltantes.map((f) => ({ titulo: 'Falta evidencia', detalle: f, aviso: true, at: t }))], via: out.via, modelo: out.modelo };
        }
      }
    } catch (err) {
      ocupado = false; ctrl = null;
      if (err.name !== 'AbortError') toast(`${err.message}. Puedes probar con otro modelo o en Simulado.`, true);
      if (alive()) pinta(); return;
    }
    ocupado = false; ctrl = null;
    await guardar(`etapa/${n}/resultado`, res, 'Etapa lista: revísala y aprueba');
  }

  // Revisar y aprobar: el resultado, el gate y las tres salidas (aprobar, corregir, pedir ajuste).
  function revisar() {
    const n = activa(run), e = run.etapas[n], o = leerOutput(e.entrega || e.output, e.nombre);
    const hip = (e.campos || []).filter((c) => c.estado !== 'evidencia').length;
    const noA = puede(run, n, 'aprobar', { rol }), noC = puede(run, n, 'corregir', { rol });
    drawer(html`<div class="ag-rev"><span class="lbl">Etapa ${n + 1} · ${e.nombre}</span><h1>${o.titulo}</h1>
      ${e.gate ? html`<p class="ag-gate sm">🚦 ${e.nota_gate || 'Gate del CEO: solo el CEO aprueba esta etapa'}</p>` : ''}
      <p class="sm mut">${e.stub ? 'Resultado simulado: no consultó fuentes. ' : ''}${hip ? `${hip} de ${e.campos.length} campos son hipótesis. ` : ''}${e.confianza ? `Confianza ${e.confianza}%.` : ''}</p>
      <div class="ag-md card">${raw(md(e.salida || ''))}</div>
      <div class="ag-rev-a">
        <button class="btn" data-act="aprobar" ${noA ? raw(`disabled title="${esc(noA)}"`) : ''}>${ico('check', 14)} Aprobar</button>
        <button class="btn ghost" data-act="corregir" ${noC ? raw(`disabled title="${esc(noC)}"`) : ''}>${ico('pencil', 14)} Corregir</button>
        <button class="btn ghost" data-act="ajuste">${ico('rotate-cw', 14)} Solicitar ajuste</button>
      </div>${noA ? html`<p class="xs mut">${noA}</p>` : ''}</div>`, {
      aprobar: async () => { closeDrawer(); sel = n; await guardar(`etapa/${n}/aprobar`, {}, 'Etapa aprobada'); },
      corregir: async () => { closeDrawer(); const v = await ask('Corregir resultado', [{ k: 'salida', l: 'Resultado (markdown)', t: 'textarea', v: e.salida, req: true }, { k: 'nota', l: 'Qué corregiste' }], 'Guardar corrección'); if (v) await guardar(`etapa/${n}/corregir`, v, 'Corrección guardada'); },
      ajuste: async () => { closeDrawer(); const v = await ask('Solicitar ajuste', [{ k: 'nota', l: '¿Qué tiene que cambiar?', t: 'textarea', req: true }], 'Pedir ajuste'); if (v) await guardar(`etapa/${n}/ajuste`, v, 'Ajuste pedido: re-ejecuta la etapa'); },
    }, { title: 'Revisar y aprobar' });
  }

  async function agregarInput() {
    const v = await ask('Añadir input', [
      { k: 'tipo', l: 'Qué es', t: 'select', opts: [['texto', 'Texto pegado'], ['link', 'Enlace'], ['archivo', 'Archivo']], v: 'texto' },
      { k: 'titulo', l: 'Título', ph: 'Ej.: Entrevista del fundador' },
      { k: 'url', l: 'Enlace (si es enlace)', ph: 'https://…' },
      { k: 'texto', l: 'Contenido (si es texto)', t: 'textarea' },
      { k: 'interna', l: 'Origen', t: 'select', opts: [['1', 'Fuente interna (del cliente o de Inherent)'], ['', 'Fuente externa']], v: '1' },
    ], 'Siguiente');
    if (!v) return;
    if (v.tipo !== 'archivo') return guardar('inputs', { ...v, interna: Boolean(v.interna) }, 'Input agregado');
    const f = await new Promise((ok) => { const i = document.createElement('input'); i.type = 'file'; i.onchange = () => ok(i.files[0] || null); i.click(); });
    if (!f) return;
    if (TEXTO.test(f.name) && f.size < 400000) return guardar('inputs', { tipo: 'archivo', titulo: v.titulo || f.name, texto: await f.text(), meta: `${f.name} · ${Math.ceil(f.size / 1024)} KB`, interna: Boolean(v.interna) }, 'Archivo agregado');
    try {
      toast('Subiendo a tu Drive…');
      const r = await uploadToDrive(f, f.name);
      const url = r?.webViewLink || r?.url || r?.link || '';
      await guardar('inputs', { tipo: 'link', titulo: v.titulo || f.name, url, meta: `${f.name} · en Drive (el agente lo lee con su conexión de Drive)`, interna: Boolean(v.interna) }, 'Archivo subido a Drive');
    } catch (err) { toast(`No se pudo subir: ${err.message}. Pega su contenido como texto.`, true); }
  }

  const mapa = {
    ver: (b) => { sel = Number(b.dataset.n); verMd = false; pinta(); },
    ir: () => { sel = null; pinta(); },
    md: () => { verMd = !verMd; pinta(); },
    ejecutar, continuar: ejecutar, revisar,
    input: agregarInput,
    'quitar-input': (b) => guardar('inputs', { id: b.dataset.id, archivado: true }, 'Input quitado'),
    pausa: async () => { if (!run.pausado && ctrl) ctrl.abort(); await guardar('pausa', { pausado: !run.pausado }, run.pausado ? 'Agente reanudado' : 'Agente en pausa'); },
    mas: () => drawer(html`<div class="ag-rev"><h1>Trabajo</h1><p class="sm mut">Creado por ${quien(run.creado_por)} · workflow «${run.flujo.nombre}»</p>
        <div class="ag-rev-a"><a class="btn ghost" href="${rutaAgente(run.flujo.id, 'workflow')}" data-act="close">${ico('pencil', 14)} Ver el workflow del agente</a><button class="btn ghost" data-act="archivar">Archivar trabajo</button></div>
        <h2 class="sm">Historial</h2><ol class="ag-hist">${[...(run.historial || [])].reverse().slice(0, 80).map((h) => html`<li><b>${quien(h.quien)}</b> ${ACC[h.accion] || h.accion}${h.etapa != null && run.etapas[h.etapa] ? html` <span class="mut">· ${run.etapas[h.etapa].nombre}</span>` : ''}<span class="mut xs">${cuando(h.at)}</span>${h.nota ? html`<span class="ag-nota xs">${h.nota}</span>` : ''}</li>`)}</ol></div>`,
      { archivar: async () => { if (!confirm('¿Archivar este trabajo? Nada se borra.')) return; closeDrawer(); await guardar('archivar', { archivado: true }, 'Trabajo archivado'); } }, { title: 'Trabajo' }),
    restaurar: () => guardar('archivar', { archivado: false }, 'Trabajo restaurado'),
  };
  el.addEventListener('click', (ev) => { const t = ev.target.closest('[data-act]'); if (t && el.contains(t)) mapa[t.dataset.act]?.(t, ev); });
  el.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.dataset.ch === 'runner') { runner = t.value; localStorage.setItem(prefRunner(me), runner); }
    if (t.dataset.ch === 'verif') guardar('evidencia', { id: t.dataset.id, verificada: t.checked, etapa: sel ?? activa(run) });
  });
  pinta();
}
