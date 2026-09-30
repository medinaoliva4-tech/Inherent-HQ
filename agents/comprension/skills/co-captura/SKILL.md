---
name: co-captura
description: >
  Capa 0 de ① Comprensión — el intake. Barre primero lo que el cliente YA nos dio (Drive, Notion, el
  OS de Inherent, el hilo de reuniones) y recién después pregunta, con una sola lista agrupada por
  quién puede contestar cada cosa y con fecha de vuelta. Declara cada hueco con qué falta, quién lo
  tiene y para cuándo. Escribe la sección § Qué sabemos y qué falta de `comprension.md`. Úsala cuando
  pidan "arrancá con el cliente X", "onboarding de X", "armá el formulario para X", "qué le
  preguntamos al cliente", "qué sabemos de X", "qué nos falta para arrancar". Bloquea si no hay
  ninguna fuente humana que pueda contestar.
---

# Capa 0 · Captura — qué nos dieron y qué falta

| | |
|---|---|
| **Consume** | El pedido del usuario · Drive, Notion y el OS de Inherent · el `_INPUTS/` del cliente · el hilo de reuniones del equipo de cuentas |
| **Produce** | La sección **§ Qué sabemos y qué falta** de `comprension.md`: el conteo por tipo de dato, la tabla de huecos con nombre y fecha, y la tabla de fuentes revisadas |

Contexto del departamento: `agents/comprension/WORKFLOW.md`. Plantilla del entregable:
`agents/comprension/entregables/comprension.md`.

**No interpretás nada todavía.** Esta capa hace dos cosas: **encontrar lo que ya existe** y
**nombrar lo que falta**. Ordenarlo por tema es trabajo de las capas 1-4.

## 1 · Barrer antes de preguntar

🛑 **Preguntar dos veces lo mismo es la forma más rápida de que un cliente deje de contestar.** Antes
de escribir una sola pregunta, se revisan las cuatro fuentes y se declara qué salió de cada una:

| Fuente | Qué buscar | Herramienta |
|---|---|---|
| **Drive** | Reportes de venta, contratos, brand kit, exports de métricas, fotos de producto | `mcp__Google_Drive__search_files` → `read_file_content` |
| **Notion** | El brief del cliente, notas de reunión, el historial de la cuenta | `mcp__Notion__notion-search` → `notion-fetch` |
| **OS de Inherent** | El registro del cliente, lo que ya esté cargado de ciclos anteriores | `mcp__Inherent_O_S__list_records` → `get_record` |
| **`_INPUTS/`** | Lo que el equipo ya bajó a la carpeta del cliente | Lectura directa |

**La tabla se escribe aunque salga vacía.** *"Drive — revisado, no hay nada"* es un resultado; dejar
la fila en blanco no dice si se revisó o no.

```
| Fuente  | ¿Se revisó? | Qué salió de ahí |
| Drive   | ✅          | Reporte de ventas ene-sep 2026 · contrato vigente |
| Notion  | ✅          | Nada — la página del cliente está vacía |
```

## 2 · La lista de preguntas — una sola, agrupada por quién contesta

🛑 **Una sola lista, no cinco tandas.** Mandar preguntas de a goteo hace que el onboarding tarde
semanas. Se agrupa **por quién puede contestar**, porque no todo lo sabe la misma persona.

| Grupo | Quién suele contestar | Qué se le pregunta |
|---|---|---|
| **Números** | Quien maneja la caja o el sistema | Precios, costos, ticket promedio, peso de cada canal, estacionalidad |
| **Operación** | Quien atiende o produce | Cómo llega un cliente, cuánto tarda, qué frena una venta, qué se probó antes |
| **Voz del comprador** | Quien atiende al público | Reseñas, DMs, WhatsApp, lo que se dice en el mostrador |
| **Capacidad** | Quien decide y quien ejecuta | Presupuesto, quién graba y con qué, quién aprueba, restricciones |

**Cada pregunta se escribe para que se pueda contestar en una línea.** Una pregunta abierta de las
que piden ensayo no se contesta nunca.

