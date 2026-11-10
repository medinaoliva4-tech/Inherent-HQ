# Modelos verificados (LiteLLM · Contabo)

Verificado el **2026-11-10** con llamadas reales a través de un LiteLLM temporal (puerto 4100, misma versión 1.108.0 y mismas llaves que producción) usando `litellm/verificar-modelos.py`.
Pruebas por alias: (a) chat corto, (b) tool calling por `/v1/messages` (formato Anthropic, el de Claude Code), (c) "aguja en un pajar" de ~8k, ~28k y ~60k tokens. No se probó más de 60k para no gastar cupo de Cline Pass; el contexto máximo real de cada modelo **no está medido**.

## Tabla

| Alias | Proveedor | Chat corto | Tool calling `/v1/messages` | Contexto probado (aguja) | Veredicto |
|---|---|---|---|---|---|
| `cp-kimi-k3.1-pro` | Cline Pass | 1–12 s (razona ~500 tokens aun para "hola") | ✅ 2.0 s | ✅ 60k ≈ 11 s | **Alto (top de Cline Pass)**. Existe `cline-pass/kimi-k3.1-pro`; `kimi-k3.1`, `*-ultra` y `glm-5.3-prime` dan 404 |
| `cp-kimi-k3` | Cline Pass | 4–14 s (razona) | ✅ 5/5 en repetición (1 fallo suelto en la primera corrida) | ✅ 8k·28k·60k (60k ≈ 22 s) | Medio, primero de la lista |
| `cp-glm-5.3` | Cline Pass | 0.9 s | ✅ 1.0 s | ✅ 60k ≈ 12 s | Medio, el más rápido |
| `cp-deepseek-v4-pro` | Cline Pass | 0.6 s | ✅ 0.6 s | ✅ 60k ≈ 48 s (lento con contexto grande) | Medio |
| `cp-minimax-m3` | Cline Pass | 1.4 s | ✅ 1.0 s | ✅ 60k ≈ 12 s (28k llegó a 22 s) | Medio |
| `nv-nemotron-3-ultra` | NVIDIA | 0.7–5 s | ✅ 1.3 s | ✅ 60k ≈ 8 s | **Bajo, primero de NVIDIA** |
| `nv-mistral-large-4` | NVIDIA | 2–15 s (variable) | ✅ 1.9 s | ✅ 60k ≈ 29 s | Bajo, segundo |
| `nv-step-5` | NVIDIA | 12.6 s | ✅ 1.1 s | ✅ 60k ≈ 18 s | Reserva (lento al arrancar) |
| `nv-nemotron-lightning` | NVIDIA | 1.4 s | ✅ 3.1 s | ✅ 60k ≈ 13 s | Bajo, tercero |
| `nv-deepseek-v4.1-flash` | NVIDIA | ❌ timeout 90 s (2 corridas) | ❌ timeout | ❌ | Último de la lista, con timeout de 20 s |
| `nv-glm-5.3-flash` | NVIDIA | ❌ timeout | ❌ | ❌ | Fuera de los niveles |
| `nv-minimax-m3.1-flash` | NVIDIA | ❌ timeout (una vez 76 s) | ❌ | ❌ | Fuera de los niveles |
| `nv-kimi-k2.6` | NVIDIA | ❌ 404 "Function not found for account" | ❌ | ❌ | Fuera: la cuenta no lo tiene desplegado |
| `ds-v4-*` / `nivel-bajo-pago` | DeepSeek | sin llave (responde 401) | — | — | **Pendiente**: falta `DEEPSEEK_API_KEY` |
| `fr-frontier` / `nivel-alto` | Frontier | sin llave | — | — | **Pendiente**: proveedor por elegir |


## Hallazgos que importan

1. **(Resuelto en producción)** El callback `cuotas_callback.py` sube `max_tokens` a un piso (1,000; 2,000 en `nivel-alto`/`cp-kimi-k3.1-pro`) en los alias `nivel-*`, `cp-*` y `nv-*`. Verificado: con `max_tokens=20` las tres rutas responden. Antes, **Cline Pass devolvía HTTP 500 `empty response content` si `max_tokens` es muy bajo** (con 20 falla, con 200 pasa). Son modelos que razonan y gastan el presupuesto pensando. Cualquier cliente que use los niveles debe pedir `max_tokens` ≥ 200 (mejor ≥ 1000). Con valores bajos el nivel medio cae a NVIDIA por culpa de esto, no de un tope.
2. **NVIDIA gratuito es inestable**: de 84 modelos listados, solo ~8 respondían en 15 s; los de la familia "flash" (deepseek, glm, minimax) dan timeout. Los que sí sirven son los Nemotron, `mistral-large-4` y `step-5`.
3. **Modelos de razonamiento y `max_tokens`** (NVIDIA también): con 100 tokens devolvían contenido vacío. Mismo consejo.
4. Fallback verificado: con Cline fallando (máx. 20 tokens), `nivel-medio` recorrió los `cp-*` y terminó en `nv-nemotron-3-ultra` (cabecera `x-litellm-attempted-fallbacks: 1`). Con llave ausente (frontier) el router salta al siguiente en ~25 ms.
5. Límite conocido del medidor: LiteLLM solo avisa al callback del primer intento y del resultado final, no de cada eslabón intermedio de un fallback. Todo éxito sí queda contado; un 429 en un eslabón intermedio no.

## Niveles (config en `code-os/litellm/litellm.yaml`)

| Nivel | Primero | Respaldos en orden |
|---|---|---|
| `nivel-alto` | frontier por API key (placeholder, 120 s) | `cp-kimi-k3.1-pro` → `cp-kimi-k3` → `cp-glm-5.3` → `cp-deepseek-v4-pro` → `cp-minimax-m3` → `nv-nemotron-3-ultra` → `nv-mistral-large-4` |
| `nivel-medio` | `cp-kimi-k3` (90 s) | `cp-glm-5.3` → `cp-deepseek-v4-pro` → `cp-minimax-m3` → `nv-nemotron-3-ultra` → `nv-mistral-large-4` |
| `nivel-bajo` | `nv-nemotron-3-ultra` (45 s) | `nv-mistral-large-4` → `nv-nemotron-lightning` → `nv-deepseek-v4.1-flash` (20 s) |
| `nivel-bajo-pago` | DeepSeek por token | ninguno. **No es respaldo de nadie**: solo se llama a mano tras aprobar el gasto |

`num_retries: 0` (el fallback ya es el reintento), `allowed_fails: 2`, `cooldown_time: 60`. 402, 429, timeout, 5xx y llave ausente disparan el siguiente eslabón.
Los alias de Featherless (`kimi-k3`, `glm-5.3`, `deepseek-v4-*`) siguen en el archivo, intactos.
