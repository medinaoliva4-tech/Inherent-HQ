# Equipo — responsabilidades, tarifas y sueldos

> **Nadie cobra por cuenta. Todos cobran por hora.**
> Cada cuenta paga **su porción de horas**, no un sueldo entero.

---

## 🔴 Los dos errores que esto corrige

### Error 1 · Pagar un sueldo por cuenta

**Si a alguien se le paga Q500 por cuenta, con 10 cuentas cobra 10 sueldos.**
Ese costo nunca baja — sube en línea recta con cada cliente nuevo.

✅ **Correcto:** se mide **cuántas horas toma esa cuenta**, y se paga esa porción.
El sueldo sale de sumar las porciones de todas las cuentas.

### Error 2 · Bajar la producción recortando horas

**El trabajo de grabar no desaparece porque le quitemos horas al papel.**
Recortar horas es bajarle el precio a la persona por el mismo trabajo.

✅ **Correcto:** se le **garantiza volumen** y a cambio baja la tarifa —
y cuando el volumen alcanza, **se le asigna un sueldo fijo.**

---

## 1 · Todas las responsabilidades

### A · DIRECCIÓN Y CRITERIO — *Allan*
1. Relación y reunión con el cliente
2. Aprobar la estrategia y los objetivos
3. Aprobar el calendario y las ideas
4. **Gate de publicar y pautar**
5. Resolver las excepciones que levanta el QA
6. Decidir el alcance de la tecnología
7. Dirección estratégica de la cuenta

### B · OPERACIÓN — *Operador de agentes*
8. Correr cada agente del pipeline, en orden
9. Cargar inputs: material, accesos, data
10. Mover outputs de una etapa a la siguiente
11. Organizar el Drive del cliente
12. Supervisar colas y atender errores
13. Primera línea de revisión antes del QA
14. Programar lo que ya fue aprobado

### C · PRODUCCIÓN — *Productor*
15. **Grabar.** Nada más.

### D · EJECUCIÓN — *Los agentes*
16. Comprensión · Estrategia · Branding · Marketing · Creatividad
17. Diseño · QA · Copy · Programación · Pauta · Community
18. Reportes · Dashboards · Construcción de herramientas

---

## 2 · Las horas que toma cada cuenta, al mes

| Rol | 🟦 Básico | 🟪 Acelerado | 🟨 Compuesto |
|---|---|---|---|
| **Producción** | 3 h | 5 h | 8 h |
| **Operación** | 4 h | 6 h | 8 h |
| **Allan** | 4 h | 6 h | 8 h |

⚠️ **Estas horas son estimación.** Es lo primero que hay que medir: sin ellas, todo el modelo
es una hipótesis.

---

## 3 · 🔑 La escalera de tarifa

> **La tarifa baja porque le garantizamos volumen.**
> No es apretar a la persona: es que **20 horas seguras valen más que 4 sueltas.**

| Horas/mes que le garantizamos | Modalidad | Tarifa |
|---|---|---|
| Menos de 20 h | Freelance puro | **100%** |
| 20 – 60 h | Freelance con volumen | **80%** |
| 60 – 120 h | **Medio tiempo con sueldo** | **65%** |
| Más de 120 h | **Tiempo completo con sueldo** | **50%** |

### Las tarifas base

| Rol | Tarifa base | A tiempo completo |
|---|---|---|
| **Producción** | Q250 / h | Q125 / h |
| **Operación** | Q100 / h | Q50 / h |

> **Cuando el volumen pasa de 60 h/mes, deja de ser tarifa y pasa a ser sueldo.**
> El sueldo se calcula: `horas totales × tarifa del tramo`.

---

## 4 · 🔧 Cómo se calcula — la mecánica

### La fórmula

```
1.  HORAS TOTALES  =  suma de las horas de todas las cuentas activas
2.  TARIFA         =  tarifa base × el factor del tramo que dan esas horas
3.  SUELDO         =  horas totales × tarifa
4.  PORCIÓN DE     =  horas de esa cuenta × tarifa
    CADA CUENTA
```

