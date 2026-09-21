# Plan de rodaje — [Cliente]

**Campaña(s):** [nombres] · **Ciclo:** [x] · **Fecha:** [aaaa-mm-dd]
**Gates:** presupuesto [✅/⬜] · plan de rodaje [✅/⬜] · entrega [✅/⬜]

> Este documento es **con el que se rueda**. Acompaña a `presupuesto.md` (lo que ve el cliente) y se
> apoya en `plan-de-produccion.csv` (interno, una fila por escena).

---

## Cómo se lee este documento

1. **Buscá tu jornada** en el índice de acá abajo y andá directo a esa sección. Ahí está todo lo del día: dirección, horarios, teléfonos y el orden en que se graba.
2. **Lo que está antes de cada tabla de tiro** —las piezas de la jornada— dice *qué tiene que transmitir* lo que estás grabando. Leelo una vez antes de arrancar.
3. **Lo que está al final del documento** es común a todos los días: lo que hay que conseguir, los permisos, los planes B, cómo se nombran los archivos y cómo se entrega.

> 🛑 **Lo que dice la columna "Qué se graba" viene de ④ Creatividad y no se cambia en el set.** Si
> algo no se puede grabar como está escrito, se avisa y se devuelve — no se resuelve improvisando.
> Fuente: `agents/creative/clients/<cliente>/ideas-<formato>.md`.

---

## Las jornadas de un vistazo

| Jornada | Fecha | Locación | Escenas | Piezas | Horas |
|---|---|---|---|---|---|
| **J1** | | | | | de máximo 10 |

**Factor de consolidación:** [escenas de rodaje] ÷ [jornadas] = **[n]** → [✅ 4-10 normal / ⚠️ <4 revisar / ⚠️ >10 verificar horas]

*(Las escenas que no se graban —placas, capturas, grafismos de post— van a `J0` y no cuentan para el factor. Se nombran acá en una línea.)*

---

# Jornada 1 — [día y fecha] · [locación]

### Datos del día

| | |
|---|---|
| **Dirección** | [nombre + dirección completa] |
| **Horarios** | Llamado [hh:mm] · primer tiro [hh:mm] · comida [hh:mm] · fin previsto [hh:mm] |
| **Clima** | [solo si hay exterior] |
| **Escenas** | [n] (`PR-00X` a `PR-00X`) |

**Quiénes están**

| Nombre | Rol | Teléfono |
|---|---|---|
| | | *(sin teléfono no está convocado)* |

### Las piezas de esta jornada

*(Compilado de ④ Creatividad — no se reescribe.)*

| Pieza | Qué es | Qué tiene que sentirse | Cómo se ve |
|---|---|---|---|
| **CR-00X** | [el concepto, una línea] | [la emoción, en lenguaje del comprador] | [estética / mood] |

### Orden de tiro

No es el orden en que se ve la pieza: es el orden que menos tiempo pierde moviendo luces y cámara.

**Bloque A — [nombre del setup]** *(montaje inicial: 60-90 min antes del primer tiro)*

| # | id | Qué se graba | Encuadre | Dur. | Tiempo | Qué necesitás a mano |
|---|---|---|---|---|---|---|
| 1 | PR-001 | [acción, literal de ④] | [encuadre, literal de ④] | [s] | [min] | [producto, props, equipo de esa toma] |

**Comida — [hh:mm] a [hh:mm]**

**Bloque B — [nombre del setup]** *(cambio de setup: 30-45 min)*

| # | id | Qué se graba | Encuadre | Dur. | Tiempo | Qué necesitás a mano |
|---|---|---|---|---|---|---|

🛑 **Lo que se consume o se destruye en cámara va al final de su bloque**, con una toma completa hecha antes.

### Lo que se dice en cámara

🛑 **Solo va acá lo que alguien dice frente a cámara.** La voz en off se graba otro día, en un lugar
silencioso — no ocupa tiempo de jornada, y se declara así. El texto en pantalla tampoco va: lo pone
⑥B en edición.

> **PR-00X — [quién]:** [el texto literal, o los puntos a tocar si es una persona real y no un actor]

*(Con talento no profesional: no se entrega un guion para leer, se entregan los puntos y una
indicación de dirección por situación — nunca *"hacelo más natural"*.)*

### Cobertura obligatoria — antes de desarmar cada setup

- [ ] Una reacción — `PR-00X`
- [ ] Una toma amplia — `PR-00X`
- [ ] Un detalle — `PR-00X`
- [ ] 30 segundos de ambiente de la locación, una sola vez en el día

🛑 **La cobertura se hace antes de mover la luz, nunca al final del día.** Cuando el día se atrasa,
lo último es lo primero que se cae — y es justo lo que salva la edición.

### Riesgos del día

