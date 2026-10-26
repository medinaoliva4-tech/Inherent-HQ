// Las cinco áreas de Inherent OS, iguales en las dos apps (el Tablero y el Chat). El área dice QUÉ trabajas; la app, CÓMO
// (ver y mover las cosas, o conversarlas). Se escoge una vez con el switch de arriba de la barra y las dos apps la siguen.
//   Estrategia    la estrategia de cada cliente (① Strategy)
//   Organización  cómo se maneja Inherent: tu día, proyectos, ventas, servicios y sus finanzas
//   Marketing     planear y medir la demanda de cada marca: plan del mes, campañas y eventos, calendario, pauta (③ Marketing)
//   Diseño        hacer las piezas de cada marca: brief, ideas, guiones, identidad y video (④ Creatividad · ⑥A Diseño gráfico)
//   Consulting    el backend de un cliente: sus operaciones, finanzas, márgenes y estructura (Operations OS y Money OS)
// Cada una tiene su color (--ui-m-<id> en app.css). espacio: el espacio del Tablero (app.js) · modo: el modo del Chat (llm/modos.js).
// Marketing y Diseño comparten el espacio de las marcas (#/marcas/…): el área la dice el grupo del módulo abierto (brandlist.js).
// Puro: sin DOM ni red (lo prueba scripts/test-ui.mjs).
export const AREAS = [
  { id: 'estrategia', nombre: 'Estrategia', sub: 'La estrategia de cada cliente', icono: 'target', espacio: 'estrategia', modo: 'estrategia' },
  { id: 'organizacion', nombre: 'Organización', sub: 'Cómo se maneja Inherent', icono: 'clipboard', espacio: 'org', modo: 'organizacion' },
  { id: 'marketing', nombre: 'Marketing', sub: 'Plan del mes, campañas y eventos de cada marca', icono: 'megaphone', espacio: 'marcas', modo: 'marketing' },
  { id: 'diseno', nombre: 'Diseño', sub: 'Las piezas de cada marca: ideas, guiones e identidad', icono: 'palette', espacio: 'marcas', modo: 'diseno' },
  { id: 'consulting', nombre: 'Consulting', sub: 'Operaciones, finanzas, márgenes y estructura de un cliente', icono: 'chart-pie', espacio: 'consulting', modo: 'consulting' },
];
export const areaDe = (id) => AREAS.find((a) => a.id === id) || null;
export const areaDeEspacio = (sp) => AREAS.find((a) => a.espacio === sp) || null; // en «marcas» es la primera (Marketing): app.js usa el módulo
export const areaDeModo = (m) => AREAS.find((a) => a.modo === m) || null;

// Las que abre esta persona. puede = { estrategia, organizacion, diseno, consulting } (booleanos que arma cada app).
// Consulting va con Estrategia: lo lleva el CEO con Strategy, y el CEO decide quién más en Vistas por rol. Marketing y Diseño, con las marcas.
export const areasDe = (puede = {}) => AREAS.filter((a) => puede[a.id]);

// El área elegida se recuerda por persona en este navegador: la escriben y la leen las dos apps.
const K = (email) => `os.area.${email || ''}`;
export function areaGuardada(email) { try { return localStorage.getItem(K(email)) || ''; } catch { return ''; } }
export function guardarArea(email, id) { try { localStorage.setItem(K(email), id); } catch {} }

// El switch: una pastilla con el ícono de cada área (role="radiogroup"); la elegida lleva su color. Texto HTML, sin DOM.
// svg(nombre, px) pinta el ícono (svgIco de iconos.js). clase: 'asw' en la barra, 'asw chico' en el cel.
export function switchHtml(areas, actual, svg, clase = 'asw') {
  const i = Math.max(0, areas.findIndex((a) => a.id === actual));
  return `<div class="${clase}" role="radiogroup" aria-label="Área" style="--n:${areas.length};--i:${i}" data-on="${actual || ''}"><span class="asw-pastilla" aria-hidden="true"></span>${areas.map((a) => `<button type="button" role="radio" data-area="${a.id}" aria-checked="${a.id === actual}" tabindex="${a.id === actual ? 0 : -1}" aria-label="${a.nombre}" style="--c:var(--ui-m-${a.id})">${svg(a.icono, 18)}<span class="asw-tip">${a.nombre}</span></button>`).join('')}</div>`;
}
// Flechas dentro del switch: la siguiente o la anterior (da la vuelta). → id del área o null.
export function areaConFlecha(areas, actual, tecla) {
  const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[tecla]; if (!d || !areas.length) return null;
  const i = areas.findIndex((a) => a.id === actual);
  return areas[(i + d + areas.length) % areas.length].id;
}

// La barra lateral del Tablero (la misma forma que la del Chat): primero para el CEO; cada quien la prende o la apaga en
// Mi perfil y se recuerda en este navegador. Sin ella, el Tablero sigue con la barra de arriba de siempre.
const KB = (email) => `os.barra.${email || ''}`;
export function barraLateral(me) {
  if (!me || me.role === 'client') return false;
  let v = ''; try { v = localStorage.getItem(KB(me.email)) || ''; } catch {}
  return v ? v === 'lateral' : me.role === 'ceo';
}
export function ponerBarra(me, lateral) { try { localStorage.setItem(KB(me.email), lateral ? 'lateral' : 'arriba'); } catch {} }

// Abrir el Chat con un pedido escrito: en el modo de un área, con su cliente o marca y (opcional) el mes del plan. Lo usan
// «Pregúntale al Chat», Consulting, Campañas y eventos y el plan del mes. Lo único de este archivo que toca el navegador.
export function abrirEnChat(email, { modo, slug = '', borrador = '', mes = '' } = {}) {
  const k = `os.llm.${email}`; let p = {};
  try { p = JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch {}
  p.modo = modo; if (slug) p.slugs = { ...(p.slugs || {}), [modo]: slug };
  if (borrador) p.borrador = borrador; if (mes) p.mes = mes;
  try { localStorage.setItem(k, JSON.stringify(p)); } catch {}
  guardarArea(email, areaDeModo(modo)?.id || '');
  if (typeof location !== 'undefined') location.hash = '/chat';
}
