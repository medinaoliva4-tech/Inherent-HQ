---
name: ad-optimizacion
description: >
  Capa 4 de ⑩ Ads Management — lee pacing, fatiga y rendimiento, y decide qué se mueve. Usa el
  monitor del plugin para detectar problemas y AdWhispr para ejecutar los cambios, con la regla
  de un cambio a la vez y nunca antes de que haya datos suficientes. Todo movimiento de
  presupuesto necesita gate. Úsala cuando pidan "no está rindiendo", "pausá esto", "subí el
  presupuesto", "se quemó el anuncio", "por qué subió el costo". Cada cambio pasa por el GATE 2.
---

# Capa 4 · Optimización — qué se mueve y cuándo

| | |
|---|---|
| **Consume** | Las campañas corriendo · `/ads monitor` del plugin |
| **Produce** | Los cambios ejecutados + **`reporte-de-pauta.md`** |

## 1 · Las dos reglas que evitan destruir lo que funciona

| | Regla | Por qué |
|---|---|---|
| **1** | **Un cambio a la vez** | Dos cambios juntos y no se sabe cuál funcionó |
| **2** | **No se toca sin datos suficientes** | Mover algo con 3 conversiones es mover ruido |

🛑 **Optimizar de más es la forma más común de romper una campaña que estaba aprendiendo.**

## 2 · Qué se mira — el monitor del plugin

**`/ads monitor`** revisa pacing, delivery, tracking, fatiga, política y rendimiento.

| Señal | Qué significa | Qué se hace |
|---|---|---|
| **CPM sube + CTR baja** | **Fatiga de creativo** | Se rota a otra variante de hook |
| **Gasta rápido, no convierte** | Público o destino | Se revisa el destino primero |
| **No gasta** | Puja, público chico o rechazo | Se revisa la cuenta |
| **Convierte caro** | Oferta o público | 🔴 Puede ser de ② Growth, no de acá |
| **Rechazo de política** | Un claim o el creativo | Se corrige y se reenvía |

## 3 · 🔴 Cuándo el problema no es de pauta

> **Cambiar la pauta cuando el problema era la oferta no arregla nada, y al revés destruye lo
> que funcionaba.**

| Señal | De quién es |
|---|---|
| Llega gente y no compra | **② Growth** — oferta o conversión |
| Llega quien no es | **③ Marketing** — el público del slot |
| Llega poca gente y convierte bien | **De acá.** Se sube presupuesto |
| Nadie ve el anuncio | **De acá.** Es entrega |

## 4 · Qué se mueve, en orden

| # | Movimiento | Cuándo |
|---|---|---|
| **1** | **Rotar creativo** | Fatiga. Es el cambio más barato |
| **2** | **Pausar lo que no rinde** | Con datos suficientes |
| **3** | **Mover presupuesto** a lo que sí | 🔒 **Con gate** |
| **4** | **Cambiar público** | Solo si el creativo ya se probó |
| **5** | **Cambiar oferta** | 🔴 **No es de acá.** Va a ② Growth |

## 5 · 🚦 GATE 2 — todo movimiento de presupuesto

🛑 **Subir, bajar o mover presupuesto entre campañas necesita aprobación de Allan.**
Pausar algo que está gastando mal **se puede hacer y se avisa** — detener una pérdida no es
gastar.

## 6 · El registro de cada cambio

| Campo | Por qué |
|---|---|
| Qué se cambió | Para poder volver atrás |
| **Por qué** | Con el dato que lo justificó |
| Cuándo | Para medir el efecto desde ahí |
| Quién aprobó | Si tocó presupuesto |

🛑 **Un cambio sin registro hace imposible el loop.** Al cierre nadie sabe qué movió el número.

## 7 · Checklist

- [ ] **Un cambio a la vez**
- [ ] No se tocó nada **sin datos suficientes**
- [ ] Se distinguió si el problema es **de pauta o de oferta**
- [ ] Los movimientos siguieron el **orden de costo**
- [ ] **Todo movimiento de presupuesto pasó por el GATE 2**
- [ ] Cada cambio quedó **registrado con su porqué**
