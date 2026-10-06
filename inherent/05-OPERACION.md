# Operación — Cómo lo entregamos

> **Quién hace qué, en qué orden y en qué fecha.** Los roles, el pipeline, el calendario del
> ciclo y lo que cuesta cada rol por plan.
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
| **Especialista** | El mentor de la industria hace la auditoría. Hay tres: **negocio, números (conta) y SOPs (admin)** | Rubros **Especialista** y **Auditoría** — solo Growth |

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
| **Scraping** | Apify |
| **Publicación y bandeja de mensajes** | *Se define en esta tabla* |
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
| **01** | **Strategy** | La información cruda del negocio | Comprensión del negocio + estrategia + un brief por área | Todos · ligera en 🔷 · completa en 🟨 |
| **01.2** | **Branding** | La estrategia | Guía de marca: territorio, voz, sistema visual, activos | Todos |
| **02** | **Growth** | La estrategia | Oferta, canales grandes, upsells, conversión y números | Solo 🟨 |
| **03** | **Marketing** | Estrategia y marca | Plan del ciclo: campañas, pilares, canales y calendario de slots | Todos |
| **04** | **Creative** | El plan del ciclo | Ideas listas para producir: hook, copy, escenas y layout | Todos |
| **05** | **Production** | Las ideas aprobadas | Material grabado y fotografiado | Todos |
| **06** | **Graphic Design** | Ideas, marca y material | Estáticos, carruseles y stories | Todos |
| **07** | **Video Editing** | El material grabado | Reels y todas sus derivadas | Todos |
| **08** | **Community** | Lo publicado y lo que entra | Comentarios y mensajes atendidos | 🔷 Pro · 🟨 |
| **09** | **Posting** | Lo aprobado | Contenido programado o publicado | Todos |
| **10** | **Ads** | Lo apto para pauta | Campañas activas y su reporte | Todos |
| **↻** | **Strategy** | La analítica del mes | El ajuste de estrategia que entra al ciclo siguiente | Todos |

**El detalle de cada agente —sus acciones y qué entrega en cada plan— está en `agents/README.md`
y en el `brain/WORKFLOW.md` de cada uno.**

### Las reglas del pipeline

| Regla | Qué dice |
|---|---|
| **Sin input no hay etapa** | Ninguna etapa arranca sin el entregable de la anterior. Si falta, se vuelve — no se improvisa |
| **El plan manda** | El volumen del plan es techo duro. Se lee `06-ECONOMIA.md` antes de producir |
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
| **1 – 3** | El plan del ciclo: estrategia, marketing, creatividad y producción | Operador + agentes · **CEO aprueba** | ① · ③ · ④ · ⑤ `pr-brief` |
| **2 – 3** | **Calendario y shot list** | Operador + agentes · **CEO aprueba** | ③ `mk-calendario` · ④ `cr-arte-video` |
| **3 – 6** | **Brand guidelines** | Operador + agentes | ②B Branding |
| **4 – 5** | **Coordinar producción, fotografía y modelos** | **COO** | ⑤ `pr-jornadas` · `pr-recursos` |
| **6 – 10** | **Producir** | Producción · Fotografía | ⑤ `pr-rodaje` |
| **11** | **ÚLTIMO DÍA PARA PRODUCIR** | Producción | ⑤ `pr-entrega` |
| **12 – 15** | **Montar el contenido** | Editor de video · Operador | ⑦ Video Editing · ⑥A Diseño |
| **16 – 19** | **Cambios, QA y programación** | Operador + agentes · **COO hace el QA final** | ②B `br-guardian` · ⑨ Posting |
| **20** | **PRESENTACIÓN AL CLIENTE** | **COO** en 🔷 · **CEO** en 🟨 | — |

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
costo fijo del plan.

---

## 5 · Quién hace qué

> 🔷 = línea Marketing *(Marketing y Pro)* · 🟨 = línea Growth *(Accelerate y Compound)*

### Cliente

