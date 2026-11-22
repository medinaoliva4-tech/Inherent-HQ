// Studio (#/studio): donde se hace el contenido. Hoy: Curva de retención, Mejores clips (Inherent Media) y Modelo (calibración).
// La curva no es una animación: la calcula el servidor con el modelo de public/js/studio/retencion.js y aquí se dibuja tal cual
// (la curva de «quién sigue viendo», la emoción, y las caídas con su razón y qué hacer). Sin datos, no inventa: lo dice.
import { api, skel, toast } from '../core.js';
import { h } from '../kit/dom.js';
import { cargarContexto, contextoLista, contextoActual } from '../contexto.js';

export const esqueleto = () => skel('pagina');
const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, ...hijos) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); n.append(...hijos.flat().filter(Boolean)); return n; };
const pct = (x) => (x == null ? '—' : `${Math.round(x * 100)} %`);
const seg = (s) => { const m = Math.floor(s / 60), x = Math.round(s % 60); return m ? `${m}:${String(x).padStart(2, '0')}` : `${x} s`; };

// ---- La gráfica: retención (área), emoción (línea) y caídas (bandas) ----
export function grafica(r) {
  const W = 640, H = 220, P = { l: 36, r: 10, t: 12, b: 24 }, T = r.duracion_s, x = (t) => P.l + (t / T) * (W - P.l - P.r), y = (v) => P.t + (1 - v) * (H - P.t - P.b);
  const ret = [`M${x(0)},${y(1)}`, ...r.curva.map((c) => `L${x(c.t + 1)},${y(c.retencion)}`)], area = `${ret.join(' ')} L${x(T)},${y(0)} L${x(0)},${y(0)} Z`;
  const emo = r.curva.map((c, i) => `${i ? 'L' : 'M'}${x(c.t + 0.5)},${y(c.emocion)}`).join(' ');
  const el = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'st-graf', role: 'img', 'aria-label': `Retención prevista: empieza en 100 % y termina en ${pct(r.resumen.retencion_final)}. ${r.caidas.length} caída(s) marcada(s).` },
    ...[0, 0.25, 0.5, 0.75, 1].map((v) => svg('g', {}, svg('line', { x1: P.l, x2: W - P.r, y1: y(v), y2: y(v), class: 'st-rej' }), svg('text', { x: P.l - 6, y: y(v) + 4, class: 'st-eje', 'text-anchor': 'end' }, `${Math.round(v * 100)}%`))),
    ...r.caidas.map((c) => svg('rect', { x: x(c.t0), y: P.t, width: Math.max(3, x(c.t1) - x(c.t0)), height: H - P.t - P.b, class: 'st-caida' }, svg('title', {}, `${seg(c.t0)}–${seg(c.t1)} · ${c.detalle}. ${c.accion}`))),
    svg('path', { d: area, class: 'st-area' }), svg('path', { d: ret.join(' '), class: 'st-linea' }), svg('path', { d: emo, class: 'st-emo' }),
    ...[0, 0.5, 1].map((f) => svg('text', { x: x(T * f), y: H - 6, class: 'st-eje', 'text-anchor': f === 0 ? 'start' : f === 1 ? 'end' : 'middle' }, seg(T * f))));
  return el;
}
const leyenda = () => h('p', { class: 'st-ley' }, h('span', { class: 'st-sw st-sw-ret' }), ' Quién sigue viendo ', h('span', { class: 'st-sw st-sw-emo' }), ' Carga emocional ', h('span', { class: 'st-sw st-sw-cai' }), ' Caída');

