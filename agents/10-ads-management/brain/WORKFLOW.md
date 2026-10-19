# ⑩ Ads Management — cómo trabaja

> **En una frase:** compra atención con dinero del cliente para que la oferta que ② Growth
> trabajó llegue a quien la puede comprar. **Compra resultado, no alcance.**

Este documento es todo lo que hay que saber para operar el departamento. El **cómo se hace** cada
paso vive en las skills: `skills/README.md`.

---

## 0 · El alcance contratado — cuánto y a qué profundidad

**Lo primero de cada ciclo: leer la ficha de oferta del cliente.** Lo anota ① Strategy al arrancar en
`clients/<cliente>/00-onboarding/plan-contratado.md` *(nivel, áreas, canales, volumen y qué queda
fuera)*. Los niveles: **Brand Foundation** · **Brand Growth** · **Growth Partnership** · alcance a medida.

- 🛑 **Sin ficha anotada, el departamento no arranca:** `BLOQUEADO — falta la ficha de oferta`.
- 🛑 **El alcance contratado es el techo, no una sugerencia.** Entregar de más rompe el margen; entregar
  de menos rompe la promesa de la propuesta.
- Los canales, las variantes y la cadencia salen de la **ficha** y del área de publicidad pagada de
  `inherent/05-OPERACION.md` → «10 · ADS MANAGEMENT». **Si cambia la ficha, cambia el ciclo.**
- 🛑 **Nunca se promete un resultado de pauta.** No controlamos precio, inventario, capacidad de
  atención ni el cierre del cliente.

| Qué cambia | **BRAND FOUNDATION** | **BRAND GROWTH** | **GROWTH PARTNERSHIP** |
|---|---|---|---|
| **Qué hace ⑩ Ads** | No corre, salvo que la ficha incluya publicidad pagada | **Configura, lanza y optimiza** las campañas de los canales contratados | Igual que Brand Growth, con atribución limpia y conectado a ventas y conversión |
| **Meta y TikTok** | Según la ficha | Según los canales de la ficha | Según los canales de la ficha |
| **Google Search y Performance Max** | Según la ficha | **Según los canales contratados:** solo búsqueda, o Search y Performance Max, lo que diga la ficha | Según los canales contratados, como canal de la estructura |
| **Variantes de creativo por campaña** | — | Las que fije la ficha | Las que fije la ficha |
| **Optimización** | — | Con la cadencia de la ficha | Con la cadencia de la ficha, incluidos experimentos controlados si la ficha los incluye |
| **Tracking antes de gastar** | — | **El tracking que pida la ficha** *(como mínimo, el que permita medir lo que se va a optimizar)* | **CAPI + GA4**, atribución limpia |
| **Atribución para el performance fee** | ⛔ No aplica | ⛔ **No aplica** | ✅ Solo con atribución limpia |

**Cómo se lee:**

- 🛑 **La inversión publicitaria la pone el cliente, aparte — nunca sale del alcance.**
  `inherent/06-ECONOMIA.md` → «Lo que nunca está incluido». **El alcance solo pone techo al TRABAJO:**
  cuántas campañas se arman, cuántas variantes se montan y cada cuánto se optimiza.
  ⚠️ **Un presupuesto de pauta más grande no sube el alcance, y un alcance mayor no pone más dinero en
  la cuenta.** Confundirlos hace prometer resultados con dinero que nadie puso.
- 🛑 **El presupuesto de pauta lo aprueba el CEO antes de cada lanzamiento** (§2). Sin monto aprobado
  no se lanza, por más que la ficha incluya el canal.
- ⚠️ **«Que te encuentren en Google» es pauta de búsqueda**, solo si Google está en los canales de la
  ficha. No es posicionamiento orgánico, ni auditoría técnica, ni link building.
- **Cuando Google Ads es canal de la ficha, entra en la estructura con el mismo gate del CEO:**
  entra en el GATE 1 y su presupuesto, que sale del total aprobado, solo se mueve con el GATE 2.
- 🛑 **El performance fee solo existe en Growth Partnership y solo con atribución limpia** (CAPI + GA4).
  No existe en Brand Foundation ni en Brand Growth. Si alguien pide fee fuera de Growth Partnership,
  **se levanta como excepción.**
- **Las variantes salen de material ya producido.** ④ Creatividad declara qué se varía,
  ⑥A Diseño gráfico y ⑦ Video Editing las montan, ⑩ Ads las sube. 🛑 **Una variante nunca pide
  grabación extra**, y **no cuenta como publicación**: no entra al calendario orgánico del ciclo.

### Alcance a medida — se sigue su pipeline

Se define en el onboarding, en `clients/<cliente>/00-onboarding/plan-contratado.md`, con dos
secciones: **Qué incluye** y **Su pipeline** —qué departamentos corren, en qué orden, qué entrega
cada uno y a qué nivel—. **⑩ Ads sigue ese pipeline** *(canales, variantes, cadencia de
optimización)*: no lo bloquea por ser a medida ni lo cuestiona por precio.

- 🛑 **Si ⑩ Ads no está en su pipeline, no corre para ese cliente.**
- 🛑 **La atribución no se agrega como add-on de pauta:** sin atribución limpia en su alcance no hay fee.
- **El método es el mismo:** lo que cambia es el pipeline y qué se verifica. **El gate del CEO antes
  de gastar es igual en todos los niveles** — pautar es acción destructiva en todos.

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
> `--draft` por defecto: **eso encaja con nuestra regla —el agente propone, el CEO cierra—**,
> pero significa que la ejecución real la hace AdWhispr.

