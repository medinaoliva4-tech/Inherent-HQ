---
name: mk-volumen-presupuesto
description: >
  Fase M6 del método de Marketing — la bajada operativa. Define cuántas piezas por día y por formato
  se publican en cada canal durante cada campaña (cuántos reels, historias, carruseles y estáticos),
  verifica que el total semanal quepa en la capacidad de producción real, y reparte el presupuesto
  del ciclo por partida, canal y campaña. Úsala cuando pidan "cuántos reels por día", "cuántas
  historias", "la frecuencia de contenido de la campaña", "cuánto invertimos en cada canal",
  "el presupuesto de marketing", "cuánto va a pauta". Requiere campañas y calendario aprobados.
  El pico de campaña se suma a la cadencia base de Strategy, no la reemplaza.
---

# M6 — Volumen y presupuesto

Leé `agents/marketing/METHOD.md` sección **M6** y `agents/marketing/playbooks/CANALES.md`.
Plantilla: `agents/marketing/templates/volumen-y-presupuesto.md`
**Input obligatorio:** `campanas.md` + `calendario-comercial.csv` aprobados

## La regla del apilado

```
VOLUMEN TOTAL = cadencia base (calendario-estrategico.csv)  +  pico de campaña (acá)
```

El pico **se suma**, no reemplaza. La cadencia base es el suelo que sostiene la marca entre campañas.

## Cómo se decide el volumen diario

```
1. ¿Qué función cumple el canal en ESTA campaña?  → mix de formatos
2. ¿En qué fase está la campaña?                  → intensidad
3. ¿Cuál es la cadencia base comprometida?        → el piso
4. ¿Qué aguanta la capacidad real?                → el techo duro (nucleo.md)
```

| Fase | Intensidad | Qué domina |
|---|---|---|
| Preparación | Base | Nada público cambia |
| Expectativa | Base + poco | Historias y piezas cortas de tensión |
| **Lanzamiento** | **El pico** | Todos los formatos, todos los canales, el mismo día |
| Sostenimiento | Medio, sostenido | Baja el orgánico, sube la pauta |
| Cierre | Corto y alto | Urgencia: historias y recordatorios |

## El test de capacidad — el chequeo que salva el plan

> Se suma **todo** el volumen de **todas** las campañas activas en la **misma semana**, más la base,
> y se contrasta contra la capacidad de `nucleo.md`.

**Nunca campaña por campaña.** Ese es el error que hace que los planes se caigan en la semana 3.

| Resultado | Qué se hace |
|---|---|
| **Cabe** | Se declara el margen restante |
| **No cabe** | Se recorta: primero menor traza, después frecuencia. **Se declara qué se recortó** |
| **Sin datos de capacidad** | `⚠️ SIN DATOS` + volumen como propuesta a validar con producción |

## Presupuesto

```
├── Pauta                  → por canal y campaña, EN BLOQUES (el día a día es de Growth)
├── Creadores              → seeding (producto) + pago
├── Eventos y activaciones
├── Producción
└── Reserva de prueba      → MÍNIMO 10%
```

**Controles:**
- El split marca/respuesta en plata coincide con el balance de M3.3
- El costo por resultado implícito cabe en el **CAC máximo tolerable** (M1.4)
- El total coincide con `plan-de-marketing.md` §3.1

> **Sin presupuesto de prueba, el plan no aprende.** Y todo formato caro se valida antes en formato
> barato: el estático prueba el ángulo, el video producido lo escala.

## Orden de inversión (presupuesto limitado o poca data)

```
1. Estáticos de prueba de ángulos → 2. UGC simple → 3. Landing optimizada
→ 4. Creadores chicos → 5. Campañas grandes → 6. Eventos y partnerships
```

## Cierre
Correr el bloque **M6** de `agents/marketing/qa/QA-GATES.md`.
🚦 **GATE M-4** — el volumen y el presupuesto los aprueba un humano.
Emitir el bloque **HANDOFF** de `agents/marketing/PROCESS.md` → Creative, Growth, Content,
Production y Analytics.
