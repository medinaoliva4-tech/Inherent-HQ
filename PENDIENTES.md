# Pendientes

> **Esto NO es manual.** Es la lista de lo que falta decidir, construir, probar o medir.
> Cuando un pendiente se cierra, **se borra de acá y la regla entra al manual** (`inherent/` o
> `CLAUDE.md`) con la aprobación del CEO.

---

## ❓ 1 · Decisiones del CEO

| # | Decisión | Contexto |
|---|---|---|
| 1 | **¿Las tarjetas de la web muestran el número de piezas?** | `03-OFERTA` pone 86 / 145 / 204 en las tarjetas; `07-COMUNICACION` dice «nunca mostrar cantidad de piezas en la web» |
| 2 | **¿La tarjeta de Marketing dice «Apuntamos a 1.3x tu facturación»?** | Choca con la regla «la línea Marketing no promete % de crecimiento» |
| 3 | **Herramienta de publicación y bandeja de mensajes** | ⑨ Posting está armado con Publer; el repo hablaba de Postpone. El slot queda vacío en `05-OPERACION` hasta decidir |
| 4 | **¿Qué argumento vende el salto Pro → Accelerate?** | Con los costos nuevos es el salto de menor margen (61%); suma ~Q4,940 de utilidad |
| 5 | **Especialistas por área** *(eventos, networking y PR, talent production, talent marketing)* | No tienen rubro en el costo fijo ni persona asignada |
| 6 | **¿Cuál de las tres auditorías cubre corporate structure?** | Hoy dice solo «la auditoría» |
| 7 | **Marca personal en Compound: «IA entrenada con su voz para escalar sin grabar más»** | Puede chocar con «no se promete voz sintética» |
| 8 | **¿«Guatemala» en los argumentos internos de venta?** | `01-IDENTIDAD` dice «nadie más en Guatemala», «ninguna agencia guatemalteca». ¿Pasan a multi-mercado? |
| 9 | **¿Cafeterías y Clubes van en la web?** | `04-MERCADO` tiene 12 industrias; la web y `07` tienen 10 |
| 10 | **¿Se muestran nombres de especialistas en la web cuando haya acuerdos?** | Hoy la web va sin nombres |
| 11 | **El techo de capacidad** | `07` dice que el techo es la grabación; el manual dice que es diseño y edición a mano |
| 12 | **Reposición gratis en las garantías** | El costo «3 a 5 puntos de margen» se calculó con la tabla vieja: recalcular o descartar |
| 13 | **Bloque «Lo básico vs. el valor único» de Marketing Pro** | `01-IDENTIDAD` lo tiene para Marketing, Accelerate y Compound, no para Pro |

---

## 🔨 2 · Construir

| # | Qué | Por qué |
|---|---|---|
| 1 | **Agente ⑧ Community Management** | Sostiene «tus comentarios y mensajes» *(Pro y arriba)* y «comunidad» *(Compound)*, que están publicadas |
| 2 | **Herramienta o MCP para ⑥A Diseño y ⑦ Video Editing** | Hoy son 100% manuales: las horas del operador y del editor son el techo |
| 3 | **Operación automatizada** | Programar, publicar y reportar sin humano; el operador supervisa más cuentas |
| 4 | **Pipeline de herramientas** | Plantillas y despliegue automatizado para que la tecnología de Growth quepa en el rubro Operador |
| 5 | **Sistema de contenido crudo del cliente** | Más video sin pasarse del monto de Grabación |
| 6 | **Match automático de mentores** | Strategy busca por industria, etapa y presupuesto en las plataformas de mentores. Falta el login |
| 7 | **Cobro internacional** | Stripe, Wise o equivalente, con factura deducible para el cliente |

---

## 🧪 3 · Probar contra una cuenta real

> **Regla:** lo `⬜` en «Capacidades reales» se ofrece avisando que es primera implementación.
> Cuando se prueba, pasa a `✅` en `06-ECONOMIA.md`.

