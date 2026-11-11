// Vista del Offer Architect (herramienta offer-architect de Strategy): arriba, qué oferta se empuja y con qué mensaje; luego la ecuación de
// valor (sueño, probabilidad, tiempo y esfuerzo de 1 a 10, con su evidencia y el valor percibido calculado), el stack Grand Slam, la propuesta
// de valor, 2 o 3 variaciones lado a lado y la escalera del modelo de dinero. El nivel contratado manda (bloqueos() de oferta.js): lo bloqueado
// queda en solo lectura con su candado. Existe para que tool-shell.js pinte el centro de la herramienta con un solo contrato (nuevo, pintar,
// resumen) y para que lo vacío diga «⚠️ SIN DATOS» y de dónde sale. Pinta con html`…` (todo se escapa), lee y escribe con inputs nativos y avisa
// cada cambio con el contenido completo y limpio; lo calculado se recalcula solo sin tocar el campo donde la persona escribe. La aprobación
// no vive aquí: es la del bloque Oferta de Estrategia (solo el CEO), por eso solo se muestra su estado y el camino para aprobarla.
import { html, raw, mount, api, ico } from '../core.js';
import { rutaHerramienta } from '../herramientas.js';
import { SIN_DATOS, corta, numeroONull } from '../consulting/marcos.js';
import { FACTORES, STACK_LISTAS, ESCALERA, MAX_VARIACIONES, vacio, limpiar, valorPercibido, bloqueos } from './oferta.js';

const NOTA_GROWTH = 'Brand Growth: solo eliges qué oferta empujar y su mensaje (la ecuación, el stack, la propuesta y el precio son de Foundation y Partnership)';
const NOTA_ESCALERA = 'Solo en Growth Partnership';
const MAX_LISTA = 12;
// De dónde sale lo que falta (va en el placeholder o en el texto de solo lectura: «⚠️ SIN DATOS: sale de …»).
const SD = {
  oferta: 'una de las ofertas que el cliente ya vende', mensaje: 'la voz de la marca y lo que dicen sus clientes',
  sueno: 'lo que el comprador dice que quiere lograr', probabilidad: 'casos, testimonios y garantía del cliente', tiempo: 'cuánto tarda hoy en verse el primer resultado', esfuerzo: 'lo que el comprador tiene que hacer o dejar de hacer',
  problemas: 'entrevistas y reseñas del cliente', soluciones: 'cada problema: qué hace el cliente para resolverlo', vehiculos: 'cómo entrega hoy: sesión, kit, plataforma…', bonos: 'lo que ya hace y no cobra por separado',
  garantia: 'lo que el cliente puede respaldar', escasez: 'su capacidad real: cupos y fechas', nombre: 'el resultado que promete la propuesta', propuesta: 'el stack y la ecuación de valor',
  variaciones: 'las ofertas y precios que el cliente ya tiene', var_nombre: 'la oferta que el cliente ya vende', var_precio: 'el precio actual del cliente (todo precio es propuesta)', var_para: 'su cliente ideal y sus avatares aprobados', var_dif: 'lo que cambia de una a otra',
  hoy: 'lo que el cliente vende hoy en este escalón', esc_prop: 'los 4 tipos de oferta de Money Models', cita: 'la biblioteca de Hormozi, con el formato del INDEX',
};
const nivelDe = (ctx) => (ctx && typeof ctx === 'object' && ctx.cliente?.nivel?.id) || null;
const varVacia = () => ({ nombre: '', precio: '', para_quien: '', diferencia: '' });
const hayStack = (s) => STACK_LISTAS.some(([k]) => s[k].length) || Boolean(s.garantia || s.escasez || s.nombre);
const hayVars = (vs) => vs.some((v) => Object.values(v).some(Boolean));
const hayEsc = (es) => ESCALERA.some((e) => Object.values(es[e.id]).some(Boolean));
const unir = (xs) => xs.join(', ');
const LISTAS_IDS = STACK_LISTAS.map(([k]) => k);

// El contenido de trabajo: el limpio, con al menos 2 variaciones a la vista (las vacías no se guardan: limpiar() las suelta).
function base(contenido) {
  const c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {}));
  while (c.variaciones.length < 2) c.variaciones.push(varVacia());
  return c;
}
const ponerRuta = (obj, ruta, v) => {
  const p = ruta.split('.'), ultimo = p.pop(); let o = obj;
  for (const k of p) { if (k === '__proto__' || k === 'constructor' || k === 'prototype') return; o = o?.[k]; if (o == null || typeof o !== 'object') return; }
  if (ultimo !== '__proto__' && ultimo !== 'constructor' && ultimo !== 'prototype') o[ultimo] = v;
};

