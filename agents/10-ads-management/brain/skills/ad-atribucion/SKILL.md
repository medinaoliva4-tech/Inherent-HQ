---
name: ad-atribucion
description: >
  Capa 5 de ⑩ Ads Management — mide qué ventas vinieron de nuestro trabajo y cuáles no, que es
  lo que habilita el performance fee. Separa lo atribuible del tráfico preexistente, declara la
  ventana y el modelo usado, y marca sin datos antes que inflar un número. Sin atribución limpia
  no hay fee. Úsala cuando pidan "cuánto vendimos por pauta", "cuánto se atribuye", "el fee de
  este mes", "cómo sabemos que fue la pauta". Requiere tracking funcionando desde antes del
  primer gasto.
---

# Capa 5 · Atribución — qué vino de acá

| | |
|---|---|
| **Consume** | Las conversiones de cada plataforma · las ventas reales del cliente |
| **Produce** | La sección **§ Atribución** de `reporte-de-pauta.md` |

> 🔑 **Esta capa es la que habilita el performance fee: 10% de las ventas atribuidas.**
> ⚠️ **Sin atribución limpia no hay fee.**

## 1 · Qué se atribuye y qué no

| ✅ Se atribuye | ❌ No se atribuye |
|---|---|
| Venta que vino de un clic en la pauta | Tráfico que ya existía antes |
| Venta de alguien que llegó por contenido nuestro | Venta de cliente recurrente que compraba igual |
| Lead que entró por un formulario nuestro y cerró | Referido que no pasó por nada nuestro |

🛑 **Inflar la atribución es la forma más rápida de perder la confianza del cliente**, y el fee
depende de esa confianza.

## 2 · Siempre se declara el modelo

**Un número de atribución sin modelo no significa nada.**

| Se declara | Ejemplo |
|---|---|
| **La ventana** | 7 días clic, 1 día visualización |
| **El modelo** | Último clic, primero clic |
| **La fuente** | La plataforma, el sistema del cliente, o el cruce de los dos |

> 🔑 **La plataforma siempre reporta de más.** Meta y el sistema del cliente nunca coinciden, y
> el número que vale es **el del cliente**.

## 3 · El cruce con las ventas reales

| Paso | Qué se hace |
|---|---|
| **1** | Se toman las conversiones que reporta cada plataforma |
| **2** | Se toman las ventas reales del cliente, del mismo período |
| **3** | Se cruza. **La diferencia se declara, no se promedia** |
| **4** | Se usa **el número del cliente** como base del fee |

## 4 · ⚠️ Cuando no se puede medir

| Situación | Qué se hace |
|---|---|
| No hay pixel ni conversión configurada | `⚠️ SIN DATOS` · 🔴 **se escala.** Sin esto no hay fee |
| El cliente no comparte sus ventas | 🔴 Se escala a Allan. **Es conversación comercial** |
| La venta cierra por WhatsApp sin rastro | Se propone un identificador. **Mientras tanto, no se atribuye** |

🛑 **Nunca se estima el fee.** Un fee sobre un número inventado es un cobro sin respaldo.

## 5 · Qué escribe

`## § Atribución`:

| Bloque | Qué lleva |
|---|---|
| **A · El modelo** | Ventana, modelo y fuente |
| **B · Lo que reporta la plataforma** | Por campaña |
| **C · Las ventas reales** | Del cliente, mismo período |
| **D · Lo atribuido** | El número que vale, con el criterio |
| **E · El fee** | 10% de lo atribuido · o por qué no se puede calcular |
| **F · Qué falta medir** | Con responsable |

## 6 · Checklist

- [ ] El **modelo y la ventana** están declarados
- [ ] Se cruzó contra las **ventas reales del cliente**
- [ ] La diferencia entre plataforma y cliente está **declarada**
- [ ] Se usó **el número del cliente** como base
- [ ] **Nada se estimó.** Si no se pudo medir, está escrito
