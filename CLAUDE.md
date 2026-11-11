# Inherent HQ — Agentes

Cada agente vive en `agents/<NN>-<área>/`, numerado en el orden en que corre el trabajo.
**Se opera directo desde Claude Code**, contra este repo — sin servidores ni hosting. **Única excepción: `ceo-os/`**, la web privada de Inherent en Vercel *(login con Google)*.

## Estructura

```
README.md                  ← qué es esto y qué tan profundo va un agente
CLAUDE.md                  ← este archivo. La entrada de toda sesión
PENDIENTES.md              ← lo que falta decidir, construir o probar. NO es manual
INSTALAR.md                ← qué instalar en cada computadora para que corran los agentes

inherent/                  ← LA EMPRESA — qué es, qué vende, qué cobra
├── README.md              ← el índice. Empezá acá
├── 00-PRINCIPIOS.md       ← lo que nadie rompe. Se lee al empezar toda sesión
├── 01-IDENTIDAD.md        quiénes somos
├── 02-METODO.md           cómo pensamos — los 4 sistemas
├── 03-OFERTA.md           qué vendemos — los 3 niveles, las 12 áreas y la ficha de oferta
├── 04-MERCADO.md          a quién y dónde — industrias, mercados, mentores
├── 05-OPERACION.md        cómo lo entregamos — roles, pipeline, calendario
├── 06-ECONOMIA.md         🔒 cuánto cuesta y cuánto queda
├── 07-COMUNICACION.md     cómo lo decimos — brief de web
├── 08-CRITERIOS-DE-ACEPTACION.md  cuándo un entregable está bien hecho — una ficha por entregable
├── inherent-social-media/ Inherent como cliente — nuestras propias redes, nivel Brand Growth
└── administracion/        skills para administrar Inherent: caja, cobros, SAT, ventas, contratos

agents/                    ← LOS AGENTES — uno por área, 1 orquestador + 4 skills como máximo
├── README.md              ← el roster, el hilo y qué entrega cada uno
├── _router/ · _comun/     ← /inherent · recepcion y resultados (comunes a todas las áreas)
└── <NN>-<área>/           00-account · 01-strategy · 02-branding · 03-marketing-creative
    ├── README.md          04-production · 05-graphic-design · 06-community
    └── brain/             07-posting · 08-ads
        ├── WORKFLOW.md
        └── skills/<skill>/

ceo-os/                    ← LA HERRAMIENTA DEL CEO — web privada con login; el repo es su base de datos

clients/                   ← LOS CLIENTES
├── README.md              cómo se arma un folder de cliente
└── <cliente>/             todo lo del cliente — su CLAUDE.md es el router
```

**Tres carpetas, tres preguntas:**
`inherent/` **qué somos** · `agents/` **quién lo hace** · `clients/` **para quién**

🗂️ **Dónde vive cada cosa:** el repo guarda **cómo se hace el trabajo y los agentes**. El trabajo
**se entrega en Inherent OS** *(el perfil de cada quien y el portal del cliente)*. El material de
cada cliente *(guiones, videos por publicar, assets)* **vive en Google Drive**, conectado a Inherent OS.
Idealmente, **el folder del cliente en el repo llega hasta el onboarding** *(lo establecido y la
estrategia)*; **lo de operar** *(planner, ideas, tareas, entregas, métricas)* **vive en Inherent OS.**

## Cómo se compone un agente

Todo agente de Inherent tiene tres capas. **Esta es la definición base — vale para todos.**

```
PROPÓSITO   el panorama y la meta del agente. Su área.
    │       Strategy: el cliente ideal y la estrategia. Marketing y Creative: las ideas. Etc.
    ▼
ACCIONES    lo que el agente PUEDE HACER. Las determinan los MCPs.
    │       La CALIDAD del MCP es la CALIDAD de la acción.
    ▼
LÓGICA      CÓMO hace esas cosas. Son las skills.
            El razonamiento y el método detrás de cada acción.
```

1. **Un agente no puede hacer nada que su MCP no permita.** Si falta la acción, falta un MCP —
   no se arregla con mejor prompt.
2. **Un MCP flojo produce acciones flojas**, por más buena que sea la lógica.
3. **Una skill no es una acción, es una lógica.** Define cómo se usa lo que el MCP entrega.

Antes de agregar una skill, preguntar: **¿el agente tiene la acción para ejecutarla?**
Antes de agregar un MCP, preguntar: **¿esta acción cae dentro del propósito de este agente?**

