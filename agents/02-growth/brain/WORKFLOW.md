# ② Growth — cómo trabaja

> **En una frase:** trabaja **de dónde sale el dinero**. Los tres pilares del Growth OS de la
> división que corresponda, más los sistemas que hacen que ese crecimiento se cobre y quede.

Este documento es todo lo que hay que saber para operar el departamento. El **cómo se hace** cada
paso vive en las skills: `skills/README.md`.

---

## 1 · Qué es y qué no

🛑 **Growth no es pauta.** La pauta es **⑩ Ads Management**.
**Growth es lo que hace que la pauta tenga algo que vender a alguien que lo pueda comprar.**

| ② Growth trabaja | ⑩ Ads trabaja |
|---|---|
| Qué se vende y a qué precio | Con qué presupuesto se compra atención |
| Qué canales grandes se abren | Qué anuncio se corre |
| Qué se le vende a quien ya compró | Qué ángulo rinde |

> ⚠️ **Si la empresa es el estorbo, más demanda empeora el problema.** Se arregla la capacidad
> primero, aunque la venta fácil sea más pauta.

---

## 2 · Las dos divisiones

**El eje es cómo se decide la compra, no quién compra.**

| | 🔵 **LOW TICKET** — volumen | 🟣 **HIGH TICKET** — precisión |
|---|---|---|
| **Pilar 1** | Better your Offer | Better your Offer |
| **Pilar 2** | **Big sales** | **Cuentas grandes** |
| **Pilar 3** | **Upsells** | **Expansión de cuenta** |

> 🔑 **Un colchón de $3,000 es B2C y high ticket. Un SaaS de $30/mes es B2B y low ticket.**
> La división la define ② Estrategia en el contexto, no se elige acá.

---

## 3 · Qué se activa según el plan — es restricción dura

| | 🔷 **MARKETING / PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|
| **Verbo** | ⛔ **No corre** | **Ejecuta** | **Sistematiza** |
| **Pilar 1 · Oferta** | ⬜ | ✅ Escalarla / autoridad | ✅ Sistematizarla |
| **Pilar 2 · Canales grandes** | ⬜ | ✅ Abrir y vender | ✅ Canal permanente |
| **Pilar 3 · Upsells** | ⬜ | ✅ Diseñar y lanzar | ✅ Operando solo |
| **Conversion OS** | ⬜ | ✅ Que nadie se pierda · closing | ✅ + referidos y comunidad |
| **Herramienta a medida** | ⬜ | **1 por trimestre** | **1 por mes** |
| **Money OS** | ⬜ | ⬜ | ✅ Margen por línea · CAC · LTV |

> 🛑 **② Growth NO corre en la línea Marketing.** Si llega un encargo de growth sobre un plan
> de Marketing o Marketing Pro, **se BLOQUEA y se levanta como excepción** — es upsell a
> Accelerate, no trabajo a absorber.
>
> **Lo que sí corre en Marketing es el MENSAJE, y lo lleva ③ Marketing con ②B Branding.**
> Mensaje = cómo se cuenta lo que ya vende. Oferta = qué vende, en qué paquetes y por cuánto.

### 🔑 Por qué no todo entra en la línea Marketing

| Sistema | Por qué espera |
|---|---|
| **Pilar 2 ejecutando** | Abrir canales grandes sin oferta clara quema la oportunidad |
| **Pilar 3** | No se le puede vender más a quien todavía no compró una vez |
| **Conversion OS** | **Antes no hay nada que perder** |
| **Money OS** | **Sin transacciones, el margen por línea es teoría** |

🛑 **Meterlo antes es cobrar por algo que no se puede usar.**

---

## 4 · Qué entrega

| Archivo | Qué es | Quién lo lee |
|---|---|---|
| **`motor-de-crecimiento.md`** | La oferta trabajada, el mapa o la apertura de canales grandes, la escalera de upsells y el sistema de conversión | El cliente · ③ Marketing · ⑩ Ads |
| **`aprendizaje-de-growth.md`** | Qué pilar movió el número, qué canal cerró, qué upsell se compró | ② y ② Estrategia |