// Los campos: un input nativo si se edita; texto plano (o ⚠️ SIN DATOS con de dónde sale) si es de solo lectura.
function campos(ed) {
  const ro = (valor, sd) => html`<span class="ofa-ro" data-vacio="${valor ? 0 : 1}">${valor || (sd ? `${SIN_DATOS}: sale de ${sd}` : '—')}</span>`;
  const ph = (o) => o.ph || (o.sd ? `${SIN_DATOS}: sale de ${o.sd}` : '');
  return {
    txt: (ruta, valor, o = {}) => (ed ? html`<input class="in" type="text" data-c="${ruta}" value="${valor ?? ''}" maxlength="${o.max || 200}" placeholder="${ph(o)}" aria-label="${o.label || ''}" autocomplete="off" ${o.list ? raw(`list="${o.list}"`) : ''}>` : ro(valor, o.sd)),
    area: (ruta, valor, o = {}) => (ed ? html`<textarea class="in" data-c="${ruta}" rows="${o.filas || 2}" maxlength="${o.max || 400}" placeholder="${ph(o)}" aria-label="${o.label || ''}">${valor ?? ''}</textarea>` : ro(valor, o.sd)),
  };
}

// ---------- Piezas que se vuelven a pintar solas (listas y variaciones: cambian de tamaño) ----------
function lista({ c, ed }, [k, nombre]) {
  const xs = c.stack[k];
  if (!ed) return xs.length ? html`<ul class="ofa-ul">${xs.map((x) => html`<li>${x}</li>`)}</ul>` : html`<p class="ofa-sd">${SIN_DATOS}: sale de ${SD[k]}</p>`;
  const filas = xs.length ? xs : [''];
  return html`${filas.map((x, i) => html`<div class="ofa-it"><input class="in" type="text" data-l="${k}" data-i="${i}" value="${x}" maxlength="200" placeholder="${SIN_DATOS}: sale de ${SD[k]}" aria-label="${nombre}, número ${i + 1}" autocomplete="off">${xs.length ? html`<button type="button" class="btn ghost xs ofa-x" data-of="quitar" data-k="${k}" data-i="${i}" aria-label="Quitar ${nombre} ${i + 1}">${ico('x', 14)}</button>` : ''}</div>`)}
    ${xs.length < MAX_LISTA ? html`<button type="button" class="btn ghost xs ofa-mas" data-of="agregar" data-k="${k}">${ico('plus', 14)} Agregar</button>` : ''}`;
}
function variaciones({ c, ed }, f) {
  const vs = ed ? c.variaciones : c.variaciones.filter((v) => Object.values(v).some(Boolean));
  if (!vs.length) return html`<p class="ofa-sd">${SIN_DATOS}: sale de ${SD.variaciones}</p>`;
  return html`<div class="ofa-cols">${vs.map((v, i) => html`<article class="ofa-var" data-i="${i}">
    <header class="ofa-var-h"><b>Variación ${i + 1}</b>${ed && c.variaciones.length > 2 ? html`<button type="button" class="btn ghost xs ofa-x" data-of="var-quitar" data-i="${i}" aria-label="Quitar la variación ${i + 1}">${ico('x', 14)}</button>` : ''}</header>
    <label class="ofa-f"><span class="lbl">Nombre</span>${f.txt(`variaciones.${i}.nombre`, v.nombre, { max: 80, label: `Variación ${i + 1}: nombre`, sd: SD.var_nombre })}</label>
    <label class="ofa-f"><span class="lbl">Precio <span class="mut sm">(propuesta)</span></span>${f.txt(`variaciones.${i}.precio`, v.precio, { max: 60, label: `Variación ${i + 1}: precio`, sd: SD.var_precio })}</label>
    <label class="ofa-f"><span class="lbl">Para quién</span>${f.area(`variaciones.${i}.para_quien`, v.para_quien, { max: 160, label: `Variación ${i + 1}: para quién`, sd: SD.var_para })}</label>
    <label class="ofa-f"><span class="lbl">Qué la diferencia</span>${f.area(`variaciones.${i}.diferencia`, v.diferencia, { max: 240, label: `Variación ${i + 1}: qué la diferencia`, sd: SD.var_dif })}</label>
  </article>`)}</div>
  ${ed && c.variaciones.length < MAX_VARIACIONES ? html`<button type="button" class="btn ghost xs ofa-mas" data-of="var-agregar">${ico('plus', 14)} Agregar una variación</button>` : ''}`;
}

