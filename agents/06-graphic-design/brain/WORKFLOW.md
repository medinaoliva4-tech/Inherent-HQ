# ⑥A Diseño gráfico — cómo trabaja

> **En una frase:** produce **el grueso del volumen** —estáticos, carruseles y stories— dentro
> del sistema visual que ②B definió. ④ dirigió, **⑥A compone**.

Este documento es todo lo que hay que saber para operar el departamento. El **cómo se hace** cada
paso vive en las skills: `skills/README.md`.

---

## 📅 Tu ventana en el ciclo

> Calendario completo: `inherent/05-OPERACION.md` → «📅 El calendario del ciclo». 🔴 **Día 11:** último día para producir · 🔴 **Día 20:** presentación al cliente.

| Días | Qué corre | Entrega |
|---|---|---|
| **12 – 15** | **Montar el contenido** — `gd-recepcion` → `gd-plantillas` → `gd-imagen` → `gd-composicion` | Piezas compuestas |
| **16 – 19** | **Cambios** — lo que devuelve `br-guardian` · `gd-export` | Paquete exportado **a más tardar el día 19** |

---

## 0 · El plan contratado — cuánto y a qué profundidad

**Lo primero de cada ciclo: leer el plan del cliente.** Lo anota ② Strategy al arrancar en
`clients/<cliente>/data/plan-contratado.md`:
🔷 **Marketing** · 🔷 **Marketing Pro** · 🟨 **Accelerate** · 🟨 **Compound** · ⬜ **Tailor Made**.

- 🛑 **Sin plan anotado, el departamento no arranca:** `BLOQUEADO — falta el plan contratado`.
- 🛑 **El plan es el techo, no una sugerencia.** Entregar de más rompe el margen; entregar de menos
  rompe la promesa publicada (`inherent/03-OFERTA.md` → «🌐 Las cuatro tarjetas»).
- Los números salen de `inherent/06-ECONOMIA.md` → «📦 El volumen» y `inherent/05-OPERACION.md` →
  «El desglose por tarea». **Si cambian allá, cambian acá** — esta tabla no manda sobre ellos.

| Qué cambia | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Estáticos y carruseles** | **43** | **72** | **63** | **88** |
| **Stories** | 30 | 55 | 55 | 80 |
| **Total de piezas** | **73** | **127** | **118** | **168** |
| **Revisiones por pieza** | **1** | 2 | 2 | 3 |

**Cómo se lee:**

- ⚠️ **🟨 Accelerate baja a 63 estáticos A PROPÓSITO — no es un error de tabla.** Entrega **menos
  estáticos que 🔷 Pro** *(63 contra 72)* porque la mezcla se corre hacia video: **18 videos
  planificados contra 12.** El total del plan sigue siendo 145 piezas; lo que cambia es de qué están
  hechas. 🛑 **Copiar el reparto de Pro es un error**, y «corregir» el 63 hacia arriba rompe el
  margen de Producción.
- 🔑 **168 es el techo real del departamento**, el de 🟨 Compound — y **no se diseñan una por una.**
  Se arma el sistema de plantillas del ciclo y se llenan: **el GATE 1 aprueba el molde, no las
  piezas.** Sin ese gate el volumen no es viable.
- 🔴 **⑥A no tiene MCP: hoy el volumen pasa entero por Pablo.** Sus horas son el techo de capacidad,
  no el plan. Si el ciclo no entra, **se declara antes de empezar a componer**, no a mitad.
- 🛑 **Si llegan más piezas que el techo del plan, las de más no se componen:** se declara la
  diferencia y se devuelve a ③ Marketing. Recortar es decisión de alcance, no de ⑥A.
- **Las variantes de creativo de pauta no cuentan acá.** Las 20/30/35/50 existen para ⑩ Ads, salen
  de material ya compuesto y **no entran a este total.**

### ⬜ Tailor Made — cuando el presupuesto no calza en un plan

Allan lo cotiza **en las mismas unidades de la tabla de arriba** —estáticos, stories, revisiones— y
el departamento trabaja con esos números igual que con un plan estándar. **El precio lo define Allan.**

- 🛑 **Una fila sin número es un bloqueo, no una invitación a suponer:** se le pide a Allan.
- 🛑 **No existe un plan por debajo de 🔷 Marketing** (`inherent/06-ECONOMIA.md` → «📦 El volumen»).
- **Se baja el volumen, nunca el método:** los gates, la trazabilidad y las devoluciones son iguales
  en todos los planes.
- **Arriba de 🟨 Compound sube el volumen**, pero el techo real son **las horas de Pablo y las
  plantillas aprobadas**: más piezas sin plantilla nueva es ejecución que no existe.

---

## 1 · El problema de este departamento es el volumen

> 📐 **Cuánto y a qué profundidad según el plan contratado: §0.** Una sola tabla, y está allá.

> 🔑 **168 piezas al mes no se diseñan una por una. Se arma un sistema de plantillas y se
> llenan.** Por eso la Capa 1 es la que decide si el ciclo entra o no.

🛑 **Si para cada pieza hace falta una decisión de diseño, el departamento no escala** — y el
margen se come las horas.

---

## 2 · La distinción que define el departamento

**②B definió el sistema. ④ dirigió el contenido. ⑥A compone dentro de los dos.**

