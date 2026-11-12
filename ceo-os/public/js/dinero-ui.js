// Las mesas de dinero de Consulting: el embudo visual y la rentabilidad, por cliente y por mes.
import { html, raw, mount, api, col, ico, toast, $ } from './core.js';
import { cargarContexto, contextoLista, contextoActual, ponerContexto } from './contexto.js';
import { idEmbudo, limpiarEmbudo, analizarEmbudo, analizarLineas, etapasDeLeads } from './embudo-datos.js';
import { fallo, vacio } from './visual.js';

const C = col('embudos');
const q = (n) => { const v = Math.round(Number(n) || 0); return `${v < 0 ? '-' : ''}Q${Math.abs(v).toLocaleString('es-GT')}`; };
const pct = (n) => `${Math.round((Number(n) || 0) * 100)}%`;
const mesHoy = () => new Date().toISOString().slice(0, 7);

function dibujo(pasos, fuga) {
  const W = 620, H = 66, cx = W / 2; let d = '';
  pasos.forEach((p, i) => {
    const a = p.ancho * W, b = (pasos[i + 1]?.ancho ?? p.ancho * 0.82) * W, y = i * H;
    d += `<path d="M${cx - a / 2} ${y + 2}H${cx + a / 2}L${cx + b / 2} ${y + H - 2}H${cx - b / 2}Z" class="${fuga?.indice === i + 1 ? 'em-f' : 'em-p'}" style="opacity:${(1 - i * 0.12).toFixed(2)}"/>`;
    d += `<text x="${cx}" y="${y + 29}" text-anchor="middle" class="em-n">${p.n.toLocaleString('es-GT')}</text><text x="${cx}" y="${y + 47}" text-anchor="middle" class="em-e${fuga?.indice === i + 1 ? ' em-sobre' : ''}">${p.nombre}</text>`;
  });
  return raw(`<svg class="em-svg" viewBox="0 0 ${W} ${H * pasos.length}" role="img" aria-label="Embudo de ventas">${d}</svg>`);
}

