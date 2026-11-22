// Revenue (#/revenue): el motor de leads, guiado. Marca + a quién buscamos + los leads → califica y descarta →
// redacta → tú editas → pides el envío → CEO/COO aprueban ese contenido exacto → sale (con tope y horario).
// Nada sale solo: el servidor se detiene en la aprobación. Sin correo o redactor conectados lo dice, no lo finge.
// El CRM de siempre sigue en #/org/sales (enlace arriba).
import { api, skel, toast } from '../core.js';
import { h } from '../kit/dom.js';
import { cargarContexto, contextoLista, contextoActual } from '../contexto.js';
import { icpDeTexto, filtrarExcluidos, resumirICP } from '../revenue/icp-texto.js';

export const esqueleto = () => skel('pagina');
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
// El embudo dibujado: cada puerta es un tramo cuyo alto es lo que entra y lo que sale (proporcional al total del lote).
const gráficoEmbudo = (l) => {
  const f = embudo(l), max = Math.max(1, f[0][1]), W = 500, H = 84, n = f.length, a = (c) => Math.max(c ? 6 : 2, (c / max) * H);
  const tramos = f.map(([, c], i) => { const x0 = (i * W) / n, x1 = ((i + 1) * W) / n, h0 = a(c), h1 = a(i < n - 1 ? f[i + 1][1] : c);
    return svg('path', { d: `M${x0},${(H - h0) / 2} L${x1},${(H - h1) / 2} L${x1},${(H + h1) / 2} L${x0},${(H + h0) / 2} Z`, class: `rv-emb-p rv-emb-i${i}`, style: `--i:${i}` }, svg('title', {}, `${f[i][0]}: ${c}`)); });
  return h('div', { class: 'rv-emb' }, svg('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', class: 'rv-emb-svg', role: 'img', 'aria-label': f.map(([m, c]) => `${m}: ${c}`).join(', ') }, ...tramos),
    h('div', { class: 'rv-emb-l' }, f.map(([m, c]) => h('span', {}, h('b', {}, String(c)), h('small', {}, m)))));
};

function tarjeta(it, sel, abrir) {
  const nombre = it.lead.name || it.lead.company || it.lead.email || `Lead ${it.i}`, b = it.borrador;
  const estado = it.envio?.estado === 'enviado' ? '✓ enviado' : !it.escribir ? 'descartado' : b ? (b.ok ? '✓ listo' : '✗ revisar') : 'sin correo';
  const bt = h('button', { type: 'button', class: `rv-tj${it.escribir ? '' : ' rv-no'}${sel ? ' on' : ''}`, 'data-i': String(it.i), 'aria-pressed': String(!!sel), 'aria-label': `${nombre}: ${estado}` },
    anillo(it.puntaje?.puntaje, it.puntaje?.nivel), h('span', { class: 'rv-tj-t' }, h('b', {}, nombre), h('small', {}, it.lead.company || it.lead.email || '')),
    h('span', { class: 'rv-pts' }, criterios(it.puntaje?.razones).map((c) => h('i', { class: `rv-pt rv-pt-${c.ok === 'Sí' ? 'si' : c.ok === 'No' ? 'no' : 'nd'}`, title: `${c.ok} · ${c.txt}` }))), h('em', { class: `rv-est rv-est-${it.envio?.estado === 'enviado' ? 'env' : !it.escribir ? 'no' : b ? (b.ok ? 'ok' : 'mal') : 'nd'}` }, estado));
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
  // Elegir un lead no recarga el lote: marca la tarjeta y cambia el panel en su lugar.
  const panel = h('div', { class: 'rv-panel-c' }, panelLead(l, sel, editable, recargar)), grid = h('div', { class: 'rv-grid' });
  const abrir = (it) => { for (const b of grid.querySelectorAll('.rv-tj')) { const on = b.dataset.i === String(it.i); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); } panel.replaceChildren(panelLead(l, it, editable, recargar));
    if (matchMedia('(max-width:760px)').matches) panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); };
  grid.append(...l.items.map((it) => tarjeta(it, sel && it.i === sel.i, abrir)));
  const con = (k) => h('span', { class: `rv-can${estadoCan[k]?.estado === 'ready' ? ' on' : ''}` }, h('i', { 'aria-hidden': 'true' }), estadoCan[k]?.estado === 'ready' ? k : `${k}: sin conectar`);
  cuerpo.replaceChildren(h('div', { class: 'rv-lote' },
    h('div', { class: 'rv-sup' }, h('div', { class: 'rv-sup-i' }, h('b', {}, `Lote de ${l.slug}`), h('span', { class: `rv-est-lote rv-e-${l.estado}` }, ESTADOS[l.estado] || l.estado), h('span', { class: 'rv-cans' }, con('correo'), con('redactor'))), gráficoEmbudo(l)),
    acciones.length ? h('div', { class: 'rv-barra' }, ...acciones) : '', l.estado === 'en_aprobacion' ? h('p', { class: 'rv-aviso' }, 'Nada sale hasta que el CEO o el COO aprueben este contenido exacto. Si editas un correo, hay que pedir la aprobación otra vez.') : '', msg,
    h('div', { class: 'rv-cols' }, grid, panel)));
}

