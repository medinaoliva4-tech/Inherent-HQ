---
name: pr-entrega
description: >
  Capa 6 de ⑤ Producción — cierra el rodaje y entrega el material de forma que ⑥A Diseño gráfico y
  ⑥B Video Editing puedan trabajar sin renombrar ni preguntar. Corre el checklist de cierre de
  locación antes de desarmar, verifica cobertura, audio y backup doble, marca los selects, aplica la
  nomenclatura y la estructura de carpetas, y arma el manifiesto que cruza el Excel fila por fila
  contra lo entregado. Escribe la sección § La entrega de `plan-de-rodaje.md` y completa la columna `estado`
  de `plan-de-produccion.csv`. Úsala cuando pidan "cerrá la entrega", "qué quedó grabado", "subí el
  material", "está completo esto", "cruzá lo grabado contra el Excel", "qué le falta a esta pieza",
  "dejá el material listo para edición", "marcá los selects". Requiere el plan de rodaje aprobado
  (🚦 Gate 2).
---

# Capa 6 · Rodaje y entrega — ¿se grabó todo y se entregó usable?

| | |
|---|---|
| **Consume** | El plan de rodaje aprobado (🚦 Gate 2): las secciones **la sección de cada jornada** y **§ Cómo se nombran los archivos** de `plan-de-rodaje.md` · las filas de `plan-de-produccion.csv` en `estado = planificada`, con su `id`, `id_creativo`, `escena`, `destino` y su cobertura marcada · lo que efectivamente se grabó en cada jornada |
| **Produce** | La sección **§ La entrega** de `plan-de-rodaje.md` —checklist de cierre por locación, manifiesto cruzado, escenas no entregadas con motivo y la tabla de qué se entrega / qué no— y la columna **`estado`** de `plan-de-produccion.csv` completa: `grabada` / `entregada` / `↩️ devuelta` |

Contexto del departamento: `agents/production/WORKFLOW.md`. Plantilla del entregable:
`agents/production/entregables/plan-de-rodaje.md`. Cómo encadena: `agents/production/skills/COMO-LAS-USA.md`.

> **La prueba de una buena entrega:** ⑥A o ⑥B abren la carpeta, la cruzan contra el Excel creativo y
> **encuentran cada escena sin escribirle a nadie.**

---

## 1 · El checklist de cierre de locación

🛑 **Se corre por locación y por jornada, antes de desarmar.** No al final del día, no al volver:
antes de tocar un trípode.

- [ ] **Todas las escenas** de esta locación están **grabadas y marcadas** en `estado`
- [ ] Las tomas de **cobertura** están hechas
- [ ] El audio de cada escena con voz está verificado **escuchándolo** —con auriculares—, **no asumido** por el medidor
- [ ] Hay al menos **dos tomas buenas** de cada escena crítica
- [ ] El material está **respaldado en dos lugares** antes de salir de la locación

> La regla del respaldo doble no es paranoia: **volver a una locación cuesta más que todo el tiempo
> que ahorra saltarse el backup.** Una tarjeta que se corrompe en el auto es la jornada completa, el
> talento, el permiso y la comida, otra vez.

| Ítem del checklist | Qué falla si se saltea |
|---|---|
| Escenas marcadas en `estado` | Nadie sabe qué falta hasta que ⑥B no lo encuentra |
| Cobertura | El corte no cierra y no hay con qué taparlo |
| Audio escuchado | El medidor no oye el zumbido del aire ni el roce del lavalier |
| Dos tomas buenas | Una toma única con un micro-error obliga a volver |
| Backup doble | Se pierde todo lo del día, no una escena |

❌ *"El medidor marcaba bien, el audio está"*
✅ *"Escuché las 4 escenas con voz. `PR-007` tiene roce de lav en la toma 2; la 3 está limpia."*

---

## 2 · Los selects — hasta acá llega Producción

**Producción marca las tomas buenas, y no más.**

| Quién | Qué decide |
|---|---|
| **⑤ Producción** | Cuál toma **sirve**: enfoque, exposición, audio, actuación utilizable |
| **⑥A Diseño gráfico** | **El frame exacto**, el recorte, la composición y el retoque |
| **⑥B Video Editing** | **El montaje**, el ritmo, el color de entrega y las versiones por plataforma |

