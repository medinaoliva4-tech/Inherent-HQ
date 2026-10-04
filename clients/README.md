# Los clientes

## 🔒 Primero: ¿el repo es público o privado?

**La información de un cliente nunca vive en un repo público.**

| Si `Inherent-HQ` es… | Qué va en `clients/<cliente>/` |
|---|---|
| 🔴 **Público** | **Solo un `README.md`** con el nombre del cliente y el **link a su repo privado**. Nada más: ni estrategia, ni data, ni links a Drive |
| 🟢 **Privado** | **Todo lo del cliente**, con la estructura de abajo |

🛑 **Antes de escribir en `clients/`, se verifica la visibilidad del repo.** Si es público y la
información no tiene a dónde ir, **se bloquea y se avisa a Allan** — no se sube «por mientras».

**Un cliente = un folder.** Vive **afuera** de los agentes: todos leen y escriben acá.

```
clients/<cliente>/
├── ESTRATEGIA.md   ← el documento que se le entrega al cliente
├── LINKS.md        ← lo que vive afuera: Drive de fotos, de videos, de entregables, Figma
└── data/           ← todo lo investigado y recibido, expandido, para los demás agentes
```

## Reglas

| | |
|---|---|
| **Nunca mezclar dos clientes** | Una sesión trabaja un folder |
| **Lo externo no se copia, se linkea** | Va en `LINKS.md` |
| **El plan contratado se anota primero** | Define el techo de lo que se puede prometer |
| **Nada se envía al cliente sin gate** | Allan cierra, el agente propone |

> **Cómo se entrega lo define cada agente en su propio `brain/WORKFLOW.md`.**
> Cada uno entrega algo distinto; lo único igual para todos es que **Allan aprueba antes de que
> algo salga.**
