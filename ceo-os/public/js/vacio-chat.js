// El estado vacío conversacional: cuando una herramienta o pantalla no tiene datos, en vez de una pantalla vacía dice «Esto aún no
// se ha creado. ¿Platicamos para crearlo?» y abre el Chat del modo o área con un borrador y 2–3 preguntas guía (areas.js ·
// abrirEnChat). Muestra el avance por temas («0 de 3»).
// El regreso (docs/herramienta-montable.md · «Lo platicado vuelve a la herramienta»): el agente cierra con un bloque ```ui con
// Guardar(destino, slug, {datos}, resumen); la persona lo revisa y hace clic en Guardar; guardarEnDestino agrega (nunca borra) lo
// aprobado en la herramienta por su API. Los destinos viven en DESTINOS: uno por herramienta que ya tiene API en el OS.
// Puro hasta «Navegador» (lo prueba scripts/test-openui.mjs).
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const corta = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

// Cada destino: nombre, el contrato de sus datos (limpiar → datos o null) y cómo se guarda (agrega a lo que ya hay).
const URL_VIDEO = /^https:\/\/(?:www\.)?(?:instagram\.com\/(?:p|reel|reels)\/|tiktok\.com\/@[^/]+\/video\/|youtube\.com\/shorts\/)[\w./?=&@-]+$/i;
export const DESTINOS = {
  'referencias-video': {
    nombre: 'Referencias de video', modo: 'produccion',
    // datos: { videos: { "<pilar>": ["https://www.instagram.com/reel/…", …] } } · hasta 5 por pilar (como la pantalla).
    limpiar(d) {
      const v = d?.videos && typeof d.videos === 'object' ? d.videos : null; if (!v) return null;
      const out = {};
      for (const [p, xs] of Object.entries(v).slice(0, 12)) { const urls = (Array.isArray(xs) ? xs : []).map((u) => corta(u, 300)).filter((u) => URL_VIDEO.test(u)).slice(0, 5); if (urls.length) out[corta(p, 80)] = urls; }
      return Object.keys(out).length ? { videos: out } : null;
    },
    unir: (antes, nuevo) => { const v = { ...(antes?.videos || {}) }; for (const [p, xs] of Object.entries(nuevo.videos)) v[p] = [...new Set([...(v[p] || []), ...xs])].slice(0, 5); return { videos: v }; },
    leer: (api, slug) => api(`content/refs?profile=${encodeURIComponent(slug)}`).then((r) => ({ videos: r.videos || {} })),
    escribir: (api, slug, d) => api('content/refs', { method: 'PUT', body: { profile: slug, videos: d.videos } }),
  },
};
export function limpiarGuardado({ destino, slug, datos } = {}) {
  const D = DESTINOS[destino]; if (!D || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(String(slug || ''))) return null;
  const d = D.limpiar(datos); return d ? { destino, slug, datos: d } : null;
}

// Las preguntas guía de cada tema vacío que ya se usa (VACIOS) — el mismo objeto sirve de opciones para vacioChat.
export const VACIOS = {
  'referencias-video': {
    tema: 'Referencias de video', modo: 'produccion', destino: 'referencias-video',
    preguntas: ['¿Qué pilares queremos cubrir este mes y qué debe sentir quien ve cada uno?', '¿Qué cuentas o videos ya te gustan (links de Reels o TikToks) y por qué?', '¿Qué no queremos parecer: estilos, ritmos o formatos que no van con la marca?'],
  },
};

// El borrador que queda en la caja del Chat (la persona lo revisa y lo manda). Pide al agente ir pregunta por pregunta y cerrar
// con la propuesta para guardar.
export function borradorVacio({ tema, preguntas = [], destino = '', slug = '' } = {}) {
  const ps = preguntas.map((p) => corta(p, 200)).filter(Boolean).slice(0, 3);
  return [`Vamos a crear ${corta(tema, 80).toLowerCase() || 'esto'}${slug ? ` de ${slug}` : ''}: todavía no existe. Hazme estas preguntas una por una y espera mi respuesta:`,
    ...ps.map((p, i) => `${i + 1}. ${p}`),
    destino && DESTINOS[destino] ? `Al terminar, muéstrame un Checklist con los ${ps.length} temas y propón guardarlo con Guardar("${destino}", "${slug}", {…}, "resumen") para que yo lo apruebe.` : 'Al terminar, resúmelo para que yo lo apruebe.',
  ].join('\n');
}
export const avance = (hechos, total) => `${Math.max(0, Math.min(hechos | 0, total))} de ${total}`;

// El HTML del vacío (ya escapado). boton → data-gu-acc="abrirEnChat" (lo corre llm/acciones-os.js con el clic).
export function vacioChatHtml({ tema = '', preguntas = [], modo = '', slug = '', destino = '', hechos = 0 } = {}, icono = () => '') {
  const ps = preguntas.map((p) => corta(p, 200)).filter(Boolean).slice(0, 3);
  const args = { modo, slug, borrador: borradorVacio({ tema, preguntas: ps, destino, slug }) };
  return `<section class="vch" aria-label="${esc(tema)} sin crear"><div class="vch-cab"><span class="vch-ic" aria-hidden="true">${icono('chat')}</span><div><b>Esto aún no se ha creado. ¿Platicamos para crearlo?</b><span>${esc(tema)} · ${esc(avance(hechos, ps.length))} temas</span></div></div>`
    + `<ol class="vch-ps">${ps.map((p, i) => `<li class="${i < hechos ? 'hecho' : ''}">${esc(p)}</li>`).join('')}</ol>`
    + `<div class="vch-acts"><button type="button" class="btn vch-b" data-gu-acc="abrirEnChat" data-gu-args="${esc(JSON.stringify(args))}">Platicarlo en el Chat</button><span class="mut sm">Lo platicado vuelve aquí cuando lo apruebes.</span></div></section>`;
}

// ---------- Navegador ----------
const KA = (destino, slug) => `os.vacio.${destino}.${slug}`;
export function hechosDe(destino, slug) { try { return +localStorage.getItem(KA(destino, slug)) || 0; } catch { return 0; } }
// Monta el vacío en `el`. Las acciones pasan por el oyente único de acciones-os.js.
export async function vacioChat(el, o = {}) {
  const [{ instalarAccionesUi }, { svgIco }] = await Promise.all([import('./llm/acciones-os.js'), import('./iconos.js').catch(() => ({ svgIco: () => '' }))]);
  instalarAccionesUi();
  el.innerHTML = vacioChatHtml({ ...o, hechos: o.hechos ?? hechosDe(o.destino, o.slug) }, (n) => { try { return svgIco(n, 18); } catch { return ''; } });
}
// Lo corre la acción guardarEnHerramienta (el clic en «Guardar» de la propuesta del agente). Lee lo que hay, agrega, escribe.
export async function guardarEnDestino(a, { avisar = () => {} } = {}) {
  const g = limpiarGuardado(a); if (!g) return avisar('La propuesta no trae datos que se puedan guardar', true);
  const D = DESTINOS[g.destino], { api } = await import('./core.js');
  try {
    const antes = await D.leer(api, g.slug).catch(() => ({}));
    await D.escribir(api, g.slug, D.unir(antes, g.datos));
    try { localStorage.setItem(KA(g.destino, g.slug), String(VACIOS[g.destino]?.preguntas.length || 0)); } catch { /* sin avance */ }
    window.dispatchEvent(new CustomEvent('os:dato', { detail: { herramienta: g.destino, slug: g.slug } }));
    avisar(`Guardado en ${D.nombre}`);
  } catch (e) { avisar(e.message || 'No se pudo guardar', true); }
}
