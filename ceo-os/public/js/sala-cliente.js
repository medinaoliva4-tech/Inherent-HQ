// Sala del cliente (#/clients/<slug>/sala): la memoria viva de una cuenta. Pegas una transcripción → el OS saca los compromisos con su
// CITA literal (nacen como hipótesis) → Aceptar crea UNA tarea, Descartar los archiva. A la derecha, lo que ya se sabe del cliente:
// qué quiere, qué le duele, qué se prometió, qué funcionó y los riesgos, cada cosa con su fuente. Todo sale de api/_lib/contexto-vivo.js;
// sin fuentes, «Sin datos» (nunca un 0 inventado). El conector de reuniones hoy está desconectado y la pantalla lo dice.
import { api, toast } from './core.js';
import { h } from './kit/dom.js';

const ORIGEN = [['reunion', 'Reunión'], ['llamada', 'Llamada'], ['nota', 'Nota interna'], ['mensaje', 'Mensaje']];
const CATS = [['prometido', 'Prometido', '◎'], ['quiere', 'Quiere', '♡'], ['dolores', 'Le duele', '!'], ['funciono', 'Funcionó', '✓'], ['riesgos', 'Riesgos', '△']];
const CONF = { alta: 'Confianza alta', media: 'Confianza media', baja: 'Confianza baja' };
const fecha = (iso) => { if (!iso) return ''; const d = new Date(String(iso).slice(0, 10) + 'T12:00'); return Number.isNaN(d.getTime()) ? String(iso).slice(0, 10) : d.toLocaleDateString('es', { day: 'numeric', month: 'short' }); };
const hoyISO = () => new Date().toISOString().slice(0, 10);

// Un compromiso: la cita grande, quién y para cuándo como chips, y sus dos botones.
function compromiso(c, { alCambiar }) {
  const estado = c.estado || 'hipotesis', msg = h('small', { class: 'sl-msg', 'aria-live': 'polite' });
  const boton = (txt, ruta, cls) => {
    const b = h('button', { type: 'button', class: `btn ${cls}` }, txt);
    b.addEventListener('click', async () => {
      b.disabled = true; msg.textContent = '';
      try { const r = await api(`contexto/compromisos/${c.id}/${ruta}`, { method: 'POST', body: { v: c.v } }); toast(ruta === 'aceptar' ? (r.ya ? 'Ya tenía tarea' : 'Tarea creada') : 'Descartado'); alCambiar?.(); }
      catch (e) { msg.textContent = e.message || 'No se pudo'; b.disabled = false; }
    });
    return b;
  };
  const vencido = c.vencido || (c.para_cuando && c.para_cuando < hoyISO() && estado === 'hipotesis');
  return h('article', { class: `sl-c sl-c-${estado}` },
    h('blockquote', {}, `«${c.cita}»`),
    h('div', { class: 'sl-c-meta' }, c.quien ? h('span', { class: 'sl-chip' }, '👤 ', c.quien) : h('span', { class: 'sl-chip sl-chip-nd' }, 'Sin responsable'),
      c.para_cuando ? h('span', { class: `sl-chip${vencido ? ' sl-chip-mal' : ''}` }, vencido ? 'Venció ' : 'Para ', fecha(c.para_cuando)) : h('span', { class: 'sl-chip sl-chip-nd' }, 'Sin fecha'),
      h('span', { class: `sl-conf sl-conf-${c.confianza || 'baja'}`, title: [CONF[c.confianza] || CONF.baja, c.razon].filter(Boolean).join(' · ') }, h('i', {}), h('i', {}), h('i', {})),
      c.contradice?.length ? h('span', { class: 'sl-chip sl-chip-mal' }, '⇄ Otra fecha para lo mismo') : ''),
    estado === 'hipotesis' ? h('div', { class: 'sl-c-acc' }, boton('Aceptar → tarea', 'aceptar', ''), boton('Descartar', 'descartar', 'ghost'), msg)
      : h('p', { class: 'sl-c-ok' }, estado === 'aprobado' ? '✓ Aceptado · ya es una tarea' : 'Descartado'));
}

