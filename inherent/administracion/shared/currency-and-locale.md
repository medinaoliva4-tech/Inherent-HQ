# Currency, country, and financial year — plugin-wide rule
> Adaptado para Inherent a partir de Anthropic small-business (Apache 2.0).

Scope: **every skill that emits an amount, a date in prose, or a period
("this quarter," "year to date").**

**En Inherent el valor por defecto es Guatemala:** país `GT`, moneda `GTQ`
(quetzal, `Q`), idioma español, zona horaria `America/Guatemala`, año fiscal
del 1 de enero al 31 de diciembre. **USD solo cuando el documento está en
USD** (una factura o un contrato en dólares), y se dice. Ninguna skill supone
dólares, ni ley tributaria de EE. UU.

---

## Where the values come from

Three fields in the `## Business context` block, captured by `smb-onboard`
(format in `skills/smb-onboard/reference/onboard-checklist.md`):

```
- **Country:** <ISO 3166 two-letter code — por defecto GT>
- **Currency:** <ISO 4217 code the business invoices in — por defecto GTQ>
- **Financial year end:** <day and month — por defecto 31 de diciembre>
```

**El año fiscal de 1 de enero a 31 de diciembre no es costumbre, es ley** para
el ISR en Guatemala: el período de liquidación definitiva anual «principia el
uno (1) de enero y termina el treinta y uno (31) de diciembre de cada año»
[fuente: Decreto 10-2012, art. 37 — https://tse.org.gt/images/UECFFPP/leyes/decreto_10-2012_Ley_actualizacion_tributaria.pdf].

**Los libros de Inherent viven en Excel y los cierra un contador externo;
no hay ledger conectado.** Donde una skill pide un ledger (QuickBooks, Xero y
demás), el camino por defecto es el Excel exportado (CSV/XLSX) que entrega el
CEO o el contador, y el entregable es el paquete para el contador. Los
conectores de ledger quedan como camino opcional si algún día se conecta uno.

**Read them from the ledger before asking.** When a ledger connector is
live, the organisation record carries all three: QuickBooks `company_info`,
Xero `get_organisation_info` and `get_organisation_financial_year`, MYOB
`myob_get_financial_year_dates`, NetSuite `ns_getSubsidiaries` (the
subsidiary record carries country and base currency; the financial year end
comes from the accounting-period setup, so ask if the connector does not
expose it), Zoho Books `get_organization` (`country_code`, `currency_code`,
and `fiscal_year_start_month` as a zero-based month index — `0` is January,
so the year end is the last day of the month before that index). Field names
differ per connector; pull what the connector exposes and ask only for what
it does not.

**Si faltan cuando corre una skill,** se usan los valores por defecto de
Inherent (GT, GTQ, 31 de diciembre) y se guardan en el bloque, sin preguntar.
Solo se pregunta si un documento dice otra cosa (por ejemplo, una factura en
USD), y entonces se pregunta una vez. Do not block the deliverable
on it: run with the answer for this session if the owner is mid-task and
would rather store it later.

**Never guess a country from a vendor.** A Xero org is not automatically
Australian; a QuickBooks company is not automatically American. Read the
record or ask.

---

## Amounts

- **Quetzales con `Q`, el resto con su código ISO.** `Q10,000.00` o
  `GTQ 10,000.00` —la `Q` no la usa ninguna otra moneda, así que no es ambigua y
  es la forma del resto del repo—; `USD 950.00`, `EUR 120.00`. Nunca un `$`,
  `£` o `€` suelto: un `$` suelto es ambiguo entre varias monedas. Separador de
  miles con coma y decimales con punto, como en Guatemala.
- **The currency is the stored one.** Every amount a skill emits is in the
  business's `Currency`. A processor that settles in another currency (a
  Stripe payout in EUR to a GBP business) is shown in its own currency with
  the settlement currency named, never silently converted.
- **Spreadsheet number formats use the code, not a symbol.** `"Q"#,##0.00`
  o `"USD "#,##0.00` en lugar de `$#,##0.00`. Negative values in red still applies.
- **Abbreviations keep the code.** `Q43k`, `USD 1.2m`.

---

## Thresholds

