---
name: pr-recursos
description: >
  Capa 3 de ⑤ Producción — de dónde sale cada cosa, quién la consigue y para cuándo. Convierte el
  inventario del desglose en compromisos con nombre y fecha: asigna el origen del vocabulario
  cerrado (propio, prestado, alquilado, comprado, a-producir), un responsable con nombre, una fecha
  de confirmación y el semáforo 🟢🟡🔴, y escribe el plan B de toda escena con dependencia externa.
  Trae el chequeo de viabilidad de locaciones, las cesiones de imagen y la dirección de talento, y
  la derivación del equipo desde el encuadre. Úsala cuando pidan "qué tenemos que conseguir", "quién
  consigue qué", "¿está confirmada la locación?", "qué pasa si llueve", "qué equipo hace falta",
  "qué permisos necesitamos", "¿quién firma la cesión?", "cotizá el alquiler". Requiere las jornadas
  de Capa 2 armadas: el margen de cada recurso se cuenta hacia atrás desde su jornada.
---

# Capa 3 · Recursos — de dónde sale cada cosa y quién la consigue

| | |
|---|---|
| **Consume** | `plan-de-produccion.csv` con la columna `jornada` ya cargada por `pr-jornadas` · la sección de cada jornada de `plan-de-rodaje.md` (fechas y orden de tiro) · las guidelines y el banco de assets de ②B Branding · las cotizaciones del `_INPUTS/` del cliente |
| **Produce** | Las columnas **`locacion`**, **`talento`**, **`recursos`**, **`equipo`** y **`riesgo`** de `plan-de-produccion.csv` · las secciones **§ Lo que hay que conseguir** y **§ Permisos y autorizaciones** de `plan-de-rodaje.md`, y los **Riesgos del día** de cada jornada |

Contexto del departamento: `agents/production/WORKFLOW.md`. Plantilla del entregable:
`agents/production/entregables/plan-de-rodaje.md`.

**Qué es:** convertir una lista de cosas en **compromisos con nombre y fecha**.
**Qué no es:** no es cotizar el ciclo (eso es Capa 4) y **no es comprometer nada**: 🛑 ninguna
reserva, convocatoria ni compra antes del **GATE 1**. Un *"aparté la fecha por las dudas"* ya es un
compromiso.

## Cómo se llenan las columnas

| Columna | Qué lleva |
|---|---|
| `locacion` | El **lugar concreto**, no el tipo de lugar heredado de ④ |
| `talento` | **Quién específicamente**, no *"una persona joven"* |
| `recursos` | **Producto + props + vestuario + arte/ambientación en una sola celda**, separados por `;` |
| `equipo` | Cámara, óptica, soporte, luz, audio — **derivado del `encuadre`** |
| `riesgo` | Solo el semáforo `🟢`/`🟡`/`🔴`. **El plan B va en `plan-de-rodaje.md` § Riesgos del día** |

❌ `recursos: ambientación de oficina` ✅ `recursos: producto x3; taza; libreta; camisa lisa celeste; planta chica`

🛑 **Origen, responsable, fecha de confirmación, permisos y plan B no son columnas del CSV: viven en
`plan-de-rodaje.md`.** El CSV dice **qué hay y cómo está**; `plan-de-rodaje.md` dice **quién lo consigue y qué pasa si
falla**.

## 🛑 El vocabulario cerrado de origen — 5 valores, ninguno más

| Origen | Qué implica | Riesgo típico | Margen mínimo |
|---|---|---|---|
| `propio` | Ya lo tenemos: costo 0, pero **ocupa nuestra agenda** | Se asume disponible y ese día está ocupado o prestado | **2 días** |
| `prestado` | Alguien nos lo da sin cobrar: **favor, no contrato** | **Se cae sin compromiso escrito**, y a último momento | **5 días** |
| `alquilado` | Hay proveedor, hay precio y hay **franja horaria** | Reserva sin confirmar · **recargo por exceso de franja, por hora iniciada** | **5 días** |
| `comprado` | Entra al presupuesto y no vuelve | **El tiempo de entrega es lo que más se subestima** | **10 días** |
| `a-producir` | Hay que **fabricarlo**: cartelería, torta, prop a medida, gráfica impresa | 🛑 **El que más se subestima: siempre lleva más de lo previsto** y no tiene plan B rápido | **15 días** |

