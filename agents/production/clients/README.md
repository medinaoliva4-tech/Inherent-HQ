# Clientes — Agente de Producción

**Un cliente = una carpeta.** Nunca se mezclan archivos de dos clientes.

```
agents/production/clients/<cliente>/
├── _INPUTS/                       # guidelines de ②B, banco de assets, cotizaciones recibidas
├── brief-de-produccion.md
├── desglose.md
├── plan-de-jornadas.md
├── recursos.md
├── plan-de-produccion.csv
├── call-sheets/
│   ├── jornada-1.md
│   └── jornada-2.md
├── entrega.md
└── aprendizaje-de-produccion.md
```

## Nombre canónico

El nombre de la carpeta es **el mismo** que en `agents/creative/clients/` y en los departamentos de
aguas arriba. Se usa igual en Notion, Drive y Buzz. Si los nombres no coinciden, la traza entre
departamentos se rompe.

## Regla de no duplicación de archivos

🛑 **Nunca se copia un archivo de otro departamento dentro de la carpeta de Producción.** Se cita su
ruta:

```markdown
Escenas de C-001: ver `agents/creative/clients/<cliente>/ideas-de-contenido.csv`
```

Copiarlo crea una segunda versión de la verdad. Y en Producción es peor que en otros departamentos:
si el Excel creativo cambia después de copiado, el equipo graba la versión vieja.

🛑 **Y nunca se escribe en el archivo de otro departamento.** Producción no edita
`ideas-de-contenido.csv`: devuelve la fila con ↩️ y espera la corrección de ④ Creatividad.

## Por ciclo

Los entregables se **versionan por ciclo de producción**, no se sobrescriben:

```
plan-de-produccion_2026-Q3-instalacion.csv
call-sheets/2026-Q3-instalacion/jornada-1.md
```

El `aprendizaje-de-produccion.md` del ciclo anterior es un **input** del ciclo siguiente: de ahí
salen los tiempos y costos corregidos.

## Dónde NO van las cosas

| Cosa | Dónde va |
|---|---|
| El material grabado | **Drive**, con la estructura de `toolkit/07-entrega.md`. **Nunca en el repo** |
| Datos de contacto del talento | `_INPUTS/`, y no salen de ahí |
| Cotizaciones recibidas | `_INPUTS/`, con fecha |
| Contratos y cesiones firmadas | Fuera del repo, donde el cliente los archive |
