# QC Gates — Agente de Video

Checklist por fase. **Ninguna fase se entrega sin pasar su bloque completo.**

---

## Fase 0 — Brief
- [ ] Las **4 preguntas** respondidas: goal · runtime · plataforma · tono
- [ ] El goal fue **declarado por el usuario**, no inferido por el agente
- [ ] El runtime es compatible con la plataforma declarada
- [ ] Hay **un solo** mensaje único y **un solo** CTA
- [ ] Brand guideline identificado, o `⚠️ SIN GUIDELINE` con lo asumido escrito
- [ ] Deadline y rondas máximas de revisión declarados
- [ ] Está declarado quién aprueba cada gate
- [ ] Está declarado qué **no** puede hacer esta pieza (alcance de otros departamentos)
- [ ] Estado de licencias de música y autorizaciones de personas registrado

## Fase 1 — Material
- [ ] `ffprobe` corrido: duración, resolución, fps, codec, audio de **cada** archivo
- [ ] Frames extraídos **y leídos** — ningún plano descrito sin haberlo visto
- [ ] Transcripción presente, o `⚠️ SIN TRANSCRIPCIÓN` con la limitación declarada
- [ ] Frames y transcripción **cruzados por timecode**
- [ ] Inventario de planos completo, cada uno con uso (A-roll / B-roll / descarte)
- [ ] 3-8 momentos oro identificados, cada uno con para qué beat sirve
- [ ] Huecos marcados `⚠️ FALTA MATERIAL` con el beat afectado
- [ ] Problemas técnicos listados con timecode y severidad
- [ ] Si hay referencia: las 7 capas descompuestas, con cortes/min medidos
- [ ] 🛑 **Ninguna oración decide nada.** Sin "por lo tanto…"
- [ ] Herramientas usadas y no disponibles registradas

## Fase 2 — Disciplinas
- [ ] Cada disciplina elegida pasa el triple filtro: goal **Y** material **Y** runtime
- [ ] Cada disciplina tiene escrito **qué aporta a este video**, no una descripción genérica
- [ ] Las descartadas están listadas **con motivo**
- [ ] El núcleo (narrativa · ritmo · audio · color) está cubierto o justificado si no
- [ ] La suma de tiempos estimados entra en el deadline

## Fase 3 — Plan
- [ ] **3 hooks candidatos** escritos, uno elegido **con motivo**
- [ ] La promesa del hook está escrita textualmente
- [ ] El primer frame está elegido a propósito (sirve de miniatura)
- [ ] Hay re-hooks en la cadencia de la plataforma (3-5s social · 20-30s YouTube)
- [ ] Todo open loop abierto tiene su timecode de cierre
- [ ] **Un solo CTA**, hablado y en pantalla, en los últimos 3-5s
- [ ] El último frame está definido y **no es negro**
- [ ] Cada beat se traza al **goal**. Sin traza, el beat se elimina acá
- [ ] La suma de duraciones de beats entra en el runtime objetivo
- [ ] EDL completa: ninguna fila sin beat asignado
- [ ] Ritmo objetivo declarado en cortes/min y duración media de plano
- [ ] Brand guideline volcado por capa (color, tipo, captions, logo, sonido, safe areas)
- [ ] El **orden de operaciones** está escrito y no fue alterado
- [ ] Material generado con IA declarado, con motivo de por qué no existe el plano real
- [ ] Plan B escrito para cada riesgo 🔴

## Fase 4 — Edición
- [ ] Picture lock declarado **antes** de color, audio final y gráfica
- [ ] Ningún corte fuera de la EDL sin registrarlo en la EDL
- [ ] Cada corte cambia información, emoción o ritmo. Los demás se eliminaron
- [ ] Ritmo real medido contra el objetivo del plan
- [ ] B-roll cubre los saltos: no queda ningún jump cut involuntario
- [ ] Tonos de piel priorizados sobre el look en el grading
- [ ] Voz inteligible y pareja; ruido de fondo tratado
- [ ] Música bajo voz a −18/−22 dB relativos
- [ ] Captions dentro del safe area, sincronizados, sin errores de ortografía
- [ ] Gráfica y captions aplicados **después** del color
- [ ] Versionado correcto — **ninguna versión sobrescrita**
- [ ] Feedback de revisión registrado con timecode

## Fase 5 — QC y entrega
- [ ] Un export por **cada** plataforma de destino
- [ ] Resolución, aspecto y fps correctos en cada export
- [ ] `yuv420p` + `faststart` en todos
- [ ] Loudness ≈ −14 LUFS · true peak ≤ −1.5 dBTP
- [ ] Texto y logo dentro de safe areas en **todos** los formatos
- [ ] Primer frame elegido · último frame con marca + CTA ≥1.5s, no negro
- [ ] Sin frames negros intermedios ni flashes de render
- [ ] Se entiende sin sonido si la plataforma lo exige
- [ ] Licencias de música, stock y autorizaciones verificadas
- [ ] Material generado con IA declarado al cliente
- [ ] `qc-entrega.md` completo, sin ningún hallazgo 🔴 abierto
- [ ] Handoff escrito

---

## Coherencia global — antes del handoff
- [ ] La pieza final **cumple el goal del brief**, no otro
- [ ] El hook promete exactamente lo que la pieza entrega
- [ ] El plan aprobado y la pieza final **no se contradicen**; los desvíos están registrados
- [ ] Nada contradice el posicionamiento definido por Strategy
- [ ] Ningún entregable pisa a Creative, Branding, Production, Growth o Social Media
- [ ] Los 3 gates humanos están registrados con estado
- [ ] Todo faltante está marcado `BLOQUEADO` o `PENDIENTE`, ninguno omitido en silencio
- [ ] El agente **no publicó** nada
