# Clientes

Un cliente = una carpeta. **Nunca mezclar archivos de dos clientes.**

```
clients/<cliente>/
├── _INPUTS/                      # guidelines, banco de assets, cotizaciones
├── plan-de-produccion.csv        # ← ENTREGABLE · una fila por escena, 16 columnas
├── presupuesto.csv               # ← ENTREGABLE · por campaña y categoría, con totales
├── plan.md                       # ← ENTREGABLE · jornadas, recursos, riesgos, call sheets, entrega
└── aprendizaje-de-produccion.md  # trabajo interno · el cierre del ciclo
```

**Tres entregables y un archivo interno.** Nada más. El Excel de escenas dice **qué se graba**; el de
presupuesto dice **cuánto cuesta cada campaña y el ciclo entero**; el `plan.md` dice **cómo se va a
hacer**. El puente con ④ Creatividad es el `id_creativo`.

## Al iniciar un cliente

1. Verificar que existe `agents/creative/clients/<cliente>/` con el **Gate 3 aprobado**.
   **Si no está aprobado, Producción no arranca** — producir sobre ideas que pueden cambiar es gastar
   presupuesto en algo que se va a rehacer.
2. Crear la carpeta con **el mismo nombre canónico** que usa ④ Creatividad.
3. Copiar las tres plantillas de `../entregables/`.
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
| Los tres entregables | **Acá**, en la carpeta del cliente |
| El material grabado (RAW, selects, fotos) | **Drive**, con la estructura y nomenclatura de `pr-entrega`. **Nunca en el repo** |

El repo lleva el **plan y el registro**; Drive lleva los archivos pesados. `plan.md` §5 guarda la
ruta de Drive y el patrón de nombres, que es lo que permite cruzar un archivo entregado contra su
fila del Excel.

## Por ciclo

Los entregables se **versionan por ciclo**, no se sobrescriben:

```
plan-de-produccion.csv                    # el vigente
presupuesto.csv                           # el vigente
plan.md                                   # el vigente
_historico/2026-09-plan-de-produccion.csv # ciclos cerrados
_historico/2026-09-presupuesto.csv
_historico/2026-09-aprendizaje.md
```

El `presupuesto.csv` cerrado del ciclo anterior —con su `costo_real` completo— es **input obligatorio**
del siguiente: es lo que hace que el próximo presupuesto se estime con datos y no a ojo.