| # | Qué | Respalda |
|---|---|---|
| 1 | **Herramienta de publicación:** cuenta, precio real del tramo de agencia *(15-20 cuentas, ~666 piezas/mes)* | «Presencia todos los días» |
| 2 | **Bandeja de mensajes en TikTok** | La herramienta evaluada no cubre el inbox de TikTok, que es canal principal |
| 3 | **Scraping:** cuenta, instalar el MCP, probar los trece actores y fijar el tope de gasto | Inteligencia de ①②③④ y las garantías |
| 4 | **Pauta:** Meta, TikTok, Google Search y Performance Max | ⑩ Ads y «Que te encuentren en Google» |
| 5 | **AdWhispr:** guardar la marca | Que `find_competitors` sirva sin preguntar cada vez |
| 6 | **Plugin `claude-ads`** | Auditoría y monitoreo de cuentas |
| 7 | **Automatización de mensajes y WhatsApp** | «Nadie se queda sin respuesta» |
| 8 | **Herramienta a medida e IA propia** | Accelerate y Compound |
| 9 | **Vetting de creadores con el scraper de Instagram** | Alianzas con creadores |
| 10 | **`ffmpeg` local:** reencuadre y análisis de video | ⑦ y `cr-lectura-de-video` |
| 11 | **Un mes completo al volumen prometido** *(86 / 145 / 145 / 204)* | Que el volumen sea capacidad probada |

### Las garantías — no se publican hasta cerrar los cuatro

| # | Bloqueo |
|---|---|
| 1 | Probar los 4 actores de scraping de las garantías contra una cuenta real |
| 2 | Medir la línea base de los clientes actuales |
| 3 | Instalar atribución *(CAPI + GA4)* en al menos un cliente |
| 4 | Correr un ciclo completo con la redirección del día 20 |

---

## 📏 4 · Medir

| # | Qué | Para qué |
|---|---|---|
| 1 | **Las horas reales de cada rol por plan** *(COO, operador, editor, fotografía, producción)* | Confirmar que cada monto fijo alcanza y cuántas cuentas aguanta cada rol |
| 2 | **Las horas del CEO con la nueva asignación de tareas** | Capacidad: cuántas cuentas entran |
| 3 | **El onboarding de Accelerate y Compound** *(tareas y horas)* | Hoy solo Marketing y Pro tienen desglose |
| 4 | **Instrumentar a los clientes actuales** *(ventas antes y después, atribución)* | El primer caso medido del múltiplo y del performance fee |
| 5 | **Las tasas reales de los clientes** | Sin eso no se compromete ninguna garantía |

---

## 🌐 5 · Web y mercados

| # | Qué |
|---|---|
| 1 | **Actualizar inherentglobal.com** con las cuatro tarjetas nuevas. Hasta entonces, a quien llegue por la web se le respeta lo publicado *(Ignite $800 · Accelerate $1,200 · Compound $2,000)* |
| 2 | Auditar que la versión en inglés esté al día con la española |
| 3 | Casos en el idioma de cada mercado |
| 4 | Fase 2: que cada industria abra a detalle con entregables, ejemplos y diagnóstico |
| 5 | **Investigar precios reales de México y Miami** y recalcular sus márgenes con los costos nuevos |

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
| 1 | **`agents/`: pasar «Allan» a «el CEO»** — 54 archivos lo nombran como gate |
| 2 | **`agents/`: quitar advertencias y estados** con el mismo criterio que `inherent/` |
| 3 | **`agents/00-account/`: que hable como Nicole, la secretaria**, y escale al COO |
| 4 | Creatividad y Producción apuntan a `agents/comprension/` y `agents/strategy/`, que no existen |
| 5 | Definir las rutas de ①②③ dentro de `clients/<cliente>/` |
| 6 | Mover lo de Akai a `clients/akai-sushi/` |
| 7 | `/inherent` no aparece en la Mac del COO: probar `git ls-remote origin main` y traer `main` a sus ramas |
