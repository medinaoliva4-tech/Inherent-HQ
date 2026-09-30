---
name: po-specs
description: >
  Capa 2 de ⑦ Posting — el QA técnico antes de cargar. Verifica que cada archivo de ⑥A y ⑥B cumpla la
  spec de su plataforma: aspecto, duración, peso, safe zones, audio, ausencia de watermark de otra
  app, y que el caption y los hashtags entren en el límite. Lo que no cumple se DEVUELVE a ⑥A o ⑥B —
  nunca se arregla acá. Escribe la columna `specs_ok` y el bloque de QA de cada sección de
  `publicaciones.md`. Úsala cuando pidan "revisá los archivos", "¿esto cumple?", "¿entra en Reels?",
  "¿por qué se ve cortado?", "hacé el QA antes de cargar". Requiere la Capa 0 hecha.
---

# Capa 2 · Specs — ¿el archivo cumple?

| | |
|---|---|
| **Consume** | Las filas con archivo de `calendario-de-publicacion.csv` · los captions de la Capa 1 · los exports de ⑥A y ⑥B |
| **Produce** | La columna **`specs_ok`** + el **bloque de QA** de cada sección de `publicaciones.md` · las devoluciones a ⑥A / ⑥B |

Contexto del departamento: `agents/posting/WORKFLOW.md`.

## 1 · 🛑 Verificar no es arreglar

**Lo que no cumple se devuelve. Nunca se arregla acá.**

| ❌ Lo que no se hace | ✅ Lo que se hace |
|---|---|
| Recortar el video a 9:16 | ↩️ Devolver a ⑥B — motivo 2 |
| Comprimir para que baje de peso | ↩️ Devolver a ⑥B — motivo 2 |
| Mover el texto de la pieza | ↩️ Devolver a ⑥A — motivo 2 |
| Reexportar en otro formato | ↩️ Devolver a quien lo exportó |

> Recortar un Reel en Posting significa que **nadie revisó la composición contra lo que pidió ④**. El
> encuadre que ④ especificó y ⑥B compuso se rompe en un recorte automático, y se descubre publicado.

**Excepción, la única:** el archivo está bien y solo falta **renombrarlo** según la nomenclatura. Eso
sí se hace acá, y se anota.

## 2 · El checklist, pieza por pieza

| Chequeo | Qué se mira | Si falla |
|---|---|---|
| **Aspecto** | Coincide con el formato de destino | ↩️ ⑥A / ⑥B |
| **Duración** | Dentro del límite de la plataforma | ↩️ ⑥B |
| **Peso** | Sube sin que la plataforma lo recomprima al mínimo | ↩️ ⑥B |
| **Safe zones** | Nada de texto ni logo bajo la UI de la plataforma | ↩️ ⑥A / ⑥B |
| **Watermark** | 🛑 Ninguna marca de otra app | ↩️ ⑥B — **alcance muerto** |
| **Audio** | Existe, está sincronizado y tiene volumen audible | ↩️ ⑥B |
| **Caption** | Entra en el límite y el hook sobrevive al corte | ← Capa 1 |
| **Hashtags** | Dentro del máximo de la plataforma | ← Capa 1 |
| **Alt text** | Escrito | ← Capa 1 |
| **Claims** | Todos aprobados | 🛑 **No se carga** |

### Aspecto — lo estable

Los aspectos casi no cambian y son los que más errores causan:

| Formato | Aspecto | Nota |
|---|---|---|
| Reel · Story · TikTok · Short | **9:16** vertical | El más pedido y el que más llega mal |
| Feed vertical | **4:5** | El que más alto ocupa en el feed sin ser Reel |
| Feed cuadrado | **1:1** | |
| Feed horizontal | **1,91:1** | |

🛑 **Un 1:1 subido como Reel se ve con bandas o se recorta solo.** Es el error más común y el más
visible.

### Duración y peso — 🛑 se verifican, no se recuerdan

| Dato | Estado |
|---|---|
| Duración máxima de Reels, TikTok, Shorts y Stories | ⚠️ **A VERIFICAR cada ciclo.** Las plataformas las mueven seguido — Reels en particular cambió varias veces |
| Peso máximo por archivo | ⚠️ **A VERIFICAR** |

**Cómo se verifica:** en la página de especificaciones de la plataforma, o en la plantilla vigente de
Publer. Se anota la fecha de verificación al lado del número.

🛑 **No se afirma una duración de memoria.** Un video rechazado al cargar con 40 posts adentro cuesta
la ventana de publicación.

### Safe zones — dónde se come la plataforma el contenido

| Formato | Qué se tapa |
|---|---|
| **Story / Reel** | Arriba: el perfil y el progreso · Abajo: caption, botones y CTA · Derecha: la columna de acciones |
| **TikTok** | Abajo y derecha, más agresivo que Instagram |
| **Feed** | Poco, pero el primer renglón del caption compite con la imagen |

Si ⑥A o ⑥B ya trabajaron con safe zones —que deberían—, acá **se verifica**, no se rediseña.

## 3 · Cómo se anota

```
| Chequeo                   | ✅/⬜ | Detalle            |
| Aspecto correcto          | ✅   | 9:16               |
| Duración dentro del límite| ✅   | 28 s · límite verificado 2026-09 |
| Texto fuera de safe zones | ⬜   | El CTA queda bajo los botones → ↩️ ⑥B |
| Sin watermark             | ✅   |                    |
```

**Una fila con un ⬜ no es `specs_ok = ✅`.** No hay medio cumplimiento: o se carga, o se devuelve.

## 4 · La devolución

Toda devolución lleva **tres cosas**, igual que en el resto del repo:

| Elemento | Ejemplo |
|---|---|
| **Qué no cumple**, verificable | *"El CTA está a 80 px del borde inferior; la UI de Reels tapa hasta ~250 px"* |
| **Qué se rompería** si lo adaptábamos acá | *"Recortar sube el encuadre y corta el producto que pidió ④ en la escena 2"* |
| **Dos alternativas** | *"1) Subir el CTA 200 px · 2) Moverlo al tercio superior, que está libre"* |

---

## Control de calidad de la Capa 2

- [ ] Se verificó **pieza por pieza**, sin muestreo
- [ ] 🛑 **Ningún archivo se arregló acá** — los que no cumplían se devolvieron
- [ ] Los **aspectos** coinciden con el formato de destino de cada fila
- [ ] Duración y peso se **verificaron contra la fuente**, con fecha anotada — no de memoria
- [ ] Las **safe zones** están verificadas en todo formato vertical
- [ ] 🛑 **Ninguna pieza lleva watermark** de otra app
- [ ] El **audio** se escuchó, no se asumió por el medidor
- [ ] 🛑 **Ninguna pieza con claim ⏸️ quedó como `specs_ok = ✅`**
- [ ] Toda fila es `✅` completa o `↩️ DEVUELTA` — **ninguna a medias**
- [ ] Cada devolución lleva **qué no cumple · qué se rompería · dos alternativas**
