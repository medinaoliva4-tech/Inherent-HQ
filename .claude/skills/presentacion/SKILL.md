---
name: presentacion
description: >
  Crea presentaciones minimalistas en blanco y negro, con diagramas y flechas de estilo dibujado a
  mano, para mostrarle al equipo o al cliente cómo se conecta el trabajo de un departamento:
  contexto, análisis construido, cómo se relacionan las piezas, para qué se usa cada una, y la
  ingeniería inversa detrás. Úsala cuando pidan "armá la presentación de X", "mostrale al equipo
  cómo funciona esto", "necesito un deck para el cliente", "visualizá el método". Se publica como
  Artifact (HTML). No reemplaza reportes de datos — es para comunicar un método o una decisión, no
  para dashboards.
---

# Presentación Inherent — Minimalista, blanco y negro, dibujado a mano

## Antes de escribir el archivo

Cargá **`artifact-design`** y **`artifact-diagramming`** (skills del sistema) antes de tocar HTML —
ahí está la mecánica de temas, tipografía y SVG inline. Esto solo agrega el estilo visual y la
estructura de contenido propios de Inherent.

## El estilo (no negociable salvo que el usuario pida otra cosa)

- **Paleta:** blanco/papel y negro/tinta puros. Un solo gris intermedio para texto secundario.
  Cero color de acento — si hace falta destacar algo, se usa peso de línea o relleno negro, no color.
- **Tipografía — 3 roles:**
  - Cuerpo y títulos: una sans-serif geométrica sobria (ej. `Archivo`, Google Fonts)
  - Anotaciones a mano sobre los diagramas (flechas, "esto alimenta a", llamados): una fuente de
    escritura real (ej. `Caveat`), nunca para párrafos largos — solo para etiquetas cortas
  - Datos y tags (CEP, capa N, códigos): una monoespaciada (ej. `IBM Plex Mono`)
- **Diagramas:** SVG inline a mano (ver `artifact-diagramming`), líneas con leve textura irregular
  (no geométricamente perfectas — es lo que las hace sentir "dibujadas", no generadas). Flechas
  siempre etiquetadas: qué alimenta a qué, nunca una línea sin explicar.
- **Layout:** una sola columna, scroll vertical, mucho aire entre secciones, líneas finas como
  divisores. Un diagrama grande por sección — nunca varios chicos compitiendo.
- **Numeración:** solo si el contenido es una secuencia real (capas de un método, pasos de un
  proceso). Nunca decorativa.

## Estructura de contenido — para un deck de "cómo funciona el método"

1. **Portada / la idea completa en un diagrama** — el pipeline entero en una sola imagen, para que
   el lector tenga el mapa antes del detalle
2. **Por sección/capa:** qué se junta, con qué instrumento, y — **siempre** — para qué se usa
   después (esto es lo que pidió el cliente: nunca mostrar un dato sin su destino)
3. **Cómo se relacionan** — un diagrama de trazabilidad completo, de punta a punta
4. **La ingeniería inversa** — mostrada como una cadena de flechas con números reales, no abstracta
5. **Cierre / handoff** — a quién le sirve esto y qué hace cada uno con eso

## Reglas duras
- Nunca inventar contenido: el deck visualiza lo que ya existe en los documentos del método/cliente,
  no agrega conclusiones nuevas.
- Cada diagrama tiene una sola afirmación (ver `artifact-diagramming`). Si necesitás decir dos
  cosas, son dos diagramas.
- Mostrar ambos temas (claro/oscuro) — tinta y papel invierten limpio.
- No usar librerías de gráficos — SVG a mano, como indica `artifact-diagramming`.
