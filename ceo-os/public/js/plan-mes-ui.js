// Marca › Crear › Plan del mes y Marketing › Content › Content Strategy Studio (monta 'plan'). El plan de ③ Marketing de cada mes, editable:
// la idea del mes, el mensaje por nivel de consciencia, los pilares (barras que suman 100), los canales y las piezas en una grilla semana × canal,
// con el techo de la ficha y los avisos de revisarSlots a la vista ANTES de «Pasar a Ideas». «Generar con IA» (correrIA, bloque plan) NO escribe:
// muestra un diff por sección y solo lo que la persona acepta se guarda, por el PUT de siempre (plan/:slug/:mes, con la v que se leyó).
// Sin estrategia aprobada el plan está cerrado (el servidor da 409). planPanel (solo lectura) y pasarPlan los sigue usando el chat de Diseño.
// Rutas: #/ws/marketing/<marca>/content/content-strategy-studio[/<AAAA-MM>] (lo monta screens/workspace.js); las viejas #/marcas/<marca>/plan[/<mes>] son alias.
import { html, raw, mount, api, toast, ico, confirmAsk, ask, acts, skel, techDetail, $, $$ } from './core.js';
import { nombreMes, mesOk, revisarSlots, sumaPilares, avancePlan, SECCIONES_P, NOMBRE_P, FUNCIONES, TEMPERATURAS, CONSCIENCIAS, BALANCES, MAX_SEMANAS, BLOQUE_P,
  limpiarPlan, leerPlan, difPlan, detalleDif, resumenDif, ajustarA100, funcionesRepetidas, idSlotNuevo, mensajeEnNiveles, nivelesAMensaje, leerTecho, avisosPlan, revisarParaIdeas, estrategiaTexto, promptStudio } from './plan-mes.js';
import { FORMATOS } from './calendario-contenido.js';
import { leerTarjetas } from './llm/modos.js';
import { armarCtx, correrIA } from './ia-herramienta.js';
import { docHtml } from './artifact.js';
import { abrirEnChat } from './areas.js';
import { rutaModulo, rutaHerramienta, herramientaDe, veEstrategia } from './herramientas.js';
import { vacio as vacioOS, fallo } from './visual.js';

const PILAR_C = ['#2a1f17', '#8a6a50', '#c9b39b', '#5d7a46', '#3f6ea8', '#b4472f'];
export const mesDe = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const mesesPlan = (hoy = new Date()) => [mesDe(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)), mesDe(hoy), mesDe(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1))];

// El panel del plan (lo usan la herramienta y el chat), como artifact (artifact.js).
// o = { b, mes, plan, piezas, edit, fresh, pasando, cerrar (en el chat), abrir: [href, texto] }
export function planPanel(o) {
  const p = o.plan || {}, mes = o.mes, fresh = o.fresh || [], n = avancePlan(p), fr = (k) => (fresh.includes(k) ? 'fresh' : '');
  const avisos = revisarSlots(p.slots || [], p.canales || []), aviso = (id) => avisos.find((a) => a.id === id)?.avisos || [];
  const suma = sumaPilares(p.pilares || []);
  const vacio = (t) => html`<p class="ev-vacio">${t}</p>`;
  const Mes = nombreMes(mes).replace(/^./, (c) => c.toUpperCase());
  const estado = o.piezas ? 'En Ideas' : n ? `Borrador · ${n} de 5` : 'Vacío';
  const traza = (t) => (t ? `Traza a la estrategia: ${t}` : '');
  const cuerpo = html`
      <section class="ev-sec ${fr('campana')}"><p class="ad-lb">La idea del mes${p.campana?.tipo ? ` · ${p.campana.tipo === 'pilar' ? 'Pilar' : 'Campaña'}` : ''}</p>
        ${p.campana?.nombre ? html`<h2 class="ad-big">«${p.campana.nombre}»</h2>` : ''}
        ${p.campana?.idea ? html`<p class="ad-q">${p.campana.idea}${p.campana.meta || p.campana.traza ? html` <small>${[p.campana.meta ? `Meta: ${p.campana.meta}` : '', traza(p.campana.traza)].filter(Boolean).join(' · ')}</small>` : ''}</p>` : vacio('Marketing decide si el mes es campaña (un mensaje que tiene que llegar) o pilar (lo de siempre), y la idea que lo amarra.')}</section>
      <section class="ev-sec ${fr('mensaje')}"><p class="ad-lb">El mensaje, en orden</p>${p.mensaje?.length ? html`<div class="ev-g3">${p.mensaje.map((m, i) => html`<div class="ev-c"><span class="lbl" style="margin:0">${i + 1}</span><b>${m.titulo}</b>${m.consciencia ? html`<small class="mut">${m.consciencia}</small>` : ''}${m.para ? html`<small class="mut">${m.para}</small>` : ''}</div>`)}</div>` : vacio('Qué se dice primero, qué lo prueba y qué se pide.')}</section>
      <section class="ev-sec ${fr('pilares')}"><p class="ad-lb">Los pilares y su peso${p.pilares?.length && suma !== 100 ? html` <span class="pm-warn">Suman ${suma}%, no 100%</span>` : ''}</p>${p.pilares?.length ? html`<div class="pm-pbar">${p.pilares.map((x, i) => html`<i style="width:${suma ? (x.peso / Math.max(suma, 100)) * 100 : 0}%;background:${PILAR_C[i % PILAR_C.length]}"></i>`)}</div><div class="pm-leg">${p.pilares.map((x, i) => html`<span title="${x.para || ''}"><i style="background:${PILAR_C[i % PILAR_C.length]}"></i>${x.nombre} ${x.peso}%</span>`)}</div>` : vacio('De qué se habla y cuánto pesa cada tema en el mes.')}</section>
      <section class="ev-sec ${fr('canales')}"><p class="ad-lb">Cada canal, su función</p>${p.canales?.length ? html`<div class="ev-g3">${p.canales.map((c) => html`<div class="ev-c"><b>${c.canal}</b><small class="mut">${[c.funcion, c.frecuencia, c.formatos].filter(Boolean).join(' · ')}</small>${c.no ? html`<small class="mut">No: ${c.no}</small>` : ''}</div>`)}</div>` : vacio('Para qué sirve cada canal y qué no se hace ahí. Dos canales con la misma función: sobra uno.')}</section>
      <section class="ev-sec ${fr('slots')}"><p class="ad-lb">Las piezas del mes${p.slots?.length ? ` · ${p.slots.length}` : ''}${avisos.length ? html` <span class="pm-warn">${avisos.length} por revisar</span>` : ''}</p>
        ${p.slots?.length ? html`<div class="pm-tbl"><table><thead><tr><th>Sem.</th><th>Canal</th><th>Formato</th><th>Función</th><th>A quién</th><th>Consciencia</th><th>Para qué</th><th>Traza a</th></tr></thead><tbody>${p.slots.map((s) => html`<tr class="${aviso(s.id).length ? 'mal' : ''}"><td>${s.semana}</td><td>${s.canal}</td><td>${s.formato}</td><td>${s.funcion ? html`<span class="pm-tag">${s.funcion}</span>` : ''}</td><td>${s.temperatura}</td><td>${s.consciencia}</td><td>${s.objetivo}${aviso(s.id).map((a) => html`<small class="pm-warn">${a}</small>`)}</td><td>${s.traza}</td></tr>`)}</tbody></table></div>` : vacio('Una fila por pieza: semana, canal, formato y el trabajo que hace. El día exacto lo pone Creatividad.')}</section>`;
  return docHtml({ ic: 'target', titulo: `Plan de ${Mes} · ③ Marketing`, sub: o.b.name, estado, ok: Boolean(o.piezas), cerrar: o.cerrar,
    acciones: o.abrir ? html`<a class="btn ghost sm" href="${o.abrir[0]}" ${o.abrir[2] ? raw(`data-etapa="${o.abrir[2]}"`) : ''}>${ico(o.abrir[2] ? 'spark' : 'link', 12)} ${o.abrir[1]}</a>` : '',
    prog: SECCIONES_P.map((k) => [NOMBRE_P[k].replace(/^(La|El|Los|Las) /, '').replace(/^./, (c) => c.toUpperCase()), Boolean(k === 'campana' ? p.campana?.nombre : p[k]?.length)]),
    cuerpo,
    pie: { texto: o.piezas ? `${o.piezas} pieza${o.piezas === 1 ? '' : 's'} de este plan ya están en Ideas.` : 'Marketing decide qué se dice, dónde y cuándo. Las piezas las escribe Creatividad.',
      accion: html`${o.piezas ? html`<a class="btn ghost sm" href="${rutaModulo(o.b.slug, 'ideas')}">Ver en Ideas</a>` : ''}${p.slots?.length && o.edit ? html`<button class="btn" data-act="pasar" ${o.pasando ? raw('disabled') : ''}>${o.pasando ? 'Pasando…' : `${o.piezas ? 'Poner al día' : 'Pasar'} ${p.slots.length} piezas a Ideas`} ${ico('right', 13)}</button>` : ''}` } });
}
// «Pasar a Creatividad»: cada slot queda como pieza del calendario. Devuelve cuántas quedaron, o null.
// opts.techo (leerTecho): con él, lo que pasa el techo se marca FUERA DEL ALCANCE y se pide confirmar (el chat de Diseño no lo pasa: no cambia).
export async function pasarPlan(b, mes, plan, { techo = null } = {}) {
  const avisos = avisosPlan(plan, techo), fuera = avisos.filter((a) => a.fuera).length;
  if (avisos.length && !(await confirmAsk(`${avisos.length} slot${avisos.length === 1 ? '' : 's'} tienen algo por revisar (se marcan en rojo)${fuera ? `; ${fuera} pasa${fuera === 1 ? '' : 'n'} el techo del alcance: FUERA DEL ALCANCE, escálalo al CEO` : ''}. ¿Los paso así a Creatividad?`))) return null;
  try { const { prepararContenido } = await import('./content-policy-ui.js'); const source = await prepararContenido({ kind: 'post', profile: b.slug, date: `${mes}-01`, status: 'Idea' }); const r = await api(`plan/${encodeURIComponent(b.slug)}/${mes}/a-creatividad`, { method: 'POST', body: { viene_de: source.viene_de } }); toast(r.nuevas ? `${r.nuevas} piezas nuevas en el calendario${r.puestas ? ` · ${r.puestas} puestas al día` : ''}` : `${r.puestas} piezas puestas al día`); return r.nuevas + r.puestas; }
  catch (e) { toast(e.message, true); return null; }
}

