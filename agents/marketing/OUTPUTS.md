# Mapa de Outputs — Agente de Marketing

Todo lo que el agente produce, dónde vive y quién lo consume.
**Si algo no está en este mapa, el agente no lo produce.**

---

## Resumen

| Tipo | Cantidad | Dónde vive |
|---|---|---|
| **A · Entregables de archivo** | 7 | `clients/<cliente>/marketing/` |
| **B · Outputs de sesión** | 5 | En la conversación (Buzz) |
| **C · Outputs de handoff** | 5 | Bloques dirigidos a otros departamentos |
| **D · Outputs externos** | 3 | Notion · Drive · Eden — solo con gate |

---

# A · Entregables de archivo

| # | Archivo | Fase | Skill | Gate | Lo consume |
|---|---|---|---|---|---|
| 1 | `handoff-recibido.md` | M0 | `mk-handoff` | — | Todas las fases |
| 2 | `research-comercial.md` | M1 | `mk-research-comercial` | — | M2, M3, M4, M5, M6 |
| 3 | `plan-de-marketing.md` | M2-M4 | `mk-plan` | 🚦 M-2 | M5, M6 · Growth · Analytics |
| 4 | `campanas.md` | M4 | `mk-campanas` | 🚦 M-2 | Creative · Growth · Content |
| 5 | `calendario-comercial.csv` | M5 | `mk-calendario-comercial` | 🚦 M-3 | Content · Production · Creative |
| 6 | `volumen-y-presupuesto.md` | M6 | `mk-volumen-presupuesto` | 🚦 M-4 | Production · Growth · Content |
| 7 | `lectura-comercial.md` | M7 | `mk-lectura` | — | Strategy · Growth · Creative · Branding |

---

## 1 · `handoff-recibido.md` — M0

| Sub-output | Qué es |
|---|---|
| **Tabla de recepción** | Entregable por entregable: recibido / faltante / gate pasado |
| **Campos críticos extraídos** | 18 campos de Strategy + 3 de Branding, copiados literal |
| **Faltantes y supuestos** | Qué falta, qué fase bloquea, qué supone Marketing mientras tanto |
| **Veredicto** | `PASS` o `BLOQUEADO` con lo que desbloquea |

**Restricción:** verifica y copia. **No interpreta ni completa** lo que Strategy no entregó.

---

## 2 · `research-comercial.md` — M1

| Sub-output | Qué es |
|---|---|
| **1.1 Tabla de ads vivos** | Marca · plataforma · días corriendo · formato · ángulo · promesa · oferta · CTA |
| **1.1b Patrones por capa** | Ángulo, formato, oferta y objeción dominantes, con marca 🟢/🟡/⚪ |
| **1.1c Ads de larga duración** | Los ganadores probados de la categoría |
| **1.2 Mecánicas promocionales** | Qué promo, de qué magnitud, en qué momento, con qué urgencia |
| **1.2b Piso y techo de descuento** | Observados, no estimados |
| **1.2c Mecánicas saturadas y ausentes** | Dónde hay aire promocional |
| **1.3 Calendario de la categoría** | Fechas duras, propias, valles, saturación y aire — con fuente y año |
| **1.4 Benchmarks de costo** | Por canal, con origen marcado |
| **1.4b Tarifas de creadores** | Por rango de audiencia |
| **1.4c CAC máximo tolerable** | El número que gobierna todo el presupuesto |
| **1.5 Fichas de avatar** | 2-4, con frase literal, nivel de consciencia y CEP de entrada |
| **1.5b Nivel de sofisticación** | 1-5, justificado con evidencia de ads |
| **Bloque de fuentes** | MCPs usados y no disponibles, fecha, confianza, re-corrida |

**Restricción:** 🛑 no decide campañas. Termina en terreno documentado.

---

## 3 · `plan-de-marketing.md` — M2-M4

### Sección 1 — Distribución del objetivo (M2)
| Sub-output | Qué es |
|---|---|
| **Tabla de distribución** | Fuente · % · número · supuesto · origen del supuesto · campaña |
| **Estado** | `PLAN` o `HIPÓTESIS` + qué se mide para convertirla |
| **Test de viabilidad** | CAC vs margen · volumen vs capacidad · horizonte vs ciclo de compra |
| **Parte no visible en el ciclo** | Lo que el ciclo de compra no deja ver a tiempo |

### Sección 2 — Mix (M3)
| Sub-output | Qué es |
|---|---|
| **Tipos seleccionados** | Con UNFAIR que apalancan, dueño y recursos |
| **Tipos descartados** | Con razón explícita |
| **Rol comercial por canal** | Rol de Strategy + puesto + naturaleza + formatos + métrica + techo |
| **Balance marca/respuesta** | En % de ciclo y en % de presupuesto |

### Sección 3 — Arquitectura (M4)
| Sub-output | Qué es |
|---|---|
| **Mapa de campañas** | Con naturaleza, función, traza, % del objetivo, ventana, presupuesto y dueño |
| **Filtro comercial aplicado** | Las 4 preguntas, campaña por campaña |
| **Campañas descartadas** | Cuáles y por qué |
| **Loops de crecimiento** | Qué deja cada campaña · o `no compounding` |
| **Renuncias de Marketing** | Qué no se hace este ciclo |

