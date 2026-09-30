# Inherent HQ — Agentes

Cada agente vive en `agents/<nombre>/`. Se le habla desde **Buzz** por una sesión de Claude Code.

## Estructura

```
CLAUDE.md                  ← este archivo. La entrada de toda sesión

inherent/                  ← LA EMPRESA — qué es, qué vende, qué cobra
├── README.md              ← el índice. Empezá acá
├── 01-IDENTIDAD.md        quiénes somos
├── 02-METODO.md           cómo pensamos — los 4 sistemas
├── 03-OFERTA.md           qué vendemos — los 3 planes y su activación
├── 04-MERCADO.md          a quién y dónde — industrias, mercados, mentores
├── 05-OPERACION.md        cómo lo entregamos — pipeline, equipos, ciclos
├── 06-ECONOMIA.md         🔒 cuánto cuesta y cuánto queda
└── 07-COMUNICACION.md     cómo lo decimos — brief de web

agents/<agente>/           ← LOS AGENTES — uno por etapa del pipeline
└── brain/
    ├── WORKFLOW.md        cómo trabaja el agente, de 0 a 100
    └── skills/
        ├── README.md      cuándo y cómo usa cada skill
        └── <skill>/       las skills de ESTE agente

clients/                   ← LOS CLIENTES
├── client-delivery/       skill compartida de entrega. La usan todos
└── <cliente>/             todo lo del cliente
```

**Tres carpetas, tres preguntas:**
`inherent/` **qué somos** · `agents/` **quién lo hace** · `clients/` **para quién**

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

**`inherent/05-OPERACION.md` tiene la cadena completa:** doce etapas, de la información cruda a la pieza
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
no cierra — ver `inherent/05-OPERACION.md` → hoja de ruta.

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

> **`inherent/01-IDENTIDAD.md`** tiene la identidad completa y —lo más importante para vender—
> **lo básico vs. el valor único** de cada nivel.

## El techo comercial

**`inherent/06-ECONOMIA.md`** define qué se puede entregar según el nivel contratado: cuántas piezas, qué
canales, qué capas de la escalera entran y cuántas revisiones. **Es restricción dura para todos
los agentes.** Se lee antes de prometer nada.

### Los tres planes

```
🟦 IGNITE      $800     invisible → deseado      aprender a comunicarse y existir
🟪 ACCELERATE  $1,100   estancado → escalando    escalar lo que ya funciona, sin perderlo
🟨 COMPOUND    $2,000   escalando → autónomo     que crezca sin vos
```

**Más `Tailor Made`** — multi-locación, regulatorio, integraciones, proyectos por hito.

🚀 **Somos un acelerador de marcas. Cada plan es un BOOST distinto, no más volumen del anterior.**
⚠️ **Accelerate NO es «que te conozcan más».** Ese comprador ya se siente estancado y **teme
romper lo que le funciona.**

**Dos divisiones — el eje es cómo se decide la compra, no quién compra:**

```
🔵 LOW TICKET    volumen      oferta · big sales · upsells
🟣 HIGH TICKET   precisión    oferta · cuentas grandes · expansión
```

**Los pilares no cambian — son la metodología. Cambia el verbo:**
Ignite **mapea** · Accelerate **ejecuta** · Compound **sistematiza**. Ver `inherent/03-OFERTA.md`.

### Los cuatro sistemas

```
GROWTH OS       de dónde sale el crecimiento  →  los 3 pilares de cada división
CONVERSION OS   que ese crecimiento se cobre
OPERATIONS OS   que la empresa lo aguante
MONEY OS        que quede utilidad
```

**Una agencia solo trabaja el primero.** Por eso sus clientes crecen y se rompen.

| | IGNITE | ACCELERATE | COMPOUND |
|---|---|---|---|
| **Growth OS** | Pilar 1 ejecuta · Pilar 2 mapea | Los 3 ejecutando | Los 3 sistematizados |
| **Conversion OS** | ⬜ | ✅ | ✅ |
| **Operations OS** | ⬜ | 🟡 SOPs **de crecimiento** | ✅ SOPs **de empresa** |
| **Money OS** | ⬜ | ⬜ | ✅ |

