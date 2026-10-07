# Supuestos de cálculo — SAT Guatemala
> Adaptado para Inherent a partir de Anthropic small-business (Apache 2.0).

Este archivo documenta las cifras, plazos y formularios que usa `tax-season-organizer`.
Siempre se muestran en el entregable para que el contador pueda ajustar.

> **Cada tasa, tope y plazo de abajo lleva su fuente.** Las leyes se reforman y el
> salario mínimo cambia cada año: el tope del Pequeño Contribuyente, por ejemplo, ya no
> es el monto fijo que dice el texto de la Ley del IVA publicado por la SAT, porque el
> Decreto 31-2024 lo cambió a salarios mínimos.
>
> **Si una cifra no está aquí con su fuente, no se escribe.** Se dice en el entregable,
> con las palabras del CEO:
>
> > "Este dato no lo tengo verificado con una fuente oficial. Lo tiene que confirmar el
> > contador antes de declarar."
>
> Si se puede leer una cifra actual de una fuente oficial (portal.sat.gob.gt, el texto
> de la ley, mintrabajo.gob.gt), se usa y se cita la URL. Si la fuente oficial y el
> contador dicen cosas distintas, manda el contador y se anota la diferencia. Una tasa
> inventada de memoria se ve igual que una real en la página.

---

## El régimen de Inherent

**Inherent está inscrita en el Régimen de Pequeño Contribuyente del IVA.** Es el
régimen por defecto de la skill. Si el `## Business context` dice otro régimen, manda
ese. El régimen inscrito se puede verificar en la constancia del RTU
[fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/].

---

## Régimen de Pequeño Contribuyente (el de Inherent)

