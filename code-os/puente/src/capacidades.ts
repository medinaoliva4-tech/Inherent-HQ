import { existsSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, sep } from 'node:path';
import type { Config, UserRecord } from './config.js';
import type { ModelCatalog } from './models.js';
import { HttpError } from './types.js';

/**
 * Capacidades por conversación: el mismo motor (misma sesión, mismo contexto) con distintos juegos de
 * herramientas. Cada capacidad = servidores MCP del catálogo del servidor + reglas de permiso.
 */
export type CapId = 'codigo' | 'figwright' | 'imagen' | 'radar' | 'video' | 'herramientas';
export interface CapDef { id: CapId; nombre: string; descripcion: string; mcp?: string; pesada: boolean; confinada: boolean }
export const CAPACIDADES: readonly CapDef[] = [
  { id: 'codigo', nombre: 'Código', descripcion: 'Leer, escribir y ejecutar comandos en la carpeta del proyecto (dentro de la jaula).', pesada: true, confinada: true },
  { id: 'figwright', nombre: 'Figma', descripcion: 'Leer y diseñar en Figma con Figwright, sobre el archivo que tengas abierto con el plugin.', mcp: 'figwright', pesada: true, confinada: true },
  { id: 'imagen', nombre: 'Imágenes', descripcion: 'Generar y validar imágenes; cada lote muestra el costo y espera tu OK.', mcp: 'imagen', pesada: true, confinada: true },
  { id: 'radar', nombre: 'Radar', descripcion: 'Referentes y contenido que funciona en tu mercado.', mcp: 'radar', pesada: false, confinada: true },
  { id: 'video', nombre: 'Video', descripcion: 'Armar, editar y renderizar videos con el style menu de la marca.', mcp: 'video', pesada: false, confinada: true },
  { id: 'herramientas', nombre: 'Herramientas', descripcion: 'Memoria viva del cliente (nodos del hilo) y calculadoras.', pesada: false, confinada: false },
];
export const CAP_IDS = CAPACIDADES.map((c) => c.id);
const def = (id: string) => CAPACIDADES.find((c) => c.id === id);

export type Estado = 'lista' | 'sin_conexion' | 'apagada';
export interface EstadoCap { id: CapId; nombre: string; descripcion: string; estado: Estado; motivo?: string; pesada: boolean }

export function parseCapacidades(v: unknown): CapId[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) throw new HttpError(400, 'capacidades debe ser una lista de ids');
  const malas = (v as string[]).filter((x) => !CAP_IDS.includes(x as CapId));
  if (malas.length) throw new HttpError(400, `Capacidad desconocida: ${malas.join(', ')} (válidas: ${CAP_IDS.join(', ')})`);
  return [...new Set(v as CapId[])];
}
export const hayPesada = (caps: string[]) => caps.some((c) => def(c)?.pesada);
export const necesitaJaula = (caps: string[]) => caps.some((c) => def(c)?.confinada);

// ── Catálogo MCP: entrada del servidor → configuración para una sesión ─────────────────────────

/** Claves propias del puente dentro de una entrada del catálogo (no se pasan al SDK). */
export interface ExtraPuente { sondeo?: string; ro?: string[] }
const extra = (e: unknown): ExtraPuente => ((e as any)?.['x-puente'] ?? {}) as ExtraPuente;

/**
 * Sustituye marcadores por los datos de la sesión. Así el MCP de imagen usa la llave virtual DE ESA PERSONA
 * (con su tope) y nunca una llave del servidor, y escribe dentro de su proyecto.
 */
export function resolverEntrada(entrada: unknown, ctx: { cfg: Config; user: UserRecord; cwd: string; home: string }): Record<string, unknown> {
  const vars: Record<string, string> = {
    USUARIO_LLAVE_LITELLM: ctx.user.litellmKey, LITELLM_URL: ctx.cfg.litellmUrl, PROYECTO: ctx.cwd, HOME_USUARIO: ctx.home, USUARIO: ctx.user.id, CUOTAS_URL: ctx.cfg.cuotasUrl,
  };
  const sub = (s: string) => s.replace(/\$\{([A-Z_]+)\}/g, (m, k: string) => vars[k] ?? m);
  const { description: _d, 'x-puente': _x, ...resto } = (entrada ?? {}) as Record<string, any>;
  const out: Record<string, unknown> = { ...resto };
  if (typeof resto.command === 'string') out.command = sub(resto.command);
  if (Array.isArray(resto.args)) out.args = resto.args.map((a: unknown) => (typeof a === 'string' ? sub(a) : a));
  if (resto.env && typeof resto.env === 'object') out.env = Object.fromEntries(Object.entries(resto.env).map(([k, v]) => [k, typeof v === 'string' ? sub(v) : v]));
  return out;
}

