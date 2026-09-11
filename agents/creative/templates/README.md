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
| ⏸️ PENDIENTE APROBACIÓN | Claim, precio o promesa sin validar por ②B Branding o ⑧B Ads |
| BLOQUEADO | No se puede avanzar. Se nombra qué desbloquea |
| PENDIENTE | Se puede avanzar, falta completar |

**Nunca se borra una sección de la plantilla.** Si no aplica, se marca `N/A — [por qué]`.

## Las 31 columnas del Excel

```
id · campana · slot_origen · fecha · canal · formato · pilar · funcion · temperatura ·
awareness · objetivo_del_slot · goal_del_arte · emocion · mezcla · concepto · hook · guion · copy ·
layout_de_texto · escenas · encuadres · duraciones · referencia_visual · estetica_mood ·
elementos_graficos · audio_musica · hipotesis · aprobacion_claim · traza_a_must_be_true ·
handoff · estado
```

**Heredadas de ③ Marketing** (se copian, no se generan): `campana` `slot_origen` `canal` `formato`
`pilar` `funcion` `temperatura` `objetivo_del_slot` `traza_a_must_be_true` (del calendario y del plan
de campañas) y `awareness` (de la especificación de tipos de pieza)

**Derivadas por Creative:** `goal_del_arte` (de la función, vía la tabla de traducción), `fecha`
(el día concreto dentro de la `semana` del slot) y `mezcla` (la cubeta del patrón que sostiene la fila)

**Vocabularios cerrados:**
- `funcion` — Hero / Series / Proof / Utility / Conversion / Community
- `temperatura` — Frío / Tibio / Caliente / Cliente
- `awareness` — Unaware / Problem aware / Solution aware / Product aware / Most aware *(etiquetas literales de ③ Marketing §1.5 — no se abrevian)*
- `goal_del_arte` — alcance · memoria · valor-de-uso · confianza · accion · pertenencia *(derivado de la `funcion`)*
- `guion` — texto literal por tramo (`VO 0-3s: "..."`), o `N/A — formato estático sin voz`
- `hook` — pattern-interrupt / list-number / curiosity-gap / question / pain / bold-claim / story-tease
- `mezcla` — `70·probado` / `20·apuesta` / `10·propio` *(el reparto del ciclo cierra en 70/20/10 ±10 puntos)*
- `emocion` — una sola, en lenguaje del comprador (*"alivio — no soy el único que dudó"*). No es un adjetivo estético: eso es `estetica_mood`
- `escenas` / `encuadres` / `duraciones` — indexadas `E1 · E2 · E3…`, **mismo número de ítems y mismo orden en las tres**. En estáticos, las tres dicen `N/A — formato estático`. 🛑 **No se agrega un ítem `total`**: rompe la alineación y ⑤ Producción no puede partir la fila. La suma se calcula, no se escribe
- `elementos_graficos` — 4 familias de `toolkit/08`: `①` ilustraciones · `②` assets png · `③` texturas · `④` formas gráficas. Formato `familia · qué · para qué`. Máximo 3. Si no lleva: `ninguno · [por qué]`
- `aprobacion_claim` — N/A / pendiente-branding / pendiente-ads / aprobado
- `handoff` — `produccion-video` / `produccion-foto` / `diseno-grafico` / `posting-directo`
- `estado` — Idea / En dirección / Aprobada / En producción / Publicada / Medida

🛑 **Una fila sin `traza_a_must_be_true` se elimina.**
🛑 **Una fila con `guion` vacío se elimina** — en estáticos se escribe `N/A — formato estático sin voz`.
🛑 **Un `goal_del_arte` que contradice el `objetivo_del_slot` devuelve el slot a ③ Marketing.**
🛑 **Una fila sin `hipotesis` se elimina.**
🛑 **Una fila `PENDIENTE` no se libera a producción.**
🛑 **Una fila sin `campana` se devuelve a ③ Marketing** — ninguna idea existe fuera de una campaña.
🛑 **`escenas`, `encuadres` y `duraciones` con distinto número de ítems** = shot list roto: se corrige antes del handoff.
🛑 **Cualquier hex, tipografía, medida en píxeles, lente, locación concreta o casting en una celda** se borra: es de ⑥A Diseño o ⑤ Producción.
