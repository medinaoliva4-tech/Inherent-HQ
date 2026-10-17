# Operación — Cómo lo entregamos

> **Quién hace qué, en qué orden y en qué fecha.** Los roles, el pipeline, el calendario del
> ciclo y cómo se costea cada rol por rubro.
>
> **`03-OFERTA.md` dice QUÉ se promete. Este archivo dice CÓMO se entrega.**

**Contenido:**
1. Los roles
2. La cadena de mando
3. El pipeline
4. El calendario del ciclo
5. Quién hace qué
6. Lo que cuesta cada rol
7. Cómo se entrega al cliente
8. Cómo se opera

---

## 1 · Los roles

> **El manual habla de roles, no de personas.** Quién ocupa cada rol está en una sola tabla,
> «Los slots». Si cambia una persona o una herramienta, se cambia esa tabla y nada más.

| Rol | Qué hace | Cómo cobra |
|---|---|---|
| **CEO** | Decide la estrategia, la ruta, los servicios y las promesas. Tiene la reunión del día 1 con cada cliente y aprueba ideas y calendario | De la utilidad. **Sus horas son capacidad, no costo** |
| **COO** | Recibe del CEO y organiza al equipo operativo. Coordina producción, fotografía, edición y al operador. **Coordina las entregas, no hace todos los trabajos:** recibe lo terminado, lo arma y lo pasa | De la utilidad, después de los costos fijos |
| **Operador de agentes** | **Solo opera agentes:** Creatividad, Branding, Diseño gráfico, Posting y Community management. Construye la herramienta a medida | Rubro **Operador de agentes** |
| **Editor de video** | Edita los videos y sus derivadas con el workflow de Video Editing | Rubro **Edición de video** |
| **Fotografía** | La sesión de fotos del ciclo | Rubro **Fotografía** |
| **Producción** | Graba | Rubro **Grabación** |
| **Secretaria** *(WhatsApp)* | El agente `00-account`. Atiende al cliente todos los días y escala lo que no puede resolver | Rubro **Herramientas / IA** |
| **Especialista** | El mentor de la industria hace la auditoría. Hay tres: **negocio, números (conta) y SOPs (admin)** | Rubros **Especialista** y **Auditoría** — solo Growth Partnership |

### Cómo crece el equipo

| Clientes | Qué cambia |
|---|---|
| **Hasta 3** | El COO también es el operador de agentes y cobra el rubro Operador |
| **Más de 3** | **Entra un operador de agentes.** El COO queda solo como COO y cobra de la utilidad |

### 🎛️ Los slots — quién y qué ocupa cada rol hoy

| Slot | Hoy |
|---|---|
| **CEO** | Allan *(Rodrigo)* |
| **COO** | Pablo |
| **Operador de agentes** | Pablo |
| **Editor de video** | Molina |
| **Fotografía** | Mikela |
| **Producción** *(grabación)* | Marcos |
| **Secretaria** *(WhatsApp)* | Nicole — agente `00-account` |
| **IA** | Claude |
| **Scraping** | Apify — conectado por MCP en `.mcp.json`, cada quien con su cuenta |
| **Publicación y bandeja de mensajes** | Zernio |
| **Diseño** | Figma |

🔑 **El resto del repo nombra el rol o la responsabilidad, nunca la persona.**

---

## 2 · La cadena de mando

```
              CEO
   estrategia · ruta · servicios · promesas
                │
                ▼
              COO
   organiza · coordina · arma lo entregado
                │
   ┌──────────┬─┴────────┬───────────┐
   ▼          ▼          ▼           ▼
PRODUCCIÓN  FOTOGRAFÍA  EDITOR    OPERADOR
  graba      fotos     de video   de agentes
                                     │
                                     ▼
                                  AGENTES
                                     │
   lo terminado vuelve al COO  ◄─────┘
                │
                ▼
   COO lo arma y lo pasa al CEO o al group chat
                │
                ▼
            CLIENTE
```

🔑 **El objetivo de la estructura: que el CEO solo dirija.** Todo lo que se puede coordinar lo
coordina el COO; todo lo que se puede ejecutar lo ejecutan los agentes.

