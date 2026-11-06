// Solo las lecturas SELECT pueden repetirse: una escritura puede haber llegado a la base aunque se pierda su respuesta.
const transitorio = (e) => /fetch failed|network|timeout|timed out|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(`${e?.name} ${e?.message} ${e?.cause?.code}`);
export async function consultar(sql, text, params = [], { timeoutMs = 10000, esperar = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const intentos = /^\s*SELECT\b/i.test(text) ? 3 : 1;
  for (let n = 0; n < intentos; n++) {
    try { return await sql.query(text, params, { fetchOptions: { signal: AbortSignal.timeout(timeoutMs) } }); }
    catch (e) { if (n + 1 === intentos || !transitorio(e)) throw e; await esperar(250 * 2 ** n); }
  }
}
