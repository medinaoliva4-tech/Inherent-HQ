# Pendientes

> **Esto NO es manual.** Es la lista de lo que falta decidir, construir, probar o medir.
> Cuando un pendiente se cierra, **se borra de acá y la regla entra al manual** (`inherent/` o
> `CLAUDE.md`) con la aprobación del CEO.

---

## ❓ 1 · Decisiones del CEO

| # | Decisión | Contexto |
|---|---|---|
| 1 | **La métrica de crecimiento medible de la línea Marketing** | El slot ya está en `CLAUDE.md` y `03-OFERTA` |
| 2 | **¿Qué argumento vende el salto Pro → Accelerate?** | Con los costos nuevos es el salto de menor margen (61%); suma ~Q4,940 de utilidad |
| 3 | **Especialistas por área** *(eventos, networking y PR, talent production, talent marketing)* | No tienen rubro en el costo fijo ni persona asignada |
| 4 | **¿Cuál de las tres auditorías cubre corporate structure?** | Hoy dice solo «la auditoría» |
| 5 | **Reposición gratis en las garantías** | El costo «3 a 5 puntos de margen» se calculó con la tabla vieja: recalcular o descartar |
| 6 | **Bloque «Lo básico vs. el valor único» de Marketing Pro** | `01-IDENTIDAD` lo tiene para Marketing, Accelerate y Compound, no para Pro |
| 7 | **El margen de rodaje de cada plan** | Las horas contratadas son tiempo de cámara; ⑤ usa márgenes de referencia (60-90 / 30-45 / 45 min) mientras no se decida |
| 7 | **`CLAUDE.md` dice «sin servidores ni hosting»** | El VPS ya corre `00-account` y va a correr la corrida programada de ⑧. **Ahora también `ceo-os/` va a Vercel:** decidir cómo se reescribe la regla |

---

## 🔨 2 · Construir

| # | Qué | Por qué |
|---|---|---|
| 1 | **Herramienta o MCP para ⑥A Diseño y ⑦ Video Editing** | Hoy son 100% manuales: las horas del operador y del editor son el techo |
| 2 | **Operación automatizada** | Programar, publicar y reportar sin humano; el operador supervisa más cuentas |
| 3 | **Pipeline de herramientas** | Plantillas y despliegue automatizado para que la tecnología de Growth quepa en el rubro Operador |
| 4 | **Sistema de contenido crudo del cliente** | Más video sin pasarse del monto de Grabación |
| 5 | **Match automático de mentores** | Strategy busca por industria, etapa y presupuesto en las plataformas de mentores. Falta el login |
| 6 | **Cobro internacional** | Stripe, Wise o equivalente, con factura deducible para el cliente |
| 7 | **CEO OS fase 2** (`ceo-os/`) | Conocimiento, Content, Strategy y, en Operations, proyectos, tareas y timeline del ciclo día 1–20 |
| 8 | **CEO OS: cron de Apify** | La capacidad *(watchlists, actor, frecuencia)* va en fase 2; crear el schedule real y gastar crédito es decisión aparte |
| 9 | **CEO OS: desplegar en Vercel** | Falta el PAT de GitHub, `AUTH_USERS` y `SESSION_SECRET`. Pasos en `ceo-os/README.md` |
| 10 | **CEO OS: datos de sueldos** | El repo no tiene sueldos; `ceo-os/data/finanzas/sueldos.json` empieza vacío |

---

## 🧪 3 · Probar contra una cuenta real

> **Regla:** lo `⬜` en «Capacidades reales» se ofrece avisando que es primera implementación.
> Cuando se prueba, pasa a `✅` en `06-ECONOMIA.md`.

