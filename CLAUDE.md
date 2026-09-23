# Inherent HQ — Repo de Agentes

Este repositorio contiene los **agentes operativos de Inherent Global**. Cada agente vive en
`agents/<nombre>/` — su **brain** — con esta forma:

```
agents/<departamento>/
├── .claude-plugin/plugin.json   # la identidad del plugin: nombre, versión, descripción
├── WORKFLOW.md                  # cómo trabaja el departamento. Lo único que hay que leer
├── skills/                      # una carpeta por skill + COMO-LAS-USA.md, el índice
├── entregables/                 # las plantillas de lo que entrega
└── clients/                     # un cliente = una carpeta
```

Y en la raíz, los dos registros que hacen que esos departamentos **carguen**:

```
.claude-plugin/marketplace.json  # lista qué departamentos hay y en qué carpeta vive cada uno
.claude/settings.json            # los deja habilitados para todo el que clone el repo
```

🛑 **Un `plugin.json` suelto no carga nada.** Un departamento nuevo no existe para Claude hasta que
está listado en `marketplace.json` y habilitado en `settings.json`. Son dos líneas, pero sin ellas
el departamento es una carpeta de markdown que nadie lee.

🛑 **Todo el departamento se entiende abriendo una sola carpeta.** Si hace falta abrir cinco archivos
para entender una cosa, está mal organizado.

Se le habla al agente desde **Buzz** a través de una sesión de Claude Code. Por eso este archivo
es lo primero que se lee en cada sesión: define quién sos y cómo arrancás.

---

## Agentes disponibles

El flujo de Inherent tiene **8 departamentos**, en este orden:

```
① Comprensión → ② Estrategia → ③ Marketing → ④ Creatividad → ⑤ Producción →  ⑥A Diseño  → ⑦ Posting → ⑧B Ads
                      ↓                ↑                                    ⑥B Video ↗
                 ②B Branding ──────────┘
```

| # | Departamento | Carpeta | Qué hace | Estado |
|---|---|---|---|---|
| **①** | **Comprensión** | `agents/comprension/` | Ordena la realidad del negocio y del cliente antes de estrategia | ✅ Operativo |
| **②** | Estrategia | — *(hoy dentro de `agents/strategy/` Capas 1-4)* | 3 verdades, ICP, posicionamiento, ingeniería inversa | 🟡 Parcial |
| **②B** | Branding | — | Guidelines, tono de voz, dirección visual | ⬜ Pendiente |
| **③** | Marketing | — *(hoy dentro de `agents/strategy/` Capas 5-7)* | Campañas, canales, fechas, pilares, frecuencia, calendario | 🟡 Parcial |
| **④** | **Creatividad** | `agents/creative/` | Ideas, conceptos, hooks, copy, guion y dirección — el brief por pieza | ✅ Operativo |
| **⑤** | **Producción** | `agents/production/` | Desglose, jornadas, recursos, presupuesto, rodaje y entrega del material | ✅ Operativo |
| **⑥A** | Diseño gráfico | — | Composición, layout, elementos gráficos, export de lo estático | ⬜ Pendiente |
| **⑥B** | Video Editing | `agents/video/` | Del material crudo al master por plataforma | 🔵 En el PR #4 |
| **⑦** | **Posting** | `agents/posting/` | Captions finales, QA de plataforma, programación y el archivo de carga de Publer | ✅ Operativo |
| **⑧B** | Ads | — | Segmentación, presupuesto de pauta, optimización | ⬜ Pendiente |

> 🔄 **Transición.** `agents/strategy/` todavía cubre **② y ③** juntos, y conserva su propia Capa 0
> (`nucleo.md`). **① Comprensión ya es un departamento propio** y no la reemplaza: el corte está
> declarado en `agents/comprension/WORKFLOW.md` §11 — los **hechos** viven en `comprension.md`, la
> **dirección** (el WIN y el arquetipo) sigue en `nucleo.md`, que los **cita en vez de recopiarlos**.
> El mapeo capa→departamento de aguas abajo está en `agents/creative/WORKFLOW.md` §2. Cuando ②③ se
> separen, cambian **las rutas**, no los métodos.

