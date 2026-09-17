# Clientes

Un cliente = un folder. Vive **afuera** de los agentes: todos los agentes leen y escriben acá.

`client-delivery/` es la skill **compartida** que define cómo se entrega. Misma forma para todos
los agentes.

```
clients/<cliente>/
├── ESTRATEGIA.md   ← el documento que se le entrega al cliente
├── LINKS.md        ← lo que vive afuera: Drive de fotos, de videos, de entregables, Figma
└── data/           ← todo lo que se investigó y recibió, expandido, para los demás agentes
```

**Regla:** lo externo no se copia acá, se **linkea** en `LINKS.md`.

```
clients/
├── client-delivery/   ← la skill de entrega, compartida
└── <cliente>/         ← un folder por cliente
```