## 🛑 La regla del responsable

**Ningún recurso queda "por conseguir".** Cada ítem de la sección **§ Lo que hay que conseguir** lleva las cinco
cosas, sin excepción:

```
qué · origen · responsable (NOMBRE) · fecha de confirmación · estado 🟢/🟡/🔴
```

| Estado | Significa |
|---|---|
| 🟢 | **Confirmado** — asegurado, con responsable y fecha |
| 🟡 | **Gestionando** — pedido, sin confirmación |
| 🔴 | **En riesgo** — sin alternativa identificada |

🛑 **Un recurso 🟡 a menos de 48 h de su jornada pasa automáticamente a 🔴 y activa su plan B.** No
se espera a ver si aparece: a 48 h ya no hay margen para conseguir un reemplazo.

❌ *"La locación está casi confirmada"* ✅ `Cocina del local · prestado · Marina G. · confirmar antes del 04-oct · 🟡`
❌ *"El equipo lo consigue producción"* — **rol genérico, no responsable** ✅ `Gimbal · alquilado · Diego R. · 02-oct · 🟢`

## Locaciones — el eje 1 y el costo fijo más grande

| Origen | Costo típico | Riesgo principal |
|---|---|---|
| **Espacio del cliente** | 0 | Se asume disponible y el día está ocupado |
| **Espacio propio / estudio** | Bajo | **Se ve siempre igual entre ciclos** |
| **Casa o local prestado** | 0-bajo | Se cae sin compromiso escrito |
| **Locación alquilada** | Alto | Franja rígida, **recargo por exceso** |
| **Vía pública** | Bajo + permiso | Ruido, clima, gente, **permiso municipal (días a semanas)** |

**El chequeo de viabilidad — antes de confirmar:**

- [ ] **Se visitó**, o hay **fotos actuales del espacio real**, no de referencia
- [ ] Franja horaria confirmada **por escrito**, con nombre de quien autoriza
- [ ] Luz natural verificada **a la hora del rodaje**, no a otra hora
- [ ] Tomas de electricidad suficientes y accesibles
- [ ] Ruido evaluado **en el horario del rodaje** (tráfico, obra, aire, vecinos)
- [ ] Acceso del equipo: ascensor, escaleras, cuántos viajes, estacionamiento
- [ ] Baño, y espacio para vestuario y espera del talento
- [ ] Qué se puede mover y qué no
- [ ] Plan B identificado si es exterior o si el permiso está 🟡

🛑 **Una locación sin visita ni fotos actuales es 🔴**, por más que *"la conozcamos"*.

- La locación se elige para **cumplir el `tipo_de_lugar` que pidió ④**, no para lucirse: una cocina
  de diseño espectacular puede contradecir el mood pedido.
- **El permiso se gestiona primero.** Es lo único que puede anular la jornada entera el día antes.
- **Exterior = plan B obligatorio**: interior alternativo o **fecha de reemplazo reservada**.
- Si la locación cambia después del call sheet, **se reemite el call sheet**. No se avisa por chat.

## Talento — el eje 2: se paga por jornada, no por toma

| Tipo | Cesión | Costo | Reemplazable |
|---|---|---|---|
| **Rostro protagonista** | Obligatoria | Alto | No — cambia la pieza |
| **Rostro secundario / fondo** | Obligatoria (**toda persona identificable**) | Bajo | Sí |
| **Manos y detalle** | Recomendable | Muy bajo | Sí, casi siempre |
| **Voz** | Obligatoria si es identificable | Bajo | Sí, y 🛑 **se puede grabar otro día** |