// ---------- Regiones derivadas: se recalculan solas y nunca contienen un campo editable ----------
const regFactor = ({ c, f }) => {
  const x = c.ecuacion[f];
  return x.valor === null ? html`<span class="ofa-sd">${SIN_DATOS}: sale de ${SD[f]}</span>`
    : html`<b class="ofa-n">${x.valor}</b><span class="mut sm"> / 10</span>${x.evidencia ? '' : html` <span class="ofa-sd">Sin evidencia: sin ella va vacío (${SIN_DATOS})</span>`}`;
};
const regValor = ({ c }) => {
  const v = valorPercibido(c), sin = FACTORES.filter((f) => c.ecuacion[f.id].valor === null), sinEv = FACTORES.filter((f) => c.ecuacion[f.id].valor !== null && !c.ecuacion[f.id].evidencia);
  return html`<div class="ofa-valor-t"><span class="lbl">Valor percibido</span>${v === null ? html`<span class="ofa-sd">${SIN_DATOS}: falta ${unir(sin.map((f) => f.nombre))}</span>` : html`<b class="ofa-valor-n">${v}</b>`}</div>
    <p class="mut sm">(sueño × probabilidad) / (tiempo × esfuerzo). Se calcula con los 4 factores: sin uno de ellos no hay número, nunca un cero.</p>
    ${sinEv.length ? html`<p class="ofa-sd">Falta evidencia en ${unir(sinEv.map((f) => f.nombre))}: sin evidencia el factor va vacío (${SIN_DATOS}).</p>` : ''}`;
};
const regVarsN = ({ c }) => { const n = c.variaciones.filter((v) => v.nombre).length; return html`${n} de ${MAX_VARIACIONES} con nombre${n < 2 ? html` · <span class="ofa-sd">se piden al menos 2</span>` : ''}`; };
// Las ofertas que ya tiene el cliente en esta pantalla: sugerencias para «qué oferta empujar» (el campo sigue siendo libre).
const regOfertas = ({ c }) => html`${[...new Set([...c.variaciones.map((v) => v.nombre), c.stack.nombre].filter(Boolean))].map((x) => html`<option value="${x}"></option>`)}`;
const REGIONES = { fac: regFactor, valor: regValor, 'vars-n': regVarsN, ofertas: regOfertas };

