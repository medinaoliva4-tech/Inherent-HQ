# Método de Producción — 8 capas

**Qué resuelve.** Convertir un Excel de ideas en material real, dentro de un presupuesto y una
agenda, sin cambiar ni una sola decisión creativa.

```
TRADUCIR    ¿Qué cosas físicas hace falta conseguir?      (Capas 0-1)
OPTIMIZAR   ¿Cómo se consigue en menos días y menos plata? (Capas 2-4)
EJECUTAR    ¿Cómo sucede y cómo se entrega?               (Capas 5-6)
```

```
┌──────────────────────────────────────────────────────────┐
│  CAPA 0   BRIEF            ¿Qué se aprobó producir?      │
│  CAPA 1   DESGLOSE         ¿Qué hace falta, escena a     │
│                            escena?                       │
├──────────────────────────────────────────────────────────┤
│  CAPA 2   CONSOLIDACIÓN    ¿Qué se graba junto?          │
│  CAPA 3   RECURSOS         ¿De dónde sale cada cosa?     │
│  CAPA 4   PRESUPUESTO      ¿Cuánto cuesta y entra?       │
├──────────────────────────────────────────────────────────┤
│  CAPA 5   PLAN DE RODAJE   ¿Qué día, en qué orden?       │
│  CAPA 6   RODAJE Y ENTREGA ¿Se grabó todo? ¿Se entregó   │
│                            ordenado?                     │
│  CAPA 7   LOOP             ¿Qué costó más de lo previsto?│
└──────────────────────────────────────────────────────────┘
                    LEARNING → vuelve a CAPA 2
                    y a ① Comprensión (capacidad real)
```

**Nunca se saltan capas.** Presupuestar antes de consolidar (saltar de 1 a 4) es el error más caro
del departamento: se presupuesta una jornada por pieza en vez de una jornada por grupo.

---

# CAPA 0 — BRIEF DE PRODUCCIÓN
### ¿Qué se aprobó producir, exactamente?

No decide nada. **Lee y verifica.** Es la capa que impide producir sobre ideas que todavía pueden
cambiar.

### 0.1 — Inputs obligatorios

| Input | Qué trae | ¿Bloqueante? |
|---|---|---|
| **④ Creatividad** · `ideas-de-contenido.csv` | Las filas con `handoff = produccion-video` / `produccion-foto`, **con Gate 3 aprobado** | 🛑 Sí |
| **②B Branding** | Guidelines, dirección visual, do's & don'ts, banco de assets existente | 🛑 Sí |
| **③ Marketing** | Fechas de la campaña y **fechas de preparación** | 🛑 Sí |
| **① Comprensión** | Capacidad de producción · presupuesto disponible · restricciones reales | 🛑 Sí |

### 0.2 — Filtrado y verificación de producibilidad

Se filtran las filas del Excel creativo y se verifica **fila por fila** que sea producible:

| Chequeo | Si falla |
|---|---|
| `escenas`, `encuadres` y `duraciones` tienen el **mismo número de ítems y el mismo orden** | ↩️ **DEVUELTO** — el shot list está roto |
| Cada escena dice **qué acción ocurre y en qué tipo de lugar** | ↩️ **DEVUELTO** — no se puede desglosar una escena sin acción |
| La fila tiene `estetica_mood` y `emocion` | ↩️ **DEVUELTO** — el equipo dirige a ciegas |
| La fila no pide nada que contradiga las guidelines de ②B Branding | Se declara y se escala. **No se resuelve en set** |
| Existe material ya grabado que sirve (banco de assets) | Se marca `reutiliza` y **no se vuelve a grabar** |

> **La verificación de reutilización es de las que más plata ahorra y menos se hace.** Antes de
> desglosar nada, se cruza contra el banco de assets: media campaña suele estar grabada ya.

### 0.3 — Techo de realidad

Antes de seguir, se declaran los tres techos:

```
Presupuesto disponible: [monto + moneda + fecha]
Días de rodaje posibles: [n] — según fechas de preparación de ③ Marketing
Capacidad declarada: [n piezas/ciclo] — de ① Comprensión
```

Si el Excel creativo pide más de lo que entra en cualquiera de los tres: **se declara el exceso en
filas concretas** y se devuelve a ③ Marketing y ④ Creatividad. **Nunca se recorta en silencio.**

**Output:** `brief-de-produccion.md`

