import type { ClienteEventos, ModoSesion } from './eventos'

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
export type EstadoServidor = { claude: 'activa' | 'inactiva' | 'desconocido'; puente: 'conectado' | 'sin_conexion' | 'mock' }

export type NodoArchivo = { nombre: string; ruta: string; tipo: 'carpeta' | 'archivo'; hijos?: NodoArchivo[] }
export type ArchivoDiff = { ruta: string; anterior?: string; nuevo?: string; diff: string; mas: number; menos: number }

/** Servidor MCP del catálogo del puente (solo nombres: el cliente nunca manda comandos). */
export type ServidorMcp = { nombre: string; descripcion: string; estado: 'activo' | 'apagado' | 'error' }
export type Skill = { nombre: string; descripcion: string; contenido: string }

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
  // Ajustes
  mcp(): Promise<ServidorMcp[]>
  skills(): Promise<Skill[]>
}

export type ConfigCliente = { url?: string; token?: string; cuotasUrl?: string; cuotasToken?: string }

/** Lee la configuración de las variables de Vite. Sin `VITE_PUENTE_URL` se usa el mock. */
export function configDesdeEntorno(env: Record<string, string | undefined> = import.meta.env): ConfigCliente {
  const limpio = (v?: string) => (v && v.trim() ? v.trim().replace(/\/+$/, '') : undefined)
  return {
    url: limpio(env.VITE_PUENTE_URL),
    token: env.VITE_PUENTE_TOKEN?.trim() || undefined,
    cuotasUrl: limpio(env.VITE_CUOTAS_URL),
    cuotasToken: env.VITE_CUOTAS_TOKEN?.trim() || undefined,
  }
}