// ---------- La vista ----------
function plantilla(E, f) {
  const { c, ed, bq, nivel } = E;
  const fS = campos(ed && !bq.stack), fV = campos(ed && !bq.variaciones), fE = campos(ed && !bq.escalera), fEc = campos(ed && !bq.ecuacion), fP = campos(ed && !bq.propuesta);
  const vEd = { ...E, ed: ed && !bq.variaciones }, sEd = { ...E, ed: ed && !bq.stack };
  const cand = (txt) => html`<p class="ofa-cand" role="note">${ico('lock', 14)} ${txt}</p>`;
  return html`<div class="ofa" data-nivel="${nivel || ''}" data-editable="${ed ? 1 : 0}">
    <p class="ofa-aprueba" role="note">${ico('badge-check', 14)} Se aprueba con el bloque Oferta (solo el CEO).<span class="ofa-bloque" data-r="bloque"></span></p>
    ${nivel === 'growth' ? html`<p class="ofa-nivel" role="note">${ico('lock', 14)} ${NOTA_GROWTH}</p>` : ''}

    <section class="ofa-sec ofa-empujar" aria-label="Qué oferta empujar">
      <h3 class="ofa-t">${ico('rocket', 16)} Qué oferta empujar y con qué mensaje <span class="mut sm">una de las que el cliente ya vende</span></h3>
      <div class="ofa-fila">
        <label class="ofa-f"><span class="lbl">Oferta que se empuja</span>${f.txt('empujar.oferta', c.empujar.oferta, { max: 160, label: 'Oferta que se empuja', sd: SD.oferta, list: 'ofa-ofertas' })}</label>
        <label class="ofa-f ofa-f-ancho"><span class="lbl">Mensaje</span>${f.area('empujar.mensaje', c.empujar.mensaje, { max: 400, filas: 3, label: 'Mensaje de la oferta que se empuja', sd: SD.mensaje })}</label>
      </div>
      <datalist id="ofa-ofertas" data-r="ofertas"></datalist>
    </section>

    <section class="ofa-sec ofa-ec" aria-label="Ecuación de valor">
      <h3 class="ofa-t">${ico('target', 16)} Ecuación de valor <span class="mut sm">cada factor de 1 a 10, con su evidencia</span></h3>
      <div class="ofa-facs">${FACTORES.map((fa) => html`<article class="ofa-fac" data-f="${fa.id}" data-lado="${fa.lado}">
        <header class="ofa-fac-h"><b>${fa.nombre}</b><span class="ofa-lado mut sm">${fa.lado === 'arriba' ? 'Suma valor' : 'Resta valor'}</span></header>
        <p class="mut sm ofa-fac-ayuda">${fa.ayuda}</p>
        ${ed && !bq.ecuacion ? html`<div class="ofa-rango"><input type="range" min="1" max="10" step="1" value="${c.ecuacion[fa.id].valor ?? 5}" data-c="ecuacion.${fa.id}.valor" data-tipo="num" data-vacio="${c.ecuacion[fa.id].valor === null ? 1 : 0}" aria-label="${fa.nombre}, de 1 a 10"><button type="button" class="btn ghost xs" data-of="sin-dato" data-f="${fa.id}">Sin dato</button></div>` : ''}
        <div class="ofa-num" data-r="fac" data-f="${fa.id}" aria-live="polite"></div>
        <label class="ofa-f"><span class="lbl">Evidencia</span>${fEc.area(`ecuacion.${fa.id}.evidencia`, c.ecuacion[fa.id].evidencia, { max: 300, label: `Evidencia de ${fa.nombre}`, ph: 'De dónde sale este número', sd: SD[fa.id] })}</label>
      </article>`)}</div>
      <div class="ofa-valor" data-r="valor" aria-live="polite"></div>
    </section>

    <section class="ofa-sec ofa-stack" data-bloq="${bq.stack ? 1 : 0}" aria-label="Stack Grand Slam">
      <h3 class="ofa-t">${ico('layers', 16)} Stack Grand Slam <span class="mut sm">problemas → soluciones → vehículos de entrega, bonos, garantía, escasez y nombre</span></h3>
      ${bq.stack ? cand(NOTA_GROWTH) : ''}
      ${bq.stack && !hayStack(c.stack) ? '' : html`<div class="ofa-listas">${STACK_LISTAS.map((d) => html`<div class="ofa-lista" data-k="${d[0]}"><h4>${d[1]}</h4><div data-lista="${d[0]}">${lista(sEd, d)}</div></div>`)}</div>
      <div class="ofa-fila">
        <label class="ofa-f"><span class="lbl">Garantía</span>${fS.area('stack.garantia', c.stack.garantia, { max: 300, label: 'Garantía', sd: SD.garantia })}</label>
        <label class="ofa-f"><span class="lbl">Escasez</span>${fS.area('stack.escasez', c.stack.escasez, { max: 300, label: 'Escasez', sd: SD.escasez })}</label>
        <label class="ofa-f"><span class="lbl">Nombre del stack</span>${fS.txt('stack.nombre', c.stack.nombre, { max: 120, label: 'Nombre del stack', sd: SD.nombre })}</label>
      </div>`}
    </section>

    <section class="ofa-sec ofa-propuesta" aria-label="Propuesta de valor">
      <h3 class="ofa-t">${ico('sparkles', 16)} Propuesta de valor <span class="mut sm">una o dos frases</span></h3>
      <label class="ofa-f"><span class="sr-only">Propuesta de valor</span>${fP.area('propuesta', c.propuesta, { max: 500, filas: 3, label: 'Propuesta de valor', sd: SD.propuesta })}</label>
    </section>

    <section class="ofa-sec ofa-vars" data-bloq="${bq.variaciones ? 1 : 0}" aria-label="Variaciones de la oferta">
      <h3 class="ofa-t">${ico('list-checks', 16)} Variaciones <span class="mut sm">2 o 3 lado a lado${bq.variaciones ? '' : html` · <span data-r="vars-n"></span>`}</span></h3>
      <p class="ofa-nota mut sm">Todo precio es una propuesta: se escala al CEO.</p>
      ${bq.variaciones ? cand(NOTA_GROWTH) : ''}
      ${bq.variaciones && !hayVars(c.variaciones) ? '' : html`<div data-vars>${variaciones(vEd, fV)}</div>`}
    </section>

    <section class="ofa-sec ofa-esc" data-bloq="${bq.escalera ? 1 : 0}" aria-label="Escalera del modelo de dinero">
      <h3 class="ofa-t">${ico('arrow-right', 16)} Escalera del modelo de dinero <span class="mut sm">atracción, upsell, downsell y continuidad</span></h3>
      ${bq.escalera ? cand(NOTA_ESCALERA) : ''}
      ${bq.escalera && !hayEsc(c.escalera) ? '' : html`<div class="ofa-pasos">${ESCALERA.map((e) => html`<article class="ofa-paso" data-e="${e.id}">
        <h4>${e.nombre}</h4><p class="mut sm">${e.que}</p>
        <label class="ofa-f"><span class="lbl">Hoy</span>${fE.area(`escalera.${e.id}.hoy`, c.escalera[e.id].hoy, { max: 240, label: `${e.nombre}: lo que hay hoy`, sd: SD.hoy })}</label>
        <label class="ofa-f"><span class="lbl">Propuesta</span>${fE.area(`escalera.${e.id}.propuesta`, c.escalera[e.id].propuesta, { max: 300, label: `${e.nombre}: propuesta`, sd: SD.esc_prop })}</label>
        <label class="ofa-f"><span class="lbl">Cita</span>${fE.txt(`escalera.${e.id}.cita`, c.escalera[e.id].cita, { max: 240, label: `${e.nombre}: cita`, ph: '[$100M MONEY MODELS | capítulo | pág. PDF N]', sd: SD.cita })}</label>
      </article>`)}</div>`}
    </section>
  </div>`;
}

