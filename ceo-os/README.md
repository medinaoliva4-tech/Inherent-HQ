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
| `SESSION_SECRET` | 32+ caracteres al azar *(`openssl rand -hex 32`)*. Si lo cambias, todas las sesiones mueren |
| `AUTH_USERS` | JSON de usuarios, ver abajo |

4. **Usuarios (2FA obligatorio).** Por cada persona corre:
```
npm run user -- <usuario> <ceo|coo|team> "<Nombre>" "<contraseña de 12+ caracteres>"
```
Imprime el objeto para `AUTH_USERS` **y la clave 2FA**. La persona la agrega en su app de autenticación
(1Password, Authy, Google Authenticator). La clave **solo se muestra esa vez; no la mandes por chat**.
`AUTH_USERS` es un arreglo JSON con un objeto por persona.
Roles: `ceo` (todo) · `coo` (todo menos Finanzas) · `team` (Operations, Conocimiento, Content).
5. **Protección extra de Vercel:** Project → Settings → **Deployment Protection → Vercel Authentication (Standard)** para que los previews tampoco sean públicos.
6. **Firewall (límite global de intentos):** Project → Firewall → regla de rate limit en `/api/login` y `/api/stepup` (p. ej. 10 por minuto por IP).
7. **Link:** queda `https://<proyecto>.vercel.app`. Elige un nombre de proyecto que no revele nada de la empresa.

## Seguridad — lo que ya está

- **Contraseña + código 2FA (TOTP) en cada login.** Sin 2FA configurado la cuenta no entra. Un código no sirve dos veces.
- **Finanzas pide un código 2FA fresco cada 10 min** (step-up), aunque la sesión siga viva.
- Sesión: máximo 8 h, **30 min de inactividad**, cookie `HttpOnly` + `Secure` + `SameSite=Strict` y **atada al navegador** (robar la cookie no sirve en otro).
- scrypt (N=2¹⁵) para contraseñas; el mismo error y la misma demora exista o no el usuario.
- El permiso se aplica **en el servidor**: sin sesión 401, sin área 403.
- **Anti-CSRF:** toda escritura exige header propio + mismo origen.
- **CSP estricta** (solo scripts propios, sin inline), HSTS con preload, sin iframe, sin caché en `/api`, `noindex`.
- 🔒 Costos y márgenes salen solo por `/api/economia` (solo CEO). `/api/catalogo` no lleva costos salvo al CEO. `/api/clients` esconde el costo de cuenta a no-CEO y el precio a `team`.
- El manual **nunca se sirve crudo**: solo tablas parseadas. `/api/file` solo toca `ceo-os/data/**` y el CRM.
- **Auditoría:** cada escritura es un commit que dice **quién** la hizo; logins y step-ups quedan en los logs de Vercel.
- Escrituras con control de versión (sha): si otra persona cambió el archivo, 409 en vez de pisarlo.

**Lo que NO cubre** *(por diseño serverless)*: el límite de intentos por IP vive por instancia; el global lo pone el Firewall de Vercel (paso 6). El PAT de GitHub da acceso al repo: guárdalo solo en Vercel, con permiso mínimo y expiración.

## 💵 Nómina

`ceo-os/data/finanzas/nomina.json`. El mes de cada persona = **suma de lo que cada cuenta paga a su rol × su % del rol**.
- **Reparto por rol:** se define una vez (p. ej. Edición de video: A 60% · B 40%).
- **Cuentas:** el monto por rol sale del manual para los planes de lista; en Tailor Made lo escribes tú.
- **Reparto propio** por cuenta con el botón 👥 cuando una cuenta se desvía del reparto del rol.
- Avisa lo que queda **sin asignar** (rol que no suma 100%) y lo que está **sin datos**.

## Cómo se actualiza

- **Cambias un precio o costo:** edita la tabla en `06-ECONOMIA.md`. El dashboard lo lee en vivo. Si cambias el *formato* de la tabla, `npm test` avisa.
- **Cambias de herramienta o persona:** la tabla de slots de `05-OPERACION.md`.
- Un deploy solo se dispara si cambia código; guardar datos no redeploya (`ignoreCommand`).
