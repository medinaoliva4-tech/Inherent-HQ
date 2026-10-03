# Los clientes

**Un cliente = un folder.** Vive **afuera** de los agentes: todos leen y escriben acá.

```
clients/<cliente>/
├── CONTACTO.md     ← quién es, de qué número escribe y qué plan tiene
├── ESTRATEGIA.md   ← el documento que se le entrega al cliente
├── LINKS.md        ← lo que vive afuera: Drive de fotos, de videos, de entregables, Figma
└── data/           ← todo lo investigado y recibido, expandido, para los demás agentes
```

## Reglas

| | |
|---|---|
| **Nunca mezclar dos clientes** | Una sesión trabaja un folder |
| **`CONTACTO.md` es lo único que el bot lee de todos** | Nombre, número y plan. El resto del folder solo se abre cuando escribe **ese** cliente |
| **Un responsable puede tener varios clientes** | Cada negocio es su folder. Si el mensaje es ambiguo, se pregunta de cuál |
| **Lo externo no se copia, se linkea** | Va en `LINKS.md` |
| **El plan contratado se anota primero** | Define el techo de lo que se puede prometer |
| **Nada se envía al cliente sin gate** | Allan cierra, el agente propone |

> **Cómo se entrega lo define cada agente en su propio `brain/WORKFLOW.md`.**
> Cada uno entrega algo distinto; lo único igual para todos es que **Allan aprueba antes de que
> algo salga.**
