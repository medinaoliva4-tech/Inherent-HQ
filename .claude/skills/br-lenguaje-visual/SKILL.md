---
name: br-lenguaje-visual
description: >
  Capa B5 del método de Branding de Inherent — define el lenguaje visual de la marca: logo y sus
  versiones, paleta base por rol con HEX y piso de contraste, familias tipográficas con pesos y
  licencias, principios de composición, tratamiento fotográfico para Producción, qué familias de
  elementos gráficos existen, carácter del motion y activos distintivos codificados. Úsala cuando
  pidan "la paleta", "qué colores usamos", "las tipografías", "cómo se usa el logo", "el estilo de
  fotos", "el lenguaje visual". Requiere dirección visual aprobada. NO define escalas, grillas,
  márgenes, safe areas ni tokens — eso es de ⑥A Diseño.
---

# Capa B5 — Lenguaje Visual

Leé `agents/branding/METHOD.md` sección **CAPA B5**.
Playbooks: `playbooks/COLOR.md` · `playbooks/TIPOGRAFIA.md` · `playbooks/ESTETICA.md`.
Plantilla: `templates/lenguaje-visual.md`.

**Input obligatorio:** `direccion-visual.md` con la dirección **aprobada**.

---

## 🛑 Antes de escribir una línea: el límite con ⑥A Diseño

```
Branding entrega DIRECCIÓN  →  Diseño entrega REALIDAD
```

| ✅ Vos fijás | 🛑 No fijás — es de ⑥A Diseño |
|---|---|
| Paleta base, roles, reparto, **piso** de contraste | Matriz de contraste medida par por par, scrim |
| Familias tipográficas, pesos en uso, licencias | Escala, tamaños, interlineado, tracking, ratios |
| Logo, versiones, mínimo, resguardo, frecuencia | Cómo cae el logo en cada layout |
| Densidad, espacio, trazo y forma, 3 niveles | Grillas, márgenes, gutters, safe areas |
| Qué familias de elementos gráficos existen | Qué elemento entra en qué pieza |

**La pregunta de control:** ¿esta decisión vale igual para una story, un cartel y un packaging?
Si sí, es tuya. Si cambia según el formato, es de Diseño.

> Si fijás la escala tipográfica, Diseño la va a romper en la primera story — y ahí el manual deja
> de valer. Fijá la **dirección**, no los píxeles.

---

## Los 9 bloques

`B5.1 logo · B5.2 color · B5.3 tipografía · B5.4 principios de composición ·
B5.5 tratamiento fotográfico → ⑤ Producción · B5.6 lenguaje gráfico → ⑥A Diseño ·
B5.7 motion → ⑥B Video · B5.8 sonido · B5.9 activos distintivos codificados`

---

## Color — las 4 reglas que más se rompen

1. **La psicología del color no es una regla.** *Azul = confianza* te pone donde ya está toda la
   categoría: te hace ver **común**. Se justifica por **contraste con el mapa de saturación** de
   B1.3, no por diccionario. Y se responde explícitamente: *¿esta paleta hace que el cliente se vea
   igual que su competencia?*
2. **Cada color tiene rol.** Primario, secundario, **un solo acento**, neutros, fondos. Con
   proporción de reparto — si el acento está en todos lados, deja de acentuar.
3. **Declarás el piso, no la matriz.** 4.5:1 en miniatura, 7:1 o scrim sobre foto. Verificás que la
   paleta base lo permita; **⑥A Diseño mide cada par en cada pieza**.
4. **Si hay impresión, la conversión CMYK se verifica**, no se asume.

El lenguaje tiene que funcionar en **fondo claro y oscuro** y **sobrevivir en blanco y negro**.

---

## Tipografía — las 4 reglas que más se rompen

1. **1-2 familias.** Tres solo con criterio probado y justificación escrita.
2. **Contraste real de pesos.** `Light + Regular` no es contraste, es error. Se salta a
   `Medium` o `Bold`.
3. **`ñ`, tildes y `¿ ¡` verificados carácter por carácter.** Una familia sin `ñ` no entra.
4. **Licencia declarada** (tipo, fundición, poseedor, costo) **+ fallback web-safe**. Un manual que
   especifica una tipografía sin licencia es un problema legal con buena maqueta.

🛑 **La escala la arma ⑥A Diseño.** Vos elegís la familia, el carácter y los pesos en uso.

---

## Logo

Versiones · área de respiro · tamaño mínimo · sobre qué fondos · usos prohibidos · **frecuencia**.

> **No se pone el logo en todo.** El objetivo es que te reconozcan **sin** el logo. Declará en qué
> piezas va y en cuáles no.

Si el logo no se rediseña, se documenta el existente con sus reglas. **Eso también es entregable.**

---

## B5.9 — el bloque bisagra

Los activos distintivos de `posicionamiento.md` §5 se codifican acá. Son exactamente lo que en B6.3
va en *"qué se repite siempre"*, y lo que hace reconocible a la marca **al 10% de tamaño, sin leer
el logo**.

> Se refuerzan con consistencia, **no se reinventan cada ciclo**. Declará cuántos meses no se tocan.

---

## Reglas duras

- **Cada decisión traza** a un eje de B4, a un rasgo de personalidad o a la idea madre.
- **No producís los archivos finales.** Los tokens y las piezas son de **⑥A Diseño**.
- **No generás fotografía del cliente.** Definís el tratamiento; la foto es de **⑤ Producción**.
- Todo asset generado para mostrar dirección va marcado `[asset generado]`.

## Cierre
Correr el bloque **Capa B5** de `agents/branding/qa/QA-GATES.md`.

## Handoff
→ `br-guia-aplicable`
