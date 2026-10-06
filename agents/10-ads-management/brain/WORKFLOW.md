# ⑩ Ads Management — cómo trabaja

> **En una frase:** compra atención con dinero del cliente para que la oferta que ② Growth
> trabajó llegue a quien la puede comprar. **Compra resultado, no alcance.**

Este documento es todo lo que hay que saber para operar el departamento. El **cómo se hace** cada
paso vive en las skills: `skills/README.md`.

---

## 0 · El plan contratado — cuánto y a qué profundidad

**Lo primero de cada ciclo: leer el plan del cliente.** Lo anota ② Strategy al arrancar en
`clients/<cliente>/data/plan-contratado.md`:
🔷 **Marketing** · 🔷 **Marketing Pro** · 🟨 **Accelerate** · 🟨 **Compound** · ⬜ **Tailor Made**.

- 🛑 **Sin plan anotado, el departamento no arranca:** `BLOQUEADO — falta el plan contratado`.
- 🛑 **El plan es el techo, no una sugerencia.** Entregar de más rompe el margen; entregar de menos
  rompe la promesa publicada (`inherent/03-OFERTA.md` → «🌐 Las cuatro tarjetas»).
- Los números salen de `inherent/06-ECONOMIA.md` → «📦 El volumen» y los canales de
  `inherent/05-OPERACION.md` → «10 · ADS MANAGEMENT». **Si cambian allá, cambian acá** — esta tabla
  no manda sobre ellos.

| Qué cambia | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Meta y TikTok** | ✅ | ✅ | ✅ | ✅ |
| **Google Search y Performance Max** | ⬜ | ✅ | ✅ | ✅ |
| **Variantes de creativo por campaña** | hasta **20** | hasta **30** | hasta **35** | hasta **50** |
| **Optimización** | Mensual | Mensual | Por ángulo, continua | Continua + presupuesto sistematizado |
| **Experimentos controlados** | ⬜ | ⬜ | 🟡 | ✅ |
| **Atribución para el performance fee** | ⛔ **No aplica** | ⛔ **No aplica** | ✅ | ✅ |

**Cómo se lee:**

- 🛑 **La inversión publicitaria la pone el cliente, aparte — nunca sale del plan.**
  `inherent/06-ECONOMIA.md` → «⛔ Lo que nunca está incluido». **El plan solo pone techo al TRABAJO:**
  cuántas campañas se arman, cuántas variantes se montan y cada cuánto se optimiza.
  ⚠️ **Un presupuesto de pauta más grande no sube el plan, y un plan más caro no pone más dinero en
  la cuenta.** Confundirlos hace prometer resultados con dinero que nadie puso.
- 🛑 **El presupuesto de pauta lo aprueba Allan antes de cada lanzamiento** (§2). Sin monto aprobado
  no se lanza, por más que el plan incluya el canal.
- ⚠️ **«Que te encuentren en Google» entra desde 🔷 Marketing Pro**, y es **pauta de búsqueda**, no
  posicionamiento orgánico, ni auditoría técnica, ni link building.
- 🛑 **El performance fee NO existe en la línea 🔷 Marketing.** Requiere atribución limpia
  (CAPI + GA4), que es parte de Conversion OS y **solo entra desde 🟨 Accelerate.** Si alguien pide
  fee sobre un plan 🔷, **se levanta como excepción.**
- **Las variantes salen de material ya producido.** ④ declara qué se varía, ⑥A y ⑥B las montan, ⑩ las
  sube. 🛑 **Una variante nunca pide grabación extra**, y **no cuenta como publicación**: no entra al
  calendario orgánico del ciclo.

### ⬜ Tailor Made — cuando el presupuesto no calza en un plan

Allan lo cotiza **en las mismas unidades de la tabla de arriba** —canales, variantes, cadencia de
optimización— y el departamento trabaja con esos números igual que con un plan estándar.
**El precio lo define Allan.**

- 🛑 **Una fila sin número es un bloqueo, no una invitación a suponer:** se le pide a Allan.
- 🛑 **No existe un plan por debajo de 🔷 Marketing** (`inherent/06-ECONOMIA.md` → «📦 El volumen»).
- 🛑 **La atribución no se cotiza como add-on de pauta:** sin Conversion OS no hay fee, y eso no
  cambia por cuánto se pague en Tailor Made.
- **Se baja el volumen, nunca el método:** el gate de Allan antes de lanzar es igual en todos los
  planes. **Pautar es acción destructiva en los cuatro.**

---

## 1 · Las dos herramientas, y qué hace cada una