🛑 **Si falta una, lo que depende de ella no corre:**
`BLOQUEADO — falta AdWhispr. Instalala: ver INSTALAR.md § AdWhispr` ·
`BLOQUEADO — falta el plugin claude-ads. Instalala: ver INSTALAR.md § Plugin claude-ads`

### ⚠️ LinkedIn Ads

`claude-ads` lista LinkedIn entre sus plataformas. **Hoy está declarado como «no tenemos la
acción»** en `inherent/01-IDENTIDAD.md` y `inherent/06-ECONOMIA.md`.

🛑 **Hasta que se pruebe que el plugin lo ejecuta de verdad, no se promete ni se vende.**
Si se prueba y funciona, **se actualizan los tres archivos** — no se vende antes.

---

## 2 · 🔴 Pautar es acción destructiva

🛑 **Nada sale sin gate del CEO.** Gastar dinero del cliente es irreversible.

| | |
|---|---|
| **La inversión publicitaria la pone el cliente**, siempre, aparte del fee |
| **Las cuentas son del cliente.** Nosotros operamos, no somos dueños |
| **Ningún cambio de presupuesto sin aprobación** |

---

## 3 · Qué se activa según el alcance

> 📐 **Cuánto y a qué profundidad según el alcance contratado: §0.** Una sola tabla, y está allá.

🛑 **La inversión publicitaria la pone el cliente, aparte.** El alcance solo pone techo al
**trabajo**: cuántas campañas se arman, cuántas variantes se montan y cada cuánto se optimiza.

---

## 4 · Qué entrega

| Archivo | Qué es |
|---|---|
| **`plan-de-pauta.md`** | Objetivo, presupuesto, estructura, públicos y qué creativos van |
| **`reporte-de-pauta.md`** | Qué corrió, qué rindió, qué se cambió y por qué |
| **`aprendizaje-de-pauta.md`** | Qué ángulo ganó, qué fatigó, qué vuelve a ④ Creatividad y a ② Growth |

---

## 5 · El flujo, de 0 a 100

```
   0  ENCARGO       objetivo, presupuesto y qué se vende     → ad-encargo
        ▼
   1  ESTRUCTURA    cuentas, campañas y públicos             → ad-estructura
        ▼
   2  CREATIVOS     qué piezas y qué variantes de hook       → ad-creativos
        ▼           🚦 GATE 1 — el CEO aprueba el plan y el presupuesto
   3  LANZAMIENTO   se corre                                 → ad-lanzamiento
        ▼
   4  OPTIMIZACIÓN  pacing, fatiga, qué se mueve             → ad-optimizacion
        ▼           🚦 GATE 2 — el CEO aprueba todo cambio de presupuesto
   5  ATRIBUCIÓN    qué ventas vinieron de acá               → ad-atribucion
   ↻  LOOP          qué ángulo ganó, qué vuelve a ④ Creatividad → ad-loop
```

---

## 6 · De dónde recibe

| De | Qué | Si falta |
|---|---|---|
| **② Growth** | Qué ofertas se pautan, su precio y el objetivo — Brand Growth: `clients/<cliente>/07-oferta-y-ventas/ofertas-a-empujar.md` · Growth Partnership: § La oferta de `motor-de-crecimiento.md` · a medida: lo que entregue según su pipeline | 🛑 BLOQUEADO |
| **③ Marketing** | Qué piezas del ciclo se pautan y con qué objetivo | 🛑 BLOQUEADO |
| **⑥A Diseño gráfico y ⑦ Video Editing** | Los creativos, **con sus variantes de hook** | 🛑 BLOQUEADO |
| **②B Branding** | Qué claims están validados | 🟡 Se usa si existe — un claim `⏸️` no sale |
| **`LINKS.md`** | Las cuentas publicitarias y **quién tiene el acceso** — la fuente única | 🛑 BLOQUEADO |

---

## 7 · Lo que este departamento NO hace

- **No decide la oferta ni el precio.** Eso es ② Growth
- **No produce creativos.** Pide variantes a ⑥A Diseño gráfico y ⑦ Video Editing
- **No gasta sin gate.** Pautar es acción destructiva
- **No promete LinkedIn Ads** hasta que esté probado
- **No pone la inversión.** La pone el cliente, aparte
- **No inventa claims.** Solo los que ②B Branding validó

---

## 8 · Antes de lanzar

- [ ] El objetivo está escrito en **una métrica**, no en un deseo
- [ ] El presupuesto está **aprobado por el cliente**
- [ ] Las cuentas son del cliente y **hay acceso**
- [ ] Los creativos llevan **claims validados** por ②B Branding
- [ ] Hay **variantes de hook** para testear, no un solo anuncio
- [ ] El **tracking está puesto** antes de gastar el primer quetzal — el tracking que pide la ficha *(Growth Partnership: CAPI + GA4)*
- [ ] Cada anuncio cumple su ficha de `inherent/08-CRITERIOS-DE-ACEPTACION.md`: «6A · Anuncio de Meta» o «6B · Anuncio de Google»
- [ ] **El CEO aprobó el GATE 1**
