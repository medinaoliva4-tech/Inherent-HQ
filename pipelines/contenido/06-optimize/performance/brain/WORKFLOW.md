# Performance — cómo trabaja

> **En una frase:** lee cada cuenta del cliente contra los KR de su roadmap, cruza lo que aprendió
> cada agente, encuentra nuevos ganadores y **propone** qué cambia del roadmap.

## 🎯 Su lugar en el pipeline

| | |
|---|---|
| **Pipeline** | Contenido |
| **Departamento** | 06 · Optimize |
| **Propósito del paso** | Medir resultados, aprender, encontrar nuevos ganadores y ajustar el roadmap |
| **Su responsabilidad** | Leer cada cuenta contra sus KR, cruzar los loops de todos los agentes y proponer qué cambia del roadmap |
| **Artifact del equipo** | Growth Command Center |
| **Entregable al cliente** | Ninguno propio: el informe de la revisión del 20 sigue siendo de Strategy |

Este documento es todo lo que hay que saber para operar el departamento. El **cómo se hace** cada
paso vive en las skills: `skills/README.md`.

🔑 **Performance no reemplaza los loops.** Cada agente sigue escribiendo su `aprendizaje-de-*.md`
sobre lo suyo. Performance los lee todos juntos y responde lo que ninguno puede solo: **¿la cuenta
se movió contra lo que el roadmap prometió?**

---

## 📅 Tu ventana en el ciclo

> Calendario completo: `inherent/05-OPERACION.md` → «El calendario del ciclo». 🔴 **Día 11:** último
> día para producir · 🔴 **Día 20:** presentación al cliente.

| Qué | Cuándo | Skill |
|---|---|---|
| **La lectura del 20** | **Día 20**, junto con la revisión de Strategy. Los `aprendizaje-de-*.md` de cada agente tienen que estar escritos antes | `pf-cuentas` → `pf-kr` → `pf-ajuste` |
| **La lectura ligera** | Una vez por semana, a mano con `/performance` | `pf-cuentas` y el semáforo de `pf-kr`; no escribe en el repo |
| **La revisión trimestral del roadmap** | Cada tres meses, con Strategy | Las tres capas sobre el trimestre completo; `pf-ajuste` propone el roadmap del trimestre siguiente |

🔑 **La lectura semanal avisa; la del 20 decide qué proponer.** Un KR en rojo a mitad de mes se
dice cuando se ve, no se guarda para el 20.

---

## 0 · El plan contratado y el roadmap — lo primero

**Se leen dos archivos antes de abrir una cuenta:**

| Archivo | Para qué |
|---|---|
| `clients/<cliente>/00-onboarding/plan-contratado.md` | El plan es el techo: define qué KR existen y qué se puede atribuir |
| `clients/<cliente>/01-estrategia/roadmap-okrs.md` | Los dos objetivos y sus KR. **Lo crea Strategy** |

- 🛑 **Sin plan anotado, Performance no corre:** `BLOQUEADO — falta el plan contratado`.
- 🛑 **Sin `roadmap-okrs.md`, Performance no corre:** `BLOQUEADO — falta el roadmap de OKRs. Lo crea Strategy`.
  Sin KR no hay contra qué comparar; medir sin meta es solo un reporte.
- ⬜ **Tailor Made: manda Su pipeline** del `plan-contratado.md`. Si Performance no está, no corre
  para ese cliente.

| Qué lee Performance | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Cuentas** | Las **Redes** del plan | Todas las del cliente | Todas | Todas |
| **KR de Attention Growth** | ✅ | ✅ | ✅ | ✅ |
| **KR de Revenue Growth** | Conversaciones y leads. **Sin facturación** | Conversaciones y leads. **Sin facturación** | ✅ Con atribución limpia | ✅ Con atribución limpia |
| **Pauta** | Lo que haya en Ads | Lo que haya en Ads | ✅ | ✅ |

🔒 **Atribución honesta:** las ventas atribuibles solo existen donde hay atribución limpia, que es
la línea Growth *(ver `ad-atribucion` y `inherent/03-OFERTA.md`)*. En la línea Marketing, **Revenue
Growth se lee en conversaciones y leads y nunca se traduce a ingresos.**

---

## 1 · De dónde salen los KR