// «Nuevo lote» es una conversación: describes a tu cliente ideal en una frase y lo afinas con otra («solo en Antigua, agrega
// gerentes, deja fuera agencias»). Cada envío reescribe los criterios (icp-texto.js, por reglas: lo que no entiende NO lo inventa)
// y se ven como chips que se quitan con ×. Abajo pegas los prospectos. «Guardar como ICP» solo deja una PROPUESTA (avatar en
// borrador): aprobar el ICP sigue siendo de Strategy. «Guardar prospectos» califica el lote: al servidor va solo `icp` y los leads
// ya sin los excluidos.
const CAMPOS_ICP = [['industrias', 'Industrias'], ['tamano', 'Tamaño'], ['ubicaciones', 'Ubicaciones'], ['cargos', 'Cargos'], ['senales', 'Señales']];
const vacioICP = () => ({ icp: { industrias: [], ubicaciones: [], senales: [], cargos: [] }, excluir: { industrias: [], cargos: [] } });
const hayCriterios = (s) => CAMPOS_ICP.some(([k]) => (k === 'tamano' ? !!s.icp.tamano : s.icp[k]?.length)) || s.excluir.industrias.length || s.excluir.cargos.length;
const tam = (t) => `${t.min}–${t.max >= 100000 ? '∞' : t.max} personas`;
const recordarICP = (slug, s) => { try { sessionStorage.setItem(`rv.icp.${slug}`, JSON.stringify(s)); } catch { /* sin almacenamiento: se queda en pantalla */ } };
const leerICP = (slug) => { try { const j = JSON.parse(sessionStorage.getItem(`rv.icp.${slug}`) || 'null'); return j?.icp ? j : null; } catch { return null; } };