// ---------- Content Strategy Studio ----------
const SEC_NOMBRE = { campana: 'la idea del mes', mensaje: 'el mensaje', pilares: 'los pilares', canales: 'los canales', slots: 'las piezas' };
const ETQ = { nombre: 'Nombre', idea: 'Idea', tipo: 'Tipo', meta: 'Meta', traza: 'Traza', titulo: 'Mensaje', para: 'Para qué', consciencia: 'Consciencia', peso: 'Peso', canal: 'Canal', funcion: 'Función', frecuencia: 'Frecuencia', formatos: 'Formatos', no: 'No se hace', semana: 'Semana', formato: 'Formato', pilar: 'Pilar', temperatura: 'A quién', balance: 'Balance', objetivo: 'Para qué' };
const MAX_CAN = { canal: 40, funcion: 120, frecuencia: 80, formatos: 80, no: 160 };
const MAX_LISTA = { pilares: 6, canales: 8 };
const MAX_FILAS_DIF = 30; // filas que muestra el diff por sección (el resto se cuenta)
const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
const corto = (v, n = 70) => { const s = String(v ?? '').replace(/\s+/g, ' ').trim(); return s ? (s.length > n ? `${s.slice(0, n - 1)}…` : s) : '—'; };
const clon = (x) => JSON.parse(JSON.stringify(x));
const vacioDe = (k) => (k === 'campana' ? {} : []);
// Una fila de una lista en una frase (para el diff).
const filaTexto = (k, x) => (k === 'mensaje' ? `${x.consciencia ? `${x.consciencia}: ` : ''}${corto(x.titulo)}`
  : k === 'pilares' ? `${x.nombre} · ${x.peso}%`
  : k === 'canales' ? `${x.canal}${x.funcion ? ` · ${corto(x.funcion, 40)}` : ''}`
  : `${x.id} · Sem. ${x.semana} · ${x.canal}${x.formato ? ` · ${x.formato}` : ''}${x.funcion ? ` · ${x.funcion}` : ''}`);