---

## 3 · El pipeline

```
┌─ ONBOARDING ──────────── una vez, al activar la cuenta ──────────────┐
│                                                                       │
│   01 STRATEGY → 01.2 BRANDING → 02 GROWTH → 03 MARKETING              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─ CICLO MENSUAL ───────── cada mes, del día 1 al 20 ──────────────────┐
│                                                                       │
│   04 CREATIVE → 05 PRODUCTION → 06 GRAPHIC DESIGN → 07 VIDEO EDITING  │
│   → 08 COMMUNITY → 09 POSTING → 10 ADS                                │
│                                                                       │
│   Cada departamento se auto-revisa antes de su gate.                  │
│   ②B Branding valida con br-guardian antes de que nada se publique.   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                   ↻ REVISIÓN DEL 20 → entra al ciclo siguiente
```

| # | Etapa | Recibe | Entrega | Corre en |
|---|---|---|---|---|
| **00** | **Account** | El cliente | La relación diaria. **El único que le habla** | Todos |
| **01** | **Strategy** | La información cruda del negocio | Comprensión del negocio + estrategia + un brief por área | Todos · la profundidad la fija el nivel y la ficha |
| **01.2** | **Branding** | La estrategia | Guía de marca: territorio, voz, sistema visual, activos | Todos |
| **02** | **Growth** | La estrategia | Oferta, canales grandes, upsells, conversión y números | Growth Partnership · ligero en Brand Growth *(elige qué ofertas empujar)* |
| **03** | **Marketing** | Estrategia y marca | Plan del ciclo: campañas, pilares, canales y calendario de slots | Brand Growth · Growth Partnership |
| **04** | **Creative** | El plan del ciclo, o la estrategia y la marca en Brand Foundation | Ideas listas para producir: hook, copy, escenas y layout; en Brand Foundation, dirección creativa y ejemplos de aplicación | Todos |
| **05** | **Production** | Las ideas aprobadas | Material grabado y fotografiado | Brand Growth · Growth Partnership, según la ficha |
| **06** | **Graphic Design** | Ideas, marca y material | Estáticos, carruseles y stories | Brand Growth · Growth Partnership, según la ficha |
| **07** | **Video Editing** | El material grabado | Reels y todas sus derivadas | Brand Growth · Growth Partnership, según la ficha |
| **08** | **Community** | Lo publicado y lo que entra | Comentarios y mensajes atendidos | Growth Partnership · Brand Growth si la ficha incluye gestión de comunidad |
| **09** | **Posting** | Lo aprobado | Contenido programado o publicado | Brand Growth · Growth Partnership, según los canales de la ficha |
| **10** | **Ads** | Lo apto para pauta | Campañas activas y su reporte | Según los canales con publicidad de la ficha |
| **↻** | **Strategy** | La analítica del mes | El ajuste de estrategia que entra al ciclo siguiente | Brand Growth · Growth Partnership |

**El pipeline se arma por cliente.** El diagrama de arriba es el **mapa completo**; ningún
cliente corre todo. **Cada cliente tiene su propio pipeline**, compuesto con los módulos que su
ficha de oferta incluye *(las áreas están productizadas, así que cada módulo ya trae su
resultado, entregables, volumen, revisiones y SOP)*. Se ajusta cuando cambia lo que el cliente
necesita: se agrega, se quita o se reordena un módulo **sin cambiar de nivel**, mientras no
pase el techo del nivel.

**El techo por nivel — lo que puede entrar, no lo que siempre corre:**

| Nivel | Departamentos |
|---|---|
| **Brand Foundation** | ① Strategy y ②B Branding como núcleo; ④ Creatividad para la dirección creativa y los ejemplos de aplicación. Es un proyecto con inicio y cierre: corre el onboarding y entrega al cierre; **no tiene ciclo mensual**. La ejecución continua se cotiza como Brand Growth o como módulos |
| **Brand Growth** | ③ Marketing, ④ Creatividad, ⑤ Producción, ⑥A Diseño gráfico, ⑦ Video Editing, ⑨ Posting y ⑩ Ads, según los canales contratados en la ficha |
| **Growth Partnership** | Todo Brand Growth, además ② Growth, ⑧ Community y el especialista |

