# Skills de Producción

Cada bloque del workflow es **un paso y además una skill**. Se corren en orden; cada una se
puede invocar suelta si ya existe el input de la anterior.

```
pr-brief → pr-desglose → pr-jornadas → pr-recursos → pr-presupuesto → pr-rodaje → pr-entrega → pr-loop
```

**Puerta de entrada:** `produccion` — clasifica el pedido y dirige a la skill correcta.
Nunca se produce un entregable de Producción sin pasar por ahí.

## Las skills

| # | Skill | Qué hace | Input que necesita |
|---|---|---|---|
| **P0** | `pr-brief` | Qué se aprobó producir y qué ya existe. Declara los tres techos. **Bloquea sin gate del Excel** | `ideas-de-contenido.csv` aprobado |
| **P1** | `pr-desglose` | Cada escena en 8 categorías: locación, talento, producto, props, vestuario, arte, equipo, permisos | `pr-brief` |
| **P2** | `pr-jornadas` | Agrupa en jornadas y declara el factor de consolidación. **Obligatoria antes de costear** | `pr-desglose` |
| **P3** | `pr-recursos` | Origen, responsable, fecha, semáforo y plan B por dependencia externa | `pr-jornadas` |
| **P4** | `pr-presupuesto` | Costo por jornada, contingencia y el CSV de 29 columnas. 🚦 **gate** | `pr-jornadas` + `pr-recursos` |
| **P5** | `pr-rodaje` | Un call sheet por jornada, con nomenclatura definida antes de grabar. 🚦 **gate** | `pr-presupuesto` aprobado |
| **P6** | `pr-entrega` | Cobertura, backup doble, selects y el manifiesto contra el Excel. 🚦 **gate** | el rodaje hecho |
| **P7** | `pr-loop` | Desvío real de costo y tiempo, y la corrección de la capacidad declarada | el ciclo cerrado |

---

## Cómo se usan

1. El agente lee `../WORKFLOW.md` **completo** al arrancar.
2. Declara el **plan contratado** (`WORKFLOW.md` §3). Sin eso no sabe hasta dónde llega.
3. Corre los bloques **en orden**. Cada skill abre su `SKILL.md` y lo sigue entero.
4. Si falta el input de un bloque, **se corre el anterior**. Nunca se improvisa el faltante.
5. Cierra con los entregables de `../WORKFLOW.md` §7. **Cada agente entrega lo suyo**, con su
   propio formato — no hay skill de entrega compartida.

**No se inventan skills nuevas sobre la marcha.** Si un procedimiento se repite lo suficiente
como para merecer una, se propone a Allan primero.
