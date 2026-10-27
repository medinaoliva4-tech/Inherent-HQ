// AI Harness (#/ai): la «inteligencia compartida» del OS (plan §3.1 y Fase 4). Una sola inteligencia para todas las herramientas:
// la portada abre el Chat o una herramienta con el cliente del contexto, y las páginas Agents · Skills · Workflows · Memory · Models ·
// Evaluations enseñan, de SOLO LECTURA y con lo que ya existe, cómo trabaja, de dónde sabe lo que sabe y con qué reglas se mide.
// Sin backend nuevo, sin leer `audit` ni agents/ desde Vercel (los 12 agentes son una lista fija: harness/agentes.js) y sin
// ningún monto: quien no es CEO no ve costos porque aquí no hay costos. Lo que no se pudo leer dice «⚠️ SIN DATOS» y de dónde sale.
import { html, raw, mount, acts, ico, skel, api, col, esc, toast, fdate, $, $$ } from '../core.js';
import { WORKSPACES, HERRAMIENTAS, FLUJO, rutaHerramienta, puedeWs, herramientaDe, pestanaDe, cadena, veEstrategia } from '../herramientas.js';
import { cargarContexto, contextoLista, contextoActual } from '../contexto.js';
import { abrirEnChat } from '../areas.js';
import { MODOS, HARNESS, REGLAS_COMUNES, PROTOCOLO, TERMINAL, ESFUERZOS, alcanceConsulting, textoAlcanceConsulting } from '../llm/modos.js';
import { IAS, LOCALES, iasListas, modelosDeIa, fuertesDe } from '../llm/ias.js';
import { hermesDe, saludHermes, modelosHermes, skillsHermes, nombreProveedor } from '../hermes.js';
import { saludPuente } from '../puente-chat.js';
import { MOTORES, CLAUDE_MODELOS, motorDe, nombreMotor } from '../motor-ui.js';
import { caminoIA } from '../ia-herramienta.js';
import { recipesWith, repeatText, WHO } from '../recipes.js';
import { ETAPAS } from '../estrategia.js';
import { LEVELS } from '../levels.js';
import { TIPO_LABEL, ENGINE_LABEL, umbralTexto, frase } from '../laya.js';
import { AGENTES } from '../harness/agentes.js';

export const esqueleto = () => skel('pagina');

// Las páginas del Harness: [id, nombre, ícono, qué enseña].
const PAGINAS = [
  ['agents', 'Agents', 'sparkles', 'Los modos del Chat (rol, cómo trabaja, herramientas y criterios) y los 12 agentes del repo.'],
  ['skills', 'Skills', 'puzzle', 'Las skills de Hermes en tu compu y las fuentes de hormozi-brain que lee Strategy.'],
  ['workflows', 'Workflows', 'git-branch', 'Las recetas, el flujo lead → proyecto, la secuencia de Diseño y las cadenas de herramientas.'],
  ['memory', 'Memory', 'layers', 'Lo que la IA sabe: Organization, Client, Project y el historial de ejecución. Solo lo que tu perfil ve.'],
  ['models', 'Models', 'zap', 'Qué IAs y modelos tiene lista tu compu, cuánto piensan y qué camino usaría hoy la IA para ti.'],
  ['evals', 'Evaluations', 'badge-check', 'Las puertas y juicios de Laya, los criterios de cada entregable y las reglas con que se mide lo que entrega la IA.'],
];
const paginaDe = (id) => PAGINAS.find((p) => p[0] === id) || null;
const ACTUAL = raw('aria-current="page"'); // constante segura: la pestaña abierta
const enc = encodeURIComponent;

// ---------- Lectura segura: nada de esto rompe la página ----------
const leer = async (ruta) => { try { return { ok: true, v: await api(ruta) }; } catch (e) { return { ok: false, status: e.status || 0, msg: e.message || '' }; } };
const lote = async (m) => Object.fromEntries(await Promise.all(Object.entries(m).map(async ([k, r]) => [k, await leer(r)])));
const SIN = (de) => html`<span class="mut sm">⚠️ SIN DATOS · ${de}</span>`;
const aviso = (r, de) => (r?.status === 403 ? html`<span class="mut sm">Tu perfil no ve esto.</span>` : SIN(de));
const corto = (s, n = 140) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const pl = (n, uno, otros) => `${n} ${n === 1 ? uno : otros}`;
const modeloCorto = (m) => String(m || '').split('/').pop().slice(0, 32);
const colorModo = (id) => WORKSPACES.find((w) => w.modo === id)?.color || '--ui-m-organizacion';
const nombreModo = (id) => MODOS.find((m) => m.id === id)?.nombre || id;

// Piezas de pantalla
const seccion = (titulo, sub, cuerpo) => html`<div class="hy-bh ai-sec"><h2>${titulo}</h2>${sub ? html`<span>${sub}</span>` : ''}</div>${cuerpo}`;
const kv = (filas) => html`<dl class="ai-kv">${filas.map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl>`;
const cmd = (c) => html`<div class="ai-cmd"><code>${c}</code><button type="button" class="btn ghost xs" data-act="copiar" data-t="${c}">Copiar</button></div>`;
const punto = (estado) => html`<span class="ai-dot ${estado}" aria-hidden="true"></span>`;
const chips = (xs) => html`<div class="ai-chips">${xs.map((x) => html`<span class="chip sm2">${x}</span>`)}</div>`;

