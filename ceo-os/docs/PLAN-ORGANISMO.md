# Plan · El OS como un organismo (del Blueprint a las pantallas)

> **Esto es un plan, no código.** Nada de lo que está aquí se construye hasta que lo apruebes.
> **Base:** el *Inherent Blueprint* (16 pp., nov. 2026) y lo que pediste después.
> **Lo que no pude leer:** los enlaces de Instagram (piden sesión y mi entorno no sale a esa red). Usé **tu descripción** de cada uno. Si algún detalle de un reel importa, pégame el texto o una captura.

---

## 0 · En 10 líneas

1. **Ya no son 8 departamentos con 34 herramientas.** Son **cuatro órganos** de un solo organismo y **cinco superficies** para verlo.
2. **El Blueprint manda la forma:** 3 motores (**Acquisition · Delivery · Authority**) sostenidos por un **Management System** (responsables · KPIs · procesos · decisiones · incentivos).
3. **Cada persona responde por un resultado, no por una lista de tareas** (Outcome · Authority · Resources · Accountability). El OS muestra eso arriba, todos los días.
4. **Construimos solo lo que nos da ventaja** (combinaciones que no existen): el **Lead Engine**, el **Contexto vivo**, el **constructor de agentes** y el **constructor de video con retención**. **Lo demás se integra.** No hacemos un Figma.
5. **Costo operativo bajo:** modelos abiertos por API en el gateway que ya existe; los caros solo donde un error sale caro. **Codex y Claude solo para construir el OS**, no para operarlo.
6. **Pocas páginas.** Lo que interrumpe el organismo se **fusiona o se borra** (§ 8).
7. **Passkeys / Face ID: fuera.** Se aprueba con un toque y la versión que leíste (ya funciona).
8. **Primero planificamos** (este documento); después se construye en **tres olas**, cada una usable el mismo día (§ 10).
9. El ejemplo que pediste, **un sistema de leads con scraping fuerte que logre buenas respuestas de cold email**, es la **Ola B** y se detalla en § 5.
10. **Tú decides cinco cosas** (§ 11); una a la vez.

---

## 1 · El organismo: cuatro órganos

```
                    ┌─────────── PULSO ───────────┐
                    │  Hoy · Decide · ritmos · KPIs │   ← el Management System del Blueprint
                    └──────────────┬──────────────┘
        CONTEXTO  ◀────────────────┼────────────────▶  MANOS
   (lo que Inherent ya sabe)       │             (herramientas, integraciones, workflows)
   reuniones · CRM · chats ·       │
   biblioteca · hilo del cliente   ▼
                    ┌─────────── CEREBRO ─────────┐
                    │ LLM propio + agentes por rol │
                    │ modelo justo al costo justo   │
                    └──────────────────────────────┘
```

| Órgano | Qué es | Ya existe | Falta |
|---|---|---|---|
| **Pulso** | Lo que pasa hoy y lo que solo tú decides | Decide, franja del ciclo, Hoy | Los **ritmos del Blueprint** y el **KPI por rol** (§ 4) |
| **Contexto** | Memoria viva de la empresa; **no se pega a mano** | Hilo del cliente, Biblioteca, fichas | **Conectar fuentes**: reuniones, CRM, bandeja, correo (§ 6) |
| **Cerebro** | Un chat propio con modelos abiertos y agentes ajustados a cada trabajo | Gateway LiteLLM, equipo de cocina, capacidades, OpenUI | **Constructor de agentes**, presupuesto visible, harness compartido (§ 7) |
| **Manos** | Herramientas y workflows que ejecutan, siempre con aprobación cuando envía, publica o gasta | Motor de workflows, CRM, Apify, Zernio, Figwright, Remotion | **Lead Engine**, video con retención (§ 5, 9) |

> **Regla de oro:** una herramienta existe solo si responde **«¿qué necesita lograr esta persona esta semana y qué es lo más simple que se lo permite?»**. Si no, no entra.

