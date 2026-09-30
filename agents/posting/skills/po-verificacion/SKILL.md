---
name: po-verificacion
description: >
  Capa 5 de ⑦ Posting — se ejecuta después de que el contenido salió. Mira la publicación real: que
  esté, que esté en la cuenta correcta, que se vea bien en móvil, que el link funcione, que el
  caption no se haya cortado raro y que la media no se haya recomprimido a nada. Registra la URL
  pública de cada pieza y completa la columna `estado`. Escribe la sección § Verificación de
  `publicaciones.md`. Úsala cuando pidan "¿salió todo?", "revisá lo publicado", "¿se ve bien?",
  "pasame los links de lo que salió". 🛑 No se da por publicado porque Publer dijo que sí.
---

# Capa 5 · Verificación — ¿salió y se ve bien?

| | |
|---|---|
| **Consume** | Las filas en `estado = cargado` · el reporte de Publer de lo publicado · las publicaciones reales en cada plataforma |
| **Produce** | La sección **§ Verificación** de `publicaciones.md`, con la URL de cada pieza · la columna **`estado`** en `publicado` |

Contexto del departamento: `agents/posting/WORKFLOW.md`.

## 1 · 🛑 La regla de la capa

**No se da por publicado porque Publer dijo que sí.** Se mira la publicación real.

Un post puede figurar como publicado en Publer y en la plataforma estar:

| Lo que pasa | Cómo se ve en Publer |
|---|---|
| La media no cargó y salió solo el texto | ✅ publicado |
| El Reel entró como video de feed | ✅ publicado |
| El caption se cortó a la mitad | ✅ publicado |
| Salió en la cuenta equivocada | ✅ publicado |
| El link del CTA está roto | ✅ publicado |

> **Una publicación fallida que nadie miró es una pieza que el cliente descubre antes que nosotros.**
> Ese es el único error de este departamento que se ve desde afuera, y cuesta la confianza del ciclo.

## 2 · Qué se verifica, pieza por pieza

| Chequeo | Cómo |
|---|---|
| **¿Salió?** | Está visible en el perfil |
| **¿Cuenta correcta?** | El `@handle` es el que dice el calendario |
| **¿Se ve bien en móvil?** | 🛑 **En un teléfono, no en el escritorio.** Es donde lo ve el 95 % |
| **¿El formato es el correcto?** | El Reel está en la pestaña de Reels, no en el feed |
| **¿Caption completo?** | No se cortó, los saltos de línea están, los emojis se ven |
| **¿Media bien?** | No se recomprimió a nada, no tiene bandas, el audio suena |
| **¿Link funciona?** | Se abre y lleva a donde tiene que llevar |
| **¿Alt text quedó?** | Algunas plataformas lo pierden en la importación |

**Se registra la URL pública de cada pieza.** Es lo que después necesitan ④ para su loop y ⑧B para
pautar sobre el orgánico.

## 3 · Cuando algo falló

```
| id     | Qué pasó                      | Qué se hizo              | ¿Se republicó? |
| PO-004 | Salió sin la media            | Se borró y se republicó  | ✅ 12:10       |
| PO-007 | Entró como video, no como Reel| Se deja — republicar pierde el alcance inicial | ⬜ |
```

🛑 **Borrar y republicar es una decisión, no un reflejo.** Se pierde el alcance acumulado y el
horario elegido. Se decide con criterio:

| Falla | Qué suele convenir |
|---|---|
| Salió **sin media** | Republicar — sin la pieza no comunica nada |
| Salió en la **cuenta equivocada** | Bajar y republicar donde va |
| Entró como **video y no como Reel** | Depende del alcance que ya tomó. Se consulta |
| **Caption cortado** o con un error de texto | Editar, si la plataforma lo permite. No republicar |
| **Link roto** | Editar el link, o corregirlo en la bio |

🛑 **Bajar una publicación es una acción irreversible hacia afuera.** Se propone y **decide un
humano** — igual que la carga.

## 4 · Qué se pasa para adelante

| A quién | Qué |
|---|---|
| **④ Creatividad** (`cr-loop`) | Las URLs de lo publicado — sin ellas no puede leer el rendimiento pieza por pieza |
| **⑧B Ads** | Las piezas marcadas para pauta, con su URL de post orgánico |
| **⑧A Orgánico** | Qué salió y cuándo, para el seguimiento de comentarios |
| **`po-loop`** | Lo que falló y lo que llegó tarde |

---

## Control de calidad de la Capa 5

- [ ] 🛑 **Se miró cada publicación real** — ninguna se dio por buena por el reporte de Publer
- [ ] Se verificó **en móvil**, no solo en escritorio
- [ ] La **cuenta** de cada pieza es la que decía el calendario
- [ ] Los Reels están **como Reel**, no como video de feed
- [ ] Los **captions** se ven completos, con saltos de línea y emojis correctos
- [ ] Los **links** se abrieron y funcionan
- [ ] La **URL pública** de cada pieza está registrada
- [ ] Lo que falló tiene **qué pasó y qué se hizo** escrito
- [ ] 🛑 **Nada se bajó ni se republicó sin que lo decidiera un humano**
- [ ] Las URLs se pasaron a **④ para su loop** y a **⑧B** las marcadas para pauta
