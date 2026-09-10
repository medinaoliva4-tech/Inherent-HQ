# Proceso Operativo — Agente de Creatividad

Cómo se ejecuta un bloque de contenido de punta a punta. Secuencial y con gates. **Ninguna capa
arranca sin el input de la anterior.**

---

## Antes de todo — Pre-flight

```
PRE-FLIGHT — Cliente: [x] · Arquetipo: [x] · Capa: [0-7] · Bloque: [semana/quincena/mes]
Strategy: núcleo [✅/⬜] evidencia [✅/⬜] posicionamiento [✅/⬜] contenido [✅/⬜] canal [✅/⬜] calendario [✅/⬜]
Branding: [✅/⬜] · Growth: [✅/⚠️]
Skills: [x] · MCPs disponibles: [x] · Gate humano: [sí/no] · Output: [ruta]
→ PASS | BLOQUEADO: [qué falta exactamente]
```

**Se bloquea si:** no hay cliente identificado · no existe la carpeta del cliente · falta un
entregable bloqueante de Strategy o Branding · el Gate 2 de Strategy (posicionamiento) no está
aprobado · falta el input mínimo de la capa · el pedido pisa otro departamento.

> 🛑 **Sin `posicionamiento.md` aprobado y `calendario-estrategico.csv`, Creative no idea.** No se
> reconstruye la estrategia leyendo los otros archivos.

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

Copiar las plantillas de `templates/`. **El nombre de la carpeta es el mismo nombre canónico que usa
Strategy** — `agents/strategy/clients/<cliente>/` es de donde se leen los inputs. Nunca se duplica
un archivo de Strategy dentro de Creative: se cita su ruta.

---

### ▸ Paso 2 — CAPA 0 · Brief
**Input:** los 6 entregables de Strategy + Branding
**Skill:** `cr-brief`
**Output:** `brief-creativo.md`

Cargar contexto → leer los slots del ciclo → traducir cada slot con
`playbooks/TRADUCCION-STRATEGY.md` → declarar el filtro de audiencia.

Si falta un bloqueante: **BLOQUEADO**, con el nombre exacto del archivo que falta.

🚦 **GATE 1 — Aprobación del brief.** Un humano confirma que el brief refleja la estrategia antes de
gastar tiempo ideando sobre una lectura equivocada.

---

### ▸ Paso 3 — CAPA 1 · Referencia
**Input:** brief + `ingenieria-inversa.md` de Strategy
**Skill:** `cr-swipe-file` · **Playbook:** `SWIPE-FILE.md`
**Output:** `swipe-file.md`

Arrancar de la tabla 15×7 de Strategy → cosechar **solo el hueco** → filtrar por longevidad →
extraer patrón → organizar por pilar y tipo de hook → traducir a hipótesis → verificar contra el
mapa de saturación.

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
valida (Branding o Growth).

---

### ▸ Paso 6 — CAPA 6 · Multiplicación y ensamblado
**Input:** dirección creativa + slots del calendario
**Skill:** `cr-adaptacion`
**Output:** `adaptacion-por-canal.md` + `ideas-de-contenido.csv`

Un concepto → N filas, **solo hacia canales que tienen slot**. Specs por canal. 26 columnas
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
## HANDOFF — Creative → Production / Content
- Cliente: · Arquetipo: · Bloque: · Fecha:
- Entregables: [rutas de los 6 + aprendizaje-creativo.md]
- Gates aprobados: brief [✅/⬜] · conceptos [✅/⬜] · Excel [✅/⬜]
- Filas totales: [n] · por canal: [desglose]
- BIG IDEAS de este bloque: [1 frase cada una]
- MUST BE TRUE que se está moviendo: [las letras, heredadas de Strategy]
- Claims pendientes de aprobación: [⏸️ lista, con quién los valida]
- Huecos abiertos: [⚠️ SIN DATOS pendientes]
- Filas descartadas por no trazar: [n + por qué]
- Confianza general: 🟢 / 🟡 / 🔴
- Siguiente: Production (foto · video · diseño) · Content (armado y QA final)
```

**Reglas del handoff:**
- Una fila `PENDIENTE` no se libera. O se completa, o se saca del bloque y se declara.
- El Excel es **la interfaz**. Si Production tiene que preguntar algo, el brief estaba incompleto —
  y eso se corrige en el brief, no por chat.

---

## Devoluciones a Strategy

Creative no corrige la estrategia, pero **sí la devuelve** cuando la encuentra rota. Se declara y se
escala; no se resuelve por cuenta propia:

| Lo que Creative detecta | Qué hace |
|---|---|
| La cadencia del calendario no cabe en la capacidad de producción | Declara el exceso y devuelve a Strategy (su Capa 7) |
| Un slot no tiene `traza_a_must_be_true` | No produce la fila. Devuelve el slot |
| **Dos canales distintos** con la misma `funcion` | Devuelve: Strategy define una función **distinta por canal** — *"si dos canales hacen lo mismo, uno sobra"* (su 6.4) |
| Un canal con una `funcion` que `contenido-por-canal.md` no le asigna | Devuelve el slot: el calendario contradice el sistema |
| Ninguna idea sobrevive el filtro D/N/R en un territorio | Devuelve: puede ser que el territorio no sea distintivo (su Capa 4) |
| La promesa no es escribible en el lenguaje del comprador | Devuelve con las 3 objeciones que la contradicen |

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
