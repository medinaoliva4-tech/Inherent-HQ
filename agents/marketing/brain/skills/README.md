# Skills de Marketing

Cada bloque del workflow es **un paso y además una skill**. Se corren en orden; cada una se
puede invocar suelta si ya existe el input de la anterior.

```
mk-handoff → mk-research-comercial → mk-plan → mk-campanas → mk-calendario-comercial → mk-volumen-presupuesto → mk-lectura
```

**Puerta de entrada:** `marketing` — clasifica el pedido y dirige a la skill correcta.
Nunca se produce un entregable de Marketing sin pasar por ahí.

## Las skills

| # | Skill | Qué hace | Input que necesita |
|---|---|---|---|
| **M0** | `mk-handoff` | La aduana: verifica qué dejaron Strategy y Branding y declara faltantes. **Bloquea sin gate** | la estrategia aprobada |
| **M1** | `mk-research-comercial` | Qué se vende en la categoría, cuándo y a qué costo. Avatares con su consciencia | `mk-handoff` |
| **M2-M3** | `mk-plan` | De dónde sale el número, con supuestos declarados, y el mix de canales | `mk-research-comercial` |
| **M4** | `mk-campanas` | Las campañas orgánicas y pautadas, con ficha completa. 🚦 **gate** | `mk-plan` |
| **M5** | `mk-calendario-comercial` | Fechas reales, con su fecha de preparación calculada hacia atrás | `mk-campanas` |
| **M6** | `mk-volumen-presupuesto` | Cuántas piezas por día y formato, contra el techo del plan. Y el presupuesto | `mk-campanas` + `mk-calendario-comercial` |
| **M7** | `mk-lectura` | El 20: veredicto por función declarada, y qué se itera cambiando una variable | el ciclo corrido |

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
