---
name: cr-adaptacion
description: >
  Capa 6 del método de Creatividad — adaptación por plataforma y ensamblado del Excel. Multiplica un
  concepto core en varias filas, una por canal con slot, con las specs y el tono que premia cada
  plataforma, y ensambla el entregable definitivo: ideas-de-contenido.csv con sus 26 columnas,
  su hipótesis y su traza a MUST BE TRUE. Úsala cuando pidan "adaptalo a los otros canales",
  "armá el Excel", "el calendario de contenido lleno", "repurposing". Adaptar, no copiar-pegar:
  publicar lo mismo idéntico en todos lados el algoritmo lo penaliza.
---

# Capa 6 — Multiplicación y Excel

Leé `agents/creative/METHOD.md` sección **CAPA 6** + `toolkit/07-plataformas.md`.
Plantillas: `templates/adaptacion-por-canal.md` + `templates/ideas-de-contenido.csv`

**Input obligatorio:** `direccion-creativa.md` + los slots del `calendario-estrategico.csv`.

## 6.1 — Un concepto → N filas
```
1 CONCEPTO CORE
   ├── TikTok      más crudo y veloz, hook en 2s, audio en tendencia, <60s
   ├── Reel        mejor factura + texto on-screen, 7-30s, sin watermark
   ├── Short       tono how-to, título con keyword, <30s
   ├── Carrusel    el guion roto en slides, 1 idea por slide
   └── Estático    la frase más fuerte como quote
```

| Se conserva siempre | Cambia |
|---|---|
| El concepto · el insight y el arco · **la promesa** · el activo distintivo · `traza_a_must_be_true` | Duración y ritmo · factura visual · tono · audio y texto en pantalla · el CTA si cambia la etapa |

🛑 **Solo se multiplica hacia canales que tienen slot** en el calendario. Un canal sin slot no existe
para Creative — agregarlo es pisar la Capa 7 de Strategy.

## 6.2 — Qué cambia por canal

| Canal | Qué premia | Specs |
|---|---|---|
| **TikTok** | Watch time y completion | <60s · hook en **2s** · 9:16 · audio en tendencia |
| **Reels** | Factura visual y relación con seguidores | 7-30s · 9:16 · 1080×1920 · 🛑 **sin watermark** |
| **Shorts** | Educativo / how-to y autoridad del canal | <30s ideal · título con keyword |
| **Carrusel** | Profundidad y guardados | 4:5 o 1:1 · 5-8 slides · slide 1 = hook |
| **Estático** | Una frase que se sostiene sola | 4:5 o 1:1 · legible en el feed comprimido |

Tabla completa por canal: `toolkit/07-plataformas.md`.

## 6.3 — Ensamblar el Excel: las 26 columnas
```
id · slot_origen · fecha · canal · formato · pilar · funcion · temperatura · awareness ·
objetivo_del_slot · goal_del_arte · concepto · hook · guion · copy · layout_de_texto ·
composicion_encuadre · referencia_visual · estetica_mood · elementos_graficos · audio_musica ·
hipotesis · aprobacion_claim · traza_a_must_be_true · handoff · estado
```

**Heredadas de Strategy** (se copian, no se generan): `slot_origen` `canal` `formato` `pilar`
`funcion` `temperatura` `awareness` `objetivo_del_slot` `traza_a_must_be_true`.
**Derivadas por Creative:** `goal_del_arte` (de la función) y `fecha` (el día dentro de la semana).
**Producidas por Creative:** `concepto` `hook` `guion` `copy` `layout_de_texto`
`composicion_encuadre` `referencia_visual` `estetica_mood` `elementos_graficos` `audio_musica`
`hipotesis`.

Vocabularios cerrados y valores válidos: `templates/README.md`.
Qué skill produce cada columna: `CORRELACION.md` ⑥.

## 6.4 — La hipótesis
Cada fila declara **qué se está probando y qué resultado lo confirmaría**. Sin hipótesis escrita la
pieza no genera aprendizaje y la Capa 7 no tiene nada que leer.

## Regla de trazabilidad (obligatoria)
```
Fila → Slot → Sistema → Campaña → Mecanismo → Trabajo estratégico → Objetivo → MUST BE TRUE
```
Si una fila no se puede trazar hacia atrás, **se elimina**. La pregunta correcta es:
*¿por qué estamos haciendo esta pieza?*

## Reglas duras
- 🛑 **Toda fila sin `traza_a_must_be_true` se elimina.**
- 🛑 **Toda fila sin `hipotesis` se elimina.**
- 🛑 **Una fila `PENDIENTE` no se libera a producción.** O se completa, o se saca del bloque y se declara.
- **Ninguna pieza idéntica en dos canales.** Cada fila tiene sus specs.
- **Sin watermark**, declarado. Watermark de otra app = alcance muerto.
- **Hook temprano en todas** — 2s en TikTok.
- **Ningún par de canales comparte `funcion`**, y ningún canal recibe una función que
  `contenido-por-canal.md` no le asigne (Strategy §6.4). Si pasó, se devuelve el slot.
- **El "qué NO se hace acá"** de cada canal se respeta en todas sus filas.
- **El total de filas cabe en la capacidad de producción real.** El repurposing ahorra ideación,
  **no producción**.
- **El tono cambia al adaptar; la promesa no.**
- `handoff` declarado por fila: `production-foto` / `production-video` / `production-diseno` / `content`.

## Cierre
Correr el bloque **Capa 6** de `qa/QA-GATES.md`.
🚦 **GATE 3** — el lead revisa el Excel antes del handoff. **Nada se libera a producción sin esta
revisión.** Recordá: *la calidad del hand-off es la calidad del Excel.*

## Handoff
Emitir el bloque HANDOFF de `PROCESS.md` → Production (foto · video · diseño) y Content (armado y
QA final). El Excel **es la interfaz**: si Production tiene que preguntar algo, el brief estaba
incompleto — y eso se corrige en el brief, no por chat.
