# QA Gates — Agente de Diseño

Checklist por capa. **Ninguna capa se entrega sin pasar su bloque completo.**
Un ítem fallado **se corrige**. No se entrega marcado como "menor".

---

## D0 — Sistema visual
- [ ] Cada token tiene **nombre, valor, origen, uso y anti-uso** — los cinco
- [ ] Todo token sin respaldo en la guía está marcado `⚠️ FUERA DE GUÍA — propuesta`
- [ ] La **matriz de contraste** está completa: cada par fondo/texto de la paleta, con ratio medido
- [ ] Está declarado el **método de medición** usado (no "se ve bien")
- [ ] Está definido el **par seguro por defecto** y el **par de emergencia sobre foto**
- [ ] Hay al menos 3 scrims definidos por intensidad
- [ ] La escala tipográfica tiene **máximo 4 tamaños** por formato, con interlineado y tracking
- [ ] Máximo 2 familias tipográficas, con rol fijo para la segunda
- [ ] Hay una grilla por cada formato activo, con márgenes y safe areas
- [ ] El inventario de las 5 familias gráficas distingue **qué existe / qué falta**
- [ ] Hay activos distintivos nombrados (qué reconoce la marca al 10%, sin logo)
- [ ] Hay 3-6 layouts base, cada uno con función y formatos declarados
- [ ] 🛑 **No hay ninguna pieza diseñada en este entregable.** D0 termina en sistema

---

## D1 — Lectura del lote
- [ ] El **mapeo de columnas** del Excel del cliente está declarado, no asumido
- [ ] Una fila = una pieza entregable (un carrusel de 8 slides es **una** fila con `slides=8`)
- [ ] Ninguna fila fue borrada: las incompletas están con `estado_diseno` y motivo
- [ ] Cada pieza sin titular **y** sin copy está `BLOQUEADO — sin contenido`
- [ ] Cada pieza sin canal o sin formato está `BLOQUEADO — sin destino`
- [ ] Cada pieza de función `Conversion` sin CTA está `BLOQUEADO — Conversion sin CTA`
- [ ] Las piezas sin asset base están `PENDIENTE — resuelve tipográfica`, no bloqueadas
- [ ] Cada fila tiene `traza_calendario`, o está marcada para consulta
- [ ] La **cabecera del lote** está reportada: piezas / listas / bloqueadas / assets faltantes
- [ ] Si más del 30% está bloqueado → se paró y se pidió el material

---

## D2 — Briefs
- [ ] Un brief por cada pieza no bloqueada
- [ ] El **mensaje único** es una sola oración
- [ ] La **jerarquía tiene exactamente 3 niveles**, los tres nombrados
- [ ] El nivel 1 gana peso en **al menos dos** de: tamaño, contraste, área, posición
- [ ] El layout base sale de la biblioteca de D0.7, con el porqué y los descartados
- [ ] El par de color sale de la matriz de D0.2, **con su ratio escrito**
- [ ] Máximo **1 color de acento**, marcando **una** cosa
- [ ] El presupuesto gráfico declara familias (máx. 3) **y el rol de cada una**
- [ ] Los cortes de línea del titular están escritos, por unidad de sentido
- [ ] Las restricciones del canal están declaradas (safe areas, slides, densidad si es pauta)
- [ ] El brief entra en media carilla

---

## D3 — Composición
- [ ] La pieza se compuso **en gris** antes de aplicar color
- [ ] Hay **un** punto focal, en tercios o centro óptico — no en el centro geométrico por default
- [ ] El nivel 1 pesa ≥2x el nivel 2
- [ ] Hay al menos 8% del alto del formato como aire en el borde con texto
- [ ] La dirección de lectura está declarada (Z / F / vertical)
- [ ] Todo alineado a la grilla; los márgenes del sistema respetados
- [ ] **TEST MINIATURA** al 10% → SÍ
- [ ] **TEST GRIS** → SÍ
- [ ] Si algún test dio NO → se volvió a D2 y se cambió el layout (🛑 no se arregló en D4)
- [ ] Si es carrusel: portada autosuficiente · continuidad entre slides · quiebre en la penúltima

---

