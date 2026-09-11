# 07 · Entrega — nomenclatura y estructura
`Capas 5-6 · columnas: archivo_entregado, destino`

**Qué decide.** Cómo se nombra y dónde se deja el material para que ⑥A y ⑥B puedan trabajar sin
renombrar ni preguntar.

> **La prueba de una buena entrega:** ⑥A o ⑥B abren la carpeta, cruzan contra el Excel creativo y
> encuentra cada escena sin escribirle a nadie.

---

## La nomenclatura

```
<cliente>_<campana>_<id_creativo>_<escena>_<tipo>_<take>.<ext>
```

| Ejemplo | Qué dice |
|---|---|
| `acme_instalacion_C-001_E2_video_t03.mov` | Cliente acme · campaña Instalación · pieza C-001 · escena E2 · video · toma 3 |
| `acme_instalacion_C-003_E3_video_t01_SELECT.mov` | Lo mismo, marcado como select |
| `acme_instalacion_LOC-norte_ambiente.wav` | Ambiente de una locación, no de una escena |

**Reglas del nombre:**
- Todo en **minúsculas**, sin espacios, sin tildes, sin caracteres especiales
- `id_creativo` y `escena` **exactamente como están en el Excel** — es la llave del cruce
- El sufijo `_SELECT` marca las tomas buenas. **Nada más las marca**
- El número de toma va con dos dígitos (`t01`, no `t1`), para que ordene bien

🛑 **Los nombres se definen en la Capa 5, antes de grabar.** Renombrar al final es cuando se pierde
material y cuando el cruce contra el Excel deja de ser posible.

---

## La estructura de carpetas

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
    │   ├── C-001/
    │   ├── C-003/
    │   └── ...
    ├── 02_AMBIENTES/
    └── _ENTREGA/
        └── entrega.md       ← el manifiesto cruzado
```

| Carpeta | Qué va | Quién la usa |
|---|---|---|
| `00_RAW` | **Todo**, incluido el descarte. Organizado por jornada | Archivo. Casi nunca se abre |
| `01_SELECTS` | Las tomas buenas, **organizadas por `id_creativo`** | ⑥A Diseño y ⑥B Video — es su punto de entrada |
| `02_AMBIENTES` | Los ambientes por locación | ⑥B Video Editing, para rellenar cortes |
| `_ENTREGA` | El manifiesto | ⑥A, ⑥B y la Capa 7 |

🛑 **`01_SELECTS` se organiza por pieza creativa, no por jornada.** La jornada es una categoría de
Producción; ⑥A y ⑥B trabajan por pieza.

---

## El manifiesto

`entrega.md` cruza el Excel contra lo entregado, **fila por fila**:

```markdown
| id | id_creativo | escena | ¿grabada? | archivo | ¿cobertura? | estado |
|---|---|---|---|---|---|---|
| P-002 | C-001 | E2 | ✅ | acme_instalacion_C-001_E2_video_t03_SELECT.mov | ✅ | Entregada |
| P-006 | C-003 | E3 | ⬜ | — | — | **No grabada — reflejo irreducible, ver plan B** |
```

Y el resumen por pieza:

```markdown
| id_creativo | escenas pedidas | escenas entregadas | ¿completa? |
```

🛑 **Una fila creativa está completa solo si TODAS sus escenas están entregadas.** Declarar completa
una pieza a la que le falta una escena hace que ⑥A o ⑥B lo descubran en su mesa, y eso cuesta una
jornada entera de vuelta.

---

## Reglas duras

1. **Nomenclatura definida antes de grabar**, en el call sheet.
2. **`id_creativo` y `escena` exactos.** Son la llave del cruce.
3. **Nada se borra**, ni el descarte. Se marca, se guarda en `00_RAW`.
4. **Backup en dos lugares antes de salir de la locación.**
5. **Selects marcados por Producción; el frame lo elige ⑥A.** Marcar de más obliga a ⑥A a revisar
   todo; marcar de menos le esconde la toma buena.
6. **Toda escena faltante lleva motivo escrito** en el manifiesto.

---

## Anti-patterns

| Error | Por qué falla | Qué hacer |
|---|---|---|
| Renombrar al entregar | 400 archivos, se pierde material | Nombres en el call sheet |
| Selects organizados por jornada | ⑥A trabaja por pieza, no por día | `01_SELECTS/<id_creativo>/` |
| Entregar todo sin marcar selects | ⑥A revisa horas de material | Marcar las buenas, y solo esas |
| Declarar completa una pieza incompleta | Se descubre en la mesa de ⑥A | Todas sus escenas o ninguna |
| Espacios y tildes en los nombres | Se rompen en sincronización y scripts | Minúsculas, guiones bajos |
