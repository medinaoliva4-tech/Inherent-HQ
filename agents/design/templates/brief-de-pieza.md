# Brief de pieza — `<id_pieza>`

> Media carilla. **Si crece, la pieza está mal definida.**
> **Campos 1-3: los decide Creative** — se leen del plan de ejecución, no se inventan.
> **Campos 4-8: los resuelve Diseño.**

| | |
|---|---|
| **Cliente** | |
| **Pieza** | `<id_pieza>` |
| **Fecha de publicación** | |
| **Canal · Formato · Dimensiones** | |
| **Traza al calendario creativo** | |
| **Es para pauta** | sí / no |
| **Lleva elemento animado** | sí / no |

---

# ▸ De Creative

## 1 · Goal del arte final
> vender · educar · anunciar · dar autoridad · retargeting · lanzamiento · comunidad

## 2 · Mensaje único
> Una oración. La única cosa que esta pieza tiene que dejar.

*(Si el brief trae dos ideas, son dos piezas. Marcalo y devolvelo.)*

## 3 · Jerarquía del mensaje

| Nivel | Contenido (literal, de Creative) |
|---|---|
| **1** | |
| **2** | |
| **3** | |

🛑 **Diseño no reordena estos niveles.** Si no entran en el formato, se propone y se pregunta.

### Estado del brief creativo
- [ ] ✅ Ejecutable
- [ ] 🛑 `BLOQUEADO — [qué falta]` → devolución a Creative
- [ ] ⚠️ `OBSERVADO — [qué propongo cambiar y por qué]` → esperando respuesta

---

# ▸ De Diseño

## 4 · Componente / layout base
**Elegido:** `<nombre del componente de D0.7>`
**Por qué:**
**Descartados:**

## 5 · Cómo se logra visualmente la jerarquía

| Nivel | Gana por | Verificado |
|---|---|---|
| **1** | tamaño · contraste · área · posición *(al menos dos)* | ⬜ |
| **2** | | ⬜ |
| **3** | | ⬜ |

## 6 · Par de color

| Fondo | Texto | Ratio medido | Veredicto |
|---|---|---|---|
| | | | ✅ / ⚠️ / 🛑 |

**Scrim (si va sobre foto):** `color/scrim/<intensidad>` — ratio post-scrim:
**Acento (máx. 1):** — qué marca:

### Escala tipográfica
| Rol | Token | Tamaño | Contenido |
|---|---|---|---|
| Titular | | | |
| Subtítulo | | | |
| Cuerpo | | | |
| Micro | | | |

**Cortes de línea del titular** *(a mano, por unidad de sentido)*:
```
línea 1 /
línea 2
```

## 7 · Presupuesto gráfico
> Máximo **3 familias**. Cada una con un rol declarado. Un animado cuenta como una.

| Familia | Elemento | Rol |
|---|---|---|
| | | |
| | | |
| | | |

**Descartados y por qué:**

## 8 · Restricciones del canal

| | |
|---|---|
| Safe areas | |
| Slides (si es carrusel) · seamless sí/no | |
| Densidad de texto (si es pauta) | |
| Recorte de grilla de perfil | aplica / no aplica |

---

## Assets

| Asset | Ruta | Estado |
|---|---|---|
| | | ✅ / `⚠️ ASSET FALTANTE` / `⚠️ ASSET INSUFICIENTE` / `[asset generado]` |

---

## Tests

| Test | Capa | Resultado |
|---|---|---|
| Miniatura (10%) | D3 | SÍ / NO |
| Gris | D3 | SÍ / NO |
| **Atención** — ¿lo primero que se ve es el nivel 1? | D3 | SÍ / NO |
| Sustracción | D4 | qué sobró |
| Anti-slop (`brain/CRITERIO-VISUAL.md` §6) | D4 | ⬜ pasa / 🛑 slop |

**Un NO en D3 → volver al componente. No se arregla en D4.**
