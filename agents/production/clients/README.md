# Clientes

Un cliente = una carpeta. **Nunca mezclar archivos de dos clientes.**

```
clients/<cliente>/
├── _INPUTS/                      # guidelines, banco de assets, cotizaciones
├── presupuesto.md                # ← ENTREGABLE · para el cliente, en lenguaje natural
├── plan-de-rodaje.md             # ← ENTREGABLE · para el equipo, con lo que se rueda
├── plan-de-produccion.csv        # trabajo interno · una fila por escena, 16 columnas
├── presupuesto.csv               # trabajo interno · categorías cerradas, estimado vs real
└── aprendizaje-de-produccion.md  # trabajo interno · el cierre del ciclo
```

**Dos entregables y tres archivos internos.** `presupuesto.md` lo lee **el cliente**: qué se produce,
cuándo, qué necesitamos de él y cuánto cuesta, sin jerga. `plan-de-rodaje.md` lo lee **el equipo** el
día del rodaje, y trae compilado lo que hace falta de ④ Creatividad para no tener que abrir dos
archivos en el set. El puente con ④ es el `id_creativo`.

## Al iniciar un cliente

1. Verificar que existe `agents/creative/clients/<cliente>/` con el **Gate 3 aprobado**.
   **Si no está aprobado, Producción no arranca** — producir sobre ideas que pueden cambiar es gastar
   presupuesto en algo que se va a rehacer.
2. Crear la carpeta con **el mismo nombre canónico** que usa ④ Creatividad.
3. Copiar las cuatro plantillas de `../entregables/`.
4. Guardar en `_INPUTS/` las guidelines de ②B y el banco de assets existente.
5. Correr el pre-flight de `../WORKFLOW.md` §7.

## Nombre canónico

El nombre de la carpeta es **el mismo** que en `agents/creative/clients/`. Se usa igual en Notion,
Drive y Buzz. Si los dos nombres no coinciden, la traza entre departamentos se rompe.

## Regla de no duplicación

🛑 **Nunca se copia un archivo de otro departamento dentro de la carpeta de Producción.** Se cita su ruta:

```markdown
Escenas de CR-001: ver `agents/creative/clients/<cliente>/ideas-<formato>.md` §CR-001
```

Y si lo que pide ④ no se puede producir: **se devuelve la fila con ↩️** y se espera su corrección.
🛑 **No se edita el archivo de Creatividad.**

## El material NO vive en el repo

| Qué | Dónde vive |
|---|---|
| Los dos entregables y los tres archivos internos | **Acá**, en la carpeta del cliente |
| El material grabado (RAW, selects, fotos) | **Drive**, con la estructura y nomenclatura de `pr-entrega`. **Nunca en el repo** |

El repo lleva el **plan y el registro**; Drive lleva los archivos pesados. `plan-de-rodaje.md` § Cómo se nombran los archivos guarda la
ruta de Drive y el patrón de nombres, que es lo que permite cruzar un archivo entregado contra su
fila del Excel.

## Por ciclo

Los entregables se **versionan por ciclo**, no se sobrescriben:

```
presupuesto.md                            # el vigente
plan-de-rodaje.md                         # el vigente
plan-de-produccion.csv                    # el vigente (interno)
presupuesto.csv                           # el vigente (interno)
_historico/2026-09-presupuesto.md         # ciclos cerrados
_historico/2026-09-plan-de-rodaje.md
_historico/2026-09-plan-de-produccion.csv
_historico/2026-09-presupuesto.csv
_historico/2026-09-aprendizaje.md
```

El `presupuesto.csv` cerrado del ciclo anterior —con su `costo_real` completo— es **input obligatorio**
del siguiente: es lo que hace que el próximo presupuesto se estime con datos y no a ojo.
