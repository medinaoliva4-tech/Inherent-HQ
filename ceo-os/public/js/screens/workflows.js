// Workflows (#/ai/workflows): el editor básico de los flujos de cada agente (PLAN-GATEWAY §13).
// Un workflow es una plantilla JSON en ceo-os/workflows/: pasos, cada uno con su modelo sugerido, entradas, instrucción y salida.
// Aquí se ven y se editan. Lo que el CEO guarda va a settings «wf-<id>» (solo el CEO escribe); «Restaurar» vuelve al de la plantilla del repo.
// El ejecutor del servidor (gateway/runner.mjs) lee el JSON del repo: para que un cambio corra allá, se copia con «Copiar JSON» y va al repo.
// Sin librerías ni backend nuevo. Lo escrito por una persona se escapa (html``) o se lee como texto.
import { html, mount, api, acts, toast, skel, confirmAsk, $, $$ } from '../core.js';

export const esqueleto = () => skel('pagina');

const LISTA = ['estrategia-contexto-analisis']; // los de public/workflows/ (los copia el build desde ceo-os/workflows/)
const TIPOS = [['prep', 'Preparar (modelo gratis)'], ['llm', 'Escribir'], ['revision', 'Revisar'], ['gate', 'Aprobación humana']];
const MODELOS = ['kimi-k3', 'deepseek-v4-pro', 'deepseek-v4-flash', 'glm-5.3', 'nv-minimax-m3.1-flash'];
const idDoc = (id) => 'wf-' + id;
const clon = (x) => JSON.parse(JSON.stringify(x));
const entradasTxt = (s) => (s.inputs || []).map((i) => i.file + (i.secciones ? ' # ' + i.secciones.map((x) => x.trim()).join(',') : '') + (i.opcional ? ' ?' : '')).join('\n');
function entradasDe(txt) {
  return String(txt || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const opcional = l.endsWith(' ?'); if (opcional) l = l.slice(0, -2).trim();
    const [file, sec] = l.split(' # ');
    return { file: file.trim(), ...(sec ? { secciones: sec.split(',').map((s) => s.trim()).filter(Boolean).map((s) => s + ' ') } : {}), ...(opcional ? { opcional: true } : {}) };
  });
}

