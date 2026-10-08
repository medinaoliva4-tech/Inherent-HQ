# Connector Query Guide
> Adaptado para Inherent a partir de Anthropic small-business (Apache 2.0).

Cómo leer los datos para cada modo. **En Inherent no hay ledger conectado:** los libros
viven en Excel y los cierra un contador externo, así que el camino por defecto es el
Excel exportado. Los ledgers son pares (`../../../shared/connector-neutrality.md`) y
quedan como camino opcional. La revisión de país y régimen del Step 0 corre antes de
todo esto.

---

## Excel / CSV — el camino por defecto (los dos modos)

Se le pide al CEO o al contador la hoja exportada como CSV o XLSX:

- **Declaración del mes:** la hoja de ventas del mes y la de compras del mes.
- **Cierre del año:** las hojas de los 12 meses, más el libro de compras y ventas si se
  lleva aparte.

Columnas que se buscan (los nombres varían):

- **Ventas:** fecha, número de factura (serie y número del DTE), cliente, NIT del cliente, monto, moneda, estado (vigente / anulada)
- **Compras y pagos:** fecha, proveedor, NIT, documento (factura FEL, otro, ninguno), monto, concepto
- **Constancias de retención:** cliente, NIT, factura a la que corresponde, monto retenido, fecha

Si las columnas no coinciden, se le pide al CEO que diga cuáles son el nombre, el monto y
la fecha. **Nunca se adivina una columna de montos.**

**La primera vez,** se piden también los ingresos mensuales de los 12 meses anteriores
para la revisión del tope, y se guardan en el contexto de la sesión.

---

## Exportación de DTE de la Agencia Virtual — el cruce

La consulta de DTE emitidos y recibidos está en la Agencia Virtual de la SAT (menú
Servicios Tributarios → Factura Electrónica en Línea (FEL) → Consultar DTE)
[fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/].
**La skill no entra a la Agencia Virtual:** no hay MCP para eso, y las credenciales de
la SAT no pasan por el chat. El CEO o el contador descargan el archivo y lo suben.

- **Emitidos** — las ventas reales del período. Se cruzan contra la hoja de ventas: una factura que está en un lado y no en el otro se lista.
- **Recibidos** — las compras con factura. Se cruzan contra la hoja de compras: un pago sin DTE recibido es una factura que falta.
- **Anulados** — se excluyen de los ingresos y se listan.

---

## Xero — si se conecta

`get_profit_and_loss` para el período, y `get_invoices` / `get_bills` para el detalle
factura por factura. Read `get_organisation_info` first if the business context has no
Country or Currency. **Confirm each tool name in this section before the first live run.**

---

## QuickBooks — si se conecta

Un **Profit & Loss** del período y la lista de transacciones por cliente y por proveedor.
Si el conector devuelve solo totales por categoría sin detalle por proveedor, se pide la
exportación **Transaction List by Vendor** como CSV y se procesa igual que el Excel.
Las trampas de reportes están en `../../../shared/quickbooks-report-traps.md`.

---

## NetSuite — si se conecta

P&L via `ns_runReport`; facturas y pagos a proveedores via `ns_runCustomSuiteQL`. Los
registros de proveedor traen el campo de identificación tributaria (el NIT).

---

## MYOB — si se conecta

Read-only, and P&L-side only. Sirve para los ingresos del período; **no tiene detalle por
proveedor**, así que la lista de proveedores del cierre del año sale del Excel.

---

## Zoho Books — si se conecta

No report endpoints. `list_invoices` para las ventas del período y `list_expenses` para
los gastos, sumados — **una cifra armada desde documentos, no un P&L**; se dice así.
`get_organization` supplies `country_code` and `currency_code` for the Step 0 check. La
marca fiscal de EE. UU. de sus contactos no aplica en Guatemala y se ignora.

---

## PayPal / Stripe — cobros del exterior

Si un cliente paga por PayPal o Stripe, los cobros recibidos del período sirven para
cruzar contra las facturas emitidas: un cobro sin factura se lista. Se excluyen
reembolsos y transferencias a cuentas propias. Montos en su moneda, con la moneda nombrada.

---

## Ramp / Expensify — gastos

Read only. Gastos por categoría, y **los gastos sin comprobante**: el total y la cuenta.
En el cierre del año, un gasto sin factura es lo primero que va a preguntar el contador.
Nada en esta skill escribe.
