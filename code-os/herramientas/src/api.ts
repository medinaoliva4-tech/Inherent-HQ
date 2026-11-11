import { ErrorHerramienta, malo } from './errores.js';
import { calcularInbound, calibrarInbound } from './inbound.js';
import { validarIcp } from './icp.js';
import type { Memoria } from './memoria.js';
import { calcularOutbound } from './outbound.js';
import { desdeZernio } from './zernio.js';

/**
 * Router sin framework: el puente autentica, lee el JSON y llama aquí con el usuario ya resuelto.
 * Devuelve `null` si la ruta no es de herramientas. Formas exactas: `code-os/docs/herramientas-api.md`.
 */
export interface Peticion { method: string; path: string; query: URLSearchParams; body: unknown; usuario: string }
export interface Respuesta { status: number; body: any }

const RUTA = /^\/(clientes|calc)(\/|$)/;
export const esRutaHerramientas = (path: string) => RUTA.test(path);

const SEG = '([a-z0-9][a-z0-9-]{0,63})';
const RUTAS: [string, RegExp][] = [
  ['clientes', /^\/clientes$/],
  ['nodos', new RegExp(`^/clientes/([^/]+)/nodos$`)],
  ['nodo', new RegExp(`^/clientes/([^/]+)/nodos/${SEG}$`)],
  ['aprobar', new RegExp(`^/clientes/([^/]+)/nodos/${SEG}/aprobar$`)],
  ['dependientes', new RegExp(`^/clientes/([^/]+)/nodos/${SEG}/dependientes$`)],
  ['avisos', new RegExp(`^/clientes/([^/]+)/avisos$`)],
  ['resolver', new RegExp(`^/clientes/([^/]+)/avisos/${SEG}/resolver$`)],
  ['grafo', new RegExp(`^/clientes/([^/]+)/grafo$`)],
  ['calibrar', new RegExp(`^/clientes/([^/]+)/calibrar$`)],
  ['outbound', /^\/calc\/outbound$/],
  ['inbound', /^\/calc\/inbound$/],
  ['icp', /^\/calc\/icp$/],
];
const METODOS: Record<string, string[]> = {
  clientes: ['GET'], nodos: ['GET', 'POST'], nodo: ['GET', 'PUT'], aprobar: ['POST'], dependientes: ['GET'], avisos: ['GET'],
  resolver: ['POST'], grafo: ['GET'], calibrar: ['POST'], outbound: ['POST'], inbound: ['POST'], icp: ['POST'],
};

const objeto = (b: unknown, que = 'el cuerpo'): Record<string, any> => {
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw malo(`Falta ${que} (objeto JSON)`);
  return b as Record<string, any>;
};

export async function manejarHerramientas(mem: Memoria, p: Peticion): Promise<Respuesta | null> {
  if (!esRutaHerramientas(p.path)) return null;
  let ruta: string | undefined; let a: string[] = [];
  for (const [nombre, re] of RUTAS) { const m = re.exec(p.path); if (m) { ruta = nombre; a = m.slice(1); break; } }
  if (!ruta) return { status: 404, body: { error: 'Ruta no encontrada' } };
  if (!METODOS[ruta]!.includes(p.method)) return { status: 405, body: { error: `Método no permitido; usa ${METODOS[ruta]!.join(' o ')}` } };
  const [c, id] = a as [string, string];
  const u = p.usuario;
  try {
    switch (ruta) {
      case 'clientes': return { status: 200, body: { clientes: await mem.clientes() } };
      case 'nodos':
        if (p.method === 'GET') return { status: 200, body: { nodos: await mem.listar(c, { tipo: p.query.get('tipo') ?? undefined }) } };
        return { status: 201, body: { nodo: await mem.crear(c, objeto(p.body) as any, u) } };
      case 'nodo':
        if (p.method === 'GET') return { status: 200, body: await mem.leer(c, id, u) };
        return { status: 200, body: await mem.actualizar(c, id, objeto(p.body), u) };
      case 'aprobar': return { status: 200, body: { nodo: await mem.aprobar(c, id, u) } };
      case 'dependientes': return { status: 200, body: { nodo: id, dependientes: await mem.dependientes(c, id) } };
      case 'avisos': return { status: 200, body: { avisos: await mem.avisos(c, { todos: p.query.get('todos') === '1' }) } };
      case 'resolver': return { status: 200, body: { aviso: await mem.resolverAviso(c, id, u) } };
      case 'grafo': {
        const f = p.query.get('formato') ?? 'graphify';
        if (f === 'graphify') return { status: 200, body: await mem.grafo(c) };
        if (f === 'markdown') return { status: 200, body: { markdown: await mem.grafoMarkdown(c) } };
        throw malo('«formato» debe ser graphify o markdown');
      }
      case 'outbound': return { status: 200, body: { resultado: calcularOutbound(objeto(p.body) as any) } };
      case 'inbound': return { status: 200, body: { resultado: calcularInbound(objeto(p.body) as any) } };
      case 'icp': return { status: 200, body: { validacion: validarIcp(p.body) } };
      case 'calibrar': {
        const b = objeto(p.body);
        const metricas = desdeZernio(objeto(b.analytics, '«analytics» (JSON de Zernio)'), b.extras && typeof b.extras === 'object' ? b.extras : {});
        const cal = calibrarInbound(objeto(b.entradas, '«entradas»') as any, metricas);
        const resultado = calcularInbound(cal.entrada, cal.origen);
        const calibracion = { origen: cal.origen, advertencias: cal.advertencias, metricas: cal.metricas };
        if (b.guardar_en === undefined) return { status: 200, body: { resultado, calibracion } };
        if (typeof b.guardar_en !== 'string') throw malo('«guardar_en» debe ser el id de un nodo');
        const actual = await mem.obtener(c, b.guardar_en);
        const base = actual.contenido && typeof actual.contenido === 'object' && !Array.isArray(actual.contenido) ? actual.contenido : {};
        const { nodo, avisos } = await mem.actualizar(c, b.guardar_en, { contenido: { ...base, inbound: resultado }, fuente: `Zernio analytics ${metricas.desde} a ${metricas.hasta}`, version: actual.version }, u);
        return { status: 200, body: { resultado, calibracion, nodo, avisos } };
      }
    }
    return { status: 404, body: { error: 'Ruta no encontrada' } };
  } catch (e) {
    if (e instanceof ErrorHerramienta) return { status: e.status, body: { error: e.message, ...(e.detalle !== undefined ? { detalle: e.detalle } : {}) } };
    if (e instanceof SyntaxError) return { status: 500, body: { error: 'Datos del cliente dañados' } };
    throw e;
  }
}