🔑 **Un sistema entra cuando el negocio tiene con qué alimentarlo.** Conversion no entra en Ignite
porque **antes no hay nada que perder**; Operations porque **no se puede documentar un proceso que
todavía no funcionó**; Money porque **sin transacciones el margen por línea es teoría.**
**Meterlo antes es cobrar por algo que no se puede usar.** Ver `inherent/02-METODO.md`.

**Seis capacidades bajo un techo:** 📣 Marketing · 🎨 Creative · 🎬 Production · 🏷️ Branding ·
🔧 Tech · 📊 Consulting. **Strategy debe conocer las seis** para decidir qué activar.

🎓 **La red de especialistas es el diferenciador que más pesa.**
**Por industria** *(externos — MentorCruise · GrowthMentor · MentorPass)*: gente que ya creció su
marca ahí y responde *«¿qué harías si esta fuera tu empresa?»*.
**Por área** *(nuestros)*: corporate structure, eventos, networking y PR, talent production,
talent marketing. **Red, no nómina.**
🔑 **Tres reglas lo hacen rentable:** solo se propone el mentor que cabe en el plan ·
**trimestral en Ignite y Accelerate**, mensual en Compound · **la membresía se paga anual y es de
Inherent** *(sirve a todos los clientes de esa industria, −41% de costo)*.
Con eso el mentor cuesta **−4 · −5 · −10 pts** y los márgenes quedan en **60% · 56% · 61%**.
⚠️ **Arriba de $180/sesión NO se absorbe: va como add-on facturado al cliente.** Ver `inherent/04-MERCADO.md`.

## 🌐 La web ya está publicada — es la promesa

**Las tres tarjetas de precio están vivas en inherentglobal.com. Ya se comunicó. Ya se vio.**

🔒 **El repo no puede prometer menos, más ni distinto que la web.** Si algo interno contradice una
línea publicada, **gana la web** y se corrige el repo. Si una línea publicada no tiene capacidad
detrás, **se arregla la capacidad — no se borra la línea.**
**El texto publicado y qué respalda cada línea están en `inherent/03-OFERTA.md`.**

✍️ **Toda la copia al cliente va de TÚ, no de vos.** Así está publicado.

🔴 **Dos cosas que la web ya prometió y todavía no existen:**
**el CFO fraccional** *(bloquea la venta de Compound)* y **el especialista de corporate
structure** *(Allan lo cubre mientras tanto)*.

⚠️ **«Que te encuentren en Google» = pauta de búsqueda y contenido guiado por keywords.**
**Nunca posicionamiento orgánico, auditoría técnica ni link building.**

---

💚 **Un emprendedor no contrata sistemas. Contrata a alguien que cuide lo que construyó.**
**No industrializamos empresas: les damos alma, propósito y facturación.**
**Se le habla de lo que DESEA, no de lo que la industria dice que necesita.** Ver `inherent/03-OFERTA.md`.

🚫 **No vendemos servicios. Vendemos resultado.** *"Te damos SOPs"* ❌ ·
*"Te podés ir una semana y la empresa factura igual"* ✅
**El volumen y las herramientas son la EVIDENCIA de que podemos — nunca la oferta.**

⚠️ **El precio se justifica por cuántos sistemas activamos y qué tan adentro entramos.**
**Nunca por volumen de entregables.**

⚠️ **La etapa no es mérito, es realidad:** lo que el cliente puede pagar dice en qué etapa está,
y la etapa dice qué necesita.

⚠️ **Si la empresa es el estorbo, más demanda empeora el problema:** se arregla la capacidad
primero, aunque la venta fácil sea más pauta.

### La economía

**La estrategia de precio es matarlos con valor, no cobrar más.** Los precios están **dentro del
rango que el mercado ya acepta**, con 3x a 5x el volumen de su tramo.

🌐 **Guatemala es dónde arrancamos, no el techo.** Los costos se pagan en quetzales y no cambian
al cambiar de mercado; **lo único que cambia es el precio.** A precio de México los mismos costos
dan **76-82%**; a precio de Miami, **86-89%**. Ver `inherent/04-MERCADO.md`.
⚠️ **La web se escribe para los tres mercados: precios en USD y sin «Guatemala» como alcance.** El de entrada
da **86 piezas a Q6,160 (Q72/pieza)** contra las ~16 de un paquete de Q3,000 **(Q188/pieza)**.

