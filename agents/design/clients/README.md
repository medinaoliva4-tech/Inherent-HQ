# Clientes — Diseño

**Un cliente = una carpeta.** Nunca se mezclan archivos de dos clientes.

```
clients/<cliente>/
├── _INPUTS/
│   ├── guia-de-marca/     lo que mandó Branding
│   ├── contenido/         copies, titulares, CTAs
│   ├── fotos/
│   │   ├── originales/
│   │   └── recortes/      PNGs sin fondo producidos en D0
│   ├── assets/
│   │   ├── ilustraciones/
│   │   ├── texturas/
│   │   ├── pinceladas/
│   │   └── generados/     todo lo marcado [asset generado]
│   └── calendario/        el Excel/CSV de Creative
├── guia-aplicable.md      D0 · 🚦 GATE 1 reforzado (solo Modo B)
├── sistema-visual.md      D0 · 🚦 GATE 1
├── lote-de-piezas.csv     D1
├── briefs/
│   └── <id_pieza>.md      D2
├── ruta-visual.md         D3-D4 · 🚦 GATE 2
├── entrega.md             D7 · 🚦 GATE 3
└── exports/               los archivos finales
```

## Reglas

1. **Las plantillas se copian de `templates/`.** No se editan las plantillas.
2. **`guia-aplicable.md` y `sistema-visual.md` se hacen una vez por cliente**, se revisan cada 3
   lotes. `guia-aplicable.md` solo existe si D0 corrió en **Modo B** (Branding entregó intel, no
   manual).
3. **`lote-de-piezas.csv`, `ruta-visual.md` y `entrega.md` son por lote.** Si hay varios lotes,
   se versiona por período: `lote-2026-10.csv`, `ruta-visual-2026-10.md`, `entrega-2026-10.md`.
4. **`generados/` es una carpeta aparte a propósito.** Hace visible cuánto del lote no es material real.
5. **Nada se borra.** Una pieza descartada queda en el CSV con su estado y su motivo.
6. **Antes de crear un cliente nuevo**, verificar si ya existe en Notion, Drive o Inherent OS,
   y si Strategy ya produjo `posicionamiento.md` (de ahí salen los activos distintivos de D0.6).