function pestanaRetencion(cuerpo) {
  const guion = h('textarea', { id: 'st-guion', rows: 8, placeholder: 'Pega tu guion (o una transcripción en SRT/VTT con tiempos)…', 'aria-label': 'Guion o transcripción' });
  const cada = h('input', { id: 'st-cada', type: 'number', min: '0', step: '0.5', placeholder: 'seg', 'aria-label': 'Un corte cada cuántos segundos' });
  const salida = h('div', { class: 'st-sal', 'aria-live': 'polite' });
  const correr = h('button', { type: 'button', class: 'btn' }, 'Calcular retención');
  correr.addEventListener('click', async () => {
    const texto = guion.value.trim(); if (!texto) { guion.focus(); return; }
    correr.disabled = true; salida.replaceChildren(h('p', { class: 'st-mut' }, 'Calculando…'));
    try {
      const esSrt = /-->/.test(texto), b = esSrt ? { srt: texto } : { texto };
      const r0 = await api('studio/retencion', { method: 'POST', body: b });
      let r = r0; // con una cadencia de cortes, se vuelve a calcular con ellos (los cortes reales los da ffmpeg)
      if (+cada.value > 0 && r0.duracion_s) { const cortes = Array.from({ length: Math.floor(r0.duracion_s / +cada.value) }, (_, i) => (i + 1) * +cada.value); r = await api('studio/retencion', { method: 'POST', body: { ...b, cortes } }); }
      pintar(r);
    } catch (e) { salida.replaceChildren(h('p', { class: 'st-err', role: 'alert' }, e.message || 'No se pudo calcular')); } finally { correr.disabled = false; }
  });
  function pintar(r) {
    if (!r.resumen) { salida.replaceChildren(h('p', { class: 'st-vacio' }, r.advertencias?.[0] || '⚠️ SIN DATOS')); return; }
    const s = r.resumen;
    salida.replaceChildren(
      h('div', { class: 'st-cifras' }, ...[['Gancho (0–3 s)', pct(s.gancho)], ['Siguen a los 3 s', pct(s.retencion_3s)], ['Retención media', pct(s.retencion_media)], ['Terminan', pct(s.retencion_final)]].map(([k, v]) => h('div', { class: 'st-cifra' }, h('b', {}, v), h('span', {}, k)))),
      grafica(r), leyenda(),
      r.caidas.length ? h('div', { class: 'st-lista' }, h('h3', {}, 'Dónde se cae y qué hacer'), r.caidas.map((c) => h('article', { class: 'st-card' }, h('b', {}, `${seg(c.t0)}–${seg(c.t1)}`), h('p', {}, c.detalle), h('p', { class: 'st-acc' }, c.accion), h('button', { type: 'button', class: 'btn ghost', onClick: async () => { try { await navigator.clipboard.writeText(`${seg(c.t0)}: ${c.accion}`); toast('Copiado'); } catch { toast('No pude copiar', true); } } }, 'Copiar nota')))) : h('p', { class: 'st-mut' }, 'No se marcó ninguna caída fuerte.'),
      ...r.advertencias.map((a) => h('p', { class: 'st-aviso' }, a)), h('p', { class: `st-evi st-evi-${r.evidencia.confianza}` }, r.evidencia.etiqueta));
  }
  cuerpo.replaceChildren(h('div', { class: 'st-form' }, guion, h('label', { class: 'st-fila' }, 'Corte cada ', cada, ' s ', h('small', {}, '(opcional: sin esto, la curva ignora los cortes y lo avisa)')), correr), salida);
}

function pestanaClips(cuerpo) {
  const srt = h('textarea', { rows: 8, placeholder: 'Pega la transcripción del episodio en SRT/VTT (con tiempos)…', 'aria-label': 'Transcripción con tiempos' });
  const salida = h('div', { class: 'st-sal', 'aria-live': 'polite' }), btn = h('button', { type: 'button', class: 'btn' }, 'Buscar los mejores momentos');
  btn.addEventListener('click', async () => {
    if (!srt.value.trim()) { srt.focus(); return; } btn.disabled = true; salida.replaceChildren(h('p', { class: 'st-mut' }, 'Analizando…'));
    try {
      const r = await api('studio/clips', { method: 'POST', body: { srt: srt.value, n: 5 } });
      salida.replaceChildren(r.clips.length ? h('div', { class: 'st-lista' }, r.clips.map((c, i) => h('article', { class: 'st-card' }, h('b', {}, `#${i + 1} · ${seg(c.t0)}–${seg(c.t1)} · ${Math.round(c.duracion)} s`), h('p', { class: 'st-mut' }, `Puntaje ${pct(c.puntaje)} · gancho ${pct(c.gancho)} · retención prevista ${pct(c.retencion_media)}`), h('p', {}, c.texto.slice(0, 220) + (c.texto.length > 220 ? '…' : '')), h('p', { class: 'st-acc' }, c.porQue.join(' · ')), h('button', { type: 'button', class: 'btn ghost', onClick: async () => { try { await navigator.clipboard.writeText(`${seg(c.t0)}–${seg(c.t1)}`); toast('Tiempos copiados'); } catch { toast('No pude copiar', true); } } }, 'Copiar tiempos')))) : h('p', { class: 'st-vacio' }, r.advertencias?.[0] || 'No encontré un tramo que se sostenga solo.'), ...(r.advertencias || []).map((a) => h('p', { class: 'st-aviso' }, a)));
    } catch (e) { salida.replaceChildren(h('p', { class: 'st-err', role: 'alert' }, e.message || 'No se pudo analizar')); } finally { btn.disabled = false; }
  });
  cuerpo.replaceChildren(h('div', { class: 'st-form' }, srt, btn), salida);
}

