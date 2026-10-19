# Administración de Inherent

> **Las skills para administrar Inherent como empresa:** finanzas, impuestos, cobros, ventas,
> contratos, correo, contratación y el resumen del negocio. **Son solo para Inherent**, no para
> los clientes.

Vienen del plugin **Small Business** de Anthropic *(licencia Apache 2.0, ver `LICENSE`)*,
adaptadas a Inherent. El diseño va por Figma, no por Canva, y el marketing lo hacen nuestros
agentes, así que esas skills no están aquí: todo lo de clientes, marketing, contenido, pauta,
marca y comunidad —incluidas nuestras propias redes— entra por `/inherent`.

**Valores por defecto:** Guatemala, quetzales (`Q`), español, `America/Guatemala`. **Los libros
viven en Excel y los cierra un contador externo:** donde una skill pide un ledger, corre sobre el
Excel exportado y entrega el paquete para el contador.

**La puerta de entrada es `smb-router`:** se le dice en lenguaje normal lo que se necesita y él
elige la skill.

## Las skills

| Área | Skill | Para qué |
|---|---|---|
| 💰 **Caja** | `cash-flow-snapshot` | La caja de los próximos 30 días |
| | `plan-payroll` | ¿Alcanza para pagarle al equipo? Caja + cobros atrasados |
| | `payroll-prep` | Preparar el pago al equipo |
| 💸 **Cobros y pagos** | `invoice-chase` | Cobrar a los clientes atrasados |
| | `ap-processor` | Registrar las facturas de proveedores |
| | `pay-the-bills` | De las facturas recibidas a la corrida de pagos |
| 📒 **Cierre** | `month-end-prep` | Conciliar y encontrar lo que falta |
| | `close-month` | Cerrar el mes y armar el paquete para el contador |
| | `report-builder` · `report-pack` | Reportes y reportes recurrentes |
| 🏛️ **Impuestos (SAT)** | `tax-prep` · `tax-season-organizer` | La declaración mensual de Pequeño Contribuyente, el paquete anual del contador y la alerta del tope del régimen |
| 📈 **Ventas** | `lead-triage` · `call-list` · `crm-autopilot` · `proposal-builder` | Prospectos, a quién llamar, el CRM y las propuestas de nuestros niveles |
| 📄 **Operación** | `contract-review` · `inbox-manager` | Contratos y correo |
| 👥 **Equipo** | `job-post-builder` · `hiring-screener` | Publicar puestos y filtrar candidatos |
| 🧭 **Resumen** | `monday-brief` · `business-pulse` | El negocio en una página |
| 🗂️ **CRM** | `crm/` | Los prospectos: contactos, oportunidades y actividad |
| ⚙️ **Arranque** | `smb-router` · `smb-onboard` | La entrada y la configuración inicial |

`shared/` tiene las reglas comunes que usan todas *(moneda, datos personales, contenido no
confiable, formato)*.

🔒 **Nada se envía, se paga ni se publica sin la aprobación del CEO.**
✅ **Antes de pedírsela, la factura y la propuesta cumplen su ficha** de
`inherent/08-CRITERIOS-DE-ACEPTACION.md`: «9 · Factura» y «10 · Propuesta / cotización».