---

# CAPA 1 — DESGLOSE
### ¿Qué hace falta conseguir, escena por escena?

La traducción central del departamento: de *"manos rompiendo un huevo en una cocina de día"* a una
lista de cosas que alguien tiene que conseguir.

### 1.1 — Las 8 categorías del desglose

Toda escena se desglosa en las mismas ocho. **Ninguna se omite**: si no aplica, se escribe `N/A`.

| # | Categoría | Qué incluye |
|---|---|---|
| 1 | **Locación** | El lugar concreto · interior/exterior · día/noche · accesos · electricidad · ruido |
| 2 | **Talento** | Quién aparece · manos, cuerpo o rostro · cuántas personas · si habla |
| 3 | **Producto** | Qué producto · cuántas unidades · en qué estado · quién lo provee |
| 4 | **Props** | Objetos que no son el producto pero aparecen en cuadro |
| 5 | **Vestuario** | Ropa, calzado, accesorios · de quién · quién lo consigue |
| 6 | **Arte y ambientación** | Lo que hay que montar o quitar del lugar para que se vea como la referencia |
| 7 | **Equipo técnico** | Cámara · óptica · soporte · luz · audio · monitor |
| 8 | **Permisos y legales** | Permiso de locación · cesión de imagen · derechos de música · seguros |

### 1.2 — Lo que se hereda y lo que se decide

🛑 **La columna de la izquierda no se toca. La de la derecha es el trabajo de Producción.**

| Se hereda de ④ Creatividad (no se cambia) | Lo decide Producción |
|---|---|
| La **acción** de cada escena | Cómo se logra esa acción |
| El **tipo de lugar** (*"cocina de día"*) | **Qué** cocina, de quién, con qué permiso |
| El **encuadre** (CU frontal fijo) | Qué cámara, qué óptica, qué soporte |
| La **duración** de cada escena | Cuánto tiempo de rodaje necesita esa escena |
| El **mood** y la **emoción** | Qué luz y qué dirección de actor los producen |
| Qué **producto** aparece | Cuántas unidades, en qué estado, quién las lleva |

### 1.3 — Una fila creativa = N escenas de producción

El Excel creativo tiene **una fila por pieza**. El Excel de producción tiene **una fila por escena**,
porque la escena es la unidad que se graba, se agrupa y se cuesta.

```
C-001  (1 pieza, 3 escenas)  →  P-001 · P-002 · P-003
```

El vínculo es `id_creativo` + `escena`. Se conserva siempre: es lo que permite volver de un archivo
entregado a la MUST BE TRUE que lo justificó.

**Output:** `desglose.md` + las filas base de `plan-de-produccion.csv`

---

# CAPA 2 — CONSOLIDACIÓN
### ¿Qué se graba junto? — **acá está el valor del departamento**

Desglosar es mecánico. **Agrupar es donde se gana o se pierde el presupuesto.**

### 2.1 — El principio

Lo caro de una producción **no son las tomas: son los montajes**. Cada vez que se cambia de locación,
se convoca talento o se arma una luz nueva, se paga tiempo muerto. Treinta escenas dispersas pueden
ser once jornadas o dos, y la diferencia no está en el contenido: está en cómo se agruparon.

### 2.2 — Los 4 ejes de agrupación, en orden de peso

| # | Eje | Por qué pesa | Regla |
|---|---|---|---|
| 1 | **Locación** | Es el costo fijo más grande: traslado, permiso, montaje | Todo lo que ocurre en la misma locación se graba el mismo día. Sin excepciones evitables |
| 2 | **Talento** | Se paga por jornada, no por toma | Si una persona aparece en 9 escenas, las 9 se agrupan en sus jornadas |
| 3 | **Setup de luz / cámara** | Rearmar una luz cuesta 30-60 min | Dentro de una jornada, se ordena por setup, no por número de pieza |
| 4 | **Producto** | Perecederos, unidades limitadas, estados irreversibles | Lo que se destruye en cuadro (se corta, se derrite, se abre) va **último** en su bloque |

### 2.3 — El orden de tiro

Dentro de una jornada, el orden **no es el orden narrativo**. Se ordena por costo de cambio:

```
1. Mismo setup, mismo talento        → juntas, seguidas
2. Cambios de vestuario              → agrupados, no alternados
3. Escenas con producto destructivo  → al final de su bloque
4. Tomas de seguridad y cobertura    → antes de desarmar, nunca al final del día
```

