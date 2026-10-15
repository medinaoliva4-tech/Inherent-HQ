import { recorder } from '../recorder.js';
import { WORK_ROLES, wizard, connectCard , openClaude, ICON, ico } from '../core.js';
import { html, raw, mount, col, api, acts, toast, fdate, ask, confirmAsk, drawer, closeDrawer, md, inline, $, folderSvg, TONES, embedUrl, IC, diagram, diagrams } from '../core.js';

// Library: SOPs, playbooks, videos y notas que el equipo escribe aquí, en carpetas.
// Una carpeta se puede conectar a una carpeta de Google Drive: se ve su contenido y se crean Docs ahí.
const KINDS = ['SOP', 'Playbook', 'Entrevista', 'Prompt', 'Diagrama', 'Video', 'Nota'];
export const VTYPES = ['Reel', 'UGC / testimonio', 'Anuncio (Ads)', 'Derivado / corte', 'Story', 'YouTube / horizontal'];
const KCOL = { SOP: '#87684e', Playbook: '#a18770', Prompt: '#81634b', Diagrama: '#84664d', Video: '#36271b', Nota: '#997d65', Entrevista: '#6b513c' };
// El formato de cada tipo: lo que tiene que llevar. Se carga al crear el documento.
const TPL = {
  SOP: (t) => `# SOP · ${t}

> **Para qué sirve:** el resultado que deja este proceso, en una frase.
> **Dueño:** el rol responsable · **Cuándo se usa:** el disparador (día del ciclo, evento, pedido)
> **Tiempo:** cuánto toma · **Herramientas:** las que se abren

## Resultado esperado
Cómo se ve "bien hecho". Si se puede medir, con el número.

## Antes de empezar
- [ ] Lo que tiene que existir antes (archivo, acceso, aprobación)
- [ ] Lo que hay que leer

## Pasos
1. **Paso** — quién (rol) · dónde · cuánto tarda
2. **Paso** — quién (rol) · dónde · cuánto tarda
3. **Paso** — quién (rol) · dónde · cuánto tarda

## Checklist de calidad
- [ ] Revisión antes de entregar
- [ ] Revisión antes de entregar

## Errores comunes
- **Error:** cómo se evita

## Si algo falla
Precio, alcance y fechas → el CEO · lo demás → el COO.
`,
  Playbook: (t) => `# Playbook · ${t}

> **Objetivo:** qué se gana si se juega bien.
> **Cuándo se usa:** las señales de que aplica · **Para quién:** el rol que lo corre

## La situación
Qué está pasando cuando hace falta esta jugada. Las señales concretas.

## La jugada
La estrategia en un párrafo: qué hacemos distinto y por qué funciona.

## Paso a paso
1. **Movimiento** — qué se hace · quién · en cuánto tiempo
2. **Movimiento** — qué se hace · quién · en cuánto tiempo
3. **Movimiento** — qué se hace · quién · en cuánto tiempo

## Qué decir
> "El guion o mensaje literal, entre comillas."

## Objeciones y respuestas
| Si dicen… | Respondemos… |
|---|---|
| "Objeción" | "Respuesta" |

## Cómo sabemos que funcionó
- La métrica y el número que buscamos

## Si no funciona
El plan B y cuándo se escala.
`,
  Video: (t) => `# ${t}

> **Qué aprendes:** en una frase. · **Para:** el rol · **Duración:** minutos

## Capítulos
- 00:00 — Introducción
- 00:00 — Tema

## Resumen
Las 3 ideas clave del video.

## Para practicar
- [ ] Lo que hay que hacer después de verlo

## Recursos
- [Link](https://)
`,
  Entrevista: () => `> **Para:** a quién se entrevista · **Objetivo:** qué tenemos que saber al terminar.

## 1 · Tema

1. ⭐ Pregunta que no se puede quedar sin respuesta
   > Lo ideal: cómo debería estar esto y con qué servicio lo resolvemos.
2. Pregunta solo para conocer (sin «Lo ideal»)

## 2 · Otro tema

1. Pregunta
   > Lo ideal: hacia dónde guiarlo.
`,
  Nota: (t) => `# ${t}

`,
  Diagrama: () => DGM.flujo,
  Prompt: (t, d = {}) => `Eres el editor de video de Inherent para ${d.client ? d.client.toUpperCase() : 'nuestras marcas'}. Tipo de video: ${d.vtype || '—'}.

Marca: respeta su guía (paleta, tipografías, tono y activos distintivos). Assets en su Drive.
Objetivo de la pieza: [pega aquí el objetivo o el brief]
Formato: [9:16 / 16:9 / 1:1] · Duración: [segundos]

Cómo debe quedar:
- Hook en los primeros 2 segundos
- [estructura: problema → giro → resultado]
- Subtítulos quemados, cortes cada 1.5-2 s
- Cierre con CTA: [CTA]

Entrega: plan de edición escena por escena (tiempo, toma, texto en pantalla, audio) y lista de exports (orgánico y Ads).`,
};
const DGM = {
  flujo: `flowchart TD
  A[Llega el pedido] --> B{¿Está en el plan?}
  B -- Sí --> C[Se ejecuta]
  B -- No --> D[Se escala al CEO]
  C --> E[QA del COO]
  E --> F[Entrega al cliente]`,
  secuencia: `sequenceDiagram
  participant Cliente
  participant Secretaria
  participant COO
  Cliente->>Secretaria: Pide un cambio
  Secretaria->>COO: Escala
  COO-->>Cliente: Respuesta con fecha`,
  mapa: `mindmap
  root((Inherent))
    Marketing
      Contenido
      Pauta
    Growth
      Oferta
      Conversión
    Operaciones
      SOPs
      Calendario`,
  tiempo: `timeline
  title El ciclo del mes
  Día 1 : Reunión
  Días 1-3 : Plan
  Días 6-11 : Producción
  Días 12-15 : Montaje
  Día 20 : Presentación`,
  org: `flowchart TD
  CEO --> COO
  COO --> Producción
  COO --> Edición
  COO --> Operador`,
};
const DGN = { flujo: 'Flujo', secuencia: 'Secuencia', mapa: 'Mapa mental', tiempo: 'Línea de tiempo', org: 'Organigrama' };
const MIME = (m) => (/folder/.test(m) ? ['DIR', '#82634b'] : /document/.test(m) ? ['DOC', '#87684e'] : /spreadsheet/.test(m) ? ['XLS', '#8c6d53'] : /presentation/.test(m) ? ['PPT', '#aa917b'] : /pdf/.test(m) ? ['PDF', '#745842'] : /video/.test(m) ? ['MP4', '#36271b'] : /image/.test(m) ? ['IMG', '#84664d'] : ['FILE', '#9f846d']);
const driveOk = (u) => /^https:\/\/drive\.google\.com\/drive\/(u\/\d+\/)?folders\/[-\w]{20,}/.test(String(u || ''));