| Quién | Qué decidió |
|---|---|
| **②B Branding** | Paleta, tipografía, grilla, safe zones, activos distintivos |
| **④ Creatividad** | El concepto, el copy **literal** y el layout de cada pieza |
| **⑥A Diseño** | **Cómo se compone eso**, dentro del sistema |

🛑 **⑥A no escribe copy, no inventa conceptos y no cambia el sistema visual.** Si el sistema no
alcanza para una pieza, **se devuelve a ②B con la regla que falta** — no se improvisa.

---

## 3 · Qué entrega

| Qué | Dónde | Nombre |
|---|---|---|
| **Las piezas finales**, una por formato donde va | `clients/<cliente>/entregas/<ciclo>/diseno/` | `<id_creativo>_<formato>.png` |
| **Las plantillas del ciclo** | `clients/<cliente>/data/plantillas/` | Se reusan ciclo a ciclo |
| **`entregas-diseno.md`** | El manifiesto: una fila por pieza, con ruta y estado | — |
| **`aprendizaje-de-diseno.md`** | Qué plantilla se usó más, qué se devolvió, qué falta en el sistema | — |

🛑 **El `id_creativo` en el nombre no es opcional.** ⑨ Posting cruza por ese campo.

---

## 4 · El flujo, de 0 a 100

```
   0  RECEPCIÓN     qué llegó de ④ y es componible          → gd-recepcion
        ▼
   1  PLANTILLAS    el sistema que hace posible el volumen   → gd-plantillas
        ▼           🚦 GATE 1 — Allan aprueba las plantillas
   2  IMAGEN        de dónde sale cada imagen                → gd-imagen
        ▼
   3  COMPOSICIÓN   llenar las plantillas, pieza por pieza   → gd-composicion
        ▼
   4  EXPORT        specs por formato y nomenclatura         → gd-export
        ▼           🚦 GATE 2 — Allan aprueba el paquete
        ▼           →→→ pasa a QA y después a ⑨ Posting
   ↻  LOOP          qué plantilla rindió, qué falta al sistema → gd-loop
```

### 🚦 Los dos gates

| Gate | Qué se aprueba | Por qué |
|---|---|---|
| **1** | **Las plantillas del ciclo** | Aprobar 168 piezas una por una es imposible. **Se aprueba el molde** |
| **2** | **El paquete completo** | Es lo que entra a QA y después a publicación |

> 🔑 **El GATE 1 es el que hace viable el departamento.** Con las plantillas aprobadas, las 168
> piezas son ejecución.

---

## 5 · Las acciones — qué MCP le da cada una

| Acción | MCP | |
|---|---|---|
| Componer cada pieza sobre la plantilla | **Pablo** — dentro del costo fijo de su rubro | 👤 |
| Fotos de producto | ⑤ Producción — la sesión de foto del mes | 👤 |
| Reencuadrar para cada formato | `ffmpeg` local *(recorte y escala)* | ⬜ |
| Generar imagen con IA · quitar fondo · escalar calidad | ⛔ **Sin herramienta — no se promete** | 🔴 |

> ⚠️ **`⬜` = la tool existe, sin probar en cliente real · `👤` = lo hace una persona.**
> 🔴 **⑥A no tiene MCP.** Hoy es ejecución de Pablo con plantillas: **sus horas son el techo del
> volumen.** Por eso el GATE 1 de plantillas es lo que hace viable el departamento.

---

## 6 · De dónde recibe

| De | Qué | Si falta |
|---|---|---|
| **④ Creatividad** | `plan-de-contenido.csv` con **Gate 3** · el `ideas-<formato>.md` con el **copy literal** y el layout | 🛑 BLOQUEADO |
| **②B Branding** | **`sistema-visual.md`** — color, tipografía, composición, imagen | 🛑 BLOQUEADO |
| **③ Marketing** | `plan-por-canal.md` — a qué formato va cada pieza | 🛑 BLOQUEADO |
| **⑤ Producción** | Material fotográfico, si lo hubo | 🟡 No bloqueante |

---

## 7 · A quién entrega

| A | Qué |
|---|---|
| **QA** | El paquete completo |
| **⑨ Posting** | Los archivos finales con su `id_creativo` |
| **⑩ Ads** | Las variantes estáticas que van a pauta |

---

## 8 · Lo que este departamento NO hace

- **No escribe copy.** El copy es de ④, literal
- **No inventa conceptos.** Eso es ④
- **No cambia el sistema visual.** Si falta una regla, se devuelve a ②B
- **No diseña pieza por pieza.** Arma plantillas y las llena
- **No publica.** Eso es ⑨, con gate

---

## 9 · Antes de entregar

- [ ] Toda pieza de formato estático con `material = ninguno` o `material = foto` del Excel de ④ tiene su archivo, o su devolución escrita
- [ ] Cada archivo lleva su **`id_creativo`** en el nombre
- [ ] El copy está **literal**, como lo escribió ④
- [ ] Toda pieza lleva los **activos distintivos** que su formato exige
- [ ] **La slide 1 de cada carrusel se entiende sola**
- [ ] Todo el texto está dentro de las **safe zones**
- [ ] **Un solo acento de color** por pieza
- [ ] El total **entra en el techo** del plan contratado
- [ ] **Allan aprobó** los dos gates