---

## Los roles

| Rol | Qué hace |
|---|---|
| **CEO** | Decide estrategia, ruta, servicios y promesas. Reunión del día 1 con cada cliente. Hace el control de calidad en persona. **Es el gate de la estrategia y de la pauta** |
| **COO** | Organiza y coordina al equipo operativo y las entregas. QA final. Presenta el día 20 en Brand Growth |
| **Operador de agentes** | Solo opera agentes: Marketing y Creative, Branding, Diseño gráfico, Posting y Community |
| **Editor de video · Fotografía · Producción** | Editan, fotografían y graban |
| **Secretaria** *(WhatsApp)* | El agente `00-account`. Atiende al cliente. Escala precio, alcance y fechas al CEO, y lo demás al COO |
| **Especialista** | La auditoría de Growth Partnership |

**Quién ocupa cada rol, qué herramienta llena cada slot y quién hace cada tarea:
`inherent/05-OPERACION.md`.** El resto del repo nombra el rol, nunca la persona.

## Los agentes

**`agents/README.md` tiene el roster completo:** las etapas en orden, qué MCP le da cada acción
a cada agente, y **qué entrega cada uno según el alcance contratado.**

🔑 **Cada agente tiene su `brain/WORKFLOW.md` con sus pasos, sus gates y sus entregables.**
**Sencillo: cada área = 1 orquestador + 4 skills como máximo.** ① Strategy es la madre de todo:
producto → cliente ideal (ICP) → dolores, deseos e historia → adquisición → brief. Lo que no traza
hasta el ICP no se produce.

🤝 **Agente, herramienta, persona:** el agente propone *(profundidad o volumen)* → la persona corrige
en la herramienta de Inherent OS → lo aprobado queda como dato fijo. **Entre áreas viajan nodos del
hilo del cliente** *(con estado `hipotesis` o `aprobado` y de dónde vienen)*, no hojas de cálculo.
Ver `agents/README.md` → «El hilo».
**El alcance contratado (la ficha de oferta) es el techo de todos, no una sugerencia:** entregar de más rompe el margen,
entregar de menos rompe la promesa.
**Sin ficha de oferta, el agente BLOQUEA a ese cliente.**

📅 **El ciclo de contenido corre del día 1 al 20 de cada mes:** día 1 reunión · 1-3 plan ·
2-3 calendario y shot list · 3-6 brand guidelines · 4-5 coordinar · 6-10 producir ·
**11 último día para producir** · 12-15 montar · 16-19 cambios y programación ·
**20 presentación al cliente.** **Lo presentado el 20 se publica desde el día 1 del mes siguiente.**
Las fechas se ajustan cada mes al calendario real; los límites del 11 y el 20 se respetan.
Ver `inherent/05-OPERACION.md` → «El calendario del ciclo».

🔑 **El QA no es un agente aparte:** cada departamento se auto-revisa y sigue,
**② Branding valida con `br-guardian`** y el COO hace el QA final.
✅ **Nada pasa a «Listo» sin sus criterios:** cada entregable cumple su ficha de
`inherent/08-CRITERIOS-DE-ACEPTACION.md` antes de entregarse.

🗣️ **`agents/00-account/` es el único agente que le habla al cliente.** Vive en WhatsApp,
siempre encendido, **habla como la secretaria de Inherent** y escala lo que no puede resolver:
**precio, alcance y fechas al CEO; lo demás al COO.** 🔒 **Nunca dice costos, márgenes, ni nada de otro cliente, ni compromete precio, fecha
o alcance.** `inherent/06-ECONOMIA.md` no sale del repo.

## La identidad

# BRAND GROWTH PARTNER

**We build cool brands—and the growth systems behind them.**
Construimos marcas interesantes, creativas y deseables. **Lideramos el frente de crecimiento**
*(estrategia, identidad, marketing, experiencia digital, medición)* y **entramos al backend
cuando hace falta** *(procesos, CRM y automatizaciones, roles, métricas)*.

🎯 **La pregunta filtro:** ¿este trabajo hace la marca **más deseable, más fácil de elegir o más
capaz de convertir** esa demanda en ingresos? Con quién encajamos: `inherent/01-IDENTIDAD.md`.

