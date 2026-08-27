# Producción y captura

## Objetivo

Capturar todo lo aprobado en preproducción y dejar footage verificable para postproducción.

## Artifact / checklist interactivo

Crear un artifact visual (HTML o equivalente) con una tarjeta por toma. Debe mostrar referencia, instrucciones, asset requerido, notas y estado.

Estados permitidos:

```text
NOT STARTED → READY → CAPTURED → REVIEW → APPROVED
                         └→ RETAKE → CAPTURED
```

## Checklist por toma

- [ ] ID y referencia correctos
- [ ] Sujeto, encuadre, acción y luz conforme al shotlist
- [ ] Audio / ambiente verificado cuando aplica
- [ ] Archivo almacenado con nombre trazable
- [ ] Estado `CAPTURED`
- [ ] Revisión humana de captura
- [ ] Estado `APPROVED` o `RETAKE`

No cerrar producción mientras exista una toma requerida sin `APPROVED`.

## Handoff a postproducción

Entregar a [POSTPRODUCTION.md](POSTPRODUCTION.md):

- Footage organizado e indexado por ID de toma.
- Checklist exportado con solo capturas aprobadas.
- Notas de retakes, audio y continuidad.
- Fotos y videos separados.
- Enlace a la preproducción aprobada.