---

## 2 · Del Blueprint a lo que se ve

| Blueprint dice… | El OS lo hace así |
|---|---|
| **Tres motores:** Acquisition (pipeline) · Delivery (resultados) · Authority (confianza) | Tres **superficies**: **Revenue**, **Clientes**, **Studio**. Cada una con **su número**: pipeline · margen y resultados por cuenta · alcance y oportunidades atribuibles |
| **Management System** (responsables · KPIs · procesos · decisiones · incentivos) | **Hoy** y **Decide** |
| **Cada manager: Outcome · Authority · Resources · Accountability** | Arriba de Hoy, **una tarjeta por persona**: su resultado, qué decide sin pedir permiso, su presupuesto y su indicador. Sin lista de tareas |
| **Quién decide qué / escala a quién** (9 pp.) | **Reglas de decisión** que el OS aplica solo: a quién le llega cada decisión y cuándo escala (extiende el `escalaA` actual). Ver § 4 |
| **Ritmo:** diario · lunes (30 min) · viernes (45 min) · mensual · trimestral | **Cuatro vistas automáticas** en Hoy que se abren solas ese día: *Lunes* (objetivos, responsables, capacidad), *Viernes* (resultados y desvíos), *Mes* (MRR, success fees, margen, cash), *Trimestre* (mercados, ofertas, ventaja) |
| **Rendición por rol:** Founder · Growth & Ops Manager · Strategy · Creative · RevOps · Analyst | Cada rol ve **su indicador** (margen/deadlines/capacidad; pipeline/conversiones; aprobación/tiempo/retrabajo; datos/SLA; exactitud/alertas) |
| **Economía:** MRR + success fees · Sourced / Managed / Closed Revenue · reglas de atribución | **Registro de atribución** (§ 5.5) en Revenue: cada oportunidad lleva su modalidad y los 5 criterios verificables. **Solo CEO** ve la economía por cliente |
| **Inherent Media** (podcast, clips, autoridad) | Es **una línea de producción más del Studio**: invitado → episodio → clips → distribución → oportunidades atribuibles (§ 9) |
| **Seis capacidades** | No son seis menús: son **los filtros del catálogo de agentes y herramientas** |
| **Seis roles internos, ocho externos** | **Roles del OS** y la **red de proveedores**: todo proveedor tiene un responsable interno (campo obligatorio) |
| **Etapas del roadmap** (MVP 4–6 roles → …) | El OS **muestra solo lo que esa etapa usa**; lo de etapas futuras no aparece |

---

## 3 · Las cinco superficies (en vez de ocho departamentos)

> **Una sola conversación al centro (el Chat), cinco superficies a su alrededor.** Todas leen el mismo Contexto y escriben en el mismo hilo. Una persona no «cambia de app»: cambia de vista.

| Superficie | Quién la usa | Qué resuelve | Herramientas (máx. 5) | Lo que NO tiene |
|---|---|---|---|---|
| **Hoy** *(Pulso)* | Todos; el CEO a diario | Qué pasa, qué sigue, qué decides, mi resultado | Decide · Ritmos · Tarjeta de resultado por persona · Calendario del ciclo | Tablas de tareas sueltas |
| **Revenue** *(Acquisition)* | Revenue Lead, Closers, Founder | Llenar y cerrar el pipeline de Inherent | **Lead Engine** · Pipeline/CRM · Propuesta y cotización · Registro de atribución · Respuestas (bandeja) | Un CRM genérico aparte |
| **Clientes** *(Delivery)* | Client Growth Lead, Operadores | Que cada cliente avance y se vea el resultado | **Sala del cliente** (hilo + ficha + entregables + portal) · Plan del ciclo · Resultados y margen por cuenta · Presentación del día 20 | Una pantalla por departamento |
| **Studio** *(Authority + producción)* | Creative & Agent Operator, Media | Ideas, guiones, video, diseño, publicación, podcast | **Constructor de video** · Guion/ángulos · Diseño (**Figma integrado**) · Posting y Community · Inherent Media | Editor de video completo, editor gráfico propio |
| **Sistemas** | AI Systems Engineer, CEO | Agentes, contexto, conexiones, costos | **Constructor de agentes** · Conexiones y MCPs · Workflows · Costos de IA · Fuentes del Contexto | Nada que vea un cliente |