### 2.4 — El factor de consolidación

Se declara siempre, porque es la métrica del departamento:

```
Factor de consolidación = escenas totales ÷ jornadas
```

| Factor | Lectura |
|---|---|
| **< 4** | Mal agrupado, o el Excel creativo pide locaciones dispersas. Revisar antes de presupuestar |
| **4-10** | Normal |
| **> 10** | Muy eficiente — verificar que la jornada sea realmente ejecutable en horas, no solo en papel |

🛑 **Una jornada no puede pasar de 10 horas de trabajo efectivo.** Si el factor es alto pero no entra
en el día, no está consolidado: está sobrecargado, y se cae la última mitad del plan.

→ Protocolo completo en `playbooks/CONSOLIDACION.md`.

**Output:** `plan-de-jornadas.md` + columna `jornada` y `orden_en_jornada` del Excel

---

# CAPA 3 — RECURSOS
### ¿De dónde sale cada cosa, quién la consigue y para cuándo?

### 3.1 — El origen de cada recurso

Cada ítem del desglose recibe **un origen**, del vocabulario cerrado:

| Origen | Qué implica | Riesgo típico |
|---|---|---|
| `propio` | Ya lo tenemos | Dar por sentado que está disponible ese día |
| `prestado` | Alguien lo cede sin costo | Se cae a último momento porque no hubo compromiso escrito |
| `alquilado` | Se paga por uso | Reserva sin confirmar · devolución tardía con recargo |
| `comprado` | Se paga y queda | Tiempo de entrega mayor al margen de preparación |
| `a-producir` | Hay que fabricarlo o gestionarlo | Es el que más se subestima: siempre lleva más que lo previsto |

### 3.2 — La regla del responsable

🛑 **Ningún recurso queda "por conseguir".** Cada uno lleva:

```
qué · origen · responsable (nombre) · fecha de confirmación · estado 🟢/🟡/🔴
```

Un recurso 🟡 a menos de **48 h** de la jornada pasa automáticamente a 🔴 y activa su plan B.

### 3.3 — Riesgo y plan B

Toda escena con dependencia externa lleva su plan B **escrito antes de la jornada**:

| Dependencia | Plan B mínimo exigible |
|---|---|
| **Clima** (exterior) | Locación interior alternativa, o fecha de reemplazo reservada |
| **Talento** | Segundo nombre confirmado, o reescritura de la escena a manos/detalle |
| **Permiso** | Locación alternativa, o versión de la escena sin el fondo identificable |
| **Producto** | Unidad de respaldo, o la escena se mueve a la jornada siguiente |

**Output:** `recursos.md` + columnas `origen_del_recurso`, `responsable`, `riesgo`, `plan_b`

---

# CAPA 4 — PRESUPUESTO
### ¿Cuánto cuesta, y entra en lo disponible?

### 4.1 — Estructura de costos

Se cuesta **por jornada**, no por pieza. Costear por pieza duplica los fijos.

| Bloque | Qué entra |
|---|---|
| **Fijos de jornada** | Locación · equipo · traslado · catering · asistencia |
| **Talento** | Por jornada, con cesión de imagen incluida o aparte |
| **Variables por escena** | Props · vestuario · producto consumido · arte |
| **Post base** | Backup, selects, transcodificación — **no** edición final: eso es ⑥B Video Editing |
| **Contingencia** | % declarado, visible, nunca repartido dentro de los ítems |

### 4.2 — La contingencia

| Perfil del rodaje | Contingencia mínima |
|---|---|
| Interior controlado, talento propio, producto disponible | **10 %** |
| Mezcla de interior y exterior, o talento externo | **15 %** |
| Exterior con clima, permisos pendientes o producto a producir | **20-25 %** |

🛑 **La contingencia va como línea propia.** Escondida dentro de los ítems, se gasta sin que nadie
note que se gastó.

### 4.3 — El costo por pieza se calcula, no se presupuesta

```
costo por pieza = (fijos de su jornada ÷ piezas de esa jornada) + variables propias
```

Ese número es el que vuelve en la Capa 7 y el que hace que ③ Marketing pueda decidir el ciclo
siguiente con datos y no con intuición.

### 4.4 — Si no entra

Se declaran **tres opciones concretas**, con su impacto, y decide un humano:

