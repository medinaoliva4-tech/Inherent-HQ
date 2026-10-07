# Inherent HQ — Agentes

Cada agente vive en `agents/<NN>-<área>/`, numerado en el orden en que corre el trabajo.
**Se opera directo desde Claude Code**, contra este repo — sin servidores ni hosting.

## Estructura

```
README.md                  ← qué es esto y qué tan profundo va un agente
CLAUDE.md                  ← este archivo. La entrada de toda sesión
PENDIENTES.md              ← lo que falta decidir, construir o probar. NO es manual

inherent/                  ← LA EMPRESA — qué es, qué vende, qué cobra
├── README.md              ← el índice. Empezá acá
├── 01-IDENTIDAD.md        quiénes somos
├── 02-METODO.md           cómo pensamos — los 4 sistemas
├── 03-OFERTA.md           qué vendemos — los planes y su activación
├── 04-MERCADO.md          a quién y dónde — industrias, mercados, mentores
├── 05-OPERACION.md        cómo lo entregamos — roles, pipeline, calendario
├── 06-ECONOMIA.md         🔒 cuánto cuesta y cuánto queda
├── 07-COMUNICACION.md     cómo lo decimos — brief de web
└── inherent-social-media/ Inherent como cliente — nuestras propias redes, plan Marketing Pro

agents/                    ← LOS AGENTES — uno por etapa del pipeline
├── README.md              ← el roster y el estado de cada uno
└── <NN>-<área>/           00-account · 01-strategy · 01.2-branding · 02-growth
    ├── README.md          03-marketing · 04-creative · 05-production
    └── brain/             06-graphic-design · 07-video-editing
        ├── WORKFLOW.md    08-community-management · 09-posting · 10-ads-management
        └── skills/<skill>/

clients/                   ← LOS CLIENTES
├── README.md              cómo se arma un folder de cliente
└── <cliente>/             todo lo del cliente — su CLAUDE.md es el router
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
| **CEO** | Decide estrategia, ruta, servicios y promesas. Reunión del día 1 con cada cliente. Aprueba ideas y calendario. **Es el gate humano** |
| **COO** | Organiza y coordina al equipo operativo y las entregas. QA final. Presenta el día 20 en la línea Marketing |
| **Operador de agentes** | Solo opera agentes: Creatividad, Branding, Diseño, Posting y Community |
| **Editor de video · Fotografía · Producción** | Editan, fotografían y graban |
| **Secretaria** *(WhatsApp)* | El agente `00-account`. Atiende al cliente y escala al COO |
| **Especialista** | La auditoría de la línea Growth |

**Quién ocupa cada rol, qué herramienta llena cada slot y quién hace cada tarea:
`inherent/05-OPERACION.md`.** El resto del repo nombra el rol, nunca la persona.

## Los agentes

**`agents/README.md` tiene el roster completo:** las etapas en orden, qué MCP le da cada acción
a cada agente, y **qué entrega cada uno según el plan contratado.**

🔑 **Cada agente tiene su `brain/WORKFLOW.md` con sus capas, sus gates y sus entregables.**
**El plan contratado es el techo de todos, no una sugerencia:** entregar de más rompe el margen,
entregar de menos rompe la promesa publicada.

📅 **El ciclo de contenido corre del día 1 al 20 de cada mes:** día 1 reunión · 1-3 plan ·
2-3 calendario y shot list · 3-6 brand guidelines · 4-5 coordinar · 6-10 producir ·
**11 último día para producir** · 12-15 montar · 16-19 cambios y programación ·
**20 presentación al cliente.** **Lo presentado el 20 se publica desde el día 1 del mes siguiente.**
Las fechas se ajustan cada mes al calendario real; los límites del 11 y el 20 se respetan.
Ver `inherent/05-OPERACION.md` → «El calendario del ciclo».

🔑 **El QA no es un agente aparte:** cada departamento se auto-revisa antes de su gate,
**②B Branding valida con `br-guardian`** y el COO hace el QA final.

🗣️ **`agents/00-account/` es el único agente que le habla al cliente.** Vive en WhatsApp,
siempre encendido, **habla como la secretaria de Inherent** y escala al COO lo que no puede
resolver. 🔒 **Nunca dice costos, márgenes, ni nada de otro cliente, ni compromete precio, fecha
o alcance.** `inherent/06-ECONOMIA.md` no sale del repo.

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

**`inherent/06-ECONOMIA.md`** define qué se puede entregar según el plan contratado: cuántas
piezas, qué canales, qué capas entran y cuántas revisiones. **Es restricción dura para todos los
agentes.** Se lee antes de prometer nada.

### Dos líneas, cuatro planes

```
🔷 MARKETING      $950     86 piezas    arrancando → visible
🔷 MARKETING PRO  $1,450   145 piezas   visible → presencia sostenida
🟨 ACCELERATE     $2,500   145 piezas   estancado → escalando
🟨 COMPOUND       $4,200   204 piezas   escalando → autónomo
```

**Más `Tailor Made`** — multi-locación, regulatorio, integraciones, proyectos por hito.

🔑 **El eje es qué promete cada línea, no cuánto entrega:**
**🔷 Marketing promete ATENCIÓN** *(compite con agencias)* · **🟨 Growth promete FACTURACIÓN**
*(compite con consultoría y CMO fraccional)*.

🔑 **Marketing Pro y Accelerate entregan las mismas 145 piezas, a propósito.**
El salto **no compra contenido — compra sistemas**: oferta, precio, conversión, canales y SOPs.
**Venderlo como «más piezas» es venderlo mal.**

🔷 **La línea Marketing apunta a un crecimiento medible:** *(métrica — slot)*

🚀 **Somos un acelerador de marcas. Cada plan es un BOOST distinto, no más volumen del anterior.**
**Accelerate NO es «que te conozcan más».** Ese comprador ya se siente estancado y **teme romper
lo que le funciona.**

**Dos divisiones — el eje es cómo se decide la compra, no quién compra:**

```
🔵 LOW TICKET    volumen      oferta · big sales · upsells
🟣 HIGH TICKET   precisión    oferta · cuentas grandes · expansión
```

**Los pilares no cambian — son la metodología. Cambia el verbo:**
Accelerate **ejecuta** · Compound **sistematiza**. **La línea Marketing no activa pilares** —
ejecuta atención. Ver `inherent/03-OFERTA.md`.

### Los cuatro sistemas

```
GROWTH OS       de dónde sale el crecimiento  →  los 3 pilares de cada división
CONVERSION OS   que ese crecimiento se cobre
OPERATIONS OS   que la empresa lo aguante
MONEY OS        que quede utilidad
```

**Una agencia solo trabaja el primero.** Por eso sus clientes crecen y se rompen.

| | 🔷 MARKETING | 🔷 MKT PRO | 🟨 ACCELERATE | 🟨 COMPOUND |
|---|---|---|---|---|
| **Ejecución de marketing** | ✅ | ✅ Mayor volumen | ✅ | ✅ Máximo |
| **Growth OS** | — | — | Los 3 ejecutando | Los 3 sistematizados |
| **Conversion OS** | — | — | ✅ | ✅ |
| **Operations OS** | — | — | SOPs **de crecimiento** | SOPs **de empresa** |
| **Money OS** | — | — | — | ✅ |

🔑 **Un sistema entra cuando el negocio tiene con qué alimentarlo.** Conversion no entra en la
línea Marketing porque **antes no hay nada que perder**; Operations porque **no se puede
documentar un proceso que todavía no funcionó**; Money porque **sin transacciones el margen por
línea es teoría.** **Meterlo antes es cobrar por algo que no se puede usar.** Ver
`inherent/02-METODO.md`.

**Seis capacidades bajo un techo:** 📣 Marketing · 🎨 Creative · 🎬 Production · 🏷️ Branding ·
🔧 Tech · 📊 Consulting. **Strategy debe conocer las seis** para decidir qué activar.

🎓 **La red de especialistas es el diferenciador que más pesa.**
**Por industria** *(externos — MentorCruise · GrowthMentor · MentorPass)*: gente que ya creció su
marca ahí y responde *«¿qué harías si esta fuera tu empresa?»*. **El mentor hace la auditoría.**
**Por área** *(nuestros)*: corporate structure, eventos, networking y PR, talent production,
talent marketing. **Red, no nómina.**
🔑 **Tres reglas lo hacen rentable:** **el mentor es exclusivo de la línea Growth** — meterlo en
Marketing rompe el margen del plan barato · **trimestral en Accelerate**, mensual en Compound ·
**la membresía se paga anual y es de Inherent** *(sirve a todos los clientes de esa industria,
−41% de costo)*. **Arriba de $180/sesión no se absorbe: va como add-on facturado al cliente.**
Ver `inherent/04-MERCADO.md`.

## Lo que entrega cada línea

**El texto de las cuatro tarjetas y qué respalda cada línea están en `inherent/03-OFERTA.md`.**
**La web vive en su propio repo.**

«Tus números claros» lo entrega **Money OS** con el CEO y Strategy.
**Corporate structure** lo cubre la auditoría del especialista.

---

💚 **Un emprendedor no contrata sistemas. Contrata a alguien que cuide lo que construyó.**
**No industrializamos empresas: les damos alma, propósito y facturación.**
**Se le habla de lo que DESEA, no de lo que la industria dice que necesita.** Ver `inherent/03-OFERTA.md`.

🚫 **No vendemos servicios. Vendemos resultado.** *"Te damos SOPs"* ❌ ·
*"Te puedes ir una semana y la empresa factura igual"* ✅
**El volumen y las herramientas son la EVIDENCIA de que podemos — nunca la oferta.**

🔑 **El precio se justifica por cuántos sistemas activamos y qué tan adentro entramos.**
**Nunca por volumen de entregables.**

🔑 **La etapa no es mérito, es realidad:** lo que el cliente puede pagar dice en qué etapa está,
y la etapa dice qué necesita.

🔑 **Si la empresa es el estorbo, más demanda empeora el problema:** se arregla la capacidad
primero, aunque la venta fácil sea más pauta.

### La economía

**La estrategia de precio es matarlos con valor, no cobrar más.** Los precios están **dentro del
rango que el mercado ya acepta**, con 3x a 5x el volumen de su tramo.

🌐 **Guatemala es dónde arrancamos, no el techo.** Los costos se pagan en quetzales y no cambian
al cambiar de mercado; **lo único que cambia es el precio.** Ver `inherent/04-MERCADO.md`.
El plan de entrada da **86 piezas a Q7,315 (Q85/pieza)** contra las ~16 de un paquete de Q3,000
**(Q188/pieza)**.

**El volumen nos separa del mercado. La profundidad separa las líneas entre sí.**

**Dentro de Marketing el bundle sí es descuento** *(38% menos que comprar suelto)*.
**El salto a Growth NO es descuento — es acceso:** nada de lo que agrega se vende à la carte.
**El movimiento comercial es subir a los clientes que ya están, no sumar clientes nuevos.**

**Ganamos de hacerles dinero.** El fee base cubre la operación; **la utilidad de verdad sale del
performance fee — 10% de las ventas atribuidas, con costo marginal Q0.** Cada quetzal de fee es
utilidad pura. **Sin atribución limpia no hay fee — y por eso no existe en la línea Marketing.**

**Los cuatro objetivos a la vez: costos bajos · valor enorme · precio justo · márgenes
altísimos.** Cierran **no bajando el precio, con el costo fijo.**

🔒 **El costo de cada plan es FIJO, por cuenta y por rubro — no es estimación.**

```
              GRABAC.  FOTO   EDICIÓN  OPERADOR  HERRAM.  ESPECIAL.  AUDIT.   BUFFER   COSTO    MARGEN