async function pestanaModelo(cuerpo, me) {
  let m; try { m = await api('studio/retencion/modelo'); } catch (e) { cuerpo.replaceChildren(h('p', { class: 'st-err' }, e.message)); return; }
  const puede = ['ceo', 'coo'].includes(me.role), out = h('p', { class: 'st-mut' });
  const btn = h('button', { type: 'button', class: 'btn', disabled: !puede }, 'Calibrar con la retención real');
  btn.addEventListener('click', async () => { btn.disabled = true; try { const r = await api('studio/retencion/calibrar', { method: 'POST', body: {} }); out.textContent = `${r.calibrado ? '✓ Calibrado' : 'No se calibró'}: ${r.motivo}`; } catch (e) { out.textContent = e.message; } btn.disabled = !puede; });
  cuerpo.replaceChildren(h('div', { class: 'st-form' }, h('p', {}, m.modelo.calibrado ? `Modelo calibrado con ${m.modelo.muestras} videos (error fuera de muestra ${m.modelo.error_fuera_de_muestra}).` : 'El modelo usa los pesos de partida: sirve para comparar guiones, no para prometer cifras.'),
    h('p', { class: 'st-mut' }, `Muestras de retención real guardadas: ${m.muestras}. Hacen falta al menos 5; con más, mejora. ${puede ? '' : 'Solo el CEO o el COO calibran.'}`), btn, out));
}


