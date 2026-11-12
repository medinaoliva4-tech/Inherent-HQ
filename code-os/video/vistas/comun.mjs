// Utilidades compartidas por las tres vistas de video (estilo de marca, referencias, desglose).
// Parámetros de la URL: ?marca=<id> &video=<id> &api=<url del servicio> &t=<token>. Dentro de Code OS se cargan en un
// iframe (panel Herramientas → Video) y avisan al padre por postMessage (ver code-os/docs/video.md → «Contrato»).
export const q = new URLSearchParams(location.search);
export const API = (q.get('api') ?? '').replace(/\/$/, '');
const TOKEN = q.get('t');
export const $ = (id) => document.getElementById(id);
export const h = (tag, props = {}, ...hijos) => { const e = Object.assign(document.createElement(tag), props); e.append(...hijos.flat().filter((x) => x != null && x !== false)); return e; };
export const medio = (ruta) => `${API}/medios?ruta=${encodeURIComponent(ruta)}${TOKEN ? `&t=${TOKEN}` : ''}`;
export const nombreArchivo = (r) => String(r).split('/').pop();
export const tiempo = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
export const duracionTxt = (s) => (s >= 60 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${Math.round(s * 10) / 10} s`);

export async function pedir(metodo, ruta, cuerpo) {
  const r = await fetch(API + ruta, { method: metodo, headers: { 'content-type': 'application/json', ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}) }, body: cuerpo && JSON.stringify(cuerpo) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error ?? `HTTP ${r.status}`), { estado: r.status });
  return j;
}

export function aviso(texto, ms = 2600) {
  let a = $('aviso'); if (!a) { a = h('div', { id: 'aviso', className: 'aviso' }); document.body.append(a); }
  a.textContent = texto; a.classList.add('ver'); clearTimeout(aviso.t); aviso.t = setTimeout(() => a.classList.remove('ver'), ms);
}

/** Avisa al contenedor (Code OS). tipo: 'prompt' (texto para el chat del agente) | 'cambio' (se guardó algo). */
export function alPadre(tipo, datos) {
  if (window.parent !== window) window.parent.postMessage({ fuente: 'code-os-video', tipo, ...datos }, '*');
}

/** Copia un prompt para el agente y se lo ofrece al chat de Code OS si la vista está dentro. */
export async function copiarPrompt(texto) {
  alPadre('prompt', { texto });
  try { await navigator.clipboard.writeText(texto); } catch { const t = h('textarea', { value: texto, style: 'position:fixed;opacity:0' }); document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
  aviso('Prompt copiado: pégaselo al agente');
}

/** Selector de marca: fijo si viene ?marca=, si no un select con las marcas. */
export async function elegirMarca(contenedor, alCambiar) {
  const { marcas } = await pedir('GET', '/marcas');
  let actual = q.get('marca') ?? marcas[0]?.id ?? null;
  if (!q.get('marca') && marcas.length > 1) {
    const s = h('select', { className: 'campo' }, marcas.map((m) => h('option', { value: m.id, textContent: m.nombre, selected: m.id === actual })));
    s.onchange = () => { actual = s.value; alCambiar(actual); };
    contenedor.append(s);
  }
  return { marcas, actual };
}

/** Nombre legible de un estilo aplicado a una escena, buscándolo en el catálogo (por su receta). */
export function nombreEstilo(s, catalogo) {
  const todos = [...(catalogo.transiciones ?? []), ...(catalogo.efectos ?? []), ...(catalogo.animaciones_texto ?? [])];
  const igual = (r) => r && r.tipo === s.tipo && Object.entries(r).every(([k, v]) => s[k] === v);
  const x = todos.find((c) => igual(c.receta));
  if (x) return { id: x.id, nombre: x.nombre };
  if (s.tipo === 'zoom') return { nombre: s.desde === s.hasta ? `Zoom fijo ${Math.round(s.desde * 100)} %` : `Zoom ${Math.round(s.desde * 100)}→${Math.round(s.hasta * 100)} %` };
  if (s.tipo === 'transicion') return { nombre: s.entrada === 'fundido' ? `Fundido ${s.duracion} s` : 'Corte directo' };
  if (s.tipo === 'animacion-capa') return { id: { subir: 'imagen-sube', abanico: 'imagen-abanico', flotar: 'imagen-flota' }[s.animacion], nombre: `${s.capa} ${{ subir: 'sube', abanico: 'en abanico', flotar: 'flota', aparecer: 'aparece' }[s.animacion]}` };
  if (s.tipo === 'animacion-texto') return { id: s.animacion, nombre: `Texto ${s.animacion === 'subir' ? 'sube' : 'aparece'}` };
  if (s.tipo === 'detras-de-persona') return { id: 'detras-de-persona', nombre: `Detrás de la persona${s.mascara ? '' : ' (falta recorte)'}` };
  if (s.tipo === 'color') return { nombre: `Color ${s.preset}` };
  return { nombre: s.tipo };
}

/** Muestra animada de un elemento del catálogo (transición, efecto o animación de texto). Solo CSS. */
export function muestra(seccion, item) {
  const m = h('div', { className: 'muestra' }, h('div', { className: 'a' }), h('div', { className: 'b' }));
  const b = m.querySelector('.b'), a = m.querySelector('.a');
  const anim = (el, k) => el.animate(k, { duration: 2400, iterations: Infinity, easing: 'ease-in-out' });
  const r = item.receta ?? {};
  if (seccion === 'transiciones') {
    if (item.id === 'corte') anim(b, [{ opacity: 0 }, { opacity: 0, offset: 0.49 }, { opacity: 1, offset: 0.5 }, { opacity: 1 }]);
    else if (r.entrada === 'fundido') anim(b, [{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1, offset: 0.35 + Math.min(0.4, r.duracion / 2) }, { opacity: 1 }]);
    else if (item.id === 'deslizar' || item.id === 'barrido') anim(b, [{ transform: 'translateX(100%)', filter: item.id === 'barrido' ? 'blur(6px)' : 'none' }, { transform: 'translateX(100%)', offset: 0.35 }, { transform: 'translateX(0)', filter: 'none', offset: 0.6 }, { transform: 'translateX(0)' }]);
    else if (item.id === 'zoom-entrada') anim(b, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(.2)', opacity: 0, offset: 0.35 }, { transform: 'scale(1)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }]);
    else if (item.id === 'destello') { const f = h('div', { style: 'position:absolute;inset:0;background:#fff;opacity:0' }); m.append(f); anim(f, [{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 0.9, offset: 0.5 }, { opacity: 0, offset: 0.6 }, { opacity: 0 }]); anim(b, [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1, offset: 0.51 }, { opacity: 1 }]); }
    else anim(b, [{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1, offset: 0.7 }, { opacity: 1 }]); // fundido cruzado
  } else if (seccion === 'efectos') {
    b.remove();
    if (r.tipo === 'zoom') anim(a, [{ transform: `scale(${r.desde})` }, { transform: `scale(${r.hasta})` }]);
    else if (r.tipo === 'color') a.style.filter = { calido: 'sepia(.35) saturate(1.3)', frio: 'hue-rotate(160deg) saturate(.8)', contraste: 'contrast(1.4) saturate(1.3)', bn: 'grayscale(1)' }[r.preset];
    else {
      const ficha = h('div', { style: 'position:absolute;width:30%;aspect-ratio:3/4;left:35%;top:16%;border-radius:6px;background:linear-gradient(150deg,#f3ead8,#c99a74);box-shadow:0 4px 12px rgba(0,0,0,.4)' });
      m.append(ficha);
      if (r.animacion === 'flotar') anim(ficha, [{ transform: 'translateY(-4px)' }, { transform: 'translateY(4px)' }, { transform: 'translateY(-4px)' }]);
      else if (r.animacion === 'abanico') anim(ficha, [{ transform: 'translateY(30px) rotate(0)', opacity: 0 }, { transform: 'translateY(0) rotate(-12deg)', opacity: 1, offset: 0.4 }, { transform: 'translateY(0) rotate(-12deg)', opacity: 1 }]);
      else if (r.animacion === 'subir') anim(ficha, [{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: 0.4 }, { transform: 'translateY(0)', opacity: 1 }]);
      else if (r.tipo === 'detras-de-persona') { ficha.style.cssText += ';width:44%;left:28%;top:10%;border-radius:50%;background:#e9a35c'; m.append(h('div', { style: 'position:absolute;left:38%;bottom:-8%;width:24%;height:70%;border-radius:40% 40% 10% 10%;background:#1b1714;border:1px solid rgba(243,234,216,.35)' })); }
      else ficha.style.opacity = '.5';
    }
  } else {
    b.remove();
    const t = h('div', { className: 't', textContent: 'Aa' }); m.append(t);
    if (item.id === 'caja') Object.assign(t.style, { inset: 'auto', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', background: 'var(--crema)', color: 'var(--tinta)', padding: '2px 10px', borderRadius: '5px', textShadow: 'none' });
    else if (item.id === 'subir') anim(t, [{ transform: 'translateY(14px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: 0.3 }, { opacity: 1 }]);
    else if (item.id === 'rebote') anim(t, [{ transform: 'scale(.4)' }, { transform: 'scale(1.15)', offset: 0.2 }, { transform: 'scale(1)', offset: 0.3 }, { transform: 'scale(1)' }]);
    else if (item.id === 'maquina-escribir' || item.id === 'palabra-por-palabra') anim(t, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)', offset: 0.6 }, { clipPath: 'inset(0 0 0 0)' }]);
    else anim(t, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1 }]);
  }
  return m;
}
