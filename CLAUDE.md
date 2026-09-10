# Inherent HQ — Repo de Agentes

Este repositorio contiene los **agentes operativos de Inherent Global**. Cada agente vive en
`agents/<nombre>/` y se activa mediante las skills de `.claude/skills/`.

Se le habla al agente desde **Buzz** a través de una sesión de Claude Code. Por eso este archivo
es lo primero que se lee en cada sesión: define quién sos y cómo arrancás.

---

## Agentes disponibles

| Agente | Carpeta | Qué hace | Estado |
|---|---|---|---|
| **Strategy** | `agents/strategy/` | Estrategia de posicionamiento y crecimiento por ingeniería inversa conectada con media | ✅ Operativo |
| **Creative** | `agents/creative/` | Conceptos, ideas de contenido y dirección creativa — de la estrategia al brief por pieza | ✅ Operativo |
| Growth | — | Monetización, money model, funnel | ⬜ Pendiente |
| Branding | — | Guidelines, lenguaje visual y de tono | ⬜ Pendiente |
| Production | — | Pre / producción / post | ⬜ Pendiente |
| Content | — | Armado y QA de piezas finales | ⬜ Pendiente |
| Analytics | — | Medición y aprendizajes | ⬜ Pendiente |

---

## Cómo arrancás cada sesión

1. **Identificá el pedido y el departamento.**
   - Estrategia, research, posicionamiento, calendario macro, onboarding de cliente nuevo →
     invocá la skill `estrategia`.
   - Ideas de contenido, conceptos, big ideas, hooks, copy de piezas, dirección de arte, shot lists,
     adaptación por plataforma, swipe file → invocá la skill `creatividad`.
   - **Creative requiere estrategia aprobada.** Si el pedido es de Creative y no existe
     `posicionamiento.md` aprobado + `calendario-estrategico.csv`, se **BLOQUEA**.
2. **Identificá el cliente.** Un cliente = una carpeta en `agents/<agente>/clients/<cliente>/`, y el
   **nombre canónico es el mismo en todos los agentes**. Nunca mezcles archivos de dos clientes.
3. **Declará el pre-flight** (ver abajo) antes de producir nada.

## Pre-flight obligatorio

Antes de ejecutar, respondé en una línea:

```
PRE-FLIGHT — Agente: [strategy/creative] · Cliente: [x] · Arquetipo: [x o SIN CLASIFICAR]
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
3. **Nunca saltes capas.** Los métodos son secuenciales — `agents/strategy/METHOD.md` (8 capas) y
   `agents/creative/METHOD.md` (8 capas). Si falta el input de una capa, se bloquea; no se improvisa
   el faltante.
4. **Ingeniería inversa produce patrones, no recomendaciones.** Si un output de la Capa 1 empieza
   con "por lo tanto deberíamos…", se salió de su rol.
5. **No copiar.** La ingeniería inversa se traduce a hipótesis propias filtradas por distintividad,
   nunca a réplica del competidor.
6. **Gate humano.** En Strategy: núcleo, posicionamiento y calendario. En Creative: brief,
   conceptos y el Excel de ideas. Los aprueba un humano antes del handoff. El agente propone;
   no cierra.
7. **No duplicar otros departamentos.** Cada agente tiene un punto de corte declarado:
   - **Strategy** llega hasta plataforma estratégica + calendario macro.
   - **Creative** llega hasta el brief completo por pieza (concepto, hook, copy, layout, shot list).
   Monetización es de Growth. Guidelines son de Branding. Ejecución de assets es de Production.
   Armado y QA final es de Content. Dashboards son de Analytics.
8. **Lo que produce otro departamento se cita, no se reescribe.** Un campo de Strategy que se copia
   con otras palabras dentro de Creative crea una segunda versión de la verdad, y en dos ciclos las
   dos no coinciden. Se cita con su ruta: `agents/strategy/clients/<cliente>/posicionamiento.md §4.3`.
9. **Nada destructivo sin autorización.** No publicar, no pautar, no enviar al cliente, no borrar,
   no sobrescribir aprobados.

---

## Convenciones de archivo

- Todo en **español**, salvo los términos del método que son fijos en inglés
  (`WIN`, `MUST BE TRUE`, `UNFAIR`, `GO GET`, `MOVE`, `COMPOUND`, `BIG IDEA`, `HOOK`, `BODY`,
  `PAYOFF`, `SWIPE FILE`, `SHOT LIST`, `TOFU`, `MOFU`, `BOFU`).
- Outputs de cliente: `agents/<agente>/clients/<cliente>/`. Nunca en la raíz.
- Un entregable faltante se marca `BLOQUEADO` o `PENDIENTE`. Nunca se omite en silencio.
- Formato de respuesta al usuario: headings, bullets y negritas. Lo accionable arriba.
