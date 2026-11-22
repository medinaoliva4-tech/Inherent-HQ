// Revenue (#/revenue): el motor de leads, guiado. Marca + a quién buscamos + los leads → califica y descarta →
// redacta → tú editas → pides el envío → CEO/COO aprueban ese contenido exacto → sale (con tope y horario).
// Nada sale solo: el servidor se detiene en la aprobación. Sin correo o redactor conectados lo dice, no lo finge.
// El CRM de siempre sigue en #/org/sales (enlace arriba).
import { api, skel, toast } from '../core.js';
import { h } from '../kit/dom.js';
import { cargarContexto, contextoLista, contextoActual } from '../contexto.js';

export const esqueleto = () => skel('pagina');
const lista = (s) => String(s || '').split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
const ESTADOS = { calificado: 'Calificado', redactado: 'Redactado', en_aprobacion: 'Esperando aprobación', aprobado: 'Aprobado', parcial: 'Enviado en parte', enviado: 'Enviado', cancelado: 'Cancelado', pausado: 'En pausa' };

// Leads: JSON (arreglo) o CSV con encabezado: name,company,email,industry,size,location,contact_role,signals (señales con «;»).
export function leadsDeTexto(txt) {
  const t = String(txt || '').trim(); if (!t) return [];
  if (t.startsWith('[')) { const j = JSON.parse(t); return Array.isArray(j) ? j : []; }
  const filas = t.split(/\r?\n/).filter((l) => l.trim()), cab = filas.shift().split(',').map((x) => x.trim());
  return filas.map((f) => { const c = f.split(',').map((x) => x.trim()), o = {}; cab.forEach((k, i) => { if (c[i]) o[k] = c[i]; }); if (typeof o.signals === 'string') o.signals = o.signals.split(';').map((x) => x.trim()).filter(Boolean); if (o.size) o.size = Number(o.size) || o.size; return o; });
}

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, ...hijos) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); n.append(...hijos.flat().filter(Boolean)); return n; };

// Anillo de puntaje (0–100): el número es el del motor, no uno inventado.
export function anillo(p, nivel) {
  const R = 18, C = 2 * Math.PI * R, v = Math.max(0, Math.min(100, Number(p) || 0));
  return svg('svg', { viewBox: '0 0 44 44', class: `rv-anillo rv-a-${nivel || 'x'}`, role: 'img', 'aria-label': `Puntaje ${Math.round(v)} de 100` },
    svg('circle', { cx: 22, cy: 22, r: R, class: 'rv-a-fondo' }), svg('circle', { cx: 22, cy: 22, r: R, class: 'rv-a-val', 'stroke-dasharray': `${(v / 100) * C} ${C}`, transform: 'rotate(-90 22 22)' }),
    svg('text', { x: 22, y: 26, 'text-anchor': 'middle', class: 'rv-a-num' }, String(Math.round(v))));
}
// Las razones del motor vienen como «Sí · Industria: …» / «No · …» / «Sin dato · …»: se vuelven un punto de color + el criterio.
export function criterios(razones = []) {
  const out = []; let cur = null;
  for (const t of razones.join(' · ').split(' · ')) { if (/^(Sí|No|Sin dato)$/.test(t.trim())) { cur = { ok: t.trim(), txt: '' }; out.push(cur); } else if (cur) cur.txt = (cur.txt ? cur.txt + ' · ' : '') + t.trim(); }
  return out;
}
// El embudo: cuántos pasan cada puerta. Todo sale de los items del lote (nada de números sueltos).
export function embudo(l) {
  const it = l.items || [], escr = it.filter((x) => x.escribir), val = escr.filter((x) => x.borrador?.ok), env = it.filter((x) => x.envio?.estado === 'enviado');
  return [['Leads', it.length], ['Encajan', escr.length], ['Con correo válido', val.length], ['Aprobado', l.aprobado ? val.length : 0], ['Enviados', env.length]];
}
const gráficoEmbudo = (l) => {
  const f = embudo(l), max = Math.max(1, f[0][1]);
  return h('div', { class: 'rv-emb', role: 'img', 'aria-label': f.map(([n, c]) => `${n}: ${c}`).join(', ') }, f.map(([n, c], i) => h('div', { class: 'rv-emb-f' }, h('span', { class: 'rv-emb-n' }, n), h('span', { class: 'rv-emb-b' }, h('i', { style: `width:${Math.max(c ? 6 : 0, (c / max) * 100)}%`, class: `rv-emb-i${i}` })), h('b', {}, String(c)))));
};

