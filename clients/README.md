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

```
clients/<cliente>/
├── ESTRATEGIA.md   ← el documento que se le entrega al cliente
├── LINKS.md        ← lo que vive afuera: Drive, Figma, Notion, las cuentas y quién tiene su acceso
└── data/           ← todo lo investigado y recibido, expandido, para los demás agentes
```

🔒 **`LINKS.md` lleva una fila por cuenta con QUIÉN tiene el acceso — el nombre de la persona,
nunca la credencial.** Contraseñas, tokens y llaves de API **no van al repo en ninguna forma**,
ni siquiera con el repo privado. Si hace falta una credencial para operar, **se pide fuera del repo.**

## Reglas

| | |
|---|---|
| **Nunca mezclar dos clientes** | Una sesión trabaja un folder |
| **Lo externo no se copia, se linkea** | Va en `LINKS.md` |
| 🔒 **Las credenciales nunca se escriben** | En `LINKS.md` va **quién** tiene el acceso, no la contraseña |
| **El plan contratado se anota primero** | Define el techo de lo que se puede prometer |
| **Nada se envía al cliente sin gate** | El CEO cierra, el agente propone |

> **Cómo se entrega lo define cada agente en su propio `brain/WORKFLOW.md`.**
> Cada uno entrega algo distinto; lo único igual para todos es que **el CEO aprueba antes de que
> algo salga.**
