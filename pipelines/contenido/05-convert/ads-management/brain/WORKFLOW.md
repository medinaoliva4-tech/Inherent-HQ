# Ads Management — cómo trabaja

> **En una frase:** compra atención con dinero del cliente para que la oferta que Growth
> trabajó llegue a quien la puede comprar. **Compra resultado, no alcance.**

Este documento es todo lo que hay que saber para operar el departamento. El **cómo se hace** cada
paso vive en las skills: `skills/README.md`.

---

## 🎯 Su lugar en el pipeline

| | |
|---|---|
| **Pipeline** | Contenido |
| **Departamento** | 05 · Convert |
| **Propósito del paso** | Distribuir el contenido y conectar la atención con un sistema de adquisición y ventas |
| **Su responsabilidad** | Distribuir con dinero lo que ya funciona hacia un sistema de adquisición y ventas. Compra resultado, no alcance |
| **Artifact del equipo** | Revenue Engine |
| **Entregable al cliente** | Ninguno propio |

---

## 0 · El plan contratado — cuánto y a qué profundidad

**Lo primero de cada ciclo: leer el plan del cliente.** Lo anota Strategy al arrancar en
`clients/<cliente>/00-onboarding/plan-contratado.md`:
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
| **Tracking antes de gastar** | **Pixel de Meta** | **Pixel de Meta** | Atribución completa — CAPI + GA4 | Atribución completa — CAPI + GA4 |
| **Atribución para el performance fee** | ⛔ **No aplica** | ⛔ **No aplica** | ✅ | ✅ |

**Cómo se lee:**

- 🛑 **La inversión publicitaria la pone el cliente, aparte — nunca sale del plan.**
  `inherent/06-ECONOMIA.md` → «⛔ Lo que nunca está incluido». **El plan solo pone techo al TRABAJO:**
  cuántas campañas se arman, cuántas variantes se montan y cada cuánto se optimiza.
  ⚠️ **Un presupuesto de pauta más grande no sube el plan, y un plan más caro no pone más dinero en
  la cuenta.** Confundirlos hace prometer resultados con dinero que nadie puso.
- 🛑 **El presupuesto de pauta lo aprueba el CEO antes de cada lanzamiento** (§2). Sin monto aprobado
  no se lanza, por más que el plan incluya el canal.
- ⚠️ **«Que te encuentren en Google» entra desde 🔷 Marketing Pro**, y es **pauta de búsqueda**, no
  posicionamiento orgánico, ni auditoría técnica, ni link building.
- 🔷 **En la línea Marketing, antes de gastar basta el pixel de Meta instalado.**
  🛑 **El performance fee NO existe ahí:** requiere atribución limpia (CAPI + GA4), que es parte de
  Conversion OS y **solo entra desde 🟨 Accelerate.** Si alguien pide fee sobre un plan 🔷, **se
  levanta como excepción.**
- **Las variantes salen de material ya producido.** Creatividad declara qué se varía,
  Diseño gráfico y Video Editing las montan, Ads las sube. 🛑 **Una variante nunca pide
  grabación extra**, y **no cuenta como publicación**: no entra al calendario orgánico del ciclo.

### ⬜ Tailor Made — se sigue su pipeline

Se define en el onboarding, en `clients/<cliente>/00-onboarding/plan-contratado.md`, con dos
secciones: **Qué incluye** y **Su pipeline** —qué departamentos corren, en qué orden, qué entrega
cada uno y a qué nivel—. **Ads sigue ese pipeline** *(canales, variantes, cadencia de
optimización)*: no lo bloquea por no ser un plan de lista ni lo cuestiona por precio.

- 🛑 **Si Ads no está en su pipeline, no corre para ese cliente.**
- 🛑 **La atribución no se agrega como add-on de pauta:** sin Conversion OS en su pipeline no hay fee.
- **El método es el mismo:** lo que cambia es el pipeline y qué se verifica. **El gate del CEO antes
  de gastar es igual en todos los planes** — pautar es acción destructiva en todos.

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
| **`aprendizaje-de-pauta.md`** | Qué ángulo ganó, qué fatigó, qué vuelve a Creatividad y a Growth |

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
   ↻  LOOP          qué ángulo ganó, qué vuelve a Creatividad → ad-loop
```

---

## 6 · De dónde recibe

| De | Qué | Si falta |
|---|---|---|
| **Growth** | Qué ofertas se pautan, su precio y el objetivo — 🔷 `clients/<cliente>/07-oferta-y-ventas/ofertas-a-empujar.md` · 🟨 § La oferta de `motor-de-crecimiento.md` · ⬜ lo que entregue según su pipeline | 🛑 BLOQUEADO |
| **Marketing** | Qué piezas del ciclo se pautan y con qué objetivo | 🛑 BLOQUEADO |
| **Diseño gráfico y Video Editing** | Los creativos, **con sus variantes de hook** | 🛑 BLOQUEADO |
| **Branding** | Qué claims están validados | 🟡 Se usa si existe — un claim `⏸️` no sale |
| **`LINKS.md`** | Las cuentas publicitarias y **quién tiene el acceso** — la fuente única | 🛑 BLOQUEADO |

---

## 7 · Lo que este departamento NO hace

- **No decide la oferta ni el precio.** Eso es Growth
- **No produce creativos.** Pide variantes a Diseño gráfico y Video Editing
- **No gasta sin gate.** Pautar es acción destructiva
- **No promete LinkedIn Ads** hasta que esté probado
- **No pone la inversión.** La pone el cliente, aparte
- **No inventa claims.** Solo los que Branding validó

---

## 8 · Antes de lanzar

- [ ] El objetivo está escrito en **una métrica**, no en un deseo
- [ ] El presupuesto está **aprobado por el cliente**
- [ ] Las cuentas son del cliente y **hay acceso**
- [ ] Los creativos llevan **claims validados** por Branding
- [ ] Hay **variantes de hook** para testear, no un solo anuncio
- [ ] El **tracking está puesto** antes de gastar el primer quetzal — 🔷 el pixel de Meta · 🟨 CAPI + GA4
- [ ] **El CEO aprobó el GATE 1**
