---
name: cr-arte-video
description: >
  Capa 5 del método de Creatividad — dirección de arte y de video. Traduce la estética en
  instrucciones precisas: grid, orden de lectura, foco único, layout de texto con ubicación, tamaño
  y proporción, safe zones, mood y elementos gráficos; y para video, el shot list con las 8
  propiedades por toma más las tomas de cobertura. Úsala cuando pidan "el layout", "dónde va cada
  texto", "la estética", "el mood", "el shot list", "qué tomas necesitamos". Creative dirige y
  especifica; ⑤ Producción ejecuta en Figma, cámara y edición.
---

# Capa 5 — Forma

Leé `agents/creative/METHOD.md` sección **CAPA 5** + `toolkit/05-arte-y-layout.md` +
`toolkit/06-shot-list.md`. Plantilla: `templates/direccion-creativa.md` secciones 3-4.

**Input obligatorio:** el concepto aprobado + el `guion` y el `copy` de la Capa 4 + las **guidelines y el lente de
marca** de Branding + el **banco de assets**.

## 5.1 — Arte y layout

**El orden de lectura no es casualidad. Se define y se escribe.**

| Elemento | Qué se especifica |
|---|---|
| **Grid** | Carrusel → columnas · cover/miniatura → tercios · post → modular · story/video → tercios + safe zones |
| **Foco** | **UNO SOLO.** El que la BIG IDEA exige |
| **Orden de lectura** | 1° / 2° / 3°, explícito |
| **Layout de texto** | Ubicación, tamaño, proporción y peso de **cada** texto |
| **Safe zones** | Del canal, marcadas |
| **Mood / estética** | Paleta, iluminación, acabado — del lente de Branding |
| **Elementos gráficos** | **Del banco de assets.** Si falta uno, se pide a Branding |

**Cómo se escribe una instrucción:**
```
❌ "que se vea limpio y moderno, con el título arriba"
✅ "Grid de tercios. Foco = título en el tercio superior, 60% del ancho, peso alto.
   Subtítulo inferior 20%, peso regular. Logo en esquina inferior derecha dentro de safe zone.
   Fondo oscuro editorial, 1 acento de marca. Foto real del local, no stock.
   Orden de lectura: título → foto → subtítulo → logo."
```
La diferencia: la segunda **no admite interpretación**. Eso es dirección.

## 5.2 — Shot list (solo video)

Cada toma lleva las **8 propiedades**, sin excepción:
`# de shot · tamaño de plano · ángulo · movimiento · sujeto/acción · duración · audio · equipo`

**La regla de oro es la especificidad:**
```
❌ "Juan entra"
✅ "Juan entra por la puerta, plano medio, cámara fija, 3s, audio directo"
```
Lo vago mata el rodaje. El camarógrafo y el editor **no deben adivinar nada**.

**Tomas de cobertura — siempre 2-3 extra, nombradas:** `reaction` · `wide` · `detalle/insert`.
Sin cobertura el editor no puede cubrir cortes y **el video queda plano**.

## Reglas duras
- **Máximo 1 foco por pieza.** Cuando todo parece importante, nada resalta.
- **Jerarquía explícita.** Nunca implícita.
- **Safe zones respetadas.** Un texto tapado por la UI es un texto que no existe.
- **La paleta, la tipografía y el lente son de Branding.** Creative los **aplica**; no los define ni
  los estira.
- **Los activos distintivos de ③ Marketing §4.5 se refuerzan, no se reinventan** cada pieza. Es lo que
  hace que la marca acumule memoria.
- **Nada de adjetivos como instrucción.** *"Impactante"*, *"limpio"*, *"moderno"* no son
  especificaciones.
- **Foto real antes que stock** — obligatorio en los arquetipos locales, donde la evidencia real
  vence a la producción cara.
- **La toma 1 es el frame 1 visual** definido en el hook de la Capa 4, y dura lo que ese frame ocupa
  antes del siguiente corte. **Acá se verifica el cruce** (en la Capa 4 el shot list todavía no existe).
- **Las duraciones suman** al total del formato del canal.
- **Si el shot list no cabe en la capacidad de producción** (① núcleo §C/D), se recorta acá y se
  declara. Un plan de rodaje imposible no es un plan.
- 🛑 **Creative no ejecuta.** Nada de archivos de diseño, mockups finales, tomas grabadas, media
  generada ni edición. El shot list y la especificación de layout son el límite exacto del
  departamento.

## Qué columnas del Excel llena
`layout_de_texto` · `estetica_mood` · `elementos_graficos` · `escenas` + `encuadres` + `duraciones` (el shot list) ·
`audio_musica` (el audio declarado por toma).

## Cierre
Correr el bloque **Capa 5** de `qa/QA-GATES.md`.

## Handoff
→ `cr-adaptacion` (Capa 6)
