# Proceso Operativo — Agente de Creatividad

Cómo se ejecuta un bloque de contenido de punta a punta. Secuencial y con gates. **Ninguna capa
arranca sin el input de la anterior.**

---

## Antes de todo — Pre-flight

```
PRE-FLIGHT — Cliente: [x] · Arquetipo: [x] · Capa: [0-7] · Bloque: [semana/quincena/mes]
① Comprensión: negocio+audiencia [✅/⬜] capacidad [✅/⬜]
② Estrategia: posicionamiento [✅/⬜] ingeniería inversa [✅/⬜]
③ Marketing: campañas [✅/⬜] pilares+mix [✅/⬜] canal [✅/⬜] calendario [✅/⬜]
②B Branding: [✅/⬜] · ⑧B Ads: [✅/⚠️]
Campañas del ciclo: [nombres] · Mezcla 70/20/10: [✅ verificable / ⬜ al cierre]
Skills: [x] · MCPs disponibles: [x] · Gate humano: [sí/no] · Output: [ruta]
→ PASS | BLOQUEADO: [qué falta exactamente]
```

**Se bloquea si:** no hay cliente identificado · no existe la carpeta del cliente · falta un
entregable bloqueante de Comprensión, Estrategia, Marketing o Branding · el posicionamiento no está
aprobado · el plan de campañas no está aprobado · falta el input mínimo de la capa · el pedido pisa
otro departamento.

> 🛑 **Sin posicionamiento aprobado y sin plan de campañas, Creative no idea.** No se reconstruye la
> estrategia ni el plan leyendo los otros archivos.

> 🔄 **Mientras el repo no separe los departamentos**, los tres primeros se leen de
> `agents/strategy/` con el mapeo de `AGENT.md`. El pre-flight se declara igual: lo que se verifica
> es el **contenido**, no el nombre de la carpeta.

---

## Modos de entrada

El usuario no siempre pide el bloque completo. Seis modos:

| Pedido | Qué corre |
|---|---|
| *"Armá las ideas de contenido de X"* / *"llená el calendario de X"* | **Completo** — Capas 0 → 6, con 3 gates |
| *"Traducí la estrategia de X a brief"* | **Solo Capa 0** — entrega `brief-creativo.md` |
| *"Buscá referencias / qué está funcionando en este formato"* | **Solo Capa 1** — entrega `swipe-file.md` |
| *"Dame conceptos para X"* / *"cuál es la big idea"* | **Capas 2-3** — requiere Capa 0 hecha |
| *"Escribí el hook y el copy de esta pieza"* | **Capas 4-5** — requiere concepto aprobado (Gate 2) |
| *"¿Qué funcionó el mes pasado?"* | **Solo Capa 7** — requiere piezas publicadas + métricas |

**Si falta una capa previa:** se dice qué falta y se ofrece correrla. **No se improvisa el faltante.**

---

## El flujo completo

### ▸ Paso 1 — Setup del cliente
```
agents/creative/clients/<cliente>/
├── _INPUTS/                    # brand kit, assets, exports de métricas
├── brief-creativo.md
├── swipe-file.md
├── conceptos.md
├── direccion-creativa.md
├── adaptacion-por-canal.md
├── ideas-de-contenido.csv
└── aprendizaje-creativo.md
```

Copiar las plantillas de `templates/`. **El nombre de la carpeta es el mismo nombre canónico que usan
los departamentos de aguas arriba** — de ahí se leen los inputs. Nunca se duplica un archivo de otro
departamento dentro de Creative: se cita su ruta.

---

### ▸ Paso 2 — CAPA 0 · Brief
**Input:** los entregables de Comprensión, Estrategia, Marketing y Branding
**Skill:** `cr-brief`
**Output:** `brief-creativo.md`

Cargar contexto → **agrupar los slots del ciclo por campaña** → traducir cada slot con
`playbooks/TRADUCCION-DE-SLOT.md` → declarar el filtro de audiencia → declarar el reparto
70/20/10 previsto para el ciclo.

Si falta un bloqueante: **BLOQUEADO**, con el nombre exacto del archivo que falta.

🚦 **GATE 1 — Aprobación del brief.** Un humano confirma que el brief refleja la estrategia antes de
gastar tiempo ideando sobre una lectura equivocada.

---

### ▸ Paso 3 — CAPA 1 · Referencia
**Input:** brief + la ingeniería inversa de **② Estrategia**
**Skill:** `cr-swipe-file` · **Playbook:** `SWIPE-FILE.md`
**Output:** `swipe-file.md`

Arrancar de la tabla 15×7 de Estrategia → cosechar **solo el hueco** en Meta Ad Library / Meta Spark
→ filtrar por longevidad → extraer patrón → organizar por pilar y tipo de hook → traducir a
hipótesis → verificar contra el mapa de saturación → **clasificar cada patrón en 70 / 20 / 10**.

🛑 **Nunca se guarda por gusto estético.** Sin señal de rendimiento va `⚪ ruido`.

---

### ▸ Paso 4 — CAPAS 2-3 · Concepto e historia
**Input:** brief + swipe file + lente de marca
**Skills:** `cr-big-idea` → `cr-storytelling`
**Output:** `conceptos.md`

```
CAPA 2  Insight → toolkit (1-2 técnicas) → 3 BIG IDEAS → elegir 1 → derivar → filtro D/N/R
CAPA 3  Héroe · problema interno · guía · plan · CTA · éxito · fracaso evitado
```

Si la BIG IDEA falla la **prueba del logo**, se vuelve al toolkit y se elige otra técnica.
**No se fuerza.**

🚦 **GATE 2 — Aprobación de conceptos.** El gate más importante: hook, copy, layout, tomas y estética
derivan de acá. Un concepto equivocado se multiplica por 20 filas.

