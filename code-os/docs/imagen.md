# Imágenes en Code OS y el Chat del OS

Investigado y leído de las páginas oficiales el **2026-11-11**. Lo que no se pudo confirmar se marca. Código en `code-os/imagen/`, propuesta de config en `code-os/litellm/imagen.litellm.yaml` (no activa).

## 1. Modelos (API real, precio, límites)

| Nivel | Modelo (id de API) | Fondo transparente | Edición con referencia | Tamaño máx. | Precio por imagen | Llave |
|---|---|---|---|---|---|---|
| **imagen-alta** | `gpt-image-2.5-sunburst` (OpenAI) | Sí (`background:"transparent"` + PNG/WebP) | Sí, `/v1/images/edits`, varias imágenes (ejemplo oficial con 4), máscara con alfa | Lados múltiplos de 16, ≤3840, 655 360–8 294 400 px, razón ≤3:1; >2560x1440 experimental | `high` 1024²: ≈ **$0.053**; `medium`: ≈ **$0.013** (1) | `OPENAI_API_KEY` |
| **imagen-media** | `gpt-image-2.5-flare` (OpenAI) | Sí | Sí | Igual | Igual que Sunburst según la tabla leída (1); más rápida | `OPENAI_API_KEY` |
| **imagen-google** | `gemini-nano-banana-2.1` (Google) | **No documentado** | Sí, hasta 14 referencias | 1K/2K/4K | **$0.0336** (1K) · $0.0504 (2K) · $0.113 (4K) | `GEMINI_API_KEY` |
| **imagen-gratis** | `black-forest-labs/flux.1-schnell` (NVIDIA build) | No (salida RGB) | No | 1024², 768x1344, 1344x768, 896x1152, 1152x896, 832x1216, 1216x832; 1–4 pasos | Servicio de **prueba** (NVIDIA API Trial Terms); sin precio ni límite publicados | `NVIDIA_API_KEY` (ya existe) |

Otros que existen y no se usan por defecto: `gpt-image-1-mini` (oficial: low $0.005 / medium $0.011 / high $0.036 a 1024²; transparencia sin confirmar en la doc leída), `gemini-3.1-flash-lite-image` ($0.0336 1K, no optimizado para varias referencias), `gemini-3-pro-image` ($0.134 1K/2K, $0.24 4K), `gpt-image-2.6-sunburst/-flare` (tarifa por token publicada, $30/M de salida; SVG y GIF; no se evaluó). `gpt-image-2` ya **no** hace transparencia (un proveedor reporta que OpenAI la cerró el 2026-09-30; no lo confirmé en la doc oficial). `gemini-2.5-flash-image` se apaga el 2027-03-15. Imagen de Google está cerrado ("shut down").

(1) OpenAI cobra **por token** ($30 por millón de salida, $5 texto de entrada, $8 imagen de entrada). La página oficial no trae USD por imagen de la familia 2.5; el valor sale de 439 (medium) y 1 756 (high) tokens de salida a 1024² publicados por Grida, **solo la salida** (el prompt y las referencias suman un poco más). `low`, `xhigh` y `max` no tienen precio leído: el estimador no los estima (pide `--precio-usd`). Otros tamaños se escalan por píxeles y se marcan «aproximado». El costo **real** sale de la cabecera `x-litellm-response-cost` o de `usage`.

**Límites.** OpenAI Flare, nivel Build: 250 000 TPM y **20 imágenes/min** (150 en Launch, 250 en Grow). Gemini: no hay capa gratis para salida de imagen y todas las imágenes llevan marca SynthID. NVIDIA: en octubre de 2026 hay reportes en su foro de 403 (organización personal) y 500 en FLUX.1-dev; no verificado con llave propia.

## 2. Cómo se llama desde LiteLLM

- **OpenAI**: `model: openai/gpt-image-2.5-…`. `POST /v1/images/generations` (JSON: `model, prompt, n, size, quality, background, output_format`) y `POST /v1/images/edits` (multipart: `image` repetido, `prompt, size, …`). LiteLLM soporta edits en proxy desde v1.71.1; la doc leída da ejemplos con `gpt-image-1`, **no** con 2.5: probar con la versión del VPS (`drop_params: true` hace que un parámetro no soportado se ignore en silencio, p. ej. la transparencia; por eso se valida el alfa).
- **Gemini**: LiteLLM lo documenta por `/chat/completions` con `modalities:["image","text"]` y en `/images/edits` (`gemini-2.5-flash-image`, desde v1.79.3). **`/images/generations` con `gemini-nano-banana-2.1` no está confirmado**. Alternativa directa: `POST https://generativelanguage.googleapis.com/v1beta/interactions`, `x-goog-api-key`, `Api-Revision: 2026-05-20`, imagen en `interaction.output_image` (base64).
- **NVIDIA FLUX**: **LiteLLM no lo enruta** (API propia, no OpenAI). Llamada directa: `POST https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell`, `Authorization: Bearer $NVIDIA_API_KEY`, JSON `{prompt,width,height,steps,seed}`. El esquema de respuesta no está documentado; el cliente acepta `artifacts[0].base64`, `data[0].b64_json` o `image` (sin probar con la API real).

