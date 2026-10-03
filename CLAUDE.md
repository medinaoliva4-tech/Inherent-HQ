# Inherent HQ — Agentes

Cada agente vive en `agents/<NN>-<área>/`, numerado en el orden en que corre el trabajo.
**Se opera directo desde Claude Code**, contra este repo — sin servidores ni hosting.

## Estructura

```
README.md                  ← qué es esto y qué tan profundo va un agente
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

agents/                    ← LOS AGENTES — uno por etapa del pipeline
├── README.md              ← el roster y el estado de cada uno
└── <NN>-<área>/           01-strategy · 01.2-branding · 02-growth · 03-marketing
    ├── README.md          04-creative · 05-production · 06-graphic-design
    └── brain/             07-video-editing · 08-community-management
        ├── WORKFLOW.md    09-posting · 10-ads-management · qa
        └── skills/<skill>/

clients/                   ← LOS CLIENTES
├── README.md              cómo se arma un folder de cliente
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

## Los agentes

**`agents/README.md` tiene el roster completo:** las doce etapas en orden, qué MCP le da cada
acción a cada agente, y **qué entrega cada uno según el plan contratado.**
**`inherent/05-OPERACION.md` tiene la cadena de entrega.**

🔑 **Cada agente tiene su `brain/WORKFLOW.md` con sus capas, sus gates y sus entregables.**
**El plan contratado es el techo de todos, no una sugerencia:** entregar de más rompe el margen,
entregar de menos rompe la promesa publicada.

📅 **El ciclo de contenido corre del día 1 al 20 de cada mes, con fechas fijas:** día 1 reunión ·
1-3 plan · 2-3 calendario y shot list · 3-6 brand guidelines · 4-5 coordinar · 6-10 producir ·
🔴 **11 último día para producir** · 12-15 montar · 16-19 cambios y programación ·
🔴 **20 presentación al cliente.** Ver `inherent/05-OPERACION.md` → «📅 El calendario del ciclo».

✅ **Once de doce construidos.** 🔴 **Falta `08-community-management`** — y sostiene dos líneas
de las tarjetas: *«tus comentarios y mensajes»* en Marketing Pro y *«comunidad»* en Compound.

🔑 **El QA no es un agente aparte:** cada departamento se auto-revisa antes de su gate, y
**②B Branding valida con `br-guardian`** antes de que nada se publique.

🗣️ **`agents/00-account/` es el único agente que le habla al cliente.** Vive en WhatsApp,
siempre encendido, **habla con la voz de Allan** y abre la sesión del agente que toca.
🔒 **Nunca dice costos, márgenes, ni nada de otro cliente, ni compromete precio, fecha o
alcance.** `inherent/06-ECONOMIA.md` no sale del repo.

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

⚠️ **Marketing Pro y Accelerate entregan las mismas 145 piezas, a propósito.**
El salto **no compra contenido — compra sistemas**: oferta, precio, conversión, canales y SOPs.
**Venderlo como «más piezas» es venderlo mal.**

⚠️ **La línea Marketing NO promete % de crecimiento.** El % no sale del contenido, sale de la
oferta y la conversión. **Prometerlo ahí es vender algo que no controlamos.**

🚀 **Somos un acelerador de marcas. Cada plan es un BOOST distinto, no más volumen del anterior.**
⚠️ **Accelerate NO es «que te conozcan más».** Ese comprador ya se siente estancado y **teme
romper lo que le funciona.**

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
| **Growth OS** | ⬜ | ⬜ | Los 3 ejecutando | Los 3 sistematizados |
| **Conversion OS** | ⬜ | ⬜ | ✅ | ✅ |
| **Operations OS** | ⬜ | ⬜ | 🟡 SOPs **de crecimiento** | ✅ SOPs **de empresa** |
| **Money OS** | ⬜ | ⬜ | ⬜ | ✅ |

🔑 **Un sistema entra cuando el negocio tiene con qué alimentarlo.** Conversion no entra en la
línea Marketing porque **antes no hay nada que perder**; Operations porque **no se puede documentar un proceso que
todavía no funcionó**; Money porque **sin transacciones el margen por línea es teoría.**
**Meterlo antes es cobrar por algo que no se puede usar.** Ver `inherent/02-METODO.md`.

**Seis capacidades bajo un techo:** 📣 Marketing · 🎨 Creative · 🎬 Production · 🏷️ Branding ·
🔧 Tech · 📊 Consulting. **Strategy debe conocer las seis** para decidir qué activar.

🎓 **La red de especialistas es el diferenciador que más pesa.**
**Por industria** *(externos — MentorCruise · GrowthMentor · MentorPass)*: gente que ya creció su
marca ahí y responde *«¿qué harías si esta fuera tu empresa?»*.
**Por área** *(nuestros)*: corporate structure, eventos, networking y PR, talent production,
talent marketing. **Red, no nómina.**
🔑 **Tres reglas lo hacen rentable:** **el mentor es exclusivo de la línea Growth** — meterlo en
Marketing rompe el margen del plan barato · **trimestral en Accelerate**, mensual en Compound ·
**la membresía se paga anual y es de Inherent** *(sirve a todos los clientes de esa industria,
−41% de costo)*.
Con eso los márgenes quedan en **77% · 77% · 72% · 75%**, fijos.
⚠️ **Arriba de $180/sesión NO se absorbe: va como add-on facturado al cliente.** Ver `inherent/04-MERCADO.md`.

## 🌐 La web es la promesa

🔴 **inherentglobal.com todavía muestra las tres tarjetas viejas** *(Ignite $800 · Accelerate
$1,200 · Compound $2,000)*. **El repo ya corre con las cuatro nuevas.**
**Hasta que la web se actualice, a quien llegue por la web se le respeta lo publicado.**

🔒 **Una vez publicadas, el repo no puede prometer menos, más ni distinto que las cuatro
tarjetas.** Si algo interno contradice una línea publicada, **gana la web** y se corrige el repo.
Si una línea publicada no tiene capacidad detrás, **se arregla la capacidad — no se borra la línea.**
**El texto exacto de las cuatro tarjetas y qué respalda cada línea están en `inherent/03-OFERTA.md`.**

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
dan **82-85%**; a precio de Miami, **89-91%**. Ver `inherent/04-MERCADO.md`.
⚠️ **La web se escribe para los tres mercados: precios en USD y sin «Guatemala» como alcance.** El de entrada
da **86 piezas a Q7,315 (Q85/pieza)** contra las ~16 de un paquete de Q3,000 **(Q188/pieza)**.

**El volumen nos separa del mercado. La profundidad separa las líneas entre sí.**
⚠️ **El Q/pieza es el arma de la línea Marketing y nada más.** En Growth el precio se justifica
por cuántos sistemas activamos — **usar Q/pieza para vender Accelerate lo abarata.**

**Dentro de Marketing el bundle sí es descuento** *(38% menos que comprar suelto)*, porque todo
lo que corre sobre agentes suma Q0 al costo variable.
**El salto a Growth NO es descuento — es acceso:** nada de lo que agrega se vende à la carte.
**El movimiento comercial es subir a los clientes que ya están, no sumar clientes nuevos.**

**Ganamos de hacerles dinero.** El fee base cubre la operación; **la utilidad de verdad sale del
performance fee — 10% de las ventas atribuidas, con costo marginal Q0.** Cada quetzal de fee es
utilidad pura: lleva Accelerate de 72% a 76% sin tocar el precio base.
⚠️ **Sin atribución limpia no hay fee — y por eso el fee no existe en la línea Marketing.**

**Los cuatro objetivos a la vez: costos bajos · valor enorme · precio justo · márgenes
altísimos.** Cierran **no bajando el precio, con el costo fijo.**

🔒 **El costo de cada plan es FIJO, por cuenta y por rubro — no es estimación.**

```
              PRODUCCIÓN  OPERADOR  HERRAM./IA  ESPECIALISTA  AUDIT.  BUFFER   COSTO    MARGEN
