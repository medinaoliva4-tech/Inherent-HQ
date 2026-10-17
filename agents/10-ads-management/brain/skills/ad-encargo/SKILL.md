---
name: ad-encargo
description: >
  Capa 0 de ⑩ Ads Management — fija el objetivo en una métrica, el presupuesto aprobado y qué se
  está vendiendo, antes de tocar una cuenta. Verifica que exista acceso a las cuentas, que el
  tracking del plan esté puesto (en la línea Marketing, el pixel de Meta; en Accelerate y
  Compound, CAPI + GA4) y que el cliente pueda entregar lo que la pauta va a traer. Corre la
  auditoría del plugin para saber en qué estado está la cuenta. Úsala cuando pidan "arrancá la
  pauta de X", "cuánto presupuesto", "qué objetivo le ponemos", "cómo está la cuenta". Bloquea
  si falta el presupuesto aprobado o el acceso.
---

# Capa 0 · Encargo — objetivo, presupuesto y estado de la cuenta

| | |
|---|---|
| **Consume** | Las ofertas a pautar de ② Growth — 🔷 `clients/<cliente>/07-oferta-y-ventas/ofertas-a-empujar.md` · 🟨 § La oferta de `motor-de-crecimiento.md` · `calendario.csv` de ③ Marketing · las cuentas de ① Strategy |
| **Produce** | La sección **§ El encargo** de `plan-de-pauta.md` |

## 1 · El objetivo va en una métrica

| ❌ | ✅ |
|---|---|
| *«Más ventas»* | *«CPA bajo Q120 con 40 compras al mes»* |
| *«Que nos conozcan»* | *«5,000 personas nuevas alcanzadas, 3% al sitio»* |
| *«Leads»* | *«30 conversaciones de WhatsApp a menos de Q40 cada una»* |

🛑 **Un objetivo sin número no se puede optimizar ni evaluar.** Se devuelve a ② Growth.

## 2 · El presupuesto

| | |
|---|---|
| **Lo pone el cliente**, siempre, aparte del fee |
| **Está aprobado por escrito** antes de tocar nada |
| **Se declara el límite diario** y el total del mes |
| **Se declara qué pasa si se agota** antes de tiempo |

🔴 **Sin presupuesto aprobado por escrito no se toca una cuenta.**

## 3 · La verificación de accesos

| Chequeo | Si falla |
|---|---|
| ¿Existe la cuenta publicitaria? | 🛑 No se pauta. **No se crea una cuenta a nombre nuestro** |
| ¿Tenemos acceso de operación? | 🛑 Se pide. Se registra **quién nos lo dio** |
| ¿El método de pago es del cliente? | 🛑 **Nunca se pauta con tarjeta nuestra** |
| ¿Está el tracking del plan? 🔷 **el pixel de Meta** · 🟨 **CAPI + GA4** | 🔴 **Se resuelve antes de gastar el primer quetzal** |
| 🟨 **Si va Google Ads:** ¿hay cuenta de Google Ads del cliente y su conversión medida? | 🛑 **No se corre Google.** Sin conversión, Google optimiza a ciegas |

### Google Ads en 🟨 Accelerate y Compound

**Google Ads es un canal más del plan de pauta, con las mismas reglas:**

- **Su presupuesto sale del total aprobado**, no se suma aparte. Se declara cuánto va a Google y cuánto a Meta y TikTok.
- **Pasa por los mismos gates del CEO:** el **GATE 1** antes de lanzar y el **GATE 2** en todo movimiento de presupuesto.
- **El objetivo se escribe en la métrica que Google puede contar:** una conversión medida, no «tráfico».
- 🔷 **En Marketing Pro solo entra la pauta de búsqueda** de la promesa publicada *(ver `ad-estructura` § 4)*.

## 4 · 🔴 ¿Puede entregar lo que la pauta va a traer?

> ⚠️ **Si la empresa es el estorbo, más demanda empeora el problema.**

**Antes de lanzar se verifica con ② Growth que el cliente pueda atender y entregar el volumen
que el objetivo implica.** Si no puede, **se baja el objetivo o se para** — y se dice por qué.

## 5 · La auditoría de arranque

**`/ads audit`** del plugin, para saber de dónde se parte:

| Qué devuelve | Para qué |
|---|---|
| Qué corrió antes y cómo rindió | No repetir lo que ya falló |
| Estado del tracking | Si la atribución sirve |
| Problemas de política o cuenta | Antes de que frenen una campaña |

> ⚠️ `claude-ads` marcado `🟡` — **sin probar en cliente real.** Lo que devuelva se verifica
> antes de decidir sobre eso.

## 6 · Qué escribe

`## § El encargo`:

| Bloque | Qué lleva |
|---|---|
| **A · El objetivo** | En una métrica, con número y plazo |
| **B · Qué se vende** | Las ofertas a pautar y su precio, de ② Growth |
| **C · El presupuesto** | Total, diario, y qué pasa si se agota |
| **D · Las cuentas** | Cuáles, con acceso verificado y quién lo dio |
| **E · El tracking** | 🔷 pixel de Meta · 🟨 CAPI + GA4 *(y la conversión de Google, si va Google Ads)* — qué está puesto, qué falta |
| **F · La capacidad** | ¿Puede entregar lo que esto trae? |
| **G · La auditoría** | Qué dice el estado de la cuenta |

## 7 · Checklist

- [ ] El objetivo tiene **número y plazo**
- [ ] El presupuesto está **aprobado por escrito**
- [ ] Las cuentas son del cliente y **hay acceso verificado**
- [ ] El **método de pago es del cliente**
- [ ] El **tracking del plan está puesto** antes de gastar — 🔷 pixel de Meta · 🟨 CAPI + GA4
- [ ] 🟨 Si va Google Ads: **cuenta del cliente, conversión medida y su parte del presupuesto declarada**
- [ ] Se verificó que el cliente **puede entregar** el volumen