**El detalle de cada agente —sus acciones y qué entrega según la ficha de alcance— está en
`agents/README.md` y en el `brain/WORKFLOW.md` de cada uno.**

### Las reglas del pipeline

| Regla | Qué dice |
|---|---|
| **Sin input no hay etapa** | Ninguna etapa arranca sin el entregable de la anterior. Si falta, se vuelve — no se improvisa |
| **El pipeline es del cliente** | Se arma con los módulos de su ficha. Los niveles ponen el techo; no hay un pipeline único |
| **Primer contacto: un minuto** | A quien escribe por «Hablemos» se le responde en un minuto; el precio se da en la conversación, con el caso entendido y lo que está en juego a la vista |
| **La ficha manda** | El alcance de la ficha de oferta del cliente es techo duro. Se lee `06-ECONOMIA.md` antes de producir. Sin ficha, se bloquea al cliente |
| **Sin acción no hay promesa** | Lo que no está en «Capacidades reales» de `06-ECONOMIA.md` no se hace |
| **Gate humano** | Publicar, pautar, enviar al cliente y borrar **siempre** pasan por el gate del rol que dice la sección 5 |
| **Un cliente por sesión** | Nunca se mezclan dos clientes |

---

## 4 · 📅 El calendario del ciclo

> **Cada ciclo de contenido corre del día 1 al día 20 del mes.** Es la guía de qué se hace en
> cada parte del mes y de cuáles son los límites. **Ningún agente corre fuera de su ventana.**

| Días | Qué pasa | Rol | Agente · skills |
|---|---|---|---|
| **1** | **Reunión con el cliente** | **CEO** | — |
| **1 – 3** | El plan del ciclo: estrategia, marketing, creatividad y producción | Operador + agentes · **CEO aprueba la estrategia** | ① Strategy · ③ Marketing · ④ Creatividad · ⑤ Producción `pr-brief` |
| **2 – 3** | **Calendario y shot list** | Operador + agentes | ③ Marketing `mk-calendario` · ④ Creatividad `cr-arte-video` |
| **3 – 6** | **Brand guidelines** | Operador + agentes | ②B Branding |
| **4 – 5** | **Coordinar producción, fotografía y modelos** | **COO** | ⑤ Producción `pr-jornadas` · `pr-recursos` |
| **6 – 10** | **Producir** | Producción · Fotografía | ⑤ Producción `pr-rodaje` |
| **11** | **ÚLTIMO DÍA PARA PRODUCIR** | Producción | ⑤ Producción `pr-entrega` |
| **12 – 15** | **Montar el contenido** | Editor de video · Operador | ⑦ Video Editing · ⑥A Diseño gráfico |
| **16 – 19** | **Cambios, QA y programación** | Operador + agentes · **COO hace el QA final** | ②B Branding `br-guardian` · ⑨ Posting |
| **20** | **PRESENTACIÓN AL CLIENTE** | **COO** en Brand Growth · **CEO** en Growth Partnership | — |

```
DÍA   1    2    3    4    5    6    7    8    9    10   11   12   13   14   15   16   17   18   19   20
      ●  REUNIÓN CON EL CLIENTE
      ├─────────┤  PLAN DEL CICLO
           ├────┤  CALENDARIO + SHOT LIST
                ├──────────────┤  BRAND GUIDELINES
                     ├────┤  COORDINAR EQUIPO + MODELOS
                               ├───────────────────┤  PRODUCIR
                                                        ●  ÚLTIMO DÍA PARA PRODUCIR
                                                             ├──────────────┤  MONTAR EL CONTENIDO
                                                                                 ├──────────────┤  CAMBIOS Y PROGRAMACIÓN
                                                                                                     ●  PRESENTACIÓN AL CLIENTE
```

### Los dos límites

| Límite | Qué significa | Si no se cumple |
|---|---|---|
| **Día 11 — último día para producir** | Después del 11 no se graba nada del ciclo | Se monta con el material que hay, el banco y los derivados. **No se corre el montaje** |
| **Día 20 — presentación al cliente** | El ciclo llega completo, revisado y programado | Se presenta lo que pasó el gate. **Nada se presenta sin `br-guardian`** |

