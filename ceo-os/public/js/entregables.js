// La colección «deliverables»: el entregable de una herramienta del OS (Borrador → En revisión → Aprobado → Entregado), con
// versiones, criterios, entradas de otras herramientas y tareas. Puro (sin DOM ni red): lo comparten el servidor
// (api/_lib/entregables.js), el Tool Shell (tool-shell.js) y las pruebas. Solo importa el registro de herramientas.
//   { tool, ws, pestana, titulo, client_slug, ciclo, project_id, owner, estado, archivado, version, contenido,
//     criterios: { cumple, falta }, entradas: [{ deliverable_id, version, tool }], siguientes: [{ tool, deliverable_id }],
//     aprobado: { por, en, version } | null, historial: [{ en, por, accion, nota, version }], tareas: [ids],
//     resultado: [{ en, por, metrica, valor, nota }], ia: { via, modelo } }
// Las versiones viven en «deliverable_versions» con el id <id>--v<n>: solo se crean, nunca se editan.
import { herramientaDe } from './herramientas.js';

export const COLL = 'deliverables';
export const COLL_V = 'deliverable_versions';
export const ESTADOS = ['Borrador', 'En revisión', 'Aprobado', 'Entregado'];
// El área de permisos de cada workspace (access.js): Consulting es «quien ve Estrategia».
export const AREA_DE = { strategy: 'estrategia', consulting: 'estrategia', marketing: 'content', creative: 'content', production: 'content' };
export const VIAS_IA = ['hermes', 'puente', 'claude-web', 'manual', 'servidor'];

// ---------- Texto y limpieza ----------
const cadena = (v) => (typeof v === 'string' ? v : typeof v === 'number' && Number.isFinite(v) ? String(v) : '');
const txt = (v, n) => cadena(v).replace(/\s+/g, ' ').trim().slice(0, n);
const idOk = (v) => (/^[\w.-]{1,120}$/.test(cadena(v)) ? cadena(v) : '');
const plano = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const LLAVES_DEL_SERVIDOR = new Set(['id', 'v', '_meta']);
const LLAVES_PELIGROSAS = new Set(['__proto__', 'constructor', 'prototype']);

function limpiarValor(x, d) {
  if (typeof x === 'string') return x.slice(0, 4000);
  if (typeof x === 'number') return Number.isFinite(x) ? x : null;
  if (typeof x === 'boolean' || x === null) return x;
  if (d > 8) return null;
  if (Array.isArray(x)) return x.slice(0, 200).map((y) => limpiarValor(y, d + 1));
  if (plano(x)) {
    const o = {};
    for (const k of Object.keys(x).slice(0, 200)) {
      if (LLAVES_DEL_SERVIDOR.has(k) || LLAVES_PELIGROSAS.has(k) || k.length > 80) continue;
      o[k] = limpiarValor(x[k], d + 1);
    }
    return o;
  }
  return null;
}
// El contenido de una herramienta que no trae su propio limpiar(): solo un objeto plano, sin las llaves que pone el
// servidor (id, v, _meta) en ningún nivel, textos de hasta 4000 caracteres y listas de hasta 200.
export const limpiarGenerico = (c) => (plano(c) ? limpiarValor(c, 0) : {});

