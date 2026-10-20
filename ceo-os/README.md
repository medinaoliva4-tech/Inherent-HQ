# Inherent OS (CEO OS v2)

Web privada de Inherent, en 8 secciones: **Inicio · Clientes · Comercial · Operaciones · Resultados · Finanzas · Conocimiento · Administración**.
Se entra con **Google** y solo con cuentas **@inherentglobal.com**.

**Las fases del OS están en [`PLAN-OS.md`](PLAN-OS.md) § 4.** Ese es el plan: esta página solo describe cómo funciona lo que ya existe.
Hechas y unidas a main: **0 a 4** (la 4, «Marcas: entender», con App 02 · Estrategia). Sigue la **5 · Marcas: crear**.

## De dónde salen los datos

- **Del repo, solo lectura:** la economía (`inherent/06-ECONOMIA.md`) y los clientes (`clients/*/00-onboarding/plan-contratado.md`).
- **Content, del folder de cada perfil** (`inherent/inherent-social-media/` o `clients/<cliente>/`):
  cuentas propias de `00-onboarding/LINKS.md` · competencia y referentes de los links de IG/TikTok en
  `99-referencias/investigacion/*.md` · guiones y plan de `04-contenido/<AAAA-MM>/`.
  La app no escribe guiones: los escribe ④ Creatividad en Claude Code.
- **Todo lo demás:** base de datos Postgres propia (Neon, desde Vercel).

## Workspace por perfiles

Cada persona tiene uno o varios **perfiles de trabajo** (Team → su perfil): CEO, COO, Content,
Video editor, Finance + Business mapping. Su Workspace muestra lo de cada perfil: checklist del ciclo,
SOPs de la Library marcados para ese perfil, subir trabajo a revisión (a su Google Drive) y el
material del cliente. Todos tienen kanban personal y de la empresa.

## Accesos

| Rol | Ve |
|---|---|
| `ceo` | Todo. Los `ADMIN_EMAILS` siempre son CEO |
| `coo` | Todo menos Finance (y nunca costos ni márgenes) |
| `team` | Home, Operations, Content, Library, Team. Con el perfil de trabajo **Ventas**, también Sales (el CRM) |

El CEO asigna el rol de cada persona en **Team**. Quien entra por primera vez queda como `team`.

**Vistas por rol:** en **Administración → Vistas por rol** el CEO elige, por perfil de trabajo, qué secciones ve y qué tan a fondo
(*Oculto · Resumen · Completo*; Resumen existe en Content: solo rendimiento). Se guarda en `settings` (id `role_views`).
Sin configurar, todo se ve completo. Hoy se aplica en la interfaz (barra y Content), no en el servidor.

## Las 8 secciones

Cada sección agrupa pantallas; arriba de la pantalla van sus pestañas. Una sección aparece si el perfil ve al menos una.

| Sección | Pestañas (ruta) |
|---|---|
| Inicio | Hoy (`#/home`) · Control (`#/control`) |
| Clientes | Clientes (`#/clients`), con el portal de cada cliente |
| Comercial | CRM, catálogo, especialistas, cotizaciones, fuentes y paquetes (`#/sales`) |
| Operaciones | Proyectos (`#/operations`) · Workspace (`#/work`) · Contenido (`#/content`) |
| Resultados | Indicadores (`#/resultados`) · Metas (`#/roadmap`) |
| Finanzas | `#/finanzas` |
| Conocimiento | La Library (`#/library`) |
| Administración | Equipo (`#/team`) · Vistas por rol · Recetas · Arranque (solo el CEO) |

`#/<sección>` (ej. `#/operaciones`) abre su primera pestaña visible; las rutas de cada pantalla siguen igual.

**Resultados** solo usa datos que ya existen; lo que no tiene dato sale vacío con de dónde va a salir, nunca en cero.
Cada bloque pide ver su sección de origen: **Comercial** (leads y cierre por fuente, tiempo de respuesta, valor del
pipeline por etapa, motivos de pérdida), **Entregas** (tareas hechas a tiempo contra su fecha límite: cada tarea guarda
`done_at` el día que queda «Hecha»), **Ingresos** del mes (solo ingresos, sin costos) y **Clientes** (sus metas, meta
contra real, y sus redes de Instagram por Windsor a pedido). Lo mismo da la herramienta `resultados` del conector.

**Tareas:** cada una tiene **tipo** (Delivery, Comercial, Interna, Personal; Personal solo la ve quien la creó) y **SOP**
(un documento de la Library o un link). **Research** tiene 5 niveles: competencia, referente-similar, referente-aspiracional,
referente-crecimiento y propia.

## Recetas: cómo se arma el trabajo

**Team → Recetas** (solo el CEO edita). Las tareas, días, perfiles, revisores, SOP, tipo, dependencias, reuniones y lo
que se pide al cliente ya no viven en el código: son datos. Se guardan en la colección `recipes`; las de siempre
(Ciclo mensual, Business Growth, Proyecto, Custom) son los valores por defecto (`public/js/recipes.js`), así que si
nadie edita nada todo sale igual. Un doc con el mismo id reemplaza la de siempre; borrarlo vuelve a ella.

- **Proyecto:** el trabajo de un tipo de proyecto. **Servicio:** las tareas de un servicio del catálogo; al activar un
  paquete o confirmar una cotización, el proyecto custom las usa (sin receta, sale una tarea por rol como antes).
  **Recurrente:** responsabilidades de Inherent (semanal, mensual del día X al Y, anual) que dejan una tarea tipo
  Interna con su SOP y su fecha. Vienen apagadas.
