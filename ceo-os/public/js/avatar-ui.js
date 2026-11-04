// Strategy › Research › Customer Avatar Studio (antes App 01 · Marca › Entender › Cliente ideal): los avatares de la marca, con su peso,
// su ficha, su Buyer Journey y el OK del CEO. No usa el Tool Shell: su casa es la colección `avatars` (por sus rutas, PUT con la v).
//   Arriba: un chip por avatar (su % y su estado), la barra de pesos y «+ Avatar».
//   Izquierda: una tarjeta que se voltea (el resumen del avatar ↔ la ficha completa, en el orden del método: pago → quién es →
//   intereses → mercado → momento → dolor y deseo → consciencia → dónde está → qué le decimos → señales en el video, y sus ángulos)
//   y debajo la franja del Buyer Journey (5 etapas × 6 filas, editable).
//   Derecha: nombre, peso, estado, aprobar (solo el CEO), los chequeos, «Enviar a Offer Architect», exportar y la IA.
// La IA corre por correrIA (el servidor, el puente o claude.ai): propone, la persona revisa y confirma, y recién entonces se guarda.
// Todo se guarda solo, al dejar cada campo; si alguien cambió el avatar antes, el servidor responde 409 y se trae la última versión.
import { html, raw, mount, api, toast, ico, $, $$, confirmAsk, fdate } from './core.js';
import { SECCIONES, CAMPOS, ANGULOS, ANGULO_AYUDA, MERCADO, REGLA_X, JOURNEY, FILAS_JOURNEY, SALE_DE, vivos, sumaPesos, reglaX, mercado, avance, avanceJourney, limpiarJourney, etiquetarFrase, promptAvatar, leerPropuesta, aMd } from './avatares.js';
import { CONSCIENCIA } from './calendario-contenido.js';
import { correrIA, armarCtx } from './ia-herramienta.js';
import { herramientaDe, rutaHerramienta } from './herramientas.js';

