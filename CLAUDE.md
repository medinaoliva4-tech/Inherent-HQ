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
| **Marketing** | `agents/marketing/` | Convierte la estrategia en campañas: research comercial, distribución del objetivo, mix, campañas orgánicas y pautadas, calendario comercial, volumen y presupuesto | ✅ Operativo |
| Growth | — | Monetización, money model, funnel, compra de medios | ⬜ Pendiente |
| Creative | — | Conceptos e ideas creativas | ⬜ Pendiente |
| Branding | — | Guidelines, lenguaje visual y de tono | ⬜ Pendiente |
| Production | — | Pre / producción / post | ⬜ Pendiente |
| Content | — | Armado y QA de piezas finales | ⬜ Pendiente |
| Analytics | — | Medición y aprendizajes | ⬜ Pendiente |

---

## Cómo arrancás cada sesión

1. **Identificá el departamento.**
   - ¿Estrategia, research de categoría, posicionamiento, plan de contenido, calendario
     estratégico, onboarding de cliente nuevo? → skill `estrategia`
   - ¿Plan de marketing, campañas, anuncios de la competencia, Meta/Google Ads, influencers,
     eventos, promociones, fechas de lanzamiento, presupuesto, cuántas piezas por día? →
     skill `marketing`
   - ¿Dudás entre los dos? → `agents/marketing/FRONTERAS.md` §7 tiene el test de tres preguntas.
2. **Identificá el cliente.** Un cliente = una carpeta en `agents/strategy/clients/<cliente>/`.
   Marketing escribe en su subcarpeta `marketing/`. Nunca mezcles archivos de dos clientes.
3. **Declará el pre-flight** (ver abajo) antes de producir nada.

## Pre-flight obligatorio

Antes de ejecutar, respondé en una línea:

```
PRE-FLIGHT — Cliente: [x] · Arquetipo: [x o SIN CLASIFICAR] · Capa/Fase: [Strategy 0-8 | Marketing M0-M7] · Skills: [x] · MCPs: [x] · Gate humano: [sí/no]
→ PASS | BLOQUEADO: [qué falta]
```

Si falta el cliente o el input mínimo de la capa/fase: **BLOQUEADO**, y pedí exactamente lo que falta.
Nunca rellenes con inferencia sin marcarla.

**Marketing tiene un bloqueo adicional:** sin `posicionamiento.md` con gate humano pasado, Marketing
no arranca. No se infiere el posicionamiento desde el brief.

---

## Reglas duras del repo

1. **Evidencia o etiqueta.** Toda afirmación lleva fuente. Sin fuente va como
   `[percepción del cliente, no verificado]` o `⚠️ SIN DATOS`. Nunca inventes datos, competidores,
   métricas ni tendencias.
2. **Patrón ≠ señal.** 3+ fuentes independientes = `🟢 patrón`. 1-2 = `🟡 señal a confirmar`.
3. **Nunca saltes capas ni fases.** Los métodos son secuenciales — Strategy
   (`agents/strategy/METHOD.md`, capas 0-8) y Marketing (`agents/marketing/METHOD.md`, fases M0-M7).
   Si falta el input de una capa o fase, se bloquea; no se improvisa el faltante.
4. **Ingeniería inversa produce patrones, no recomendaciones.** Si un output de la Capa 1 empieza
   con "por lo tanto deberíamos…", se salió de su rol.
5. **No copiar.** La ingeniería inversa se traduce a hipótesis propias filtradas por distintividad,
   nunca a réplica del competidor.
6. **Gate humano.** Núcleo, posicionamiento, movimiento elegido y calendario los aprueba un humano
   antes del handoff. El agente propone; no cierra.
7. **No duplicar otros departamentos.** Strategy llega hasta plataforma + calendario macro.
   Marketing llega hasta plan de campañas + calendario comercial + volumen y presupuesto.
   Monetización, precio y compra de medios son de Growth. Piezas concretas son de Creative.
   Assets son de Production. La frontera completa está en `agents/marketing/FRONTERAS.md`.
   **Marketing nunca edita un archivo de Strategy:** lo que haya que cambiar allá se devuelve con
   un bloque `⟲ RETORNO A ESTRATEGIA`.
8. **Nada destructivo sin autorización.** No publicar, no pautar, no enviar al cliente, no borrar,
   no sobrescribir aprobados.

---

## Convenciones de archivo

- Todo en **español**, salvo los términos del método que son fijos en inglés
  (`WIN`, `MUST BE TRUE`, `UNFAIR`, `GO GET`, `MOVE`, `COMPOUND`).
- Outputs de cliente: `agents/strategy/clients/<cliente>/` (Strategy) y
  `agents/strategy/clients/<cliente>/marketing/` (Marketing). Nunca en la raíz.
- Un entregable faltante se marca `BLOQUEADO` o `PENDIENTE`. Nunca se omite en silencio.
- Formato de respuesta al usuario: headings, bullets y negritas. Lo accionable arriba.
