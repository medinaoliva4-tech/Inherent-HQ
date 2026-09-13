# Correlación — de dónde viene cada campo

Qué alimenta a qué. **Si un campo no tiene origen, no se completa por inferencia: se marca.**

---

## Entradas externas → Diseño

| Campo del sistema de Diseño | Viene de | Departamento |
|---|---|---|
| Paleta, tipografía, logo, uso, tono visual | Guía de marca | **Branding** |
| Activos distintivos | `posicionamiento.md` → Activos distintivos (Capa 4) | **Strategy** |
| Función y pilar de cada slot | `calendario-estrategico.csv` → `funcion`, `pilar` | **Strategy** |
| Temperatura del slot | `calendario-estrategico.csv` → `temperatura` | **Strategy** |
| Rol de cada canal | `contenido-por-canal.md` | **Strategy** |
| Fecha, canal, formato, idea, copy, CTA | Calendario creativo (Excel) | **Creative** |
| Titular y copy en pieza | Contenido producido | **Creative / Content** |
| Fotos, video stills, producto | Producción | **Production** |
| Ilustraciones, texturas, brochas, stickers | Librería de marca | **Branding / Production** |

---

## Dentro de Diseño — la cadena

```
D0 sistema-visual.md
    ├── tokens de color ────────────► D2 par de color ──► D4 capas ──► D7 QA pasada 1
    ├── matriz de contraste ────────► D2 par de color ──► D7 QA pasada 2
    ├── escala tipográfica ─────────► D2 escala ────────► D3 peso visual
    ├── grillas por formato ────────► D3 composición ───► D6 adaptación
    ├── inventario gráfico ─────────► D4 presupuesto
    ├── activos distintivos ────────► D4 ────────────────► D7 test de familia
    └── biblioteca de layouts ──────► D2 layout base ───► D5 COMPONENT SET

D1 lote-de-piezas.csv
    ├── canal + formato ────────────► D2 restricciones ─► D6 safe areas
    ├── funcion + pilar ────────────► D2 mensaje único
    ├── titular + copy + cta ───────► D2 jerarquía 1-2-3
    ├── asset_base ─────────────────► D3 punto focal
    ├── slides ─────────────────────► D6 ritmo del carrusel
    └── traza_calendario ───────────► D7 handoff

D2 briefs/ ──► D3 composición en gris ──► D4 color y overlays ──► ruta-visual.md
                                                                        │
                                                                        ▼
                                          D5 Figma ──► D6 adaptación ──► D7 exports
```

---

## Qué campo bloquea qué

| Si falta | Se bloquea |
|---|---|
| Paleta o tipografía de la guía | **Todo D0** → y con él todo el resto |
| Matriz de contraste | D2 (no hay par de color legítimo) |
| Grilla del formato | D3 y D6 |
| Titular y copy | Esa pieza en D2 |
| CTA en pieza de función Conversion | Esa pieza en D2 |
| Asset base | D3 solo si la pieza es fotográfica; si es tipográfica, se avanza |
| Ruta visual aprobada | **Todo D5** — no se construyen 40 piezas sin ruta aprobada |
| MCP de Figma | D5-D6 → salen como especificación construible |

---

## Qué sale de Diseño hacia afuera

| Output | Va a | Para qué |
|---|---|---|
| `/exports` + `entrega.md` | **Content** | Publicación y programación |
| Piezas marcadas para pauta | **Media Buy** | Carga en Ads Manager |
| `⚠️ ASSET FALTANTE` / `⚠️ ASSET INSUFICIENTE` | **Production** | Reproducción o reemplazo |
| `⚠️ FUERA DE GUÍA` | **Branding** | Actualización de la guía |
| Piezas que rindieron / no rindieron | **Analytics** → vuelve a D0.7 | Afinar la biblioteca de layouts |
