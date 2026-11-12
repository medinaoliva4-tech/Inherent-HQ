// LA TABLA DE MODELOS DEL CHAT — el único lugar que se edita para cambiar quién cocina.
// La verdad la da el puente (GET /models → modelos y presets). Lo de aquí es:
//   · COCINA: el orden del CEO para el «equipo de cocina» (el router Auto elige por tarea con esto).
//   · RESPALDO (MOCK): el catálogo y los presets que se ven mientras el puente no publica los suyos. Está marcado con
//     `mock: true` y la pantalla lo dice. Cuando el puente ya responde, se ignora.
// Para cambiar un modelo: cambia el id aquí (y que exista en el puente). Nada más en el Chat depende de los nombres.

// Orden del CEO: chef = Fable / Astra · sous = Sonnet · línea = Opus · prep = Haiku (con Claude por login).
// Sin Claude por login, cada puesto cae al nivel del Gateway de al lado (nivel-alto, nivel-medio, nivel-bajo).
export const COCINA = {
  chef: { nombre: 'Chef principal', modelos: ['fable', 'astra'], respaldo: 'nivel-alto' },
  sous: { nombre: 'Sous chef', modelos: ['sonnet'], respaldo: 'nivel-alto' },
  linea: { nombre: 'Cocinero de línea', modelos: ['opus-5.5'], respaldo: 'nivel-medio' },
  prep: { nombre: 'Ayudante de prep', modelos: ['haiku-5.5'], respaldo: 'nivel-bajo' },
};

export const NIVELES = [['alto', 'Altos'], ['medio', 'Medios'], ['bajo', 'Bajos']];

// MOCK: el catálogo mientras el puente no lo publica. via: 'claude_login' (tu suscripción de Claude) · 'gateway' (LiteLLM).
// costo_relativo: 0 gratis … 5 lo más caro (solo para ordenar y avisar).
export const MODELOS_RESPALDO = [
  { id: 'fable', nombre: 'Fable', nivel: 'alto', roles: ['planifica'], disponible: false, costo_relativo: 5, via: 'claude_login' },
  { id: 'astra', nombre: 'Astra', nivel: 'alto', roles: ['planifica'], disponible: false, costo_relativo: 5, via: 'claude_login' },
  { id: 'opus-5.5', nombre: 'Opus 5.5', nivel: 'alto', roles: ['planifica', 'ejecuta'], disponible: false, costo_relativo: 4, via: 'claude_login' },
  { id: 'nivel-alto', nombre: 'Nivel alto del Gateway', nivel: 'alto', roles: ['planifica', 'ejecuta'], disponible: true, costo_relativo: 3, via: 'gateway' },
  { id: 'sonnet', nombre: 'Sonnet', nivel: 'medio', roles: ['planifica', 'ejecuta'], disponible: false, costo_relativo: 2, via: 'claude_login' },
  { id: 'nivel-medio', nombre: 'Nivel medio del Gateway', nivel: 'medio', roles: ['ejecuta'], disponible: true, costo_relativo: 1, via: 'gateway' },
  { id: 'haiku-5.5', nombre: 'Haiku 5.5', nivel: 'bajo', roles: ['ejecuta'], disponible: false, costo_relativo: 1, via: 'claude_login' },
  { id: 'nivel-bajo', nombre: 'Nivel bajo del Gateway (gratis)', nivel: 'bajo', roles: ['ejecuta'], disponible: true, costo_relativo: 0, via: 'gateway' },
].map((m) => ({ ...m, mock: true }));

// MOCK: los presets. El primero es el destacado. planifica === ejecuta → un solo modelo (sin plan_ejecucion).
export const PRESETS_RESPALDO = [
  { id: 'planifica-fuerte', nombre: 'Planifica fuerte, ejecuta barato', planifica: 'opus-5.5', ejecuta: 'haiku-5.5', nota: 'Un modelo fuerte arma el plan y revisa; uno barato hace los pasos.', destacado: true },
  { id: 'rapido-gratis', nombre: 'Todo rápido y gratis', planifica: 'nivel-bajo', ejecuta: 'nivel-bajo', nota: 'Para preguntas cortas y tareas mecánicas.' },
  { id: 'maxima-calidad', nombre: 'Máxima calidad', planifica: 'fable', ejecuta: 'opus-5.5', nota: 'Para lo que sale caro si sale mal: seguridad, pagos, una entrega al cliente.' },
].map((p) => ({ ...p, mock: true }));
