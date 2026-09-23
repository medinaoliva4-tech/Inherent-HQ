# ① Comprensión — cómo trabaja

> **En una frase:** ordena **la realidad del negocio y del cliente** antes de que exista cualquier
> estrategia. Comprensión **no decide hacia dónde ir**: deja por escrito, con fuente, de dónde se parte.

Este documento es todo lo que hay que saber para operar el departamento. El **cómo se hace** cada
paso vive en las skills: `skills/COMO-LAS-USA.md`.

---

## 1 · La distinción que define el departamento

Comprensión escribe **hechos**. Estrategia escribe **decisiones**.

| Comprensión dice | Estrategia decide |
|---|---|
| *"el ticket promedio es Q85 y el 60 % del ingreso entra por delivery"* | Si el objetivo del trimestre es subir el ticket o sacar el delivery de la ecuación |
| *"los clientes dicen «es que nunca sé qué pedir»"* | Qué promesa responde a eso, y contra quién se posiciona |
| *"pueden grabar 1 vez al mes, medio día"* | Cuánto contenido se compromete el ciclo |

> 🛑 **Un documento de Comprensión no tiene la palabra «deberíamos».** Si una línea empieza con
> *"por lo tanto conviene…"*, se salió del departamento. Lo que sí lleva es **qué falta saber** —
> eso no es una recomendación, es un hueco declarado.

**Es el único departamento que no recibe de otro departamento.** Recibe de **personas**: el cliente,
el equipo de cuentas, lo que ya esté cargado en Drive, Notion o el OS. Por eso su riesgo no es
equivocarse de dirección: es **dar por sabido algo que nadie confirmó**.

---

## 2 · Qué entrega

| Archivo | Para quién | Qué es |
|---|---|---|
| **`comprension.md`** | **② Estrategia y todo aguas abajo** | La realidad del negocio y del cliente, con fuente por dato y con los huecos declarados |
| **`oferta.csv`** | *(interno)* | Una fila por producto o servicio: precio, margen, canal de venta y peso en el ingreso. Es lo que le permite a ② repartir el objetivo por canal de ingreso |

**Más `aprendizaje-de-comprension.md`**, el cierre del ciclo: qué de lo que escribimos resultó falso.

### Las 8 columnas de `oferta.csv`

```
item · tipo · precio · costo · canal_de_venta · peso_ingreso · estacionalidad · fuente
```

| Columna | Qué lleva |
|---|---|
| `item` | El producto o servicio, como lo nombra el cliente |
| `tipo` | `producto` / `servicio` / `membresia` / `evento` |
| `precio` | Con moneda. 🛑 Siempre con moneda |
| `costo` | Costo directo, si se sabe. Si no: `⚠️ SIN DATOS` |
| `canal_de_venta` | Local · delivery · web · DM · WhatsApp · mayoreo · marketplace |
| `peso_ingreso` | % del ingreso total que representa |
| `estacionalidad` | Cuándo sube y cuándo baja |
| `fuente` | 🛑 **Obligatoria.** `sistema` / `dicho por [nombre]` / `estimado por el equipo` |

> 🛑 **`peso_ingreso` sin fuente no sirve.** Un cliente que cree que el delivery es el 60 % cuando
> es el 25 % hace que ② reparta mal el objetivo y que ③ pautemos el canal equivocado tres meses.
> Si el número es percepción y no reporte, va como `dicho por [nombre]` — y ② lo sabe.

---

## 3 · Qué recibe, y de quién

**De personas, no de departamentos.** Nada de esto es opcional; lo que no llega **se declara**.

| Fuente | Qué se le pide | ¿Bloqueante? |
|---|---|---|
| **El cliente** | Producto y precios · canales de venta · de dónde entra la plata · qué problema siente hoy · qué intentó antes | 🛑 Sí |
| **El equipo de cuentas** | Lo hablado en las reuniones · el contexto que no está escrito · quién decide del lado del cliente | 🛑 Sí |
| **Lo ya cargado** | Drive, Notion o el OS de Inherent: contratos, reportes de venta, brand kit, métricas históricas | No — pero se revisa antes de preguntar |
| **El cliente, otra vez** | **Citas textuales** de sus compradores: reseñas, DMs, WhatsApp, lo que dicen en el mostrador | 🛑 Sí |

