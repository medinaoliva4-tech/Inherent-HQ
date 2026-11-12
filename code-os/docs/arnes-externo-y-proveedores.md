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

## Referencia Cloudroom: alcance para Inherent

[Cloudroom](https://github.com/davidondrej/cloudroom) separa su núcleo (procesos, cola, registro y recuperación) de los arneses (bucle del agente, herramientas, inferencia e historial nativo). Su [contrato de adaptadores](https://github.com/davidondrej/cloudroom/blob/main/core/docs/harnesses.md) permite escoger arnés por sesión y presentar eventos y capacidades comunes. Adoptamos esa **división de responsabilidades**, sin trasladar su interfaz, todos sus arneses ni su infraestructura de sandboxes a Inherent.

Los agentes de departamento del OS son **roles y workflows**. Claude Code, OpenCode y Codex son **arneses de ejecución de código**; los modelos y proveedores son otra elección. Un agente de Estrategia puede usar un modelo distinto sin convertirse en otro agente. Los portales de agente, herramientas de cliente y Chat siguen compartiendo datos y aprobaciones del OS.

| Arnés | Decisión | Motivo |
|---|---|---|
| Claude Code | Mantener opcional | Ya funciona en el puente; no forzar su uso ni eliminarlo. |
| OpenCode | Primer adaptador nuevo | Ya está configurado para edición externa y admite proveedores/modelos alternativos. Su protocolo ACP permite conservar el puente del OS como dueño de la sesión visible. |
| Codex | Adaptador siguiente | Útil como segunda opción de código tras validar el contrato con OpenCode. |
| Otros de Cloudroom | Fuera del alcance inicial | Añadir solo ante una necesidad concreta que los tres anteriores no cubran. |

El OS debe guardar `harness`, `provider`, `model`, capacidades anunciadas, ID de sesión nativa, estado, eventos visibles y artefactos. Cada adaptador implementa `start`, `send`, `interrupt`, `resume` y `close`, traduce eventos al contrato del puente y declara sus límites (por ejemplo, soporte de permisos, razonamiento o imágenes). Si el arnés no ofrece una capacidad, la UI no la muestra. El catálogo debe venir de cada arnés cuando sea posible; no prometer modelos o niveles de razonamiento que no soporte.

**Cambiar de arnés no equivale a reanudar su historial nativo en otro.** El Chat del OS conserva la conversación visible y pasa un resumen/contexto explícito al nuevo arnés. El trabajo de código usa un workspace o rama aislada por tarea; diffs, aprobaciones y resultados vuelven al mismo panel de artefactos. La aprobación del usuario del OS se mantiene incluso si un arnés permite ejecución automática en otra aplicación.

Orden de integración: (1) cerrar el trabajo pendiente de capacidades/eventos del puente; (2) extraer el adaptador Claude sin cambiar su comportamiento; (3) integrar OpenCode por ACP con el mismo ciclo de permisos, interrupción y reanudación; (4) probar cinco tareas reales y consumo; (5) añadir Codex con el contrato ya probado. La primera prueba de aceptación debe iniciar una tarea desde Chat, mostrar herramientas y diff en Code, pedir aprobación antes de escribir, interrumpir/reanudar y conservar el historial del OS después de recargar. Hasta cumplirla, OpenCode sigue siendo una opción de edición externa, no una integración ya disponible dentro de InherentChat.

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
