# /generate-images — Reference-Driven Image Generation

## Propósito

Crear una **imagen nueva** conservando la identidad de un producto/sujeto original y acercando la dirección visual al referente elegido.

No tratar esta habilidad como “mejorar”, “enhance” o retocar una imagen existente.

## Inputs obligatorios

1. **Original** — una o más imágenes desde `assets/originals/`.
2. **Referencia** — una o más imágenes desde `assets/references/`.
3. **Metodología** — leer `context/BRAND.md`, `context/DESIGN.md`, `context/CONTENT.md` y `context/PILARESDECONTENIDO.md`.
4. **Contexto de marca** — leer los archivos relevantes de `brand_context/`, especialmente `brand/`, `offer/`, `design/` y `content/`.
5. **Objetivo/brief** — destino de la imagen: ad, orgánico, campaña, hero, menú, story, etc.

Si falta el original o la referencia, no inventarlos. Pedirlos o marcar el job como incompleto.

## Modelo mental

```text
ORIGINAL = identidad
REFERENCIA = dirección visual
MARCA = reglas y coherencia
BRIEF = objetivo
        ↓
NUEVA IMAGEN
```

## Paso 1 — Analizar el original

Extraer lo que debe permanecer. Ejemplos:

- producto o sujeto;
- geometría y proporciones;
- packaging;
- colores propios;
- ingredientes o componentes visibles;
- logos/rasgos distintivos;
- cualquier elemento marcado como intocable.

Crear internamente una lista `INVARIANTES`.

## Paso 2 — Analizar la referencia

Extraer la dirección visual sin confundirla con el contenido que debe copiarse. Analizar:

- composición;
- encuadre;
- ángulo de cámara;
- sensación de lente;
- distancia al sujeto;
- luz y sombras;
- contraste;
- profundidad de campo;
- fondo/escenario;
- styling;
- textura;
- atmósfera;
- color grading;
- densidad y jerarquía visual.

Crear internamente una lista `ATRIBUTOS_TRANSFERIBLES`.

## Paso 3 — Cruzar con la marca

Antes de generar, validar que la referencia no contradiga los códigos de la marca activa cargados en `brand_context/`.

La referencia no manda sobre la marca. Sirve como lenguaje visual para acercarse a una dirección deseada.

## Paso 4 — Construir el brief de generación

El brief debe expresar por separado:

```text
KEEP FROM ORIGINAL:
...

BORROW FROM REFERENCE:
...

BRAND CONSTRAINTS:
...

NEW SCENE / COMPOSITION:
...

DO NOT CHANGE:
...

OUTPUT USE:
...
```

## Paso 5 — Ejecutar Higgsfield

Toda ejecución de este skill con Higgsfield debe pasar por:

`integrations/higgsfield/cinematic-cameras-generate/`

No usar una ruta genérica de “image improvement”.

## Paso 6 — QA

Comparar el resultado con los tres anclajes:

### Fidelidad al original
- ¿Sigue siendo claramente el mismo producto/sujeto?
- ¿Se conservaron los rasgos que no podían cambiar?

### Cercanía a la referencia
- ¿La composición, luz, cámara y atmósfera se acercan a la dirección elegida?
- ¿Se tomó la dirección visual sin copiar literalmente el contenido del referente?

### Coherencia de marca
- ¿El resultado respeta los códigos específicos cargados en `brand_context/`?

Si falla la fidelidad del producto, la generación se considera fallida aunque la estética sea buena.

## Output

Guardar la imagen seleccionada en `outputs/images/` o dentro del folder de la campaña correspondiente.

## Ejemplo

Un restaurante entrega:

- una foto original de su hamburguesa;
- una fotografía de otro restaurante cuyo estilo de Instagram le gusta.

La tarea no es convertir la foto original en una copia del referente. La tarea es generar una nueva foto donde la hamburguesa siga siendo la hamburguesa del cliente, mientras cámara, composición, iluminación, atmósfera y dirección de arte se acercan al referente y continúan siendo coherentes con la marca del cliente.
