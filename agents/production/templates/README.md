# Plantillas — Agente de Producción

Se **copian** a `clients/<cliente>/` y se completan ahí. Nunca se editan las plantillas mismas.

| Plantilla | Capa | Entregable |
|---|---|---|
| `brief-de-produccion.md` | 0 | Qué se aprobó producir, y qué se devuelve |
| `desglose.md` | 1 | Las 8 categorías por escena |
| `plan-de-jornadas.md` | 2 | Agrupación, orden de tiro y factor |
| `recursos.md` | 3 | Origen, responsable, semáforo, riesgo y plan B |
| `plan-de-produccion.csv` | 1-4 | **El entregable definitivo** |
| `call-sheet.md` | 5 | Uno por jornada |
| `entrega.md` | 6 | El manifiesto cruzado |
| `aprendizaje-de-produccion.md` | 7 | Desvíos reales y correcciones |

## Marcado

| Marca | Significado |
|---|---|
| 🟢 | Confirmado — con responsable y fecha |
| 🟡 | Gestionando — pedido, sin confirmar |
| 🔴 | En riesgo — sin alternativa identificada |
| ⚠️ SIN DATOS | Falta el dato. Se nombra qué falta y a quién pedírselo |
| ⏸️ PENDIENTE APROBACIÓN | Gasto que excede lo aprobado |
| ↩️ DEVUELTO | Escena devuelta a ④ Creatividad, con motivo y alternativa |
| BLOQUEADO | No se puede avanzar |
| PENDIENTE | Se puede avanzar, falta completar |

**Nunca se borra una sección de la plantilla.** Si no aplica, se marca `N/A — [por qué]`.

## Las 29 columnas del Excel

```
id · id_creativo · campana · escena · accion · encuadre · duracion_s · tipo · tipo_de_lugar ·
locacion · talento · producto · props · vestuario · arte_ambientacion · equipo · permisos ·
jornada · orden_en_jornada · tiempo_estimado_min · origen_del_recurso · responsable ·
costo_estimado · costo_real · riesgo · plan_b · archivo_entregado · destino · estado
```

**Una fila = una escena**, no una pieza. Una pieza de ④ Creatividad con 3 escenas son 3 filas acá.

**Heredadas de ④ Creatividad** (se copian literales, no se parafrasean): `id_creativo` `campana`
`escena` `accion` `encuadre` `duracion_s` `tipo_de_lugar`

**Vocabularios cerrados:**
- `tipo` — `video` / `foto` / `audio` / `captura`
- `origen_del_recurso` — `propio` / `prestado` / `alquilado` / `comprado` / `a-producir`
- `jornada` — `J0` (sin rodaje: capturas, placas, post) · `J1`, `J2`… (jornadas de rodaje)
- `destino` — `video-editing` (todo lo filmado y el audio) / `diseno-grafico` (foto y capturas estáticas) / `posting-directo`
- `estado` — `Planificada` / `Confirmada` / `Grabada` / `Entregada` / `Descartada` / `↩️ DEVUELTA`

**Formatos:**
- `duracion_s` — segundos de la **pieza**. `tiempo_estimado_min` — minutos de **set**. No son lo mismo
- `costo_estimado` y `costo_real` — número + moneda + **fecha de cotización**
- `archivo_entregado` — `<cliente>_<campana>_<id_creativo>_<escena>_<tipo>_<take>.<ext>`

🛑 **Una fila sin `id_creativo` se elimina** — es presupuesto sin justificación.
🛑 **Una escena que no está en el Excel no se graba.**
🛑 **`costo_real` se carga siempre**, aunque coincida con el estimado.
🛑 **Las escenas de `J0` no cuentan para el factor de consolidación.**
🛑 **Toda escena con dependencia externa lleva `riesgo` y `plan_b` antes de la jornada.**
