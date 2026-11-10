// Cliente SQL: Neon (HTTP serverless) o Postgres normal (Supabase, Contabo…) según la URL.
// Misma interfaz en ambos: sql.query(text, params, opciones) → filas (array).
// En Vercel cada instancia usa 1 conexión; con Supabase usa el pooler (puerto 6543, modo transacción).
// TLS siempre verificado. Supabase firma con su propia CA: se da en DB_SSL_CA (PEM, la baja el panel de Supabase
// en Database → Settings → SSL Configuration), o su ruta en DB_SSL_CA_FILE (el servidor). Sin ninguna se usan las CA del sistema.
import { readFileSync } from 'node:fs';
export const esNeon = (url) => /(^|[.@/])neon\.tech([:/?]|$)/i.test(String(url));
const esLocal = (url) => /@(localhost|127\.0\.0\.1)[:/]/.test(String(url));

export function opcionesSsl(url, env = process.env) {
  if (esLocal(url)) return false;
  const ca = env.DB_SSL_CA ? env.DB_SSL_CA.replace(/\\n/g, '\n') : env.DB_SSL_CA_FILE ? readFileSync(env.DB_SSL_CA_FILE, 'utf8') : null;
  return ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true };
}

export async function crearSql(url, { PgPool, env = process.env } = {}) {
  if (esNeon(url)) {
    const { neon } = await import('@neondatabase/serverless');
    return neon(url);
  }
  const Pool = PgPool ?? (await import('pg')).default.Pool;
  const pool = new Pool({ connectionString: url, max: 1, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000, ssl: opcionesSsl(url, env) });
  pool.on?.('error', () => {}); // una conexión caída no tumba el proceso; la siguiente consulta abre otra
  return {
    query: async (text, params = []) => (await pool.query({ text, values: params, query_timeout: 10000 })).rows,
  };
}