**No somos agencia ni consultoría.**
La agencia hace piezas. La consultoría hace diagnósticos. **Nosotros construimos el camino, el sistema y la medición para que el negocio
crezca, y nos quedamos adentro mientras se ejecuta.**

**Prometemos un camino, un sistema y medición — no un resultado garantizado.** El tipo de
crecimiento lo define dónde está trabado el negocio, no lo que queramos vender. **El título no
significa hacernos cargo de cada función de la empresa:** el alcance se define por cliente.

**Cómo:** con **Estrategia** como columna — ingeniería inversa de la meta financiera hasta la
pieza, incluyendo mejorar la oferta y el posicionamiento. Y cinco equipos que desarrollan la
visión: **Marketing · Branding · Creatividad · Tecnología · ADS.**

> **`inherent/01-IDENTIDAD.md`** tiene la identidad completa y —lo más importante para vender—
> **lo básico vs. el valor único** de cada nivel.

## El techo comercial

**El techo es el alcance contratado:** nivel + áreas + volumen + revisiones, escrito en la **ficha
de oferta** del cliente *(`00-onboarding/plan-contratado.md` — conserva el nombre, describe nivel,
áreas, volumen, revisiones y qué queda fuera)*. **Es restricción dura para todos los agentes.**
Se lee antes de prometer nada. **Sin ficha, el agente BLOQUEA a ese cliente.**
`inherent/06-ECONOMIA.md` tiene los costos y las capacidades reales.

### Tres niveles

```
1 · BRAND FOUNDATION    «creamos la marca cool»                 proyecto, con inicio y cierre
2 · BRAND GROWTH        «hacemos más cool la marca que ya está»  colaboración mensual
3 · GROWTH PARTNERSHIP  «nos metemos full»                       colaboración integrada
```

**Un solo sistema de tres niveles de profundidad, en el orden en que una marca los necesita.**
En cada propuesta se eligen **solo las áreas necesarias** — no todos compran todo.

🔑 **El nivel dice qué tan adentro entramos, no cuántas piezas entregamos.** El catálogo de
**12 áreas**, qué cae en cada nivel y la ficha de oferta están en `inherent/03-OFERTA.md`.

🔑 **Prometemos un camino, un sistema y medición — no un resultado garantizado.** El título
*Brand Growth Partner* **no** significa garantizar todo el crecimiento ni hacerse cargo de cada
función de la empresa. **El alcance y las responsabilidades se definen por proyecto y cliente.**

🚀 **Somos un acelerador de marcas. Cada nivel es un BOOST distinto, no más volumen del anterior.**
**Growth Partnership NO es «que te conozcan más».** Ese comprador ya se siente estancado y **teme
romper lo que le funciona.**

**Los pilares no cambian — son la metodología. Cambia el verbo:**
Foundation **sienta la base** · Growth **ejecuta atención y demanda** · Partnership **integra**.
Ver `inherent/02-METODO.md` y `inherent/03-OFERTA.md`.

### Los cuatro sistemas

```
GROWTH OS       de dónde sale el crecimiento  →  los 3 pilares de cada división
CONVERSION OS   que ese crecimiento se cobre
OPERATIONS OS   que la empresa lo aguante
MONEY OS        que quede utilidad
```

**Una agencia solo trabaja el primero.** Por eso sus clientes crecen y se rompen.

| | 🧱 FOUNDATION | 📈 GROWTH | 🤝 PARTNERSHIP |
|---|---|---|---|
| **Qué es** | Proyecto con cierre | Colaboración mensual | Colaboración integrada |
| **Growth OS** | Sienta la base *(diagnóstico, oferta, posicionamiento)* | Ejecuta atención y demanda | Los 3 pilares, integrados |
| **Conversion OS** | — | Lo básico de lo contratado | ✅ Completo |
| **Operations OS** | — | — | SOPs de las áreas contratadas |
| **Money OS** | — | — | Finanzas vinculadas al crecimiento |

🔑 **Un sistema entra cuando el negocio tiene con qué alimentarlo.** Conversion no entra antes
porque **no hay nada que perder**; Operations porque **no se puede documentar un proceso que
todavía no funcionó**; Money porque **sin transacciones el margen por línea es teoría.**
**Meterlo antes es cobrar por algo que no se puede usar.** Ver `inherent/02-METODO.md`.

**Seis capacidades bajo un techo:** 📣 Marketing · 🎨 Creative · 🎬 Production · 🏷️ Branding ·
🔧 Tech · 📊 Consulting. **Strategy debe conocer las seis** para decidir qué activar.

