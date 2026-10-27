// Vista del Mapa del camino del dinero (herramienta process-mapper de Consulting): el recorrido lead → primer contacto → venta → entrega →
// recompra, hoy vs optimizado lado a lado (dos tablas por etapa) con su diferencia, el estándar de entrega (5-Star Service) y las listas
// de pasos que viajan a otras herramientas. Existe para que tool-shell.js pinte el centro de la herramienta con un solo contrato (nuevo,
// pintar, resumen), para que un paso sin rol se vea antes de aprobar y para que lo que no tiene dato diga «⚠️ SIN DATOS», nunca 0.
// Pinta con html`…` (todo se escapa), edita con inputs nativos y avisa cada cambio con el contenido completo y limpio.
import { html, mount, ico, toast, confirmAsk } from '../core.js';
import { SIN_DATOS, sinAcentos, corta, numeroONull } from './marcos.js';
import { ETAPAS_CAMINO, ESTRELLAS, vacio, limpiar, pasosManuales, pasosFundador, pasosSinRol, medidas, diferencias, aDiagrama } from './procesos.js';

const MAX_PASOS = 30, MAX_ESTANDAR = 12;
const LISTAS = [['hoy', 'Hoy'], ['optimizado', 'Optimizado']];
const CAMPOS = { nombre: 'nombre', etapa: 'etapa', rol: 'rol', minutos: 'minutos', modo: 'manual o automático', perdida: '% que se pierde', dolor: 'dolor', fundador: 'depende del fundador' };
const MODOS = [['manual', 'Manual'], ['auto', 'Automático']];
const SD_MEDIDAS = 'salen del cliente (su CRM, su bandeja o la entrevista)';
// Cómo se reconoce que el estándar nombra cada estrella (el texto va sin acentos y en minúsculas).
const RE_ESTRELLA = { concern: /concern/, courtesy: /courtes/, 'one-and-done': /one.{0,6}done/, educate: /educat/, timeliness: /timelin/ };
const idxEtapa = (e) => ETAPAS_CAMINO.findIndex((x) => x.id === e);
const num = (n) => (Math.round(n * 10) / 10).toLocaleString('es-GT');
const valorDe = (t) => (t.type === 'checkbox' ? t.checked : t.type === 'number' ? numeroONull(t.value, t.dataset.k === 'perdida' ? { min: 0, max: 100 } : { min: 0 }) : t.value);
const ponerRuta = (obj, ruta, v) => { const p = ruta.split('.'), ultimo = p.pop(); let o = obj; for (const k of p) { o = o?.[k]; if (o == null) return; } o[ultimo] = v; };
const nombrePaso = (p) => corta(p.nombre, 80) || 'Paso sin nombre';

// El contenido de trabajo: el limpio.
const base = (contenido) => limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {}));
// Dónde entra un paso nuevo: después del último paso de su etapa (o de una anterior), para que la lista siga el orden del recorrido.
function posicion(ps, etapa) {
  const k = idxEtapa(etapa); if (k < 0) return ps.length;
  let ultimo = -1; ps.forEach((p, i) => { const j = idxEtapa(p.etapa); if (j >= 0 && j <= k) ultimo = i; });
  if (ultimo >= 0) return ultimo + 1;
  const primero = ps.findIndex((p) => idxEtapa(p.etapa) > k); return primero >= 0 ? primero : ps.length;
}

