// Cliente mínimo de LiteLLM (Gateway del VPS) con tope de llamadas y de dólares.
// Por defecto usa `nivel-bajo` (NVIDIA, gratis). Si el gasto estimado pasara el tope, no llama.
import { readFileSync } from 'node:fs';

const TIPOS = ['pregunta', 'promesa', 'curiosidad', 'controversia', 'demostracion', 'historia', 'resultado', 'humor', 'otro'];

export function prompt({ titulo, transcripcion, plataforma, duracion_s }) {
  return [
    { role: 'system', content: 'Eres analista de contenido corto. Respondes SOLO un objeto JSON válido, en español, sin texto extra.' },
    {
      role: 'user',
      content: `Publicación de ${plataforma}${duracion_s ? ` (${duracion_s}s)` : ''}.\nTítulo: ${String(titulo ?? '').slice(0, 200)}\nTranscripción (inicio): ${String(transcripcion ?? '').slice(0, 900) || '(sin voz)'}\n\n` +
        `Devuelve {"gancho": "la frase o idea de los primeros 3 segundos, literal si existe", "tipo": uno de ${JSON.stringify(TIPOS)}, "por_que": "una frase: por qué retiene", "angulo": "el ángulo o tema en 3-6 palabras"}`,
    },
  ];
}

export function leerJson(texto = '') {
  const limpio = String(texto).replace(/```(?:json)?/g, '').trim();
  const m = limpio.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export function crearIA(cfg, { fetchImpl = fetch } = {}) {
  const { base, key, nivel, nivelVision, usdPorMTokens, timeoutMs } = cfg.litellm;
  const tope = cfg.presupuesto;
  const estado = { llamadas: 0, tokens: 0, usd: 0, omitidas: 0, errores: 0 };

  async function resumirGancho(post, { fotograma } = {}) {
    if (!key) return { omitido: 'sin LITELLM_MASTER_KEY' };
    if (estado.llamadas >= tope.llamadasIA) { estado.omitidas++; return { omitido: 'tope de llamadas' }; }
    const mensajes = prompt(post);
    const modelo = fotograma && nivelVision ? nivelVision : nivel;
    if (fotograma && nivelVision) {
      const b64 = readFileSync(fotograma).toString('base64');
      mensajes[1].content = [{ type: 'text', text: mensajes[1].content + '\nTe paso el primer fotograma: describe también el gancho visual.' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } }];
    }
    const tokensEst = Math.ceil(JSON.stringify(mensajes).length / 4) + 250;
    const usdEst = (tokensEst * usdPorMTokens) / 1e6;
    if (usdEst > 0 && estado.usd + usdEst > tope.usd) { estado.omitidas++; return { omitido: 'presupuesto' }; }
    estado.llamadas++;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetchImpl(`${base}/chat/completions`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: modelo, messages: mensajes, temperature: 0.2, max_tokens: 300 }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { estado.errores++; return { error: j?.error?.message?.slice(0, 200) ?? `HTTP ${r.status}` }; }
      const usados = j.usage?.total_tokens ?? tokensEst;
      estado.tokens += usados;
      estado.usd += (usados * usdPorMTokens) / 1e6;
      const datos = leerJson(j.choices?.[0]?.message?.content);
      if (!datos) { estado.errores++; return { error: 'respuesta sin JSON' }; }
      return { ...datos, modelo: j.model ?? modelo, tokens: usados };
    } catch (e) {
      estado.errores++;
      return { error: e.name === 'AbortError' ? 'tiempo agotado' : String(e.message).slice(0, 200) };
    } finally {
      clearTimeout(t);
    }
  }

  return { resumirGancho, estado: () => ({ ...estado, usd: Math.round(estado.usd * 1e6) / 1e6 }) };
}
