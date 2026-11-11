/**
 * Router por tarea («equipo de cocina»). FUENTE: `ceo-os/public/js/llm/router-code.js` (el Chat del OS).
 * Esta es una copia en TypeScript con la MISMA tabla y las mismas reglas; `cocina.test.ts` compara las dos
 * con los mismos pedidos, así que si cambias una, la prueba te avisa que cambies la otra.
 *
 * El modelo caro solo donde un error cuesta más; el barato en lo repetitivo. La persona puede fijar un nivel y el
 * router no se mete (solo actúa con el modo «Auto»).
 */

export type Cocinero = 'chef' | 'sous' | 'linea' | 'prep'
export type Esfuerzo = 'máximo' | 'alto' | 'medio' | 'bajo'
export type NivelAlias = 'nivel-alto' | 'nivel-medio' | 'nivel-bajo'

export const COCINEROS: Record<Cocinero, { nombre: string; nivel: NivelAlias; esfuerzo: Esfuerzo }> = {
  chef: { nombre: 'Chef principal', nivel: 'nivel-alto', esfuerzo: 'máximo' },
  sous: { nombre: 'Sous chef', nivel: 'nivel-alto', esfuerzo: 'alto' },
  linea: { nombre: 'Cocinero de línea', nivel: 'nivel-medio', esfuerzo: 'medio' },
  prep: { nombre: 'Ayudante de prep', nivel: 'nivel-bajo', esfuerzo: 'bajo' },
}

/** Orden = prioridad: lo que más cuesta equivocarse gana si el pedido menciona varias cosas. */
const REGLAS: [Cocinero, RegExp, string][] = [
  ['chef', /seguridad|auditor[ií]a|vulnerab|pentest|owasp|inyecci[oó]n sql|xss/i, 'Auditoría de seguridad'],
  ['chef', /\b(planea|planear|planifica|planificar|plan para|arquitectura|dise[ñn]o del sistema|c[oó]mo construir|c[oó]mo har[ií]as|propuesta t[eé]cnica)\b/i, 'Planear antes de construir'],
  ['sous', /\b(bug|error raro|no s[eé] por qu[eé]|falla intermitente|race condition|depurar|se rompe sin raz[oó]n)\b/i, 'Un bug que nadie encuentra'],
  ['sous', /\b(auth|login|inicio de sesi[oó]n|contrase[ñn]a|pagos?|stripe|payments?|checkout|facturaci[oó]n|permisos?|tokens?)\b/i, 'Autenticación y pagos: nunca barato'],
  ['sous', /\b(ui|interfaz|frontend|front-end|css|componente|pantalla|responsive|dise[ñn]o visual|animaci[oó]n)\b/i, 'Interfaz'],
  ['linea', /\b(tests?|pruebas?|cobertura|unitari[oa]s?)\b/i, 'Pruebas'],
  ['prep', /\b(renombra|renombrar|rename|busca|buscar|encuentra|d[oó]nde est[aá]|lista(r)? los archivos|boilerplate|plantilla|formatea|formato|comentarios|documenta)\b/i, 'Buscar o tarea mecánica'],
]

export type Ruta = { cocinero: Cocinero; nombre: string; nivel: NivelAlias; esfuerzo: Esfuerzo; motivo: string }

/** Una revisión la hace OTRO cocinero: un nivel distinto al que construyó (`ultimo`), para que no se califique a sí mismo. */
export function rutear(texto: string, { ultimo = '' }: { ultimo?: string } = {}): Ruta {
  const t = String(texto || '')
  if (/\b(revisa|revisar|revisi[oó]n|code review|review)\b/i.test(t) && !/\b(seguridad|auditor[ií]a)\b/i.test(t)) {
    const nivel = ultimo === 'nivel-alto' ? 'nivel-medio' : 'nivel-alto'
    const c: Cocinero = nivel === 'nivel-alto' ? 'sous' : 'linea'
    return { cocinero: c, ...COCINEROS[c], motivo: 'Revisión: la hace otro cocinero distinto al que construyó' }
  }
  for (const [c, re, motivo] of REGLAS) if (re.test(t)) return { cocinero: c, ...COCINEROS[c], motivo }
  return { cocinero: 'linea', ...COCINEROS.linea, motivo: 'Construir' }
}

export const NIVELES_CODE = ['auto', 'nivel-alto', 'nivel-medio', 'nivel-bajo'] as const
/** Valor del selector de modelo para «que el router elija». */
export const AUTO = 'auto'

/**
 * Orden del CEO cuando hay Claude por login en el servidor. Se cambia AQUÍ, sin tocar componentes.
 * `id` vacío = el puente todavía no tiene ese alias: se manda el nivel (y el puente usa tu Claude primero si está activo).
 */
export const MODELOS_CLAUDE: Record<Cocinero, { nombre: string; id?: string }> = {
  chef: { nombre: 'Fable / Astra' },
  sous: { nombre: 'Sonnet' },
  linea: { nombre: 'Opus' },
  prep: { nombre: 'Haiku' },
}

/** Lo que de verdad viaja al puente para esa ruta. */
export function modeloDeRuta(r: Ruta, claudeActiva: boolean): string {
  return (claudeActiva && MODELOS_CLAUDE[r.cocinero].id) || r.nivel
}

/** «Sous chef · nivel-alto: Interfaz» (y el modelo de Claude si hay login). */
export function etiquetaRuta(r: Ruta, claudeActiva = false): string {
  const claude = claudeActiva ? ` (${MODELOS_CLAUDE[r.cocinero].nombre})` : ''
  return `${r.nombre} · ${r.nivel}${claude}: ${r.motivo.replace(/^Interfaz$/, 'interfaz')}`
}
