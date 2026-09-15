# Aprendizaje de Producción — [Cliente]
**Campaña(s):** [nombres] · **Ciclo:** [bloque] · **Fecha:** [aaaa-mm-dd]
**Capa 7**

> Mide **ejecución**, no resultado creativo ni de negocio. Si una pieza no funcionó, eso lo lee
> ④ Creatividad en su propia Capa 7.

---

## 1. Desvío de costo

| Bloque | Estimado | Real | Desvío | Qué lo explica |
|---|---|---|---|---|
| Fijos de jornada | | | | |
| Talento | | | | |
| Variables por escena | | | | |
| Post base | | | | |
| **Contingencia consumida** | | | | |
| **TOTAL** | | | | |

**Los 3 ítems que más se pasaron**

| Ítem | Estimado | Real | Por qué | Corrección para `toolkit/06` |
|---|---|---|---|---|

> 🛑 `costo_real` tiene que estar cargado en **todas** las filas, aunque coincida con el estimado.
> Sin eso se pierde la mitad de la muestra.

---

## 2. Desvío de tiempo

| `id` | Escena | Estimado (min) | Real (min) | Desvío | Qué lo explica |
|---|---|---|---|---|---|

**Por tipo de actividad**

| Actividad | Margen usado en `toolkit/04` | Real promedio | ¿Se corrige? |
|---|---|---|---|
| Montaje inicial | 60-90 min | | |
| Cambio de setup de luz | 30-45 min | | |
| Ambientación | 30-120 min | | |
| Escena simple | 20-30 min | | |

*(Un margen que falló tres ciclos seguidos deja de ser estimación y pasa a ser dato.)*

---

## 3. Material no usado — **el hallazgo más valioso**

| `id_creativo` | Escena | ¿Se grabó? | ¿⑥A la usó? | Costo de haberla grabado |
|---|---|---|---|---|

```
Escenas grabadas: [n]
Escenas efectivamente usadas: [n]
% no usado: [x] %
Costo del material no usado: [monto]
```

**Lectura:** si el % no usado supera el 30 %, el problema **no está en producción**: el Excel
creativo pidió cobertura que la pieza final no necesitaba.

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

**Corrección para `playbooks/CONSOLIDACION.md`:** [qué se aprendió]

---

## 5. Corrección de capacidad → ① Comprensión

> 🛑 **Se redacta como propuesta.** Producción **nunca edita el archivo de otro departamento**.

| | Declarado en ① | Real este ciclo | Diferencia |
|---|---|---|---|
| Piezas producidas por ciclo | | | |
| Jornadas disponibles reales | | | |
| Presupuesto real por pieza | | | |

**Propuesta de actualización:**
> [Texto sugerido para la sección de capacidad de ① Comprensión, con el dato real y su fuente.]

---

## 6. Qué sube al toolkit

| Ficha | Qué se actualiza | Dato nuevo |
|---|---|---|
| `01-desglose.md` | Tiempos de referencia | |
| `02-locaciones.md` | Costos de referencia | |
| `04-equipo.md` | Tiempos de setup | |
| `06-presupuesto.md` | Contingencia por perfil | |

---

## 7. Lo que se hace distinto el próximo ciclo

| # | Cambio | Por qué | Dónde se aplica |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

**Sin datos:** `⚠️ SIN DATOS` + a quién pedírselos. 🛑 **Ningún desvío inventado.**
