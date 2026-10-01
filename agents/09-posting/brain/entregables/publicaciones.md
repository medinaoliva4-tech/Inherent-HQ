# Publicaciones — [Cliente]

**Ciclo:** [x] · **Campaña(s):** [nombres] · **Fecha:** [aaaa-mm-dd] · **Zona horaria:** [x]
**Gates:** captions [✅/⬜] · paquete de carga [✅/⬜]

> Este documento lo lee **quien aprueba**. Acompaña a `publer-import.csv`, que es el que se sube.
> 🛑 **El mensaje es de ④ Creatividad.** Acá se adapta el largo y el formato, nunca la idea.
> Fuente del copy: `clients/<cliente>/data/ideas-<formato>.md`.

---

## El ciclo de un vistazo

| | |
|---|---|
| **Publicaciones en el archivo** | [n] |
| **Piezas sin archivo final** | [n] → [de quién se esperan] |
| **Devueltas** | [n] → ④ [n] · ⑥A [n] · ⑥B [n] |
| **Claims ⏸️ que no se cargan** | [n] |
| **Hora con dato / ⚠️ SIN DATOS** | [n] / [n] |

| id | id_creativo | Cuenta | Formato | Fecha y hora | Estado |
|---|---|---|---|---|---|
| PO-001 | CR-007 | @cliente | Reel | 2026-10-09 12:45 | listo |

---

## PO-001 · [concepto en una línea]

| | |
|---|---|
| **Pieza de ④** | `CR-007` — ver `clients/<cliente>/data/ideas-reel.md` §CR-007 |
| **Campaña** | |
| **Cuenta** | `@cliente` — 🛑 la cuenta concreta, no *"Instagram"* |
| **Canal · formato** | |
| **Fecha y hora** | [aaaa-mm-dd hh:mm] · [con dato / ⚠️ SIN DATOS — hora de ③] |
| **Archivo** | [nombre exacto del export de ⑥A o ⑥B] |
| **Ruta / URL pública** | [Drive] · [URL que va en `Media URL`] |

### Caption

🛑 **El hook va en la línea 1, antes del corte.** Instagram muestra ~125 caracteres en feed y ~55 en
Reels antes del *"… más"*.

```
[Línea 1 — el hook de ④, entero, antes del corte]

[El cuerpo: el valor, acomodado a la plataforma]

[El CTA de ④, según la etapa]

[hashtags]
```

| | |
|---|---|
| **Caracteres** | [n] / [límite de la plataforma] |
| **Antes del corte** | *"[los primeros ~55 o ~125, literal]"* → ¿sobrevive el hook? ✅ / ⬜ |
| **Hashtags** | [n] — [cuáles y por qué] |
| **Alt text** | *"[literal — describe la imagen, no la adjetiva]"* |
| **Link** | [si lleva] |

**Qué se cambió respecto de ④, y por qué:** [solo largo y forma. Si hubo que tocar el mensaje,
🛑 esto es una devolución, no un cambio.]

### QA de plataforma

| Chequeo | ✅/⬜ | Detalle |
|---|---|---|
| Aspecto correcto | | [9:16 / 1:1 / 4:5] |
| Duración dentro del límite | | [s] |
| Texto fuera de las safe zones | | |
| Caption dentro del límite | | |
| Cantidad de hashtags permitida | | |
| Alt text escrito | | 🛑 no es opcional |
| Sin watermark de otra app | | 🛑 alcance muerto |
| Audio correcto y con volumen | | |
| Claims aprobados | | ✅ / ⏸️ PENDIENTE — **no se carga** |

**Estado:** 🟢 listo / 🟡 [qué falta, quién y para cuándo] / 🔴 no sale este ciclo / ↩️ DEVUELTO

*(Una sección así por cada publicación del ciclo.)*

---

# Los envíos de email

*(Ruta email. 🛑 **No van en `publer-import.csv`**: Publer no manda email, y una fila de `Email` ahí
hace fallar la importación entera.)*

| | |
|---|---|
| **Herramienta** | [la que usa el cliente, de `comprension.md` § La capacidad · o ⚠️ SIN DATOS] |
| **Quién carga y envía** | [nombre] |

## PO-00X · [asunto en una línea]

| | |
|---|---|
| **Pieza de ④** | `CR-00X` — ver `clients/<cliente>/data/ideas-newsletter.md` §CR-00X |
| **Campaña** | |
| **Lista / segmento** | [a quién se le manda, concreto] |
| **Fecha y hora** | [aaaa-mm-dd hh:mm] · [zona horaria] |
| **Imágenes** | [de ⑥A, con su ruta · o `N/A — solo texto`] |

### Asunto y preheader

🛑 **El asunto es el hook del email.** Se decide igual que un hook: es lo único que se ve en la
bandeja, junto al preheader.

```
Asunto:    "[literal, corto — lo que se ve en el celular]"
Preheader: "[literal — la segunda línea, que completa el asunto, no lo repite]"
```

| | |
|---|---|
| **Caracteres del asunto** | [n] — [se corta cerca de 40 en móvil] |
| **¿El preheader repite el asunto?** | ⬜ no / ⚠️ sí → reescribir |

### Cuerpo

