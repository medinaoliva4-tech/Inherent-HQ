// Los departamentos dentro del Chat: el menú «@», la etiqueta del mensaje (qué departamento y con qué nivel) y la tarjeta
// «Pasar a…» (el gate: leer antes de pasar). Solo dibuja: el estado y las llamadas viven en screens/llm.js.
import { html, raw, ico } from '../core.js';
import { departamentoDe, puedePasar } from './departamentos.js';

export const menuDepartamentosHtml = (ds) => html`${ds.length ? html`<p class="lc-cmds-h">Departamentos</p>` : ''}${ds.map((d, i) => html`<button type="button" class="${i ? '' : 'on'}" data-a="arroba" data-n="${d.arroba}"><b>@${d.arroba}</b><span>${d.depto} · ${d.hace}</span></button>`)}`;

/** «③ Marketing y Creative · nivel-medio» encima de la respuesta de un departamento. */
export function depChipHtml(x) {
  const d = departamentoDe(x.dep); if (!d) return '';
  return html`<span class="lm-dep" title="${d.hace}">${d.depto}${x.nivel ? html` · <code>${x.nivel}</code>` : ''}</span>`;
}

/**
 * La tarjeta «Pasar a…». Antes de pasar hay que abrir y leer el resultado (x.leido); lo que sale de Strategy o entra a Ads
 * solo lo pasa el CEO. Pasar NO envía: deja el pedido en la caja para que la persona lo revise y lo mande.
 */
export function paseHtml(x, i, rol) {
  const p = x.pase; if (!p) return '';
  const a = departamentoDe(p.a); if (!a) return '';
  const no = puedePasar({ de: x.dep, a: p.a, leido: Boolean(x.leido), rol });
  return html`<div class="lm-apr lm-pase"><span class="lm-k">${ico('arrow-right', 12)} Propone pasar a ${a.depto}</span><b>${p.que || 'Seguir con este resultado'}</b>
    ${x.pasado ? html`<span class="lm-meta-ok">${ico('check', 13)} Pasado a la caja: revísalo y envíalo</span>` : html`<div class="lm-ops">
      <button type="button" data-a="dep-leer" data-i="${i}">${ico('eye', 13)} ${x.leido ? 'Leído' : 'Abrir y leer'}</button>
      <button type="button" class="si" data-a="dep-pasar" data-i="${i}" ${no ? raw('disabled') : ''} title="${no || `Deja el pedido para @${a.arroba} en la caja`}">Pasar a @${a.arroba}</button></div>
      ${no ? html`<small class="lm-pase-no">${no}</small>` : ''}`}</div>`;
}