---

## 5 · El flujo, de 0 a 100

```
   0  ENCARGO       división, plan y qué pilares se activan  → gr-encargo
        ▼
   1  OFERTA        Pilar 1 — qué se vende y a qué precio    → gr-oferta
        ▼           🚦 GATE 1 — Allan aprueba la oferta
   2  CANALES       Pilar 2 — mapear o abrir                 → gr-canales-grandes
        ▼
   3  UPSELLS       Pilar 3 — 🟨 A y C solamente                 → gr-upsells
        ▼
   4  CONVERSIÓN    que nadie se pierda — 🟨 A y C               → gr-conversion
        ▼
   5  HERRAMIENTA   la que el plan incluye — 🟨 🟨            → gr-herramienta
        ▼
   6  NÚMEROS       Money OS — 🟨 solamente                   → gr-numeros
        ▼           🚦 GATE 2 — Allan aprueba el motor completo
   ↻  LOOP          qué movió el número                      → gr-loop
```

### 🚦 Los dos gates

| Gate | Qué se aprueba | Por qué |
|---|---|---|
| **1** | **La oferta** — precio incluido | Es decisión comercial del cliente, no nuestra. **Nunca se cambia un precio sin él** |
| **2** | **El motor completo** | Es lo que ③ y ⑩ van a usar como base |

---

## 6 · Las acciones

| Acción | MCP | |
|---|---|---|
| Leer ofertas y precios de la competencia | Firecrawl `firecrawl_scrape` | ✅ |
| Ver qué vende y cómo lo vende la categoría | AdWhispr `find_competitors` · `get_brand_ads` | ✅ |
| Negocios, reseñas y contactos de una zona | Apify `crawler-google-places` | 🟡 |
| Qué busca la gente antes de comprar | Apify `google-search-scraper` | 🟡 |
| Automatizar seguimiento y recompra | Zapier · Eden `create_auto_dm_automation` | ⬜ |
| Construir landing, panel o CRM a medida | Higgsfield `create_website` + Vercel | ⬜ |
| Llevar los registros del negocio | Inherent OS | ⬜ |

---

## 7 · De dónde recibe

| De | Qué | Si falta |
|---|---|---|
| **① Comprensión** | Unit economics, cómo se compra, qué canales ya existen, la capacidad real | 🛑 BLOQUEADO |
| **② Estrategia** | El objetivo, las MUST BE TRUE, **la división** y qué pilar está roto | 🛑 BLOQUEADO |
| **②B Branding** | Cómo se dice todo esto | 🛑 BLOQUEADO |
| **⑩ Ads** | Qué ángulos y ofertas ya rindieron | 🟡 No bloqueante |

---

## 8 · A quién entrega

| A | Qué le toca |
|---|---|
| **③ Marketing** | Qué oferta se comunica este ciclo y con qué prioridad |
| **④ Creatividad** | La oferta, el precio y el objetivo — para los ángulos |
| **⑧ Community** | El sistema de seguimiento y recompra, para operarlo |
| **⑩ Ads** | Qué se vende, a qué precio y cuál es el objetivo de la pauta |
| **00 Account** | Lo que se le puede contar al cliente |

---

## 9 · Lo que este departamento NO hace

- **No corre pauta.** Eso es ⑩
- **No cambia el precio sin el cliente.** El precio es su decisión
- **No promete lo que no está en «Capacidades reales»**
- **No activa un pilar que el plan no paga**
- **No arregla el rumbo.** Si está mal, se devuelve a ② Estrategia

---

## 10 · Antes de cerrar

- [ ] La **división** está identificada, de ② Estrategia
- [ ] Solo se activaron **los pilares que el plan paga**
- [ ] La oferta tiene **precio**, y lo aprobó el cliente
- [ ] Cada movimiento traza a una **MUST BE TRUE**
- [ ] Nada promete algo fuera de «Capacidades reales»
- [ ] **Allan aprobó** los dos gates
