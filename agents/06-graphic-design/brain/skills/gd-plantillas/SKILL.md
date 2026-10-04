---
name: gd-plantillas
description: >
  Capa 1 de ⑥A Diseño gráfico — arma el sistema de plantillas del ciclo, que es lo que hace
  posible producir 168 piezas sin tomar 168 decisiones. Una plantilla por combinación de formato
  y tipo de contenido, con las zonas de texto, imagen y activo ya fijadas, probada con el copy
  más largo y el más corto del ciclo. Se aprueba el molde, no las piezas. Úsala cuando pidan
  "las plantillas del mes", "el molde", "cómo vamos a producir tanto", "esto no escala".
  Requiere la Capa 0. Cierra con el GATE 1.
---

# Capa 1 · Plantillas — el sistema que hace posible el volumen

| | |
|---|---|
| **Consume** | § Agrupación del ciclo · `sistema-visual.md` · el copy de todas las piezas |
| **Produce** | Las **plantillas del ciclo** en `clients/<cliente>/data/plantillas/` |

> 🔑 **Esta capa decide si el ciclo entra en las horas que paga el plan.**

## 1 · Qué es una plantilla acá

**Un molde con las zonas ya fijadas.** Lo único que cambia entre piezas es el contenido.

| Fijo en la plantilla | Cambia por pieza |
|---|---|
| Grilla, márgenes, safe zones | El texto |
| Posición y tamaño de cada zona de texto | La imagen |
| Dónde va el activo distintivo | El color de acento *(si el sistema lo permite)* |
| Jerarquía tipográfica | — |

## 2 · Cuántas plantillas

**Una por combinación de formato × tipo de contenido.**

| Formato | Tipos típicos |
|---|---|
| **Carrusel** | Portada · desarrollo · cierre |
| **Estático de feed** | Dato · cita · producto · anuncio |
| **Story** | Texto sobre imagen · pregunta · enlace |

| Cuántas en total | Qué pasa |
|---|---|
| **3-5** | Ciclo monótono. La audiencia ve siempre lo mismo |
| **6-12** | ✅ El rango que funciona |
| **13+** | Ya no es sistema: es diseñar pieza por pieza con pasos extra |

## 3 · La prueba de estrés — se hace antes del gate

**Toda plantilla se prueba con los dos extremos del ciclo:**

| Prueba | Qué se verifica |
|---|---|
| **El copy más largo** | Entra sin romper la jerarquía ni salirse de la safe zone |
| **El copy más corto** | No deja un vacío que parezca error |
| **La imagen peor** | Baja resolución, mal encuadre: ¿la plantilla la sostiene? |
| **Sin imagen** | ¿Hay una variante que funcione solo con tipografía? |

🛑 **Una plantilla que solo funciona con el copy ideal se rompe en la pieza 12** — y ahí ya no
hay tiempo de rehacerla.

## 4 · El activo distintivo va en la plantilla

**No se agrega pieza por pieza: está en el molde.** Es lo que garantiza que aparezca en el 100%
de las piezas, como `br-activos` exige.

## 5 · Las plantillas se reusan ciclo a ciclo

**No se rehacen cada mes.** Se guardan en `clients/<cliente>/data/plantillas/` y el ciclo
siguiente:

| | |
|---|---|
| **Se reusan** las que `gd-loop` marcó como usadas y sin devoluciones |
| **Se arreglan** las que generaron devoluciones |
| **Se agregan** solo las que un formato nuevo exige |

> 🔑 **Un cliente en su tercer ciclo debería estar agregando una plantilla, no doce.**

## 6 · Cuando el sistema no alcanza

**Si una pieza necesita algo que `sistema-visual.md` no define:**

↩️ **Se devuelve a ②B con la regla que falta**, escrita como pregunta concreta:
*«¿Qué tratamiento lleva un número grande sobre fondo de acento?»*

🛑 **No se inventa la regla acá.** Una decisión tomada en ⑥A se vuelve precedente sin que ②B se
entere, y al tercer ciclo el sistema tiene dos reglas contradictorias.

## 7 · 🚦 GATE 1

**Allan aprueba las plantillas, no las 168 piezas.**

> 🔑 **Es el gate que hace viable el departamento.** Con el molde aprobado, las piezas son
> ejecución y se revisan en el GATE 2 como paquete.

## 8 · Checklist

- [ ] Hay entre **6 y 12** plantillas
- [ ] Cada una tiene **zonas fijas** y solo cambia el contenido
- [ ] Cada una pasó la **prueba de estrés** con los cuatro extremos
- [ ] El **activo distintivo está en el molde**, no agregado por pieza
- [ ] Se **reusaron** las del ciclo anterior que no dieron devoluciones
- [ ] Lo que el sistema no cubría **se devolvió a ②B**, no se inventó
- [ ] **Allan aprobó el GATE 1**
