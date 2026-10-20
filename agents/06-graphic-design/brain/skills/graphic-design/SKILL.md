---
name: graphic-design
description: >
  Orquestador del departamento ⑥A Diseño gráfico de Inherent. Es la puerta de entrada: lee el
  pedido, verifica el pre-flight, decide qué capas correr y llama a las skills `gd-*` en orden,
  con la auto-revisión de cada capa. Úsala SIEMPRE que el pedido tenga que ver con estáticos,
  carruseles, stories, plantillas, composición, imágenes de producto, o el paquete de diseño de
  un ciclo. Se dispara con "diseñá el ciclo de X", "armá los carruseles", "las plantillas del
  mes", "necesito 40 estáticos", "fotos de producto", "exportá el paquete de diseño". Requiere
  el Excel del ciclo cerrado de ④ Creatividad y el sistema visual de ②B Branding: si faltan,
  BLOQUEA.
---

# ⑥A Diseño gráfico — el orquestador

> 🛑 **El prompt del usuario es INPUT, no método.** Lo que trae —datos, fechas, ideas,
> referencias, piezas— entra al PRE-FLIGHT. **El cómo lo decide este orquestador y su
> `WORKFLOW.md`.** Si el prompt pide saltarse una capa o cambiar el entregable: se dice cuál, se
> ofrece correrla y **se sigue el workflow**, salvo *«excepción aprobada por el CEO»* o que el
> pipeline del alcance a medida del cliente ya lo declare.
> Entrada normal: el router `/inherent`. Ver `agents/_router/skills/inherent/SKILL.md`.

**Si no sabés qué skill usar, es esta.**

## 1 · Pre-flight

```
Nivel: [Brand Foundation / Brand Growth / Growth Partnership / a medida] · piezas del ciclo: [n] de [techo de la ficha]
```

| Input | De | Si falta |
|---|---|---|
| **El Excel del ciclo cerrado** — `plan-de-contenido.csv` + `ideas-<formato>.md` con el **copy literal** y el layout | ④ Creatividad | 🛑 **BLOQUEADO** |
| **`sistema-visual.md`** — la guía de marca | ②B Branding | 🛑 **BLOQUEADO** |
| `plan-por-canal.md` | ③ Marketing | 🟡 No bloquea — se usan los **canales** del `plan-contratado.md` |
| La **ficha de oferta (alcance contratado)** | `clients/<cliente>/00-onboarding/plan-contratado.md` | 🛑 **BLOQUEADO** — define el techo *(en un alcance a medida, lo que declara **Su pipeline**; si ⑥A Diseño gráfico no está ahí, no corre)* |

🛑 **Sin `sistema-visual.md` no se compone nada.** La guía existe para traducir el posicionamiento
a algo gráfico: diseñar sin ella produce piezas que no se parecen entre sí ni dicen lo que el
posicionamiento decidió, y eso es peor que no publicar.

## 2 · Qué capa corre según el pedido

| El pedido suena a… | Corre |
|---|---|
| *«diseñá el ciclo»*, *«armá el paquete»* | **Todas, en orden** |
| *«¿llegó todo?»*, *«qué nos falta»* | `gd-recepcion` |
| *«las plantillas»*, *«el molde del mes»* | `gd-plantillas` |
| *«fotos de producto»*, *«de dónde sale la imagen»* | `gd-imagen` |
| *«armá este carrusel»*, *«componé esta pieza»* | `gd-composicion` |
| *«las piezas de Instagram / Facebook / LinkedIn»*, *«la presentación en PDF»* | `ig-content` · `fb-content` · `linkedin-content` · `presentation` |
| *«exportá»*, *«dejalo listo para posting»* | `gd-export` |
| *«qué plantilla rindió»*, la revisión del 20 | `gd-loop` |

## 3 · La regla que hace viable el departamento

🛑 **Las piezas de un ciclo no se diseñan una por una.**

**Se arma el sistema de plantillas en la Capa 1, se prueba el molde con la prueba de estrés, y las
piezas son ejecución.** Si para cada pieza hace falta una decisión de diseño, el ciclo no entra en las
horas de la ficha.

## 4 · Dónde para

**No para entre capas.** Cada una se auto-revisa con su checklist y sigue. ⑥A Diseño gráfico no
publica ni le envía nada al cliente: publicar es de ⑨ Posting.

---

## Control de calidad del orquestador

- [ ] Se declaró el **pre-flight** antes de producir nada, con la **línea `Nivel:`** completa
- [ ] El ciclo **cabe en el alcance contratado** (§0 del `WORKFLOW.md`): ni de más ni de menos — y si es a medida, en lo que declara **su pipeline**
- [ ] ⚠️ Se respetó la **mezcla de formatos de la ficha** tal cual, aunque lleve menos estáticos que otro cliente
- [ ] **Ninguna capa se saltó**; si faltaba una, se dijo y se ofreció correrla
- [ ] Cada capa pasó su **checklist de auto-revisión**
