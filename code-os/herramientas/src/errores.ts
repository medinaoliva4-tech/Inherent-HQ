/** Error de entrada o de regla. `status` sigue la convención HTTP del puente (400 entrada, 404 no existe, 409 regla/conflicto). */
export class ErrorHerramienta extends Error {
  constructor(public status: number, message: string, public detalle?: unknown) { super(message); }
}

export const malo = (msg: string, detalle?: unknown) => new ErrorHerramienta(400, msg, detalle);

export function numero(v: unknown, campo: string, ctx: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw malo(`${ctx}: «${campo}» debe ser un número`);
  return v;
}

export function tasa(v: unknown, campo: string, ctx: string, { cero = false } = {}): number {
  const x = numero(v, campo, ctx);
  if (x > 1 || x < 0 || (!cero && x === 0)) throw malo(`${ctx}: «${campo}» debe estar entre 0 y 1${cero ? '' : ' (sin incluir 0)'}`);
  return x;
}