| Opción | Qué se toca | Qué NO se toca |
|---|---|---|
| **Reagrupar** | Volver a Capa 2 y buscar más consolidación | Nada del contenido |
| **Recortar filas** | Se proponen las filas de menor `traza_a_must_be_true`, y **decide ③ Marketing** | La intención de las que quedan |
| **Bajar de especificación** | Locación más simple, menos talento, menos equipo | El encuadre, la acción y la duración — eso vuelve a ④ Creatividad |

🛑 **Producción nunca elige sola qué pieza se cae.** Propone; deciden ③ Marketing y ④ Creatividad.

🚦 **GATE — el presupuesto lo aprueba un humano antes de comprometer un solo recurso.**

**Output:** `plan-de-produccion.csv` completo + resumen de presupuesto

---

# CAPA 5 — PLAN DE RODAJE
### ¿Qué día, a qué hora, en qué orden, con quién?

### 5.1 — El call sheet

Uno por jornada. Lo que tiene que contener, sin excepción:

| Bloque | Contenido |
|---|---|
| **Encabezado** | Cliente · campaña · jornada · fecha · locación con dirección · clima previsto |
| **Horarios** | Llamado · inicio de rodaje · comida · wrap previsto |
| **Contactos** | Nombre, rol y teléfono de cada persona convocada |
| **Orden de tiro** | Escena por escena, con `id`, acción, encuadre, duración y tiempo estimado |
| **Por escena** | Talento · producto · props · vestuario · equipo específico |
| **Cobertura** | Las tomas de seguridad obligatorias, marcadas aparte |
| **Riesgos del día** | Los 🟡/🔴 activos con su plan B |
| **Entrega** | Nomenclatura de archivo y a dónde va el material al terminar |

### 5.2 — La nomenclatura se define acá, no al entregar

```
<cliente>_<campana>_<id_creativo>_<escena>_<tipo>_<take>.<ext>
ejemplo:  acme_instalacion_C-001_E2_video_t03.mov
```

🛑 **Los nombres se definen antes de grabar.** Renombrar 400 archivos al final es cuando se pierde
material y cuando ⑥A y ⑥B reciben una carpeta que no pueden cruzar contra el Excel.

### 5.3 — Márgenes reales

| Concepto | Margen mínimo |
|---|---|
| Montaje inicial de la jornada | 60-90 min antes del primer tiro |
| Cambio de setup de luz | 30-45 min |
| Cambio de locación | 60 min + traslado real |
| Desmontaje | 45 min |

Una jornada planificada sin estos márgenes **no es un plan: es una lista de deseos**, y se cae en la
segunda hora.

🚦 **GATE — el plan de rodaje se aprueba antes de convocar a nadie.**

**Output:** `call-sheets/jornada-N.md`

---

# CAPA 6 — RODAJE Y ENTREGA
### ¿Se grabó todo? ¿Se entregó de forma que otro pueda usarlo?

### 6.1 — El checklist de cierre de locación

🛑 **Antes de desarmar**, se verifica contra el Excel:

- [ ] Todas las escenas de esta locación están grabadas y marcadas
- [ ] Las tomas de **cobertura** de `toolkit/05-cobertura.md` están hechas
- [ ] El audio de cada escena con voz está **verificado escuchándolo**, no asumido
- [ ] Hay al menos **dos tomas buenas** de cada escena crítica
- [ ] El material está **respaldado en dos lugares** antes de salir de la locación

> **La regla del respaldo doble no es paranoia:** volver a una locación cuesta más que todo el
> tiempo que ahorra saltarse el backup.

### 6.2 — Selects

Producción marca los **selects** —las tomas buenas— y no más. Elegir el frame exacto, recortar y
componer es de ⑥A Diseño; montar y versionar es de ⑥B Video Editing.

| Producción entrega | Producción NO entrega |
|---|---|
| RAW ordenado por escena | Piezas exportadas listas para publicar |
| Selects marcados | El frame elegido y recortado |
| Audio limpio y sincronizado | La mezcla final |
| Fotos con exposición correcta | Retoque y adaptación por formato |

### 6.3 — El manifiesto de entrega

`entrega.md` cruza el Excel contra lo entregado, fila por fila:

```markdown
| id | id_creativo | escena | ¿grabada? | archivo | ¿cobertura? | estado |
```

