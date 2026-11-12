// El registro de acciones del OS que puede proponer la interfaz del Chat (genui.js), una sugerencia sobre la caja
// (sugerencia-chat.js) o un estado vacío conversacional (vacio-chat.js). Seguro por defecto:
//   · lo que escribe un modelo o una regla es DATO: el nombre de la acción sale de una lista cerrada y cada argumento se
//     limpia aquí (validarAccion, puro); lo que no pasa, no se dibuja;
//   · nada corre solo: la persona hace clic, y aun así ninguna acción hace algo irreversible. Abrir, imprimir (abre la hoja con
//     su botón de PDF), copiar y crear una tarea (abre el formulario de siempre, que la persona confirma) no borran ni mandan nada.
//     La única que escribe es guardarEnHerramienta, y solo agrega lo que la persona aprobó en la tarjeta (ver vacio-chat.js).
// validarAccion y ACCIONES son puros (los prueba scripts/test-openui.mjs); ejecutarAccion e instalarAccionesUi tocan el navegador.

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MODOS = ['estrategia', 'organizacion', 'marketing', 'diseno', 'consulting', 'produccion', 'libre', 'code'];
// Las herramientas de departamentos que viven en code-os/ui (PanelLateral.tsx · HERRAMIENTA) y se montan con iframe ?embed=1.
export const HERRAMIENTAS_CODE = { icp: 'Perfil ICP', adquisicion: 'Calculadora de adquisición', dolores: 'Dolores', pilares: 'Pilares', radar: 'Radar', campanas: 'Campañas', pre: 'Hoja de preproducción', video: 'Posproducción' };
const texto = (v, n) => (typeof v === 'string' || typeof v === 'number' ? String(v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n) : '');
// Lo que va a la caja no puede arrancar un comando (/nuevo) ni llamar a un agente (@Strategy).
export const sinComando = (t) => String(t ?? '').trim().replace(/^[/@\s]+/, '');
const slugDe = (v) => { const s = texto(v, 64).toLowerCase(); return SLUG.test(s) ? s : ''; };
const idDe = (v) => { const s = texto(v, 64).toLowerCase(); return ID.test(s) ? s : ''; };

// nombre → { label (el botón por defecto), args(a) → args limpios | null si no sirven }.
export const ACCIONES = {
  abrirHerramienta: { label: 'Abrir', args: (a) => { const id = idDe(a.id ?? a.herramienta); return id ? { id, slug: slugDe(a.slug ?? a.cliente) } : null; } },
  abrirEnChat: { label: 'Platicarlo en el Chat', args: (a) => { const modo = MODOS.includes(a.modo) ? a.modo : ''; const borrador = sinComando(texto(a.borrador ?? a.texto, 1200)); return modo || borrador ? { modo, slug: slugDe(a.slug), borrador } : null; } },
  imprimir: { label: 'Imprimir', args: (a) => {
    if (a.tipo === 'call-sheet') { const jornada = texto(a.jornada, 80); return /^[\w.:-]{1,80}$/.test(jornada) ? { tipo: 'call-sheet', jornada, slug: slugDe(a.slug) } : null; }
    return { tipo: 'bloque', titulo: texto(a.titulo, 120) }; // sin tipo: la tarjeta misma
  } },
  crearTarea: { label: 'Crear tarea', args: (a) => { const titulo = texto(a.titulo ?? a.title, 200); return titulo ? { titulo, slug: slugDe(a.slug) } : null; } },
  copiar: { label: 'Copiar', args: (a) => ({ texto: texto(a.texto, 4000) }) }, // sin texto: lo que dice la tarjeta
  pedir: { label: 'Escribirlo', args: (a) => { const t = sinComando(texto(a.texto ?? a.pedido, 300)); return t ? { texto: t } : null; } },
  guardarEnHerramienta: { label: 'Guardar', args: (a) => { const destino = idDe(a.destino); return destino && a.datos && typeof a.datos === 'object' ? { destino, slug: slugDe(a.slug), datos: a.datos } : null; } },
};
export const NOMBRES_ACCIONES = Object.keys(ACCIONES);

// → { nombre, args } o null. Acepta el nombre en cualquier caja («abrirherramienta») y argumentos en objeto.
export function validarAccion(nombre, args) {
  const n = NOMBRES_ACCIONES.find((k) => k.toLowerCase() === String(nombre ?? '').trim().toLowerCase());
  if (!n) return null;
  const a = args && typeof args === 'object' && !Array.isArray(args) ? args : {};
  const limpio = ACCIONES[n].args(a);
  if (!limpio) return null;
  // El JSON que viaja en el botón tiene tope (los datos de guardar van aparte, ya limpios por su destino).
  try { if (JSON.stringify(limpio).length > 6000) return null; } catch { return null; }
  return { nombre: n, args: limpio };
}

// ---------- Navegador ----------
let ctx = { me: null };
// La app le pasa quién es la persona (chat-avisos-ui.js, que ya recibe `me` de app.js). Sin ella, lo que necesita el correo avisa.
export function contextoAcciones(o = {}) { ctx = { ...ctx, ...o }; return ctx; }

const avisar = async (msg, err) => { try { (await import('../core.js')).toast(msg, err); } catch { /* sin toast */ } };
function aLaCaja(t) {
  const ta = typeof document !== 'undefined' && document.getElementById('llm-in');
  if (!ta) return false;
  ta.value = t; ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus();
  return true;
}
const textoDeBloque = (el) => (el?.closest('.gu, .sg') || el)?.innerText?.trim() || '';

