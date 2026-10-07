---
name: tax-season-organizer
description: >
  Prepara el material de impuestos de Inherent para el contador, no asesoría
  tributaria. SAT de Guatemala. Régimen por defecto: Pequeño Contribuyente del
  IVA (5% mensual, SAT-2046), con vigilancia del tope de ingresos anuales del
  régimen. Dos modos: (1) la declaración del mes, desde el Excel exportado de
  ventas y compras y las constancias de retención; (2) el cierre del año, con el
  paquete de documentos y libros que necesita el contador. Los otros regímenes
  (General, Opcional Simplificado, Utilidades, ISO) quedan como referencia.

  Todo pedido de impuestos entra primero por /tax-prep, que confirma que los
  libros del período estén cerrados. Esta skill se usa directo solo cuando el CEO
  dice que los libros ya están cerrados: "los libros ya están cerrados, solo la
  declaración," "armá el paquete anual del contador," o "¿cómo vamos con el tope?"
allowed-tools: Read, WebFetch
---

# Tax Season Organizer
> Adaptado para Inherent a partir de Anthropic small-business (Apache 2.0).

> **Framing:** Esta skill produce material para el contador, no asesoría tributaria. Se
> dice temprano y se declara cada supuesto para que el contador pueda ajustar.

## Quick start

Se decide qué modo hace falta, se leen los datos, se calcula o se compila, y se entrega
un documento con el que el contador trabaja directo.

```
CEO: "¿cuánto declaramos de IVA este mes?"
→ Leer las ventas del mes del Excel exportado (o la exportación de DTE emitidos)
→ IVA Pequeño Contribuyente = ingresos brutos del mes × 5%
→ Restar las retenciones de IVA con constancia recibidas en el mes
→ Revisar el tope del régimen (año calendario y últimos 12 meses)
→ Output: "SAT-2046 de septiembre: Q X a pagar, dentro de octubre — detalle abajo"

CEO: "armá lo del contador para el cierre del año"
→ Los 12 meses: ventas, compras con factura, constancias, SAT-2046 presentados
→ Proveedores: quién facturó, con qué NIT y qué documento falta
→ El tope del año contra el régimen
→ Output: paquete anual + lista de lo que falta
```

## Step 0 — Revisar el país y el régimen

Leer `Country` y `Régimen tributario` del bloque `## Business context`
(regla: `../../shared/currency-and-locale.md`).

- **País:** por defecto GT. Si un documento es de otro país, se dice en una línea y se
  prepara solo el paquete de libros cerrados. No se corre un cálculo de la SAT sobre
  otro país, ni se le pone otra etiqueta.
- **Régimen:** **Inherent está inscrita en el Régimen de Pequeño Contribuyente del IVA**
  —es el camino por defecto—. Si el contexto dice otro régimen, se sigue la tabla
  «Otros regímenes» de [reference/calculation-assumptions.md](reference/calculation-assumptions.md)
  y se dice en el entregable qué régimen se usó. Si hay una constancia del RTU a mano,
  se compara contra el contexto y cualquier diferencia se le avisa al CEO antes de
  calcular.
- **Agente de retención:** si el contexto no dice si Inherent retiene ISR o IVA a sus
  proveedores, no se supone: se pregunta al contador una vez y se guarda.

Todo monto sale en quetzales (`Q`). Un umbral o un plazo legal se escribe con su fuente.

## Determine mode

Leer el mensaje y el contexto para decidir la ruta:

- **Declaración del mes** — palabras: declaración, IVA del mes, SAT-2046, cuánto pagamos, retenciones, el tope
- **Cierre del año** — palabras: cierre, fin de año, paquete del contador, libro de compras y ventas, proveedores, facturas que faltan
- **Las dos** — en enero se corren las dos: primero el cierre del año anterior (genera las acciones con más plazo encima), después la declaración de diciembre.

Si no está claro, preguntar: "¿Es la declaración de este mes, el paquete del cierre del año, o las dos?"

**La revisión del tope corre en los dos modos, siempre.**

---

## Path 1: Declaración del mes (Pequeño Contribuyente)

### 1. Leer las ventas del mes

**El camino por defecto es el Excel:** los libros de Inherent viven en Excel y los cierra
un contador externo. Se pide la hoja del mes exportada como CSV/XLSX, o la exportación de
DTE emitidos de la Agencia Virtual. Se captura:

- **Ingresos brutos del mes** — el total facturado por ventas y servicios, factura por factura
- **Facturas anuladas** — se excluyen, y se listan
- **Facturas en USD** — se muestran en USD y en quetzales, con el tipo de cambio que use el contador; si no está, va como `⚠️ SIN DATOS`

