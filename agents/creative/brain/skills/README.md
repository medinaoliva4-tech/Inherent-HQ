# Skills de Creatividad

Cada bloque del workflow es **un paso y además una skill**. Se corren en orden; cada una se
puede invocar suelta si ya existe el input de la anterior.

```
cr-brief → cr-swipe-file → cr-big-idea → cr-storytelling → cr-hook-copy → cr-arte-video → cr-adaptacion → cr-loop
```

**Puerta de entrada:** `creatividad` — clasifica el pedido y dirige a la skill correcta.
Nunca se produce un entregable de Creatividad sin pasar por ahí.

## Las skills

| # | Skill | Qué hace | Input que necesita |
|---|---|---|---|
| **C0** | `cr-brief` | Traduce el plan a brief ideable: goal del arte y etapa del funnel por slot. **Bloquea sin calendario** | `MARKETING.md` + `MARCA.md` |
| **C1** | `cr-swipe-file` | Referencias filtradas por longevidad y outliers. Extrae **el patrón, nunca la imagen** | `cr-brief` |
| **C2** | `cr-big-idea` | 3 BIG IDEAS de una frase, se elige 1. Filtro D/N/R. 🚦 **gate** | `cr-swipe-file` |
| **C3** | `cr-storytelling` | El cliente es el héroe, la marca el guía. En pieza corta, el problema interno | `cr-big-idea` |
| **C4** | `cr-hook-copy` | Hook de las 7 cajas, HOOK-BODY-PAYOFF y el copy literal | `cr-storytelling` |
| **C5** | `cr-arte-video` | Layout de texto, foco único, safe zones, y el shot list de 8 propiedades | `cr-hook-copy` |
| **C6** | `cr-adaptacion` | Una idea → varias filas por canal, y el Excel de 31 columnas. 🚦 **gate** | `cr-arte-video` |
| **C7** | `cr-loop` | El 20: veredicto por goal del arte, patrones ganadores y fatiga | el ciclo publicado |

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