// Los campos: un input nativo si se edita; texto plano (o ⚠️ SIN DATOS) si es de solo lectura.
function campos(editable) {
  const ro = (valor, o) => html`<span class="pro-ro" data-vacio="${valor || valor === 0 ? 0 : 1}">${valor || valor === 0 ? valor : o.sd === true ? SIN_DATOS : o.sd ? `${SIN_DATOS}: ${o.sd}` : '—'}</span>`;
  const at = (ref) => ({ l: ref.l || '', id: ref.id || '', k: ref.k || '', c: ref.c || '' });
  return {
    txt: (ref, valor, o = {}) => { const r = at(ref); return editable ? html`<input class="in" type="text" data-l="${r.l}" data-id="${r.id}" data-k="${r.k}" data-c="${r.c}" value="${valor ?? ''}" maxlength="${o.max || 120}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}" list="${o.lista || ''}" autocomplete="off">` : ro(valor, o); },
    num: (ref, valor, o = {}) => { const r = at(ref); return editable ? html`<input class="in" type="number" inputmode="decimal" min="0" max="${o.max || ''}" step="any" data-l="${r.l}" data-id="${r.id}" data-k="${r.k}" data-c="${r.c}" value="${valor ?? ''}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}">` : ro(typeof valor === 'number' ? num(valor) : '', o); },
    area: (ref, valor, o = {}) => { const r = at(ref); return editable ? html`<textarea class="in" rows="${o.filas || 2}" data-l="${r.l}" data-id="${r.id}" data-k="${r.k}" data-c="${r.c}" maxlength="${o.max || 300}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}">${valor ?? ''}</textarea>` : ro(valor, o); },
    sel: (ref, lista, actual, o = {}) => { const r = at(ref); return editable
      ? html`<select class="in" data-l="${r.l}" data-id="${r.id}" data-k="${r.k}" data-c="${r.c}" aria-label="${o.label || ''}">${o.vacio ? html`<option value="">${o.vacio}</option>` : ''}${lista.map(([v, l]) => html`<option value="${v}" ${String(actual ?? '') === String(v) ? 'selected' : ''}>${l}</option>`)}</select>`
      : ro(lista.find(([v]) => String(v) === String(actual ?? ''))?.[1] || '', o); },
    chk: (ref, valor, o = {}) => { const r = at(ref); return editable ? html`<input type="checkbox" data-l="${r.l}" data-id="${r.id}" data-k="${r.k}" data-c="${r.c}" ${valor ? 'checked' : ''} aria-label="${o.label || ''}">` : ro(valor ? 'Sí' : 'No', o); },
  };
}