export const vista = {
  // El contenido inicial: todo vacío (⚠️ SIN DATOS), sin ceros inventados.
  nuevo() { return vacio(); },

  pintar(el, { contenido, editable, onCambio, ctx, me, slug } = {}) {
    const c = base(contenido), nivel = nivelDe(ctx), bq = bloqueos(nivel), ed = Boolean(editable), E = { c, ed, bq, nivel };
    mount(el, plantilla(E, campos(ed)));
    const root = el.firstElementChild, cache = new WeakMap();
    const poner = (nodo, contenidoHtml) => { const s = String(contenidoHtml); if (cache.get(nodo) !== s) { cache.set(nodo, s); mount(nodo, contenidoHtml); } };
    // Recalcula lo derivado (solo reemplaza lo que cambió, y nunca un campo editable).
    const refrescar = () => {
      for (const nodo of root.querySelectorAll('[data-r]')) { const fn = REGIONES[nodo.dataset.r]; if (fn) poner(nodo, fn({ ...E, f: nodo.dataset.f })); }
      for (const r of root.querySelectorAll('input[type="range"][data-c]')) r.dataset.vacio = c.ecuacion[r.dataset.c.split('.')[1]]?.valor === null ? '1' : '0';
    };
    refrescar();

    // El bloque Oferta de Estrategia manda sobre la aprobación: aquí solo se dice en qué estado está y por dónde se aprueba o se reabre.
    // Aprobado (oferta o modelo), el servidor no deja cambiar el contenido (409): la vista se apaga para no pedir lo que no se puede.
    (async () => {
      if (!slug) return;
      const tok = (el._ofaTok = Symbol());
      let d; try { d = await api(`estrategia/${encodeURIComponent(slug)}`); } catch { return; }
      if (el._ofaTok !== tok || !el.isConnected) return;
      const nodo = root.querySelector('[data-r="bloque"]'); if (!nodo) return;
      const ap = [['oferta', 'Oferta'], ['modelo', 'Modelo de dinero']].filter(([id]) => (d.bloques || []).find((b) => b.id === id)?.estado === 'aprobado').map((x) => x[1]);
      const ceo = me?.role === 'ceo', ruta = rutaHerramienta('strategy', slug, 'offer-architect', ['chat']);
      mount(nodo, ap.length ? html` Aprobado: ${unir(ap)}. ${ceo ? html`<a href="${ruta}">Reabrir en el bloque</a>` : 'El CEO lo reabre para cambiarlo.'}` : ceo ? html` <a href="${ruta}">Aprobar en el bloque Oferta</a>` : '');
      root.dataset.aprobado = ap.length ? '1' : '0';
      if (ap.length && ed) for (const x of root.querySelectorAll('input,textarea,select,button[data-of]')) x.disabled = true;
    })();
    if (!ed) return;

    const emitir = () => { if (typeof onCambio === 'function') onCambio(limpiar(structuredClone(c))); };
    const alCambiar = (e) => {
      const t = e.target;
      if (!t || !root.contains(t)) return;
      if (t.dataset.l) { const xs = c.stack[t.dataset.l]; if (!Array.isArray(xs) || !LISTAS_IDS.includes(t.dataset.l)) return; xs[Number(t.dataset.i)] = t.value; }
      else if (t.dataset.c) { ponerRuta(c, t.dataset.c, t.dataset.tipo === 'num' ? numeroONull(t.value) : t.value); }
      else return;
      emitir(); refrescar();
    };
    root.addEventListener('input', alCambiar);
    root.addEventListener('change', alCambiar);

    const lisDe = (k) => STACK_LISTAS.find((d) => d[0] === k);
    const pintarLista = (k) => { const nodo = root.querySelector(`[data-lista="${k}"]`), d = lisDe(k); if (nodo && d) mount(nodo, lista({ ...E, ed: !bq.stack }, d)); };
    const pintarVars = () => { const nodo = root.querySelector('[data-vars]'); if (nodo) mount(nodo, variaciones({ ...E, ed: !bq.variaciones }, campos(!bq.variaciones))); };
    root.addEventListener('click', (e) => {
      const t = e.target.closest?.('[data-of]');
      if (!t) { // un clic en un rango sin dato lo fija en el valor que marca (no se inventa un 5: la persona lo eligió)
        const r = e.target.closest?.('input[type="range"][data-vacio="1"]');
        if (r && root.contains(r)) { ponerRuta(c, r.dataset.c, numeroONull(r.value)); emitir(); refrescar(); }
        return;
      }
      if (!root.contains(t)) return;
      const k = t.dataset.k, i = Number(t.dataset.i);
      switch (t.dataset.of) {
        case 'sin-dato': {
          const x = c.ecuacion[t.dataset.f]; if (!x) return;
          x.valor = null; const r = root.querySelector(`input[type="range"][data-c="ecuacion.${t.dataset.f}.valor"]`); if (r) r.value = 5;
          emitir(); refrescar(); break;
        }
        case 'agregar': {
          const xs = c.stack[k]; if (!Array.isArray(xs) || !LISTAS_IDS.includes(k) || xs.length >= MAX_LISTA) return;
          if (!xs.length) xs.push('');
          xs.push(''); pintarLista(k); root.querySelector(`[data-l="${k}"][data-i="${xs.length - 1}"]`)?.focus(); break;
        }
        case 'quitar': {
          const xs = c.stack[k]; if (!Array.isArray(xs) || !LISTAS_IDS.includes(k)) return;
          xs.splice(i, 1); pintarLista(k); emitir(); refrescar();
          (root.querySelector(`[data-l="${k}"][data-i="${Math.min(i, xs.length - 1)}"]`) || root.querySelector(`[data-of="agregar"][data-k="${k}"]`))?.focus(); break;
        }
        case 'var-agregar': {
          if (c.variaciones.length >= MAX_VARIACIONES) return;
          c.variaciones.push(varVacia()); pintarVars(); refrescar(); root.querySelector(`[data-c="variaciones.${c.variaciones.length - 1}.nombre"]`)?.focus(); break;
        }
        case 'var-quitar': {
          if (c.variaciones.length <= 2 || !(i >= 0 && i < c.variaciones.length)) return;
          c.variaciones.splice(i, 1); pintarVars(); emitir(); refrescar();
          (root.querySelector(`[data-c="variaciones.${Math.min(i, c.variaciones.length - 1)}.nombre"]`) || root.querySelector('[data-of="var-agregar"]'))?.focus(); break;
        }
      }
    });
  },

  // Una línea para el Overview y para la propuesta de la IA: la propuesta (o lo que se empuja) y el nombre del stack.
  resumen(contenido) {
    const c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {}));
    const texto = c.propuesta ? corta(c.propuesta, 160) : c.empujar.oferta ? `Empuja «${c.empujar.oferta}»${c.empujar.mensaje ? `: ${corta(c.empujar.mensaje, 120)}` : ''}` : `Propuesta: ${SIN_DATOS}`;
    return html`<span class="ofa-res"><span class="ofa-res-p">${texto}</span><span class="chip">${c.stack.nombre ? `Stack: ${c.stack.nombre}` : `Stack: ${SIN_DATOS}`}</span></span>`;
  },
};