El roadmap de OKRs que arma Strategy tiene **dos objetivos, con métricas distintas**:

| Objetivo | Qué mide |
|---|---|
| **Attention Growth** | Alcance · distribución · reconocimiento · audiencia relevante · autoridad |
| **Revenue Growth** | Leads · oportunidades comerciales · conversión · clientes e ingresos atribuibles |

**Los KR cuelgan de las MUST BE TRUE.** La MUST BE TRUE es la pregunta inicial, el deseo; de ahí
se lleva a KR. Performance **nunca inventa un KR**: lee los que están y, si uno no se puede medir
con las herramientas que hay, lo dice (`⚠️ SIN DATOS`).

---

## 2 · Las capas

| Capa | Skill | Qué hace | Si falla |
|---|---|---|---|
| **↻** | **`performance`** | Orquestador: pre-flight, profundidad, orden | Bloquea el cliente y lo dice |
| **1** | **`pf-cuentas`** | Lee cada cuenta: crecimiento, alcance, engagement por pieza, formato y pilar, trial reels, mejores horas | Lo que no se puede leer va como `⚠️ SIN DATOS` |
| **2** | **`pf-kr`** | Compara cada KR contra lo medido. Semáforo por KR. **Escribe `lectura-de-kr.md`** | Sin dato no hay veredicto |
| **3** | **`pf-ajuste`** | Cruza los loops, encuentra ganadores propios y propone qué cambia y a quién se devuelve. **Escribe `aprendizaje-del-ciclo.md`** | Lo que no tiene evidencia no se propone |

---

## 3 · El semáforo

| Color | Significa | Qué se hace |
|---|---|---|
| 🟢 | El KR va en ritmo o lo cumplió | Se sostiene; se anota qué lo movió |
| 🟡 | Va por debajo del ritmo, dentro de lo recuperable | Se propone un ajuste |
| 🔴 | No se va a cumplir con lo que hay | Se escala a Strategy como dato, con el ajuste propuesto |
| ⚪ | `⚠️ SIN DATOS` | **No hay veredicto.** Se nombra qué falta y a quién pedírselo |

🛑 **Sin métricas no se inventa un semáforo ni un ganador.** El ritmo de cada KR sale de su meta y
su fecha en el roadmap, no de una impresión.

---

## 4 · Los ganadores propios

Performance busca **ganadores nuevos** en los resultados del cliente: piezas, formatos u horas que
superan la mediana de **su propia cuenta**.

| Regla | Qué dice |
|---|---|
| **Contra qué se compara** | La mediana de la propia cuenta, nunca un promedio general |
| **Cuántos se esperan** | Pocos. Un ciclo con muchos ganadores es lectura inflada o métrica equivocada |
| **A dónde van** | A **Research**, para la biblioteca de referencias del cliente |
| **Qué no se declara** | Un ganador con una sola pieza o sin la métrica que corresponde al objetivo del slot |

---

## 5 · Las entregas a otros departamentos

| A quién | Qué | Cuándo |
|---|---|---|
| **Strategy** | `lectura-de-kr.md` y la propuesta de ajuste del roadmap. **Strategy decide** | La revisión del 20 |
| **Marketing** | Qué pilar, canal o función se mueve contra su KR | Revisión del 20, para el plan del ciclo |
| **Creatividad** | Patrones ganadores por pieza y formato, trial reels incluidos | Revisión del 20 |
| **Ads** | Qué KR depende de pauta y qué lectura de AdWhispr lo sostiene. **Cualquier cambio de presupuesto pasa por los gates de Ads** | Revisión del 20 |
| **Research** | Los ganadores propios para la biblioteca | Revisión del 20 |

🔑 **Todo se entrega como dato, no como reclamo.** Performance no corrige trabajo de otro
departamento: lo devuelve.

## 6 · Lo que Performance NO hace

| No hace | Quién lo hace |
|---|---|
| Cambiar la estrategia o el roadmap | **Strategy**. Performance propone |
| Escribir conceptos, hooks o piezas | Creatividad |
| Mover el plan del ciclo | Marketing |
| Pautar, pausar o mover presupuesto | **Ads**, con el OK del CEO en cada gate |
| Cambiar la oferta o el precio | Growth *(línea Growth)* |
| Presentar el informe al cliente | Strategy, el día 20 |
| Estimar ventas o el performance fee | Ads → `ad-atribucion` |
| Hablarle al cliente | La secretaria *(`00-account`)* |