*(Más: **Dinero**, solo CEO, vive dentro de Hoy → «Mes» y de Clientes → «margen»; no es una superficie.)*

---

## 4 · Las 34 herramientas, qué pasa con cada una

> **Regla:** se **fusionan** cuando comparten datos o la persona las usa seguidas; se **integran** cuando ya existe algo mejor; se **borran** cuando no cambian una decisión.

| Antes (§14) | Ahora | Por qué |
|---|---|---|
| Business Blueprint · ICP Builder · Market Explorer · Positioning Canvas | **Sala del cliente → «Estrategia»** (una sola vista: negocio → ICP → mercado → mensaje, con el agente investigando primero) | Ya comparten el hilo; son un solo flujo |
| Acquisition Simulator · Offer & Pricing Builder | **Sala del cliente → «Oferta y números»** (simulador con sliders + oferta) | Se usan juntos; el precio nunca va sin alcance |
| Creative Brief · Angle Matrix · Script & Storyboard · Approval Board | **Studio → «Guion»** (brief → ángulos → guion → aprobación en la misma vista) | Un solo recorrido |
| Design Studio | **Se integra Figma** (Figwright). No se construye | Ya existe y es mejor |
| Video Editing Studio · Content Repurposing | **Studio → Constructor de video** (§ 9) sobre el motor Remotion + ffmpeg que ya tenemos | No hacemos un editor completo: hacemos el que **aprende de retención** |
| Audience Radar · Competitor/Market intelligence | **Parte del Lead Engine** y del **Radar** de Marketing (ya existe) | Misma fuente: scraping |
| Campaign Builder · Content Calendar · Paid Media Planner | **Clientes → «Plan del ciclo»** + **Ads con sus 2 gates del CEO** (ya existe) | El calendario ya es el ciclo 1→20 |
| Production Planner · Shot List · Asset/Delivery | **Studio → «Rodaje»** (jornada + shot list + captura en iPhone) | Una sola jornada |
| Lead Intelligence · Outreach Studio · Sales Pipeline · Sales Playbook · Revenue Forecast | **Revenue → Lead Engine + Pipeline** (§ 5) | Es **el** sistema de Acquisition |
| BI Dashboard · Experiment Lab · Growth Insights | **Hoy → «Viernes» y «Mes»** (solo cifras reales y una conclusión; A/B aleatorio antes de decir «causó») | Un tablero por rol, no tres herramientas |
| Workflow Builder · Project & Delivery Manager · Resource & Capacity | **Sistemas → Workflows** (motor ya hecho) + **capacidad** como número en Hoy | El motor existe; la pantalla es simple |
| Financial Planning · Client Profitability | **Hoy → «Mes»** (solo CEO) y **Clientes → margen por cuenta** | La economía es del Blueprint: MRR + success fees |

**Resultado: de 34 a ~12 vistas reales**, todas sobre los 12 componentes del kit.

---

## 5 · El ejemplo guía: el Lead Engine

> **Meta:** que un cold email salga **bien dirigido, bien escrito y bien enviado**, y que la respuesta vuelva al pipeline sin que nadie copie y pegue.