**Los 5 orígenes:** cliente o su equipo (credibilidad, costo 0 · riesgo: comodidad frente a cámara)
· equipo propio (rápido y gratis · riesgo: **la marca termina con la misma cara en todo**) · amateur
convocado (naturalidad · **+50 % de tiempo de dirección**) · profesional (rapidez en set · costo y
agenda) · creador o influencer (trae audiencia · **trae condiciones de uso y vigencia**).

**Lo que se firma, siempre:**

| Documento | Qué cubre | Cuándo |
|---|---|---|
| **Cesión de imagen** | Uso, **canales, territorio y vigencia** | Antes de grabar, **nunca después** |
| **Acuerdo de honorarios** | Monto, jornadas incluidas, qué pasa si se extiende | Antes de convocar |
| **Uso en pauta** | Si el material va a Ads, **se declara aparte** | Antes de grabar |

🛑 **Sin cesión firmada no se graba a esa persona** —incluidas las de fondo identificables—. Es lo
único que vuelve a morder meses después, con la pieza ya pauteada.

**La `emocion` heredada de ④ es la instrucción de dirección.** No el concepto, no el hook: la
emoción. Se dirige con **situación**, nunca con adjetivos de resultado.

❌ *"Hacelo más natural"*, *"con más energía"* ✅ *"Contalo como si acabaras de darte cuenta, no como si lo supieras hace años"*

**Convocatoria:** llamado **≥ 30 min antes** del primer tiro de esa persona, **escalonado por
bloque**. Nunca se convoca a alguien para *"estar disponible todo el día"* sin acordarlo y pagarlo.
**Plan B con nombre:** un talento sin reemplazo identificado es 🔴.

## Equipo — se deriva del encuadre, no se elige por gusto

| Encuadre pedido | Óptica | Soporte | Luz | Audio |
|---|---|---|---|---|
| **CU frontal fijo** (hablante) | 50-85 mm | Trípode | Key suave lateral + rebote | Solapa o boom |
| **Wide fijo** (contexto) | 24-35 mm | Trípode | Ambiente + relleno | Ambiente |
| **Inserto / detalle** | Macro o 50 mm | Trípode + columna | Rasante, controlada | Sin audio |
| **Cámara en mano** | 24-35 mm | Estabilizador o mano | Ambiente | Solapa |
| **Movimiento** (gimbal, slider) | 24-35 mm | Gimbal o slider | Ambiente controlado | Sin audio directo |
| **Cenital** (mesa, producto) | 35-50 mm | Brazo o columna cenital | Difusa pareja | Sin audio |
| **Pantalla partida / captura** | N/A | N/A | N/A | N/A |

🛑 **Si el encuadre pide algo que no tenemos, se alquila o se devuelve a ④ con alternativa** — el
encuadre no se cambia.

**Audio — lo que más se descubre tarde:** si alguien habla en cuadro va **solapa y respaldo de
ambiente**; la voz en off **puede grabarse otro día, más barato**; y toda locación lleva **30 s de
ambiente**, aunque ninguna escena tenga voz. 🛑 **El audio se verifica escuchándolo con auriculares
en set**, nunca porque el medidor se mueve: un audio roto no se arregla en post, se vuelve a grabar.

**Siempre en la lista:** batería y tarjeta de respaldo · **monitor externo** en toda escena con
talento —sin él el foco se descubre en la edición— · y **se prueba la primera escena completa antes
de convocar al talento**: 15 min que salvan la jornada.

## Riesgos y planes B — § Riesgos del día de `plan-de-rodaje.md`

Toda escena con dependencia externa lleva su plan B **escrito antes de la jornada**. 🛑 **Un riesgo
sin plan B es un 🔴.**

