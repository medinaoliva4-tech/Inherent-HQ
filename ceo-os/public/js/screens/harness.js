// AI Harness (#/ai): la portada de la «inteligencia compartida» del OS (plan §3.1 y Fase 4). Una sola inteligencia para
// todas las herramientas: las acciones rápidas abren el Chat o una herramienta con el cliente del contexto, y Memory &
// Context dice de dónde saca lo que sabe. Las páginas Agents · Skills · Workflows · Memory · Models · Evaluations son en
// la Fase 1 una ficha «Pronto» con lo que van a mostrar (Agents ya enseña los modos del Chat, porque MODOS es puro y
// existe). Sin backend nuevo; nada de costos.
import { html, raw, mount, acts, ico, skel, $, $$ } from '../core.js';
import { WORKSPACES, HERRAMIENTAS, rutaHerramienta, puedeWs } from '../herramientas.js';
import { cargarContexto, contextoLista, contextoActual } from '../contexto.js';
import { abrirEnChat } from '../areas.js';
import { MODOS, HARNESS } from '../llm/modos.js';

export const esqueleto = () => skel('pagina');

// Las páginas del Harness: [id, nombre, ícono, qué mostrará (Fase 4)].
const PAGINAS = [
  ['agents', 'Agents', 'sparkles', ['Los modos del Chat, cada uno con su rol, cómo trabaja, qué herramientas usa y qué tiene que cumplir lo que entrega.', 'Los 12 agentes del repo (① Strategy … ⑩ Ads), como lista fija: qué hace cada uno y en qué etapa del pipeline corre.']],
  ['skills', 'Skills', 'puzzle', ['Las skills que Hermes tiene en tu compu, y cómo encenderlo si no está.', 'Las fuentes de hormozi-brain que lee Strategy (ofertas, modelos de dinero, el roadmap de 10 etapas), con su cita exacta.']],
  ['workflows', 'Workflows', 'git-branch', ['Las recetas: el ciclo por departamentos, Growth, las reuniones y las que guarda el CEO.', 'El flujo lead → cotización → cliente → proyecto, la secuencia de Diseño y las cadenas de herramientas (de dónde viene y a dónde va cada entregable) dibujadas sobre el flujo compartido.']],
  ['memory', 'Memory', 'layers', ['Organization: la Library y la visión. Client: cuentas, ficha, estrategia, avatares, tableros de marca, sistema visual y sus entregables.', 'Project: proyectos y tareas. Execution history: tareas hechas, sesiones de Hermes, juicios de Laya y el historial de cada entregable.']],
  ['models', 'Models', 'zap', ['Qué IAs tiene lista tu compu (Claude, ChatGPT, las locales), el modelo de cada una y cuánto piensa.', 'El estado de Hermes y del puente, y qué camino usaría hoy la IA para ti. Sin costos.']],
  ['evals', 'Evaluations', 'badge-check', ['Las puertas y los últimos juicios de Laya, y los criterios que cada entregable guarda (cumple / falta).', 'Las reglas comunes, el protocolo de bloques y los criterios de cada modo; el alcance de Consulting por nivel.']],
];
const paginaDe = (id) => PAGINAS.find((p) => p[0] === id) || null;
const ACTUAL = raw('aria-current="page"'); // constante segura: la pestaña abierta

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
  const wsColor = (id) => WORKSPACES.find((w) => w.id === id)?.color || '--ui-m-organizacion';
  // A una herramienta con el cliente del contexto; sin contexto, al workspace (app.js completa con el selector).
  const irA = (h) => (slug() ? rutaHerramienta(h.ws, slug(), h.id) : `#/ws/${h.ws}`);

  const cabecera = () => html`<div class="ai-hero sp-hero"><span class="lbl">AI Harness</span><h1>Una sola inteligencia para todas las herramientas</h1>
    <p>Lo que la IA sabe de Inherent y de cada cliente, cómo trabaja cada modo y con qué reglas se mide lo que entrega. Lo mismo en el Chat y en cada workspace.</p></div>
    <nav class="ai-tabs" aria-label="Páginas del Harness"><a href="#/ai" ${!pagina ? ACTUAL : ''}>Overview</a>${PAGINAS.map(([id, n, ic]) => html`<a href="#/ai/${id}" ${pagina === id ? ACTUAL : ''}>${ico(ic, 14)} ${n}</a>`)}</nav>`;

  // ---------- Portada ----------
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
    <div class="hy-bh" style="margin-top:28px"><h2>Memory &amp; Context</h2><span>De dónde saca la IA lo que sabe</span></div>
    <section class="ai-memoria">
      <div class="ai-mem"><span class="ai-mem-ic">${ico('building-2', 18)}</span><b>Organization</b><span class="mut sm">Lo de Inherent: los SOPs y playbooks de la Library y la visión y misión.</span><div class="ai-mem-links"><a href="#/org/library">Library</a><a href="#/org/vision">Visión</a></div></div>
      <div class="ai-mem"><span class="ai-mem-ic">${ico('briefcase', 18)}</span><b>Client</b>${n ? html`<span class="mut sm">El contexto de ahora: <em>${n}</em>. Su ficha, estrategia, avatares, marca y contenido.</span><div class="ai-mem-links">${puede('strategy') ? html`<a href="#/ws/strategy/${s}/overview">Strategy</a>` : ''}${puede('marketing') ? html`<a href="#/ws/marketing/${s}/overview">Marketing</a>` : ''}</div>`
        : html`<span class="mut sm">Sin cliente en el contexto. Elige uno en la barra y la IA trabaja con su ficha, estrategia y marca.</span><div class="ai-mem-links">${puede('strategy') ? html`<a href="#/ws/strategy">Strategy</a>` : ''}${puede('marketing') ? html`<a href="#/ws/marketing">Marketing</a>` : ''}</div>`}</div>
      <div class="ai-mem"><span class="ai-mem-ic">${ico('kanban', 18)}</span><b>Project</b><span class="mut sm">Los proyectos y sus tareas: qué está en curso, qué venció y quién lo lleva.</span><div class="ai-mem-links"><a href="#/org/operations">Proyectos</a><a href="#/org/work">Mis tareas</a></div></div>
      <div class="ai-mem pronto"><span class="ai-mem-ic">${ico('clock', 18)}</span><b>Execution history</b><span class="mut sm">Pronto: el historial de entregables (versiones, quién aprobó, resultados). Llega en la Fase 2.</span><div class="ai-mem-links"><a href="#/ai/memory">Memory</a></div></div>
    </section>`;
  }

  // ---------- Páginas (Fase 1: la ficha «Pronto» con lo que mostrará) ----------
  function ficha(p) {
    const [id, n, ic, lineas] = p;
    return html`<section class="ai-pronto card"><div class="ai-pronto-h"><span class="ai-card-ic">${ico(ic, 22)}</span><div><span class="chip sm2 amber">Pronto</span><h2>${n}</h2></div></div>
      <p class="mut">Esta página llega en la Fase 4 del Harness. Va a mostrar:</p><ul>${lineas.map((l) => html`<li>${l}</li>`)}</ul>
      ${id === 'workflows' ? html`<div class="ai-pronto-foot mut sm">Hoy las recetas viven en <a href="#/org/services/responsabilidades">Servicios › Responsabilidades</a> y las cadenas en cada workspace.</div>` : ''}
      ${id === 'evals' ? html`<div class="ai-pronto-foot mut sm">Hoy las puertas y los juicios de Laya están en <a href="#/org/team/laya">Equipo › Laya</a>.</div>` : ''}</section>`;
  }
  function agentes() {
    const s = slug(), n = nombre(s);
    return html`<div class="hy-bh" style="margin-top:22px"><h2>Los modos del Chat</h2><span>Cada uno es un agente con su rol y sus reglas · se abre ${n ? html`con <em>${n}</em>` : 'con el cliente del contexto'}</span></div>
      <section class="ai-agentes">${MODOS.map((m) => { const h = HARNESS[m.id] || {}; return html`<div class="ai-agente" style="--ac:var(--ui-m-${m.id})"><div class="ai-agente-h"><span class="ai-card-ic">${ico(m.icono, 18)}</span><div><b>${m.nombre}</b><span class="mut sm">${m.depto || ''}</span></div></div>
        <p class="sm">${h.rol || m.sub}</p>
        <div class="ai-agente-f"><span class="mut sm">${m.pide === 'cliente' ? 'Pide un cliente' : m.pide === 'marca' ? 'Pide una marca' : 'Sin cliente'}${(h.como || []).length ? ` · ${h.como.length} reglas de trabajo` : ''}</span><button type="button" class="btn ghost xs" data-act="modo" data-modo="${m.id}">Abrir en el Chat</button></div></div>`; })}</section>`;
  }

  const paint = () => { if (!alive()) return; const p = paginaDe(pagina); mount(el, html`${cabecera()}${p ? html`${ficha(p)}${p[0] === 'agents' ? agentes() : ''}` : portada()}`); };

  // El menú de «Create Deliverable» se cierra con Escape y con clic afuera (al navegar, la pantalla se va con él).
  el.addEventListener('click', (e) => { for (const d of $$('.ai-menu[open]', el)) if (!d.contains(e.target)) d.removeAttribute('open'); });
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape') for (const d of $$('.ai-menu[open]', el)) { d.removeAttribute('open'); $('summary', d)?.focus(); } });
  acts(el, {
    research: () => { const s = slug(), n = nombre(s); abrirEnChat(me.email, { modo: 'estrategia', slug: s, borrador: `Investiga a fondo ${n ? `a ${n}` : 'a este cliente'}: su mercado, la competencia, el cliente ideal y las oportunidades. Cita cada fuente; lo que no tenga fuente va como ⚠️ SIN DATOS.` }); },
    modo: (b) => { const m = MODOS.find((x) => x.id === b.dataset.modo); if (!m) return; abrirEnChat(me.email, { modo: m.id, slug: m.pide ? slug() : '' }); },
  });
  paint();
}
