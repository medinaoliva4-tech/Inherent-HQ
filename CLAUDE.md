# Inherent HQ — Repo de Agentes

Este repositorio contiene **la empresa y sus agentes operativos**. Tres carpetas, tres preguntas:
`inherent/` **qué somos** · `agents/` **quién lo hace** · `clients/` **para quién**.

```
CLAUDE.md                  ← este archivo. La entrada de toda sesión
README.md                  ← qué es esto y qué tan profundo va un agente

inherent/                  ← LA EMPRESA — qué es, qué vende, qué cobra
├── README.md              ← el índice. Empezá acá
├── 01-IDENTIDAD.md        quiénes somos
├── 02-METODO.md           cómo pensamos — los 4 sistemas
├── 03-OFERTA.md           qué vendemos — los 3 planes y su activación
├── 04-MERCADO.md          a quién y dónde — industrias, mercados, mentores
├── 05-OPERACION.md        cómo lo entregamos — pipeline, equipos, ciclos
├── 06-ECONOMIA.md         🔒 cuánto cuesta y cuánto queda
└── 07-COMUNICACION.md     cómo lo decimos — brief de web

agents/                    ← LOS AGENTES — uno por etapa del pipeline
├── README.md              ← el roster y el estado de cada uno
└── <departamento>/        ← el brain de cada departamento operativo

clients/                   ← LOS CLIENTES (raíz)
└── README.md              cómo se arma un folder de cliente
```

Cada departamento operativo vive en `agents/<nombre>/` — su **brain** — con esta forma:

```
agents/<departamento>/
├── .claude-plugin/plugin.json   # la identidad del plugin: nombre, versión, descripción
├── WORKFLOW.md                  # cómo trabaja el departamento. Lo único que hay que leer
├── skills/                      # una carpeta por skill + COMO-LAS-USA.md, el índice
├── entregables/                 # las plantillas de lo que entrega
└── clients/                     # un cliente = una carpeta
```

Y en la raíz, los dos registros que hacen que esos departamentos **carguen**:

```
.claude-plugin/marketplace.json  # lista qué departamentos hay y en qué carpeta vive cada uno
.claude/settings.json            # los deja habilitados para todo el que clone el repo
```

🛑 **Un `plugin.json` suelto no carga nada.** Un departamento nuevo no existe para Claude hasta que
está listado en `marketplace.json` y habilitado en `settings.json`. Son dos líneas, pero sin ellas
el departamento es una carpeta de markdown que nadie lee.

🛑 **Todo el departamento se entiende abriendo una sola carpeta.** Si hace falta abrir cinco archivos
para entender una cosa, está mal organizado.

⚠️ **Transición en curso.** Conviven dos nomenclaturas: los departamentos con brain completo
(`agents/comprension/`, `creative/`, `posting/`, `production/`, `strategy/`) y las **fichas
numeradas** de una sola página (`agents/01-strategy/` … `agents/10-ads-management/`), que describen
el alcance de cada etapa y todavía no tienen brain. `agents/01-strategy/brain/` tiene además un
método de Strategy en 4 bloques que **no** es el de 8 capas de `agents/strategy/`.
🛑 **Las dos versiones de un mismo departamento no se fusionan por cuenta propia: se declara y lo
decide un humano.**

Se le habla al agente desde **Buzz** a través de una sesión de Claude Code. Por eso este archivo
es lo primero que se lee en cada sesión: define quién sos y cómo arrancás.

---

## Cómo se compone un agente

Todo agente de Inherent tiene tres capas. **Esta es la definición base — vale para todos.**

```
PROPÓSITO   el panorama y la meta del agente. Su área.
    │       Strategy: la estrategia. Creative: las ideas. Etc.
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


---

## Agentes disponibles

El flujo de Inherent tiene **8 departamentos**, en este orden:

```
① Comprensión → ② Estrategia → ③ Marketing → ④ Creatividad → ⑤ Producción →  ⑥A Diseño  → ⑦ Posting → ⑧B Ads
                      ↓                ↑                                    ⑥B Video ↗
                 ②B Branding ──────────┘
