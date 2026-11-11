// Cliente de imágenes. Habla con LiteLLM (/v1/images/generations y /v1/images/edits).
// Excepción: el nivel gratis (NVIDIA FLUX) no es compatible con OpenAI y se llama directo a ai.api.nvidia.com.
// Las llaves salen SOLO de variables de entorno (IMAGEN_LITELLM_KEY o LITELLM_MASTER_KEY; NVIDIA_API_KEY). Nunca se leen de archivos del repo.

/** Niveles análogos a nivel-alto/medio/bajo. `modelo` = el modelo primario (el que fija el precio estimado). */
export const NIVELES = {
  'imagen-alta': { modelo: 'gpt-image-2.5-sunburst', calidad: 'high', transparente: true, edita: true, transporte: 'litellm', uso: 'assets finales con transparencia, edición precisa con referencia' },
  'imagen-media': { modelo: 'gpt-image-2.5-flare', calidad: 'medium', transparente: true, edita: true, transporte: 'litellm', uso: 'diario: variantes, texturas, recortes, borradores con alfa' },
  'imagen-google': { modelo: 'gemini-nano-banana-2.1', calidad: '1K', transparente: false, edita: true, transporte: 'litellm', uso: 'fondos e ideas visuales opacos (no hace PNG transparente)' },
  'imagen-gratis': { modelo: 'nvidia-flux.1-schnell', calidad: 'n/a', transparente: false, edita: false, transporte: 'nvidia', uso: 'ideas y borradores sin costo; sin alfa, sin edición' },
};

export const resolverNivel = (nombre) => {
  if (NIVELES[nombre]) return { nivel: nombre, ...NIVELES[nombre] };
  const hit = Object.entries(NIVELES).find(([, v]) => v.modelo === nombre);
  if (hit) return { nivel: hit[0], ...hit[1] };
  throw new Error(`nivel/modelo desconocido: ${nombre} (válidos: ${Object.keys(NIVELES).join(', ')})`);
};

export function configDesdeEnv(env = process.env) {
  return {
    baseUrl: (env.IMAGEN_LITELLM_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, ''),
    llave: env.IMAGEN_LITELLM_KEY ?? env.LITELLM_MASTER_KEY ?? '',
    nvidiaUrl: (env.IMAGEN_NVIDIA_URL ?? 'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell'),
    nvidiaLlave: env.NVIDIA_API_KEY ?? '',
    timeoutMs: Number(env.IMAGEN_TIMEOUT_MS ?? 180000),
  };
}

async function pedir(url, init, timeoutMs, f) {
  const r = await f(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  const texto = await r.text(); let cuerpo; try { cuerpo = JSON.parse(texto); } catch { cuerpo = { raw: texto.slice(0, 300) }; }
  if (!r.ok) { const e = new Error(`HTTP ${r.status} de ${new URL(url).host}: ${(cuerpo.error?.message ?? cuerpo.detail ?? cuerpo.raw ?? '').toString().slice(0, 200)}`); e.http = r.status; throw e; }
  return { cuerpo, headers: r.headers };
}

const aBuf = (d) => (d.b64_json ? Buffer.from(d.b64_json, 'base64') : null);

/**
 * Una llamada = una imagen (así cada variante tiene su propio costo y semilla).
 * p: { nivel, prompt, tamano, calidad, transparente, referencias?:[{nombre,buf}], seed? }
 * Devuelve { buf, seed, usage, costo_header_usd, modelo_alias }
 */
export async function generarUna(p, cfg = configDesdeEnv(), f = globalThis.fetch) {
  const nv = resolverNivel(p.nivel);
  if (nv.transporte === 'nvidia') {
    if (!cfg.nvidiaLlave) throw Object.assign(new Error('falta NVIDIA_API_KEY en el entorno'), { sinLlave: true });
    if (p.referencias?.length) throw new Error('imagen-gratis no edita con referencia');
    const [w, h] = p.tamano.split('x').map(Number);
    const { cuerpo } = await pedir(cfg.nvidiaUrl, { method: 'POST', headers: { authorization: `Bearer ${cfg.nvidiaLlave}`, 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ prompt: p.prompt, width: w, height: h, steps: 4, ...(p.seed !== undefined ? { seed: p.seed } : {}) }) }, cfg.timeoutMs, f);
    // La documentación de NVIDIA no fija el esquema de respuesta; se aceptan las formas conocidas.
    const art = cuerpo.artifacts?.[0] ?? cuerpo.data?.[0] ?? cuerpo;
    const b64 = art.base64 ?? art.b64_json ?? art.image;
    if (!b64) throw new Error('respuesta de NVIDIA sin imagen');
    return { buf: Buffer.from(b64, 'base64'), seed: art.seed ?? p.seed ?? null, usage: null, costo_header_usd: 0, modelo_alias: nv.nivel };
  }
  if (!cfg.llave) throw Object.assign(new Error('falta IMAGEN_LITELLM_KEY (o LITELLM_MASTER_KEY) en el entorno'), { sinLlave: true });
  const auth = { authorization: `Bearer ${cfg.llave}` };
  const extra = {};
  if (nv.transparente && p.transparente) { extra.background = 'transparent'; extra.output_format = 'png'; }
  if (p.calidad && nv.calidad !== 'n/a' && nv.modelo.startsWith('gpt-image')) extra.quality = p.calidad;
  let res;
  if (p.referencias?.length) {
    const fd = new FormData();
    fd.set('model', nv.nivel); fd.set('prompt', p.prompt); fd.set('n', '1'); fd.set('size', p.tamano);
    for (const [k, v] of Object.entries(extra)) fd.set(k, String(v));
    for (const r of p.referencias) fd.append('image', new Blob([r.buf], { type: 'image/png' }), r.nombre ?? 'ref.png');
    res = await pedir(`${cfg.baseUrl}/v1/images/edits`, { method: 'POST', headers: auth, body: fd }, cfg.timeoutMs, f);
  } else {
    res = await pedir(`${cfg.baseUrl}/v1/images/generations`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ model: nv.nivel, prompt: p.prompt, n: 1, size: p.tamano, ...extra }) }, cfg.timeoutMs, f);
  }
  const d = res.cuerpo.data?.[0]; let buf = d && aBuf(d);
  if (!buf && d?.url) { const r = await f(d.url, { signal: AbortSignal.timeout(cfg.timeoutMs) }); buf = Buffer.from(await r.arrayBuffer()); }
  if (!buf) throw new Error('respuesta sin imagen (ni b64_json ni url)');
  const h = Number(res.headers.get('x-litellm-response-cost'));
  return { buf, seed: d.seed ?? null, usage: res.cuerpo.usage ?? null, costo_header_usd: Number.isFinite(h) && res.headers.get('x-litellm-response-cost') !== null ? h : null, modelo_alias: nv.nivel, revisado: d.revised_prompt ?? null };
}