> **Cada cuenta paga las horas que consume, a la tarifa que el volumen total permite.**
> Nadie paga un sueldo entero. La suma de las porciones **es** el sueldo.

---

## 5 · Los cuatro escenarios, con números

### 🔵 HOY — 2 clientes Básico

| Rol | Horas/mes | Tramo | Tarifa | **Sueldo** |
|---|---|---|---|---|
| Producción | 6 h | Freelance | Q250 | **Q1,500** |
| Operación | 8 h | Freelance | Q100 | **Q800** |
| Claude | — | fijo | — | Q1,500 ÷ 2 = **Q750/cuenta** |

| Cuenta | Prod. | Oper. | Claude | Allan | **Costo** | **Utilidad** | **Margen** |
|---|---|---|---|---|---|---|---|
| Básico | Q750 | Q400 | Q750 | Q1,000 | **Q2,900** | **Q3,260** | **53%** |

**Utilidad total del mes: Q6,520**

---

### 🟢 META CORTA — 5 clientes *(2 Básico · 2 Acelerado · 1 Compuesto)*

| Rol | Horas/mes | Tramo | Tarifa | **Sueldo** |
|---|---|---|---|---|
| Producción | 24 h | Freelance con volumen | **Q200** | **Q4,800** |
| Operación | 28 h | Freelance con volumen | **Q80** | **Q2,240** |
| Claude | — | fijo | — | Q1,500 ÷ 5 = **Q300/cuenta** |

| Cuenta | Prod. | Oper. | Claude | Allan | **Costo** | **Utilidad** | **Margen** |
|---|---|---|---|---|---|---|---|
| 🟦 Básico | Q600 | Q320 | Q300 | Q1,000 | Q2,220 | Q3,940 | **64%** |
| 🟪 Acelerado | Q1,000 | Q480 | Q300 | Q1,500 | Q3,280 | Q5,190 | **61%** |
| 🟨 Compuesto | Q1,600 | Q640 | Q300 | Q2,000 | Q4,540 | Q10,860 | **71%** |

**Utilidad total del mes: Q29,120**

---

### 🟡 META MEDIA — 10 clientes *(3 Básico · 4 Acelerado · 3 Compuesto)*

| Rol | Horas/mes | Tramo | Tarifa | **Sueldo** |
|---|---|---|---|---|
| Producción | 53 h | Freelance con volumen | Q200 | **Q10,600** |
| Operación | 60 h | **Medio tiempo · sueldo** | **Q65** | **Q3,900** |
| Claude | — | fijo | — | Q1,500 ÷ 10 = **Q150/cuenta** |

| Cuenta | Prod. | Oper. | Claude | Allan | **Costo** | **Utilidad** | **Margen** |
|---|---|---|---|---|---|---|---|
| 🟦 Básico | Q600 | Q260 | Q150 | Q1,000 | Q2,010 | Q4,150 | **67%** |
| 🟪 Acelerado | Q1,000 | Q390 | Q150 | Q1,500 | Q3,040 | Q5,430 | **64%** |
| 🟨 Compuesto | Q1,600 | Q520 | Q150 | Q2,000 | Q4,270 | Q11,130 | **72%** |

**Utilidad total del mes: Q67,560**

---

### 🔴 META LARGA — 20 clientes *(4 Básico · 8 Acelerado · 8 Compuesto)*

| Rol | Horas/mes | Tramo | Tarifa | **Sueldo** |
|---|---|---|---|---|
| Producción | 116 h | **Medio tiempo · sueldo** | **Q162** | **Q18,850** |
| Operación | 128 h | **Tiempo completo · sueldo** | **Q50** | **Q6,400** |
| Claude | — | fijo | — | Q1,500 ÷ 20 = **Q75/cuenta** |

| Cuenta | Prod. | Oper. | Claude | Allan | **Costo** | **Utilidad** | **Margen** |
|---|---|---|---|---|---|---|---|
| 🟦 Básico | Q488 | Q200 | Q75 | Q1,000 | Q1,762 | Q4,398 | **71%** |
| 🟪 Acelerado | Q812 | Q300 | Q75 | Q1,500 | Q2,688 | Q5,782 | **68%** |
| 🟨 Compuesto | Q1,300 | Q400 | Q75 | Q2,000 | Q3,775 | Q11,625 | **75%** |

