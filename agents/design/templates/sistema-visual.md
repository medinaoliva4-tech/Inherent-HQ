# Sistema Visual — `<cliente>`

> **D0 · Traduce la guía de marca a valores operables.**
> No inventa: lo que no está en la guía sale como `⚠️ FUERA DE GUÍA — propuesta`.
> 🚦 **GATE 1** — aprobado por: ______ · fecha: ______

| | |
|---|---|
| **Cliente** | |
| **Fuente de la guía** | *(archivo, versión, fecha)* |
| **Arquetipo** *(Strategy, Capa 0)* | |
| **Formatos activos** | |
| **Canales activos** | |
| **Estado** | ⬜ Provisional · ✅ Aprobado |

---

## D0.1 · Tokens

### Color
| Token | Valor | Origen | Uso | 🛑 Anti-uso |
|---|---|---|---|---|
| `color/marca/primario` | | Guía p.__ | | |
| `color/marca/secundario` | | | | |
| `color/marca/acento` | | | | |
| `color/neutro/0` | | | | |
| `color/neutro/900` | | | | |
| `color/texto/primario` | | | | |
| `color/texto/inverso` | | | | |
| `color/texto/sobre-foto` | | | | |
| `color/fondo/base` | | | | |
| `color/fondo/alterno` | | | | |
| `color/scrim/suave` | | | | |
| `color/scrim/medio` | | | | |
| `color/scrim/fuerte` | | | | |
| `color/scrim/degradado` | | | | |

### Espaciado
```
space/100 = __    space/200 = __    space/300 = __    space/400 = __
space/500 = __    space/600 = __    space/700 = __    space/800 = __
```
| Token de margen | Valor |
|---|---|
| `space/margen/feed` | |
| `space/margen/story` | |
| `space/margen/carrusel` | |

### Radio · Sombra · Borde
| Token | Valor | Uso |
|---|---|---|
| `radius/bloque` | | |
| `radius/sticker` | | |
| `shadow/sticker` | | |
| `stroke/fino` | | |
| `stroke/grueso` | | |

---

## D0.2 · Matriz de contraste

> **Medida, no estimada.** Piso Inherent: 4.5:1 para todo texto legible en miniatura.
> Texto sobre foto: 7:1 o scrim obligatorio. Base: WCAG 2.2 AA (criterio 1.4.3).

| Fondo | Texto | Ratio | Veredicto | Uso permitido |
|---|---|---|---|---|
| | | | ✅ / ⚠️ / 🛑 | |
| | | | | |
| | | | | |
| | | | | |

**Método de medición usado:**

### Salidas obligatorias
| | Par | Ratio |
|---|---|---|
| **Par seguro por defecto** | | |
| **Par de emergencia sobre foto** | | |

---

## D0.3 · Escala tipográfica

**Familia primaria:** ____ · **Familia secundaria:** ____ *(máx. 2)*

| Rol | Token | Tamaño @1080 | Peso | Interlineado | Tracking |
|---|---|---|---|---|---|
| Titular | `type/titular` | | | | |
| Subtítulo | `type/subtitulo` | | | | |
| Cuerpo | `type/cuerpo` | | | | |
| Micro | `type/micro` | | | | |

**Ratio entre niveles:** ____x *(recomendado 1.5x-2x)*
**Ajuste por formato (si aplica):**

---

## D0.4 · Grillas por formato

### `<formato>` — ____ × ____
| Campo | Valor |
|---|---|
| Margen | |
| Columnas · gutter | |
| Safe area superior | |
| Safe area inferior | |
| Zona del nivel 1 | |
| Zona del nivel 3 / firma | |

*(repetir por cada formato activo)*

---

## D0.5 · Inventario de elementos gráficos

| Familia | Qué existe hoy | Qué falta | Fuente |
|---|---|---|---|
| Ilustraciones | | | |
| Assets PNG recortados | | | |
| Texturas | | | |
| Pinceladas / brochas | | | |
| Formas gráficas | *(se construyen en Figma con tokens)* | — | — |

**Presupuesto gráfico del lote:** qué familias se usan y con qué rol, para que el lote se lea como
familia.

---

## D0.6 · Activos distintivos

> Qué hace reconocible a la marca **al 10% de tamaño, sin leer el logo**.
> Fuente: `posicionamiento.md` → Activos distintivos (Strategy, Capa 4), si existe.

| Activo | Qué es | Dónde aparece en cada pieza |
|---|---|---|
| | | |
| | | |

---

## D0.7 · Biblioteca de componentes de pieza

> **No son componentes de UI.** Son piezas gráficas reutilizables de social.
> 3-8 que cubran el 80% del trabajo. Cada uno lleva su **ficha completa** —
> ver `brain/COMPONENTES-SOCIAL.md`.

| Componente | Para qué goal | Formatos | Ficha completa |
|---|---|---|---|
| | | | ⬜ |
| | | | ⬜ |
| | | | ⬜ |

### Ficha — repetir por componente

```
Componente: <nombre>

Cuándo usarlo:
-

Variantes:
- formato: feed-4x5 / feed-1x1 / story / carrusel
-

Qué contenido acepta:
- nivel 1: <tipo, límite de palabras>
- nivel 2:
- nivel 3:
- asset base: sí / no

Reglas:
-

🛑 Cuándo NO usarlo:
- <escenario> → usar <componente alternativo>
```

🛑 **Un componente sin bloque de anti-uso no está terminado.** Es lo que evita que el sistema se
degrade en tres lotes.

---

## Huecos

> **Solo va acá lo que contradice o amplía la DIRECCIÓN de Branding.**
> Un valor concreto que la guía no enumeró (scrim, ratio, margen) **no es un hueco**: es trabajo de
> Diseño. Se resuelve, y el criterio se declara en el campo `origen` del token.

| Hueco | Qué falta | A quién se le pide | Estado |
|---|---|---|---|
| `⚠️ FUERA DE GUÍA` | *(decisión de dirección, no un valor)* | Branding | |
| `⚠️ ASSET FALTANTE` | | Production | |

---

## Registro

| | |
|---|---|
| Archivo Figma | |
| Fecha de creación | |
| Próxima revisión | *(cada 3 lotes, o cuando Branding actualice la guía)* |
