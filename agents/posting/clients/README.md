# Clientes

Un cliente = una carpeta. **Nunca mezclar archivos de dos clientes.**

```
clients/<cliente>/
├── _INPUTS/                        # accesos, métricas de la cuenta, plantilla vigente de Publer
├── publicaciones.md                # ← ENTREGABLE · para quien aprueba
├── publer-import.csv               # ← ENTREGABLE · para quien carga
├── calendario-de-publicacion.csv   # trabajo interno · una fila por publicación, 12 columnas
└── aprendizaje-de-posting.md       # trabajo interno · el cierre del ciclo
```

**Dos entregables y dos archivos internos.** `publicaciones.md` lo lee **quien aprueba**: caption,
QA y fecha de cada pieza. `publer-import.csv` lo sube **quien carga**: no se lee, se sube. El puente
con ④ Creatividad es el `id_creativo`.

## 🛑 Este departamento no publica

Deja el paquete y el archivo de carga; **un humano lo sube a Publer y aprieta programar.** Es una
decisión declarada: la regla 10 del `CLAUDE.md` y el `deny` de publicación en `.claude/settings.json`.

🛑 **Ninguna credencial de Publer vive en el repo.** El archivo se sube desde la sesión del cliente.

## Al iniciar un cliente

1. Verificar que existe `agents/creative/clients/<cliente>/` con el **Gate 3 aprobado** y que ⑥A y
   ⑥B entregaron los archivos finales. **Sin archivos no hay calendario.**
2. Verificar en `agents/comprension/clients/<cliente>/comprension.md` § La capacidad **qué cuentas
   existen y quién tiene las claves.** Sin eso el departamento está `BLOQUEADO`.
3. Crear la carpeta con **el mismo nombre canónico** que usa ① Comprensión.
4. Copiar las tres plantillas de `../entregables/` — la de `aprendizaje-de-posting.md` vive al lado
   de la skill `po-loop`.
5. Bajar a `_INPUTS/` las métricas de la cuenta si existen y **la plantilla vigente de Publer**.
6. Correr el pre-flight de `../WORKFLOW.md` §7.

## Nombre canónico

El nombre de la carpeta es **el mismo** que en `agents/comprension/clients/`. Se usa igual en Notion,
Drive y Buzz. Si los dos nombres no coinciden, la traza entre departamentos se rompe.

## Regla de no duplicación

🛑 **Nunca se copia un archivo de otro departamento dentro de la carpeta de Posting.** Se cita su ruta:

```markdown
Copy de CR-007: ver `agents/creative/clients/<cliente>/ideas-reel.md` §CR-007
```

Y si lo que llegó no se puede publicar como está: **se devuelve con ↩️** y se espera su corrección.
🛑 **No se edita el archivo de otro departamento, y no se arregla el export.**

## Los archivos NO viven en el repo

| Qué | Dónde vive |
|---|---|
| Los dos entregables y los dos archivos internos | **Acá**, en la carpeta del cliente |
| Los videos y las piezas de diseño | **Drive**, donde los dejaron ⑥A y ⑥B. **Nunca en el repo** |

El repo lleva el **plan y el registro**; Drive lleva los archivos pesados.

🛑 **`Media URL` de Publer tiene que ser una URL pública.** Un link privado de Drive Publer no lo
puede leer: recibe la página de permiso, no el archivo. Se verifica abriéndola **sin sesión** antes
de cargar.

## Por ciclo

Los entregables se **versionan por ciclo**, no se sobrescriben:

```
publicaciones.md                            # el vigente
publer-import.csv                           # el vigente
calendario-de-publicacion.csv               # el vigente (interno)
_historico/2026-09-publicaciones.md         # ciclos cerrados
_historico/2026-09-publer-import.csv
_historico/2026-09-calendario-de-publicacion.csv
_historico/2026-09-aprendizaje.md
```

🛑 **Antes de cargar un ciclo nuevo se verifica que el anterior no dejó filas en `cargado` sin
publicar.** Es la forma más común de publicar algo dos veces.
