# Production System v2

## Propósito

Convertir estrategia y Brand Guidelines en fotos y videos finales, con máxima autonomía operativa y aprobación humana en decisiones creativas, planes y entregables.

## Arquitectura de herramientas

| Herramienta | Responsabilidad exclusiva |
|---|---|
| **Higgsfield Skill** | Generar, mejorar o transformar imágenes y assets visuales. No edita timelines de Adobe. |
| **Higgsfield Bridge** | Capa de ejecución dentro de Adobe Premiere Pro y After Effects. No genera assets fuera de Adobe. |
| **Jockey Knowledge Store** | Búsqueda semántica de footage. |
| **FFmpeg** | Extraer, normalizar y cortar clips. |
| **FigWright** | Crear gráficos de marca en Figma. Requiere llamada por terminal o pedir al usuario abrirla. |

## Flujo maestro

```text
PREPRODUCTION.md → aprobación de plan
        ↓
PRODUCTION_CAPTURE.md → captura aprobada
        ↓
POSTPRODUCTION.md
  ├─ fotografía → aprobación individual
  └─ video → Video Edit Plan aprobado → clips aprobados → assets listos → Adobe
        ↓
entregables finales + revisión humana
```

## Reglas de autonomía

- La IA investiga, organiza, propone, ejecuta pasos repetibles y deja trazabilidad.
- El humano decide dirección creativa, aprueba preproducción, captura, cada foto, Video Edit Plan, clips y entregable final.
- No asumir aprobación. Si falta una, detenerse en el handoff correspondiente.
- Mantener por pieza: `ID`, referencia, versión, estado, archivos fuente, aprobador y fecha.

## Handoffs

1. **Preproducción → Producción:** paquete aprobado: referencias, winner breakdowns, shotlists, requisitos y plan.
2. **Producción → Postproducción:** footage/index, checklist completo, tomas aprobadas y retakes resueltos.
3. **Postproducción → Entrega:** fotos y/o video final, fuentes, versión aprobada y checklist QA.

Ver [PREPRODUCTION.md](PREPRODUCTION.md), [PRODUCTION_CAPTURE.md](PRODUCTION_CAPTURE.md) y [POSTPRODUCTION.md](POSTPRODUCTION.md).
