// Vista del Árbol de la brecha (herramienta root-cause-explorer de Consulting): arriba el factor con más brecha, la raíz (meta − actual),
// los 5 factores de la ecuación de ingresos y, debajo de cada uno, las causas como lista anidada editable, con su panel de evidencia,
// dato que falta, prueba y sistema. Existe para que tool-shell.js pinte el centro de la herramienta con un solo contrato (nuevo, pintar,
// resumen) y para que la brecha y el factor con más brecha se calculen (nunca se escriban) y lo vacío diga «⚠️ SIN DATOS».
// Pinta con html`…` (todo se escapa), edita con inputs nativos y avisa cada cambio con el contenido completo y limpio.
import { html, mount, ico, toast, confirmAsk } from '../core.js';
import { ECUACION, nombreFactor, SISTEMAS, SISTEMAS_IDS, SIN_DATOS, corta, miles, numeroONull } from './marcos.js';
import { ESTADOS, vacio, limpiar, brecha, factoresDe, razonFactor, factoresSinDatos, factorMayorBrecha, tareasDe, aDiagrama } from './causas.js';

const ETIQUETA_ESTADO = { hipotesis: 'Hipótesis', validada: 'Validada', descartada: 'Descartada' };
const MAX_NODOS = 120;
const TASAS = ['conversion', 'retencion']; // las tasas van de 0 a 1
const SD_FACTORES = 'salen de lo que comparte el cliente (su CRM, sus ventas y su analítica)';
const veces = (r) => Math.round(r * 100) / 100;
const estrategiaDe = (ctx) => (ctx && typeof ctx.estrategia === 'object' && ctx.estrategia) || {};
const valorDe = (t) => (t.type === 'number' ? numeroONull(t.value) : t.value);
const ponerRuta = (obj, ruta, v) => { const p = ruta.split('.'), ultimo = p.pop(); let o = obj; for (const k of p) { o = o?.[k]; if (o == null) return; } o[ultimo] = v; };

// El contenido de trabajo: el limpio, con los 5 factores siempre presentes (sin dato = ⚠️ SIN DATOS).
function base(contenido) {
  const c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {}));
  c.factores = factoresDe(c);
  return c;
}

// Los campos: un input nativo si se edita; texto plano (o ⚠️ SIN DATOS) si es de solo lectura.
// ref = { c: ruta en el contenido } o { n: id de la causa, k: campo de la causa }.
function campos(editable) {
  const ro = (valor, o) => html`<span class="cau-ro" data-vacio="${valor || valor === 0 ? 0 : 1}">${valor || valor === 0 ? valor : o.sd ? `${SIN_DATOS}: ${o.sd}` : '—'}</span>`;
  const dc = (ref) => ({ c: ref.c || '', n: ref.n || '', k: ref.k || '' });
  return {
    num: (ref, valor, o = {}) => { const r = dc(ref); return editable ? html`<input class="in" type="number" inputmode="decimal" min="0" step="any" data-c="${r.c}" data-n="${r.n}" data-k="${r.k}" value="${valor ?? ''}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}">` : ro(typeof valor === 'number' ? miles(valor) : '', o); },
    txt: (ref, valor, o = {}) => { const r = dc(ref); return editable ? html`<input class="in" type="text" data-c="${r.c}" data-n="${r.n}" data-k="${r.k}" value="${valor ?? ''}" maxlength="${o.max || 300}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}" autocomplete="off">` : ro(valor, o); },
    area: (ref, valor, o = {}) => { const r = dc(ref); return editable ? html`<textarea class="in" data-c="${r.c}" data-n="${r.n}" data-k="${r.k}" rows="${o.filas || 2}" maxlength="${o.max || 300}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}">${valor ?? ''}</textarea>` : ro(valor, o); },
    sel: (ref, lista, actual, o = {}) => { const r = dc(ref); return editable
      ? html`<select class="in" data-c="${r.c}" data-n="${r.n}" data-k="${r.k}" aria-label="${o.label || ''}">${o.vacio ? html`<option value="">${o.vacio}</option>` : ''}${lista.map(([v, l]) => html`<option value="${v}" ${String(actual ?? '') === String(v) ? 'selected' : ''}>${l}</option>`)}</select>`
      : ro(lista.find(([v]) => String(v) === String(actual ?? ''))?.[1] || '', o); },
  };
}