// ---------- Regiones derivadas: se recalculan solas y nunca contienen un campo editable ----------
const medidasR = ({ c }) => {
  const m = { hoy: medidas(c.hoy), optimizado: medidas(c.optimizado) };
  const tarjeta = ([l, titulo]) => {
    const x = m[l];
    if (!x.pasos) return html`<article class="pro-med" data-l="${l}"><h4>${titulo}</h4><p class="pro-sd">${SIN_DATOS}: ${l === 'hoy' ? 'falta mapear cómo se entrega hoy' : 'todavía no hay un recorrido optimizado'}</p></article>`;
    return html`<article class="pro-med" data-l="${l}"><h4>${titulo}</h4><dl>
      <div><dt>Pasos</dt><dd>${x.pasos}</dd></div>
      <div><dt>A mano</dt><dd>${x.manuales}</dd></div>
      <div><dt>Dependen del fundador</dt><dd>${x.fundador}</dd></div>
      <div><dt>Minutos de trabajo humano</dt><dd>${x.minutos === null ? html`<span class="pro-sd">${SIN_DATOS}: ${SD_MEDIDAS}</span>` : html`<b>${num(x.minutos)}</b>${x.sinMinutos ? html` <span class="mut sm">(${x.sinMinutos === 1 ? '1 paso sin dato' : `${x.sinMinutos} pasos sin dato`})</span>` : ''}`}</dd></div>
      <div><dt>Donde más se pierde</dt><dd>${x.mayorPerdida ? html`<b>${x.mayorPerdida.nombre}</b> (${num(x.mayorPerdida.perdida)}%)` : html`<span class="pro-sd">${SIN_DATOS}: el % que se pierde ${SD_MEDIDAS}</span>`}</dd></div></dl></article>`;
  };
  const delta = m.hoy.minutos !== null && m.optimizado.minutos !== null ? m.optimizado.minutos - m.hoy.minutos : null;
  return html`<div class="pro-med-g">${LISTAS.map(tarjeta)}</div>${delta === null ? '' : html`<p class="pro-delta mut sm">Cambio en minutos de trabajo humano: <b>${delta > 0 ? '+' : ''}${num(delta)}</b> (suma de los pasos que tienen dato)</p>`}`;
};
const sinRol = ({ c }) => {
  const s = pasosSinRol(c);
  return s.length ? html`<p class="pro-sinrol-t">${ico('triangle-alert', 15)} ${s.length === 1 ? '1 paso sin rol' : `${s.length} pasos sin rol`}: di quién lo hace antes de aprobar.</p>
    <ul class="pro-sinrol-ul">${s.map((p) => html`<li><b>${nombrePaso(p)}</b> <span class="mut sm">${p.lista === 'hoy' ? 'hoy' : 'optimizado'}</span></li>`)}</ul>` : html``;
};
const diff = ({ c, id, l, dif }) => {
  if (!c.optimizado.length) return html``;
  const cambia = dif.cambiados.find((x) => x.id === id), que = cambia ? cambia.campos.map((k) => CAMPOS[k] || k).join(', ') : '';
  if (l === 'hoy') return dif.quitados.includes(id) ? html`<span class="pro-diff" data-diff="quitado">Se quita en el optimizado</span>` : cambia ? html`<span class="pro-diff" data-diff="cambia">Cambia en el optimizado: ${que}</span>` : html`<span class="pro-diff" data-diff="igual">Igual en el optimizado</span>`;
  return dif.nuevos.includes(id) ? html`<span class="pro-diff" data-diff="nuevo">Paso nuevo</span>` : cambia ? html`<span class="pro-diff" data-diff="cambia">Cambia: ${que}</span>` : html`<span class="pro-diff" data-diff="igual">Igual que hoy</span>`;
};
const sinDato = ({ c, id, l }) => {
  const p = c[l].find((x) => x.id === id); if (!p) return html``;
  const f = [p.minutos === null ? 'minutos' : '', p.perdida === null ? '% que se pierde' : ''].filter(Boolean);
  return f.length ? html`${SIN_DATOS}: ${f.join(' y ')}` : html``;
};
const estrellas = ({ c }) => {
  const t = sinAcentos(c.estandar.pasos.join(' \n ')), cubiertas = ESTRELLAS.filter((e) => RE_ESTRELLA[e.id]?.test(t)).length;
  return html`<p class="pro-std-cuenta mut sm">${cubiertas} de ${ESTRELLAS.length} estrellas nombradas en los pasos</p>
    <ul class="pro-estrellas-ul">${ESTRELLAS.map((e) => { const ok = RE_ESTRELLA[e.id]?.test(t); return html`<li class="pro-estrella" data-cubierta="${ok ? 1 : 0}">${ico(ok ? 'circle-check' : 'circle', 14)} <b>${e.nombre}</b> <span class="mut sm">${e.que}</span></li>`; })}</ul>`;
};
const envio = (cual) => ({ c }) => {
  const ps = cual === 'manuales' ? pasosManuales(c, 'hoy') : pasosFundador(c, 'hoy');
  if (!c.hoy.length) return html`<p class="pro-sd">${SIN_DATOS}: aún no hay pasos de hoy</p>`;
  return ps.length ? html`<ul>${ps.map((p) => html`<li><b>${nombrePaso(p)}</b> <span class="mut sm">${corta(p.rol, 60) || `${SIN_DATOS}: rol`}${cual === 'manuales' && typeof p.minutos === 'number' ? ` · ${num(p.minutos)} min` : ''}</span></li>`)}</ul>`
    : html`<p class="mut sm">${cual === 'manuales' ? 'Ningún paso de hoy se hace a mano.' : 'Ningún paso de hoy depende del fundador.'}</p>`;
};
const carriles = ({ c, l }) => {
  const rs = [...new Set(c[l].map((p) => corta(p.rol, 60)))];
  return rs.length ? html`<span class="mut sm">Carriles, de arriba hacia abajo: ${rs.map((r, i) => html`${i ? ' · ' : ''}<b>${r || 'Sin rol'}</b>`)}</span>` : html``;
};
const REGIONES = { medidas: medidasR, sinrol: sinRol, diff, sd: sinDato, estrellas, manuales: envio('manuales'), fundador: envio('fundador'), carriles };

