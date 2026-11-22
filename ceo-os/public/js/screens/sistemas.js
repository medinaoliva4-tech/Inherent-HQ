// Sistemas → Agentes (#/sistemas): lista de tus agentes + catálogo por área + «Construir con IA».
// Es adaptable (cualquiera arma el suyo) pero con un límite claro y siempre visible: el agente nace en BORRADOR, solo lee las fuentes de una lista
// cerrada, solo pide las acciones del OS, lo que envía/publica/gasta pide aprobación humana siempre, tiene tope de costo y no se activa sin 5 casos.
// Sin modelo conectado, «Construir con IA» arma un borrador por parecido con las plantillas (lo dice) y lo deja editable.
import { api, skel, toast } from '../core.js';
import { h } from '../kit/dom.js';
import { dialog } from '../ui.js';
import { PLANTILLAS, AREAS_PLANTILLA, sugerencias, borradorDeTexto, esExterna } from '../sistemas/plantillas.js';
import { FUENTES, HARNESS, ACCIONES_CATALOGO, validarSpec, POLITICA_BASE } from '../sistemas/agente-spec.js';

export const esqueleto = () => skel('pagina');
const NIVEL = [['bajo', 'Barato'], ['medio', 'Equilibrado'], ['alto', 'El mejor']];
const HARN = { chat: 'Conversa', herramientas: 'Usa herramientas', 'planifica-ejecuta': 'Planifica y ejecuta' };
const FUENTE = { biblioteca: 'Biblioteca', hilo: 'Hilo del cliente', 'ficha-oferta': 'Ficha de oferta', estrategia: 'Estrategia', marca: 'Marca', contenido: 'Contenido', entregables: 'Entregables', tareas: 'Tareas', proyectos: 'Proyectos', investigacion: 'Investigación' };
const ACCION = { abrirHerramienta: 'Abrir una herramienta', abrirEnChat: 'Abrir en el chat', imprimir: 'Imprimir', crearTarea: 'Crear tarea', copiar: 'Copiar', pedir: 'Pedir un dato', guardarEnHerramienta: 'Guardar en una herramienta', 'zernio-publicar': 'Publicar', 'meta-pauta': 'Mover pauta' };
const COLOR = { Revenue: 'rev', Marketing: 'mkt', Clientes: 'cli', 'Producción': 'pro' };
const letra = (t) => String(t || '?').trim().charAt(0).toUpperCase();
const clon = (x) => JSON.parse(JSON.stringify(x));

const chip = (txt, on, fn, extra = '') => { const b = h('button', { type: 'button', class: `sa-chip${on ? ' on' : ''} ${extra}`, 'aria-pressed': String(!!on) }, txt); b.addEventListener('click', fn); return b; };