// ---------- Regiones derivadas: se recalculan solas y nunca contienen un campo editable ----------
const mayor = ({ c }) => {
  const id = factorMayorBrecha(c.factores);
  if (id) return html`<p class="cau-mayor-t">El factor con más brecha: <b>${nombreFactor(id)}</b> <span class="mut">(hay que multiplicarlo por ${veces(razonFactor(factoresDe(c).find((f) => f.id === id)))})</span></p><p class="cau-nota mut sm">Se calcula: lo que hace falta ÷ lo que hay hoy. No se escribe a mano.</p>`;
  const parcial = factorMayorBrecha(c.factores, { parcial: true });
  return html`<p class="cau-mayor-t cau-sd">${SIN_DATOS}: faltan los números de ${factoresSinDatos(c).map(nombreFactor).join(', ')} para calcular el factor con más brecha</p>
    <p class="cau-nota mut sm">${parcial ? `Con lo que hay hasta ahora el mayor sería ${nombreFactor(parcial)}, pero no es definitivo. ` : ''}Los números ${SD_FACTORES}.</p>`;
};
const brechaRaiz = ({ c }) => {
  const b = brecha(c);
  return b === null ? html`<span class="cau-sd">${SIN_DATOS}: sale de la meta de Strategy (meta y actual)</span>` : html`<b class="cau-brecha-n">${miles(b)}</b>${b <= 0 ? html` <span class="mut sm">la meta ya está cubierta</span>` : ''}`;
};
const razon = ({ c, fac }) => {
  const x = factoresDe(c).find((k) => k.id === fac), r = razonFactor(x);
  if (r !== null) return html`<b class="cau-razon-n">×${veces(r)}</b> <span class="mut sm">hay que multiplicarlo</span>`;
  const falta = !(typeof x.actual === 'number' && x.actual > 0) ? 'el número de hoy (en 0 no se puede calcular)' : 'el número que hace falta';
  return html`<span class="cau-sd">${SIN_DATOS}: falta ${falta}</span>`;
};
const alerta = ({ c, id }) => {
  const n = c.nodos.find((x) => x.id === id);
  return n && n.estado === 'validada' && !corta(n.evidencia, 300) ? html`${ico('triangle-alert', 14)} Validada sin evidencia: sin evidencia sigue siendo hipótesis. Pon el dato y la fuente, o regrésala a hipótesis.` : html``;
};
const pruebas = ({ c }) => {
  const n = tareasDe(c).length;
  return n ? html`${n === 1 ? '1 prueba lista' : `${n} pruebas listas`} para volverse tareas (Convertir en tareas)` : html`<span class="cau-sd">Ninguna hipótesis abierta tiene prueba escrita: di qué prueba la validaría</span>`;
};
const REGIONES = { mayor, brecha: brechaRaiz, razon, alerta, pruebas };