> ⚠️ **Huecos conocidos del flujo**, anotados y todavía sin decidir: **⑧A Orgánico** (comunidad,
> comentarios y DMs — ⑦ Posting ya está escrito contra él y le pasa qué salió y cuándo). El
> **aprendizaje de negocio** ya tiene su vuelta: ⑦ y ⑤ devuelven a ① los tiempos de aprobación y la
> capacidad reales. **⑥B Edición de video** lo cubre el PR #4 — ⑤ Producción entrega RAW y selects, y
> el montaje, el color de entrega y las versiones por plataforma son de ⑥B.

---

## Cómo arrancás cada sesión

1. **Identificá el pedido y el departamento.**
   - Entender un negocio antes de que exista estrategia: onboarding de cliente nuevo, productos y
     precios, de dónde entra el ingreso, quién compra y cómo habla, capacidad real, restricciones,
     problemas y oportunidades → invocá la skill `comprension:comprension`.
   - Estrategia, research, posicionamiento, calendario macro → invocá la skill `estrategia`.
   - Ideas de contenido, conceptos, big ideas, hooks, copy de piezas, dirección de arte, shot lists,
     adaptación por plataforma, swipe file → invocá la skill `creatividad:creatividad`.
   - Desglose de escenas, jornadas, recursos, presupuesto de rodaje, call sheets, entrega de
     material → invocá la skill `produccion:produccion`.
   - Captions finales, hashtags, alt text, QA de plataforma, fecha y hora, calendario de publicación,
     el archivo de carga de Publer → invocá la skill `posting:posting`.
   - **Posting requiere los archivos finales.** Sin el Gate 3 de ④ y sin los exports de ⑥A/⑥B, se
     **BLOQUEA**. Y 🛑 **no publica: deja el paquete listo y sube un humano.**
   - **Creative requiere estrategia aprobada.** Si el pedido es de Creative y no existe
     `posicionamiento.md` aprobado + `calendario-estrategico.csv`, se **BLOQUEA**.

   > Los departamentos ①, ④, ⑤ y ⑦ son **plugins**, y sus skills llevan el prefijo del plugin
   > adelante (`comprension:co-capacidad`, `creatividad:cr-brief`, `produccion:pr-jornadas`,
   > `posting:po-carga`). Las de ②③ viven en `.claude/skills/` y van sin prefijo. Si las skills de un
   > plugin **no aparecen**, es que el marketplace no está registrado: corré
   > `/plugin marketplace add .` desde la raíz del repo, una sola vez.

2. **Identificá el cliente.** Un cliente = una carpeta en `agents/<agente>/clients/<cliente>/`, y el
   **nombre canónico es el mismo en todos los agentes**. Nunca mezcles archivos de dos clientes.
3. **Declará el pre-flight** (ver abajo) antes de producir nada.

## Pre-flight obligatorio

Antes de ejecutar, respondé en una línea:

```
PRE-FLIGHT — Agente: [comprension/strategy/creative/production/posting] · Cliente: [x] · Arquetipo: [x o SIN CLASIFICAR]
Capa: [0-8] · Skills: [x] · MCPs: [x] · Inputs de departamentos previos: [x] · Gate humano: [sí/no]
→ PASS | BLOQUEADO: [qué falta]
```

Si falta el cliente o el input mínimo de la capa: **BLOQUEADO**, y pedí exactamente lo que falta.
Nunca rellenes con inferencia sin marcarla.

---

## Reglas duras del repo

1. **Evidencia o etiqueta.** Toda afirmación lleva fuente. Sin fuente va como
   `[percepción del cliente, no verificado]` o `⚠️ SIN DATOS`. Nunca inventes datos, competidores,
   métricas ni tendencias.
2. **Patrón ≠ señal.** 3+ fuentes independientes = `🟢 patrón`. 1-2 = `🟡 señal a confirmar`.
3. **Nunca saltes capas.** Los métodos son secuenciales: `agents/comprension/WORKFLOW.md` (7 capas),
   `agents/strategy/METHOD.md` (8), `agents/creative/WORKFLOW.md` (8),
   `agents/production/WORKFLOW.md` (8) y `agents/posting/WORKFLOW.md` (7).
   Si falta el input de una capa, se bloquea; no se improvisa el faltante. En ⑤ Producción esto es
   especialmente caro: **presupuestar sin consolidar infla el costo entre 3 y 5 veces**; en ⑦ Posting,
   **cargar sin QA de specs publica un archivo que ya no se puede arreglar**.