- **Paquete → proyecto:** `POST /api/flow/activate` (o `activar_paquete` en el conector) con un paquete o con el plan
  contratado del cliente (ciclo mensual con los departamentos de su pipeline, y Business Growth en la línea Growth).
- **Rol → persona por proyecto:** cada proyecto guarda `roles_map`; Operations muestra «Quién cubre cada rol» y al
  cambiar a alguien se reasignan las tareas abiertas de ese rol (con historial en cada tarea y en el proyecto).
- **Lo recurrente** se genera solo, sin duplicar (cada vez que toca tiene una clave y un id propio): al abrir la app
  (CEO o COO, una vez al día), en el cron diario `/api/cron/recurrentes` y a mano con «Generar lo recurrente».
- **Conector de Claude:** `recetas`, `guardar_receta` (solo CEO), `paquetes`, `activar_paquete`, `asignar_rol` y
  `generar_recurrentes`, con el mismo alcance y nivel de edición que la app.

## Leads: el CRM, las fuentes y el quiz

- **Etapas:** Prospecto → Nuevo → Contactado → Reunión → Propuesta → Ganado / Perdido (con motivo: precio, tiempo,
  no era el momento, se fue con otro, otro). Los **Prospectos** (lo scrapeado o importado, saliente) viven en su
  bandeja aparte y pasan al pipeline cuando responden.
- **Candados, en el servidor:** un lead abierto no se guarda sin siguiente paso y fecha · el historial solo se
  agrega · el responsable es un rol (por defecto `ventas`) · nadie se duplica por WhatsApp, correo o cuenta de IG.
- **Fuentes (Sales → Fuentes, las crea el CEO):** una puerta por fuente con su clave. Tipo (formulario, quiz,
  mensajes, anuncios, scraping, importar, manual), mapeo de campos, etapa de entrada, rol y dirección. Cada una
  muestra su link de entrada, se pausa, y guarda el registro de lo que llegó y lo que falló (últimos 50).
  La puerta es `POST /api/intake/<clave>` (JSON o formulario, sin sesión, CORS abierto, máximo 20 KB).
- **Quiz público `/diagnostico`:** siete preguntas, contacto, puntaje y plan sugerido; manda todo a la fuente
  tipo quiz (`?k=<clave>` o, sin clave, la fuente marcada como principal). Para servirlo desde la web
  (`inherentglobal.com/diagnostico`) se agrega un rewrite en el proyecto de la web hacia
  `https://<app>/diagnostico` y se pone la URL del OS en el `<meta name="os-api">` de `public/diagnostico.html`.
- **Por el conector:** `leads`, `crear_lead`, `actualizar_lead`, `registrar_actividad` e `importar_prospectos`.

## Variables de entorno (Vercel → Production)

| Variable | Qué es |
|---|---|
| `DATABASE_URL` | La pone Vercel sola al conectar Neon (Storage) |
| `SESSION_SECRET` | 32+ caracteres al azar (`openssl rand -hex 32`) |
| `APP_URL` | `https://inherent-work.vercel.app` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Del cliente OAuth de Google Cloud |
| `ADMIN_EMAILS` | Correos que siempre son CEO, separados por coma |
| `ALLOWED_DOMAIN` | Opcional. Por defecto `inherentglobal.com` |
| `APIFY_TOKEN` | Para scrapear winners (Instagram y TikTok) |
| `WINDSOR_API_KEY` | Analytics de Instagram de las cuentas propias. Las cuentas se conectan (login con Instagram) en windsor.ai; la app solo lee |
| `ZERNIO_API_KEY` | Content → Bandeja: comentarios y DMs de las cuentas propias (llave con el grupo «messages»). Solo lectura |
| `GOOGLE_PORTAL_CLIENT_ID` · `GOOGLE_PORTAL_CLIENT_SECRET` | El login del **portal del cliente** («Soy cliente»): un cliente OAuth de Google tipo **Externo**, solo con nombre y correo. Entra únicamente un correo que el CEO aprobó en Clients → Portal del cliente |
| `CRON_SECRET` | Para el scrape semanal (Vercel Cron, lunes 13:00 UTC; cierre a las 16:00). Sin él, el cron no corre |
| `GITHUB_TOKEN` | No hace falta. La app solo **lee** el repo: lo copia en cada build (`scripts/snapshot.mjs`). El repo guarda lo macro; el trabajo del día a día vive en la app |

### Google (una vez)

1. Google Cloud Console → proyecto nuevo → **APIs:** activa Google Calendar API y Google Drive API.
2. **OAuth consent screen:** tipo **Internal** (solo tu Workspace).
3. **Credentials → OAuth client ID → Web application.**
   Redirect URI: `https://inherent-work.vercel.app/api/auth/callback`
4. Copia el Client ID y el Secret a Vercel.

## Seguridad

- Login con Google, **solo dominio @inherentglobal.com** (se valida en el servidor con el `hd` y el correo verificado).
- Sesión firmada, 30 días máximo y 14 días de inactividad, atada al navegador. Desactivar a alguien en Team lo saca al instante.
- Permisos por rol **en el servidor**, anti-CSRF, CSP estricta sin scripts inline, HSTS.
- Todo lo que se pinta en pantalla se escapa (no se puede inyectar HTML).
- Los tokens de Google se guardan **cifrados** (AES-256-GCM).
- Cada cambio queda en una bitácora (quién, qué, cuándo) y con versión: si dos personas editan lo mismo, no se pisa.

## Local

```
cd ceo-os && npm install && npm run dev   # http://localhost:3000 → «Entrar en modo prueba»
npm test                                  # el parser contra el manual real
```