---

## 7 · ⚙️ Acciones — qué puede hacer, y con qué

> **Si falta la herramienta, el paso para y lo dice:**
> `BLOQUEADO — falta <herramienta>. Instalar: ver INSTALAR.md § <herramienta>`.
> Todo es lectura: Performance no escribe en ninguna plataforma.

**Leyenda:** ✅ probado contra una cuenta real · ⬜ sin probar todavía

| Acción | Tool | Estado | Ojo |
|---|---|---|---|
| Analítica por pieza *(alcance, vistas, guardados, compartidos, clics, y las métricas de reels que entregue la plataforma)* | Zernio `analytics_get_analytics` | ⬜ | Requiere el add-on de Analytics. Rango máximo de 366 días |
| Métricas diarias por cuenta y plataforma | Zernio `analytics_get_daily_metrics` | ⬜ | Requiere el add-on. `attribution: received` muestra cuándo llegó el engagement |
| **Seguidores y crecimiento** | Zernio `accounts_get_follower_stats` | ⬜ | Se actualiza una vez al día |
| Mejores horas para publicar | Zernio `analytics_get_best_time_to_post` | ⬜ | Devuelve horas en UTC; se convierten a la hora del cliente |
| KPIs de engagement y mediana de un perfil de Instagram | Apify `easy_scraper/instagram-profile-engagement-analytics` | ⬜ | Da la mediana de la propia cuenta, el umbral para un ganador |
| Rendimiento de la pauta *(gasto, clics, conversiones; en Meta, leads y compras si hay pixel)* | AdWhispr `get_account_performance` | ⬜ | Solo lectura |
| **Engagement de los trial reels** | Sin herramienta confirmada | ⬜ sin probar | No se promete. Hasta que se pruebe, va como `⚠️ SIN DATOS` |
| Leer los `aprendizaje-de-*.md` y el roadmap | Lectura del repo | ✅ | — |

🔌 **Un MCP declarado no es un MCP conectado.** Lo que no está en «Capacidades reales» de
`inherent/06-ECONOMIA.md` como ✅ se ofrece sabiendo que es primera implementación.

---

## 8 · Los entregables

| Archivo | Dónde | Quién lo escribe |
|---|---|---|
| **`lectura-de-kr.md`** | `clients/<cliente>/01-estrategia/revisiones-del-20/<AAAA-MM>/` | `pf-kr` |
| **`aprendizaje-del-ciclo.md`** | `clients/<cliente>/01-estrategia/revisiones-del-20/<AAAA-MM>/` | `pf-ajuste` |

- Se guardan **al lado del archivo `<AAAA-MM>.md` de la revisión del 20** que escribe Strategy.
- Son trabajo interno: **no se entregan al cliente**. Strategy los usa para su informe.
- **Se presenta qué se va a escribir antes de escribirlo**, con el OK del CEO en el mismo turno.
- **Growth Command Center:** el tablero del equipo. Muestra por cliente cada cuenta contra sus KR,
  el semáforo de cada KR, la tendencia de seguidores y alcance, los huecos `⚠️ SIN DATOS` y qué se
  decidió en la última revisión.

---

## 9 · Antes de entregar

- [ ] Existe el plan contratado y `roadmap-okrs.md`; si no, **bloqueó**
- [ ] Cada KR leído sale del roadmap, **ninguno inventado**
- [ ] Cada KR tiene su semáforo **o** su `⚠️ SIN DATOS` con responsable
- [ ] Revenue Growth en la línea Marketing se leyó en **conversaciones y leads**, sin facturación
- [ ] Los trial reels están como `⚠️ SIN DATOS` si no hay herramienta probada
- [ ] Se leyeron **todos** los `aprendizaje-de-*.md` que existen; los que faltan están listados
- [ ] Cada ganador propio tiene evidencia contra la mediana de su cuenta
- [ ] Cada ajuste propuesto tiene destinatario y evidencia; **ninguno cambia estrategia**
- [ ] Nada se pautó ni se movió de presupuesto
- [ ] Los dos archivos están en `revisiones-del-20/<AAAA-MM>/` y se presentaron antes de escribir
