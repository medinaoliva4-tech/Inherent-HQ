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

## La identidad

# GROWTH OPERATOR

**No somos agencia ni consultoría. Operamos el crecimiento.**
La agencia hace piezas. La consultoría hace diagnósticos. **Nosotros hacemos que el negocio
crezca, y nos quedamos adentro hasta que pasa.**

**Prometemos crecimiento, según la necesidad** — y el tipo lo define dónde está trabado el
negocio, no lo que queramos vender.

**Cómo:** con **Estrategia** como columna — ingeniería inversa de la meta financiera hasta la
pieza, incluyendo mejorar la oferta y el posicionamiento. Y cinco equipos que desarrollan la
visión: **Marketing · Branding · Creatividad · Tecnología · ADS.**

> **`IDENTIDAD.md`** tiene la identidad completa y —lo más importante para vender—
> **lo básico vs. el valor único** de cada nivel.

## El techo comercial

**`PAQUETES.md`** define qué se puede entregar según el nivel contratado: cuántas piezas, qué
canales, qué capas de la escalera entran y cuántas revisiones. **Es restricción dura para todos
los agentes.** Se lee antes de prometer nada.

### Los tres niveles de crecimiento

```
🟦 BÁSICO     Q6,160   ENCENDER   Estrategia · Demanda · Contenido
🟪 ACELERADO  Q8,470   ACELERAR   + Tecnología · Contenido para ADS · SEO · Closing
🟨 COMPUESTO  Q15,400  COMPONER   + Sistemas de demanda · Fulfillment · Talento
```

**Más `Tailor Made`** — multi-locación, regulatorio, integraciones, proyectos por hito.

**Dieciséis capas.** Todo nivel es un nivel de growth: **lo que cambia no es el tipo de servicio,
es la profundidad.**

⚠️ **El nivel se elige por el CUELLO, no por la industria ni por la facturación.**
No me conocen → Básico · Me conocen y no convierto → Acelerado · Convierto y no retengo → Compuesto

### La economía

**La estrategia de precio es matarlos con valor, no cobrar más.** Los precios están **dentro del
rango que el mercado guatemalteco ya acepta**, con 3x a 5x el volumen de su tramo. El de entrada
da **86 piezas a Q6,160 (Q72/pieza)** contra las ~16 de un paquete de Q3,000 **(Q188/pieza)**.

**El volumen nos separa del mercado. La profundidad separa los niveles entre sí.**

**El bundle no es descuento, es eficiencia.** Subir de escalón cuesta 75% menos que comprar lo
mismo suelto, porque todo lo que corre sobre agentes suma Q0 al costo variable.
**El movimiento comercial es subir a los clientes que ya están, no sumar clientes nuevos.**

**Ganamos de hacerles dinero.** El fee base cubre la operación; **la utilidad de verdad sale del
performance fee — 10% de las ventas atribuidas, con costo marginal Q0.** Cada quetzal de fee es
utilidad pura: lleva Acelerado de 27% a 46% sin tocar el precio base.
⚠️ **Sin atribución limpia no hay fee.**

**Los cuatro objetivos a la vez: costos bajos · valor enorme · precio justo · márgenes muy
buenos.** Cierran **no bajando el precio, bajando el costo.** Modelo en dos estados:
**HOY 48% · 27% · 40%** — **OBJETIVO 64% · 50% · 60%** al mismo precio.
Lo que los separa son tres agentes: **QA · operación automatizada · pipeline de herramientas.**

⚠️ **Hay dos trabajos que ya deberían hacer agentes y todavía los hace gente: el QA y la
operación.** Ahí está el 70% del costo matable.

**El equipo son dos personas y los agentes.** Allan dirige y es el gate; un operador corre los
agentes; producción solo graba; **los agentes hacen el resto.**

🔑 **Nadie cobra por cuenta. Todos cobran por hora, y cada cuenta paga su porción.**
Un sueldo por cuenta significa diez sueldos con diez cuentas — ese costo nunca baja.
**La tarifa baja según el volumen que le garantizamos** (100% / 80% / 65% / 50%), y **pasa a
sueldo fijo a partir de 60 h/mes.** Con ese modelo los márgenes van de **52-64% con 2 clientes a
66-74% con 10**, y **la utilidad vuelve a subir con el precio.** Ver `EQUIPO.md`.

⚠️ **La producción no se baja recortando horas** — eso es bajarle el precio a la persona por el
mismo trabajo. Se baja **garantizándole volumen** a cambio de tarifa, o con el sistema de
contenido crudo del cliente.

⚠️ **Esto exige agentes que trabajen entre autónomos y dirigidos:** que levanten excepciones, no
preguntas. **Si el agente pregunta todo, no ahorra nada.**

⚠️ **No se vende una capa suelta.** Crecer exige algo íntegro; vender solo contenido o solo pauta
contradice lo que predicamos.

⚠️ **Los tres niveles incluyen estrategia.** Cambia la profundidad, no la existencia.

⚠️ **No se promete lo que no está en «Capacidades reales» de `PAQUETES.md`.** Sin MCP no hay
acción, y sin acción no hay promesa. **Los límites declarados están en `IDENTIDAD.md`:**
no hacemos LinkedIn Ads, SEO técnico profundo, ni reclutamos personal.

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
