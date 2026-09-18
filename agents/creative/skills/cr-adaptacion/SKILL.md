---
name: cr-adaptacion
description: >
  Capa 6 del método de Creatividad — multiplica un concepto en una fila por canal y ensambla el
  entregable final del ciclo: `plan-de-contenido.csv` (12 columnas) + `ideas.md` (una sección por
  pieza). Adapta a lo que premia cada plataforma —TikTok, Reels, Shorts, carrusel, story, estático—
  con sus specs, verifica que toda fila trace a una MUST BE TRUE y que el reparto 70/20/10 cierre
  sobre el total del ciclo. Úsala cuando pidan "adaptalo a los otros canales", "armá el Excel",
  "llená el plan de contenido", "el calendario de contenido completo", "repurposing", "pasá esto a
  TikTok y a carrusel", "cerrá el ciclo". Adaptar, no copiar-pegar: publicar lo mismo idéntico en
  todos lados el algoritmo lo penaliza.
---

# Capa 6 — Multiplicación y ensamblado

**Qué consume**
- Los conceptos, hooks, guiones, copys, escenas y estética ya producidos en las Capas 2-5 (viven en `ideas.md`).
- Los slots del ciclo: canal, formato, pilar, función, campaña y objetivo — heredados de ③ Marketing.
- La traza a MUST BE TRUE de cada slot — heredada de ② Estrategia.
- La capacidad real de producción del cliente.
- El método completo del departamento: `agents/creative/WORKFLOW.md`.

**Qué produce** — los dos únicos entregables del ciclo, completos:
- **`plan-de-contenido.csv`** — una fila por pieza, 12 columnas, sin celdas vacías.
- **`ideas.md`** — una sección por pieza, titulada `## CR-007 · <concepto>`.

> El puente entre los dos es el **`id`**. Se ve `CR-007` en el Excel, se busca `CR-007` en el doc.

---

## 1 · Un concepto → N filas

```
1 CONCEPTO CORE
   ├── TikTok      45s, ritmo rápido, audio en tendencia, hook en 2s
   ├── Reel        30s, misma idea con mejor factura + texto on-screen, sin watermark
   ├── Short       25s, tono educativo, título con keyword
   ├── Carrusel    los 3 puntos del guion en 5 slides
   └── Estático    la frase más fuerte del guion como quote
```

| Se conserva siempre | Cambia por canal |
|---|---|
| El `concepto` (la BIG IDEA) | La duración y el ritmo |
| El insight y el arco | El nivel de factura visual |
| **La promesa** | El tono (más crudo / más pulido / más how-to) |
| El activo distintivo | El audio y el texto en pantalla |
| La `traza` | El CTA, si el slot cambia de etapa |

🛑 **Solo se multiplica hacia canales que TIENEN SLOT en el calendario.** Un canal sin slot no
existe para Creative — agregarlo es pisar a ③ Marketing.

🛑 **Watermark de otra app = alcance muerto.** Se declara explícitamente en la sección de la pieza.

---

## 2 · Qué premia cada canal y qué versión se hace

| Canal | Qué premia | Versión que se hace | Specs |
|---|---|---|---|
| **TikTok** | Watch time y completion | Más cruda y veloz, montada sobre un sonido del momento | **<60s** · hook en **2s** · 9:16 · audio en tendencia |
| **Instagram Reels** | Factura visual y relación con seguidores | La de mejor acabado, con texto on-screen | **7-30s** · 9:16 · 1080×1920 · 🛑 **sin watermark** |
| **YouTube Shorts** | Lo educativo / how-to y la autoridad del canal | Tono how-to, título buscable | **<30s** ideal · 9:16 · título con keyword |
| **Carrusel (IG / LinkedIn)** | Profundidad y guardados | El guion roto en slides, 1 idea por slide | 4:5 o 1:1 · 5-8 slides · slide 1 = hook |
| **Story** | Inmediatez y cercanía | La versión más informal, con interacción | 9:16 · 15s por card · safe zones arriba y abajo |
| **Post estático** | Una frase que se sostiene sola | Una línea fuerte del guion como quote | 4:5 o 1:1 · legible en el feed comprimido |
| **Google Business / mapas** | Captura en el momento de decisión | Foto real + información útil, cero producción | Foto horizontal · texto corto |
| **Email / lista** | Relación directa, cero algoritmo | La versión larga, con la explicación completa | Asunto <50 caracteres · 1 CTA |

**Hook temprano en todas** — y en TikTok, a los **2 s**.

---