function tarjeta(it, sel, abrir) {
  const nombre = it.lead.name || it.lead.company || it.lead.email || `Lead ${it.i}`, b = it.borrador;
  const estado = it.envio?.estado === 'enviado' ? '✓ enviado' : !it.escribir ? 'descartado' : b ? (b.ok ? '✓ listo' : '✗ revisar') : 'sin correo';
  const bt = h('button', { type: 'button', class: `rv-tj${it.escribir ? '' : ' rv-no'}${sel ? ' on' : ''}`, 'aria-pressed': String(!!sel), 'aria-label': `${nombre}: ${estado}` },
    anillo(it.puntaje?.puntaje, it.puntaje?.nivel), h('span', { class: 'rv-tj-t' }, h('b', {}, nombre), h('small', {}, it.lead.company || it.lead.email || '')),
    h('span', { class: 'rv-pts' }, criterios(it.puntaje?.razones).map((c) => h('i', { class: `rv-pt rv-pt-${c.ok === 'Sí' ? 'si' : c.ok === 'No' ? 'no' : 'nd'}`, title: `${c.ok} · ${c.txt}` }))), h('em', { class: 'rv-est' }, estado));
  bt.addEventListener('click', () => abrir(it)); return bt;
}

function panelLead(l, it, editable, recargar) {
  if (!it) return h('aside', { class: 'rv-panel rv-panel-vacio' }, h('p', { class: 'rv-mut' }, 'Elige un lead para ver por qué encaja y editar su correo.'));
  const nombre = it.lead.name || it.lead.company || it.lead.email, b = it.borrador, msg = h('span', { class: 'rv-mut', 'aria-live': 'polite' });
  const crit = h('ul', { class: 'rv-crit' }, criterios(it.puntaje?.razones).map((c) => h('li', {}, h('i', { class: `rv-pt rv-pt-${c.ok === 'Sí' ? 'si' : c.ok === 'No' ? 'no' : 'nd'}` }), h('span', {}, c.txt || c.ok))));
  const cab = h('header', { class: 'rv-panel-h' }, anillo(it.puntaje?.puntaje, it.puntaje?.nivel), h('div', {}, h('b', {}, nombre), h('small', {}, `${it.lead.company || ''} ${it.lead.email ? '· ' + it.lead.email : ''}`)));
  if (!it.escribir) return h('aside', { class: 'rv-panel' }, cab, crit, h('p', { class: 'rv-aviso' }, `No se escribe: ${it.motivo || it.codigo || 'no encaja'}`));
  if (!b) return h('aside', { class: 'rv-panel' }, cab, crit, h('p', { class: 'rv-mut' }, 'Aún sin borrador. Redacta el lote para generarlo.'));
  const as = h('input', { class: 'rv-in', value: b.asunto || '', 'aria-label': 'Asunto', disabled: !editable }), cu = h('textarea', { class: 'rv-in', rows: 9, 'aria-label': 'Correo', disabled: !editable }, b.cuerpo || '');
  const guardar = h('button', { type: 'button', class: 'btn btn-s' }, 'Guardar');
  guardar.addEventListener('click', async () => { guardar.disabled = true; try { await api(`revenue/lotes/${l.id}/borradores/${it.i}`, { method: 'PUT', body: { asunto: as.value, cuerpo: cu.value } }); toast('Guardado'); recargar(it.i); } catch (e) { msg.textContent = e.message || 'No se pudo guardar'; } finally { guardar.disabled = false; } });
  return h('aside', { class: 'rv-panel' }, cab, crit, h('p', { class: b.ok ? 'rv-ok' : 'rv-err' }, b.ok ? '✓ Pasó la validación' : `✗ No sale: ${(b.errores || b.motivos || ['no pasó la validación']).join('; ')}`), as, cu, editable ? h('div', { class: 'rv-acc' }, guardar, msg) : '');
}