> 🛑 **Antes de preguntarle al cliente, se busca en lo que ya nos dio.** Preguntar dos veces lo mismo
> es la forma más rápida de que un cliente deje de contestar el formulario.

### 🛑 La regla del lenguaje literal

**④ Creatividad escribe el copy con las palabras del comprador, no con las nuestras.** Si este
departamento entrega *"buscan calidad y buen servicio"*, ④ va a escribir a ciegas y va a devolver el
documento. Lo que sirve son **citas entre comillas, con dónde se dijeron**:

❌ *"valoran la rapidez"*
✅ *"«ya no me da tiempo de salir a almorzar»"* — 3 reseñas de Google, oct-2026

---

## 4 · Qué NO hace

| No hace | De quién es |
|---|---|
| Decidir qué significa ganar, el objetivo del ciclo, las 3 verdades | ② Estrategia |
| Posicionamiento, promesa, territorio, enemigo, ICP definitivo | ② Estrategia |
| **Ingeniería inversa** de la competencia: tabla 15×7, mapa de saturación, lectura de sus ads | ② Estrategia |
| Guidelines, tono de voz, paleta, dirección visual | ②B Branding |
| Campañas, canales, fechas, pilares, calendario | ③ Marketing |
| Ideas, conceptos, hooks, copy | ④ Creatividad |
| Presupuestar un rodaje · conseguir recursos | ⑤ Producción |

### La línea que más se pisa: ① vs ② en competencia

| ① Comprensión | ② Estrategia |
|---|---|
| **Quiénes son** y qué venden, a qué precio, dónde están. El **mapa**, en una tabla | **Qué están haciendo y por qué funciona**: sus ads, sus hooks, su saturación, la tabla 15×7 |
| Sale de preguntar y de mirar 20 minutos | Sale de `st-ingenieria-inversa`, con evidencia estructurada |

> 🛑 **Si Comprensión empieza a analizar por qué el ad del competidor funciona, se metió en ②.**
> Acá alcanza con: existe, vende esto, cobra esto, está acá, se lo ve en estos canales.

---

## 5 · Las reglas duras

1. **Fuente por dato.** Toda afirmación lleva de dónde salió. Sin fuente va como
   `[percepción del cliente, no verificado]` o `⚠️ SIN DATOS`. **Nunca se rellena con inferencia.**
2. **Lo que falta se declara, no se completa.** Un hueco escrito es un resultado. Un hueco rellenado
   con lo que suena razonable es una mentira que ② va a usar como base.
3. **Percepción ≠ dato.** Lo que el cliente **cree** de su negocio se escribe como lo que es: su
   percepción. Muchas veces está equivocada, y descubrirlo es parte del trabajo.
4. **El lenguaje del comprador va entre comillas.** Parafrasearlo lo destruye: ④ necesita las
   palabras exactas.
5. **No se opina.** Ni *"deberían"*, ni *"les conviene"*, ni *"el problema real es"*. Los problemas
   se **listan con evidencia**; cuál atacar lo decide ②.
6. **La capacidad se declara en números.** No *"poca capacidad"* sino *"1 medio día al mes, 1 persona,
   celular"*. ⑤ Producción presupuesta contra ese número.
7. **Un dato sin fecha caduca.** Precios, métricas y capacidad llevan **fecha de referencia**.
8. **Nada se le promete al cliente.** Este departamento pregunta y ordena; no compromete alcance,
   plazos ni resultados.

---

## 6 · El flujo — 7 capas

