---
name: pr-desglose
description: >
  Capa 1 del método de Producción — convierte cada escena creativa en la lista concreta de cosas que
  hay que conseguir, con las 8 categorías: locación, talento, producto, props, vestuario, arte y
  ambientación, equipo técnico y permisos. Parte cada fila creativa en una fila de producción por
  escena, que es la unidad que después se agrupa y se cuesta. Úsala cuando pidan "qué hace falta para
  grabar esto", "desglosá estas piezas", "qué props necesitamos", "qué permisos hay que sacar".
  Requiere el brief de Capa 0 hecho.
---

# Capa 1 — Desglose

Leé `agents/production/METHOD.md` sección **CAPA 1** + `toolkit/01-desglose.md`. Plantilla:
`templates/desglose.md`.

## Qué hacés
**Traducís** una escena escrita en una lista de cosas que alguien tiene que conseguir. Es la
traducción central del departamento.

## La regla estructural
**Una fila creativa = N filas de producción.** Una pieza con 3 escenas son 3 filas acá, porque la
escena es lo que se agrupa, se cuesta y se graba.

```
C-001 (1 pieza, 3 escenas) → P-001 · P-002 · P-003
```

El vínculo `id_creativo` + `escena` **nunca se rompe**: es lo que permite volver de un archivo
entregado hasta la MUST BE TRUE que lo justificó.

## Qué se hereda y qué se decide

| Se hereda **literal** de ④ (no se parafrasea) | Lo decidís vos |
|---|---|
| `accion` · `encuadre` · `duracion_s` · `tipo_de_lugar` | `locacion` concreta · `talento` · `producto` · `props` · `vestuario` · `arte_ambientacion` · `equipo` · `permisos` |
| `estetica_mood` → define la **luz** | Qué luz concreta la produce |
| `emocion` → define la **dirección de actor** | Qué se le dice al talento en set |

## Las 8 categorías — ninguna se omite
Locación · Talento · Producto · Props · Vestuario · Arte y ambientación · Equipo técnico · Permisos
y legales. Lo que no aplica dice `N/A`, **nunca vacío**: una categoría vacía es ambigua, y esa
ambigüedad se descubre el día del rodaje.

## Reglas duras
- 🛑 **No se agrega ninguna escena** que ④ no haya pedido. Si falta una, se **devuelve** para que la
  agregue ella: una escena agregada acá no tendría `traza_a_must_be_true`.
- 🛑 **Toda fila lleva `id_creativo`.** Sin él se elimina.
- Los props se listan **uno por uno**. *"Ambientación de oficina"* no es un prop.
- Lo que se destruye en cuadro: **mínimo 3 unidades**.
- Vestuario: **sin logos de terceros, sin rayas finas, sin verde si hay croma**.
- **Toda persona identificable necesita cesión**, incluidas las de fondo.
- El `equipo` se **deriva del `encuadre`** (`toolkit/04`), no se elige por gusto.

## QA
`agents/production/qa/QA-GATES.md` → bloque **Capa 1**.

## Siguiente
→ `pr-jornadas` (Capa 2)
