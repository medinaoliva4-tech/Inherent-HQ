// Puente medidor → planificador: cuántas llamadas "sin pago por token" caben entre ahora y un deadline.
// Nivel → proveedores gratis/de suscripción que lo atienden (pago por token NO cuenta: requiere aprobación).
export const PROVEEDORES_POR_NIVEL = {
  alto: [],                          // frontier es por token: solo con aprobación/tope
  medio: ['cline'],
  bajo: ['nvidia'],
};

// Supuestos mientras no haya tope publicado (Cline Pass, NVIDIA). Se reemplazan al calibrar con el medidor.
export const SUPUESTOS_LLAMADAS = {
  cline: { '5h': 120, semana: 1500, mes: 5000 },
  nvidia: { dia: 1000 },
};

const H = 3600e3;
const UTC8 = 8 * H;

/** Cuántos reinicios completos de la ventana caen en (desde, hasta]. */
function reinicios(def, desde, hasta) {
  if (def.tipo === 'rodante') return Math.floor((hasta - desde) / (def.horas * H));
  const largo = 24 * H;
  if (def.tipo === 'dia_utc8') return Math.floor((hasta + UTC8) / largo) - Math.floor((desde + UTC8) / largo);
  if (def.tipo === 'dia_utc') return Math.floor(hasta / largo) - Math.floor(desde / largo);
  if (def.tipo === 'mes_utc') { const a = new Date(desde), b = new Date(hasta); return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth(); }
  return 0;
}

export function capacidadDesdeMedidor(medidor, { config, mapa = PROVEEDORES_POR_NIVEL, supuestos = SUPUESTOS_LLAMADAS } = {}) {
  return (nivel, desde, hasta) => {
    let total = 0;
    for (const id of mapa[nivel] ?? []) {
      const ventanas = config[id].ventanas;
      let cupoProv = Infinity;
      for (const [nombre, def] of Object.entries(ventanas)) {
        const tope = def.llamadas ?? supuestos[id]?.[nombre];
        if (!tope) continue;
        const w = medidor.estadoProveedor(id, desde).ventanas[nombre];
        const restante = Math.max(0, tope - w.llamadas);
        cupoProv = Math.min(cupoProv, restante + tope * reinicios(def, desde, hasta));
      }
      if (cupoProv !== Infinity) total += cupoProv;
    }
    return total;
  };
}
