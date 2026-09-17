# Clientes

Un cliente = un folder. Vive **afuera** de los agentes: todos los agentes leen y escriben acá.

```
clients/<cliente>/
├── ESTRATEGIA.md   ← el documento que se le entrega al cliente
├── LINKS.md        ← lo que vive afuera: Drive de fotos, de videos, de entregables, Figma
└── data/           ← todo lo que se investigó y recibió, expandido, para los demás agentes
```

**Regla:** lo externo no se copia acá, se **linkea** en `LINKS.md`.