export async function ejecutarAccion(nombre, args, { el = null } = {}) {
  const v = validarAccion(nombre, args);
  if (!v) return avisar('Esa acción no está disponible', true);
  const a = v.args, email = ctx.me?.email || '';
  switch (v.nombre) {
    case 'abrirHerramienta': {
      if (HERRAMIENTAS_CODE[a.id]) {
        const { MAPA_TRABAJO } = await import('./mapa-trabajo.js');
        const vista = MAPA_TRABAJO.find((x) => x.id === a.id);
        const id = vista?.herramientas?.[0];
        if (!id) return avisar(`${HERRAMIENTAS_CODE[a.id]} todavía no tiene una herramienta equivalente en el OS`, true);
        if (!a.slug) return avisar('Elige un cliente para abrir esta herramienta', true);
        const { rutaHerramienta } = await import('../herramientas.js');
        location.hash = rutaHerramienta(vista.area, a.slug, id).slice(1);
        return;
      }
      const { rutaHerramienta, herramientaDe } = await import('../herramientas.js');
      if (!herramientaDe(a.id)) return avisar('No encontré esa herramienta', true);
      location.hash = rutaHerramienta(null, a.slug, a.id).slice(1);
      return;
    }
    case 'abrirEnChat': {
      if (a.borrador && location.hash.startsWith('#/chat') && (!a.modo || !email) && aLaCaja(a.borrador)) return;
      if (!email) return avisar('Abre el Chat para platicarlo', true);
      const { abrirEnChat } = await import('../areas.js');
      abrirEnChat(email, { modo: a.modo || 'libre', slug: a.slug, borrador: a.borrador });
      return;
    }
    case 'imprimir': {
      const { docView, docHead, html, raw, col, esc } = await import('../core.js');
      if (a.tipo === 'call-sheet') {
        const { callSheet } = await import('../production/planner.js');
        const x = await col('content').get(a.jornada).catch(() => null);
        if (!x) return avisar('No encontré esa grabación', true);
        const c = callSheet(x, { marca: a.slug || x.profile || '' }), d = (s) => s || '—', l = (xs) => (xs.length ? xs.join(', ') : '—');
        return docView(html`<div class="pl-cs">${docHead(`Hoja de preproducción · ${c.titulo || 'Jornada'}`, `${c.marca} · ${c.fecha || ''}`)}
          <dl class="pl-cs-d"><dt>Fecha</dt><dd>${d(c.fecha)}</dd><dt>Call time</dt><dd>${d(c.call)}</dd><dt>Locación</dt><dd>${d(c.locacion)}</dd><dt>Crew</dt><dd>${l(c.crew)}</dd><dt>Talento</dt><dd>${l(c.talento)}</dd><dt>Equipo</dt><dd>${l(c.equipo)}</dd><dt>Contacto</dt><dd>${d(c.contacto)}</dd></dl>
          <table class="pl-cs-t"><thead><tr><th>Hora</th><th>Escena</th><th>Pieza</th><th>Acción</th><th>Plano</th><th>Lugar</th><th>Min</th></tr></thead><tbody>${c.orden.map((e) => html`<tr><td>${e.inicio || '--:--'}</td><td>${e.id}</td><td>${e.id_creativo}</td><td>${e.accion}</td><td>${e.plano}</td><td>${e.lugar}</td><td>${e.min ?? ''}</td></tr>`)}</tbody></table>
          ${c.notas ? html`<p><b>Notas:</b> ${c.notas}</p>` : ''}</div>`);
      }
      // La tarjeta misma, como documento: se copia su HTML ya escapado (salió de genui) sin los botones.
      const b = el?.closest('.gu'); if (!b) return avisar('No hay nada que imprimir', true);
      const copia = b.cloneNode(true); copia.querySelectorAll('button, .gu-acts, .lm-ops').forEach((n) => n.remove());
      return docView(html`${docHead(esc(a.titulo || 'Del Chat'), new Date().toLocaleDateString('es-GT'))}${raw(copia.innerHTML)}`);
    }
    case 'crearTarea': {
      if (!ctx.me) return avisar('No sé quién eres: recarga el OS', true);
      const [{ newTask }, { teamList, col }] = await Promise.all([import('../create.js'), import('../core.js')]);
      const [team, projects] = await Promise.all([teamList().catch(() => []), col('projects').list().catch(() => [])]);
      return newTask({ team, me: ctx.me, projects, pre: { title: a.titulo } }); // el formulario de siempre: la persona confirma
    }
    case 'copiar': {
      const t = a.texto || textoDeBloque(el);
      try { await navigator.clipboard.writeText(t); avisar('Copiado'); } catch { avisar('No se pudo copiar', true); }
      return;
    }
    case 'pedir': if (!aLaCaja(a.texto)) avisar('Abre el Chat para escribirlo', true); return;
    case 'guardarEnHerramienta': {
      const { guardarEnDestino } = await import('../vacio-chat.js');
      return guardarEnDestino(a, { avisar });
    }
  }
}

// Un solo oyente para todo el documento: cualquier [data-gu-acc] (genui, sugerencias, vacíos) pasa por aquí.
let instalado = false;
export function instalarAccionesUi(raiz = typeof document !== 'undefined' ? document : null) {
  if (!raiz || instalado) return; instalado = true;
  raiz.addEventListener('click', (e) => {
    const b = e.target.closest?.('[data-gu-acc]'); if (!b || b.disabled) return;
    e.preventDefault();
    let args = {}; try { args = JSON.parse(b.dataset.guArgs || '{}'); } catch { /* sin args */ }
    ejecutarAccion(b.dataset.guAcc, args, { el: b });
  });
}