| Qué puede fallar | Plan B |
|---|---|
| | |

*(Una sección así por cada jornada.)*

---

# Lo que hay que conseguir

Cada cosa tiene un responsable con nombre y una fecha. **Nada queda "por conseguir".**

| Qué | Para qué escenas | De dónde sale | Responsable | Confirmar antes de | Estado |
|---|---|---|---|---|---|
| | | `propio` / `prestado` / `alquilado` / `comprado` / `a-producir` | [nombre] | [fecha] | 🟢/🟡/🔴 |

> 🛑 **Una cosa en 🟡 a menos de 48 horas de su jornada pasa a 🔴 y se activa su plan B.**

---

# Permisos y autorizaciones

| Qué | Para qué escenas | Estado | Responsable |
|---|---|---|---|
| Permiso de locación | | | |
| Autorización de imagen — con canales, territorio y vigencia, y si se usa o no en pauta | | | |
| Música | | | |

---

# Cómo se nombran los archivos

Esto se define **antes** de grabar. Renombrar 400 archivos al final es cuando se pierde material.

```
<cliente>_<campana>_<pieza>_<escena>_<tipo>_<toma>.<extensión>

acme_menuejecutivo_CR-007_E2_video_t03.mov
acme_menuejecutivo_CR-007_E2_video_t03_SELECT.mov     ← las tomas buenas llevan _SELECT
acme_menuejecutivo_LOC-salon_ambiente.wav
```

Todo en minúsculas, sin espacios ni tildes. El número de toma con dos dígitos (`t03`, no `t3`).

**Dónde va el material:** [ruta de Drive]

```
00_RAW/          todo lo grabado, incluido el descarte, ordenado por jornada
01_SELECTS/      las tomas buenas, ordenadas por pieza  ← acá entra edición
02_AMBIENTES/    los 30 segundos de ambiente de cada locación
_ENTREGA/        el manifiesto y las rutas
```

🛑 **No se borra nada, ni el descarte.** Lo que no sirve se marca; queda en `00_RAW`.

---

# La entrega

### Antes de desarmar, en cada locación

- [ ] Todas las escenas del día grabadas y marcadas
- [ ] La cobertura hecha
- [ ] El audio de las tomas habladas **escuchado con auriculares**, no dado por bueno porque el medidor se movía
- [ ] Al menos dos tomas buenas de cada escena importante
- [ ] El material copiado **en dos lugares** antes de salir

### Manifiesto — lo grabado contra lo planificado

| Pieza | Escenas pedidas | Entregadas | ¿Completa? |
|---|---|---|---|
| CR-00X | | | ✅ / ❌ falta [cuál] — motivo escrito |

🛑 **Una pieza está completa solo si TODAS sus escenas están entregadas.** El detalle escena por
escena, con el nombre de archivo de cada toma, vive en `plan-de-produccion.csv`, columna `estado`.

**Escenas que no se entregaron** — *toda escena planificada que no llegó a entregada lleva motivo escrito*

| id | Por qué | Qué se hace |
|---|---|---|

### Qué se entrega y qué no

| Se entrega | No se entrega |
|---|---|
| Todo el material crudo, ordenado por jornada | Las piezas listas para publicar |
| Las tomas buenas marcadas, ordenadas por pieza | El recorte y la composición final |
| El audio limpio y el ambiente de cada locación | La mezcla de sonido |
| Las fotos bien expuestas y encuadradas | El retoque y la adaptación por formato |

---

# Verificación y devoluciones

*(Interno. Es el rastro de que se verificó antes de gastar, y de lo que se devolvió a ④.)*

### El techo de realidad
```
Presupuesto disponible: [monto + moneda + fecha]
Días de rodaje posibles: [n]   — según fechas de preparación de ③ Marketing
Capacidad declarada:     [n]   — de ① Comprensión
```
**¿Entra?** [✅ sí / ⚠️ se excede en [qué] → devuelto a ③ y ④, con las filas concretas]

### Producibilidad, pieza por pieza
| Pieza | Shot list completo | Acción y lugar por escena | Mood y emoción | ¿Reutiliza material? | Veredicto |
|---|---|---|---|---|---|
| CR-00X | ✅ | ✅ | ✅ | ⬜ | producible |

### Material que ya existe y NO se vuelve a grabar
| Qué se necesitaba | Qué hay en el banco de assets | Escenas que se ahorran |
|---|---|---|

🛑 Si esta tabla queda vacía, el cruce no se hizo. *"Sin material previo"* escrito es un resultado.

### Escenas devueltas a ④ Creatividad
| Escena | Motivo (de los 6) | Qué intención se rompería | Alternativa 1 | Alternativa 2 | Respuesta de ④ + fecha |
|---|---|---|---|---|---|
