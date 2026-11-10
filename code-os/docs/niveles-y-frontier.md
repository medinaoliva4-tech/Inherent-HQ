# Cómo se reparte el trabajo: frontier, Cline Pass y modelos abiertos

| Nivel | Quién lo atiende | Cómo se accede | Dinero |
|---|---|---|---|
| **Alto** (planear/decidir) | 1º frontier por **API key**; 2º **Cline Pass top** (`cp-kimi-k3.1-pro`) hoy | LiteLLM (`nivel-alto`) | Frontier: por token con tope. Cline: incluido |
| **Alto con login** | Claude / Codex con **login de suscripción** | Clientes oficiales (`claude`, `codex`) logueados en el servidor, como trabajadores aparte | Incluido en la suscripción |
| **Medio** (ejecución diaria) | Cline Pass (`cp-kimi-k3`, `cp-glm-5.3`, …) | LiteLLM (`nivel-medio`) | Incluido |
| **Bajo** (repetitivo, respaldo) | Modelos abiertos en NVIDIA | LiteLLM (`nivel-bajo`) | Gratis |

**Decisión del CEO (2026-11-10): solo suscripciones.** Nada de créditos por token de Cline ni de ModelScope. El único gasto por token posible es la válvula `nivel-bajo-pago` (DeepSeek) y la llave frontier, ambas con aprobación previa.

## Frontier: qué es legal y qué no
- **API key** (Anthropic, OpenAI, Google, xAI…): legal y es lo que enchufa a LiteLLM (`FRONTIER_API_KEY`, `FRONTIER_API_BASE`, y editar el modelo `openai/FRONTIER-POR-ELEGIR`). Con tope diario/mensual en el medidor.
- **Login/OAuth de suscripción**: solo con el cliente oficial del proveedor, con tu cuenta. **No** se extrae el token para meterlo en LiteLLM ni en otros programas: los términos de los proveedores lo restringen y puede costar la cuenta. Revisar términos vigentes antes de automatizar. Por eso estos usos se miden aparte (`claude_login`, `codex_login` en el medidor, reportando con `POST /evento`) y no son parte del fallback de LiteLLM.
- Mientras no haya llave: `nivel-alto` cae a Cline Pass top. El frontier por llave se salta en ~25 ms sin costo.

## Para pasar a frontier por llave
1. Elegir proveedor y modelo. 2. `ssh -t inherent-gw 'bash ~/set-keys.sh'` (FRONTIER_API_KEY y FRONTIER_API_BASE). 3. Cambiar `openai/FRONTIER-POR-ELEGIR` en `litellm.yaml` y correr `aplicar.sh`. 4. Fijar topes en `cuotas/limites.json`.
