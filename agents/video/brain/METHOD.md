# Método de Video Editing — Inherent

Seis fases. **Secuencial.** Ninguna fase arranca sin el output de la anterior.

```
COMPRENDER  ─┬─ FASE 0 · BRIEF         Qué video es
             └─ FASE 1 · MATERIAL      Qué hay realmente

DECIDIR     ─┬─ FASE 2 · DISCIPLINAS   Qué necesita este video
             └─ FASE 3 · PLAN          Cómo se hace, en qué orden

EJECUTAR    ─┬─ FASE 4 · EDICIÓN       Hacerlo, capa por capa
             └─ FASE 5 · QC Y ENTREGA  Verificar, exportar, entregar
```

---

## FASE 0 — Brief: comprender el video

**Skill:** `vd-brief` · **Output:** `brief-de-video.md` · 🚦 **Gate 1**

### 0.1 Las 4 preguntas obligatorias

| Pregunta | Por qué define el corte |
|---|---|
| **Goal** — inspirar / explicar / convertir / documentar | Define la estructura narrativa completa |
| **Runtime** — 15s / 30s / 60s / 2-3min / 5min+ | Define cuántos beats entran |
| **Plataforma** — YT / TikTok / Reels / Shorts / Web / LinkedIn | Define aspecto, safe areas, retención y audio |
| **Tono** — cinematográfico / punchy / documental / comercial / UGC / luxury | Define ritmo, color, sonido y tipografía |

**Sin las 4 → BLOQUEADO.** El goal nunca se infiere.

### 0.2 Goal → estructura

| Goal | Estructura base | Métrica que importa |
|---|---|---|
| **Inspirar** | Tensión → transformación → visión | Watch time · shares · saves |
| **Explicar** | Problema → mecanismo → prueba → resumen | Retención media · comentarios de duda resuelta |
| **Convertir** | Hook → dolor → solución → prueba → CTA | CTR · conversión · costo por resultado |
| **Documentar** | Contexto → hecho → consecuencia → cierre | Completion rate · archivo/referencia |

### 0.3 Insumos del brief
Concepto o guion (de Creative) · brand guideline (de Branding) · material crudo · referencias ·
deadline · dónde se publica · quién aprueba.

### 0.4 Brand guideline — obligatorio
Sin guideline aplicable no se edita. Ver `templates/brand-guideline-video.md`. Si el cliente no
tiene: se declara `⚠️ SIN GUIDELINE — [qué se asumió]` y se marca para que Branding lo cierre.

🚦 **GATE 1 — Brief aprobado.** Un humano confirma goal, runtime, plataforma y tono antes de que se
gaste una hora mirando material.

---

## FASE 1 — Material: comprender lo que hay

**Skill:** `vd-analisis` · **Playbook:** `playbooks/ANALISIS-DE-MATERIAL.md`
**Output:** `analisis-de-material.md`

### 1.1 Se analiza como paquete, nunca por partes sueltas

```
FRAMES      ffmpeg → keyframes cada N segundos → qué se ve, encuadre, luz, continuidad
AUDIO       transcripción con timecode → qué se dice, dónde está el oro, dónde sobra
TÉCNICO     ffprobe → resolución, fps, codec, duración, LUFS, canales
ASSETS      logos, música, tipografías, LUTs, gráficos disponibles
REFERENCIA  si hay video de referencia: se descompone igual que el material propio
```

**Regla:** frames sin transcripción = análisis ciego. Transcripción sin frames = análisis sordo.
**Siempre los dos, cruzados por timecode.**

### 1.2 Qué produce
- **Inventario de planos** con timecode, contenido, calidad y uso posible (A-roll / B-roll / descarte)
- **Momentos oro**: los 3-8 fragmentos que sostienen la pieza
- **Huecos**: `⚠️ FALTA MATERIAL — [qué plano falta y para qué beat]`
- **Problemas técnicos**: audio sucio, exposición, foco, continuidad, ruido
- **Si hay referencia:** los 7 planos de descomposición (ver 1.3)

### 1.3 Descomposición de una referencia — 7 capas

| # | Capa | Qué se extrae |
|---|---|---|
| 1 | **Hook** | Tipo, qué muestra, cuántos segundos, qué promete |
| 2 | **Estructura** | Beats y sus timecodes |
| 3 | **Ritmo** | Cortes por minuto, duración media de plano, dónde acelera y frena |
| 4 | **Capa gráfica** | Captions, tipografía, motion, lower thirds, stickers |
| 5 | **Sonido** | Música, SFX, ambiente, mezcla voz/música |
| 6 | **Color** | Look, contraste, temperatura, referencias de grading |
| 7 | **CTA** | Cuál, dónde, cómo se presenta |

🛑 **Esta fase no decide.** Describe lo que hay. Si escribís "por lo tanto cortemos acá",
te saliste del rol.

---

## FASE 2 — Disciplinas: comprender qué necesita

**Skill:** `vd-plan` (bloque 1) · **Catálogo:** `DISCIPLINAS.md`

Se eligen del catálogo de **14 disciplinas** las que este video efectivamente necesita.

### 2.1 Regla de selección
```
Disciplina elegida = (el goal la requiere) Y (el material la permite) Y (el runtime la banca)
```
Una disciplina que no cumple las tres **no entra**. Se documenta por qué queda afuera.