### 5.1 · Los pasos (un solo flujo en Revenue)
```
1 ICP vivo ─▶ 2 Encontrar ─▶ 3 Enriquecer ─▶ 4 Calificar ─▶ 5 Redactar ─▶ 6 APROBAR ─▶ 7 Enviar ─▶ 8 Respuestas ─▶ 9 Pipeline
(del hilo)   (scraping)    (datos y señales) (puntaje ICP)  (con contexto)  (persona)    (con topes)  (clasificadas)  (CRM)
```
1. **ICP vivo:** sale del hilo del cliente (el de Inherent o el de un cliente). Sin ICP aprobado no corre.
2. **Encontrar:** Google Maps, LinkedIn, sitios y directorios con **scraping fuerte** (Apify donde ya está; alternativas abiertas abajo).
3. **Enriquecer:** sitio web, tecnología, señales de intención (contratando, abrió local, anuncios activos), decisor y correo verificado.
4. **Calificar:** puntaje explicable contra el ICP (por qué sí / por qué no). **Los que no encajan, no se escriben.**
5. **Redactar:** el agente escribe **con el Contexto** (voz de marca, casos, oferta, lo que ya se habló). Un primer correo corto y específico, no una plantilla.
6. **Aprobar:** **una persona aprueba el lote** y el contenido exacto (precio, alcance y fechas nunca se prometen solos). *Es el mismo candado de Decide.*
7. **Enviar:** con **topes por día y dominio**, ventanas de horario, baja inmediata y registro. Nunca desde un dominio sin calentar.
8. **Respuestas:** clasificadas (interés · objeción · «después» · rechazo · fuera de oficina) y **el agente propone la respuesta**; una persona la envía.
9. **Pipeline:** cada respuesta crea o mueve el lead (las reglas del CRM ya exigen siguiente paso y fecha).

### 5.2 · Qué ya existe y qué falta
| Paso | Ya existe | Falta |
|---|---|---|
| 1 ICP | Hilo + ICP | Leerlo para Inherent mismo |
| 2 Encontrar | Apify (Maps, IG, TikTok, anuncios), fuente «scraping» del CRM | Actores de **LinkedIn y directorios** y el lote con tope de costo |
| 3 Enriquecer | — | **Enriquecimiento** (sitio + señales + correo verificado) |
| 4 Calificar | Puntaje ICP en Strategy | Puntaje **por lead**, explicable |
| 5 Redactar | Agentes y voz de marca | Plantilla de **primer correo** + variantes A/B |
| 6 Aprobar | Decide + motor de workflows (aprobación sobre hash) | Aprobación **por lote** |
| 7 Enviar | Correo por Gmail (OAuth) y Zernio (correo) | **Topes, baja, reputación del dominio** |
| 8 Respuestas | Bandeja de Zernio | Clasificador + respuesta propuesta |
| 9 Pipeline | CRM con reglas | Enlace automático |

### 5.3 · Costo operativo (mantenerlo bajo)
- **Scraping:** el plan gratis de Apify cubre pocas cuentas; un lote de prospectos cuesta centavos por cientos. **Alternativas abiertas** para bajar el costo: Crawlee/Playwright autoalojados y Firecrawl autoalojado. *(Verificar licencias y términos de uso de cada sitio antes de adoptar.)*
- **IA:** redacción y clasificación con **modelo medio/bajo del gateway**; el modelo caro solo para calificar casos dudosos.
- **Envío:** el correo de la empresa (Gmail/Workspace); una herramienta de envío pagada (Instantly, Smartlead) **solo si el volumen lo pide**, no antes.

### 5.4 · Guardarraíles (no negociables)
- **Aprobación humana antes de enviar** y **tope diario** por dominio.
- **Baja en un clic** y lista de no contactar (la ley de correo comercial de cada país aplica; **verificarla con quien lleve lo legal** antes de escalar volumen).
- **Nada de datos personales que no hagan falta**; solo información pública.
- **Reputación del dominio primero:** dominio dedicado y calentado; si la tasa de rebote o quejas sube, **se frena solo**.

### 5.5 · El registro de atribución (Blueprint, p. 12)
Cada oportunidad lleva: **modalidad** (Sourced · Managed · Closed), **origen y actividad en el CRM**, **elegibilidad aceptada por el cliente**, **sobre qué se comisiona** (firmado, facturado o cobrado) y reglas de renovación/disputa. *«100% atribuible» ≠ «causó el 100%»*: el OS lo dice así.

