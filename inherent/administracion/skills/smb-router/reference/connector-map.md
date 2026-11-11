# Connector Map
> Adaptado para Inherent a partir de Anthropic small-business (Apache 2.0).

Required and optional connectors per skill, plus each skill's zero-connector fallback. The router uses this to avoid recommending something that will partially fail, and to offer the fallback path instead.

**Las listas de abajo son los caminos probados, no un muro.** Si el CEO quiere que una skill use una herramienta que no está listada, primero se conecta como MCP (directorio de conectores o, si no hay, Zapier); un MCP declarado no es un MCP conectado. Una vez conectada, entra a esa skill como cualquier otro conector opcional, con las mismas aprobaciones.

**En Inherent no hay ledger conectado:** los libros viven en Excel y los cierra un contador externo. En toda fila que pide «a ledger», el camino que corre hoy es la columna de fallback con el Excel exportado (CSV/XLSX), y el entregable es el paquete para el contador.

Every skill works with zero connectors. "Required" below means required for the *connected* path — the fallback column is always available.

**Call shapes.** Parameter shapes that connectors require and tool descriptions do not make obvious are collected in [`../../../shared/connector-call-shapes.md`](../../../shared/connector-call-shapes.md); a skill reads the row for a connector before its first call to it.

**One product, possibly two entries.** The owner's own connector and the plugin's manifest registration of it (`small-business:<name>`) count as one; a gate opens if either is authorized (`../../../shared/connector-neutrality.md`, "One connector, two registrations").

**Gates are categories, not vendors.** Where a row says "a ledger," any of MYOB, NetSuite, QuickBooks, Xero, or Zoho Books opens the gate; "a payments connector" is any of PayPal, Square, or Stripe; "a CRM" is any of HubSpot, Monday.com, Salesforce, or Zoho CRM (Salesforce is owner-added as a custom connector, not in the manifest); "a storefront" is either of Shopify or Square (the connectors that hold orders and stock); "Mail" is either of Gmail or Microsoft 365; "a file store" is either of Google Drive or Microsoft 365 (Microsoft 365 is one connector covering both of those categories, and is owner-added as a custom connector, not in the manifest); and none ranks above another (`../../../shared/connector-neutrality.md`). Vendor lists are alphabetical. Capability limits that matter to a gate are in the footnotes under each table, stated as what the connector holds, not as a ranking.

---

## Run the business

| Skill | Required | Optional | Zero-connector fallback |
|---|---|---|---|
| `report-builder` | any one data source | Expensify, HubSpot, MYOB, NetSuite, PayPal, QuickBooks, Ramp, Shopify, Square, Stripe, Xero, Zoho Books | CSV/XLSX upload — fully functional |
| `business-pulse` | none | Calendar, DocuSign, Expensify, Gmail or M365, Gusto, HubSpot, MYOB, NetSuite, PayPal, QuickBooks, Ramp, RingEx Chat, Shopify, Slack, Stripe, TikTok Ads, Xero, Zoho Books, Zoho Desk | builds from whatever exists, or pasted data |
| `cash-flow-snapshot` | a ledger (MYOB, NetSuite, QuickBooks, Xero, or Zoho Books) or a payments connector (PayPal, Square, or Stripe) | Gusto, Ramp, Shopify | CSV upload |
| `month-end-prep` | a ledger (MYOB, NetSuite, QuickBooks, Xero, or Zoho Books) | Expensify, Gusto, PayPal, Ramp, Shopify, Square, Stripe | statement/CSV uploads |
| `invoice-chase` | a ledger (MYOB, NetSuite, QuickBooks, Xero, or Zoho Books) | Airwallex, Gmail, Microsoft 365, PayPal, Shopify, Square, Stripe | AR CSV in, drafted reminders out |
| `ap-processor` | a ledger (MYOB, NetSuite, QuickBooks, Xero, or Zoho Books) + Mail (Gmail or M365) | Expensify, Ramp | PDF/photo bill upload, entries exported |
| `payroll-prep` | Gusto or QuickBooks Payroll | a ledger with a write path, for the journal post | timesheet upload → validated run sheet |
| `inbox-manager` | Gmail or M365 | Slack | pasted/forwarded email text |
| `hiring-screener` | Mail (Gmail or M365) + Calendar | DocuSign, Drive or M365, Gusto, Trello | resume uploads, drafts for manual send |
| `job-post-builder` | none | DocuSign, Drive or M365 | fully standalone |
| `contract-review` | none (file upload) | DocuSign, Drive or M365, Gmail or M365 | file upload is the primary mode |
| `tax-season-organizer` | ninguno — corre sobre el Excel exportado | a ledger (MYOB, NetSuite, QuickBooks, Xero, or Zoho Books), Expensify, PayPal, Ramp, Stripe | Excel/CSV de ventas y compras + exportación de DTE de la Agencia Virtual de la SAT; el cálculo es para la SAT de Guatemala (`../../../shared/currency-and-locale.md`) |