**El volumen nos separa del mercado. La profundidad separa los niveles entre sí.**

**El bundle no es descuento, es eficiencia.** Subir de escalón cuesta 75% menos que comprar lo
mismo suelto, porque todo lo que corre sobre agentes suma Q0 al costo variable.
**El movimiento comercial es subir a los clientes que ya están, no sumar clientes nuevos.**

**Ganamos de hacerles dinero.** El fee base cubre la operación; **la utilidad de verdad sale del
performance fee — 10% de las ventas atribuidas, con costo marginal Q0.** Cada quetzal de fee es
utilidad pura: lleva Accelerate de 61% a 71% sin tocar el precio base.
⚠️ **Sin atribución limpia no hay fee.**

**Los cuatro objetivos a la vez: costos bajos · valor enorme · precio justo · márgenes
altísimos.** Cierran **no bajando el precio, bajando el costo.**
**Con 5 clientes: 64% · 61% · 71%.** Con 10: 67% · 64% · 72%.
**Con performance fee encima, Accelerate pasa de 61% a 71-80%.**
Ver `inherent/06-ECONOMIA.md` → «Los márgenes reales» y `inherent/05-OPERACION.md`.

⚠️ **Hay dos trabajos que ya deberían hacer agentes y todavía los hace gente: el QA y la
operación.** Ahí está el 70% del costo matable.

**El equipo son dos personas y los agentes.** Allan dirige y es el gate; un operador corre los
agentes; producción solo graba; **los agentes hacen el resto.**

🔑 **Nadie cobra por cuenta. Todos cobran por hora, y cada cuenta paga su porción.**
Un sueldo por cuenta significa diez sueldos con diez cuentas — ese costo nunca baja.
**La tarifa baja según el volumen que le garantizamos** (100% / 80% / 65% / 50%), y **pasa a
sueldo fijo a partir de 60 h/mes.** Con ese modelo los márgenes van de **52-64% con 2 clientes a
66-74% con 10**, y **la utilidad vuelve a subir con el precio.** Ver `inherent/05-OPERACION.md`.

⚠️ **La producción no se baja recortando horas** — eso es bajarle el precio a la persona por el
mismo trabajo. Se baja **garantizándole volumen** a cambio de tarifa, o con el sistema de
contenido crudo del cliente.

⚠️ **Esto exige agentes que trabajen entre autónomos y dirigidos:** que levanten excepciones, no
preguntas. **Si el agente pregunta todo, no ahorra nada.**

⚠️ **No se vende una capa suelta.** Crecer exige algo íntegro; vender solo contenido o solo pauta
contradice lo que predicamos.

⚠️ **Los tres niveles incluyen estrategia.** Cambia la profundidad, no la existencia.

⚠️ **No se promete lo que no está en «Capacidades reales» de `inherent/06-ECONOMIA.md`.** Sin MCP no hay
acción, y sin acción no hay promesa. **Los límites declarados están en `inherent/01-IDENTIDAD.md`:**
no hacemos LinkedIn Ads, SEO técnico profundo, ni reclutamos personal.

## Dónde está cada cosa

**Todo lo de la empresa vive en `inherent/`.** Su `README.md` es el mapa.

| Si necesitás… | Andá a |
|---|---|
| Quiénes somos y qué nos diferencia | `inherent/01-IDENTIDAD.md` |
| El método — los 4 sistemas y las 2 divisiones | `inherent/02-METODO.md` |
| Los planes, precios y cómo se activa cada uno | `inherent/03-OFERTA.md` |
| Industrias, mercados o la red de mentores | `inherent/04-MERCADO.md` |
| El pipeline, los equipos o los ciclos | `inherent/05-OPERACION.md` |
| 🔒 Costos, márgenes, capacidades MCP | `inherent/06-ECONOMIA.md` |
| Copy, tono o el brief de la web | `inherent/07-COMUNICACION.md` |

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
