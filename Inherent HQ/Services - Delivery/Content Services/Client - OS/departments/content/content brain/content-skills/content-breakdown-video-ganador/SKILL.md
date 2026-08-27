---
name: content-breakdown-video-ganador
description: Analiza un video ganador (extraído de la plataforma de indexación tipo Jockey/Twelve Labs) y lo desglosa en sus elementos constitutivos — b-roll, transiciones IA, tipografía, efectos, ritmo/timing — para generar un plan concreto de qué assets producir antes de tocar After Effects. USA ESTE SKILL SIEMPRE que haya que decidir qué video producir según el calendario/estrategia, cuando se aplique la regla 70/20/10 (reproducir formato aprobado, iterar uno experimental, o reciclar un ganador previo), o cuando el CEO pida "haz un video como [ganador X]". Es un requisito BLOQUEANTE antes de `content-motion-produccion-ae` — no se produce un asset motion sin este plan. No usar para validar el concepto narrativo desde cero (usa `content-preproduccion-concepto` para eso primero si es un formato nuevo).
---

# Breakdown de Video Ganador

## JOB
Convertir un video ganador en un plan de producción accionable: qué assets hay que generar, en qué herramienta, y qué elemento visual de la marca debe estar presente en cada uno — para que la producción en After Effects no empiece a ciegas.

## Por qué existe este skill
Reproducir o iterar un ganador sin desglosarlo primero produce dos fallas comunes: (1) se copia el "look" pero se pierde el elemento específico que lo hizo funcionar (ej. un tipo de transición, no el color), o (2) se produce con IA genérica (Higgsfield u otra) sin adaptarla a marca, y el resultado se ve plantilla. Este skill fuerza el análisis elemento por elemento antes de producir, siguiendo la metodología de teardown + style frames usada en creative operations de performance.

## INPUT requerido
- Video ganador identificado (desde el calendario/estrategia de Growth, o pedido explícito del CEO).
- Clasificación según la regla 70/20/10: ¿es (a) formato ya aprobado que se reproduce igual, (b) formato nuevo experimental, o (c) ganador anterior que se recicla? Pregunta si no está claro — la clasificación cambia cuánto desglose hace falta (un formato 100% aprobado necesita menos reinterpretación que uno experimental).
- Acceso al video vía la plataforma de indexación (Jockey/Twelve Labs) para extraerlo.
- `design-system-map.md` del cliente (para saber qué variables de marca deben reemplazar los elementos genéricos del ganador si es de otra marca/competidor).

## ACTIONS (en este orden)

### 1. Clasificar el video según 70/20/10
Etiqueta explícitamente: **[Aprobado / Experimental / Reciclado]**. Esto determina el nivel de fidelidad al original que se busca (alto en Aprobado, bajo/creativo en Experimental).

### 2. Extraer el video de la plataforma de indexación
Usa Jockey/Twelve Labs para localizar y traer el segmento exacto (no la pieza completa si solo un fragmento es relevante).

### 3. Desglose shot-by-shot
Para cada corte/escena, documenta:
- Duración del shot
- Elemento gráfico presente (b-roll, texto en pantalla, gráfico, producto)
- Tipo de transición (corte seco, whip pan, morph con IA, dissolve, etc.)
- Si hay efectos generados por IA (identifícalos específicamente — no los agrupes como "efectos")
- Tipografía usada (estilo, no solo "hay texto")

### 4. Identificar qué es reproducible vs. qué requiere generación nueva
Marca cada elemento como: **[Reutilizar asset de marca existente / Generar con Higgsfield / Producir en Figma / Grabar footage real]**. No asumas que todo se genera con IA — algunos elementos (logo, producto real) deben ser assets de marca reales, no generados.

### 5. Verificar el ritmo/hook contra benchmarks
Si hay datos de performance disponibles (hook rate, hold rate, thumbstop rate), identifica en qué segundo ocurre el hook y qué elemento lo sostiene. Esto es lo que se debe preservar sin importar cuánto se itere el resto.

### 6. Consolidar el plan de assets
Lista final: cada elemento identificado en el paso 3-4, con su método de producción y a qué herramienta se entrega (Figma para gráficos on-brand, Higgsfield para b-roll/transiciones IA, cámara para footage real).

## OUTPUT
```
# Breakdown — [nombre del video ganador]

## Clasificación 70/20/10
[Aprobado / Experimental / Reciclado]

## Desglose shot-by-shot
| Shot | Duración | Elemento gráfico | Transición | Efecto IA | Tipografía |
|------|----------|-------------------|------------|-----------|------------|

## Hook y elemento que lo sostiene
[segundo] — [qué elemento visual/textual lo logra]

## Plan de assets a producir
| Elemento | Método | Herramienta | Prioridad |
|----------|--------|--------------|-----------|

## Notas de fidelidad al original
[qué se debe preservar exacto vs. qué es libre de reinterpretar]
```

## CONTEXT que debes leer antes de generar
- Calendario/estrategia del cliente (Growth)
- `design-system-map.md` del Client-OS
- Datos de performance del video ganador si existen (hook/hold/thumbstop)

## QA
Antes de pasar a producción, verifica: ¿el plan de assets, si se ejecuta tal cual, reconstruiría el elemento que hizo ganar al video original (no solo su estética superficial)? Si no puedes señalar ese elemento específico, el breakdown está incompleto.

## HANDOFF
- A `content-motion-produccion-ae` con el plan de assets como INPUT obligatorio.
- Si el video es clasificado como "Experimental" y aún no tiene concepto narrativo validado, primero pasa por `content-preproduccion-concepto`.

## Nota de entorno (Chat vs Cowork)
- **Cowork:** este skill requiere acceso a la plataforma de indexación de video (Jockey/Twelve Labs) para extraer y ver el video real — no lo desgloses de memoria o de una descripción de texto.
- **Chat:** si no hay acceso a la plataforma, pide al CEO que describa o comparta el video/frames clave, y sé explícito en el output de que el desglose es a partir de descripción, no de análisis directo del archivo.
