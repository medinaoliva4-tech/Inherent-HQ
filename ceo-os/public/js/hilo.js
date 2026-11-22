// El hilo del cliente (puro: sin DOM, sin red; lo comparten el servidor, la pantalla y las pruebas).
// Es una VISTA de los entregables, no un segundo almacén: cada entregable es un nodo y cada entrada
// (`entradas: [{ deliverable_id, version, tool }]`) es una arista «viene de». Así el hilo no puede
// contradecir lo que ya se aprueba y se versiona en `entregables.js`.
//
//   conocimiento  'aprobado' (Aprobado o Entregado)  ·  'hipotesis' (Borrador o En revisión)
//   revisar       true si algo de arriba cambió o dejó de estar aprobado → este nodo hay que mirarlo otra vez
//   razon         por qué, en una frase para la persona
//
// Reglas (las de PAQUETES-VISION § B1): solo entradas del mismo cliente; sin ciclos; editar un ancestro marca
// a TODOS sus descendientes y a ningún nodo de otra marca; lo que no traza hasta el ICP se ve.
import { canon } from './entregables.js';

export const APROBADOS = ['Aprobado', 'Entregado'];
export const TOOL_ICP = 'customer-bullseye'; // el cliente ideal: la raíz de la que todo debe colgar
const lc = (x) => String(x || '').toLowerCase();
const aprobadoDe = (d) => APROBADOS.includes(d?.estado);
const vAprobada = (d) => d?.aprobado?.version ?? d?.version ?? 1;

// items = entregables de UN cliente (los de otros se descartan aquí también, por si el llamador se equivoca).
export function construirHilo(items = [], { slug = '', esICP = (t) => t === TOOL_ICP } = {}) {
  const lista = (Array.isArray(items) ? items : []).filter((d) => d && d.id && !d.archivado);
  const cliente = lc(slug) || lc(lista[0]?.client_slug);
  const propios = lista.filter((d) => lc(d.client_slug) === cliente);
  const porId = new Map(propios.map((d) => [d.id, d]));
  const edges = [], huerfanas = [];
  for (const d of propios) {
    for (const e of Array.isArray(d.entradas) ? d.entradas : []) {
      const origen = porId.get(e.deliverable_id);
      if (!origen) { huerfanas.push({ node: d.id, origen: e.deliverable_id, version: e.version }); continue; }
      if (origen.id === d.id) continue;
      edges.push({ id: `${origen.id}>${d.id}`, from: origen.id, to: d.id, version: e.version });
    }
  }
  const ciclo = hayCiclo(propios.map((d) => d.id), edges);
  const padres = new Map(propios.map((d) => [d.id, edges.filter((e) => e.to === d.id)]));
  const nodes = new Map(propios.map((d) => [d.id, {
    id: d.id, tool: d.tool, ws: d.ws, label: d.titulo || d.tool, estado: d.estado, version: d.version || 1, aprobadaV: aprobadoDe(d) ? vAprobada(d) : null,
    conocimiento: aprobadoDe(d) ? 'aprobado' : 'hipotesis', fuente: d.ia?.via || 'manual', client_slug: cliente,
    revisar: false, razon: '', llegaAlICP: esICP(d.tool),
  }]));

  // 1 · Revisar por lo que cambió justo arriba.
  for (const d of propios) {
    const n = nodes.get(d.id);
    for (const e of padres.get(d.id) || []) {
      const o = porId.get(e.from);
      if (!aprobadoDe(o)) { marca(n, `Viene de «${o.titulo || o.tool}», que ya no está aprobado`); break; }
      if (vAprobada(o) > e.version) { marca(n, `«${o.titulo || o.tool}» cambió (v${e.version} → v${vAprobada(o)})`); break; }
    }
  }
  // 2 · La revisión baja a TODOS los descendientes (en orden topológico; con un ciclo se corta, no se cuelga).
  if (!ciclo) {
    for (const id of orden(propios.map((d) => d.id), edges)) {
      const n = nodes.get(id);
      if (n.revisar) continue;
      const mala = (padres.get(id) || []).map((e) => nodes.get(e.from)).find((p) => p.revisar);
      if (mala) marca(n, `Viene de «${mala.label}», que está a revisar`);
    }
    // 3 · ¿Llega al ICP? Lo que no, se ve (no se produce lo que no traza hasta el cliente ideal).
    for (const id of orden(propios.map((d) => d.id), edges)) {
      const n = nodes.get(id);
      if (!n.llegaAlICP) n.llegaAlICP = (padres.get(id) || []).some((e) => nodes.get(e.from).llegaAlICP);
    }
  }
  return { client_slug: cliente, nodes: [...nodes.values()], edges, huerfanas, ciclo };
}

