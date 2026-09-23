---
name: po-recepcion
description: >
  Capa 0 de ⑦ Posting — verifica qué llegó y está realmente publicable antes de escribir un solo
  caption. Cruza `plan-de-contenido.csv` de ④ fila por fila contra los exports de ⑥A Diseño y ⑥B
  Video Editing, verifica que cada archivo corresponda a su `id_creativo`, que la pieza tenga copy
  escrito, que no arrastre claims sin validar y que exista la cuenta donde va con alguien que tenga
  las claves. Escribe las filas base de `calendario-de-publicacion.csv`. Úsala cuando pidan "qué nos
  falta para publicar", "¿llegó todo?", "arrancá el ciclo de posting", "cruzá lo entregado contra el
  calendario". Bloquea si falta el Gate 3 de ④ o si no sabemos quién tiene los accesos.
---

# Capa 0 · Recepción — qué llegó y está publicable

| | |
|---|---|
| **Consume** | `plan-de-contenido.csv` con **Gate 3** de ④ (`agents/creative/clients/<cliente>/`) · los exports de ⑥A y ⑥B con su ruta · § La capacidad de `agents/comprension/clients/<cliente>/comprension.md` (cuentas y accesos) · guidelines de ②B |
| **Produce** | Las **filas base** de `calendario-de-publicacion.csv` — una por publicación — y la tabla **§ Lo que no sale este ciclo** de `publicaciones.md` |

Contexto del departamento: `agents/posting/WORKFLOW.md`. Plantillas:
`agents/posting/entregables/`.

**No escribís nada todavía: cruzás y verificás.** Escribir el caption de una pieza que no tiene
archivo es trabajo tirado, y se descubre recién al cargar.

## 1 · Los inputs bloqueantes

| De | Qué se carga | Si falta |
|---|---|---|
| **④ Creatividad** | `plan-de-contenido.csv` con **Gate 3 aprobado** · el copy y el caption literales del `ideas-<formato>.md` de cada pieza · la `fecha` | 🛑 **BLOQUEADO** |
| **⑥B Video Editing** | Los videos finales por plataforma, con nombre de archivo y ruta | 🛑 **BLOQUEADO** para esas filas |
| **⑥A Diseño gráfico** | Las piezas estáticas exportadas, por formato | 🛑 **BLOQUEADO** para esas filas |
| **① Comprensión** | **Quién tiene las claves de cada cuenta**, de § La capacidad | 🛑 **BLOQUEADO** |
| **②B Branding** | Tono de voz, do's & don'ts, cómo se nombra la marca | 🛑 **BLOQUEADO** |

🛑 **Ningún archivo de otro departamento se copia: se cita su ruta.**

## 2 · El cruce, fila por fila

Se recorre **cada fila del Excel de ④** del ciclo y se le busca su archivo. Sin muestreo: una fila
que no se verificó es una fila que se cae al cargar.

| Chequeo | Qué se mira | Si falla |
|---|---|---|
| **Tiene archivo final** | Existe el export de ⑥A o ⑥B, con ruta | `⚠️ SIN ARCHIVO` — se nombra **de quién se espera y desde cuándo** |
| **El archivo es el correcto** | El `id_creativo` del nombre coincide con la fila | ↩️ **DEVUELTO** a ⑥A / ⑥B — motivo 3 |
| **Tiene copy y caption** | Están escritos y **literales** en su `ideas-<formato>.md` | ↩️ **DEVUELTO** a ④ — motivo 4. *"Un caption de curiosidad"* no es un caption |
| **No arrastra claims ⏸️** | La pieza no tiene `⏸️ PENDIENTE APROBACIÓN` de ④ | 🛑 **No entra al ciclo** hasta que ②B o ⑧B validen |
| **Existe la cuenta** | La `cuenta` concreta está identificada y alguien tiene las claves | 🛑 **BLOQUEADO** — ① § La capacidad |

**Una fila de ④ puede ser más de una publicación.** Si la misma pieza va a dos cuentas, son **dos
filas de Posting**, cada una con su `id` y su archivo.

## 3 · Las filas base

```
id,id_creativo,campana,canal,cuenta,formato,fecha,hora,archivo,caption_ok,specs_ok,estado
PO-001,CR-001,Lanzamiento,instagram-reels,@cafederiva,reel,2026-10-06,,cafederiva_..._v01.mp4,⬜,⬜,pendiente
```

| Columna | En esta capa |
|---|---|
| `id` | `PO-001`, correlativo del ciclo |
| `id_creativo` | 🛑 **Obligatorio.** Ninguna fila suelta |
| `campana` · `canal` · `formato` · `fecha` | **Heredados sin cambio** de ④ |
| `cuenta` | Se identifica acá; la asignación definitiva la cierra `po-programacion` |
| `hora` | Vacía todavía — es de la Capa 3 |
| `archivo` | El nombre exacto del export, o `⚠️ SIN ARCHIVO` |
| `caption_ok` · `specs_ok` | `⬜` — se llenan en las capas 1 y 2 |
| `estado` | `pendiente`, o `↩️ devuelto` |

## 4 · Lo que no sale, se declara

🛑 **Una pieza que desaparece en silencio es un hueco en el calendario que el cliente ve antes que
nosotros.**

```
| id_creativo | Qué falta          | De quién se espera | Desde cuándo | Motivo              |
| CR-003      | El carrusel export | ⑥A Diseño          | 2026-10-02   | ⚠️ SIN ARCHIVO      |
| CR-009      | Validación de claim| ②B Branding        | 2026-09-28   | ⏸️ PENDIENTE        |
```

## 5 · El resumen de recepción

Se cierra con la foto, que es lo primero que lee quien aprueba:

```
Filas del ciclo en ④:        [n]
Con archivo y publicables:   [n]
⚠️ SIN ARCHIVO:              [n]  → ⑥A [n] · ⑥B [n]
↩️ DEVUELTAS:                [n]  → ④ [n] · ⑥A [n] · ⑥B [n]
⏸️ Claims sin validar:       [n]
```

| Confianza | Cuándo |
|---|---|
| 🟢 | Todas las filas con archivo, copy y cuenta |
| 🟡 | Faltan piezas, pero todas identificadas con responsable y fecha |
| 🔴 | Falta un bloqueante de departamento: accesos, Gate 3 o guidelines |

---

## Control de calidad de la Capa 0

- [ ] El Excel de ④ tiene **Gate 3 aprobado** — si no, `BLOQUEADO`
- [ ] Se cruzó **fila por fila**, sin muestreo
- [ ] Toda fila tiene su **`id_creativo`**; ninguna fila suelta
- [ ] Cada archivo se verificó que **corresponde** a su pieza, no solo que existe
- [ ] Las piezas sin export están como `⚠️ SIN ARCHIVO` con **de quién se esperan y desde cuándo**
- [ ] 🛑 **Ninguna pieza con claim ⏸️ entró al ciclo**
- [ ] La **cuenta** de cada fila está identificada, y sabemos quién tiene las claves
- [ ] Las piezas que van a dos cuentas son **dos filas**, no una
- [ ] La tabla **§ Lo que no sale este ciclo** está escrita — ninguna pieza desapareció en silencio
- [ ] 🛑 **No se escribió ningún caption todavía** — eso es la Capa 1
