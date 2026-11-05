// Pocket: el OS en el iPhone (PLAN-GATEWAY §22). Lo del día a día se queda; lo que necesita pantalla grande se abre en la compu.
export const pocket = () => typeof matchMedia === 'function' && matchMedia('(max-width:760px)').matches;
const SOLO_COMPU = [/^org\/setup/, /^org\/team\/(vistas|laya|roles)/, /^org\/finanzas\/(costs|profit|pricing|nomina)/, /^org\/services\/responsabilidades/, /^org\/operations\/time/, /^ai\/agentes\/[^/]+\/(workflow|settings)/];
export const soloCompu = (ruta) => SOLO_COMPU.some((r) => r.test(String(ruta || '')));
export const paraPocket = (xs, ruta) => (pocket() ? xs.filter((x) => !soloCompu(ruta(x))) : xs);
