// Ajustes › Canales (#/ajustes/canales): Telegram, WhatsApp e iMessage con su estado REAL (GET /api/canales: ready · disconnected ·
// needs_permission y la razón tal cual), vincular con un código de un solo uso (10 min) y qué decisiones llegan por ahí.
// Esta pantalla no manda mensajes: solo pide el código y muestra el estado. Las reglas están en docs/CANALES.md y api/_lib/canales.js.
import { api, toast } from './core.js';
import { h } from './kit/dom.js';

const INFO = {
  telegram: { nombre: 'Telegram', ic: '✈', sub: 'Tus decisiones, con botones', vincula: true },
  whatsapp: { nombre: 'WhatsApp', ic: '✆', sub: 'Por la vía oficial de Meta', vincula: true },
  imessage: { nombre: 'iMessage', ic: '✉', sub: 'Mensajes de Apple', vincula: false },
};
// El motivo en palabras de persona; el motivo técnico (variables del servidor) queda en «Detalle técnico», plegado.
const HUMANO = {
  telegram: { disconnected: 'Falta conectar el bot de Telegram.', needs_permission: 'El bot ya existe, pero faltan sus claves de seguridad.', ready: 'Listo: vincula tu cuenta y te llegan tus decisiones.' },
  whatsapp: { disconnected: 'Falta conectar un número de WhatsApp Business (la vía oficial de Meta).', needs_permission: 'El número ya está, pero faltan sus claves de seguridad.', ready: 'Listo: solo contesta dentro de las 24 h de tu último mensaje.' },
  imessage: { disconnected: 'Apple no tiene una vía oficial: haría falta un Mac encendido como puente.', needs_permission: 'Apple no tiene una vía oficial: haría falta un Mac encendido como puente.', ready: 'Listo.' },
};
const ESTADO = { ready: ['Listo', 'ok'], needs_permission: ['Falta un permiso', 'amb'], disconnected: ['Sin conectar', 'off'] };
const LLEGA = [['si', 'Lo que espera por ti', 'Con «Aprobar» y «Pedir cambios», con las mismas reglas que la web'], ['si', '/hoy · /decide · /ayuda · /baja', 'Tus decisiones, ayuda y desvincular'],
  ['no', 'Pauta, presupuesto y precio', 'Nunca se resuelven por mensaje: solo «Abrir en el OS»'], ['no', 'Costos y notas internas', 'No salen por ningún canal'], ['no', 'Gente sin vincular', 'El bot no le contesta a nadie más']];

