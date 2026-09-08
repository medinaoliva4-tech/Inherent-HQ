# MÉTODO INHERENT — Estrategia de Posicionamiento y Crecimiento

> **Definición operativa de estrategia**
> Una estrategia tiene cuatro partes y sin las cuatro no es una estrategia:
> **Objetivo** (la meta clara) · **Diagnóstico** (el análisis realista de la situación y el entorno)
> · **Decisiones y renuncias** (qué caminos seguimos y qué descartamos) · **Recursos** (herramientas,
> tiempo y personal asignados).
>
> Todo lo que sigue existe para producir esas cuatro cosas y bajarlas a comunicación.

> **Nota de alcance:** este método es exactamente el proceso de Rodrigo, documentado para que el
> agente lo ejecute igual. No agrega pasos que él no pidió. Si en algún momento parece que falta
> algo, se pregunta — no se improvisa ni se agrega "porque suena mejor".

---

## El mapa completo — 5 capas

```
CAPA 0   CONTEXTO           ¿Para quién trabajamos y con qué números reales?
CAPA 1   EVIDENCIA          ¿Cómo se compra, quién ya tiene la demanda, cómo se comporta la audiencia?
CAPA 2   ANÁLISIS           ¿Cómo puede ganar esta empresa? (las 3 Verdades)
CAPA 3   OBJETIVO           ¿Qué meta agresiva movemos este ciclo, y qué volumen/conversión exige?
CAPA 4   ESTRATEGIA         ¿Cómo se logra, paso a paso, y qué historia lo comunica?
```

```
CONTEXTO → EVIDENCIA → ANÁLISIS → OBJETIVO (+ ingeniería inversa financiera)
    → ESTRATEGIA (pasos + promesa/posicionamiento/ICP + historia)
```

> **Dónde termina Strategy.** Strategy llega hasta la dirección general y los pasos con fecha
> (Capa 4). El **calendario de contenido** (distribución owned/paid/earned/borrowed, cadencia por
> canal, balance marca/activación) es una etapa/departamento distinto — *Contenido/Calendar*, según
> la cascada de operación de Inherent — y no se construye acá. Strategy entrega dirección; Calendar
> le da cuerpo específico. No se hace ese trabajo por adelantado.

---

## Por qué cada dato que se junta — de dónde a dónde

> La regla: **ningún dato se recolecta "porque sí".** Si no podés señalar en qué paso posterior se
> usa, no se junta.

| Herramienta / dato | Se junta en | Se usa en |
|---|---|---|
| Unit economics (ticket, margen) | Capa 0 | Capa 3.2 — calcula cuánto tiene que generar el cliente ideal |
| CEPs + volumen de demanda | Capa 1.2 | Capa 3.2 — valida si hay volumen suficiente para la meta · Capa 4.2 — la promesa ataca el CEP priorizado |
| Audience behavior (vía competidor) | Capa 1.3 | Capa 4.2 — la promesa se escribe en el lenguaje real que consume esa audiencia · Capa 4.3 — informa al héroe de la historia |
| Awareness stages | Capa 1.4 | Capa 4.1 — decide si los pasos empiezan en descubrimiento o en cierre |
| MUST BE TRUE / UNFAIR / GO GET | Capa 2 | Capa 3.1 — de ahí sale el objetivo del ciclo |
| Objetivo + ingeniería inversa financiera | Capa 3 | Capa 4.1 — dimensiona cuántos pasos y de qué tamaño hacen falta |

---

# CAPA 0 — CONTEXTO
### ¿Para quién trabajamos, y con qué restricciones reales?

No decide nada todavía. Reúne lo que existe, con instrumentos concretos — nunca se adivina lo que
se puede preguntar o medir.

**Qué se levanta y con qué instrumento**

| Qué | Instrumento | Vive en |
|---|---|---|
| Visión, propósito, tono de marca, audiencia actual | **Google Form** al cliente | `templates/formulario-cliente.md` (preguntas) |
| Producto/oferta y precio | Google Form + conversación | `templates/formulario-cliente.md` |
| Unit economics: ticket, margen, capacidad de entrega, punto de equilibrio | **Excel/CSV** — si es un menú, se pide el menú y se costea; si es un curso o producto, se costea igual | `templates/unit-economics.csv` |
| Restricciones reales (presupuesto, equipo, aprobación, legal) | Google Form | `templates/formulario-cliente.md` |

