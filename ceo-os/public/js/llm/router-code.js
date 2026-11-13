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
  const t = String(texto || ''), capacidades = detectarCapacidades(t);
  const con = (r) => ({ ...r, capacidades, preset: presetDe(r, capacidades) });
  if (/\b(revisa|revisar|revisi[oó]n|code review|review)\b/i.test(t) && !/\b(seguridad|auditor[ií]a)\b/i.test(t)) {
    const nivel = ultimo === 'nivel-alto' ? 'nivel-medio' : 'nivel-alto';
    const c = nivel === 'nivel-alto' ? 'sous' : 'linea';
    return con({ cocinero: c, ...COCINEROS[c], motivo: 'Revisión: la hace otro cocinero distinto al que construyó' });
  }
  for (const [c, re, motivo] of REGLAS) if (re.test(t)) return con({ cocinero: c, ...COCINEROS[c], motivo });
  return con({ cocinero: 'linea', ...COCINEROS.linea, motivo: 'Construir' });
}

// ---- Capacidades por intención: «entra a Figma», «genera una imagen», «corre las pruebas»… ----
// Cada regla: [capacidad, expresión, por qué]. Una negación justo antes («sin Figma», «no uses Figwright») no cuenta.
const CAP_REGLAS = [
  ['figwright', /\b(figwright|figma)\b/i, 'Pediste trabajar en Figma'],
  ['imagen', /\b(genera(r|me)?|crea(r|me)?|haz(me)?|dibuja(r|me)?|hacer|necesito|quiero)\s+(una?\s+|unas?\s+|la\s+|las\s+)?(nueva\s+)?(im[aá]gen(es)?|ilustraci[oó]n(es)?|foto(s)?\s+(con|de)\s+ia|render)\b/i, 'Pediste generar una imagen'],
  ['video', /\b(genera(r|me)?|crea(r|me)?|haz(me)?|edita(r|me)?|corta(r|me)?|monta(r|me)?|anima(r|me)?)\s+(una?\s+|el\s+|los\s+|este\s+)?(video|reel|clip)s?\b/i, 'Pediste trabajar un video'],
  ['codigo', /\b(crea(r|me)?|escribe|genera(r|me)?|guarda(r|me)?|edita(r|me)?)\s+((un|el|este|los|unos)\s+)?(archivos?|script|c[oó]digo|componente|repo)\b|\b(corre(r|me)?|ejecuta(r|me)?|lanza(r)?)\s+(los\s+|las\s+|el\s+|un\s+|este\s+)?(tests?|pruebas|script|comando|npm|build|servidor|migraci[oó]n)\b|^\s*corre\b|\b(commit|pull request|refactor(iza)?|repositorio)\b/i, 'Pediste trabajar con archivos o comandos'],
  ['radar', /\b(radar|tendencias?\s+(de|en)|qu[eé]\s+est[aá]\s+(funcionando|pasando)\s+en|investiga(r)?\s+(a\s+)?la\s+competencia|esp[ií]a(r)?\s+a\s+la\s+competencia|scrape(a|ar)?|scrapea)\b/i, 'Pediste ver qué pasa en redes y en la competencia'],
  ['herramientas', /\b(usa|usar|abre|con)\s+(tus\s+|las\s+|mis\s+)?(herramientas|conectores|conexiones|mcps?)\b/i, 'Pediste usar las herramientas conectadas'],
];
const NEGADA = /\b(sin|no\s+(uses?|abras?|entres?|toques?|necesito|quiero|hace\s+falta)|nada\s+de)\s+(\S+\s+){0,2}$/i;
/** → [{ id, motivo }] en el orden de CAP_REGLAS, sin repetir. Puro. */
export function detectarCapacidades(texto) {
  const t = String(texto || ''), out = [];
  for (const [id, re, motivo] of CAP_REGLAS) {
    const m = re.exec(t); if (!m) continue;
    if (NEGADA.test(t.slice(Math.max(0, m.index - 30), m.index))) continue;
    if (!out.some((x) => x.id === id)) out.push({ id, motivo });
  }
  return out;
}
// El preset del equipo para esta tarea (Auto). Sin capacidades es una plática: no hace falta planificar → null.
// Seguridad y lo que sale caro si sale mal: máxima calidad. Mecánico: rápido y gratis. Lo demás: planifica fuerte, ejecuta barato.
function presetDe(r, caps) {
  if (/seguridad/i.test(r.motivo)) return 'maxima-calidad';
  if (!caps.length) return null;
  if (r.cocinero === 'prep') return 'rapido-gratis';
  return 'planifica-fuerte';
}

export const NIVELES_CODE = ['auto', 'nivel-alto', 'nivel-medio', 'nivel-bajo'];