🔷 MARKETING   Q450    Q300    Q200     Q350      Q150       —         —      Q215    Q1,665    77%
🔷 MKT PRO     Q560    Q300    Q500     Q550      Q200       —         —      Q445    Q2,555    77%
🟨 ACCELERATE  Q780    Q300    Q700     Q900      Q300     Q1,000    Q1,200   Q520    Q5,700    70%
🟨 COMPOUND    Q960    Q300   Q1,000   Q1,400     Q500     Q2,000    Q1,800   Q840    Q8,800    73%
```

**El margen no cambia con el número de clientes.** Si una cuenta consume más, se cotiza extra o
sube de plan — **nunca se absorbe.** Ver `inherent/06-ECONOMIA.md` → «Los costos por plan — fijos».
🔑 **El CEO y el COO no son rubro:** cobran de la utilidad. Sus horas son **capacidad**, no costo.

🔑 **Cada cuenta paga a cada rubro el monto fijo de su plan.** Se firma una vez con cada
persona y no se renegocia por cliente. Ver `inherent/05-OPERACION.md` → «Lo que cuesta cada rol».

🔑 **La producción no se baja recortando horas** — eso es bajarle el precio a la persona por el
mismo trabajo. Si el monto no alcanza, **se cambia la mezcla** *(más derivados, contenido crudo
del cliente)* **o se cotiza extra.**

🔑 **Esto exige agentes que trabajen entre autónomos y dirigidos:** que levanten excepciones, no
preguntas. **Si el agente pregunta todo, no ahorra nada.**

🔑 **No se vende una capa suelta DISFRAZADA DE CRECIMIENTO.** Crecer exige algo íntegro.
**La línea Marketing vende atención y lo dice en la tarjeta** — el cliente sabe qué compró.
Lo prohibido es cobrar contenido o pauta prometiendo facturación.

🔑 **Los cuatro planes incluyen estrategia.** Cambia la profundidad, no la existencia.
**Pero solo Growth toca la OFERTA.** Marketing trabaja el **mensaje** —cómo se cuenta lo que ya
vende—; Growth trabaja **qué vende, en qué paquetes y a qué precio.**
**Confundirlos es regalar el trabajo caro dentro del plan barato.**

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
| Quiénes somos y qué nos diferencia | `inherent/01-IDENTIDAD.md` |
| El método — los 4 sistemas y las 2 divisiones | `inherent/02-METODO.md` |
| Los planes, precios y cómo se activa cada uno | `inherent/03-OFERTA.md` |
| Industrias, mercados o la red de mentores | `inherent/04-MERCADO.md` |
| Los roles, el pipeline o el calendario | `inherent/05-OPERACION.md` |
| 🔒 Costos, márgenes, capacidades MCP | `inherent/06-ECONOMIA.md` |
| Copy, tono o el brief de la web | `inherent/07-COMUNICACION.md` |
| Lo que falta decidir, construir o probar | `PENDIENTES.md` |

## Cómo arrancás una sesión

🧭 **Todo pedido de trabajo para un cliente entra por el router `/inherent`.** Imprime el
`ENRUTAMIENTO` y le pasa el pedido al orquestador del departamento. **El prompt es el pedido, no
el método** — el método es el `WORKFLOW.md`. Un hook (`.claude/hooks/enrutar.sh`) lo recuerda en
cada mensaje. **Atajo seguro:** escribir `/creatividad …`, `/marketing …`, etc. directo.

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
- **Roles, no nombres.** Los nombres de las personas están solo en la tabla de slots de `inherent/05-OPERACION.md`.
- **Evidencia o etiqueta** — en el trabajo de cliente. Sin fuente va como `[dice el cliente, sin verificar]`
  o `⚠️ SIN DATOS`. Nunca inventar.
- **Solo la info que entrega el usuario**, salvo que él habilite fuentes externas.
- **Gate humano: el CEO.** El agente propone, no cierra.
- **Nada destructivo sin autorización:** no publicar, no pautar, no enviar al cliente, no borrar.
- Formato de respuesta: headings, bullets, negritas. Lo accionable arriba. Sin párrafos largos.
