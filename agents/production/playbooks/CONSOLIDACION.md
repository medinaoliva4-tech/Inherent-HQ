# Playbook — Consolidación en jornadas

**Qué resuelve.** Convertir N escenas dispersas en M jornadas ejecutables, al menor costo posible,
sin tocar una sola decisión creativa.

**Por qué es el playbook más importante del departamento.** Desglosar es mecánico: cualquiera lo
hace igual. **Agrupar es donde se decide si el ciclo cuesta X o 4X.**

**Dónde vive:** Capa 2 del método · **Output:** `plan-de-jornadas.md` + columnas `jornada` y
`orden_en_jornada`

---

## El principio

> Lo caro de una producción **no son las tomas: son los montajes.**

Cada cambio de locación, cada convocatoria de talento y cada esquema de luz nuevo cuesta tiempo
muerto que se paga igual. Treinta escenas pueden ser once jornadas o dos, y la diferencia **no está
en el contenido**: está en cómo se agruparon.

---

## Paso 1 — Construir la matriz

Antes de agrupar nada, se arma esta tabla con **todas** las escenas del ciclo:

```markdown
| id | id_creativo | escena | locacion | talento | setup de luz | producto | duracion_s | tiempo_min |
```

🛑 **No se agrupa leyendo el Excel fila por fila.** Se agrupa mirando la matriz completa: los
patrones solo aparecen cuando se ve todo junto.

---

## Paso 2 — Agrupar por los 4 ejes, **en este orden**

El orden importa: cada eje se aplica **dentro** de los grupos que armó el anterior.

### Eje 1 · Locación — el más pesado
Todo lo que ocurre en la misma locación va al mismo día. Sin excepciones evitables.

```
Oficina sala norte → P-002, P-005, P-006     → candidatos a J1
Cocina del local   → P-010, P-011            → candidatos a J2
Sin locación (captura/post) → P-001, P-003, P-004 → J0 (no es jornada de rodaje)
```

> **J0 es una convención útil:** las escenas que no requieren rodaje —capturas de pantalla, placas,
> composiciones de post— se agrupan aparte para que no inflen el conteo de jornadas ni el factor.

### Eje 2 · Talento — se paga por jornada
Si una persona aparece en 9 escenas repartidas en 3 locaciones, hay dos caminos:

| Camino | Cuándo conviene |
|---|---|
| Traer las 3 locaciones al mismo día | Si están cerca y el día alcanza |
| Convocar a la persona 2 días | Si las locaciones son incompatibles |

🛑 **Antes de convocar a alguien dos veces, se revisa si su escena puede resolverse como voz** (que
se graba otro día, más barato) o **como manos** (reemplazable). Se propone a ④ Creatividad como
devolución — **nunca se cambia solo**.

### Eje 3 · Setup de luz — ordena el interior de la jornada
Dentro de un día, se agrupa por esquema de luz antes que por pieza. Rearmar una luz cuesta 30-45 min;
cambiar de óptica, 5.

### Eje 4 · Producto — define el final del bloque
Lo que se destruye en cuadro va **último** en su bloque, y con unidades de respaldo.

---

## Paso 3 — Ordenar el tiro

El orden dentro de la jornada **no es el orden narrativo**. Se ordena por costo de cambio:

```
1. Mismo setup, mismo talento           → juntas y seguidas
2. Cambios de vestuario                 → agrupados, nunca alternados
3. Escenas con producto destructivo     → al final de su bloque
4. Cobertura de cada escena             → antes de desarmar su setup, NUNCA al final del día
```

🛑 **La cobertura al final del día es cobertura que no se hace.** Cuando el día se atrasa —y se
atrasa— lo último es lo primero que se cae.

---

## Paso 4 — Verificar que entre en el día

Se suma, con los márgenes reales de `toolkit/04-equipo.md`:

```
Carga de la jornada = montaje inicial (60-90)
                    + Σ tiempo_estimado_min de sus escenas
                    + Σ cambios de setup
                    + comida (60)
                    + desmontaje (45)
```

| Resultado | Qué hacer |
|---|---|
| **≤ 10 h** | ✅ Jornada viable |
| **10-12 h** | ⚠️ Se saca la escena de menor `traza_a_must_be_true` a otra jornada |
| **> 12 h** | 🔴 Se parte en dos jornadas. **No se comprime** |

🛑 **Una jornada de 14 h en papel es una jornada de 10 h en la que la última mitad no se grabó.**
Comprimir no ahorra: mueve el costo a una jornada de recuperación que además es peor.

---

## Paso 5 — Declarar el factor

```
Factor de consolidación = escenas de rodaje ÷ jornadas de rodaje
```

*(Las escenas de J0 no cuentan: no se graban.)*

| Factor | Lectura | Qué hacer |
|---|---|---|
| **< 4** | Mal agrupado, o el Excel creativo pide locaciones muy dispersas | Volver al Paso 2. Si la dispersión es real, **devolver a ④ Creatividad con el costo** |
| **4-10** | Normal | Seguir a Capa 3 |
| **> 10** | Muy eficiente | Verificar que la jornada **entre en horas**, no solo en papel |

**El factor es el argumento del departamento.** Cuando ③ Marketing pregunta por qué un ciclo cuesta
más que el anterior, la respuesta casi nunca es "subieron los precios": es que el factor bajó.

---

## Paso 6 — Cuando la dispersión es del Excel creativo

A veces no se puede consolidar porque ④ Creatividad pidió 12 lugares distintos para 12 piezas. Eso
**no se resuelve acá**: se devuelve, con números.

```markdown
↩️ DEVUELTO — dispersión de locaciones
12 piezas piden 12 locaciones distintas → factor 1.0 → 12 jornadas
Costo estimado: [monto]. Presupuesto disponible: [monto].

Alternativas, sin cambiar la intención de ninguna pieza:
A) 4 locaciones sirven para 9 de las 12 piezas → factor 3.0 → 4 jornadas
   (las piezas C-004, C-007 y C-011 mantienen locación propia por su concepto)
B) 8 piezas se resuelven en 2 locaciones si se acepta otro tipo de lugar
   equivalente → requiere confirmación de ④ Creatividad
```

🛑 **Se devuelve con alternativas concretas, no con un "no se puede".** Una devolución sin
alternativa es un bloqueo, y bloquear sin proponer es lo que hace que el resto del equipo resuelva
por su cuenta.

---

## Checklist de cierre

- [ ] La matriz incluye **todas** las escenas del ciclo
- [ ] Agrupado por los 4 ejes, **en orden**
- [ ] Las escenas sin rodaje están en **J0** y no cuentan para el factor
- [ ] El orden de tiro está por **costo de cambio**, no narrativo
- [ ] La **cobertura** está ubicada antes de desarmar cada setup
- [ ] Ninguna jornada supera **10 h efectivas** con márgenes incluidos
- [ ] El **factor de consolidación** está declarado con su lectura
- [ ] Si el factor es < 4, está explicado **por qué** y devuelto si corresponde
- [ ] Ninguna decisión creativa fue cambiada para lograr el agrupamiento