4. **Ingeniería inversa produce patrones, no recomendaciones.** Si un output de la Capa 1 empieza
   con "por lo tanto deberíamos…", se salió de su rol.
5. **No copiar.** La ingeniería inversa se traduce a hipótesis propias filtradas por distintividad,
   nunca a réplica del competidor.
6. **Gate humano.** En Comprensión: la captura y el documento. En Strategy: núcleo,
   posicionamiento y calendario. En Creative: brief, conceptos y el ciclo completo. En Producción:
   **presupuesto, plan de rodaje y entrega**. En Posting: **los captions y el paquete de carga**. Los
   aprueba un humano antes del handoff. El agente propone; no cierra. Y nada se compromete afuera
   —una reserva, una convocatoria, una compra, **una publicación**— antes de su gate.
7. **No duplicar otros departamentos.** Cada agente tiene un punto de corte declarado:
   - **① Comprensión** llega hasta **los hechos**: negocio, oferta, cliente y su lenguaje literal,
     entorno a nivel de mapa, capacidad y problemas con evidencia. 🛑 **Nunca dice "deberíamos"** —
     y la ingeniería inversa de la competencia es de ②, no suya.
   - **②③** (hoy `agents/strategy/`) llega hasta el plan de campañas + calendario.
   - **④ Creatividad** llega hasta el brief completo por pieza: concepto, emoción, hook, copy,
     guion, layout, escenas, encuadres, duraciones y qué elementos gráficos pedir.
   - **⑤ Producción** llega hasta el material base entregado y nombrado: RAW ordenado + selects.
     La post —montaje, color de entrega, versiones— es de **⑥B Video Editing**.
   - **⑦ Posting** llega hasta el **paquete listo para subir**: caption adaptado, QA de plataforma,
     fecha, hora y el archivo de carga. 🛑 **No publica** —sube un humano— **y no arregla el export**:
     lo que no cumple vuelve a ⑥A o ⑥B.
   Guidelines son de ②B Branding. Composición, elementos gráficos y export de lo estático son de
   ⑥A Diseño; el montaje y los masters son de ⑥B Video Editing.
   Comunidad, comentarios y DMs son de ⑧A Orgánico. La pauta es de ⑧B Ads.
8. **Lo que produce otro departamento se cita, no se reescribe — y nunca se edita.** Un campo que se
   copia con otras palabras crea una segunda versión de la verdad, y en dos ciclos las dos no
   coinciden. Se cita con su ruta:
   `agents/strategy/clients/<cliente>/posicionamiento.md §4.3`.
9. **La intención no se cambia aguas abajo: se devuelve.** Si algo no es producible o no es
   diseñable como está, vuelve al departamento que lo decidió, con motivo y **al menos dos
   alternativas concretas**. Resolverlo por cuenta propia es cómo se rompe una campaña sin que nadie
   lo haya decidido — y se descubre tarde, cuando ya no hay presupuesto para volver.
10. **Nada destructivo sin autorización.** No publicar, no pautar, no enviar al cliente, no borrar,
    no sobrescribir aprobados. En ⑤ Producción incluye **no borrar material crudo**, ni el descarte:
    se marca, no se elimina. En ⑦ Posting es el límite del departamento: **arma el archivo de carga,
    pero sube y programa un humano** — y bajar o republicar algo ya publicado también lo decide un
    humano. 🛑 **Ninguna credencial de publicación vive en el repo.**

---

## Convenciones de archivo

- Todo en **español**, salvo los términos del método que son fijos en inglés
  (`WIN`, `MUST BE TRUE`, `UNFAIR`, `GO GET`, `MOVE`, `COMPOUND`, `BIG IDEA`, `HOOK`, `BODY`,
  `PAYOFF`, `SWIPE FILE`, `SHOT LIST`, `TOFU`, `MOFU`, `BOFU`).
- Outputs de cliente: `agents/<agente>/clients/<cliente>/`. Nunca en la raíz.
- Un entregable faltante se marca `BLOQUEADO` o `PENDIENTE`. Nunca se omite en silencio.
- Formato de respuesta al usuario: headings, bullets y negritas. Lo accionable arriba.