🎓 **La red de especialistas es el diferenciador que más pesa.**
**Por industria** *(externos — MentorCruise · GrowthMentor · MentorPass)*: gente que ya creció su
marca ahí y responde *«¿qué harías si esta fuera tu empresa?»*. **El mentor hace la auditoría.**
**Por área** *(nuestros)*: corporate structure, eventos, networking y PR, talent production,
talent marketing. **Red, no nómina.**
🔑 **Tres reglas lo hacen rentable:** **el experto de industria es exclusivo de Growth Partnership**
y se especifica **quién, cuántas horas y qué entrega** · **la membresía se paga anual y es de
Inherent** *(sirve a todos los clientes de esa industria)* · **arriba de $180/sesión no se absorbe:
va como add-on facturado al cliente.** Ver `inherent/04-MERCADO.md`.

## Lo que entrega cada nivel

**El catálogo de áreas, la ficha de oferta y qué cae en cada nivel están en `inherent/03-OFERTA.md`.**
**La web vive en su propio repo.**

«Finanzas vinculadas al crecimiento» lo entrega **Money OS** con el CEO y Strategy.
**Corporate structure** lo cubre la auditoría del especialista.

---

💚 **Un emprendedor no contrata sistemas. Contrata a alguien que cuide lo que construyó.**
**No industrializamos empresas: les damos alma, propósito y facturación.**
**Se le habla de lo que DESEA, no de lo que la industria dice que necesita.** Ver `inherent/03-OFERTA.md`.

🚫 **No vendemos servicios. Vendemos resultado.** *"Te damos SOPs"* ❌ ·
*"Te puedes ir una semana y la empresa factura igual"* ✅
**El volumen y las herramientas son la EVIDENCIA de que podemos — nunca la oferta.**

🔑 **El precio se justifica por el alcance: cuántas áreas activamos y qué tan adentro entramos.**
**Nunca por volumen de entregables suelto.**

🔑 **La etapa no es mérito, es realidad:** lo que el cliente necesita hoy dice en qué nivel está.

🔑 **Si la empresa es el estorbo, más demanda empeora el problema:** se arregla la capacidad
primero, aunque la venta fácil sea más pauta.

### La economía

**El precio se arma por volumen y complejidad:** más canales, más producción, más ubicaciones,
más integración o más responsabilidad de ejecución. **Los niveles no traen un número fijo de
piezas.** Cada nivel tiene un **baseline**: el precio de entrada desde el que se cotiza, en
escalones. **Brand Foundation es el más barato.**

| Nivel | Baseline | En quetzales | Cómo se cobra |
|---|---|---|---|
| 🧱 **Brand Foundation** | **$1,200** | Q9,240 | Por proyecto |
| 📈 **Brand Growth** | **$2,400** | Q18,480 | Al mes |
| 🤝 **Growth Partnership** | **$4,200** | Q32,340 | Al mes |

*(USD a Q7.70.)* El baseline es **interno**: el piso para cotizar, nunca un precio en la web.

🔑 **La web no muestra precio.** Un precio solo, sin contexto, se compara con lo más barato. La
web **vende lo que la marca puede ganar** y lleva a **«Hablemos»**. **Al primer contacto se
responde en un minuto**; en la conversación se entiende el caso, se ve lo que está en juego y
**entonces** se da el precio, con el alcance delante.

🔑 **Los niveles son límites, no pipelines.** Ponen el techo de lo que puede entrar. **El
pipeline se arma por cliente**, con los módulos que su ficha incluye *(los servicios ya están
productizados)*. **No existe un solo pipeline:** existe uno por cliente, ajustable cuando
cambia lo que necesita.

**La industria no cambia el precio por sí sola:** cambia las tareas, los conocimientos y los
canales; la inversión se ajusta por volumen y complejidad.

🌐 **Guatemala es dónde arrancamos, no el techo.** Los costos se pagan en quetzales y no cambian
al cambiar de mercado; **lo único que cambia es el precio.** Ver `inherent/04-MERCADO.md`.

**Ganamos de hacerles dinero.** El fee base cubre la operación; **la utilidad de verdad puede salir
del performance fee — 10% de las ventas atribuidas.** **Solo existe en Growth Partnership y solo con
atribución limpia:** no existe en Foundation ni en Growth.