// ---- El constructor (diálogo): formulario vivo con validación y límites a la vista ----
function constructor(inicial, { ia = false, alGuardar }) {
  let D = null;
  let spec = clon(inicial || { id: '', nombre: '', resultado: { que: '', medida: '' }, fuentes: ['hilo'], acciones: [], modelo: 'bajo', harness: 'herramientas', contexto: { biblioteca: [], hilo: true, rol: 'revenue', cliente: '' }, presupuesto: { por_corrida: 0.25, por_mes: 15 } });
  spec.acciones = (spec.acciones || []).map((a) => (typeof a === 'string' ? a : a.nombre));
  const cuerpo = h('div', { class: 'sa-cuerpo' }), aviso = h('p', { class: 'sa-aviso', 'aria-live': 'polite' });
  const cerrar = () => D?.cerrar();
  const tema = (ia) => cuerpo.closest('dialog')?.classList.toggle('sa-dlg-ia', ia);
  const pintarForm = () => {
    tema(false);
    const v = validarSpec({ ...spec, acciones: spec.acciones.map((n) => ({ nombre: n })) }), externo = spec.acciones.some(esExterna);
    const nombre = h('input', { class: 'sa-in', value: spec.nombre, placeholder: 'Nombre', 'aria-label': 'Nombre' }), que = h('textarea', { class: 'sa-in', rows: 3, placeholder: 'Qué debe producir', 'aria-label': 'Qué produce' }, spec.resultado.que), medida = h('input', { class: 'sa-in', value: spec.resultado.medida, placeholder: 'Cómo sabes que salió bien', 'aria-label': 'Cómo se mide' });
    nombre.addEventListener('input', () => { spec.nombre = nombre.value; if (!spec._idManual) spec.id = norm(nombre.value); }); que.addEventListener('input', () => { spec.resultado.que = que.value; }); medida.addEventListener('input', () => { spec.resultado.medida = medida.value; });
    const corr = h('input', { class: 'sa-in sa-num', type: 'number', min: '0.01', step: '0.05', value: spec.presupuesto.por_corrida, 'aria-label': 'Tope por corrida (USD)' }), mes = h('input', { class: 'sa-in sa-num', type: 'number', min: '1', step: '1', value: spec.presupuesto.por_mes, 'aria-label': 'Tope por mes (USD)' });
    corr.addEventListener('input', () => { spec.presupuesto.por_corrida = Number(corr.value); }); mes.addEventListener('input', () => { spec.presupuesto.por_mes = Number(mes.value); });
    const alt = (arr, x) => (arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x]);
    const guardar = h('button', { type: 'button', class: 'btn' }, 'Guardar borrador'), cancelar = h('button', { type: 'button', class: 'btn ghost' }, 'Cerrar');
    cancelar.addEventListener('click', cerrar);
    guardar.addEventListener('click', async () => {
      const r = validarSpec({ ...spec, acciones: spec.acciones.map((n) => ({ nombre: n })) }); if (!r.ok) { aviso.textContent = r.errores[0]; aviso.className = 'sa-aviso sa-mal'; pintarForm(); return; }
      guardar.disabled = true; try { const g = await api('sistemas/agentes', { method: 'POST', body: { spec: r.spec } }); toast(g.repetida ? 'Sin cambios' : `Guardado · versión ${g.version}`); cerrar(); alGuardar?.(); } catch (e) { aviso.textContent = e.message || 'No se pudo guardar'; aviso.className = 'sa-aviso sa-mal'; guardar.disabled = false; }
    });
    cuerpo.replaceChildren(
      h('div', { class: 'sa-form' }, h('label', {}, 'Nombre', nombre), h('label', {}, 'Qué produce', que), h('label', {}, 'Cómo se mide', medida),
        h('div', {}, h('b', {}, 'Qué lee'), h('div', { class: 'sa-chips' }, FUENTES.map((f) => chip(FUENTE[f] || f, spec.fuentes.includes(f), () => { spec.fuentes = alt(spec.fuentes, f); pintarForm(); })))),
        h('div', {}, h('b', {}, 'Qué puede pedir'), h('div', { class: 'sa-chips' }, ACCIONES_CATALOGO.map((a) => chip(`${esExterna(a) ? '🔒 ' : ''}${ACCION[a] || a}`, spec.acciones.includes(a), () => { spec.acciones = alt(spec.acciones, a); pintarForm(); })))),
        h('div', { class: 'sa-fila' }, h('div', {}, h('b', {}, 'Modelo'), h('div', { class: 'sa-chips' }, NIVEL.map(([k, n]) => chip(n, spec.modelo === k, () => { spec.modelo = k; pintarForm(); })))), h('div', {}, h('b', {}, 'Cómo trabaja'), h('div', { class: 'sa-chips' }, HARNESS.map((k) => chip(HARN[k], spec.harness === k, () => { spec.harness = k; pintarForm(); }))))),
        h('div', { class: 'sa-fila' }, h('label', {}, 'Tope por corrida (US$)', corr), h('label', {}, 'Tope por mes (US$)', mes))),
      h('aside', { class: 'sa-lim' }, h('b', {}, 'Límites (no se cambian)'), h('ul', {}, [
        'Nace en borrador: no se activa sin ' + POLITICA_BASE.minCasos + ' casos de prueba aprobados.',
        'Solo lee las fuentes de la lista y solo pide acciones del OS.',
        externo ? '🔒 Esta tiene acciones que publican o gastan: pedirá aprobación humana siempre.' : 'Si pide algo que envía, publica o gasta, pedirá aprobación humana siempre.',
        'Nunca ve finanzas, costos ni datos de otro cliente.', `Tiene tope de costo: ${spec.presupuesto.por_corrida || '—'} US$ por corrida · ${spec.presupuesto.por_mes || '—'} al mes.`].map((t) => h('li', {}, t))),
        v.ok ? h('p', { class: 'sa-ok' }, '✓ Lista para guardar') : h('p', { class: 'sa-mal' }, `Falta: ${v.errores[0]}`)),
      h('footer', { class: 'sa-pie' }, aviso, cancelar, guardar));
  };
  // «Construir con IA» (referencia Kendo): qué usa, un mensaje del asistente, 3 sugerencias en filas, la caja grande y al pie qué pasa.
  const pintarIA = () => {
    tema(true);
    const t = h('textarea', { class: 'sa-ia-t', rows: 4, placeholder: 'Describe qué lo dispara, con qué datos trabaja y qué debe entregar…', 'aria-label': 'Describe tu agente' });
    const go = h('button', { type: 'button', class: 'sa-ia-go', 'aria-label': 'Crear borrador' }, '↑');
    const armar = () => { if (t.value.trim().length < 10) { t.focus(); aviso.textContent = 'Cuéntame un poco más (una frase basta).'; aviso.className = 'sa-aviso sa-ia-av'; return; } const b = borradorDeTexto(t.value); spec = b.spec; aviso.textContent = b.aviso; aviso.className = 'sa-aviso'; pintarForm(); };
    go.addEventListener('click', armar); t.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); armar(); } });
    const sug = sugerencias.map((s) => { const b = h('button', { type: 'button', class: 'sa-sug' }, h('i', { 'aria-hidden': 'true' }, '✦'), h('span', {}, s), h('em', { 'aria-hidden': 'true' }, '↵')); b.addEventListener('click', () => { t.value = s; t.focus(); }); return b; });
    cuerpo.replaceChildren(h('div', { class: 'sa-ia' },
      h('p', { class: 'sa-ia-usa' }, 'Usa tu Biblioteca, el hilo de cada cliente, las fichas de oferta y tu equipo.'),
      h('div', { class: 'sa-ia-msg' }, h('span', { class: 'sa-ia-yo', 'aria-hidden': 'true' }, '✦'), h('p', {}, 'Cuéntame qué debe pasar y armo un borrador con tus fuentes y tu equipo. Puedes empezar con una de estas:')),
      h('div', { class: 'sa-sugs' }, sug),
      h('div', { class: 'sa-ia-caja' }, t, h('div', { class: 'sa-ia-pie' }, h('small', {}, 'Enter para enviar · Shift + Enter nueva línea'), go)),
      aviso, h('p', { class: 'sa-ia-nota' }, 'Crea un borrador. Revísalo, pruébalo y publícalo cuando estés listo.')));
    setTimeout(() => t.focus(), 30);
  };
  D = dialog({ titulo: ia ? 'Construir con IA' : 'Nuevo agente', cuerpo, formulario: false, clase: 'sa-dlg', alAbrir: () => (ia ? pintarIA() : pintarForm()) });
  return D;
}
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

