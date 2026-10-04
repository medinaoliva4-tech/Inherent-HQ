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

## 1 · El problema de este departamento es el volumen

| | 🔷 Marketing | 🔷 Mkt Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| **Estáticos y carruseles** | **43** | **72** | **63** | **88** |
| **Stories** | **30** | **55** | **55** | **80** |
| **Total** | **73** | **127** | **118** | **168** |
| **Revisiones por pieza** | 1 | 2 | 2 | **3** |

> Fuente: `inherent/06-ECONOMIA.md` → «📦 El volumen» y `inherent/05-OPERACION.md` → «El desglose
> por tarea», filas 15, 16 y 17. **Si cambian allá, cambian acá** — esta tabla no manda sobre ellos.
> **168 es el techo, el de 🟨 Compound.**

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
