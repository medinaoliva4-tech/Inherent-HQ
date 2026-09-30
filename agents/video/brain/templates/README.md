# Plantillas de Entregables — Video

Se copian a `projects/<cliente>/<proyecto>/` al iniciar. **No se editan acá.**

| Plantilla | Fase | Gate humano |
|---|---|---|
| `brief-de-video.md` | 0 | ✅ |
| `analisis-de-material.md` | 1 | — |
| `plan-de-edicion.md` | 2-3 | ✅ |
| `edit-decision-list.csv` | 3 | — |
| `qc-entrega.md` | 5 | ✅ |
| `brand-guideline-video.md` | referencia | — (lo cierra Branding) |

## Convenciones de marcado

| Marca | Significado |
|---|---|
| 🟢 | Usable tal cual |
| 🟡 | Usable con arreglo — se nombra el arreglo |
| 🔴 | Descarte — se nombra el motivo |
| ⚠️ FALTA MATERIAL | No existe el plano. Se nombra qué falta y para qué beat |
| ⚠️ SIN GUIDELINE | No hay guideline de marca. Se declara qué se asumió |
| ⚠️ SIN TRANSCRIPCIÓN | No se pudo transcribir. El análisis es solo visual |
| `[GENERADO — <herramienta>]` | Plano creado con IA. Siempre declarado |
| BLOQUEADO | No se puede avanzar. Se nombra qué desbloquea |
| PENDIENTE | Se puede avanzar, falta completar |

**Nunca se borra una sección de la plantilla.** Si no aplica, se marca `N/A — [por qué]`.

## Columnas de la EDL

`beat · orden · tc_in · tc_out · duracion · fuente · tc_fuente_in · tc_fuente_out · capa ·
tipo_de_corte · disciplina · audio · grafica · nota · estado`

- **capa:** A-roll / B-roll / gráfica / overlay / generado
- **tipo_de_corte:** corte directo / J-cut / L-cut / match cut / jump cut / speed ramp / disolvencia
- **disciplina:** una de las 14 de `DISCIPLINAS.md`
- **estado:** ⬜ pendiente · 🔁 en revisión · ✅ cerrado

Una fila sin `beat` asignado se elimina: no pertenece al plan.

## Nomenclatura de versiones

```
<cliente>_<proyecto>_v01roughcut.mp4      corte narrativo
<cliente>_<proyecto>_v02picturelock.mp4   ritmo + b-roll — la estructura ya no cambia
<cliente>_<proyecto>_v03online.mp4        vfx + color + audio
<cliente>_<proyecto>_v04master_9x16.mp4   gráfica + master, por formato
```

**Nunca se sobrescribe una versión.**
