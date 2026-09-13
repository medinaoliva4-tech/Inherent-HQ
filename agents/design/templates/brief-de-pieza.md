# Brief de pieza — `<id_pieza>`

> Media carilla. **Si crece, la pieza está mal definida.**

| | |
|---|---|
| **Cliente** | |
| **Pieza** | `<id_pieza>` |
| **Fecha de publicación** | |
| **Canal · Formato** | |
| **Función · Pilar · Temperatura** | *(vienen del calendario / Strategy)* |
| **Traza al calendario** | |
| **Es para pauta** | sí / no |

---

## 1 · Mensaje único
> Una oración. La única cosa que esta pieza tiene que dejar.

*(Si necesitás dos oraciones, son dos piezas. Marcalo y consultá.)*

---

## 2 · Jerarquía 1-2-3

| Nivel | Contenido | Cómo gana peso |
|---|---|---|
| **1** | | tamaño / contraste / área / posición — al menos dos |
| **2** | | |
| **3** | | |

*(Exactamente tres. Si no podés nombrarlos, el layout está mal elegido.)*

---

## 3 · Layout base
**Elegido:** `<nombre del layout de D0.7>`
**Por qué:**
**Descartados:**

---

## 4 · Par de color

| Fondo | Texto | Ratio medido | Veredicto |
|---|---|---|---|
| | | | ✅ / ⚠️ / 🛑 |

**Scrim (si va sobre foto):** `color/scrim/<intensidad>` — ratio post-scrim:
**Acento (máx. 1):** — marca:

---

## 5 · Escala tipográfica

| Rol | Token | Tamaño | Contenido |
|---|---|---|---|
| Titular | | | |
| Subtítulo | | | |
| Cuerpo | | | |
| Micro | | | |

**Cortes de línea del titular:**
```
línea 1 /
línea 2
```

---

## 6 · Presupuesto gráfico
> Máximo **3 familias**. Cada una con un rol declarado.

| Familia | Elemento | Rol |
|---|---|---|
| | | |
| | | |
| | | |

**Descartados y por qué:**

---

## 7 · Restricciones del canal

| | |
|---|---|
| Safe areas | |
| Slides (si es carrusel) | |
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
| Sustracción | D4 | qué sobró |

**Dos NO en D3 → volver al layout. No se arregla en D4.**