/**
 * Carpetas de solo lectura que la jaula debe montar para los MCP de la sesión (`x-puente.ro`). Solo se aceptan
 * rutas absolutas que existen y que no tocan los datos del puente (usuarios, proyectos ajenos, llaves).
 */
export function montajesSoloLectura(cfg: Pick<Config, 'dataDir' | 'mcpCatalog'>, nombres: string[]): string[] {
  // Camino real aunque la ruta aún no exista (resuelve el ancestro existente más profundo).
  const real = (p: string): string => { try { return realpathSync(p); } catch { const up = dirname(p); return up === p ? p : join(real(up), basename(p)); } };
  const datos = real(cfg.dataDir);
  const out = new Set<string>();
  for (const n of nombres) for (const r of extra(cfg.mcpCatalog[n]).ro ?? []) {
    if (typeof r !== 'string' || !isAbsolute(r) || !existsSync(r)) continue;
    const p = real(r);
    if (p === '/' || p === datos || datos.startsWith(p + sep) || p.startsWith(datos + sep)) continue;
    out.add(p);
  }
  return [...out];
}

// ── Reglas de permiso por herramienta ──────────────────────────────────────────────────────────

export type Tipo = 'lectura' | 'escritura' | 'irreversible' | 'gasto';
export interface Clase { cap?: CapId; tipo: Tipo }
const FIG_LECTURA = new Set(['ping', 'list_files', 'use_file', 'analyze_project', 'component_map', 'token_map', 'icon_map', 'design_diff']);
const FIG_IRREVERSIBLE = /^(delete_|detach_instance$|flatten_nodes$)/;
const VIDEO_LECTURA = new Set(['video_trabajo', 'corte_leer', 'marcas_listar', 'marca_guia', 'estilos_listar', 'referencias_listar']);
const CODIGO_ESCRITURA = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Bash']);

/** Clasifica una llamada: lectura (sin preguntar), escritura (pide permiso), irreversible y gasto (siempre preguntan). */
export function clasificar(tool: string, input: Record<string, unknown> = {}): Clase {
  const m = /^mcp__([^_]+(?:_[^_]+)*?)__(.+)$/.exec(tool);
  if (!m) return CODIGO_ESCRITURA.has(tool) ? { cap: 'codigo', tipo: 'escritura' } : { tipo: 'lectura' };
  const [, srv, t] = m as unknown as [string, string, string];
  if (srv === 'figwright') return { cap: 'figwright', tipo: FIG_LECTURA.has(t) || /^(get_|list_|scan_|search_)/.test(t) ? 'lectura' : FIG_IRREVERSIBLE.test(t) ? 'irreversible' : 'escritura' };
  if (srv === 'imagen') return { cap: 'imagen', tipo: t === 'imagen_estimar' || t === 'imagen_validar' ? 'lectura' : t === 'imagen_generar' || t === 'imagen_variantes' ? 'gasto' : 'escritura' };
  if (srv === 'video') return { cap: 'video', tipo: VIDEO_LECTURA.has(t) ? 'lectura' : 'escritura' };
  if (srv === 'herramientas') return { cap: 'herramientas', tipo: String(input.metodo ?? 'GET').toUpperCase() === 'GET' ? 'lectura' : 'escritura' };
  if (srv === 'radar') return { cap: 'radar', tipo: 'escritura' };
  return { tipo: 'escritura' };
}
/** ¿Una herramienta que el planificador debe delegar al ejecutor? */
export const esPesada = (tool: string, input?: Record<string, unknown>) => clasificar(tool, input).tipo !== 'lectura' && !['Agent', 'Task'].includes(tool);

// ── Reglas que se agregan al prompt según las capacidades activas ──────────────────────────────

