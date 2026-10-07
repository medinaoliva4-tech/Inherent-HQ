---
name: tax-prep
description: Prepara el material de impuestos de Inherent como cadena de dos pasos — month-end-prep confirma primero que los libros del período estén cerrados y conciliados, y después tax-season-organizer arma la declaración mensual del IVA de Pequeño Contribuyente (SAT-2046) o el paquete del cierre del año para el contador, sobre esos números cerrados, y vigila el tope de ingresos del régimen. SAT de Guatemala. Corre sobre el Excel exportado (CSV/XLSX) porque los libros viven en Excel y los cierra un contador externo; usa un ledger, PayPal o Stripe si algún día se conectan. Material para el contador, nunca asesoría tributaria, nada se presenta ni se paga. Se dispara con "impuestos," "la declaración del mes," "IVA," "la SAT," "SAT-2046," "¿cómo vamos con el tope?," "pequeño contribuyente," "el cierre del año para el contador," "preparale los libros al contador," cualquier frase que sugiera que se acerca un plazo de la SAT, o una pregunta sobre los ingresos del año que suene a preocupación por el régimen. Si el CEO dice que los libros del período ya están cerrados, va directo a tax-season-organizer.
allowed-tools: Read, WebFetch
---

> Adaptado para Inherent a partir de Anthropic small-business (Apache 2.0).

Corre la cadena de impuestos. Primero los libros, después el material de impuestos. La dependencia no es opcional: una declaración calculada sobre libros sin conciliar es un número que el CEO le va a presentar a la SAT.

Argumentos:
- `--mode` (por defecto se infiere de la fecha — en enero `ambos`, el resto del año `mensual`) — `mensual`, `anual` o `ambos`
- `--period` (por defecto el último mes cerrado; en modo `anual`, el año anterior)

**Framing:** todo entregable abre con "Preparado para revisión del contador — no es asesoría tributaria."

**No hace falta un ledger.** Los libros de Inherent viven en Excel y los cierra un contador externo: el camino por defecto es la hoja exportada como CSV/XLSX (ventas, compras y constancias de retención) y, para cruzar, la exportación de DTE de la Agencia Virtual. Si algún día se conecta un ledger (MYOB, NetSuite, QuickBooks, Xero o Zoho Books), se usa ese (`../../shared/connector-neutrality.md`).

**Revisar país y régimen antes del Step 1.** Leer `Country` y `Régimen tributario` del bloque `## Business context` (`../../shared/currency-and-locale.md`). Por defecto: Guatemala, **Régimen de Pequeño Contribuyente del IVA**. Si un documento es de otro país, se dice en una línea, se corre el Step 1 para cerrar los libros y se entrega el paquete de libros cerrados en vez de una declaración. Si el contexto dice otro régimen, tax-season-organizer sigue su tabla de referencia y lo dice.

**Expensify, when connected, is read-only and adds one thing worth having:** the expenses with
no receipt attached. Se muestra el total y la cuenta junto a la declaración — un gasto sin
factura es lo primero que va a preguntar el contador, y es más barato encontrarlo ahora que
en el cierre del año.

## Step 0 — Confirm the mode

Si no vino `--mode`, se dice el modo inferido en una línea y el CEO puede cambiarlo: "Es enero, así que preparo el paquete del cierre del año pasado y la declaración de diciembre. ¿Querés otra cosa?" No se hace una entrevista — el CEO escribió /tax-prep.

## Step 1 — Books first (month-end-prep)

Correr `month-end-prep` sobre los períodos de los que depende el trabajo: el mes a declarar en `mensual`, el año completo en `anual`. Sin ledger conectado, `month-end-prep` corre sobre el Excel y los estados de cuenta exportados.

**Verify before you re-close.** Check whether each month in scope is already closed — reconciled, no open flagged items, packet produced.

- **Already closed** → verify only. Confirmar que la conciliación se sostiene y que no se registró nada después del cierre, y decirlo en una línea: "Agosto y septiembre ya están cerrados y siguen cuadrando. Paso a la declaración." No se vuelve a cerrar un mes que el contador cerró la semana pasada.
- **Not closed** → run the close for the open periods. `month-end-prep`'s own Step 6 sign-off gate holds.
- **Partially closed** → close only the open months and verify the rest.

**In:** los períodos en alcance. **Out:** ingresos brutos conciliados por mes, el detalle conciliado de pagos a proveedores, las constancias de retención del período, y la lista de lo que sigue abierto.

### The gate before Step 2

No se calcula nada hasta que los libros del período estén resueltos. Si quedan cosas abiertas, se dice qué son y qué le hacen al número:

