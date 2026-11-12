// Vista del Copywriting Studio (herramienta copywriting-studio de Marketing): el marco de mensajes (consciencia × anillo, con mensaje,
// prueba y objeción) y el tablero de variantes por activo, con el contador de caracteres contra el límite del canal y el chip de Laya.
// Existe para que tool-shell.js pinte el centro con un solo contrato (nuevo, pintar, resumen). La variante elegida se empuja a Ads
// (como Borrador: el copy de anuncio sigue pidiendo el OK del CEO), al caption de la pieza o a la landing; nada se auto-aprueba.
// Pinta con html`…` (todo se escapa; nada de modelo ni de usuario entra a raw()). Lo vacío dice «⚠️ SIN DATOS» y de dónde sale.
import { html, mount, api, ico, toast, today } from '../core.js';
import { SIN_DATOS } from '../consulting/marcos.js';
import { CONSCIENCIAS, ANILLOS, CANALES, CANAL_IDS, MAX_ACTIVOS, MAX_VARIANTES, vacio, limpiar, variante, activosVivos, contador, contadorTexto, pasadas, elegidaDe, celdaMarco, pruebaTexto, sinPrueba, paraAds, faltasEmpujar, faltasParaAprobar, textoCopiable, resumen } from './copy.js';
import { vacio as vacioOS } from '../visual.js';

const enc = encodeURIComponent;
const layaTxt = (v) => (v.laya?.puntaje ? `${v.laya.puntaje} / 4${v.laya.chip ? ` · ${v.laya.chip}` : ''}` : 'pendiente');
async function copiar(t, msg) { try { await navigator.clipboard.writeText(t); toast(msg); } catch { toast('Selecciona y copia el texto', true); } }