// ---------- Las tablas (se vuelven a pintar enteras cuando cambia la forma) ----------
function paso(p, lista, E) {
  const { f, editable } = E, ref = (k) => ({ l: lista, id: p.id, k }), cols = editable ? 7 : 6;
  return html`<tbody class="pro-paso" data-id="${p.id}" data-l="${lista}" data-sinrol="0" data-modo="${p.modo}" data-fundador="${p.fundador ? 1 : 0}">
    <tr class="pro-paso-1">
      <td class="pro-c-nombre">${f.txt(ref('nombre'), p.nombre, { max: 120, label: 'Paso', ph: 'Qué pasa en este paso' })}</td>
      <td class="pro-c-rol">${f.txt(ref('rol'), p.rol, { max: 60, label: 'Rol: quién lo hace', ph: 'Rol', lista: 'pro-roles', sd: 'falta el rol' })}</td>
      <td class="pro-c-min">${f.num(ref('minutos'), p.minutos, { label: 'Minutos de trabajo humano', ph: 'min', sd: true })}</td>
      <td class="pro-c-modo">${f.sel(ref('modo'), MODOS, p.modo, { label: 'Manual o automático' })}</td>
      <td class="pro-c-perd">${f.num(ref('perdida'), p.perdida, { label: '% de leads o ventas que se pierden aquí', ph: '%', max: 100, sd: true })}</td>
      <td class="pro-c-fund">${f.chk(ref('fundador'), p.fundador, { label: 'Depende del fundador' })}</td>
      ${editable ? html`<td class="pro-c-x"><button type="button" class="btn ghost sm pro-btn" data-act="pro-del" data-l="${lista}" data-id="${p.id}" aria-label="Quitar este paso" title="Quitar este paso">${ico('x', 14)}</button></td>` : ''}
    </tr>
    <tr class="pro-paso-2"><td colspan="${cols}"><div class="pro-paso-2g">
      <label class="pro-f-dolor"><span class="lbl">Dolor</span>${f.txt(ref('dolor'), p.dolor, { max: 300, label: 'Dolor: qué se cae en este paso', ph: 'Qué se cae aquí' })}</label>
      ${editable ? html`<label class="pro-f-etapa"><span class="lbl">Etapa</span>${f.sel(ref('etapa'), ETAPAS_CAMINO.map((e) => [e.id, e.nombre]), p.etapa, { vacio: '— sin etapa', label: 'Etapa del paso' })}</label>` : ''}
      <span class="pro-diff-r" data-r="diff" data-id="${p.id}" data-l="${lista}"></span>
      <span class="pro-sd" data-r="sd" data-id="${p.id}" data-l="${lista}"></span>
    </div></td></tr></tbody>`;
}
function tabla(lista, etapa, E) {
  const ps = E.c[lista].filter((p) => p.etapa === etapa), cuantos = E.c[lista].length;
  return html`${ps.length ? html`<table class="pro-tabla"><caption class="sr-only">${LISTAS.find(([l]) => l === lista)[1]}: ${ETAPAS_CAMINO.find((e) => e.id === etapa)?.nombre || 'sin etapa'}</caption>
      <thead><tr><th scope="col">Paso</th><th scope="col">Rol</th><th scope="col" title="Minutos de trabajo humano">Min</th><th scope="col">Modo</th><th scope="col" title="% de leads o ventas que se pierden aquí">% se pierde</th><th scope="col" title="Depende del fundador">Fundador</th>${E.editable ? html`<th scope="col"><span class="sr-only">Quitar</span></th>` : ''}</tr></thead>
      ${ps.map((p) => paso(p, lista, E))}</table>` : html`<p class="pro-vacio mut sm">${E.editable ? 'Sin pasos en esta etapa.' : 'Sin pasos'}</p>`}
    ${E.editable && etapa ? html`<button type="button" class="btn ghost sm pro-btn" data-act="pro-add" data-l="${lista}" data-e="${etapa}" ${cuantos >= MAX_PASOS ? 'disabled' : ''}>${ico('plus', 14)} Agregar paso</button>` : ''}`;
}
function listaEstandar(E) {
  const ps = E.c.estandar.pasos;
  return html`${ps.length ? html`<ol class="pro-std-ol">${ps.map((x, i) => html`<li class="pro-std-p">${E.editable
      ? html`<textarea class="in" rows="2" maxlength="240" data-c="estandar.pasos.${i}" aria-label="Paso ${i + 1} del estándar" placeholder="Concern: … Se mide: …">${x}</textarea><button type="button" class="btn ghost sm pro-btn" data-act="pro-std-del" data-i="${i}" aria-label="Quitar el paso ${i + 1} del estándar" title="Quitar este paso">${ico('x', 14)}</button>`
      : html`<span>${x}</span>`}</li>`)}</ol>` : html`<p class="pro-sd">${SIN_DATOS}: faltan los pasos del estándar (uno por estrella, con cómo se mide)</p>`}
    ${E.editable ? html`<button type="button" class="btn ghost sm pro-btn" data-act="pro-std-add" ${ps.length >= MAX_ESTANDAR ? 'disabled' : ''}>${ico('plus', 14)} Agregar paso</button>` : ''}`;
}