### Las reglas del calendario

| Regla | Qué dice |
|---|---|
| **Cuándo se publica** | **Lo que se presenta el día 20 se publica desde el día 1 del mes siguiente.** El ciclo de octubre es el contenido de noviembre |
| **El calendario real** | **Las fechas se ajustan cada mes** a los fines de semana y feriados. Los dos límites se respetan |
| **Si un límite se adelanta** | Se acorta el bloque que lo precede. El resto del ciclo no se mueve |

### Primer ciclo vs. ciclos siguientes

| Bloque | 🆕 Primer ciclo *(onboarding)* | ↻ Ciclos siguientes |
|---|---|---|
| Días 1-3 · Comprensión y estrategia | Completas | **Se revisan, no se rehacen.** Entra lo aprendido el día 20 anterior |
| Días 3-6 · Brand guidelines | **Se construyen** | **No se rehacen.** Esos días quedan para coordinar y producir |
| Días 6-20 | Igual | Igual |

🔑 **La marca se construye una vez y se mantiene.** Si se rehiciera cada mes, no cabría en el
costo fijo de la ficha.

---

## 5 · Quién hace qué

> **BG** = Brand Growth · **GP** = Growth Partnership · **Todos** = los niveles que corren ciclo, según la ficha.
> Brand Foundation es un proyecto: corre ① Strategy, ②B Branding y ④ Creatividad.

### Cliente

| Tarea | Rol | Dónde |
|---|---|---|
| **Reunión del día 1** | **CEO** | Todos |
| **Comunicación diaria** | **Secretaria** → escala al **COO**. Al CEO solo le llega precio, alcance o estrategia | Todos |
| **Presentar las piezas del día 20** | **COO** en BG · **CEO** en GP | BG · GP |
| **Sesión de dirección** | **CEO** | GP — la cadencia la fija la ficha |

### Estrategia

| Tarea | Rol | Dónde |
|---|---|---|
| Estrategia inicial y revisión del 20 | Agentes ① Strategy → **CEO aprueba** | Todos |
| Ajuste de la estrategia | **CEO** | Todos |
| **Aprobar ideas y calendario** | **CEO** | Todos |
| Replanteo trimestral | **CEO** | GP |

### Oferta y conversión

| Tarea | Rol | Dónde |
|---|---|---|
| Rediseño de oferta, paquetes y precio | ② Growth + **CEO** | GP |
| Abrir canales grandes | ② Growth + **CEO** | GP |
| Upsells y escalera de ticket | ② Growth · Operador | GP |
| Embudos, auto-DM, atribución y pruebas A/B | Agentes · Operador | GP |
| Entrenamiento de closing | **CEO** | GP |

### Producción y contenido

| Tarea | Rol | Dónde |
|---|---|---|
| **Coordinar producción, fotografía y edición** | **COO** | Todos |
| Grabar | **Producción** | Todos |
| Fotografiar | **Fotografía** | Todos |
| Editar los videos y sus derivadas | **Editor de video** | Todos |
| Estáticos, carruseles y stories | **Operador** con ⑥A Diseño gráfico | Todos |
| Correr Creatividad, Branding, Diseño, Posting y Community | **Operador** | Todos |
| **QA final** | Agentes *(`br-guardian`)* → **COO** | Todos |

### Publicación, comunidad y pauta

| Tarea | Rol | Dónde |
|---|---|---|
| Programar y publicar | **Operador** con ⑨ Posting | Todos |
| **Comentarios y mensajes** | **Operador:** una vez al mes configura el agente con la información del cliente, y el agente queda atendiendo. Escalera en `03-OFERTA.md` → «Community management» | GP · BG si la ficha lo incluye |
| **Agente de WhatsApp a medida** | **CEO** define el alcance → **Operador** lo construye | GP |
| Pauta | **Operador** con ⑩ Ads · **CEO** aprueba plan y presupuesto | BG · GP |

### Tecnología

