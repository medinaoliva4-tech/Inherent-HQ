# Output Formats
> Adaptado para Inherent a partir de Anthropic small-business (Apache 2.0).

La estructura de cada una de las dos rutas. Las dos abren con la línea de no-asesoría
en el encabezado mismo, no solo en el chat.

---

## Path 1 — Declaración del mes

Secciones, en este orden:

1. **Alerta del tope** — solo si hay alerta 🟡, 🔴 o ⛔. Va primero, dirigida al CEO, con
   el % del tope, la cifra y la frase "Revisar con el contador el cambio de régimen."

2. **Encabezado** — H2 "Declaración IVA Pequeño Contribuyente — <mes> <año>" y el
   formulario (SAT-2046). Subline: fecha de preparación, régimen usado, "Para revisión
   del contador — no es asesoría tributaria."

3. **Ingresos del mes** — ingresos brutos, número de facturas, facturas anuladas
   excluidas, facturas en USD con su conversión. Fuente: Excel o exportación de DTE.

4. **Cálculo** — ingresos brutos × 5%, menos retenciones con constancia, igual a pagar.

5. **Constancias de retención** — tabla: cliente, NIT, factura, monto retenido. Debajo,
   las facturas de Q2,500.01 o más a clientes agentes de retención **sin constancia**,
   para pedirla.

6. **Plazo** — "dentro del mes calendario siguiente", con su fuente. Un mes vencido sin
   presentar va en su propia línea.

7. **Tope del régimen** — año calendario a la fecha, últimos 12 meses y proyección del
   año, cada uno en Q y en % del tope, con el monto del tope y su fuente.

8. **Supuestos** — viñeta por supuesto: fuente de los ingresos, facturas excluidas, tipo
   de cambio, constancias que faltan, monto del tope usado, y lo que no incluye (multas,
   planilla, obligaciones municipales).

---

## Path 2 — Paquete del cierre del año

Secciones, en este orden:

1. **Alerta del tope** — si el año pasó o rozó el tope, primero.

2. **Encabezado** — H2 "Cierre tributario <año> — Pequeño Contribuyente". Subline: fecha
   de preparación, "Para revisión del contador", "No es asesoría tributaria."

3. **Resumen** — viñetas: ingresos del año, IVA del año, retenciones del año, meses con
   SAT-2046 presentado (de 12), facturas que faltan, proveedores sin factura.

4. **Los 12 meses** — tabla: mes, ingresos brutos, IVA 5%, retenciones, a pagar, SAT-2046
   presentado (sí / no / no se sabe).

5. **Meses sin declaración** — lista numerada. Es la primera acción.

6. **Libro de compras y ventas vs. DTE** — diferencias, factura por factura.

7. **Proveedores y personas pagadas** — tabla: nombre, NIT, total pagado, documento
   recibido, estado (✅ / ⚠️ / ❓), notas. Los posibles duplicados, marcados.

8. **Facturas que faltan** — lista numerada, con monto y mes, para pedirlas.

9. **Checklist para el contador** — presentar los meses faltantes, pedir las facturas y
   constancias que faltan, confirmar el monto del tope del año siguiente, confirmar si
   Inherent es agente de retención, y revisar el régimen si hubo alerta.
