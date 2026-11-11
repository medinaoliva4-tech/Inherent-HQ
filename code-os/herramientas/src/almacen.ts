import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { malo } from './errores.js';
import { datosVacios, ID_RE, type DatosCliente } from './tipos.js';

/**
 * Dónde vive la memoria de cada cliente. La lógica (`Memoria`) solo usa esta interfaz, así que cambiar de archivos
 * JSON a la base de ceo-os es escribir otra implementación (ver `docs/herramientas-api.md` → «Conectar con ceo-os»).
 */
export interface Almacen {
  /** Ids de los clientes que tienen datos. */
  listarClientes(): Promise<string[]>;
  /** Copia de los datos del cliente (vacía si no existe). */
  leer(cliente: string): Promise<DatosCliente>;
  /**
   * Lee → `fn` modifica → guarda, de forma atómica y en serie por cliente. Si `fn` lanza, no se guarda nada.
   * En una base: BEGIN · SELECT … FOR UPDATE · fn · UPDATE · COMMIT.
   */
  transaccion<T>(cliente: string, fn: (d: DatosCliente) => T): Promise<T>;
}

const clienteValido = (c: string) => { if (typeof c !== 'string' || !ID_RE.test(c)) throw malo('«cliente» inválido: minúsculas, números y guiones (máx. 64)'); return c; };

/** Cola por clave: las transacciones del mismo cliente corren una tras otra. */
class Colas {
  private colas = new Map<string, Promise<unknown>>();
  run<T>(k: string, fn: () => T | Promise<T>): Promise<T> {
    const prev = this.colas.get(k) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    const cola = next.catch(() => undefined);
    this.colas.set(k, cola);
    void cola.then(() => { if (this.colas.get(k) === cola) this.colas.delete(k); });
    return next;
  }
}

/** En memoria: para pruebas y para la interfaz con mock. */
export class AlmacenMemoria implements Almacen {
  private datos = new Map<string, string>();
  private colas = new Colas();
  async listarClientes() { return [...this.datos.keys()].sort(); }
  async leer(cliente: string) { const s = this.datos.get(clienteValido(cliente)); return s ? (JSON.parse(s) as DatosCliente) : datosVacios(); }
  transaccion<T>(cliente: string, fn: (d: DatosCliente) => T): Promise<T> {
    clienteValido(cliente);
    return this.colas.run(cliente, async () => { const d = await this.leer(cliente); const r = fn(d); this.datos.set(cliente, JSON.stringify(d)); return r; });
  }
}

/** Un archivo `<dir>/<cliente>.json` (modo 600) por cliente. Escritura atómica: archivo temporal + rename. */
export class AlmacenJson implements Almacen {
  private colas = new Colas();
  constructor(private dir: string) { mkdirSync(dir, { recursive: true, mode: 0o700 }); }
  private ruta(cliente: string) { return join(this.dir, `${clienteValido(cliente)}.json`); }
  async listarClientes() {
    return readdirSync(this.dir).filter((f) => f.endsWith('.json') && ID_RE.test(f.slice(0, -5))).map((f) => f.slice(0, -5)).sort();
  }
  async leer(cliente: string): Promise<DatosCliente> {
    const p = this.ruta(cliente);
    if (!existsSync(p)) return datosVacios();
    const d = JSON.parse(readFileSync(p, 'utf8')) as DatosCliente;
    if (d.formato !== 1) throw new Error(`Formato desconocido en ${p}`);
    return d;
  }
  transaccion<T>(cliente: string, fn: (d: DatosCliente) => T): Promise<T> {
    const p = this.ruta(cliente);
    return this.colas.run(cliente, async () => {
      const d = await this.leer(cliente);
      const r = fn(d);
      const tmp = `${p}.${randomUUID()}.tmp`;
      writeFileSync(tmp, JSON.stringify(d, null, 1), { mode: 0o600 });
      chmodSync(tmp, 0o600);
      renameSync(tmp, p);
      return r;
    });
  }
}
