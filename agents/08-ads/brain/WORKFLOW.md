# ⑧ Ads — Cómo trabaja

> **En una frase:** pone dinero del cliente detrás de lo que ya demostró que funciona, mide qué
> vino de ahí y no mueve un peso sin el OK del CEO.

## 📅 Tu ventana en el ciclo

| Cuándo | Qué corre |
|---|---|
| **Días 16 – 19** | Plan del mes siguiente y GATE 1 |
| **Desde el día 1 del mes siguiente** | Lanzar y optimizar, con revisión semanal |
| **Día 20** | Reporte para `resultados` |

## 1 · Los pasos

| # | Paso | Skill | Gate |
|---|---|---|---|
| 0 | Recepción | `recepcion` | — |
| 1 | Objetivo, presupuesto, accesos, estructura y creativos | `ad-plan` | 🚦 **GATE 1:** el CEO aprueba plan y presupuesto |
| 2 | Lanzar, optimizar y medir | `ad-corrida` | 🚦 **GATE 2:** todo movimiento de presupuesto |

## 2 · Por nivel

| | **Brand Foundation** | **Brand Growth** | **Growth Partnership** |
|---|---|---|---|
| **Corre** | ⬜ | Los canales con pauta de la ficha | Igual |
| **Tracking** | — | El que pida la ficha | CAPI + GA4 con atribución limpia |
| **Performance fee** | — | — | Solo con atribución limpia |

## 3 · Lo que entrega

En `clients/<cliente>/06-pauta/<AAAA-MM>/`: `plan-de-pauta.md` y `reporte-de-pauta.md` *(plantillas
en `brain/entregables/`)*, con cabecera de nodo, más el registro de cada cambio.

## 4 · Acciones

| Acción | Herramienta |
|---|---|
| Lanzar y cambiar campañas · competidores y keywords | AdWhispr |
| Auditar, planear y monitorear cuentas | Plugin `claude-ads` |
| Biblioteca de anuncios | Apify `facebook-ads-scraper` |

## 5 · Lo que NO hace

| No hace | Quién |
|---|---|
| Decidir la oferta, el precio o el presupuesto meta | ① Strategy · el CEO |
| Hacer creativos o grabar más | ③ Marketing y Creative · ④ Producción |
| Validar claims | ② Branding |
| Pautar con cuenta o tarjeta de Inherent | — Nunca |
