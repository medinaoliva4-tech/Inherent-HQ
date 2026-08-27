# Higgsfield — Cinematic Cameras Generate

## Función dentro del sistema

Esta integración ejecuta la dirección visual definida por el skill `/generate-images`.

Para el flujo de imagen por referencia, la operación parte de:

```text
assets/originals/    = sujeto/producto que debe mantenerse
assets/references/   = look/dirección que queremos aproximar
brand_context/       = verdad y restricciones de la marca
context/             = metodología inmutable
```

## No es un flujo de “mejora”

No usar Higgsfield simplemente para mejorar resolución, embellecer o retocar la foto original.

El objetivo es **crear una nueva ejecución visual** que mantenga la identidad del original y adopte atributos visuales seleccionados de la referencia.

## Flujo obligatorio

1. Leer la metodología relevante de `context/` sin editarla.
2. Leer el contexto específico de la marca en `brand_context/`.
3. Seleccionar el original correcto en `assets/originals/`.
4. Seleccionar la referencia correcta en `assets/references/`.
5. Definir `INVARIANTES` del original.
6. Definir `ATRIBUTOS_TRANSFERIBLES` de la referencia.
7. Construir un brief de generación que separe ambas listas.
8. Ejecutar mediante **Cinematic Cameras Generate**.
9. Comparar resultado contra original, referencia y marca.
10. Guardar la imagen aprobada en `outputs/images/` o en la campaña correspondiente.

## Prioridad de fidelidad

Si hay conflicto entre “parecerse más al referente” y “mantener correctamente el producto/sujeto”, priorizar la fidelidad al producto/sujeto.

## Qué puede transferirse desde la referencia

- composición;
- cámara/ángulo;
- sensación óptica;
- iluminación;
- profundidad;
- fondo;
- styling;
- textura;
- atmósfera;
- grading;
- lenguaje fotográfico.

## Qué debe provenir del original o de la marca

- identidad del producto/sujeto;
- packaging real;
- proporciones y rasgos distintivos;
- logos y códigos de marca;
- claims o texto factual;
- elementos expresamente marcados como inmutables.

## Output

Este flujo genera imágenes. Guardarlas por defecto en `outputs/images/`.