❌ *"Contanos sobre tus clientes"*
✅ *"De cada 10 que entran, ¿cuántos vienen por primera vez?"*

### Las 6 que más se olvidan y más caro salen

| Pregunta | Por qué importa |
|---|---|
| *"Si mañana se cae [el canal principal], ¿qué queda?"* | Destapa la dependencia real del negocio |
| *"¿Qué ya probaron que no funcionó?"* | ② puede proponer algo que fracasó hace seis meses |
| *"¿Quién decide y quién paga?"* | No siempre son la misma persona, y el copy le habla a una sola |
| *"¿Quién aprueba de su lado, y en cuánto tiempo?"* | Un cliente que tarda dos semanas en aprobar cambia todo el calendario de ③ |
| *"¿Hay algo que no podamos mostrar o decir?"* | Restricciones legales o de franquicia que aparecen tarde |
| *"¿Nos pueden pasar reseñas, DMs o capturas de lo que les escriben?"* | Es el **lenguaje literal** que ④ necesita sí o sí |

## 3 · Declarar cada hueco con nombre y fecha

🛑 ***"Falta información del cliente"* no es un hueco declarado: es una queja.** Un hueco se escribe
con **qué**, **quién lo tiene** y **para cuándo**:

```
| Qué falta                        | Quién lo tiene | Se pidió el | Para cuándo | Estado    |
| Costo por plato del menú         | Ana (dueña)    | 2026-10-03  | 2026-10-08  | PENDIENTE |
| Reseñas de Google de los últimos | el equipo      | 2026-10-03  | 2026-10-05  | PENDIENTE |
```

**Cada hueco lleva, además, qué se pierde si no llega** — eso es lo que hace que alguien lo conteste:

| Si falta | Qué se cae aguas abajo |
|---|---|
| Costos | ② no puede repartir el objetivo por margen, solo por volumen |
| Lenguaje literal | ④ escribe el copy a ciegas y devuelve el documento |
| Capacidad | ③ arma un calendario que ⑤ no puede ejecutar |
| Restricciones | ④ propone algo que el cliente no puede publicar |

## 4 · El conteo — la foto del documento

Se cierra con el conteo por tipo de dato, que es lo que después define la confianza:

```
| 🟢 Datos verificados            | 12 |
| 🟡 Datos declarados             |  8 |
| [percepción, no verificado]     |  5 |
| ⚠️ SIN DATOS                    |  4 |
```

| Confianza | Cuándo |
|---|---|
| 🟢 | La mayoría verificada, y ningún hueco en capacidad ni en lenguaje literal |
| 🟡 | Hay percepciones sin verificar, pero ninguna sostiene una decisión grande |
| 🔴 | Faltan capacidad, costos o lenguaje literal — ② va a construir sobre supuestos |

## 5 · El gate

🚦 **GATE 1 — la captura.** Se le muestra al humano la lista de huecos y se pregunta una sola cosa:
**¿estos huecos son reales, o falta haber preguntado?** Recién con esa confirmación se pasa a la
Capa 1.

🛑 **Escribir el documento con huecos evitables lo vuelve inservible para ②.** El gate existe para
eso y para nada más.

---

## Control de calidad de la Capa 0

- [ ] Las **cuatro fuentes** están en la tabla, cada una con ✅ o con qué salió — ninguna en blanco
- [ ] 🛑 **Se barrió antes de preguntar** — ninguna pregunta pide algo que ya estaba en Drive, Notion o el OS
- [ ] Las preguntas van en **una sola lista**, agrupadas por quién contesta
- [ ] Cada pregunta se puede contestar **en una línea**
- [ ] Las **6 que más se olvidan** están preguntadas, o se declara por qué no aplican
- [ ] Todo hueco lleva **qué falta · quién lo tiene · se pidió el · para cuándo · qué se cae si no llega**
- [ ] 🛑 **Ningún hueco se rellenó con inferencia**
- [ ] El conteo por tipo de dato está hecho y la **confianza** declarada con su motivo
- [ ] 🚦 **GATE 1** presentado a un humano, con la pregunta explícita de si los huecos son reales
