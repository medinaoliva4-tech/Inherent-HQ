# Plantillas de Entregables e Instrumentos

Se copian a `clients/<cliente>/` al iniciar. **No se editan acá.**

> Ningún dato se junta sin saber dónde se usa después — ver la tabla "por qué cada dato" en
> `../METHOD.md`.

| Plantilla | Capa | Gate humano | Se usa en |
|---|---|---|---|
| `formulario-cliente.md` | 0 · instrumento (Google Form) | — | `nucleo.md` |
| `unit-economics.csv` | 0 · instrumento (Excel) | — | `nucleo.md` → ingeniería inversa financiera (3.2) |
| `nucleo.md` | 0 | ✅ | Todo el sistema |
| `demanda.csv` | 1 · instrumento | — | `ingenieria-inversa.md` → valida 3.2 y escribe 4.2/4.3 |
| `ingenieria-inversa.md` | 1 | — | Capas 3-4 |
| `posicionamiento.md` | 2-4 | ✅ | Handoff a Contenido/Calendar, Creative, Growth |
| `estrategia-de-contenido.md` | 4 | — | Creative |

## Convenciones de marcado

| Marca | Significado |
|---|---|
| ⚠️ SIN DATOS | Falta el dato. Se nombra qué falta y cómo conseguirlo |
| `[percepción del cliente, no verificado]` | Lo dijo el cliente, no está comprobado |
| BLOQUEADO | No se puede avanzar. Se nombra qué desbloquea |
| PENDIENTE | Se puede avanzar, falta completar |

**Nunca se borra una sección de la plantilla.** Si no aplica, se marca `N/A — [por qué]`.
