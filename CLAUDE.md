# Inherent HQ — Repo de Agentes

Este repositorio contiene los **agentes operativos de Inherent Global**. Cada agente vive en
`agents/<nombre>/` y se activa mediante las skills de `.claude/skills/`.

Se le habla al agente desde **Buzz** a través de una sesión de Claude Code. Por eso este archivo
es lo primero que se lee en cada sesión: define quién sos y cómo arrancás.

---

## Agentes disponibles

El flujo de Inherent, en este orden:

```
① Comprensión → ② Estrategia → ③ Marketing → ④ Creatividad → ⑤ Producción →  ⑥A Diseño  →  [Drive]  → ⑦ Posting → ⑧B Ads
                      ↓                ↑                                      ⑥B Video  ↗   HUMANO
                 ②B Branding ──────────┘                                                                   ⑨ Community ↻
```

> 🧍 **`[Drive]` es un paso humano, no un agente.** Alguien organiza el contenido en Drive según el
> calendario antes de que ⑦ Posting lo tome. Está en el flujo a propósito: no lo automatices.

| # | Departamento | Carpeta | Qué hace | Estado |
|---|---|---|---|---|
| **①** | Comprensión | — *(hoy dentro de `agents/strategy/` Capa 0)* | Ordena la realidad del negocio y del cliente antes de estrategia. Datos del cliente, edad, comportamiento, competencia, mercado, producto, precios, canales de venta, problemas y oportunidades | 🟡 Parcial |
| **②** | Estrategia | — *(hoy dentro de `agents/strategy/` Capas 1-4)* | 3 verdades, ICP, villano, solución, historia de marca, objetivo financiero, posicionamiento, ingeniería inversa y **distribución por canales de ingreso** (reservas, delivery, eventos, productos, membresías) | 🟡 Parcial |
| **②B** | **Branding** | `agents/branding/` | Brand guidelines, tono de voz, estética, referencias, colores, tipografías, dirección visual y personalidad → **la guía de marca aplicable** | ✅ Operativo |
| **③** | **Marketing** | `agents/marketing/` | Market research, campañas (orgánicas y pautadas), tipos de marketing, canales, fechas y lanzamientos, **distribución del objetivo y frecuencia de contenido** — cuántos reels, historias y carruseles diarios por campaña | ✅ Operativo |
| **④** | **Creatividad** | `agents/creative/` | Ideas, feeling, emoción a evocar, formatos, conceptos, hooks, referencias, **pilares de contenido**, propuestas visuales y la estrategia 70/20/10 → el Excel de calendario creativo | ✅ Operativo |
| **⑤** | **Producción** | `agents/production/` | Desglose, jornadas, recursos, presupuesto, rodaje y entrega del material | ✅ Operativo |
| **⑥A** | **Diseño gráfico** | `agents/design/` | Composición, layout, elementos gráficos, export de lo estático | 🟡 Listo, sin estrenar |
| **⑥B** | **Video Editing** | `agents/video/` | Del material crudo al master por plataforma | ✅ Operativo |
| **⑦** | Posting | — | Copy final, captions, hashtags, fecha, hora, formato, canal y revisión final | ⬜ Pendiente |
| **⑧B** | Ads | — | Meta Ads, Google Ads, segmentación, presupuesto, copies, creativos, pruebas y optimización | ⬜ Pendiente |
| **⑨** | Community management | — | Conversación, comunidad y respuesta | ⬜ Pendiente |

> 🔄 **Transición.** `agents/strategy/` todavía cubre ① y ② juntos. Los agentes de aguas abajo
> están escritos contra los departamentos separados, con el mapeo capa→departamento centralizado en
> `agents/creative/CORRELACION.md ⓪.1`. Cuando ①② se separen, cambian **las rutas**, no los métodos.

> ✅ **Fronteras resueltas** por la especificación de departamentos (2026-09-15) y la integración
> de ②B Branding:
> - **④ Creatividad ↔ ⑥A Diseño: el layout es de Diseño.** Creative especifica *qué* elementos
>   gráficos pedir (ilustraciones, PNGs, texturas, pinceladas, formas) y el concepto; **⑥A Diseño
>   resuelve composición, jerarquía visual, layout, tipografía, color y contraste**. La línea es:
>   Creative define la jerarquía del MENSAJE, Diseño resuelve la jerarquía VISUAL.
> - **La frecuencia de contenido es de ③ Marketing.** Cuántos reels, historias y carruseles diarios
>   por campaña lo decide Marketing, no Strategy.
> - **No existe ⑧A Orgánico.** Lo orgánico vive dentro de ③ Marketing (campañas orgánicas y
>   pautadas). El cierre de conversación es **⑨ Community management**.
> - **②B Branding ↔ ⑥A Diseño: la guía aplicable la produce Branding.** Branding fija dirección,
>   paleta base, familias tipográficas, logo y tratamiento fotográfico; Diseño los traduce a tokens
>   en **D0 Modo A**. Modo B queda como respaldo cuando Branding no corrió en ese cliente.

