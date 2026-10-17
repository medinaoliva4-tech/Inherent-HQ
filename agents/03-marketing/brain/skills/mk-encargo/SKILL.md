---
name: mk-encargo
description: >
  Capa 0 de ③ Marketing — verifica qué decidió ① Strategy y qué se puede de verdad antes de
  planear nada. Carga los inputs bloqueantes, lee el alcance contratado (la ficha de oferta) para fijar el techo de slots
  del ciclo, cruza la capacidad declarada del cliente contra lo que la ficha incluye y declara el
  margen real. Úsala cuando pidan "arrancá el ciclo de X", "cuántas piezas podemos este mes",
  "qué decidió estrategia", "verificá si esto se puede". Bloquea si no existe la estrategia, el
  posicionamiento o el alcance contratado.
---

# Capa 0 · Encargo — qué se decidió y qué se puede

| | |
|---|---|
| **Consume** | Entregables de ① Strategy · la guía de ②B Branding, si existe · `clients/<cliente>/CLAUDE.md` · `inherent/06-ECONOMIA.md` *(solo el techo de volumen)* |
| **Produce** | La sección **§ El encargo** de `estrategia-de-contenido.md` |

**No se planea nada todavía: se verifica.** Un ciclo planeado sobre un techo equivocado se
descubre cuando producción no da abasto.

## 1 · Los inputs bloqueantes

| De | Qué se carga | Si falta |
|---|---|---|
| **① Strategy** | Objetivo del ciclo con plazo y métrica · posicionamiento · **la PROMESA** · **la HISTORIA** *(héroe, enemigo, transformación)* · **las MUST BE TRUE con su letra** · el brief de marketing | 🛑 **BLOQUEADO** |
| **① Strategy** | **El diagnóstico: qué síntoma tiene el cliente y qué causa se declaró** | 🛑 **BLOQUEADO** |
| **① Strategy** | Qué puede grabar el cliente y cada cuánto · qué cuentas existen y quién las opera · estacionalidad | 🛑 **BLOQUEADO** |
| **②B Branding** | Tono, territorio, activos distintivos, do's & don'ts | 🟡 Se usan si existen. No bloquea |
| **El alcance contratado** | Brand Growth · Growth Partnership · ⬜ a la medida *(en Brand Foundation ③ Marketing no corre)* — la ficha, en `plan-contratado.md` | 🛑 **BLOQUEADO** |

🛑 **Ningún archivo se copia: se cita su ruta.**

> 🔑 **Por qué la PROMESA es bloqueante.** El contenido es la intersección de
> `deseo de la audiencia` **+** `posicionamiento` **+** `promesa`.
> **Sin la promesa, ③ Marketing hace dos tercios del trabajo** y ningún slot puede pasar la pregunta 3
> de la prueba de alineación — ver `mk-calendario`.

### 🛑 Si el diagnóstico de ① Strategy apunta fuera de Marketing

**Cuatro de los cinco cuellos típicos no se arreglan con contenido.**

| Si la causa declarada es… | ③ Marketing |
|---|---|
| Distribución · contenido · mensaje | ✅ **Es nuestra.** Se trabaja |
| **Oferta · conversión · valor percibido · retención** | 🔴 **NO es nuestra.** Se escala **al CEO**: es alcance |

⚠️ **Se escala y se sigue trabajando el ciclo** — no se bloquea el calendario.
Lo que no se hace es **fingir que más contenido arregla una oferta rota.**
Ver `agents/01-strategy/brain/skills/analysis/SKILL.md` → «El diagnóstico por síntoma».

## 2 · El techo del ciclo

**Se lee de la ficha de oferta (`plan-contratado.md`) y no se discute.** Los números no salen de este
manual: salen de la ficha de cada cliente. La lista de lo que se lee está en
`agents/03-marketing/brain/WORKFLOW.md` → §0.

| Se lee de la ficha | |
|---|---|
| Total de slots | |
| Campañas por ciclo | |
| Horas de grabación y días de rodaje | |
| Videos planificados *(20 min c/u)* | |
| Derivados — **mínimo** *(1:2)* y *tope (1:1)* | |
| Estáticos y carruseles · Stories | |
| Canales contratados | |
| Revisiones por pieza | |

⚠️ **Growth Partnership no es «Brand Growth con más piezas».** Si el encargo trata el salto como
«más piezas», está mal planteado: **lo que cambia es que la oferta viene
trabajada por ② Growth** y se conecta con ventas, experiencia de cliente y sistemas comerciales.

> 🛑 **El techo manda sobre la ambición.** Si la estrategia pide más de lo que la ficha incluye,
> **se declara y se recorta acá**, con el recorte escrito. Nunca se manda de más.

## 3 · El techo de realidad — lo que el cliente puede

**La ficha dice cuánto pagamos producir. La capacidad dice cuánto puede dar el cliente.**
**Manda el menor de los dos.**

| Chequeo | Si no da |
|---|---|
| ¿Puede grabar las sesiones que la ficha incluye? | Se baja el número de slots con rodaje y **se sube el peso de estáticos** |
| ¿Tiene las cuentas de todos los canales que se quieren usar? | **El canal no entra al alcance.** No se inventa |
| ¿Hay alguien con las claves? | Igual: sin acceso, el canal no entra |
| ¿Hay estacionalidad que mueva el ciclo? | Se declara y se refleja en las semanas |

## 4 · Qué escribe

`## § El encargo` dentro de `estrategia-de-contenido.md`:

| Bloque | Qué lleva |
|---|---|
| **A · Contexto cargado** | Checklist con estado y **ruta** de cada archivo de ① Strategy y ②B Branding |
| **B · El objetivo del ciclo** | Copiado literal de ① Strategy |
| **C · Las MUST BE TRUE** | Con su letra. Son las únicas a las que un slot puede trazar |
| **D · El techo** | Alcance contratado · total de slots · reparto por tipo |
| **E · La capacidad real** | Qué puede el cliente, y dónde queda por debajo del techo |
| **F · Lo que queda afuera** | Canales descartados y por qué. **Escrito, no omitido** |

## 5 · Bloqueos y devoluciones

| Situación | Qué se hace |
|---|---|
| La estrategia no existe | 🛑 **BLOQUEADO.** Se pide a ① Strategy |
| No hay MUST BE TRUE con letra | 🛑 **BLOQUEADO.** Sin ellas ningún slot puede trazar |
| El objetivo del ciclo no tiene métrica ni plazo | ↩️ **Devuelto a ① Strategy** |
| La capacidad del cliente no alcanza ni para el mínimo de la ficha | 🔴 **Se escala al CEO.** Es conversación comercial, no de marketing |
| No se sabe qué cuentas existen | 🛑 **BLOQUEADO.** Se pide a ① Strategy |

## 6 · Checklist

- [ ] Los inputs bloqueantes están cargados y **citados con ruta** — y la guía de ②B Branding, si existe
- [ ] El alcance contratado está identificado y su techo escrito
- [ ] Las MUST BE TRUE están copiadas **con su letra**
- [ ] La capacidad real del cliente está declarada
- [ ] Lo que queda afuera está **escrito**, no omitido
