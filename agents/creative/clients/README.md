# Clientes

Un cliente = una carpeta. **Nunca mezclar archivos de dos clientes.**

```
clients/<cliente>/
├── _INPUTS/                  # brand kit, banco de assets, exports de métricas
├── plan-de-contenido.csv     # ← ENTREGABLE · la estructura, 12 columnas
├── ideas.md                  # ← ENTREGABLE · el desarrollo, una sección por pieza
├── swipe-file.md             # trabajo interno · la bóveda de referencias
└── aprendizaje-creativo.md   # trabajo interno · el cierre del ciclo
```

**Dos entregables y dos archivos internos.** Nada más. El Excel dice **qué piezas hay**; el doc dice
**cómo es cada una**; el puente es el `id` (`CR-007`).

## Al iniciar un cliente

1. Verificar que existe `agents/strategy/clients/<cliente>/` con sus gates aprobados.
   **Si no existe, Creative no arranca** — se pide la estrategia primero.
2. Crear la carpeta con **el mismo nombre canónico** que usa ③ Marketing.
3. Copiar las dos plantillas de `../entregables/`.
4. Guardar en `_INPUTS/` el brand kit de Branding y el banco de assets.
5. Correr el pre-flight de `../WORKFLOW.md` §6.

## Nombre canónico

El nombre de la carpeta es **el mismo** que en `agents/strategy/clients/`. Se usa igual en Notion,
Drive y Buzz. Si los dos nombres no coinciden, la traza entre departamentos se rompe.

## Regla de no duplicación

🛑 **Nunca se copia un archivo de otro departamento dentro de la carpeta de Creative.** Se cita su ruta:

```markdown
Promesa: ver `agents/strategy/clients/<cliente>/posicionamiento.md` §4.3
```

Copiarlo crea una segunda versión de la verdad. En dos ciclos las dos no coinciden y nadie sabe cuál manda.

## Por bloque

Los entregables se **versionan por bloque de calendario**, no se sobrescriben:

```
plan-de-contenido.csv                    # el vigente
ideas.md                                 # el vigente
_historico/2026-09-plan-de-contenido.csv # bloques cerrados
_historico/2026-09-ideas.md
_historico/2026-09-aprendizaje.md
```

El `aprendizaje-creativo.md` del bloque anterior es **input obligatorio** del siguiente: es lo que
hace que el sistema se vuelva más listo cada mes en vez de arrancar de cero.