Ledger capability notes (what each holds, per its own reference files):
- **MYOB** — P&L, AR and AP balances, sales totals, payment terms. No bank or cash balances, no vendor or payee detail, no customer email addresses. A skill that needs those asks the owner or uses another source, and says so.
- **Xero** — P&L, bank transactions, bills, invoices, aged receivables, organisation record. Bill and invoice attachments are visible. See `../../month-end-prep/reference/xero-reconcile.md`.
- **NetSuite** — full ledger via reports and SuiteQL. Common at the larger end of the segment.
- **QuickBooks** — full ledger, with the report traps in `../../../shared/quickbooks-report-traps.md`.
- **Zoho Books** — invoices, estimates, sales orders, expenses, purchase orders, customer payments, bank and cash account balances, contacts (con una marca fiscal de EE. UU. que en Guatemala no aplica), organisation record. No bill object, no bank-transaction feed, no journals, no report endpoints (P&L, cash flow, aging). A skill that needs those asks for the export and says so; see `../../month-end-prep/reference/zoho-books-reconcile.md`.
- Two ledgers connected: read both, one named as the source of record for totals, never summed.

Storefront and point-of-sale capability notes (what each holds, per its own reference files; the category is defined in `../../../shared/connector-neutrality.md`):
- **Shopify** — orders, customers, products with images, stock levels, and ShopifyQL analytics; shop record carries country and currency. No payouts: the connector's scopes exclude Shopify Payments, so settlement timing is asked of the owner, never inferred (`../../cash-flow-snapshot/reference/v2_sources.md`). One `productId` per inventory read (`../../../shared/connector-call-shapes.md`).
- **Square** — orders with line items, catalog with images, inventory counts, payments, and payouts; merchant record carries country and currency. Payments list one location per call, so skills iterate locations. Payouts can be structurally absent on a production account.
- A storefront alone satisfies any gate written as "a CRM, a payments connector, or a storefront": order history is who bought what and when.
- Storefront and payments connectors both connected: an order and its settlement are one sale. Revenue comes from the one the owner names as source of record; the other supplies timing, fees, or stock.

## Grow the business

| Skill | Required | Optional | Zero-connector fallback |
|---|---|---|---|
| `lead-triage` | HubSpot | Apollo, Calendar, Clay, Gmail or M365 | pasted/uploaded lead list |
| `proposal-builder` | Drive or M365 | Apollo, Atlassian, DocuSign, Notion, Trello, Zoom; a ledger or a payments connector for pricing history and the deposit invoice | uploads in, DOCX/PDF out |
| `crm-autopilot` | a CRM (HubSpot, Monday.com, Salesforce, or Zoho CRM) | Calendar, Notion, RingEx Chat, Trello, Zoom | built-in spreadsheet CRM |

**Marketing, contenido, pauta, SEO, reputación y marca no están en esta carpeta:** van por `/inherent` a los agentes de Inherent (③ Marketing y Creative, ③ Marketing y Creative, ⑧ Ads, ② Branding, ⑥ Community). El diseño va por Figma (Figwright), nunca por Canva.

## Build & meta

| Skill | Required | Optional | Fallback |
|---|---|---|---|
| `smb-onboard` | none | all | interview-based, recommends what to connect |

## Comandos (7)

Los siete comandos que quedan en esta carpeta están abajo; cada uno es una skill que encadena otras.

Commands inherit the requirements of the skills they chain. The lead skill's requirement decides whether the command can start; optional legs degrade per skill.

| Command | Gate to start |
|---|---|
| `/report-pack` | any one data connector, or CSV |
| `/pay-the-bills` | a ledger (MYOB, NetSuite, QuickBooks, Xero, or Zoho Books) + Mail (Gmail or M365) |
| `/plan-payroll` | a ledger (MYOB, NetSuite, QuickBooks, Xero, or Zoho Books); Gusto or QuickBooks Payroll for the timesheet leg |
| `/close-month` | a ledger (MYOB, NetSuite, QuickBooks, Xero, or Zoho Books) |
| `/tax-prep` | ninguno — el Excel exportado basta; el cálculo es para la SAT de Guatemala |
| `/monday-brief` | none — degrades gracefully |
| `/call-list` | HubSpot; Mail (Gmail or M365) adds email context, Google Calendar adds the blocks, Apollo or Clay adds company fit (metered, asked once) |