**Restricción:** 🚦 GATE M-2 — el gate más importante. Define en qué se gasta el ciclo entero.

---

## 4 · `campanas.md` — M4

| Sub-output | Qué es |
|---|---|
| **Ficha por campaña** | 18 campos, agrupadas en **orgánicas** y **pautadas** |
| **Los 7 mensajes base** | Problema · costo · deseo · mecanismo · prueba · objeción · acción |
| **Fases de la campaña** | Preparación · expectativa · lanzamiento · sostenimiento · cierre |
| **Campos extra de pauta** | Plataforma, objetivo, ángulos a testear, destino, criterio de corte |
| **Control del set** | 8 chequeos sobre el conjunto |

**Restricción:** no contiene copies, guiones ni conceptos creativos. Es el **brief**, no la pieza.

---

## 5 · `calendario-comercial.csv` — M5

12 columnas: `campana · fase · fecha_inicio · fecha_fin · hito · fecha_prep_inicio · dependencia ·
responsable · canal · naturaleza · funcion · estado`

**Restricción:** no reemplaza al `calendario-estrategico.csv` de Strategy. Se apoya sobre él.
Toda fila de lanzamiento lleva `fecha_prep_inicio` calculada hacia atrás.

---

## 6 · `volumen-y-presupuesto.md` — M6

| Sub-output | Qué es |
|---|---|
| **Volumen por campaña** | Piezas/día por formato y canal, con días activos y total |
| **Consolidado semanal** | Base + pico = total, contra capacidad real, con veredicto |
| **Recortes declarados** | Qué se recortó y por qué, si no cabía |
| **Distribución de presupuesto** | 5 partidas con % y detalle |
| **Pauta por bloque** | Por campaña y canal — nunca por día |
| **Orden de inversión** | Dónde está este cliente en la secuencia |

**Restricción:** el presupuesto pautado se entrega **asignado por bloque**. La distribución diaria
y el escalamiento son de Growth.

---

## 7 · `lectura-comercial.md` — M7

| Sub-output | Qué es |
|---|---|
| **Lectura por campaña** | Contra su **propia** función, no contra una métrica universal |
| **Lectura de la distribución** | Planificado vs real, supuesto por supuesto |
| **Aprendizajes de ángulo** | Qué escala, qué se corta, qué se itera |
| **Objeciones y lenguaje nuevo** | Van a Strategy y a Creative |
| **Plan de iteración** | Una variable por vez |
| **Salidas a departamentos** | Con estado enviado/pendiente |
| **⟲ Retornos a estrategia** | Si algo del nivel marca hay que redecidir |
| **Campañas que compusieron** | Qué dejó cada una · o `no compounding` |

---

# B · Outputs de sesión *(en la conversación, no en archivo)*

| Output | Cuándo |
|---|---|
| **Pre-flight** | Al inicio de toda sesión |
| **Veredicto de frontera** | Cuando el pedido pisa otro departamento |
| **Bloque ⟲ RETORNO A ESTRATEGIA** | Cuando algo del nivel marca no se sostiene |
| **Resultado de QA gate** | Antes de entregar cualquier fase |
| **Pedido de decisión humana** | En cada gate |

---

# C · Outputs de handoff *(bloques a otros departamentos)*

| Destino | Qué recibe |
|---|---|
| **Creative** | Briefs de campaña: avatar, consciencia, ángulo, objeción, 7 mensajes, volumen y formato |
| **Growth** | Campañas pautadas con objetivo, ventana y presupuesto por bloque · mecánicas promocionales `PENDIENTE` · supuestos de conversión |
| **Content / Social** | Calendario comercial aprobado + volumen por canal y formato |
| **Production** | Total de piezas por formato y semana + fechas de preparación |
| **Analytics** | Métrica por campaña según su función + supuestos a validar |

---

# D · Outputs externos *(solo con gate humano)*

| Destino | Qué | Condición |
|---|---|---|
| **Notion** | Plan y campañas publicados en el workspace | Gate M-2 pasado |
| **Google Drive** | Entregable formateado para el cliente | Gate M-2 y M-3 pasados |
| **Eden** | Board con la evidencia del research comercial | Sin gate — es evidencia, no decisión |

🛑 **Nunca sin autorización explícita:** publicar, programar, pautar, pausar campañas, enviar al
cliente, escribir en cuentas del cliente.

---

## Lo que Marketing NO produce, nunca

| No produce | De quién es |
|---|---|
| Posicionamiento, territorio, enemigo, promesa | Strategy |
| Ingeniería inversa de media orgánica, CEPs, mapas | Strategy |
| Precio, money model, estructura de oferta, funnel | Growth |
| Estructura de cuenta de ads, pujas, optimización diaria | Growth |
| Guidelines visuales, paleta, tipografía, sistema de tono | Branding |
| Copies, guiones, conceptos creativos, ideas de pieza | Creative |
| Assets, shot lists, edición | Production |
| Publicaciones programadas, community management | Content |
