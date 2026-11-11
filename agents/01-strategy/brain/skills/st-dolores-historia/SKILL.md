---
name: st-dolores-historia
description: >
  Paso 3 de ① Strategy — lo que siente el cliente ideal y cómo se le habla. Saca los dolores y los
  deseos del ICP en sus propias palabras (entrevistas reales, reseñas, comentarios, búsquedas),
  define la forma de comunicar y escribe la historia villano-héroe donde el cliente es el héroe y
  la marca el guía. Cierra con las tres preguntas del método: MUST BE TRUE, UNFAIR y GO GET.
  Úsala cuando pidan "los dolores", "qué desea el cliente", "las entrevistas", "cómo le hablamos",
  "la historia", "el villano", "el mensaje".
---

# Paso 3 · Dolores, deseos, entrevistas, forma de comunicar e historia

| | |
|---|---|
| **Consume** | El nodo `icp` · entrevistas reales · lo que dice el panel sintético (`st-panel-icp`) |
| **Produce** | `01-estrategia/dolores-y-deseos.md` (nodos `dolor-NN` y `deseo-NN`) e `01-estrategia/historia.md` (nodo `historia`), todos con `viene_de: [icp-…]` |
| **Herramienta** | El tablero de dolores, deseos e historia del OS |

## 1 · Dolores y deseos — en palabras del comprador

| Fuente | Peso |
|---|---|
| **Entrevistas reales** *(3 a 5 compradores o prospectos)* | 🟢 La que más pesa |
| **Reseñas, comentarios, DMs, búsquedas** *(Apify, Google, Zernio)* | 🟢 Frases literales con enlace |
| **Panel sintético** *(`st-panel-icp`)* | ⚪ Siempre `[hipótesis]` hasta que un reel de prueba la valide |

Cada dolor o deseo se escribe así:

```
### dolor-02 · <en palabras del comprador>
Frase literal: «…» — fuente: <enlace o entrevista> · estado: hipotesis | aprobado
Qué lo dispara · qué ha probado y no le funcionó · qué le cuesta no resolverlo
```

🔑 **Máximo 5 dolores y 5 deseos.** Más es una lista, no una prioridad. Se ordenan por intensidad.

## 2 · La entrevista real — guion corto

1. ¿Qué estabas tratando de resolver cuando nos encontraste? 2. ¿Qué probaste antes? 3. ¿Qué casi
te hace no comprar? 4. ¿Qué cambió después? 5. ¿Cómo se lo explicarías a un amigo?
**Se anotan frases literales, no resúmenes.**

## 3 · La forma de comunicar

| Qué | Cómo se define |
|---|---|
| **Nivel de conciencia** | ¿Sabe que tiene el problema? ¿Conoce la solución? ¿Nos conoce? |
| **Palabras que usa** | Las del comprador, no las de la industria |
| **Objeciones** | Las 3 que más frenan la compra, con su respuesta |
| **Tono** | Lo fija ② Branding; aquí solo se dice qué no puede sonar *(p. ej. «nada que suene a vendedor»)* |

## 4 · La historia villano-héroe

**El cliente es el héroe. La marca es el guía. El villano es lo que el cliente combate, nunca un
competidor.**

```
Héroe: <quién es y qué quiere>
Villano: <lo que lo frena — externo, interno y lo injusto de la situación>
Guía: <la marca: por qué le cree (empatía + autoridad)>
Plan: <3 pasos>
Llamado: <una sola acción>
Éxito: <cómo se ve su vida después> · Fracaso evitado: <qué no le pasa>
```

## 5 · Las tres preguntas — el cierre del paso

- **`MUST BE TRUE`** — ¿qué tiene que ser verdad para que esta marca gane con este ICP?
- **`UNFAIR`** — ¿qué ventaja tiene que nadie más puede copiar rápido?
- **`GO GET`** — ¿qué hay que ir a buscar que todavía no tiene?

## 6 · Antes de cerrar

- [ ] Cada dolor y deseo tiene frase literal y fuente, o `[hipótesis]`
- [ ] Lo que vino del panel sintético está marcado `[hipótesis]` y tiene su reel de prueba en `st-adquisicion`
- [ ] El villano no es un competidor
- [ ] Las tres preguntas están respondidas