export async function pintarDinero(el, { me, area, tabs, vista, alive }) {
  await cargarContexto(me).catch(() => {});
  if (!alive()) return;
  const lista = contextoLista().filter((c) => c.slug && (me.role === 'ceo' || c.slug !== 'inherent'));
  const pedido = contextoActual(me);
  let slug = lista.some((c) => c.slug === pedido) ? pedido : lista[0]?.slug || '', mes = mesHoy(), doc = null, d = null, gastoMov = 0;
  const cargar = async () => {
    doc = await C.get(idEmbudo(slug, mes)).catch(() => null);
    d = limpiarEmbudo({ ...(doc || {}), client_slug: slug, mes });
    const movs = await col('movimientos').list().catch(() => []);
    gastoMov = movs.filter((m) => !m.archivado && m.client_slug === slug && String(m.fecha).startsWith(mes)).reduce((s, m) => s + (Number(m.costo) || 0), 0);
    pintar();
  };
  const guardar = async () => {
    try {
      const datos = limpiarEmbudo({ ...d, client_slug: slug, mes });
      doc = doc ? await C.save({ ...doc, ...datos }) : await api('db/embudos', { method: 'POST', body: { ...datos, id: idEmbudo(slug, mes) } });
      d = datos; toast('Guardado'); pintar();
    } catch (e) { toast(e.message, true); }
  };
  const barra = () => html`<div class="din-bar"><select class="in" id="d-cl" aria-label="Cliente">${lista.map((c) => html`<option value="${c.slug}" ${c.slug === slug ? 'selected' : ''}>${c.name}</option>`)}</select><input class="in" id="d-mes" type="month" value="${mes}" aria-label="Mes"></div>`;
  const cabeza = (titulo, sub) => html`<div class="hello sp-hero ar-head" style="--ar-c:var(${area.color})"><span class="ar-ico">${ico(area.icono, 22)}</span><div class="ar-tit"><h1>${titulo}</h1><p>${sub}</p></div></div>${tabs(area, 'herramientas')}`;

  function embudo() {
    const a = analizarEmbudo(d.etapas, d), f = a.fuga;
    mount(el, html`${cabeza('Embudo', 'Dónde se pierde la venta y cuánto vale arreglarlo.')}${barra()}
      <div class="em"><div class="em-vis">${dibujo(a.pasos, f)}</div><div class="em-lado">
        ${f ? html`<div class="em-av mal"><b>La mayor fuga: ${f.de} → ${f.a} (${pct(f.tasa)})</b><p>Si sube 10 puntos: ${f.extraClientes.toFixed(1)} clientes más, ${q(f.extraVenta)} en ventas y ${q(f.extraMargen)} de margen al mes.</p></div>` : html`<div class="em-av"><b>Llena las cinco etapas</b><p>Con eso marco la mayor fuga y cuánto vale.</p></div>`}
        <div class="em-f-g">${d.etapas.map((e, i) => html`<label><span>${e.nombre}</span><input class="in" inputmode="numeric" data-e="${i}" value="${e.n || ''}" placeholder="0"></label>`)}
          <label><span>Ticket promedio (Q)</span><input class="in" inputmode="numeric" data-k="ticket" value="${d.ticket || ''}" placeholder="0"></label><label><span>Margen %</span><input class="in" inputmode="numeric" data-k="margen_pct" value="${d.margen_pct || ''}" placeholder="0"></label></div>
        <div class="em-acc"><button class="btn" type="button" data-d="guardar">Guardar</button>${slug === 'inherent' ? html`<button class="btn ghost" type="button" data-d="crm">Traer del CRM</button>` : ''}</div>
        <p class="em-nota">El valor es una estimación con estos datos: supone que el resto del embudo se mantiene igual.</p></div></div>`);
  }
  function rentabilidad() {
    const r = analizarLineas(d.lineas);
    mount(el, html`${cabeza('Rentabilidad', 'Qué oferta y qué canal dejan dinero de verdad.')}${barra()}
      <div class="ren-k"><div><span>Ingresos</span><b>${q(r.ingreso)}</b></div><div><span>Costos</span><b>${q(r.costo)}</b></div><div><span>Margen</span><b>${q(r.margen)}</b><small>${pct(r.pct)}</small></div><div><span>Gasto en movimientos</span><b>${q(gastoMov)}</b><small>Registrado en la Hoja</small></div></div>
      ${r.peor && r.peor.margen < r.mejor.margen ? html`<div class="em-av"><b>Empuja ${r.mejor.nombre}${r.peor.margen < 0 ? html` y revisa ${r.peor.nombre}: pierde ${q(-r.peor.margen)}` : ''}.</b><p>${r.mejor.nombre} deja ${q(r.mejor.margen)} (${pct(r.mejor.pct)}). ${r.peor.nombre} deja ${q(r.peor.margen)} (${pct(r.peor.pct)}).</p></div>` : ''}
      <div class="mv-t"><table><thead><tr><th>Oferta o canal</th><th>Tipo</th><th>Ingreso</th><th>Costo</th><th>Margen</th><th></th></tr></thead><tbody>
      ${d.lineas.map((l, i) => { const m = l.ingreso - l.costo; return html`<tr><td data-t="Nombre"><input class="in" data-l="${i}" data-c="nombre" value="${l.nombre}" aria-label="Nombre"></td><td data-t="Tipo"><select class="in" data-l="${i}" data-c="tipo" aria-label="Tipo"><option value="oferta" ${l.tipo === 'oferta' ? 'selected' : ''}>Oferta</option><option value="canal" ${l.tipo === 'canal' ? 'selected' : ''}>Canal</option></select></td><td data-t="Ingreso"><input class="in" inputmode="numeric" data-l="${i}" data-c="ingreso" value="${l.ingreso || ''}" aria-label="Ingreso"></td><td data-t="Costo"><input class="in" inputmode="numeric" data-l="${i}" data-c="costo" value="${l.costo || ''}" aria-label="Costo"></td><td data-t="Margen"><b class="${m < 0 ? 'ren-mal' : ''}">${q(m)}</b></td><td><button class="btn-icon" type="button" data-d="quitar" data-i="${i}" aria-label="Quitar ${l.nombre}">${ico('x', 15)}</button></td></tr>`; })}
      </tbody></table></div>
      ${d.lineas.length ? '' : html`${vacio({ icono: 'inbox', titulo: 'Agrega tu primera oferta o canal', linea: 'Escribe cuánto ingresó y cuánto costó. Con dos líneas ya se ve qué empujar.' })}`}
      <div class="em-acc" style="margin-top:12px"><button class="btn ghost" type="button" data-d="linea">${ico('plus', 14)} Agregar</button><button class="btn" type="button" data-d="guardar">Guardar</button></div>`);
  }
  const pintar = () => { if (alive()) (vista === 'rentabilidad' ? rentabilidad : embudo)(); };
  const leer = () => {
    el.querySelectorAll('[data-e]').forEach((i) => { d.etapas[+i.dataset.e].n = Number(i.value.replace(/\D/g, '')) || 0; });
    el.querySelectorAll('[data-k]').forEach((i) => { d[i.dataset.k] = Number(i.value.replace(/[^\d.]/g, '')) || 0; });
    el.querySelectorAll('[data-l]').forEach((i) => { const l = d.lineas[+i.dataset.l], c = i.dataset.c; l[c] = c === 'ingreso' || c === 'costo' ? Number(i.value.replace(/[^\d.-]/g, '')) || 0 : i.value; });
  };
  el.onchange = (e) => {
    if (e.target.id === 'd-cl') { slug = e.target.value; ponerContexto(me, slug); return cargar(); }
    if (e.target.id === 'd-mes') { mes = e.target.value || mesHoy(); return cargar(); }
    leer(); pintar();
  };
  el.onclick = async (e) => {
    const b = e.target.closest('[data-d]'); if (!b) return;
    leer();
    if (b.dataset.d === 'guardar') return guardar();
    if (b.dataset.d === 'linea') { d.lineas.push({ nombre: '', tipo: 'oferta', ingreso: 0, costo: 0 }); return pintar(); }
    if (b.dataset.d === 'quitar') { d.lineas.splice(+b.dataset.i, 1); return pintar(); }
    if (b.dataset.d === 'crm') { try { const n = etapasDeLeads(await col('leads').list(), mes); n[0].n = d.etapas[0].n || n[0].n; d.etapas = n; pintar(); } catch (er) { toast(er.message, true); } }
  };
  try { await cargar(); } catch (e) { if (alive()) mount(el, html`${fallo({ titulo: 'No pude abrir esta mesa', linea: e.message })}`); }
}
