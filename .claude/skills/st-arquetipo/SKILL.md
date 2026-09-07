---
name: st-arquetipo
description: >
  Clasifica al cliente por 8 ejes y le asigna uno de los 11 arquetipos de empresa de Inherent.
  Úsala como cierre obligatorio de la Capa 0, o cuando alguien pregunte "qué tipo de empresa es
  este cliente", "esto aplica igual para un restaurante que para una marca personal", o cuando una
  capa posterior necesite saber qué canales, métricas y motor de demanda corresponden.
  Un restaurante no es una marca personal — esta skill evita aplicarles la misma estrategia.
---

# Clasificación por Arquetipo

Leé `agents/strategy/archetypes/README.md` completo.

## Proceso

**1. Respondé los 8 ejes.** Sin dato: `⚠️ SIN DATOS` — no inventes.
```
1 Quién compra · 2 Qué se vende · 3 Ticket y ciclo · 4 Frecuencia
5 Geografía · 6 Dónde vive la confianza · 7 Motor de demanda · 8 Límite de escala
```

**2. Aplicá el árbol de decisión** del README. La primera pregunta que resuelve, gana.

**3. Declará el resultado:**
```
Arquetipo dominante: NN — [nombre]
Modificador: NN — [nombre]  (o: ninguno)
Por qué: [una línea]
```

**4. Leé la ficha completa** `archetypes/NN-*.md` antes de seguir a la Capa 1.

## Reglas duras
- **Híbridos:** el dominante es el que manda en el ingreso. Define métricas y canal principal.
  El modificador define mecanismo de confianza y tono. **Nunca se promedian** — eso produce una
  estrategia que no sirve para ninguno de los dos.
- **La ficha es punto de partida, no verdad.** Si la evidencia de la Capa 1 la contradice, gana la
  evidencia — y se anota la contradicción para revisar la ficha.
- Los ejes 7 (motor de demanda) y 8 (límite de escala) son los que más cambian la estrategia.
  Si están en `⚠️ SIN DATOS`, decílo explícitamente: la estrategia queda con confianza reducida.

## Output
Sección D de `nucleo.md`.