---

## 6 · Contexto: lo que ya tenemos, sin pegarlo a mano

**Principio:** la IA ya conoce lo que Inherent sabe, **filtrado por quién pregunta y por cliente.**

| Fuente | Cómo entra | Estado |
|---|---|---|
| **Reuniones con clientes** | Conector de transcripciones (MCP) → resumen, decisiones y compromisos ligados a la marca | **Por conectar** |
| **CRM** | Ya es del OS | ✅ |
| **Chats / bandeja** | Zernio (comentarios y DMs), WhatsApp cuando esté conectado, correo | Parcial |
| **Biblioteca / knowledge** | Ya es del OS | ✅ |
| **Hilo del cliente** | Nodos aprobados | ✅ |
| **Entregables y resultados** | Ya son del OS | ✅ |

- **Cómo se usa:** el Chat y cada agente reciben **solo el contexto que esa persona puede ver** (por rol y por cliente); lo aprobado pesa más que lo que es hipótesis; **cada dato lleva su fuente** (si no, `⚠️ SIN DATOS`).
- **Cómo se guarda:** búsqueda por significado sobre la base que ya tenemos (Postgres con vectores) y **modelo de embeddings abierto**, sin servicio extra. *(Verificar que el plan de la base lo permite.)*
- **Qué no se hace:** nada de «cargar contexto» a mano en cada chat.

---

## 7 · Cerebro: tu propio «Claude» barato y a la medida

- **Una interfaz LLM propia** (el Chat del OS) con **modelos abiertos por API** a través del gateway que ya corre (LiteLLM: Featherless, NVIDIA, DeepSeek, Kimi, GLM…). **Llaves virtuales y presupuesto por persona y por cliente.**
- **El «equipo de cocina»** ya elige modelo por tarea: lo barato ejecuta, lo caro planifica y revisa.
- **Costo visible:** cada tarea muestra lo que costó; **tope mensual** por persona y por cliente; el gasto aprobado pasa por tarjeta (ya existe).
- **Claude/Codex** quedan **solo para construir** el OS, no para operar el día a día.

### Agentes a la medida (constructor)
Un agente = **modelo ideal para su trabajo + harness ideal + contexto de la Biblioteca**:
1. **Plantillas por rol** (Revenue, Client Growth, Creative, AI Systems, Analyst) con su modelo, sus herramientas y su contexto ya puestos.
2. **Crear uno nuevo** = elegir el **resultado** que debe producir, las **fuentes** que puede leer y las **acciones** que puede pedir (todo lo externo, con aprobación).
3. **Probarlo contra un caso real** antes de activarlo, con su costo estimado.
4. **Harness compartido (multi-jugador):** varias personas y agentes **trabajan en el mismo hilo** (presencia, relevos «te lo paso», quién tiene la pelota). *Ya lo hacemos por cliente; falta la presencia y el relevo.*

### MCPs usados mejor
- **Un registro único** de conectores con **permiso por rol** (quién puede llamar qué).
- **Carga bajo demanda:** el agente ve solo las herramientas del conector que la tarea necesita (menos tokens, menos errores).
- **Resultados con fuente y confianza** (ya es regla del contrato de Intent-to-Interface).

---

## 8 · Qué se fusiona o se borra (para que sea un organismo)

> **Propuesta.** Nada se borra sin tu OK. «Borrar» = se archiva el código y se quita de la barra.

