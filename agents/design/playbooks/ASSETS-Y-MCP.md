# Assets y MCPs — de dónde sale cada elemento gráfico

Qué herramienta se usa para conseguir o producir cada cosa, y qué **nunca** se hace.

---

## Regla madre

**El agente de Diseño no inventa fotografía del cliente.**

Ninguna imagen generada se entrega como si fuera producción real. Todo asset generado va marcado
`[asset generado]` en el lote y en `entrega.md`, y necesita **gate humano** antes de entrar a una
pieza que se publica o se pauta.

| Se puede generar | 🛑 Nunca se genera |
|---|---|
| Texturas (papel, grano, polvo, tela) | Fotos del producto del cliente |
| Pinceladas, manchas, trazos | Fotos del local, del equipo, de clientes |
| Ilustraciones y doodles | Resultados, antes/después, testimonios |
| Formas y elementos abstractos | Caras de personas reales o personas que parezcan reales |
| Fondos abstractos | Cualquier cosa presentada como evidencia |

Si falta una foto real: `⚠️ ASSET FALTANTE` → **Production**. No se rellena con IA.

---

## Fuente por familia

| Familia | Primera fuente | Segunda | Última |
|---|---|---|---|
| **Fotos** | `_INPUTS/fotos/` (Production) | Drive del cliente | 🛑 Nada. Se marca `⚠️ ASSET FALTANTE` |
| **Ilustraciones** | Librería de marca (Branding) | Banco licenciado del cliente | Generado, marcado + gate |
| **Assets PNG recortados** | Foto de producción → recorte | Librería de marca | Generado, marcado + gate |
| **Texturas** | Librería de marca | Banco licenciado | Generado, marcado + gate |
| **Pinceladas** | Librería de marca | Banco licenciado | Generado, marcado + gate |
| **Formas gráficas** | Construidas en Figma con tokens | — | — |

**Las formas gráficas se construyen, no se buscan.** Círculos, líneas, flechas y marcos salen de
Figma con los tokens de `stroke/`, `radius/` y `color/`. Nunca de un PNG.

---

## MCPs — qué usar para qué

### Lectura de material del cliente
| MCP | Para qué |
|---|---|
| **Google Drive** | Bajar la guía de marca, las fotos de producción, el Excel del calendario |
| **Notion** | Leer la ficha del cliente, guías, aprobaciones previas |
| **Inherent OS** | Verificar que el cliente existe y qué lote va |

### Construcción
| MCP | Para qué |
|---|---|
| **Figma** (`use_figma`, `get_screenshot`, `get_metadata`, `search_design_system`, `get_libraries`) | Todo D5-D6. Ver `FIGMA-PLAYBOOK.md` |

### Producción de assets — solo con las reglas de arriba
| Herramienta | Para qué | Regla |
|---|---|---|
| `remove_background` | Convertir una foto de producción en PNG recortado | ✅ Uso principal. Operación sobre material real |
| `upscale_image` | Subir resolución de un asset chico de la librería | ✅ Verificar que no invente detalle en caras o texto |
| `outpaint_image` / `reframe` | Extender un fondo para adaptar de 4:5 a 9:16 | ⚠️ Solo en **fondo**, nunca extendiendo sujeto o producto. Gate humano |
| `generate_image` | Texturas, pinceladas, ilustraciones, formas abstractas | ⚠️ Marcar `[asset generado]` + gate humano. 🛑 Nunca fotografía del cliente |

### Referencia visual — para D0 y D3, no para copiar
| MCP | Para qué |
|---|---|
| **Eden** (`eden_study_top_carousels`, `eden_search_social_content`, `eden_read_board`) | Ver qué estructuras de carrusel y qué layouts rinden en la categoría |
| **AdWhispr** (`get_brand_ads`, `search_ads`) | Ver el material visual que ya corre en pauta en la categoría |

🛑 **La referencia produce patrones, no réplicas.** Misma regla que la ingeniería inversa de
Strategy: se observa la estructura, no se copia el arte. Si la pieza se parece a la del competidor,
falló el filtro.

---

## Calidad de assets — pisos de rechazo en QA

| Asset | Piso | Si no llega |
|---|---|---|
| Foto para pieza a sangre 1080×1350 | ≥1080 px en el lado corto, sin recompresión visible | `⚠️ ASSET INSUFICIENTE` → Production |
| PNG recortado | Sin halo, sin borde dentado, con canal alfa limpio | Se rehace el recorte |
| Textura | Sin patrón repetido visible (tiling) a tamaño real | Se reemplaza |
| Ilustración | Vectorial o ≥2x el tamaño de uso | Se reemplaza |
| Logo | Vectorial (SVG) o PNG ≥3x | Se pide a Branding |

**Un asset que no llega al piso no se "arregla" con overlays.** Se marca y se pide.

---

## Organización en el archivo del cliente

```
_INPUTS/
├── guia-de-marca/
├── contenido/        copies, titulares, CTAs
├── fotos/
│   ├── originales/
│   └── recortes/     PNGs sin fondo producidos en D0
├── assets/
│   ├── ilustraciones/
│   ├── texturas/
│   ├── pinceladas/
│   └── generados/    todo lo marcado [asset generado]
└── calendario/
```

**`generados/` es una carpeta aparte a propósito.** Hace visible de un vistazo cuánto del lote no
es material real.

---

## Anti-patrones

| Escenario | Por qué falla | En cambio |
|---|---|---|
| Generar una foto del producto porque falta | Se entrega ficción como evidencia. Riesgo real con el cliente | `⚠️ ASSET FALTANTE` → Production |
| Outpaint extendiendo el producto para llenar 9:16 | Inventa producto que no existe | Extender solo fondo, o recomponer el layout |
| Upscale de una foto con texto legible | Inventa letras | Pedir el original |
| Copiar el layout de un competidor visto en la referencia | Réplica, no estrategia | Extraer la estructura, resolver con el sistema propio |
| Buscar un PNG de flecha en internet | Sale de otro sistema visual | Construir la flecha en Figma con los tokens |
| Dejar los generados mezclados con los reales | Nadie sabe qué es qué en tres meses | Carpeta `generados/` + marca en el lote |