## 3 · Llenar `plan-de-contenido.csv` — las 12 columnas

```
id · campana · fecha · canal · formato · pilar · funcion · concepto · mezcla · traza · rodaje · estado
```

| Columna | Qué lleva | De dónde sale |
|---|---|---|
| `id` | `CR-001`, correlativo del ciclo | Creative |
| `campana` | Nombre de la campaña | ③ Marketing |
| `fecha` | Día concreto | Creative (dentro de la semana del slot) |
| `canal` | El canal del slot | ③ Marketing — heredado sin cambio |
| `formato` | Reel · carrusel · estático · story… | ③ Marketing — heredado sin cambio |
| `pilar` | El pilar de contenido | ③ Marketing — heredado sin cambio |
| `funcion` | Alcance · Confianza · Conversión… | ③ Marketing — heredado sin cambio |
| `concepto` | **Una línea.** Qué es la pieza | Creative |
| `mezcla` | `70·probado` / `20·apuesta` / `10·propio` | Creative |
| `traza` | La letra de la MUST BE TRUE que mueve | ② Estrategia |
| `rodaje` | `si` / `no` — decide si va a ⑤ Producción o directo a ⑥A Diseño | Creative |
| `estado` | `listo` / `pendiente` / `⏸️ aprobación` | Creative |

🛑 **Lo heredado se copia, no se reescribe.** Si un `canal` o una `funcion` te incomodan, se devuelve
el slot a ③ Marketing; no se corrige en la celda.

🛑 **Ninguna celda vacía.** Si falta un dato, la fila es `pendiente` y se declara qué falta.

---

## 4 · Llenar `ideas.md` — una sección por pieza

Título exacto: `## CR-007 · <concepto>`. **Un `id` del CSV = una sección del doc.** Ni filas sin
sección ni secciones huérfanas.

Cada sección lleva: **Objetivo del slot** · **Emoción** · **Hook** · **Guion** · **Copy** ·
**Layout de texto** · **Escenas** · **Encuadres** · **Duraciones** · **Referencia visual** ·
**Estética / mood** · **Elementos gráficos** · **Hipótesis** · **Aprobación de claim** (si aplica).

> 🛑 **El hook, el guion y el copy van literales, entre comillas.** *"un hook de curiosidad"* no es
> un entregable; el texto exacto sí.

- `guion` = lo que se **dice**. Si el formato no lleva voz: `N/A — formato estático`. Nunca vacío.
- `copy` = lo que se **ve**. Con jerarquía explícita: título > subtítulo > CTA.
- `escenas`, `encuadres` y `duraciones` llevan **el mismo número de ítems y el mismo orden**
  (E1, E2, E3…), o los tres dicen `N/A`. Sin ítem `total` ni comentarios extra: rompen la
  alineación y ⑤ Producción no puede partir la fila.
- `elementos_graficos`: vocabulario cerrado de **4 familias** (ilustraciones · assets png ·
  texturas · formas), **máximo 3** por pieza, o `ninguno` con su motivo.
- 🛑 **Ninguna sección especifica hex, tipografía, tamaño en píxeles, lente, locación concreta,
  permiso ni casting.** Eso es de ⑥A Diseño y ⑤ Producción.

---

## 5 · Verificación de trazabilidad — obligatoria

Toda fila recorre el camino inverso, completo:

```
Fila → Slot → Campaña → Objetivo → MUST BE TRUE
```

🛑 **Si no traza, SE ELIMINA.** La pregunta correcta es: *¿por qué estamos haciendo esta pieza?*
Cinco filas de un mismo concepto trazan **a la misma** MUST BE TRUE.

❌ *"Va porque el concepto daba para un carrusel."*
✅ *"`CR-009` → slot s4 IG carrusel → campaña Lanzamiento → objetivo 'que entiendan el mecanismo' → MUST BE TRUE **C**."*

---

## 6 · Verificación del reparto 70/20/10

Se cuenta la columna `mezcla` **sobre el total del ciclo**, no por campaña.

| Cubeta | Qué es | Objetivo |
|---|---|---|
| `70·probado` | Patrón probado afuera | 70 % |
| `20·apuesta` | Apuesta propia | 20 % |
| `10·propio` | Re-explotación de lo nuestro que ganó | 10 % |

- **Tolerancia ±10 puntos.** Fuera de eso: se rebalancea, o se declara la desviación **con su motivo**.
- **Primer ciclo del cliente: 80/20**, porque todavía no hay aprendizaje propio que re-explotar.
- Cada fila tiene **exactamente una** cubeta. Ninguna vacía, ninguna doble.

