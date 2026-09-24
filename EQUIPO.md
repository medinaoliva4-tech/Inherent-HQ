# Equipo — responsabilidades, puestos y costo

> **Primero las responsabilidades. Después quién las cubre. Recién ahí, las horas.**
> Cortar horas sin saber qué responsabilidad las genera es cortar a ciegas.

---

## 🔴 El problema que esto resuelve

**Cobrando más, ganábamos menos:**

| | Precio | Costo | **Utilidad** |
|---|---|---|---|
| 🟦 Básico | Q6,160 | Q3,217 | **Q2,943** |
| 🟪 Acelerado | Q8,470 | Q6,192 | **Q2,278** 🔴 |

**Acelerado cobra Q2,310 más y deja Q665 menos.** Porque el precio sube Q2,310 y el costo sube
Q2,975.

**No es un problema de precio. Es un problema de estructura:**
cada cliente nuevo cargaba con un operador propio y con horas de producción que no hacían falta.

---

## 1 · Todas las responsabilidades

**Todo lo que hay que hacer para entregar un cliente. Sin excepción.**

### A · DIRECCIÓN Y CRITERIO
1. Relación y reunión con el cliente
2. Aprobar la estrategia y los objetivos
3. Aprobar el calendario y las ideas
4. **Gate de publicar y pautar**
5. Resolver las excepciones que levanta el QA
6. Decidir el alcance de la tecnología a construir
7. Dirección estratégica de la cuenta

### B · OPERACIÓN
8. Correr cada agente del pipeline, en orden
9. Cargar inputs: material, accesos, data del cliente
10. Mover outputs de una etapa a la siguiente
11. Organizar el Drive del cliente
12. Supervisar que las colas corran y atender errores
13. Primera línea de revisión antes del agente de QA
14. Programar lo que ya fue aprobado

### C · PRODUCCIÓN
15. **Grabar.** Nada más.

### D · EJECUCIÓN
16. Comprensión · Estrategia · Branding · Marketing · Creatividad
17. Diseño · QA · Copy · Programación · Pauta · Community
18. Reportes · Dashboards · Construcción de herramientas

---

## 2 · Los cuatro puestos

| Puesto | Quién | Cubre | Costo | Tipo |
|---|---|---|---|---|
| **Dirección** | **Allan** | A *(1-7)* | Su tiempo | Por cliente |
| **Operación** | **1 persona** | B *(8-14)* | **Q5,000/mes** | 🔒 **FIJO** |
| **Producción** | Freelance | C *(15)* | Q250/hora | Por cliente |
| **Ejecución** | **Los agentes** | D *(16-18)* | **Q1,500/mes cloud** | 🔒 **FIJO** |

> **Dos personas y los agentes. Nada más.**
> Las responsabilidades grandes las cargan los agentes — por eso hay que desarrollarlos para que
> trabajen **entre autónomos y dirigidos.**

### 🔑 El cambio estructural

**El operador y el cloud son costos FIJOS, no costos por cliente.**

| | Antes | Ahora |
|---|---|---|
| Operador | Q600-1,200 **por cliente** | **Q5,000/mes, todos los clientes** |
| Cloud | Q192 por cliente | **Q1,500/mes, todos los clientes** |
| **Total fijo** | — | **Q6,500/mes** |

**Cada cliente nuevo casi no los mueve. Se diluyen.**

| Clientes | Fijo por cliente |
|---|---|
| 5 | Q1,300 |
| 8 | Q812 |
| **10** | **Q650** |

⚠️ **Q5,000 de sueldo del operador es supuesto, no dato.** Hay que cotizarlo.

---

## 3 · Cómo bajamos la producción

**Es el segundo costo más grande y el único que no escala con agentes.**