*(El mensaje de ④, acomodado al formato de email. 🛑 **No se reescribe.**)*

```
[el cuerpo literal, con sus saltos de línea]
```

| | |
|---|---|
| **CTA** | [el de ④] → [link] |
| **Qué se cambió respecto de ④, y por qué** | [solo largo y forma] |

### QA del envío

| Chequeo | ✅/⬜ |
|---|---|
| El asunto no promete algo que el cuerpo no cumple | |
| Los links funcionan y llevan a donde dicen | |
| Hay forma de desuscribirse | 🛑 no es opcional |
| El remitente es el que el cliente usa siempre | |
| Se mandó una prueba a una casilla propia y se leyó **en el celular** | |
| Claims aprobados | ✅ / ⏸️ **no se envía** |

**Estado:** 🟢 listo / 🟡 [qué falta] / 🔴 no sale este ciclo / ↩️ DEVUELTO

*(Una sección así por cada envío del ciclo.)*

---

# Los envíos manuales

*(Ruta manual. 🛑 **No van en `publer-import.csv`**: Publer no manda WhatsApp ni imprime. Los manda o
los pega **un humano, a mano**.)*

| | |
|---|---|
| **Quién lo manda o lo pega** | [nombre, de `comprension.md` § La capacidad · o ⚠️ SIN DATOS] |
| **Quién contesta lo que entre** | [nombre **y horario**. 🛑 Si no hay nadie, se declara: es de **⑧A Orgánico**, no de ⑦] |

## PO-00X · [el mensaje en una línea] — *WhatsApp / SMS*

| | |
|---|---|
| **Pieza de ④** | `CR-00X` — ver `clients/<cliente>/data/ideas-<formato>.md` §CR-00X |
| **Lista o difusión** | [cuál, y **a cuántas personas le llega**] |
| **Fecha y hora** | [aaaa-mm-dd, hh:mm] |

**Texto, listo para copiar:**

```
[el mensaje exacto, tal como se manda — sin marcas de formato que WhatsApp no entienda]
```

### QA del envío
| Chequeo | Estado |
|---|---|
| El texto es el de ④, adaptado al canal y **sin cambiar el mensaje** | ⬜ |
| Entra sin cortarse, y los links funcionan | ⬜ |
| La lista existe y sé a cuántas personas le llega | ⬜ |
| 🛑 **Hay alguien que contesta, y sé en qué horario** | ⬜ |
| Claims validados | ⬜ |

**Estado:** 🟢 listo / 🟡 [qué falta] / 🔴 no sale este ciclo / ↩️ DEVUELTO

## PO-00X · [la pieza en una línea] — *impreso*

| | |
|---|---|
| **Pieza de ④** | `CR-00X` — ver `clients/<cliente>/data/ideas-<formato>.md` §CR-00X |
| **Archivo final** | [ruta del export de ⑥A · o ⚠️ SIN ARCHIVO, con de quién se espera] |
| **Dónde va** | [el lugar concreto, no *"el local"*] |
| **Desde cuándo** | [aaaa-mm-dd] · permanente o hasta [fecha] |
| **Permiso** | [contrato / municipal / el dueño del espacio — o 🛑 BLOQUEADO] |

### QA del impreso
| Chequeo | Estado |
|---|---|
| El archivo es el **export final de ⑥A**, no un borrador | ⬜ |
| Se lee a la **distancia real** a la que va a estar | ⬜ |
| 🛑 **Está el permiso** para intervenir ese lugar | ⬜ |
| Claims validados | ⬜ |

**Estado:** 🟢 listo / 🟡 [qué falta] / 🔴 no sale este ciclo / ↩️ DEVUELTO

> 🛑 **Un impreso no se verifica en § Verificación como una publicación.** No hay URL ni métrica: se
> verifica con **una foto del lugar, puesta**. Su rendimiento **no es medible** con lo que hay, y eso
> se declara en vez de inventar un proxy.

*(Una sección así por cada envío manual del ciclo.)*

---

# Lo que no sale este ciclo

| id_creativo | Qué falta | De quién se espera | Desde cuándo | Motivo |
|---|---|---|---|---|

🛑 **Una pieza que desaparece en silencio es un hueco en el calendario que el cliente ve antes que
nosotros.** Toda pieza que no sale lleva motivo escrito.

---

# Devoluciones

| id_creativo | Vuelve a | Motivo (de los 5) | Qué se rompería si lo adaptábamos | Alternativa 1 | Alternativa 2 | Respuesta + fecha |
|---|---|---|---|---|---|---|

---

# Verificación — después de publicar

🛑 **Se mira la publicación real.** No se da por publicado porque Publer dijo que sí.

*(Ruta social y email. 🛑 **Los impresos de la ruta manual no entran acá**: se verifican con la foto
del lugar, en su propia sección.)*

| id | ¿Salió? | ¿Cuenta correcta? | ¿Se ve bien en móvil? | ¿Link funciona? | ¿Caption completo? | URL |
|---|---|---|---|---|---|---|
| PO-001 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | |

**Fallas y qué se hizo**

| id | Qué pasó | Qué se hizo | ¿Se republicó? |
|---|---|---|---|