export async function render(el, { me, sub = [], alive }) {
  await cargarContexto(me).catch(() => []);
  if (!alive()) return;
  let pagina = String(sub[0] || '');
  // Página desconocida → #/ai (se canoniza la ruta y se pinta la portada).
  if (pagina && !paginaDe(pagina)) { pagina = ''; try { history.replaceState(null, '', '#/ai'); } catch {} }

  const slug = () => contextoActual(me) || '';
  const nombre = (s) => (s ? contextoLista().find((c) => c.slug === s)?.name || s : '');
  const puede = (ws) => puedeWs(me, ws);
  const wsNombre = (id) => WORKSPACES.find((w) => w.id === id)?.nombre || id;
  // Las reglas que nombran los costos de Inherent solo las ve el CEO (el resto del Harness no lleva ningún monto).
  const verRegla = (l) => me.role === 'ceo' || !/06-ECONOMIA|costos y márgenes/i.test(String(l));
  const lineas = (xs) => (Array.isArray(xs) ? xs : []).filter((l) => verRegla(l) && !/^(```|\{)/.test(String(l)));
  // A una herramienta con el cliente del contexto; sin contexto, al workspace (app.js completa con el selector).
  const irA = (h) => (slug() ? rutaHerramienta(h.ws, slug(), h.id) : `#/ws/${h.ws}`);
  let gen = 0;

  const cabecera = () => {
    const p = paginaDe(pagina);
    return html`<div class="ai-hero sp-hero"><span class="lbl">AI Harness</span><h1>${p ? p[1] : 'Una sola inteligencia para todas las herramientas'}</h1>
      <p>${p ? p[3] : 'Lo que la IA sabe de Inherent y de cada cliente, cómo trabaja cada modo y con qué reglas se mide lo que entrega. Lo mismo en el Chat y en cada workspace.'}</p></div>
      <nav class="ai-tabs" aria-label="Páginas del Harness"><a href="#/ai" ${!pagina ? ACTUAL : ''}>Overview</a>${PAGINAS.map(([id, n, ic]) => html`<a href="#/ai/${id}" ${pagina === id ? ACTUAL : ''}>${ico(ic, 14)} ${n}</a>`)}</nav>`;
  };

  // ---------- Overview ----------
  function portada() {
    const s = slug(), n = nombre(s);
    const listas = HERRAMIENTAS.filter((h) => h.estado !== 'pronto' && puede(h.ws));
    const porWs = WORKSPACES.filter((w) => puede(w.id)).map((w) => [w, listas.filter((h) => h.ws === w.id)]).filter(([, l]) => l.length);
    const quien = n ? html`con <em>${n}</em>` : html`<span class="mut">sin cliente: elige uno en la barra</span>`;
    return html`<section class="ai-quick" aria-label="Acciones rápidas">
      <button type="button" class="ai-card" data-act="research"><span class="ai-card-ic">${ico('radar', 20)}</span><b>Deep Research</b><span class="mut sm">Investiga a fondo ${quien} en el Chat, modo Estrategia.</span><span class="ai-card-go">↗</span></button>
      <details class="ai-card ai-menu"><summary><span class="ai-card-ic">${ico('layers', 20)}</span><b>Create Deliverable</b><span class="mut sm">Elige la herramienta y ábrela ${n ? html`con <em>${n}</em>` : 'en su workspace'}.</span><span class="ai-card-go">${ico('down', 14)}</span></summary>
        <div class="ai-menu-list">${porWs.length ? porWs.map(([w, l]) => html`<div class="ai-menu-grp"><span class="lbl" style="--ac:var(${w.color})">${w.nombre}</span>${l.map((h) => html`<a class="ai-menu-it" href="${irA(h)}">${ico(h.icono || 'doc', 14)}<span class="grow">${h.nombre}<small class="mut">${h.produce || ''}</small></span><span class="chip sm2">${h.estado === 'lista' ? 'Lista' : 'Parcial'}</span></a>`)}</div>`) : html`<div class="mut sm" style="padding:8px 0">Tu perfil no abre ningún workspace todavía.</div>`}</div></details>
      <a class="ai-card" href="#/ai/workflows"><span class="ai-card-ic">${ico('git-branch', 20)}</span><b>Run Workflow</b><span class="mut sm">Las recetas y las cadenas de herramientas sobre el flujo compartido.</span><span class="ai-card-go">↗</span></a>
      ${puede('marketing') ? html`<a class="ai-card" href="${s ? rutaHerramienta('marketing', s, 'marketing-performance-center') : '#/ws/marketing'}"><span class="ai-card-ic">${ico('trending-up', 20)}</span><b>Analyze Performance</b><span class="mut sm">El Performance Center ${quien}.</span><span class="ai-card-go">↗</span></a>`
        : html`<div class="ai-card off"><span class="ai-card-ic">${ico('trending-up', 20)}</span><b>Analyze Performance</b><span class="mut sm">El Performance Center de Marketing. Tu perfil no abre Marketing: lo decide el CEO en Vistas por rol.</span></div>`}
    </section>
    <div class="hy-bh" style="margin-top:28px"><h2>Memory &amp; Context</h2><span>De dónde saca la IA lo que sabe · <a href="#/ai/memory">verlo completo</a></span></div>
    <section class="ai-memoria">
      <div class="ai-mem"><span class="ai-mem-ic">${ico('building-2', 18)}</span><b>Organization</b><span class="mut sm">Lo de Inherent: los SOPs y playbooks de la Library y la visión y misión.</span><div class="ai-mem-links"><a href="#/org/library">Library</a><a href="#/org/vision">Visión</a></div></div>
      <div class="ai-mem"><span class="ai-mem-ic">${ico('briefcase', 18)}</span><b>Client</b>${n ? html`<span class="mut sm">El contexto de ahora: <em>${n}</em>. Su ficha, estrategia, avatares, marca y contenido.</span><div class="ai-mem-links">${puede('strategy') ? html`<a href="#/ws/strategy/${s}/overview">Strategy</a>` : ''}${puede('marketing') ? html`<a href="#/ws/marketing/${s}/overview">Marketing</a>` : ''}</div>`
        : html`<span class="mut sm">Sin cliente en el contexto. Elige uno en la barra y la IA trabaja con su ficha, estrategia y marca.</span><div class="ai-mem-links">${puede('strategy') ? html`<a href="#/ws/strategy">Strategy</a>` : ''}${puede('marketing') ? html`<a href="#/ws/marketing">Marketing</a>` : ''}</div>`}</div>
      <div class="ai-mem"><span class="ai-mem-ic">${ico('kanban', 18)}</span><b>Project</b><span class="mut sm">Los proyectos y sus tareas: qué está en curso, qué venció y quién lo lleva.</span><div class="ai-mem-links"><a href="#/org/operations">Proyectos</a><a href="#/org/work">Mis tareas</a></div></div>
      <div class="ai-mem"><span class="ai-mem-ic">${ico('clock', 18)}</span><b>Execution history</b><span class="mut sm">Lo que ya se hizo: tareas cerradas, juicios de Laya y el historial de cada entregable.</span><div class="ai-mem-links"><a href="#/ai/memory">Memory</a><a href="#/ai/evals">Evaluations</a></div></div>
    </section>`;
  }

  // ---------- Agents ----------
  function agentes() {
    const s = slug(), n = nombre(s);
    const modos = MODOS.map((m) => {
      const h = HARNESS[m.id] || {};
      return html`<article class="ai-agente" style="--ac:var(${colorModo(m.id)})"><div class="ai-agente-h"><span class="ai-card-ic">${ico(m.icono, 18)}</span><div><b>${m.nombre}</b><span class="mut sm">${m.depto || ''}</span></div></div>
        <p class="sm">${h.rol || m.sub}</p>
        <details class="ai-det"><summary>Cómo trabaja este modo</summary><ul>${lineas(h.como).map((l) => html`<li>${l}</li>`)}</ul></details>
        <details class="ai-det"><summary>Herramientas que usa</summary><p>${h.herramientas || '—'}</p></details>
        <details class="ai-det"><summary>Qué tiene que cumplir lo que entrega</summary><ul>${lineas(h.criterios).map((l) => html`<li>${l}</li>`)}</ul></details>
        <div class="ai-agente-f"><span class="mut sm">${m.pide === 'cliente' ? 'Pide un cliente' : m.pide === 'marca' ? 'Pide una marca' : 'Sin cliente'} · ${pl(lineas(h.como).length, 'regla', 'reglas')}</span><button type="button" class="btn ghost xs" data-act="modo" data-modo="${m.id}">Abrir en el Chat</button></div></article>`;
    });
    const repo = AGENTES.map((a) => html`<article class="ai-agente" style="--ac:var(${a.modo ? colorModo(a.modo) : '--ui-m-organizacion'})"><div class="ai-agente-h"><span class="ai-num">${a.n}</span><div><b>${a.nombre}</b><span class="mut sm">${a.depto}</span></div></div>
        <p class="sm">${a.hace}</p>
        <div class="ai-agente-f"><span class="mut sm">${a.ventana}</span>${a.modo ? html`<button type="button" class="btn ghost xs" data-act="modo" data-modo="${a.modo}">Modo ${nombreModo(a.modo)}</button>` : html`<span class="chip sm2">Sin modo propio</span>`}</div>
        <code class="ai-ruta">${a.carpeta}</code></article>`);
    return { cuerpo: html`${seccion('Los modos del Chat', html`Cada uno es un agente con su rol y sus reglas · se abre ${n ? html`con <em>${n}</em>` : 'con el cliente del contexto'}`, html`<section class="ai-agentes">${modos}</section>`)}
      ${seccion('Los 12 agentes del repo', 'El pipeline de agents/, un agente por etapa · lista fija: el OS no lee esa carpeta desde Vercel', html`<section class="ai-agentes">${repo}</section>`)}` };
  }

  // ---------- Skills ----------
  function skills() {
    const h = hermesDe(me);
    const pasos = TERMINAL.filter(([n]) => /^(Instalar|Actualizar|Ver las skills|Revisar)/.test(n));
    const apagado = html`<p class="mut">Hermes no está conectado en esta compu. Con él, la IA usa las skills del repo y las suyas desde el Chat. Para encenderlo, en la Terminal:</p>${pasos.map(([n, c]) => html`<div class="ai-paso"><span class="mut sm">${n}</span>${cmd(c)}</div>`)}`;
    const fuentes = veEstrategia(me);
    const libros = [['$100M Offers', '100m-offers'], ['$100M Leads', '100m-leads'], ['$100M Money Models', '100m-money-models'], ['$100M Lost Chapters', '100m-lost-chapters']];
    const fila = (titulo, ruta, nota) => html`<li class="ai-fuente"><div class="ai-fuente-h"><b>${titulo}</b><span class="mut sm">${nota || ruta}</span>${fuentes ? html`<button type="button" class="btn ghost xs" data-act="fuente" data-ruta="${ruta}">Ver pasaje</button>` : ''}</div><pre class="ai-pasaje" hidden></pre></li>`;
    return {
      cuerpo: html`${seccion('Skills de Hermes', 'Las que tiene esta compu · el Chat las usa con «/skill»', html`<section class="card ai-panel" id="ai-hermes">${h ? html`<p class="mut sm">Revisando Hermes…</p>` : apagado}</section>`)}
      ${seccion('Fuentes de hormozi-brain', 'Lo que lee Strategy: texto literal con cita exacta, nunca de memoria', html`<section class="card ai-panel">
        ${fuentes ? '' : html`<p class="mut sm">Solo quien ve Strategy lee las fuentes; aquí se muestra el índice.</p>`}
        <div class="lbl">Libros</div><ul class="ai-fuentes">${libros.map(([t, c]) => html`<li class="ai-fuente"><div class="ai-fuente-h"><b>${t}</b><span class="mut sm">references/books/${c}/ · un archivo por capítulo</span></div></li>`)}</ul>
        <div class="lbl">$100M Scaling Roadmap · las 10 etapas</div><ul class="ai-fuentes">${fila('Las 10 etapas', 'roadmap/overview-las-10-etapas.md', 'Resumen del roadmap')}${ETAPAS.map((e) => fila(`Etapa ${e.n} · ${e.nombre}`, e.video, `${e.rol} · se traba en: ${e.traba}`))}</ul>
        <div class="lbl">Briefs por área</div><ul class="ai-fuentes">${[['Branding', 'branding'], ['Creative', 'creative'], ['Marketing', 'marketing']].map(([t, c]) => fila(`Brief de ${t}`, `briefs/${c}.md`))}</ul>
        <div class="lbl">5 Scaling Frameworks (SOPs)</div><ul class="ai-fuentes"><li class="ai-fuente"><div class="ai-fuente-h"><b>Scaling Frameworks</b><span class="mut sm">references/sops/5-scaling-frameworks/ · un archivo por framework</span></div></li></ul>
      </section>`)}`,
      despues: h ? async () => {
        const g = gen, box = () => (alive() && g === gen ? $('#ai-hermes', el) : null);
        const sh = await saludHermes(me).catch(() => ({ on: false }));
        if (!box()) return;
        if (!sh.on) return mount(box(), html`<p class="mut">${punto('off')} Hermes no responde en esta compu. Abre la app de Hermes o, en la Terminal:</p>${pasos.slice(0, 2).map(([n, c]) => html`<div class="ai-paso"><span class="mut sm">${n}</span>${cmd(c)}</div>`)}`);
        if (!sh.auth) return mount(box(), html`<p class="mut">${punto('warn')} Hermes está encendido pero la llave del OS no sirve. Pégala de nuevo en el Chat (Hermes › conectar). Para verla, en la Terminal:</p>${cmd(TERMINAL.find(([n]) => /llave/.test(n))?.[1] || '')}`);
        const xs = await skillsHermes(me).catch(() => null);
        if (!box()) return;
        mount(box(), xs ? html`<p class="sm">${punto('ok')} Hermes ${sh.version ? `v${sh.version} ` : ''}encendido · <b>${xs.length}</b> ${xs.length === 1 ? 'skill' : 'skills'}</p>${xs.length ? html`<ul class="ai-skills">${xs.map((x) => html`<li><b>${x.name}</b><span class="mut sm">${corto(x.description, 160)}</span></li>`)}</ul>` : html`<p class="mut sm">Hermes no devolvió skills. Revisa con <code>inherent skills list</code>.</p>`}` : html`<p class="mut">${punto('warn')} Hermes está encendido pero no pude leer sus skills. ${SIN('GET /v1/skills de Hermes')}</p>`);
      } : null,
    };
  }

  // ---------- Workflows ----------
  const PASOS_FLUJO = [['Lead', 'Entra por la entrada pública, el quiz o a mano.'], ['Cotización enviada', 'Con servicios del catálogo o un paquete.'], ['Aprobada', 'Se crea la tarea de cobro.'], ['Pago subido', 'El cliente sube su comprobante.'], ['Pago confirmado', 'Alguien de Finanzas lo confirma.'], ['Cliente y proyecto', 'Ingreso en Finance, lead ganado, cliente y proyecto con responsables, fechas y dependencias.']];
  // La secuencia de Diseño: una pieza del plan no queda diseñada sin su idea; la pieza suelta es la única que entra directo (HARNESS.diseno).
  const SEC_DISENO = [['Estrategia aprobada', null, 'strategy'], ['Plan del mes', 'content-strategy-studio'], ['Brief del ciclo', null, 'creative'], ['Ideas', 'creative-direction-lab'], ['Formato que ya funcionó', 'creative-direction-lab', 'formatos'], ['Pieza', 'design-studio'], ['Validar contra la guía', 'brand-consistency-checker'], ['Revisión y OK', 'review-approval-studio']];

  async function workflows() {
    const s = slug();
    const r = await leer('db/recipes');
    const R = recipesWith(r.ok ? r.v.items || [] : []);
    const receta = (x) => {
      const tareas = x.tasks || [], reuniones = x.meetings || [];
      return html`<details class="ai-det ai-receta"><summary><b>${x.name}</b><span class="chip sm2">${x.kind || (x.type === 'interna' ? 'Interna' : x.type)}</span>${x.own ? html`<span class="chip sm2">Del CEO</span>` : x.edited ? html`<span class="chip sm2">Editada</span>` : ''}${x.active === false ? html`<span class="chip sm2">Apagada</span>` : ''}<span class="mut sm">${tareas.length} ${tareas.length === 1 ? 'tarea' : 'tareas'} · ${pl(reuniones.length, 'reunión', 'reuniones')}</span></summary>
        ${x.repeat ? html`<p class="mut sm">${repeatText(x.repeat)}</p>` : ''}
        ${tareas.length ? html`<div class="ai-tw"><table class="ai-tabla"><thead><tr><th>Paso</th><th>Tarea</th><th>Día</th><th>Quién</th><th>Depende de</th></tr></thead><tbody>${tareas.map((t) => html`<tr><td>${t.key}</td><td>${t.title}</td><td>${t.day ?? '—'}</td><td>${WHO[t.role] || t.role || '—'}${t.reviewer ? html` <span class="mut sm">· revisa ${WHO[t.reviewer] || t.reviewer}</span>` : ''}</td><td>${(t.after || []).join(' · ') || '—'}</td></tr>`)}</tbody></table></div>` : ''}
        ${reuniones.length ? html`<div class="lbl" style="margin-top:12px">Reuniones</div><ul class="ai-lista">${reuniones.map((m) => html`<li><b>Día ${m.day}</b> · ${m.name} <span class="mut sm">· ${(m.who || []).map((w) => WHO[w] || w).join(', ')}${m.approves ? ` · aprueba: ${m.approves}` : ''}</span></li>`)}</ul>` : ''}</details>`;
    };
    const base = R.filter((x) => x.type !== 'interna'), internas = R.filter((x) => x.type === 'interna');
    return { cuerpo: html`
      ${seccion('Recetas', r.ok ? 'Las de siempre y las que edita el CEO en Administración › Recetas' : 'Las de siempre · las del CEO no se pudieron leer con tu perfil', html`<section class="ai-recetas">${base.map(receta)}${internas.length ? html`<div class="lbl" style="margin-top:14px">Responsabilidades de Inherent</div>${internas.map(receta)}` : ''}</section>${r.ok ? '' : html`<p class="mut sm" style="margin-top:8px">${aviso(r, 'db/recipes')}</p>`}`)}
      ${seccion('Del lead al proyecto', 'El flujo comercial → operativo (api/_lib/flow.js), resumido', html`<ol class="ai-pasos">${PASOS_FLUJO.map(([t, d], i) => html`<li><span class="ai-num">${i + 1}</span><b>${t}</b><span class="mut sm">${d}</span></li>`)}</ol><p class="mut sm">Las tareas del proyecto salen de las recetas de arriba. Todo pasa en el servidor, en <a href="#/org/sales">Sales</a>.</p>`)}
      ${seccion('La secuencia de Diseño', 'Sin estrategia aprobada no hay plan; sin plan no hay ideas · la pieza suelta es la única que entra directo', html`<ol class="ai-pasos">${SEC_DISENO.map(([t, tool, resto], i) => { const h = tool ? herramientaDe(tool) : null; const href = h ? (s ? rutaHerramienta(h.ws, s, h.id, resto ? [resto] : []) : `#/ws/${h.ws}`) : resto ? `#/ws/${resto}` : ''; return html`<li><span class="ai-num">${i + 1}</span>${href ? html`<a href="${href}"><b>${t}</b></a>` : html`<b>${t}</b>`}<span class="mut sm">${h ? `${wsNombre(h.ws)} › ${h.nombre}` : ''}</span></li>`; })}</ol><p class="mut sm">Una pieza con fecha de un mes sin brief del ciclo no entra, salvo que el CEO haya abierto ese mes.</p>`)}
      ${seccion('Cadenas de herramientas', 'De dónde viene y a dónde va cada entregable, sobre los 7 pasos del flujo compartido', cadenas())}` };
  }

  // Las cadenas va_a de herramientas.js: una columna por paso del flujo, una flecha por va_a.
  function cadenas() {
    const W = 150, H = 26, GX = 34, GY = 8, TOP = 34, X0 = 6;
    const cols = FLUJO.map(() => []), orden = WORKSPACES.map((w) => w.id);
    for (const h of HERRAMIENTAS) cols[Math.max(0, FLUJO.findIndex((f) => f.id === pestanaDe(h.ws, h.pestana)?.paso))].push(h);
    for (const c of cols) c.sort((a, b) => orden.indexOf(a.ws) - orden.indexOf(b.ws));
    const pos = new Map();
    cols.forEach((c, i) => c.forEach((h, j) => pos.set(h.id, { x: X0 + i * (W + GX), y: TOP + j * (H + GY) })));
    const alto = TOP + Math.max(...cols.map((c) => c.length)) * (H + GY), ancho = X0 * 2 + FLUJO.length * W + (FLUJO.length - 1) * GX;
    const aristas = HERRAMIENTAS.flatMap((h) => h.va_a.map((t) => [h.id, t])).filter(([a, b]) => pos.has(a) && pos.has(b));
    const curva = ([a, b]) => { const p = pos.get(a), q = pos.get(b), x1 = p.x + W, y1 = p.y + H / 2, x2 = q.x, y2 = q.y + H / 2, dx = Math.max(40, Math.abs(x2 - x1) / 2); return `M${x1} ${y1}C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`; };
    const cabs = FLUJO.map((f, i) => `<text class="ai-col" x="${X0 + i * (W + GX)}" y="16">${esc(f.nombre.toUpperCase())}</text>`).join('');
    const lados = aristas.map(([a, b]) => `<path class="ai-ed" d="${curva([a, b])}" data-de="${esc(a)}" data-a="${esc(b)}"/>`).join('');
    const nodos = HERRAMIENTAS.map((h) => { const p = pos.get(h.id), w = WORKSPACES.find((x) => x.id === h.ws); const et = h.nombre.length > 23 ? h.nombre.slice(0, 22) + '…' : h.nombre;
      return `<a class="ai-nd${h.estado === 'pronto' ? ' pronto' : ''}" href="${esc(irA(h))}" data-id="${esc(h.id)}" style="--ac:var(${w?.color || '--ui-m-organizacion'})"><title>${esc(h.nombre)}${h.produce ? ' · ' + esc(h.produce) : ''}</title><rect x="${p.x}" y="${p.y}" width="${W}" height="${H}" rx="8"/><text x="${p.x + 10}" y="${p.y + H / 2 + 4}">${esc(et)}</text></a>`; }).join('');
    const raices = HERRAMIENTAS.filter((h) => !h.viene_de.length && h.va_a.length);
    return html`<div class="ai-leyenda">${WORKSPACES.map((w) => html`<span><i style="background:var(${w.color})"></i>${w.nombre}</span>`)}<span class="mut sm">Pasa el cursor por una herramienta para ver de dónde viene y a dónde va.</span></div>
      <div class="ai-svgw"><svg class="ai-grafo" viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" role="img" aria-label="Cadenas de herramientas sobre el flujo compartido">${raw(cabs + lados + nodos)}</svg></div>
      <details class="ai-det"><summary>La misma cadena en lista</summary><ul class="ai-lista">${raices.map((h) => html`<li><b>${h.nombre}</b> <span class="mut sm">→ ${cadena(h.id).slice(1).map((id) => herramientaDe(id)?.nombre || id).join(' → ')}</span></li>`)}</ul></details>`;
  }

  // ---------- Memory ----------
  const cacheEnts = new Map();
  // Los entregables del cliente en los workspaces que este perfil abre → [{ ws, items }] (lo que el servidor no deja ver, no sale).
  async function entregablesDe(s) {
    if (!s) return [];
    if (!cacheEnts.has(s)) cacheEnts.set(s, Promise.all(WORKSPACES.filter((w) => puede(w.id)).map(async (w) => { const r = await leer(`entregables?ws=${w.id}&slug=${enc(s)}`); return { ws: w.id, ok: r.ok, items: r.ok ? r.v.items || [] : [] }; })));
    return cacheEnts.get(s);
  }
  const fila = (ic, t, cuerpo) => html`<div class="ai-fila"><span class="ai-fila-ic">${ico(ic, 15)}</span><div><b>${t}</b>${cuerpo}</div></div>`;

  async function memoria() {
    const s = slug(), n = nombre(s);
    const pedidos = { lib: 'estrategia/library', vis: 'db/settings/vision', proy: 'db/projects', tar: 'db/tasks', jui: 'laya/juicios' };
    if (s) Object.assign(pedidos, { est: `estrategia/${enc(s)}`, acc: `db/accounts/acc-${enc(s)}`, repo: `repo/client/${enc(s)}`, avs: `avatares?profile=${enc(s)}`, bb: `db/brand_boards/${enc(s)}`, sis: `repo/client/${enc(s)}/sistema`, cfg: `content/cfg?profile=${enc(s)}` });
    const [d, ents] = await Promise.all([lote(pedidos), entregablesDe(s)]);

    // Organization
    const lib = d.lib.ok ? (d.lib.v.docs || []) : null, v = d.vis.ok ? d.vis.v : null;
    const org = html`${fila('book', 'Library', lib ? html`<span class="sm">${pl(lib.length, 'documento', 'documentos')} de texto (SOPs, playbooks, entrevistas, notas)</span>${lib.length ? html`<ul class="ai-lista">${lib.slice(0, 5).map((x) => html`<li><a href="#/library/${enc(x.folder || '_')}/${enc(x.id)}">${x.titulo}</a> <span class="mut sm">· ${x.tipo}${x.carpeta ? ` · ${x.carpeta}` : ''}</span></li>`)}</ul>` : ''}` : aviso(d.lib, 'estrategia/library'))}
      ${fila('flag', 'Visión y misión', v && (v.vision || v.mision) ? html`${v.vision ? html`<p class="sm"><b>Visión</b> · ${corto(v.vision, 220)}</p>` : ''}${v.mision ? html`<p class="sm"><b>Misión</b> · ${corto(v.mision, 220)}</p>` : ''}` : aviso(d.vis, 'settings › vision (Organization › Visión)'))}`;

    // Client
    const e = d.est.ok ? d.est.v : null, bloques = e?.bloques || [];
    const porEstado = {}; for (const w of ents) for (const x of w.items) porEstado[x.estado || 'Borrador'] = (porEstado[x.estado || 'Borrador'] || 0) + 1;
    const totalEnts = Object.values(porEstado).reduce((a, b) => a + b, 0), items = d.acc.ok ? d.acc.v.onboarding?.items || [] : null;
    const cli = !s ? html`<p class="mut sm">Sin cliente en el contexto. Elige uno en la barra y esta tarjeta se llena con su ficha, estrategia, avatares, marca y entregables.</p>` : html`
      <p class="sm"><b>${n}</b>${e?.nivel ? html` <span class="chip sm2">${e.nivel.nombre}</span>` : ''}${e?.etapa ? html` <span class="chip sm2">Etapa ${e.etapa.n}${e.etapa.confirmada ? '' : ' · sin confirmar'}</span>` : ''}</p>
      ${fila('clipboard', 'Ficha de oferta', d.repo.ok ? (d.repo.v.plan || (d.repo.v.fields || []).length ? html`<span class="sm">${d.repo.v.plan || 'Plan contratado'} · ${pl((d.repo.v.fields || []).length, 'campo', 'campos')} · ${pl((d.repo.v.links || []).length, 'link', 'links')} · ${pl((d.repo.v.months || []).length, 'mes', 'meses')} de contenido</span>` : SIN('clients/' + s + '/00-onboarding/plan-contratado.md')) : aviso(d.repo, 'repo/client/' + s))}
      ${fila('target', 'Estrategia', e ? html`<span class="sm">${bloques.filter((b) => b.estado === 'aprobado').length} de ${bloques.length} bloques aprobados${e.vivaAprobada ? ' · estrategia en vivo aprobada' : ''}</span>` : aviso(d.est, 'estrategia/' + s))}
      ${fila('user', 'Cuenta', items ? html`<span class="sm">Onboarding: ${items.filter((x) => x.done).length} de ${items.length} pasos</span>` : aviso(d.acc, 'accounts › acc-' + s))}
      ${fila('users', 'Avatares', d.avs.ok ? ((d.avs.v.avatares || []).length ? html`<span class="sm">${(d.avs.v.avatares || []).map((a) => `${a.nombre}${Number.isFinite(+a.peso) ? ` ${+a.peso}%` : ''}`).join(' · ')}</span>` : SIN('avatares de ' + s)) : aviso(d.avs, 'avatares'))}
      ${fila('layers', 'Tablero de marca', d.bb.ok ? html`<span class="sm">Existe el tablero de marca.</span>` : aviso(d.bb, 'brand_boards › ' + s))}
      ${fila('edit', 'Sistema visual', d.sis.ok ? (d.sis.v.md ? html`<span class="sm">Escrito por Branding · ${pl(Object.keys(d.sis.v.logos || {}).length, 'logo', 'logos')}${d.sis.v.kit ? ' · kit de redes' : ''}</span>` : SIN('02-marca/sistema-visual.md')) : aviso(d.sis, 'repo/client/' + s + '/sistema'))}
      ${fila('megaphone', 'Contenido', d.cfg.ok ? html`<span class="sm">Configuración de contenido lista.</span>` : aviso(d.cfg, 'content/cfg'))}
      ${fila('doc', 'Entregables', totalEnts ? html`<span class="sm">${pl(totalEnts, 'entregable', 'entregables')} · ${Object.entries(porEstado).map(([k, c]) => `${c} ${k.toLowerCase()}`).join(' · ')}</span>` : SIN('ningún entregable de ' + s + ' todavía'))}`;

    // Project
    const proy = d.proy.ok ? (d.proy.v.items || []) : null, tar = d.tar.ok ? (d.tar.v.items || []) : null;
    const activos = proy ? proy.filter((p) => p.status !== 'cerrado' && p.status !== 'archivado') : [], deCli = s ? activos.filter((p) => p.client_slug === s) : [];
    const abiertas = tar ? tar.filter((t) => t.status !== 'Hecha' && !t.done_at) : [], vencidas = abiertas.filter((t) => t.due && t.due < new Date().toISOString().slice(0, 10));
    const pro = html`${fila('kanban', 'Proyectos', proy ? html`<span class="sm">${pl(activos.length, 'proyecto activo', 'proyectos activos')}${s ? ` · ${deCli.length} de ${n}` : ''}</span>${(s ? deCli : activos).slice(0, 5).length ? html`<ul class="ai-lista">${(s ? deCli : activos).slice(0, 5).map((p) => html`<li>${p.name} <span class="mut sm">· ${p.kind || ''}</span></li>`)}</ul>` : ''}` : aviso(d.proy, 'db/projects'))}
      ${fila('check', 'Tareas', tar ? html`<span class="sm">${pl(abiertas.length, 'abierta', 'abiertas')} · ${pl(vencidas.length, 'vencida', 'vencidas')}</span>` : aviso(d.tar, 'db/tasks'))}`;

    // Execution history
    const hechas = tar ? tar.filter((t) => t.done_at && (!s || t.client_slug === s)).sort((a, z) => String(z.done_at).localeCompare(String(a.done_at))).slice(0, 6) : null;
    const hist = ents.flatMap((w) => w.items.flatMap((x) => (Array.isArray(x.historial) ? x.historial : []).map((h) => ({ ...h, tool: herramientaDe(x.tool)?.nombre || x.tool, titulo: x.titulo })))).sort((a, z) => String(z.en).localeCompare(String(a.en))).slice(0, 6);
    const jui = d.jui.ok ? (d.jui.v.items || []).slice(0, 6) : null;
    const his = html`${fila('check', 'Tareas cerradas', hechas ? (hechas.length ? html`<ul class="ai-lista">${hechas.map((t) => html`<li>${t.title} <span class="mut sm">· ${fdate(t.done_at)}</span></li>`)}</ul>` : SIN(s ? 'ninguna tarea cerrada de ' + n : 'ninguna tarea cerrada que tu perfil vea')) : aviso(d.tar, 'db/tasks'))}
      ${fila('badge-check', 'Juicios de Laya', jui ? (jui.length ? html`<ul class="ai-lista">${jui.map((j) => html`<li>${j.target_label || j.target?.id || '—'} <span class="mut sm">· ${frase(j, null)} · ${fdate(j.at)}</span></li>`)}</ul>` : SIN('Laya todavía no juzgó nada')) : aviso(d.jui, 'laya/juicios'))}
      ${fila('clock', 'Historial de entregables', s ? (hist.length ? html`<ul class="ai-lista">${hist.map((h) => html`<li>${h.accion} · ${h.tool} <span class="mut sm">· v${h.version ?? '—'} · ${fdate(h.en)}</span></li>`)}</ul>` : SIN('sin entregables de ' + n)) : html`<span class="mut sm">Elige un cliente para ver el historial de sus entregables.</span>`)}`;

    const panel = (t, ic, sub, c) => html`<section class="card ai-panel"><div class="ai-panel-h"><span class="ai-card-ic">${ico(ic, 18)}</span><div><b>${t}</b><span class="mut sm">${sub}</span></div></div>${c}</section>`;
    return { cuerpo: html`<p class="mut sm ai-nota">Solo lectura. Esto es lo que la IA puede leer cuando abres el Chat o una herramienta; lo que tu perfil no ve, no aparece.</p>
      <div class="ai-mgrid">${panel('Organization', 'building-2', 'Lo de Inherent', org)}${panel('Client', 'briefcase', n ? `El contexto de ahora: ${n}` : 'Sin cliente en el contexto', cli)}${panel('Project', 'kanban', 'Proyectos y tareas', pro)}${panel('Execution history', 'clock', 'Lo que ya se hizo', his)}</div>
      <p class="mut sm">La bitácora de auditoría (<code>audit</code>) no se lee desde aquí.</p>` };
  }

  // ---------- Models ----------
  const CAMINOS = { hermes: ['Hermes', 'La IA corre en Hermes, en tu compu, con el modelo que elegiste en el Chat.'], puente: ['El puente de Laya', 'Hermes no está listo, así que la IA corre con Claude Code por el puente en tu compu.'], 'claude-web': ['Tu Claude (a mano)', 'No hay Hermes ni puente: el OS te arma el pedido y tú lo pegas en tu Claude y traes la respuesta.'] };
  function modelos() {
    const mo = motorDe(me), h = hermesDe(me);
    return {
      cuerpo: html`${seccion('Qué camino usa hoy la IA para ti', 'Lo mismo para cada herramienta (correrIA)', html`<section class="card ai-panel"><div id="ai-camino"><p class="mut sm">Revisando tu compu…</p></div>${kv([['Motor elegido en el Chat', nombreMotor(mo)]])}</section>`)}
      ${seccion('IAs y modelos de esta compu', 'Lo que Hermes tiene conectado', html`<section class="card ai-panel" id="ai-ias"><p class="mut sm">${h ? 'Leyendo los modelos de Hermes…' : 'Hermes no está conectado en esta compu.'}</p></section>`)}
      <div class="ai-mgrid">
        <section class="card ai-panel"><div class="ai-panel-h"><span class="ai-card-ic">${ico('monitor', 18)}</span><div><b>Motores del Chat</b><span class="mut sm">Quién responde en el Chat</span></div></div><ul class="ai-lista">${MOTORES.map(([k, t]) => html`<li>${k === mo.motor ? punto('ok') : punto('off')} <b>${t}</b>${k === mo.motor ? html` <span class="chip sm2">El tuyo</span>` : ''}</li>`)}</ul>
          <div class="lbl">Modelos de Claude</div><ul class="ai-lista">${CLAUDE_MODELOS.map(([k, t, d]) => html`<li><b>${t}</b> <span class="mut sm">· ${d}</span></li>`)}</ul></section>
        <section class="card ai-panel"><div class="ai-panel-h"><span class="ai-card-ic">${ico('zap', 18)}</span><div><b>Cuánto piensa</b><span class="mut sm">El esfuerzo antes de responder</span></div></div><ul class="ai-lista">${ESFUERZOS.map(([, t, d]) => html`<li><b>${t}</b> <span class="mut sm">· ${d}</span></li>`)}</ul>
          <div class="lbl">Modelos en tu compu (privados)</div><p class="sm">${LOCALES.join(' · ')}</p><p class="mut sm">Lo que se habla con estos proveedores no sale de la compu. Ollama Cloud no cuenta.</p></section>
      </div>`,
      despues: async () => {
        const g = gen, vivo = () => alive() && g === gen;
        const [sh, sp, camino] = await Promise.all([saludHermes(me).catch(() => ({ on: false })), saludPuente(4000).catch(() => ({ on: false })), caminoIA(me).catch(() => 'claude-web')]);
        if (!vivo()) return;
        const [t, p] = CAMINOS[camino] || CAMINOS['claude-web'];
        const cam = $('#ai-camino', el);
        if (cam) mount(cam, html`<p class="sm"><b>${t}</b> · ${p}</p>${kv([['Hermes', html`${punto(!h ? 'off' : sh.on ? (sh.auth ? 'ok' : 'warn') : 'off')} ${!h ? 'Sin conectar en esta compu' : sh.on ? (sh.auth ? `Encendido${sh.version ? ` · v${sh.version}` : ''}` : 'Encendido, pero la llave no sirve') : 'No responde'}`], ['Puente de Laya', html`${punto(sp.on ? (sp.listo ? 'ok' : 'warn') : 'off')} ${sp.on ? (sp.listo ? 'Encendido y con chat' : 'Encendido, sin chat listo') : 'No responde'}`]])}`);
        const box = $('#ai-ias', el); if (!box) return;
        if (!h || !sh.auth) return mount(box, html`<p class="mut">${h ? 'Hermes no está listo para leer sus modelos.' : 'Sin Hermes no se sabe qué IAs hay en esta compu.'} Para encenderlo, en la Terminal:</p>${TERMINAL.slice(0, 4).map(([n, c]) => html`<div class="ai-paso"><span class="mut sm">${n}</span>${cmd(c)}</div>`)}<p class="mut sm" style="margin-top:8px">${IAS.map(([, n]) => n).join(' · ')}: las que conectes aparecen aquí.</p>`);
        const m = await modelosHermes(me).catch(() => null);
        if (!vivo()) return;
        if (!m) return mount(box, html`<p class="mut">${SIN('GET /api/model/options de Hermes')}</p>`);
        const listas = new Set(iasListas(m).map(([id]) => id));
        mount(box, html`<p class="sm">Modelo actual de Hermes: <b>${m.actual.model ? modeloCorto(m.actual.model) : '—'}</b>${m.actual.provider ? html` <span class="mut">· ${nombreProveedor(m.actual.provider)}</span>` : ''}</p>
          <div class="ai-tw"><table class="ai-tabla"><thead><tr><th>IA</th><th>Estado</th><th>Modelos listos</th></tr></thead><tbody>${IAS.map(([id, nom, ic]) => { const ms = modelosDeIa(m, id); return html`<tr><td><span class="ai-ia">${ico(ic, 15)} ${nom}</span></td><td>${listas.has(id) ? html`${punto('ok')} Lista${id === 'local' ? ' · privada' : ''}` : html`${punto('off')} Sin conectar`}</td><td>${ms.length ? html`<div class="ai-chips">${ms.slice(0, 12).map((x) => html`<span class="chip sm2" title="${nombreProveedor(x.provider)}">${modeloCorto(x.model)}${fuertesDe(x.model).length ? ` · ${fuertesDe(x.model).map(nombreModo).join(', ')}` : ''}</span>`)}${ms.length > 12 ? html`<span class="mut sm">+${ms.length - 12}</span>` : ''}</div>` : html`<span class="mut sm">—</span>`}</td></tr>`; })}</tbody></table></div>`);
      },
    };
  }

  // ---------- Evaluations ----------
  async function evals() {
    const s = slug(), n = nombre(s);
    const [d, ents] = await Promise.all([lote({ puertas: 'laya/puertas', jui: 'laya/juicios', ...(s ? { est: `estrategia/${enc(s)}` } : {}) }), entregablesDe(s)]);
    const puertas = d.puertas.ok ? d.puertas.v.puertas || {} : null, todas = puertas ? Object.entries(puertas) : [];
    const pu = puertas ? html`<div class="ai-pgrid">${todas.map(([id, p]) => html`<article class="ai-puerta"><b>${p.label || id}</b><span class="mut sm">${p.donde || ''} · ${pl((p.preguntas || []).length, 'pregunta', 'preguntas')}</span><ul>${(p.preguntas || []).map((q) => html`<li>${corto(q.texto, 110)} <span class="mut sm">· ${TIPO_LABEL[q.tipo] || q.tipo}${q.tipo !== 'choice' ? ` · ${umbralTexto(q)}` : ''}</span></li>`)}</ul></article>`)}</div>` : aviso(d.puertas, 'laya/puertas');
    const items = d.jui.ok ? d.jui.v.items || [] : null;
    const label = (j) => { const q = puertas?.[j.gate]?.preguntas?.find((x) => x.id === j.question_id); return frase(j, q); };
    const jui = items ? (items.length ? html`<ul class="ai-lista">${items.slice(0, 12).map((j) => html`<li><b>${j.target_label || j.target?.id || '—'}</b> <span class="mut sm">· ${puertas?.[j.gate]?.label || j.gate || ''} · ${j.status === 'pendiente' ? 'pendiente' : label(j)} · ${ENGINE_LABEL[j.engine] || j.engine || ''} · ${fdate(j.at)}</span></li>`)}</ul>` : SIN('Laya todavía no juzgó nada')) : aviso(d.jui, 'laya/juicios');
    const conCrit = ents.flatMap((w) => w.items.filter((x) => (x.criterios?.cumple || []).length || (x.criterios?.falta || []).length).map((x) => ({ ...x, ws: w.ws })));
    const crit = !s ? html`<p class="mut sm">Elige un cliente en la barra para ver los criterios de sus entregables.</p>` : conCrit.length ? html`<div class="ai-tw"><table class="ai-tabla"><thead><tr><th>Entregable</th><th>Herramienta</th><th>Estado</th><th>Cumple</th><th>Falta</th></tr></thead><tbody>${conCrit.slice(0, 30).map((x) => html`<tr><td>${x.titulo || '—'}</td><td>${herramientaDe(x.tool)?.nombre || x.tool}</td><td>${x.estado || ''}</td><td>${x.criterios.cumple.length}</td><td>${x.criterios.falta.length ? html`<span class="ai-falta">${x.criterios.falta.length}</span>${html` <span class="mut sm">${corto(x.criterios.falta[0], 70)}</span>`}` : 0}</td></tr>`)}</tbody></table></div>` : SIN(`ningún entregable de ${n} guardó criterios todavía`);
    const nivel = d.est?.ok ? d.est.v.nivel : null, fichaV = d.est?.ok ? d.est.v.ficha : null;
    const alc = (nv, f) => textoAlcanceConsulting(nv, f) || 'Operations OS y Money OS completos.';
    // El alcance lee {id, nombre} (como lo manda /api/estrategia/:slug); LEVELS trae {id, name}.
    const lv = (id) => ({ id, nombre: LEVELS.find((l) => l.id === id)?.name || id }), medida = { id: 'medida', nombre: 'A la medida' }, fin = (ok) => (ok ? null : { incluye: [] });
    const caso = (c, nv, f) => [c, alcanceConsulting(nv, f), alc(nv, f)];
    const tabla = [caso('Sin ficha de oferta', null, null), caso(lv('foundation').nombre, lv('foundation'), null), caso(lv('growth').nombre, lv('growth'), null),
      caso(`${lv('partnership').nombre} · con Finanzas en su ficha`, lv('partnership'), fin(true)), caso(`${lv('partnership').nombre} · sin Finanzas en su ficha`, lv('partnership'), fin(false)), caso('A la medida', medida, null)];
    return { cuerpo: html`
      ${seccion('Puertas de Laya', 'Las preguntas con que Laya juzga leads, facturas, referentes, hooks y la etapa del negocio', html`<section class="card ai-panel">${pu}</section>`)}
      ${seccion('Últimos juicios', 'Los que tu perfil puede ver', html`<section class="card ai-panel">${jui}</section>`)}
      ${seccion('Criterios de los entregables', n ? `Lo que cumple y lo que falta, de ${n}` : 'Lo que cumple y lo que falta, por cliente', html`<section class="card ai-panel">${crit}</section>`)}
      ${seccion('Reglas con que se mide a la IA', 'Las mismas en el Chat y en cada herramienta (llm/modos.js)', html`<section class="card ai-panel">
        <details class="ai-det" open><summary>Reglas comunes (valen en todos los modos)</summary><ul>${lineas(REGLAS_COMUNES).map((r) => html`<li>${r}</li>`)}</ul></details>
        <details class="ai-det"><summary>El protocolo de bloques (criterios, pregunta, brújula, avance)</summary><pre class="ai-pasaje">${PROTOCOLO.join('\n')}</pre></details>
        <div class="lbl" style="margin-top:12px">Criterios de aceptación por modo</div><div class="ai-pgrid">${MODOS.map((m) => html`<article class="ai-puerta" style="--ac:var(${colorModo(m.id)})"><b>${m.nombre}</b><ul>${lineas(HARNESS[m.id]?.criterios).map((c) => html`<li>${c}</li>`)}</ul></article>`)}</div>
        <p class="mut sm" style="margin-top:10px">Las fichas por formato viven en <code>inherent/08-CRITERIOS-DE-ACEPTACION.md</code>: no está en la copia del OS, así que aquí solo se nombra.</p></section>`)}
      ${seccion('Alcance de Consulting por nivel', 'Operations OS y Money OS son de Growth Partnership · el alcance contratado es el techo', html`<section class="card ai-panel"><div class="ai-tw"><table class="ai-tabla"><thead><tr><th>Caso</th><th>Alcance</th><th>Qué pasa</th></tr></thead><tbody>${tabla.map(([c, a, t]) => html`<tr><td>${c}</td><td><span class="chip sm2">${a}</span></td><td>${t}</td></tr>`)}</tbody></table></div>
        ${s ? html`<p class="sm" style="margin-top:10px"><b>${n}</b> · ${nivel ? html`${nivel.nombre}: <span class="chip sm2">${alcanceConsulting(nivel, fichaV)}</span> ${alc(nivel, fichaV)}` : SIN('nivel de ' + n + ' (falta su ficha de oferta)')}</p>` : ''}</section>`)}` };
  }

  const PAG = { agents: async () => agentes(), skills: async () => skills(), workflows: () => workflows(), memory: () => memoria(), models: async () => modelos(), evals: () => evals() };

  async function paint() {
    const g = ++gen;
    let pg;
    try { pg = pagina ? await PAG[pagina]() : { cuerpo: portada() }; } catch (e) { pg = { cuerpo: html`<div class="empty"><b>No pude armar esta página</b>${e.message || ''}</div>` }; }
    if (!alive() || g !== gen) return;
    mount(el, html`${cabecera()}${pg.cuerpo}`);
    pg.despues?.();
  }

  // El menú de «Create Deliverable» se cierra con Escape y con clic afuera (al navegar, la pantalla se va con él).
  el.addEventListener('click', (e) => { for (const d of $$('.ai-menu[open]', el)) if (!d.contains(e.target)) d.removeAttribute('open'); });
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape') for (const d of $$('.ai-menu[open]', el)) { d.removeAttribute('open'); $('summary', d)?.focus(); } });
  // En las cadenas, pasar por una herramienta resalta lo que entra y lo que sale de ella.
  const resaltar = (id) => { for (const p of $$('.ai-ed', el)) p.classList.toggle('on', Boolean(id) && (p.dataset.de === id || p.dataset.a === id)); for (const nd of $$('.ai-nd', el)) { const sel = id && (nd.dataset.id === id || $$('.ai-ed.on', el).some((p) => p.dataset.de === nd.dataset.id || p.dataset.a === nd.dataset.id)); nd.classList.toggle('on', Boolean(sel)); } };
  for (const [ev, on] of [['mouseover', true], ['focusin', true], ['mouseout', false], ['focusout', false]]) el.addEventListener(ev, (e) => { const nd = e.target.closest?.('.ai-nd'); if (nd) resaltar(on ? nd.dataset.id : ''); });
  acts(el, {
    research: () => { const s = slug(), n = nombre(s); abrirEnChat(me.email, { modo: 'estrategia', slug: s, borrador: `Investiga a fondo ${n ? `a ${n}` : 'a este cliente'}: su mercado, la competencia, el cliente ideal y las oportunidades. Cita cada fuente; lo que no tenga fuente va como ⚠️ SIN DATOS.` }); },
    modo: (b) => { const m = MODOS.find((x) => x.id === b.dataset.modo); if (!m) return; abrirEnChat(me.email, { modo: m.id, slug: m.pide ? slug() : '' }); },
    copiar: async (b) => { try { await navigator.clipboard.writeText(b.dataset.t || ''); toast('Copiado'); } catch { toast('No pude copiar: selecciónalo a mano', true); } },
    // Un pasaje de hormozi-brain, a pedido (la ruta es cerrada en el servidor: libros, roadmap, sops y briefs).
    fuente: async (b) => {
      const pre = b.closest('.ai-fuente')?.querySelector('.ai-pasaje'); if (!pre) return;
      if (!pre.hidden) { pre.hidden = true; b.textContent = 'Ver pasaje'; return; }
      b.disabled = true; b.textContent = 'Leyendo…';
      const r = await leer(`estrategia/fuente?ruta=${enc(b.dataset.ruta)}`);
      b.disabled = false; b.textContent = 'Ocultar';
      pre.textContent = r.ok ? `${r.v.titulo || b.dataset.ruta}\n\n${String(r.v.contenido || '').slice(0, 1400)}${String(r.v.contenido || '').length > 1400 ? '\n…' : ''}` : r.status === 403 ? 'Tu perfil no lee las fuentes.' : `⚠️ SIN DATOS · ${b.dataset.ruta}`;
      pre.hidden = false;
    },
  });
  await paint();
}