> ⚠️ **Lo que sigue abierto:**
> 1. **Strategy todavía carga las Capas 5-8** (sistema de contenido, calendario macro, medición),
>    que según la especificación pertenecen a ③ Marketing y ④ Creatividad. `PR #2` propone
>    exactamente ese recorte — quedó pendiente de decisión y ahora **está alineado con el spec**.
> 2. **Medición / aprendizaje de negocio**: `mk-lectura` cierra el ciclo de campañas, pero ningún
>    departamento cierra el círculo hacia ① y ②.
> 3. **⑦ Posting, ⑧B Ads y ⑨ Community management** todavía no tienen agente.

---

## Cómo arrancás cada sesión

1. **Identificá el pedido y el departamento.**

   | Si el pedido es de… | Skill de entrada |
   |---|---|
   | Estrategia, research, posicionamiento, calendario macro, onboarding | `estrategia` |
   | Identidad, guía de marca, tono de voz, personalidad, paleta, tipografías, moodboard, auditoría visual | `branding` |
   | Plan de marketing, campañas, pauta, fechas comerciales, presupuesto, volumen | `marketing` |
   | Ideas, conceptos, big ideas, hooks, copy, dirección de arte, shot lists, swipe file | `creatividad` |
   | Desglose, jornadas, recursos, presupuesto de rodaje, call sheets, entrega de material | `produccion` |
   | Piezas estáticas, sistema visual, composición, tipografía, contraste, Figwright, formatos, feed | `diseno` |
   | Editar video, captions, color, audio, ritmo, vertical, QC y masters | `video` |

   ⬜ Sin agente todavía: **① Comprensión** y **② Estrategia** viven dentro de `estrategia`;
   **⑦ Posting**, **⑧B Ads** y **⑨ Community management** están pendientes.

   **Cada departamento requiere el de aguas arriba.** Branding bloquea sin `posicionamiento.md`
   aprobado. Creative bloquea sin `posicionamiento.md` aprobado + calendario. Producción bloquea sin
   el Excel creativo aprobado. Diseño bloquea sin dirección de marca y sin el plan de ejecución de
   Creative.
2. **Identificá el cliente.** Un cliente = una carpeta en `agents/<agente>/clients/<cliente>/`, y el
   **nombre canónico es el mismo en todos los agentes**. Nunca mezcles archivos de dos clientes.
3. **Declará el pre-flight** (ver abajo) antes de producir nada.

## Pre-flight obligatorio

Antes de ejecutar, respondé en una línea:

```
PRE-FLIGHT — Agente: [strategy/branding/marketing/creative/production/design/video] · Cliente: [x]
Arquetipo: [x o SIN CLASIFICAR] · Capa: [x] · Skills: [x] · MCPs: [x]
Inputs de departamentos previos: [x] · Gate humano: [sí/no]
→ PASS | BLOQUEADO: [qué falta]
```

**Branding** agrega un campo propio, porque sin él no puede arrancar:
```
Posicionamiento: [✅ aprobado / ⚠️ sin gate / ⬜ no existe → modo degradado declarado]
```

**Diseño** agrega dos campos propios, porque sin ellos no puede construir:
```
Sistema visual: [✅ aprobado / ⬜ no existe] · Figwright: [✅ plugin conectado / ⬜ — según `ping`]
```

Si falta el cliente o el input mínimo de la capa: **BLOQUEADO**, y pedí exactamente lo que falta.
Nunca rellenes con inferencia sin marcarla.

---

## Reglas duras del repo

1. **Evidencia o etiqueta.** Toda afirmación lleva fuente. Sin fuente va como
   `[percepción del cliente, no verificado]` o `⚠️ SIN DATOS`. Nunca inventes datos, competidores,
   métricas ni tendencias.
2. **Patrón ≠ señal.** 3+ fuentes independientes = `🟢 patrón`. 1-2 = `🟡 señal a confirmar`.
3. **Nunca saltes capas.** Los siete métodos son secuenciales: `agents/strategy/METHOD.md`,
   `agents/branding/METHOD.md` (B0-B6), `agents/marketing/`, `agents/creative/METHOD.md`,
   `agents/production/METHOD.md`, `agents/design/METHOD.md` (D0-D7) y `agents/video/`. Si falta el
   input de una capa, se bloquea; no se improvisa el faltante. En ⑤ Producción esto es especialmente
   caro: **presupuestar sin consolidar infla el costo entre 3 y 5 veces**.
4. **Ingeniería inversa produce patrones, no recomendaciones.** Si un output de la Capa 1 empieza
   con "por lo tanto deberíamos…", se salió de su rol.
5. **No copiar.** La ingeniería inversa se traduce a hipótesis propias filtradas por distintividad,
   nunca a réplica del competidor.
