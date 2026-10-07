# Ejemplo trabajado: cierre del año
> Adaptado para Inherent a partir de Anthropic small-business (Apache 2.0).

> **Cifras ilustrativas.** Muestran la forma del entregable, no los números de Inherent.

**Escenario:** Inherent, Régimen de Pequeño Contribuyente. El CEO pide en enero:
"Armá lo del contador para el cierre del año pasado."

---

## Paso 1: los 12 meses

| Mes | Ingresos brutos | IVA 5% | Retenciones | A pagar | SAT-2046 presentado |
|---|---|---|---|---|---|
| Enero | Q18,000.00 | Q900.00 | Q0.00 | Q900.00 | sí |
| … | … | … | … | … | … |
| Junio | Q0.00 | Q0.00 | Q0.00 | Q0.00 | **no se sabe** |
| … | … | … | … | … | … |
| Diciembre | Q41,000.00 | Q2,050.00 | Q558.25 | Q1,491.75 | se prepara ahora |
| **Año** | **Q402,000.00** | **Q20,100.00** | **Q3,349.50** | **Q16,750.50** | |

Junio no tuvo ventas, pero el Pequeño Contribuyente declara cada mes: si no se presentó
el SAT-2046 en cero, es la primera acción.

---

## Paso 2: libro vs. DTE

- Ventas: el libro tiene 61 facturas, los DTE emitidos 62. Falta en el libro la factura A-188 (Q7,315.00, noviembre).
- Compras: 4 pagos del Excel sin DTE recibido.

---

## Paso 3: proveedores y personas pagadas

| Nombre | NIT | Total pagado | Documento | Estado |
|---|---|---|---|---|
| Persona A (grabación) | en el Excel | Q5,400.00 | factura FEL en los 12 pagos | ✅ |
| Persona B (fotografía) | en el Excel | Q3,600.00 | factura FEL en 10 de 12 pagos | ⚠️ faltan 2 |
| Persona C (edición) | falta | Q2,400.00 | ninguno | ⚠️ |
| Estudio C | en el Excel | Q900.00 | factura FEL | ❓ ¿misma persona que Persona C? |

El contexto dice que Inherent no es agente de retención: no se calcula ninguna retención.

---

## Paso 4: el tope del año

```
Año calendario:  Q402,000.00   80% de Q500,285.00
Alerta: 🟡 acercándose
```

---

## Paso 5: lo que recibe el CEO

```
🟡 Cerramos el año al 80% del tope de Pequeño Contribuyente (Q402,000 de Q500,285).
   Un crecimiento de 25% este año lo pasaría. Revisar con el contador el cambio de régimen.

## Cierre tributario 2026 — Pequeño Contribuyente
Preparado el 8 de enero de 2027 · Para revisión del contador · No es asesoría tributaria

### Resumen
- Ingresos del año: Q402,000.00 · IVA: Q20,100.00 · Retenciones: Q3,349.50
- SAT-2046 presentados: 10 de 12 confirmados (junio sin confirmar; diciembre se prepara ahora)
- Facturas de venta fuera del libro: 1 · Pagos sin factura: 4
- Proveedores sin factura completa: 2

### Meses sin declaración
1. Junio — confirmar si se presentó en cero; si no, presentarlo

### Facturas que faltan
1. Persona B — 2 pagos sin factura (marzo, agosto)
2. Persona C — Q2,400.00 sin ningún documento, y falta su NIT

### Posible duplicado
- Persona C y Estudio C — confirmar si son la misma persona antes de juntarlos

### Checklist para el contador
- [ ] Confirmar o presentar el SAT-2046 de junio
- [ ] Asentar la factura A-188 en el libro de compras y ventas
- [ ] Pedir las facturas de Persona B y Persona C
- [ ] Confirmar el monto del tope para este año con el salario mínimo vigente
- [ ] Revisar con el CEO el cambio de régimen (alerta 🟡)
```