| | **AdWhispr** *(MCP)* | **`claude-ads`** *(plugin)* |
|---|---|---|
| **Qué hace** | **Ejecuta** — lanza, pausa, cambia presupuesto | **Audita, planea y monitorea** |
| Lanzar en Meta, TikTok, Google Search, PMax | ✅ | `launch --draft` — propone, no aplica |
| Clonar el anuncio de un competidor | ✅ `clone_tiktok_ad` | — |
| Cambiar presupuesto, pausar, reanudar | ✅ | `optimize --draft` — propone |
| Auditoría con evidencia fechada | — | ✅ `/ads audit` |
| Monitoreo de pacing, fatiga, tracking | — | ✅ `/ads monitor` |
| Experimentos controlados | — | ✅ `/ads experiment` |
| Keywords propias y de competencia | ✅ `research_keywords` | ✅ |

> 🔑 **El plugin propone, AdWhispr ejecuta.** `launch` y `optimize` del plugin corren en
> `--draft` por defecto: **eso encaja con nuestra regla —el agente propone, Allan cierra—**,
> pero significa que la ejecución real la hace AdWhispr.

### ⚠️ LinkedIn Ads

`claude-ads` lista LinkedIn entre sus plataformas. **Hoy está declarado como «no tenemos la
acción»** en `inherent/01-IDENTIDAD.md` y `inherent/06-ECONOMIA.md`.

🛑 **Hasta que se pruebe que el plugin lo ejecuta de verdad, no se promete ni se vende.**
Si se prueba y funciona, **se actualizan los tres archivos** — no se vende antes.

---

## 2 · 🔴 Pautar es acción destructiva

🛑 **Nada sale sin gate de Allan.** Gastar dinero del cliente es irreversible.

| | |
|---|---|
| **La inversión publicitaria la pone el cliente**, siempre, aparte del fee |
| **Las cuentas son del cliente.** Nosotros operamos, no somos dueños |
| **Ningún cambio de presupuesto sin aprobación** |

---

## 3 · Qué se activa según el plan

> 📐 **Cuánto y a qué profundidad según el plan contratado: §0.** Una sola tabla, y está allá.

🛑 **La inversión publicitaria la pone el cliente, aparte.** El plan solo pone techo al
**trabajo**: cuántas campañas se arman, cuántas variantes se montan y cada cuánto se optimiza.

---

## 4 · Qué entrega

| Archivo | Qué es |
|---|---|
| **`plan-de-pauta.md`** | Objetivo, presupuesto, estructura, públicos y qué creativos van |
| **`reporte-de-pauta.md`** | Qué corrió, qué rindió, qué se cambió y por qué |
| **`aprendizaje-de-pauta.md`** | Qué ángulo ganó, qué fatigó, qué vuelve a ④ y a ② Growth |

---

## 5 · El flujo, de 0 a 100

```
   0  ENCARGO       objetivo, presupuesto y qué se vende     → ad-encargo
        ▼
   1  ESTRUCTURA    cuentas, campañas y públicos             → ad-estructura
        ▼
   2  CREATIVOS     qué piezas y qué variantes de hook       → ad-creativos
        ▼           🚦 GATE 1 — Allan aprueba el plan y el presupuesto
   3  LANZAMIENTO   se corre                                 → ad-lanzamiento
        ▼
   4  OPTIMIZACIÓN  pacing, fatiga, qué se mueve             → ad-optimizacion
        ▼           🚦 GATE 2 — Allan aprueba todo cambio de presupuesto
   5  ATRIBUCIÓN    qué ventas vinieron de acá               → ad-atribucion
   ↻  LOOP          qué ángulo ganó, qué vuelve a ④          → ad-loop
```

---

## 6 · De dónde recibe

| De | Qué | Si falta |
|---|---|---|
| **② Growth** | La oferta, el precio y el objetivo de la pauta | 🛑 BLOQUEADO |
| **③ Marketing** | Qué piezas del ciclo se pautan y con qué objetivo | 🛑 BLOQUEADO |
| **⑥A y ⑥B** | Los creativos, **con sus variantes de hook** | 🛑 BLOQUEADO |
| **②B Branding** | Qué claims están validados | 🛑 BLOQUEADO |
| **① Comprensión** | Las cuentas publicitarias y quién tiene el acceso | 🛑 BLOQUEADO |

---

## 7 · Lo que este departamento NO hace

- **No decide la oferta ni el precio.** Eso es ② Growth
- **No produce creativos.** Pide variantes a ⑥A y ⑥B
- **No gasta sin gate.** Pautar es acción destructiva
- **No promete LinkedIn Ads** hasta que esté probado
- **No pone la inversión.** La pone el cliente, aparte
- **No inventa claims.** Solo los que ②B validó

---

## 8 · Antes de lanzar

- [ ] El objetivo está escrito en **una métrica**, no en un deseo
- [ ] El presupuesto está **aprobado por el cliente**
- [ ] Las cuentas son del cliente y **hay acceso**
- [ ] Los creativos llevan **claims validados** por ②B
- [ ] Hay **variantes de hook** para testear, no un solo anuncio
- [ ] La **atribución está puesta** antes de gastar el primer quetzal
- [ ] **Allan aprobó el GATE 1**
