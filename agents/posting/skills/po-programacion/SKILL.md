---
name: po-programacion
description: >
  Capa 3 de ⑦ Posting — fija la hora y la cuenta de cada publicación y verifica que nada se pise. ④
  Creatividad puso el día; acá se pone la hora, se asigna la cuenta concreta (no el canal), se
  comprueba que dos piezas de la misma cuenta no salgan el mismo día sin separación y se declara la
  zona horaria. Si no hay métricas de la cuenta, se usa la hora de ③ y se marca ⚠️ SIN DATOS: la
  "mejor hora" no se inventa. Escribe las columnas `cuenta`, `fecha` y `hora` de
  `calendario-de-publicacion.csv`. Úsala cuando pidan "a qué hora sale", "armá el calendario de
  publicación", "en qué cuenta va", "¿no se pisan dos posts?". Cierra con el GATE 1 de captions.
---

# Capa 3 · Programación — cuándo y dónde exactamente

| | |
|---|---|
| **Consume** | Las filas con `caption_ok` y `specs_ok` en ✅ · la `fecha` de ④ · métricas de la cuenta del `_INPUTS/` si existen · § La capacidad de ① (quién publica) |
| **Produce** | Las columnas **`cuenta`**, **`fecha`** y **`hora`** de `calendario-de-publicacion.csv` · la tabla del ciclo de un vistazo en `publicaciones.md` |

Contexto del departamento: `agents/posting/WORKFLOW.md`.

## 1 · Qué se decide acá y qué no

| Lo decide ④ / ③ | Lo decide Posting |
|---|---|
| **El día** — ④ lo fijó dentro de la semana del slot | **La hora** |
| **El canal** — ③ lo asignó | **La cuenta concreta** dentro de ese canal |
| Qué pieza va en qué campaña | El **orden** cuando dos caen el mismo día |

🛑 **La fecha no se mueve.** Si una pieza no llega a su día, **no se corre sola**: se declara y
decide ③ Marketing. Correr una fecha rompe la secuencia de una campaña sin que nadie lo haya decidido.

## 2 · `cuenta` no es `canal`

```
canal  = instagram-reels
cuenta = @cafederiva
```

Un cliente puede tener dos cuentas del mismo canal —la de la marca y la del local nuevo, la
principal y la de otro país—. **Cargar en la equivocada es de los pocos errores de este departamento
que se ven desde afuera**, y no se puede deshacer del timeline de nadie.

| Verificación | Dónde está |
|---|---|
| Qué cuentas existen | `comprension.md` § La capacidad |
| Quién tiene las claves | `comprension.md` § La capacidad |
| Cuál está conectada en Publer | Se confirma **dentro de Publer** antes de cargar |

## 3 · La hora — con dato, o declarada sin dato

| Situación | Qué se hace |
|---|---|
| **Hay métricas de la cuenta** | Se usa la franja donde esa cuenta rinde. Se anota de dónde salió el dato |
| **No hay métricas** | Se usa la hora que indicó ③, y se marca `⚠️ SIN DATOS` |
| **No hay ni métricas ni indicación** | Se usa una hora razonable para el hábito del comprador según `comprension.md` § El cliente, **y se declara que es un supuesto** |

🛑 **La «mejor hora» no se inventa.** No existe una hora universalmente buena, y afirmarla sin dato
es exactamente lo que la regla 1 del repo prohíbe. `⚠️ SIN DATOS` es una respuesta válida; *"a las 6
pm funciona mejor"* sin fuente, no.

> **El dato del comprador sí sirve como supuesto declarado.** Si `comprension.md` dice *"el 60 % del
> ingreso entra al mediodía de días hábiles"*, publicar a las 11:30 es un supuesto razonable — y se
> escribe **como supuesto**, citando de dónde salió.

**La zona horaria se declara una vez, arriba del documento.** Publer programa en la zona de la
cuenta; si no coinciden, todo el ciclo sale corrido.

## 4 · Que nada se pise

| Chequeo | Regla |
|---|---|
| **Dos piezas, misma cuenta, mismo día** | Se separan al menos unas horas, y se anota por qué van juntas |
| **Dos piezas, misma cuenta, misma hora** | 🛑 Nunca. Se mueve una |
| **Story y feed el mismo día** | Está bien — son formatos distintos. Se verifica que la story no adelante el feed sin querer |
| **Pieza de pauta y orgánica iguales** | Se marca cuál es cuál. ⑧B necesita saberlo |
| **El ciclo anterior** | 🛑 Se verifica que no quedaron filas en `cargado` sin publicar antes de cargar el nuevo |

## 5 · El gate

🚦 **GATE 1 — los captions.** Se presenta a quien aprueba el paquete completo de textos, cuenta por
cuenta y fecha por fecha, antes de armar el archivo de carga:

```
- Publicaciones listas: [n] · pendientes: [n] · no salen: [n]
- Cuentas usadas: [lista]
- Hora con dato: [n] · ⚠️ SIN DATOS: [n] · supuesto declarado: [n]
- Zona horaria: [x]
- Claims ⏸️ que no entran: [lista]
```

🛑 **Es el gate que aprueba el cliente.** Un caption mal aprobado se multiplica por todas las filas
del ciclo, y corregirlo después de cargar significa rehacer el archivo entero.

---

## Control de calidad de la Capa 3

- [ ] Toda fila tiene **`cuenta` concreta** (`@handle`), no solo el canal
- [ ] Se verificó **quién tiene las claves** de cada cuenta usada
- [ ] 🛑 **Ninguna fecha se movió** — las que no llegan se declararon y decide ③
- [ ] Toda `hora` tiene **origen declarado**: dato de la cuenta, indicación de ③, o supuesto con su fuente
- [ ] 🛑 **Ninguna «mejor hora» fue afirmada sin fuente**
- [ ] La **zona horaria** está declarada arriba del documento
- [ ] **Nada se pisa**: ninguna cuenta con dos piezas a la misma hora
- [ ] Se verificó que el **ciclo anterior** no dejó filas en `cargado` sin publicar
- [ ] Las piezas que van a pauta están **marcadas** para ⑧B
- [ ] 🚦 **GATE 1** presentado a un humano, con el resumen arriba
