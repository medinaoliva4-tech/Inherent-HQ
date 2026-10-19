// Inherent → Visión y misión: hacia dónde va Inherent y para qué existe. La escribe el CEO; la lee todo el equipo.
// Vive en settings «vision» ({ vision, mission }). Mientras el CEO no la guarde, la visión es la frase de la identidad.
import { html, mount, col, toast, ico, sheetForm, fdate, acts, fromLink } from '../core.js';

export const IDENTITY = 'We build cool brands—and the growth systems behind them.';

export async function render(el, { me, alive }) {
  const S = col('settings'), ceo = me.role === 'ceo';
  let doc = null;
  // Se lee de la lista de settings (así no hay un 404 cuando todavía no se guarda).
  try { doc = (await S.list()).find((x) => x.id === 'vision') || null; } catch (e) { return mount(el, html`<div class="empty"><b>No pude leer la visión</b>${e.message}</div>`); }
  if (!alive()) return;
  const val = () => ({ vision: String(doc?.vision ?? IDENTITY), mission: String(doc?.mission ?? '') });

  function paint() {
    const v = val(), when = doc?._meta?.updated_at || doc?._meta?.created_at, who = doc?._meta?.updated_by || doc?._meta?.created_by;
    mount(el, html`<div class="hello sp-hero row" style="align-items:flex-end"><div><h1>Visión y misión</h1><p>Hacia dónde va <em>Inherent</em> y para qué existe.</p></div><div class="sp"></div>
        ${ceo ? html`<button class="btn" data-act="edit">${ico('edit', 14)} Editar</button>` : html`<span class="chip" title="La escribe el CEO">${ico('eye', 13)} Solo lectura</span>`}</div>
      <div class="vm">
        <section class="sp-cover vm-vision"><span class="lbl">Visión</span>${v.vision.trim() ? html`<p class="vm-text">${v.vision}</p>` : html`<p class="vm-text vm-empty">${ceo ? 'Escribe hacia dónde va Inherent.' : 'El CEO todavía no la escribe.'}</p>`}</section>
        <section class="sp-panel vm-mission"><span class="lbl">Misión</span>${v.mission.trim() ? html`<p class="vm-text">${v.mission}</p>`
          : html`<div class="vm-empty-box"><b>${ceo ? 'La misión todavía está en blanco' : 'El CEO todavía no escribe la misión'}</b><span class="mut">${ceo ? 'Para qué existe Inherent, en una o dos frases. Toca «Editar».' : 'Cuando la escriba, aparece aquí.'}</span></div>`}</section>
      </div>
      <div class="vm-src">${doc ? fromLink({ label: `Inherent OS · ${who ? who.split('@')[0] : 'el CEO'}${when ? ' · ' + fdate(String(when).slice(0, 10)) : ''}`, plain: true, title: 'Guardado en settings «vision»' }) : fromLink({ label: 'la identidad de Inherent (CLAUDE.md · 01-IDENTIDAD.md)', plain: true, title: 'Valor inicial hasta que el CEO la guarde' })}</div>`);
  }
  paint();
  if (!ceo) return;
  acts(el, {
    edit: async () => {
      const v = val();
      const r = await sheetForm('Visión y misión', [
        { k: 'vision', l: 'Visión', t: 'textarea', v: v.vision, help: 'Hacia dónde va Inherent. Una frase que se entienda en 10 segundos.' },
        { k: 'mission', l: 'Misión', t: 'textarea', v: v.mission, help: 'Para qué existe Inherent y para quién.' },
      ], { okLabel: 'Guardar', note: 'La ve todo el equipo en Inherent → Visión y misión.' });
      if (!r) return;
      try { doc = doc ? await S.save({ ...doc, ...r }) : await S.create({ id: 'vision', ...r }); toast('Guardado'); paint(); }
      catch (e) { toast(e.message, true); }
    },
  });
}