🔒 **Los costos se llevan por rubro y por rol, y se cotizan por alcance** *(la ficha de oferta
dice el precio base y qué lo aumenta)*. Ver `inherent/06-ECONOMIA.md` y `inherent/05-OPERACION.md`
→ «Lo que cuesta cada rol».
🔑 **El CEO y el COO no son rubro:** cobran de la utilidad. Sus horas son **capacidad**, no costo.

🔑 **Costos de terceros siempre aparte:** pauta, producción especial, talento, locaciones, viajes,
licencias y mentores sobre $180/sesión.

🔑 **La producción no se baja recortando horas** — eso es bajarle el precio a la persona por el
mismo trabajo. Si el monto no alcanza, **se cambia la mezcla** *(más derivados, contenido crudo
del cliente)* **o se cotiza extra.** Si una cuenta consume más de lo contratado, se cotiza extra
o sube de nivel — **nunca se absorbe.**

🔑 **Esto exige agentes que trabajen entre autónomos y dirigidos:** que levanten excepciones, no
preguntas. **Si el agente pregunta todo, no ahorra nada.**

🔑 **No se vende una capa suelta DISFRAZADA DE CRECIMIENTO.** Crecer exige algo íntegro.
Lo prohibido es cobrar contenido o pauta prometiendo facturación. **La ficha dice qué se compró.**

🔑 **Todo nivel incluye estrategia.** Cambia la profundidad, no la existencia.
**La OFERTA** *(qué vende, en qué paquetes y a qué precio)* **se trabaja en Brand Foundation y en
Growth Partnership.** En **Brand Growth** se trabaja el **mensaje** —cómo se cuenta lo que ya
vende—; la adquisición de ① Strategy corre ligera: elige cuáles de las ofertas que ya existen se empujan, para que la
pauta sepa qué pautar. No cambia la oferta.
**Confundirlos es regalar el trabajo caro dentro del nivel barato.**


### Las herramientas son slots

**El manual describe la responsabilidad; la herramienta que la cumple hoy está en la tabla de
slots de `inherent/05-OPERACION.md`.** Si cambia una herramienta, se cambia esa tabla.

| Responsabilidad | Qué hace |
|---|---|
| **Publicación y bandeja de mensajes** | Programa y publica lo aprobado; atiende comentarios y mensajes |
| **Scraping** | IG, TikTok, YouTube, LinkedIn, Google Maps, Google Search y la biblioteca de anuncios de Facebook |
| **IA** | Corre los agentes |

🔌 **Un MCP declarado NO es un MCP conectado.** **No se promete lo que no está en «Capacidades
reales» de `inherent/06-ECONOMIA.md`.** Sin MCP no hay acción, y sin acción no hay promesa.

🛡️ **Las garantías y sus condiciones están en `inherent/03-OFERTA.md`.**

## Dónde está cada cosa

**Todo lo de la empresa vive en `inherent/`.** Su `README.md` es el mapa.

| Si necesitás… | Andá a |
|---|---|
| Los principios — lo que nadie rompe, en una página | `inherent/00-PRINCIPIOS.md` |
| Quiénes somos y qué nos diferencia | `inherent/01-IDENTIDAD.md` |
| El método — los 4 sistemas y las 2 divisiones | `inherent/02-METODO.md` |
| Los 3 niveles, las 12 áreas, la ficha de oferta y cómo se activa cada uno | `inherent/03-OFERTA.md` |
| Industrias, mercados o la red de mentores | `inherent/04-MERCADO.md` |
| Los roles, el pipeline o el calendario | `inherent/05-OPERACION.md` |
| 🔒 Costos, márgenes, capacidades MCP | `inherent/06-ECONOMIA.md` |
| Copy, tono o el brief de la web | `inherent/07-COMUNICACION.md` |
| Cuándo un entregable está bien hecho *(guion, story, carrusel, video, anuncio, brief, factura, propuesta)* | `inherent/08-CRITERIOS-DE-ACEPTACION.md` |
| Administrar Inherent: caja, cobros, impuestos, ventas | `inherent/administracion/` |
| Ver y operar la empresa en una web *(finanzas, sales, operations…)* | `ceo-os/README.md` |
| Qué instalar en una computadora nueva | `INSTALAR.md` |
| Lo que falta decidir, construir o probar | `PENDIENTES.md` |

## Cómo arrancás una sesión

