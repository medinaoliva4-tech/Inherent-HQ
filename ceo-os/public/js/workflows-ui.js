// Sistemas › Workflows (#/sistemas/workflows): las corridas con su estado y un lienzo simple para armar un BORRADOR de definición.
// Un paso es una aprobación (espera a una persona, sobre el contenido exacto) o una acción con su adaptador; lo que envía, publica o
// gasta (adaptador «externo») no se guarda sin una aprobación antes. Aquí NADA se ejecuta: guardar crea una versión nueva de la
// definición (POST /api/workflows, solo CEO/COO). Las corridas se leen de lo que el OS ya conoce (los lotes de Revenue tienen la suya):
// el servidor no expone una lista general de corridas, y la pantalla lo dice.
import { api, toast } from './core.js';
import { h } from './kit/dom.js';

const EST_RUN = { en_cola: ['En cola', 'off'], corriendo: ['Corriendo', 'info'], esperando_aprobacion: ['Espera aprobación', 'amb'], completado: ['Completado', 'ok'], fallido: ['Falló', 'bad'], cancelado: ['Cancelado', 'off'] };
const EST_PASO = { pendiente: 'off', corriendo: 'info', esperando: 'amb', hecho: 'ok', fallido: 'bad', omitido: 'off' };
const MAX_PASOS = 40;
const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
const LIMITES = [['◌', 'Aquí nada se ejecuta', 'Guardar crea una versión nueva del borrador'], ['🔒', 'Lo de afuera pide OK antes', 'Enviar, publicar o gastar: aprobación primero, ni el CEO se la salta'],
  ['↻', 'Reintentos solo en pasos seguros', 'Máximo 5, con espera creciente'], ['#', 'Aprueba el contenido exacto', 'Si algo cambia, la aprobación ya no vale'], ['≤', `Hasta ${MAX_PASOS} pasos`, 'Sin ciclos: cada paso depende del anterior']];

// La misma regla del servidor (api/_lib/workflow.js · validarDefinicion), para avisar antes de guardar.
export function revisar(pasos, ads) {
  const errs = [], ext = (p) => p.tipo === 'accion' && ads[p.adaptador]?.externo;
  if (!pasos.length) errs.push('Agrega al menos un paso');
  if (pasos.length > MAX_PASOS) errs.push(`Máximo ${MAX_PASOS} pasos`);
  pasos.forEach((p, i) => { if (ext(p) && !pasos.slice(0, i).some((x) => x.tipo === 'aprobacion')) errs.push(`«${p.nombre}» envía, publica o gasta y no tiene una aprobación antes`); if (p.tipo === 'accion' && !ads[p.adaptador]) errs.push(`«${p.nombre}» no tiene adaptador`); });
  return errs;
}