🔷 MARKETING     Q900       Q350      Q150         Q100         —     Q165    Q1,665    77%
🔷 MKT PRO      Q1,400      Q550      Q200         Q150         —     Q255    Q2,555    77%
🟨 ACCELERATE   Q1,900      Q900      Q300        Q1,000     Q1,200    —      Q5,300    72%
🟨 COMPOUND     Q2,500     Q1,400     Q500        Q2,000     Q1,800    —      Q8,200    75%
```

**El margen no cambia con el número de clientes.** Si una cuenta consume más, se cotiza extra o
sube de plan — **nunca se absorbe.** Ver `inherent/06-ECONOMIA.md` → «Los costos por plan — fijos».
🔑 **Allan no es un rubro:** su tiempo sale de la utilidad. Sus horas son **capacidad**, no costo.

⚠️ **Hay dos trabajos que ya deberían hacer agentes y todavía los hace gente: el QA y la
operación.** No mueven el margen — **mueven cuántas cuentas aguanta el equipo.**

**El equipo son dos personas y los agentes.** Allan dirige y es el gate; un operador corre los
agentes; producción solo graba; **los agentes hacen el resto.**

🔑 **Cada cuenta paga a cada rubro el monto fijo de su plan.** Se firma una vez con cada
persona y no se renegocia por cliente. Ver `inherent/05-OPERACION.md` → «El costo fijo de cada cuenta».

⚠️ **La producción no se baja recortando horas** — eso es bajarle el precio a la persona por el
mismo trabajo. Si el monto no alcanza, **se cambia la mezcla** *(más derivados, contenido crudo
del cliente)* **o se cotiza extra.**

⚠️ **Esto exige agentes que trabajen entre autónomos y dirigidos:** que levanten excepciones, no
preguntas. **Si el agente pregunta todo, no ahorra nada.**

⚠️ **No se vende una capa suelta DISFRAZADA DE CRECIMIENTO.** Crecer exige algo íntegro.
**La línea Marketing vende atención y lo dice en la tarjeta** — el cliente sabe qué compró.
Lo prohibido es cobrar contenido o pauta prometiendo facturación.

⚠️ **Los cuatro planes incluyen estrategia.** Cambia la profundidad, no la existencia.
⚠️ **Pero solo Growth toca la OFERTA.** Marketing trabaja el **mensaje** —cómo se cuenta lo que ya
vende—; Growth trabaja **qué vende, en qué paquetes y a qué precio.**
**Confundirlos es regalar el trabajo caro dentro del plan barato.**

🚀 **Publicar y atender comentarios se hace con Postpone** — MCP oficial, 12 plataformas,
carga `calendario.csv` directo y trae las mejores horas según la data de la cuenta.
🔴 **Su inbox NO cubre TikTok, que es canal principal.** 🟡 **Falta probarlo y ver su precio real.**

🕷️ **Todo lo que haya que scrapear se hace con Apify** — IG, TikTok, YouTube, LinkedIn, Google
Maps, Google Search y la biblioteca de anuncios de Facebook. **Plan Starter $19/mes, ~Q205
totales al mes con 5 clientes: menos de 1 punto de margen, dentro de Herramientas / IA.** 🟡 **Falta instalar el MCP y probar
los trece actores.** Ver `inherent/06-ECONOMIA.md` → «Apify».
🛡️ **Las tres garantías —contenido, alcance y ventas— están en `inherent/03-OFERTA.md`.**
**Ninguna se publica hasta que sus cuatro pendientes estén cerrados.**

🔌 **Un MCP declarado NO es un MCP conectado.** `inherent/06-ECONOMIA.md` → «El estado real de
conexión» tiene la prueba en vivo. **De las capacidades declaradas, 3 están probadas.**
🔴 **No generamos imagen ni video con IA.** Las 86-204 piezas salen de grabación, edición y
plantillas sobre material propio. **⑥A Diseño y ⑦ Video Editing no tienen MCP:** hoy todo el
volumen pasa por Pablo, y **es el primer techo de capacidad.**
⛔ **No se promete:** predicción de viralidad, fotos de producto sin sesión, doblaje ni voz sintética.

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
