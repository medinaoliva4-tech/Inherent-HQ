# Tipografía

La tipografía es el 70% del trabajo en social estático. No es una decisión estética: es la
herramienta principal de jerarquía.

---

## Escala — máximo 4 tamaños por formato

| Rol | Para qué | Regla |
|---|---|---|
| **Titular** | El nivel 1 | Se lee al 10% de tamaño. Peso alto |
| **Subtítulo** | El nivel 2 | 50-65% del titular. Peso medio |
| **Cuerpo** | Texto corrido, ítems de lista | Legible en pantalla chica |
| **Micro** | Legales, firma, fecha, fuente | Presente, no protagonista |

**Cuatro. No cinco.** Una escala de 12 tamaños es una escala que nadie respeta.

### Relación entre tamaños
Ratio recomendado entre niveles: **1.5x a 2x**. Menos de 1.3x y los niveles se confunden — el ojo
lee "dos cosas parecidas", no "una principal y una secundaria".

---

## Pisos de legibilidad en social

Referencia sobre lienzo de **1080px de ancho** (el estándar de IG/FB):

| Rol | Piso sugerido | Por qué |
|---|---|---|
| Micro / legales | ~24px | Debajo de esto desaparece en el feed comprimido |
| Cuerpo | ~34px | Piso de lectura cómoda en teléfono |
| Subtítulo | ~48px | |
| Titular | ~72px | Para que sobreviva el test de miniatura |

🟡 Son **pisos operativos**, no reglas de plataforma. Se ajustan por familia tipográfica (una
grotesca condensada necesita más que una humanista) — pero se ajustan **una vez en D0** y después
se respetan.

---

## Interlineado y tracking

| Rol | Interlineado | Tracking |
|---|---|---|
| Titular | 0.9x – 1.1x del tamaño | Levemente negativo (-1% a -3%) |
| Subtítulo | 1.2x | 0 |
| Cuerpo | 1.4x – 1.5x | 0 |
| Micro | 1.3x | Levemente positivo (+2% a +5%) |

**Regla:** cuanto más grande el texto, **más apretado** el interlineado y el tracking.
Cuanto más chico, más aire. Un titular con interlineado de cuerpo se ve flojo; un micro apretado
se vuelve ilegible.

---

## Cortes de línea

En social se **corta a mano**, no se deja que el contenedor decida.

| Regla | Por qué |
|---|---|
| Cortar por unidad de sentido | "Cómo hacer que tu / negocio crezca" ✅ · "Cómo hacer que / tu negocio crezca" 🛑 |
| Nunca dejar una palabra sola en la última línea | Rompe el bloque visual |
| Máx. 3 líneas en un titular | Cuatro líneas ya no es titular, es párrafo |
| Máx. ~40 caracteres por línea en cuerpo | Más que eso cansa en pantalla vertical |

---

## Énfasis — cómo destacar sin romper la escala

En orden de preferencia:
1. **Peso** (bold dentro de la misma familia)
2. **Color** (un token de la paleta, con contraste verificado)
3. **Pincelada / subrayado gráfico** detrás de la palabra
4. **Tamaño** — último recurso, porque rompe la escala

🛑 **Nunca:** mayúsculas cerradas en bloques largos · subrayado tipográfico clásico · itálica +
bold + color + tamaño a la vez · más de **2 palabras destacadas** por pieza.

---

## Anti-patrones

| Escenario | Por qué falla | En cambio |
|---|---|---|
| Escalar el titular "para que entre" | Rompe la escala; el lote pierde familia | Cortar copy, o pasar a otro layout |
| Tres familias tipográficas en una pieza | Ruido; ninguna jerarquía es legible | Máx. 2 familias, y la segunda con rol fijo |
| Texto justificado | Genera ríos de espacio; ilegible en pantalla chica | Alineado a izquierda (o centrado si el layout lo pide) |
| Titular en mayúsculas de 3 líneas | Sin ascendentes/descendentes no hay forma de palabra que reconocer | Caja mixta, o mayúsculas solo en ≤5 palabras |
| Texto sobre la zona más ruidosa de la foto | Ilegible sin importar el tamaño | Reencuadrar, o scrim, o bloque sólido |
| Tracking negativo en cuerpo chico | Las letras se tocan al comprimir | Tracking 0 o positivo bajo el tamaño de subtítulo |
