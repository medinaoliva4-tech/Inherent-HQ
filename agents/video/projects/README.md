# Proyectos de Video

Un proyecto = una carpeta. **Nunca mezclar material de dos proyectos ni de dos clientes.**

```
projects/<cliente>/<proyecto>/
├── _INPUTS/                  # material crudo, referencias, assets, guion
├── _EXPORTS/                 # versiones exportadas por plataforma
├── brief-de-video.md         # Fase 0    🚦 gate
├── analisis-de-material.md   # Fase 1
├── plan-de-edicion.md        # Fases 2-3 🚦 gate
├── edit-decision-list.csv    # Fase 3
└── qc-entrega.md             # Fase 5    🚦 gate
```

## Al iniciar un proyecto

1. Crear la carpeta en minúsculas y con guiones: `projects/nombre-cliente/nombre-proyecto/`
2. Copiar las plantillas de `../../templates/`
3. Buscar antes de arrancar de cero:
   - `agents/strategy/clients/<cliente>/` — posicionamiento, pilares y calendario
   - Brand guideline del cliente (Branding / Notion / Drive)
   - Guion o concepto (Creative)
4. Guardar el material crudo en `_INPUTS/` — **el original nunca se modifica**
5. Correr `PROCESS.md` desde el Paso 2

## Reglas

| Regla | Detalle |
|---|---|
| El original es solo lectura | Todo procesamiento va al scratchpad, no a `_INPUTS/` |
| Archivos pesados fuera de git | `_INPUTS/` y `_EXPORTS/` no se commitean |
| Una versión = un archivo | Nunca se sobrescribe un corte aprobado |
| El nombre de carpeta es canónico | Se usa igual en Drive, Notion y Buzz |

## Nombre canónico

El nombre del cliente coincide **exactamente** con el de
`agents/strategy/clients/<cliente>/`. Un cliente, un nombre, en todo el sistema.