| # | Qué | Respalda |
|---|---|---|
| 1 | **Zernio:** publicar y responder con una cuenta real, y su precio con 15-20 cuentas. ✅ Conectado; leer cuentas, comentarios y DMs ya está probado, también desde el VPS | «Presencia todos los días» y community management |
| 2 | **⑧ en vivo con NAO y Akai:** una semana en modo borrador, después envío activo. Corre con Claude Code y el plan de la empresa en el VPS; si el plan no alcanza, una API de IA | Community en los cuatro planes |
| 3 | **⑨ Posting con Zernio en una cuenta real:** programar, publicar y reintentar las fallidas | La publicación de todos los planes |
| 4 | **Scraping:** probar los actores que faltan. ✅ Cuenta, MCP y `apify/facebook-ads-scraper` ya están probados | Inteligencia de ①②③④ y las garantías |
| 5 | **Pauta:** Meta, TikTok, Google Search y Performance Max | ⑩ Ads y «Que te encuentren en Google» |
| 6 | **AdWhispr:** guardar la marca | Que `find_competitors` sirva sin preguntar cada vez |
| 7 | **Plugin `claude-ads`** | Auditoría y monitoreo de cuentas |
| 8 | **Automatización de mensajes y WhatsApp** | «Nadie se queda sin respuesta» |
| 9 | **Herramienta a medida e IA propia** | Accelerate y Compound |
| 10 | **Vetting de creadores con el scraper de Instagram** | Alianzas con creadores |
| 11 | **`ffmpeg` local:** reencuadre y análisis de video | ⑦ y `cr-lectura-de-video` |
| 12 | **Un mes completo al volumen prometido** *(86 / 145 / 145 / 204)* | Que el volumen sea capacidad probada |

### Las garantías — no se publican hasta cerrar los cuatro

| # | Bloqueo |
|---|---|
| 1 | Probar los 4 actores de scraping de las garantías contra una cuenta real |
| 2 | Medir la línea base de cada cliente |
| 3 | Instalar atribución *(CAPI + GA4)* en al menos un cliente |
| 4 | Correr un ciclo completo con la redirección del día 20 |

---

## 📏 4 · Medir

| # | Qué | Para qué |
|---|---|---|
| 1 | **Las horas reales de cada rol por plan** *(COO, operador, editor, fotografía, producción)* | Confirmar que cada monto fijo alcanza y cuántas cuentas aguanta cada rol |
| 2 | **Las horas del CEO con la nueva asignación de tareas** | Capacidad: cuántas cuentas entran |
| 3 | **El onboarding de Accelerate y Compound** *(tareas y horas)* | Hoy solo Marketing y Pro tienen desglose |
| 4 | **Instrumentar a cada cliente** *(ventas antes y después, atribución)* | El primer caso medido del múltiplo y del performance fee |
| 5 | **Las tasas reales de los clientes** | Sin eso no se compromete ninguna garantía |

---

## 🌐 5 · Mercados

| # | Qué |
|---|---|
| 1 | **Investigar precios reales de México y Miami** y recalcular sus márgenes con los costos nuevos |

> Lo de la web *(tarjetas, idiomas, industrias, casos)* vive en el repo de la web.

---

## 🎓 6 · Mentores

| # | Qué |
|---|---|
| 1 | Mapear mentores para **Cafeterías** y **Clubes y comunidades** |
| 2 | Confirmar cuántas sesiones 1:1 incluye The Apparel Mentor *($39/mes)* |
| 3 | Verificar que el mentor de Zesty Paws *(mascotas, $720)* corresponda a suplementos |
| 4 | Recalcular el uso real del especialista y la membresía prorrateada con el rubro «auditoría con el mentor» |

---

## 👥 7 · Equipo

| # | Qué |
|---|---|
| 1 | **Firmar con cada persona el monto fijo por plan** de su rubro |
| 2 | **Entra un operador de agentes** al pasar de 3 clientes; el COO queda solo como COO |
| 3 | **Directores por sistema**, cuando el volumen lo pida: Growth, Conversión, Operaciones y CFO fraccional *(opcional — no se promete)* |

---

## 🧹 8 · Limpieza del repo

| # | Qué |
|---|---|
| 1 | **`agents/`: quitar advertencias y estados** con el mismo criterio que `inherent/` |
| 2 | **`agents/00-account/`: que hable como Nicole, la secretaria**, y escale al COO |
| 3 | **Borrar las ramas viejas de GitHub:** solo quedan `main` y `rodrigo-medina` |
| 4 | `/inherent` no aparece en la Mac del COO: probar `git ls-remote origin main` y trabajar sobre `main` |
| 5 | **Onboarding de Akai, NAO y Cerantola:** los folders existen, vacíos, en `clients/` |
| 6 | **El VPS es KVM 1, no KVM 2** | Lo dice mal `agents/04-creative/brain/skills/BARRIDO-NOCTURNO.md` |
| 7 | **En el VPS, `~/inherent-hq` es un clon viejo sin acceso** | El que se usa es `~/inherent-hq-src`. Renombrar el viejo para que nadie lo use por error |
