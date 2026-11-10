import type { UserRecord } from './config.js';

/**
 * Comprueba que ninguna llave de usuario tenga poderes de administrador en LiteLLM (o sea, que no sea la master):
 * una ruta solo de administrador (/user/list) debe responder 401/403 con una llave virtual.
 */
export async function verifyUserKeys(litellmUrl: string, users: UserRecord[], fetchFn: typeof fetch = fetch): Promise<void> {
  for (const u of users) {
    const res = await fetchFn(`${litellmUrl}/user/list`, { headers: { authorization: `Bearer ${u.litellmKey}` }, signal: AbortSignal.timeout(8000) });
    if (res.ok) throw new Error(`La llave del usuario ${u.id} tiene poderes de administrador (¿es la master key?). Genera una llave virtual limitada`);
  }
}
