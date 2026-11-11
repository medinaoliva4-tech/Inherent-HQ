// Clasificación opcional con IA vía LiteLLM (API compatible con OpenAI). Sin llaves en el repo:
// VIGIA_LLM_URL (p. ej. http://127.0.0.1:4000) y VIGIA_LLM_KEY vienen del entorno del VPS.
// Si algo falla, el informe sigue con la clasificación por palabras clave.

export function configIa(env = process.env, opciones = {}) {
  const url = opciones.url ?? env.VIGIA_LLM_URL;
  const key = opciones.key ?? env.VIGIA_LLM_KEY ?? env.LITELLM_MASTER_KEY;
  if (opciones.sinIa || !url || !key) return null;
  return { url: url.replace(/\/+$/, ''), key, modelo: opciones.nivel ?? env.VIGIA_NIVEL ?? 'nivel-bajo', maxLlamadas: Number(opciones.maxLlamadas ?? env.VIGIA_MAX_LLAMADAS ?? 6), lote: 25 };
}

export function prompt(lote, temas) {
  const deps = Object.entries(temas.departamentos).map(([id, d]) => `- ${id}: ${d.nombre}`).join('\n');
  const lista = lote.map((it, i) => `${i}. ${it.titulo} — ${(it.resumen ?? '').slice(0, 220)}`).join('\n');
  return [
    { role: 'system', content: 'Eres el radar de tecnología de Inherent, agencia de crecimiento de marcas (estrategia, marketing, creatividad, producción de video, diseño, community, posting y ads). Respondes SOLO JSON válido, en español de tú, sin inventar datos.' },
    { role: 'user', content: `Departamentos:\n${deps}\n\nPara cada ítem decide: "dep" (id del departamento que más gana o null si no sirve), "rel" (0 = ruido, 1 = curioso, 2 = útil, 3 = probar ya) y "porque" (una línea, máx. 20 palabras, qué ganaría Inherent). Devuelve {"items":[{"i":0,"dep":"ads","rel":2,"porque":"..."}]}.\n\n${lista}` },
  ];
}

export function leerRespuesta(texto) {
  const m = String(texto).match(/\{[\s\S]*\}/);
  if (!m) return [];
  try { return JSON.parse(m[0]).items ?? []; } catch { return []; }
}

/** Ajusta ítems ya clasificados. Devuelve {items, llamadas, errores}. */
export async function clasificarConIa(items, temas, cfg, fetchFn = fetch) {
  if (!cfg) return { items, llamadas: 0, errores: [] };
  const out = items.map((x) => ({ ...x }));
  const errores = [];
  let llamadas = 0;
  for (let i = 0; i < out.length && llamadas < cfg.maxLlamadas; i += cfg.lote) {
    const lote = out.slice(i, i + cfg.lote);
    llamadas++;
    try {
      const r = await fetchFn(`${cfg.url}/v1/chat/completions`, {
        method: 'POST', signal: AbortSignal.timeout(120000),
        headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.key}` },
        body: JSON.stringify({ model: cfg.modelo, temperature: 0, messages: prompt(lote, temas) }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      for (const v of leerRespuesta(j.choices?.[0]?.message?.content)) {
        const it = lote[v.i];
        if (!it) continue;
        it.ia = { rel: Number(v.rel) || 0, porque: String(v.porque ?? '').slice(0, 200) };
        if (v.dep && temas.departamentos[v.dep] && it.departamentos[0]?.id !== v.dep) {
          it.departamentos = [{ id: v.dep, palabras: ['(IA)'] }, ...it.departamentos.filter((d) => d.id !== v.dep)];
        }
        if (it.ia.rel === 0) it.ruido = true;
        it.puntaje = Math.round((it.puntaje + (it.ia.rel - 1) * 2) * 10) / 10;
      }
    } catch (e) { errores.push(`lote ${i / cfg.lote}: ${e.message}`); }
  }
  return { items: out, llamadas, errores };
}