// ---------- El árbol: lista anidada (se vuelve a pintar entera cuando cambia la forma) ----------
function nodo(n, E) {
  const { c, f, editable, abiertos } = E, hijos = c.nodos.filter((x) => x.padre === n.id);
  const dato = n.evidencia || n.falta || n.prueba || n.sistema;
  return html`<li class="cau-nodo" data-id="${n.id}" data-estado="${n.estado}" data-alerta="0">
    <div class="cau-nodo-h">
      ${editable ? '' : html`<span class="chip cau-estado" data-estado="${n.estado}">${ETIQUETA_ESTADO[n.estado]}</span>`}
      ${editable ? html`<label class="cau-nodo-l"><span class="sr-only">Causa</span>${f.txt({ n: n.id, k: 'texto' }, n.texto, { max: 200, label: 'Causa', ph: 'Qué causa esta parte de la brecha' })}</label>` : html`<b class="cau-nodo-t">${n.texto}</b>`}
      ${editable ? html`<label class="cau-nodo-e"><span class="sr-only">Estado</span>${f.sel({ n: n.id, k: 'estado' }, ESTADOS.map((e) => [e, ETIQUETA_ESTADO[e]]), n.estado, { label: 'Estado de la causa' })}</label>
        <button type="button" class="btn ghost sm" data-act="cau-add" data-padre="${n.id}" ${c.nodos.length >= MAX_NODOS ? 'disabled' : ''}>${ico('plus', 14)} Subcausa</button>
        <button type="button" class="btn ghost sm" data-act="cau-del" data-id="${n.id}" aria-label="Quitar esta causa" title="Quitar esta causa">${ico('x', 14)} Quitar</button>` : ''}
    </div>
    <p class="cau-alerta" data-r="alerta" data-id="${n.id}"></p>
    <details class="cau-panel" ${abiertos.has(n.id) || (!editable && dato) ? 'open' : ''}><summary>Evidencia, dato que falta, prueba y sistema</summary>
      <div class="cau-panel-g">
        <label class="cau-f cau-f-ancho"><span class="lbl">Evidencia</span>${f.area({ n: n.id, k: 'evidencia' }, n.evidencia, { label: 'Evidencia', ph: 'El dato y su fuente', sd: 'sin evidencia sigue siendo hipótesis; sale de lo que comparte el cliente' })}</label>
        <label class="cau-f"><span class="lbl">Dato que falta</span>${f.txt({ n: n.id, k: 'falta' }, n.falta, { label: 'Dato que falta', ph: 'Qué hay que pedirle al cliente' })}</label>
        <label class="cau-f"><span class="lbl">Prueba que la validaría</span>${f.txt({ n: n.id, k: 'prueba' }, n.prueba, { label: 'Prueba que la validaría', ph: 'Qué se hace para comprobarla' })}</label>
        <label class="cau-f"><span class="lbl">Sistema</span>${f.sel({ n: n.id, k: 'sistema' }, SISTEMAS_IDS.map((s) => [s, SISTEMAS[s].nombre]), n.sistema, { vacio: '— sin sistema', label: 'Sistema al que pertenece' })}</label>
      </div></details>
    ${hijos.length ? html`<ul class="cau-hijos">${hijos.map((h) => nodo(h, E))}</ul>` : ''}
  </li>`;
}
function ramas(padre, E) {
  const hs = E.c.nodos.filter((n) => n.padre === padre);
  return html`${hs.length ? html`<ul class="cau-hijos">${hs.map((n) => nodo(n, E))}</ul>` : html`<p class="cau-vacio cau-sd">${SIN_DATOS}: las causas salen del Diagnóstico aprobado y de lo que cuenta el cliente</p>`}
    ${E.editable ? html`<button type="button" class="btn ghost sm" data-act="cau-add" data-padre="${padre}" ${E.c.nodos.length >= MAX_NODOS ? 'disabled' : ''}>${ico('plus', 14)} Agregar causa</button>` : ''}`;
}

function plantilla({ c, ctx, editable }, f) {
  const meta = corta(estrategiaDe(ctx).meta, 200), factores = factoresDe(c);
  return html`<div class="cau" data-editable="${editable ? 1 : 0}">
    <section class="cau-mayor" data-r="mayor" aria-label="El factor con más brecha"></section>

    <section class="cau-raiz" aria-label="La raíz: meta menos actual">
      <h3 class="cau-t">${ico('target', 16)} La raíz <span class="mut sm">meta − actual</span></h3>
      ${meta ? html`<p class="cau-ref">Meta de Strategy: ${meta}</p>` : html`<p class="cau-ref cau-sd">${SIN_DATOS}: la meta sale de Strategy (Estrategia en vivo)</p>`}
      <div class="cau-raiz-g">
        <label class="cau-f"><span class="lbl">Meta</span>${f.num({ c: 'meta' }, c.meta, { label: 'Meta en dinero', ph: 'Ej. 1500000', sd: 'sale de la meta de Strategy' })}</label>
        <label class="cau-f"><span class="lbl">Actual</span>${f.num({ c: 'actual' }, c.actual, { label: 'Lo que factura hoy', ph: 'Ej. 1000000', sd: 'sale de la meta de Strategy' })}</label>
        <div class="cau-f"><span class="lbl">Brecha</span><div class="cau-brecha" data-r="brecha"></div></div>
      </div>
    </section>

    <section class="cau-arbol" aria-label="Los factores y sus causas">
      <header class="cau-arbol-h"><h3 class="cau-t">${ico('git-branch', 16)} Los 5 factores y sus causas <span class="mut sm">leads × conversión × ticket × frecuencia × retención</span></h3><p class="cau-pruebas mut sm" data-r="pruebas"></p></header>
      <ol class="cau-factores">${factores.map((x, i) => html`<li class="cau-fac" data-f="${x.id}" data-mayor="0">
        <div class="cau-fac-h"><h4 class="cau-fac-n">${nombreFactor(x.id)}</h4>
          <label class="cau-f"><span class="lbl">Hoy</span>${f.num({ c: `factores.${i}.actual` }, x.actual, { label: `${nombreFactor(x.id)} hoy`, ph: TASAS.includes(x.id) ? '0 a 1' : '', sd: SD_FACTORES })}</label>
          <label class="cau-f"><span class="lbl">Hace falta</span>${f.num({ c: `factores.${i}.necesario` }, x.necesario, { label: `${nombreFactor(x.id)} que hace falta`, ph: TASAS.includes(x.id) ? '0 a 1' : '', sd: SD_FACTORES })}</label>
          <div class="cau-razon" data-r="razon" data-f="${x.id}"></div></div>
        <div class="cau-ramas" data-ramas="${x.id}"></div></li>`)}
        <li class="cau-fac cau-fac-sin" data-f="" hidden><div class="cau-fac-h"><h4 class="cau-fac-n">Sin factor <span class="mut sm">cuelga de la raíz</span></h4></div><div class="cau-ramas" data-ramas=""></div></li>
      </ol>
    </section>

    <details class="cau-diagrama"><summary>${ico('eye', 14)} Ver como diagrama</summary><div class="cau-dg" aria-label="El árbol como diagrama"></div></details>
  </div>`;
}