**Utilidad total del mes: Q156,850**

⚠️ **A 20 clientes Allan está en 188 h/mes.** Ahí ya no alcanza: **o entra un segundo director,
o el agente de QA baja sus horas a la mitad.** Es el techo real del modelo.

---

## 6 · 📄 El contrato con cada persona

> **Se firma una vez, con los tramos escritos. No se renegocia en cada cliente nuevo.**

| Cláusula | Qué dice |
|---|---|
| **Sueldo garantizado** | `horas garantizadas × tarifa del tramo`. **Es el piso** — se paga aunque el mes venga flojo |
| **Horas extra** | Si una cuenta consume más, se pagan **a la misma tarifa del tramo** |
| **Escalera de tarifa** | Los cuatro tramos, con sus factores, escritos desde el día uno |
| **Revisión** | Al cruzar un tramo. **Automática, no negociada** |
| **Qué gana con esto** | Tarifa menor **a cambio de ingreso garantizado y creciente** |

### Ejemplo de cómo se le plantea

> *"Hoy son 24 horas al mes a Q200 la hora: **Q4,800 garantizados**, te llegue o no el trabajo.*
> *Cuando pasemos de 60 horas, entrás a sueldo de medio tiempo: la tarifa baja a Q162,*
> *pero tu ingreso sube a **Q18,850**. Está escrito desde hoy."*

---

## 7 · Qué pasa cuando entra o sale un cliente

| Situación | Qué se hace |
|---|---|
| **Entra un cliente** | Se suman sus horas al total. Si cruza un tramo, **la tarifa baja para todos** y el margen sube solo |
| **Sale un cliente** | Se restan sus horas. **El sueldo garantizado no baja ese mes** — es el piso |
| **Si el total cae de tramo** | La tarifa se revisa **el mes siguiente**, con aviso |
| **Una cuenta consume más horas** | Se cotiza como extra o se sube de paquete. **Nunca se absorbe** |

---

## 6 · Las reglas del modelo

| | |
|---|---|
| **Nadie cobra por cuenta** | Se cobra por hora. La cuenta paga su porción |
| **La tarifa se revisa al cambiar de tramo** | Se acuerda desde el inicio, no se negocia después |
| **El sueldo arranca a las 60 h/mes** | Antes de eso es freelance |
| **Las horas se miden, no se asumen** | Si una cuenta toma más horas, **se cotiza o se ajusta el paquete** |
| **El Claude es fijo (Q1,500/mes)** | Se prorratea entre todas las cuentas activas |

---

## 7 · Lo que esto exige de los agentes

> **Este modelo solo funciona si los agentes cargan el bloque D.**
> Si fallan, el trabajo vuelve a Allan y la estructura colapsa.

| Requisito | Por qué |
|---|---|
| **Autónomos donde se puede** | Diseño, copy, programación, reportes: sin humano en el medio |
| **Dirigidos donde importa** | Estrategia, creatividad y pauta proponen; **Allan decide** |
| **Que levanten excepciones, no preguntas** | Si el agente pregunta todo, no ahorra nada |
| **Que se auto-revisen** | El agente de QA es lo que mantiene bajas las horas de operación |

🔴 **Por eso el agente de QA es el primero.** No es una mejora: **es lo que sostiene el modelo.**

---

## 8 · Lo que falta confirmar

| Pendiente | Por qué importa |
|---|---|
| **Medir las horas reales** de producción, operación y Allan | Es la base de todo. Hoy son estimación |
| **Acordar la escalera de tarifa** con cada persona, por escrito | Evita renegociar en cada tramo |
| **Probar el contenido crudo del cliente** | Único camino para bajar horas de producción sin bajarle el precio a nadie |
| **Construir el agente de QA** | Sin él las horas de operación se duplican |