🛑 **Marcar de más obliga a ⑥A y ⑥B a revisar todo el material; marcar de menos les esconde la toma
buena.** Las dos formas de equivocarse cuestan una jornada de su lado.

---

## 3 · Qué se entrega y qué NO

| Se entrega | NO se entrega |
|---|---|
| **RAW** ordenado por jornada, con el descarte incluido | Piezas exportadas listas para publicar |
| **Selects** marcados, organizados por `id_creativo` | El frame elegido, recortado o compuesto |
| Audio limpio y sincronizado, y el **ambiente** de cada locación | La mezcla final |
| Fotos con exposición y encuadre correctos | Retoque y adaptación por formato |
| Nomenclatura y estructura de carpetas **ya aplicadas** | Montaje, captions y versiones por plataforma |

🛑 **Producción no entrega piezas terminadas.** Si entrega un archivo listo para publicar, se saltó a
⑥A o ⑥B y nadie revisó la composición contra lo que pidió ④ Creatividad.

---

## 4 · La nomenclatura

```
<cliente>_<campana>_<id_creativo>_<escena>_<tipo>_<take>.<ext>
acme_menuejecutivo_CR-007_E2_video_t03.mov
acme_menuejecutivo_CR-007_E2_video_t03_SELECT.mov
acme_menuejecutivo_LOC-salon_ambiente.wav
```

| Regla | Por qué |
|---|---|
| Todo en **minúsculas**, sin espacios, sin tildes, sin caracteres especiales | Se rompen en la sincronización y en cualquier script |
| `id_creativo` y `escena` **exactos como están en el Excel** | Son **la llave del cruce**. Un `CR-7` en vez de `CR-007` rompe el manifiesto |
| El sufijo `_SELECT` marca las tomas buenas — **nada más las marca** | Es lo que ⑥A y ⑥B buscan primero |
| El número de toma con **dos dígitos** (`t01`, no `t1`) | Para que ordene bien al listar la carpeta |
| Los ambientes van por **locación**, no por escena | No pertenecen a una escena: se usan para rellenar cortes |

🛑 **Los nombres se definen en la Capa 5, dentro de `plan-de-rodaje.md` § Cómo se nombran los archivos, antes de grabar.** Renombrar 400
archivos al final es cuando se pierde material y cuando el cruce contra el Excel deja de ser posible.
Esta capa **aplica** la nomenclatura; no la inventa.

---

## 5 · La estructura de carpetas

```
<cliente>/
└── <campana>/
    ├── 00_RAW/
    │   ├── jornada-1/
    │   │   ├── video/
    │   │   ├── foto/
    │   │   └── audio/
    │   └── jornada-2/
    ├── 01_SELECTS/          ← lo que ⑥A y ⑥B abren primero
    │   ├── CR-001/
    │   └── CR-007/
    ├── 02_AMBIENTES/
    └── _ENTREGA/            ← el manifiesto vive en plan-de-rodaje.md § La entrega; acá va su copia y las rutas
```

| Carpeta | Qué va | Quién la usa |
|---|---|---|
| `00_RAW` | **Todo**, incluido el descarte. Organizado por jornada | Archivo. Casi nunca se abre |
| `01_SELECTS` | Las tomas buenas, **organizadas por `id_creativo`** | ⑥A y ⑥B — es su punto de entrada |
| `02_AMBIENTES` | Los ambientes por locación (30 s cada uno) | ⑥B, para rellenar cortes |
| `_ENTREGA` | Las rutas y el manifiesto | ⑥A, ⑥B y la Capa 7 |

🛑 **`01_SELECTS` se organiza por pieza creativa, no por jornada.** La jornada es una categoría de
Producción; **⑥A y ⑥B trabajan por pieza**, y una pieza casi siempre se grabó en dos días distintos.

🛑 **No se borra material crudo. Ni el descartado.** El descarte se **marca**, no se elimina: queda
en `00_RAW`. Lo que hoy es descarte es el plan B de la Capa 7, y el material que se borró es el que
siempre hacía falta.

