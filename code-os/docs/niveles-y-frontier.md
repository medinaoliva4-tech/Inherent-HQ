# Cómo se reparte el trabajo: frontier, Cline Pass y modelos abiertos

| Nivel | Quién lo atiende | Cómo se accede | Dinero |
|---|---|---|---|
| **Alto** (planear/decidir) | **Claude con la suscripción del usuario**; si se agota, **Cline Pass top** (`cp-kimi-k3.1-pro`) | Cliente oficial `claude` (login) y, de respaldo, LiteLLM `nivel-alto` | Incluido en suscripciones |
| **Medio** (ejecución diaria) | Cline Pass (`cp-kimi-k3`, `cp-glm-5.3`, …) | LiteLLM (`nivel-medio`) | Incluido |
| **Bajo** (repetitivo, respaldo) | Modelos abiertos en NVIDIA | LiteLLM (`nivel-bajo`) | Gratis |

**Decisión del CEO (2026-11-10): solo suscripciones.** Nada de créditos por token de Cline ni de ModelScope. El único gasto por token posible es la válvula `nivel-bajo-pago` (DeepSeek) y la llave frontier, ambas con aprobación previa.

## Frontier = Claude con la suscripción del usuario (decidido 2026-11-10)
- El frontier del nivel alto es **Claude, usando la suscripción de quien trabaja** (la tuya, o la de cada usuario con su propio login). Se usa con el cliente oficial (`claude`, Claude Code) logueado; no pasa por LiteLLM.
- **Reglas para que siga siendo legal:** una suscripción por persona y a su nombre (no se comparte una cuenta entre usuarios); no se extrae ni copia el token de login a otros programas; uso como el de un desarrollador con su Claude Code. Revisa los términos vigentes antes de automatizar volumen alto.
- **Medición:** `cuotas/claude-medido.sh -p "tarea"` corre `claude` y reporta la llamada al medidor como `claude_login`. El planificador cuenta ese cupo como capacidad del nivel alto, con un supuesto conservador (30 llamadas/5 h, 400/semana) hasta calibrarlo con uso real o con el primer aviso de límite de Claude.
- **Codex/ChatGPT** (`codex_login`) funciona igual si algún día se quiere.
- Cuando Claude llegue a su límite de 5 h, el trabajo de nivel alto baja a Cline Pass top (`nivel-alto` en LiteLLM: `cp-kimi-k3.1-pro`).

## Para pasar a frontier por llave
1. Elegir proveedor y modelo. 2. `ssh -t inherent-gw 'bash ~/set-keys.sh'` (FRONTIER_API_KEY y FRONTIER_API_BASE). 3. Cambiar `openai/FRONTIER-POR-ELEGIR` en `litellm.yaml` y correr `aplicar.sh`. 4. Fijar topes en `cuotas/limites.json`.
