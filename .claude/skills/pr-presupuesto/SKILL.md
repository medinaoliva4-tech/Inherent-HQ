---
name: pr-presupuesto
description: >
  Capa 4 del método de Producción — cuesta el ciclo por jornada (no por pieza), separa los 5 bloques
  de costo, aplica contingencia visible según el perfil del rodaje, calcula el costo por pieza y
  verifica contra el presupuesto disponible. Si no entra, presenta tres opciones con su impacto para
  que decida un humano. Ensambla el entregable definitivo, plan-de-produccion.csv con sus 29
  columnas. Úsala cuando pidan "cuánto cuesta", "presupuestá esto", "no nos alcanza, qué hacemos".
  Requiere la Capa 2 hecha: presupuestar sin consolidar se rechaza.
---

# Capa 4 — Presupuesto

Leé `agents/production/METHOD.md` sección **CAPA 4** + `toolkit/06-presupuesto.md`. Plantilla:
`templates/plan-de-produccion.csv`.

## La regla que se rechaza sin excepción
🛑 **No se presupuesta sin Capa 2 hecha**, aunque lo pidan directo. Un presupuesto sin consolidar
está inflado entre 3 y 5 veces, y si se aprueba, ese número se vuelve la referencia del cliente para
siempre. Decílo así y ofrecé correr la Capa 2 primero.

## Se cuesta por jornada, no por pieza
Costear por pieza duplica todos los fijos.

| Bloque | Qué entra | Se cuesta por |
|---|---|---|
| **1 · Fijos de jornada** | Locación · equipo · traslado · catering · asistencia | Jornada |
| **2 · Talento** | Honorarios · cesión · uso en pauta | Jornada por persona |
| **3 · Variables por escena** | Props · vestuario · producto consumido · arte | Escena |
| **4 · Post base** | Backup · descarga · selects · transcodificación | Jornada |
| **5 · Contingencia** | % declarado, **línea propia** | Total |

🛑 **Post base ≠ edición.** Ordenar, respaldar y marcar selects es de Producción. Montar, corregir
color, montar y exportar es de ⑥A Diseño y ⑥B Video Editing, y va en su presupuesto.

## Contingencia

| Perfil | % |
|---|---|
| Interior controlado, talento propio, producto disponible | **10 %** |
| Mezcla interior/exterior, o talento externo | **15 %** |
| Exterior con clima, permisos pendientes, o producto `a-producir` | **20-25 %** |

🛑 **Como línea propia y visible.** Escondida dentro de los ítems se gasta sin que nadie note que se
gastó, y al cierre no se sabe si el desvío fue real o fue contingencia consumida.

## Costo por pieza — se calcula
```
costo por pieza = (fijos de su jornada ÷ piezas de esa jornada) + variables propias
```
Es el número que vuelve a ③ Marketing. **El costo por pieza no baja negociando proveedores: baja
consolidando.**

## Si no entra — las 3 opciones

| Opción | Qué se toca | Quién decide |
|---|---|---|
| **Reagrupar** | Volver a Capa 2 | Producción sola puede |
| **Recortar filas** | Las de menor `traza_a_must_be_true` | **③ Marketing** |
| **Bajar especificación** | Locación más simple, menos talento/equipo | **④ Creatividad** si toca encuadre, acción o duración |

🛑 **Producción nunca elige sola qué pieza se cae.** Propone; deciden ③ y ④.

## El Excel — 29 columnas
```
id · id_creativo · campana · escena · accion · encuadre · duracion_s · tipo · tipo_de_lugar ·
locacion · talento · producto · props · vestuario · arte_ambientacion · equipo · permisos ·
jornada · orden_en_jornada · tiempo_estimado_min · origen_del_recurso · responsable ·
costo_estimado · costo_real · riesgo · plan_b · archivo_entregado · destino · estado
```
Una fila = **una escena**. Toda fila sin `id_creativo` se elimina. Todo número con moneda y **fecha
de cotización**.

## 🚦 GATE 1
El presupuesto lo aprueba un humano **antes de comprometer un solo recurso**: ni reserva, ni
convocatoria, ni compra.

## QA
`agents/production/qa/QA-GATES.md` → bloque **Capa 4**.

## Siguiente
→ `pr-rodaje` (Capa 5)