---

## 7 · Anti-patterns

| Error | Por qué falla |
|---|---|
| ❌ La misma pieza idéntica en todos lados | El algoritmo lo penaliza y no aprovecha lo que premia cada canal |
| ❌ Dejar el watermark | Alcance muerto en Reels |
| ❌ Adaptar a un canal sin slot | Se produce contenido que nadie pidió y no traza a nada |
| ❌ Multiplicar sin mirar la capacidad de producción | El bloque no se produce y el calendario queda con huecos |
| ❌ Cambiar la promesa al adaptar el tono | El tono cambia; la promesa **no** |
| ❌ Un concepto → 1 sola pieza, siempre | Se desperdicia el trabajo de ideación |
| ❌ Dos canales con la misma `funcion` | Si dos hacen lo mismo, uno sobra → se devuelve a ③ Marketing |

✅ **El repurposing ahorra ideación, no producción.** El total de filas cabe en la capacidad real.

---

## 8 · Cierre y handoff

🚦 **GATE 3 — Aprobación del ciclo.** El lead revisa el CSV y el doc antes del handoff. **Nada se
libera a producción sin esta revisión.**

- Las filas con `rodaje = si` van a **⑤ Producción**; las de `rodaje = no`, directo a **⑥A Diseño**.
- Una fila `pendiente` **no se libera**. O se completa, o sale del bloque y se declara.
- **El CSV y el doc son la interfaz.** Si ⑤, ⑥A o ⑦ tienen que preguntar algo, el brief estaba
  incompleto — y eso se corrige en el brief, no por chat.

El formato exacto del bloque HANDOFF está en `agents/creative/WORKFLOW.md` §7.

---

## QA

Ninguna capa se entrega sin pasar su bloque completo.

- [ ] Solo se adaptó hacia **canales con slot** en el calendario
- [ ] **Ninguna pieza idéntica en dos canales** — cada fila tiene sus specs
- [ ] **Sin watermark**, declarado
- [ ] Hook temprano en todas — **2s en TikTok**
- [ ] **Ningún par de canales comparte `funcion`**, y ningún canal tiene una función que el plan por canal de ③ Marketing no le asigne — si pasó, **devuelto a ③ Marketing**
- [ ] El **"qué NO se hace acá"** de cada canal está respetado en todas sus filas
- [ ] El total de filas **cabe en la capacidad de producción real**
- [ ] Las **12 columnas** están completas en cada fila del `plan-de-contenido.csv`
- [ ] **Toda fila tiene `campana`**, y el ciclo se puede leer y aprobar campaña por campaña
- [ ] **Cada `id` del CSV tiene su sección `## CR-00X · <concepto>` en `ideas.md`** — y ninguna sección queda huérfana
- [ ] **Toda fila tiene `mezcla`**, y el reparto del ciclo cierra en **70/20/10 ±10 puntos** (u 80/20 si es el primer ciclo), o la desviación está declarada con su motivo
- [ ] Cada sección declara su **emoción** — una sola, en lenguaje del comprador
- [ ] **Hook, guion y copy literales, entre comillas.** En estáticos, `guion: N/A — formato estático`, nunca vacío
- [ ] `escenas`, `encuadres` y `duraciones` tienen el **mismo número de ítems y el mismo orden**, o los tres dicen `N/A` — sin ítem `total` ni comentarios extra
- [ ] Los **elementos gráficos** usan las 4 familias cerradas, **máximo 3** por pieza, o dicen `ninguno` con su motivo
- [ ] Ninguna fila especifica **hex, tipografía, tamaño en píxeles, lente, locación concreta, permiso o casting**
- [ ] 🛑 **Toda fila tiene `traza`** — las que no, **eliminadas**
- [ ] 🛑 **Toda fila tiene hipótesis escrita**, con qué la confirmaría
- [ ] La **aprobación de claim** está marcada en toda pieza con dato, precio o promesa, con quién valida
- [ ] `rodaje` declarado en toda fila: `si` → ⑤ Producción · `no` → ⑥A Diseño
- [ ] Las filas `pendiente` están listadas y **no se liberan a producción**
- [ ] Verificación de trazabilidad: toda fila recorre `Fila → Slot → Campaña → Objetivo → MUST BE TRUE`
- [ ] **Ninguna fila cambia la promesa** de ② Estrategia ni el pilar o su peso de ③ Marketing
- [ ] El bloque **HANDOFF** está emitido completo
