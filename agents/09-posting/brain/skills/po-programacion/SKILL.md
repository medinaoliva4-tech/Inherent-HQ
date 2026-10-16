---
name: po-programacion
description: >
  Capa 3 de ⑨ Posting — fija la hora y la cuenta de cada publicación y verifica que nada se pise.
  ④ Creatividad puso el día; acá se pone la hora, se asigna la cuenta concreta (no el canal), se
  comprueba que dos piezas de la misma cuenta no salgan el mismo día sin separación y se declara la
  zona horaria. Si no hay métricas de la cuenta, se usa la hora de ③ Marketing y se marca ⚠️ SIN
  DATOS: la "mejor hora" no se inventa. Escribe las columnas `cuenta`, `fecha` y `hora` de
  `calendario-de-publicacion.csv`. Úsala cuando pidan "a qué hora sale", "armá el calendario de
  publicación", "en qué cuenta va", "¿no se pisan dos posts?". Cierra con el resumen del ciclo, que
  es lo que lee el COO en el QA final.
---

# Capa 3 · Programación — cuándo y dónde exactamente

| | |
|---|---|
| **Consume** | Las filas con `caption_ok` y `specs_ok` en ✅ · la `fecha` de ④ Creatividad · métricas de la cuenta de `99-referencias/recibido/` si existen · `LINKS.md` (quién tiene el acceso y el ID de Zernio de cada cuenta) |
| **Produce** | Las columnas **`cuenta`**, **`fecha`** y **`hora`** de `calendario-de-publicacion.csv` · la tabla del ciclo de un vistazo en `publicaciones.md` |

Contexto del departamento: `agents/09-posting/brain/WORKFLOW.md`.

## 1 · Qué se decide acá y qué no

| Lo decide ④ Creatividad / ③ Marketing | Lo decide Posting |
|---|---|
| **El día** — ④ Creatividad lo fijó dentro de la semana del slot | **La hora** |
| **El canal** — ③ Marketing lo asignó | **La cuenta concreta** dentro de ese canal |
| Qué pieza va en qué campaña | El **orden** cuando dos caen el mismo día |

🛑 **La fecha no se mueve.** Si una pieza no llega a su día, **no se corre sola**: se declara y
decide ③ Marketing. Correr una fecha rompe la secuencia de una campaña sin que nadie lo haya decidido.

## 2 · `cuenta` no es `canal`

```
canal  = instagram-reels
cuenta = @<cuenta-del-cliente>
```

Un cliente puede tener dos cuentas del mismo canal —la de la marca y la del local nuevo, la
principal y la de otro país—. **Programar en la equivocada es de los pocos errores de este departamento
que se ven desde afuera**, y no se puede deshacer del timeline de nadie.

| Verificación | Dónde está |
|---|---|
| Qué cuentas existen | `clients/<cliente>/00-onboarding/LINKS.md` |
| Quién tiene el acceso | `clients/<cliente>/00-onboarding/LINKS.md` — **la fuente única** |
| Su ID de Zernio | `LINKS.md` *(o `05-comunidad/respuestas.md`, si ⑧ Community ya lo anotó)* — se confirma con `accounts_list` en `po-carga` |

## 3 · La hora — con dato, o declarada sin dato

| Situación | Qué se hace |
|---|---|
| **Hay métricas de la cuenta** | Se usa la franja donde esa cuenta rinde. Se anota de dónde salió el dato |
| **No hay métricas** | Se usa la hora que indicó ③ Marketing, y se marca `⚠️ SIN DATOS` |
| **No hay ni métricas ni indicación** | Se usa una hora razonable para el hábito del comprador según `00-onboarding/comprension.md` §C · Demanda, **y se declara que es un supuesto** |

🛑 **La «mejor hora» no se inventa.** No existe una hora universalmente buena, y afirmarla sin dato
es exactamente lo que prohíbe la regla «Evidencia o etiqueta» de `CLAUDE.md`. `⚠️ SIN DATOS` es una respuesta válida; *"a las 6
pm funciona mejor"* sin fuente, no.

> **El dato del comprador sí sirve como supuesto declarado.** Si `00-onboarding/comprension.md` dice *"el 60 % del
> ingreso entra al mediodía de días hábiles"*, publicar a las 11:30 es un supuesto razonable — y se
> escribe **como supuesto**, citando de dónde salió.

