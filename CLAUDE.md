# Inherent HQ — Agentes

Cada agente vive en `agents/<nombre>/`. Se le habla desde **Buzz** por una sesión de Claude Code.

## Estructura

```
agents/<agente>/
└── brain/
    ├── WORKFLOW.md          ← cómo trabaja el agente, de 0 a 100
    └── skills/
        ├── README.md        ← cuándo y cómo usa cada skill
        └── <skill>/         ← las skills de ESTE agente

clients/
├── client-delivery/         ← skill compartida: cómo se entrega. La usan todos
└── <cliente>/               ← todo lo del cliente, afuera de los agentes
```

## Cómo se compone un agente

Todo agente de Inherent tiene tres capas. **Esta es la definición base — vale para todos.**

```
PROPÓSITO   el panorama y la meta del agente. Su área.
    │       Strategy: la estrategia. Creative: las ideas. Etc.
    ▼
ACCIONES    lo que el agente PUEDE HACER. Las determinan los MCPs.
    │       Según lo que puede el MCP o el tool conectado, es la acción que
    │       el agente puede tomar. Y la CALIDAD del MCP es la CALIDAD de la acción.
    ▼
LÓGICA      CÓMO hace esas cosas. Son las skills.
            El razonamiento y el método detrás de cada acción.
```

**Las tres consecuencias de esto:**

1. **Un agente no puede hacer nada que su MCP no permita.** Si falta la acción, falta un MCP —
   no se arregla con mejor prompt.
2. **Un MCP flojo produce acciones flojas**, por más buena que sea la lógica.
3. **Una skill no es una acción, es una lógica.** Define cómo se usa lo que el MCP entrega.

Antes de agregar una skill, preguntar: **¿el agente tiene la acción para ejecutarla?**
Antes de agregar un MCP, preguntar: **¿esta acción cae dentro del propósito de este agente?**

---

## Agentes — el pipeline de entrega

**`PIPELINE.md` tiene la cadena completa:** doce etapas, de la información cruda a la pieza
publicada. Cada agente es una etapa.

| # | Etapa | Agente | Carpeta | Estado |
|---|---|---|---|---|
| 01 | Comprensión | **Strategy** | `agents/strategy/` | ✅ |
| 02 | Estrategia | **Strategy** | `agents/strategy/` | ✅ |
| 02B | Branding | Branding | `agents/branding/` | 🟡 brief listo |
| 03 | Marketing | Marketing | `agents/marketing/` | ⬜ |
| 04 | Creatividad | Creative | `agents/creative/` | ⬜ |
| 05 | Producción | Production | `agents/production/` | ⬜ |
| 06 | Diseño gráfico | Design | `agents/design/` | ⬜ |
| **07** | **QA** | **QA** | `agents/qa/` | 🔴 **bloqueador** |
| 08 | Posting | Content | `agents/content/` | 🟡 tools sí |
| 09 | Ads | Growth | `agents/growth/` | 🟡 tools sí |
| 10 | Community | Community | `agents/community/` | ⬜ |
| ↻ | Revisión del 20 | **Strategy** | `agents/strategy/` | ✅ |

🔴 **El agente de QA es el primero a construir.** Sin él el volumen no es entregable y el margen
no cierra — ver `OPERACION.md` → hoja de ruta.

## El techo comercial

**`PAQUETES.md`** define qué se puede entregar según el paquete que contrató el cliente: cuántas
piezas al mes, qué canales, qué capas de la escalera entran y cuántas revisiones. **Es restricción
dura para todos los agentes.** Se lee antes de prometer nada.

**Todo paquete es un paquete de growth.** Son tres —`Growth Basic`, `Growth Accelerated` y
`Growth Compound`— más `Tailor Made`. Lo que cambia no es el tipo de servicio, es la profundidad.

**La estrategia de precio es matarlos con valor, no cobrar más.** Los precios están **dentro del
rango que el mercado guatemalteco ya acepta**, con 3x a 5x el volumen de su tramo. El de entrada
da **86 piezas a Q5,500** contra las ~16 de un paquete de Q3,000.

**El volumen es lo que nos separa del mercado. La profundidad es lo que separa los paquetes entre
sí.**

**El bundle no es descuento, es eficiencia.** Subir de escalón cuesta 60-70% menos que comprar lo
mismo suelto, porque todo lo que corre sobre agentes suma Q0 al costo variable.
**El movimiento comercial es subir a los clientes que ya están, no sumar clientes nuevos.**

**La ecuación completa: costos bajos · valor enorme · precio justo · márgenes muy buenos.**
Los cuatro cierran a la vez — **no bajando el precio, bajando el costo.** `PAQUETES.md` tiene el
modelo en dos estados: HOY (márgenes 30-42%) y OBJETIVO (53-60% al mismo precio), y los tres
agentes que separan uno del otro: **QA · operación automatizada · pipeline de herramientas.**

⚠️ **Hay dos trabajos que ya deberían hacer agentes y todavía los hace gente: el QA y la
operación.** Ahí está el 70% del costo matable.

⚠️ **No se vende una capa suelta.** La metodología dice que crecer exige algo íntegro; vender solo
contenido o solo pauta contradice lo que predicamos.

⚠️ **Los dos incluyen estrategia.** Cambia la profundidad, no la existencia.

⚠️ **No se promete lo que no está en «Capacidades reales» de `PAQUETES.md`.** Esa tabla ata cada
capacidad a su MCP. Sin MCP no hay acción, y sin acción no hay promesa.

## Los archivos de referencia

| Archivo | Qué define |
|---|---|
| **`PAQUETES.md`** | **QUÉ se promete.** Paquetes, precios, costos, bundle y capacidades reales |
| **`PIPELINE.md`** | **CÓMO se entrega.** Las 12 etapas, qué agente hace cada una, qué se activa |
| **`INDUSTRIAS.md`** | **A QUIÉN.** Las 10 industrias, dónde se traba cada una, qué paquete le toca |
| **`OPERACION.md`** | **CUÁNTO cuesta.** Tareas, horas de Allan y hoja de ruta de automatización |

**Los tres paquetes, por su verbo:**

```
🟦 BASIC — ENCENDER       atraer, crear nombre, asociarse bien
🟪 ACCELERATED — ACELERAR lead magnets, embudos, influencers, tecnología
🟨 COMPOUND — COMPONER    retención, LTV, sistemas propios, autonomía
```

⚠️ **El paquete se elige por el CUELLO, no por la industria ni por la facturación.**
No me conocen → Basic · Me conocen y no convierto → Accelerated · Convierto y no retengo → Compound

## Cómo arrancás una sesión

1. **Identificá el agente** que corresponde al pedido.
2. **Leé su `brain/WORKFLOW.md` completo.** Es la única fuente de cómo trabaja.
3. **Identificá el cliente.** Un cliente = un folder en `clients/`. Nunca mezclar dos.
4. Seguí el workflow. Las skills se invocan donde el workflow lo indica.

## Reglas

- **Español.** Los términos del método quedan en inglés: `WIN`, `MUST BE TRUE`, `UNFAIR`, `GO GET`, `MOVE`, `COMPOUND`.
- **Evidencia o etiqueta.** Sin fuente va como `[dice el cliente, sin verificar]` o `⚠️ SIN DATOS`. Nunca inventar.
- **Solo la info que entrega el usuario**, salvo que él habilite fuentes externas.
- **Gate humano: Allan (Rodrigo).** El agente propone, no cierra.
- **Nada destructivo sin autorización:** no publicar, no pautar, no enviar al cliente, no borrar.
- Formato de respuesta: headings, bullets, negritas. Lo accionable arriba. Sin párrafos largos.
