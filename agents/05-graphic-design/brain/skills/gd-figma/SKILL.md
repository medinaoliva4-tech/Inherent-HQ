---
name: gd-figma
description: >
  ⑤ Diseño gráfico en Figma (Figwright) — el agente arma los borradores de carruseles, posts,
  estáticos y stories sobre las plantillas del cliente, con el copy literal de ③ Marketing y
  Creative y las imágenes del banco o del rodaje; una persona los corrige y aprueba en Figma.
  Verifica jerarquía, un foco, un acento, safe zones y que la slide 1 se entienda sola, y exporta
  con el id de la pieza. Úsala cuando pidan "armá el carrusel", "los borradores en Figma",
  "componé las piezas", "llená las plantillas", "exportá el paquete de diseño".
---

# Diseño en Figma — borradores por agente, aprobación humana

> 🔑 **Figma es el lugar de trabajo.** El agente arma borradores sobre las plantillas que dejó
> ② Branding; la persona corrige ahí mismo y aprueba. **Es ejecución, no diseño:** si una pieza
> pide una decisión nueva, la plantilla está mal y se avisa a ② Branding.

| | |
|---|---|
| **Consume** | Nodos `pieza` aprobados sin video *(estático, carrusel, story)* · el archivo de Figma del cliente con sus plantillas, variables y estilos · imágenes del banco o de `03 Crudo` |
| **Produce** | Una página por ciclo en el Figma del cliente con los borradores · los exports en el Drive *(`04 Por postear`)* · el nodo `pieza` con el link y su estado |

## 1 · Antes de abrir Figma

- `ping` de Figwright: si el plugin no está abierto, `BLOQUEADO — abrí el plugin de Figwright`.
- Leer lo que el archivo ya tiene: `get_variable_defs`, `scan_components`, `get_styles`. **Se usa
  la plantilla y se enlaza la variable; nunca se dibuja con valores a mano.**
- Cada pieza trae copy literal y formato. Si falta, vuelve a ③.

## 2 · Armar los borradores

1. **Una página por ciclo** *(`<AAAA-MM> · borradores`)* y un frame por pieza, nombrado con su id.
2. **Instancia de la plantilla** del formato → texto literal en sus capas → imagen en su zona.
3. **Lotes de 15 a 40 operaciones**: primero crear, después estilizar.
4. **Imagen:** banco propio → material del rodaje → pedirle al cliente. No se genera imagen con IA
   desde cero. Se verifica resolución, encuadre y derechos antes de componer.

## 3 · Auto-revisión por pieza

- Slide 1 = hook y se entiende sola · cada slide se sostiene sola
- Copy **literal**, sin acortar · un foco visual y **un solo acento**
- Jerarquía título > subtítulo > CTA · texto dentro de safe zones · activo distintivo en la slide 1
- Se lee al tamaño del feed *(`get_screenshot` para verificar)*

Cumple las fichas 2, 3 y 4 de `inherent/08-CRITERIOS-DE-ACEPTACION.md`.

## 4 · Aprobación y export

La persona corrige en Figma y marca la pieza aprobada. Entonces se exporta *(`export_pdf` o
imágenes)* con las medidas del formato, sRGB, y **el id de la pieza en el nombre**. Lo devuelto por
`br-guardian` se corrige en el mismo frame.
