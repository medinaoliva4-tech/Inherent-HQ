# Inherent OS (CEO OS v2)

Web privada de Inherent: **Home · Finance · Sales · Operations · Content · Library · Team**.
Se entra con **Google** y solo con cuentas **@inherentglobal.com**.

| Fase | Qué trae | Estado |
|---|---|---|
| 1 | Base, login con Google, Home, **Sales** (CRM, catálogo con costo por hora, cotizaciones con PDF) y **Team** (organigrama, perfiles y accesos) | ✅ |
| 2 | Finance (movimientos, costs, profitability, pricing, nómina por rol) y Operations (proyectos por fase, pipeline por cliente con entregables, tareas, Google Calendar, timeline) | ✅ |
| 3 | Library (SOPs, playbooks, videos y carpetas de Google Drive) | 🚧 |
| 4 | Content: guiones, planner y cuentas leídos del folder del perfil en el repo · winners con Apify (scrape diario opcional) | ✅ · analytics 🚧 |
| 5 | Portal del cliente | 🚧 |

## De dónde salen los datos

- **Del repo, solo lectura:** la economía (`inherent/06-ECONOMIA.md`) y los clientes (`clients/*/00-onboarding/plan-contratado.md`).
- **Content, del folder de cada perfil** (`inherent/inherent-social-media/` o `clients/<cliente>/`):
  cuentas propias de `00-onboarding/LINKS.md` · competencia y referentes de los links de IG/TikTok en
  `99-referencias/investigacion/*.md` · guiones y plan de `04-contenido/<AAAA-MM>/`.
  La app no escribe guiones: los escribe ④ Creatividad en Claude Code.
- **Todo lo demás:** base de datos Postgres propia (Neon, desde Vercel).

## Accesos

| Rol | Ve |
|---|---|
| `ceo` | Todo. Los `ADMIN_EMAILS` siempre son CEO |
| `coo` | Todo menos Finance (y nunca costos ni márgenes) |
| `team` | Home, Operations, Content, Library, Team |

El CEO asigna el rol de cada persona en **Team**. Quien entra por primera vez queda como `team`.

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
| `CRON_SECRET` | Para el scrape diario (Vercel Cron, 12:00 UTC). Sin él, el cron no corre |
| `GITHUB_TOKEN` · `GITHUB_REPO` · `GITHUB_BRANCH` | Opcionales. Economía y clientes se copian del repo en cada build (`scripts/snapshot.mjs`); el token solo se usa si falta esa copia |

### Google (una vez)

1. Google Cloud Console → proyecto nuevo → **APIs:** activa Google Calendar API y Google Drive API.
2. **OAuth consent screen:** tipo **Internal** (solo tu Workspace).
3. **Credentials → OAuth client ID → Web application.**
   Redirect URI: `https://inherent-work.vercel.app/api/auth/callback`
4. Copia el Client ID y el Secret a Vercel.

## Seguridad

- Login con Google, **solo dominio @inherentglobal.com** (se valida en el servidor con el `hd` y el correo verificado).
- Sesión firmada, 12 h máximo y 2 h de inactividad, atada al navegador. Desactivar a alguien en Team lo saca al instante.
- Permisos por rol **en el servidor**, anti-CSRF, CSP estricta sin scripts inline, HSTS.
- Todo lo que se pinta en pantalla se escapa (no se puede inyectar HTML).
- Los tokens de Google se guardan **cifrados** (AES-256-GCM).
- Cada cambio queda en una bitácora (quién, qué, cuándo) y con versión: si dos personas editan lo mismo, no se pisa.

## Local

```
cd ceo-os && npm install && npm run dev   # http://localhost:3000 → «Entrar en modo prueba»
npm test                                  # el parser contra el manual real
```
