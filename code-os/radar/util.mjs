// Utilidades sin dependencias: correr binarios, caché en disco y ritmo educado por plataforma.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Corre un binario sin shell. encoding 'buffer' para salida binaria (fotogramas crudos). */
export function correr(bin, args, { timeout = 180_000, encoding = 'utf8' } = {}) {
  return new Promise((res, rej) => {
    execFile(bin, args, { maxBuffer: 256 * 1024 * 1024, timeout, encoding }, (err, stdout, stderr) => {
      if (err) {
        err.stderr = String(stderr ?? '').slice(-3000);
        return rej(err);
      }
      res({ stdout, stderr: String(stderr ?? '') });
    });
  });
}

export async function hayBinario(bin) {
  try { await correr('which', [bin], { timeout: 5000 }); return true; } catch { return false; }
}

/** Caché JSON en disco. ttlH = horas de vigencia (Infinity = no vence: transcripciones y huellas). */
export function crearCache(dir) {
  mkdirSync(dir, { recursive: true });
  const ruta = (k) => join(dir, createHash('sha1').update(k).digest('hex').slice(0, 24) + '.json');
  const cache = {
    dir,
    leer(k, ttlH = Infinity, ahora = Date.now()) {
      try {
        const j = JSON.parse(readFileSync(ruta(k), 'utf8'));
        if (j.k !== k) return undefined;
        if (Number.isFinite(ttlH) && ahora - j.t > ttlH * 3600e3) return undefined;
        return j.v;
      } catch { return undefined; }
    },
    escribir(k, v, ahora = Date.now()) {
      const p = ruta(k);
      writeFileSync(p + '.tmp', JSON.stringify({ k, t: ahora, v }));
      renameSync(p + '.tmp', p);
      return v;
    },
    async memo(k, ttlH, fn) {
      const v = cache.leer(k, ttlH);
      if (v !== undefined) return { v, deCache: true };
      return { v: cache.escribir(k, await fn()), deCache: false };
    },
  };
  return cache;
}

/**
 * Ritmo educado: entre dos peticiones a la misma plataforma pasa al menos `pausas[plataforma]` ms
 * (+ hasta `jitter` de azar). Las peticiones de una plataforma van en fila, nunca en paralelo.
 */
export function crearRitmo(pausas, { jitter = 0.3, dormir = (ms) => new Promise((r) => setTimeout(r, ms)), ahora = () => Date.now(), azar = Math.random } = {}) {
  const ultimo = new Map();
  const colas = new Map();
  return function turno(plataforma) {
    const prev = colas.get(plataforma) ?? Promise.resolve();
    const mio = prev.then(async () => {
      const base = pausas[plataforma] ?? 3000;
      const espera = (ultimo.get(plataforma) ?? -Infinity) + base * (1 + jitter * azar()) - ahora();
      if (espera > 0) await dormir(espera);
      ultimo.set(plataforma, ahora());
    });
    colas.set(plataforma, mio.catch(() => {}));
    return mio;
  };
}

export const mediana = (xs) => {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
