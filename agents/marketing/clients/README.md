# Clientes — Marketing

**Marketing no tiene su propio árbol de clientes.** Un cliente = **una** carpeta en todo el repo.

Los entregables de Marketing viven en:

```
agents/strategy/clients/<cliente>/marketing/
```

## Por qué

Marketing consume casi todos los archivos de Strategy y los dos trabajan sobre el mismo ciclo.
Dos árboles de cliente producirían dos versiones del mismo cliente y ningún archivo sería la verdad.

## Estructura de un cliente completo

```
agents/strategy/clients/<cliente>/
├── _INPUTS/                      # material crudo del cliente
├── nucleo.md                     # Strategy
├── ingenieria-inversa.md         # Strategy
├── posicionamiento.md            # Strategy  ← gate que habilita a Marketing
├── estrategia-de-contenido.md    # Strategy
├── contenido-por-canal.md        # Strategy
├── calendario-estrategico.csv    # Strategy
├── medicion.md                   # Strategy
└── marketing/                    # ← Marketing escribe SOLO acá
    ├── handoff-recibido.md
    ├── research-comercial.md
    ├── plan-de-marketing.md
    ├── campanas.md
    ├── calendario-comercial.csv
    ├── volumen-y-presupuesto.md
    └── lectura-comercial.md
```

🛑 **Marketing nunca edita un archivo fuera de `marketing/`.** Lo que haya que cambiar en un
entregable de Strategy se devuelve con **⟲ RETORNO A ESTRATEGIA** (ver `FRONTERAS.md` §3).
