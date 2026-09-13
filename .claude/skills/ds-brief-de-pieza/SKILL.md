---
name: ds-brief-de-pieza
description: >
  Capas D1 y D2 del método de Diseño — lee el calendario creativo (Excel/CSV) y el contenido
  producido, los convierte en la matriz `lote-de-piezas.csv` con estado por fila, y produce un brief
  por pieza con mensaje único, jerarquía 1-2-3, layout base, par de color, escala tipográfica,
  presupuesto gráfico y restricciones del canal. Úsala cuando pidan "leé el calendario de X", "qué
  piezas hay que diseñar", "armá el lote de este mes", "brief de esta pieza", "qué le pongo a esta
  pieza", o antes de abrir Figma para cualquier pieza. Requiere el sistema visual (D0) hecho.
  Ninguna pieza se diseña sin brief.
---

# D1-D2 · Lote y Briefs

Leé `agents/design/METHOD.md` → D1 y D2. Requiere `sistema-visual.md` aprobado.
Plantillas: `templates/lote-de-piezas.csv` y `templates/brief-de-pieza.md`.

---

## D1 · Lectura del lote

### Regla 1 — Mapear, no asumir
Las columnas del Excel del cliente rara vez se llaman igual que las nuestras.
**Declará el mapeo usado en una tabla antes de procesar.**

```
MAPEO — "Fecha publicación"→fecha · "Red"→canal · "Tipo"→formato · "Copy"→titular …
Columnas del origen sin destino: [x] · Columnas nuestras sin origen: [x]
```

### Regla 2 — Una fila = una pieza entregable
Un carrusel de 8 slides es **una** fila con `slides=8`. No ocho filas.

### Regla 3 — Fila incompleta ≠ fila borrada
Se conserva con `estado_diseno` y el motivo exacto.

### Bloqueos por fila
| Falta | Estado |
|---|---|
| Titular **y** copy | 🛑 `BLOQUEADO — sin contenido` |
| Canal o formato | 🛑 `BLOQUEADO — sin destino` |
| CTA en pieza de función `Conversion` | 🛑 `BLOQUEADO — Conversion sin CTA` |
| Asset base (foto) | 🟡 `PENDIENTE — resuelve tipográfica` — se puede avanzar |
| Traza al calendario | 🟡 se marca y se consulta antes de diseñar |

### Cabecera obligatoria — se reporta antes de seguir
```
LOTE — Cliente: [x] · Período: [x] · Piezas: [n] · Listas: [n] · Bloqueadas: [n]
Canales: [x] · Formatos: [x] · Assets faltantes: [n]
```

🛑 **Si más del 30% de las filas está bloqueado: parar y pedir el material.**

---

## D2 · Brief de pieza

Uno por pieza no bloqueada. **Media carilla.** Si crece, la pieza está mal definida.

### Los 7 campos
| # | Campo | Regla dura |
|---|---|---|
| 1 | **Mensaje único** | Una oración. Si necesita dos, **son dos piezas** — marcalo y consultá |
| 2 | **Jerarquía 1-2-3** | Exactamente tres. El nivel 1 gana en ≥2 de: tamaño, contraste, área, posición |
| 3 | **Layout base** | De la biblioteca D0.7, con el porqué y los descartados |
| 4 | **Par de color** | De la matriz D0.2, **con el ratio escrito**. Máx. 1 acento, marcando 1 cosa |
| 5 | **Escala tipográfica** | De D0.3. Cortes de línea del titular escritos, por unidad de sentido |
| 6 | **Presupuesto gráfico** | Máx. 3 familias, **cada una con rol declarado** |
| 7 | **Restricciones del canal** | Safe areas, slides, densidad de texto si es pauta |

### Si no podés nombrar los 3 niveles
El layout está mal elegido. Cambialo — no lo resuelvas diseñando.

### Assets
Cada brief declara sus assets con estado: ✅ · `⚠️ ASSET FALTANTE` · `⚠️ ASSET INSUFICIENTE` ·
`[asset generado]`. Ver `playbooks/ASSETS-Y-MCP.md`.

---

## Cierre

Corré los bloques D1 y D2 de `qa/QA-GATES.md`.
Siguiente: `ds-composicion` (D3).
