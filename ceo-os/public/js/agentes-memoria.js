// El aprendizaje de un agente: lo que el equipo le ha corregido y las reglas aprobadas que ya recibe.
import { html, mount, api, ico, toast } from './core.js';
import { MAX_REGLA } from './memoria.js';

export async function pintarMemoria(el, wf, editor, onCambio = () => {}) {
  let d;
  const ruta = `agentes/workflows/${encodeURIComponent(wf.id)}`;
  const pintar = (borrador = '') => mount(el, html`<details class="agm" ${d.correcciones.length || d.reglas.length ? 'open' : ''}><summary>Aprendizaje · ${d.reglas.length} ${d.reglas.length === 1 ? 'regla' : 'reglas'}</summary>
    ${d.reglas.length ? html`<ul class="agm-r">${d.reglas.map((r, i) => html`<li><span>${r.texto}</span>${editor ? html`<button class="lat-ib" type="button" data-m="quitar" data-i="${i}" aria-label="Quitar regla">${ico('x', 15)}</button>` : ''}</li>`)}</ul>` : html`<p class="mut sm">Todavía no tiene reglas.</p>`}
    ${editor ? html`<div class="agm-n"><input class="in" id="agm-t" maxlength="${MAX_REGLA}" value="${borrador}" placeholder="Regla general, sin datos de un cliente" aria-label="Regla nueva"><button class="btn sm" type="button" data-m="agregar">Agregar</button></div>
    ${d.correcciones.length ? html`<h4>Lo que el equipo le ha corregido</h4><ul class="agm-c">${d.correcciones.slice(0, 12).map((c, i) => html`<li><p>${c.nota}</p><small>${[c.etapa, c.cliente].filter(Boolean).join(' · ')}</small><button class="btn ghost sm" type="button" data-m="usar" data-i="${i}">Volver regla</button></li>`)}</ul>` : ''}` : ''}</details>`);
  try { d = await api(`${ruta}/aprendizaje`); } catch { return; }
  pintar();
  el.onclick = async (e) => {
    const b = e.target.closest('[data-m]'); if (!b) return;
    if (b.dataset.m === 'usar') return pintar(d.correcciones[+b.dataset.i].nota.slice(0, MAX_REGLA));
    try {
      const body = b.dataset.m === 'quitar' ? { quitar: +b.dataset.i } : { texto: el.querySelector('#agm-t').value };
      const j = await api(`${ruta}/reglas`, { method: 'POST', body }); d.reglas = j.workflow.reglas || []; onCambio(j.workflow); pintar(); toast('Listo');
    } catch (er) { toast(er.message, true); }
  };
}