export async function pintarCanales(box) {
  let datos = null, error = null, codigo = null, reloj = null;
  const zona = h('div', { class: 'cn' }); box.replaceChildren(zona);
  const cargar = async () => { try { datos = await api('canales'); error = null; } catch (e) { error = e; } pintar(); };
  const accion = (txt, fn, cls = '') => { const b = h('button', { type: 'button', class: `btn ${cls}` }, txt); b.addEventListener('click', async () => { b.disabled = true; try { await fn(); } catch (e) { toast(e.message || 'No se pudo', true); b.disabled = false; } }); return b; };

  // El código vivo: grande, con un anillo que se vacía en 10 minutos y un botón para copiar «/vincular XXXX-XXXX».
  function tarjetaCodigo() {
    if (!codigo) return '';
    const total = 10 * 60_000, NS = 'http://www.w3.org/2000/svg', R = 22, C = 2 * Math.PI * R;
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 52 52'); svg.setAttribute('class', 'cn-reloj'); svg.setAttribute('aria-hidden', 'true');
    const f = document.createElementNS(NS, 'circle'), v = document.createElementNS(NS, 'circle');
    for (const [c, k] of [[f, 'cn-r-f'], [v, 'cn-r-v']]) { c.setAttribute('cx', 26); c.setAttribute('cy', 26); c.setAttribute('r', R); c.setAttribute('class', k); }
    v.setAttribute('transform', 'rotate(-90 26 26)'); svg.append(f, v);
    const quedan = h('small', { 'aria-live': 'polite' });
    const tic = () => { const ms = new Date(codigo.expira).getTime() - Date.now(); if (ms <= 0) { codigo = null; clearInterval(reloj); pintar(); return; } v.setAttribute('stroke-dasharray', `${(ms / total) * C} ${C}`); const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000); quedan.textContent = `Vence en ${m}:${String(s).padStart(2, '0')} · sirve una vez`; };
    clearInterval(reloj); reloj = setInterval(() => { if (!zona.isConnected) { clearInterval(reloj); return; } tic(); }, 1000); tic();
    const copiar = h('button', { type: 'button', class: 'btn ghost' }, 'Copiar'); copiar.addEventListener('click', async () => { try { await navigator.clipboard.writeText(`/vincular ${codigo.codigo}`); toast('Copiado'); } catch { toast('Selecciónalo y cópialo', true); } });
    return h('div', { class: 'cn-cod' }, svg, h('div', {}, h('small', {}, `Mándale esto al bot de ${INFO[codigo.canal].nombre}`), h('b', { class: 'cn-cod-t' }, `/vincular ${codigo.codigo}`), quedan), copiar);
  }

  function tarjeta(c) {
    const i = INFO[c.id] || { nombre: c.id, ic: '•', sub: '' }, [et, tono] = ESTADO[c.estado] || [c.estado, 'off'];
    const acc = [];
    if (i.vincula && c.vinculado) acc.push(accion('Desvincular', async () => { await api('canales/desvincular', { method: 'POST', body: { canal: c.id } }); toast('Desvinculado'); codigo = null; await cargar(); }, 'ghost'));
    else if (i.vincula) { const b = accion(`Vincular ${i.nombre}`, async () => { const r = await api('canales/vincular', { method: 'POST', body: { canal: c.id } }); codigo = { ...r, canal: c.id }; pintar(); }); if (c.estado === 'disconnected') { b.disabled = true; b.title = HUMANO[c.id]?.[c.estado] || c.razon; } acc.push(b); }
    return h('article', { class: `cn-c cn-t-${tono}${c.vinculado ? ' cn-vin' : ''}` },
      h('header', {}, h('span', { class: 'cn-ic', 'aria-hidden': 'true' }, i.ic), h('span', {}, h('b', {}, i.nombre), h('small', {}, i.sub)), h('span', { class: `cn-pill cn-pill-${tono}` }, h('i', {}), et)),
      h('p', { class: 'cn-razon' }, HUMANO[c.id]?.[c.estado] || (c.estado === 'ready' ? 'Listo.' : 'Sin conectar.')),
      c.razon && c.estado !== 'ready' ? h('details', { class: 'cn-tec' }, h('summary', {}, 'Detalle técnico'), h('p', {}, c.razon)) : '',
      c.vinculado ? h('p', { class: 'cn-ok' }, '✓ Vinculado', c.desde ? ` desde ${String(c.desde).slice(0, 10)}` : '') : '',
      i.nota && c.estado !== 'disconnected' ? h('p', { class: 'cn-nota' }, i.nota) : '',
      acc.length ? h('div', { class: 'cn-acc' }, ...acc) : h('p', { class: 'cn-nota' }, 'Por ahora no se conecta.'));
  }

  function pintar() {
    const flujo = h('div', { class: 'cn-flujo', 'aria-label': 'Cómo llega una decisión' }, ...[['Decide', 'Algo espera por ti'], ['Tu canal', 'Te llega con botones'], ['Aprobar', 'Mismas reglas que la web']].flatMap(([t, s], k) => [k ? h('i', { class: 'cn-fl', 'aria-hidden': 'true' }, '→') : '', h('span', { class: 'cn-paso' }, h('b', {}, t), h('small', {}, s))]).filter(Boolean));
    const reglas = h('section', { class: 'cn-reglas' }, h('header', {}, h('b', {}, 'Qué llega por aquí')), flujo,
      h('ul', {}, LLEGA.map(([k, t, s]) => h('li', { class: `cn-r-${k}` }, h('i', { 'aria-hidden': 'true' }, k === 'si' ? '✓' : '✕'), h('span', {}, h('b', {}, t), h('small', {}, s))))));
    const cuerpo = error ? h('div', { class: 'cn-vacio' }, h('b', {}, 'No pude leer los canales'), h('p', {}, error.message || ''), accion('Reintentar', cargar, 'ghost'))
      : !datos ? h('div', { class: 'cn-cs', 'aria-busy': 'true' }, h('div', { class: 'cn-esq' }), h('div', { class: 'cn-esq' }), h('div', { class: 'cn-esq' }))
      : h('div', { class: 'cn-cs' }, datos.canales.map(tarjeta));
    zona.replaceChildren(h('div', { class: 'cn-main' }, tarjetaCodigo(), cuerpo), reglas);
  }
  pintar(); await cargar();
}
