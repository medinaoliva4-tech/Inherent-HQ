---
name: pr-pre
description: >
  Pre de ④ Producción — todo lo que hace falta antes de grabar, en una hoja imprimible para
  escribir encima. De las piezas aprobadas con material video o foto arma la jornada (agrupada por
  locación, talento y setup), los briefs por escena, los guiones con sus hooks alternos, la shot
  list, los permisos, las compras y el presupuesto. Úsala cuando pidan "qué hace falta para
  grabar", "la jornada", "el call sheet", "la shot list", "los guiones para el rodaje",
  "permisos", "qué compramos", "cuánto cuesta el rodaje", "hooks alternos".
---

# Pre — de las piezas a la jornada

| | |
|---|---|
| **Consume** | Nodos `pieza` aprobados con `material: video` o `foto` · la ficha *(horas de grabación, sesiones de fotos)* · el banco de material del cliente |
| **Produce** | `clients/<cliente>/04-contenido/<AAAA-MM>/produccion/jornada-<n>.md` — nodo `tipo: jornada`, `viene_de` a sus piezas · la hoja imprimible de la herramienta del OS |

## 1 · Qué se graba y qué no

- **Solo piezas aprobadas.** Una pieza sin escenas escritas vuelve a ③ Marketing y Creative.
- **Lo que ya está en el banco no se vuelve a grabar.**
- **El techo es la ficha:** horas de cámara y sesiones. Si no alcanza, se cambia la mezcla *(más
  derivadas, material crudo del cliente)* o se cotiza extra. **Nunca se recortan horas.**

## 2 · La jornada — agrupar es lo que ahorra

Se desglosa cada escena en lo que hay que conseguir *(locación, talento, producto, props, vestuario,
arte, equipo, permisos)* y se agrupa **por locación → talento → setup de luz y cámara → horario**.
**30 escenas bien agrupadas se graban en 2 jornadas, no en 11.**

## 3 · La hoja de la jornada — una página por jornada

| Bloque | Qué lleva |
|---|---|
| **Encabezado** | Cliente, fecha, dirección, horario, contactos *(rol y teléfono)* |
| **Orden de tiro** | Escena por escena, ordenadas por costo de cambio *(lo que cuesta mover va junto)* |
| **Brief por escena** | Pieza de la que sale, qué tiene que verse, encuadre, duración, toma de seguridad |
| **Guion** | Lo que se dice, literal de ③ *(no se reescribe en rodaje)* |
| **Hooks alternos** | 2-3 variantes de los primeros 3 s por pieza, para pauta y prueba |
| **Shot list** | Planos por escena + **cobertura obligatoria** *(detalle, plano general, B-roll para derivadas)* |
| **Permisos** | Locación, música, personas que salen *(autorización de imagen)*, marcas de terceros |
| **Compras** | Qué, cuánto, quién lo consigue y para cuándo · 🟢🟡🔴 |
| **Riesgos** | Lo que puede fallar y su plan B |
| **Nomenclatura** | Cómo se nombran los archivos *(id de la pieza en el nombre)*, definida antes de grabar |

🔑 **Es una hoja para imprimir y escribir encima.** Lo que se corrige en papel se pasa a la
herramienta y queda como dato.

## 4 · Presupuesto

Por jornada, nunca por pieza: equipo, talento, locación, compras y una **contingencia** como línea
propia. Si pasa la referencia del onboarding, **se escala al CEO con tres opciones** y se sigue.

## 5 · Al cerrar el rodaje

Checklist de locación antes de desarmar · cobertura y audio revisados · **backup doble** · selects
marcados · el material en el Drive del cliente *(`03 Crudo`)* con su nomenclatura. **El material no
vive en el repo.** Último día para producir: **el 11**.