export const REGLAS: Partial<Record<CapId, string>> = {
  figwright: 'Figma (Figwright): antes de leer o escribir llama a `list_files`. Suele haber varios archivos abiertos: fija el correcto con `use_file` (nombre exacto o sessionId) y di a la persona en qué archivo vas a trabajar antes de escribir. Sin archivo fijado, el puente bloquea toda escritura. Reutiliza componentes, estilos y variables del archivo antes de dibujar primitivas; usa `batch` en lotes de 15 a 40 operaciones y verifica con `get_screenshot`. Borrar o separar instancias pide permiso aparte.',
  imagen: 'Imágenes: primero `imagen_estimar` y muestra el costo. `imagen_generar` e `imagen_variantes` piden permiso: la persona fija el monto aprobado (`aprobado_usd`); no lo inventes. Nunca logos ni personas reales.',
  herramientas: 'Herramientas: `herramientas_api` llama a la API de memoria del cliente y calculadoras (rutas /clientes… y /calc/…). Aprobar nodos lo hace solo la persona.',
};

// ── Sondeo de disponibilidad ───────────────────────────────────────────────────────────────────

export interface SondeoDeps { cfg: Config; models: ModelCatalog; confined: () => boolean; herramientas: boolean; fetchFn?: typeof fetch; ttlMs?: number }
export type Sondeo = (u: UserRecord, force?: boolean) => Promise<EstadoCap[]>;

async function pedir(f: typeof fetch, url: string): Promise<any | null> {
  try { const r = await f(url, { signal: AbortSignal.timeout(2000) }); if (!r.ok) return { _status: r.status }; return await r.json().catch(() => ({})); } catch { return null; }
}
export const MOTIVO_MAC = 'Tu Mac debe estar encendida, con Figma abierto y el plugin Figwright activo (el túnel hacia el servidor no responde)';

export function makeSondeo(d: SondeoDeps): Sondeo {
  const f = d.fetchFn ?? fetch;
  const ttl = d.ttlMs ?? 10_000;
  const cache = new Map<string, { at: number; v: EstadoCap[] }>();
  async function uno(c: CapDef, u: UserRecord): Promise<Pick<EstadoCap, 'estado' | 'motivo'>> {
    if (c.confinada && d.cfg.requireConfine && !d.confined()) return { estado: 'apagada', motivo: 'El servidor no tiene confinamiento (bubblewrap) activo: esta capacidad está apagada' };
    if (c.id === 'codigo') return { estado: 'lista' };
    if (c.id === 'herramientas') return d.herramientas ? { estado: 'lista' } : { estado: 'apagada', motivo: 'Las herramientas no están activas en este servidor' };
    const entrada = d.cfg.mcpCatalog[c.mcp!];
    if (!entrada) return { estado: 'apagada', motivo: `No está configurada en el servidor (falta «${c.mcp}» en PUENTE_MCP_CONFIG)` };
    const x = extra(entrada);
    if (c.id === 'figwright') {
      const port = Number((entrada as any)?.env?.FIGWRIGHT_PORT) || 3055;
      const p = await pedir(f, x.sondeo ?? `http://127.0.0.1:${port}/ping`);
      if (!p || p._status) return { estado: 'sin_conexion', motivo: MOTIVO_MAC };
      if (!p.ok || !(Number(p.plugins) > 0)) return { estado: 'sin_conexion', motivo: 'Figwright responde, pero ningún archivo tiene el plugin abierto: abre el plugin Figwright en Figma' };
      return { estado: 'lista' };
    }
    if (c.id === 'imagen') {
      const lista = await d.models.list(u).catch(() => null);
      if (!lista) return { estado: 'sin_conexion', motivo: 'No pude leer tus modelos del Gateway' };
      if (!lista.some((m) => m.id.startsWith('imagen-'))) return { estado: 'sin_conexion', motivo: 'Tu llave del Gateway no tiene modelos de imagen (imagen-media, imagen-alta…): pídelo al administrador' };
      return { estado: 'lista' };
    }
    if (x.sondeo) {
      const p = await pedir(f, x.sondeo);
      if (!p || p._status) return { estado: 'sin_conexion', motivo: `El servicio de ${c.nombre.toLowerCase()} no responde en el servidor` };
    }
    return { estado: 'lista' };
  }
  return async (u, force = false) => {
    const hit = cache.get(u.id);
    if (!force && hit && Date.now() - hit.at < ttl) return hit.v;
    const v = await Promise.all(CAPACIDADES.map(async (c) => ({ id: c.id, nombre: c.nombre, descripcion: c.descripcion, pesada: c.pesada, ...(await uno(c, u)) })));
    cache.set(u.id, { at: Date.now(), v });
    return v;
  };
}