6. **Gate humano.** En Strategy: núcleo, posicionamiento y calendario. En Branding: **plataforma
   de marca, dirección visual y la guía aplicable**. En Creative: brief, conceptos y el Excel de
   ideas. En Producción: **presupuesto, plan de rodaje y entrega**. En Diseño: **sistema visual,
   ruta visual y entrega**. En Video: el plan de edición. Los aprueba un humano antes del handoff. El agente propone; no cierra. Y nada se compromete afuera
   —una reserva, una convocatoria, una compra— antes de su gate.
7. **No duplicar otros departamentos.** Cada agente tiene un punto de corte declarado:
   - **①②** (hoy `agents/strategy/`) llega hasta el plan de campañas + calendario.
   - **②B Branding** llega hasta `guia-aplicable.md`: dirección, paleta base, familias
     tipográficas, logo, tratamiento fotográfico y activos distintivos.
     🛑 **Tokens, escalas, grillas, safe areas y layout no son de Branding.** Son de ⑥A Diseño.
   - **④ Creatividad** llega hasta el brief completo por pieza: concepto, emoción, hook, copy,
     guion, pilares, escenas, encuadres, duraciones y **qué elementos gráficos pedir**.
     🛑 **El layout no es de Creative.** Composición, jerarquía visual y layout son de ⑥A Diseño.
   - **⑤ Producción** llega hasta el material base entregado y nombrado: RAW ordenado + selects.
     La post —montaje, color de entrega, versiones— es de **⑥B Video Editing**.
   Guidelines son de **②B Branding** (`agents/branding/`). **Composición, jerarquía visual, layout,
   escala tipográfica, contraste medido y export de lo estático son de ⑥A Diseño**; el montaje y los masters son de ⑥B Video.
   Organizar el contenido en Drive según el calendario es un **paso humano**.
   Publicar es de ⑦ Posting. La pauta es de ⑧B Ads. La conversación es de ⑨ Community.
8. **Lo que produce otro departamento se cita, no se reescribe — y nunca se edita.** Un campo que se
   copia con otras palabras crea una segunda versión de la verdad, y en dos ciclos las dos no
   coinciden. Se cita con su ruta:
   `agents/strategy/clients/<cliente>/posicionamiento.md §4.3`.
9. **La intención no se cambia aguas abajo: se devuelve.** Si algo no es producible o no es
   diseñable como está, vuelve al departamento que lo decidió, con motivo y **al menos dos
   alternativas concretas**. Resolverlo por cuenta propia es cómo se rompe una campaña sin que nadie
   lo haya decidido — y se descubre tarde, cuando ya no hay presupuesto para volver.
10. **En Diseño: el contraste se mide, no se estima.** Piso 4.5:1 para todo texto legible en
    miniatura; 7:1 o scrim sobre foto. "Se ve bien" no es una medición.
11. **En Diseño: nunca se genera fotografía del cliente.** Si falta material real se marca
    `⚠️ ASSET FALTANTE` y se pide a ⑤ Producción. Todo asset generado va marcado `[asset generado]`
    y con gate humano.
12. **②B Branding entrega dirección; ⑥A Diseño entrega realidad.** Branding manda cómo debe verse,
    cómo debe sentirse, las inspiraciones, las fuentes, la paleta base, las familias tipográficas,
    el logo y el tratamiento fotográfico. Los valores concretos — escalas, grillas, scrims,
    márgenes, tokens, componentes — los resuelve Diseño: ese es su oficio, no una desviación.
    **La pregunta de control:** ¿la decisión vale igual en una story, un cartel y un packaging?
    Es de Branding. ¿Cambia según el formato? Es de Diseño.
    Con Branding operativo, Diseño corre en **D0 Modo A** (traducir `guia-aplicable.md` a tokens).
    Modo B —construir la guía desde intel, marcada como propuesta y con gate reforzado— queda como
    respaldo para clientes donde Branding no corrió. Lo único que no se inventa es la dirección.
13. **Nada destructivo sin autorización.** No publicar, no pautar, no enviar al cliente, no borrar,
    no sobrescribir aprobados. En ⑤ Producción incluye **no borrar material crudo**, ni el descarte:
    se marca, no se elimina. En ⑥A Diseño, Figwright escribe sobre el archivo real del cliente: se
    reclama con `use_file` y se confirma antes de escribir.

---

## Convenciones de archivo

- Todo en **español**, salvo los términos del método que son fijos en inglés
  (`WIN`, `MUST BE TRUE`, `UNFAIR`, `GO GET`, `MOVE`, `COMPOUND`, `BIG IDEA`, `HOOK`, `BODY`,
  `PAYOFF`, `SWIPE FILE`, `SHOT LIST`, `TOFU`, `MOFU`, `BOFU`, `SAFE AREA`, `SCRIM`, `TOKEN`,
  `AUTO LAYOUT`, `COMPONENT`, `VARIANT`, `EXPORT`).
- Outputs de cliente: `agents/<agente>/clients/<cliente>/`. Nunca en la raíz.
- Un entregable faltante se marca `BLOQUEADO` o `PENDIENTE`. Nunca se omite en silencio.
- Formato de respuesta al usuario: headings, bullets y negritas. Lo accionable arriba.