export async function render(el, { me, alive }) {
  const puede = me.role === 'ceo';
  const S = { id: LISTA[0], wf: null, orig: null, sel: 0, sucio: false, propio: false };

  async function cargar(id) {
    mount(el, skel('pagina'));
    let base = null;
    try { base = await (await fetch(`/workflows/${id}.json`, { credentials: 'same-origin' })).json(); } catch {}
    let doc = null;
    try { doc = await api('db/settings/' + idDoc(id)); } catch {}
    if (!alive()) return;
    if (!base && !doc?.wf) { mount(el, html`<div class="empty"><b>No encontré este workflow</b>Debe estar en ceo-os/workflows/.</div>`); return; }
    S.id = id; S.orig = base; S.propio = Boolean(doc?.wf); S.v = doc?.v; S.wf = clon(doc?.wf || base); S.sel = 0; S.sucio = false; paint();
  }

  const paso = () => S.wf.steps[S.sel];
  const modelosDe = () => Object.entries(S.wf.modelos || {});
  const real = (ref) => S.wf.modelos?.[ref] || ref;

  function lista() {
    return S.wf.steps.map((s, i) => html`<li><button type="button" class="wf-paso${i === S.sel ? ' on' : ''}" data-act="ir" data-i="${i}">
      <span class="wf-n">${i + 1}</span><span class="grow"><b>${s.nombre || s.id}</b><span class="mut sm wf-sub">${s.tipo === 'gate' ? 'Aprobación humana' : real(s.modelo)}</span></span></button></li>`);
  }

  function editor() {
    const s = paso(), gate = s.tipo === 'gate', dis = puede ? '' : 'disabled';
    const roles = modelosDe().map(([r, m]) => html`<option value="${r}" ${r === s.modelo ? 'selected' : ''}>${r} → ${m}</option>`);
    return html`<section class="card wf-ed">
      <label class="f" for="wf-nombre">Nombre del paso</label><input class="in" id="wf-nombre" data-f="nombre" value="${s.nombre || ''}" maxlength="80" ${dis}>
      <div class="wf-fila">
        <div><label class="f" for="wf-tipo">Tipo</label><select class="in" id="wf-tipo" data-f="tipo" ${dis}>${TIPOS.map(([k, n]) => html`<option value="${k}" ${k === s.tipo ? 'selected' : ''}>${n}</option>`)}</select></div>
        ${gate ? '' : html`<div><label class="f" for="wf-modelo">Modelo (rol)</label><select class="in" id="wf-modelo" data-f="modelo" ${dis}>${roles}</select></div>`}
        ${gate ? '' : html`<div><label class="f" for="wf-max">Salida máxima</label><input class="in" id="wf-max" data-f="max_output_tokens" type="number" min="200" max="12000" step="100" value="${s.max_output_tokens ?? S.wf.umbral?.max_output_tokens ?? 6000}" ${dis}></div>`}
      </div>
      ${s.sugerencia && !gate ? html`<p class="mut sm wf-sug"><b>Por qué este modelo:</b> ${s.sugerencia}</p>` : ''}
      ${gate ? html`<label class="f" for="wf-gate">Qué aprueba la persona</label><input class="in" id="wf-gate" data-f="gate" value="${s.gate || ''}" maxlength="200" ${dis}>`
        : html`<label class="f" for="wf-in">Lo que lee (una por línea · <code>archivo # secciones</code> · <code>?</code> al final si es opcional)</label>
          <textarea class="in wf-ta" id="wf-in" data-f="inputs" rows="4" spellcheck="false" ${dis}>${entradasTxt(s)}</textarea>
          <label class="f" for="wf-ins">Instrucción</label>
          <textarea class="in wf-ta" id="wf-ins" data-f="instruccion" rows="8" ${dis}>${s.instruccion || ''}</textarea>
          <label class="f" for="wf-out">Lo que escribe (archivo)</label><input class="in" id="wf-out" data-f="salida" value="${s.salida || ''}" spellcheck="false" ${dis}>`}
      ${puede ? html`<div class="row wf-acc"><button type="button" class="btn ghost xs" data-act="subir" ${S.sel === 0 ? 'disabled' : ''}>Subir</button><button type="button" class="btn ghost xs" data-act="bajar" ${S.sel === S.wf.steps.length - 1 ? 'disabled' : ''}>Bajar</button><button type="button" class="btn ghost xs" data-act="quitar">Quitar paso</button></div>` : ''}
    </section>`;
  }

  function ajustes() {
    const u = S.wf.umbral || {}, dis = puede ? '' : 'disabled';
    return html`<section class="card wf-aj"><div class="lbl">Umbral y modelos</div>
      <div class="wf-fila"><div><label class="f" for="wf-umi">Entrada máxima por paso</label><input class="in" id="wf-umi" data-u="max_input_tokens" type="number" min="2000" max="30000" step="500" value="${u.max_input_tokens ?? 20000}" ${dis}><span class="mut sm">Si algo pasa de esto, un modelo gratis lo condensa antes. Tu plan de Featherless corta en 32,768.</span></div></div>
      <div class="wf-fila">${modelosDe().map(([r, m]) => html`<div><label class="f" for="wf-m-${r}">${r}</label><select class="in" id="wf-m-${r}" data-m="${r}" ${dis}>${[...new Set([...MODELOS, m])].map((x) => html`<option ${x === m ? 'selected' : ''}>${x}</option>`)}</select></div>`)}</div></section>`;
  }

  function paint() {
    const w = S.wf;
    mount(el, html`<div class="hy-bh"><h2>${w.nombre}</h2><span>${w.descripcion || ''}</span></div>
      <p class="mut sm">Agente <b>${w.agente || '—'}</b> · versión ${w.version || 1} · variables: ${(w.variables || []).join(', ') || 'ninguna'} · ${S.propio ? 'editado en el OS' : 'tal como está en el repo'}${S.sucio ? ' · cambios sin guardar' : ''}</p>
      ${puede ? '' : html`<p class="mut sm">Solo el CEO edita los workflows. Aquí los puedes ver.</p>`}
      <div class="wf-grid"><ol class="wf-lista" aria-label="Pasos del workflow">${lista()}${puede ? html`<li><button type="button" class="btn ghost xs" data-act="nuevo">+ Paso</button></li>` : ''}</ol>
        <div>${editor()}${ajustes()}
          <div class="row wf-pie"><button type="button" class="btn" data-act="guardar" ${puede && S.sucio ? '' : 'disabled'}>Guardar</button>
            <button type="button" class="btn ghost" data-act="copiar">Copiar JSON</button>
            ${puede && S.propio ? html`<button type="button" class="btn ghost" data-act="restaurar">Restaurar el del repo</button>` : ''}</div></div></div>`);
  }

  const marcar = () => { S.sucio = true; const b = $('[data-act="guardar"]', el); if (b && puede) b.disabled = false; };
  const campo = (inp) => {
    if (!puede) return;
    const s = paso(), f = inp.dataset.f;
    if (f === 'inputs') s.inputs = entradasDe(inp.value);
    else if (f === 'max_output_tokens') s.max_output_tokens = Math.max(200, Math.min(12000, Number(inp.value) || 0));
    else s[f] = inp.value;
    if (f === 'tipo') { if (inp.value === 'gate') { s.gate ||= 'Aprobación'; s.inputs ||= []; } paint(); }
    marcar();
    if (f === 'nombre') { const n = $$('.wf-paso b', el)[S.sel]; if (n) n.textContent = inp.value || s.id; }
  };
  acts(el, {
    ir: (b) => { S.sel = Number(b.dataset.i) || 0; paint(); },
    nuevo: () => { const n = S.wf.steps.length + 1; S.wf.steps.push({ id: 'paso-' + n, nombre: 'Paso nuevo', tipo: 'llm', modelo: Object.keys(S.wf.modelos || {})[1] || 'medio', inputs: [], instruccion: '', salida: '{cliente}/paso-' + n + '.md', max_output_tokens: 4000 }); S.sel = n - 1; marcar(); paint(); },
    subir: () => { const a = S.wf.steps; [a[S.sel - 1], a[S.sel]] = [a[S.sel], a[S.sel - 1]]; S.sel -= 1; marcar(); paint(); },
    bajar: () => { const a = S.wf.steps; [a[S.sel + 1], a[S.sel]] = [a[S.sel], a[S.sel + 1]]; S.sel += 1; marcar(); paint(); },
    quitar: async () => { if (S.wf.steps.length < 2 || !(await confirmAsk('¿Quitar este paso?'))) return; S.wf.steps.splice(S.sel, 1); S.sel = Math.max(0, S.sel - 1); marcar(); paint(); },
    guardar: async () => {
      if (!puede) return;
      const w = { ...S.wf, version: (Number(S.wf.version) || 1) + (S.propio ? 1 : 0) };
      try {
        const r = S.propio ? await api('db/settings/' + idDoc(S.id), { method: 'PUT', body: { id: idDoc(S.id), wf: w, v: S.v } }) : await api('db/settings', { method: 'POST', body: { id: idDoc(S.id), wf: w } });
        S.v = r.v;
      } catch (e) { return toast(e.status === 409 ? 'Alguien más lo cambió: recarga la página.' : e.message, true); }
      S.wf = w; S.propio = true; S.sucio = false; toast('Guardado'); paint();
    },
    restaurar: async () => {
      if (!(await confirmAsk('¿Volver al workflow del repo? Se pierden los cambios hechos aquí.'))) return;
      try { await api('db/settings/' + idDoc(S.id), { method: 'DELETE' }); } catch (e) { return toast(e.message, true); }
      cargar(S.id);
    },
    copiar: async () => { try { await navigator.clipboard.writeText(JSON.stringify(S.wf, null, 2) + '\n'); toast('JSON copiado: va en ceo-os/workflows/'); } catch { toast('No pude copiar', true); } },
  });
  el.addEventListener('input', (e) => { const t = e.target; if (t.matches?.('[data-f]') && puede && t.tagName !== 'SELECT') campo(t); });
  el.addEventListener('change', (e) => { const t = e.target; if (!puede || !t.matches?.('select[data-f],select[data-m],input[data-u],input[type=number][data-f]')) return; if (t.dataset.f) campo(t); else if (t.dataset.u) { S.wf.umbral = { ...(S.wf.umbral || {}), [t.dataset.u]: Number(t.value) || 0 }; marcar(); } else { S.wf.modelos[t.dataset.m] = t.value; marcar(); paint(); } });
  await cargar(S.id);
}
