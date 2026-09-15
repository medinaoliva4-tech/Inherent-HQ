# Correlación — de dónde viene cada campo

Qué alimenta a qué. **Si un campo no tiene origen, no se completa por inferencia: se marca.**

---

## Entradas externas → Diseño

| Campo del sistema de Diseño | Viene de | Departamento |
|---|---|---|
| Dirección: cómo debe verse y sentirse | Intel de marca | **Branding** — 🛑 obligatorio |
| Inspiraciones, fuentes, material existente | Intel de marca | **Branding** |
| Paleta, tipografía, logo, uso, tratamiento gráfico | Guía formal *(Modo A)* · o `guia-aplicable.md` *(Modo B)* | **Branding** · o **Diseño** |
| Activos distintivos | `posicionamiento.md` → Activos distintivos (Capa 4) | **Strategy** |
| Pilar y temperatura del slot | `calendario-estrategico.csv` | **Strategy** |
| Rol de cada canal | `contenido-por-canal.md` | **Strategy** |
| **Goal del arte final** | Calendario creativo / plan de ejecución | **Creative** |
| **Texto en jerarquía (niveles 1-2-3)** | Calendario creativo | **Creative** |
| Fecha, canal, formato, tamaño, slides | Calendario creativo | **Creative** |
| Foto sugerida | Calendario creativo | **Creative → Production** |
| Copies finales y CTAs | Contenido producido | **Creative / Content** |
| Fotos, video stills, producto | Producción · Jockey | **Production** |
| Ilustraciones, texturas, brochas, stickers | Librería de marca | **Branding / Production** |
| Fuentes | Carpetas de assets · Zapier | **Branding** |

### El contrato con Creative — qué bloquea
```
BLOQUEANTE     canal · formato · goal · nivel_1 (mínimo)
NO BLOQUEANTE  foto sugerida · niveles 2 y 3 · pilar · temperatura
```
🛑 **Un campo bloqueante que falta se devuelve. No se infiere.**

---

## Dentro de Diseño — la cadena

```
D0 sistema-visual.md
    ├── tokens de color ────────────► D2 par de color ──► D4 capas ──► D7 pasada 1
    ├── matriz de contraste ────────► D2 par de color ──► D7 pasada 2
    ├── escala tipográfica ─────────► D2 escala ────────► D3 peso visual
    ├── grillas por formato ────────► D3 composición ───► D6 adaptación
    ├── inventario gráfico ─────────► D4 presupuesto
    ├── activos distintivos ────────► D4 ────────────────► D7 test de familia
    └── componentes de pieza ───────► D2 elección ──────► D5 create_instance

D1 lote-de-piezas.csv
    ├── canal + formato ────────────► D2 restricciones ─► D6 safe areas
    ├── goal ───────────────────────► D2 mensaje único ─► D4 emoción de la pieza
    ├── nivel_1 / 2 / 3 ────────────► D3 jerarquía VISUAL ──► D7 test de atención
    ├── asset_base ─────────────────► D3 punto focal
    ├── slides + seamless ──────────► D6 ritmo del carrusel · lienzo largo
    ├── animado ────────────────────► D4 presupuesto gráfico ──► D7 formato de entrega
    └── traza_calendario ───────────► D7 handoff

D2 briefs/ ──► D3 composición en gris ──► D4 color y overlays ──► ruta-visual.md
                                                                        │
                                                                        ▼
                                      D5 Figwright ──► D6 adaptación ──► D7 exports
```

---

## Qué campo bloquea qué

| Si falta | Se bloquea |
|---|---|
| **Dirección** (cómo debe verse y sentirse) | **Todo D0** → y con él todo el resto |
| Paleta o tipografía, con intel disponible | Nada — corre **Modo B** y se construyen |
| Matriz de contraste | D2 (no hay par de color legítimo) |
| Ficha de un componente | D2 para las piezas que lo usarían |
| Grilla del formato | D3 y D6 |
| **Goal** o **nivel_1** | Esa pieza en D1 → devolución a Creative |
| CTA en pieza de goal `vender` | Esa pieza en D1 |
| Asset base | D3 solo si la pieza es fotográfica; si es tipográfica, se avanza |
| Ruta visual aprobada | **Todo D5** — no se construyen 40 piezas sin gate |
| Figwright conectado | D5-D6 → salen como especificación construible |
| Plan Pro/Max de VisuHaus | Las piezas con `animado = sí` → van estáticas |

---

## Qué sale de Diseño hacia afuera

| Output | Va a | Para qué |
|---|---|---|
| `/exports` + `entrega.md` | **Content** | Publicación y programación |
| Piezas marcadas para pauta | **Media Buy** | Carga en Ads Manager |
| Piezas candidatas a motion + capas nombradas | **Production** | Motion graphic del estático |
| `⚠️ ASSET FALTANTE` / `⚠️ ASSET INSUFICIENTE` | **Production** | Reproducción o reemplazo |
| `🛑 BLOQUEADO — sin goal / sin jerarquía` · `⚠️ OBSERVADO` | **Creative** | Completar el plan de ejecución |
| `⚠️ FUERA DE GUÍA` | **Branding** | Actualización de la guía |
| `guia-aplicable.md` *(Modo B)* | **Branding · Production · Content** | Dirección de arte, tratamiento de foto y voz visual |
| Qué piezas rindieron | **Analytics** → vuelve a D0.7 | Afinar la biblioteca de componentes |
