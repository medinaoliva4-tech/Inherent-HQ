# InherentChat: proveedores y edición externa

Estado: preparación del 12 de noviembre de 2026. No cambia el motor de producción.

## Decisión de arquitectura

El OS conserva **una conversación, un cliente, un historial y las mismas aprobaciones**. Una capacidad declara qué puede hacer (`chat`, `codigo`, `figwright`, `imagen`, etc.); el modelo declara quién razona; el arnés declara quién ejecuta herramientas. Son elecciones independientes.

```
Inherent OS (sesión, permisos, artefactos)
  → contrato de capacidades y eventos
  → arnés (Claude SDK hoy; OpenCode u otro después)
  → Gateway LiteLLM o API compatible
  → proveedor/modelo elegido
```

El contrato del puente debe conservar los eventos `text_delta`, `tool_call`, `permission_request`, `usage` y `turn_end`, además de `files` y `diff`. Un arnés nuevo traduce sus propios eventos a ese contrato. La interfaz nunca usa el formato interno de un proveedor. El Gateway ya permite cambiar modelos sin cambiar la UI; los MCP cubren herramientas externas. Esto **no hace que cualquier API sea compatible automáticamente**: cada API necesita un adaptador, autenticación y un contrato de datos/acciones. Las acciones que escriben siguen pidiendo aprobación.

Los dos trabajos descritos en `CONTINUAR-CHATGPT.md` (capacidades/modelos del Chat y Figwright/planifica-ejecuta del puente) deben terminar antes de conectar otro arnés al OS. Al integrarlos, aceptar `arnes` como campo de sesión, guardar su ID externo y probar reanudación, permisos, interrupción, uso y errores con ambos motores. El hilo del cliente debe vivir en la base del OS; el arnés no se convierte en otra fuente de verdad.

## Editar este repositorio fuera de la app

La alternativa inmediata es **OpenCode**, que ya está instalado en esta Mac. `opencode.jsonc` en la raíz añade dos rutas opcionales:

| Ruta | Uso | Acceso |
|---|---|---|
| `deepseek-direct/flash` y `/pro` | Editar con API directa de DeepSeek | `DEEPSEEK_API_KEY` en el entorno o `/connect` de OpenCode |
| `inherent-gateway/alto`, `/medio`, `/bajo` | Reutilizar los niveles y respaldos del Gateway | túnel SSH local y llave virtual personal `INHERENT_GATEWAY_KEY` |

El archivo no contiene llaves. La configuración global de OpenCode que ya existe en esta Mac también ofrece `gw/kimi-k3`; el archivo del repo no la reemplaza.

Desde la raíz del repo:

```bash
opencode --standalone .
```

Dentro de OpenCode, `/models` permite elegir la ruta. Para la API directa, la persona conecta su propia llave con `/connect`; para el Gateway, primero se abre el túnel `ssh -N -L 4010:127.0.0.1:4000 inherent-gw` en otra terminal y se carga la llave virtual personal en el entorno. No se copia ninguna llave al repo ni al chat. Si el puerto 4010 ya está ocupado por otro túnel válido, se reutiliza.

OpenCode edita los **archivos Git del mismo proyecto**. Sus sesiones y permisos son independientes del historial de InherentChat. Se revisa `git diff`, se prueba y se integra por Git; nunca se presenta una sesión externa como si ya fuera una conversación del OS.

## Selección de bajo costo

1. **Diario:** DeepSeek Flash directo o `nivel-bajo` del Gateway para cambios acotados. DeepSeek publica precios por millón de tokens y horas de menor costo; no es gratis. [Precios oficiales](https://api-docs.deepseek.com/quick_start/pricing/).
2. **Difícil:** Kimi K3.1 Pro o DeepSeek V4 Pro para planear/revisar; ejecutar el plan con un modelo más barato. Kimi K3.1 Pro por API cuesta más que Flash; la membresía Kimi y la API se cobran por separado. [Kimi oficial](https://www.kimi.ai/resources/kimi-k3-1-pro-pricing), [DeepSeek oficial](https://api-docs.deepseek.com/quick_start/pricing/).
3. **Suscripción opcional:** ClinePass lista Kimi, DeepSeek y GLM y ofrece uso desde otros agentes con su llave. Sus cuotas y disponibilidad deben medirse antes de usarlo como ruta principal. [ClinePass oficial](https://cline.bot/product-hunt).

No hay base para prometer equivalencia universal con Opus o Fable. Antes de fijar un modelo, comparar 5 tareas reales del repo: arreglo de bug, cambio de UI, integración de herramienta, revisión de seguridad y migración de datos. Medir resultado correcto, pruebas, tiempo, costo y veces que hubo que intervenir. Elegir el más barato que cumpla cada tipo de trabajo y conservar un respaldo.

Fuentes de integración: [OpenCode proveedores](https://opencode.ai/docs/providers/), [OpenCode CLI](https://opencode.ai/docs/cli), [DeepSeek en OpenCode](https://api-docs.deepseek.com/quick_start/agent_integrations/opencode/).
