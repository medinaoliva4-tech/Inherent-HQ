# Playbook — Calendario comercial y anatomía de campaña

Cómo se construye el `calendario-comercial.csv`: fechas, preparación, expectativa, lanzamiento,
promoción y cierre.

> **Regla madre:** una campaña **no empieza el día del lanzamiento**. Empieza cuando arranca la
> preparación, y esa fecha se calcula **hacia atrás**.

---

## 1 · Las 5 fases de toda campaña

```
  PREPARACIÓN  →  EXPECTATIVA  →  LANZAMIENTO  →  SOSTENIMIENTO  →  CIERRE
  ───────────     ───────────     ───────────     ─────────────     ──────
  invisible       tensión         el pico         la conversión     el corte
```

### 1.1 Preparación *(invisible para el público)*
Todo lo que tiene que existir antes. Se calcula **hacia atrás** desde la fecha de lanzamiento:

```
LANZAMIENTO
   − carga y programación
   − setup técnico (landing, links, píxel, automatizaciones)
   − aprobación del cliente        ← el que más se subestima
   − revisión interna
   − producción
   − brief a Creative
= FECHA DE INICIO DE PREPARACIÓN
```

El tiempo de aprobación del cliente sale de `nucleo.md` (restricciones). Si no está documentado:
`⚠️ SIN DATOS — se asume [N] días` y se marca como riesgo del calendario.

**Regla dura:** ninguna fila de lanzamiento entra al CSV sin `fecha_prep_inicio`.

### 1.2 Expectativa *(opcional, y peligrosa)*
Construir tensión antes de revelar.

| Entra si… | NO entra si… |
|---|---|
| Hay algo real que revelar | Es "contenido de relleno con cuenta regresiva" |
| La audiencia ya conoce la marca | Es una marca que nadie conoce todavía (no hay a quién generarle expectativa) |
| El payload aguanta la promesa construida | Lo revelado va a decepcionar lo prometido |

> **La expectativa es un préstamo de atención.** Si lo que se revela no la paga, la próxima vez
> nadie presta. Duración típica: 3-10 días. Más de dos semanas se apaga sola.

### 1.3 Lanzamiento *(el pico)*
Ventana corta, máxima concentración de contenido y pauta.
- Se declara la **ventana exacta** (inicio y fin)
- Es donde vive el mayor **volumen diario** de contenido (M6)
- Todos los canales del mix activos **el mismo día**, con función distinta cada uno

### 1.4 Sostenimiento
Se mantiene presión mientras la campaña convierte.
- **Aquí vive la mayor parte del presupuesto pautado**, no en el día del lanzamiento
- El volumen orgánico baja, la pauta sube
- Es la fase donde se rotan ángulos según lo que va rindiendo

### 1.5 Cierre
- Último llamado con **urgencia legítima** (una fecha real, no inventada)
- Recuperación de quienes mostraron interés y no compraron
- **Corte declarado:** una campaña sin fecha de fin no se puede medir ni cerrar

---

## 2 · Tipos de fecha en el calendario

| Tipo | Qué es | Regla |
|---|---|---|
| **Fecha dura** | Feriado, temporada, evento de la industria, fecha del rubro | No se mueve. Todo lo demás se acomoda alrededor |
| **Fecha propia** | Lanzamiento, aniversario, apertura, hito del cliente | Se elige — y se elige mirando las duras y la saturación |
| **Fecha de preparación** | Cuándo arranca el trabajo invisible | Calculada hacia atrás, nunca estimada de memoria |
| **Ventana de saturación** | Cuando toda la categoría pauta | Entrar cuesta más y rinde menos: se declara el sobrecosto o se evita |
| **Ventana de aire** | Cuando nadie compite por la atención | La oportunidad más barata del calendario |
| **Valle** | Cuando la categoría no vende | Candidato a campaña de **marca**, no de activación |

**Cada fecha lleva fuente y año de referencia.** Una fecha sin fuente es `⚠️ SIN DATOS`.

---

## 3 · Estructura del CSV

```
campana · fase · fecha_inicio · fecha_fin · hito · fecha_prep_inicio ·
dependencia · responsable · canal · naturaleza · funcion · estado
```

| Columna | Valores |
|---|---|
| `fase` | `preparacion` · `expectativa` · `lanzamiento` · `sostenimiento` · `cierre` |
| `naturaleza` | `organica` · `pautada` · `mixta` |
| `funcion` | `marca` · `demanda` · `activacion` · `retencion` |
| `dependencia` | ID o nombre de lo que tiene que estar listo antes · `ninguna` |
| `estado` | `propuesto` · `aprobado` · `en curso` · `cerrado` · `BLOQUEADO` |

---

## 4 · Dependencias — secuenciales vs paralelas

Cada fila declara qué necesita antes y de qué tipo:

| Tipo | Qué significa | Riesgo si se ignora |
|---|---|---|
| **Secuencial** | B no puede empezar hasta que A termine | La cadena se corre entera y el lanzamiento se cae |
| **Paralela** | A y B avanzan a la vez | Ninguno — pero **consumen el mismo equipo** |

> El error más caro del calendario no es olvidar una tarea: es poner **dos campañas en paralelo que
> compiten por la misma persona**. Se ve recién en la semana de producción, cuando ya es tarde.

---

## 5 · Chequeos obligatorios antes de cerrar el calendario

- [ ] Toda fila de lanzamiento tiene `fecha_prep_inicio`
- [ ] Toda fila tiene `responsable` con nombre
- [ ] Las fechas duras de M1.3 están reflejadas
- [ ] Ninguna campaña de **activación** cae en un valle sin justificación
- [ ] Ninguna campaña cae en ventana de **saturación** sin presupuesto extra declarado
- [ ] No hay dos lanzamientos solapados compitiendo por el mismo equipo
- [ ] Toda campaña tiene `fecha_fin` — ninguna queda abierta
- [ ] El horizonte respeta el **ciclo de compra** de la categoría: hay tiempo para ver resultado
- [ ] El calendario **no contradice** el `calendario-estrategico.csv` de Strategy
- [ ] Las campañas de expectativa tienen payload real declarado

---

## 6 · Anti-patrones

| Anti-patrón | Por qué falla |
|---|---|
| **Lanzar en la fecha dura, no antes** | La decisión de compra ya se tomó días antes. Se llega tarde a la propia fecha |
| **Expectativa sin payload** | Quema credibilidad y la próxima campaña arranca en negativo |
| **Campaña sin fecha de fin** | No se puede medir, no se puede cerrar, nunca se aprende |
| **Todo el presupuesto el día del lanzamiento** | El pico de atención es el día 1, pero la conversión vive en el sostenimiento |
| **Promo permanente** | El descuento deja de ser un evento y pasa a ser el precio |
| **Calendario al 100% de capacidad** | Sin margen, el primer imprevisto tira la cadena entera |
| **Preparación estimada de memoria** | Siempre es más corta de lo real. Se calcula hacia atrás, paso por paso |