export const vista = {
  nuevo() { return vacio(); },
  resumen(contenido) { return resumen(contenido); },

  pintar(el, { contenido, editable, onCambio, slug, ctx } = {}) {
    const ed = Boolean(editable), marca = ctx?.cliente?.nombre || '';
    const S = { c: limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {})), tab: 'marco', ocupado: false };
    const cambio = (repinta = true) => { S.c = limpiar(S.c); if (typeof onCambio === 'function') onCambio(structuredClone(S.c)); if (repinta) pinta(); };
    const activo = (id) => S.c.activos.find((a) => a.id === id);

    // ---------- Marco ----------
    const grillaMarco = () => html`<div class="cp-wrap"><table class="cp-grid"><thead><tr><th scope="col">Consciencia</th>${ANILLOS.map((n) => html`<th scope="col">${n}</th>`)}</tr></thead>
      <tbody>${CONSCIENCIAS.map((n, i) => html`<tr><th scope="row">${i + 1} · ${n}</th>${ANILLOS.map((_, a) => { const m = celdaMarco(S.c, i + 1, a); return html`<td data-sd="${m && m.mensaje ? 0 : 1}">${m && m.mensaje ? html`<b>${m.mensaje}</b><small>${pruebaTexto(m)}</small>${m.objecion ? html`<small class="mut">Objeción: ${m.objecion}</small>` : ''}` : html`<span class="mut sm">${SIN_DATOS}</span>`}</td>`; })}</tr>`)}</tbody></table></div>`;
    const filaMarco = (m, i) => html`<li class="cp-fila" data-i="${i}">
      ${ed ? html`<div class="cp-f2"><select class="in" data-m="consciencia" aria-label="Consciencia">${CONSCIENCIAS.map((n, k) => html`<option value="${k + 1}" ${m.consciencia === k + 1 ? 'selected' : ''}>${k + 1} · ${n}</option>`)}</select>
          <select class="in" data-m="anillo" aria-label="Anillo"><option value="">Anillo…</option>${ANILLOS.map((n, k) => html`<option value="${k}" ${m.anillo === k ? 'selected' : ''}>${n}</option>`)}</select>
          <input class="in" data-m="avatar" value="${m.avatar}" maxlength="80" placeholder="Avatar (opcional)" aria-label="Avatar" autocomplete="off">
          <button class="btn sm" type="button" data-a="quitar-marco">${ico('x', 14)} Quitar</button></div>
        <textarea class="in" data-m="mensaje" rows="2" maxlength="300" placeholder="Mensaje" aria-label="Mensaje">${m.mensaje}</textarea>
        <textarea class="in" data-m="prueba" rows="2" maxlength="300" placeholder="Prueba (vacía = ${SIN_DATOS})" aria-label="Prueba">${m.prueba}</textarea>
        <input class="in" data-m="fuente" value="${m.fuente}" maxlength="160" placeholder="De dónde sale la prueba" aria-label="Fuente de la prueba" autocomplete="off">
        <textarea class="in" data-m="objecion" rows="2" maxlength="300" placeholder="Objeción" aria-label="Objeción">${m.objecion}</textarea>`
      : html`<p><b>${CONSCIENCIAS[m.consciencia - 1]}</b> · ${m.avatar || (m.anillo === null ? SIN_DATOS : ANILLOS[m.anillo])}</p><p>${m.mensaje || SIN_DATOS}</p><p class="${sinPrueba(m) ? 'cp-sd' : ''}">${pruebaTexto(m)}${m.fuente ? html` <span class="mut sm">(${m.fuente})</span>` : ''}</p><p class="mut">Objeción: ${m.objecion || SIN_DATOS}</p>`}</li>`;
    const pestanaMarco = () => html`${grillaMarco()}
      <div class="hk-barra"><span class="mut sm">Una fila por consciencia × anillo. La prueba va solo si es real.</span><span class="sp"></span>${ed ? html`<button class="btn" type="button" data-a="nuevo-marco">${ico('plus', 15)} Mensaje</button>` : ''}</div>
      ${S.c.marco.length ? html`<ul class="cp-lista">${S.c.marco.map(filaMarco)}</ul>` : html`${vacioOS({ icono: 'inbox', titulo: 'Aún no hay mensajes', linea: `${SIN_DATOS}: sale del mensaje del plan del mes y de la diana (anillos). Agrega el primero o pídelo a la IA.` , boton: { texto: 'Armarlo en el Chat', chat: { modo: 'marketing', borrador: 'Armemos los mensajes de esta marca.' } }})}`}`;

    // ---------- Tablero ----------
    const contadores = (a, v) => CANALES[a.canal].campos.map(([k, nombre]) => { const r = contador(a.canal, k, v[k]); return html`<span class="cp-cnt" data-over="${r.pasa ? 1 : 0}" data-cnt="${a.id}.${v.id}.${k}">${nombre}: ${contadorTexto(r)}${r.pasa ? ` · pasa ${-r.falta}` : ''}</span>`; });
    const varFila = (a, v) => html`<li class="cp-var" data-v="${v.id}" data-elegida="${v.elegida ? 1 : 0}">
      <div class="cp-v1"><label class="cp-el"><input type="radio" name="el-${a.id}" data-a="elegir" ${v.elegida ? 'checked' : ''} ${ed ? '' : 'disabled'} aria-label="Elegir esta variante"> Elegida</label>
        <span class="cp-laya" data-pend="${v.laya?.puntaje ? 0 : 1}">Laya: ${layaTxt(v)}</span>${v.empujada ? html`<span class="cp-push">${ico('check', 13)} Enviada a ${v.empujada.a === 'ads' ? 'Ads (Borrador)' : v.empujada.a}</span>` : ''}</div>
      ${CANALES[a.canal].campos.map(([k, nombre]) => (ed
        ? html`<label class="cp-c"><span class="mut sm">${nombre}</span>${k === 'texto' ? html`<textarea class="in" data-vf="texto" rows="3" aria-label="${nombre}">${v.texto}</textarea>` : html`<input class="in" data-vf="${k}" value="${v[k]}" aria-label="${nombre}" autocomplete="off">`}</label>`
        : html`<p><span class="mut sm">${nombre}</span> ${v[k] || SIN_DATOS}</p>`))}
      <div class="cp-cnts">${contadores(a, v)}</div>
      ${ed ? html`<div class="cp-acc">${CANALES[a.canal].ads ? html`<button class="btn sm" type="button" data-a="ads" ${v.elegida ? '' : 'disabled'} title="${v.elegida ? 'Crea un Borrador en Ads: falta el OK del CEO' : 'Primero elige la variante'}">${ico('send', 14)} A Ads (Borrador)</button>` : ''}
        ${a.canal === 'caption' ? html`<input class="in sm" data-ap="pieza" value="${a.pieza}" maxlength="60" placeholder="id de la pieza" aria-label="Id de la pieza" autocomplete="off"><button class="btn sm" type="button" data-a="caption" ${v.elegida ? '' : 'disabled'}>${ico('send', 14)} Al caption</button>` : ''}
        ${a.canal === 'landing' ? html`<button class="btn sm" type="button" data-a="landing" ${v.elegida ? '' : 'disabled'}>${ico('copy', 14)} A la landing (copiar)</button>` : ''}
        <button class="btn sm" type="button" data-a="quitar-var">${ico('x', 14)} Quitar</button></div>` : ''}</li>`;
    const tarjeta = (a) => { const pas = pasadas(a), el_ = elegidaDe(a); return html`<article class="cp-act" data-id="${a.id}">
      <header class="cp-h">${ed ? html`<input class="in" data-ap="nombre" value="${a.nombre}" maxlength="100" aria-label="Nombre del activo" autocomplete="off"><select class="in" data-ap="canal" aria-label="Canal">${CANAL_IDS.map((k) => html`<option value="${k}" ${a.canal === k ? 'selected' : ''}>${CANALES[k].nombre}</option>`)}</select>
          <input class="in" data-ap="avatar" value="${a.avatar}" maxlength="80" placeholder="Avatar" aria-label="Avatar" autocomplete="off">` : html`<b>${a.nombre}</b><span>${CANALES[a.canal].nombre}</span>${a.avatar ? html`<span>${a.avatar}</span>` : ''}`}
        <span class="sp"></span><span class="mut sm">${plural(a.variantes.length, 'variante')}${el_ ? '' : ' · sin elegida'}</span>${pas.length ? html`<span class="cp-cnt" data-over="1">${pas.length} sobre el límite</span>` : ''}
        ${ed ? html`<button class="btn sm" type="button" data-a="nueva-var" ${a.variantes.length >= MAX_VARIANTES ? 'disabled' : ''}>${ico('plus', 14)} Variante</button><button class="btn sm" type="button" data-a="archivar">${ico('inbox', 14)} Archivar</button>` : ''}</header>
      ${a.variantes.length ? html`<ul class="cp-vars">${a.variantes.map((v) => varFila(a, v))}</ul>` : html`<p class="mut sm">${SIN_DATOS}: sin variantes. Pídelas a la IA o agrega la primera.</p>`}</article>`; };
    const pestanaTablero = () => { const A = activosVivos(S.c);
      return html`<div class="hk-barra"><span class="mut sm">Los anuncios entran a Ads como Borrador: el CEO da el OK. Nada se aprueba aquí.</span><span class="sp"></span>${ed ? html`<button class="btn" type="button" data-a="nuevo-activo" ${S.c.activos.length >= MAX_ACTIVOS ? 'disabled' : ''}>${ico('plus', 15)} Activo</button>` : ''}</div>
      ${A.length ? A.map(tarjeta) : html`${vacioOS({ icono: 'inbox', titulo: 'Aún no hay activos', linea: `${SIN_DATOS}: un activo es un anuncio, un caption o una landing con sus variantes.` , boton: { texto: 'Armarlo en el Chat', chat: { modo: 'marketing', borrador: 'Armemos los activos de esta marca.' } }})}`}`; };

    const plural = (n, u) => `${n} ${u}${n === 1 ? '' : 's'}`;
    function pinta() {
      mount(el, html`<div class="cp"><nav class="hk-tabs" role="tablist" aria-label="Marco o tablero"><button type="button" role="tab" class="${S.tab === 'marco' ? 'on' : ''}" aria-selected="${S.tab === 'marco'}" data-t="marco">${ico('layout-grid', 15)} Marco de mensajes</button>
        <button type="button" role="tab" class="${S.tab === 'tablero' ? 'on' : ''}" aria-selected="${S.tab === 'tablero'}" data-t="tablero">${ico('square-pen', 15)} Tablero de variantes</button></nav>
        ${S.tab === 'marco' ? pestanaMarco() : pestanaTablero()}</div>`);
    }

    // ---------- Acciones de empujar ----------
    const marcar = (a, v, dest, ref) => { v.empujada = { a: dest, ref, en: today() }; cambio(); };
    async function empujar(a, v, dest) {
      const f = faltasEmpujar(a, v); if (f.length) return toast(f[0], true);
      if (S.ocupado) return; S.ocupado = true;
      try {
        if (dest === 'ads') {
          const cuerpo = paraAds(a, v, { perfil: slug, marcaNombre: marca }), r = await api('ads-studio', { method: 'POST', body: cuerpo }), nuevo = r?.items?.[0];
          const falta = faltasParaAprobar(a, v, { perfil: slug });
          marcar(a, v, 'ads', nuevo?.id || ''); toast(falta.length ? `En Ads como Borrador. Para aprobarlo falta: ${falta[0]}` : 'En Ads como Borrador: falta el OK del CEO');
        } else if (dest === 'caption') {
          if (!a.pieza) return toast('Pon el id de la pieza', true);
          const lista = await api('db/content'), cur = (Array.isArray(lista) ? lista : lista?.items || []).find((x) => x.id === a.pieza);
          if (!cur) return toast('Esa pieza no existe en este calendario', true);
          await api(`db/content/${enc(a.pieza)}`, { method: 'PUT', body: { ...cur, caption: v.texto, v: cur.v } });
          marcar(a, v, 'caption', a.pieza); toast('Caption puesto en la pieza');
        } else { await copiar(textoCopiable(v), 'Copiado: pégalo en la landing'); marcar(a, v, 'landing', ''); }
      } catch (e) { toast(e.message || 'No se pudo enviar', true); } finally { S.ocupado = false; }
    }

    // ---------- Eventos ----------
    el.onclick = (e) => {
      const t = e.target.closest('[data-t],[data-a]'); if (!t || !el.contains(t)) return;
      if (t.dataset.t) { S.tab = t.dataset.t; return pinta(); }
      if (!ed) return;
      const a = t.dataset.a, art = activo(t.closest('.cp-act')?.dataset.id), vid = t.closest('[data-v]')?.dataset.v, v = art?.variantes.find((x) => x.id === vid);
      if (a === 'nuevo-marco') { S.c.marco.push({ consciencia: 1, anillo: 0, avatar: '', mensaje: 'Escribe el mensaje', prueba: '', fuente: '', objecion: '' }); cambio(); }
      else if (a === 'quitar-marco') { S.c.marco.splice(Number(t.closest('[data-i]').dataset.i), 1); cambio(); }
      else if (a === 'nuevo-activo') { S.c.activos.push({ id: `a${Date.now().toString(36)}`, nombre: `Activo ${S.c.activos.length + 1}`, canal: 'meta', avatar: '', consciencia: null, pieza: '', archivado: false, variantes: [variante({ texto: 'Escribe la variante' }), variante({ texto: 'Escribe otra variante' })] }); cambio(); }
      else if (a === 'archivar' && art) { art.archivado = true; cambio(); }
      else if (a === 'nueva-var' && art) { art.variantes.push(variante({ texto: 'Escribe la variante' })); cambio(); }
      else if (a === 'quitar-var' && art && v) { art.variantes = art.variantes.filter((x) => x !== v); cambio(); }
      else if (a === 'elegir' && art && v) { for (const x of art.variantes) x.elegida = x === v; cambio(); }
      else if (['ads', 'caption', 'landing'].includes(a) && art && v) empujar(art, v, a);
    };
    // Mientras se escribe solo se actualiza el contador (no se repinta: el campo conserva el foco); al salir se guarda.
    el.oninput = (e) => {
      const t = e.target, k = t.dataset?.vf; if (!ed || !k) return;
      const art = activo(t.closest('.cp-act')?.dataset.id), v = art?.variantes.find((x) => x.id === t.closest('[data-v]')?.dataset.v); if (!v) return;
      v[k] = t.value;
      const r = contador(art.canal, k, t.value), nodo = t.closest('[data-v]').querySelector(`[data-cnt="${art.id}.${v.id}.${k}"]`);
      if (nodo) { nodo.dataset.over = r.pasa ? 1 : 0; nodo.textContent = `${CANALES[art.canal].campos.find(([x]) => x === k)[1]}: ${contadorTexto(r)}${r.pasa ? ` · pasa ${-r.falta}` : ''}`; }
    };
    el.onchange = (e) => {
      const t = e.target; if (!ed || !el.contains(t)) return;
      if (t.dataset.m) { const m = S.c.marco[Number(t.closest('[data-i]').dataset.i)]; if (m) { const k = t.dataset.m; m[k] = ['consciencia', 'anillo'].includes(k) ? (t.value === '' ? null : Number(t.value)) : t.value; cambio(); } return; }
      const art = activo(t.closest('.cp-act')?.dataset.id); if (!art) return;
      if (t.dataset.ap) { art[t.dataset.ap] = t.value; return cambio(); }
      if (t.dataset.vf) { const v = art.variantes.find((x) => x.id === t.closest('[data-v]')?.dataset.v); if (v) { v[t.dataset.vf] = t.value; v.empujada = null; cambio(); } }
    };
    pinta();
  },
};
