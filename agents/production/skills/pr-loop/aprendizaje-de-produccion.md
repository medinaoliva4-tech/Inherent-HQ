# Aprendizaje de Producción — [Cliente]
**Campaña(s):** [nombres] · **Ciclo:** [bloque] · **Fecha:** [aaaa-mm-dd]
**Capa 7** · Plantilla de la skill `pr-loop`

> Mide **ejecución**, no resultado creativo ni de negocio. Si una pieza no funcionó, eso lo lee
> ④ Creatividad en su propia Capa 7.

**Fuentes:** `presupuesto.csv` (con `costo_real` cargado) · `plan-de-produccion.csv` ·
`plan-de-rodaje.md`, la sección de su jornada (jornadas y tiempos) · `plan-de-rodaje.md` § La entrega (manifiesto de entrega).
Archivo **interno**: no se entrega al cliente, pero se guarda en la carpeta del cliente.

---

## 1. Desvío de costo

*(por las categorías cerradas de `presupuesto.csv`)*

| Categoría | Estimado | Real | Desvío | Qué lo explica |
|---|---|---|---|---|
| `locacion` | | | | |
| `talento` | | | | |
| `equipo` | | | | |
| `arte-props` | | | | |
| `vestuario` | | | | |
| `transporte` | | | | |
| `alimentacion` | | | | |
| `post-base` | | | | |
| **`contingencia` consumida** | | | | |
| **TOTAL CICLO** | | | | |

**Por jornada** *(el total esconde la jornada que se pasó)*

| Jornada | Estimado | Real | Desvío | Qué lo explica |
|---|---|---|---|---|
| J1 | | | | |

**Los 3 ítems que más se pasaron**

| Ítem | Estimado | Real | Por qué | Corrección propuesta para `pr-presupuesto` |
|---|---|---|---|---|

> 🛑 `costo_real` tiene que estar cargado en **todas** las filas, aunque coincida con el estimado.
> Sin eso se pierde la mitad de la muestra, y el próximo ciclo se estima a ojo otra vez.

---

## 2. Desvío de tiempo

| `id` | Escena | Estimado (min) | Real (min) | Desvío | Qué lo explica |
|---|---|---|---|---|---|

**Por tipo de actividad**

| Actividad | Margen usado en `pr-rodaje` | Real promedio | ¿Se corrige? |
|---|---|---|---|
| Montaje inicial | 60-90 min | | |
| Cambio de setup de luz | 30-45 min | | |
| Cambio de locación | 60 min + traslado | | |
| Desmontaje | 45 min | | |
| Escena simple | | | |

*(Un margen que falló tres ciclos seguidos deja de ser estimación y pasa a ser dato.)*

---

## 3. Material no usado — **el hallazgo más valioso**

| `id_creativo` | Escena | `estado` en el Excel | ¿⑥A o ⑥B la usaron? | Costo de haberla grabado |
|---|---|---|---|---|

```
Escenas grabadas: [n]
Escenas efectivamente usadas: [n]
% no usado: [x] %
Costo del material no usado: [monto]
```

**Lectura:** hasta ~15 % es normal · 20-30 % hay un patrón · **> 30-40 % el problema no está en
producción**: el Excel creativo pidió cobertura que la pieza final no necesitaba.

**↩️ Devolución a ④ Creatividad — como dato, no como reclamo:**

| Qué se grabó y no se usó | Patrón que se repite | Propuesta para el próximo ciclo |
|---|---|---|

---

## 4. Factor de consolidación

```
Previsto: [x.x]   ([n] escenas ÷ [n] jornadas)
Real:     [x.x]   ([n] escenas ÷ [n] jornadas)
```

| Si el real fue peor | Dónde se perdió |
|---|---|
| Jornada extra no prevista | [por qué] |
| Escena que se cayó y hubo que recuperar | [cuál y por qué] |
| Locación que no sirvió | [cuál] |

**Corrección propuesta para `pr-jornadas`:** [qué se aprendió]

---

## 5. Corrección de capacidad → ① Comprensión

> 🛑 **Se redacta como propuesta.** Es la única corrección que Producción hace sobre un documento de
> otro departamento, y **nunca se edita su archivo.**

| | Declarado en ① | Real este ciclo | Diferencia |
|---|---|---|---|
| Piezas producidas por ciclo | | | |
| Jornadas disponibles reales | | | |
| Costo real por pieza | | | |

**Propuesta de actualización:**
> [Texto sugerido para la sección de capacidad de ① Comprensión, con el dato real y su fuente.]

---

## 6. Qué sube a las skills

🛑 **Nada sube con un solo ciclo de evidencia.** Tres ciclos seguidos en la misma dirección.

| Skill | Qué se actualiza | Dato nuevo | Ciclos de evidencia |
|---|---|---|---|
| `pr-desglose` | Tiempos de referencia por escena | | |
| `pr-jornadas` | Factor y carga por jornada | | |
| `pr-recursos` | Márgenes de confirmación por origen | | |
| `pr-presupuesto` | Costos de referencia · contingencia por perfil | | |
| `pr-rodaje` | Márgenes de montaje, setup, traslado y desmontaje | | |

---

## 7. Lo que se hace distinto el próximo ciclo

| # | Cambio | Por qué | Dónde se aplica |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

**Estado de datos**
- `costo_real` cargado: [✅ todas las filas / ⬜ faltan [n]] · Fecha del corte: [fecha]
- ⚠️ SIN DATOS — [qué falta y a quién pedírselo]
- 🛑 **Ningún desvío inventado.** Confianza del aprendizaje: 🟢 / 🟡 / 🔴
