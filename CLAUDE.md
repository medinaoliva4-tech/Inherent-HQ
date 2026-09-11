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
| **Video** | `agents/video/` | Edición de video: del material crudo al master por plataforma, con brand guideline aplicado | ✅ Operativo |
| Growth | — | Monetización, money model, funnel | ⬜ Pendiente |
| Creative | — | Conceptos e ideas creativas | ⬜ Pendiente |
| Branding | — | Guidelines, lenguaje visual y de tono | ⬜ Pendiente |
| Production | — | Pre y rodaje (la post es de Video) | ⬜ Pendiente |
| Content | — | Armado y QA de piezas finales | ⬜ Pendiente |
| Analytics | — | Medición y aprendizajes | ⬜ Pendiente |

---

## Cómo arrancás cada sesión

1. **Identificá el departamento.**

| Si el pedido es… | Skill de entrada |
|---|---|
| Estrategia, research, posicionamiento, calendario, onboarding de cliente | `estrategia` |
| Editar, analizar o planificar un video · material crudo · referencia | `video` |

2. **Identificá el cliente.** Un cliente = una carpeta.
   Strategy: `agents/strategy/clients/<cliente>/` · Video: `agents/video/projects/<cliente>/<proyecto>/`.
   Nunca mezcles archivos de dos clientes.
3. **Declará el pre-flight** (ver abajo) antes de producir nada.

## Pre-flight obligatorio

Antes de ejecutar, respondé en una línea.

**Strategy:**
```
PRE-FLIGHT — Cliente: [x] · Arquetipo: [x o SIN CLASIFICAR] · Capa: [0-8] · Skills: [x] · MCPs: [x] · Gate humano: [sí/no]
→ PASS | BLOQUEADO: [qué falta]
```

**Video:**
```
PRE-FLIGHT — Cliente: [x] · Proyecto: [x] · Goal: [inspirar/explicar/convertir/documentar] · Runtime: [x]
Plataforma: [x] · Tono: [x] · Fase: [0-5] · Brand guideline: [x] · ffmpeg: [ok/falta] · Gate humano: [sí/no]
→ PASS | BLOQUEADO: [qué falta]
```

Si falta el cliente o el input mínimo de la capa o fase: **BLOQUEADO**, y pedí exactamente lo que
falta. Nunca rellenes con inferencia sin marcarla. En Video, **el goal nunca se infiere.**

---

## Reglas duras del repo

1. **Evidencia o etiqueta.** Toda afirmación lleva fuente. Sin fuente va como
   `[percepción del cliente, no verificado]` o `⚠️ SIN DATOS`. Nunca inventes datos, competidores,
   métricas ni tendencias.
2. **Patrón ≠ señal.** 3+ fuentes independientes = `🟢 patrón`. 1-2 = `🟡 señal a confirmar`.
3. **Nunca saltes capas ni fases.** Los métodos son secuenciales: Strategy en 8 capas
   (`agents/strategy/METHOD.md`), Video en 6 fases (`agents/video/METHOD.md`). Si falta el input de
   una capa o fase, se bloquea; no se improvisa el faltante.
4. **Ingeniería inversa produce patrones, no recomendaciones.** Si un output de la Capa 1 empieza
   con "por lo tanto deberíamos…", se salió de su rol.
5. **No copiar.** La ingeniería inversa se traduce a hipótesis propias filtradas por distintividad,
   nunca a réplica del competidor.
6. **Gate humano.** En Strategy: núcleo, posicionamiento, movimiento y calendario. En Video: brief,
   plan de edición y master. El agente propone; no cierra.
7. **No duplicar otros departamentos.** Strategy llega hasta plataforma + calendario macro.
   Video llega hasta master aprobado por plataforma. Monetización es de Growth. El concepto y el
   guion son de Creative. La identidad visual es de Branding. El rodaje es de Production.
8. **Brand guideline siempre.** Ninguna pieza audiovisual se produce sin guideline aplicable. Sin
   él se declara `⚠️ SIN GUIDELINE` con lo asumido, para que Branding lo cierre.
9. **Nada destructivo sin autorización.** No publicar, no pautar, no enviar al cliente, no borrar,
   no sobrescribir aprobados ni masters.

---

## Convenciones de archivo

- Todo en **español**, salvo los términos de método fijos en inglés:
  Strategy `WIN`, `MUST BE TRUE`, `UNFAIR`, `GO GET`, `MOVE`, `COMPOUND` ·
  Video `HOOK`, `RETENTION`, `CTA`, `B-ROLL`, `PICTURE LOCK`, `EDL`, `LUT`, `J-CUT`, `L-CUT`, `LUFS`.
- Outputs: Strategy en `agents/strategy/clients/<cliente>/` · Video en
  `agents/video/projects/<cliente>/<proyecto>/`. Nunca en la raíz.
- Archivos de video pesados van a `_INPUTS/` y `_EXPORTS/`, que **no se commitean**.
  El procesamiento intermedio va al scratchpad, nunca al repo.
- Un entregable faltante se marca `BLOQUEADO` o `PENDIENTE`. Nunca se omite en silencio.
- Formato de respuesta al usuario: headings, bullets y negritas. Lo accionable arriba.
  En Video, todo con timecode (`MM:SS`).