export async function pintarSala(box, { slug, alive = () => true }) {
  let sel = 'prometido', mem = null, error = null, ultimo = null;
  const zona = h('div', { class: 'sl' });
  box.replaceChildren(zona);

  // ---- Pegar: transcripción + origen + fecha → Procesar ----
  let origen = 'reunion';
  const ta = h('textarea', { class: 'sl-ta', rows: 6, 'aria-label': 'Transcripción', placeholder: '[00:00:12] Luis: Te mando la propuesta el viernes.\n[00:01:40] Ana: Quedamos en que la próxima semana te paso el calendario…' });
  const titulo = h('input', { class: 'sl-in', placeholder: 'Título (opcional)', 'aria-label': 'Título' }), dia = h('input', { class: 'sl-in sl-in-d', type: 'date', value: hoyISO(), 'aria-label': 'Fecha' });
  const seg = h('div', { class: 'sl-seg', role: 'radiogroup', 'aria-label': 'Qué es' });
  const pintarSeg = () => seg.replaceChildren(...ORIGEN.map(([k, n]) => { const b = h('button', { type: 'button', role: 'radio', 'aria-checked': String(k === origen), class: k === origen ? 'on' : '' }, n); b.addEventListener('click', () => { origen = k; pintarSeg(); }); return b; }));
  pintarSeg();
  const go = h('button', { type: 'button', class: 'btn' }, 'Sacar compromisos'), estado = h('p', { class: 'sl-estado', 'aria-live': 'polite' });
  go.addEventListener('click', async () => {
    if (!ta.value.trim()) { ta.focus(); estado.textContent = 'Pega una transcripción o una nota.'; return; }
    go.disabled = true; estado.textContent = 'Leyendo…';
    try {
      const r = await api(`contexto/${encodeURIComponent(slug)}/transcripcion`, { method: 'POST', body: { texto: ta.value, origen, fecha: dia.value || undefined, titulo: titulo.value.trim() || undefined } });
      ultimo = r; estado.textContent = r.fuente?.duplicada ? 'Esa transcripción ya estaba: no se duplicó nada.' : `${r.compromisos.length} compromiso${r.compromisos.length === 1 ? '' : 's'} encontrado${r.compromisos.length === 1 ? '' : 's'} · nacen como hipótesis`;
      ta.value = ''; sel = 'prometido'; await cargar();
    } catch (e) { estado.textContent = e.message || 'No se pudo leer'; } finally { go.disabled = false; }
  });

  async function cargar() {
    try { mem = await api(`contexto/${encodeURIComponent(slug)}/memoria`); error = null; } catch (e) { mem = null; error = e; }
    if (alive()) pintar();
  }

  function pintar() {
    const con = mem?.conector || ultimo?.conector;
    const pegar = h('section', { class: 'sl-p' },
      h('header', { class: 'sl-h' }, h('b', {}, 'Pega lo que se habló'), h('small', {}, 'Transcripción con tiempos, o una nota')),
      con ? h('p', { class: 'sl-con' }, h('i', { class: con.conectado ? 'on' : '' }), con.conectado ? `${con.nombre}: conectado` : 'Reuniones sin conectar: pega la transcripción y se procesa igual') : '',
      seg, ta, h('div', { class: 'sl-fila' }, titulo, dia), h('div', { class: 'sl-fila' }, go, estado));
    if (error) { zona.replaceChildren(pegar, h('section', { class: 'sl-m' }, h('div', { class: 'sl-vacio' }, h('b', {}, error.status === 403 || error.status === 404 ? 'Tu vista no abre la memoria de este cliente' : 'No pude leer la memoria'), h('p', {}, error.message || ''), h('button', { type: 'button', class: 'btn ghost', onClick: cargar }, 'Reintentar')))); return; }
    if (!mem) { zona.replaceChildren(pegar, h('section', { class: 'sl-m sl-cargando', 'aria-busy': 'true' }, h('div', { class: 'sl-esq' }), h('div', { class: 'sl-esq' }), h('div', { class: 'sl-esq' }))); return; }
    const n = (k) => (mem[k] || []).length, total = CATS.reduce((s, [k]) => s + n(k), 0);
    const pend = (mem.prometido || []).filter((c) => c.estado === 'hipotesis').length;
    // La cabecera: último contacto (anillo de días), fuentes y lo pendiente de decidir.
    const dias = mem.ultimoContacto?.hace_dias, pct = dias == null ? 0 : Math.max(0, 1 - Math.min(dias, 30) / 30);
    const R = 20, C = 2 * Math.PI * R, NS = 'http://www.w3.org/2000/svg', s = (t, a) => { const e = document.createElementNS(NS, t); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); return e; };
    const anillo = s('svg', { viewBox: '0 0 48 48', class: 'sl-anillo', role: 'img', 'aria-label': dias == null ? 'Sin datos de último contacto' : `Último contacto hace ${dias} días` });
    anillo.append(s('circle', { cx: 24, cy: 24, r: R, class: 'sl-a-f' }), s('circle', { cx: 24, cy: 24, r: R, class: `sl-a-v${dias != null && dias > 14 ? ' sl-a-mal' : ''}`, 'stroke-dasharray': `${pct * C} ${C}`, transform: 'rotate(-90 24 24)' }));
    const t = s('text', { x: 24, y: 28, 'text-anchor': 'middle', class: 'sl-a-n' }); t.textContent = dias == null ? '—' : String(dias); anillo.append(t);
    const cab = h('div', { class: 'sl-kpis' },
      h('div', { class: 'sl-kpi' }, anillo, h('span', {}, h('b', {}, dias == null ? 'Sin datos' : dias === 0 ? 'Hoy' : `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`), h('small', {}, 'Último contacto'))),
      h('div', { class: 'sl-kpi' }, h('b', { class: 'sl-big' }, String(mem.fuentes || 0)), h('small', {}, mem.fuentes === 1 ? 'fuente' : 'fuentes')),
      h('div', { class: `sl-kpi${pend ? ' sl-kpi-o' : ''}` }, h('b', { class: 'sl-big' }, String(pend)), h('small', {}, pend === 1 ? 'por decidir' : 'por decidir')));
    // Las 5 categorías: barra proporcional tocable (cada segmento abre su lista).
    const barra = h('div', { class: 'sl-barra', role: 'tablist', 'aria-label': 'Qué se sabe del cliente' }, CATS.map(([k, nom, ic]) => {
      const b = h('button', { type: 'button', role: 'tab', 'aria-selected': String(k === sel), class: `sl-cat sl-cat-${k}${k === sel ? ' on' : ''}`, style: `--n:${Math.max(n(k), total ? 0.35 : 1)}` }, h('i', { 'aria-hidden': 'true' }, ic), h('span', {}, nom), h('b', {}, n(k) ? String(n(k)) : '—'));
      b.addEventListener('click', () => { sel = k; pintar(); }); return b;
    }));
    const items = mem[sel] || [];
    const lista = sel === 'prometido'
      ? (items.length ? items.slice().sort((a, b) => (a.estado === 'hipotesis' ? 0 : 1) - (b.estado === 'hipotesis' ? 0 : 1)).map((c) => compromiso(c, { alCambiar: cargar })) : [])
      : items.map((it) => h('article', { class: 'sl-i' }, h('blockquote', {}, `«${it.cita || it.texto}»`), h('small', {}, [it.quien, it.fuente?.titulo || it.fuente?.tipo, fecha(it.fecha), it.tambien_en?.length ? `y ${it.tambien_en.length} más` : ''].filter(Boolean).join(' · '))));
    const vacio = h('div', { class: 'sl-vacio' }, h('b', {}, 'Sin datos'), h('p', {}, mem.fuentes ? 'Nada de esto apareció en lo que se pegó.' : 'Pega la primera transcripción: aquí aparece lo que se prometió, con su cita.'));
    zona.replaceChildren(pegar, h('section', { class: 'sl-m' }, cab,
      mem.contradicciones?.length ? h('p', { class: 'sl-alerta' }, `⇄ ${mem.contradicciones.length} contradicción${mem.contradicciones.length === 1 ? '' : 'es'}: dos fechas distintas para lo mismo`) : '',
      barra, h('div', { class: 'sl-lista', role: 'tabpanel' }, ...(lista.length ? lista : [vacio]))));
  }
  pintar(); await cargar();
}