| Tarea | Rol | Dónde |
|---|---|---|
| **Reunión del día 1** | **CEO** | Todos |
| **Comunicación diaria** | **Secretaria** → escala al **COO**. Al CEO solo le llega precio, alcance o estrategia | Todos |
| **Presentar las piezas del día 20** | **COO** en 🔷 · **CEO** en 🟨 | Todos |
| **Sesión de dirección** | **CEO** | 🟨 Accelerate mensual · Compound quincenal |

### Estrategia

| Tarea | Rol | Dónde |
|---|---|---|
| Estrategia inicial y revisión del 20 | Agentes ① → **CEO aprueba** | Todos |
| Ajuste de la estrategia | **CEO** | Todos |
| **Aprobar ideas y calendario** | **CEO** | Todos |
| Replanteo trimestral | **CEO** | 🟨 Compound |

### Oferta y conversión

| Tarea | Rol | Dónde |
|---|---|---|
| Rediseño de oferta, paquetes y precio | ② Growth + **CEO** | 🟨 |
| Abrir canales grandes | ② Growth + **CEO** | 🟨 |
| Upsells y escalera de ticket | ② Growth · Operador | 🟨 |
| Embudos, auto-DM, atribución y pruebas A/B | Agentes · Operador | 🟨 |
| Entrenamiento de closing | **CEO** | 🟨 |

### Producción y contenido

| Tarea | Rol | Dónde |
|---|---|---|
| **Coordinar producción, fotografía y edición** | **COO** | Todos |
| Grabar | **Producción** | Todos |
| Fotografiar | **Fotografía** | Todos |
| Editar los videos y sus derivadas | **Editor de video** | Todos |
| Estáticos, carruseles y stories | **Operador** con ⑥A | Todos |
| Correr Creatividad, Branding, Diseño, Posting y Community | **Operador** | Todos |
| **QA final** | Agentes *(`br-guardian`)* → **COO** | Todos |

### Publicación, comunidad y pauta

| Tarea | Rol | Dónde |
|---|---|---|
| Programar y publicar | **Operador** con ⑨ | Todos |
| **Comentarios y mensajes** | **Operador:** una vez al mes configura el agente con la información del cliente, y el agente queda atendiendo | 🔷 Pro · 🟨 |
| Pauta | **Operador** con ⑩ · **CEO** aprueba plan y presupuesto | Todos |

### Tecnología

| Tarea | Rol | Dónde |
|---|---|---|
| **Herramienta a medida** | **CEO** define el alcance → **Operador** la construye | 🟨 Accelerate 1 al trimestre · Compound 1 al mes |
| **IA propia del cliente** | **CEO** define el alcance → **Operador** la construye | 🟨 Compound |
| Landings, microsites y automatización de procesos | Agentes · Operador | 🟨 |

### Operación y auditoría

| Tarea | Rol | Dónde |
|---|---|---|
| **Auditoría** *(negocio, números y SOPs)* | **Especialista** | 🟨 Accelerate trimestral · Compound mensual |
| Decidir qué se implementa de la auditoría | **CEO + COO** | 🟨 |
| SOPs de crecimiento, mapa de experiencia y LTV, documentación y entrenamiento | **COO** con agentes | 🟨 |
| SOPs de empresa · Money OS | **CEO** | 🟨 Compound |
| Corporate structure | **Especialista** *(auditoría)* | 🟨 Compound |

### Medición

| Tarea | Rol | Dónde |
|---|---|---|
| Reporte mensual | Agentes · Operador | Todos |
| Dashboard en vivo | Agentes · Operador | 🟨 |

---

## 6 · Lo que cuesta cada rol

> **Cada cuenta paga un monto fijo a cada rubro, según su plan.** No es estimación: **es el
> techo.** El detalle económico completo está en `06-ECONOMIA.md`.