const TONOS = ['#5b4433', '#9a7b5f', '#c3a588', '#7d8b5a', '#b0875a', '#6f5a7a'];
const q = (n) => (n == null || n === '' ? '' : 'Q ' + Number(n).toLocaleString('es-GT'));
const enc = encodeURIComponent;
const corta = (s, n) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; };
const pl = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const lleno = (v) => (Array.isArray(v) ? v.length > 0 : v != null && v !== '');
const reducido = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const enUso = (n) => Boolean(n) && n.contains(document.activeElement) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
// Lo que dijo un modelo, sin sus bloques (cerrados o a medio llegar): solo el resumen en texto.
const sinBloques = (t) => String(t || '').replace(/```[\w-]*[\s\S]*?```/g, '').replace(/```[\s\S]*$/, '').trim();
const NOMBRE_CAMPO = Object.fromEntries(CAMPOS.map(([k, l]) => [k, l]));
const HERRAMIENTA = herramientaDe('customer-avatar-studio') || { id: 'customer-avatar-studio', ws: 'strategy', nombre: 'Customer Avatar Studio' };
// Lo que falta dice ⚠️ SIN DATOS y de dónde sale: nunca un cero.
const sd = (de) => html`<span class="av-sd">⚠️ SIN DATOS: sale de ${de}</span>`;

export async function avatarUI(el, { me, b, alive }) {
  const S = { lista: [], puede: {}, sel: null, guardando: false, ia: null, nuevo: false, pedido: '', lado: {} };
  const carpeta = b.slug === 'inherent' ? 'inherent/inherent-social-media' : b.slug === 'personal' ? 'inherent/personal' : `clients/${b.slug}`;
  mount(el, html`<p class="loading">Cargando…</p>`);
  try { const r = await api(`avatares?profile=${enc(b.slug)}`); S.lista = r.avatares; S.puede = r.puede; }
  catch (e) { if (alive()) mount(el, html`<div class="empty"><b>No pude abrir el cliente ideal</b>${e.message}</div>`); return; }
  if (!alive()) return;
  S.sel = S.lista[0]?.id || null;
  const cur = () => S.lista.find((a) => a.id === S.sel) || null;
  const edita = () => Boolean(S.puede.editar);
  // Qué cara de la tarjeta se ve: la que la persona eligió; si no eligió, el resumen (o la ficha si el avatar todavía está vacío).
  const ladoDe = (a) => S.lado[a.id] || (avance(a) > 0 ? 'resumen' : 'ficha');

  function paint() {
    if (!alive()) return;
    const a = cur();
    if (a) S.lado[a.id] ||= ladoDe(a); // la cara se decide una vez: si el avatar se llena, la tarjeta no se voltea sola
    mount(el, html`<div class="avt"><div id="av-topw">${top()}</div>${a ? html`<div class="av-body"><div class="av-main"><div class="av-flip" id="av-flipw" data-lado="${ladoDe(a)}">${flip(a)}</div>
        <section class="av-sec av-jr" id="av-journey" aria-labelledby="av-jr-h"><div id="av-jr-head">${jrHead(a)}</div>${jrTabla(a)}</section></div>
        <aside class="av-side" id="av-side">${lateral(a)}</aside></div>` : vacio()}</div>`);
  }

  // ---------- Arriba: los avatares y sus pesos ----------
  function top() {
    const l = vivos(S.lista), suma = sumaPesos(S.lista);
    return html`<header class="av-top"><div class="av-chips" role="tablist" aria-label="Avatares">${l.map((a, i) => html`<button role="tab" type="button" class="av-chip ${a.id === S.sel ? 'on' : ''}" aria-selected="${a.id === S.sel ? 'true' : 'false'}" data-av="sel" data-id="${a.id}">
        <i style="background:${TONOS[i % TONOS.length]}"></i><b>${a.nombre}</b><span>${a.peso || 0}%</span>${a.estado === 'aprobado' ? html`<span class="av-ok" title="Aprobado por el CEO">${ico('check', 12)}</span>` : ''}</button>`)}
        ${edita() ? (S.nuevo ? html`<form class="av-new" data-av="crear"><input class="in" name="n" placeholder="Nombre del avatar (ej. Dueña de restaurante)" maxlength="80" autocomplete="off" required><button class="btn xs" type="submit">Crear</button><button class="btn ghost xs" type="button" data-av="cancelar">Cancelar</button></form>` : html`<button type="button" class="btn ghost xs av-add" data-av="nuevo">${ico('plus', 13)} Avatar</button>`) : ''}</div>
      ${l.length ? html`<div class="av-pesos"><div class="av-bar" role="img" aria-label="Pesos: ${l.map((a) => `${a.nombre} ${a.peso || 0}%`).join(', ')}">${l.map((a, i) => (a.peso ? html`<i style="flex:${a.peso};background:${TONOS[i % TONOS.length]}" title="${a.nombre} · ${a.peso}%"></i>` : ''))}${suma < 100 ? html`<i class="libre" style="flex:${100 - suma}"></i>` : ''}</div>
        <span class="av-suma ${suma === 100 ? 'ok' : 'warn'}">${suma === 100 ? html`${ico('check', 12)} Suman 100%` : suma < 100 ? `Suman ${suma}%: falta repartir ${100 - suma}%` : `Suman ${suma}%: sobran ${suma - 100}%`}</span>
        <span class="mut sm">El principal recibe más contenido y más pauta (regla práctica: 50 a 70%).</span></div>` : ''}</header>`;
  }
  function vacio() {
    return html`<section class="av-empty"><span class="av-empty-i">${ico('target', 26)}</span><h2>Todavía no hay cliente ideal</h2>
      <p>Empieza por el precio de la oferta: con tu regla, el avatar gana unas ${REGLA_X} veces eso. De ahí sale a qué se dedica, dónde vive y qué le pasa en la vida.</p>
      ${edita() ? html`<button class="btn" data-av="nuevo">${ico('plus', 15)} Crear el primer avatar</button>` : html`<p class="mut sm">Tu perfil puede verlo, pero no editarlo.</p>`}</section>`;
  }

  // ---------- La tarjeta que se voltea: el resumen ↔ la ficha ----------
  function flip(a) {
    const lado = ladoDe(a);
    return html`<div class="av-flip-bar"><span class="lbl">${lado === 'resumen' ? 'Resumen' : 'Ficha'}</span>
        <button type="button" class="btn ghost xs av-voltear" data-av="voltear" aria-controls="av-flipw">${ico('repeat', 13)} ${lado === 'resumen' ? 'Ver ficha' : 'Ver resumen'}</button></div>
      ${lado === 'resumen' ? html`<article class="av-cara av-res" id="av-res" aria-label="Resumen de ${a.nombre}">${resumen(a)}</article>` : html`<div class="av-cara av-ficha" id="av-ficha">${ficha(a)}</div>`}`;
  }
  function voltear() {
    const a = cur(), w = $('#av-flipw', el);
    if (!a || !w || w.dataset.voltea) return;
    const nuevo = ladoDe(a) === 'resumen' ? 'ficha' : 'resumen';
    const poner = (anima) => {
      if (!alive() || !w.isConnected) return;
      S.lado[a.id] = nuevo; w.dataset.lado = nuevo; mount(w, flip(cur() || a)); $('.av-voltear', w)?.focus();
      if (anima) { w.dataset.voltea = 'entra'; setTimeout(() => { delete w.dataset.voltea; }, 220); } else delete w.dataset.voltea;
    };
    if (reducido()) return poner(false);
    w.dataset.voltea = 'sale'; setTimeout(() => poner(true), 160);
  }

  // El resumen: lo esencial del avatar en una tarjeta. Cada dato que falta dice ⚠️ SIN DATOS y de dónde sale.
  function resumen(a) {
    const c = a.campos || {}, rx = reglaX(c), m = mercado(c), j = limpiarJourney(a.journey), jr = avanceJourney(j);
    const perfil = [c.ocupacion, c.edad && `${c.edad} años`, c.zona, c.nse].filter(Boolean).join(' · ');
    const lista = (l, n, de, f = (x) => x) => (l?.length ? html`<ul>${l.slice(0, n).map((x) => html`<li>${f(x)}</li>`)}${l.length > n ? html`<li class="mut">y ${l.length - n} más en la ficha</li>` : ''}</ul>` : sd(de));
    const dato = (k, cuerpo) => html`<section class="av-res-i"><span class="lbl">${k}</span>${cuerpo}</section>`;
    return html`<header class="av-res-h"><div><h3>${a.nombre}</h3><p class="av-res-p">${perfil || sd(SALE_DE.quien)}</p></div>
        <div class="av-res-c"><span class="chip ${a.estado === 'aprobado' ? 'av-st-ok' : ''}">${a.estado === 'aprobado' ? html`${ico('check', 12)} Aprobado` : 'Borrador'}</span><b>${a.peso || 0}%</b></div></header>
      <div class="av-res-g">
        ${dato('Le duele', lista(c.dolores, 3, SALE_DE.dolor))}
        ${dato('Desea', lista(c.deseos, 3, SALE_DE.dolor))}
        ${dato('Lo que casi lo frena', lista(c.objeciones, 3, SALE_DE.dolor))}
        ${dato('Lo que dice, literal', lista(c.frases, 2, SALE_DE.dolor, etiquetarFrase))}
        ${dato('Consciencia', c.nivel ? html`<p>${c.nivel} · ${CONSCIENCIA[c.nivel - 1]}</p>` : sd(SALE_DE.consciencia))}
        ${dato('Dónde está', lista(c.canales, 4, SALE_DE.donde))}
        ${dato('Qué le decimos', c.oferta ? html`<p>${corta(c.oferta, 220)}</p>` : sd(SALE_DE.mensaje))}
        ${dato(`Regla ${REGLA_X}×`, rx ? html`<p>Gana ${rx.x}× el precio${rx.ok ? '' : `: con tu regla debería ganar ${q(rx.sugerido)}`}</p>` : sd(SALE_DE.pago))}
        ${dato('Mercado', m ? html`<p>${m.suma} de ${m.de}${m.completo ? '' : ' (incompleto)'}</p>` : sd(SALE_DE.mercado))}</div>
      <div class="av-res-j"><span class="lbl">Buyer Journey · ${jr.llenas} de ${jr.de} celdas</span>
        ${jr.llenas ? html`<ol class="av-res-jr" aria-label="Celdas llenas por etapa">${JOURNEY.map((e) => { const n = Object.keys(j[e.id] || {}).length; return html`<li data-n="${n}"><b>${e.nombre}</b><span>${n} de ${FILAS_JOURNEY.length}</span></li>`; })}</ol>` : sd('entrevistas con clientes, sus DMs y el CRM')}</div>
      <div class="av-res-ang"><span class="lbl">Ángulos de contenido</span>${(a.angulos || []).length ? html`<ul>${a.angulos.map((g) => html`<li title="${g.texto}"><b>${g.tipo}</b> ${corta(g.texto, 90)}</li>`)}</ul>` : sd('los mejores posts de la marca y lo que le duele a este avatar')}</div>`;
  }
  const pintarResumen = () => { const n = $('#av-res', el), a = cur(); if (n && a) mount(n, resumen(a)); };

  // ---------- La ficha ----------
  function campo(a, [k, l, t, ayuda]) {
    const c = a.campos || {}, v = c[k], dis = edita() ? '' : raw('disabled');
    let input;
    if (t === 'num') input = html`<div class="av-num"><span>Q</span><input class="in" type="number" min="0" step="1" data-k="${k}" value="${v ?? ''}" ${dis}></div>`;
    else if (t === 'score') input = html`<div class="av-score" role="radiogroup" aria-label="${l}">${[1, 2, 3, 4, 5].map((n) => html`<button type="button" role="radio" aria-checked="${v === n ? 'true' : 'false'}" class="${v >= n ? 'on' : ''}" data-av="score" data-k="${k}" data-n="${n}" ${dis}>${n}</button>`)}</div>`;
    else if (t === 'nivel') input = html`<select class="in" data-k="${k}" ${dis}><option value="">Sin definir</option>${CONSCIENCIA.map((n, i) => html`<option value="${i + 1}" ${v === i + 1 ? raw('selected') : ''}>${i + 1} · ${n}</option>`)}</select>`;
    else if (t === 'lista') input = html`<textarea class="in" rows="${Math.min(8, Math.max(3, (v?.length || 0) + 1))}" data-k="${k}" data-lista="1" placeholder="${k === 'frases' ? 'Una por línea, con su fuente entre paréntesis: «me urge… (reseña de Google)»' : 'Una por línea'}" ${dis}>${(v || []).join('\n')}</textarea>`;
    else if (t === 'area') input = html`<textarea class="in" rows="3" data-k="${k}" ${dis}>${v || ''}</textarea>`;
    else input = html`<input class="in" data-k="${k}" value="${v || ''}" placeholder="${ayuda || ''}" ${dis}>`;
    const extra = k === 'ingreso' && c.precio > 0 && !(v > 0) && edita() ? html`<button type="button" class="av-sug" data-av="sugerido">Con tu regla: ${q(c.precio * REGLA_X)} · Usar</button>` : '';
    return html`<label class="av-f ${t === 'area' || t === 'lista' ? 'w' : ''} ${t === 'score' ? 'sc' : ''}"><span class="av-l">${l}${t === 'score' && ayuda ? html` <i class="mut">· ${ayuda}</i>` : ''}</span>${input}${extra}</label>`;
  }
  function ficha(a) {
    return html`${SECCIONES.map(([id, nombre, ayuda, campos], i) => html`<section class="av-sec" id="av-${id}"><header><span class="av-n">${i + 1}</span><div><h3>${nombre}</h3><p>${ayuda}</p></div></header><div class="av-fields">${campos.map((c) => campo(a, c))}</div></section>`)}
      <section class="av-sec" id="av-angulos"><header><span class="av-n">${SECCIONES.length + 1}</span><div><h3>Ángulos de contenido</h3><p>Distintas formas de presentar la misma oferta a este avatar. Cada pieza del calendario puede llevar su ángulo.</p></div></header>
        <div class="av-angs">${(a.angulos || []).map((g, i) => html`<div class="av-ang"><select class="in" data-ang="tipo" data-i="${i}" ${edita() ? '' : raw('disabled')} title="${ANGULO_AYUDA[g.tipo] || ''}">${ANGULOS.map((t) => html`<option ${t === g.tipo ? raw('selected') : ''}>${t}</option>`)}</select><input class="in" data-ang="texto" data-i="${i}" value="${g.texto}" ${edita() ? '' : raw('disabled')}>${edita() ? html`<button type="button" class="av-x" data-av="ang-quitar" data-i="${i}" aria-label="Quitar ángulo">×</button>` : ''}</div>`)}
          ${edita() ? html`<button type="button" class="btn ghost xs" data-av="ang-mas">${ico('plus', 13)} Ángulo</button>` : ''}${!(a.angulos || []).length ? html`<p class="mut sm">${ANGULOS.map((t) => `${t}: ${ANGULO_AYUDA[t]}`).join(' · ')}</p>` : ''}</div></section>`;
  }

  // ---------- El Buyer Journey: 5 etapas × 6 filas ----------
  function jrHead(a) {
    const av = avanceJourney(a.journey);
    return html`<header><div class="av-jr-hd"><h3 id="av-jr-h">Buyer Journey</h3><p>Cómo llega este avatar a comprar y qué hacemos en cada etapa. Lo que no sabes se queda vacío: no lo inventes. Si cambias algo de un avatar aprobado, vuelve a borrador.</p></div>
        <span class="chip" id="av-jr-n">${av.llenas} de ${av.de} celdas</span></header>
      ${av.llenas === 0 ? html`<p class="av-sd av-jr-sd">⚠️ SIN DATOS: el Buyer Journey sale de las entrevistas con clientes, sus DMs y el CRM.${edita() ? ' Pídele un borrador a la IA y revísalo.' : ''}</p>` : ''}`;
  }
  function celda(j, e, f) {
    const v = j[e.id]?.[f.id] || '';
    if (edita()) return html`<td><textarea class="in av-jr-c" rows="3" maxlength="300" data-jr="${e.id}.${f.id}" placeholder="⚠️ SIN DATOS" aria-label="${e.nombre} · ${f.nombre}" title="Sale de: ${f.sd}">${v}</textarea></td>`;
    return html`<td>${v ? html`<p class="av-jr-ro">${v}</p>` : html`<p class="av-sd av-jr-ro" title="Sale de: ${f.sd}">⚠️ SIN DATOS</p>`}</td>`;
  }
  function jrTabla(a) {
    const j = limpiarJourney(a.journey);
    return html`<div class="av-jr-sc"><table class="av-jr-t"><caption class="sr-only">Buyer Journey de ${a.nombre}: cinco etapas por seis filas</caption>
        <thead><tr><th scope="col"><span class="sr-only">Fila</span></th>${JOURNEY.map((e) => html`<th scope="col" title="${e.ayuda}">${e.nombre}</th>`)}</tr></thead>
        <tbody>${FILAS_JOURNEY.map((f) => html`<tr><th scope="row"><b>${f.nombre}</b><span class="mut sm">${f.ayuda}</span></th>${JOURNEY.map((e) => celda(j, e, f))}</tr>`)}</tbody></table></div>
      <p class="mut sm">De dónde sale: ${FILAS_JOURNEY.map((f) => `${f.nombre}: ${f.sd}`).join(' · ')}.</p>`;
  }

  // ---------- Al lado: estado, peso, chequeos, siguiente paso y la IA ----------
  function lateral(a) {
    return html`<div class="av-card" id="av-c-estado">${cardEstado(a)}</div><div class="av-card" id="av-c-chk">${cardChequeos(a)}</div><div class="av-card" id="av-c-sig">${cardSiguiente(a)}</div>
      ${edita() ? html`<div class="av-card av-ia" id="av-ia">${cardIA()}</div><button class="av-arch" data-av="archivar">Archivar este avatar</button>` : ''}`;
  }
  function cardEstado(a) {
    const pct = avance(a);
    return html`<div class="av-row"><span class="chip ${a.estado === 'aprobado' ? 'av-st-ok' : ''}">${a.estado === 'aprobado' ? html`${ico('check', 12)} Aprobado` : 'Borrador'}</span><span class="mut sm" id="av-save">${S.guardando ? 'Guardando…' : 'Guardado'}</span></div>
        ${a.estado === 'aprobado' && a.aprobado?.en ? html`<p class="mut sm">Lo aprobó el CEO el ${fdate(String(a.aprobado.en).slice(0, 10))}. Si cambias la ficha o el Buyer Journey, vuelve a borrador.</p>` : ''}
        <label class="av-f"><span class="av-l">Nombre</span><input class="in" data-top="nombre" value="${a.nombre}" ${edita() ? '' : raw('disabled')}></label>
        <label class="av-f"><span class="av-l">Peso</span><div class="av-peso"><input type="range" min="0" max="100" step="5" data-top="peso" value="${a.peso || 0}" ${edita() ? '' : raw('disabled')} aria-label="Peso del avatar"><b>${a.peso || 0}%</b></div></label>
        <div class="av-av"><span class="mut sm">Ficha completa al ${pct}%</span><div class="av-av-b"><i style="width:${pct}%"></i></div></div>
        ${S.puede.aprobar ? (a.estado === 'aprobado' ? html`<button class="btn ghost xs" data-av="reabrir">Reabrir</button>` : html`<button class="btn xs" data-av="aprobar" ${pct < 30 ? raw('disabled title="Completa más la ficha antes de aprobar"') : ''}>${ico('check', 13)} Aprobar</button>`) : html`<p class="mut sm">El CEO lo aprueba.</p>`}`;
  }
  function cardChequeos(a) {
    const c = a.campos || {}, rx = reglaX(c), m = mercado(c), jr = avanceJourney(a.journey), senales = (c.decir?.length || 0) + (c.mostrar?.length || 0);
    const jok = jr.llenas >= jr.de * 0.7;
    return html`<span class="lbl">Chequeos</span>
        <div class="av-chk ${rx ? (rx.ok ? 'ok' : 'warn') : ''}">${ico(rx ? (rx.ok ? 'check' : 'alert') : 'dot', 14)}<div><b>Regla ${REGLA_X}×</b><span class="mut sm">${rx ? `Gana ${rx.x}× el precio${rx.ok ? '' : `: con tu regla debería ganar ${q(rx.sugerido)}`}` : 'Falta el precio o el ingreso'}</span></div></div>
        <div class="av-chk ${m ? (m.suma / m.de >= 0.7 ? 'ok' : 'warn') : ''}">${ico(m ? (m.suma / m.de >= 0.7 ? 'check' : 'alert') : 'dot', 14)}<div><b>Mercado ${m ? `${m.suma} de ${m.de}` : ''}</b><span class="mut sm">${m ? MERCADO.map(([k, l]) => `${l} ${c[k] || '—'}`).join(' · ') : 'Falta el puntaje de Hormozi'}</span></div></div>
        <div class="av-chk ${senales ? 'ok' : ''}">${ico(senales ? 'check' : 'dot', 14)}<div><b>Señales en el video</b><span class="mut sm">${senales} señales para que Meta lo lleve a esta persona</span></div></div>
        <div class="av-chk ${jr.llenas ? (jok ? 'ok' : 'warn') : ''}">${ico(jr.llenas ? (jok ? 'check' : 'alert') : 'dot', 14)}<div><b>Buyer Journey</b><span class="mut sm">${jr.llenas ? `${jr.llenas} de ${jr.de} celdas` : '⚠️ SIN DATOS: sale de entrevistas, DMs y el CRM'}</span></div></div>`;
  }
  function cardSiguiente(a) {
    return html`<span class="lbl">Siguiente paso</span>
        <a class="btn xs av-envia" href="${rutaHerramienta('strategy', b.slug, 'offer-architect')}">Enviar a Offer Architect ${ico('arrow-right', 13)}</a>
        ${a.estado !== 'aprobado' ? html`<p class="mut sm">Es borrador: Laya solo lee los avatares que aprueba el CEO.</p>` : ''}
        <button type="button" class="btn ghost xs" data-av="exportar">${ico('download', 13)} Exportar</button>`;
  }
  // La IA: propone, la persona revisa y confirma. Nada se guarda hasta que elige «Usar todo» o «Solo lo vacío».
  function cardIA() {
    const a = cur(), C = S.ia && S.ia.id === a?.id ? S.ia : null;
    if (!a) return '';
    const resp = C?.texto ? sinBloques(C.texto) : '';
    return html`<span class="lbl">IA</span>
        ${!C ? html`<p class="mut sm">Lee la carpeta del cliente y propone la ficha, los ángulos y el Buyer Journey con tu método. Tú revisas y confirmas antes de que se guarde.</p>
          <textarea class="in" rows="2" data-av-pedido placeholder="Opcional: qué quieres que mire (ej. «enfócate en dueños de restaurante en zona 10»)">${S.pedido}</textarea>
          <button class="btn xs" data-av="ia">${ico('spark', 13)} Proponer con IA</button>` : ''}
        ${C?.fase === 'pensando' ? html`<p class="av-think"><span class="es-dots-t"><i></i><i></i><i></i></span> ${C.tool || 'Pensando…'}</p><button class="btn ghost xs" data-av="ia-parar">Detener</button>` : ''}
        ${C?.fase === 'propuesta' ? propuesta(a, C) : ''}
        ${C?.fase === 'error' ? html`<p class="es-err">${C.error}</p><button class="btn ghost xs" data-av="descartar">Entendido</button>` : ''}
        ${resp ? html`<details class="av-resp"><summary>Lo que respondió</summary><div class="sm">${resp.slice(0, 1500)}</div></details>` : ''}`;
  }
  function propuesta(a, C) {
    const P = C.prop, c = a.campos || {}, j0 = limpiarJourney(a.journey), celdas = avanceJourney(P.journey).llenas;
    const mismo = (x, y) => JSON.stringify(x) === JSON.stringify(y);
    const pisaCampos = Object.entries(P.campos).filter(([k, v]) => lleno(c[k]) && !mismo(c[k], v)).length;
    const pisaCeldas = JOURNEY.reduce((s, e) => s + FILAS_JOURNEY.filter((f) => j0[e.id]?.[f.id] && P.journey[e.id]?.[f.id] && j0[e.id][f.id] !== P.journey[e.id][f.id]).length, 0);
    const pisaAng = P.angulos.length && (a.angulos || []).length && !mismo(P.angulos, a.angulos) ? 1 : 0;
    const pisa = pisaCampos + pisaCeldas + pisaAng;
    const ver = (v) => (Array.isArray(v) ? v.join('; ') : v == null ? '—' : String(v));
    return html`<p class="sm"><b>La IA propone ${pl(Object.keys(P.campos).length, 'campo', 'campos')}, ${pl(P.angulos.length, 'ángulo', 'ángulos')} y ${pl(celdas, 'celda', 'celdas')} del Buyer Journey.</b></p>
        <p class="mut sm">${pisa ? `«Usar todo» cambia ${pl(pisa, 'cosa que ya tiene', 'cosas que ya tienen')} valor; «Solo lo vacío» no las toca.` : 'No cambia nada de lo que ya tienes.'} Respondió ${C.modelo || 'la IA'}.</p>
        <details class="av-rev"><summary>Revisar lo que propone</summary><ul class="av-rev-l">
          ${Object.entries(P.campos).map(([k, v]) => html`<li><b>${NOMBRE_CAMPO[k] || k}</b> ${corta(ver(v), 160)}${lleno(c[k]) && !mismo(c[k], v) ? html` <span class="av-pisa">cambia lo que hay</span>` : ''}</li>`)}
          ${P.angulos.length ? html`<li><b>Ángulos</b> ${P.angulos.map((g) => `${g.tipo}: ${corta(g.texto, 70)}`).join(' · ')}</li>` : ''}
          ${JOURNEY.map((e) => (P.journey[e.id] ? html`<li><b>Journey · ${e.nombre}</b> ${FILAS_JOURNEY.filter((f) => P.journey[e.id][f.id]).map((f) => `${f.nombre}: ${corta(P.journey[e.id][f.id], 60)}`).join(' · ')}</li>` : ''))}</ul></details>
        <div class="av-row"><button class="btn xs" data-av="usar-todo">Usar todo</button><button class="btn ghost xs" data-av="usar-vacio">Solo lo vacío</button><button class="btn ghost xs" data-av="descartar">Descartar</button></div>`;
  }

  // ---------- Pintar solo lo que cambió (el campo con el foco no se pierde) ----------
  const pintarLateral = () => {
    const a = cur(); if (!a || !alive()) return;
    for (const [id, f] of [['av-c-estado', cardEstado], ['av-c-chk', cardChequeos], ['av-c-sig', cardSiguiente]]) { const n = $('#' + id, el); if (n && !enUso(n)) mount(n, f(a)); }
  };
  const pintarTop = () => { const n = $('#av-topw', el); if (n && !enUso(n)) mount(n, top()); };
  const pintarIA = () => { const n = $('#av-ia', el); if (n && alive()) mount(n, cardIA()); };
  const pintarJourneyHead = () => { const n = $('#av-jr-head', el), a = cur(); if (n && a) mount(n, jrHead(a)); };

  // ---------- Guardar ----------
  // Un cambio espera 600 ms y se manda con la v que se leyó (PUT avatares/:id). Los envíos van de uno en uno para que cada uno lleve
  // la v que dejó el anterior. Si alguien cambió el avatar antes (409), se trae la última versión y la persona repite su cambio.
  let timer = null, pend = null, cola = Promise.resolve();
  const sobre = (d) => { // la respuesta del servidor + lo que se editó mientras viajaba
    if (!pend || pend.id !== d.id) return d;
    const p = pend.body, o = { ...d };
    if (p.campos) o.campos = { ...(d.campos || {}), ...p.campos };
    for (const k of ['nombre', 'peso', 'angulos', 'journey']) if (k in p) o[k] = p[k];
    return o;
  };
  function guardar(patch, ya = false) {
    const a = cur(); if (!a) return;
    if (pend && pend.id !== a.id) enviar();
    pend ||= { id: a.id, body: {} };
    if (patch.campos) pend.body.campos = { ...(pend.body.campos || {}), ...patch.campos };
    for (const k of ['nombre', 'peso', 'angulos', 'journey']) if (k in patch) pend.body[k] = patch[k];
    S.guardando = true; const s = $('#av-save', el); if (s) s.textContent = 'Guardando…';
    clearTimeout(timer); timer = setTimeout(enviar, ya ? 0 : 600);
  }
  function enviar() {
    clearTimeout(timer);
    const p = pend; pend = null;
    if (!p || !Object.keys(p.body).length) { S.guardando = false; return cola; }
    cola = cola.then(() => subir(p));
    return cola;
  }
  const vaciar = () => enviar();
  async function subir({ id, body }) {
    const a = S.lista.find((x) => x.id === id); if (!a) return;
    try { const d = await api(`avatares/${enc(id)}`, { method: 'PUT', body: { ...body, v: a.v } }); S.lista = S.lista.map((x) => (x.id === d.id ? sobre(d) : x)); }
    catch (e) { if (e.status === 409) { clearTimeout(timer); pend = null; S.guardando = false; return falla(e); } toast(e.message, true); }
    S.guardando = Boolean(pend);
    if (!alive()) return;
    pintarLateral(); pintarTop(); pintarResumen();
  }
  async function recargar() {
    try { const r = await api(`avatares?profile=${enc(b.slug)}`); S.lista = r.avatares; S.puede = r.puede; if (!S.lista.some((x) => x.id === S.sel)) S.sel = vivos(S.lista)[0]?.id || null; } catch {}
  }
  // Un error al escribir. Con 409 (alguien lo cambió antes) se trae la última versión.
  async function falla(e) {
    if (e.status === 409 && e.code === 'APROBADO') { await recargar(); toast(e.message || 'La estrategia está aprobada: el CEO tiene que reabrirla para cambiar los avatares.', true); } // el servidor cierra Strategy con la estrategia aprobada
    else if (e.status === 409) { await recargar(); toast('Alguien cambió este avatar mientras lo editabas. Traje la última versión: vuelve a hacer tu cambio.', true); } else toast(e.message, true);
    paint();
  }

  // ---------- La IA ----------
  let ctrl = null;
  async function proponer() {
    if (S.ia?.fase === 'pensando') return;
    await vaciar();
    const a = cur(); if (!a) return;
    const mio = new AbortController(); ctrl = mio;
    S.ia = { fase: 'pensando', id: a.id, corre: mio, texto: '', tool: '' }; pintarIA();
    const vigente = () => S.ia?.corre === mio;
    try {
      const ctx = await armarCtx(me, { tool: HERRAMIENTA, slug: b.slug });
      const otros = vivos(S.lista).filter((x) => x.id !== a.id);
      const tool = { ...HERRAMIENTA, bloque: 'json', prompt: (c) => promptAvatar({ marca: c.cliente?.nombre || b.name || b.slug, carpeta, avatar: a, otros, pedido: S.pedido, ctx: c }) };
      const r = await correrIA(me, { tool, ctx, signal: mio.signal, onDelta: (t) => { if (vigente()) S.ia.texto = t; }, onTool: (t) => { if (vigente()) { S.ia.tool = String(t || ''); pintarIA(); } } });
      if (!vigente()) return;
      const prop = leerPropuesta(r.texto), nada = prop && !Object.keys(prop.campos).length && !prop.angulos.length && !avanceJourney(prop.journey).llenas;
      S.ia = !prop ? { fase: 'error', id: a.id, error: 'La IA respondió, pero sin el bloque de datos. Intenta de nuevo.', texto: r.texto }
        : nada ? { fase: 'error', id: a.id, error: 'La IA respondió sin nada nuevo para llenar. Intenta con un pedido más concreto.', texto: r.texto }
          : { fase: 'propuesta', id: a.id, prop, texto: r.texto, modelo: r.modelo };
    } catch (e) {
      if (!vigente()) return; // la persona la detuvo o cambió de avatar
      S.ia = e.name === 'AbortError' ? null : { fase: 'error', id: a.id, error: e.status === 401 ? 'El puente no reconoció tu token: vuelve a emparejar en Estrategia.' : e.message };
    }
    if (ctrl === mio) ctrl = null;
    pintarIA();
  }
  // Lo que la persona confirmó entra a la ficha y se guarda. «Solo lo vacío» no toca lo que ya hay.
  function usar(soloVacio) {
    const a = cur(), P = S.ia?.prop; if (!a || !P || S.ia.id !== a.id) return;
    const c = a.campos || {}, patch = {}, mismo = (x, y) => JSON.stringify(x) === JSON.stringify(y);
    const campos = Object.fromEntries(Object.entries(P.campos).filter(([k]) => !soloVacio || !lleno(c[k])));
    if (Object.keys(campos).length) { patch.campos = campos; a.campos = { ...c, ...campos }; }
    const angs = P.angulos.length && !(soloVacio && (a.angulos || []).length) ? P.angulos : null;
    if (angs && !mismo(angs, a.angulos || [])) { a.angulos = angs; patch.angulos = angs; }
    const j0 = limpiarJourney(a.journey), j1 = {};
    for (const e of JOURNEY) {
      const fila = { ...(j0[e.id] || {}) };
      for (const f of FILAS_JOURNEY) { const v = P.journey[e.id]?.[f.id]; if (v && (!soloVacio || !fila[f.id])) fila[f.id] = v; }
      if (Object.keys(fila).length) j1[e.id] = fila;
    }
    if (!mismo(j1, j0)) { a.journey = j1; patch.journey = j1; }
    S.ia = null;
    if (Object.keys(patch).length) { guardar(patch, true); toast('Listo: revisa lo que entró y ajústalo. Sigue en borrador hasta que el CEO lo apruebe.'); } else toast('No había nada nuevo que aplicar.');
    paint();
  }

  // ---------- Exportar ----------
  function exportar() {
    const a = cur(); if (!a) return;
    const md = aMd(a, { marca: b.name || b.slug }); if (!md.trim()) return toast('Todavía no hay nada que exportar.', true);
    const nombre = `avatar-${a.nombre}-${b.slug}.md`.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
    try { // si el navegador no deja descargar, se copia
      const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' })), l = document.createElement('a');
      l.href = url; l.download = nombre; document.body.append(l); l.click(); l.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000); toast(`Descargué ${nombre}`);
    } catch { navigator.clipboard?.writeText(md).then(() => toast('Markdown copiado'), () => toast('No pude exportar.', true)); }
  }

  // ---------- Eventos ----------
  el.onclick = async (e) => {
    const t = e.target.closest('[data-av]'); if (!t) return;
    const act = t.dataset.av, a = cur();
    if (act === 'sel') { if (t.dataset.id === S.sel) return; await vaciar(); ctrl?.abort(); ctrl = null; S.ia = null; S.sel = t.dataset.id; return paint(); }
    if (act === 'nuevo') { S.nuevo = true; paint(); return $('.av-new input', el)?.focus(); }
    if (act === 'cancelar') { S.nuevo = false; return paint(); }
    if (act === 'voltear') return voltear();
    if (!a) return;
    if (act === 'score') { const n = +t.dataset.n, k = t.dataset.k; a.campos = { ...(a.campos || {}), [k]: a.campos?.[k] === n ? null : n }; guardar({ campos: { [k]: a.campos[k] } }); return paint(); }
    if (act === 'sugerido') { const v = a.campos.precio * REGLA_X; a.campos = { ...a.campos, ingreso: v }; guardar({ campos: { ingreso: v } }); return paint(); }
    if (act === 'ang-mas') { a.angulos = [...(a.angulos || []), { tipo: ANGULOS[0], texto: '' }]; paint(); return $$('[data-ang="texto"]', el).at(-1)?.focus(); }
    if (act === 'ang-quitar') { a.angulos = (a.angulos || []).filter((_, i) => i !== +t.dataset.i); guardar({ angulos: a.angulos.filter((g) => g.texto) }); return paint(); }
    if (act === 'aprobar' || act === 'reabrir') {
      await vaciar(); const x = cur(); if (!x) return;
      try { const d = await api(`avatares/${enc(x.id)}/aprobar`, { method: 'POST', body: { aprobar: act === 'aprobar', v: x.v } }); S.lista = S.lista.map((y) => (y.id === d.id ? d : y)); toast(act === 'aprobar' ? 'Avatar aprobado: Laya ya lo usa' : 'Reabierto'); } catch (err) { return falla(err); }
      return paint();
    }
    if (act === 'archivar') {
      if (!(await confirmAsk(`¿Archivar «${a.nombre}»? No se borra: deja de contar para los pesos.`))) return;
      await vaciar();
      try { await api(`avatares/${enc(a.id)}/archivar`, { method: 'POST', body: {} }); S.lista = S.lista.filter((x) => x.id !== a.id); S.sel = vivos(S.lista)[0]?.id || null; S.ia = null; } catch (err) { return falla(err); }
      return paint();
    }
    if (act === 'exportar') return exportar();
    if (act === 'ia') return proponer();
    if (act === 'ia-parar') { try { ctrl?.abort(); } catch {} ctrl = null; S.ia = null; return pintarIA(); }
    if (act === 'usar-todo') return usar(false);
    if (act === 'usar-vacio') return usar(true);
    if (act === 'descartar') { S.ia = null; return pintarIA(); }
  };
  el.onsubmit = async (e) => {
    if (e.target.dataset.av !== 'crear') return; e.preventDefault();
    const nombre = new FormData(e.target).get('n')?.toString().trim(); if (!nombre) return;
    try { const d = await api('avatares', { method: 'POST', body: { profile: b.slug, nombre } }); S.lista = [...S.lista, d]; S.sel = d.id; S.nuevo = false; S.ia = null; paint(); }
    catch (err) { toast(err.message, true); }
  };
  el.onchange = (e) => {
    const t = e.target, a = cur(); if (!a) return;
    if (t.dataset.k) {
      const k = t.dataset.k, v = t.dataset.lista ? t.value.split('\n').map((x) => x.trim()).filter(Boolean) : t.tagName === 'SELECT' || t.type === 'number' ? (t.value === '' ? null : +t.value) : t.value;
      a.campos = { ...(a.campos || {}), [k]: v }; guardar({ campos: { [k]: v } });
      if (k === 'precio' || k === 'ingreso') setTimeout(() => { const f = $('#av-ficha', el), y = f ? window.scrollY : 0; if (!alive() || !f) return; mount(f, ficha(cur())); window.scrollTo(0, y); }, 0);
      return;
    }
    if (t.dataset.jr) {
      const [et, fi] = t.dataset.jr.split('.'), j = limpiarJourney(a.journey);
      a.journey = limpiarJourney({ ...j, [et]: { ...(j[et] || {}), [fi]: t.value } });
      guardar({ journey: a.journey }); pintarJourneyHead(); return;
    }
    if (t.dataset.ang) { const i = +t.dataset.i; a.angulos = (a.angulos || []).map((g, j) => (j === i ? { ...g, [t.dataset.ang]: t.value } : g)); return guardar({ angulos: a.angulos.filter((g) => g.texto.trim()) }); }
    if (t.dataset.top === 'nombre') { a.nombre = t.value.trim() || a.nombre; return guardar({ nombre: a.nombre }); }
    if (t.dataset.top === 'peso') { a.peso = +t.value; return guardar({ peso: a.peso }); }
  };
  el.oninput = (e) => {
    if (e.target.dataset.top === 'peso') { const bx = e.target.parentElement.querySelector('b'); if (bx) bx.textContent = e.target.value + '%'; }
    if (e.target.hasAttribute('data-av-pedido')) S.pedido = e.target.value;
  };
  paint();
}
