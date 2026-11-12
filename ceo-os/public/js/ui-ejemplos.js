// La página de ejemplos de ui.js (public/ui-ejemplos.html): cada componente en claro y oscuro, con datos de muestra.
// No es una pantalla del OS; la usan la prueba scripts/test-ui-comportamiento.mjs y las capturas de docs/capturas-ui/.
import ui, { instalarUi } from './ui.js';
import { ask, confirmAsk } from './core.js';

const $ = (s) => document.querySelector(s);
const log = (t) => { $('#log').textContent = t; };
instalarUi();

$('#tema').onclick = () => { const h = document.documentElement, claro = h.dataset.theme !== 'light'; h.dataset.theme = claro ? 'light' : 'dark'; $('#tema').textContent = claro ? 'Cambiar a oscuro' : 'Cambiar a claro'; };

$('#m-acciones').onclick = (e) => ui.menu(e.currentTarget, [
  { label: 'Abrir', icon: 'arrow-right', shortcut: '↵', onSelect: () => log('Abrir') },
  { label: 'Duplicar', icon: 'copy', shortcut: '⌘D', onSelect: () => log('Duplicar') },
  { label: 'Mover a', icon: 'folder', items: [{ label: 'Clientes', onSelect: () => log('Mover a Clientes') }, { label: 'Interno', onSelect: () => log('Mover a Interno') }] },
  { label: 'Archivar', icon: 'inbox', disabled: true },
  '-',
  { label: 'Borrar', icon: 'trash', danger: true, shortcut: '⌫', onSelect: () => log('Borrar') },
], { etiqueta: 'Acciones' });

const clientes = ['Akai', 'Atelier', 'Cerantola', 'Inherent', 'Nao', 'Naru', 'Nokiate'];
$('#m-buscar').onclick = (e) => ui.menu(e.currentTarget, clientes.map((c, i) => ({ label: c, sub: i % 2 ? 'Brand Growth' : 'Foundation', icon: `<i class="ui-mi-mono">${c.slice(0, 2).toUpperCase()}</i>`, checked: c === 'Nao', onSelect: () => log(`Cliente: ${c}`) })), { titulo: 'Cliente', buscar: 'Buscar cliente…' });

$('#m-modelo').onclick = (e) => ui.menu(e.currentTarget, [
  { grupo: 'Cuánto piensa' }, { label: 'Rápido', sub: 'Respuestas cortas', checked: true, onSelect: () => log('Rápido') }, { label: 'A fondo', sub: 'Piensa más', checked: false, onSelect: () => log('A fondo') },
  { grupo: 'Qué modelo responde' }, { label: 'Kimi K3', sub: 'Servidor', checked: true, onSelect: () => log('Kimi') }, { label: 'Claude', sub: 'Tu cuenta', checked: false, onSelect: () => log('Claude') },
], { titulo: 'Modelo', pie: '<p class="ui-menu-nota">Los modelos locales no diseñan en Figma.</p>' });

$('#m-zona').addEventListener('contextmenu', (e) => { e.preventDefault(); ui.menu(e, [{ label: 'Copiar', icon: 'copy', onSelect: () => log('Copiar') }, { label: 'Copiar link', icon: 'link', onSelect: () => log('Copiar link') }, '-', { label: 'Quitar', danger: true, onSelect: () => log('Quitar') }]); });

$('#p-abrir').onclick = (e) => ui.popover(e.currentTarget, '<b>Contexto del chat</b><p class="mut sm" style="margin:6px 0 10px">Qué ve la IA en esta conversación.</p><label class="check"><input type="checkbox" checked> Cliente actual</label><br><label class="check"><input type="checkbox"> Documentos de la Library</label>', { etiqueta: 'Contexto del chat', flecha: true, ancho: 300 });

$('#d-confirmar').onclick = async () => log(`confirmAsk → ${await confirmAsk('¿Archivar este proyecto?')}`);
$('#d-ask').onclick = async () => log(`ask → ${JSON.stringify(await ask('Nueva tarea', [{ k: 'titulo', l: 'Título', req: true }, { k: 'due', l: 'Fecha', t: 'date', half: true }, { k: 'p', l: 'Prioridad', t: 'select', opts: ['Alta', 'Media', 'Baja'], half: true }]))}`);
$('#d-lado').onclick = () => ui.dialog({ forma: 'lado', titulo: 'Fuente: informe de mercado', cuerpo: '<p class="ui-dlg-p">Un panel lateral para leer sin perder la pantalla de atrás. Esc o clic afuera lo cierra.</p>' });
$('#d-hoja').onclick = () => ui.dialog({ forma: 'hoja', titulo: 'Ajustes del Chat', cuerpo: '<p class="ui-dlg-p">En el cel sube desde abajo; en la compu queda al centro.</p>', acciones: [{ label: 'Listo', value: 'ok' }] });

const vistas = ['Resumen', 'Tareas', 'Archivos', 'Historial'], filtros = ['Todas', 'Abiertas', 'Hechas'];
let v = 'Resumen', f = 'Todas';
const pintarTabs = () => {
  $('#t-tabs').innerHTML = ui.tabs(vistas.map((x) => ({ value: x, label: x, on: x === v, cuenta: x === 'Tareas' ? 4 : null })), { etiqueta: 'Vista' });
  $('#t-seg').innerHTML = ui.segmented(filtros.map((x) => ({ value: x, label: x, on: x === f })), { etiqueta: 'Filtro', mini: true });
};
pintarTabs();
$('#t-tabs').onclick = (e) => { const b = e.target.closest('[data-v]'); if (b) { v = b.dataset.v; pintarTabs(); $(`#t-tabs [data-v="${v}"]`).focus(); log(`Vista: ${v}`); } };
$('#t-seg').onclick = (e) => { const b = e.target.closest('[data-v]'); if (b) { f = b.dataset.v; pintarTabs(); $(`#t-seg [data-v="${f}"]`).focus(); log(`Filtro: ${f}`); } };
$('#t-marcado').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; for (const x of $('#t-marcado').children) x.classList.toggle('on', x === b); };
