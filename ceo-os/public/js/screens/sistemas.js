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
  const pintarForm = () => {
    const v = validarSpec({ ...spec, acciones: spec.acciones.map((n) => ({ nombre: n })) }), externo = spec.acciones.some(esExterna);
    const nombre = h('input', { class: 'sa-in', value: spec.nombre, placeholder: 'Nombre', 'aria-label': 'Nombre' }), que = h('textarea', { class: 'sa-in', rows: 3, placeholder: 'Qué debe producir', 'aria-label': 'Qué produce' }, spec.resultado.que), medida = h('input', { class: 'sa-in', value: spec.resultado.medida, placeholder: 'Cómo sabes que salió bien', 'aria-label': 'Cómo se mide' });
    nombre.addEventListener('input', () => { spec.nombre = nombre.value; if (!spec._idManual) spec.id = norm(nombre.value); }); que.addEventListener('input', () => { spec.resultado.que = que.value; }); medida.addEventListener('input', () => { spec.resultado.medida = medida.value; });
    const corr = h('input', { class: 'sa-in sa-num', type: 'number', min: '0.01', step: '0.05', value: spec.presupuesto.por_corrida, 'aria-label': 'Tope por corrida (USD)' }), mes = h('input', { class: 'sa-in sa-num', type: 'number', min: '1', step: '1', value: spec.presupuesto.por_mes, 'aria-label': 'Tope por mes (USD)' });
    corr.addEventListener('input', () => { spec.presupuesto.por_corrida = Number(corr.value); }); mes.addEventListener('input', () => { spec.presupuesto.por_mes = Number(mes.value); });
    const alt = (arr, x) => (arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x]);
    const guardar = h('button', { type: 'button', class: 'btn' }, 'Guardar borrador'), cancelar = h('button', { type: 'button', class: 'btn btn-s' }, 'Cerrar');
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
  const pintarIA = () => {
    const t = h('textarea', { class: 'sa-in sa-ia-t', rows: 3, placeholder: 'Describe qué debe hacer, con qué datos y qué debe entregar…', 'aria-label': 'Describe tu agente' });
    const go = h('button', { type: 'button', class: 'btn' }, 'Crear borrador');
    const armar = () => { if (t.value.trim().length < 10) { t.focus(); return; } const b = borradorDeTexto(t.value); spec = b.spec; aviso.textContent = b.aviso; aviso.className = 'sa-aviso'; pintarForm(); };
    go.addEventListener('click', armar); t.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); armar(); } });
    cuerpo.replaceChildren(h('div', { class: 'sa-ia' }, h('p', { class: 'sa-mut' }, 'Cuéntame qué debe pasar y armo un borrador con tus fuentes y tu equipo. Lo revisas, lo pruebas y lo activas cuando estés listo.'), ...sugerencias.map((s) => h('button', { type: 'button', class: 'sa-sug' }, s)), t, h('div', { class: 'sa-pie' }, h('small', { class: 'sa-mut' }, 'Enter para crear · Shift + Enter para otra línea'), go)));
    cuerpo.querySelectorAll('.sa-sug').forEach((b) => b.addEventListener('click', () => { t.value = b.textContent; t.focus(); }));
  };
  D = dialog({ titulo: ia ? 'Construir con IA' : 'Nuevo agente', cuerpo, formulario: false, clase: 'sa-dlg', alAbrir: () => (ia ? pintarIA() : pintarForm()) });
  return D;
}
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

const ESTADO = { activo: 'Activo', borrador: 'Borrador', sin_activar: 'Sin activar' };
function fila(a, abrir) {
  const b = a.banco, c = a.estado === 'activo' ? 'on' : a.estado === 'borrador' ? 'bo' : 'off';
  const bt = h('button', { type: 'button', class: 'sa-ag' }, h('span', { class: `sa-av sa-av-${COLOR[a.spec.contexto?.rol] || 'x'}` }, letra(a.spec.nombre)), h('span', { class: 'sa-ag-t' }, h('b', {}, a.spec.nombre), h('small', {}, b ? `Calidad ${Math.round(b.calidad * 100)} % · ${b.costo_etiqueta || 'sin dato'} por caso` : 'Sin probar')), h('i', { class: `sa-dot sa-dot-${c}`, title: ESTADO[a.estado] || a.estado }));
  bt.addEventListener('click', () => abrir(a)); return bt;
}
export async function render(el, { me, sub = [] }) {
  const cuerpo = h('div', { class: 'sa' }); let filtro = 'Todas', lista = [], costo = null;
  const puede = ['ceo', 'coo'].includes(me.role) || (me.roles || []).includes('ai-engineer');
  const pintar = () => {
    const abrir = (a) => constructor(a.spec, { alGuardar: cargar }), nuevo = (spec, ia) => constructor(spec, { ia, alGuardar: cargar });
    const cats = PLANTILLAS.filter((p) => filtro === 'Todas' || p.area === filtro);
    const gasto = costo ? (costo.por_tarea || []).reduce((s, x) => s + (x.gastado || 0), 0) : null;
    cuerpo.replaceChildren(
      h('header', { class: 'sa-h' }, h('div', {}, h('h1', {}, 'Agentes ', h('small', {}, String(lista.length))), h('p', { class: 'sa-mut' }, 'Cada quien arma el suyo; el límite es claro y está siempre a la vista.')),
        puede ? h('div', { class: 'sa-acc' }, h('button', { type: 'button', class: 'btn', id: 'sa-ia' }, '✦ Construir con IA'), h('button', { type: 'button', class: 'btn btn-s', id: 'sa-nuevo' }, 'Desde cero')) : ''),
      h('div', { class: 'sa-cols' },
        h('aside', { class: 'sa-lista' }, h('b', {}, 'Mis agentes'), lista.length ? lista.map((a) => fila(a, abrir)) : h('p', { class: 'sa-mut' }, 'Aún no tienes agentes. Empieza con una plantilla →'),
          h('p', { class: 'sa-mut sa-gasto' }, gasto == null ? '' : `Gasto del mes: US$ ${gasto.toFixed(2)} · ${costo.topes_aprobados ? 'con tope aprobado' : 'sin tope aprobado aún'}`)),
        h('section', { class: 'sa-cat' }, h('div', { class: 'sa-filtros', role: 'tablist' }, ['Todas', ...AREAS_PLANTILLA].map((a) => chip(a, filtro === a, () => { filtro = a; pintar(); }))),
          h('div', { class: 'sa-grid' }, cats.map((p) => { const t = h('button', { type: 'button', class: 'sa-tj', disabled: !puede }, h('span', { class: `sa-av sa-av-${COLOR[p.area]}` }, letra(p.spec.nombre)), h('b', {}, p.spec.nombre), h('small', { class: 'sa-ar' }, p.area), h('p', {}, p.spec.resultado.que), h('em', {}, p.spec.acciones.some(esExterna) ? '🔒 Pide aprobación' : `Lee: ${p.spec.fuentes.slice(0, 2).map((f) => FUENTE[f]).join(', ')}`)); t.addEventListener('click', () => nuevo(p.spec, false)); return t; })))));
    cuerpo.querySelector('#sa-ia')?.addEventListener('click', () => nuevo(null, true)); cuerpo.querySelector('#sa-nuevo')?.addEventListener('click', () => nuevo(null, false));
  };
  const cargar = async () => { try { lista = (await api('sistemas/agentes')).agentes || []; } catch { lista = []; } try { costo = await api('sistemas/costo'); } catch { costo = null; } pintar(); };
  el.replaceChildren(cuerpo); await cargar();
}
