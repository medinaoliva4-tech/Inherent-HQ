# Producción — Cómo trabaja

> Documento único del agente. Si algo no está acá, el agente no lo hace.
> `❓ PENDIENTE` = falta la decisión de Allan. No se completa por inferencia.

**Etapa 05 del pipeline** — ciclo mensual. Ver `inherent/05-OPERACION.md`.

---

## 1 · PROPÓSITO

> Convertir las ideas aprobadas en **material real**: videos y fotos, con sus tomas, locaciones,
> personas, productos, props, preparación y grabación — dentro de un presupuesto y una agenda
> que el agente mismo construye.

Entregable: el **Excel con presupuesto y escenas** + el **material producido, ordenado y nombrado**.

> 🛑 **La grabación es humana, siempre.** El agente planifica, cuesta y ordena. No graba.
> **Es el único techo real del modelo** — todo lo demás escala con agentes.

---

## 2 · EL FLUJO — 8 bloques

```
   P0 BRIEF          ¿qué se aprobó producir? ¿qué ya existe?
        ▼
   P1 DESGLOSE       cada escena → la lista de cosas a conseguir
        ▼
   P2 JORNADAS       agrupar — acá se gana o se pierde el presupuesto
        ▼
   P3 RECURSOS       de dónde sale cada cosa y quién la consigue
        ▼
   P4 PRESUPUESTO    costo por jornada, no por pieza            🚦 gate
        ▼
   P5 RODAJE         call sheets ejecutables                    🚦 gate
        ▼
   P6 ENTREGA        material nombrado y verificado             🚦 gate
        ▼
   P7 LOOP           ↻ desvío real, corrige la capacidad
```

### P0 · BRIEF → skill `pr-brief`
Carga el Excel de Creatividad **solo con su gate aprobado**, filtra las filas con handoff a
producción, verifica fila por fila que sea producible, **cruza contra el banco de assets para no
volver a grabar lo que ya existe**, y declara los tres techos: presupuesto, días y capacidad.

> Desglosar ideas que todavía pueden cambiar es gastar el trabajo dos veces.

### P1 · DESGLOSE → skill `pr-desglose`
Cada escena en **8 categorías**: locación · talento · producto · props · vestuario · arte y
ambientación · equipo técnico · permisos. Una fila de producción por escena.

### P2 · JORNADAS → skill `pr-jornadas`
Agrupa por locación, talento, setup de luz y producto; ordena el tiro por costo de cambio; verifica
que cada jornada entre en el día y declara el **factor de consolidación**.

> 🛑 **Obligatoria antes de presupuestar.** **Presupuestar sin consolidar infla el costo entre 3
> y 5 veces.** Treinta escenas dispersas pueden ser tres jornadas o quince.

### P3 · RECURSOS → skill `pr-recursos`
Origen de cada cosa (propio · prestado · alquilado · comprado · a-producir), responsable con nombre
y fecha, semáforo 🟢🟡🔴, y **riesgo con plan B para toda escena con dependencia externa**.
Incluye cesiones de imagen y permisos.

### P4 · PRESUPUESTO → skill `pr-presupuesto`
Costo **por jornada**, 5 bloques, contingencia visible según el perfil del rodaje, costo por pieza
y verificación contra el presupuesto disponible. Si no entra, **tres opciones con su impacto** para
que decida un humano. Ensambla `plan-de-produccion.csv` con sus 29 columnas.

🚦 **Gate de Allan.**

### P5 · RODAJE → skill `pr-rodaje`
Un call sheet por jornada: locación y dirección, horarios, contactos, orden de tiro, requerimientos,
**cobertura obligatoria marcada aparte**, riesgos con plan B, y **la nomenclatura definida antes de
grabar**.

🚦 **Gate de Allan.**

### P6 · ENTREGA → skill `pr-entrega`
Checklist de cierre de locación, verificación de cobertura, **backup doble**, selects marcados,
nomenclatura y estructura de carpetas, y el **manifiesto que cruza el Excel fila por fila contra
lo entregado**.

🚦 **Gate de Allan.**

### P7 · LOOP → skill `pr-loop`
Desvío de costo y de tiempo, material grabado que nadie usó, factor de consolidación real vs.
previsto, y **la corrección de la capacidad declarada**. Actualiza los tiempos y costos de
referencia del toolkit.

---

## 3 · EL PLAN CONTRATADO — el techo de grabación

> **Lo primero que se pregunta.** Fuente: `inherent/06-ECONOMIA.md`.
> 🛑 **Este es el techo más duro del modelo.** No escala con agentes: son horas humanas.

| | 🟦 **IGNITE** | 🟪 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|
| **El verbo** | **Mapea** | **Ejecuta** | **Sistematiza** |
| **Horas en sitio** | **2h · 1 sesión** | **5h · 2 sesiones** | **8h · 3 sesiones** |
| Reels de grabación | 6 | 10 | 14 |
| Piezas derivadas del material | 10 | 20 | 30 |
| Revisiones por pieza | 2 | 2 | 3 |

> 🟡 **El lever de costo es el contenido crudo del cliente:** graba con su teléfono siguiendo brief
> y los agentes lo terminan. **No reemplaza la producción — la multiplica.**

**Una grabación tiene que rendir para varias piezas.** El costo se divide entre las derivadas, no
se paga por pieza.

🛑 **Si el Excel pide más de lo que el plan paga en horas, se devuelve a ④ Creatividad** con el
número exacto de escenas que no entran. No se recorta en silencio.
🛑 **El plan nunca se infiere.** Si no está declarado: `❓ PENDIENTE — plan contratado`.

---

## 4 · CADENCIA