export async function render(el, { me, sub, alive }) {
  // Abrir prompts en Claude (con la cuenta de cada quien): Content, Editor de video y CEO.
  const canClaude = me.role === 'ceo' || (me.roles || []).some((r) => r === 'content' || r === 'video');
  const F = col('folders'), D = col('docs');
  let [folders, docs] = await Promise.all([F.list(), D.list()]);
  let q = '';
  const [fid, did] = sub;

  async function newFolder(f) {
    const v = await ask(f ? 'Editar carpeta' : 'Nueva carpeta', [
      { k: 'name', l: 'Nombre', v: f?.name, req: true },
      { k: 'tone', l: 'Color', t: 'select', opts: TONES.map((t) => [t, t[0].toUpperCase() + t.slice(1)]), v: f?.tone || 'gris', half: true },
      { k: 'drive', l: 'Carpeta de Google Drive (opcional)', v: f?.drive, half: true },
      { k: 'desc', l: 'Para qué es', t: 'textarea', v: f?.desc },
    ]);
    if (!v) return null;
    if (v.drive && !driveOk(v.drive)) { toast('Pega el link de una carpeta de Drive (drive.google.com/drive/folders/…)', true); return null; }
    try { const r = f ? await F.save({ ...f, ...v }) : await F.create(v); folders = f ? folders.map((x) => (x.id === r.id ? r : x)) : [...folders, r]; toast('Carpeta guardada'); return r; } catch (e) { toast(e.message, true); return null; }
  }
  async function newDoc(folderId) {
    let clients = []; try { clients = (await api('repo/clients')).clients.filter((c) => c.hasPlan).map((c) => c.slug); } catch {}
    const v = await wizard('Nuevo documento', [
      { k: 'kind', q: '¿Qué vas a crear?', type: 'cards', req: true, opts: [
        { v: 'SOP', i: ico('clipboard'), l: 'SOP', d: 'Un proceso paso a paso' }, { v: 'Playbook', i: ico('target', 16), l: 'Playbook', d: 'Una jugada para una situación' }, { v: 'Entrevista', i: ico('chat'), l: 'Entrevista', d: 'Preguntas con espacio para responder' },
        { v: 'Prompt', i: ico('spark'), l: 'Prompt de video', d: 'Para una marca y un tipo de video' }, { v: 'Diagrama', i: ico('shuffle'), l: 'Diagrama', d: 'Flujo, mapa, organigrama' },
        { v: 'Video', i: ico('video'), l: 'Video', d: 'Link de YouTube, Loom o Drive' }, { v: 'Nota', i: ico('doc'), l: 'Nota', d: 'Texto libre' }] },
      { k: 'client', q: '¿Para qué marca?', type: 'cards', req: true, show: (a) => a.kind === 'Prompt', opts: [{ v: '_', i: ico('globe'), l: 'General', d: 'Sirve para todas' }, ...clients.map((c) => ({ v: c, i: ico('tag'), l: c.toUpperCase() }))] },
      { k: 'vtype', q: '¿Qué tipo de video?', type: 'cards', req: true, show: (a) => a.kind === 'Prompt', opts: VTYPES.map((x) => ({ v: x, l: x })) },
      { k: 'url', q: 'Pega el link del video', type: 'text', req: true, show: (a) => a.kind === 'Video', ph: 'https://…' },
      { k: 'title', q: '¿Cómo se llama?', type: 'text', req: true, v: (a) => (a.kind === 'Prompt' ? `${a.client === '_' ? 'General' : (a.client || '').toUpperCase()} · ${a.vtype}` : undefined), ph: 'Título' },
      { k: 'folder_id', q: '¿En qué carpeta va?', type: 'cards', show: () => !folderId && folders.length > 0, v: '', opts: [{ v: '', i: '—', l: 'Sin carpeta' }, ...folders.map((f) => ({ v: f.id, i: ico('folder'), l: f.name }))] },
    ], 'Crear');
    if (!v) return;
    if (v.url && !/^https:\/\//.test(v.url)) return toast('El link debe empezar con https://', true);
    const roles = v.kind === 'Prompt' ? ['video'] : [];
    const extra = v.kind === 'Prompt' ? { client: v.client === '_' ? '' : v.client, vtype: v.vtype } : {};
    try { const r = await D.create({ title: v.title, kind: v.kind, url: v.url || '', folder_id: folderId || v.folder_id || '', roles, ...extra, body: (TPL[v.kind] || TPL.Nota)(v.title, extra) }); location.hash = `/library/${r.folder_id || '_'}/${r.id}/edit`; } catch (e) { toast(e.message, true); }
  }

  // Grabar (como Loom) → sube a Drive → queda como documento de tipo Video.
  function record(folderId) {
    recorder({ onDone: async ({ title, link }) => {
      try { const r = await D.create({ title, kind: 'Video', folder_id: folderId || '', url: link, body: `# ${title}\n\n> Grabado en Inherent OS. Drive tarda unos minutos en procesar el video.\n\n## Resumen\n\n` });
        toast('Video guardado en la Library'); location.hash = `/library/${r.folder_id || '_'}/${r.id}`; } catch (e) { toast(e.message, true); }
    } });
  }
  const docRow = (d) => html`<tr class="click" data-act="doc" data-id="${d.id}"><td><span class="ftype" style="background:${KCOL[d.kind] || '#9f846d'}">${(d.kind || 'Doc').slice(0, 4).toUpperCase()}</span><b style="font-weight:500">${d.title}</b></td><td class="mut">${folders.find((f) => f.id === d.folder_id)?.name || '—'}</td><td class="mut">${d._meta?.updated_at ? fdate(String(d._meta?.updated_at).slice(0, 10)) : ''}</td><td class="mut sm">${d._meta?.updated_by || ''}</td></tr>`;

  // ---------- Inicio: carpetas + documentos recientes ----------
  function home() {
    const ql = q.toLowerCase();
    const list = docs.filter((d) => !ql || (d.title + ' ' + (d.body || '')).toLowerCase().includes(ql)).sort((a, z) => String(z._meta?.updated_at || '').localeCompare(String(a._meta?.updated_at || '')));
    mount(el, html`<div class="hello"><h1>Library</h1><p>SOPs, playbooks y videos. <em>Todo en un lugar.</em></p></div>
      <div class="row" style="margin-bottom:18px;gap:8px;flex-wrap:wrap"><input class="in" id="q" placeholder="Buscar en la library…" value="${q}" style="max-width:340px"><div class="sp"></div>${me.role === 'ceo' && !docs.some((d) => d.title.startsWith('Entrevista 1') && d.seed >= 2 && folders.find((f) => f.id === d.folder_id)?.name === 'Cerantola') ? html`<button class="btn" data-act="seedCerantola">Cargar folder de Cerantola</button>` : ''}<button class="btn ghost" data-act="newFolder">+ Carpeta</button><button class="btn ghost" data-act="rec">${ico('dot', 13)} Grabar video</button><button class="btn" data-act="newDoc">+ Documento</button></div>
      ${folders.length ? html`<div class="folders">${folders.map((f) => html`<div class="folder" data-act="folder" data-id="${f.id}">${folderSvg({ drive: Boolean(f.drive), tone: f.tone, video: docs.some((d) => d.folder_id === f.id && d.kind === 'Video') })}<b>${f.name}</b><span class="mut sm">${docs.filter((d) => d.folder_id === f.id).length} documentos${f.drive ? ' · Drive' : ''}</span></div>`)}</div>`
        : html`<div class="empty"><b>Todavía no hay carpetas</b>Crea la primera: «Onboarding de cliente», «Producción», «Playbooks de venta»… y conéctala a una carpeta de Drive si quieres.</div>`}
      <div class="sec-title"><h2>${q ? 'Resultados' : 'Recientes'}</h2></div>
      ${list.length ? html`<div class="card"><table><thead><tr><th>Documento</th><th>Carpeta</th><th>Actualizado</th><th>Por</th></tr></thead><tbody>${list.slice(0, 30).map(docRow)}</tbody></table></div>` : html`<div class="empty"><b>${q ? 'Nada con eso' : 'Sin documentos'}</b>${q ? 'Prueba otra palabra.' : 'Crea uno con «+ Documento».'}</div>`}`);
    const qi = $('#q', el); qi.oninput = () => { q = qi.value; const pos = qi.selectionStart; home(); const n = $('#q', el); n.focus(); n.setSelectionRange(pos, pos); };
  }

  // ---------- Carpeta: sus documentos + su Drive ----------
  async function folderPage(id) {
    const f = folders.find((x) => x.id === id);
    if (!f) return mount(el, html`<a class="btn ghost" href="#/library">← Library</a><div class="empty" style="margin-top:16px"><b>Esa carpeta no existe</b></div>`);
    let drive = null, dErr = null;
    const paint = () => {
      const list = docs.filter((d) => d.folder_id === id);
      mount(el, html`<div class="row" style="margin-bottom:14px"><a class="btn ghost" href="#/library">← Library</a></div>
        <div class="row" style="gap:20px;align-items:center;flex-wrap:wrap;margin-bottom:20px"><div style="width:110px">${folderSvg({ w: 110, drive: Boolean(f.drive), tone: f.tone })}</div>
          <div style="flex:1;min-width:240px"><h1 style="font-size:46px;font-weight:500;letter-spacing:-1.4px">${f.name}</h1>${f.desc ? html`<div class="mut">${f.desc}</div>` : ''}</div>
          <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn ghost" data-act="editFolder">Editar</button><button class="btn ghost" data-act="recHere">${ico('dot', 13)} Grabar video</button><button class="btn" data-act="newDocHere">+ Documento</button></div></div>
        <div class="sec-title" style="margin-top:0"><h2>Documentos</h2></div>
        ${list.length ? html`<div class="grid g3">${list.map((d) => html`<div class="card" data-act="doc" data-id="${d.id}" style="cursor:pointer"><div class="row"><span class="chip" style="background:${KCOL[d.kind] || '#9f846d'};color:#fdfaf3">${d.kind || 'Doc'}</span><div class="sp"></div>${d.url ? html`<span class="mut sm">${ico('play', 13)} video</span>` : ''}</div><h3 style="font-size:19px;font-weight:500;letter-spacing:-.4px;margin-top:14px">${d.title}</h3><div class="mut sm" style="margin-top:6px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${String(d.body || '').replace(/[#*>`|-]/g, '').slice(0, 200) || 'Vacío'}</div></div>`)}</div>`
          : html`<div class="empty"><b>Sin documentos aquí</b>Crea un SOP, playbook o video con «+ Documento».</div>`}
        <div class="sec-title"><h2>Google Drive</h2>${f.drive ? html`<div class="row" style="gap:8px"><button class="btn ghost" data-act="gnew" style="padding:8px 14px">+ Google Doc</button><a class="btn ghost" href="${f.drive}" target="_blank" rel="noopener noreferrer" style="padding:8px 14px;text-decoration:none">${IC.drive} Abrir en Drive</a></div>` : ''}</div>
        ${!f.drive ? connectCard('drive', 'Conecta esta carpeta con Google Drive', 'Verás aquí sus archivos y podrás crear Docs, Sheets y Slides directo en ella.', 'connectDrive', 'Conectar con Drive')
          : drive === null ? html`<p class="loading">Leyendo tu Drive…</p>` : dErr ? html`<div class="warnbox">${dErr}</div>`
          : drive.files.length ? html`<div class="card"><table><thead><tr><th>Archivo</th><th>Dueño</th><th>Modificado</th></tr></thead><tbody>${drive.files.map((x) => { const [t, c] = MIME(x.mime); return html`<tr class="click" data-act="dfile" data-id="${x.id}"><td><span class="ftype" style="background:${c}">${t}</span><b style="font-weight:500">${x.name}</b></td><td class="mut">${x.owner || '—'}</td><td class="mut">${x.modified ? fdate(x.modified.slice(0, 10)) : ''}</td></tr>`; })}</tbody></table></div>`
          : html`<div class="empty"><b>La carpeta de Drive está vacía</b>Crea un Google Doc con el botón de arriba.</div>`}`);
    };
    const loadDrive = () => api(`google/drive?folder=${encodeURIComponent(f.drive)}`).then((r) => { drive = r; dErr = null; }).catch((e) => { drive = { files: [] }; dErr = e.message; }).then(() => alive() && paint());
    acts(el, {
      connectDrive: async () => { const v = await ask('Conectar con Google Drive', [{ k: 'drive', l: 'Link de la carpeta de Drive', req: true }], 'Conectar'); if (!v) return; if (!driveOk(v.drive)) return toast('Pega el link de una carpeta de Drive (drive.google.com/drive/folders/…)', true); try { const r = await F.save({ ...f, drive: v.drive }); Object.assign(f, r); drive = null; paint(); loadDrive(); } catch (e) { toast(e.message, true); } },
      editFolder: async () => { const r = await newFolder(f); if (r) { Object.assign(f, r); drive = null; paint(); if (f.drive) loadDrive(); } },
      newDocHere: () => newDoc(id),
      recHere: () => record(id),
      doc: (t) => { location.hash = `/library/${id}/${t.dataset.id}`; },
      gnew: async () => { const v = await ask('Nuevo archivo en Drive', [{ k: 'name', l: 'Nombre', req: true }, { k: 'type', l: 'Tipo', t: 'select', opts: [['doc', 'Google Doc'], ['sheet', 'Google Sheet'], ['slides', 'Google Slides'], ['folder', 'Carpeta']] }], 'Crear'); if (!v) return;
        try { const r = await api('google/drive', { method: 'POST', body: { ...v, folder: f.drive } }); toast('Creado en tu Drive'); if (r.link) window.open(r.link, '_blank', 'noopener'); drive = null; paint(); loadDrive(); } catch (e) { toast(e.message, true); } },
      dfile: (t) => { const x = drive.files.find((y) => y.id === t.dataset.id); const em = /folder/.test(x.mime) ? null : `https://drive.google.com/file/d/${x.id}/preview`;
        drawer(html`<div class="row"><span class="ftype" style="background:${MIME(x.mime)[1]}">${MIME(x.mime)[0]}</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div><h2>${x.name}</h2><div class="mut">${x.owner || ''}${x.modified ? ' · ' + fdate(x.modified.slice(0, 10)) : ''}</div>
          ${em ? html`<iframe src="${em}" style="width:100%;height:58vh;border:0;border-radius:18px;margin-top:16px;background:#fdfaf3" loading="lazy"></iframe>` : ''}
          <a class="btn" href="${x.link}" target="_blank" rel="noopener noreferrer" style="margin-top:16px;text-decoration:none;display:inline-flex">Abrir en Drive ↗</a>`); },
    });
    paint();
    if (f.drive) loadDrive();
  }

  // Vista previa: un diagrama se dibuja entero; lo demás es Markdown (que también dibuja bloques mermaid).
  function prev(kind, body) { return kind === 'Diagrama' ? diagram(body) : kind === 'Entrevista' ? interview(body, {}, false).view : md(body); }

  // Entrevista: en los temas numerados («## 1 · Tema») cada pregunta («1. …») lleva su caja de respuesta, que se guarda sola en el documento.
  // «   > Lo ideal: …» debajo de la pregunta es la guía para quien entrevista: hacia dónde guiarlo y con qué servicio.
  function interview(body, answers = {}, live = true) {
    const out = []; let buf = [], sec = 0, cur = null, total = 0, done = 0;
    const flushMd = () => { if (buf.length) { out.push(md(buf.join('\n'))); buf = []; } };
    const flushQ = () => { if (!cur) return; const a = answers[cur.k] || ''; total++; if (a.trim()) done++;
      out.push(html`<div class="iq"><div class="iq-q"><span class="iq-n">${cur.n}</span><div>${raw(inline(cur.q))}</div></div>
        <textarea class="in iq-a" data-k="${cur.k}" rows="2" placeholder="${live ? 'Su respuesta…' : 'Aquí va la respuesta'}" ${live ? '' : raw('disabled')}>${a}</textarea>
        ${cur.ideal.length ? html`<div class="iq-ideal"><span>Lo ideal</span>${raw(cur.ideal.map(inline).join('<br>'))}</div>` : ''}</div>`); cur = null; };
    for (const line of String(body).split('\n')) {
      let m;
      if (cur && (m = /^\s+>\s*(?:\*\*)?lo ideal:?(?:\*\*)?:?\s*(.*)/i.exec(line))) { cur.ideal.push(m[1]); continue; }
      if (cur && /^\s+>\s?/.test(line)) { cur.ideal.push(line.replace(/^\s+>\s?/, '')); continue; }
      if (sec && (m = /^(\d+)[.)]\s+(.*)/.exec(line))) { flushQ(); flushMd(); cur = { n: m[1], q: m[2], k: `${sec}.${m[1]}`, ideal: [] }; continue; }
      if (cur && !line.trim()) continue;
      flushQ();
      if ((m = /^##\s+(?:(\d+)\s*·)?/.exec(line))) sec = m[1] || 0; // solo los temas numerados («## 1 · Tema») llevan preguntas
      buf.push(line);
    }
    flushQ(); flushMd();
    return { view: html`<div class="iview">${out}</div>`, total, done };
  }

  // ---------- Documento: leer y editar ----------
  async function docPage(id) {
    let d = docs.find((x) => x.id === id);
    if (!d) return mount(el, html`<a class="btn ghost" href="#/library">← Library</a><div class="empty" style="margin-top:16px"><b>Ese documento no existe</b></div>`);
    let editing = sub[2] === 'edit';
    const back = d.folder_id ? `#/library/${d.folder_id}` : '#/library';
    const paint = () => {
      const em = embedUrl(d.url);
      mount(el, html`<div class="row" style="margin-bottom:14px;gap:8px"><a class="btn ghost" href="${back}">← ${folders.find((f) => f.id === d.folder_id)?.name || 'Library'}</a><div class="sp"></div>
          ${editing ? html`<button class="btn ghost" data-act="cancel">Cancelar</button><button class="btn" data-act="save">Guardar</button>` : html`<button class="btn ghost" data-act="del">${ico('trash')}</button><button class="btn" data-act="edit">Editar</button>`}</div>
        <div class="card" style="padding:34px;max-width:980px;margin:0 auto">
          ${editing ? html`<div class="row" style="gap:10px;flex-wrap:wrap"><select class="in" id="dkind" style="width:auto">${KINDS.map((k) => html`<option ${k === d.kind ? raw('selected') : ''}>${k}</option>`)}</select><span class="mut sm" style="margin-left:6px">Perfil:</span>${WORK_ROLES.map(([k, l]) => html`<label class="chip" style="cursor:pointer;padding:6px 10px"><input type="checkbox" class="drole" value="${k}" ${(d.roles || []).includes(k) ? raw('checked') : ''} style="margin-right:4px">${l.split(' · ')[0]}</label>`)}<select class="in" id="dfolder" style="width:auto"><option value="">— Sin carpeta</option>${folders.map((f) => html`<option value="${f.id}" ${f.id === d.folder_id ? raw('selected') : ''}>${f.name}</option>`)}</select></div>
              <input class="in" id="dtitle" value="${d.title}" style="font-size:34px;font-weight:500;letter-spacing:-1px;border:0;padding:10px 0;background:transparent;margin-top:8px">
              <input class="in" id="durl" value="${d.url || ''}" placeholder="Video o link (YouTube, Loom, Vimeo, Drive) — opcional" style="margin-bottom:12px">
              <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">${d.kind === 'Diagrama' ? html`<span class="mut sm">Empieza con:</span>${Object.entries(DGN).map(([k, l]) => html`<button class="chip" data-act="dgm" data-k="${k}" style="padding:7px 12px">${l}</button>`)}` : html`<button class="chip" data-act="fmt" style="padding:7px 12px">↺ Insertar el formato de ${d.kind || 'Nota'}</button>`}</div>
              <div class="grid g11" style="gap:14px"><textarea class="in" id="dbody" style="min-height:58vh;font-family:ui-monospace,Menlo,monospace;font-size:13.5px;line-height:1.6" placeholder="# Título&#10;&#10;1. Primer paso&#10;2. Segundo paso&#10;&#10;> Nota importante">${d.body || ''}</textarea><div class="card glass" id="dprev" style="min-height:58vh;overflow:auto">${prev(d.kind, d.body || '')}</div></div>
              <div class="mut sm" style="margin-top:8px">${d.kind === 'Diagrama' ? html`Escribe el diagrama en <a href="https://mermaid.js.org/intro/" target="_blank" rel="noopener noreferrer" style="color:inherit">Mermaid</a>: cada línea es una caja o una flecha (<code>A --> B</code>). La vista previa se actualiza sola.` : d.kind === 'Entrevista' ? 'Los temas van numerados (## 1 · Tema). Dentro, cada pregunta numerada (1. …) lleva su caja de respuesta. Debajo, con sangría, «   > Lo ideal: …» es la guía para quien entrevista.' : 'Escribe en Markdown: # títulos, - listas, - [ ] checklist, **negritas**, > notas, [links](https://…). Para un diagrama dentro del texto usa un bloque ```mermaid. La vista previa se actualiza sola.'}</div>`
            : html`<div class="row"><span class="chip" style="background:${KCOL[d.kind] || '#9f846d'};color:#fdfaf3">${d.kind || 'Doc'}</span><div class="sp"></div><span class="mut sm">${d._meta?.updated_at ? 'Actualizado ' + fdate(String(d._meta?.updated_at).slice(0, 10)) : ''}${d._meta?.updated_by ? ' · ' + d._meta?.updated_by : ''}</span></div>
              <h1 style="font-size:42px;font-weight:500;letter-spacing:-1.3px;margin:14px 0 18px">${d.title}</h1>
              ${em ? html`<iframe src="${em}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:20px;margin-bottom:22px;background:#1a120c" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>` : d.url ? html`<a class="artifact" href="${d.url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;margin-bottom:18px"><span class="fi">↗</span><div><b style="font-weight:500">Abrir link</b></div></a>` : ''}
              ${d.kind === 'Prompt' ? html`<div class="row" style="gap:8px;margin-bottom:10px"><span class="chip">${d.client ? d.client.toUpperCase() : 'General'}</span><span class="chip">${d.vtype || 'Video'}</span><div class="sp"></div><button class="btn ghost" data-act="copyPrompt">Copiar prompt</button>${canClaude ? html`<button class="btn" data-act="claudePrompt">${ICON.sparkle} Abrir en Claude</button>` : ''}</div><pre class="repo-pre" id="ptext">${d.body || ''}</pre>`
                : !d.body ? html`<div class="empty"><b>Documento vacío</b>Dale «Editar» para escribirlo.</div>` : d.kind === 'Diagrama' ? diagram(d.body)
                : d.kind === 'Entrevista' ? (() => { const iv = interview(d.body, d.answers || {}); return html`<div class="iq-bar"><span id="iqcount">${iv.done} de ${iv.total} respondidas</span><span id="iqsave" class="mut"></span></div>${iv.view}`; })() : md(d.body)}`}
        </div>`);
      const ta = $('#dbody', el); if (ta) { let t0; ta.oninput = () => { clearTimeout(t0); t0 = setTimeout(() => mount($('#dprev', el), prev(curKind(), ta.value)), d.kind === 'Diagrama' ? 400 : 120); }; }
      const ks = $('#dkind', el); if (ks) ks.onchange = () => { d = { ...d, kind: ks.value, body: ta.value }; paint(); };
      if (!editing && d.kind === 'Entrevista') wireAnswers();
    };
    // Las respuestas se guardan solas: un rato después de escribir, o al salir de la caja.
    let pend = {}, tSave = null, chain = Promise.resolve();
    const fit = (t) => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 2 + 'px'; };
    const stat = (s, bad) => { const x = $('#iqsave', el); if (x) { x.textContent = s; x.style.color = bad ? '#b4532a' : ''; } };
    const count = () => { const all = [...el.querySelectorAll('.iq-a')]; const c = $('#iqcount', el); if (c) c.textContent = `${all.filter((t) => t.value.trim()).length} de ${all.length} respondidas`; };
    const put = (add) => D.save({ ...d, answers: { ...(d.answers || {}), ...add } });
    const flush = () => { clearTimeout(tSave); chain = chain.then(async () => {
      const add = pend; pend = {}; if (!Object.keys(add).length) return; stat('Guardando…');
      try { try { d = await put(add); } catch { d = await D.get(d.id); d = await put(add); } // si alguien más guardó, se toma su versión y se suma la respuesta
        docs = docs.map((x) => (x.id === d.id ? d : x)); stat('Guardado'); }
      catch (e) { pend = { ...add, ...pend }; stat('No se guardó: revisa tu conexión', true); }
    }); return chain; };
    function wireAnswers() {
      el.querySelectorAll('.iq-a').forEach((t) => { fit(t);
        t.oninput = () => { fit(t); pend[t.dataset.k] = t.value; count(); stat('Sin guardar'); clearTimeout(tSave); tSave = setTimeout(flush, 800); };
        t.onblur = () => { if (Object.keys(pend).length) flush(); };
      });
    }
    addEventListener('hashchange', () => { if (Object.keys(pend).length) flush(); }, { once: true });
    const curKind = () => $('#dkind', el)?.value || d.kind;
    acts(el, {
      dgm: async (t) => { const ta = $('#dbody', el); if (ta.value.trim() && !(await confirmAsk('¿Reemplazar el diagrama por la plantilla?'))) return; ta.value = DGM[t.dataset.k]; ta.oninput(); },
      fmt: async () => { const ta = $('#dbody', el); const k = curKind(); if (ta.value.trim() && !(await confirmAsk(`¿Reemplazar el texto por el formato de ${k}?`))) return; ta.value = (TPL[k] || TPL.Nota)($('#dtitle', el).value || d.title); ta.oninput(); },
      claudePrompt: () => openClaude(d.body || ''),
      copyPrompt: async () => { try { await navigator.clipboard.writeText(d.body || ''); toast('Prompt copiado'); } catch { toast('No pude copiar: selecciona el texto', true); } },
      edit: async () => { await flush(); editing = true; history.replaceState(null, '', `#/library/${d.folder_id || '_'}/${d.id}/edit`); paint(); },
      cancel: () => { editing = false; history.replaceState(null, '', `#/library/${d.folder_id || '_'}/${d.id}`); paint(); },
      save: async () => {
        const url = $('#durl', el).value.trim(); if (url && !/^https:\/\//.test(url)) return toast('El link debe empezar con https://', true);
        try { d = await D.save({ ...d, title: $('#dtitle', el).value.trim() || d.title, kind: $('#dkind', el).value, folder_id: $('#dfolder', el).value, url, body: $('#dbody', el).value, roles: [...el.querySelectorAll('.drole:checked')].map((x) => x.value) }); editing = false; history.replaceState(null, '', `#/library/${d.folder_id || '_'}/${d.id}`); toast('Guardado'); paint(); }
        catch (e) { toast(e.message, true); }
      },
      del: async () => { if (!(await confirmAsk(`¿Eliminar «${d.title}»?`))) return; await D.remove(d.id); location.hash = back.slice(1); },
    });
    paint();
  }

  // (acciones de la pantalla de inicio)
  function homeActs() {
    acts(el, {
      newFolder: async () => { if (await newFolder(null)) home(); },
      // Temporal: carga el folder de Cerantola con sus dos entrevistas. Se quita después de usarlo.
      seedCerantola: async (t) => {
        t.disabled = true;
        // Si el folder ya existe, agrega las entrevistas que falten y actualiza las de una versión anterior.
        try { const { CERANTOLA } = await import('./library-cerantola.js');
          let f = folders.find((x) => x.name === CERANTOLA.folder.name); if (!f) { f = await F.create(CERANTOLA.folder); folders = [...folders, f]; }
          const kept = [];
          for (const d of CERANTOLA.docs) { const old = docs.find((x) => x.folder_id === f.id && x.title.slice(0, 12) === d.title.slice(0, 12));
            if (!old) docs = [...docs, await D.create({ ...d, seed: CERANTOLA.seed, url: '', roles: [], folder_id: f.id })];
            else if ((old.seed || 0) < CERANTOLA.seed) {
              // Si ya tiene respuestas no se toca: cambiar las preguntas las descuadraría.
              if (Object.values(old.answers || {}).some((a) => String(a).trim())) { kept.push(old.title); continue; }
              const r = await D.save({ ...old, title: d.title, kind: d.kind, body: d.body, seed: CERANTOLA.seed }); docs = docs.map((x) => (x.id === r.id ? r : x)); } }
          if (kept.length) toast(`No cambié «${kept.join('», «')}» porque ya tiene respuestas`, true);
          if (!kept.length) toast('Folder de Cerantola listo'); location.hash = `/library/${f.id}`; } catch (e) { t.disabled = false; toast(e.message, true); }
      },
      newDoc: () => newDoc(''),
      rec: () => record(''),
      folder: (t) => { location.hash = `/library/${t.dataset.id}`; },
      doc: (t) => { const d = docs.find((x) => x.id === t.dataset.id); location.hash = `/library/${d.folder_id || '_'}/${d.id}`; },
    });
  }

  if (did) return docPage(did);
  if (fid) return folderPage(fid);
  homeActs();
  home();
}
