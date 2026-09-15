---
name: ds-elementos-graficos
description: >
  Capa D4 del método de Diseño — aplica color y elementos gráficos superpuestos sobre la composición
  ya resuelta: ilustraciones (dibujos, trazos, iconos ilustrados, doodles), assets PNG recortados sin
  fondo (stickers, sellos, productos), texturas (papel, grano, polvo, tela), pinceladas y brochas,
  y formas gráficas (círculos, líneas, flechas, marcos). Impone el presupuesto de máximo 3 familias
  por pieza con rol declarado, el orden de capas, el test de sustracción y el checklist anti-AI-slop.
  Úsala cuando pidan "qué le pongo a esta pieza", "le falta algo", "está muy plana", "poné
  stickers/textura/una flecha", "de dónde saco este asset", o al cerrar la ruta visual de un lote.
  Los overlays refuerzan la jerarquía, nunca la crean. La familia de elementos animados está NO
  ACTIVA: todas las piezas salen estáticas.
---

# D4 · Capas Gráficas

Leé `systems/ELEMENTOS-GRAFICOS.md`, `playbooks/ASSETS-Y-MCP.md`, `brain/CRITERIO-VISUAL.md` y
`brain/FEED-Y-GRILLA.md`. Requiere la composición en gris aprobada (D3).

## Regla madre

**Los overlays refuerzan la jerarquía; nunca la crean.** Si la pieza no pasó los tests de D3, ningún
elemento gráfico la va a salvar. Volvé a D3.

## Las 6 familias

| Familia | Rol legítimo | Límite duro |
|---|---|---|
| **Ilustraciones** | Señalar, humanizar, explicar lo abstracto | 1-2 por pieza · un solo estilo en todo el lote |
| **Assets PNG** | Dar objeto real, romper el plano, marcar prueba | máx. 2 stickers · recorte sin halo |
| **Texturas** | Dar materia, unificar el lote | opacidad **5-20%** · una sola textura por lote |
| **Pinceladas** | Destacar **una** palabra, marcar zona, dar gesto | máx. 2 trazos · color del sistema |
| **Formas gráficas** | Dirigir, contener, agrupar, separar | tokens de `stroke/`, `radius/`, `color/` |
| ~~**Animados**~~ | ⬜ **NO ACTIVA — sin proveedor vigente.** Ver abajo | 🛑 no se propone |

**Las formas gráficas se construyen en Figwright, no se buscan.** Son la familia más segura y la más
subutilizada: una barra sólida detrás de un titular resuelve más contraste que cualquier efecto.

## El presupuesto — regla dura

**Máximo 3 familias por pieza.** Cada una con **un rol declarado**. Un animado **cuenta como una**.

```
✅ textura (unificar) + forma (contener titular) + sticker (romper plano)
✅ forma (dirigir) + pincelada (destacar 1 palabra)
🛑 ilustración + textura + pincelada + sticker + forma
```

**Si no podés nombrar el rol de un elemento, el elemento se saca.**
El presupuesto es **del lote**, no de la pieza: si cada pieza usa familias distintas, el lote no se
lee como familia.

## Elementos animados — ⬜ NO ACTIVA

🛑 **No propongas elementos animados. La familia está desactivada por decisión de Inherent
(2026-09-15) y no tiene proveedor vigente.**

| Por qué | |
|---|---|
| **VisuHaus** | Acceso limitado desde el **10/10/2026** y borrado de proyectos. MCP solo en planes Pro/Max |
| **Spline** | Evaluado y pospuesto: no hay plugin oficial de Figma, y Figma corre un plugin por vez (chocaría con Figwright) |

Todas las piezas salen **estáticas**. La columna `animado` del lote queda en `no`.

**Para reactivarla** hacen falta las tres: proveedor definido · prueba de una pieza modelo que pase
el checklist anti-slop · gate humano. Las reglas quedan escritas abajo para ese momento.

<details><summary>Reglas guardadas para cuando se reactive</summary>

1. **El estático tiene que funcionar primero.** Si no pasó los tests de D3, la animación lo disimula.
2. **Cuenta en el presupuesto** de 3 familias.
3. **Uno solo por pieza.** Dos movimientos simultáneos compiten y nadie lee nada.
4. **Se marca en el lote** (`animado = sí`) y aparte en `entrega.md` — cambia el formato de entrega.

</details>

## Orden de capas

```
1 fondo · 2 foto · 3 textura global · 4 scrim/bloque · 5 formas
6 tipografía · 7 pinceladas de destaque · 8 stickers PNG · 9 logo
```
En Figwright se construye como **grupos nombrados**, no capas sueltas.

## Contraste de overlays

Si hay texto sobre pincelada o sobre forma, **ese par entra en la matriz de D0 y se mide.**
Un resaltado que vuelve ilegible el texto es peor que no resaltar.

## De dónde salen los assets

Ver `playbooks/ASSETS-Y-MCP.md`. El orden no se altera:
```
1 fotos → 2 texturas y gradientes → 3 PNGs → 4 armado en Figma → 5 (opcional) animado
```

🛑 **Nunca se genera fotografía del cliente.** Se puede generar textura, gradiente, pincelada,
ilustración y PNG abstracto — marcado `[asset generado]` y con gate humano.
Si falta una foto real: `⚠️ ASSET FALTANTE` → **Production**.
🛑 **Un overlay nunca tapa un asset malo.** Eso es `⚠️ ASSET INSUFICIENTE`.

## Los 3 tests de cierre — obligatorios

```
TEST DE SUSTRACCIÓN  Sacar cada overlay de a uno. Si la pieza no empeora, ese overlay sobra
TEST ANTI-SLOP       brain/CRITERIO-VISUAL.md §6 — ¿podés explicar por qué existe cada elemento?
TEST DE SECUENCIA    brain/FEED-Y-GRILLA.md — ¿el lote alterna encuadre, color y densidad?
```

### Anti-slop, en corto
El AI slop se ve "correcto" demasiado rápido: limpio, sin decisiones raras, sin capas, plantilla
premium. **La fricción es evidencia de pensamiento.**
🛑 Dos o más NO en el checklist = volvé a D2.

### Secuencia, en corto
🛑 **Dos piezas consecutivas no pueden compartir encuadre + color dominante + densidad de texto.**

## Cierre

Producí `ruta-visual.md` con **una pieza modelo por formato + la secuencia del feed**.

🚦 **GATE 2** — el gate más importante. Corregir 1 pieza cuesta 10 minutos; corregir 40 cuesta el lote.

Corré el bloque D4 de `qa/QA-GATES.md`. Siguiente: `ds-figma` (D5).
