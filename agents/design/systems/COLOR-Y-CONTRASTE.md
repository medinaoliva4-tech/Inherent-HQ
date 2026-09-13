# Color y Contraste

**El contraste se mide. No se estima.** Esta es la regla dura #4 del agente.

---

## Los pisos

Base: **WCAG 2.2 nivel AA** (fuente: W3C, `https://www.w3.org/TR/WCAG22/` — criterio 1.4.3).

| Caso | Piso WCAG AA | Piso de Inherent para social |
|---|---|---|
| Texto normal (<24px o <18.66px bold) | 4.5:1 | **4.5:1** |
| Texto grande (≥24px, o ≥18.66px bold) | 3:1 | **4.5:1** — porque en el feed se ve comprimido y en miniatura |
| Elementos gráficos no textuales | 3:1 | 3:1 |
| **Texto sobre fotografía** | — | **7:1** o scrim obligatorio |

**Por qué subimos el piso:** WCAG está pensado para pantallas a tamaño real. Una pieza de social se
ve a 1/4 de tamaño, comprimida por el algoritmo del feed, en un teléfono al sol. El piso de 4.5:1
para todo texto es lo mínimo operativo.

---

## La matriz de contraste — obligatoria en D0

Se mide **cada combinación** fondo/texto de la paleta y se registra:

| Fondo | Texto | Ratio | Veredicto | Uso |
|---|---|---|---|---|
| `color/fondo/base` | `color/texto/primario` | 12.6:1 | ✅ | Par seguro por defecto |
| `color/marca/primario` | `color/texto/inverso` | 5.2:1 | ✅ | Piezas Hero |
| `color/marca/primario` | `color/texto/primario` | 2.1:1 | 🛑 | **No usar** |
| `color/marca/acento` | `color/texto/inverso` | 3.4:1 | ⚠️ | Solo titular ≥72px |

**Salidas obligatorias de la matriz:**
1. **Par seguro por defecto** — el que se usa cuando no hay razón para otro
2. **Par de emergencia sobre foto** — qué se usa cuando el fondo es fotográfico e impredecible

---

## Cómo se mide

**Fórmula (WCAG):** `(L1 + 0.05) / (L2 + 0.05)`, donde L es la luminancia relativa de cada color y
L1 es el más claro.

Luminancia relativa: para cada canal RGB normalizado a 0-1,
`c ≤ 0.03928 → c/12.92`, si no `((c+0.055)/1.055)^2.4`; luego `L = 0.2126·R + 0.7152·G + 0.0722·B`.

**Cómo se obtiene en la práctica:**
| Fuente | Cuándo |
|---|---|
| Plugin de contraste en Figma (Stark, Contrast, A11y) | Durante el diseño, sobre el nodo real |
| Cálculo directo de la fórmula sobre el par de hex | En D0, al armar la matriz |
| Muestreo del píxel real sobre la foto | Texto sobre foto — el color de fondo no es un hex, es un rango |

🛑 **"Se ve bien" no es una medición.**

---

## Texto sobre fotografía

El caso donde más se falla. Una foto no tiene un color de fondo: tiene un **rango**.

### El procedimiento
1. Identificar la **zona más clara** del área donde va el texto (no el promedio).
2. Medir el ratio contra esa zona. Si falla, el texto falla — aunque el promedio pase.
3. Aplicar el scrim del token correspondiente hasta alcanzar el piso.
4. Volver a medir.

### Las 4 soluciones, en orden de robustez
| Solución | Robustez | Costo visual |
|---|---|---|
| **Bloque sólido** detrás del texto | 🟢 Total | Alto — tapa foto |
| **Scrim de degradado** desde el borde | 🟢 Alta | Bajo — se integra |
| **Scrim plano** sobre toda la foto | 🟡 Media | Medio — aplana la foto |
| **Sombra / outline en el texto** | 🔴 Baja | Alto — se ve barato, falla al comprimir |

**Regla:** si la foto es impredecible (stock, UGC, material variado), va **bloque sólido o scrim de
degradado**. La sombra en el texto no es una solución de contraste.

---

## Color como jerarquía

El color es la **segunda** herramienta de jerarquía, después del tamaño. Reglas:

| Regla | Por qué |
|---|---|
| Máx. **1 color de acento** por pieza | Dos acentos = ningún acento |
| El acento marca **una** cosa | Si marca tres, dejó de marcar |
| El nivel 3 nunca lleva el acento | El acento es del nivel 1 o del CTA, no de los dos |
| La jerarquía tiene que sobrevivir en gris | Ver TEST GRIS en `COMPOSICION-Y-JERARQUIA.md` |

**Nunca usar color como el único portador de información.** (WCAG 1.4.1 — y además el feed en modo
oscuro y la compresión alteran el color.)

---

## Modo oscuro

Instagram y Facebook tienen modo oscuro. Una pieza con fondo blanco a sangre "flota" sobre fondo
negro; una con fondo negro se funde con la interfaz.

| Situación | Qué hacer |
|---|---|
| Pieza con fondo muy claro | Verificar que el borde de la pieza se distinga — si no, marco sutil o fondo `neutro/50` |
| Pieza con fondo negro puro | Subir a un negro de marca (`neutro/900`), no `#000000` |
| Pieza con transparencia | 🛑 Nunca. Los exports van siempre con fondo opaco |

**QA pasada 3** incluye ver el lote sobre fondo oscuro.

---

## Anti-patrones

| Escenario | Por qué falla | En cambio |
|---|---|---|
| Usar los colores de la guía sin medir el par | Una paleta de marca no garantiza legibilidad | Medir el par exacto; usar el par alterno si falla |
| Texto blanco sobre foto sin scrim | Falla en cuanto la foto tiene una zona clara | Scrim o bloque, medido contra la zona más clara |
| Sombra en el texto como solución de contraste | Se pierde al comprimir; se ve barato | Scrim de degradado |
| Dos colores de acento | Anulan la jerarquía | Uno, en una sola cosa |
| Negro `#000000` de fondo | Se funde con la UI en modo oscuro | Negro de marca, `neutro/900` |
| Exportar con fondo transparente | El canal lo rellena de blanco o negro, impredecible | Fondo opaco siempre |