| Tarea | Rol | Dónde |
|---|---|---|
| **Herramienta a medida** | **CEO** define el alcance → **Operador** la construye | GP — las que fije la ficha |
| **IA propia del cliente** | **CEO** define el alcance → **Operador** la construye | GP, si la ficha la incluye |
| Landings, microsites y automatización de procesos | Agentes · Operador | GP |

### Operación y auditoría

| Tarea | Rol | Dónde |
|---|---|---|
| **Auditoría** *(negocio, números y SOPs)* | **Especialista** | GP — la cadencia la fija la ficha |
| Decidir qué se implementa de la auditoría | **CEO + COO** | GP |
| SOPs de crecimiento, mapa de experiencia y LTV, documentación y entrenamiento | **COO** con agentes | GP |
| SOPs de los procesos de las áreas contratadas · finanzas vinculadas al crecimiento | **CEO** | GP, si la ficha lo incluye |
| Corporate structure | **Especialista** *(auditoría)* | GP, si la ficha lo incluye |

### Medición

| Tarea | Rol | Dónde |
|---|---|---|
| Reporte mensual | Agentes · Operador | Todos |
| Dashboard en vivo | Agentes · Operador | GP |

---

## 6 · Lo que cuesta cada rol

> **Cada cuenta paga un monto fijo a cada rubro, según su ficha de oferta.** No es estimación:
> **es el techo.** El detalle económico completo está en `06-ECONOMIA.md`.

**Los montos de cada rubro salen de la ficha del cliente, por volumen y complejidad.** No hay una
tabla de montos por nivel en el manual.

| Rubro | Rol que cobra | Qué paga |
|---|---|---|
| **Grabación** | Producción | Las horas de grabación de la ficha. **La tarifa por hora baja cuando suben las horas** |
| **Fotografía** | Fotografía | La sesión de fotos del ciclo: **Q300 por sesión de 1 h** |
| **Edición de video** | Editor de video | Los videos planificados y sus derivados |
| **Operador de agentes** | Operador | Estáticos, carruseles, stories, programación y herramienta a medida |
| **Herramientas / IA** | — | El aporte de la cuenta a la IA, el scraping y las tools |
| **Especialista** *(auditoría con el mentor)* | Especialista | Solo Growth Partnership |
| **Auditoría conta** | Especialista | Solo si la ficha la incluye |
| **Auditoría admin** *(SOPs)* | Especialista | Solo si la ficha la incluye |
| **Buffer** | — | El colchón para imprevistos |

### Lo que entrega cada rol

**Lo que entrega cada rol es lo que dice la ficha:** sesiones y horas de grabación, sesión de
fotos, videos planificados y derivados, estáticos y carruseles, stories y recortes. **Ni más, ni
menos.**

### Las reglas del costo

| Regla | Qué dice |
|---|---|
| **El costo es fijo por ficha y por rubro** | No se estima, no se promedia, no se pasa. **No cambia con el número de clientes** |
| **La tarifa baja con las horas** | A más horas por cuenta, menor tarifa por hora — más volumen para la persona |
| **La producción no se baja recortando horas** | Si el monto no alcanza, **se cambia la mezcla** *(más derivados, contenido crudo del cliente)* **o se cotiza extra** |
| **Una cuenta que consume más** | Se cotiza extra o se amplía el alcance. **Nunca se absorbe** |
| **Costos de terceros** | Pauta, producción especial, talento, locaciones, viajes, licencias: **siempre aparte** |
| **CEO y COO no son rubro** | Cobran de la utilidad. Sus horas son capacidad |
| **El buffer es el colchón** | Cubre los imprevistos: regrabar, una revisión extra, una pieza que se cae |

### El acuerdo con cada persona

> **Se firma una vez, con los montos por rubro escritos. No se renegocia en cada cliente nuevo.**

| Cláusula | Qué dice |
|---|---|
| **Monto por cuenta** | El de su rubro, según la ficha de cada cuenta. **Es fijo** |
| **Qué incluye** | Lo que la ficha promete de ese rubro — ni más, ni menos |
| **Si una cuenta pide más** | Se cotiza extra al cliente o se amplía el alcance |
| **Revisión** | Solo si cambia la tabla de costos por rubro. **No por volumen** |