**La zona horaria se declara una vez, arriba del documento**, y es la que `po-carga` le pasa a Zernio
al programar. Si no se le pasa, Zernio usa la del perfil —o UTC—, y todo el ciclo sale corrido.

## 4 · Que nada se pise

| Chequeo | Regla |
|---|---|
| **Dos piezas, misma cuenta, mismo día** | Se separan al menos unas horas, y se anota por qué van juntas |
| **Dos piezas, misma cuenta, misma hora** | 🛑 Nunca. Se mueve una |
| **Story y feed el mismo día** | Está bien — son formatos distintos. Se verifica que la story no adelante el feed sin querer |
| **Pieza de pauta y orgánica iguales** | Se marca cuál es cuál. ⑩ Ads necesita saberlo |

## 4B · Trial reels — salen primero a quien no sigue la cuenta

🎬 **Una fila con `trial = sí` es un Reel de Instagram de formato no probado** *(regla de ④ `cr-adaptacion` § 3B)*.
**Todo trial se programa como trial:** nunca se publica normal «para ahorrar un paso».

| Chequeo | Regla |
|---|---|
| **Fecha y hora** | Las de cualquier otra fila. El trial **no cambia el día**: decidió ④ Creatividad |
| **Cuenta** | Solo **Instagram**. Un `trial = sí` en otro canal se devuelve a ④ Creatividad |
| **Un Reel de formato no probado con `trial = no`** | 🛑 **No se programa.** Se devuelve a ④ Creatividad; no se corrige en la celda |
| **Cómo se programa** | `po-carga` lo hace con `trialParams`: **`SS_PERFORMANCE` por defecto**, `MANUAL` solo si la fila lo pide |
| **El ganador** | Pasa a los seguidores y se publica normal. Se marca **candidato a pauta** para ⑩ Ads |
| **Cuántos hay** | Los de ④; no se agregan ni se quitan acá. Cuentan como **el Reel del slot**, no como pieza extra |

> ⚠️ **El dato de hora de la cuenta viene de su audiencia actual**, no necesariamente de quien no la
> sigue. Se usa la misma hora y **se declara** que el dato no es de ese público.

Quién gana, cuándo pasó y cuánto alcanzó a no seguidores se lee después, en `po-loop` *(Lectura 5)*.

## 5 · El resumen del ciclo

Se cierra con el resumen, arriba de `publicaciones.md`: es lo que el COO lee en el QA final, junto
con los textos cuenta por cuenta y fecha por fecha.

```
- Publicaciones listas: [n] · pendientes: [n] · no salen: [n]
- Cuentas usadas: [lista]
- Hora con dato: [n] · ⚠️ SIN DATOS: [n] · supuesto declarado: [n]
- Trial reels: [n] programados como trial · candidatos a pauta al pasar a seguidores: [se llena en `po-loop`]
- Zona horaria: [x]
- Claims ⏸️ que no entran: [lista]
```

🛑 **Un caption mal escrito se multiplica por todas las filas del ciclo**, y corregirlo después de
programar significa rehacer cada publicación en Zernio.

---

## Control de calidad de la Capa 3

- [ ] Toda fila tiene **`cuenta` concreta** (`@handle`), no solo el canal
- [ ] Se verificó **quién tiene las claves** y el **ID de Zernio** de cada cuenta usada
- [ ] 🛑 **Ninguna fecha se movió** — las que no llegan se declararon y decide ③ Marketing
- [ ] Toda `hora` tiene **origen declarado**: dato de la cuenta, indicación de ③ Marketing, o supuesto con su fuente
- [ ] 🛑 **Ninguna «mejor hora» fue afirmada sin fuente**
- [ ] La **zona horaria** está declarada arriba del documento
- [ ] **Nada se pisa**: ninguna cuenta con dos piezas a la misma hora
- [ ] Las piezas que van a pauta están **marcadas** para ⑩ Ads
- [ ] 🎬 **Todo `trial = sí` está programado como trial**, solo en Instagram, y **ningún Reel de formato no probado** salió con `trial = no`
- [ ] El **resumen del ciclo** está arriba de `publicaciones.md`