Mapeo de columnas y qué hacer con cada fuente: [reference/connector-queries.md](reference/connector-queries.md).

### 2. Leer las constancias de retención

Preguntar o leer: "¿Qué constancias de retención de IVA nos entregaron este mes?" Por cada
una: cliente, NIT, factura, monto retenido. Un cliente agente de retención retiene el 5%
en facturas de Pequeño Contribuyente de Q2,500.01 o más; si una factura de ese tamaño a un
agente de retención no tiene constancia, se marca para pedirla (fuente en
[reference/calculation-assumptions.md](reference/calculation-assumptions.md)).

### 3. Calcular

La fórmula, las fuentes y la tabla de supuestos están en
[reference/calculation-assumptions.md](reference/calculation-assumptions.md).

1. **IVA del mes** = ingresos brutos del mes × 5%
2. **Retenciones** = suma de las constancias de IVA recibidas en el mes
3. **A pagar con el SAT-2046** = IVA del mes − retenciones (si da cero o menos, se presenta igual)
4. **Plazo** = dentro del mes calendario siguiente
5. **ISR** = no aplica: el Pequeño Contribuyente está relevado del ISR (se dice, con la fuente)

**Si un mes ya venció sin presentar**, se nombra y va en su propia línea, separado del mes
actual. Multas y recargos los calcula el contador — se avisa que aplican, nunca se estiman.

### 4. Revisar el tope del régimen

Con la serie de ingresos mensuales (pedir los 12 meses anteriores la primera vez y
guardarla), mostrar:

- **Año calendario a la fecha** contra el tope, en Q y en %
- **Últimos 12 meses** contra el tope, en Q y en %
- **Proyección del año** al ritmo actual, rotulada como proyección

Y aplicar las líneas de alerta de [reference/calculation-assumptions.md](reference/calculation-assumptions.md).
**Una alerta 🟡, 🔴 o ⛔ va arriba de todo en el entregable, antes del monto a pagar**,
dirigida al CEO: "Revisar con el contador el cambio de régimen." Nunca se decide el
cambio, ni se calcula cuánto costaría el otro régimen.

### 5. Declarar supuestos y entregar

La estructura sección por sección está en
[reference/output-formats.md](reference/output-formats.md).

Dos cosas no se negocian: **el período y el régimen van en el encabezado**, y **la sección
de Supuestos lista todo** — la fuente de los ingresos (Excel o DTE), las facturas
excluidas, el tipo de cambio de las facturas en USD, las constancias que faltan y el
monto del tope que se usó con su fuente.

---

## Path 2: Cierre del año

### 1. Los 12 meses completos

Por cada mes del año: ingresos brutos, IVA del mes, constancias recibidas, si el SAT-2046
se presentó (con número de formulario si el CEO o el contador lo tienen). **Un mes sin
declaración presentada es la primera acción de la lista**, aunque haya sido cero: el
Pequeño Contribuyente declara cada mes.

### 2. El libro de compras y ventas

El Pequeño Contribuyente lleva el libro de compras y ventas habilitado por la SAT. Se
cruza:

- **Ventas del libro vs. DTE emitidos** del año — toda diferencia se lista, factura por factura
- **Compras del libro vs. DTE recibidos** — una compra sin factura se marca: la ley obliga a exigir y conservar las facturas

### 3. Proveedores y personas a las que se les pagó

Juntar del Excel (y de la exportación de DTE recibidos) **todos los pagos por servicios
del año** — incluidos los rubros fijos por cuenta (grabación, fotografía, edición,
operador de agentes). Por persona o empresa:

- Nombre, NIT, total pagado, meses
- **Documento recibido:** factura FEL (y de qué régimen), otro documento, o nada
- Estado: ✅ factura en todos los pagos · ⚠️ falta factura en algún pago · ❓ no se puede saber con los datos

**No se juntan personas por parecido de nombre** («Juan López» y «Juan A. López»): se
marcan para que un humano decida.

**Retenciones:** si Inherent no es agente de retención (lo dice el contexto), no se
calcula ninguna. Si el contexto dice que sí, se marcan los pagos que podrían llevar
retención y el contador decide; esta skill no calcula retenciones a terceros.

### 4. El tope del año

El total del año calendario contra el tope del régimen, con la alerta que corresponda. Si
se pasó, es la primera línea del paquete.

### 5. Entregar el paquete anual

La estructura está en [reference/output-formats.md](reference/output-formats.md). Lo que
más pesa: **los meses sin declaración**, **las facturas que faltan** y **el tope**.

---

## Guardrails