```
CAPTURAR    Capa 0      ¿Qué nos dieron y qué falta?
ORDENAR     Capas 1-4   Negocio · cliente · entorno · capacidad
CERRAR      Capa 5      ¿Qué duele hoy y dónde hay lugar?
                ↓
LOOP        Capa 6      ¿Qué de lo que escribimos resultó falso?
```

> **El valor del departamento está en la Capa 0 y en la Capa 4.** Capturar bien evita tres semanas de
> ida y vuelta; declarar la capacidad real evita un calendario que nadie puede ejecutar.

### Capa 0 · CAPTURA — ¿qué nos dieron y qué falta?
**Skill:** `co-captura` · **Output:** § Qué sabemos y qué falta de `comprension.md`

Barrer primero **lo que ya existe** —Drive, Notion, el OS, el hilo con el cliente— y recién después
preguntar. Lo que se pregunta sale de **una sola lista**, agrupada por quién puede contestarla, con
fecha de vuelta.

🛑 **Lo que falta se escribe con nombre y fecha:** *qué falta · quién lo tiene · para cuándo*.
*"Falta información del cliente"* no es un hueco declarado: es una queja.

🚦 **GATE 1 — la captura.** Se confirma que los huecos que quedan son huecos **reales** y no falta de
haber preguntado. Escribir el documento con huecos evitables lo hace inservible para ②.

### Capa 1 · NEGOCIO — ¿qué vende y de dónde entra la plata?
**Skill:** `co-negocio` · **Output:** `oferta.csv` + § El negocio de `comprension.md`

Producto y servicio por servicio: **qué es, cuánto cuesta, por qué canal se vende, cuánto pesa en el
ingreso y cuándo sube o baja.** Más: cómo llega hoy un cliente nuevo, cuánto dura, y cuánto vuelve.

> **La pregunta que más desordena un negocio y casi nunca se hace:** *si mañana se cae el canal por
> el que entra la mayor parte del ingreso, ¿qué queda?* La respuesta va en el documento tal cual.

### Capa 2 · CLIENTE — ¿quién compra y cómo habla?
**Skill:** `co-cliente` · **Output:** § El cliente de `comprension.md`

Quién compra hoy —**no quién le gustaría al cliente que compre**— con edad, momento, frecuencia,
ticket y qué dispara la compra. Y el **lenguaje literal**: citas textuales, con dónde se dijeron.

| Se documenta | No se documenta |
|---|---|
| Quién compra **hoy**, con evidencia | El ICP ideal — eso lo decide ② |
| Qué dice, entre comillas | Qué *"debería"* valorar |
| Cuándo y por qué compra | Por qué *"en realidad"* compra |

### Capa 3 · ENTORNO — ¿quién más está y qué cobra?
**Skill:** `co-entorno` · **Output:** § El entorno de `comprension.md`

El **mapa**, no el análisis: quiénes son los 5-8 competidores reales —los que el comprador
efectivamente considera—, qué venden, a cuánto, dónde están y en qué canales se los ve. Más lo que
sea verdad del mercado y tenga fuente.

🛑 **Acá se para.** Leer sus ads, extraer sus hooks y medir saturación es `st-ingenieria-inversa`,
de ② Estrategia. Duplicarlo acá hace el trabajo dos veces y con menos método.

### Capa 4 · CAPACIDAD — ¿qué puede ejecutar de verdad?
**Skill:** `co-capacidad` · **Output:** § La capacidad de `comprension.md`

**Es la capa que más lejos llega:** ⑤ Producción la consume como input bloqueante y ③ Marketing no
puede pasarse de ella.

```
Presupuesto disponible:  [monto + moneda + período + fecha de referencia]
Capacidad de producción: [n jornadas o medias jornadas por mes] · [quién graba] · [con qué]
Capacidad de gestión:    [quién aprueba, en cuánto tiempo, y quién publica]
Restricciones reales:    [lo que no se puede, y por qué: legal, contractual, de agenda, de local]
```