## 3. Niveles y respaldo

```
imagen-alta   gpt-image-2.5-sunburst  → imagen-media → gpt-image-1-mini     (llave: OPENAI_API_KEY)
imagen-media  gpt-image-2.5-flare     → gpt-image-1-mini                    (llave: OPENAI_API_KEY)
imagen-google gemini-nano-banana-2.1  → gemini-3.1-flash-lite-image         (llave: GEMINI_API_KEY)  opaco
imagen-gratis FLUX.1-schnell NVIDIA   → (sin respaldo)                      (llave: NVIDIA_API_KEY)  opaco, directo
```

Regla: **la transparencia solo la dan los OpenAI**, por eso alta y media no caen a Google ni NVIDIA (devolverían fondo opaco). Pedir `transparente` en google/gratis se **bloquea** antes de gastar. El cliente estima con el modelo primario; si el router cae a un respaldo, el costo real lo corrige.

Llaves nuevas: `OPENAI_API_KEY`, `GEMINI_API_KEY` (agregar `setkey` a `code-os/litellm/set-keys.sh` al fusionar; este PR no lo toca). Las pone el CEO con `ssh -t inherent-gw 'bash ~/set-keys.sh'`. Nunca en el repo ni en el chat.

## 4. Regla de uso (skill `gd-assets`, PR #297)

PNG transparente cuando va encima, tamaño exacto, solo hex de la paleta, 3–4 variantes, **nunca logos ni personas reales**, la foto base no se genera. **Se muestra el costo y se pide OK antes de cada lote; cada lote se registra** (fecha, pieza, cantidad, costo real). El código lo impone: sin `aprobado_usd`/`--ok-usd` ≥ estimación no genera.

## 5. `code-os/imagen/` (Node ≥22.2, sin dependencias)

```
src/cliente.mjs  niveles + llamadas (LiteLLM generations/edits; NVIDIA directo)
src/precios.*    tabla leída el 2026-11-11, estimador, costo real desde usage
src/validar.mjs  PNG: tamaño exacto, canal alfa, esquinas/fondo transparente, sin halo, paleta aproximada, peso
src/lote.mjs     estimar → topes → OK → generar N → validar → guardar → gasto.jsonl
src/cli.mjs      imagen estimar|generar|variantes|validar   (generar --estimar = solo costo)
src/mcp.mjs      servidor MCP stdio
```

Variables (todas por entorno; ninguna llave se lee de archivos del repo): `IMAGEN_LITELLM_URL` (def. `http://127.0.0.1:4000`), `IMAGEN_LITELLM_KEY` o `LITELLM_MASTER_KEY`, `NVIDIA_API_KEY`, `IMAGEN_SALIDA`, `IMAGEN_GASTO`, **`IMAGEN_TOPE_LOTE_USD`** (def. 5) y **`IMAGEN_TOPE_MES_USD`** (def. 50): si el lote o el mes lo exceden, **bloquea sin llamar a la API**. Opcional `CUOTAS_URL`/`CUOTAS_TOKEN` para avisar al medidor por `POST /evento`.

Salida: `<pieza>-<asset>-v<N>-<a|b|c|d>.png` + `.json` con prompt, modelo, nivel, tamaño, calidad, seed (si el proveedor la da), `costo_estimado_usd`, `costo_real_usd` y su fuente (`litellm`/`tokens`/`estimado`), sha256 y la validación. Un lote nuevo sube la versión (v2…): **nada se sobreescribe**. Un PNG que no valida **se guarda igual**, marcado `ok:false`, para que la persona lo vea.

### `gasto.jsonl` (enlaza con `code-os/cuotas`)

Una línea por lote, mismo formato que `eventos.jsonl` del medidor (`ts` en ms, `proveedor`, `costo_usd`, `http`, `error_tipo`) más campos de imagen:

