import type { Area } from './hilo'

/** Herramientas que se abren como artefacto en el panel derecho (diseño §3). */
export type IdHerramienta = 'icp' | 'adquisicion' | 'dolores' | 'pilares' | 'radar' | 'campanas' | 'pre' | 'video'
export const HERRAMIENTAS: Record<IdHerramienta, { nombre: string; area: Area; ayuda: string }> = {
  icp: { nombre: 'Perfil del cliente ideal', area: 'strategy', ayuda: 'Criterios del ICP y su regla guía' },
  adquisicion: { nombre: 'Calculadora de adquisición', area: 'strategy', ayuda: 'Prospectos (outbound) y alcance (inbound)' },
  dolores: { nombre: 'Dolores y deseos', area: 'strategy', ayuda: 'Dolores, deseos e historia villano-héroe' },
  pilares: { nombre: 'Pilares × ángulos', area: 'creative', ayuda: 'Ideas por pilar y ángulo' },
  radar: { nombre: 'Radar', area: 'creative', ayuda: 'Referentes, winners y contenido quemado' },
  campanas: { nombre: 'Campañas', area: 'creative', ayuda: 'Copy ↔ ideas ↔ piezas ↔ resultado esperado' },
  pre: { nombre: 'Production Pre', area: 'production', ayuda: 'Hoja imprimible: jornada, shot list, permisos' },
  video: { nombre: 'Video', area: 'production', ayuda: 'Style menu de la marca, referencias y desglose por video' },
}

/**
 * El workspace se arma según el ROL: qué herramientas ve primero y qué agentes tiene a mano.
 * El editor ve el editor de video; estrategia ve el perfil y las calculadoras. El CEO y el COO ven todo.
 */
export type Rol = 'ceo' | 'coo' | 'estrategia' | 'creativo' | 'produccion' | 'editor' | 'diseno'
export type Persona = { id: string; nombre: string; rol: Rol }

export const ROLES: Record<Rol, { nombre: string; herramientas: IdHerramienta[]; agentes: string[] }> = {
  ceo: { nombre: 'CEO', herramientas: ['icp', 'adquisicion', 'dolores', 'pilares', 'radar', 'campanas', 'pre', 'video'], agentes: ['estrategia', 'creativo', 'produccion', 'diseno'] },
  coo: { nombre: 'COO', herramientas: ['campanas', 'pre', 'pilares', 'icp', 'adquisicion', 'dolores', 'radar', 'video'], agentes: ['estrategia', 'creativo', 'produccion', 'diseno'] },
  estrategia: { nombre: 'Estrategia', herramientas: ['icp', 'adquisicion', 'dolores'], agentes: ['estrategia'] },
  creativo: { nombre: 'Marketing y Creative', herramientas: ['radar', 'pilares', 'campanas', 'dolores'], agentes: ['creativo'] },
  produccion: { nombre: 'Producción', herramientas: ['pre', 'campanas', 'video'], agentes: ['produccion'] },
  editor: { nombre: 'Editor de video', herramientas: ['video', 'pre'], agentes: ['produccion'] },
  diseno: { nombre: 'Diseño gráfico', herramientas: ['campanas', 'pilares'], agentes: ['diseno'] },
}

/** Personas de demostración: solo para ver cómo cambia el workspace. Los nombres reales viven en el OS. */
export const PERSONAS: Persona[] = (Object.keys(ROLES) as Rol[]).map((rol) => ({ id: `demo-${rol}`, nombre: `Demo · ${ROLES[rol].nombre}`, rol }))

export const herramientasDe = (rol: Rol) => ROLES[rol].herramientas
