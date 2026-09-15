# Assets y Herramientas — de dónde sale cada cosa

El stack real del Departamento de Diseño Gráfico y qué se hace con cada pieza.

---

## Regla madre

**El agente de Diseño no inventa fotografía del cliente.**

Ninguna imagen generada se entrega como si fuera producción real. Todo asset generado va marcado
`[asset generado]` en el lote y en `entrega.md`, y necesita **gate humano** antes de entrar a una
pieza que se publica o se pauta.

| Se puede generar | 🛑 Nunca se genera |
|---|---|
| Texturas (papel, grano, polvo, tela) | Fotos del producto del cliente |
| Gradientes y fondos abstractos | Fotos del local, del equipo, de clientes |
| Pinceladas, manchas, trazos | Resultados, antes/después, testimonios |
| Ilustraciones y doodles | Caras de personas reales o que parezcan reales |
| Elementos PNG gráficos | Cualquier cosa presentada como evidencia |

Si falta una foto real: `⚠️ ASSET FALTANTE` → **Production**. No se rellena con IA.

---

## El stack — integración completa

| Asset | Fuente | Herramienta | Resultado |
|---|---|---|---|
| **Foto** | Knowledge store de assets finales | **Jockey MCP** | La foto específica |
| **Fuentes** | Carpetas de assets | **Zapier MCP** | El archivo de fuente |
| **Jerarquía** | Guía de marca + brief de Creative | **Figwright** | Jerarquía aplicada en tipografía |
| **Texturas, gradientes** | Generación | Agente de generación de imagen | Textura/gradiente según guía de marca |
| **Elemento PNG** | Generación o recorte de producción | Agente de generación · `remove_background` | Elemento gráfico en PNG según guía |
| **Elemento animado de relleno** | Generativo / paramétrico | **VisuHaus** ⚠️ | Loop, fondo o forma animada (MP4 / SVG) |
| **Armado** | Todo lo anterior | **Figwright** | La pieza compuesta en Figma |

### El orden — no se altera
```
1. Fotos preparadas          ← seleccionadas y recortadas
2. Texturas y gradientes     ← generados y aprobados
3. Elementos gráficos PNG    ← generados o recortados
4. Todo junto en Figma con buena composición  → post o story
5. (opcional) Elemento animado de relleno     → solo si la pieza ya funciona estática
```

🛑 **Nunca arranques a componer en Figma con assets a medio resolver.** Cada paso que falta se
termina resolviendo con un overlay que tapa, y eso es exactamente lo que este orden evita.

---

## VisuHaus — elementos animados de relleno

> 🚨 **ALERTA DE PLATAFORMA — verificado 2026-09-15.**
> Visu.Haus anuncia que **desde el 10 de octubre de 2026 el acceso a la plataforma actual queda
> limitado**, y que los datos de cuenta y los proyectos almacenados **se borran**. Hay que exportar
> todo antes de esa fecha.
> **Acción requerida:** exportar los `.visu`, los MP4/SVG y los assets del cliente a
> `_INPUTS/assets/animados/` **antes del 10/10/2026**, y evaluar reemplazo.
> Confirmar el estado real con el proveedor antes de apoyar un lote nuevo en esta herramienta.

### Qué es
**"No-code creative coding"** — generación de visuales paramétricos y generativos. Exporta
`PNG · JPG · SVG · PDF · MP4 · HTML` y archivos `.visu` que conservan controles, assets, versiones y
animaciones.

### Para qué la usa Diseño
**Elementos animados de relleno** dentro de una publicación: loops de fondo, formas en movimiento,
texturas animadas, transiciones cortas que acompañan un estático.

🛑 **No es para animar la pieza entera.** Animar el estático completo (motion graphic del arte) sigue
siendo de **Production / Post**. Lo de VisuHaus es **un elemento más**, y entra al presupuesto
gráfico de D4 como cualquier otro overlay.

### Las 4 reglas
1. **El estático tiene que funcionar primero.** Si la pieza no pasa los tests de D3 en quieto,
   la animación no la salva — la disimula.
2. **Cuenta en el presupuesto gráfico.** Un elemento animado ocupa **una** de las 3 familias de D4.
3. **Un solo elemento animado por pieza.** Dos movimientos simultáneos compiten y nadie lee nada.
4. **Entra al lote marcado.** Columna `animado = sí` y listado aparte en `entrega.md` — porque cambia
   el formato de entrega (MP4 en vez de PNG) y el canal lo trata distinto.

### Acceso
El **MCP + Skill está solo en los planes Pro y Max**. Las generaciones por MCP corren con el
proveedor de IA propio, sin consumir créditos de la plataforma; los límites de storage y fair-use
del plan siguen aplicando. **Verificar en qué plan está la cuenta de Inherent antes de planificar un
lote con animados.**

---

## Fuente por familia gráfica

| Familia | Primera fuente | Segunda | Última |
|---|---|---|---|
| **Fotos** | `_INPUTS/fotos/` (Production) · Jockey | Drive del cliente | 🛑 Nada. `⚠️ ASSET FALTANTE` |
| **Ilustraciones** | Librería de marca (Branding) | Banco licenciado | Generado, marcado + gate |
| **Assets PNG recortados** | Foto de producción → `remove_background` | Librería de marca | Generado, marcado + gate |
| **Texturas / gradientes** | Librería de marca | Banco licenciado | Generado, marcado + gate |
| **Pinceladas** | Librería de marca | Banco licenciado | Generado, marcado + gate |
| **Formas gráficas** | **Construidas en Figma con tokens** | — | — |
| **Elementos animados** | VisuHaus ⚠️ (ver alerta arriba) | Librería propia exportada | 🛑 Sin fuente → la pieza va estática |

