# Outputs — Agente de Producción

Qué produce exactamente, con qué capa, quién lo consume y qué **no** produce.

---

# A · Entregables de archivo

| # | Archivo | Capa | Skill | Gate | Lo consume |
|---|---|---|---|---|---|
| 1 | `brief-de-produccion.md` | 0 | `pr-brief` | — | Capas 1-6 · ④ Creatividad (devoluciones) |
| 2 | `desglose.md` | 1 | `pr-desglose` | — | Capas 2-3 |
| 3 | `plan-de-jornadas.md` | 2 | `pr-jornadas` | — | Capas 4-5 |
| 4 | `recursos.md` | 3 | `pr-recursos` | — | Capas 4-5 · responsables asignados |
| 5 | `plan-de-produccion.csv` | 1-4 | `pr-presupuesto` | 🚦 **GATE 1** | **⑥B Video · ⑥A Diseño · ③ Marketing · Capa 7** |
| 6 | `call-sheets/jornada-N.md` | 5 | `pr-rodaje` | 🚦 **GATE 2** | El equipo del día |
| 7 | `entrega.md` | 6 | `pr-entrega` | 🚦 **GATE 3** | **⑥B Video · ⑥A Diseño** · Capa 7 |
| + | `aprendizaje-de-produccion.md` | 7 | `pr-loop` | — | Capa 2 del ciclo siguiente · ① Comprensión · ④ Creatividad |

---

## 1 · `brief-de-produccion.md` — Capa 0

| Sub-output | Qué es |
|---|---|
| **A · Contexto cargado** | Checklist de los 4 inputs bloqueantes con estado ✅/⬜ y ruta |
| **B · Filas a producir** | Las filas del Excel creativo con `handoff = produccion-*`, agrupadas por campaña |
| **C · Verificación de producibilidad** | Fila por fila: shot list completo · acción y lugar declarados · mood y emoción presentes |
| **D · Reutilización** | Qué escenas ya existen en el banco de assets y **no se vuelven a grabar** |
| **E · Techos de realidad** | Presupuesto disponible · días de rodaje posibles · capacidad declarada |
| **F · Devoluciones** | ↩️ Las filas que vuelven a ④ Creatividad, con motivo y alternativa |
| **Huecos abiertos** | ⚠️ SIN DATOS, con qué falta y a quién pedírselo |

**Restricción:** verifica, no produce. No cambia ni una decisión creativa.

---

## 2 · `desglose.md` — Capa 1

| Sub-output | Qué es |
|---|---|
| **Desglose por escena** | Las 8 categorías completas por escena: locación · talento · producto · props · vestuario · arte · equipo · permisos |
| **Mapa fila → escenas** | `C-001 → P-001 · P-002 · P-003`, para que la traza no se pierda |
| **Inventario consolidado** | Todo lo que hace falta conseguir, sin repetir, para el ciclo completo |
| **Marcas de imposibilidad** | Lo que no se puede conseguir, con su alternativa propuesta |

**Restricción:** desglosa lo pedido. **No agrega escenas** que el Excel creativo no pidió.

---

## 3 · `plan-de-jornadas.md` — Capa 2

| Sub-output | Qué es |
|---|---|
| **Agrupación** | Qué escenas van juntas y por qué eje (locación · talento · setup · producto) |
| **Jornadas** | J1, J2… con su locación, talento convocado y escenas asignadas |
| **Orden de tiro** | Dentro de cada jornada, el orden por costo de cambio — no el orden narrativo |
| **Factor de consolidación** | `escenas ÷ jornadas`, declarado, con su lectura |
| **Carga horaria** | Horas efectivas por jornada, con márgenes de montaje y cambio incluidos |

**Restricción:** ninguna jornada supera **10 h efectivas**. Si no entra, no está consolidada: está
sobrecargada.

---

## 4 · `recursos.md` — Capa 3

| Sub-output | Qué es |
|---|---|
| **Inventario con origen** | Cada ítem con `propio` / `prestado` / `alquilado` / `comprado` / `a-producir` |
| **Responsables** | Nombre y fecha de confirmación por ítem. **Ninguno sin dueño** |
| **Semáforo** | 🟢 confirmado · 🟡 gestionando · 🔴 en riesgo |
| **Riesgos y planes B** | Por escena con dependencia externa, escritos antes de la jornada |
| **Permisos y legales** | Permisos de locación · cesiones de imagen · derechos de música · seguros |

**Restricción:** un 🟡 a menos de 48 h de la jornada pasa a 🔴 y activa su plan B automáticamente.

---

