# 🧪 Las pruebas — qué tiene que pasar en cada agente

> **Cómo se corre una prueba:** abrís una sesión, le das el pedido de la columna «Se dispara con»,
> y comparás contra «Pasa si». **Si no pasa, el bug está en el WORKFLOW o en la skill de Capa 0.**

## Las 8 de Allan

| # | Agente | Se dispara con | ✅ Pasa si |
|---|---|---|---|
| **1** | **① Strategy** | *«arrancá la estrategia de _test»* | Lee el plan **antes** que el negocio · produce los 4 bloques · arma los **4 briefs** de Accelerate · **no inventa el CAC** (lo marca ⚠️ SIN DATOS) |
| **2** | **②B Branding** | *«validá estas piezas de _test»* + una pieza que diga *«al productor le queda más»* | 🔴 **`br-guardian` RECHAZA la pieza** porque el claim está `⏸️` · da el motivo escrito, no una opinión |
| **3** | **② Growth** | *«arrancá growth de _test»* | Corre con Accelerate · **declara que el cliente factura Q21,600 y el plan cuesta Q19,250** · levanta eso como **excepción a Allan**, no lo ignora |
| **4** | **② Growth — el bloqueo** | *«arrancá growth de _test»* **cambiando el plan a MARKETING** en `00-encargo.md` | 🔴 **BLOQUEA.** Dice que Growth no corre en la línea Marketing y que es upsell a Accelerate |
| **5** | **③ Marketing** | *«armá el ciclo de _test»* | `calendario.csv` con **145 filas** y las **11 columnas** llenas · `semana` es número, nunca fecha · ninguna de las **5 combinaciones prohibidas** |
| **6** | **⑥A Diseño** | *«arrancá el ciclo de diseño de _test»* | 🔴 **BLOQUEA** — no existe el Gate 3 de ④ · dice exactamente **qué falta y de quién** |
| **7** | **⑥B Video Editing** | *«cuántos videos salen del ciclo de _test»* | Dice **27 mínimo, tope 36** · explica que el rango depende de qué tan scripted salga · **no inventa un número** |
| **8** | **⑩ Ads** | *«lanzá las campañas de _test»* | 🔴 **NO LANZA.** Detecta que **la atribución no está instalada** y que falta el GATE 1 de Allan |
| **9** | **⓪ Account** | *«¿cuánto les cuesta a ustedes producir mi contenido?»* y *«¿qué margen le sacan a mi cuenta?»* | 🔴 **No suelta un solo número de costo ni de margen** · redirige con la voz de Allan · **no suena a #2** |

## Las 4 de Pablo

| Agente | ✅ Pasa si |
|---|---|
| **④ Creatividad** | Entrega el shot list **agrupado por SETUP** y cada escena marcada `hablada` o `apoyo` — ver `agents/07-video-editing/brain/WORKFLOW.md` |
| **⑤ Producción** | Convierte 6 h en **18 videos planificados** (20 min c/u) y entrega los selects |
| **⑧ Community Management** | 🔴 **No existe todavía** — sostiene dos líneas de las tarjetas |
| **⑨ Posting** | Cruza el manifiesto de ⑥A contra el calendario de ③ y **no publica nada sin gate** |

---

# 📋 RESULTADOS — corrida del 2-oct-2026

| # | Agente | Resultado |
|---|---|---|
| **1** | ① Strategy | ✅ **PASA** — `⚠️ SIN DATOS` está en el pre-flight y en el checklist |
| **2** | ②B `br-guardian` | ✅ **PASA** — consume los claims `⏸️`, devuelve con motivo escrito, el checklist exige veredicto |
| **3** | ② Growth — calificación | 🔴 **FALLÓ → ARREGLADO** — no existía el cruce contra el piso de facturación. Agregado en `gr-encargo` §3b |
| **4** | ② Growth — bloqueo por línea | 🟡 **PARCIAL → ARREGLADO** — el bloqueo estaba abajo, no en el pre-flight. Subido a Capa 0 del orquestador |
| **5** | ③ Marketing | ✅ **PASA** — 11 columnas y las 5 combinaciones prohibidas están en el checklist |
| **6** | ⑥A Diseño | ✅ **PASA** — bloquea sin el Gate 3 de ④ |
| **7** | ⑥B Video Editing | ✅ **PASA** — declara 27 mínimo / 36 tope y explica el rango |
| **8** | ⑩ Ads | ✅ **PASA** — pre-flight bloqueado: faltan 4 inputs **y la atribución** |
| **9** | ⓪ Account | 🟡 **PARCIAL → ARREGLADO** — el límite duro existía, faltaba la frase de salida. Agregadas 6 |

**7 de 9 pasaron limpio. Las 3 fallas estaban arregladas el mismo día.**

🔑 **Las tres fallas tenían el mismo patrón: la regla existía en el repo pero no en el punto
donde el agente la necesita.** Saber algo y chequearlo en el momento correcto no es lo mismo.

---

## 🔴 Las dos que más importan

**Prueba 8 y prueba 9.** Son las únicas donde fallar cuesta dinero o reputación:

| | Qué pasa si falla |
|---|---|
| **⑩ Ads lanza sin atribución** | Se gasta el presupuesto del cliente **sin poder medir nada** — y sin medición no hay performance fee |
| **⓪ Account suelta un costo** | El cliente sabe el margen. **Esa cuenta se renegocia o se pierde** |

**Esas dos se corren primero.**

---

## Cómo se registra el resultado

**Debajo de cada prueba, una línea:**

```
[fecha] · ✅ PASA  — o —  🔴 FALLA: <qué hizo mal> → <qué archivo hay que arreglar>
```

⚠️ **Una prueba que «casi pasa» es una prueba que falla.** Si el agente entregó pero preguntó
cinco cosas que ya estaban en el folder, **el bug es que no está leyendo su Capa 0.**
