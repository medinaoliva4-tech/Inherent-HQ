import { NOMBRE_TIPO, TIPOS, type DatosCliente, type Nodo } from './tipos.js';

/**
 * Grafo en el formato que `graphify` lee como `graphify-out/graph.json` (node-link de NetworkX, aristas en `links`).
 * Con ese archivo funcionan `graphify query "qué depende de dolor #2"`, `path` y `explain` sin volver a extraer.
 * Ids con prefijo de cliente (`akai:dolor-2`) para poder juntar varios clientes en un solo grafo.
 */
export interface GrafoGraphify {
  directed: false;
  multigraph: false;
  graph: { fuente: 'code-os/herramientas'; clientes: string[]; generado: string };
  nodes: {
    id: string; label: string; norm_label: string; file_type: 'concept'; source_file: string; source_location: null;
    community: null; cliente: string; tipo: string; numero: number; estado: string; version: number; fuente: string; actualizado: string; contenido: string;
  }[];
  links: { source: string; target: string; relation: 'viene_de'; confidence: 'EXTRACTED'; confidence_score: 1; weight: 1; source_file: string }[];
  hyperedges: [];
}

const sinAcentos = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '');
export const etiqueta = (n: Pick<Nodo, 'tipo' | 'numero'>) => `${NOMBRE_TIPO[n.tipo]} #${n.numero}`;
const texto = (c: unknown) => (typeof c === 'string' ? c : c === undefined || c === null ? '' : JSON.stringify(c)).slice(0, 2000);

export function aGraphify(datos: { cliente: string; d: DatosCliente }[]): GrafoGraphify {
  const g: GrafoGraphify = { directed: false, multigraph: false, graph: { fuente: 'code-os/herramientas', clientes: datos.map((x) => x.cliente), generado: new Date().toISOString() }, nodes: [], links: [], hyperedges: [] };
  for (const { cliente, d } of datos) {
    const src = `memoria/${cliente}`;
    for (const n of Object.values(d.nodos)) {
      const label = `${etiqueta(n)} · ${n.titulo}`;
      g.nodes.push({ id: `${cliente}:${n.id}`, label, norm_label: sinAcentos(label).toLowerCase(), file_type: 'concept', source_file: src, source_location: null, community: null, cliente, tipo: n.tipo, numero: n.numero, estado: n.estado, version: n.version, fuente: n.fuente, actualizado: n.actualizado, contenido: texto(n.contenido) });
      for (const p of n.viene_de) g.links.push({ source: `${cliente}:${n.id}`, target: `${cliente}:${p}`, relation: 'viene_de', confidence: 'EXTRACTED', confidence_score: 1, weight: 1, source_file: src });
    }
  }
  return g;
}

/** Vista en Markdown del hilo: por tipo, con estado, versión y de dónde viene; al final, avisos pendientes. */
export function aMarkdown(cliente: string, d: DatosCliente): string {
  const nodos = Object.values(d.nodos);
  const nombre = (id: string) => { const n = d.nodos[id]; return n ? etiqueta(n) : id; };
  const out = [`# Hilo de ${cliente}`, '', `${nodos.length} nodos · ${d.avisos.filter((a) => !a.resuelto).length} avisos pendientes`, ''];
  for (const t of TIPOS) {
    const del = nodos.filter((n) => n.tipo === t);
    if (!del.length) continue;
    out.push(`## ${NOMBRE_TIPO[t]}`, '');
    for (const n of del) out.push(`- **${etiqueta(n)}** «${n.titulo}» · ${n.estado === 'aprobado' ? 'aprobado' : 'hipótesis'} · v${n.version}${n.viene_de.length ? ` — viene de: ${n.viene_de.map(nombre).join(', ')}` : ''} · fuente: ${n.fuente}`);
    out.push('');
  }
  const pend = d.avisos.filter((a) => !a.resuelto);
  if (pend.length) { out.push('## Avisos pendientes', ''); for (const a of pend) out.push(`- ${a.mensaje}`); out.push(''); }
  return out.join('\n');
}