| Dato | Valor | Fuente |
|---|---|---|
| **Tarifa** | 5% sobre los ingresos brutos totales por ventas o prestación de servicios de cada mes calendario | Ley del IVA, Decreto 27-92, art. 47 [fuente: https://portal.sat.gob.gt/portal/descarga/1899/legislacion-tributaria/53964/decreto-no-27-92-ley-del-impuesto-al-valor-agregado-decreto-numero-27-92] |
| **Formulario** | SAT-2046, IVA del Régimen de Pequeño Contribuyente, en Declaraguate | [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/] |
| **Plazo** | Dentro del mes calendario siguiente al del período («la declaración mensual de enero la presentarás en febrero») | [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/] |
| **Se declara aunque sea cero** | Sí: se presenta haya o no actividad, y aunque le hayan retenido todo el impuesto | Ley del IVA, art. 48 [fuente: URL de la Ley del IVA arriba] |
| **Retención por clientes** | Un cliente que es agente de retención del IVA retiene el 5% en facturas de Pequeño Contribuyente de Q2,500.01 o más; la retención es pago definitivo y se entrega constancia | [fuente: https://portal.sat.gob.gt/portal/sistemas-web/retencioneswebiva/] · Ley del IVA, art. 48 |
| **Constancias en la declaración** | La constancia de retención recibida en el mes se reporta dentro del SAT-2046 | [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/] |
| **ISR** | Relevado del pago y la presentación de la declaración anual, trimestral o mensual del ISR | Ley del IVA, art. 49 [fuente: URL de la Ley del IVA arriba] |
| **Libro** | Solo el libro de compras y ventas habilitado por la SAT; las ventas se pueden consolidar por día; físico o electrónico | Ley del IVA, art. 49 |
| **Facturas recibidas** | Obligación de exigirlas y conservarlas por el plazo de prescripción | Ley del IVA, art. 49 |
| **Crédito fiscal del cliente** | La factura de Pequeño Contribuyente no genera crédito fiscal para quien la recibe; para él es costo en el ISR | Ley del IVA, art. 49 |
| **Factura electrónica** | Todos los Pequeños Contribuyentes deben emitir en el Régimen FEL | Resolución SAT-DSI-1350-2022, citada en [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/] |
| **Identificación del receptor** | Desde Q2,500.00 la factura lleva NIT (o CUI, o pasaporte si es extranjero); «Consumidor Final» solo por debajo de ese monto | Reglamento de la Ley del IVA, art. 30 num. 9 (Acuerdo Gubernativo 12-2023), citado en [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/] |

### El tope de ingresos — lo que la skill vigila

| Dato | Valor | Fuente |
|---|---|---|
| **Regla** | Las ventas o servicios no deben exceder el equivalente de **125 salarios mínimos mensuales vigentes del sector no agrícola, sin bonificación incentivo** | Decreto 31-2024 [fuente: https://portal.sat.gob.gt/portal/requisitos-tramites-agencias/actualizacion-cambio-de-regimen-general-del-impuesto-al-valor-agregado-a-pequeno-contribuyente/] |
| **Monto que publica la SAT** | Usan el SAT-2046 quienes «en un período fiscal (de enero a diciembre) facturan menos de **Q500,285.00**» | [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/] |
| **Período de medida** | Año calendario, de enero a diciembre | misma fuente |
| **Si se pasa** | El texto de la ley dice que debe pedir su inscripción al Régimen General y que, si no, la SAT puede inscribirlo de oficio | Ley del IVA, art. 50 [fuente: URL de la Ley del IVA arriba]. ⚠️ Ese texto todavía dice Q150,000; el monto lo cambió el Decreto 31-2024 |

**El monto en quetzales cambia cuando cambia el salario mínimo.** Cada enero, la skill
vuelve a leer el monto publicado por la SAT; si no lo encuentra, usa el último con su
fuente y le pide al contador que lo confirme.

**Las líneas de alerta son de criterio, no de ley.** La ley tiene una sola línea —el
tope—. La skill avisa antes:

| Nivel | Cuándo | Qué dice |
|---|---|---|
| 🟡 **Acercándose** | Ingresos del año calendario o de los últimos 12 meses ≥ 75% del tope, o la proyección del año al ritmo actual ≥ 90% | "Vamos al X% del tope de Pequeño Contribuyente. Conviene revisar con el contador cuándo tocaría el cambio de régimen." |
| 🔴 **Cerca** | ≥ 90% del tope, o la proyección del año lo pasa | "Al ritmo actual pasamos el tope en <mes>. Hay que revisar con el contador el cambio de régimen antes de que pase." |
| ⛔ **Pasado** | > 100% del tope en el año calendario | "Pasamos el tope de Pequeño Contribuyente. Revisar con el contador ya el cambio al Régimen General." |

**Por qué los últimos 12 meses además del año calendario:** la ley mide de enero a
diciembre, pero el año móvil avisa antes, cuando el crecimiento viene de los meses
recientes. El entregable muestra las dos cifras, rotuladas.

**Proyección del año:** `ingresos del año a la fecha ÷ meses transcurridos × 12`.
Es una estimación, se rotula así, y se pregunta una vez si el año es parejo: un cliente
nuevo grande cambia la proyección más que el promedio.

**Lo que la skill nunca hace:** decidir el cambio de régimen ni calcular cuánto se
pagaría en el Régimen General. Eso lo decide el CEO con el contador.

---

## Otros regímenes — solo referencia

Si algún día Inherent cambia de régimen, la skill sigue esta tabla. Hasta entonces no
corre ninguno de estos cálculos.

### IVA — Régimen General

| Dato | Valor | Fuente |
|---|---|---|
| Tarifa | 12% sobre la base imponible, incluida en el precio | Ley del IVA, art. 10 [fuente: https://portal.sat.gob.gt/portal/descarga/1899/legislacion-tributaria/53964/decreto-no-27-92-ley-del-impuesto-al-valor-agregado-decreto-numero-27-92] |
| Declaración | Mensual, dentro del mes calendario siguiente; débitos menos créditos | Ley del IVA, arts. 40 y 50 |
| Formulario | SAT-2237 IVA General | [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/] |
| Libros | Libro de compras y servicios recibidos y libro de ventas y servicios prestados | Ley del IVA, art. 37 |
| Retenciones que le hacen | Agentes de retención: 15% contribuyentes especiales y otros; 65% exportadores; 25% sector público | [fuente: https://portal.sat.gob.gt/portal/sistemas-web/retencioneswebiva/] |

### ISR — Régimen Opcional Simplificado sobre Ingresos de Actividades Lucrativas

| Dato | Valor | Fuente |
|---|---|---|
| Tipos | 5% sobre la renta imponible mensual hasta Q30,000.00; Q1,500.00 más 7% sobre el excedente | Decreto 10-2012, art. 44 [fuente: https://tse.org.gt/images/UECFFPP/leyes/decreto_10-2012_Ley_actualizacion_tributaria.pdf] · [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/] |
| Período | Mensual | Decreto 10-2012, art. 45 |
| Formulario y plazo | SAT-1311, en los primeros 10 días hábiles del mes siguiente | [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/] |
| Retención | Los agentes de retención no retienen en compras menores de Q2,500.00 sin IVA | Decreto 10-2012, art. 48 |
| Anual | Declaración jurada anual informativa en los primeros tres meses del año (SAT-1411) | Decreto 10-2012, art. 49 · [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/] |

### ISR — Régimen sobre las Utilidades de Actividades Lucrativas

| Dato | Valor | Fuente |
|---|---|---|
| Tipo | 25% sobre la renta imponible | Decreto 10-2012, art. 36 [fuente: https://tse.org.gt/images/UECFFPP/leyes/decreto_10-2012_Ley_actualizacion_tributaria.pdf] |
| Pagos trimestrales | Por cierre parcial, o sobre una renta imponible estimada en 8% de las rentas brutas del trimestre; dentro del mes siguiente al trimestre; el cuarto trimestre va con la anual | Decreto 10-2012, art. 38 · SAT-1361 [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/] |
| Anual | SAT-1411, del 1 de enero al 31 de marzo | [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/] · Decreto 10-2012, art. 39 |
| Cambio de régimen | Aviso en el mes anterior al nuevo período; aplica desde el 1 de enero siguiente | Decreto 10-2012, art. 51 |

### ISO — Impuesto de Solidaridad

| Dato | Valor | Fuente |
|---|---|---|
| Quién | Régimen sobre las Utilidades, con margen bruto superior al 4% de los ingresos brutos | Decreto 73-2008, art. 1 [fuente: https://portal.sat.gob.gt/portal/descarga/1899/legislacion-tributaria/18278/decreto-numero-73-2008-ley-del-impuesto-de-solidaridad] |
| Exentos | Quienes pagan ISR en el Régimen Opcional Simplificado, y los primeros cuatro trimestres de operación, entre otros | Decreto 73-2008, art. 4 |
| Tipo | 1% sobre la mayor entre la cuarta parte del activo neto y la cuarta parte de los ingresos brutos | Decreto 73-2008, arts. 7 y 8 |
| Pago | Dentro del mes siguiente a cada trimestre calendario; SAT-1608 | Decreto 73-2008, art. 10 · [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/] |
| Acreditamiento | ISO e ISR se acreditan entre sí, según la opción elegida | Decreto 73-2008, art. 11 |

### Retenciones que practica quien es agente de retención

| Dato | Valor | Fuente |
|---|---|---|
| ISR retenido | SAT-1331, en los primeros 10 días hábiles del mes siguiente | [fuente: https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/] |
| IVA retenido | SAT-2340, en los primeros 15 días hábiles del mes siguiente | [fuente: https://portal.sat.gob.gt/portal/sistemas-web/retencioneswebiva/] |

**Si Inherent es o no agente de retención** depende de su régimen y de si lleva
contabilidad completa (Decreto 10-2012, art. 47). No se supone: se le pregunta al
contador una vez y se guarda en el `## Business context`.

---

## Lo que el cálculo NO incluye

Se lista siempre en el entregable:

- Multas, intereses y recargos por presentar tarde — los calcula el contador
- Cualquier obligación municipal o de otro ente (IUSI, boleto de ornato, licencias)
- Planilla: IGSS, IRTRA, INTECAP, aguinaldo y Bono 14 (`../../../shared/currency-and-locale.md`)
- Si alguna factura en USD a un cliente del exterior tiene un trato distinto — se
  confirma con el contador
- Cualquier régimen distinto del inscrito en el RTU