// host: dónde se monta · me: quien mira · b: la marca · alive(): ¿sigue en pantalla? · resto (o rest): lo que viene en la ruta (el mes).
export async function planMesUI(el, { me, b, alive, rest = [], resto } = {}) {
  el.dataset.island = '1';
  const slug = b.slug, enc = encodeURIComponent, meses = mesesPlan();
  const r0 = (resto ?? rest)[0], mes = mesOk(r0) ? r0 : meses[1];
  if (b.personal) return mount(el, html`${vacioOS({ icono: 'inbox', titulo: 'El plan del mes es de las marcas de clientes', linea: 'La marca personal no lleva plan.' })}`);
  mount(el, skel('pagina'));
  const url = `plan/${enc(slug)}/${mes}`;
  let d, est = null;
  try { [d, est] = await Promise.all([api(url), api(`estrategia/${enc(slug)}`).catch(() => null)]); } // la ficha vive en Estrategia: sin ese permiso queda «SIN DATOS»
  catch (e) { if (!alive()) return; return mount(el, html`${fallo({ titulo: 'No pude abrir el plan', linea: e.message, detalle: techDetail(e) })}`); }
  if (!alive()) return;

  // saved: lo que hay en el servidor (con su v) · borr: las secciones que la persona tocó (copias, sin guardar) · mn: las filas del mensaje por nivel
  const S = { saved: d.plan || {}, borr: {}, mn: null, piezas: d.piezas || 0, aprobada: Boolean(d.estrategia?.aprobada), puede: Boolean(d.puede?.editar), est, sel: '', gen: null, ocupado: false, pasando: false };
  const TOOL = { id: 'content-strategy-studio', ws: 'marketing', nombre: 'Content Strategy Studio', ...(herramientaDe('content-strategy-studio') || {}), prompt: promptStudio, bloque: BLOQUE_P };
  let root = null;

  // ---------- Lo que hay y lo que se puede hacer ----------
  const norm = (k, v) => limpiarPlan({ [k]: v })[k] ?? (k === 'campana' ? null : []);
  const valor = (k) => (k in S.borr ? S.borr[k] : (S.saved[k] ?? vacioDe(k)));
  const real = (k) => k in S.borr && JSON.stringify(norm(k, S.borr[k])) !== JSON.stringify(norm(k, S.saved[k]));
  const sucias = () => SECCIONES_P.filter(real);
  const planN = () => limpiarPlan(Object.fromEntries(SECCIONES_P.map((k) => [k, valor(k)])));
  const editable = () => S.puede && S.aprobada;
  const T = () => leerTecho({ ficha: S.est?.ficha, viva: S.est?.viva });
  const sinFicha = () => slug !== 'inherent' && T().hayFicha === false;
  const dis = () => (editable() ? '' : raw('disabled'));
  const yaPaso = (id) => S.piezas > 0 && (S.saved.slots || []).some((x) => x.id === id); // ya es una pieza del calendario: no se quita del plan
  // Una sección se edita sobre una copia; nada llega al servidor hasta Guardar o Aceptar.
  function editar(k, fn) { const v = k in S.borr ? S.borr[k] : clon(S.saved[k] ?? vacioDe(k)); fn(v); S.borr[k] = v; }
  const mn = () => (S.mn ||= mensajeEnNiveles(norm('mensaje', valor('mensaje'))));
  function editarMn(fn) { fn(mn()); S.borr.mensaje = nivelesAMensaje(S.mn.niveles, S.mn.sinNivel); }
  // Lo que el servidor dijo hoy (después de pasar el plan o de un conflicto).
  function tomar(x) {
    S.saved = x.plan || {}; S.piezas = x.piezas || 0; S.aprobada = Boolean(x.estrategia?.aprobada); S.puede = Boolean(x.puede?.editar);
    if (!('mensaje' in S.borr)) S.mn = null;
  }

  // ---------- Errores y envoltura de acciones ----------
  function falla(e) {
    if (e?.name === 'AbortError') return;
    if (e?.status === 409 && e.code === 'SIN_ESTRATEGIA') { S.aprobada = false; toast(e.message, true); return pintarTodo(); }
    toast(e?.message || 'No se pudo completar. Inténtalo de nuevo.', true);
    if (e?.status === 409 && !e.visto) recargar();
  }
  async function haz(fn) {
    if (S.ocupado) return;
    S.ocupado = true; pintarActs();
    try { await fn(); } catch (e) { if (alive()) falla(e); } finally { S.ocupado = false; if (alive()) pintarActs(); }
  }
  async function recargar() { try { const x = await api(url); if (!alive()) return; tomar(x); pintarTodo(); } catch { /* se queda con lo que tiene */ } }
  // Cada escritura lleva la v que se leyó: se vuelve a leer justo antes y, si alguien cambió el plan, no se pisa (409). El servidor recibe la misma v.
  async function escribir(parche) {
    const f = await api(url);
    if (!f.estrategia?.aprobada) {
      if (alive()) { tomar(f); pintarTodo(); }
      throw Object.assign(new Error('La estrategia dejó de estar aprobada: el plan está cerrado. Tus cambios siguen aquí sin guardar.'), { status: 409, code: 'SIN_ESTRATEGIA', visto: true });
    }
    if ((f.plan?.v ?? null) !== (S.saved.v ?? null)) {
      if (alive()) { tomar(f); pintarTodo(); }
      throw Object.assign(new Error('Alguien cambió el plan justo ahora. Lo recargué: tus cambios siguen aquí sin guardar. Revisa y vuelve a intentar.'), { status: 409, code: 'CONFLICTO', visto: true });
    }
    return api(url, { method: 'PUT', body: { parche, v: S.saved.v } });
  }

  // ---------- Pintar ----------
  const vacio = (t) => html`<p class="ev-vacio">${t}</p>`;
  const sinG = (k) => html`<span class="chip sm2 pcs-sin" data-sin="${k}" ${real(k) ? '' : raw('hidden')}>Sin guardar</span>`;
  const cab = (k, titulo, extra = '') => html`<header class="pcs-sec-h"><h3>${titulo} ${sinG(k)}</h3>${extra}</header>`;
  const marcas = () => $$('[data-sin]', root).forEach((n) => { n.hidden = !real(n.dataset.sin); });
  const cambio = () => { marcas(); pintarActs(); pintarTecho(); };

  function pintarTop() {
    mount($('#pcs-top', root), html`<div class="tabs" style="margin:0">${meses.map((x) => html`<a class="${x === mes ? 'on' : ''}" href="${rutaModulo(slug, 'plan', [x])}">${nombreMes(x).replace(/^./, (c) => c.toUpperCase())}</a>`)}</div><span class="sp"></span>
      ${S.piezas ? html`<span class="chip sm2">${S.piezas} pieza${S.piezas === 1 ? '' : 's'} en Ideas</span>` : ''}`);
  }
  // El candado: sin estrategia aprobada el servidor rechaza (409); sin ficha de oferta no hay techo y el plan no pasa a Ideas.
  function pintarBanner() {
    const el = $('#pcs-banner', root);
    if (!S.aprobada) return mount(el, html`<div class="pcs-ban" role="status">${ico('lock', 15)}<div><b>El plan está cerrado: la estrategia de ${b.name} todavía no está aprobada.</b>
      <span>Sin estrategia aprobada no hay plan y el servidor no deja guardar (409). La aprueba el CEO${veEstrategia(me) ? html` en <a href="${rutaHerramienta('strategy', slug, 'growth-roadmap')}">Strategy › Growth Roadmap</a>` : ''}.</span></div></div>`);
    if (sinFicha()) return mount(el, html`<div class="pcs-ban" role="status">${ico('lock', 15)}<div><b>${b.name} no tiene ficha de oferta.</b><span>El alcance contratado es el techo: sin la ficha no hay techo que medir y el plan no pasa a Ideas. La ficha se crea en Estrategia (solo el CEO).</span></div></div>`);
    mount(el, '');
  }
  function pintarActs() {
    const ed = editable(), corriendo = S.gen?.fase === 'corriendo', ks = sucias(), busy = S.ocupado || S.pasando;
    const rev = revisarParaIdeas(S.saved, { techo: T(), sinFicha: sinFicha() }), n = (S.saved.slots || []).length;
    const motivos = !S.aprobada ? ['La estrategia no está aprobada'] : ks.length ? ['Guarda tus cambios primero'] : rev.bloquea;
    const dn = (x) => (x ? raw('disabled') : '');
    mount($('#pcs-acts', root), html`
      <div class="pcs-grp">${S.puede ? html`<button type="button" class="btn" data-act="pcs-generar" ${dn(!ed || corriendo || busy)}>${ico('sparkles', 14)} Generar con IA</button>
        <button type="button" class="btn ghost" data-act="pcs-guardar" ${dn(!ed || !ks.length || busy)}>${ico('check', 14)} Guardar${ks.length ? ` (${ks.length})` : ''}</button>
        <button type="button" class="btn ghost" data-act="pcs-descartar" ${dn(!ed || !Object.keys(S.borr).length || busy)}>Descartar cambios</button>` : ''}</div>
      <div class="pcs-grp"><button type="button" class="btn ghost" data-act="pcs-chat">${ico('chat-ia', 14)} Trabajarlo en el Chat</button></div>
      <span class="sp"></span>
      <div class="pcs-grp">${S.puede && n ? html`<button type="button" class="btn" data-act="pcs-pasar" ${dn(!ed || motivos.length || busy)}>${S.pasando ? 'Pasando…' : html`${S.piezas ? 'Poner al día' : 'Pasar'} ${n} pieza${n === 1 ? '' : 's'} a Ideas ${ico('right', 13)}`}</button>` : ''}</div>`);
    mount($('#pcs-why', root), S.puede && n && ed && motivos.length ? html`<p class="pcs-why" role="status">${ico('triangle-alert', 13)} No se puede pasar a Ideas todavía: ${motivos.join(' · ')}.</p>` : '');
  }
  // El techo de la ficha: las piezas del plan contra las contratadas. Lo que falta dice de dónde sale; nunca un 0.
  function pintarTecho() {
    const t = T(), n = (planN().slots || []).length, el = $('#pcs-techo', root), dela = S.est?.viva?.contenido?.piezas;
    let c;
    if (t.hayFicha === false) c = html`<p class="pcs-techo-t mal"><b>Sin ficha de oferta.</b> ⚠️ SIN DATOS: no hay techo que medir. El alcance contratado es el techo${sinFicha() ? ': hasta que exista la ficha el plan no pasa a Ideas' : ' y esta marca no lleva ficha'}.</p>`;
    else if (t.piezas) {
      const sobra = n - t.piezas, pct = Math.min(100, Math.round((n / t.piezas) * 100)), ficha = t.fuente === 'ficha';
      c = html`<div class="pcs-med ${sobra > 0 ? 'mal' : ''}"><div class="pcs-med-b" role="meter" aria-label="Piezas del plan contra el techo" aria-valuemin="0" aria-valuemax="${t.piezas}" aria-valuenow="${n}"><i style="width:${pct}%"></i></div>
        <p class="pcs-techo-t"><b>${n}</b> de <b>${t.piezas}</b> piezas al mes · ${ficha ? 'techo de la ficha' : 'lo que planea la estrategia aprobada (la ficha no da un total)'}</p>
        ${sobra > 0 ? html`<p class="pm-warn">${ficha ? html`<b>${sobra} pieza${sobra === 1 ? '' : 's'} pasa${sobra === 1 ? '' : 'n'} el techo: FUERA DEL ALCANCE.</b> Escálalo al CEO antes de pasarlas a Ideas.` : html`<b>${sobra} pieza${sobra === 1 ? '' : 's'} pasa${sobra === 1 ? '' : 'n'} de lo que planea la estrategia.</b> Confírmalo con el CEO.`}</p>` : ''}
        ${t.texto ? html`<small class="mut">${t.texto}</small>` : ''}${ficha && dela ? html`<small class="mut">La estrategia aprobada planea ${dela} al mes.</small>` : ''}</div>`;
    } else if (t.hayFicha === null) c = html`<p class="pcs-techo-t mal"><b>${n} pieza${n === 1 ? '' : 's'} en el plan.</b> ⚠️ SIN DATOS: tu perfil no ve la ficha de oferta (vive en Estrategia). Pídele al CEO cuántas piezas al mes incluye.</p>`;
    else c = html`<p class="pcs-techo-t mal"><b>${n} pieza${n === 1 ? '' : 's'} en el plan.</b> ⚠️ SIN DATOS: la ficha no dice cuántas piezas al mes (sale de «Frecuencia y volumen») y la estrategia en vivo no trae «piezas / mes».${t.texto ? html` <small class="mut">${t.texto}</small>` : ''}</p>`;
    mount(el, html`<div class="pcs-techo"><span class="lbl">Techo de la ficha</span>${c}</div>`);
  }
  function pintarCampana() {
    const c = valor('campana') || {};
    const f = (campo, etiqueta, max) => html`<label class="pcs-f"><span class="lbl">${etiqueta}</span><input class="in pcs-in" data-s="campana" data-f="${campo}" value="${c[campo] || ''}" maxlength="${max}" ${dis()}></label>`;
    mount($('#pcs-campana', root), html`${cab('campana', 'La idea del mes')}
      <div class="pcs-g2">${f('nombre', 'Nombre', 120)}
        <label class="pcs-f"><span class="lbl">Es una</span><select class="in pcs-in" data-s="campana" data-f="tipo" ${dis()}>${[['', 'Sin definir'], ['campaña', 'Campaña: un mensaje que tiene que llegar'], ['pilar', 'Pilar: lo de siempre']].map(([v, l]) => html`<option value="${v}" ${v === (c.tipo || '') ? raw('selected') : ''}>${l}</option>`)}</select></label>
        <label class="pcs-f pcs-ancho"><span class="lbl">La idea que lo amarra</span><textarea class="in pcs-in" rows="2" data-s="campana" data-f="idea" maxlength="400" ${dis()}>${c.idea || ''}</textarea></label>
        ${f('meta', 'Meta del mes', 120)}${f('traza', 'Traza a la estrategia (MUST BE TRUE)', 120)}</div>`);
  }
  function pintarMensaje() {
    const m = mn(), e = editable(), hay = m.niveles.filter((n) => n.titulo).length, libres = m.niveles.filter((n) => !n.titulo).map((n) => n.consciencia);
    mount($('#pcs-mensaje', root), html`${cab('mensaje', 'El mensaje, por nivel de consciencia', html`<span class="mut sm">${hay} de 5 niveles · no hace falta cubrir los cinco</span>`)}
      <div class="pcs-nivs">${m.niveles.map((n, i) => html`<div class="pcs-niv ${n.titulo ? 'on' : ''}"><span class="pcs-niv-n"><b>${i + 1}</b> ${n.consciencia}</span>
        <input class="in pcs-in" data-s="mensaje" data-n="${i}" data-f="titulo" value="${n.titulo}" maxlength="120" placeholder="Qué se le dice" aria-label="Mensaje para ${n.consciencia}" ${dis()}>
        <input class="in pcs-in" data-s="mensaje" data-n="${i}" data-f="para" value="${n.para}" maxlength="160" placeholder="Qué lo prueba o qué se pide" aria-label="Para qué, ${n.consciencia}" ${dis()}></div>`)}
        ${m.sinNivel.map((x, i) => html`<div class="pcs-niv sin"><span class="pcs-niv-n">${x.consciencia ? `${x.consciencia} (repetido)` : 'Sin nivel'}</span>
          <input class="in pcs-in" data-s="mensaje" data-n="s${i}" data-f="titulo" value="${x.titulo}" maxlength="120" aria-label="Mensaje sin nivel ${i + 1}" ${dis()}>
          <input class="in pcs-in" data-s="mensaje" data-n="s${i}" data-f="para" value="${x.para}" maxlength="160" aria-label="Para qué, mensaje sin nivel ${i + 1}" ${dis()}>
          ${e ? html`<select class="in pcs-in" data-s="mensaje" data-n="s${i}" data-f="nivel" aria-label="Asignar un nivel"><option value="">Asignar nivel</option>${libres.map((l) => html`<option value="${l}">${l}</option>`)}</select>
            <button type="button" class="btn ghost sm" data-act="pcs-mn-quitar" data-n="${i}" aria-label="Quitar este mensaje">${ico('x', 12)}</button>` : ''}</div>`)}</div>
      ${!hay && !m.sinNivel.length ? vacio('El mensaje madre no se dice igual a quien no sabe que tiene el problema que a quien ya te conoce. Escribe una versión por nivel.') : ''}`);
  }
  // Los pilares con nombre (los que se guardan), con su lugar en la lista para el color.
  const pilaresN = () => valor('pilares').map((x, i) => ({ ...x, i })).filter((x) => String(x.nombre || '').trim());
  function resPilares() {
    const ps = pilaresN(), suma = sumaPilares(ps);
    return html`<div class="pm-pbar" role="img" aria-label="Pilares: ${ps.map((x) => `${x.nombre} ${x.peso}%`).join(', ') || 'sin pilares'}">${ps.map((x) => html`<i style="width:${(Math.max(0, +x.peso || 0) / Math.max(suma, 100)) * 100}%;background:${PILAR_C[x.i % PILAR_C.length]}"></i>`)}</div>
      <p class="pcs-suma ${suma === 100 ? 'ok' : 'mal'}" role="status">Suman <b>${suma}%</b> ${suma === 100 ? '✓' : ps.length ? html`· deben dar 100 (${suma > 100 ? `sobran ${suma - 100}` : `faltan ${100 - suma}`}): no se pasa a Ideas así` : '· agrega los pilares: deben dar 100'}</p>`;
  }
  function pintarPilares() {
    const ps = valor('pilares'), e = editable();
    mount($('#pcs-pilares', root), html`${cab('pilares', 'Los pilares y su peso')}
      <div id="pcs-pil-res">${resPilares()}</div>
      ${ps.length ? html`<ul class="pcs-pil">${ps.map((x, i) => html`<li class="pcs-pil-f"><i class="pcs-dot" style="background:${PILAR_C[i % PILAR_C.length]}"></i>
        <input class="in pcs-in" data-s="pilares" data-i="${i}" data-f="nombre" value="${x.nombre || ''}" maxlength="60" placeholder="Nombre del pilar" aria-label="Nombre del pilar ${i + 1}" ${dis()}>
        <input type="range" class="pcs-rng" min="0" max="100" step="1" value="${Math.max(0, Math.min(100, +x.peso || 0))}" data-s="pilares" data-i="${i}" data-f="peso" aria-label="Peso de ${x.nombre || `el pilar ${i + 1}`}" ${dis()}>
        <output class="pcs-pct" data-peso="${i}">${Math.max(0, Math.min(100, +x.peso || 0))}%</output>
        <input class="in pcs-in" data-s="pilares" data-i="${i}" data-f="para" value="${x.para || ''}" maxlength="160" placeholder="Para qué sirve" aria-label="Para qué sirve el pilar ${i + 1}" ${dis()}>
        ${e ? html`<button type="button" class="btn ghost sm" data-act="pcs-pil-menos" data-i="${i}" aria-label="Quitar el pilar ${x.nombre || i + 1}">${ico('x', 12)}</button>` : ''}</li>`)}</ul>` : vacio('De qué se habla y cuánto pesa cada tema en el mes. Los pesos suman 100.')}
      ${e ? html`<div class="pcs-bt"><button type="button" class="btn ghost sm" data-act="pcs-pil-mas" ${ps.length >= MAX_LISTA.pilares ? raw('disabled') : ''}>${ico('plus', 12)} Agregar pilar</button>
        <button type="button" class="btn ghost sm" data-act="pcs-pil-100" ${ps.length ? '' : raw('disabled')}>Ajustar a 100</button></div>` : ''}`);
  }
  function pintarCanales() {
    const cs = valor('canales'), e = editable(), rep = funcionesRepetidas(norm('canales', cs));
    mount($('#pcs-canales', root), html`${cab('canales', 'Cada canal, su función', rep.length ? html`<span class="pm-warn">${rep.map(([a, z]) => `${a} y ${z} hacen lo mismo: sobra uno`).join(' · ')}</span>` : '')}
      ${cs.length ? html`<div class="pm-tbl"><table class="pcs-can"><thead><tr><th>Canal</th><th>Su función</th><th>Frecuencia</th><th>Formatos</th><th>No se hace</th><th><span class="sr-only">Quitar</span></th></tr></thead>
        <tbody>${cs.map((c, i) => html`<tr>${['canal', 'funcion', 'frecuencia', 'formatos', 'no'].map((f) => html`<td><input class="in pcs-in" data-s="canales" data-i="${i}" data-f="${f}" value="${c[f] || ''}" maxlength="${MAX_CAN[f]}" aria-label="${ETQ[f]} del canal ${i + 1}" ${dis()}></td>`)}
          <td>${e ? html`<button type="button" class="btn ghost sm" data-act="pcs-can-menos" data-i="${i}" aria-label="Quitar el canal ${c.canal || i + 1}">${ico('x', 12)}</button>` : ''}</td></tr>`)}</tbody></table></div>`
        : vacio('Para qué sirve cada canal y qué no se hace ahí. Dos canales con la misma función: sobra uno.')}
      ${e ? html`<div class="pcs-bt"><button type="button" class="btn ghost sm" data-act="pcs-can-mas" ${cs.length >= MAX_LISTA.canales ? raw('disabled') : ''}>${ico('plus', 12)} Agregar canal</button></div>` : ''}`);
  }

  // ---------- Las piezas: semana × canal ----------
  const filasCanal = () => { // los canales de la ficha del plan y, al final, los que solo usa algún slot
    const p = planN(), vistos = new Set(), out = [];
    for (const n of [...(p.canales || []).map((c) => c.canal), ...(p.slots || []).map((s) => s.canal)]) { const k = fold(n); if (k && !vistos.has(k)) { vistos.add(k); out.push(n); } }
    return out;
  };
  const chipSlot = (s, a) => html`<button type="button" class="pcs-slot ${a ? (a.fuera ? 'fuera' : 'mal') : ''} ${S.sel === s.id ? 'on' : ''}" data-act="pcs-slot" data-id="${s.id}" title="${[s.objetivo, ...(a?.avisos || [])].filter(Boolean).join(' · ')}">
    <span class="pcs-slot-t"><b>${s.formato || 'Pieza'}</b>${a ? html`<span class="pcs-ico" aria-hidden="true">${ico('triangle-alert', 11)}</span><span class="sr-only">Por revisar: ${a.avisos.join('; ')}</span>` : ''}</span>${s.funcion ? html`<span class="pm-tag">${s.funcion}</span>` : ''}<small>${s.id}</small></button>`;
  function pintarGrid() {
    const p = planN(), slots = p.slots || [], filas = filasCanal(), avisos = avisosPlan(p, T()), av = (id) => avisos.find((a) => a.id === id), e = editable();
    const sem = Array.from({ length: MAX_SEMANAS }, (_, i) => i + 1);
    mount($('#pcs-slots-h', root), cab('slots', `Las piezas del mes${slots.length ? ` · ${slots.length}` : ''}`, avisos.length ? html`<span class="pm-warn">${avisos.length} por revisar</span>` : ''));
    mount($('#pcs-grid', root), html`${filas.length ? html`<div class="pm-tbl"><table class="pcs-grid" aria-label="Piezas por canal y semana"><thead><tr><th scope="col">Canal</th>${sem.map((n) => html`<th scope="col">Sem. ${n}</th>`)}</tr></thead>
        <tbody>${filas.map((c) => html`<tr><th scope="row">${c}</th>${sem.map((n) => html`<td class="pcs-cel">${slots.filter((s) => fold(s.canal) === fold(c) && s.semana === n).map((s) => chipSlot(s, av(s.id)))}${e ? html`<button type="button" class="pcs-mas" data-act="pcs-slot-mas" data-semana="${n}" data-canal="${c}" aria-label="Agregar una pieza en ${c}, semana ${n}">${ico('plus', 12)}</button>` : ''}</td>`)}</tr>`)}</tbody></table></div>`
      : vacio('Una fila por canal y una columna por semana. Agrega primero los canales (arriba) y luego las piezas aquí. El día exacto lo pone Creatividad.')}
      ${avisos.length ? html`<ul class="pcs-avs" aria-label="Piezas por revisar">${avisos.map((a) => { const s = slots.find((x) => x.id === a.id); return html`<li class="${a.fuera ? 'fuera' : ''}"><button type="button" class="pcs-lnk" data-act="pcs-slot" data-id="${a.id}">${a.id} · ${s?.canal} · Sem. ${s?.semana}</button>${a.avisos.map((x) => html`<small class="pm-warn">${x}</small>`)}</li>`; })}</ul>` : ''}`);
  }
  function pintarEd() {
    const host = $('#pcs-ed', root), s = S.sel ? valor('slots').find((x) => x.id === S.sel) : null;
    if (!s) return mount(host, '');
    const e = editable(), pilares = pilaresN().map((x) => x.nombre);
    const sel = (f, etiqueta, ops, act, ninguno = '—') => { const a = act == null ? '' : String(act); return html`<label class="pcs-f"><span class="lbl">${etiqueta}</span><select class="in pcs-in" data-s="slots" data-id="${s.id}" data-f="${f}" ${dis()}>${ninguno === null ? '' : html`<option value="">${ninguno}</option>`}${ops.map((o) => html`<option value="${o}" ${String(o) === a ? raw('selected') : ''}>${o}</option>`)}${a && !ops.map(String).includes(a) ? html`<option value="${a}" selected>${a}</option>` : ''}</select></label>`; };
    const txt = (f, etiqueta, max) => html`<label class="pcs-f"><span class="lbl">${etiqueta}</span><input class="in pcs-in" data-s="slots" data-id="${s.id}" data-f="${f}" value="${s[f] || ''}" maxlength="${max}" ${dis()}></label>`;
    mount(host, html`<div class="pcs-ed"><header><b>${s.id}</b><span class="mut sm">${s.canal} · Semana ${s.semana}</span><span class="sp"></span><button type="button" class="btn ghost sm" data-act="pcs-slot-cerrar">${ico('check', 12)} Listo</button></header>
      <div class="pcs-g3">${sel('semana', 'Semana', [1, 2, 3, 4, 5], s.semana, null)}${sel('canal', 'Canal', filasCanal(), s.canal, null)}${sel('formato', 'Formato', FORMATOS, s.formato)}
        ${sel('pilar', 'Pilar', pilares, s.pilar)}${sel('funcion', 'Función', FUNCIONES, s.funcion)}${sel('temperatura', 'A quién (temperatura)', TEMPERATURAS, s.temperatura)}
        ${sel('consciencia', 'Consciencia', CONSCIENCIAS, s.consciencia)}${sel('balance', 'Balance', BALANCES, s.balance)}${txt('traza', 'Traza a (MUST BE TRUE)', 40)}</div>
      ${txt('objetivo', 'Para qué sirve esta pieza', 200)}
      ${e ? (yaPaso(s.id) ? html`<p class="mut sm">Esta pieza ya pasó a Ideas: no se quita del plan. Si ya no va, se archiva en el calendario.</p>` : html`<button type="button" class="btn ghost sm" data-act="pcs-slot-quitar" data-id="${s.id}">${ico('trash', 12)} Quitar del plan</button>`) : ''}</div>`);
  }

  // ---------- La IA: corriendo · propuesta (un diff por sección) · sin bloque · error ----------
  const verStream = () => { const pre = $('.pcs-stream', root); if (pre && S.gen) { pre.textContent = S.gen.texto || ''; pre.scrollTop = pre.scrollHeight; } };
  const verPaso = () => { const p = $('.pcs-paso', root); if (p && S.gen) p.textContent = S.gen.paso || ''; };
  const critHtml = (cr) => ((cr?.cumple || []).length + (cr?.falta || []).length ? html`<ul class="pcs-crit">${(cr.cumple || []).map((x) => html`<li class="ok"><span aria-hidden="true">✓</span><span class="sr-only">Cumple: </span>${x}</li>`)}${(cr.falta || []).map((x) => html`<li class="falta"><span aria-hidden="true">✗</span><span class="sr-only">Falta: </span>${x}</li>`)}</ul>` : '');
  function difCard(k, g, dif) {
    const dd = dif[k], det = detalleDif(k, dd), hecho = g.hecho[k], todo = det.nuevas.length + det.quitadas.length + det.cambiadas.length;
    const lista = (xs, clase, signo, nombre, f) => xs.slice(0, MAX_FILAS_DIF).map((x) => html`<li class="${clase}"><span aria-hidden="true">${signo}</span><span class="sr-only">${nombre}: </span>${f(x)}</li>`);
    const avisos = [];
    if (k === 'pilares' && sumaPilares(dd.despues) !== 100) avisos.push(`Los pilares propuestos suman ${sumaPilares(dd.despues)}%, no 100%`);
    if (k === 'slots') {
      const n = avisosPlan({ ...planN(), slots: dd.despues }, T()).length; if (n) avisos.push(`${n} pieza${n === 1 ? '' : 's'} con algo por revisar o fuera del techo`);
      if (S.piezas && det.quitadas.some((x) => yaPaso(x.id))) avisos.push('Algunas ya son piezas del calendario: seguirán allá aunque salgan del plan');
    }
    const cuerpo = det.objeto
      ? html`<table class="pcs-dif-t"><thead><tr><th></th><th>Antes</th><th>Después</th></tr></thead><tbody>${det.campos.map((c) => html`<tr><th scope="row">${ETQ[c.campo]}</th><td class="antes">${corto(c.antes, 200)}</td><td class="despues">${corto(c.despues, 200)}</td></tr>`)}</tbody></table>`
      : html`<ul class="pcs-dif-l">${lista(det.nuevas, 'mas', '+', 'Nuevo', (x) => filaTexto(k, x))}${lista(det.quitadas, 'menos', '−', 'Se quita', (x) => filaTexto(k, x))}
          ${det.cambiadas.slice(0, MAX_FILAS_DIF).map((c) => html`<li class="cam"><span aria-hidden="true">~</span><span class="sr-only">Cambia: </span>${filaTexto(k, c.despues)}<small>${c.campos.map((f) => `${ETQ[f.campo]}: ${corto(f.antes, 40)} → ${corto(f.despues, 40)}`).join(' · ')}</small></li>`)}
          ${todo > MAX_FILAS_DIF ? html`<li class="mut sm">…y ${todo - MAX_FILAS_DIF} más (se guardan todas al aceptar)</li>` : ''}</ul>`;
    return html`<section class="pcs-dif ${hecho || ''}" data-s="${k}"><header><b>${NOMBRE_P[k]}</b><span class="chip sm2">${resumenDif(k, dd)}</span>${avisos.map((a) => html`<span class="pm-warn">${a}</span>`)}<span class="sp"></span>
        ${hecho ? html`<span class="chip sm2 pcs-hecho">${hecho === 'aceptada' ? '✓ Aceptada y guardada' : 'Descartada'}</span>`
          : html`<button type="button" class="btn" data-act="pcs-aceptar" data-k="${k}" ${editable() && !S.ocupado ? '' : raw('disabled')}>${ico('check', 14)} Aceptar esta sección</button><button type="button" class="btn ghost" data-act="pcs-descartar-s" data-k="${k}">Descartar</button>`}</header>
      ${hecho === 'aceptada' || hecho === 'descartada' ? '' : html`<div class="pcs-dif-b">${cuerpo}</div>`}</section>`;
  }
  function pintarGen() {
    const g = S.gen, el = $('#pcs-gen', root); if (!el) return;
    if (!g) return mount(el, '');
    const otros = html`<button type="button" class="btn ghost" data-act="pcs-gen-claude">${ico('refresh-cw', 14)} Probar con claude.ai</button><button type="button" class="btn ghost" data-act="pcs-pegar">Pegar la respuesta</button><button type="button" class="btn ghost" data-act="pcs-cerrar-gen">${ico('x', 14)} Cerrar</button>`;
    if (g.fase === 'corriendo') {
      mount(el, html`<section class="pcs-gen" data-fase="corriendo"><header><span class="pcs-gen-t">${ico('loader-circle', 14)} Generando con IA…</span><span class="mut sm pcs-paso"></span><button type="button" class="btn ghost" data-act="pcs-parar">${ico('stop-lleno', 12)} Parar</button></header><pre class="pcs-stream" aria-live="polite"></pre></section>`);
      verStream(); verPaso(); return;
    }
    if (g.fase === 'propuesta') {
      const dif = difPlan(planN(), g.parche), cambian = SECCIONES_P.filter((k) => dif[k].cambia || g.hecho[k]), pend = SECCIONES_P.filter((k) => dif[k].cambia && !g.hecho[k]);
      const sin = SECCIONES_P.filter((k) => !cambian.includes(k)).map((k) => NOMBRE_P[k]);
      mount(el, html`<section class="pcs-prop" data-fase="propuesta"><header><h3>${ico('sparkles', 14)} Propuesta de la IA</h3><span class="mut sm">${g.via === 'manual' ? 'Pegada a mano' : g.modelo || g.via}</span></header>
        <p class="mut sm">Nada se guarda hasta que aceptes cada sección. Lo que aceptes se guarda al momento; lo demás se queda como está.</p>
        ${g.texto ? html`<details class="pcs-det"><summary>Lo que dijo la IA</summary><p>${g.texto}</p></details>` : ''}
        ${g.pregunta ? html`<p class="pcs-pq"><b>La IA pregunta:</b> ${g.pregunta.texto}${g.pregunta.opciones?.length ? html` <span class="mut sm">(${g.pregunta.opciones.join(' · ')})</span>` : ''}</p>` : ''}
        ${critHtml(g.criterios)}
        ${cambian.length ? html`<div class="pcs-difs">${cambian.map((k) => difCard(k, g, dif))}</div>` : html`<p>La IA no propone cambios al plan de hoy.</p>`}
        ${sin.length && cambian.length ? html`<p class="mut sm">Sin cambios: ${sin.join(' · ')}.</p>` : ''}
        ${cambian.length && !pend.length ? html`<p class="pcs-fin">${ico('check', 14)} Ya no queda nada por revisar.</p>` : ''}
        <div class="pcs-bt"><button type="button" class="btn ghost" data-act="pcs-generar">${ico('refresh-cw', 14)} Reintentar</button><button type="button" class="btn ghost" data-act="pcs-cerrar-gen">${pend.length ? 'Descartar todo' : 'Cerrar'}</button></div></section>`);
      return;
    }
    mount(el, html`<section class="pcs-gen" data-fase="${g.fase}" role="alert"><p>${g.fase === 'error' ? g.error : html`No vino el plan en su bloque. Reintenta o pega la respuesta.`}</p>
      ${g.fase === 'sin-bloque' && g.texto ? html`<details><summary>Ver lo que respondió</summary><pre class="pcs-stream">${g.texto}</pre></details>` : ''}
      <div class="pcs-bt"><button type="button" class="btn" data-act="pcs-generar">${ico('refresh-cw', 14)} Reintentar</button>${otros}</div></section>`);
  }
  function leerRespuesta(txt, { via, modelo }) {
    const r = leerPlan(txt), criterios = leerTarjetas(txt).criterios || { cumple: [], falta: [] };
    S.gen = Object.keys(r.parche).length ? { fase: 'propuesta', parche: r.parche, texto: r.texto, pregunta: r.pregunta, criterios, hecho: {}, via, modelo } : { fase: 'sin-bloque', texto: r.texto || txt, via, modelo };
  }
  async function generar(preferir) {
    if (!editable() || S.gen?.fase === 'corriendo') return;
    const v = await ask('Generar con IA', [{ k: 'pedido', t: 'textarea', l: '¿Algo que quieras decirle? (opcional)', ph: 'Ej.: este mes empujamos el combo familiar' }], 'Generar');
    if (!v || !alive()) return;
    const ctrl = new AbortController(), mio = () => S.gen?.ctrl === ctrl;
    S.gen = { fase: 'corriendo', texto: '', paso: '', ctrl }; pintarGen(); pintarActs();
    try {
      const base = await armarCtx(me, { tool: TOOL, slug }); if (!alive() || !mio()) return;
      const ctx = { ...base, mes, plan: planN(), pedido: v.pedido, techo: T(), estrategiaTexto: estrategiaTexto(S.est) };
      const out = await correrIA(me, { tool: TOOL, ctx, signal: ctrl.signal, preferir,
        onDelta: (t) => { if (!alive()) return ctrl.abort(); if (mio()) { S.gen.texto = t; verStream(); } },
        onTool: (p) => { if (mio()) { S.gen.paso = String(p || ''); verPaso(); } } });
      if (!alive() || !mio()) return;
      leerRespuesta(out.texto, out);
    } catch (e) {
      if (!alive() || !mio()) return;
      S.gen = e?.name === 'AbortError' || ctrl.signal.aborted ? null : { fase: 'error', error: e?.message || 'La IA no pudo responder' };
    }
    pintarGen(); pintarActs();
  }
  async function pegar() {
    const v = await ask('Pegar la respuesta', [{ k: 't', t: 'textarea', req: true, l: `Pega la respuesta completa de la IA, con su bloque ${BLOQUE_P}.` }], 'Leer');
    if (!v || !alive()) return;
    leerRespuesta(v.t, { via: 'manual', modelo: '' }); pintarGen(); pintarActs();
  }
  // Aceptar una sección: se guarda solo esa, con el PUT de siempre y su v. Descartarla solo la quita de la propuesta.
  async function aceptar(k) {
    const g = S.gen; if (g?.fase !== 'propuesta' || !editable() || g.hecho[k] || S.ocupado) return;
    const dd = difPlan(planN(), g.parche)[k]; if (!dd?.cambia) return;
    if (real(k) && !(await confirmAsk(`Tienes cambios sin guardar en ${SEC_NOMBRE[k]}. Aceptar la propuesta los reemplaza. ¿Seguir?`))) return;
    if (!alive()) return;
    await haz(async () => {
      const r = await escribir({ [k]: dd.despues });
      if (!alive()) return;
      if (!r.cambiadas?.length) return toast('No cambió nada: esa sección no se puede guardar así.', true);
      S.saved = r.plan || S.saved; delete S.borr[k]; if (k === 'mensaje') S.mn = null;
      g.hecho[k] = 'aceptada'; pintarTodo(); toast(`Guardé ${SEC_NOMBRE[k]}.`);
    });
  }
  const descartarSec = (k) => { if (S.gen?.fase === 'propuesta') { S.gen.hecho[k] = 'descartada'; pintarGen(); } };

  // ---------- Guardar, descartar y pasar a Ideas ----------
  async function guardar() {
    const ks = sucias(); if (!ks.length || !editable() || S.ocupado) return;
    const parche = {};
    for (const k of ks) { const v = norm(k, S.borr[k]); if (k === 'campana' && !v) return toast('La idea del mes necesita un nombre o la idea.', true); parche[k] = v; }
    await haz(async () => {
      const r = await escribir(parche);
      if (!alive()) return;
      S.saved = r.plan || S.saved; for (const k of ks) delete S.borr[k]; if (ks.includes('mensaje')) S.mn = null;
      pintarTodo(); toast(ks.length === 1 ? `Guardé ${SEC_NOMBRE[ks[0]]}.` : `Guardé ${ks.length} secciones.`);
    });
  }
  async function descartar() {
    if (!Object.keys(S.borr).length) return;
    if (sucias().length && !(await confirmAsk('Se pierden los cambios sin guardar de este mes. ¿Descartarlos?'))) return;
    if (!alive()) return;
    S.borr = {}; S.mn = null; S.sel = ''; pintarTodo();
  }
  // «Pasar a Ideas»: antes se mira lo que bloquea (la suma de los pilares, sin ficha); lo del techo y lo prohibido se marca y se confirma.
  async function pasar() {
    if (!editable() || S.pasando || S.ocupado) return;
    if (sucias().length) return toast('Guarda tus cambios antes de pasar el plan a Ideas.', true);
    const rev = revisarParaIdeas(S.saved, { techo: T(), sinFicha: sinFicha() });
    if (rev.bloquea.length) return toast(`No se puede pasar: ${rev.bloquea.join(' · ')}.`, true);
    S.pasando = true; pintarActs();
    const n = await pasarPlan(b, mes, S.saved, { techo: T() });
    if (!alive()) return;
    S.pasando = false;
    if (n != null) { S.piezas = n; await recargar(); } // pasar el plan sube su v: se vuelve a leer para que la próxima escritura no choque
    if (alive()) pintarTodo();
  }
  const chat = () => abrirEnChat(me.email, { modo: 'marketing', slug, mes, borrador: `Armemos el plan de ${nombreMes(mes)} de ${b.name}: la idea del mes, el mensaje, los pilares, los canales y las piezas.` });

  // ---------- Editar las listas ----------
  function agregarSlot(semana, canal) {
    let nuevo = ''; const vistos = [...(S.saved.slots || [])];
    editar('slots', (l) => { nuevo = idSlotNuevo([...l, ...vistos]); l.push({ id: nuevo, semana, canal, formato: '', pilar: '', funcion: '', temperatura: '', consciencia: '', balance: '', objetivo: '', traza: '' }); });
    S.sel = nuevo; pintarGrid(); pintarEd(); cambio(); $('.pcs-ed select[data-f="formato"]', root)?.focus();
  }
  function quitarSlot(id) {
    if (yaPaso(id)) return toast('Esa pieza ya pasó a Ideas: no se quita del plan.', true);
    editar('slots', (l) => { const i = l.findIndex((x) => x.id === id); if (i >= 0) l.splice(i, 1); });
    S.sel = ''; pintarGrid(); pintarEd(); cambio();
  }
  function escribirSlot(t) {
    const f = t.dataset.f; if (!['semana', 'canal', 'formato', 'pilar', 'funcion', 'temperatura', 'consciencia', 'balance', 'traza', 'objetivo'].includes(f)) return;
    editar('slots', (l) => { const s = l.find((x) => x.id === t.dataset.id); if (s) s[f] = f === 'semana' ? Math.max(1, Math.min(MAX_SEMANAS, +t.value || 1)) : t.value; });
    pintarGrid(); if (f === 'semana' || f === 'canal') { const h = $('.pcs-ed header .mut', root), s = valor('slots').find((x) => x.id === t.dataset.id); if (h && s) h.textContent = `${s.canal} · Semana ${s.semana}`; }
    cambio();
  }
  function escribirMensaje(t) {
    const n = t.dataset.n, f = t.dataset.f, sin = n.startsWith('s'), i = +(sin ? n.slice(1) : n);
    editarMn((m) => {
      if (sin) {
        const x = m.sinNivel[i]; if (!x) return;
        if (f === 'nivel') { const j = CONSCIENCIAS.indexOf(t.value); if (j >= 0 && !m.niveles[j].titulo) { m.niveles[j] = { consciencia: CONSCIENCIAS[j], titulo: x.titulo, para: x.para }; m.sinNivel.splice(i, 1); } }
        else x[f] = t.value;
      } else if (m.niveles[i]) m.niveles[i][f] = t.value;
    });
    if (f === 'nivel') pintarMensaje(); else { const fila = t.closest('.pcs-niv'); if (fila && !sin) fila.classList.toggle('on', Boolean(mn().niveles[i].titulo)); }
    cambio();
  }
  function alEscribir(e) {
    const t = e.target, k = t?.dataset?.s; if (!k || !root.contains(t) || !editable()) return;
    if ((t.tagName === 'SELECT') !== (e.type === 'change')) return; // los select cuentan al elegir; los campos de texto y los range, mientras se escribe
    if (k === 'slots') return escribirSlot(t);
    if (k === 'mensaje') return escribirMensaje(t);
    const f = t.dataset.f, i = +t.dataset.i;
    if (k === 'campana') editar('campana', (c) => { c[f] = t.value; });
    else if (k === 'pilares') {
      editar('pilares', (l) => { if (l[i]) l[i][f] = f === 'peso' ? Math.max(0, Math.min(100, Math.round(+t.value || 0))) : t.value; });
      if (f === 'peso') { const o = $(`[data-peso="${i}"]`, root); if (o) o.textContent = `${t.value}%`; }
      mount($('#pcs-pil-res', root), resPilares());
    } else if (k === 'canales') { editar('canales', (l) => { if (l[i]) l[i][f] = t.value; }); pintarGrid(); if (f === 'funcion') pintarCanalesAviso(); }
    cambio();
  }
  // Los avisos de funciones repetidas se actualizan sin repintar los campos (se perdería el foco).
  function pintarCanalesAviso() {
    const rep = funcionesRepetidas(norm('canales', valor('canales'))), h = $('#pcs-canales .pcs-sec-h', root); if (!h) return;
    let w = $('.pm-warn', h); if (!rep.length) return w?.remove();
    if (!w) { w = document.createElement('span'); w.className = 'pm-warn'; h.append(w); }
    w.textContent = rep.map(([a, z]) => `${a} y ${z} hacen lo mismo: sobra uno`).join(' · ');
  }

  function pintarTodo() { pintarTop(); pintarBanner(); pintarActs(); pintarGen(); pintarTecho(); pintarCampana(); pintarMensaje(); pintarPilares(); pintarCanales(); pintarGrid(); pintarEd(); }

  // ---------- El primer pintado ----------
  mount(el, html`<div class="pcs" id="pcs"><div class="pmt-top" id="pcs-top"></div><div id="pcs-banner"></div>
    <div class="pcs-acts" id="pcs-acts" role="toolbar" aria-label="Acciones del plan"></div><div id="pcs-why"></div><div id="pcs-gen" aria-live="polite"></div><div id="pcs-techo"></div>
    <section class="pcs-sec" id="pcs-campana" aria-label="La idea del mes"></section><section class="pcs-sec" id="pcs-mensaje" aria-label="El mensaje por consciencia"></section>
    <section class="pcs-sec" id="pcs-pilares" aria-label="Los pilares"></section><section class="pcs-sec" id="pcs-canales" aria-label="Los canales"></section>
    <section class="pcs-sec" id="pcs-slots" aria-label="Las piezas del mes"><div id="pcs-slots-h"></div><div id="pcs-grid"></div><div id="pcs-ed"></div></section></div>`);
  root = $('#pcs', el);
  acts(root, {
    'pcs-generar': () => generar(), 'pcs-gen-claude': () => generar('claude-web'), 'pcs-parar': () => S.gen?.ctrl?.abort(), 'pcs-pegar': pegar,
    'pcs-cerrar-gen': () => { S.gen?.ctrl?.abort(); S.gen = null; pintarGen(); pintarActs(); },
    'pcs-aceptar': (n) => aceptar(n.dataset.k), 'pcs-descartar-s': (n) => descartarSec(n.dataset.k),
    'pcs-guardar': guardar, 'pcs-descartar': descartar, 'pcs-pasar': pasar, 'pcs-chat': chat,
    'pcs-pil-mas': () => { editar('pilares', (l) => { if (l.length < MAX_LISTA.pilares) l.push({ nombre: '', peso: 0, para: '' }); }); pintarPilares(); cambio(); $$('input[data-f="nombre"][data-s="pilares"]', root).at(-1)?.focus(); },
    'pcs-pil-menos': (n) => { editar('pilares', (l) => { l.splice(+n.dataset.i, 1); }); pintarPilares(); cambio(); },
    'pcs-pil-100': () => { editar('pilares', (l) => { const ps = ajustarA100(l.filter((x) => String(x.nombre || '').trim())); let j = 0; l.forEach((x, i) => { if (String(x.nombre || '').trim()) l[i] = ps[j++]; }); }); pintarPilares(); cambio(); },
    'pcs-can-mas': () => { editar('canales', (l) => { if (l.length < MAX_LISTA.canales) l.push({ canal: '', funcion: '', frecuencia: '', formatos: '', no: '' }); }); pintarCanales(); cambio(); $$('input[data-f="canal"][data-s="canales"]', root).at(-1)?.focus(); },
    'pcs-can-menos': (n) => { editar('canales', (l) => { l.splice(+n.dataset.i, 1); }); pintarCanales(); pintarGrid(); cambio(); },
    'pcs-mn-quitar': (n) => { editarMn((m) => { m.sinNivel.splice(+n.dataset.n, 1); }); pintarMensaje(); cambio(); },
    'pcs-slot-mas': (n) => agregarSlot(+n.dataset.semana, n.dataset.canal), 'pcs-slot': (n) => { S.sel = n.dataset.id; pintarGrid(); pintarEd(); $('.pcs-ed', root)?.scrollIntoView?.({ block: 'nearest' }); },
    'pcs-slot-cerrar': () => { S.sel = ''; pintarGrid(); pintarEd(); }, 'pcs-slot-quitar': (n) => quitarSlot(n.dataset.id),
  });
  root.addEventListener('input', alEscribir);
  root.addEventListener('change', alEscribir);
  // Cambiar de mes con cambios sin guardar pide confirmar (los cambios viven en esta pantalla).
  root.addEventListener('click', async (e) => {
    const a = e.target.closest('#pcs-top .tabs a'); if (!a || !sucias().length) return;
    e.preventDefault();
    if (await confirmAsk('Tienes cambios sin guardar en este mes. Si cambias de mes se pierden. ¿Cambiar de mes?')) location.hash = a.getAttribute('href');
  });
  root.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (editable() && sucias().length) guardar(); } });
  pintarTodo();
}