async function lotePantalla(cuerpo, id, me, estadoCan, selId) {
  const recargar = (i) => lotePantalla(cuerpo, id, me, estadoCan, i);
  let l; try { l = await api(`revenue/lotes/${id}`); } catch (e) { cuerpo.replaceChildren(h('p', { class: 'rv-err', role: 'alert' }, e.message || 'No se encontró el lote')); return; }
  const puedeAprobar = ['ceo', 'coo'].includes(me.role), msg = h('p', { class: 'rv-mut', 'aria-live': 'polite' });
  const accion = (txt, fn, cls = 'btn') => { const b = h('button', { type: 'button', class: cls }, txt); b.addEventListener('click', async () => { b.disabled = true; try { await fn(); } catch (e) { msg.textContent = e.message || 'No se pudo'; msg.className = 'rv-err'; b.disabled = false; } }); return b; };
  const acciones = [], oferta = h('input', { class: 'rv-in', placeholder: 'Qué ofreces en una frase', 'aria-label': 'Oferta' }), caso = h('input', { class: 'rv-in', placeholder: 'Un caso real (opcional)', 'aria-label': 'Caso' });
  if (['calificado', 'redactado'].includes(l.estado)) acciones.push(oferta, caso, accion(l.estado === 'calificado' ? 'Redactar' : 'Redactar de nuevo', async () => {
    if (!oferta.value.trim()) { oferta.focus(); throw new Error('Escribe qué ofreces: el correo no tendría de qué hablar'); }
    msg.textContent = 'Redactando…'; msg.className = 'rv-mut'; await api(`revenue/lotes/${l.id}/redactar`, { method: 'POST', body: { contexto: { oferta: oferta.value.trim(), caso: caso.value.trim() || undefined } } }); recargar(selId);
  }));
  if (l.estado === 'redactado') acciones.push(accion('Pedir aprobación', async () => { const s = await api(`revenue/lotes/${l.id}/solicitar-envio`, { method: 'POST', body: {} }); toast(s.aviso || 'Esperando aprobación'); recargar(selId); }));
  if (l.estado === 'en_aprobacion') {
    if (puedeAprobar) acciones.push(accion('Aprobar y enviar', async () => { const run = await api(`workflow-runs/${l.run_id}`).catch(() => null), paso = run?.pasos?.['ok-lote']; const ap = await api(`revenue/lotes/${l.id}/aprobar`, { method: 'POST', body: { hash: paso?.hash, v: run?.v } }); toast(`Enviados: ${ap.lote?.resumen?.enviados ?? ap.resultado?.enviados ?? 0}`); recargar(selId); }));
    acciones.push(accion('Cancelar', async () => { await api(`revenue/lotes/${l.id}/cancelar`, { method: 'POST', body: {} }); recargar(selId); }, 'btn btn-s'));
  }
  if (['parcial', 'aprobado'].includes(l.estado) && puedeAprobar) acciones.push(accion('Soltar lo que quedó en cola', async () => { const c = await api(`revenue/lotes/${l.id}/continuar`, { method: 'POST', body: {} }); toast(`Salieron: ${c.resultado?.enviados ?? 0}`); recargar(selId); }));
  const editable = ['redactado', 'en_aprobacion'].includes(l.estado), sel = l.items.find((x) => x.i === selId) || l.items.find((x) => x.escribir) || l.items[0];
  const abrir = (it) => recargar(it.i), con = (k) => (estadoCan[k]?.estado === 'ready' ? `${k} ✓` : `${k}: sin conectar`);
  cuerpo.replaceChildren(h('div', { class: 'rv-lote' },
    h('div', { class: 'rv-sup' }, h('div', { class: 'rv-sup-i' }, h('b', {}, `Lote de ${l.slug}`), h('span', { class: `rv-est-lote rv-e-${l.estado}` }, ESTADOS[l.estado] || l.estado), h('small', {}, `${con('correo')} · ${con('redactor')}`)), gráficoEmbudo(l)),
    h('div', { class: 'rv-barra' }, ...acciones), l.estado === 'en_aprobacion' ? h('p', { class: 'rv-aviso' }, 'Nada sale hasta que el CEO o el COO aprueben este contenido exacto. Si editas un correo, hay que pedir la aprobación otra vez.') : '', msg,
    h('div', { class: 'rv-cols' }, h('div', { class: 'rv-grid' }, l.items.map((it) => tarjeta(it, sel && it.i === sel.i, abrir))), panelLead(l, sel, editable, recargar))));
}

