# CEO OS

Web privada del equipo para operar Inherent. **El repo es la base de datos**: los costos salen de
`inherent/06-ECONOMIA.md`, los clientes de `clients/*/00-onboarding/plan-contratado.md`, el CRM de
`inherent/administracion/crm/*.csv`. Lo que no vive en el manual vive en `ceo-os/data/`.
Cada cambio hecho desde la web es **un commit** en el repo.

| Área | Fase 1 | Quién entra |
|---|---|---|
| 💰 Finanzas | ✅ planes, costos, simulador, roles, sueldos | 🔒 solo CEO |
| 🤝 Sales | ✅ pipeline, contactos, catálogo, cotizador, propuesta | CEO · COO |
| ⚙️ Operations | ✅ clientes y su pipeline *(proyectos, tareas y timeline: fase 2)* | CEO · COO · team |
| 🧠 Conocimiento · 🎬 Content · 🎯 Strategy | 🚧 fase 2 | CEO · COO *(Conocimiento y Content también team)* |

## Probarlo local

```
cd ceo-os && npm run dev      # http://localhost:3000 — usuarios dev: ceo / coo / team
npm test                      # corre el parser contra el manual real y avisa si una tabla cambió de formato
```
Local lee y escribe el filesystem del repo (`LOCAL_REPO`). **Nunca pongas `LOCAL_REPO` en Vercel.**

## Desplegar en Vercel (privado, con login)

1. **Vercel → Add New Project →** importa este repo. **Root Directory: `ceo-os`**. Sin build.
2. **GitHub token:** fine-grained PAT, solo este repo, permiso **Contents: Read and write**.
3. **Variables de entorno** (Production):

| Variable | Valor |
|---|---|
| `GITHUB_TOKEN` | el PAT del paso 2 |
| `GITHUB_REPO` | `medinaoliva4-tech/Inherent-HQ` |
| `GITHUB_BRANCH` | `main` |
| `SESSION_SECRET` | 32+ caracteres al azar *(`openssl rand -hex 32`)* |
| `AUTH_USERS` | JSON de usuarios, ver abajo |

4. **Usuarios.** Genera el hash de cada contraseña: `npm run hash -- "contraseña-de-10+"`, y arma:
```json
[{"user":"ceo","name":"…","role":"ceo","hash":"scrypt:…"},
 {"user":"coo","name":"…","role":"coo","hash":"scrypt:…"}]
```
Roles: `ceo` (todo) · `coo` (todo menos Finanzas) · `team` (Operations, Conocimiento, Content).
5. **Dominio:** Project → Settings → Domains. Sin login no se ve nada; no expongas Finanzas en un link público.

## Seguridad — lo que ya está

- Login con scrypt, cookie `HttpOnly`+`Secure`+`SameSite=Strict`, 12 h, freno de 5 intentos/15 min.
- El permiso se aplica **en el servidor**, no en la UI: sin sesión → 401, sin área → 403.
- 🔒 Costos y márgenes salen solo por `/api/economia` (solo CEO). `/api/catalogo` (Sales) no lleva costos salvo al CEO. `/api/clients` esconde el costo de cuenta a no-CEO y el precio a `team`.
- El manual **nunca se sirve crudo**: solo tablas parseadas. `/api/file` solo toca `ceo-os/data/**` y el CRM.
- Escrituras con control de versión (sha): si otra persona cambió el archivo, da 409 en vez de pisarlo.
- `noindex`, sin iframe, sin caché en `/api`.

## Cómo se actualiza

- **Cambias un precio o costo:** edita la tabla en `06-ECONOMIA.md`. El dashboard lo lee en vivo. Si cambias el *formato* de la tabla, `npm test` avisa.
- **Cambias de herramienta o persona:** la tabla de slots de `05-OPERACION.md`.
- Un deploy solo se dispara si cambia código; guardar datos no redeploya (`ignoreCommand`).
