# Clientes

Un cliente = una carpeta. **Nunca mezclar archivos de dos clientes.**

```
clients/<cliente>/
├── _INPUTS/                       # lo crudo: reportes, contratos, capturas, exports
├── comprension.md                 # ← ENTREGABLE
├── oferta.csv                     # trabajo interno · una fila por producto o servicio, 8 columnas
└── aprendizaje-de-comprension.md  # trabajo interno · el cierre del ciclo
```

**Un entregable y dos archivos internos.** `comprension.md` lo lee **② Estrategia** antes de decidir
nada y **⑤ Producción** antes de presupuestar. `oferta.csv` es el detalle por ítem que permite
repartir el objetivo por canal de ingreso.

🛑 **Este es el primer departamento del flujo: no recibe de ningún otro.** Recibe de personas. Por eso
su riesgo no es equivocarse de dirección, sino **dar por sabido algo que nadie confirmó**.

## Al iniciar un cliente

1. Crear la carpeta con el **nombre canónico** que va a usar todo el repo. 🛑 Se define **acá**: los
   demás departamentos lo heredan. Si después no coincide, la traza entre departamentos se rompe.
2. Copiar las dos plantillas de `../entregables/` — la de `aprendizaje-de-comprension.md` vive al
   lado de la skill `co-loop`.
3. Bajar a `_INPUTS/` todo lo crudo que ya exista: reportes de venta, contratos, capturas de reseñas
   y DMs, exports de métricas.
4. Correr el pre-flight de `../WORKFLOW.md` §7 y arrancar por la Capa 0.

> 🛑 **Barrer antes de preguntar.** Drive, Notion y el OS de Inherent se revisan **antes** de mandarle
> una sola pregunta al cliente. Preguntar dos veces lo mismo es la forma más rápida de que deje de
> contestar el formulario.

## Nombre canónico

El nombre de esta carpeta es **el que manda**. Se usa igual en `agents/strategy/clients/`,
`agents/creative/clients/`, `agents/production/clients/` y `agents/posting/clients/`, y también en
Notion, Drive y Buzz.

## Regla de no duplicación

🛑 **Nunca se copia un archivo de otro departamento dentro de la carpeta de Comprensión.** Se cita su
ruta. Y al revés: los demás departamentos **citan** `comprension.md`, no lo recopian.

```markdown
Capacidad: ver `agents/comprension/clients/<cliente>/comprension.md` § La capacidad
```

## Lo crudo vive en `_INPUTS/`, no en el documento

| Qué | Dónde vive |
|---|---|
| El documento, el CSV y el aprendizaje | **Acá**, en la carpeta del cliente |
| Reportes, contratos, capturas de DMs y reseñas | **`_INPUTS/`** — es la fuente que el documento cita |
| Archivos pesados: fotos, videos, exports grandes | **Drive.** Nunca en el repo |

El documento **cita** el archivo del que salió cada dato. Sin eso, en dos meses nadie puede verificar
un número y todo el documento vale lo mismo que una impresión.

## Por ciclo

El documento **se corrige, no se rehace**. Solo se versiona cuando el negocio cambió de verdad —
abrió otro local, cambió de modelo, cambió de dueño:

```
comprension.md                            # el vigente
oferta.csv                                # el vigente
_historico/2026-09-comprension.md         # versiones cerradas
_historico/2026-09-oferta.csv
_historico/2026-10-aprendizaje.md
```

🛑 **La capacidad declarada nunca se pisa: se le agrega una fila al historial.** El desvío entre lo
declarado y lo medido es el dato más útil del departamento.