> "Hay cuatro facturas emitidas en los DTE que no están en el Excel de septiembre, por Q18,400. Hasta que se aclaren, el IVA del mes puede moverse hasta Q920. Aclaralas, o decime que siga y lo dejo como supuesto."

Si el CEO sigue igual, eso pasa a ser un supuesto declarado en el entregable — no una nota al pie.

## Step 2 — Tax materials (tax-season-organizer)

Correr `tax-season-organizer` en el modo elegido, solo con las cifras conciliadas del Step 1.

- **In:** ingresos brutos conciliados del mes (ruta mensual) o de los 12 meses y el detalle por proveedor (ruta anual), más las constancias de retención.
- **Out:** el SAT-2046 del mes con su cálculo, plazo y tabla de supuestos; o el paquete anual con los meses sin declaración, las facturas que faltan y el checklist del contador — o los dos. **En los dos, la revisión del tope del régimen.**
- **Gate:** ninguno para producir el paquete. Nada se presenta ni se paga, nunca.

Cuando corren los dos modos, primero el anual — genera las acciones con más plazo encima — y después el mensual.

Decir de dónde salió el número: "Esta declaración está hecha sobre los libros cerrados de septiembre, no sobre el Excel sin conciliar." Esa frase es lo que hace que valga la pena correr la cadena.

**El tope del régimen va arriba de todo si hay alerta.** Si los ingresos del año o de los últimos 12 meses se acercan o pasan el tope del Régimen de Pequeño Contribuyente, la primera línea del entregable es la alerta para el CEO: "Revisar con el contador el cambio de régimen." Las líneas de alerta y el tope con su fuente están en `../tax-season-organizer/reference/calculation-assumptions.md`.

Ejemplo (cifras ilustrativas): "SAT-2046 de septiembre: Q731.50, dentro de octubre. Hecho sobre Q25,795.00 de ingresos del cierre de septiembre, menos una constancia de Q558.25. Tope: 46% del año. Confirmar con el contador."

## What not to do

- **No calcular un impuesto sobre libros sin conciliar.** Para eso existe la cadena.
- **No volver a cerrar un mes que ya está cerrado.** Se verifica y se sigue.
- **No dar asesoría tributaria.** Todo entregable es material para el contador y lo dice en el encabezado.
- **No esconder un supuesto.** Fuente de los ingresos, facturas excluidas, tipo de cambio, constancias que faltan, monto del tope usado — todos en la lista, para que el contador tenga las palancas.
- **No juntar proveedores automáticamente.** "Juan López" y "Juan A. López" se marcan para un humano.
- **No decidir el cambio de régimen.** Se alerta; deciden el CEO y el contador.
- **No presentar ni pagar nada, nunca.**

## Output

**Deliver the accountant packet per the owner's stored output preference — never default to a markdown file.** Check the `## Business context` block's `Output preference` (shared style guide rule, `../../shared/artifact-style.md`):

- **Visual artifact (the default):** la portada del paquete como página HTML en el estilo de la casa — la alerta del tope arriba si la hay, el monto del SAT-2046 como dato principal con su plazo, el medidor del tope, la tabla de supuestos y el checklist del contador como filas. Abre con la línea de no-asesoría. Los documentos del paquete mantienen sus formatos.
- **docx / md / notion preference:** el mismo contenido en ese formato — un DOCX o markdown, o una página de Notion creada por el conector (destino nombrado, sin sobrescribir); si Notion no está conectado, la página visual, y se dice por qué.
- **Best for skill:** la página visual — es una página de revisión para el CEO antes de que vaya al contador.

Cerrar con un checklist para el contador: declaraciones que faltan, facturas y constancias que pedir, supuestos que verificar, cosas abiertas en los libros que podrían mover el número, y los plazos.

Después, un cierre corto: el paquete está listo para el contador, hecho sobre libros cerrados. El siguiente paso natural es "cash forecast" — `cash-flow-snapshot` muestra si el pago sale en su plazo. También a mano: "close the month" (`/close-month`) para que la próxima declaración salga de números conciliados, y "build me a report" (`report-builder`) para seguir el tope del régimen mes a mes. Ofrecer tres como máximo, y no repetir lo que el CEO ya rechazó en la sesión.

## Using a tool that isn't listed

Los conectores nombrados en esta skill son los caminos probados, no un muro. Si el CEO quiere que este flujo use una herramienta que no está conectada ni listada, primero se conecta como MCP o conector nativo —se revisa el directorio de conectores y, si no existe, Zapier—, nunca armando a mano contra una API cruda. **Un MCP declarado no es un MCP conectado:** hasta que la conexión existe, la skill no la promete. Una vez conectada, la herramienta entra a esta skill como cualquier otro conector opcional, bajo las mismas aprobaciones.