🧭 **Todo pedido de trabajo para un cliente entra por el router `/inherent`.** Imprime el
`ENRUTAMIENTO` y le pasa el pedido al orquestador del departamento. **El prompt es el pedido, no
el método** — el método es el `WORKFLOW.md`. Un hook (`.claude/hooks/enrutar.sh`) lo recuerda en
cada mensaje. **Atajo seguro:** escribir `/strategy …`, `/marketing-creative …`, etc. directo.

0. **Lee `inherent/00-PRINCIPIOS.md`.** Es obligatorio al empezar toda sesión, antes que el workflow.
1. **Identificá el agente** que corresponde al pedido.
2. **Leé su `brain/WORKFLOW.md` completo.** Es la única fuente de cómo trabaja.
3. **Identificá el cliente.** Un cliente = un folder en `clients/`, con su `CLAUDE.md` como router. Nunca mezclar dos.
   🔒 **El repo es privado: toda la información del cliente vive en su folder.** Si alguna vez
   vuelve a ser público, `clients/` solo guarda un README con el link al repo privado del
   cliente. Ver `clients/README.md`.
   🏠 **Cuando el cliente es Inherent** *(nuestras propias redes)*, el folder es
   `inherent/inherent-social-media/`.
4. Seguí el workflow. Las skills se invocan donde el workflow lo indica.

## Reglas

- **Español.** Los términos del método quedan en inglés: `WIN`, `MUST BE TRUE`, `UNFAIR`, `GO GET`, `MOVE`, `COMPOUND`.
- **El repo es el manual, no el chat.** `CLAUDE.md`, `inherent/` y `agents/` solo reciben lo que
  el CEO aprobó **en ese mismo turno**. Nada de lo conversado se sube solo.
  Lo que no está decidido **no entra: se pregunta.** Sin rastros de conversación: ni «por confirmar»,
  ni «pendiente», ni fechas de verificación, ni historia de cómo se llegó a la decisión.
  **Lo que falta decidir, construir o probar vive en `PENDIENTES.md`, nunca en el manual.**
- **Los clientes y la facturación de Inherent se leen, nunca se suponen.** Cuántos clientes hay,
  quiénes son y en qué nivel/alcance sale **solo de `clients/`** *(el `00-onboarding/plan-contratado.md` de
  cada uno)*. Lo que factura Inherent sale **solo de la contabilidad**. Los escenarios del manual
  *(«con 5 clientes», «con 10 clientes»)* son modelos, no la realidad. Si el dato no está, se dice.
- **Antes de escribir en el repo, se presenta qué se va a escribir:** los archivos, qué lleva cada
  uno y qué cambia en los que ya existen. **Se escribe solo con el OK del CEO en ese mismo turno.**
- **Roles, no nombres.** Los nombres de las personas están solo en la tabla de slots de `inherent/05-OPERACION.md`.
- **Evidencia o etiqueta** — en el trabajo de cliente. Sin fuente va como `[dice el cliente, sin verificar]`
  o `⚠️ SIN DATOS`. Nunca inventar.
- **Solo la info que entrega el usuario**, salvo que él habilite fuentes externas.
- **El CEO solo bloquea en dos lugares:** **① Strategy** *(aprueba la estrategia antes de que pase a
  los departamentos)* y **⑧ Ads** *(aprueba el plan y el presupuesto antes de lanzar, y cada cambio
  de presupuesto)*. **Lo demás fluye:** cada departamento se auto-revisa y sigue. El control de
  calidad lo hace el CEO en persona y no se registra. **Lo que está en el repo ya pasó por el CEO.**
- **Escalar no es bloquear:** precio, alcance y fechas → el CEO · lo demás → el COO.
- **Los departamentos se escriben con número y nombre:** «④ Producción», nunca «④» solo.
- **Nada destructivo sin autorización:** no pautar sin el OK del CEO y no borrar sin autorización.
- Formato de respuesta: headings, bullets, negritas. Lo accionable arriba. Sin párrafos largos.
- **Cómo le hablamos al CEO (TDAH):** mensajes mínimos y en lenguaje humano.
  - **Primero lo que tiene que hacer**, en pasos cortos y numerados.
  - **Una sola pregunta a la vez.**
  - Sin jerga: si un término técnico es necesario, se explica en una frase.
  - Sin muros de texto ni tablas largas. El detalle técnico solo si lo pide.
  - De «tú», nunca de «vos».