**Economía unitaria — como restricción, no como estrategia**
Strategy **no diseña** el money model (eso es de Growth). Pero sin ticket, margen, capacidad de
entrega y punto de equilibrio no se puede saber si una estrategia es viable, ni calcular en la
Capa 3 cuánto volumen hace falta. Si faltan: `⚠️ SIN DATOS` + **viabilidad no verificada**. Nunca
se estiman.

> **Consecuencia directa:** si la capacidad de entrega ya está al tope, la estrategia no es generar
> más demanda — es filtrar mejor o subir el precio.

**Regla dura**
> La visión del cliente se respeta, pero **no se toma como verdad de mercado**. Si el cliente dice
> "nuestra ventaja es el servicio", se registra. La Capa 1 comprueba si eso es real.

**Cierre obligatorio de esta capa: clasificar el arquetipo.**
Un restaurante no es una marca personal. Antes de mirar afuera hay que saber *qué tipo de empresa
es esta*, porque cambia qué canales importan y qué motor de demanda predomina.
→ Ver `archetypes/README.md` (8 ejes → 11 arquetipos).

**Output:** `nucleo.md` + arquetipo asignado.

---

# CAPA 1 — EVIDENCIA
### ¿Cómo se compra, quién ya tiene la demanda, cómo se comporta la audiencia?

Acá no se interpreta ni se recomienda: se **observa lo que ya existe**. Liviana a propósito — lo
mínimo para decidir con criterio en la Capa 2, no un archivo de investigación de mercado.

### 1.1 — Cómo se compra y cómo se descubre
Mirar directamente los canales donde está el cliente: Instagram, Google, Facebook, LinkedIn — el que
aplique según el arquetipo. Se registra: qué canal usa la categoría para descubrir, qué canal usa
para decidir, y qué hace la competencia ahí. Sin herramienta elaborada: se entra y se mira.

### 1.2 — Demanda por crear
Ya sabemos (por Capa 0) cuánto tiene que generar el cliente ideal. Acá se busca **evidencia
tangible** de esa demanda, no una sugerencia inventada por chat:

- Herramienta de demanda: `AdWhispr` (research_keywords, find_competitors) + `Eden` (search_social_content)
  para dimensionar volumen de búsqueda/conversación real por CEP.
- **Para qué sirve este número:** en la Capa 3 se calcula cuánta gente hace falta alcanzar para
  llegar a la meta. Acá se registra si ese volumen **existe** en el CEP elegido — si no alcanza,
  el objetivo de la Capa 3 está mal dimensionado antes de gastar un peso en producir contenido.
- ⏳ **"MetaSpark" = Muse Spark (Meta, vía OpenRouter) — identificado, no conectado todavía.** Es
  un modelo de lenguaje agéntico, no una fuente de datos: no scrapea por sí mismo. Su rol real
  sería motorizar un agente de Comunicación ("Buzz") al que se le dan herramientas de datos — no
  reemplaza a AdWhispr/Eden. Mientras no se conecte, la demanda se dimensiona con AdWhispr + Eden.
- **Category Entry Points (CEPs):** los momentos que llevan a alguien a considerar la compra —
  *"algo rápido para cenar sin cocinar"*, *"facturar sin contador"*. Se listan los que aparecen de
  verdad en el canal, no se inventan.

### 1.3 — Audience behavior (vía competidor)
Técnica: tomar un competidor de referencia y mirar **a sus seguidores** — qué contenido consumen,
con qué publicaciones interactúan de verdad (no solo like, sino comentario/guardado/compra), y
reconstruir el funnel real: quién solo mira, quién interactúa, quién compra o reserva.

### 1.4 — Estados de consciencia (awareness stages)
De lo anterior, estimar dónde está la mayoría del mercado respecto al **problema** (no respecto a
la marca): no sabe que tiene el problema · sabe el problema, no la solución · conoce la solución, no
la marca · nos conoce, no compró · convencido, no compró todavía. Esto separa a quién habla el
contenido de descubrimiento del contenido de cierre.

**Todo esto se registra en** `templates/demanda.csv` (CEPs, audience behavior, awareness stage).

