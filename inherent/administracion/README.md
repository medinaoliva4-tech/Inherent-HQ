# Administración de Inherent

> **Las skills para administrar Inherent como empresa:** finanzas, impuestos, cobros, ventas,
> contratos, correo, contratación y el resumen del negocio. **Son solo para Inherent**, no para
> los clientes.

Vienen del plugin **Small Business** de Anthropic *(licencia Apache 2.0, ver `LICENSE`)*,
adaptadas a Inherent. El diseño va por Figma, no por Canva, y el marketing lo hacen nuestros
agentes, así que esas skills no están aquí.

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
| 🏛️ **Impuestos (SAT)** | `tax-prep` · `tax-season-organizer` | Declaraciones y orden de documentos para la SAT |
| 📈 **Ventas** | `lead-triage` · `call-list` · `crm-autopilot` · `proposal-builder` | Prospectos, a quién llamar, el CRM y las propuestas de nuestros planes |
| 📄 **Operación** | `contract-review` · `inbox-manager` | Contratos y correo |
| 👥 **Equipo** | `job-post-builder` · `hiring-screener` | Publicar puestos y filtrar candidatos |
| 🧭 **Resumen** | `monday-brief` · `business-pulse` | El negocio en una página |
| ⚙️ **Arranque** | `smb-router` · `smb-onboard` | La entrada y la configuración inicial |

`shared/` tiene las reglas comunes que usan todas *(moneda, datos personales, contenido no
confiable, formato)*.

🔒 **Nada se envía, se paga ni se publica sin la aprobación del CEO.**