async function nuevoLote(cuerpo, me) {
  await cargarContexto(me).catch(() => null);
  const marcas = contextoLista().filter((c) => c.slug && c.slug !== 'personal'), actual = contextoActual(me) || marcas[0]?.slug || '';
  const sel = h('select', { class: 'rv-marca', 'aria-label': 'Marca' }, marcas.map((c) => h('option', { value: c.slug, selected: c.slug === actual }, c.name || c.slug)));
  let s = leerICP(sel.value) || vacioICP(), ultimo = '';
  const titulo = h('h2', { class: 'rv-icp-t', 'aria-live': 'polite' }), chips = h('div', { class: 'rv-crits' }), nota = h('p', { class: 'rv-caja-nota', 'aria-live': 'polite' });
  const afinando = h('div', { class: 'rv-caja-chips' });
  const ta = h('textarea', { class: 'rv-caja-ta', rows: 2, 'aria-label': 'Describe o cambia a tu cliente ideal', placeholder: 'Dueños de cafeterías en Guatemala con 5 a 50 personas…' });
  const enviar = h('button', { type: 'button', class: 'rv-caja-go', 'aria-label': 'Cambiar los criterios' }, '↑');
  const leadsTa = h('textarea', { class: 'rv-pros-ta', rows: 4, placeholder: 'Pega tus prospectos: CSV con encabezado (name,company,email,industry,size,location,contact_role,signals) o un JSON…', 'aria-label': 'Prospectos' });
  const cuenta = h('span', { class: 'rv-pros-n' }), msg = h('p', { class: 'rv-mut', 'aria-live': 'polite' });
  const guardarIcp = h('button', { type: 'button', class: 'btn ghost' }, 'Guardar como ICP'), guardarPros = h('button', { type: 'button', class: 'btn' }, 'Guardar prospectos');
  const quitar = (campo, v) => {
    if (campo === 'tamano') delete s.icp.tamano; else if (campo.startsWith('ex:')) { const k = campo.slice(3); s.excluir[k] = s.excluir[k].filter((x) => x !== v); } else s.icp[campo] = s.icp[campo].filter((x) => x !== v);
    nota.textContent = `Quité: ${v}`; nota.className = 'rv-caja-nota'; pintar();
  };
  const chip = (campo, v, txt) => { const b = h('button', { type: 'button', class: `rv-chip${campo.startsWith('ex:') ? ' rv-chip-ex' : ''}`, 'aria-label': `Quitar ${txt}` }, h('span', {}, txt), h('i', { 'aria-hidden': 'true' }, '×')); b.addEventListener('click', () => quitar(campo, v)); return b; };
  // Los prospectos pegados: cuántos se leen y cuántos quedan fuera por lo excluido (sin llamar al servidor).
  const leer = () => { const t = leadsTa.value.trim(); if (!t) return { leads: [], excluidos: [], error: false }; try { return { ...filtrarExcluidos(leadsDeTexto(t), s.excluir), error: false }; } catch { return { leads: [], excluidos: [], error: true }; } };
  const pintarCuenta = () => { const r = leer(); cuenta.textContent = r.error ? 'No pude leer el formato' : !leadsTa.value.trim() ? 'Sin prospectos todavía' : `${r.leads.length} prospecto${r.leads.length === 1 ? '' : 's'}${r.excluidos.length ? ` · ${r.excluidos.length} fuera por lo excluido` : ''}`; cuenta.classList.toggle('rv-err', r.error); };
  function pintar() {
    s.resumen = resumirICP(s.icp, s.excluir); recordarICP(sel.value, s);
    const hay = hayCriterios(s);
    titulo.textContent = hay ? s.resumen.charAt(0).toUpperCase() + s.resumen.slice(1) : 'Describe a tu cliente ideal en una frase';
    titulo.classList.toggle('rv-icp-vacio', !hay);
    ta.placeholder = hay ? 'Cámbialo: solo empresas en Antigua, agrega gerentes, deja fuera agencias…' : 'Dueños de cafeterías en Guatemala con 5 a 50 personas…';
    const x = h('button', { type: 'button', class: 'rv-afi-x', 'aria-label': 'Empezar de cero' }, '×'); x.addEventListener('click', () => { s = vacioICP(); ultimo = ''; nota.textContent = 'Empezamos de cero.'; pintar(); ta.focus(); });
    afinando.replaceChildren(...(hay ? [h('span', { class: 'rv-afi' }, h('small', {}, 'Afinando'), h('span', {}, ultimo || s.resumen), x)] : []));
    const grupos = CAMPOS_ICP.map(([k, n]) => [n, k === 'tamano' ? (s.icp.tamano ? [chip('tamano', tam(s.icp.tamano), tam(s.icp.tamano))] : []) : (s.icp[k] || []).map((v) => chip(k, v, v))])
      .concat([['Excluidos', [...s.excluir.industrias.map((v) => chip('ex:industrias', v, v)), ...s.excluir.cargos.map((v) => chip('ex:cargos', v, v))]]]);
    chips.replaceChildren(...grupos.map(([n, cs]) => h('div', { class: `rv-crit-g${cs.length ? '' : ' rv-crit-vacio'}` }, h('small', {}, n), h('div', {}, cs.length ? cs : h('span', { class: 'rv-crit-nd' }, '—')))));
    guardarIcp.disabled = !hay; pintarCuenta();
  }
  const mandar = () => {
    const t = ta.value.trim(); if (!t) { ta.focus(); return; }
    const r = icpDeTexto(t, hayCriterios(s) ? s : null);
    if (!r.entendido) { nota.textContent = 'No entendí eso: prueba con un cargo, una industria o un lugar.'; nota.className = 'rv-caja-nota rv-caja-mal'; return; }
    s = { icp: r.icp, excluir: r.excluir }; ultimo = t; ta.value = '';
    nota.textContent = r.cambios.join(' · '); nota.className = 'rv-caja-nota rv-caja-bien'; pintar();
  };
  enviar.addEventListener('click', mandar);
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); mandar(); } });
  leadsTa.addEventListener('input', pintarCuenta);
  sel.addEventListener('change', () => { s = leerICP(sel.value) || vacioICP(); ultimo = ''; nota.textContent = ''; pintar(); });
  // La propuesta de ICP: un avatar en BORRADOR de la marca (Strategy lo revisa y el CEO lo aprueba; aquí no se aprueba nada).
  guardarIcp.addEventListener('click', async () => {
    guardarIcp.disabled = true; msg.className = 'rv-mut'; msg.textContent = 'Guardando la propuesta…';
    const campos = { ocupacion: s.icp.cargos.join(', '), zona: s.icp.ubicaciones.join(', '), empresa: [s.icp.industrias.join(', '), s.icp.tamano ? tam(s.icp.tamano) : '', s.excluir.industrias.length ? `sin ${s.excluir.industrias.join(', ')}` : ''].filter(Boolean).join(' · ') };
    try { await api('avatares', { method: 'POST', body: { profile: sel.value, nombre: `ICP propuesto: ${s.resumen}`.slice(0, 80), campos } }); msg.textContent = 'Guardado como propuesta (hipótesis). Strategy lo revisa y el CEO lo aprueba.'; toast('Propuesta de ICP guardada'); }
    catch (e) { msg.textContent = e.message || 'No se pudo guardar la propuesta'; msg.className = 'rv-err'; } finally { guardarIcp.disabled = !hayCriterios(s); }
  });
  guardarPros.addEventListener('click', async () => {
    if (!hayCriterios(s)) { ta.focus(); msg.textContent = 'Primero describe a tu cliente ideal.'; msg.className = 'rv-err'; return; }
    const r = leer(); if (r.error) { leadsTa.focus(); msg.textContent = 'No pude leer los prospectos: revisa el formato.'; msg.className = 'rv-err'; return; }
    if (!r.leads.length) { leadsTa.focus(); msg.textContent = r.excluidos.length ? 'Todos los prospectos caen en lo excluido.' : 'Pega al menos un prospecto.'; msg.className = 'rv-err'; return; }
    guardarPros.disabled = true; msg.textContent = 'Calificando…'; msg.className = 'rv-mut';
    try { const l = await api('revenue/lotes', { method: 'POST', body: { slug: sel.value, leads: r.leads, icp: s.icp } }); location.hash = `#/revenue/${l.id}`; } catch (e) { msg.textContent = e.message || 'No se pudo calificar'; msg.className = 'rv-err'; guardarPros.disabled = false; }
  });
  cuerpo.replaceChildren(h('div', { class: 'rv-nuevo' },
    h('div', { class: 'rv-icp-h' }, h('div', { class: 'rv-icp-k' }, h('small', {}, 'Cliente ideal de'), sel), titulo, h('div', { class: 'rv-icp-acc' }, guardarIcp, guardarPros)),
    h('div', { class: 'rv-caja' }, afinando, ta, h('div', { class: 'rv-caja-pie' }, nota, h('small', { class: 'rv-caja-k' }, '↵ para cambiar'), enviar)),
    chips,
    h('section', { class: 'rv-pros' }, h('header', {}, h('b', {}, 'Prospectos'), cuenta), leadsTa),
    msg, h('p', { class: 'rv-mut rv-nota' }, 'El sistema descarta los que no encajan (y los que ya existen o se dieron de baja) y solo escribe a los que sí. Nada sale sin la aprobación del CEO o el COO.')));
  pintar();
}