**Las formas gráficas se construyen, no se buscan.** Círculos, líneas, flechas y marcos salen de
Figwright con `stroke/`, `radius/` y `color/`. Nunca de un PNG de internet: un PNG viene de otro
sistema visual.

---

## MCPs por función

### Lectura de material del cliente
| MCP | Para qué |
|---|---|
| **Google Drive** | Guía de marca, fotos de producción, el Excel del calendario creativo |
| **Notion** | Ficha del cliente, guías, aprobaciones previas, el Knowledge Base del depto |
| **Inherent OS** | Verificar que el cliente existe y qué lote va |
| **Jockey** | El knowledge store de assets finales — la vía canónica para traer una foto |
| **Zapier** | Traer una fuente desde las carpetas de assets |

### Construcción
| MCP | Para qué |
|---|---|
| **Figwright** | Todo D5-D6. Ver `FIGWRIGHT-PLAYBOOK.md` |

### Producción de assets — solo con las reglas de arriba
| Operación | Regla |
|---|---|
| `remove_background` | ✅ Uso principal. Opera sobre material **real** |
| `upscale_image` | ✅ Verificar que no invente detalle en caras ni en texto |
| `outpaint` / `reframe` | ⚠️ Solo en **fondo**, nunca extendiendo sujeto o producto. Gate humano |
| `generate_image` | ⚠️ Texturas, gradientes, pinceladas, ilustraciones, PNGs abstractos. Marcar `[asset generado]` + gate. 🛑 Nunca fotografía del cliente |

### Referencia visual — para D0 y D3, no para copiar
| MCP | Para qué |
|---|---|
| **Eden** (`eden_study_top_carousels`, `eden_search_social_content`, `eden_read_board`) | Qué estructuras de carrusel y qué layouts rinden en la categoría |
| **AdWhispr** (`get_brand_ads`, `search_ads`) | El material visual que ya corre en pauta en la categoría |

🛑 **La referencia produce patrones, no réplicas.** Se observa la estructura, no se copia el arte.
Ver `brain/CRITERIO-VISUAL.md` §8.

---

## Prompt base para generar un asset — nunca otro formato

Todo pedido de generación de asset sale con esta estructura. **No se improvisa un prompt suelto.**

```
Generá [textura / gradiente / pincelada / ilustración / elemento PNG] para una pieza de
[canal] [formato], goal [goal].

Sistema visual del cliente:
- paleta:
- tipografía (si aplica):
- estilo visual:
- tratamiento gráfico de la marca:
- restricciones:
- anti-patrones:

Debe integrarse con la guía de marca.
No inventes un estilo fuera de marca.
No generes fotografía ni nada que parezca producción real.
Entregá con fondo transparente si es un elemento PNG.
```

---

## Calidad de assets — pisos de rechazo en QA

| Asset | Piso | Si no llega |
|---|---|---|
| Foto para pieza a sangre 1080×1350 | ≥1080 px en el lado corto, sin recompresión visible | `⚠️ ASSET INSUFICIENTE` → Production |
| PNG recortado | Sin halo, sin borde dentado, alfa limpio | Se rehace el recorte |
| Textura | Sin patrón repetido visible a tamaño real | Se reemplaza |
| Ilustración | Vectorial o ≥2x el tamaño de uso | Se reemplaza |
| Logo | Vectorial (SVG) o PNG ≥3x | Se pide a Branding |
| Fuente | Con `ñ`, tildes y signos del idioma del cliente | 🛑 No se adopta |

**Un asset que no llega al piso no se "arregla" con overlays.** Se marca y se pide.

---

## Organización en el archivo del cliente

```
_INPUTS/
├── guia-de-marca/
├── contenido/        copies, titulares, CTAs
├── calendario/       el Excel/CSV de Creative
├── fotos/
│   ├── originales/
│   └── recortes/     PNGs sin fondo producidos en D0
└── assets/
    ├── ilustraciones/
    ├── texturas/
    ├── pinceladas/
    ├── fuentes/
    ├── animados/     exports de VisuHaus (.visu, MP4, SVG) ⚠️ respaldar antes del 10/10/2026
    └── generados/    todo lo marcado [asset generado]
```

**`generados/` es una carpeta aparte a propósito.** Hace visible de un vistazo cuánto del lote no es
material real.

---

## Anti-patrones

| Escenario | Por qué falla | En cambio |
|---|---|---|
| Generar una foto del producto porque falta | Se entrega ficción como evidencia. Riesgo real con el cliente | `⚠️ ASSET FALTANTE` → Production |
| Outpaint extendiendo el producto para llenar 9:16 | Inventa producto que no existe | Extender solo fondo, o recomponer el layout |
| Upscale de una foto con texto legible | Inventa letras | Pedir el original |
| Empezar a componer con assets a medio resolver | Termina en overlays que tapan | Respetar el orden 1-2-3-4 |
| Buscar un PNG de flecha en internet | Viene de otro sistema visual | Construirla en Figwright con tokens |
| Prompt de generación improvisado | Sale algo fuera de marca y se usa igual | El prompt base, siempre |
| Dejar los generados mezclados con los reales | En tres meses nadie sabe qué es qué | Carpeta `generados/` + marca en el lote |
| Animar una pieza que no funciona estática | El movimiento disimula el problema, no lo resuelve | Pasar los tests de D3 primero |
| Dos elementos animados en una pieza | Compiten; no se lee nada | Uno solo, y cuenta como familia de overlay |
| Arrancar un lote nuevo apoyado en VisuHaus sin verificar la plataforma | Cierra el 10/10/2026 | Verificar plan y estado; exportar todo antes |
