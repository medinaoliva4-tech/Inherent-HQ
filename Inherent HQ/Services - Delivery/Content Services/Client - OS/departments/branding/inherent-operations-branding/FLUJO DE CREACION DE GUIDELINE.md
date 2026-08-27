# FLUJO DE CREACION DE GUIDELINE

# Flujo de creación de Brand Guidelines

La creación de las Brand Guidelines debe seguir un flujo controlado y basado primero en la información real de la marca y después en su construcción visual.

## 1. Acceso a la fuente de información

El proceso se ejecuta utilizando **Playwright**, ya que permite un mayor nivel de control sobre la navegación y la interacción con las herramientas que Cloud Chrome.

El primer requisito es contar con el **link del tablero de Milanote de la marca**.

Milanote funciona como la fuente principal de contexto de branding. Ahí puede existir información como:

- Esencia y personalidad de marca.
- Cómo debe sentirse la marca.
- Notas estratégicas.
- Descripciones conceptuales.
- Referencias visuales.
- Fotografías.
- Logos.
- Colores.
- Texturas.
- Elementos gráficos.
- Otros assets relevantes.

**Si no se proporciona el link de Milanote, este es un bloqueante y debe solicitarse antes de continuar.**

## 2. Consumo completo de Milanote

Una vez obtenido el link, se debe recorrer y consumir todo el contenido relevante del tablero.

No se debe limitar únicamente a leer los textos. Se debe identificar y separar:

**Contenido textual**

→ notas, conceptos, descripciones, estrategia, personalidad, dirección visual, etc.

**Contenido visual**

→ fotografías, logos, colores, texturas, gráficos, referencias y demás assets.

Toda la información textual debe convertirse en un **documento estructurado de contexto de marca** que pueda utilizarse posteriormente durante todo el proceso de creación de las guidelines.

Este documento debe funcionar como una fuente de verdad para mantener consistencia con lo que la marca realmente representa.

## 3. Descarga y organización de assets

Todos los assets visuales relevantes encontrados en Milanote deben ser descargados y organizados en un folder de trabajo.

Esto incluye, entre otros:

- Fotografías.
- Logos.
- Variaciones de logo.
- Texturas.
- Elementos gráficos.
- Recursos visuales de referencia.
- Otros elementos que puedan formar parte de las guidelines.

No es necesario preservar obligatoriamente los archivos originales. Lo importante es contar con una copia utilizable de cada recurso para incorporarlo posteriormente al guideline.

## 4. Análisis fotográfico

Cada fotografía debe analizarse individualmente para identificar **qué estilo fotográfico representa**.

El objetivo no es crear un análisis técnico excesivamente detallado, sino entender de manera sencilla:

- Cómo se siente la fotografía.
- Qué tipo de luz utiliza.
- Qué tipo de composición tiene.
- Qué tipo de encuadres predominan.
- Qué tan espontánea, editorial, aspiracional, documental, etc. se percibe.
- Qué características hacen que esa fotografía se sienta alineada con la marca.

A partir de este análisis se debe generar un **prompt corto y de alto nivel para describir el estilo fotográfico de la marca**.

Este prompt debe servir posteriormente como referencia para crear nuevas imágenes consistentes con la identidad visual.

## 5. Consolidación de la identidad visual

Una vez procesado Milanote, se debe tener identificado y organizado todo lo necesario para construir las guidelines:

**Brand context**

→ documento textual con la información de branding.

**Visual assets**

→ logos, fotografías, texturas, gráficos y demás recursos.

**Visual system**

→ colores, estilos gráficos, tratamiento fotográfico y demás patrones visuales detectados.

**Photography direction**

→ prompt general que describe cómo debe sentirse la fotografía de la marca.

## 6. Construcción de las Brand Guidelines en Figma

Con toda la información y los assets preparados, se pasa a la construcción del documento final en **Figma**.

Para esta etapa se debe utilizar **FigWright**.

**No utilizar el MCP oficial de Figma.**

Antes de comenzar la construcción en Figma, el sistema debe asegurarse de que **FigWright esté disponible y pueda ejecutarse**.

Para utilizar FigWright, debe realizarse un **llamado desde la terminal**. El flujo puede:

- Ejecutar directamente el comando necesario desde la terminal cuando tenga acceso a ella.
- O, si no tiene acceso directo, **indicar al usuario que abra la terminal y realizar el llamado necesario para iniciar o utilizar FigWright**.

Este paso es obligatorio antes de intentar construir el guideline en Figma, ya que **FigWright es la herramienta encargada de generar y manipular el documento**.

FigWright utilizará como contexto:

- El documento textual generado a partir de Milanote.
- Los assets descargados.
- Los colores identificados.
- Los logos.
- Las texturas.
- Los elementos gráficos.
- Las referencias visuales.
- El análisis y prompt de fotografía.

La generación en Figma debe traducir todo este material en un **Brand Guideline coherente, visualmente estructurado y fiel a la identidad de la marca**, evitando inventar elementos que no estén respaldados por la información recopilada.

## Flujo resumido

**Milanote link**

↓

**Playwright**

↓

**Consumir todo el contenido**

↓

**Extraer contexto textual**

↓

**Crear documento de contexto de marca**

↓

**Descargar y organizar assets**

↓

**Analizar fotografías**

↓

**Crear prompt general de estilo fotográfico**

↓

**Consolidar colores + logos + texturas + gráficos + fotografía**

↓

**Abrir / ejecutar FigWright desde Terminal**

↓

**FigWright**

↓

**Figma**

↓

**Brand Guidelines finales**