function marca(n, razon) { n.revisar = true; n.razon = razon; }

// ¿Hay un ciclo? (Kahn: si no se pueden sacar todos los nodos, hay uno.)
export function hayCiclo(ids, edges) { return orden(ids, edges).length < ids.length; }
// Orden topológico: de los orígenes hacia abajo. Si hay ciclo, devuelve solo lo que sí se pudo ordenar.
export function orden(ids, edges) {
  const entra = new Map(ids.map((i) => [i, 0])), sale = new Map(ids.map((i) => [i, []]));
  for (const e of edges) { if (entra.has(e.to) && sale.has(e.from)) { entra.set(e.to, entra.get(e.to) + 1); sale.get(e.from).push(e.to); } }
  const cola = ids.filter((i) => entra.get(i) === 0), fuera = [];
  while (cola.length) { const x = cola.shift(); fuera.push(x); for (const y of sale.get(x)) { entra.set(y, entra.get(y) - 1); if (entra.get(y) === 0) cola.push(y); } }
  return fuera;
}

// Todos los que cuelgan de `id` (hijos, nietos…). Sirve para avisar «cambiaste esto: estos se marcan».
export function descendientes(hilo, id) {
  const hijos = new Map(); for (const e of hilo.edges) { if (!hijos.has(e.from)) hijos.set(e.from, []); hijos.get(e.from).push(e.to); }
  const vistos = new Set(), pila = [...(hijos.get(id) || [])];
  while (pila.length) { const x = pila.pop(); if (vistos.has(x)) continue; vistos.add(x); pila.push(...(hijos.get(x) || [])); }
  return [...vistos];
}

// El camino de una pieza hasta el ICP, del ICP hacia la pieza: «esta pieza existe por este dolor de este cliente ideal».
// Devuelve { llega, camino:[nodos], falta } (falta = por qué no llega, en una frase).
export function traza(hilo, id) {
  const nodo = hilo.nodes.find((n) => n.id === id);
  if (!nodo) return { llega: false, camino: [], falta: 'Esa pieza no está en el hilo de este cliente' };
  const porId = new Map(hilo.nodes.map((n) => [n.id, n])), padres = new Map();
  for (const e of hilo.edges) { if (!padres.has(e.to)) padres.set(e.to, []); padres.get(e.to).push(e.from); }
  const visto = new Set(); // BFS hacia arriba: el camino más corto
  const cola = [[id]];
  while (cola.length) {
    const ruta = cola.shift(), x = ruta[0];
    if (porId.get(x)?.tool === TOOL_ICP) return { llega: true, camino: ruta.map((i) => porId.get(i)), falta: '' };
    if (visto.has(x)) continue; visto.add(x);
    for (const p of padres.get(x) || []) cola.push([p, ...ruta]);
  }
  return { llega: false, camino: [nodo], falta: 'No hay un camino aprobado hasta el cliente ideal (ICP): conéctala a un origen que sí lo tenga' };
}

// ¿Cambió el hilo de verdad? (para no repintar ni avisar de más). Compara por contenido canónico.
export const mismoHilo = (a, b) => canon(a) === canon(b);

// Resumen para «qué sabemos»: cuántos nodos hay, cuántos son hipótesis y cuántos piden revisión.
export function resumen(hilo) {
  const n = hilo?.nodes || [];
  return { total: n.length, aprobados: n.filter((x) => x.conocimiento === 'aprobado').length, hipotesis: n.filter((x) => x.conocimiento === 'hipotesis').length,
    revisar: n.filter((x) => x.revisar).length, sinICP: n.filter((x) => !x.llegaAlICP && x.tool !== TOOL_ICP).length };
}
