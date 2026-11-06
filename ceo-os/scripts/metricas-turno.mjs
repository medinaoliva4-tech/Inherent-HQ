import fs from 'node:fs';
import path from 'node:path';
// Lista blanca: nunca serializar prompts, argumentos, resultados ni mensajes de error del proveedor.
export function medidaSegura(r) {
  const numero = (n) => Number.isFinite(n) && n >= 0 ? n : null;
  const error = (e) => ['CONTEXTO', 'TimeoutError', 'AbortError', 'TypeError', 'Error'].includes(e) ? e : e ? 'Error' : null;
  return { id: String(r.id || '').slice(0, 64), at: String(r.at || '').slice(0, 32), estado: ['terminado','error','limite'].includes(r.estado) ? r.estado : 'error', tiempo_ms: numero(r.tiempo_ms), error: error(r.error),
    llamadas: (r.llamadas || []).map((x) => ({ modelo: /^[\w./:-]{1,120}$/.test(x.modelo || '') ? x.modelo : 'desconocido', tiempo_ms: numero(x.tiempo_ms), espera_ms: numero(x.espera_ms), espera_reintentos_ms: numero(x.espera_reintentos_ms), http_status: numero(x.http_status), reintentos: numero(x.reintentos), entrada: numero(x.entrada), salida: numero(x.salida), error: error(x.error) })) };
}
export function guardarMedida(archivo, registro) {
  fs.mkdirSync(path.dirname(archivo), { recursive: true, mode: 0o700 });
  fs.appendFileSync(archivo, JSON.stringify(medidaSegura(registro)) + '\n', { mode: 0o600 });
}
