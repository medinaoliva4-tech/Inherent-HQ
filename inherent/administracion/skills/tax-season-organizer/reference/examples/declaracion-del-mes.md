# Ejemplo trabajado: declaración del mes
> Adaptado para Inherent a partir de Anthropic small-business (Apache 2.0).

> **Cifras ilustrativas.** Muestran la forma del entregable, no los números de Inherent.

**Escenario:** Inherent, Régimen de Pequeño Contribuyente. El CEO pregunta el 6 de
octubre: "¿Cuánto declaramos de IVA de septiembre?"

---

## Paso 1: las ventas del mes

Excel de ventas de septiembre (CSV exportado):

| Factura | Cliente | Monto | Estado |
|---|---|---|---|
| A-101 | Cliente 1 (plan Marketing) | Q7,315.00 | vigente |
| A-102 | Cliente 2 (plan Marketing Pro) | Q11,165.00 | vigente |
| A-103 | Cliente 3 (plan Marketing) | Q7,315.00 | vigente |
| A-104 | Cliente 3 | Q7,315.00 | **anulada** — duplicada |
| A-105 | Cliente 4 (exterior) | USD 950.00 | vigente |

- Ingresos en quetzales: Q25,795.00
- A-104 anulada: excluida
- A-105 en USD: el Excel no trae tipo de cambio → `⚠️ SIN DATOS`, se le pide al contador

---

## Paso 2: las constancias

> "¿Qué constancias de retención de IVA nos entregaron en septiembre?"

CEO: "Una, del Cliente 2."

- Cliente 2, factura A-102: Q558.25 retenidos (5% de Q11,165.00)
- Cliente 1 y Cliente 3: facturas de más de Q2,500.01. Si alguno es agente de retención,
  falta su constancia → se pregunta.

---

## Paso 3: el cálculo

```
Ingresos brutos de septiembre (sin A-105):  Q25,795.00
IVA Pequeño Contribuyente 5%:               Q 1,289.75
Retenciones con constancia:                −Q   558.25
A pagar con SAT-2046:                       Q   731.50   + 5% de A-105 cuando haya tipo de cambio
Plazo: dentro de octubre
ISR: no aplica (Pequeño Contribuyente, relevado)
```

---

## Paso 4: el tope

```
Año calendario a septiembre:     Q232,000.00   46% de Q500,285.00
Últimos 12 meses:                Q291,000.00   58%
Proyección del año (÷ 9 × 12):   Q309,333.33   62%   — proyección, no dato
Alerta: ninguna
```

---

## Paso 5: lo que recibe el CEO

```
## Declaración IVA Pequeño Contribuyente — septiembre 2026 · SAT-2046
Preparado el 6 de octubre de 2026 · Régimen: Pequeño Contribuyente ·
Para revisión del contador — no es asesoría tributaria

### Ingresos del mes
Q25,795.00 en 3 facturas vigentes · 1 anulada excluida (A-104) ·
1 factura en USD sin convertir (A-105, USD 950.00)

### Cálculo
Q25,795.00 × 5% = Q1,289.75 − Q558.25 de retenciones = **Q731.50**
+ el 5% de A-105 cuando el contador dé el tipo de cambio

### Plazo
Dentro del mes calendario siguiente: octubre de 2026
[fuente: portal.sat.gob.gt, preguntas frecuentes de cumplimiento tributario]

### Tope del régimen
46% del año · 58% de los últimos 12 meses · proyección 62%. Sin alerta.

### Supuestos — revisar con el contador
- Ingresos tomados del Excel de ventas, no cruzados todavía con los DTE emitidos
- Tipo de cambio de A-105: ⚠️ SIN DATOS
- Constancias de Cliente 1 y Cliente 3: confirmar si son agentes de retención
- Tope de Q500,285.00 según la SAT para el período fiscal en curso
- No incluye: multas, planilla, obligaciones municipales
```