export const vista = {
  nuevo() { return vacio(); },

  pintar(el, { contenido, editable, onCambio, ctx } = {}) {
    const c = base(contenido), ed = Boolean(editable), f = campos(ed);
    // Los paneles abiertos sobreviven a volver a pintar el árbol: los que ya traen datos nacen abiertos.
    const abiertos = new Set(c.nodos.filter((n) => n.evidencia || n.falta || n.prueba || n.sistema).map((n) => n.id));
    const E = { c, ctx, editable: ed, f, abiertos };
    mount(el, plantilla(E, f));
    const root = el.firstElementChild, cache = new WeakMap();
    const porId = (id) => c.nodos.find((n) => n.id === id);
    const poner = (nodo, contenidoHtml) => { const s = String(contenidoHtml); if (cache.get(nodo) !== s) { cache.set(nodo, s); mount(nodo, contenidoHtml); } };
    const emitir = () => { if (ed && typeof onCambio === 'function') onCambio(limpiar(structuredClone(c))); };

    // Lo derivado: textos calculados y los atributos que colorean el árbol.
    const refrescar = () => {
      for (const nodo of root.querySelectorAll('[data-r]')) { const g = REGIONES[nodo.dataset.r]; if (g) poner(nodo, g({ ...E, id: nodo.dataset.id, fac: nodo.dataset.f })); }
      const m = factorMayorBrecha(c.factores);
      for (const x of root.querySelectorAll('.cau-fac')) if (x.dataset.f) x.dataset.mayor = x.dataset.f === m ? '1' : '0';
      for (const li of root.querySelectorAll('.cau-nodo')) {
        const n = porId(li.dataset.id); if (!n) continue;
        li.dataset.estado = n.estado; li.dataset.alerta = n.estado === 'validada' && !corta(n.evidencia, 300) ? '1' : '0';
      }
      const sin = root.querySelector('.cau-fac-sin'); if (sin) sin.hidden = !c.nodos.some((n) => !n.padre);
    };
    // La forma del árbol: se vuelve a pintar cada rama (solo al agregar o quitar una causa).
    const pintarRamas = () => {
      for (const d of root.querySelectorAll('.cau-ramas')) mount(d, ramas(d.dataset.ramas, E));
      refrescar();
    };
    pintarRamas();

    // El diagrama de solo lectura se pinta al abrirlo y se repinta (sin prisa) cuando algo cambia.
    const det = root.querySelector('.cau-diagrama'), host = root.querySelector('.cau-dg');
    let dg = null, tDg = 0, pidiendo = 0;
    const pintarDiagrama = async () => {
      if (!root.isConnected || !det.open) return;
      const turno = ++pidiendo;
      try {
        const { diagramView } = await import('../diagram-editor.js');
        if (turno !== pidiendo || !root.isConnected || !det.open) return;
        dg?.destroy?.(); host.innerHTML = '';
        dg = diagramView(host, aDiagrama(c), {});
      } catch { mount(host, html`<p class="cau-sd">No pude dibujar el diagrama. El árbol de arriba sigue siendo el mismo.</p>`); }
    };
    const repintarDiagrama = () => { if (!det.open) return; clearTimeout(tDg); tDg = setTimeout(pintarDiagrama, 250); };
    det.addEventListener('toggle', () => { if (det.open) pintarDiagrama(); else { pidiendo++; dg?.destroy?.(); dg = null; host.innerHTML = ''; } });
    // `toggle` no sube: se atiende en la captura para recordar qué paneles de causa están abiertos.
    root.addEventListener('toggle', (e) => { const li = e.target.closest?.('.cau-panel') && e.target.closest('.cau-nodo'); if (li) (e.target.open ? abiertos.add(li.dataset.id) : abiertos.delete(li.dataset.id)); }, true);
    if (!ed) return;

    const alCambiar = (e) => {
      const t = e.target;
      if (!t || !root.contains(t)) return;
      if (t.dataset.n) { const n = porId(t.dataset.n); if (!n || !t.dataset.k) return; n[t.dataset.k] = t.value; }
      else if (t.dataset.c) ponerRuta(c, t.dataset.c, valorDe(t));
      else return;
      emitir(); refrescar(); repintarDiagrama();
    };
    root.addEventListener('input', alCambiar);
    root.addEventListener('change', alCambiar);

    const idNuevo = () => { const usados = new Set([...ECUACION, 'raiz', ...c.nodos.map((n) => n.id)]); let k = c.nodos.length + 1; while (usados.has(`c${k}`)) k++; return `c${k}`; };
    const descendientes = (id) => { const fuera = new Set(); const bajar = (p) => c.nodos.filter((n) => n.padre === p).forEach((n) => { fuera.add(n.id); bajar(n.id); }); bajar(id); return fuera; };
    root.addEventListener('click', async (e) => {
      const b = e.target.closest?.('[data-act]'); if (!b || !root.contains(b)) return;
      if (b.dataset.act === 'cau-add') {
        if (c.nodos.length >= MAX_NODOS) return toast(`El árbol llega hasta ${MAX_NODOS} causas`, true);
        const id = idNuevo(); c.nodos.push({ id, padre: b.dataset.padre || '', texto: '', estado: 'hipotesis', evidencia: '', falta: '', prueba: '', sistema: '' });
        abiertos.add(id); pintarRamas(); emitir(); repintarDiagrama();
        [...root.querySelectorAll('.cau-nodo')].find((li) => li.dataset.id === id)?.querySelector('.cau-nodo-l input')?.focus();
      } else if (b.dataset.act === 'cau-del') {
        const n = porId(b.dataset.id); if (!n) return;
        const fuera = descendientes(n.id);
        if (n.texto || fuera.size) {
          const ok = await confirmAsk(`Quitar «${corta(n.texto, 60) || 'esta causa'}»${fuera.size ? (fuera.size === 1 ? ' y su subcausa' : ` y sus ${fuera.size} subcausas`) : ''} del borrador. Si ya la guardaste, queda en las versiones anteriores.`);
          if (!ok || !root.isConnected) return;
        }
        c.nodos = c.nodos.filter((x) => x.id !== n.id && !fuera.has(x.id)); abiertos.delete(n.id);
        pintarRamas(); emitir(); repintarDiagrama();
        [...root.querySelectorAll('[data-act="cau-add"]')].find((x) => x.dataset.padre === n.padre)?.focus();
      }
    });
  },

  // Una línea para el Overview: la brecha, el factor con más brecha y cuántas causas hay.
  resumen(contenido) {
    const c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {})), b = brecha(c), m = factorMayorBrecha(c.factores), v = c.nodos.filter((n) => n.estado === 'validada').length;
    return html`<span class="cau-res"><span class="chip">${b === null ? `Brecha: ${SIN_DATOS}` : `Brecha: ${miles(b)}`}</span><span class="chip">${m ? `Más brecha: ${nombreFactor(m)}` : `Factor con más brecha: ${SIN_DATOS}`}</span><span class="chip">${c.nodos.length === 1 ? '1 causa' : `${c.nodos.length} causas`} · ${v === 1 ? '1 validada' : `${v} validadas`}</span></span>`;
  },
};
