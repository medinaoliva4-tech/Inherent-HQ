// Medidor de cuotas: cuenta uso por proveedor y ventana, avisa al 80% y marca agotado.
import { ventana, reiniciaEn } from './ventanas.mjs';
import { cargarConfig } from './config.mjs';

export const UMBRAL_AVISO = 0.8;
const MIN10 = 10 * 60e3;

/** Una llamada cuenta como consumo salvo que ni siquiera llegó al proveedor (llave ausente). */
const cuenta = (e) => e.error_tipo !== 'sin_llave';
const esAgotado = (e) => e.http === 402 || e.http === 429;

export function crearMedidor({ config = cargarConfig(), ahora = () => Date.now() } = {}) {
  const eventos = [];

  function registrar(e) {
    const ev = { ...e, ts: typeof e.ts === 'number' ? e.ts : Date.parse(e.ts ?? new Date(ahora()).toISOString()) };
    if (!ev.proveedor) throw new Error('evento sin proveedor');
    eventos.push(ev);
    return ev;
  }

  function estadoProveedor(id, t = ahora()) {
    const prov = config[id];
    const mios = eventos.filter((e) => e.proveedor === id);
    const ventanas = {};
    for (const [nombre, def] of Object.entries(prov.ventanas)) {
      const v = ventana(def, t);
      const dentro = mios.filter((e) => e.ts >= v.desde && e.ts < (v.rodante ? t + 1 : v.hasta) && cuenta(e));
      const llamadas = dentro.length;
      const usd = dentro.reduce((s, e) => s + (e.costo_usd ?? 0), 0);
      const tokens = dentro.reduce((s, e) => s + (e.tokens_in ?? 0) + (e.tokens_out ?? 0), 0);
      const topes = { llamadas: def.llamadas ?? null, usd: def.usd ?? null };
      const fracs = [];
      if (topes.llamadas) fracs.push(llamadas / topes.llamadas);
      if (topes.usd) fracs.push(usd / topes.usd);
      const pct = fracs.length ? Math.max(...fracs) : null;
      const rechazos = dentro.filter(esAgotado);
      const agotadoPorProveedor = mios.some((e) => esAgotado(e) && e.ts > t - MIN10);
      let nivel = 'sin_tope';
      if (pct !== null) nivel = pct >= 1 ? 'agotado' : pct >= UMBRAL_AVISO ? 'aviso' : 'ok';
      if (agotadoPorProveedor) nivel = 'agotado'; // el proveedor mismo dijo basta (sirve aunque no haya tope conocido)
      else if (pct === null && llamadas > 0) nivel = 'sin_tope';
      ventanas[nombre] = {
        llamadas, usd: +usd.toFixed(6), tokens, topes,
        pct: pct === null ? null : +pct.toFixed(4),
        nivel, rechazos: rechazos.length,
        reinicia_en: (() => { const r = reiniciaEn(def, t, dentro.map((e) => e.ts)); return r ? new Date(r).toISOString() : null; })(),
        desde: new Date(v.desde).toISOString(),
      };
    }
    const orden = { agotado: 3, aviso: 2, ok: 1, sin_tope: 0 };
    const peor = Object.values(ventanas).reduce((a, w) => (orden[w.nivel] > orden[a] ? w.nivel : a), 'sin_tope');
    return { id, nombre: prov.nombre, tipo: prov.tipo, nivel: peor, ventanas };
  }

  function estado(t = ahora()) {
    const proveedores = Object.keys(config).map((id) => estadoProveedor(id, t));
    const avisos = [];
    for (const p of proveedores) for (const [w, d] of Object.entries(p.ventanas)) {
      if (d.nivel === 'aviso') avisos.push({ proveedor: p.id, ventana: w, nivel: 'aviso', pct: d.pct, mensaje: `${p.nombre} va en ${Math.round(d.pct * 100)}% de su cupo (${w}).`, reinicia_en: d.reinicia_en });
      if (d.nivel === 'agotado') avisos.push({ proveedor: p.id, ventana: w, nivel: 'agotado', pct: d.pct, mensaje: `${p.nombre} agotó su cupo (${w}).`, reinicia_en: d.reinicia_en });
    }
    return { generado: new Date(t).toISOString(), proveedores, avisos };
  }

  /** Cupo restante por proveedor/ventana (null = desconocido/ilimitado). Lo usa el planificador. */
  function restante(id, nombreVentana, t = ahora()) {
    const w = estadoProveedor(id, t).ventanas[nombreVentana];
    const def = config[id].ventanas[nombreVentana];
    return {
      llamadas: def.llamadas ? Math.max(0, def.llamadas - w.llamadas) : null,
      usd: def.usd ? Math.max(0, def.usd - w.usd) : null,
    };
  }

  return { registrar, estado, estadoProveedor, restante, eventos };
}