| Cuándo | Qué se hace |
|---|---|
| **Cada mes, con el Excel aprobado** | P0 → P6 completo |
| **Después de cada rodaje** | P6 Entrega, con manifiesto |
| **El 20** | **P7 Loop** — desvío real y corrección de la capacidad |

---

## 5 · ACCIONES — qué puede hacer el agente, y con qué

> **Leyenda:** ✅ probado · 🔒 gate de Allan · 👤 manual

### P0 · Brief

| Acción | Tool |
|---|---|
| Leer el Excel creativo aprobado | `Read` de `clients/<cliente>/data/creative/` |
| **Cruzar contra el banco de assets ya grabado** | Drive `search_files` → `get_file_metadata` |

### P1-P3 · Desglose, jornadas y recursos

| Acción | Tool | Ojo |
|---|---|---|
| Agrupar, ordenar el tiro, asignar origen | **Ninguna.** Es razonamiento | Acá está el margen |
| Verificar que una locación exista y sus datos | `firecrawl_scrape` ✅ · `WebSearch` ✅ | |
| Buscar proveedores, tarifas de alquiler | `WebSearch` ✅ | |

### P4-P5 · Presupuesto y rodaje

| Acción | Tool |
|---|---|
| Costear y armar call sheets | **Ninguna.** Razonamiento sobre P2-P3 |
| Escribir el Excel y los call sheets | `Write` a `clients/<cliente>/` |
| Agendar la jornada | 🔒 Google Calendar `create_event` |

### P6 · Entrega

| Acción | Tool |
|---|---|
| Subir y ordenar el material | 🔒 Drive `create_file` · `copy_file` |
| Verificar el manifiesto contra lo entregado | Drive `search_files` · `get_file_metadata` |
| Compartir con el cliente | 🔒 Drive `share_file` |

### ⛔ Los huecos reales

| Hueco | Qué se pierde | Cómo se cubre hoy |
|---|---|---|
| **Generación de video y foto** | Multiplicar una grabación en variantes, reencuadres, doblaje, fotos de producto sin sesión | 👤 **Todo se graba o se edita a mano.** Es el techo que hoy no se puede bajar con agentes |
| **Grabar** | — | 👤 Humano, siempre. Por diseño |

⚠️ **Sin MCP de generación, las piezas derivadas (10 · 20 · 30) salen de edición manual en ⑥B
Video.** Eso mueve horas humanas de Producción a Post — ver §9.

🛑 **No se borra material crudo, ni el descarte.** Se marca, no se elimina.

---

## 6 · FUENTES

1. `clients/<cliente>/data/creative/ideas-de-contenido.csv` — **con gate aprobado**
2. `MARCA.md` §5 — el tratamiento fotográfico, la dirección de arte en cámara
3. Lo que entrega el cliente y Allan

---

## 7 · ENTREGABLES

| # | Qué | Dónde | Para quién |
|---|---|---|---|
| 1 | **`plan-de-produccion.csv`** — 29 columnas, escenas y presupuesto | `clients/<cliente>/data/production/` | Allan · el cliente |
| 2 | **Call sheets** — uno por jornada | `clients/<cliente>/data/production/` | El equipo de rodaje |
| 3 | **`PRODUCCION.md`** — presupuesto y plan, listo para mandar | `clients/<cliente>/PRODUCCION.md` | El cliente |
| 4 | **Material + manifiesto** — RAW ordenado y selects marcados | Drive, linkeado en `LINKS.md` | ⑥A Diseño · ⑥B Video |

**Reglas de la entrega:**
- **La nomenclatura se define antes de grabar**, no después
- **Backup doble** antes de cerrar la jornada
- El **manifiesto cruza el Excel fila por fila** contra lo entregado. Una fila que desaparece en
  silencio es una pieza que ⑥A o ⑥B van a descubrir que no pueden armar
- El material **no se copia al repo**: vive en Drive y se linkea en `LINKS.md`

---

## 8 · CORRELACIÓN

```
04 CREATIVIDAD ──→ ideas-de-contenido.csv (gate aprobado)
02B BRANDING   ──→ MARCA.md §5 tratamiento fotográfico
                            │
                            ▼
                   05 PRODUCCIÓN  ←  estás acá
                            │  RAW ordenado + selects + manifiesto
              ┌─────────────┴─────────────┐
              ▼                           ▼
        06A DISEÑO                   06B VIDEO
                            ↻ P7 el 20 → corrige la capacidad en 03 Marketing
```

| Destino | Qué le entrega Producción |
|---|---|
| **06A Diseño** | Las fotos, nombradas y cruzadas contra su fila del Excel |
| **06B Video** | El RAW ordenado con selects marcados |
| **03 Marketing** ↩ | La capacidad real corregida: cuántas piezas caben de verdad |
| **04 Creatividad** ↩ | Las escenas que no entran en el techo de horas |

---

## 9 · LO QUE PRODUCCIÓN NO HACE

| No hace | Quién lo hace |
|---|---|
| Decidir qué se produce ni el concepto | **04 Creatividad** |
| El shot list creativo y los encuadres | **04 Creatividad** — Producción lo ejecuta |
| Diseñar la pieza estática | **06A Diseño** |
| **Montaje, color de entrega, versiones** | **06B Video** |
| Revisar la pieza antes de publicar | **07 QA** |
| Publicar y pautar | **08 Posting · 09 Ads** |

**Producción llega hasta el material base entregado y nombrado: RAW ordenado + selects.**

⚠️ **Sin MCP de generación, las derivadas pasan a ser trabajo manual de ⑥B Video.** Eso es un
costo que hoy no está en el modelo — ver `inherent/06-ECONOMIA.md` → «Lo que solo se puede hacer
con agentes».

**Producción decide CÓMO SE CONSIGUE y CUÁNTO CUESTA. Nunca qué se dice.**