---

### ▸ Paso 5 — CAPAS 4-5 · Dirección
**Input:** conceptos aprobados
**Skills:** `cr-hook-copy` → `cr-arte-video`
**Output:** `direccion-creativa.md`

```
CAPA 4  HOOK (7 cajas) + frame 1 visual + HOOK→BODY→PAYOFF con timing + COPY literal + CTA por etapa
CAPA 5  Grid · jerarquía · foco único · layout de texto · safe zones · mood · SHOT LIST + cobertura
```

Todo Bold Claim con dato, precio o promesa se marca `⏸️ PENDIENTE APROBACIÓN` y se nombra quién lo
valida (Branding o Ads).

---

### ▸ Paso 6 — CAPA 6 · Multiplicación y ensamblado
**Input:** dirección creativa + slots del calendario
**Skill:** `cr-adaptacion`
**Output:** `adaptacion-por-canal.md` + `ideas-de-contenido.csv`

Un concepto → N filas, **solo hacia canales que tienen slot**. Specs por canal. 31 columnas
completas por fila. Hipótesis escrita en cada fila.

**Verificación de trazabilidad:** toda fila recorre
`Fila → Slot → Sistema → Campaña → Mecanismo → Trabajo estratégico → Objetivo → MUST BE TRUE`.
Si no puede, se elimina.

🚦 **GATE 3 — Aprobación del Excel.** El lead revisa antes del handoff. **Nada se libera a producción
sin esta revisión.**

---

### ▸ Paso 7 — CAPA 7 · Loop
**Input:** piezas publicadas + métricas por pieza
**Skill:** `cr-loop`
**Output:** `aprendizaje-creativo.md`

3 patrones ganadores por goal + qué refrescar por fatiga + swipe file y banco de hooks actualizados
+ 3 hipótesis para la próxima ronda.

Sin métricas: `⚠️ SIN DATOS — [qué falta y a quién pedírselo]`. **Nunca se inventa un ganador.**

---

## Handoff

Al cerrar el bloque, entregá:

```markdown
## HANDOFF — Creative → Producción / Diseño gráfico
- Cliente: · Arquetipo: · Bloque: · Fecha:
- Entregables: [rutas de los 6 + aprendizaje-creativo.md]
- Gates aprobados: brief [✅/⬜] · conceptos [✅/⬜] · Excel [✅/⬜]
- Filas totales: [n] · por campaña: [desglose] · por canal: [desglose]
- Reparto 70/20/10 del ciclo: [n / n / n] → [✅ cumple / ⚠️ desviado + por qué]
- Filas que necesitan rodaje: [n] → van a ⑤ Producción
- Filas 100 % gráficas (sin rodaje): [n] → van directo a ⑥A Diseño gráfico
- BIG IDEAS de este bloque: [1 frase cada una]
- MUST BE TRUE que se está moviendo: [las letras, heredadas de ② Estrategia]
- Claims pendientes de aprobación: [⏸️ lista, con quién los valida]
- Huecos abiertos: [⚠️ SIN DATOS pendientes]
- Filas descartadas por no trazar: [n + por qué]
- Confianza general: 🟢 / 🟡 / 🔴
- Siguiente: ⑤ Producción (lo que hay que grabar o fotografiar) · ⑥A Diseño gráfico (lo que se arma con material existente)
```

**Reglas del handoff:**
- Una fila `PENDIENTE` no se libera. O se completa, o se saca del bloque y se declara.
- El Excel es **la interfaz**. Si Producción, Diseño o Posting tienen que preguntar algo, el brief
  estaba incompleto — y eso se corrige en el brief, no por chat.

---

## Devoluciones aguas arriba

Creative no corrige el plan, pero **sí lo devuelve** cuando lo encuentra roto. Se declara y se
escala; no se resuelve por cuenta propia:

| Lo que Creative detecta | A quién vuelve | Qué hace |
|---|---|---|
| La cadencia del calendario no cabe en la capacidad de producción | **③ Marketing** | Declara el exceso en filas concretas y devuelve el bloque |
| Un slot no tiene `traza_a_must_be_true` | **③ Marketing** | No produce la fila. Devuelve el slot |
| **Dos canales distintos** con la misma `funcion` | **③ Marketing** | Devuelve: cada canal necesita una función **distinta** — si dos hacen lo mismo, uno sobra |
| Un canal con una `funcion` que el plan de canal no le asigna | **③ Marketing** | Devuelve el slot: el calendario contradice el plan |
| Una campaña sin fechas de preparación suficientes para producir | **③ Marketing** | Devuelve con el mínimo de días que la producción necesita |
| Los pilares y su mix no cierran con la frecuencia pedida | **③ Marketing** | Declara la diferencia. **No reajusta el mix por su cuenta** |
| Ninguna idea sobrevive el filtro D/N/R en un territorio | **② Estrategia** | Devuelve: puede ser que el territorio no sea distintivo |
| La promesa no es escribible en el lenguaje del comprador | **② Estrategia** | Devuelve con las 3 objeciones que la contradicen |
| El lenguaje literal del comprador está vacío o es inventado | **① Comprensión** | Devuelve: sin citas textuales el copy se escribe a ciegas |
| Las guidelines contradicen lo que el concepto necesita | **②B Branding** | Declara la contradicción. No la resuelve sola |

---

## Ciclo

```
CAPA 7 → patrones ganadores → actualizar swipe file y banco de hooks (Capa 1)
                            → alimentar el próximo concepto (Capa 2)
                            → nuevo bloque
```

El toolkit y las fichas de `toolkit/` se revisan **cada 3 meses** con los patrones acumulados: si un
tipo de hook ganó consistentemente, sube al tope de la ficha. Las fichas son puntos de partida con
evidencia detrás, no verdades.