async function lotes(cuerpo, estadoCan, lista0) {
  // Cada lote: una tarjeta con su estado y la proporción de los que encajan (del resumen del motor).
  const tj = (l) => { const t = Number(l.resumen?.total) || 0, e = Number(l.resumen?.escribir) || 0;
    return h('a', { class: 'rv-lt', href: `#/revenue/${l.id}` }, h('span', { class: 'rv-lt-h' }, h('b', {}, `Lote de ${l.slug}`), h('span', { class: `rv-est-lote rv-e-${l.estado}` }, ESTADOS[l.estado] || l.estado)),
      t ? h('span', { class: 'rv-lt-b', role: 'img', 'aria-label': `${e} de ${t} encajan` }, h('i', { style: `--w:${(e / t) * 100}%` })) : '', h('small', {}, t ? `${e} de ${t} encajan` : 'Sin resumen'), l.creado ? h('small', {}, String(l.creado).slice(0, 10)) : ''); };
  cuerpo.replaceChildren(lista0.length ? h('div', { class: 'rv-lotes' }, lista0.map(tj)) : h('div', { class: 'rv-vacio' }, h('p', {}, 'Aún no hay lotes.'), h('a', { class: 'btn', href: '#/revenue/nuevo' }, 'Buscar clientes ideales')));
}

export async function render(el, { me, sub: rest = [] }) {
  const cuerpo = h('div', { class: 'rv-cuerpo' }), id = rest[0] && rest[0] !== 'nuevo' && rest[0] !== 'lotes' ? rest[0] : '', vista = id ? 'lote' : rest[0] === 'lotes' ? 'lotes' : 'nuevo';
  let est = { lotes: [], correo: null, redactor: null }; try { est = await api('revenue/lotes'); } catch { /* sin lotes aún */ }
  const tab = (k, n, on) => h('a', { href: `#/revenue/${k}`, role: 'tab', class: on ? 'on' : '', 'aria-selected': String(!!on) }, n);
  el.replaceChildren(h('div', { class: `rv rv-v-${vista}` }, h('header', { class: 'rv-h' }, h('div', {}, h('h1', {}, 'Revenue'), h('p', {}, 'Encuentra a quién escribirle, redacta y manda solo lo que el CEO o el COO aprueben. ', h('a', { href: '#/org/sales' }, 'Ver el CRM →'))),
    h('nav', { class: 'rv-seg', role: 'tablist', 'aria-label': 'Revenue' }, tab('nuevo', 'Buscar', vista === 'nuevo'), tab('lotes', `Lotes · ${est.lotes?.length || 0}`, vista !== 'nuevo'))), cuerpo));
  if (vista === 'lote') await lotePantalla(cuerpo, id, me, est, null); else if (vista === 'lotes') await lotes(cuerpo, est, est.lotes || []); else await nuevoLote(cuerpo, me, est);
}