### 2.2 Núcleo vs. opcional

| Siempre (núcleo) | Según el caso |
|---|---|
| Narrativa · Ritmo · Audio/voz · Color | Captions · B-roll · Motion · Sound design · Social · VFX · Compositing |

### 2.3 Salida
Lista de disciplinas elegidas + la skill que cubre cada una + qué aporta cada una a **este** video.

---

## FASE 3 — Plan de ejecución

**Skill:** `vd-plan` (bloque 2) · **Outputs:** `plan-de-edicion.md` + `edit-decision-list.csv`
🚦 **Gate 2**

### 3.1 Estructura de beats
Cada beat con: nombre · función · duración objetivo · qué plano lo cubre · qué dice · qué se ve.

### 3.2 Story Cutter — obligatorio en toda pieza
**Playbook:** `playbooks/STORY-CUTTER.md`

```
HOOK        0-3s    · tipo de hook · qué promete · por qué frena el scroll
RETENTION   cuerpo  · open loops · re-hooks · cambios de estímulo · curva
CTA         cierre  · uno solo · verbo · coherente con el goal
```

### 3.3 EDL (Edit Decision List)
`edit-decision-list.csv` — una fila por corte: `beat · in · out · fuente · tipo_de_corte ·
capa · disciplina · nota`. Es el contrato de la edición.

### 3.4 Orden de operaciones — no negociable

```
0  INGESTA        Sincronía, proxies, organización, nomenclatura
1  CORTE NARRATIVO Story cutter: estructura y beats        → PICTURE LOCK
2  RITMO           Duración de planos, pausas, speed ramps
3  B-ROLL          Cobertura, tapar cortes, mostrar contexto
4  VFX / COMPOSIT  Roto, tracking, keys, limpieza, capas
5  COLOR           Corrección → balance → look / LUT
6  AUDIO           Limpieza de voz → sound design → mezcla → loudness
7  GRÁFICA         Motion graphics → captions → lower thirds
8  MASTER          Export por plataforma + QC
```

**Por qué importa:**
- Colorear antes del picture lock = rehacer todo cuando cambie un corte.
- Captions antes del color = texto que no matchea el look final.
- Mezclar antes del picture lock = mezcla que no cierra.

### 3.5 Presupuesto de tiempo
Cada disciplina con estimación. Si el deadline no entra: se recorta **disciplina**, nunca QC.

🚦 **GATE 2 — Plan aprobado.** El gate más importante. Todo lo que sigue cuesta horas de render.

---

## FASE 4 — Edición

**Skills:** una por disciplina (ver `DISCIPLINAS.md`) · **Output:** cortes versionados

### 4.1 Versionado
```
<proyecto>_v01_roughcut      corte narrativo, sin nada más
<proyecto>_v02_picturelock   ritmo + b-roll cerrados
<proyecto>_v03_online        vfx + color + audio
<proyecto>_v04_master        gráfica + master
```
**Nunca se sobrescribe una versión.** Cada revisión es un archivo nuevo.

### 4.2 Brand guideline en cada capa
| Capa | Qué controla el guideline |
|---|---|
| Color | LUT / look aprobado, temperatura, contraste |
| Gráfica | Tipografía, pesos, tamaños, paleta, animación |
| Captions | Estilo, posición, safe area, resaltado |
| Sonido | Sonotipo, música aprobada, nivel |
| Marca | Logo: dónde, cuándo, cuánto, con qué clear space |

### 4.3 Revisiones
Cada ronda de feedback se registra con timecode. Feedback sin timecode se devuelve pidiendo
timecode. **Máximo de rondas declarado en el brief.**

---

## FASE 5 — QC y entrega

**Skill:** `vd-entrega` · **Playbook:** `playbooks/ESPECIFICACIONES.md`
**Output:** `qc-entrega.md` · 🚦 **Gate 3**

### 5.1 QC técnico
Resolución · fps · codec · bitrate · aspecto · safe areas · loudness (LUFS) · sin picos ·
sin frames negros · sin captions cortados · primer frame y último frame limpios.

### 5.2 QC de contenido
Hook cumple lo que promete · un solo CTA · sin errores de ortografía en pantalla · marca correcta ·
música con licencia · nadie en cuadro sin autorización.

### 5.3 Entregables por plataforma
Cada plataforma tiene su export propio. Ver `playbooks/ESPECIFICACIONES.md`.
**Nunca se entrega un solo archivo para todas las plataformas.**

🚦 **GATE 3 — Master aprobado.** Antes del handoff. El agente no publica.

---

## Handoff

```markdown
## HANDOFF — Video → Social Media / Content
- Cliente: · Proyecto: · Fecha:
- Goal: · Runtime: · Plataformas:
- Entregables: [rutas de los masters]
- Gates: brief [✅/⬜] · plan [✅/⬜] · master [✅/⬜]
- Disciplinas aplicadas:
- Brand guideline: aplicado ✅ / ⚠️ SIN GUIDELINE
- Huecos abiertos: [⚠️ FALTA MATERIAL pendientes]
- Música/assets con licencia: ✅ / ⚠️
- Siguiente: Content (QA final) · Social Media (publicación)
```