Toda escena `Planificada` que no terminó `Entregada` lleva **motivo escrito**. Una escena que
desaparece en silencio es una pieza que ⑥A o ⑥B van a descubrir que no pueden armar.

🚦 **GATE — la entrega se confirma antes de cerrar la jornada como completa.**

**Output:** `entrega.md` + material en Drive con la estructura de `toolkit/07-entrega.md`

---

# CAPA 7 — LOOP
### ¿Qué costó más de lo previsto, y qué hacemos distinto?

### 7.1 — Las cuatro lecturas

| Lectura | Pregunta | De dónde sale |
|---|---|---|
| **Desvío de costo** | ¿Qué ítems se pasaron, y cuánto? | `costo_estimado` vs `costo_real` |
| **Desvío de tiempo** | ¿Qué escenas llevaron más de lo estimado? | `tiempo_estimado_min` vs real |
| **Material no usado** | ¿Qué se grabó y ⑥A nunca usó? | Cruce con lo publicado |
| **Consolidación** | ¿El factor fue el previsto? ¿Dónde se perdió? | `plan-de-jornadas.md` vs real |

### 7.2 — El material no usado es el hallazgo más valioso

Si un 40 % de lo grabado no se usó, el problema **no está en producción**: está en que el Excel
creativo pidió cobertura que la pieza final no necesitaba. Eso se devuelve a ④ Creatividad como dato,
no como reclamo — y en dos ciclos baja el costo sin bajar la calidad.

### 7.3 — Lo que vuelve a ① Comprensión

**La capacidad de producción declarada en ① Comprensión es una estimación.** Al cerrar el ciclo,
Producción la corrige con datos reales:

```markdown
| Declarado en ① | Real este ciclo | Diferencia | Qué lo explica |
```

Es la única corrección que Producción hace sobre un documento de otro departamento, y se hace **como
propuesta**, nunca editando su archivo.

### 7.4 — Lo que sube al toolkit

Los márgenes, tiempos y costos reales actualizan las tablas de `toolkit/`. Un tiempo estimado que
falló tres ciclos seguidos deja de ser estimación y pasa a ser dato.

**Output:** `aprendizaje-de-produccion.md`

---

# Cambios respecto al flujo original

| Cambio | Qué decía el flujo | Por qué |
|---|---|---|
| **La unidad del Excel es la escena, no la pieza** | *"Excel con presupuesto y escenas planificadas"* sin definir la fila | Una pieza tiene N escenas y las escenas son lo que se agrupa y se cuesta. Con una fila por pieza no se puede consolidar, que es donde está el ahorro |
| **Se agregó la Capa 2 (consolidación) como capa propia** | El flujo va de las ideas directo a *"preparación y grabación"* | Presupuestar sin agrupar multiplica el costo por 3-5. Era el hueco más caro del flujo |
| **Se agregó el factor de consolidación como métrica** | No existía | Sin una métrica, "agrupamos bien" es una opinión. Con ella se detecta un plan malo antes de gastarlo |
| **Se agregó la verificación de reutilización (0.2)** | No existía | Media campaña suele estar grabada ya. Sin el cruce contra el banco de assets se vuelve a grabar lo que existe |
| **Se agregó contingencia obligatoria y visible (4.2)** | El flujo dice *"presupuesto"* sin estructura | Sin contingencia declarada, el primer imprevisto aparece como sobrecosto sorpresa |
| **Se agregó `costo_real` obligatorio** | El flujo solo prevé presupuestar | Sin costo real no hay Capa 7, y el ciclo siguiente se vuelve a estimar a ojo |
| **Se movió el corte final fuera de Producción** | El dibujo pone Video Editing después de Producción, pero el texto del flujo no lo define | Producción entrega RAW + selects; el montaje, el color de entrega y las versiones por plataforma son de **⑥B Video Editing** (`agents/video/`). El corte coincide con lo que ese agente declara: *«Production — pre y rodaje; la post es de Video»* |
| **Se agregó el protocolo de devolución a ④ Creatividad** | El flujo es unidireccional | Sin un camino de vuelta, lo imposible se resuelve improvisando en set — y se descubre en la edición, sin presupuesto para rehacerlo |
| **Se agregó la corrección de capacidad hacia ① Comprensión (7.3)** | El flujo no tiene retorno | La capacidad declarada es una estimación que nadie corrige nunca. Producción es el único departamento que tiene el dato real |