**Regla dura**
> 🛑 Si un output de esta capa dice "por lo tanto la marca debería…", se salió de su rol. Termina
> en observación, no en recomendación.

**Output:** `ingenieria-inversa.md`

---

# CAPA 2 — ANÁLISIS
### ¿Cómo puede ganar esta empresa? — Las 3 Verdades

Con el contexto y la evidencia, se resume en tres preguntas. Esto es lo que se pone en limpio de
todo lo anterior — no tiene que ser extenso, tiene que ser **usable**.

### VERDAD 01 — ¿QUÉ TIENE QUE SER VERDAD PARA SER #1?
*(WHAT MUST BE TRUE)*
Puede salir una lista larga (5, 10 condiciones). No hay que resolverlas todas — eso se decide en la
Capa 3. Ejemplos: *tener X cantidad de seguidores · publicar en X lugar · tener una colaboración con
X · ser considerados en X momento.*

### VERDAD 02 — ¿QUÉ YA TENEMOS QUE NADIE PUEDE COPIAR O IMITAR?
*(WHAT IS UNFAIR)*
No es "¿en qué somos distintos?" — es lo que ya se tiene y **costó conseguir**: relaciones, acceso,
historia, comunidad, ubicación, data, capacidad de ejecución. Sin fuente: `[percepción del cliente,
no verificado]`.

### VERDAD 03 — ¿QUÉ PODEMOS IR A BUSCAR O PROVOCAR?
*(WHAT CAN WE GO GET)*
Ahora que sabemos qué falta y qué ventaja tenemos: qué podemos provocar deliberadamente para
mejorar — una alianza, un evento, entrar a un medio, una colaboración. Son **candidatos**, no
decisiones todavía.

**Output:** `posicionamiento.md` (sección 1)

---

# CAPA 3 — OBJETIVO
### ¿Qué movemos este ciclo, y cuánto volumen exige?

### 3.1 — Objetivo agresivo del ciclo
De las condiciones (MUST BE TRUE) de la Capa 2, elegir **cuáles se atacan este mes/ciclo** — no
todas. Y ser agresivo: no elegir lo más fácil o lo más obvio.

### 3.2 — Ingeniería inversa financiera
El objetivo se baja a números concretos, siempre que haya una meta de facturación o volumen
involucrada:

```
Meta de facturación / volumen  →  ÷ ticket promedio (Capa 0)  →  clientes necesarios
clientes necesarios  →  ÷ tasa de conversión estimada  →  volumen de personas/alcance necesario
```

Ejemplo: meta $100.000/mes · ticket promedio $100 → 1.000 clientes necesarios. Con una conversión
del 1%, hace falta llegar a 100.000 personas. **Esto es lo que dimensiona los pasos de la Capa 4**
— no se arranca a producir contenido sin saber qué volumen hace falta.

**Chequeo obligatorio contra la Capa 1.2:** el volumen de demanda dimensionado ahí, ¿alcanza el
volumen que este cálculo pide? Si no alcanza, no es un problema de contenido — es un objetivo mal
puesto (o hace falta más de un CEP, o más de un canal).

Si el ciclo no tiene una meta de facturación (por ejemplo, un objetivo de marca), se usa el
equivalente: volumen de seguidores, de suscripciones, de leads — el mismo cálculo hacia atrás.

### 3.3 — Renuncias
Elegir un objetivo significa que otras condiciones **no** se atacan este ciclo. Se nombra
explícitamente qué queda afuera y por qué. Sin esto no hay estrategia, hay lista de deseos.

**Output:** `posicionamiento.md` (sección 2)

---

# CAPA 4 — ESTRATEGIA
### ¿Cómo se logra, paso a paso, y con qué historia se comunica?

Esta capa es el **outcome principal** del departamento. Promesa, posicionamiento e ICP se definen
acá, pero no son el resultado final — son soporte. El resultado final es **la ingeniería inversa
de cómo se logra el objetivo**: los pasos concretos.

### 4.1 — Ingeniería inversa de pasos
A partir del objetivo agresivo y su ingeniería inversa financiera (Capa 3), se concretan los pasos
puntuales para llegar ahí. Ejemplo: si la meta es $100.000 de facturación + 200.000 seguidores de
posicionamiento + 30 suscripciones, se desglosa en pasos concretos con **datos puntuales y fechas
puntuales** — no un plan genérico.

