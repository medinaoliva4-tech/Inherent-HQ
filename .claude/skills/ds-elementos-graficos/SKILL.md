---
name: ds-elementos-graficos
description: >
  Capa D4 del método de Diseño — aplica color y elementos gráficos superpuestos sobre la composición
  ya resuelta: ilustraciones (dibujos, trazos, iconos ilustrados, doodles), assets PNG recortados sin
  fondo (stickers, sellos, productos), texturas (papel, grano, polvo, tela), pinceladas y brochas, y
  formas gráficas (círculos, líneas, flechas, marcos). Impone el presupuesto de máximo 3 familias por
  pieza con rol declarado, el orden de capas y el test de sustracción. Úsala cuando pidan "qué le
  pongo a esta pieza", "le falta algo", "está muy plana", "poné stickers/textura/una flecha", "de
  dónde saco este asset", o al cerrar la ruta visual de un lote. Los overlays refuerzan la jerarquía,
  nunca la crean.
---

# D4 · Capas Gráficas

Leé `agents/design/systems/ELEMENTOS-GRAFICOS.md` y `playbooks/ASSETS-Y-MCP.md`.
Requiere la composición en gris aprobada (D3).

## Regla madre

**Los overlays refuerzan la jerarquía; nunca la crean.** Si la pieza no pasó los tests de D3,
ningún elemento gráfico la va a salvar. Volvé a D3.

## Las 5 familias y su rol legítimo

| Familia | Rol legítimo | Límite duro |
|---|---|---|
| **Ilustraciones** | Señalar, humanizar, explicar lo abstracto | 1-2 por pieza · un solo estilo en todo el lote |
| **Assets PNG** | Dar objeto real, romper el plano, marcar prueba | máx. 2 stickers · recorte sin halo |
| **Texturas** | Dar materia, unificar el lote | opacidad **5-20%** · una sola textura por lote |
| **Pinceladas** | Destacar **una** palabra, marcar zona, dar gesto | máx. 2 trazos · color del sistema |
| **Formas gráficas** | Dirigir, contener, agrupar, separar | tokens de `stroke/`, `radius/`, `color/` |

**Las formas gráficas se construyen en Figma, no se buscan.** Son la familia más segura y la más
subutilizada: una barra sólida detrás de un titular resuelve más contraste que cualquier efecto.

## El presupuesto — regla dura

**Máximo 3 familias por pieza.** Cada una con **un rol declarado** en el brief.

```
✅ textura (unificar) + forma (contener titular) + sticker (romper plano)
🛑 ilustración + textura + pincelada + sticker + forma
```

**Si no podés nombrar el rol de un elemento, el elemento se saca.**

El presupuesto es **del lote**, no de la pieza: si cada pieza usa familias distintas, el lote no se
lee como familia.

## Orden de capas

```
1 fondo · 2 foto · 3 textura global · 4 scrim/bloque · 5 formas
6 tipografía · 7 pinceladas de destaque · 8 stickers PNG · 9 logo
```
En Figma se construye como **grupos nombrados**, no capas sueltas.

## Contraste de overlays

Si hay texto sobre pincelada o sobre forma, **ese par entra en la matriz de D0 y se mide.**
Un resaltado que vuelve ilegible el texto es peor que no resaltar.

## De dónde salen los assets

Ver `playbooks/ASSETS-Y-MCP.md`. Regla madre:

🛑 **Nunca se genera fotografía del cliente.** Se puede generar textura, pincelada, ilustración y
forma abstracta — marcado `[asset generado]` y con gate humano.
Si falta una foto real: `⚠️ ASSET FALTANTE` → **Production**.

🛑 **Un overlay nunca tapa un asset malo.** Eso es `⚠️ ASSET INSUFICIENTE` → se pide reemplazo.

## El test de sustracción — obligatorio

```
Sacar cada overlay de a uno.
Si la pieza NO empeora al sacarlo → ese overlay sobra.
```

## Cierre

Producí `ruta-visual.md` con **una pieza modelo por formato** (plantilla en `templates/`).

🚦 **GATE 2** — el gate más importante. Se aprueba la ruta visual, no las 40 piezas.
Corregir 1 pieza cuesta 10 minutos; corregir 40 cuesta el lote.

Corré el bloque D4 de `qa/QA-GATES.md`. Siguiente: `ds-figma` (D5).
