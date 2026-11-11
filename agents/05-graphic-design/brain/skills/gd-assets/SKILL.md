---
name: gd-assets
description: >
  ⑤ Diseño gráfico — los assets que van ENCIMA de las piezas: elementos gráficos, texturas,
  formas, recortes, ilustraciones y fondos que son difíciles de hacer en Figma. El agente los
  delega a un modelo de imagen potente (OpenAI gpt-image) con un pedido exacto (PNG transparente
  cuando aplica, tamaño, paleta y reglas de br-sistema, referencia visual, varias variantes),
  muestra el costo y pide OK antes de generar, verifica el resultado, lo guarda con su cabecera de
  nodo y lo coloca como capa en Figma o en una escena del editor de video. Una persona lo aprueba.
  Úsala cuando pidan "una textura", "un elemento gráfico", "un recorte", "una ilustración",
  "un fondo", "algo detrás de la cabeza", "esto no sale en Figma".
---

# Assets con modelo de imagen — el agente pide, verifica y coloca

> 🔑 **No es una herramienta de la interfaz:** es una capa más de la pieza. El agente de diseño
> **no dibuja el asset**: lo pide a un modelo de imagen *(OpenAI gpt-image)*, lo revisa y lo pone
> donde va. **Cada generación cuesta dinero y una persona aprueba el resultado.**

| | |
|---|---|
| **Consume** | El nodo `pieza` o la escena que lo pide · `sistema-visual.md` y las variables de Figma de `br-sistema` · una referencia visual, si hay |
| **Produce** | Los archivos en el Drive del cliente, `01 Assets de marca/generados/`, con su ficha `.md` de nodo (`tipo: asset`, `viene_de: [pieza-…]`) · la capa en Figma o en la escena del editor · la línea de gasto |

## 1 · Cuándo sí

Texturas, formas, patrones, recortes, ilustraciones, fondos y elementos que van detrás o encima de
una persona o un producto, y que no salen limpios con la plantilla. **Si se hace en Figma en minutos,
no se genera.** 🛑 **La foto base de la pieza no se genera:** sale del banco o del rodaje.

## 2 · El pedido — exacto, sin dejar nada al gusto del modelo

| Campo | Qué se escribe |
|---|---|
| **Qué es** | El elemento en una frase y dónde va en la pieza *(«ondas detrás de la cabeza, a la izquierda»)* |
| **Formato** | **PNG con fondo transparente** cuando va encima; fondo completo solo si es fondo |
| **Tamaño** | El exacto de la capa o del formato *(1080×1920, 1080×1350…)* |
| **Paleta y marca** | Solo los hex de `br-sistema` con su rol, **un solo acento**, el estilo de imagen y lo prohibido |
| **Referencia** | La imagen de referencia del radar o de la marca, si hay |
| **Variantes** | 3 a 4 por asset, para elegir |
| **Nombre** | `<id-pieza>-<asset>-v1-a.png` … |

🛑 **Nunca se genera un logo, una persona real ni una marca de terceros.** El logo se usa del archivo
oficial; las personas salen del rodaje.

## 3 · El costo — se muestra y se aprueba antes

1. Antes de cada lote se muestra: cuántas imágenes, tamaño y calidad, **el precio por imagen leído de
   la página de precios de OpenAI ese día** y el total. **Sin precio leído, no se estima.**
2. **Se genera solo con el OK de la persona** para ese lote.
3. Cada lote se registra en la ficha del nodo y en el gasto del mes del cliente: fecha, pieza,
   cuántas imágenes y costo real. Es el dato que usa el planificador de presupuesto *(rubro
   Herramientas / IA)*. Si el lote pasa lo previsto para el cliente, se avisa al COO.

## 4 · Verificar antes de mostrarlo

- **Abrirlo** y **medirlo:** tamaño exacto, peso razonable, **el canal de transparencia existe** donde
  se pidió *(sin halos blancos en el borde)*.
- **Marca:** solo colores de la paleta *(se comparan los hex dominantes)*, un acento, estilo del
  sistema.
- **Nada deformado:** ni letras raras, ni logos, ni rostros. Si el asset va junto a una persona real,
  se revisa que no la toque ni la cambie.
- Si falla, se vuelve a pedir con lo que falló *(y con su costo)*; no se arregla a ojo.

## 5 · Colocarlo y aprobarlo

- **Figma:** `import_image` como capa sobre la instancia de la plantilla, nombrada con el id del asset.
- **Video:** como capa en la escena del motor *(`brain/motor/` de ④ Producción)* o del editor; se
  avisa a ④ Producción en qué escena va.
- **La persona elige la variante y aprueba** la pieza con el asset puesto; entonces la cabecera pasa
  a `estado: aprobado`. Cada versión se guarda, nada se sobreescribe.

🔒 **La llave de la API vive en las variables de entorno de cada máquina** *(`OPENAI_API_KEY`)*:
nunca en el repo ni en el chat.
