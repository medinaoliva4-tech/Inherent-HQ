import type { Calibracion, EntradaInbound, EntradaOutbound, ResultadoInbound, ResultadoOutbound } from './calculadora'
import type { ClienteEventos, ModoSesion } from './eventos'
import type { Aviso, Marca, Nodo, NodoNuevo } from './hilo'

/** Estado de una ventana de cupo, igual que `GET /cuotas` de code-os/cuotas (medidor.mjs). */
export type NivelCuota = 'ok' | 'aviso' | 'agotado' | 'sin_tope'
export type VentanaCuota = {
  llamadas: number
  usd: number
  tokens: number
  topes: { llamadas: number | null; usd: number | null }
  pct: number | null
  nivel: NivelCuota
  rechazos: number
  reinicia_en: string | null
  desde: string
}
export type ProveedorCuota = {
  id: string
  nombre: string
  tipo: 'suscripcion' | 'gratis' | 'pago' | 'otro'
  nivel: NivelCuota
  ventanas: Record<string, VentanaCuota>
}
export type AvisoCuota = {
  proveedor: string
  ventana: string
  nivel: 'aviso' | 'agotado'
  pct: number | null
  mensaje: string
  reinicia_en: string | null
}
export type EstadoCuotas = { generado: string; proveedores: ProveedorCuota[]; avisos: AvisoCuota[] }

/** Alias que el puente lee de LiteLLM (`GET /models`). */
export type Catalogo = { porDefecto: string; ids: string[] }

/** Lo que el servidor sabe del login de Claude. `desconocido` = el puente aún no lo expone. */
export type EstadoServidor = { claude: 'activa' | 'inactiva' | 'desconocido'; puente: 'conectado' | 'sin_conexion' | 'mock'; pista?: string }

export type NodoArchivo = { nombre: string; ruta: string; tipo: 'carpeta' | 'archivo'; hijos?: NodoArchivo[] }
export type ArchivoDiff = { ruta: string; anterior?: string; nuevo?: string; diff: string; mas: number; menos: number }

/** Servidor MCP del catálogo del puente (solo nombres: el cliente nunca manda comandos). */
export type ServidorMcp = { nombre: string; descripcion: string; estado: 'activo' | 'apagado' | 'error' }
export type Skill = { nombre: string; descripcion: string; contenido: string }
export type ResultadoFusion = { ok: true; vacio?: boolean } | { ok: false; conflicto: boolean; archivos: string[]; mensaje: string }
/** Un archivo de memoria del cliente (p. ej. `clients/<slug>/CLAUDE.md`) y si está cargado en la sesión. */
export type MemoriaCliente = { ruta: string; resumen: string; cargada: boolean }

/** Lo que algunas pantallas necesitan y el puente todavía no tiene: lanza este error en `http`. */
export class NoDisponible extends Error {
  que: string
  constructor(que: string) {
    super(`Esto todavía no está en el puente: ${que}.`)
    this.name = 'NoDisponible'
    this.que = que
  }
}

/** Una terminal: escribe lo que tecleas y avisa con lo que el servidor devuelve. */
export interface Terminal {
  escribir(datos: string): void
  redimensionar(cols: number, filas: number): void
  cerrar(): void
}

