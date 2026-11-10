# Cómo se reparte el trabajo: frontier, Cline Pass y modelos abiertos

| Nivel | Quién lo atiende | Cómo se accede | Dinero |
|---|---|---|---|
| **Alto** (planear/decidir) | 1º frontier por **API key**; 2º **Cline Pass top** (`cp-kimi-k3.1-pro`) hoy | LiteLLM (`nivel-alto`) | Frontier: por token con tope. Cline: incluido |
| **Alto con login** | Claude / Codex con **login de suscripción** | Clientes oficiales (`claude`, `codex`) logueados en el servidor, como trabajadores aparte | Incluido en la suscripción |
| **Medio** (ejecución diaria) | Cline Pass (`cp-kimi-k3`, `cp-glm-5.3`, …) | LiteLLM (`nivel-medio`) | Incluido |
| **Bajo** (repetitivo, respaldo) | Modelos abiertos: ModelScope, NVIDIA | LiteLLM (`nivel-bajo`) | Gratis |

## Frontier: qué es legal y qué no
- **API key** (Anthropic, OpenAI, Google, xAI…): legal y es lo que enchufa a LiteLLM (`FRONTIER_API_KEY`, `FRONTIER_API_BASE`, y editar el modelo `openai/FRONTIER-POR-ELEGIR`). Con tope diario/mensual en el medidor. Ojo: el catálogo de la API de Cline (`api.cline.bot/api/v1/models`) lista modelos frontier por token (Claude Opus/Sonnet 5.5, GPT-6.1, Grok 4.7…); sería una vía de "una sola llave", pero gasta créditos y por eso entra al planificador como pago con aprobación. No probado.
- **Login/OAuth de suscripción**: solo con el cliente oficial del proveedor, con tu cuenta. **No** se extrae el token para meterlo en LiteLLM ni en otros programas: los términos de los proveedores lo restringen y puede costar la cuenta. Revisar términos vigentes antes de automatizar. Por eso estos usos se miden aparte (`claude_login`, `codex_login` en el medidor, reportando con `POST /evento`) y no son parte del fallback de LiteLLM.
- Mientras no haya llave: `nivel-alto` cae a Cline Pass top. El frontier por llave se salta en ~25 ms sin costo.

## Para pasar a frontier por llave
1. Elegir proveedor y modelo. 2. `ssh -t inherent-gw 'bash ~/set-keys.sh'` (FRONTIER_API_KEY y FRONTIER_API_BASE). 3. Cambiar `openai/FRONTIER-POR-ELEGIR` en `litellm.yaml` y correr `aplicar.sh`. 4. Fijar topes en `cuotas/limites.json`.

# Tutorial: ModelScope (gratis, 2,000 llamadas/día)

> Escrito de memoria de cómo funciona el sitio; la interfaz y los requisitos cambian. Si un paso no coincide, la prueba con `curl` del paso 4 es la que manda.

1. **Cuenta.** Entra a <https://www.modelscope.cn> y crea cuenta (el registro puede pedir teléfono; acepta números internacionales con código de país, o inicio con cuenta de terceros según lo que ofrezca la pantalla).
2. **Vincular Alibaba Cloud (si lo pide).** Para el servicio de inferencia por API, ModelScope suele pedir vincular una cuenta de Alibaba Cloud (gratuita). Sigue el aviso que aparece al abrir "API-Inference" en cualquier modelo.
3. **Token.** Perfil → **Configuración → Tokens de acceso** (URL habitual: `modelscope.cn/my/myaccesstoken`) → crear token → copiarlo. Trátalo como contraseña.
4. **Probar.** En tu Mac (el token no va a ningún archivo ni chat):
   ```bash
   read -rs MS; curl -s https://api-inference.modelscope.cn/v1/chat/completions -H "Authorization: Bearer $MS" -H "Content-Type: application/json" -d '{"model":"deepseek-ai/DeepSeek-V4-Flash","max_tokens":200,"messages":[{"role":"user","content":"di listo"}]}'
   ```
   (pega el token y Enter; no se ve). Si responde 200, sirve. Si dice modelo no encontrado, busca el ID exacto en <https://www.modelscope.cn/models> filtrando por "API-Inference" y úsalo en lugar de `DeepSeek-V4-Flash`.
5. **Guardarlo en el servidor:** `ssh -t inherent-gw 'bash ~/set-keys.sh'` → pega el token en "MODELSCOPE_API_KEY". Luego avísame y confirmo los nombres de modelo en `litellm.yaml` y reinicio `litellm.service`.
6. **Límites.** ~2,000 llamadas/día en total (con tope más bajo por modelo), reinicia a las 00:00 hora de China (UTC+8). El medidor ya lo cuenta y avisa al 80 %.
