// Decide (#/decide): lo que solo tú puedes resolver. No es una lista de tareas: cada tarjeta trae la decisión en una frase, lo que
// está en juego y sus botones. Aprobar y Pedir cambios pasan por el servidor con la versión que leíste (si alguien la cambió, 409 y
// aquí se avisa: nunca se pisa). Escritorio: las tres primeras; teléfono: UNA por vez. Vacío: «Nada espera por ti. Disfruta.»
import { api, ask, skel, toast } from '../core.js';
import { h } from '../kit/dom.js';
import { DecisionCard } from '../kit/decisions.js';
import { cicloDe, frasesDeHito } from '../ciclo.js';
import { seleccion, accionesDe, VACIO } from '../decide.js';
import { herramientaDe } from '../herramientas.js';

export const esqueleto = () => skel('pagina');
const corto = (s) => (String(s).length > 70 ? String(s).slice(0, 68).trimEnd() + '…' : String(s));
const movil = () => window.matchMedia?.('(max-width: 760px)').matches;

// La franja del ciclo (1 → 20): un punto en «hoy», y el 11 y el 20 más gruesos (no se mueven).
export function franja(c = cicloDe(new Date())) {
  const dias = Array.from({ length: 20 }, (_, i) => i + 1);
  return h('div', { class: 'dec-ciclo', role: 'img', 'aria-label': `Día ${c.dia} del ciclo. ${c.fase.nombre}. ${frasesDeHito(c)}.` },
    h('div', { class: 'dec-ciclo-t' }, h('b', {}, c.enCiclo ? `Día ${c.dia}` : 'Fuera del ciclo'), h('span', {}, `${c.fase.nombre} · ${frasesDeHito(c)}`)),
    h('div', { class: 'dec-ciclo-r', 'aria-hidden': 'true' }, dias.map((d) => h('i', { class: `${d <= c.dia ? 'pasado ' : ''}${d === c.dia && c.enCiclo ? 'hoy ' : ''}${d === 11 || d === 20 ? 'hito' : ''}`.trim(), 'data-presion': d === c.proximoHito && c.presion ? String(c.presion) : null }))));
}

export async function render(el, { me, alive }) {
  let datos = null, error = '', i = 0;
  const cargar = async () => { try { datos = await api('decide'); error = ''; } catch (e) { error = e.message || 'No pude leer tus decisiones'; } };
  // A quién se escala si quien decide no es el CEO: el COO lo deja en el CEO; el resto, en el COO (CLAUDE.md · «Escalar no es bloquear»).
  const destino = me.role === 'coo' ? 'ceo' : 'coo';

  async function accion(item, id) {
    if (id === 'aprobar') { await api(`entregables/${encodeURIComponent(item.id)}/estado`, { method: 'POST', body: { a: 'Aprobado', v: item.v } }); return { ok: true, message: 'Aprobado.' }; }
    if (id === 'cambios') {
      const f = await ask('Pedir cambios', [{ k: 'nota', l: '¿Qué hay que cambiar?', t: 'textarea', req: true }], 'Pedir cambios'); if (!f) return { ok: false, error: 'No se pidió nada.' };
      await api(`entregables/${encodeURIComponent(item.id)}/estado`, { method: 'POST', body: { a: 'Borrador', v: item.v, nota: f.nota } }); return { ok: true, message: 'Devuelto con tus cambios.' };
    }
    if (id === 'escalar') {
      const f = await ask(`Escalar al ${destino.toUpperCase()}`, [{ k: 'nota', l: 'Por qué (una frase)', t: 'textarea' }], 'Escalar'); if (!f) return { ok: false, error: 'No se escaló.' };
      await api(`decide/${encodeURIComponent(item.id)}/escalar`, { method: 'POST', body: { a: destino, v: item.v, nota: f.nota } }); return { ok: true, message: `Escalado al ${destino.toUpperCase()}.` };
    }
    return { ok: false, error: 'Esa acción no existe.' };
  }

  function tarjeta(item) {
    const acs = accionesDe(item), bloqueadas = acs.filter((a) => a.disabled && a.motivo && a.id === 'aprobar'); // «Escalar» apagado no se explica: es ruido
    const tool = herramientaDe(item.tool);
    const card = DecisionCard({
      title: item.titulo, proposal: `${tool?.nombre || item.tool} · v${item.version} · ${item.client_slug}`,
      evidence: [item.prioridad?.razon, item.escaladoPor ? `Escalada por ${item.escaladoPor}${item.escaladoNota ? `: ${item.escaladoNota}` : ''}` : '', item.revisar].filter(Boolean).join(' · '),
      alternative: '',
      actions: acs.filter((a) => !a.disabled).map(({ id, label }) => ({ id, label })), context: { id: item.id },
      onAction: (id) => accion(item, id),
    });
    card.classList.add('dec-card'); card.dataset.id = item.id;
    if (!item.llegaAlICP && item.tool !== 'customer-bullseye') card.querySelector('header')?.append(h('p', { class: 'dec-aviso' }, 'No traza hasta el cliente ideal (ICP): conéctala a un origen aprobado.'));
    // Lo que falta para aprobar: dos cosas a la vista y el resto plegado (nunca un muro de texto).
    const fs = item.faltas || [];
    if (fs.length) card.querySelector('.kit-actions')?.before(h('div', { class: 'dec-faltas' }, h('p', {}, h('b', {}, 'Falta para aprobar: '), fs.slice(0, 2).map(corto).join(' · '), fs.length > 2 ? ` · y ${fs.length - 2} más` : ''),
      fs.length > 2 ? h('details', {}, h('summary', {}, 'Ver todo lo que falta'), h('ul', {}, fs.map((f) => h('li', {}, f)))) : null));
    else if (bloqueadas.length) card.querySelector('.kit-actions')?.before(h('p', { class: 'kit-muted' }, bloqueadas.map((a) => a.motivo).join(' · ')));
    card.addEventListener('kit:action', async () => { toast('Listo'); await cargar(); if (alive()) pintar(); });
    return card;
  }

  function pintar() {
    if (!alive()) return;
    const s = datos ? seleccion(datos.items, { movil: movil() }) : { visibles: [], resto: 0, total: 0, vacio: '' };
    const lista = movil() ? s.visibles : s.visibles;
    el.replaceChildren(h('div', { class: 'dec' },
      h('header', { class: 'dec-h' }, h('h1', {}, 'Decide'), h('p', {}, error ? '' : s.total ? `${s.total} ${s.total === 1 ? 'espera' : 'esperan'} por ti. Una a la vez.` : '')),
      franja(),
      error ? h('p', { class: 'dec-error', role: 'alert' }, error, ' ', h('button', { type: 'button', class: 'btn ghost', onClick: async () => { await cargar(); pintar(); } }, 'Reintentar')) : '',
      !error && !s.total ? h('p', { class: 'dec-vacio' }, VACIO) : '',
      h('div', { class: 'dec-l' }, lista.map(tarjeta)),
      s.resto ? h('p', { class: 'dec-resto' }, movil() ? `Quedan ${s.resto} después de esta.` : `Y ${s.resto} más cuando termines estas.`) : ''));
  }

  await cargar(); void i; pintar();
}
