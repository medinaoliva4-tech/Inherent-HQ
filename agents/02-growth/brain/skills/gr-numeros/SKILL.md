---
name: gr-numeros
description: >
  Capa 6 de ② Growth — el Money OS, solo en Compound. Calcula qué producto deja y cuál quita,
  cuánto se puede pagar por un cliente y cuánto deja cada uno con el tiempo, y revisa precios y
  estructura para que quede más. Entra solo en Compound porque sin suficientes transacciones el
  margen por línea es teoría. Lo entrega Allan con Strategy, no un CFO contratado. Úsala cuando
  pidan "cuánto nos deja cada producto", "cuánto podemos pagar por un cliente", "dónde estamos
  perdiendo plata", "los números claros". Requiere Compound y datos reales de transacciones.
---

# Capa 6 · Números — el Money OS

| | |
|---|---|
| **Consume** | Transacciones reales del cliente · unit economics de ① · atribución de ⑩ |
| **Produce** | La sección **§ Los números** de `motor-de-crecimiento.md` |

## 1 · ⬜ Solo en Compound

🛑 **Sin transacciones suficientes, el margen por línea es teoría.**

> 🔑 **Es promesa publicada:** *«Tus números claros: qué producto te deja y cuál te quita.»*
> ⚠️ **No se promete un CFO.** Lo entrega **Money OS con Allan y Strategy.**

## 2 · Las cuatro preguntas

| Pregunta | Qué se calcula |
|---|---|
| **¿Qué producto deja y cuál quita?** | Margen por línea, con el costo real de entregar |
| **¿Cuánto se puede pagar por un cliente?** | CAC máximo, contra el valor de vida |
| **¿Cuánto deja cada cliente con el tiempo?** | LTV, con la frecuencia real |
| **¿Dónde se está yendo la plata?** | Costos por categoría, contra el ingreso que sostienen |

## 3 · El dato manda, y si no hay, se dice

| Situación | Qué se hace |
|---|---|
| Hay transacciones en un sistema | Se leen. **Se declara el período** |
| El cliente lo estima de memoria | `[dice el cliente, sin verificar]` · **no se decide sobre eso** |
| No hay registro | `⚠️ SIN DATOS` · 🔴 **se escala: el primer entregable es armar el registro** |

🛑 **Nunca se inventa un número.** Una decisión de precio sobre un margen estimado puede romper
el negocio del cliente.

## 4 · El margen por línea — cómo se arma

**El error más común es olvidar el costo de entregar.**

| Línea | Precio | Costo directo | **Costo de entregar** | Margen |
|---|---|---|---|---|
| | | Material | Tiempo, logística, devoluciones, soporte | |

> 🔑 **El producto más vendido no siempre es el que más deja.** Esta tabla es la que lo muestra.

## 5 · CAC y LTV — la relación, no los números sueltos

```
LTV ÷ CAC
```

| Resultado | Qué significa |
|---|---|
| **Menos de 1** | 🔴 **Se pierde plata con cada cliente nuevo.** Se para la pauta y se escala |
| **1 a 3** | Ajustado. El crecimiento consume caja |
| **3 o más** | Hay margen para invertir en adquisición |

⚠️ **Sin atribución limpia de ⑩ Ads no hay CAC real** — y sin CAC real esta capa es estimación.

## 6 · Qué se decide con esto

| Hallazgo | Decisión |
|---|---|
| Una línea tiene margen negativo | Se sube el precio, se baja el costo o **se discontinúa** |
| LTV ÷ CAC bajo 1 | 🔴 Se para la adquisición hasta arreglar la oferta o el costo |
| Un producto deja mucho y se vende poco | **Va al Pilar 3 y a ③ Marketing** como prioridad |
| Un costo no sostiene ingreso | Se propone cortarlo |

## 7 · 🔒 Lo que no sale de acá

🛑 **Los números de Inherent nunca se mezclan con los del cliente.**
**Nuestros costos y márgenes no se mencionan, ni como referencia ni como ejemplo.**
Ver `inherent/06-ECONOMIA.md` — **ese archivo no sale del repo.**

## 8 · Qué escribe

`## § Los números`:

| Bloque | Qué lleva |
|---|---|
| **A · El período y la fuente** | De dónde salen los datos |
| **B · Margen por línea** | La tabla, con costo de entregar |
| **C · CAC y LTV** | La relación, y qué significa |
| **D · Dónde se va la plata** | Costos contra el ingreso que sostienen |
| **E · Qué se decide** | Con responsable y fecha |
| **F · Los huecos** | `⚠️ SIN DATOS`, con quién los consigue |

## 9 · Checklist

- [ ] El plan es **Compound**
- [ ] Los datos son **reales**, con período y fuente declarados
- [ ] El margen por línea incluye el **costo de entregar**
- [ ] **LTV ÷ CAC** está calculado, o marcado sin datos
- [ ] Ningún número está **inventado**
- [ ] **No se mencionó ningún número de Inherent**