| Palanca | Efecto |
|---|---|
| **Contenido crudo del cliente** — graba con su teléfono siguiendo brief, los agentes lo terminan | El video deja de depender de nuestras horas |
| **Batching** — una sesión larga cubre dos meses | Mitad de salidas, mismo material |
| **Multiplicación** — una toma rinde 15 piezas | El costo por pieza se divide |
| **Generado reemplaza filmado** donde tiene sentido *(producto, b-roll, fondos)* | Q0 marginal |
| **Biblioteca acumulada** — el material del mes 3 sirve en el mes 8 | El costo baja con el tiempo |

### Las horas nuevas

| | Antes | **Ahora** | Sesiones |
|---|---|---|---|
| 🟦 Básico | 4h | **1h** | 1 |
| 🟪 Acelerado | 6h | **3h** | 1 |
| 🟨 Compuesto | 8h | **6h** | 2 |

---

## 4 · Los números con el modelo nuevo

### Costo variable por cliente

| Concepto | 🟦 Básico | 🟪 Acelerado | 🟨 Compuesto |
|---|---|---|---|
| Producción | 1h → Q250 | 3h → Q750 | 6h → Q1,500 |
| Sesiones | 1 → Q175 | 1 → Q175 | 2 → Q350 |
| Build de tecnología | — | Q400 | Q800 |
| **Allan** | 4h → Q1,000 | 6h → Q1,500 | 8h → Q2,000 |
| **Variable** | **Q1,425** | **Q2,825** | **Q4,650** |

### Margen según cuántos clientes haya

| | Precio | **5 clientes** | **8 clientes** | **10 clientes** |
|---|---|---|---|---|
| 🟦 Básico | Q6,160 | Q3,435 · **56%** | Q3,922 · **64%** | Q4,085 · **66%** |
| 🟪 Acelerado | Q8,470 | Q4,345 · **51%** | Q4,832 · **57%** | Q4,995 · **59%** |
| 🟨 Compuesto | Q15,400 | Q9,450 · **61%** | Q9,938 · **65%** | Q10,100 · **66%** |

✅ **La paradoja desaparece.** La utilidad ahora sube con el precio:
**Q3,435 → Q4,345 → Q9,450.**

✅ **Márgenes de 51-66% desde 5 clientes**, sin tocar el precio y sin el performance fee.

---

## 5 · Las horas de Allan

| Clientes | 🟦 Básico | 🟪 Acelerado | 🟨 Compuesto |
|---|---|---|---|
| 5 | 20 h | 30 h | 40 h |
| 8 | 32 h | 48 h | 64 h |
| **10** | **40 h** | **60 h** | **80 h** |

**10 clientes Compuesto = 80h al mes.** Sigue siendo medio tiempo.
**El límite no es Allan: es la calidad de los agentes.**

---

## 6 · Lo que esto exige de los agentes

> **Este modelo solo funciona si los agentes cargan de verdad las responsabilidades del bloque D.**
> Si fallan, el trabajo vuelve a Allan y la estructura colapsa.

| Requisito | Por qué |
|---|---|
| **Autónomos donde se puede** | Diseño, copy, programación, reportes: sin humano en el medio |
| **Dirigidos donde importa** | Estrategia, creatividad y pauta proponen; **Allan decide** |
| **Que levanten excepciones, no preguntas** | Si el agente pregunta todo, no ahorra nada |
| **Que se auto-revisen** | El agente de QA es lo que permite que Allan baje a 4-8h |

🔴 **Por eso el agente de QA es el primero.** No es una mejora: **es lo que sostiene el modelo.**

---

## 7 · Lo que falta confirmar

| Pendiente | Por qué importa |
|---|---|
| **Cotizar el sueldo del operador** | Q5,000 es supuesto. Mueve todos los márgenes |
| **Probar el contenido crudo del cliente** | De ahí sale la baja de producción de 4h a 1h |
| **Medir las horas reales de Allan** | 4/6/8h asume el QA automatizado |
| **Construir el agente de QA** | Sin él, nada de esto se sostiene |
