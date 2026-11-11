/** Tipos de nodo del hilo (diseño §4). */
export const TIPOS = ['producto', 'icp', 'dolor', 'deseo', 'pilar', 'angulo', 'campana', 'pieza', 'decision', 'adquisicion'] as const;
export type TipoNodo = (typeof TIPOS)[number];
export type EstadoNodo = 'hipotesis' | 'aprobado';

/** Nombre legible de cada tipo y área dueña (para los avisos: «cambió Strategy: dolor #2»). */
export const NOMBRE_TIPO: Record<TipoNodo, string> = {
  producto: 'producto', icp: 'ICP', dolor: 'dolor', deseo: 'deseo', pilar: 'pilar', angulo: 'ángulo',
  campana: 'campaña', pieza: 'pieza', decision: 'decisión', adquisicion: 'adquisición',
};
export const AREA_TIPO: Record<TipoNodo, string> = {
  producto: 'Strategy', icp: 'Strategy', dolor: 'Strategy', deseo: 'Strategy', decision: 'Strategy', adquisicion: 'Strategy',
  pilar: 'Marketing y Creative', angulo: 'Marketing y Creative', campana: 'Marketing y Creative', pieza: 'Diseño y Production',
};

export interface Lectura { usuario: string; version: number; en: string }

export interface Nodo {
  /** Id estable dentro del cliente (`dolor-2` por defecto). */
  id: string;
  cliente: string;
  tipo: TipoNodo;
  /** Número del nodo dentro de su tipo («dolor #2»). No cambia. */
  numero: number;
  titulo: string;
  /** Texto o JSON libre. Para `icp` se valida con el esquema del §6. */
  contenido: unknown;
  estado: EstadoNodo;
  /** Enlace o «hipótesis». */
  fuente: string;
  /** Ids de los nodos de los que sale este. */
  viene_de: string[];
  version: number;
  creado: string;
  actualizado: string;
  actualizado_por: string;
  /** Quién abrió el nodo y qué versión vio. Aprobar exige haber leído la versión actual (F4.5). */
  leido_por: Lectura[];
  aprobado_por?: string;
  aprobado_en?: string;
}

/** Foto de una versión anterior del nodo. */
export type VersionNodo = Omit<Nodo, 'leido_por'>;

export interface Aviso {
  id: string;
  cliente: string;
  /** Nodo que hay que revisar. */
  nodo: string;
  /** Nodo que cambió. */
  origen: string;
  origen_version: number;
  /** Camino origen → … → nodo. */
  ruta: string[];
  mensaje: string;
  creado: string;
  resuelto: boolean;
  resuelto_por?: string;
  resuelto_en?: string;
}

/** Todo lo de un cliente. Es la unidad que guarda el almacén. */
export interface DatosCliente {
  formato: 1;
  nodos: Record<string, Nodo>;
  historial: Record<string, VersionNodo[]>;
  avisos: Aviso[];
  /** Contador para ids de aviso. */
  secuencia: number;
}

export const datosVacios = (): DatosCliente => ({ formato: 1, nodos: {}, historial: {}, avisos: [], secuencia: 0 });

export const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
