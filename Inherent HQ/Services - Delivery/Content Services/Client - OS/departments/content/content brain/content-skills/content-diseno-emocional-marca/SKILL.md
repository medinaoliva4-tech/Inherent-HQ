---
name: content-diseno-emocional-marca
description: Traduce un objetivo emocional o de venta (urgencia, confianza, deseo, FOMO, aspiración, calma) en decisiones CONCRETAS de diseño — color, tipografía, composición, contraste, ritmo — dentro de los límites del arquetipo de marca del cliente. USA ESTE SKILL SIEMPRE antes de producir un asset estático o motion cuando el brief menciona una emoción/reacción que se busca provocar, o cuando el CEO pide "que se sienta más urgente/premium/confiable/etc." Es un requisito de INPUT para `content-estatico-produccion-figma` y `content-motion-produccion-ae` — no un documento decorativo. No usar para definir el arquetipo o tono general de la marca (eso es `brand-positioning-cbbe`); este skill aplica un arquetipo ya definido a UNA pieza concreta.
---

# Diseño Emocional Aplicado a Marca

## JOB
Cerrar la brecha entre "queremos que esto venda/genere urgencia/inspire confianza" y una instrucción de diseño ejecutable — sin dejar la interpretación emocional a la subjetividad de quien produce la pieza.

## Por qué existe este skill
La teoría de diseño emocional (Conversion-Centered Design de Oli Gardner, psicología del color aplicada a ads) demuestra que decisiones específicas de color/tipografía/composición mueven conversión de forma medible: un botón rojo bien contrastado puede superar a uno verde por ~21% en ciertos contextos; una imagen que expresa el beneficio emocional (o agita el dolor) supera a una genérica. Pero estos efectos dependen del contexto de marca y contraste — no son leyes universales. Este skill obliga a razonar el "por qué" antes de elegir, y deja ese razonamiento documentado para que el equipo de producción no reinvente la decisión en cada pieza.

## INPUT requerido
- Objetivo emocional/de venta de la pieza (pregunta si el brief no lo especifica explícitamente: ¿urgencia, confianza, deseo, FOMO, aspiración, calma?).
- `positioning.md` del Client-OS (arquetipo de marca — las decisiones emocionales nunca deben contradecir el arquetipo).
- `design-system-map.md` (de `content-brand-system-figma`, si ya existe) — para saber qué variables ya están disponibles.

**Bloqueante:** si el objetivo emocional no está claro ni es inferible del brief/calendario, pregunta al CEO antes de asumir. No hay decisión de diseño correcta sin un objetivo emocional definido primero.

## ACTIONS (en este orden)

### 1. Fijar el objetivo emocional único
Una pieza, una emoción dominante. Si el brief pide dos (ej. "urgencia y confianza"), fuerza una jerarquía: ¿cuál domina el hook y cuál sostiene el cierre? No mezcles ambas con el mismo peso.

### 2. Verificar compatibilidad con el arquetipo
Contrasta contra `positioning.md`. Ejemplo: una marca arquetipo "Sabio/Confiable" no debe usar urgencia agresiva tipo "compra YA" con rojo saturado — mejor una urgencia calmada (escasez informativa, countdown sobrio). Si hay tensión entre el objetivo pedido y el arquetipo, repórtalo explícitamente en vez de resolverlo en silencio.

### 3. Traducir a color
Usa como base (ajustable según marca y contraste real disponible):
- Urgencia/FOMO → rojo/naranja, alto contraste, saturación alta
- Confianza → azul, espacio abierto, saturación media-baja
- Deseo/aspiración → paleta cálida de la escena, color grading warm
- Calma/premium → paleta reducida, alto espacio negativo, saturación baja
Selecciona la variable específica del design system del cliente — no un hex genérico.

### 4. Traducir a tipografía y composición
- Urgencia → tipografía condensada/pesada, jerarquía agresiva, poco espacio negativo
- Confianza → tipografía limpia (serif clásica o geométrica sans), composición balanceada, más aire
- Deseo → tipografía expresiva/editorial, composición que centra la imagen sobre el texto
- Calma/premium → mucho espacio negativo, jerarquía sutil, tipografía ligera

### 5. Traducir a ritmo (solo si aplica a motion)
- Urgencia → cortes rápidos, poco ease, música con tempo alto
- Confianza → cortes más largos, ease in/out suave, respiración entre escenas
- Deseo → timing cinematográfico, cámara lenta en el momento clave

### 6. Documentar la decisión, no solo el resultado
El output debe explicar el "por qué", para que sea auditable y reutilizable.

## OUTPUT
```
# Decisión de Diseño Emocional — [pieza]

## Objetivo emocional dominante
[urgencia/confianza/deseo/FOMO/aspiración/calma]

## Compatibilidad con arquetipo
[compatible / tensión detectada — explicar]

## Color
[variable(s) del design system] — [por qué]

## Tipografía y composición
[decisión] — [por qué]

## Ritmo (si aplica motion)
[decisión] — [por qué]
```

## CONTEXT que debes leer antes de generar
- `positioning.md` del Client-OS
- `design-system-map.md` del Client-OS (si existe)
- Brief/calendario del CEO o de Growth para esta pieza

## QA
Pregunta de control: "¿alguien que vea esta pieza sin leer el brief identificaría la emoción dominante en menos de 2 segundos?" Si la respuesta no es un sí claro, la decisión no está lo suficientemente traducida a diseño — vuelve al paso 3-5.

## HANDOFF
- A `content-estatico-produccion-figma` o `content-motion-produccion-ae` como INPUT obligatorio, no opcional.
- Si detecta tensión irresuelta con el arquetipo, escala al CEO antes de producir.

## Nota de entorno (Chat vs Cowork)
Este skill es puramente de razonamiento/documentación — funciona igual en Chat y en Cowork. La diferencia es solo dónde se guarda el output: en Cowork, escríbelo directamente en el Client-OS; en Chat, entrégalo en la conversación para que el CEO decida dónde guardarlo.