export interface Cliente extends ClienteEventos {
  readonly tipo: 'mock' | 'http'
  modelos(): Promise<Catalogo>
  cuotas(): Promise<EstadoCuotas>
  estado(): Promise<EstadoServidor>
  /** Cambia modelo o modo de una conversación ya creada en el servidor (entre turnos). */
  ajustarSesion(conversacionId: string, cambios: { modeloId?: string; modo?: ModoSesion; titulo?: string }): Promise<void>
  interrumpir(conversacionId: string): Promise<void>
  cerrarSesion(conversacionId: string): Promise<void>
  // Espacio de trabajo (pestaña Code)
  archivos(conversacionId: string): Promise<NodoArchivo[]>
  leerArchivo(conversacionId: string, ruta: string): Promise<string>
  guardarArchivo(conversacionId: string, ruta: string, contenido: string): Promise<void>
  diff(conversacionId: string): Promise<ArchivoDiff[]>
  abrirTerminal(conversacionId: string, alRecibir: (datos: string) => void): Promise<Terminal>
  /** `POST /sessions/:id/merge`: fusiona una sesión aislada con el proyecto. */
  fusionar(conversacionId: string): Promise<ResultadoFusion>
  /** Liga una conversación a una sesión del puente que ya existe (modo embebido: la crea el Chat del OS). */
  vincularSesion(conversacionId: string, sesionId: string): void
  /** ¿Esa conversación ya tiene sesión en el puente? (para saber si hay cambios, terminal, etc.) */
  sesionDe(conversacionId: string): string | null
  /** Memoria del cliente cargada en la sesión: qué CLAUDE.md entró. */
  memoriaCliente(clienteId: string): Promise<MemoriaCliente[]>
  // Ajustes
  mcp(): Promise<ServidorMcp[]>
  skills(): Promise<Skill[]>
  // Herramientas y el hilo del cliente (code-os/herramientas; forma final en code-os/docs/herramientas-api.md)
  /** `GET /clientes` */
  clientes(): Promise<Marca[]>
  /** `GET /clientes/:id/nodos` */
  nodos(clienteId: string): Promise<Nodo[]>
  /** `POST /clientes/:id/nodos` — nace como hipótesis. */
  crearNodo(clienteId: string, nuevo: NodoNuevo): Promise<Nodo>
  /** `GET /clientes/:id/nodos/:nid` */
  nodo(clienteId: string, nid: string): Promise<Nodo>
  /** `PUT /clientes/:id/nodos/:nid` — sube la versión, vuelve a hipótesis y avisa a lo que depende de él. */
  guardarNodo(clienteId: string, nid: string, cambios: CambiosNodo): Promise<Nodo>
  /** `POST /clientes/:id/nodos/:nid/aprobar { version }` — solo si abriste esa versión (regla F4.5; el servidor responde 409 si no). */
  aprobarNodo(clienteId: string, nid: string, leida: { version: number }): Promise<Nodo>
  /** `GET /clientes/:id/nodos/:nid/dependientes` */
  dependientes(clienteId: string, nid: string): Promise<Nodo[]>
  /** `GET /clientes/:id/avisos` */
  avisos(clienteId: string): Promise<Aviso[]>
  /** `POST /calc/outbound {meta,conversion,probabilidad,semanas} → {prospectos,porSemana,porDiaHabil}` */
  calcOutbound(e: EntradaOutbound): Promise<ResultadoOutbound>
  /** `POST /calc/inbound` */
  calcInbound(e: EntradaInbound): Promise<ResultadoInbound>
  /** `POST /clientes/:id/calibrar` — tasas reales de Zernio para la calculadora inbound. */
  calibrar(clienteId: string): Promise<Calibracion>
}

export type CambiosNodo = Partial<Pick<Nodo, 'titulo' | 'contenido' | 'fuente' | 'viene_de'>>

/** `herramientasUrl`: backend de herramientas (code-os/herramientas). Sin él, se piden al puente. */
export type ConfigCliente = {
  url?: string
  token?: string
  /** Token que cambia (el pase del OS en modo embebido, que caduca): se lee en cada petición y gana sobre `token`. */
  obtenerToken?: () => string | undefined
  /** El puente respondió 401 (p. ej. caducó el pase del OS): en modo embebido se pide uno nuevo. */
  alNoAutorizado?: () => void
  cuotasUrl?: string
  cuotasToken?: string
  herramientasUrl?: string
}

/**
 * Lee la configuración de las variables de Vite. Sin `VITE_PUENTE_URL` se usa el mock.
 * `VITE_PUENTE_URL=.` = mismo origen (cuando el puente sirve la interfaz compilada).
 */
export function configDesdeEntorno(env: Record<string, string | undefined> = import.meta.env): ConfigCliente {
  const limpio = (v?: string) => (v && v.trim() ? (v.trim() === '.' ? '' : v.trim().replace(/\/+$/, '')) : undefined)
  return {
    url: limpio(env.VITE_PUENTE_URL),
    token: env.VITE_PUENTE_TOKEN?.trim() || undefined,
    cuotasUrl: limpio(env.VITE_CUOTAS_URL),
    cuotasToken: env.VITE_CUOTAS_TOKEN?.trim() || undefined,
    herramientasUrl: limpio(env.VITE_HERRAMIENTAS_URL),
  }
}
