# Componentes de Pieza — el sistema de social

**No son componentes de UI.** No hay botones, inputs ni navbars. Un componente acá es una
**pieza gráfica reutilizable de redes**: una portada de carrusel, una etiqueta, un bloque de cita.

Se construyen en D0.7 y se usan en D2 (elección) y D5 (`create_instance`).

---

## 1 · Por qué existen

Sin componentes, cada pieza se diseña de cero y **el lote se ve improvisado**. Con componentes:

- el lote se lee como familia
- un cambio de sistema actualiza las 40 piezas, no 0
- el agente **ejecuta** en vez de adivinar

> Una etiqueta de "Oferta" no debería usarse igual que una etiqueta de "Tip educativo".
> Una portada de carrusel no debería tener la misma jerarquía que una slide interna.
> **Los componentes son lo que hace explícita esa diferencia.**

---

## 2 · La ficha — obligatoria para cada componente

Sin ficha, el agente adivina el diseño. Con ficha, lo ejecuta. **Formato estructurado, no prosa:**

```
Componente: <nombre>

Cuándo usarlo:
- <situación 1>
- <situación 2>

Variantes:
- formato: feed-4x5 / feed-1x1 / story / carrusel
- <otras variantes propias>

Qué contenido acepta:
- nivel 1: <tipo, límite de palabras>
- nivel 2: <tipo, límite>
- nivel 3: <tipo, límite>
- asset base: <sí/no, tipo>

Reglas:
- <regla de jerarquía>
- <regla de color / contraste>
- <regla de overlays>

🛑 Cuándo NO usarlo:
- <escenario> → usar <componente alternativo> en su lugar
```

El bloque de **anti-uso es el que más valor tiene**. Es lo que evita que el sistema se degrade.

---

## 3 · El catálogo base

3-8 componentes cubren el 80% del trabajo de un cliente. Punto de partida:

| Componente | Para qué goal | Nivel 1 típico |
|---|---|---|
| **Portada de carrusel** | educar · autoridad | El hook, ≤8 palabras |
| **Slide interna** | educar | Un punto, numerado |
| **Slide de cierre / CTA** | vender · conversión | Una sola acción |
| **Titular pleno** | anunciar · autoridad | Frase de marca |
| **Foto + bloque** | prueba · serie | Titular sobre bloque sólido |
| **Foto + scrim** | deseo · comunidad | Titular sobre foto |
| **Bloque de cita / testimonio** | prueba | La cita literal |
| **Etiqueta** (`Nuevo` · `Tip` · `Oferta`) | modificador, no pieza | — |
| **Sticker central** (producto recortado) | vender · lanzamiento | El producto |
| **Bloque de precio** | vender | El precio |

⚠️ **El catálogo real sale de los goals que Creative usa con ese cliente.** No se copian estos diez:
se eligen los que el calendario creativo pide de verdad.

---

## 4 · Variables creativas de pieza

Lo que en UI serían props, acá son las **variables de la pieza**. Se declaran en el brief (D2) y
mapean a `VARIANTS` en Figma (D5):

```
canal:           instagram / facebook
formato:         feed-4x5 / feed-1x1 / story / carrusel
goal:            vender / educar / anunciar / autoridad / retargeting / lanzamiento / comunidad
tono:            premium / bold / cercano / urgente / editorial
densidad_visual: limpia / media / cargada
cta:             suave / directo / sin CTA
```

---

## 5 · Las relaciones — la jerarquía como regla del sistema

Esto vale para **todos** los componentes, y no se negocia por pieza:

```
nivel 1 (headline)   siempre el foco principal · máximo 1 idea por pieza
nivel 2 (subhead)    apoya, no compite
nivel 3 (firma/dato) presente, nunca compitiendo
marca                visible, nunca más importante que el mensaje
imagen / producto    refuerza la promesa, no la tapa
CTA                  va en el cierre visual, nunca encima del nivel 1
```

---

## 6 · Ejemplo completo — `Portada de carrusel`

```
Componente: Portada de carrusel

Cuándo usarlo:
- primera slide de todo carrusel
- cuando el goal es educar, dar autoridad o resolver una objeción

Variantes:
- formato: feed-4x5 / feed-1x1
- fondo: foto / color plano / textura
- etiqueta: sí / no

Qué contenido acepta:
- nivel 1: el hook, ≤8 palabras, máximo 3 líneas
- nivel 2: opcional, una línea de contexto
- nivel 3: numeración (1/7) + firma
- asset base: opcional

Reglas:
- tiene que funcionar SOLA: es lo único que ve quien no desliza
- el nivel 1 pesa ≥2x el nivel 2
- la numeración es visible — da expectativa de recorrido
- un elemento cruza hacia la slide 2 (continuidad)
- par de color del par seguro por defecto, salvo razón declarada

🛑 Cuándo NO usarlo:
- para una pieza de una sola imagen → usar "Titular pleno" o "Foto + scrim"
- para la slide de cierre → usar "Slide de cierre / CTA"
- cuando el hook tiene más de 8 palabras → devolver a Creative antes de diseñar
```

---

## 7 · Anti-patrones

| Escenario | Por qué falla | En cambio |
|---|---|---|
| Componente sin ficha | El agente adivina y cada pieza sale distinta | La ficha completa, con anti-uso |
| 15 componentes | Nadie los conoce; se termina diseñando de cero igual | 3-8 que cubran el 80% |
| Un componente por pieza del calendario | Deja de ser sistema | Un componente sirve a muchas piezas con overrides |
| Copiar y pegar en vez de instanciar | Un cambio de sistema no llega a ninguna pieza | `create_instance` |
| Cambiar los internos de una instancia | Rompe el vínculo con el componente | `set_instance_properties` |
| Usar la etiqueta "Oferta" en una pieza educativa | El sistema pierde significado | Respetar el bloque de anti-uso |