| Dependencia | Plan B mínimo exigible |
|---|---|
| **Clima** (exterior) | Locación interior alternativa, o **fecha de reemplazo reservada** |
| **Talento** | **Segundo nombre confirmado**, o reescritura a manos/detalle **propuesta a ④** |
| **Permiso** | Locación alternativa, o versión **sin el fondo identificable** |
| **Producto** | **Unidad de respaldo**, o la escena se mueve a la jornada siguiente |

## Dónde se buscan los recursos — herramientas y permisos

| Para qué | Herramienta típica | Permiso |
|---|---|---|
| Cruzar el **banco de assets** de ②B Branding | Drive (lectura) | `ask` |
| Buscar **referencias de locación** | Búsqueda web / Maps | `ask` |
| **Cotizar** alquiler de equipo o locación | Búsqueda web | `ask` |
| **Clima previsto** para exteriores | Búsqueda web | `ask` |
| Armar el Sheet de seguimiento | Google Sheets | `ask` — **solo post-GATE 1** |
| Agendar jornadas | Calendario | `ask` — **solo post-GATE 2** |
| Subir material | Drive (escritura) | `ask` — **solo post-GATE 3** |

**Qué NO se usa desde Producción:** Figma (es de ⑥A) · editores de video y color (⑥B) ·
**generadores de imagen o video** —Producción consigue material **real**; si la pieza pide media
generada, la genera ⑥A— · Ad Library y Meta Ads (⑧B y ④) · publicación y programación (⑦).

**Reglas de permiso:** nada se escribe afuera antes de su gate · **nada destructivo**: el material no
se borra, se marca · **ninguna reserva ni compromiso antes del GATE 1** · toda cotización se registra
con **moneda y fecha** —un número sin fecha caduca y no sirve para la Capa 7— · los datos de contacto
de talento y proveedores **no se pegan en herramientas externas** sin necesidad operativa.

## QA — Capa 3

- [ ] Cada ítem tiene **origen del vocabulario cerrado de 5 valores**: `propio` / `prestado` / `alquilado` / `comprado` / `a-producir`
- [ ] **Cada ítem tiene responsable con NOMBRE**, no rol genérico
- [ ] Cada ítem tiene **fecha de confirmación**, con más margen para `comprado` (10 d) y `a-producir` (15 d)
- [ ] Semáforo 🟢/🟡/🔴 aplicado a **todo** ítem, y la columna `riesgo` del CSV cargada en toda fila
- [ ] 🛑 Todo 🟡 a menos de **48 h** de su jornada está marcado **🔴 y con su plan B activado**
- [ ] Toda escena con dependencia externa (**clima · talento · permiso · producto**) tiene su **plan B escrito** en `plan-de-rodaje.md` § Riesgos del día
- [ ] Las locaciones pasaron el **chequeo de viabilidad**: visita o fotos actuales, franja por escrito con nombre, luz verificada **a la hora del rodaje**, ruido, acceso, electricidad
- [ ] Toda locación **exterior** tiene plan B con **interior alternativo o fecha reservada**
- [ ] Toda persona identificable tiene **cesión de imagen gestionada**, con **canales, territorio y vigencia**
- [ ] Si hay **uso en pauta**, está **declarado aparte** en la cesión
- [ ] Los **permisos están gestionados primero**, no dejados para el final, y listados en `plan-de-rodaje.md` § Lo que hay que conseguir
- [ ] `locacion` es un **lugar concreto** y `talento` es **quién específicamente**
- [ ] La celda `recursos` fusiona **producto; props; vestuario; arte** separados por `;`, ítem por ítem — *"ambientación de oficina"* no es un ítem
- [ ] El `equipo` se **derivó del `encuadre`**, no se eligió por gusto
- [ ] 🛑 **Nada se comprometió antes del GATE 1**: ni reserva, ni convocatoria, ni compra
- [ ] Toda cotización quedó registrada con **moneda y fecha**

**Handoff →** `pr-presupuesto` (Capa 4). Un recurso sin origen no se puede costear, y un recurso sin
responsable ni fecha **no está conseguido**, por más que esté escrito.
