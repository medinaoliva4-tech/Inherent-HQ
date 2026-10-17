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

🔷 **En Marketing y Marketing Pro no hay fee:** antes de gastar basta el pixel de Meta. **La
atribución limpia (CAPI + GA4) y el performance fee son de 🟨 Accelerate y Compound.**

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
| No hay pixel ni conversión configurada | `⚠️ SIN DATOS` · 🔴 **se escala al COO.** Sin esto no hay fee |
| El cliente no comparte sus ventas | 🔴 Se escala al CEO. **Es conversación comercial** |
| La venta cierra por WhatsApp sin rastro | Se propone un identificador. **Mientras tanto, no se atribuye** |

🛑 **Nunca se estima el fee.** Un fee sobre un número inventado es un cobro sin respaldo.

## 5 · El CAC — cuánto costó cada cliente nuevo

```
CAC = gasto de adquisición del período ÷ clientes nuevos del mismo período
```

| Se declara | Cómo |
|---|---|
| **Qué gasto entra** | **CAC de pauta:** la inversión publicitaria. **CAC completo:** pauta + lo que el cliente declare que gasta en conseguir clientes *(comisiones, herramientas, equipo comercial)* |
| **Qué clientes cuentan** | **CAC pagado:** solo los clientes **atribuidos** (§1). **CAC mezclado:** todos los clientes nuevos. Se muestran los dos, **con su nombre** |
| **El período** | El mismo en el gasto y en los clientes. **Se declara** |

**De dónde sale cada dato:**

| Dato | Fuente |
|---|---|
| **Gasto de pauta** | La plataforma: AdWhispr `get_account_performance` o Windsor. **Es el gasto real, no el presupuesto** |
| **Otros gastos de adquisición** | Los que **el cliente** declara. Para Inherent, la contabilidad. Lo que no se declara no entra |
| **Clientes nuevos** | **Las ventas del cliente** *(su sistema o su CRM)*, no el conteo de la plataforma. Para Inherent, los planes nuevos de `clients/` *(`00-onboarding/plan-contratado.md`)* |

🛑 **El CAC no se estima ni se completa con un promedio.** Si falta el gasto o el conteo de clientes
nuevos: `⚠️ SIN DATOS`. **Con cero clientes nuevos el CAC no existe:** no se divide por cero ni se
reporta el gasto como si fuera el CAC.

- **No es el costo por lead.** El costo por lead va aparte, en `gr-captura`: un lead no es un cliente.
- **No es la base del fee.** El fee se calcula sobre las **ventas** atribuidas (§3); el CAC **lee** cuánto costó conseguirlas.
- 🔷 **En Marketing y Marketing Pro** se calcula solo si el cliente comparte sus ventas, y **no es base de ningún cobro**.
- **Lo lee `gr-numeros`** *(Money OS · LTV ÷ CAC)* y alimenta `ad-loop`.

## 6 · Qué escribe

`## § Atribución`:

| Bloque | Qué lleva |
|---|---|
| **A · El modelo** | Ventana, modelo y fuente |
| **B · Lo que reporta la plataforma** | Por campaña |
| **C · Las ventas reales** | Del cliente, mismo período |
| **D · Lo atribuido** | El número que vale, con el criterio |
| **E · El fee** | 10% de lo atribuido · o por qué no se puede calcular |
| **F · El CAC** | Pagado y mezclado · gasto que entró · clientes nuevos · período · fuente de cada dato |
| **G · Qué falta medir** | Con responsable |

## 7 · Checklist

- [ ] El **modelo y la ventana** están declarados
- [ ] Se cruzó contra las **ventas reales del cliente**
- [ ] La diferencia entre plataforma y cliente está **declarada**
- [ ] Se usó **el número del cliente** como base
- [ ] El **CAC** declara qué gasto entró, qué clientes cuentan y el período, y los **clientes nuevos salen de las ventas del cliente**
- [ ] El **CAC pagado y el mezclado** están **con su nombre**; ninguno se calculó con cero clientes
- [ ] **Nada se estimó.** Si no se pudo medir, está escrito
