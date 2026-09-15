---
name: br-sistema-visual
description: >
  Capa B5 del método de Branding de Inherent — convierte la dirección visual elegida en un sistema
  con valores exactos: logo y variaciones, paleta por rol con HEX/RGB/CMYK y contraste verificado,
  escala tipográfica con pesos y tracking y licencias, grilla y jerarquía, estilo fotográfico,
  elementos gráficos, motion, sonido y activos distintivos codificados. Úsala cuando pidan "la
  paleta", "las tipografías", "el sistema visual", "cómo se usa el logo", "la grilla", "el estilo
  de fotos", "qué colores usamos". Requiere dirección visual aprobada. No produce las piezas.
---

# Capa B5 — Sistema Visual

Leé `agents/branding/METHOD.md` sección **CAPA B5**.
Playbooks: `playbooks/COLOR.md` · `playbooks/TIPOGRAFIA.md` · `playbooks/COMPOSICION-Y-ESTETICA.md`.
Plantilla: `templates/sistema-visual.md`.

**Input obligatorio:** `direccion-visual.md` con la dirección **aprobada**.

> **Acá se diseña un sistema, no un logo.** Y todo valor es concreto: `#0F1115`, no *"gris oscuro"*.
> `Inter Tight SemiBold 32/36, tracking -2%`, no *"una sans moderna"*.

---

## Los 9 bloques

`B5.1 logo · B5.2 color · B5.3 tipografía · B5.4 composición y grilla · B5.5 fotografía ·
B5.6 elementos gráficos · B5.7 motion · B5.8 sonido · B5.9 activos distintivos codificados`

---

## Color — las 4 reglas que más se rompen

1. **La psicología del color no es una regla.** *Azul = confianza* te pone donde ya está toda la
   categoría: te hace ver **común**. El color se justifica por **contraste con el mapa de
   saturación**, no por diccionario.
2. **Cada color tiene rol y trabajo.** Primario, secundario, **un solo acento**, neutros, fondos,
   semánticos. Y proporción de reparto — si el acento está en todos lados, deja de acentuar.
3. **Contraste verificado par por par**, ratio escrito, mínimo **4.5:1** para texto normal.
   Las combinaciones prohibidas se escriben; si no, alguien las usa.
4. **Si hay impresión, la conversión CMYK se verifica**, no se asume. Un HEX puede no tener
   equivalente exacto en tinta.

El sistema tiene que funcionar en **fondo claro y oscuro**, y **sobrevivir en blanco y negro**.

---

## Tipografía — las 4 reglas que más se rompen

1. **1-2 familias.** Tres solo con criterio probado y justificación escrita.
2. **Contraste de pesos real.** Si usás `Light`, saltá a `Medium` o `Bold`. `Light + Regular` no es
   contraste, es error.
3. **`ñ`, tildes y `¿ ¡` verificados carácter por carácter.** Una tipografía sin `ñ` no entra.
4. **Licencia declarada** (tipo, fundición, quién la posee, costo) **+ fallback web-safe**. Un
   manual que especifica una tipografía sin licencia es un problema legal con buena maqueta.

Y la escala completa: familia, peso, tamaño, interlineado y tracking **por rol**.

---

## Logo

Versiones · área de respiro · tamaño mínimo (px y mm) · usos prohibidos · qué hacer sobre foto.

> **No se pone el logo en todo.** El objetivo es que te reconozcan **sin** el logo. Si necesitás
> ponerlo gigante y repetido, el sistema visual no es suficientemente fuerte.

Si el logo no se rediseña, se documenta el existente con sus reglas. **Eso también es entregable.**

---

## B5.9 — el bloque bisagra

Los activos distintivos de `posicionamiento.md` Sección 5 se codifican acá con valor concreto. Son
exactamente lo que en B6.3 va en la columna *"qué se repite siempre"*.

> Se refuerzan con consistencia, **no se reinventan cada ciclo**. Un activo cambiado a los 6 meses
> nunca llega a ser activo. Declará cuánto tiempo no se toca.

---

## Reglas duras

- **Cada decisión traza** a un eje de B4, a un rasgo de personalidad o a la idea madre.
- **No producís los archivos finales.** Especificás. El `.ai` es de **Production**.
- **El sistema se diseña para quien lo va a ejecutar** (declarado en B0.3), no para el portfolio.
  Si el ejecutor publica desde el celular, un sistema que exige un diseñador senior está mal.

## Cierre
Correr el bloque **Capa B5** de `agents/branding/qa/QA-GATES.md`.

## Handoff
→ `br-aplicaciones`