function plantilla(E) {
  const { c, f, editable } = E;
  return html`<div class="pro" data-editable="${editable ? 1 : 0}">
    <section class="pro-medidas" data-r="medidas" aria-label="Hoy y optimizado en cifras"></section>
    <div class="pro-sinrol" data-r="sinrol"></div>

    <section class="pro-recorrido" aria-label="El recorrido del dinero">
      <header class="pro-h"><h3 class="pro-t">${ico('git-branch', 16)} Del lead a la recompra <span class="mut sm">hoy vs optimizado, etapa por etapa</span></h3>
        ${editable ? html`<button type="button" class="btn ghost sm pro-btn" data-act="pro-copiar" title="Copia los pasos de hoy al optimizado para ajustar lo que cambia" ${c.optimizado.length || !c.hoy.length ? 'disabled' : ''}>Partir del recorrido de hoy</button>` : ''}</header>
      <p class="pro-nota mut sm">Hoy es como se hace de verdad; optimizado es el mismo camino, mejorado. Minutos y % que se pierde ${SD_MEDIDAS}: sin dato dicen ${SIN_DATOS}, nunca 0.</p>
      <datalist id="pro-roles"></datalist>
      <div class="pro-etapas">${[...ETAPAS_CAMINO, { id: '', nombre: 'Sin etapa' }].map((e, i) => html`<section class="pro-etapa" data-e="${e.id}" ${e.id ? '' : 'hidden'}>
        <h4 class="pro-etapa-n">${e.id ? `${i + 1} · ` : ''}${e.nombre}</h4>
        <div class="pro-par">${LISTAS.map(([l, titulo]) => html`<div class="pro-lado" data-l="${l}"><h5 class="pro-lado-n">${titulo}</h5><div class="pro-pasos" data-l="${l}" data-e="${e.id}"></div></div>`)}</div></section>`)}</div>
    </section>

    <section class="pro-estandar" aria-label="Estándar de entrega">
      <h3 class="pro-t">${ico('star', 16)} Estándar de entrega <span class="mut sm">5-Star Service</span></h3>
      <label class="pro-f pro-f-ancho"><span class="lbl">Promesa de entrega</span>${f.area({ c: 'estandar.promesa' }, c.estandar.promesa, { max: 300, label: 'Promesa de entrega en una frase', ph: 'Lo que el cliente puede esperar de la entrega, en una frase', sd: 'falta la promesa de entrega' })}</label>
      <div class="pro-std-g">
        <div class="pro-std-pasos"><span class="lbl">Un paso por estrella, con cómo se mide</span><div class="pro-std-lista"></div></div>
        <div class="pro-std-estrellas" data-r="estrellas"></div></div>
      <p class="pro-nota mut sm">Fuente: 5-Star Service Framework (Acquisition.com).</p>
    </section>

    <section class="pro-envios" aria-label="Lo que sigue con estos pasos">
      <h3 class="pro-t">${ico('zap', 16)} Lo que sigue con estos pasos <span class="mut sm">estas dos herramientas todavía no están: por ahora la lista queda aquí</span></h3>
      <div class="pro-envios-g">
        <article class="pro-env" data-k="manuales"><h4>Pasos manuales → Automation Finder</h4><div data-r="manuales"></div></article>
        <article class="pro-env" data-k="fundador"><h4>Depende del fundador → Equipo para la siguiente etapa</h4><div data-r="fundador"></div></article></div>
    </section>

    <details class="pro-diagrama"><summary>${ico('eye', 14)} Ver el recorrido como diagrama</summary>
      <p class="pro-leyenda mut sm"><span class="chip" data-fill="barro">Sin rol</span><span class="chip" data-fill="tierra">Depende del fundador</span><span class="chip" data-fill="salvia">Automático</span><span class="chip" data-fill="arena">Manual</span></p>
      <div class="pro-dg-par">${LISTAS.map(([l, titulo]) => html`<figure class="pro-dg-f" data-l="${l}"><figcaption><b>${titulo}</b> <span data-r="carriles" data-l="${l}"></span></figcaption><div class="pro-dg" data-l="${l}"></div></figure>`)}</div></details>
  </div>`;
}