## 5 · `plan-de-produccion.csv` — Capas 1-4 · **el entregable definitivo**

**29 columnas fijas.** Una fila por **escena**, no por pieza.

```
id · id_creativo · campana · escena · accion · encuadre · duracion_s · tipo · tipo_de_lugar ·
locacion · talento · producto · props · vestuario · arte_ambientacion · equipo · permisos ·
jornada · orden_en_jornada · tiempo_estimado_min · origen_del_recurso · responsable ·
costo_estimado · costo_real · riesgo · plan_b · archivo_entregado · destino · estado
```

| Grupo | Columnas | Origen |
|---|---|---|
| **Heredado de ④ Creatividad** (se copia, no se genera) | `id_creativo` `campana` `escena` `accion` `encuadre` `duracion_s` `tipo_de_lugar` | `ideas-de-contenido.csv` |
| **Desglosado por Producción** | `tipo` `locacion` `talento` `producto` `props` `vestuario` `arte_ambientacion` `equipo` `permisos` | Capa 1 |
| **Consolidado por Producción** | `jornada` `orden_en_jornada` `tiempo_estimado_min` | Capa 2 |
| **Gestionado por Producción** | `origen_del_recurso` `responsable` `riesgo` `plan_b` | Capa 3 |
| **Costeado por Producción** | `costo_estimado` `costo_real` | Capas 4 y 7 |
| **Operativo** | `id` `archivo_entregado` `destino` `estado` | Capas 5-6 |

**Restricciones:**
- 🚦 GATE 1 — el presupuesto lo aprueba un humano **antes de comprometer un solo recurso**.
- **Toda fila sin `id_creativo` se elimina** — es presupuesto sin justificación.
- **Una escena que no está en el Excel no se graba.**
- `costo_real` se completa siempre, aunque sea igual al estimado.
- 🛑 No baja a piezas terminadas, montaje ni export — eso es ⑥A Diseño y ⑥B Video Editing.

---

## 6 · `call-sheets/jornada-N.md` — Capa 5

| Sub-output | Qué es |
|---|---|
| **Encabezado** | Cliente · campaña · jornada · fecha · locación con dirección · clima previsto |
| **Horarios** | Llamado · primer tiro · comida · wrap previsto |
| **Contactos** | Nombre, rol y teléfono de cada convocado |
| **Orden de tiro** | Escena por escena con `id`, acción, encuadre, duración y tiempo estimado |
| **Requerimientos por escena** | Talento · producto · props · vestuario · equipo específico |
| **Cobertura obligatoria** | Las tomas de seguridad, marcadas aparte del orden de tiro |
| **Riesgos del día** | Los 🟡/🔴 activos con su plan B |
| **Nomenclatura** | El patrón de nombre de archivo, **definido antes de grabar** |

**Restricción:** 🚦 GATE 2. No se convoca a nadie sin call sheet aprobado.

---

## 7 · `entrega.md` — Capa 6

| Sub-output | Qué es |
|---|---|
| **Manifiesto** | Fila por fila: `id` · `id_creativo` · escena · ¿grabada? · archivo · ¿cobertura? · estado |
| **Selects marcados** | Las tomas buenas por escena. **No el frame elegido** |
| **Faltantes** | Toda escena `Planificada` que no llegó a `Entregada`, con motivo escrito |
| **Estructura de entrega** | Rutas de Drive según `toolkit/07-entrega.md` |
| **Verificación de backup** | Confirmación de respaldo en dos lugares |

**Restricción:** 🚦 GATE 3. Ninguna jornada se cierra como completa sin el manifiesto cruzado.

---

## 8 · `aprendizaje-de-produccion.md` — Capa 7

| Sub-output | Qué es |
|---|---|
| **Desvío de costo** | `costo_estimado` vs `costo_real` por ítem y por jornada |
| **Desvío de tiempo** | Escenas que llevaron más de lo estimado, y por qué |
| **Material no usado** | Qué se grabó y ⑥A nunca usó → vuelve a ④ Creatividad **como dato** |
| **Factor de consolidación real** | Previsto vs. real, y dónde se perdió |
| **Corrección de capacidad** | Propuesta de actualización para ① Comprensión, con el dato real |
| **Actualizaciones del toolkit** | Márgenes y costos que dejan de ser estimación y pasan a ser dato |

**Restricción:** mide **ejecución**, no resultado creativo ni de negocio. Si una pieza no funcionó,
eso lo lee ④ Creatividad en su Capa 7.

---

# B · Outputs de sesión (no archivo)