---

## 7 · Cómo se entrega al cliente

```
EQUIPO terminado  →  agentes se auto-revisan  →  br-guardian valida
                                                         │
                                                         ▼
                                            COO: QA final y arma la entrega
                                                         │
                         ┌───────────────────────────────┴───────────────┐
                         ▼                                               ▼
              Brand Growth                                     Growth Partnership
              el COO presenta el día 20                        el CEO presenta el día 20
                         └───────────────────────────────┬───────────────┘
                                                         ▼
                                     se publica desde el día 1 del mes siguiente
```

| Canal | Para qué | Quién |
|---|---|---|
| **Reunión del día 1** | Arrancar el ciclo y decidir | CEO |
| **Presentación del día 20** | Entregar el ciclo completo | COO en Brand Growth · CEO en Growth Partnership |
| **WhatsApp** | Todo lo del día a día | Secretaria → COO |
| **Group chat interno** | Donde el COO deja lo armado para el CEO | COO |

🔒 **La secretaria nunca dice costos, márgenes ni nada de otro cliente, ni compromete precio,
fecha o alcance.** Eso lo decide el CEO.

### El Drive de cada cliente

**El material de cada cliente vive en Google Drive**, dentro de la carpeta de entregas de Inherent.
**Inherent OS crea las carpetas y las conecta**: los guiones, lo que va por postear y los assets
se ven desde la app.

```
CLIENTE/
├── 00 Onboarding
├── 01 Assets de marca          → los assets del cliente en Inherent OS
├── 02 Guiones                  → Content · Guiones
├── 03 Crudo (grabaciones)
├── 04 Por postear              → Content · Por postear y Planner
├── 05 Entregables
├── 06 Reportes
└── 07 Números y auditoría      solo Growth Partnership
```

### El ritmo del mes

| Cuándo | Qué corre | Rol |
|---|---|---|
| **Diario** | Comentarios, mensajes y seguimiento | Agentes · Secretaria |
| **Semanal** | Radar de competencia · revisión de pauta · cola de piezas | Operador |
| **Días 1-20** | El ciclo de contenido | Todos |
| **Día 20** | Presentación y revisión del mes | CEO · COO |
| **Mensual** | Números del mes | CEO *(Growth Partnership, si la ficha lo incluye)* |
| **Trimestral** | Replanteo de estrategia y revisión de precio | CEO *(Growth Partnership)* |

### La revisión del 20 cruza los cuatro sistemas

```
   CONVERSION dice   → cuántos entraron y cuántos se cerraron
   MONEY dice        → cuánto dejó cada uno
   OPERATIONS dice   → qué se rompió o qué aguantó
        ↓
   GROWTH decide     → qué se cambia el mes que viene
```

---

## 8 · Cómo se opera

**Cada agente se invoca en su propia sesión de Claude Code, contra este repo. Sin servidores ni
hosting:** la sesión lee `CLAUDE.md`, entra por el router `/inherent`, abre el `brain/` del
agente que toca y trabaja sobre el folder del cliente.

```
Una sesión por cliente
   │
   ├── "corré el onboarding de <cliente>"      → 01 · 01.2 · 02 · 03
   ├── "armá el mes de <cliente>"              → 04 · 05 · 06 · 07
   ├── "atendé la comunidad de <cliente>"      → 08  🔒 gate
   ├── "publicá lo aprobado de <cliente>"      → 09  🔒 gate
   ├── "lanzá las campañas de <cliente>"       → 10  🔒 gate
   └── "corré la revisión del 20 de <cliente>" → ↻
```

### Lo que exige de los agentes

| Requisito | Por qué |
|---|---|
| **Autónomos donde se puede** | Diseño, copy, programación y reportes: sin humano en el medio |
| **Dirigidos donde importa** | Estrategia, creatividad y pauta proponen; **el CEO decide** |
| **Que levanten excepciones, no preguntas** | Si el agente pregunta todo, no ahorra nada |
| **Que se auto-revisen** | Es lo que mantiene al COO y al CEO dentro de sus horas |