- **Nombrar el período y el régimen en todo entregable.** Las tasas, el tope y los plazos
  de [reference/calculation-assumptions.md](reference/calculation-assumptions.md) llevan
  fuente. Si se pregunta por un año o un régimen que ese archivo no cubre, se dice fuerte
  antes de mostrar un número. **Nunca se inventa una tasa, un tope ni un plazo.**
- **No es asesoría tributaria.** Todo entregable abre con: "Preparado para revisión del contador — no es asesoría tributaria." En el encabezado del documento, no solo en el chat.
- **Declarar cada supuesto.** El contador ajusta; hay que darle las palancas.
- **No juntar proveedores automáticamente.** Se marcan los posibles duplicados.
- **No presentar nada.** Nada se declara, se paga ni se envía a la SAT. El entregable es material para el contador.
- **El cambio de régimen es una alerta, no una decisión.** Lo decide el CEO con el contador.
- **Nunca reproducir un DPI/CUI, un número de afiliación al IGSS ni una cuenta bancaria completa** en el paquete, el chat o una página. El NIT en una factura o una constancia es la única excepción prevista (`../../shared/personal-data.md`).

## More sources

- **Exportación de DTE de la Agencia Virtual** — emitidos y recibidos, descargados por el CEO o el contador. Es la fuente más limpia para cruzar contra el Excel. La skill no entra a la Agencia Virtual: no hay MCP para eso.
- **Un ledger, si algún día se conecta** (MYOB, NetSuite, QuickBooks, Xero o Zoho Books) — reemplaza al Excel como fuente de ventas y compras. Consultas en `reference/connector-queries.md`.
- **PayPal, Stripe** — cobros de clientes del exterior, para cruzar contra las facturas emitidas.
- **Ramp, Expensify** — gastos con y sin comprobante: el gasto sin factura es lo primero que va a preguntar el contador.

El mismo cálculo y el mismo paquete. Más fuentes, menos supuestos que declarar.

## Output

**Deliver the declaration or the annual package per the owner's stored output preference — never default to a markdown file.** Check the `## Business context` block's `Output preference` (shared style guide rule, `../../shared/artifact-style.md`):

- **Visual artifact (the default):** la página en el estilo de la casa — la alerta del tope arriba si la hay, el monto a pagar del SAT-2046 como dato principal con su plazo, el medidor del tope, la tabla de supuestos, y las facturas o constancias que faltan como filas con su pill. Abre con la línea de no-asesoría. Los documentos para el contador mantienen la estructura de `reference/output-formats.md`.
- **docx / md / notion preference:** el mismo contenido en ese formato — un DOCX o markdown, o una página de Notion creada por el conector (destino nombrado, sin sobrescribir); si Notion no está conectado, la página visual, y se dice por qué.
- **Best for skill:** la página visual — es una página de estado sobre documentos para el contador.

## After the packet

La declaración o el paquete anual está en manos del contador, con los supuestos
declarados. El siguiente paso natural es "close the month" — `/close-month` mantiene la
próxima declaración sobre números conciliados. También a mano: "cash forecast"
(`cash-flow-snapshot`) para confirmar que el pago sale en su plazo, y "who owes me money"
(`invoice-chase`) si hay que cobrar para cubrirlo. Ofrecer tres como máximo, y no repetir
lo que el CEO ya rechazó en la sesión.

## Reference files

- [reference/calculation-assumptions.md](reference/calculation-assumptions.md) — el régimen de Pequeño Contribuyente, el tope y sus alertas, los otros regímenes como referencia; cada cifra con su fuente
- [reference/output-formats.md](reference/output-formats.md) — estructura de la declaración del mes y del paquete anual
- [reference/connector-queries.md](reference/connector-queries.md) — cómo leer el Excel, la exportación de DTE y, si se conecta, cada ledger
- [reference/gotchas.md](reference/gotchas.md) — patrones buenos y malos
- [reference/examples/declaracion-del-mes.md](reference/examples/declaracion-del-mes.md) — ejemplo trabajado de la declaración del mes
- [reference/examples/cierre-del-ano.md](reference/examples/cierre-del-ano.md) — ejemplo trabajado del cierre del año

## Using a tool that isn't listed

Los conectores nombrados en esta skill son los caminos probados, no un muro. Si el CEO quiere que este flujo use una herramienta que no está conectada ni listada, primero se conecta como MCP o conector nativo —se revisa el directorio de conectores y, si no existe, Zapier—, nunca armando a mano contra una API cruda. **Un MCP declarado no es un MCP conectado:** hasta que la conexión existe, la skill no la promete. Una vez conectada, la herramienta entra a esta skill como cualquier otro conector opcional, bajo las mismas aprobaciones.
