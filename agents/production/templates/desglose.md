# Desglose — [Cliente]
**Campaña(s):** [nombres] · **Ciclo:** [bloque]
**Capa 1**

> **Se desglosa lo pedido.** 🛑 No se agrega ninguna escena que ④ Creatividad no haya pedido: una
> escena agregada acá no tiene `traza_a_must_be_true`.

---

## Mapa fila creativa → escenas

| `id_creativo` | Escenas pedidas | Filas de producción |
|---|---|---|
| C-001 | E1 · E2 · E3-E5 | P-001 · P-002 · P-003 |
| | | |

---

## Desglose por escena

*(Una ficha por escena. Las 8 categorías, siempre. Lo que no aplica dice `N/A`, nunca vacío.)*

### `P-00N` — [`id_creativo`] · [escena]

**Heredado de ④ Creatividad** *(literal, no parafraseado)*

| | |
|---|---|
| **Acción** | [copiada literal de `escenas`] |
| **Encuadre** | [copiado literal de `encuadres`] |
| **Duración** | [seg] |
| **Tipo de lugar** | [lo que pidió Creatividad, como concepto] |
| **Mood** | [de `estetica_mood`] |
| **Emoción a dirigir** | [de `emocion`] |

**Las 8 categorías**

| # | Categoría | Qué hace falta |
|---|---|---|
| 1 | **Locación** | [lugar concreto] · int/ext · día/noche · acceso · electricidad · ruido |
| 2 | **Talento** | [quién] · rostro / cuerpo / manos / voz · ¿habla? |
| 3 | **Producto** | [qué] · [n unidades] · estado · quién lo provee |
| 4 | **Props** | [uno por uno, nunca "lo de siempre"] |
| 5 | **Vestuario** | [prendas] · de quién sale · quién la lleva el día |
| 6 | **Arte y ambientación** | Qué se monta o se quita para lograr el mood |
| 7 | **Equipo técnico** | [derivado del encuadre] cámara · óptica · soporte · luz · audio |
| 8 | **Permisos y legales** | Locación · cesión de imagen · música · seguro |

**Observaciones:** [imposibilidades detectadas → van a la sección F del brief]

---

## Inventario consolidado del ciclo

*(Todo lo que hay que conseguir, sin repetir. Es el input de la Capa 3.)*

### Locaciones
| Locación | Escenas que la usan | Int/Ext | Permiso necesario |
|---|---|---|---|

### Talento
| Persona | Tipo de participación | Escenas | ¿Habla? | Cesión necesaria |
|---|---|---|---|---|

### Producto
| Producto | Unidades | ¿Se destruye en cuadro? | Quién lo provee |
|---|---|---|---|

### Props
| Prop | Escenas | Origen previsto |
|---|---|---|

### Vestuario
| Prenda | Para quién | Escenas | Verificado sin logos/rayas/verde |
|---|---|---|---|

### Arte y ambientación
| Qué se monta o se quita | Locación | Tiempo estimado |
|---|---|---|

### Equipo
| Ítem | Escenas que lo necesitan | ¿Propio? |
|---|---|---|

### Permisos
| Permiso | Para qué | Quién lo autoriza | Plazo de gestión |
|---|---|---|---|

---

## Marcas de imposibilidad

| `id` | Qué no se puede conseguir | Alternativa propuesta | ¿Devuelto a ④? |
|---|---|---|---|