async function nuevoLote(cuerpo, me, estadoCan) {
  await cargarContexto(me).catch(() => null);
  const marcas = contextoLista().filter((c) => c.slug && c.slug !== 'personal'), actual = contextoActual(me) || marcas[0]?.slug || '';
  const sel = h('select', { class: 'rv-in', 'aria-label': 'Marca' }, marcas.map((c) => h('option', { value: c.slug, selected: c.slug === actual }, c.name || c.slug)));
  const f = {
    ind: h('input', { class: 'rv-in', placeholder: 'Industrias (separadas por coma)', 'aria-label': 'Industrias' }), min: h('input', { class: 'rv-in', type: 'number', min: '0', placeholder: 'Tamaño mín.', 'aria-label': 'Tamaño mínimo' }), max: h('input', { class: 'rv-in', type: 'number', min: '0', placeholder: 'Tamaño máx.', 'aria-label': 'Tamaño máximo' }),
    ubi: h('input', { class: 'rv-in', placeholder: 'Ubicaciones', 'aria-label': 'Ubicaciones' }), sen: h('input', { class: 'rv-in', placeholder: 'Señales de compra', 'aria-label': 'Señales' }), car: h('input', { class: 'rv-in', placeholder: 'Cargos que decide', 'aria-label': 'Cargos' }),
    leads: h('textarea', { class: 'rv-in', rows: 7, placeholder: 'Pega tus leads: CSV con encabezado (name,company,email,industry,size,location,contact_role,signals) o un JSON…', 'aria-label': 'Leads' }),
  };
  const msg = h('p', { class: 'rv-mut', 'aria-live': 'polite' }), go = h('button', { type: 'button', class: 'btn' }, 'Calificar leads');
  go.addEventListener('click', async () => {
    let leads; try { leads = leadsDeTexto(f.leads.value); } catch { msg.textContent = 'No pude leer los leads: revisa el formato.'; msg.className = 'rv-err'; return; }
    if (!leads.length) { f.leads.focus(); msg.textContent = 'Pega al menos un lead.'; msg.className = 'rv-err'; return; }
    const icp = { industrias: lista(f.ind.value), ubicaciones: lista(f.ubi.value), senales: lista(f.sen.value), cargos: lista(f.car.value) };
    if (f.min.value || f.max.value) icp.tamano = { min: Number(f.min.value) || 0, max: Number(f.max.value) || 1e9 };
    go.disabled = true; msg.textContent = 'Calificando…'; msg.className = 'rv-mut';
    try { const l = await api('revenue/lotes', { method: 'POST', body: { slug: sel.value, leads, icp } }); location.hash = `#/revenue/${l.id}`; } catch (e) { msg.textContent = e.message || 'No se pudo calificar'; msg.className = 'rv-err'; go.disabled = false; }
  });
  cuerpo.replaceChildren(h('div', { class: 'rv-form' }, h('p', { class: 'rv-mut' }, '1 · ¿A quién buscamos? Lo que dice el cliente ideal aprobado de la marca. 2 · Pega los leads. El sistema descarta los que no encajan (y los que ya existen o se dieron de baja) y solo escribe a los que sí.'),
    h('label', {}, 'Marca ', sel), h('div', { class: 'rv-fila' }, f.ind, f.ubi), h('div', { class: 'rv-fila' }, f.min, f.max), h('div', { class: 'rv-fila' }, f.sen, f.car), f.leads, h('div', { class: 'rv-acc' }, go), msg));
}

async function lotes(cuerpo, estadoCan, lista0) {
  cuerpo.replaceChildren(lista0.length ? h('ul', { class: 'rv-lista' }, lista0.map((l) => h('li', { class: 'rv-it' }, h('a', { href: `#/revenue/${l.id}` }, `Lote de ${l.slug}`), h('span', { class: 'rv-mut' }, ` · ${ESTADOS[l.estado] || l.estado}`)))) : h('p', { class: 'rv-mut' }, 'Aún no hay lotes. Crea el primero en «Nuevo lote».'));
}

export async function render(el, { me, sub: rest = [] }) {
  const cuerpo = h('div', { class: 'rv-cuerpo' }), id = rest[0] && rest[0] !== 'nuevo' && rest[0] !== 'lotes' ? rest[0] : '', vista = id ? 'lote' : rest[0] === 'lotes' ? 'lotes' : 'nuevo';
  let est = { lotes: [], correo: null, redactor: null }; try { est = await api('revenue/lotes'); } catch { /* sin lotes aún */ }
  const tab = (k, n, on) => h('a', { href: `#/revenue/${k}`, role: 'tab', class: on ? 'on' : '', 'aria-selected': String(!!on) }, n);
  el.replaceChildren(h('div', { class: 'rv' }, h('header', { class: 'st-h' }, h('h1', {}, 'Revenue'), h('p', {}, 'Encuentra a quién escribirle, redacta, y manda solo lo que el CEO o el COO aprueben. ', h('a', { href: '#/org/sales' }, 'Ver el CRM'))),
    h('nav', { class: 'st-tabs', role: 'tablist' }, tab('nuevo', 'Nuevo lote', vista === 'nuevo'), tab('lotes', `Lotes (${est.lotes?.length || 0})`, vista !== 'nuevo')), cuerpo));
  if (vista === 'lote') await lotePantalla(cuerpo, id, me, est, null); else if (vista === 'lotes') await lotes(cuerpo, est, est.lotes || []); else await nuevoLote(cuerpo, me, est);
}