Skills carry rounding and attention thresholds ("flag a difference over
0.50," "expenses over 25 with no receipt," "vendors paid 600 or more").

- **Write thresholds as numbers in the stored currency,** not as USD figures.
  `0.50`, `25`, and `200` are the plugin's rounding and attention cut-offs in
  whatever the business invoices in. They are judgment lines, not legal ones,
  and they do not need converting.
- **Un umbral legal nombra su ley y su fuente.** El tope de ingresos del
  Régimen de Pequeño Contribuyente o el monto a partir del cual un agente
  retiene IVA son ley guatemalteca: la skill que los usa cita la fuente
  (`skills/tax-season-organizer/reference/calculation-assumptions.md`) y los
  aplica solo cuando `Country` es GT. No existe un «umbral genérico»; el número
  pertenece a un régimen y a un año.

---

## Country-scoped flows

Some skills are built for one country's rules today. They do not pretend
otherwise:

- **Check `Country` before running the country-specific path.** If it is not
  the country the path was built for, say so in one line, say what the skill
  can still do, and stop the country-specific math. Ejemplo: *"Las
  declaraciones de esta skill están hechas para la SAT de Guatemala. Este
  documento es de otro país, así que le preparo al contador el paquete de
  libros cerrados en vez de un cálculo."*
- **Nunca correr un cálculo de un país sobre un negocio de otro y llamarlo
  estimado.** Un número de impuesto equivocado con etiqueta segura es la falla
  que esta regla previene.
- **Flujos con país fijo hoy:** `tax-season-organizer` y `/tax-prep`
  (Guatemala, SAT); `hiring-screener`'s onboarding paperwork list y
  `job-post-builder`'s offer letter siguen escritos con formularios y
  condiciones de EE. UU.: para Inherent se marcan como referencia y el
  contrato y el alta del trabajador los revisa el contador (ver «Planilla en
  Guatemala» abajo).

---

## Periods and dates

- **"This quarter," "year to date," "FYTD," "last financial year" resolve
  against `Financial year end`,** not the calendar year, unless the owner
  says calendar. Resolve the financial-year dates once per run and reuse
  them. A 30 June year-end business asking for "Q1" means July to September.
- **Las fechas en prosa van en español de Guatemala** («14 de marzo de
  2026»), y la hora en `America/Guatemala`. Dates in filenames stay ISO
  `YYYY-MM-DD` everywhere.
- **Un plazo pertenece a un régimen.** «Dentro del mes calendario siguiente»
  es el plazo de la SAT para la declaración mensual del Pequeño Contribuyente
  (SAT-2046) [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/];
  aparece solo en la ruta de ese régimen y siempre con su fuente.

---

## Planilla en Guatemala

Si Inherent tiene trabajadores en planilla, existen obligaciones que las
skills de planilla (`payroll-prep`, `plan-payroll`) **no calculan con tasas
propias**:

- **IGSS** — cuotas patronales y laborales al Instituto Guatemalteco de
  Seguridad Social; el mismo recibo del IGSS cobra el **impuesto IRTRA** y la
  tasa INTECAP [fuente: https://servicios.igssgt.org/].
- **Aguinaldo** — Decreto 76-78; un salario ordinario mensual por año
  completo; se paga en diciembre y, si se divide, el resto en enero
  [fuente: https://mintrabajo.gob.gt/aguinaldo/].
- **Bono 14** — Decreto 42-92; un salario ordinario mensual por año
  completo, período del 1 de julio al 30 de junio, pagadero en la primera
  quincena de julio [fuente: https://mintrabajo.gob.gt/bono-14/ y
  https://mcd.gob.gt/wp-content/uploads/2013/07/bono-14-decreto-42-92.pdf].

**Ninguna tasa de IGSS, IRTRA o INTECAP se escribe de memoria:** se lee de la
planilla o de los registros de pago anteriores, o se le pide al contador. Si
no está, va como `⚠️ SIN DATOS`. Las personas que cobran un rubro fijo por
servicios (grabación, fotografía, edición, operador) y facturan no son
planilla; su factura y su régimen los revisa `tax-season-organizer`.

---

## Worked examples in reference files

The plugin's reference files carry hundreds of illustrative figures written
as `USD 1,240`. They are examples of shape and tone, not output. Pueden
quedarse en USD: lo que una skill emite para Inherent va en quetzales. The rule above governs what a skill emits for a real business,
not what a reference file shows as an illustration. New examples may use any
currency; a mix across the plugin is fine and mildly preferable.