```json
{"ts":1794400000000,"proveedor":"openai_imagen","tipo":"imagen","modelo":"gpt-image-2.5-flare","nivel":"imagen-media","http":200,"costo_usd":0.0396,"costo_estimado_usd":0.0395,"cantidad":3,"cantidad_pedida":3,"pieza":"IG Oct 03","asset":"Ondas","lote":"…uuid","tamano":"1080x1350","calidad":"medium","costo_fuente":"api"}
```

Proveedores emitidos: `openai_imagen`, `google_imagen`, `nvidia_imagen`. El medidor solo los cuenta si existen en su config: agregar en `limites.json` (sin tocar código), p. ej. `{"openai_imagen":{"nombre":"OpenAI imágenes","tipo":"pago","ventanas":{"mes":{"tipo":"mes_utc","usd":30}}}}`, y apuntar `CUOTAS_EVENTOS` al mismo archivo o usar `CUOTAS_URL`. Sin llave el evento lleva `error_tipo:"sin_llave"` y no consume cupo. Es el dato del rubro Herramientas / IA del planificador.

## 6. Contrato para conectarlo (Code OS y Chat del OS)

**MCP stdio** `node code-os/imagen/src/mcp.mjs`. Herramientas (JSON Schema en `tools/list`):

| Herramienta | Entrada clave | Salida |
|---|---|---|
| `imagen_estimar` | `nivel, tamano, cantidad, calidad?` | `estado:"estimado"` + `estimacion{por_imagen_usd,total_usd,aproximado,fuente}` + `topes` · o `bloqueado`/`bloqueado_tope` con `motivo` |
| `imagen_generar` | `nivel, prompt, tamano, cantidad, pieza, asset, aprobado_usd, transparente?, paleta?[], calidad?, salida?` | `estado: generado|parcial|error|falta_ok|bloqueado_tope`, `imagenes[{archivo,ok,validacion,costo_real_usd,seed}]`, `costo_real_usd`, `topes` |
| `imagen_variantes` | igual + `referencias[]` (rutas PNG) | igual (usa `/v1/images/edits`) |
| `imagen_validar` | `archivo, tamano?, transparente?, paleta?[]` | `{ok, checks[{id,ok,detalle}], medidas}` |

Flujo que debe imponer la interfaz: 1) `imagen_estimar` → mostrar total → 2) la persona da OK → 3) `imagen_generar` con `aprobado_usd` = lo aprobado → 4) mostrar variantes y su validación. `aprobado_usd` solo debe poder llenarlo la persona (botón), nunca el modelo.

**Registro en la sesión del puente** (sin editar el puente): `POST /sessions` acepta `mcp:["imagen"]` y el puente toma el servidor de `PUENTE_MCP_CONFIG` (solo en modos distintos de `chat`). Agregar al JSON de esa variable en el VPS:

```json
{"mcpServers":{"imagen":{"command":"node","args":["/home/deploy/Inherent-HQ/code-os/imagen/src/mcp.mjs"],
 "env":{"IMAGEN_LITELLM_URL":"http://127.0.0.1:4000","IMAGEN_SALIDA":"/home/deploy/gateway/imagenes","IMAGEN_GASTO":"/home/deploy/gateway/cuotas/gasto.jsonl","IMAGEN_TOPE_LOTE_USD":"3","IMAGEN_TOPE_MES_USD":"30"}}}}
```

La llave (`LITELLM_MASTER_KEY`/`IMAGEN_LITELLM_KEY`) debe estar ya en el entorno del proceso del puente; no se escribe en ese JSON. Para el **Chat** (modo `chat` no carga MCP) o una UI propia, la misma lógica se importa como módulo: `generarLote(params)`/`estimar(params)` de `src/lote.mjs`, o se expone un endpoint fino sobre ellos (no incluido).

## 7. Qué está probado y qué no

- Probado (18 pruebas, `node --test code-os/imagen/test/*.test.mjs`): PNG, validador (alfa, halo, paleta, tamaño, peso), estimador, topes, flujo completo, edits multipart, nivel NVIDIA, sin llave, protocolo MCP incluido un proceso stdio real. **Todo contra un servidor falso: no se llamó a ningún proveedor ni se gastó dinero; no había llave ni LiteLLM local.**
- **No probado:** respuesta real de LiteLLM/OpenAI con 2.5 (¿acepta `background`, `quality`, `size` arbitrario y edits?), Gemini por LiteLLM, esquema de respuesta de NVIDIA, precios `low/xhigh/max` y por tamaño de la familia 2.5. Primera prueba recomendada con la llave de OpenAI puesta: `imagen estimar` y luego un lote de 1 imagen `low`/`medium` 1024² (centavos).
- El validador de halo y paleta es una heurística, no sustituye el ojo de la persona.