---

## 6 · El manifiesto — el Excel cruzado, fila por fila

Se cruza **cada fila** de `plan-de-produccion.csv`, sin muestreo, y se escribe en `plan-de-rodaje.md` § La entrega:

```
| id | id_creativo | escena | ¿grabada? | archivo | ¿cobertura? | estado |
| PR-002 | CR-001 | 2 | ✅ | acme_menuejecutivo_CR-001_E2_video_t03_SELECT.mov | ✅ | entregada |
| PR-006 | CR-003 | 3 | ⬜ | — | — | ↩️ devuelta — reflejo irreducible, ver plan B |
```

Y el resumen **por pieza creativa**:

```
| id_creativo | escenas pedidas | escenas entregadas | ¿completa? |
| CR-001 | 3 | 3 | ✅ |
| CR-003 | 4 | 3 | ❌ falta escena 3 — motivo escrito |
```

🛑 **Toda escena `planificada` que no terminó `entregada` lleva motivo escrito.** Una escena que
desaparece en silencio es una pieza que ⑥A o ⑥B van a descubrir que no pueden armar, en su mesa, y
eso cuesta una jornada entera de vuelta.

🛑 **Una fila creativa está completa solo si TODAS sus escenas están entregadas.** No se declara
completa una pieza a la que le falta una escena, por chica que sea.

**La columna `estado` se completa acá**, fila por fila: `grabada` cuando existe el material ·
`entregada` cuando está nombrada, respaldada y en su carpeta · `↩️ devuelta` cuando no se grabó y
vuelve a ④ con motivo y dos alternativas.

---

## 7 · 🚦 GATE 3 — la entrega

**La entrega se confirma antes de cerrar la jornada como completa.** El gate es humano: esta skill
**para**, declara el estado del manifiesto y espera confirmación explícita. No se aprueba solo ni se
asume aprobado por silencio.

Después del gate se emite el bloque **HANDOFF** de `agents/production/WORKFLOW.md §8`, con las filas
creativas completas y las **incompletas nombradas una por una**.

---

## QA — Capa 6

- [ ] Todas las escenas de cada locación están **grabadas y marcadas** en `estado`
- [ ] **Cada escena tiene al menos dos tomas buenas** — las críticas, verificadas una por una
- [ ] Las tomas de **cobertura** están hechas en cada escena con talento o producto
- [ ] El **ambiente de cada locación** está grabado (30 s)
- [ ] El audio de cada escena con voz se **escuchó con auriculares**, no se asumió por el medidor
- [ ] 🛑 **Backup en dos lugares antes de salir de la locación**
- [ ] Los **selects están marcados** — las tomas buenas, y solo esas
- [ ] 🛑 **No se entregó ninguna pieza terminada** — eso es de ⑥A Diseño y ⑥B Video Editing
- [ ] La nomenclatura de `plan-de-rodaje.md` § Cómo se nombran los archivos está **aplicada**, con `id_creativo` y `escena` **exactos**
- [ ] La estructura de carpetas está armada, con `01_SELECTS` organizado **por `id_creativo`**
- [ ] El **manifiesto cruza el Excel fila por fila**, sin muestreo
- [ ] Toda escena `planificada` que no llegó a `entregada` tiene **motivo escrito**
- [ ] 🛑 **Ninguna fila creativa se declaró completa si le falta una escena**
- [ ] 🛑 **Nada se borró**, ni el descarte — el descarte está **marcado** y guardado en `00_RAW`
- [ ] La columna `estado` está completa en **todas** las filas del CSV
- [ ] Las escenas `↩️ devuelta` tienen los **tres elementos** (qué no se puede · por qué importa · dos alternativas)
- [ ] Todo faltante está marcado `BLOQUEADO` o `⚠️ SIN DATOS`, **ninguno omitido en silencio**
- [ ] 🚦 **GATE 3 registrado** con estado, y el bloque **HANDOFF emitido** con las filas incompletas nombradas

**Handoff →** `pr-loop` (Capa 7). El manifiesto es su insumo: sin la columna `estado` completa no se
puede medir material no usado, y la Capa 7 se queda sin su lectura más valiosa.
