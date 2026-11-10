// Ventanas de tiempo para cuotas. Todo en milisegundos UTC; la "hora local" de ModelScope es UTC+8.
const H = 3600e3;
const UTC8 = 8 * H;

/** Inicio y fin de la ventana que contiene `ahora` (ms). Las rodantes devuelven fin = ahora. */
export function ventana(def, ahora, eventosTs = []) {
  switch (def.tipo) {
    case 'rodante': {
      const dur = def.horas * H;
      return { desde: ahora - dur, hasta: ahora, duracion: dur, rodante: true };
    }
    case 'dia_utc8': {
      const inicio = Math.floor((ahora + UTC8) / (24 * H)) * 24 * H - UTC8;
      return { desde: inicio, hasta: inicio + 24 * H, duracion: 24 * H, rodante: false };
    }
    case 'mes_utc': {
      const d = new Date(ahora);
      const desde = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
      const hasta = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
      return { desde, hasta, duracion: hasta - desde, rodante: false };
    }
    case 'dia_utc': {
      const desde = Math.floor(ahora / (24 * H)) * 24 * H;
      return { desde, hasta: desde + 24 * H, duracion: 24 * H, rodante: false };
    }
    default: throw new Error(`ventana desconocida: ${def.tipo}`);
  }
}

/** Cuándo se libera cupo: calendario = fin de ventana; rodante = el evento más viejo + duración. */
export function reiniciaEn(def, ahora, tsEnVentana) {
  const v = ventana(def, ahora);
  if (!v.rodante) return v.hasta;
  if (!tsEnVentana.length) return null;
  return Math.min(...tsEnVentana) + v.duracion;
}
