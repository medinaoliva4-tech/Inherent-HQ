# Good / Bad Patterns
> Adaptado para Inherent a partir de Anthropic small-business (Apache 2.0).

Fallas comunes y cómo evitarlas.

---

## El cálculo

**BAD:** Sacar el IVA del Pequeño Contribuyente como si fuera Régimen General.
```
Ventas del mes:  Q40,000
IVA: Q40,000 ÷ 1.12 × 12% = Q4,285.71  ← régimen equivocado
```

**GOOD:** 5% sobre los ingresos brutos del mes, menos las constancias.
```
Ingresos brutos del mes:  Q40,000.00
IVA 5%:                   Q 2,000.00
Retenciones (constancia): −Q  250.00
A pagar con SAT-2046:     Q 1,750.00
```

---

## Los supuestos

**BAD:** Dar un monto sin contexto.
> "Este mes pagan Q1,750."

**GOOD:** El monto con su régimen, su fuente y sus supuestos.
> "Régimen de Pequeño Contribuyente, ingresos tomados del Excel de septiembre, dos
> constancias recibidas: **SAT-2046 ≈ Q1,750, dentro de octubre**. Una factura de Q5,000
> a un agente de retención no tiene constancia todavía. Revisar con el contador."

---

## El tope

**BAD:** Avisar del tope solo cuando ya se pasó, o enterrarlo al final.

**GOOD:** Mostrar el % del tope todos los meses y poner la alerta arriba en cuanto
aparece.
> "🔴 A septiembre vamos al 78% del tope del año (Q390,000 de Q500,285) y al ritmo actual
> cerraríamos diciembre en Q520,000, arriba del tope. Revisar con el contador el cambio de
> régimen antes de que pase."

**BAD:** Calcular cuánto se pagaría en el Régimen General y recomendar cambiar.

**GOOD:** Avisar y mandar la decisión al contador y al CEO.

---

## Un mes en cero

**BAD:** No preparar declaración porque el mes no tuvo ventas o porque todo fue retenido.

**GOOD:** El Pequeño Contribuyente declara cada mes, haya o no actividad. Se prepara el
SAT-2046 en cero y se dice.

---

## Proveedores duplicados

**BAD:** Juntar "<nombre> <apellido>" y "Estudio <apellido>" porque se parecen.

**GOOD:** Marcarlos para que un humano decida.
> "Pueden ser la misma persona — confirmar: <nombre> <apellido> (Q3,000) | Estudio <apellido>
> (Q1,500), NIT distintos."

---

## Facturas en USD

**BAD:** Convertir a quetzales con un tipo de cambio inventado.

**GOOD:** Mostrar el monto en USD y pedir el tipo de cambio que usa el contador. Sin él,
`⚠️ SIN DATOS` en esa línea.

---

## La frontera de la asesoría

**BAD:** "Les conviene pasarse al Régimen General ya."

**GOOD:** "El contador puede evaluar si conviene el cambio de régimen antes de llegar al
tope; esa decisión cambia el IVA y el ISR que pagaría Inherent."

La skill muestra las opciones; el contador asesora y el CEO decide.

---

## Cifras sin fuente

**BAD:** Escribir una tasa, un tope o un plazo de memoria.

**GOOD:** Usar solo lo que está en `calculation-assumptions.md` con su fuente; lo que no
está, se le pide al contador.