// El área de un agente sale del rol de su contexto (las plantillas ya traen su área).
const ROL_AREA = { revenue: 'Revenue', creative: 'Marketing', marketing: 'Marketing', ads: 'Marketing', posting: 'Marketing', account: 'Clientes', production: 'Producción' };
const areaDe = (spec) => ROL_AREA[spec?.contexto?.rol] || (AREAS_PLANTILLA.includes(spec?.contexto?.rol) ? spec.contexto.rol : null);
const ESTADO = { activo: 'Activo', borrador: 'Borrador', sin_activar: 'Sin activar' };
const avatar = (nombre, area, extra = '') => h('span', { class: `sa-av sa-av-${COLOR[area] || 'x'} ${extra}`, 'aria-hidden': 'true' }, letra(nombre));
function fila(a, abrir) {
  const b = a.banco, c = a.estado === 'activo' ? 'on' : a.estado === 'borrador' ? 'bo' : 'off', area = areaDe(a.spec);
  const bt = h('button', { type: 'button', class: 'sa-ag', 'aria-label': `${a.spec.nombre} · ${ESTADO[a.estado] || a.estado}` }, avatar(a.spec.nombre, area),
    h('span', { class: 'sa-ag-t' }, h('b', {}, a.spec.nombre), h('small', {}, [area, b ? `calidad ${Math.round(b.calidad * 100)} % · ${b.costo_etiqueta || 'costo sin dato'}` : 'sin probar'].filter(Boolean).join(' · '))),
    h('i', { class: `sa-dot sa-dot-${c}`, title: ESTADO[a.estado] || a.estado }));
  bt.addEventListener('click', () => abrir(a)); return bt;
}
// Los límites, siempre a la vista (no se cambian desde aquí).
const LIMITES = [['◌', 'Nace en borrador', `No se activa sin ${POLITICA_BASE.minCasos} casos de prueba aprobados`], ['◉', 'Lee solo su lista', 'Y solo pide acciones del OS'], ['🔒', 'Lo de afuera pide OK', 'Enviar, publicar o gastar: aprobación humana siempre'], ['⊘', 'Nunca ve finanzas', 'Ni costos ni datos de otro cliente'], ['$', 'Tope de costo', 'Por corrida y por mes']];
const tarjeta = (p, puede, nuevo) => {
  const ext = p.spec.acciones.some(esExterna);
  const t = h('button', { type: 'button', class: 'sa-tj', disabled: !puede, 'aria-label': `Usar la plantilla ${p.spec.nombre}` }, h('span', { class: 'sa-tj-h' }, avatar(p.spec.nombre, p.area), h('span', {}, h('b', {}, p.spec.nombre), h('small', { class: 'sa-ar' }, p.area))),
    h('p', {}, p.spec.resultado.que),
    h('dl', { class: 'sa-tj-u' }, h('dt', {}, 'Lee'), h('dd', { title: p.spec.fuentes.map((f) => FUENTE[f] || f).join(', ') }, p.spec.fuentes.slice(0, 2).map((f) => FUENTE[f] || f).join(' · ') + (p.spec.fuentes.length > 2 ? ` +${p.spec.fuentes.length - 2}` : '')),
      h('dt', {}, 'Necesita'), h('dd', { class: ext ? 'sa-ext' : '', title: p.spec.acciones.map((a) => ACCION[a] || a).join(', ') }, `${ext ? '🔒 ' : ''}${p.spec.acciones.slice(0, 2).map((a) => ACCION[a] || a).join(' · ')} · US$ ${p.spec.presupuesto.por_mes}/mes`)));
  t.addEventListener('click', () => nuevo(p.spec, false)); return t;
};
export async function render(el, { me }) {
  const cuerpo = h('div', { class: 'sa' }); let filtro = 'Todas', q = '', lista = [], costo = null;
  const puede = ['ceo', 'coo'].includes(me.role) || (me.roles || []).includes('ai-engineer');
  const buscar = h('input', { class: 'sa-buscar', type: 'search', placeholder: 'Buscar agentes', 'aria-label': 'Buscar agentes' });
  const area = h('select', { class: 'sa-area', 'aria-label': 'Filtrar por área' }, ['Todas', ...AREAS_PLANTILLA].map((a) => h('option', { value: a }, a === 'Todas' ? 'Todas las áreas' : a)));
  const listaBox = h('div', { class: 'sa-lista-l' }), mainBox = h('section', { class: 'sa-cat' }), cuenta = h('small', {});
  const abrir = (a) => constructor(a.spec, { alGuardar: cargar }), nuevo = (spec, ia) => constructor(spec, { ia, alGuardar: cargar });
  const pasa = (nombre, ar) => (filtro === 'Todas' || ar === filtro) && (!q || norm(nombre).includes(norm(q)));
  const pintar = () => {
    const mios = lista.filter((a) => pasa(a.spec.nombre, areaDe(a.spec)));
    cuenta.textContent = String(lista.length);
    // El Operator (el orquestador): recibe cada pedido y lo pasa al agente que toca; vive en el Chat.
    const op = h('a', { class: 'sa-ag sa-op', href: '#/chat' }, h('span', { class: 'sa-av sa-av-op', 'aria-hidden': 'true' }, '✦'), h('span', { class: 'sa-ag-t' }, h('b', {}, 'Operator'), h('small', {}, 'Reparte cada pedido al agente que toca')), h('i', { class: 'sa-op-k', 'aria-hidden': 'true' }, '›'));
    listaBox.replaceChildren(op, ...(mios.length ? mios.map((a) => fila(a, abrir)) : [h('p', { class: 'sa-mut sa-vacio' }, lista.length ? 'Ninguno coincide con el filtro.' : 'Aún no tienes agentes. Empieza con una plantilla →')]));
    const gasto = costo ? (costo.por_agente || []).reduce((s, x) => s + (x.gastado || 0), 0) : null, tope = lista.reduce((s, a) => s + (Number(a.spec?.presupuesto?.por_mes) || 0), 0);
    const grupos = AREAS_PLANTILLA.filter((a) => filtro === 'Todas' || a === filtro).map((a) => [a, PLANTILLAS.filter((p) => p.area === a && pasa(p.spec.nombre, a))]).filter(([, ps]) => ps.length);
    const cero = h('button', { type: 'button', id: 'sa-nuevo', class: 'sa-cero', disabled: !puede }, h('span', { class: 'sa-cero-i', 'aria-hidden': 'true' }, '＋'), h('span', {}, h('b', {}, 'Empezar desde cero'), h('small', {}, 'Tú defines qué produce, qué lee y su tope')));
    cero.addEventListener('click', () => nuevo(null, false));
    const ia = h('button', { type: 'button', id: 'sa-ia', class: 'sa-cero sa-cero-ia', disabled: !puede }, h('span', { class: 'sa-cero-i', 'aria-hidden': 'true' }, '✦'), h('span', {}, h('b', {}, 'Construir con IA'), h('small', {}, 'Cuéntalo en una frase y armo el borrador')));
    ia.addEventListener('click', () => nuevo(null, true));
    mainBox.replaceChildren(
      h('header', { class: 'sa-main-h' }, h('div', {}, h('h2', {}, 'Nuevo agente'), h('p', { class: 'sa-mut' }, 'Cada quien arma el suyo; el límite es claro y está siempre a la vista.'))),
      h('div', { class: 'sa-lims', role: 'list', 'aria-label': 'Límites (no se cambian)' }, LIMITES.map(([i, t, s]) => h('div', { class: 'sa-lim-i', role: 'listitem' }, h('i', { 'aria-hidden': 'true' }, i), h('span', {}, h('b', {}, t), h('small', {}, s)))),
        h('div', { class: 'sa-lim-i sa-lim-g' }, h('span', {}, h('b', {}, gasto == null ? 'Gasto: sin datos' : `US$ ${gasto.toFixed(2)} este mes`), h('small', {}, tope ? `de US$ ${tope} de topes · ${costo?.topes_aprobados ? 'tope aprobado' : 'sin tope del CEO aún'}` : costo?.topes_aprobados ? 'con tope aprobado' : 'sin tope del CEO aún')),
          gasto != null && tope ? h('span', { class: 'hz-bb', role: 'img', 'aria-label': `Gastado US$ ${gasto.toFixed(2)} de US$ ${tope}` }, h('i', { style: `--w:${Math.min(100, (gasto / tope) * 100)}%` })) : '')),
      puede ? h('div', { class: 'sa-ceros' }, ia, cero) : h('p', { class: 'sa-mut' }, 'Solo el CEO, el COO o quien arma agentes puede crear uno.'),
      ...(grupos.length ? grupos.map(([a, ps]) => h('div', { class: 'sa-sec' }, h('h3', {}, avatar(a, a, 'sa-av-s'), a, h('small', {}, String(ps.length))), h('div', { class: 'sa-grid' }, ps.map((p) => tarjeta(p, puede, nuevo))))) : [h('p', { class: 'sa-mut' }, 'Ninguna plantilla coincide con la búsqueda.')]));
  };
  buscar.addEventListener('input', () => { q = buscar.value.trim(); pintar(); });
  area.addEventListener('change', () => { filtro = area.value; pintar(); });
  const cargar = async () => { try { lista = (await api('sistemas/agentes')).agentes || []; } catch { lista = []; } try { costo = await api('sistemas/costo'); } catch { costo = null; } pintar(); };
  const nuevoBtn = h('button', { type: 'button', class: 'btn sa-nuevo', disabled: !puede }, '＋ Nuevo agente'); nuevoBtn.addEventListener('click', () => nuevo(null, true));
  cuerpo.replaceChildren(h('div', { class: 'sa-cols' },
    h('aside', { class: 'sa-lista', 'aria-label': 'Mis agentes' }, h('header', { class: 'sa-lista-h' }, h('b', {}, 'Mis agentes ', cuenta), nuevoBtn), h('div', { class: 'sa-filtro' }, buscar, area), listaBox),
    mainBox));
  el.replaceChildren(cuerpo); await cargar();
}
