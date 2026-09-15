# Entrega — `<cliente>` · lote `<período>`

> **D7 · QA y handoff.**
> 🚦 **GATE 3** — aprobado por: ______ · fecha: ______

| | |
|---|---|
| **Cliente** | |
| **Período** | |
| **Piezas entregadas** | |
| **Piezas bloqueadas** | |
| **Devueltas a Creative** | |
| **Archivo Figma** | |
| **Ruta de exports** | |
| **Carpeta de Drive** | *(se completa después del gate)* |
| **Sesión de armado** | 💻 local · máquina: |

---

## QA — las 3 pasadas

### Pasada 1 · Sistema
| Ítem | ✅/🛑 | Nota |
|---|---|---|
| Todas las piezas usan tokens (sin hex ni px literales) | | |
| Grilla y márgenes respetados en todo el lote | | |
| Escala tipográfica respetada (máx. 4 tamaños) | | |
| El lote se lee como familia | | |
| El activo distintivo aparece en todas las piezas | | |
| Presupuesto gráfico del lote respetado | | |

### Pasada 2 · Pieza
| Ítem | ✅/🛑 | Nota |
|---|---|---|
| La jerarquía del brief de Creative está respetada, no reordenada | | |
| Jerarquía visual identificable — lo primero que se ve es el nivel 1 | | |
| Contraste **medido** en cada par texto/fondo | | |
| Safe areas respetadas por canal y formato | | |
| Copy sin erratas, verificado contra el contenido original | | |
| Cortes de línea a mano, por unidad de sentido | | |
| Máx. 3 familias de overlay por pieza, con rol | | |
| CTA presente e inequívoco en piezas Conversion | | |
| Carruseles con portada autosuficiente, continuidad y quiebre | | |

### Pasada 3 · Miniatura
| Ítem | ✅/🛑 | Nota |
|---|---|---|
| Se entiende al 10% de tamaño | | |
| Sigue habiendo jerarquía en gris | | |
| Se ve bien sobre fondo oscuro (modo oscuro del canal) | | |
| Sobrevive la compresión (texto chico, textura, recortes) | | |
| Recorte de grilla de perfil revisado (IG) | | |

### Pasada 4 · Secuencia
> `brain/FEED-Y-GRILLA.md` — el lote en orden de publicación.

| Ítem | ✅/🛑 | Nota |
|---|---|---|
| No hay dos piezas consecutivas con mismo encuadre + color dominante + densidad de texto | | |
| Alterna mezcla **visual**, no solo mezcla de contenido | | |
| Las portadas con texto se leen a tamaño de miniatura de grilla | | |
| La consistencia viene del tratamiento, no de teñir todo de color de marca | | |
| Test anti-slop corrido sobre el lote | | |

---

## Índice de exports

| Archivo | Pieza | Canal | Formato | Publicación prevista | Pauta | Animado |
|---|---|---|---|---|---|---|
| | | | | | sí / no | sí / no |

**Nomenclatura:** `<cliente>_<AAAAMMDD>_<id_pieza>_<canal>_<formato>.<ext>`
**Carrusel:** sufijo `_s01`, `_s02`… en orden de publicación.

🛑 `save_screenshots` nombra por node id — **el renombrado es obligatorio**.

| Flag de export | Piezas | Verificado |
|---|---|---|
| `recovered: true` *(normal en seamless)* | | ⬜ |
| `empty: true` *(🛑 nodo roto)* | | ⬜ |

---

## Piezas marcadas para pauta

| Pieza | Densidad de texto verificada | CTA | Nota |
|---|---|---|---|
| | | | |

---

## Piezas con elemento animado

> Cambian el formato de entrega (MP4 en vez de PNG) y el canal las trata distinto.
> ⚠️ Ver la alerta de plataforma de VisuHaus en `playbooks/ASSETS-Y-MCP.md`.

| Pieza | Elemento | Formato de entrega | Origen |
|---|---|---|---|
| | | | |

---

## Piezas candidatas a motion (Production / VisuHaus)

| Pieza | Por qué | Capas separadas y nombradas |
|---|---|---|
| | | ⬜ |

---

## Devoluciones a Creative

| Pieza | Qué faltaba o qué se observó | Estado |
|---|---|---|
| | | esperando / resuelto |

---

## Assets generados

> Todo lo marcado `[asset generado]`. Requiere ojo humano antes de publicar.

| Pieza | Asset | Qué es | Aprobado por |
|---|---|---|---|
| | | | |

---

## Piezas bloqueadas

| Pieza | Motivo | Qué la desbloquea | A quién |
|---|---|---|---|
| | | | |

---

## Deuda visual

| Qué quedó sin resolver | Por qué | Cuándo se resuelve |
|---|---|---|

---

## HANDOFF — Diseño → Content / Media Buy

```markdown
- Cliente: · Período: · Fecha:
- Piezas entregadas: [n] · Bloqueadas: [n] · Assets faltantes: [n]
- Gates aprobados: sistema [✅/⬜] · ruta visual [✅/⬜] · entrega [✅/⬜]
- Ruta de exports:
- Carpeta de Drive:
- Archivo Figma:
- Piezas marcadas para pauta: [ids]
- Piezas con elemento animado: [ids]
- Piezas candidatas a motion: [ids]
- Piezas con asset generado: [ids]
- Devoluciones a Creative abiertas: [ids]
- Deuda visual abierta:
- Siguiente: Content (publicación) · Media Buy (pauta) · Production (motion)
```

🛑 **Diseño no publica, no programa y no pauta.**
