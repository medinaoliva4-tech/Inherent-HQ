# Los clientes

## 🔒 Primero: ¿el repo es público o privado?

**La información de un cliente nunca vive en un repo público.**

| Si `Inherent-HQ` es… | Qué va en `clients/<cliente>/` |
|---|---|
| 🔴 **Público** | **Solo un `README.md`** con el nombre del cliente y el **link a su repo privado**. Nada más: ni estrategia, ni data, ni links a Drive |
| 🟢 **Privado** | **Todo lo del cliente**, con la estructura de abajo |

✅ **Hoy `Inherent-HQ` es privado** → **toda la información del
cliente vive acá.** Si alguna vez vuelve a ser público, aplica la fila 🔴.

🏠 **Inherent como cliente** *(nuestras propias redes)* vive en `inherent/inherent-social-media/`,
con la misma estructura.

🛑 **Antes de escribir en `clients/`, se verifica la visibilidad del repo.** Si es público y la
información no tiene a dónde ir, **se bloquea y se avisa al CEO** — no se sube «por mientras».

**Un cliente = un folder.** Vive **afuera** de los agentes: todos leen y escriben acá.
**Se arma copiando `clients/_plantilla/`** y se organiza por las áreas que prometemos: secciones
macro, y adentro lo micro.

```
clients/<cliente>/
├── CLAUDE.md              ← router: plan, áreas activas y dónde va cada cosa
├── 00-onboarding/         comprensión · plan-contratado.md · LINKS.md          TODOS
├── 01-estrategia/         estrategia · reuniones · revisiones del 20 · reportes TODOS
├── 02-marca/              kit de redes · voz                                     TODOS
├── 03-marketing/AAAA-MM/  el plan de cada ciclo                                  TODOS
├── 04-contenido/AAAA-MM/  ideas · produccion · diseno · video · publicacion     TODOS
├── 05-comunidad/          comentarios y mensajes, según la escalera             TODOS
├── 06-pauta/AAAA-MM/      campañas, creativos y resultados                      TODOS
├── 07-oferta-y-ventas/    ofertas a empujar 🔷 · oferta completa 🟨             TODOS
├── 08-tecnologia/         herramientas a medida · IA propia                     🟨
├── 09-operacion/          auditorías · SOPs · estructura                        🟨
├── 10-finanzas/           Money OS                                              🟨 Compound
└── 99-referencias/        investigación · lo que manda el cliente              TODOS
```

**Cada folder tiene su `CONTEXTO.md`:** qué hay ahí, qué agente escribe y qué plan lo activa.
**Lo primero es el onboarding.** Al cerrarlo se anota el plan y se borran los folders 🟨 que no
aplican.
**Lo mensual va por mes dentro de cada área:** `03-marketing/2026-11/`, `04-contenido/2026-11/`,
`06-pauta/2026-11/`.

## 📦 El material pesado vive en Drive, nunca en el repo

**Fotos, videos, archivos de diseño y exportes no se suben a GitHub.** El repo guarda los
documentos y **un `.md` con los links.**

| Dónde | Qué va |
|---|---|
| **Repo** | Documentos `.md` y `.csv`, y los links |
| **Drive del cliente** | Fotos, videos, diseños y exportes, **con el mismo árbol de folders** |

Cada sesión de producción se anota en `04-contenido/AAAA-MM/produccion/MATERIAL.md`:

| Sesión | Fecha | Crudo | Final | Subió |
|---|---|---|---|---|
| Sesión de producción — octubre | 2026-10-08 | [Drive](link) | [Drive](link) | Producción |

**Crudo** es lo que sale de la sesión. **Final** es lo que ya pasó por edición o diseño.
Quien recibe el material —desde cualquier computadora— lo sube al Drive y agrega la fila.

🔒 **`LINKS.md` lleva una fila por cuenta con QUIÉN tiene el acceso — el nombre de la persona,
nunca la credencial.** Contraseñas, tokens y llaves de API **no van al repo en ninguna forma**,
ni siquiera con el repo privado. Si hace falta una credencial para operar, **se pide fuera del repo.**

## Reglas

| | |
|---|---|
| **Nunca mezclar dos clientes** | Una sesión trabaja un folder |
| **Lo externo no se copia, se linkea** | Accesos en `00-onboarding/LINKS.md`, material en `MATERIAL.md` |
| 🔒 **Las credenciales nunca se escriben** | En `LINKS.md` va **quién** tiene el acceso, no la contraseña |
| **El plan contratado se anota primero** | Define el techo de lo que se puede prometer |
| **Nada se envía al cliente sin gate** | El CEO cierra, el agente propone |

> **Cómo se entrega lo define cada agente en su propio `README.md`.**
> Cada uno entrega algo distinto; lo único igual para todos es que **el CEO aprueba antes de que
> algo salga.**