| Hoy en la barra | Propuesta | Razón |
|---|---|---|
| Hoy · Decide | **Se unen en Hoy** (Decide es su bloque principal) | Una sola puerta para «qué hago» |
| Agentes | **Sistemas → Agentes** | Es del AI Engineer |
| Calendario | **Hoy** (vista del ciclo) y **Clientes → Plan del ciclo** | Es el pulso |
| Organización → Proyectos · Tareas · Fechas | **Se funden en Hoy** (tu resultado + lo que te toca) y en **Sala del cliente** | El Blueprint pide resultado, no lista de tareas |
| Organización → CRM | **Revenue** | Es Acquisition |
| Organización → Clientes · Servicios | **Clientes** (Servicios = la ficha dentro de la sala) | Una pantalla por cliente |
| Organización → Finanzas | **Hoy → Mes** y **Clientes → margen** (solo CEO) | Economía del Blueprint |
| Empresa → Equipo · Visión · Roadmap | **Hoy → Trimestre** + Biblioteca | Rituales, no páginas |
| Empresa → Laya | **Sale de la barra:** corre de fondo como criterio | No es un lugar donde vivir |
| Empresa → Configuración · Áreas · Conexiones · Ajustes | **Sistemas** | Una sola trastienda |
| Biblioteca | **Se queda** (es el Contexto visible) | — |
| 5 workspaces de «Áreas» | **Se absorben** en Clientes y Studio | Eran departamentos, no personas |

**Barra final (escritorio):** `Hoy · Chat · Revenue · Clientes · Studio · Biblioteca` — y abajo, `Sistemas`.
**Barra del teléfono:** `Hoy · Chat · Clientes · Studio · Más`.

---

## 9 · Constructor de video (con «feeling» y retención)

- **Qué hace diferente:** no es un editor; es un **armador guiado por retención**. Muestra, sobre la línea de tiempo, **dónde cae la atención** (hook, ritmo de cortes, subtítulos, giro emocional) y **propone el siguiente corte** con la razón.
- **Cómo:** guion → **escenas** → toma/derivado → **gráficos de retención** (curva esperada y real, cuando hay datos) → exportar. Usa el **motor Remotion + ffmpeg** que ya está, y los clips del rodaje.
- **De dónde aprende:** los videos que **ya funcionaron** del Radar y de la cuenta del cliente (el criterio por comparación y Laya).
- **Inherent Media:** el mismo constructor saca **clips del podcast** (transcript → momentos → derivados → distribución).
- **No se construye:** un editor multicapa completo, un editor gráfico ni un Figma. Si algo de eso hace falta, **se integra**.

---

## 10 · Orden de construcción (tres olas, cada una usable)

| Ola | Qué entrega | Por qué primero | Quién construye |
|---|---|---|---|
| **A · Pulso + Contexto** | Hoy con **ritmos** (lunes/viernes/mes/trimestre), tarjeta de **resultado por persona**, **reglas de decisión** del Blueprint en Decide, **conectar reuniones, correo y bandeja** al Contexto, barra nueva (§ 8) | Todo lo demás se apoya en esto y quita fricción de inmediato | Claude + Codex |
| **B · Lead Engine** | Los 9 pasos de § 5 sobre lo que ya existe, **con aprobación por lote** y topes | Es el motor de **Acquisition** y el que más rinde | Claude + Codex |
| **C · Studio** | **Constructor de agentes**, **constructor de video con retención**, **Inherent Media** | Es la ventaja de **Delivery/Authority** | Claude + Codex |

Cada ola termina con: pruebas verdes, **capturas en el navegador** (claro/oscuro, escritorio y teléfono) y lo que no pude probar **dicho con nombre**.

---

## 11 · Lo que decides tú (una a la vez)

1. **¿Apruebas las cinco superficies y la barra de § 8?** *(Hoy · Chat · Revenue · Clientes · Studio · Biblioteca + Sistemas)*.
2. **¿Empezamos por la Ola A o por la B** (Lead Engine)? *Mi recomendación: A, porque la B necesita el Contexto y las reglas de decisión.*
3. **Correo de cold email:** ¿qué dominio y qué cuenta se usa para enviar? *(Hace falta uno dedicado y calentado.)*
4. **Transcripciones de reuniones:** ¿qué herramienta usan hoy para grabarlas? *(Define el conector.)*
5. **Tope mensual de IA** por persona y por cliente *(hoy no hay un número aprobado)*.