| # | Output | Cuándo | Forma |
|---|---|---|---|
| 1 | **Pre-flight** | Siempre, antes de producir | `PRE-FLIGHT — Cliente · Campaña · Capa · Excel creativo · Branding · Fechas · Presupuesto · Gate → PASS \| BLOQUEADO` |
| 2 | **Bloqueo** | Falta un input o una capa previa | El nombre exacto del archivo o dato que falta + a quién pedírselo |
| 3 | **Devolución** | Una fila creativa no es producible | ↩️ `id_creativo` + motivo + alternativa concreta |
| 4 | **Alerta de riesgo** | Un recurso pasa a 🔴 | Qué recurso · qué jornada compromete · qué plan B se activa |
| 5 | **Alerta de presupuesto** | El costo supera lo disponible | Las 3 opciones de Capa 4.4, con impacto, para que decida un humano |
| 6 | **Handoff** | Al cerrar la entrega | El bloque de `PROCESS.md` |

---

# C · Outputs externos (fuera del repo)

| Destino | Qué se escribe | Permiso |
|---|---|---|
| **Google Drive** | El material entregado, con la estructura y nomenclatura de `toolkit/07-entrega.md` | `ask` — solo post-GATE 3 |
| **Google Sheets** | El `plan-de-produccion.csv` aprobado, para seguimiento en jornada | `ask` — solo post-GATE 1 |
| **Calendario** | Las jornadas confirmadas | `ask` — solo post-GATE 2 |

🛑 Nada se escribe afuera antes de su gate.

---

# D · Qué NO produce

| No produce | De quién es |
|---|---|
| Investigación de negocio, audiencia, competencia, precios | **① Comprensión** |
| Posicionamiento, promesa, territorio, mecanismo único | **② Estrategia** |
| Campañas, canales, fechas, frecuencia, pilares, calendario | **③ Marketing** |
| Paleta, tipografía, tono de voz, dirección visual, guidelines | **②B Branding** |
| Concepto, hook, copy, guion, emoción, encuadre pedido, elementos gráficos a pedir | **④ Creatividad** |
| Composición final, layout, creación de elementos gráficos, Figma, export, retoque | **⑥A Diseño gráfico** |
| Montaje, color de entrega, mezcla final, versiones por plataforma | **⑥B Video Editing** |
| Captions, hashtags, publicación, programación | **⑦ Posting** |
| Segmentación, presupuesto de pauta, optimización | **⑧B Ads** |

Producción entrega **hasta el material base ordenado y nombrado**, y hace handoff.

## Las dos fronteras que más se confunden

| Frontera | Producción entrega | El otro entrega |
|---|---|---|
| **con ④ Creatividad** | La **logística**: locación concreta, permiso, talento, props reales, equipo, presupuesto, día y hora | La **intención**: qué acción, qué tipo de lugar, qué encuadre, cuánto dura, qué mood y qué emoción |
| **con ⑥B Video Editing** | RAW filmado ordenado + **selects marcados** + audio limpio y sincronizado + ambientes, con nomenclatura aplicada | El montaje, el ritmo, el color de entrega, los captions, la mezcla final y las versiones por plataforma |
| **con ⑥A Diseño gráfico** | Fotos y capturas con exposición y encuadre correctos, **selects marcados**, con nomenclatura aplicada | El frame elegido, el recorte por formato, la composición, la jerarquía, los elementos gráficos y el export final |

> **La prueba.** Si ⑥A o ⑥B tienen que **renombrar archivos o adivinar qué toma sirve**, Producción
> entregó de menos. Si Producción entrega **un archivo listo para publicar**, entregó de más.

---

# Trazabilidad completa

```
ideas-de-contenido.csv    1 fila = 1 pieza, con escenas/encuadres/duraciones
      ↓
desglose                  1 pieza → N escenas, cada una con 8 categorías
      ↓
plan-de-jornadas          N escenas → M jornadas (factor de consolidación)
      ↓
recursos                  cada ítem con origen, responsable y fecha
      ↓
plan-de-produccion.csv    29 columnas por escena, con costo y traza    🚦 GATE 1
      ↓
call-sheets               1 por jornada, con orden de tiro y cobertura  🚦 GATE 2
      ↓
entrega.md                manifiesto cruzado + material nombrado        🚦 GATE 3
      ↓
aprendizaje               desvíos reales → Capa 2 del ciclo siguiente
```

**La pregunta que cierra la cadena:** de cualquier archivo entregado se puede volver hasta la
MUST BE TRUE que lo justificó, pasando por `id_creativo` → fila creativa → slot → campaña.
Si no se puede, la traza está rota y la escena no debió grabarse.
