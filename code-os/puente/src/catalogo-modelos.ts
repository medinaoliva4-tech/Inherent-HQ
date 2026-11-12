import type { ModelInfo } from './models.js';

/** Alias nativos del arnés de Claude (suscripción por login) y el nivel de LiteLLM al que caen sin sesión. */
export const CLAUDE_ALIAS: Record<string, string> = { opus: 'nivel-alto', sonnet: 'nivel-medio', haiku: 'nivel-bajo' };
export const esAliasClaude = (m: string) => Object.prototype.hasOwnProperty.call(CLAUDE_ALIAS, m);

export type Nivel = 'alto' | 'medio' | 'bajo';
export type Rol = 'planifica' | 'ejecuta';
export interface ModeloCatalogo {
  id: string;
  nombre: string;
  nivel: Nivel;
  roles: Rol[];
  disponible: boolean;
  /** 0 = gratis · 1 = incluido en una suscripción (cupo) · 2 = cupo alto o pago por token · 3 = el más caro. */
  costo_relativo: number;
  via: 'claude_login' | 'litellm';
  respaldos?: string[];
  nota?: string;
}
export interface Preset { id: string; nombre: string; planifica: string; ejecuta: string; plan_ejecucion: boolean; disponible: boolean; nota: string }

interface Ficha { nombre: string; nivel: Nivel; costo: number; respaldos?: string[]; nota?: string }

// Respaldos tal como están en code-os/litellm/litellm.yaml (router_settings.fallbacks).
const NIVELES: Record<string, Ficha> = {
  'nivel-alto': { nombre: 'Nivel alto', nivel: 'alto', costo: 2, respaldos: ['cp-kimi-k3.1-pro', 'cp-kimi-k3', 'cp-glm-5.3', 'cp-deepseek-v4-pro', 'cp-minimax-m3', 'nv-nemotron-3-ultra', 'nv-mistral-large-4'], nota: 'Con tu sesión de Claude corre como Opus; sin ella, Cline Pass top y respaldos' },
  'nivel-medio': { nombre: 'Nivel medio', nivel: 'medio', costo: 1, respaldos: ['cp-glm-5.3', 'cp-deepseek-v4-pro', 'cp-minimax-m3', 'nv-nemotron-3-ultra', 'nv-mistral-large-4'], nota: 'Cline Pass (Kimi K3) con respaldos; ejecución diaria' },
  'nivel-bajo': { nombre: 'Nivel bajo', nivel: 'bajo', costo: 0, respaldos: ['nv-mistral-large-4', 'nv-nemotron-lightning', 'nv-deepseek-v4.1-flash'], nota: 'Modelos abiertos en NVIDIA, gratis; tareas repetitivas' },
  'nivel-bajo-pago': { nombre: 'Nivel bajo (pago)', nivel: 'bajo', costo: 2, nota: 'DeepSeek V4 Flash por token: válvula con aprobación' },
};

/** Ficha de un alias de LiteLLM: niveles conocidos y, para alias directos, por prefijo. */
export function ficha(id: string): Ficha {
  if (NIVELES[id]) return NIVELES[id]!;
  if (id === 'cp-kimi-k3.1-pro') return { nombre: 'Kimi K3.1 Pro (Cline Pass)', nivel: 'alto', costo: 1 };
  if (id.startsWith('cp-')) return { nombre: `${id.slice(3)} (Cline Pass)`, nivel: 'medio', costo: 1 };
  if (id.startsWith('nv-')) return { nombre: `${id.slice(3)} (NVIDIA, gratis)`, nivel: 'bajo', costo: 0 };
  if (id.startsWith('ds-')) return { nombre: `DeepSeek ${id.slice(3)} (por token)`, nivel: id.includes('pro') ? 'medio' : 'bajo', costo: 2 };
  if (id.startsWith('fr-')) return { nombre: 'Frontier por llave', nivel: 'alto', costo: 3 };
  return { nombre: id, nivel: 'medio', costo: 1 };
}
const CLAUDE: Record<string, Ficha> = {
  opus: { nombre: 'Claude Opus (tu suscripción)', nivel: 'alto', costo: 3 },
  sonnet: { nombre: 'Claude Sonnet (tu suscripción)', nivel: 'medio', costo: 2 },
  haiku: { nombre: 'Claude Haiku (tu suscripción)', nivel: 'bajo', costo: 1 },
};
const roles = (n: Nivel): Rol[] => (n === 'alto' ? ['planifica'] : n === 'medio' ? ['planifica', 'ejecuta'] : ['ejecuta']);

/** Nivel de cualquier id que acepta el puente (alias de Claude o de LiteLLM). */
export const nivelDe = (id: string): Nivel => (esAliasClaude(id) ? CLAUDE[id]!.nivel : ficha(id).nivel);

/** Los de imagen viven en code-os/imagen (no son modelos de chat). */
const esImagen = (id: string) => /^(imagen-|img-)/.test(id);

export function catalogoModelos(litellm: ModelInfo[], claude: { installed: boolean; active: boolean }, permitido: (id: string) => boolean): ModeloCatalogo[] {
  const out: ModeloCatalogo[] = [];
  for (const [id, f] of Object.entries(CLAUDE)) {
    const respaldo = CLAUDE_ALIAS[id]!;
    if (!claude.installed && !permitido(respaldo)) continue;
    out.push({ id, nombre: f.nombre, nivel: f.nivel, roles: roles(f.nivel), disponible: claude.active, costo_relativo: f.costo, via: 'claude_login', nota: claude.active ? 'Corre con tu login de Claude en el servidor' : `Sin sesión de Claude cae a ${respaldo}` });
  }
  for (const { id } of litellm) {
    if (esImagen(id)) continue;
    const f = ficha(id);
    out.push({ id, nombre: f.nombre, nivel: f.nivel, roles: roles(f.nivel), disponible: true, costo_relativo: f.costo, via: 'litellm', ...(f.respaldos ? { respaldos: f.respaldos } : {}), ...(f.nota ? { nota: f.nota } : {}) });
  }
  return out;
}

export function presets(modelos: ModeloCatalogo[], claudeActivo: boolean): Preset[] {
  const hay = (id: string) => modelos.some((m) => m.id === id && m.disponible);
  const alto = claudeActivo ? 'opus' : 'nivel-alto';
  const barato = claudeActivo ? 'haiku' : 'nivel-medio';
  return [
    { id: 'planifica-fuerte', nombre: 'Planifica fuerte, ejecuta barato', planifica: alto, ejecuta: barato, plan_ejecucion: true, disponible: hay(alto) && hay(barato), nota: 'El modelo fuerte planea y revisa; el ejecutor barato hace el trabajo con herramientas' },
    { id: 'rapido-gratis', nombre: 'Todo rápido y gratis', planifica: 'nivel-bajo', ejecuta: 'nivel-bajo', plan_ejecucion: false, disponible: hay('nivel-bajo'), nota: 'Modelos abiertos de NVIDIA; para tareas simples o borradores' },
    { id: 'maxima-calidad', nombre: 'Máxima calidad', planifica: alto, ejecuta: alto, plan_ejecucion: false, disponible: hay(alto), nota: 'Todo con el modelo más fuerte; gasta más cupo' },
  ];
}