// JSON con las llaves ordenadas: jsonb (Postgres) las reordena al guardar, así que comparar con JSON.stringify
// daría «cambió» sin que nadie haya tocado nada.
export function canon(x) {
  if (Array.isArray(x)) return '[' + x.map(canon).join(',') + ']';
  if (x && typeof x === 'object') return '{' + Object.keys(x).filter((k) => x[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}';
  return JSON.stringify(x === undefined ? null : x);
}

const listaCriterios = (a) => (Array.isArray(a) ? a : []).map((x) => txt(x, 200)).filter(Boolean).slice(0, 12);
const cicloOk = (c) => (/^\d{4}-(0[1-9]|1[0-2])$/.test(cadena(c)) ? cadena(c) : '');

// Lo que entra de afuera (el cuerpo de POST y PUT) → lo que se guarda. Tira lo que pone el servidor: id, v, _meta, estado,
// aprobado, historial, version, owner, tareas, resultado, siguientes y archivado.
// limpiarTool = el limpiar() de la herramienta (si no hay, limpiarGenerico).
export function limpiarEntregable(b = {}, limpiarTool) {
  const x = plano(b) ? b : {};
  const crudo = plano(x.contenido) ? x.contenido : {};
  const entradas = (Array.isArray(x.entradas) ? x.entradas : []).map((e) => ({
    deliverable_id: idOk(e?.deliverable_id), version: Number.isInteger(e?.version) && e.version >= 1 && e.version <= 9999 ? e.version : 0, tool: txt(e?.tool, 60),
  })).filter((e) => e.deliverable_id && e.version).slice(0, 10);
  return {
    tool: /^[a-z0-9-]{1,60}$/.test(cadena(x.tool)) ? x.tool : '',
    titulo: txt(x.titulo, 120),
    client_slug: txt(x.client_slug, 60).toLowerCase(),
    ciclo: cicloOk(x.ciclo),
    project_id: idOk(x.project_id),
    contenido: typeof limpiarTool === 'function' ? limpiarTool(crudo) : limpiarGenerico(crudo),
    criterios: { cumple: listaCriterios(x.criterios?.cumple), falta: listaCriterios(x.criterios?.falta) },
    entradas,
    ia: { via: VIAS_IA.includes(x.ia?.via) ? x.ia.via : 'manual', modelo: txt(x.ia?.modelo, 80) },
  };
}

// ---------- Estados y quién los mueve ----------
// 'edita' = quien edita esa área · 'aprobador' = quien aprueba esta herramienta (puedeAprobar). Aprobado → Borrador no existe:
// editar el contenido de un Aprobado crea una versión nueva y la vuelve Borrador (cambioDeContenido).
const PASOS = { 'Borrador>En revisión': 'edita', 'En revisión>Borrador': 'edita', 'En revisión>Aprobado': 'aprobador', 'Aprobado>Entregado': 'edita' };
export const pasoPermitido = (de, a) => (Object.hasOwn(PASOS, `${de}>${a}`) ? PASOS[`${de}>${a}`] : null);
// aprueba sale del registro: 'ceo' solo el CEO; 'coo' el CEO o el COO. Una herramienta que no existe más: solo el CEO.
export const puedeAprobar = (u, tool) => (!tool || tool.aprueba === 'ceo' ? u?.role === 'ceo' : ['ceo', 'coo'].includes(u?.role));

// Lo que impide aprobar: los «falta» del entregable y lo que la herramienta cuenta de su propio contenido.
export function faltas(doc, extra = {}) {
  const propias = herramientaDe(doc?.tool)?.faltas?.(doc?.contenido, extra) || [];
  return [...(Array.isArray(doc?.criterios?.falta) ? doc.criterios.falta : []), ...(Array.isArray(propias) ? propias : [])];
}

// Cambiar el contenido: versión + 1; si estaba Aprobado o Entregado, vuelve a Borrador y pierde el OK. Sin cambio, nada.
export function cambioDeContenido(cur, contenidoNuevo) {
  if (canon(cur?.contenido) === canon(contenidoNuevo)) return { version: cur.version, estado: cur.estado, aprobado: cur.aprobado ?? null };
  const vuelve = cur.estado === 'Aprobado' || cur.estado === 'Entregado';
  return { version: (cur.version || 1) + 1, estado: vuelve ? 'Borrador' : cur.estado, aprobado: vuelve ? null : cur.aprobado ?? null };
}
export const idVersion = (id, n) => `${id}--v${n}`;

// ---------- La cadena ----------
// El Borrador de la herramienta que sigue: solo desde un entregable Aprobado (o Entregado) y solo a una de su va_a.
// Las entradas apuntan a la versión aprobada, no a la que esté abierta hoy. null = no se puede.
export function siguienteDe(doc, toolDestino) {
  if (!doc || !['Aprobado', 'Entregado'].includes(doc.estado)) return null;
  const origen = herramientaDe(doc.tool), destino = herramientaDe(toolDestino);
  if (!origen || !destino || !origen.va_a.includes(destino.id)) return null;
  return {
    tool: destino.id, ws: destino.ws, pestana: destino.pestana, titulo: txt(doc.titulo || destino.nombre, 120),
    client_slug: doc.client_slug, project_id: doc.project_id || '', ciclo: doc.ciclo || '',
    entradas: [{ deliverable_id: doc.id, version: doc.aprobado?.version ?? doc.version, tool: doc.tool }], contenido: {},
  };
}

// ---------- Convertir en tareas ----------
// filas = [{ title, due, assignee, dept, fila, por_que }] (máx. 12; las que no traen título se ignoran).
// Cada tarea queda ligada al entregable: origen 'entregable', deliverable_id y la fila (con eso no se duplica).
// Strategy es privada (como los encargos); lo demás, de todos. Las crea el servidor, nunca /api/db/tasks.
export function tareasDeEntregable(doc, filas, { email = '', ws } = {}) {
  const area = ws || doc.ws;
  return (Array.isArray(filas) ? filas : []).filter((f) => txt(f?.title, 200)).slice(0, 12).map((f) => ({
    title: txt(f.title, 200),
    description: [txt(f.por_que, 400), `Entregable «${doc.titulo}» v${doc.version}`].filter(Boolean).join(' · '),
    status: 'Por empezar', tipo: 'Delivery', dept: txt(f.dept, 80), due: /^\d{4}-\d{2}-\d{2}$/.test(cadena(f.due)) ? f.due : '',
    assignee: txt(f.assignee, 120) || email,
    visibility: area === 'strategy' ? 'private' : 'all',
    project_id: doc.project_id || '', client_slug: doc.client_slug, cliente: doc.client_slug, area,
    origen: 'entregable', deliverable_id: doc.id, fila: txt(f.fila, 80),
  }));
}
