# 06 · Presupuesto
`Capa 4 · columnas: costo_estimado, costo_real`

**Qué decide.** Cómo se estructura el costo del ciclo, cuánta contingencia lleva y cómo se calcula
el costo por pieza.

> 🛑 **Se cuesta por jornada, no por pieza.** Costear por pieza duplica todos los fijos y es el error
> que infla los presupuestos entre 3 y 5 veces.

---

## La estructura — 5 bloques

| Bloque | Qué entra | Se cuesta por |
|---|---|---|
| **1 · Fijos de jornada** | Locación · equipo · traslado · catering · asistencia | Jornada |
| **2 · Talento** | Honorarios · cesión de imagen · uso en pauta si aplica | Jornada por persona |
| **3 · Variables por escena** | Props · vestuario · producto consumido · arte y ambientación | Escena |
| **4 · Post base** | Backup · descarga · selects · transcodificación | Jornada |
| **5 · Contingencia** | % declarado, **como línea propia** | Total |

🛑 **Post base no es edición.** Ordenar, respaldar y marcar selects es de Producción. Montar, corregir
color, versionar y exportar es de ⑥A Diseño y ⑥B Video Editing, y va en su presupuesto, no en este.

---

## La contingencia

| Perfil del rodaje | Contingencia |
|---|---|
| Interior controlado, talento propio, producto disponible | **10 %** |
| Mezcla interior/exterior, o talento externo | **15 %** |
| Exterior con clima, permisos pendientes, o producto `a-producir` | **20-25 %** |

**Cómo se declara:**

```
Subtotal producción      $XXX
Contingencia (15%)       $XXX     ← línea visible, siempre
TOTAL                    $XXX
```

🛑 **Nunca repartida dentro de los ítems.** Escondida, se gasta sin que nadie note que se gastó, y
al cierre no se puede saber si el desvío fue real o fue contingencia consumida.

---

## El costo por pieza — se calcula, no se presupuesta

```
costo por pieza = (fijos de su jornada ÷ piezas de esa jornada) + variables propias
```

Es el número que vuelve a ③ Marketing y el que hace que el ciclo siguiente se decida con dato.

| Factor de consolidación | Efecto en el costo por pieza |
|---|---|
| 2 escenas/jornada | Los fijos se reparten entre poco: **costo por pieza alto** |
| 8 escenas/jornada | Mismos fijos, mucho más output: **costo por pieza bajo** |

**Esta tabla es el argumento del departamento:** el costo por pieza no baja negociando proveedores,
baja consolidando.

---

## Si no entra — las 3 opciones

Se presentan **las tres, con impacto**, y **decide un humano**:

| Opción | Qué se toca | Quién decide |
|---|---|---|
| **Reagrupar** | Volver a Capa 2 y buscar más consolidación | Producción sola puede |
| **Recortar filas** | Se proponen las de menor `traza_a_must_be_true` | **③ Marketing** |
| **Bajar especificación** | Locación más simple, menos talento, menos equipo | **④ Creatividad** si toca encuadre, acción o duración |

🛑 **Producción nunca elige sola qué pieza se cae.**

---

## Reglas duras

1. **Todo número lleva moneda y fecha de cotización.** Un costo sin fecha caduca y nadie sabe cuándo.
2. **Contingencia como línea propia**, siempre visible.
3. **`costo_real` se carga siempre**, aunque sea igual al estimado. Sin eso no hay Capa 7.
4. **Nada se compromete antes del GATE 1.** Ni una reserva, ni una convocatoria, ni una compra.
5. **Un gasto que excede lo aprobado se marca `⏸️ PENDIENTE APROBACIÓN`** y espera. No se ejecuta
   "porque era urgente".
6. **Se consolida antes de costear.** La Capa 4 no corre sin Capa 2, aunque lo pidan directo.

---

## Anti-patterns

| Error | Por qué falla | Qué hacer |
|---|---|---|
| Costear pieza por pieza | Duplica todos los fijos | Costear por jornada |
| Contingencia repartida en los ítems | Se gasta invisible y el cierre no dice nada | Línea propia |
| No cargar `costo_real` cuando coincide | Se pierde la mitad de la muestra | Cargar siempre |
| Presupuesto sin fecha | Caduca sin que nadie sepa | Moneda y fecha en todo número |
| Meter la edición final acá | Se presupuesta dos veces o ninguna | Post base sí, montaje no |