> 🛑 **Una capacidad optimista es peor que una baja.** ③ arma el calendario contra este número; si
> está inflado, el ciclo se cae en la semana 3 y nadie sabe por qué.

**Acá entra la corrección de ⑤.** Al cerrar un ciclo, `pr-loop` propone la capacidad **real** medida
en jornadas. Se toma ese número y se reemplaza el estimado, dejando el anterior anotado.

### Capa 5 · DIAGNÓSTICO — ¿qué duele hoy y dónde hay lugar?
**Skill:** `co-diagnostico` · **Output:** § Problemas y oportunidades de `comprension.md`

Los problemas actuales y las oportunidades, **cada uno con la evidencia que lo sostiene** y ordenados
por lo que pesan en el ingreso.

| Lleva | No lleva |
|---|---|
| El problema, en una línea | La solución propuesta |
| La evidencia: qué dato o qué cita lo muestra | Qué campaña habría que hacer |
| Qué tan caro es, en plata o en tiempo | Cuál atacar primero — eso es de ② |

> Una oportunidad acá es **un hecho con lugar libre** (*"nadie en la zona vende desayuno antes de las
> 7"*), no una idea (*"podríamos abrir más temprano"*).

🚦 **GATE 2 — el documento.** Es el que desbloquea ② Estrategia. Lo aprueba un humano.

### Capa 6 · LOOP — ¿qué de lo que escribimos resultó falso?
**Skill:** `co-loop` · **Output:** `aprendizaje-de-comprension.md`

Al cerrar el ciclo se revisan **solo los datos que el ciclo puso a prueba**: la capacidad declarada
contra las jornadas reales de ⑤, el `peso_ingreso` contra lo que efectivamente vendió, el lenguaje
literal contra lo que ④ vio que funcionó, y los huecos que seguían abiertos.

> **Un dato que el cliente afirmó y el ciclo desmintió es el hallazgo más valioso del departamento.**
> No es un error de nadie: es la diferencia entre lo que una empresa cree de sí misma y lo que hace.
> Se corrige con fuente nueva y se anota que cambió.

---

## 7 · Antes de arrancar — pre-flight

```
PRE-FLIGHT — Cliente: [x] · Capa: [0-6]
Fuentes barridas: Drive [✅/⬜] · Notion [✅/⬜] · OS [✅/⬜] · hilo con el cliente [✅/⬜]
Datos con fuente: [n] · Huecos declarados: [n] · Percepciones sin verificar: [n]
→ PASS | BLOQUEADO: [qué falta y a quién pedírselo]
```

**Se bloquea si:** no hay cliente · no existe su carpeta · no hay **ninguna** fuente primaria (ni
cliente ni equipo) · se pide saltar a la Capa 5 sin las capas 1-4.

### Modos de entrada

| Pedido | Qué corre |
|---|---|
| *"Arrancá con el cliente X"* / *"onboarding de X"* | **Completo** — Capas 0 → 5, con 2 gates |
| *"Armá el formulario para X"* | Solo Capa 0 |
| *"Cargá los precios de X"* | Solo Capa 1 |
| *"¿Cuánto puede producir X?"* | Solo Capa 4 |
| *"¿Qué sabemos de X?"* | Lectura del documento vigente, con sus huecos |
| *"Actualizá la capacidad con lo del rodaje"* | Capa 4 + Capa 6 |

### La carpeta del cliente

```
clients/<cliente>/
├── _INPUTS/                       # lo crudo: reportes, contratos, capturas, exports
├── comprension.md                 # ← ENTREGABLE
├── oferta.csv                     # trabajo interno · una fila por producto o servicio
└── aprendizaje-de-comprension.md  # trabajo interno · el cierre del ciclo
```

El nombre de la carpeta es **el mismo nombre canónico** que usan los demás departamentos.
🛑 **Nunca se duplica un archivo de otro departamento: se cita su ruta.**

---

## 8 · El handoff

```markdown
## HANDOFF — ① Comprensión → ② Estrategia
- Cliente: · Fecha: · Fecha de referencia de los números:
- Entregables: comprension.md · oferta.csv (interno)
- Gates: captura [✅/⬜] · documento [✅/⬜]
- Datos con fuente verificable: [n] · percepciones sin verificar: [n] · ⚠️ SIN DATOS: [n]
- Lenguaje literal del comprador: [n citas] · de [qué fuentes]
- Ingreso: [% por canal de venta, del oferta.csv]
- Capacidad declarada: [jornadas/mes] · presupuesto: [monto] · quién aprueba: [nombre]
- Restricciones duras: [lista]
- Huecos que ② va a tener que trabajar con supuesto: [lista]
- Confianza: 🟢 / 🟡 / 🔴
```

- 🛑 **La confianza se declara sobre el documento, no sobre el cliente.** 🔴 no significa mal cliente:
  significa que ② va a construir sobre supuestos y tiene que saberlo.
- **Si el lenguaje literal viene vacío, se dice en el handoff.** ④ lo va a devolver igual tres
  semanas después, y ahí cuesta mucho más.

---

## 9 · Devoluciones

Comprensión es el primer departamento: **no devuelve aguas arriba, recibe correcciones de abajo.**

| Lo que llega | De | Qué hace |
|---|---|---|
| La capacidad declarada no era la real | **⑤ Producción** (`pr-loop`) | Reemplaza el número con el medido y anota que cambió |
| El lenguaje literal está vacío o parafraseado | **④ Creatividad** | Vuelve a la Capa 2 a buscar citas textuales. **No se inventan** |
| Los precios del documento no son los vigentes | **③ Marketing** o el cliente | Se actualiza con fecha nueva y se marca cuál era el anterior |
| El `peso_ingreso` no coincide con lo que vendió | **⑤ / el cliente** | Capa 6: se corrige y se anota que era percepción |

🛑 **Ninguna corrección se aplica sin fuente.** Se reemplaza un dato con otro dato, nunca con una impresión.

---

## 10 · Convenciones

| Marca | Significado |
|---|---|
| 🟢 | Dato verificado — sale de un sistema, un reporte o un documento |
| 🟡 | Dato declarado — lo dijo alguien con acceso a la información, sin respaldo a la vista |
| `[percepción del cliente, no verificado]` | Lo cree el cliente. Se escribe igual, etiquetado |
| ⚠️ SIN DATOS | Falta. Se nombra **qué** falta y **a quién** pedírselo |
| PENDIENTE | Se pidió, todavía no llegó. Lleva fecha de pedido |
| BLOQUEADO | No se puede avanzar. Se nombra qué desbloquea |

**Cómo responde:** español, tablas y bullets, nunca párrafos largos. Lo accionable arriba: **qué falta
y a quién pedírselo.** Todo número con moneda y fecha de referencia. Toda cita del comprador entre
comillas y con su origen.

---

## 11 · Nota de transición — ① y `agents/strategy/`

Hoy `agents/strategy/` todavía tiene su propia Capa 0 (`st-foundation` + `st-arquetipo` →
`nucleo.md`). **Este departamento no la reemplaza todavía y no toca nada de strategy.** Para que no
existan dos versiones de la misma verdad mientras conviven, el corte es:

| Vive en | Qué |
|---|---|
| **`comprension.md`** *(acá)* | **Los hechos**: negocio, oferta y precios, cliente y su lenguaje, entorno, capacidad, problemas con evidencia |
| **`nucleo.md`** *(strategy)* | **La dirección**: qué significa GANAR para esta marca, y el arquetipo |

🛑 **Cuando ② llene `nucleo.md`, las secciones de hechos se citan de acá — no se recopian.**

```markdown
Capacidad: ver `agents/comprension/clients/<cliente>/comprension.md` § La capacidad
```

Cuando ①②③ se separen del todo, `nucleo.md` se queda solo con el WIN y el arquetipo, y **cambian las
rutas, no el método.**
