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
| **Design** | `agents/design/` | Piezas visuales estáticas listas para publicar o pautar, por formato y canal | ✅ Operativo |
| Growth | — | Monetización, money model, funnel | ⬜ Pendiente |
| Creative | — | Conceptos e ideas creativas | ⬜ Pendiente |
| Branding | — | Guidelines, lenguaje visual y de tono | ⬜ Pendiente |
| Production | — | Pre / producción / post | ⬜ Pendiente |
| Content | — | Armado y QA de piezas finales | ⬜ Pendiente |
| Analytics | — | Medición y aprendizajes | ⬜ Pendiente |

---

## Cómo arrancás cada sesión

1. **Identificá el departamento.**

   | Si el pedido es de… | Skill de entrada |
   |---|---|
   | Estrategia, research, posicionamiento, calendario macro, onboarding de cliente nuevo | `estrategia` |
   | Diseñar piezas, sistema visual, composición, tipografía, contraste, Figma/Figwright, adaptar formatos, feed | `diseno` |

2. **Identificá el cliente.** Un cliente = una carpeta en `agents/<depto>/clients/<cliente>/`.
   Nunca mezcles archivos de dos clientes ni de dos departamentos.
3. **Declará el pre-flight** (ver abajo) antes de producir nada.

## Pre-flight obligatorio

Antes de ejecutar, respondé en una línea:

**Strategy:**
```
PRE-FLIGHT — Cliente: [x] · Arquetipo: [x o SIN CLASIFICAR] · Capa: [0-8] · Skills: [x] · MCPs: [x] · Gate humano: [sí/no]
→ PASS | BLOQUEADO: [qué falta]
```

**Design:**
```
PRE-FLIGHT — Cliente: [x] · Sistema visual: [✅ aprobado / ⬜ no existe] · Capa: [D0-D7]
Lote: [período · n piezas] · Skills: [x] · MCPs: [Figwright ✅/⬜] · Gate humano: [sí/no]
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
3. **Nunca saltes capas.** Los métodos son secuenciales — Strategy (`agents/strategy/METHOD.md`,
   capas 0-8) y Design (`agents/design/METHOD.md`, capas D0-D7). Si falta el input de una capa,
   se bloquea; no se improvisa el faltante.
4. **Ingeniería inversa produce patrones, no recomendaciones.** Si un output de la Capa 1 empieza
   con "por lo tanto deberíamos…", se salió de su rol.
5. **No copiar.** La ingeniería inversa se traduce a hipótesis propias filtradas por distintividad,
   nunca a réplica del competidor.
6. **Gate humano.** Núcleo, posicionamiento, movimiento elegido y calendario los aprueba un humano
   antes del handoff. El agente propone; no cierra.
7. **No duplicar otros departamentos.** Strategy llega hasta plataforma + calendario macro.
   Design llega hasta export aprobado y nombrado. Monetización es de Growth. Conceptos, copies,
   **goal de la pieza y jerarquía del mensaje** son de Creative. Lenguaje visual es de Branding.
   Fotos, video y motion del estático son de Production. Publicar y pautar es de Content / Media Buy.
8. **Creative define la jerarquía del MENSAJE; Design resuelve la jerarquía VISUAL.**
   Si al brief creativo le falta el goal o el texto en jerarquía, Design **bloquea y devuelve** —
   nunca lo inventa. Si no es ejecutable en el formato, lo marca `⚠️ OBSERVADO` y propone; no lo
   cambia en silencio.
9. **En Design: el contraste se mide, no se estima.** Piso 4.5:1 para todo texto legible en
   miniatura; 7:1 o scrim sobre foto. "Se ve bien" no es una medición.
10. **En Design: nunca se genera fotografía del cliente.** Si falta material real se marca
    `⚠️ ASSET FALTANTE` y se pide a Production. Todo asset generado va marcado `[asset generado]`
    y con gate humano.
11. **Nada destructivo sin autorización.** No publicar, no pautar, no enviar al cliente, no borrar,
    no sobrescribir aprobados. Figwright escribe sobre el archivo real del cliente: se reclama con
    `use_file` y se confirma antes de escribir.

---

## Convenciones de archivo

- Todo en **español**, salvo los términos del método que son fijos en inglés — Strategy: `WIN`,
  `MUST BE TRUE`, `UNFAIR`, `GO GET`, `MOVE`, `COMPOUND` · Design: `SAFE AREA`, `SCRIM`, `TOKEN`,
  `AUTO LAYOUT`, `COMPONENT`, `VARIANT`, `EXPORT`.
- Outputs de cliente: `agents/<depto>/clients/<cliente>/`. Nunca en la raíz.
- Un entregable faltante se marca `BLOQUEADO` o `PENDIENTE`. Nunca se omite en silencio.
- Formato de respuesta al usuario: headings, bullets y negritas. Lo accionable arriba.