## D4 — Capas gráficas
- [ ] Máximo **3 familias de overlay** por pieza
- [ ] Cada elemento tiene un **rol declarado**; los que no lo tienen se sacaron
- [ ] Las texturas están entre **5% y 20%** de opacidad
- [ ] Una sola textura por lote
- [ ] Los PNG recortados no tienen halo ni borde dentado
- [ ] Máximo 2 stickers por pieza; ninguno sobre el punto focal
- [ ] Máximo 2 palabras destacadas por pieza
- [ ] Si hay texto sobre pincelada, ese par entró en la matriz de contraste y se midió
- [ ] Las formas gráficas usan tokens de `stroke/`, `radius/` y `color/` — ninguna en color nuevo
- [ ] Las flechas apuntan al nivel 1 o al CTA
- [ ] El **orden de capas** está construido como grupos nombrados, no capas sueltas
- [ ] **TEST DE SUSTRACCIÓN** corrido: se sacó cada overlay y se registró cuál sobraba
- [ ] 🛑 Ningún overlay está tapando un asset malo (eso es `⚠️ ASSET INSUFICIENTE`)

---

## D5 — Construcción en Figma
- [ ] La ruta visual está **aprobada** (🚦 GATE 2) antes de construir el lote
- [ ] Se descubrió el design system antes de construir (pieza existente → `get_libraries` → `search_design_system`)
- [ ] No se concluyó "no hay variables" sin correr `search_design_system` con `includeVariables`
- [ ] Los layouts están como `COMPONENT SET` con `VARIANTS` por formato — no copiados y pegados
- [ ] Las piezas son `INSTANCE` con overrides, no duplicados sueltos
- [ ] Auto layout en todo lo que tiene relación estructural
- [ ] **Cero hex y cero px literales** donde existe token
- [ ] Nomenclatura `<id_pieza>__<canal>__<formato>` en todos los frames
- [ ] Se validó con `get_screenshot` **por bloque**, no solo al final
- [ ] Se revisó en los screenshots: texto cortado · superposiciones · placeholders · variante equivocada
- [ ] Se devolvieron los IDs de todo lo creado y mutado
- [ ] Las piezas con imagen tienen la imagen **realmente puesta** (no frame en blanco)
- [ ] Si no hay MCP de Figma: salió como especificación construible marcada `BLOQUEADO`

---

## D6 — Adaptación
- [ ] Cada formato fue **recompuesto**, no escalado
- [ ] La foto fue **reencuadrada** (crop), nunca estirada
- [ ] El mensaje único y la jerarquía 1-2-3 se mantienen en todos los formatos
- [ ] Safe areas respetadas: nada crítico en las zonas de UI
- [ ] En story: el CTA está arriba del safe inferior, o va como sticker nativo
- [ ] En story: hay **menos** texto que en feed
- [ ] Carrusel: mismo ratio en todas las slides
- [ ] Carrusel: numeración visible y un solo CTA en la última
- [ ] Reuso IG → FB: revisado (densidad de texto y encuadre), y marcado en el lote

---

## D7 — QA y entrega
- [ ] Las **3 pasadas** corridas completas: sistema · pieza · miniatura
- [ ] Copy verificado **contra el contenido original**, sin erratas
- [ ] Contraste medido en cada par, no estimado
- [ ] Revisado sobre fondo oscuro
- [ ] Revisado comprimido (no solo el PNG original)
- [ ] Exports a **1x sobre el frame en px reales**, sRGB, fondo opaco
- [ ] Nomenclatura de export correcta y completa
- [ ] Carruseles con sufijo `_sNN` en orden de publicación
- [ ] Piezas de pauta listadas aparte, con densidad de texto verificada
- [ ] Assets generados listados aparte con `[asset generado]` y aprobados
- [ ] Piezas bloqueadas listadas con motivo y a quién se le pide
- [ ] Deuda visual declarada
- [ ] Bloque de **HANDOFF** completo
- [ ] 🛑 **No se publicó, no se programó y no se pautó nada**

---

## Gate de escritura externa

Antes de escribir en Figma sobre un archivo existente, subir a Drive o registrar en Notion:
- [ ] Está confirmado con el usuario
- [ ] No se sobrescribe ningún archivo ya aprobado
- [ ] No se borra ningún asset del cliente
