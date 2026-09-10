# Clientes

Un cliente = una carpeta. **Nunca mezclar archivos de dos clientes.**

```
clients/<cliente>/
├── _INPUTS/                      # brand kit, banco de assets, exports de métricas
├── brief-creativo.md             # Capa 0    🚦 gate
├── swipe-file.md                 # Capa 1
├── conceptos.md                  # Capas 2-3 🚦 gate
├── direccion-creativa.md         # Capas 4-5
├── adaptacion-por-canal.md       # Capa 6
├── ideas-de-contenido.csv        # Capa 6    🚦 gate  ← el entregable definitivo
└── aprendizaje-creativo.md       # Capa 7
```

## Al iniciar un cliente

1. Verificar que existe `agents/strategy/clients/<cliente>/` con sus gates aprobados.
   **Si no existe, Creative no arranca** — se pide la estrategia primero.
2. Crear la carpeta con **el mismo nombre canónico** que usa Strategy: `clients/nombre-cliente/`
3. Copiar las 7 plantillas de `../templates/`
4. Guardar en `_INPUTS/` el brand kit de Branding y el banco de assets
5. Correr `PROCESS.md` desde el Paso 2

## Nombre canónico

El nombre de la carpeta es **el mismo** que en `agents/strategy/clients/`. Se usa igual en Notion,
Drive y Buzz. Si los dos nombres no coinciden, la traza entre departamentos se rompe.

## Regla de no duplicación de archivos

🛑 **Nunca se copia un archivo de Strategy dentro de la carpeta de Creative.** Se cita su ruta:

```markdown
Promesa: ver `agents/strategy/clients/<cliente>/posicionamiento.md` §4.3
```

Copiarlo crea una segunda versión de la verdad. En dos ciclos, las dos no coinciden y nadie sabe
cuál manda.

## Por bloque

Los entregables se **versionan por bloque de calendario**, no se sobrescriben:

```
ideas-de-contenido.csv              # el vigente
_historico/2026-09-ideas.csv        # bloques cerrados
_historico/2026-09-aprendizaje.md
```

El `aprendizaje-creativo.md` del bloque anterior es **input obligatorio** del siguiente: es lo que
hace que el sistema se vuelva más listo cada mes en vez de empezar de cero.