```

| # | Departamento | Carpeta | Qué hace | Estado |
|---|---|---|---|---|
| **①** | **Comprensión** | `agents/comprension/` | Ordena la realidad del negocio y del cliente antes de estrategia | ✅ Operativo |
| **②** | Estrategia | — *(hoy dentro de `agents/strategy/` Capas 1-4)* | 3 verdades, ICP, posicionamiento, ingeniería inversa | 🟡 Parcial |
| **②B** | Branding | — | Guidelines, tono de voz, dirección visual | ⬜ Pendiente |
| **③** | Marketing | — *(hoy dentro de `agents/strategy/` Capas 5-7)* | Campañas, canales, fechas, pilares, frecuencia, calendario | 🟡 Parcial |
| **④** | **Creatividad** | `agents/creative/` | Ideas, conceptos, hooks, copy, guion y dirección — el brief por pieza | ✅ Operativo |
| **⑤** | **Producción** | `agents/production/` | Desglose, jornadas, recursos, presupuesto, rodaje y entrega del material | ✅ Operativo |
| **⑥A** | Diseño gráfico | — | Composición, layout, elementos gráficos, export de lo estático | ⬜ Pendiente |
| **⑥B** | Video Editing | `agents/video/` | Del material crudo al master por plataforma | 🔵 En el PR #4 |
| **⑦** | **Posting** | `agents/posting/` | Captions finales, QA de plataforma, programación y el archivo de carga de Publer | ✅ Operativo |
| **⑧B** | Ads | — | Segmentación, presupuesto de pauta, optimización | ⬜ Pendiente |

> 🔄 **Transición.** `agents/strategy/` todavía cubre **② y ③** juntos, y conserva su propia Capa 0
> (`nucleo.md`). **① Comprensión ya es un departamento propio** y no la reemplaza: el corte está
> declarado en `agents/comprension/WORKFLOW.md` §11 — los **hechos** viven en `comprension.md`, la
> **dirección** (el WIN y el arquetipo) sigue en `nucleo.md`, que los **cita en vez de recopiarlos**.
> El mapeo capa→departamento de aguas abajo está en `agents/creative/WORKFLOW.md` §2. Cuando ②③ se
> separen, cambian **las rutas**, no los métodos.

> ⚠️ **Huecos conocidos del flujo**, anotados y todavía sin decidir: **⑧A Orgánico** (comunidad,
> comentarios y DMs — ⑦ Posting ya está escrito contra él y le pasa qué salió y cuándo). El
> **aprendizaje de negocio** ya tiene su vuelta: ⑦ y ⑤ devuelven a ① los tiempos de aprobación y la
> capacidad reales. **⑥B Edición de video** lo cubre el PR #4 — ⑤ Producción entrega RAW y selects, y
> el montaje, el color de entrega y las versiones por plataforma son de ⑥B.

---

## Cómo arrancás cada sesión

1. **Identificá el pedido y el departamento.**
   - Entender un negocio antes de que exista estrategia: onboarding de cliente nuevo, productos y
     precios, de dónde entra el ingreso, quién compra y cómo habla, capacidad real, restricciones,
     problemas y oportunidades → invocá la skill `comprension:comprension`.
   - Estrategia, research, posicionamiento, calendario macro → invocá la skill `estrategia`.
   - Ideas de contenido, conceptos, big ideas, hooks, copy de piezas, dirección de arte, shot lists,
     adaptación por plataforma, swipe file → invocá la skill `creatividad:creatividad`.
   - Desglose de escenas, jornadas, recursos, presupuesto de rodaje, call sheets, entrega de
     material → invocá la skill `produccion:produccion`.
   - Captions finales, hashtags, alt text, QA de plataforma, fecha y hora, calendario de publicación,
     el archivo de carga de Publer → invocá la skill `posting:posting`.
   - **Posting requiere los archivos finales.** Sin el Gate 3 de ④ y sin los exports de ⑥A/⑥B, se
     **BLOQUEA**. Y 🛑 **no publica: deja el paquete listo y sube un humano.**
   - **Creative requiere estrategia aprobada.** Si el pedido es de Creative y no existe
     `posicionamiento.md` aprobado + `calendario-estrategico.csv`, se **BLOQUEA**.

   > Los departamentos ①, ④, ⑤ y ⑦ son **plugins**, y sus skills llevan el prefijo del plugin
   > adelante (`comprension:co-capacidad`, `creatividad:cr-brief`, `produccion:pr-jornadas`,
   > `posting:po-carga`). Las de ②③ viven en `.claude/skills/` y van sin prefijo.
   >
   > 🛑 **La sesión de Claude Code se abre en la carpeta raíz del repo, nunca en una subcarpeta.**
   > Los plugins se instalan con *project scope*, y ese scope queda atado a **la carpeta exacta**
   > desde la que abriste la sesión. Si arrancás en `agents/creative/`, el scope no coincide y **los
   > cuatro departamentos no existen**: `comprension:comprension` devuelve `Unknown skill` y no hay
   > ningún otro síntoma. Comprobalo con `pwd`: tiene que terminar en el nombre del repo.
   >
   > Si aun abriendo en la raíz las skills de un plugin **no aparecen**, la instalación está
   > incompleta: el paso a paso vive en cualquiera de los cuatro
   > `agents/<departamento>/skills/COMO-LAS-USA.md`.
   >
   > 🛑 **Después de cada `git pull`, reinstalá el plugin.** Lo que corre es una **copia congelada**
   > en `~/.claude/plugins/cache/`, no un enlace al repo: editar el working tree no cambia lo que
   > lee el agente. Y `claude plugin update` **no alcanza** —compara por el `version` de
   > `plugin.json`, que no se toca en cada commit—, así que hay que desinstalar e instalar:
   >
   > ```bash
   > claude plugin marketplace update inherent-hq
   > for p in comprension creatividad produccion posting; do
   >   claude plugin uninstall "$p@inherent-hq" -s project
   >   claude plugin install   "$p@inherent-hq" -s project
   > done
   > ```
   >
   > Después, reiniciar Claude Code.

2. **Identificá el cliente.** Un cliente = una carpeta en `agents/<agente>/clients/<cliente>/`, y el
   **nombre canónico es el mismo en todos los agentes**. Nunca mezcles archivos de dos clientes.
3. **Declará el pre-flight** (ver abajo) antes de producir nada.

## Pre-flight obligatorio

Antes de ejecutar, respondé en una línea:

```
PRE-FLIGHT — Agente: [comprension/strategy/creative/production/posting] · Cliente: [x] · Arquetipo: [x o SIN CLASIFICAR]
Capa: [0-8] · Skills: [x] · MCPs: [x] · Inputs de departamentos previos: [x] · Gate humano: [sí/no]
→ PASS | BLOQUEADO: [qué falta]
```

Si falta el cliente o el input mínimo de la capa: **BLOQUEADO**, y pedí exactamente lo que falta.
Nunca rellenes con inferencia sin marcarla.

---

## Reglas duras del repo

1. **Evidencia o etiqueta.** Toda afirmación lleva fuente. Sin fuente va como
   `[percepción del cliente, no verificado]` o `⚠️ SIN DATOS`. Nunca inventes datos, competidores,
   métricas ni tendencias.
2. **Patrón ≠ señal.** 3+ fuentes independientes = `🟢 patrón`. 1-2 = `🟡 señal a confirmar`.
3. **Nunca saltes capas.** Los métodos son secuenciales: `agents/comprension/WORKFLOW.md` (7 capas),
   `agents/strategy/METHOD.md` (8), `agents/creative/WORKFLOW.md` (8),
   `agents/production/WORKFLOW.md` (8) y `agents/posting/WORKFLOW.md` (7).
   Si falta el input de una capa, se bloquea; no se improvisa el faltante. En ⑤ Producción esto es
   especialmente caro: **presupuestar sin consolidar infla el costo entre 3 y 5 veces**; en ⑦ Posting,
   **cargar sin QA de specs publica un archivo que ya no se puede arreglar**.
4. **Ingeniería inversa produce patrones, no recomendaciones.** Si un output de la Capa 1 empieza
   con "por lo tanto deberíamos…", se salió de su rol.
5. **No copiar.** La ingeniería inversa se traduce a hipótesis propias filtradas por distintividad,
   nunca a réplica del competidor.
6. **Gate humano.** En Comprensión: la captura y el documento. En Strategy: núcleo,
   posicionamiento y calendario. En Creative: brief, conceptos y el ciclo completo. En Producción:
   **presupuesto, plan de rodaje y entrega**. En Posting: **los captions y el paquete de carga**. Los
   aprueba un humano antes del handoff. El agente propone; no cierra. Y nada se compromete afuera
   —una reserva, una convocatoria, una compra, **una publicación**— antes de su gate.
7. **No duplicar otros departamentos.** Cada agente tiene un punto de corte declarado:
   - **① Comprensión** llega hasta **los hechos**: negocio, oferta, cliente y su lenguaje literal,
     entorno a nivel de mapa, capacidad y problemas con evidencia. 🛑 **Nunca dice "deberíamos"** —
     y la ingeniería inversa de la competencia es de ②, no suya.
   - **②③** (hoy `agents/strategy/`) llega hasta el plan de campañas + calendario.
   - **④ Creatividad** llega hasta el brief completo por pieza: concepto, emoción, hook, copy,
     guion, layout, escenas, encuadres, duraciones y qué elementos gráficos pedir.
   - **⑤ Producción** llega hasta el material base entregado y nombrado: RAW ordenado + selects.
     La post —montaje, color de entrega, versiones— es de **⑥B Video Editing**.
   - **⑦ Posting** llega hasta el **paquete listo para subir**: caption adaptado, QA de plataforma,
     fecha, hora y el archivo de carga. 🛑 **No publica** —sube un humano— **y no arregla el export**:
     lo que no cumple vuelve a ⑥A o ⑥B.
   Guidelines son de ②B Branding. Composición, elementos gráficos y export de lo estático son de
   ⑥A Diseño; el montaje y los masters son de ⑥B Video Editing.
   Comunidad, comentarios y DMs son de ⑧A Orgánico. La pauta es de ⑧B Ads.
8. **Lo que produce otro departamento se cita, no se reescribe — y nunca se edita.** Un campo que se
   copia con otras palabras crea una segunda versión de la verdad, y en dos ciclos las dos no
   coinciden. Se cita con su ruta:
   `agents/strategy/clients/<cliente>/posicionamiento.md §4.3`.
9. **La intención no se cambia aguas abajo: se devuelve.** Si algo no es producible o no es
   diseñable como está, vuelve al departamento que lo decidió, con motivo y **al menos dos
   alternativas concretas**. Resolverlo por cuenta propia es cómo se rompe una campaña sin que nadie
   lo haya decidido — y se descubre tarde, cuando ya no hay presupuesto para volver.
10. **Nada destructivo sin autorización.** No publicar, no pautar, no enviar al cliente, no borrar,
    no sobrescribir aprobados. En ⑤ Producción incluye **no borrar material crudo**, ni el descarte:
    se marca, no se elimina. En ⑦ Posting es el límite del departamento: **arma el archivo de carga,
    pero sube y programa un humano** — y bajar o republicar algo ya publicado también lo decide un
    humano. 🛑 **Ninguna credencial de publicación vive en el repo.**

---

## Convenciones de archivo

- Todo en **español**, salvo los términos del método que son fijos en inglés
  (`WIN`, `MUST BE TRUE`, `UNFAIR`, `GO GET`, `MOVE`, `COMPOUND`, `BIG IDEA`, `HOOK`, `BODY`,
  `PAYOFF`, `SWIPE FILE`, `SHOT LIST`, `TOFU`, `MOFU`, `BOFU`).
- Outputs de cliente: `agents/<agente>/clients/<cliente>/`. Nunca en la raíz.
  ⚠️ La carpeta `clients/` de la raíz es la propuesta que viene de `main` y **todavía está
  vacía**: hoy los outputs siguen viviendo bajo el departamento que los produce. Mientras las
  dos existan, manda esta línea.
- Un entregable faltante se marca `BLOQUEADO` o `PENDIENTE`. Nunca se omite en silencio.
- Formato de respuesta al usuario: headings, bullets y negritas. Lo accionable arriba.

---

# El negocio — el techo de todo lo de arriba

🔒 **Esta capa es restricción dura para todos los agentes.** Ningún departamento promete, produce
ni entrega por encima de lo que el plan contratado permite.

## Los agentes

**`agents/README.md` tiene el roster completo:** las doce etapas en orden, qué MCP le da cada
acción a cada agente, y **qué entrega cada uno según el plan contratado.**
**`inherent/05-OPERACION.md` tiene la cadena de entrega.**

🔑 **Cada ficha de agente dice qué le toca en Ignite, Accelerate y Compound.**
**El plan es el techo, no una sugerencia:** entregar de más rompe el margen, entregar de menos
rompe la promesa publicada.

🔴 **QA es el primero a construir, y no es una etapa: es el gate que corre entre todas.**
A 204 piezas al mes son **~612 revisiones** en un solo cliente Compound.

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
🟪 ACCELERATE  $1,200   estancado → escalando    escalar lo que ya funciona, sin perderlo
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
Con eso el mentor cuesta **−4 · −5 · −10 pts** y los márgenes quedan parejos en **60% · 60% · 61%**.
⚠️ **Arriba de $180/sesión NO se absorbe: va como add-on facturado al cliente.** Ver `inherent/04-MERCADO.md`.

## 🌐 La web ya está publicada — es la promesa

**Las tres tarjetas de precio están vivas en inherentglobal.com. Ya se comunicó. Ya se vio.**

🔒 **El repo no puede prometer menos, más ni distinto que la web.** Si algo interno contradice una
línea publicada, **gana la web** y se corrige el repo. Si una línea publicada no tiene capacidad
detrás, **se arregla la capacidad — no se borra la línea.**
**El texto publicado y qué respalda cada línea están en `inherent/03-OFERTA.md`.**

✍️ **Toda la copia al cliente va de TÚ, no de vos.** Así está publicado.

🟡 **Lo único prometido que todavía no tiene persona asignada:** el **especialista de corporate
structure** — Allan lo cubre mientras tanto.
⚠️ **No se promete un CFO.** «Tus números claros» lo entrega **Money OS** con Allan y Strategy.

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
utilidad pura: lleva Accelerate de 60% a 70% sin tocar el precio base.
⚠️ **Sin atribución limpia no hay fee.**

**Los cuatro objetivos a la vez: costos bajos · valor enorme · precio justo · márgenes
altísimos.** Cierran **no bajando el precio, bajando el costo.**
**Con 5 clientes: 64% · 65% · 71%.** Con 10: 67% · 67% · 72%.
**Con la mentoría adentro quedan parejos en 60% · 60% · 61%**, y con performance fee
Accelerate pasa de 60% a 70-78%.
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

🕷️ **Todo lo que haya que scrapear se hace con Apify** — IG, TikTok, YouTube, LinkedIn, Google
Maps, Google Search y la biblioteca de anuncios de Facebook. **Plan Starter $19/mes, ~Q205
totales al mes con 5 clientes: menos de 1 punto de margen.** 🟡 **Falta instalar el MCP y probar
los nueve actores.** Ver `inherent/06-ECONOMIA.md` → «Apify».

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