// ---- Ideación: lo que mejor funcionó en el nicho → el formato → alineado a ESTA marca → idea lista → «+ al shot list» ----
const mesActual = () => new Date().toISOString().slice(0, 7);
function tarjetaIdea(idea, slug, temporada) {
  const e = JSON.parse(JSON.stringify(idea)), estado = h('p', { class: 'st-mut', role: 'status' });
  const gancho = h('input', { class: 'st-in', value: e.gancho, 'aria-label': 'Gancho' });
  gancho.addEventListener('input', () => { e.gancho = gancho.value; });
  const escenas = e.guion.map((s, i) => {
    const acc = h('textarea', { rows: 2, class: 'st-in', 'aria-label': `Escena ${i + 1}: acción` }), dia = h('input', { class: 'st-in', placeholder: 'Diálogo o texto en pantalla', 'aria-label': `Escena ${i + 1}: diálogo` });
    acc.value = s.accion || ''; dia.value = s.dialogo || '';
    acc.addEventListener('input', () => { e.guion[i].accion = acc.value; }); dia.addEventListener('input', () => { e.guion[i].dialogo = dia.value; });
    return h('li', {}, h('b', {}, `${i + 1}. ${s.escena}${s.duracion_s ? ` · ${s.duracion_s} s` : ''}`), acc, dia);
  });
  const btn = h('button', { type: 'button', class: 'btn' }, `+ Al shot list de ${temporada}`);
  btn.addEventListener('click', async () => {
    btn.disabled = true; estado.textContent = 'Agregando…';
    try { const r = await api(`ideacion/${encodeURIComponent(slug)}/al-shotlist`, { method: 'POST', body: { idea: e, temporada } }); estado.textContent = r.agregadas ? `✓ Agregué ${r.agregadas} escena(s) al shot list de ${temporada}.` : 'Esta idea ya estaba en el shot list.'; toast(r.agregadas ? 'Agregada al shot list' : 'Ya estaba'); }
    catch (x) { estado.textContent = x.message || 'No se pudo agregar'; btn.disabled = false; return; }
    btn.disabled = false;
  });
  const chips = (xs) => h('div', { class: 'st-chips' }, xs.map((x) => h('span', { class: 'st-chip' }, x)));
  return h('article', { class: 'st-card st-idea' },
    h('p', { class: 'st-mut' }, `${e.formato?.nombre || 'Formato'}${e.pilar ? ` · pilar ${e.pilar}` : ''} · encaje ${e.puntos}/100`), gancho, h('p', { class: 'st-evi' }, e.evidencia),
    e.adaptacion?.length ? h('div', {}, h('b', {}, 'Qué adaptar a tu marca'), h('ul', { class: 'st-ul' }, e.adaptacion.map((x) => h('li', {}, x)))) : '',
    h('ol', { class: 'st-escenas' }, escenas),
    e.gente?.length ? h('div', {}, h('b', {}, 'Quién sale'), h('ul', { class: 'st-ul' }, e.gente.map((g) => h('li', {}, `${g.rol}: ${g.perfil}`)))) : '',
    e.props?.length ? h('div', {}, h('b', {}, 'Qué se necesita'), chips(e.props)) : '',
    e.fuente?.url ? h('p', { class: 'st-mut' }, 'Fuente: ', h('a', { href: e.fuente.url, target: '_blank', rel: 'noopener noreferrer' }, e.fuente.handle ? `@${e.fuente.handle}` : e.fuente.url), e.fuente.red ? ` · ${e.fuente.red}` : '') : '',
    h('div', { class: 'st-acciones' }, btn), estado);
}
async function pestanaIdeas(cuerpo, me) {
  await cargarContexto(me).catch(() => null);
  const marcas = contextoLista().filter((c) => c.slug && c.slug !== 'personal'), actual = contextoActual(me) || marcas[0]?.slug || '';
  const sel = h('select', { class: 'st-in', 'aria-label': 'Marca' }, marcas.map((c) => h('option', { value: c.slug, selected: c.slug === actual }, c.name || c.slug)));
  const mes = h('input', { class: 'st-in', value: mesActual(), pattern: '\\d{4}-\\d{2}', 'aria-label': 'Temporada (AAAA-MM)', size: 8 });
  const salida = h('div', { class: 'st-sal', 'aria-live': 'polite' }), go = h('button', { type: 'button', class: 'btn' }, 'Generar ideas');
  go.addEventListener('click', async () => {
    if (!sel.value) { toast('Elige una marca', true); return; } go.disabled = true; salida.replaceChildren(h('p', { class: 'st-mut' }, 'Buscando lo que mejor funcionó en el nicho…'));
    try {
      const r = await api(`ideacion/${encodeURIComponent(sel.value)}/generar`, { method: 'POST', body: { temporada: mes.value, max: 6 } });
      salida.replaceChildren(...(r.ideas.length ? [h('p', { class: 'st-mut' }, `${r.ideas.length} idea(s) de ${r.resumen?.posts ?? '—'} publicaciones del nicho. Edita lo que quieras y agrégalas al shot list.`), ...r.ideas.map((i) => tarjetaIdea(i, sel.value, mes.value))] : [h('p', { class: 'st-vacio' }, r.aviso || '⚠️ SIN DATOS · corre el radar')]));
    } catch (e) { salida.replaceChildren(h('p', { class: 'st-err', role: 'alert' }, e.message || 'No se pudo generar')); } finally { go.disabled = false; }
  });
  cuerpo.replaceChildren(h('div', { class: 'st-form' }, h('p', { class: 'st-mut' }, 'Toma lo que mejor funcionó en el nicho (según el radar), saca su formato, lo alinea a lo que tu marca puede decir y te da la idea lista para grabar.'),
    h('div', { class: 'st-fila' }, 'Marca ', sel, ' Temporada ', mes, go)), salida);
}

const PESTANAS = [['ideas', 'Ideación'], ['retencion', 'Curva de retención'], ['clips', 'Mejores clips'], ['modelo', 'Modelo']];
export async function render(el, { me, rest = [] }) {
  const cur = PESTANAS.some(([k]) => k === rest[0]) ? rest[0] : 'ideas', cuerpo = h('div', { class: 'st-cuerpo' });
  el.replaceChildren(h('div', { class: 'st' }, h('header', { class: 'st-h' }, h('h1', {}, 'Studio'), h('p', {}, 'Para saber si un video retiene antes de grabarlo, y sacar los mejores momentos de lo que ya grabaste.')),
    h('nav', { class: 'st-tabs', role: 'tablist' }, PESTANAS.map(([k, n]) => h('a', { href: `#/studio/${k}`, role: 'tab', class: k === cur ? 'on' : '', 'aria-selected': String(k === cur) }, n))), cuerpo));
  if (cur === 'ideas') await pestanaIdeas(cuerpo, me); else if (cur === 'retencion') pestanaRetencion(cuerpo); else if (cur === 'clips') pestanaClips(cuerpo); else await pestanaModelo(cuerpo, me);
}