| Rubro | 🔷 Marketing | 🔷 Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| **Grabación** | Q450 *(3 h · Q150/h)* | Q560 *(4 h · Q140/h)* | Q780 *(6 h · Q130/h)* | Q960 *(8 h · Q120/h)* |
| **Fotografía** | Q300 *(1 h)* | Q300 *(1 h)* | Q300 *(1 h)* | Q300 *(1 h)* |
| **Edición de video** | Q200 | Q500 | Q700 | Q1,000 |
| **Operador de agentes** | Q350 | Q550 | Q900 | Q1,400 |
| **Herramientas / IA** | Q150 | Q200 | Q300 | Q500 |
| **Especialista** *(auditoría con el mentor)* | — | — | Q1,000 | Q2,000 |
| **Auditoría conta** | — | — | Q600 | Q900 |
| **Auditoría admin** *(SOPs)* | — | — | Q600 | Q900 |
| **Buffer** | Q215 | Q445 | Q520 | Q840 |
| **COSTO** | **Q1,665** | **Q2,555** | **Q5,700** | **Q8,800** |

### Lo que entrega cada rol, por plan

| Rol | 🔷 Marketing | 🔷 Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| **Producción** | 1 sesión · 3 h | 2 sesiones · 4 h | 2 sesiones · 6 h | 3 sesiones · 8 h |
| **Fotografía** | 1 sesión | 1 sesión | 1 sesión | 1 sesión |
| **Editor de video** | 9 planificados + 4 derivados | 12 + 6 | 18 + 9 | 24 + 12 |
| **Operador** *(estáticos y carruseles)* | 43 | 72 | 63 | 88 |
| **Operador** *(stories y recortes)* | 30 | 55 | 55 | 80 |

### Las reglas del costo

| Regla | Qué dice |
|---|---|
| **El costo es fijo por plan y por rubro** | No se estima, no se promedia, no se pasa. **No cambia con el número de clientes** |
| **La tarifa baja con las horas** | A más horas por cuenta, menor tarifa por hora — más volumen para la persona |
| **La producción no se baja recortando horas** | Si el monto no alcanza, **se cambia la mezcla** *(más derivados, contenido crudo del cliente)* **o se cotiza extra** |
| **Una cuenta que consume más** | Se cotiza extra o sube de plan. **Nunca se absorbe** |
| **CEO y COO no son rubro** | Cobran de la utilidad. Sus horas son capacidad |
| **El buffer es el colchón** | Cubre los imprevistos: regrabar, una revisión extra, una pieza que se cae |

### El acuerdo con cada persona

> **Se firma una vez, con los montos por plan escritos. No se renegocia en cada cliente nuevo.**

| Cláusula | Qué dice |
|---|---|
| **Monto por cuenta** | El de su rubro, según el plan de cada cuenta. **Es fijo** |
| **Qué incluye** | Lo que el plan promete de ese rubro — ni más, ni menos |
| **Si una cuenta pide más** | Se cotiza extra al cliente o se sube de plan |
| **Revisión** | Solo si cambia la tabla de costos del plan. **No por volumen** |

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
              🔷 línea Marketing                               🟨 línea Growth
              el COO presenta el día 20                        el CEO presenta el día 20
                         └───────────────────────────────┬───────────────┘
                                                         ▼
                                     se publica desde el día 1 del mes siguiente
```

| Canal | Para qué | Quién |
|---|---|---|
| **Reunión del día 1** | Arrancar el ciclo y decidir | CEO |
| **Presentación del día 20** | Entregar el ciclo completo | COO en 🔷 · CEO en 🟨 |
| **WhatsApp** | Todo lo del día a día | Secretaria → COO |
| **Group chat interno** | Donde el COO deja lo armado para el CEO | COO |

🔒 **La secretaria nunca dice costos, márgenes ni nada de otro cliente, ni compromete precio,
fecha o alcance.** Eso lo decide el CEO.

### El ritmo del mes

| Cuándo | Qué corre | Rol |
|---|---|---|
| **Diario** | Comentarios, mensajes y seguimiento | Agentes · Secretaria |
| **Semanal** | Radar de competencia · revisión de pauta · cola de piezas | Operador |
| **Días 1-20** | El ciclo de contenido | Todos |
| **Día 20** | Presentación y revisión del mes | CEO · COO |
| **Mensual** | Money OS — números del mes | CEO *(Compound)* |
| **Trimestral** | Replanteo de estrategia y revisión de precio | CEO *(Compound)* |

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
