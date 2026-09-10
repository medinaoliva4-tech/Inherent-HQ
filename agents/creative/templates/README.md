# Plantillas de Entregables

Se copian a `clients/<cliente>/` al iniciar. **No se editan acá.**

| Plantilla | Capa | Gate humano |
|---|---|---|
| `brief-creativo.md` | 0 | ✅ |
| `swipe-file.md` | 1 | — |
| `conceptos.md` | 2-3 | ✅ |
| `direccion-creativa.md` | 4-5 | — |
| `adaptacion-por-canal.md` | 6 | — |
| `ideas-de-contenido.csv` | 6 | ✅ |
| `aprendizaje-creativo.md` | 7 | — |

## Convenciones de marcado

| Marca | Significado |
|---|---|
| 🟢 | **Patrón** confirmado — 3+ piezas de **fuentes distintas** |
| 🟡 | Señal a confirmar — 1-2 apariciones, o 3+ de la misma fuente |
| ⚪ | Ruido — una aparición sin repetición |
| ⏱️ | **Señal de rendimiento** de una referencia — `⏱️60-90+d` / `⏱️30-60d` / `⏱️outlier` / `⏱️estable`. **Escala propia: no se mezcla con 🟢/🟡/⚪** |
| ⚠️ SIN DATOS | Falta el dato. Se nombra qué falta y cómo conseguirlo |
| ⏸️ PENDIENTE APROBACIÓN | Claim, precio o promesa sin validar por Branding/Growth |
| BLOQUEADO | No se puede avanzar. Se nombra qué desbloquea |
| PENDIENTE | Se puede avanzar, falta completar |

**Nunca se borra una sección de la plantilla.** Si no aplica, se marca `N/A — [por qué]`.

## Las 26 columnas del Excel

```
id · slot_origen · fecha · canal · formato · pilar · funcion · temperatura · awareness ·
objetivo_del_slot · goal_del_arte · concepto · hook · guion · copy · layout_de_texto ·
composicion_encuadre · referencia_visual · estetica_mood · elementos_graficos · audio_musica ·
hipotesis · aprobacion_claim · traza_a_must_be_true · handoff · estado
```

**Heredadas de Strategy** (se copian, no se generan): `slot_origen` `canal` `formato` `pilar`
`funcion` `temperatura` `objetivo_del_slot` `traza_a_must_be_true` (del calendario) y `awareness`
(de `estrategia-de-contenido.md` §6.6)

**Derivadas por Creative:** `goal_del_arte` (de la función, vía la tabla de traducción) y `fecha`
(el día concreto dentro de la `semana` del slot)

**Vocabularios cerrados:**
- `funcion` — Hero / Series / Proof / Utility / Conversion / Community
- `temperatura` — Frío / Tibio / Caliente / Cliente
- `awareness` — Unaware / Problem aware / Solution aware / Product aware / Most aware *(etiquetas literales de Strategy §1.5 — no se abrevian)*
- `goal_del_arte` — alcance · memoria · valor-de-uso · confianza · accion · pertenencia *(derivado de la `funcion`)*
- `guion` — texto literal por tramo (`VO 0-3s: "..."`), o `N/A — formato estático sin voz`
- `hook` — pattern-interrupt / list-number / curiosity-gap / question / pain / bold-claim / story-tease
- `aprobacion_claim` — N/A / pendiente-branding / pendiente-growth / aprobado
- `handoff` — production-foto / production-video / production-diseno / content
- `estado` — Idea / En dirección / Aprobada / En producción / Publicada / Medida

🛑 **Una fila sin `traza_a_must_be_true` se elimina.**
🛑 **Una fila con `guion` vacío se elimina** — en estáticos se escribe `N/A — formato estático sin voz`.
🛑 **Un `goal_del_arte` que contradice el `objetivo_del_slot` devuelve el slot a Strategy.**
🛑 **Una fila sin `hipotesis` se elimina.**
🛑 **Una fila `PENDIENTE` no se libera a producción.**
