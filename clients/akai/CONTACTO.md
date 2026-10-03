# Akai — contacto

> 🔒 **Interno.** `CONTACTO.md` es lo **único** de `clients/` que el bot de WhatsApp lee de **todos**
> los clientes (nombre, número y plan). El resto del folder solo se abre cuando escribe **este** cliente.

| | |
|---|---|
| **Cliente nº** | 02 |
| **Nombre comercial** | Akai Sushi & Oriental Food |
| **Tipo** | Restaurante |
| **Responsable** | Sra. Karina de Medina |
| **WhatsApp del responsable** | ⚠️ SIN DATOS — falta el número, con código de país |
| **Otros números autorizados** | ⚠️ SIN DATOS |
| **Plan contratado** | ⚠️ SIN DATOS — se anota primero |
| **División** | ⚠️ SIN DATOS — la fija ② Strategy. Todo apunta a 🔵 low ticket, pero no se asume |
| **Alta** | ⚠️ SIN DATOS |

## 🔗 Comparte responsable con NAO

La Sra. de Medina responde por **Akai y por NAO** (`clients/nao/`). Son **dos clientes, dos folders**.

| Si escribe… | El agente… |
|---|---|
| Algo claramente de Akai | Abre `clients/akai/` y responde |
| Algo claramente de NAO | Abre `clients/nao/` y responde |
| Algo ambiguo («las ventas», «el reel de esta semana») | Pregunta **«¿Es por Akai o por NAO?»** antes de responder |

🔴 **Nunca mezcla datos de uno en el otro**, ni los resultados, ni el plan, ni las fechas.

## Reglas de este folder

| | |
|---|---|
| **No se mezcla con otro cliente** | Una sesión trabaja un folder |
| **Todo dato sin fuente va etiquetado** | `[dice el cliente, sin verificar]` o `⚠️ SIN DATOS` |