export const vista = {
  nuevo() { return vacio(); },

  pintar(el, { contenido, editable, onCambio } = {}) {
    const c = base(contenido), ed = Boolean(editable), E = { c, f: campos(ed), editable: ed };
    mount(el, plantilla(E));
    const root = el.firstElementChild, cache = new WeakMap();
    const poner = (nodo, contenidoHtml) => { const s = String(contenidoHtml); if (cache.get(nodo) !== s) { cache.set(nodo, s); mount(nodo, contenidoHtml); } };
    const emitir = () => { if (ed && typeof onCambio === 'function') onCambio(limpiar(structuredClone(c))); };
    const paso1 = (l, id) => c[l]?.find((p) => p.id === id);

    // Lo derivado: textos calculados y los atributos que resaltan (un paso sin rol, manual, del fundador).
    const refrescar = () => {
      const dif = diferencias(c);
      for (const nodo of root.querySelectorAll('[data-r]')) { const g = REGIONES[nodo.dataset.r]; if (g) poner(nodo, g({ ...E, id: nodo.dataset.id, l: nodo.dataset.l, dif })); }
      for (const tb of root.querySelectorAll('.pro-paso')) {
        const p = paso1(tb.dataset.l, tb.dataset.id); if (!p) continue;
        const sin = !corta(p.rol, 60);
        tb.dataset.sinrol = sin ? '1' : '0'; tb.dataset.modo = p.modo; tb.dataset.fundador = p.fundador ? '1' : '0';
        const rol = tb.querySelector('.pro-c-rol input'); if (rol) rol.setAttribute('aria-invalid', sin ? 'true' : 'false');
      }
      const copiar = root.querySelector('[data-act="pro-copiar"]'); if (copiar) copiar.disabled = c.optimizado.length > 0 || c.hoy.length === 0;
    };
    // La forma de las tablas: se vuelven a pintar (al cargar y al agregar, quitar o cambiar de etapa un paso).
    const pintarPasos = () => {
      for (const d of root.querySelectorAll('.pro-pasos')) mount(d, tabla(d.dataset.l, d.dataset.e, E));
      const roles = [...new Set([...c.hoy, ...c.optimizado].map((p) => corta(p.rol, 60)).filter(Boolean))];
      mount(root.querySelector('#pro-roles'), html`${roles.map((r) => html`<option value="${r}"></option>`)}`);
      root.querySelector('.pro-etapa[data-e=""]').hidden = ![...c.hoy, ...c.optimizado].some((p) => !p.etapa);
      refrescar();
    };
    const pintarEstandar = () => { mount(root.querySelector('.pro-std-lista'), listaEstandar(E)); refrescar(); };
    pintarPasos(); pintarEstandar();

    // El recorrido como diagrama (solo lectura): se pinta al abrirlo y se repinta, sin prisa, cuando algo cambia.
    const det = root.querySelector('.pro-diagrama'), dgs = {};
    let tDg = 0, pidiendo = 0;
    const pintarDiagramas = async () => {
      if (!root.isConnected || !det.open) return;
      const turno = ++pidiendo;
      try {
        const { diagramView } = await import('../diagram-editor.js');
        if (turno !== pidiendo || !root.isConnected || !det.open) return;
        const lim = limpiar(c);
        for (const [l] of LISTAS) {
          const host = [...root.querySelectorAll('.pro-dg')].find((h) => h.dataset.l === l); if (!host) continue;
          dgs[l]?.destroy?.(); dgs[l] = null; host.innerHTML = '';
          if (!lim[l].length) { mount(host, html`<p class="pro-sd">${SIN_DATOS}: aún no hay pasos ${l === 'hoy' ? 'de hoy' : 'optimizados'}</p>`); continue; }
          dgs[l] = diagramView(host, aDiagrama(lim[l]), {});
        }
      } catch { for (const h of root.querySelectorAll('.pro-dg')) mount(h, html`<p class="pro-sd">No pude dibujar el diagrama. Las tablas de arriba siguen siendo las mismas.</p>`); }
    };
    const repintarDiagramas = () => { if (!det.open) return; clearTimeout(tDg); tDg = setTimeout(pintarDiagramas, 250); };
    det.addEventListener('toggle', () => { if (det.open) pintarDiagramas(); else { pidiendo++; for (const l of Object.keys(dgs)) { dgs[l]?.destroy?.(); dgs[l] = null; } } });
    if (!ed) return;

    const enfocar = (l, id, k) => [...root.querySelectorAll('.pro-paso')].find((tb) => tb.dataset.l === l && tb.dataset.id === id)?.querySelector(`[data-k="${k}"]`)?.focus();
    const alCambiar = (e) => {
      const t = e.target;
      if (!t || !root.contains(t)) return;
      if (t.dataset.id) {
        const p = paso1(t.dataset.l, t.dataset.id), k = t.dataset.k; if (!p || !k) return;
        p[k] = valorDe(t);
        if (k === 'etapa') { // cambió de etapa: pasa a su lugar del recorrido y de tabla
          c[t.dataset.l].splice(c[t.dataset.l].indexOf(p), 1); c[t.dataset.l].splice(posicion(c[t.dataset.l], p.etapa), 0, p);
          pintarPasos(); enfocar(t.dataset.l, p.id, 'etapa');
        }
      } else if (t.dataset.c) ponerRuta(c, t.dataset.c, valorDe(t));
      else return;
      emitir(); refrescar(); repintarDiagramas();
    };
    root.addEventListener('input', alCambiar);
    root.addEventListener('change', alCambiar);

    const idNuevo = (l) => { const usados = new Set([...c.hoy, ...c.optimizado].map((p) => p.id)), pref = l === 'hoy' ? 'h' : 'o'; let k = c[l].length + 1; while (usados.has(`${pref}${k}`)) k++; return `${pref}${k}`; };
    root.addEventListener('click', async (e) => {
      const b = e.target.closest?.('[data-act]'); if (!b || !root.contains(b)) return;
      const a = b.dataset.act;
      if (a === 'pro-add') {
        const l = b.dataset.l; if (!c[l]) return;
        if (c[l].length >= MAX_PASOS) return toast(`Cada recorrido llega hasta ${MAX_PASOS} pasos`, true);
        const p = { id: idNuevo(l), nombre: '', etapa: b.dataset.e || '', rol: '', minutos: null, modo: 'manual', perdida: null, dolor: '', fundador: false };
        c[l].splice(posicion(c[l], p.etapa), 0, p); pintarPasos(); enfocar(l, p.id, 'nombre'); repintarDiagramas();
      } else if (a === 'pro-del') {
        const l = b.dataset.l, p = paso1(l, b.dataset.id); if (!p) return;
        if (p.nombre) { const ok = await confirmAsk(`Quitar «${nombrePaso(p)}» del recorrido ${l === 'hoy' ? 'de hoy' : 'optimizado'}. Si ya lo guardaste, queda en las versiones anteriores.`); if (!ok || !root.isConnected) return; }
        c[l].splice(c[l].indexOf(p), 1); pintarPasos(); emitir(); repintarDiagramas();
        [...root.querySelectorAll('[data-act="pro-add"]')].find((x) => x.dataset.l === l && x.dataset.e === p.etapa)?.focus();
      } else if (a === 'pro-copiar') {
        if (c.optimizado.length || !c.hoy.length) return;
        c.optimizado = structuredClone(c.hoy); pintarPasos(); emitir(); repintarDiagramas();
      } else if (a === 'pro-std-add') {
        if (c.estandar.pasos.length >= MAX_ESTANDAR) return toast(`El estándar llega hasta ${MAX_ESTANDAR} pasos`, true);
        c.estandar.pasos.push(''); pintarEstandar();
        [...root.querySelectorAll('.pro-std-p textarea')].pop()?.focus();
      } else if (a === 'pro-std-del') {
        const i = Number(b.dataset.i); if (!Number.isInteger(i) || i < 0 || i >= c.estandar.pasos.length) return;
        c.estandar.pasos.splice(i, 1); pintarEstandar(); emitir();
        (root.querySelectorAll('.pro-std-p textarea')[Math.min(i, c.estandar.pasos.length - 1)] || root.querySelector('[data-act="pro-std-add"]'))?.focus();
      }
    });
  },

  // Una línea para el Overview: pasos de hoy, cuántos van a mano, minutos y pasos del optimizado.
  resumen(contenido) {
    const c = base(contenido), h = medidas(c.hoy), o = medidas(c.optimizado);
    return html`<span class="pro-res"><span class="chip">${h.pasos ? `Hoy: ${h.pasos === 1 ? '1 paso' : `${h.pasos} pasos`} · ${h.manuales} a mano` : `Hoy: ${SIN_DATOS}`}</span><span class="chip">${h.minutos === null ? `Minutos: ${SIN_DATOS}` : `${num(h.minutos)} min de trabajo humano`}</span><span class="chip">${o.pasos ? `Optimizado: ${o.pasos === 1 ? '1 paso' : `${o.pasos} pasos`}` : `Optimizado: ${SIN_DATOS}`}</span></span>`;
  },
};
