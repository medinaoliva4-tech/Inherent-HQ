// El ciclo de contenido del 1 al 20 (puro: sin DOM ni red). Lo usan Decide, Hoy, ⌘K y el calendario.
// Del manual (CLAUDE.md · «El ciclo de contenido»): día 1 reunión · 1-3 plan · 2-3 calendario y shot list · 3-6 guidelines ·
// 4-5 coordinar · 6-10 producir · 11 ÚLTIMO día para producir · 12-15 montar · 16-19 cambios y programación · 20 presentación.
// Lo presentado el 20 se publica desde el día 1 del mes siguiente. Los límites del 11 y el 20 no se mueven.
export const HITOS = [11, 20];
export const DIAS_CICLO = 20;

// La fase del día, en una frase para la persona. `foco` = qué área de trabajo pesa hoy (decide el orden de «Decide» y de Hoy).
const FASES = [
  { hasta: 1, id: 'reunion', nombre: 'Reunión con el cliente', foco: ['strategy'] },
  { hasta: 3, id: 'plan', nombre: 'Plan, calendario y shot list', foco: ['strategy', 'marketing'] },
  { hasta: 5, id: 'guidelines', nombre: 'Guía de marca y coordinación', foco: ['creative', 'strategy'] },
  { hasta: 10, id: 'producir', nombre: 'Producir', foco: ['production'] },
  { hasta: 11, id: 'ultimo', nombre: 'Último día para producir', foco: ['production'] },
  { hasta: 15, id: 'montar', nombre: 'Montar', foco: ['production', 'creative'] },
  { hasta: 19, id: 'cambios', nombre: 'Cambios y programación', foco: ['creative', 'marketing'] },
  { hasta: 20, id: 'presentacion', nombre: 'Presentación al cliente', foco: ['marketing'] },
  { hasta: 31, id: 'publicacion', nombre: 'Publicación del ciclo presentado', foco: ['marketing'] },
];

// `fecha`: 'AAAA-MM-DD' o Date. Un Date se lee en el huso que se indique (por defecto, Guatemala, UTC-6, sin horario de verano):
// así «hoy» es el mismo día para el servidor y para quien abre el OS desde otro huso.
export function parteDeFecha(fecha, { offsetHoras = -6 } = {}) {
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fecha)) { const [y, m, d] = fecha.slice(0, 10).split('-').map(Number); return { y, m, d }; }
  const t = new Date(fecha instanceof Date ? fecha.getTime() : Date.now()); if (Number.isNaN(t.getTime())) throw new RangeError('Fecha inválida');
  const l = new Date(t.getTime() + offsetHoras * 3600e3);
  return { y: l.getUTCFullYear(), m: l.getUTCMonth() + 1, d: l.getUTCDate() };
}
const diasDelMes = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export function cicloDe(fecha, opts) {
  const { y, m, d } = parteDeFecha(fecha, opts);
  const fase = FASES.find((f) => d <= f.hasta) || FASES[FASES.length - 1];
  // El próximo hito firme (11 o 20); pasado el 20, el 11 del mes siguiente.
  const proximo = d <= 11 ? 11 : d <= 20 ? 20 : null;
  const diasAlHito = proximo ? proximo - d : diasDelMes(y, m) - d + 11;
  return {
    dia: d, mes: `${y}-${String(m).padStart(2, '0')}`, fase: { id: fase.id, nombre: fase.nombre }, foco: fase.foco,
    hito: d === 11 ? 11 : d === 20 ? 20 : null, proximoHito: proximo ?? 11, diasAlHito, enCiclo: d <= DIAS_CICLO,
    // 0 = sin prisa · 1 = se acerca (3 días o menos) · 2 = es hoy
    presion: diasAlHito === 0 ? 2 : diasAlHito <= 3 ? 1 : 0,
  };
}

// «Falta un día para el 11», «Hoy es el 20», «Faltan 4 días para el 11»: la frase que ve la persona.
export function frasesDeHito(c) {
  if (c.hito) return c.hito === 11 ? 'Hoy es el último día para producir' : 'Hoy es la presentación al cliente';
  if (c.diasAlHito === 1) return `Falta un día para el ${c.proximoHito}`;
  return `Faltan ${c.diasAlHito} días para el ${c.proximoHito}`;
}
