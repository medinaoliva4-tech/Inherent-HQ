# 07 — Adaptación por Plataforma
`Capa 6 · columna: audio_musica` *(y las specs del `formato` heredado)*

## Qué decide

Cómo vive **una misma idea** en cada canal. El principio es uno:

> **Adaptar, no copiar-pegar.** La misma idea rinde en todas las plataformas, pero cada una pide algo
> distinto — y publicar lo mismo idéntico en todos lados el algoritmo lo penaliza.

---

## La taxonomía — qué premia cada canal

| Canal | Qué premia | Versión que se hace | Specs |
|---|---|---|---|
| **TikTok** | Watch time y completion | Más cruda y veloz, montada sobre un sonido del momento | **<60s** · hook en **2s** · 9:16 · audio en tendencia |
| **Instagram Reels** | Factura visual y relación con seguidores | La de mejor acabado, con texto on-screen | **7-30s** · 9:16 · 1080×1920 · 🛑 **sin watermark** |
| **YouTube Shorts** | Lo educativo / how-to y la autoridad del canal | Tono how-to, título buscable | **<30s** ideal · 9:16 · título con keyword |
| **Carrusel (IG / LinkedIn)** | Profundidad y guardados | El guion roto en slides, 1 idea por slide | 4:5 o 1:1 · 5-8 slides · slide 1 = hook |
| **Story** | Inmediatez y cercanía | La versión más informal, con interacción | 9:16 · 15s por card · safe zones arriba y abajo |
| **Post estático** | Una frase que se sostiene sola | Una línea fuerte del guion como quote | 4:5 o 1:1 · legible en el feed comprimido |
| **Google Business / mapas** | Captura en el momento de decisión | Foto real + información útil, cero producción | Foto horizontal · texto corto |
| **Email / lista** | Relación directa, cero algoritmo | La versión larga, con la explicación completa | Asunto <50 caracteres · 1 CTA |

🛑 **Watermark de otra app = alcance muerto.** Se declara en el brief de cada fila.

---

## El repurposing: 1 concepto → N piezas

Acá se multiplica el output **sin multiplicar el trabajo**.

```
1 CONCEPTO CORE
   ├── TikTok      45s, ritmo rápido, audio en tendencia, hook en 2s
   ├── Reel        30s, misma idea con mejor factura + texto on-screen, sin watermark
   ├── Short       25s, tono educativo, título con keyword
   ├── Carrusel    los 3 puntos del guion en 5 slides
   └── Estático    la frase más fuerte del guion como quote
```

**Qué se conserva y qué cambia:**

| Se conserva | Cambia |
|---|---|
| El `concepto` (la BIG IDEA) | La duración y el ritmo |
| El insight y el arco | El nivel de factura visual |
| La promesa | El tono (más crudo / más pulido / más how-to) |
| El activo distintivo | El audio y el texto en pantalla |
| El `traza_a_must_be_true` | El CTA, si el slot cambia de etapa |

---

## Reglas duras

1. **Solo se multiplica hacia canales que tienen slot** en el calendario. Un canal sin slot no existe
   para Creative — agregarlo es pisar la ③ Marketing.
2. **Nunca la misma pieza idéntica en dos canales.** Cada fila del Excel tiene sus specs.
3. **Sin watermark.** Se declara explícitamente en el brief.
4. **Hook temprano en todas** — y en TikTok, a los 2s.
5. **Cada canal mantiene la función única que le asignó ③ plan por canal** (③ Marketing §6.4).
   Si **dos canales comparten `funcion`**, o un canal recibe una función que ese archivo no le
   asigna, se devuelve el slot a ③ Marketing. Y el **"qué NO se hace acá"** de cada canal se respeta.
6. **El número de adaptaciones cabe en la capacidad de producción** (① núcleo C/D). El repurposing
   ahorra ideación, no producción.
7. **Cada fila adaptada conserva la traza.** Cinco filas de un concepto trazan a la misma
   MUST BE TRUE.

---

## Ejemplo trabajado

**Concepto core:** *"El primer segundo es donde se muere tu contenido."* · `traza=A`

| Canal | Slot | Duración | Ajuste | `audio_musica` |
|---|---|---|---|---|
| **TikTok** | s1 · Hero · Frío | 45s | Ritmo rápido, cortes cada 2s, hook a los 2s | Sonido en tendencia |
| **Reel** | s1 · Hero · Frío | 30s | Mejor factura, texto on-screen, sin watermark | Música de librería + voz directa |
| **Short** | s2 · Utility · Tibio | 25s | Tono how-to, título con keyword *"hook para reels"* | Voz directa, sin música |
| **Carrusel IG** | s2 · Utility · Tibio | 5 slides | Los 3 ejemplos, uno por slide | — |
| **Estático** | s3 · Series · Frío | 1 imagen | La frase del hook como quote | — |

**5 filas del Excel, 1 concepto, 1 traza.** ✅ Ningún canal duplica función · ✅ cabe en capacidad.

---

## Anti-patterns

| Error | Por qué falla |
|---|---|
| Publicar la misma pieza idéntica en todos lados | El algoritmo lo penaliza y no aprovecha lo que premia cada canal |
| Dejar el watermark | Alcance muerto en Reels |
| Ignorar las specs del canal | La pieza se recorta, el texto se tapa, el video se comprime mal |
| Adaptar a un canal sin slot | Se produce contenido que nadie pidió y no traza a nada |
| Multiplicar sin mirar la capacidad de producción | El bloque no se produce y el calendario queda con huecos |
| Cambiar la promesa al adaptar el tono | El tono cambia; la promesa no |
| Un concepto → 1 sola pieza, siempre | Se desperdicia el trabajo de ideación |

---

## Qué columnas del Excel llena

`audio_musica`, y las **specs** del `formato` que el calendario ya fijó (duración, ratio, resolución).
**Es la capa que multiplica filas:** un concepto entra, N filas salen.
**No elige el `formato`:** es heredado (única excepción: el caso `🟡 propuesto por Creative` de
`playbooks/TRADUCCION-DE-SLOT.md`).
