// El router de Code: elegir el modelo por la TAREA, no por la marca (la idea del «equipo de cocina»).
// El modelo más caro solo donde un error cuesta más (planear, auditar seguridad); el barato en lo repetitivo (buscar, renombrar).
// Mapeado a los tres niveles del Gateway: nivel-alto (frontier: tu Claude o Cline top) · nivel-medio (Cline) · nivel-bajo (NVIDIA, gratis).
// Puro (lo prueba scripts/test-code.mjs). Es una sugerencia barata: la persona puede fijar un nivel y el router no se mete.

export const COCINEROS = {
  chef: { nombre: 'Chef principal', nivel: 'nivel-alto', esfuerzo: 'máximo' },
  sous: { nombre: 'Sous chef', nivel: 'nivel-alto', esfuerzo: 'alto' },
  linea: { nombre: 'Cocinero de línea', nivel: 'nivel-medio', esfuerzo: 'medio' },
  prep: { nombre: 'Ayudante de prep', nivel: 'nivel-bajo', esfuerzo: 'bajo' },
};

// Orden = prioridad: lo que más cuesta equivocarse gana si el pedido menciona varias cosas.
const REGLAS = [
  ['chef', /seguridad|auditor[ií]a|vulnerab|pentest|owasp|inyecci[oó]n sql|xss/i, 'Auditoría de seguridad'],
  ['chef', /\b(planea|planear|planifica|planificar|plan para|arquitectura|dise[ñn]o del sistema|c[oó]mo construir|c[oó]mo har[ií]as|propuesta t[eé]cnica)\b/i, 'Planear antes de construir'],
  ['sous', /\b(bug|error raro|no s[eé] por qu[eé]|falla intermitente|race condition|depurar|se rompe sin raz[oó]n)\b/i, 'Un bug que nadie encuentra'],
  ['sous', /\b(auth|login|inicio de sesi[oó]n|contrase[ñn]a|pagos?|stripe|payments?|checkout|facturaci[oó]n|permisos?|tokens?)\b/i, 'Autenticación y pagos: nunca barato'],
  ['sous', /\b(ui|interfaz|frontend|front-end|css|componente|pantalla|responsive|dise[ñn]o visual|animaci[oó]n)\b/i, 'Interfaz'],
  ['linea', /\b(tests?|pruebas?|cobertura|unitari[oa]s?)\b/i, 'Pruebas'],
  ['prep', /\b(renombra|renombrar|rename|busca|buscar|encuentra|d[oó]nde est[aá]|lista(r)? los archivos|boilerplate|plantilla|formatea|formato|comentarios|documenta)\b/i, 'Buscar o tarea mecánica'],
];

/**
 * → { cocinero, nombre, nivel, esfuerzo, motivo }. Una revisión de código la hace OTRO cocinero: un nivel distinto al
 * que construyó (`ultimo`), para que no se califique a sí mismo.
 */
export function rutear(texto, { ultimo = '' } = {}) {
  const t = String(texto || '');
  if (/\b(revisa|revisar|revisi[oó]n|code review|review)\b/i.test(t) && !/\b(seguridad|auditor[ií]a)\b/i.test(t)) {
    const nivel = ultimo === 'nivel-alto' ? 'nivel-medio' : 'nivel-alto';
    const c = nivel === 'nivel-alto' ? 'sous' : 'linea';
    return { cocinero: c, ...COCINEROS[c], motivo: 'Revisión: la hace otro cocinero distinto al que construyó' };
  }
  for (const [c, re, motivo] of REGLAS) if (re.test(t)) return { cocinero: c, ...COCINEROS[c], motivo };
  return { cocinero: 'linea', ...COCINEROS.linea, motivo: 'Construir' };
}

export const NIVELES_CODE = ['auto', 'nivel-alto', 'nivel-medio', 'nivel-bajo'];