export async function pintarWorkflows(box, { me }) {
  const puede = ['ceo', 'coo'].includes(me.role);
  let cat = null, runs = null, errorCat = null, sel = null, pasos = [], nombre = 'Nuevo workflow', idDef = '', elegido = -1, modo = 'nuevo';
  const zona = h('div', { class: 'wf' }); box.replaceChildren(zona);
  const ads = () => Object.fromEntries((cat?.adaptadores || []).map((a) => [a.id, a]));
  const nodoTipo = (p) => (p.tipo === 'aprobacion' ? 'apr' : ads()[p.adaptador]?.externo ? 'ext' : 'int');

  async function cargar() {
    try { cat = await api('workflows'); errorCat = null; } catch (e) { errorCat = e; }
    // Las corridas conocidas: las de los lotes de Revenue (cada lote pide su aprobación con una corrida).
    try { const l = (await api('revenue/lotes')).lotes || []; const ids = [...new Set((await Promise.all(l.slice(0, 12).map((x) => api(`revenue/lotes/${x.id}`).then((d) => d.run_id && { id: d.run_id, lote: x }).catch(() => null)))).filter(Boolean).map((x) => JSON.stringify(x)))].map((x) => JSON.parse(x));
      runs = (await Promise.all(ids.map((x) => api(`workflow-runs/${x.id}`).then((r) => ({ ...r, lote: x.lote })).catch(() => null)))).filter(Boolean); } catch { runs = []; }
    pintar();
  }

  // ---- El lienzo: los pasos en fila, unidos por flechas; el elegido se edita en el inspector ----
  function lienzo(lista, { estados = null } = {}) {
    if (!lista.length) return h('div', { class: 'wf-vacio' }, h('b', {}, 'El lienzo está vacío'), h('p', {}, 'Empieza con una aprobación o una acción.'));
    return h('ol', { class: 'wf-lienzo', 'aria-label': 'Pasos' }, lista.map((p, i) => {
      const t = nodoTipo(p), est = estados?.[p.id]?.estado, a = ads()[p.adaptador];
      const nodo = h('button', { type: 'button', class: `wf-n wf-n-${t}${i === elegido && !estados ? ' on' : ''}${est ? ` wf-e-${EST_PASO[est] || 'off'}` : ''}`, 'aria-label': `Paso ${i + 1}: ${p.nombre || p.id}` },
        h('span', { class: 'wf-n-ic', 'aria-hidden': 'true' }, t === 'apr' ? '✋' : t === 'ext' ? '↗' : '⚙'),
        h('b', {}, p.nombre || p.id), h('small', {}, t === 'apr' ? `Aprueba ${(p.aprueba || 'coo').toUpperCase()}` : a?.descripcion || p.adaptador),
        h('span', { class: 'wf-n-tags' }, t === 'ext' ? h('i', { class: 'wf-tag wf-tag-ext' }, a?.estado === 'disconnected' ? 'Sin conectar' : 'Externo') : '', p.reintentos?.max ? h('i', { class: 'wf-tag' }, `↻ ${p.reintentos.max}`) : '', est ? h('i', { class: `wf-tag wf-tag-${EST_PASO[est]}` }, est) : ''));
      if (!estados) nodo.addEventListener('click', () => { elegido = i; pintar(); });
      return h('li', {}, i ? h('i', { class: 'wf-fl', 'aria-hidden': 'true' }) : '', nodo);
    }));
  }

  function inspector() {
    const p = pasos[elegido]; if (!p) return h('div', { class: 'wf-ins wf-ins-vacio' }, h('p', {}, 'Toca un paso para editarlo.'));
    const a = ads(), t = nodoTipo(p);
    const nom = h('input', { class: 'wf-in', value: p.nombre, 'aria-label': 'Nombre del paso' }); nom.addEventListener('change', () => { p.auto = false; p.nombre = nom.value.trim() || p.nombre; p.id = slug(p.nombre) || p.id; pintar(); });
    const filas = [h('label', {}, 'Nombre', nom)];
    if (p.tipo === 'aprobacion') { const s = h('select', { class: 'wf-in', 'aria-label': 'Quién aprueba' }, ['coo', 'ceo'].map((k) => h('option', { value: k, selected: p.aprueba === k }, k.toUpperCase()))); s.addEventListener('change', () => { p.aprueba = s.value; pintar(); }); filas.push(h('label', {}, 'Quién aprueba', s)); }
    else {
      const s = h('select', { class: 'wf-in', 'aria-label': 'Adaptador' }, (cat?.adaptadores || []).map((x) => h('option', { value: x.id, selected: p.adaptador === x.id }, `${x.externo ? '↗ ' : ''}${x.descripcion || x.id}${x.estado === 'disconnected' ? ' · sin conectar' : ''}`)));
      s.addEventListener('change', () => { p.adaptador = s.value; if (!a[s.value]?.seguro) p.reintentos = { max: 0 }; if (p.auto) { p.nombre = (a[s.value]?.descripcion || s.value).split(' ').slice(0, 3).join(' '); } pintar(); }); filas.push(h('label', {}, 'Qué hace', s));
      const seguro = a[p.adaptador]?.seguro, r = h('input', { class: 'wf-in', type: 'range', min: '0', max: '5', value: String(p.reintentos?.max || 0), disabled: !seguro, 'aria-label': 'Reintentos' });
      const rv = h('b', {}, String(p.reintentos?.max || 0)); r.addEventListener('input', () => { p.reintentos = { max: Number(r.value) }; rv.textContent = r.value; });
      r.addEventListener('change', pintar);
      filas.push(h('label', {}, h('span', {}, 'Reintentos ', rv), r, h('small', {}, seguro ? 'Solo se reintenta lo que es seguro repetir.' : 'Este paso no es seguro de repetir: sin reintentos.')));
      if (a[p.adaptador]?.razon) filas.push(h('p', { class: 'wf-razon' }, a[p.adaptador].razon));
    }
    const mover = (d) => { const j = elegido + d; if (j < 0 || j >= pasos.length) return; [pasos[elegido], pasos[j]] = [pasos[j], pasos[elegido]]; elegido = j; pintar(); };
    const b = (txt, fn, cls = 'ghost', dis = false) => { const x = h('button', { type: 'button', class: `btn ${cls}`, disabled: dis }, txt); x.addEventListener('click', fn); return x; };
    return h('div', { class: `wf-ins wf-ins-${t}` }, h('header', {}, h('b', {}, `Paso ${elegido + 1}`), h('small', {}, t === 'apr' ? 'Aprobación' : t === 'ext' ? 'Acción externa' : 'Acción interna')), ...filas,
      h('div', { class: 'wf-ins-acc' }, b('←', () => mover(-1), 'ghost', elegido === 0), b('→', () => mover(1), 'ghost', elegido === pasos.length - 1), b('Quitar', () => { pasos.splice(elegido, 1); elegido = Math.min(elegido, pasos.length - 1); pintar(); }, 'ghost')));
  }

  function pintar() {
    const a = ads(), errs = cat ? revisar(pasos, a) : [];
    const nuevoPaso = (tipo) => { if (pasos.length >= MAX_PASOS) return; const ad = (cat?.adaptadores || []).find((x) => !x.externo)?.id || ''; const n = tipo === 'aprobacion' ? 'Aprobación' : a[ad]?.descripcion?.split(' ').slice(0, 3).join(' ') || 'Acción'; let id = slug(n), k = 2; while (pasos.some((x) => x.id === id)) id = `${slug(n)}-${k++}`; pasos.push({ id, nombre: n, auto: true, tipo, adaptador: tipo === 'accion' ? ad : '', aprueba: 'coo', reintentos: { max: 0 } }); elegido = pasos.length - 1; modo = modo === 'run' ? 'nuevo' : modo; pintar(); };
    const bt = (txt, fn, cls = 'btn ghost') => { const x = h('button', { type: 'button', class: cls, disabled: !puede }, txt); x.addEventListener('click', fn); return x; };
    const titulo = h('input', { class: 'wf-titulo', value: nombre, 'aria-label': 'Nombre del workflow', disabled: modo === 'run' }); titulo.addEventListener('change', () => { nombre = titulo.value.trim() || 'Nuevo workflow'; });
    const guardar = h('button', { type: 'button', class: 'btn', disabled: !puede || !!errs.length || modo === 'run' }, idDef ? 'Guardar nueva versión' : 'Guardar borrador');
    guardar.addEventListener('click', async () => {
      guardar.disabled = true;
      try { const id = idDef || slug(nombre) || 'workflow'; const r = await api('workflows', { method: 'POST', body: { definicion: { id, nombre, pasos: pasos.map((p, i) => ({ id: p.id, tipo: p.tipo, adaptador: p.adaptador || undefined, aprueba: p.aprueba, reintentos: p.reintentos, depende: i ? [pasos[i - 1].id] : [] })) } } }); toast(`Guardado · versión ${r.version}`); idDef = r.def_id; sel = { tipo: 'def', id: r.def_id }; modo = 'def'; await cargar(); }
      catch (e) { toast(e.message || 'No se pudo guardar', true); guardar.disabled = false; }
    });
    // ---- Columna: definiciones y corridas ----
    const defs = cat?.definiciones || [];
    const abrirDef = (d) => { sel = { tipo: 'def', id: d.def_id }; modo = 'def'; idDef = d.def_id; nombre = d.nombre; pasos = d.pasos.map((p) => ({ ...p, nombre: p.id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) })); elegido = -1; pintar(); };
    const abrirRun = (r) => { sel = { tipo: 'run', id: r.id }; modo = 'run'; pintar(); };
    const run = modo === 'run' ? runs?.find((r) => r.id === sel?.id) : null;
    const col = h('aside', { class: 'wf-col' },
      h('header', {}, h('b', {}, 'Workflows'), bt('＋ Nuevo', () => { sel = null; modo = 'nuevo'; idDef = ''; nombre = 'Nuevo workflow'; pasos = []; elegido = -1; pintar(); }, 'btn sm')),
      h('small', { class: 'wf-k' }, 'Definiciones'),
      ...(errorCat ? [h('p', { class: 'wf-mut' }, errorCat.message || 'No pude leer los workflows')] : !cat ? [h('div', { class: 'wf-esq' })] : defs.length ? defs.map((d) => { const x = h('button', { type: 'button', class: `wf-it${sel?.id === d.def_id ? ' on' : ''}` }, h('span', {}, h('b', {}, d.nombre), h('small', {}, `v${d.version} · ${d.pasos.length} pasos`)), h('span', { class: 'wf-mini' }, d.pasos.slice(0, 8).map((p) => h('i', { class: `wf-mini-${p.tipo === 'aprobacion' ? 'apr' : a[p.adaptador]?.externo ? 'ext' : 'int'}` })))); x.addEventListener('click', () => abrirDef(d)); return x; }) : [h('p', { class: 'wf-mut' }, 'Sin definiciones todavía.')]),
      h('small', { class: 'wf-k' }, 'Corridas'),
      ...(runs == null ? [h('div', { class: 'wf-esq' })] : runs.length ? runs.map((r) => { const [et, tono] = EST_RUN[r.estado] || [r.estado, 'off'], ps = Object.values(r.pasos || {}), hechos = ps.filter((p) => p.estado === 'hecho').length;
        const x = h('button', { type: 'button', class: `wf-it${sel?.id === r.id ? ' on' : ''}` }, h('span', {}, h('b', {}, r.lote ? `Lote de ${r.lote.slug}` : r.def_id), h('small', {}, `${r.def_id} · ${hechos}/${ps.length} pasos`)), h('span', { class: `wf-pill wf-pill-${tono}` }, et)); x.addEventListener('click', () => abrirRun(r)); return x; })
        : [h('p', { class: 'wf-mut' }, 'Sin corridas conocidas. Las que piden aprobación (como un lote de Revenue) aparecen aquí.')]));
    // ---- Centro: el lienzo (o la corrida, en solo lectura) ----
    const centro = run
      ? h('section', { class: 'wf-c' }, h('header', { class: 'wf-c-h' }, h('div', {}, h('small', {}, 'Corrida · solo lectura'), h('b', { class: 'wf-titulo-ro' }, run.lote ? `Lote de ${run.lote.slug}` : run.def_id)), h('span', { class: `wf-pill wf-pill-${(EST_RUN[run.estado] || [])[1] || 'off'}` }, (EST_RUN[run.estado] || [run.estado])[0])),
        lienzo(Object.keys(run.pasos || {}).map((id) => ({ id, nombre: id.replace(/-/g, ' '), tipo: /^ok-|aprob/.test(id) ? 'aprobacion' : 'accion', adaptador: '' })), { estados: run.pasos }),
        h('ol', { class: 'wf-ev', 'aria-label': 'Bitácora' }, (run.eventos || []).slice(-6).reverse().map((e) => h('li', {}, h('small', {}, String(e.en || '').slice(5, 16).replace('T', ' ')), h('span', {}, e.texto)))),
        run.lote ? h('a', { class: 'btn ghost', href: `#/revenue/${run.lote.id}` }, 'Abrir el lote para aprobar') : '')
      : h('section', { class: 'wf-c' }, h('header', { class: 'wf-c-h' }, titulo, h('div', { class: 'wf-c-acc' }, bt('＋ Aprobación', () => nuevoPaso('aprobacion')), bt('＋ Acción', () => nuevoPaso('accion')), guardar)),
        lienzo(pasos), errs.length && pasos.length ? h('ul', { class: 'wf-errs' }, errs.map((x) => h('li', {}, x))) : pasos.length ? h('p', { class: 'wf-bien' }, '✓ Cumple los límites: se puede guardar como borrador') : '',
        !puede ? h('p', { class: 'wf-mut' }, 'Solo el CEO o el COO guardan workflows; tú ves el lienzo.') : '', modo !== 'run' ? inspector() : '');
    const lims = h('div', { class: 'wf-lims', role: 'list', 'aria-label': 'Límites (no se cambian)' }, LIMITES.map(([i, t, s]) => h('div', { role: 'listitem' }, h('i', { 'aria-hidden': 'true' }, i), h('span', {}, h('b', {}, t), h('small', {}, s)))));
    zona.replaceChildren(lims, h('div', { class: 'wf-cols' }, col, centro));
  }
  pintar(); await cargar();
}
