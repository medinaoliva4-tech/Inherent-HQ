# Playbook — Tipografía (Capa B5.3)

La tipografía **habla como la marca**. No se elige porque se vea cool: se elige porque su
personalidad coincide con la de B2.4 y porque contrasta con lo que hace la categoría.

> 🛑 **Alcance de este playbook: elegir la familia.**
> La **escala** —tamaños, interlineado, tracking, ratios, cortes de línea— es de **⑥A Diseño**:
> `agents/design/systems/TIPOGRAFIA.md`. Acá no se fijan números de tamaño.

---

## Vocabulario mínimo

| | |
|---|---|
| **Tipografía / familia** | El conjunto completo. Ej: `Roboto` |
| **Fuente** | Una variante específica. Ej: `Roboto Bold` |

En la práctica digital vienen agrupadas, así que la distinción importa poco. Lo que importa es
declarar **familia + peso + tamaño + interlineado + tracking**.

---

## Los 4 tipos

| Tipo | Qué es | Personalidad típica | Uso |
|---|---|---|---|
| **Serif** | Con remates | Autoridad, tradición, editorial, confianza | Títulos, lectura larga, marcas formales y premium |
| **Sans serif** | Palo seco | Moderna, neutra, clara, directa | Todo. Es el default de pantalla |
| **Monoespaciada** | Todos los caracteres al mismo ancho | Técnica, precisa, de código | Datos, marcas técnicas, acento |
| **Display** | Diseñada para verse grande | Expresiva, carácter fuerte | **Solo títulos y carteles. Nunca cuerpo de texto** |

---

## Cuántas usar

| Cantidad | Cuándo |
|---|---|
| **1** | Sistemas sobrios. Una familia con buena escala de pesos alcanza y sobra |
| **2** | El default. Una para display/título, otra para cuerpo |
| **3** | **Solo con criterio probado.** La tercera casi siempre es un capricho |

Tener 400 tipografías instaladas no significa que haya que usarlas.

---

## Cómo combinar — contraste

La clave es **contraste**, no armonía. Dos sans neutras parecidas se ven como un error, no como un
sistema.

| Combinación | Funciona |
|---|---|
| Serif + sans serif | ✅ El contraste clásico |
| Una sola familia, pesos distintos | ✅ El más limpio |
| Sans + mono (para datos) | ✅ En marcas técnicas |
| Dos sans neutras distintas | ❌ Se lee como inconsistencia |
| Dos display | ❌ Ruido |

**Contraste de pesos:** si usás `Light`, saltá a `Medium` o `Bold`.
`Light + Regular` no es contraste — es un error que parece descuido.

---

## Lo que sí entrega Branding

| Campo | Se declara |
|---|---|
| **Rol** | Titulares · cuerpo · acento/dato |
| **Familia** | Nombre exacto |
| **Por qué esta** | Contra un rasgo de personalidad de B2.4 |
| **Pesos en uso** | Los que la marca usa de verdad, ej. `400 / 700` |
| **Contraste entre las dos** | serif+sans · una familia con salto grande · — |
| **Salto de peso** | `Light → Bold`, nunca `Light → Regular` |

**Contraste de pesos.** Si usás `Light`, saltá a `Medium` o `Bold`. `Light + Regular` no es
contraste — es un error que parece descuido. Esto **sí** es de Branding: define el carácter.

🛑 **Lo que NO entrega Branding:** tamaños en px, interlineado, tracking, ratios de escala,
cómo se corta un titular de 12 palabras en 4:5. Eso lo resuelve Diseño con la realidad de cada
formato, y si Branding lo fija, Diseño tiene que romperlo en la primera story.

## Cómo se elige una tipografía

Elegir tipografía es como elegir ropa: depende del contexto. Las preguntas, en orden:

1. **¿Qué personalidad transmite?** Interrogala: ¿es seria, divertida, audaz, elegante, cercana,
   técnica? ¿Coincide con un rasgo de B2.4?
2. **¿Qué tan legible es** en el tamaño y el medio donde se va a usar?
3. **¿Para qué es?** Logo, cartel, web, app, libro — no es lo mismo.
4. **¿Tiene todos los caracteres?** `ñ`, tildes, `¿`, `¡`, comillas, símbolo de moneda.
   **Una tipografía sin `ñ` no entra.** No hay excepción.
5. **¿Impresión o digital?** Afecta hinting, grosores finos y contraste.
6. **¿Contrasta con la categoría?** Si las 10 marcas de B1.3 usan la misma sans geométrica, usar
   otra igual es elegir ser invisible.

---

## Licencias — el punto que rompe entregas

| Dato | Se declara siempre |
|---|---|
| Nombre exacto de la familia | |
| Fundición / origen | Google Fonts · Adobe Fonts · comprada · custom |
| Tipo de licencia | desktop · web · app · redistribución |
| Quién la posee | el cliente / Inherent / nadie todavía |
| Costo | si hay que comprarla, el número |
| **Fallback** | la web-safe que la reemplaza en email y sistemas que no la soportan |

> Un manual que especifica una tipografía que el cliente no tiene licencia para usar no es un
> manual: es un problema legal con buena maqueta.

**Dónde buscar:** Google Fonts (gratis, licencia clara) · Adobe Fonts (incluida en CC) ·
fundiciones independientes (pago, mejor carácter). DaFont tiene cosas buenas y muchas malas — si
sale de ahí, se verifica licencia y set de caracteres antes de ponerla en el manual.

---

## Verificaciones antes de cerrar

- [ ] 1-2 familias (3 solo con justificación escrita)
- [ ] Cada rol tiene familia, por qué esa, y pesos en uso
- [ ] Hay contraste real entre los pesos usados
- [ ] No se fijó ninguna escala numérica — eso es de ⑥A Diseño
- [ ] `ñ`, tildes y signos de apertura verificados **carácter por carácter**
- [ ] Licencia declarada, con tipo y poseedor
- [ ] Fallback web-safe definido
- [ ] Legibilidad verificada a tamaño chico y comprimida
- [ ] La elección se justifica contra la personalidad **y** contra la saturación de categoría
- [ ] El logo, si es wordmark, tiene su tipografía declarada aparte y **vectorizada**