### 4.2 — Estrategia general de contenido (soporte, no el outcome)
- **Promesa:** lo que la marca afirma, en el lenguaje del comprador (sale de 1.3 audience behavior)
- **Posicionamiento:** cómo nos vamos a posicionar y cómo nos tiene posicionado el mercado hoy
- **ICP (cliente ideal):** a quién le hablamos — sale de Capa 0 (audiencia) + Capa 1 (demanda y
  audience behavior)

### 4.3 — La historia
Todo lo anterior se traduce a una historia simple, que **siempre interpreta el área de Creative**:

| Rol | Es | Ejemplo |
|---|---|---|
| **Héroe** | El público objetivo — nunca la marca | Alguien que quiere perder peso |
| **Villano** | Contra qué está la promesa | La grasa, la comida chatarra |
| **Solución / final feliz** | Nosotros — tenemos el resultado | El producto/servicio que lo logra |

Strategy define héroe, villano y solución. Cómo se cuenta esa historia en piezas concretas — el
guion, el gancho, el formato — es de Creative.

**Output:** `posicionamiento.md` (sección 3) + `estrategia-de-contenido.md`

🚦 **Gate humano** — un humano aprueba objetivo, posicionamiento e historia. Con esto Strategy
cierra su parte.

---

## Handoff a Contenido/Calendar · Creative / Growth

```markdown
## HANDOFF — Strategy → Contenido/Calendar · Creative / Growth
- Cliente · Arquetipo · Fecha
- Objetivo del ciclo + ingeniería inversa financiera (volumen/conversión necesarios)
- Renuncias explícitas
- Pasos puntuales con fechas
- Promesa · Posicionamiento · ICP
- Historia: héroe / villano / solución
- Huecos de evidencia abiertos: ⚠️ SIN DATOS pendientes
- Siguiente: Contenido/Calendar arma la distribución y cadencia real · Creative interpreta la
  historia en piezas · Growth trabaja money model/funnel
```

---

## Registro de cambios

| Fecha | Cambio | Por qué |
|---|---|---|
| Esta sesión | Se reescribió el método completo a 6 capas (antes 9) | Alinear el sistema al proceso real que Rodrigo describió, sin pasos agregados que él no pidió |
| Esta sesión | Se eliminó la ingeniería inversa de media "pesada" (5 anillos, descomposición en 7 capas, share of voice/market, mapas de saturación/2x2/objeciones) | No forma parte del proceso descrito — Capa 1 queda liviana: canales + demanda + audience behavior + awareness |
| Esta sesión | Se eliminó el sistema de contenido formal (funciones Hero/Series/Proof/etc, temperatura, jerarquía de mensaje) | No forma parte del proceso descrito |
| Esta sesión | Se eliminó la medición formal por KPIs/alturas/leading-lagging/compounding | No forma parte del proceso descrito; el seguimiento vive en el handoff |
| Esta sesión | Se eliminaron QA-GATES.md y CORRELACION.md | Documentos de control interno no pedidos |
| Esta sesión | Se agregó la ingeniería inversa financiera (3.2) | Explícita en el proceso descrito y ausente del sistema anterior |
| Esta sesión | Se agregó la historia héroe/villano/solución (4.3) | Explícita en el proceso descrito y ausente del sistema anterior |
| Esta sesión | Se agregaron instrumentos concretos de Capa 0 (Forms + Excel) | El proceso descrito los usa; antes el input era genérico |
| Esta sesión | Se mantuvieron arquetipos (Capa 0) | Confirmado explícitamente que se mantiene aunque no estaba en la descripción original |
| Esta sesión (revisión) | Se sacó la Capa 5 (Distribución: owned/paid/earned/borrowed + balance marca/activación + calendario) | Por indicación explícita: eso es de la etapa Contenido/Calendar de la cascada de Inherent, no de Strategy. Strategy termina en Capa 4 |
| Esta sesión (revisión) | Se agregó la tabla "por qué cada dato" y el chequeo de volumen (1.2 ↔ 3.2) | Cada dato que se recolecta tiene que trazarse a dónde se usa — no se junta información sin destino |
