# Las skills de ④ Creatividad — cuál, cuándo y en qué orden

Una skill es **cómo se hace un paso**. El `WORKFLOW.md` dice qué pasa y en qué orden; acá está el
detalle de cada herramienta.

**Dónde viven:** acá mismo, una carpeta por skill, al lado de este documento. Todo el departamento
en un solo lugar.

El brain es un **plugin**, y por eso no hace falta copiar nada a otra carpeta: un archivo, un solo
lugar, cero copias.

> 🛑 **Un plugin no se carga solo.** El `plugin.json` de `agents/creative/.claude-plugin/` describe el
> plugin, pero **no hace que Claude lo encuentre**. Quien lo hace encontrable es
> `.claude-plugin/marketplace.json`, en la raíz del repo, que lista los departamentos; y
> `.claude/settings.json`, que los deja habilitados.
>
> 🛑 **Habilitar no es instalar.** `enabledPlugins` enciende un plugin **que ya está instalado**; por
> sí solo no lo instala. La primera vez, en cada máquina, hay que instalarlo a mano una vez.
>
> **Cómo se invocan:** las skills de un plugin llevan el nombre del plugin adelante —
> `creatividad:creatividad` es el orquestador, `creatividad:cr-brief` la Capa 0, y así. Las de
> ②③ viven en `.claude/skills/` y van sin prefijo (`estrategia`).
>
> **La instalación, paso a paso** *(verificado 2026-09, Claude Code v2.1.280)*:
>
> 1. `/plugin marketplace add /ruta/absoluta/al/repo`
>    🛑 El `.` pelado **no** lo acepta —*"Invalid marketplace source format"*—: pide una ruta
>    absoluta o `./path`. Y cuidado con el punto viejo si reescribís el campo: una ruta terminada en
>    `.` da *"Path does not exist"*.
> 2. `/plugin` → pestaña **Marketplaces** → `inherent-hq` → **Browse plugins**.
> 3. Entrar a cada departamento e instalarlo con **Install for all collaborators on this repository
>    (project scope)** — *user scope* lo instala solo para vos.
> 4. `/exit` y volver a entrar. `enabledPlugins` se lee **al arrancar**, no en caliente: hasta que no
>    reinicies, `/reload-plugins` va a seguir diciendo `0 plugins · 0 skills`.
>
> ⚠️ **Instalar con *project scope* reescribe `.claude/settings.json`.** Si al hacerlo te vacía
> `extraKnownMarketplaces`, restauralo **antes de commitear**: si no, el repo queda nombrando
> `@inherent-hq` en `enabledPlugins` sin ningún marketplace que lo defina, y no carga para nadie.
>
> **Mientras la rama no esté en `main`**, el marketplace de GitHub apunta a un `main` que todavía no
> tiene `marketplace.json`, y falla con *"Marketplace file not found"*. Por eso hasta el merge se
> registra el local con el paso 1.

---

## El orquestador

| Skill | Qué hace |
|---|---|
| **`creatividad`** | La puerta de entrada. Lee el pedido, decide qué capas correr, verifica el pre-flight y llama a las demás en orden. **Si no sabés cuál usar, es esta.** |

## Las 10 skills, en orden del flujo

| # | Skill | Capa | Se dispara cuando… | Produce |
|---|---|---|---|---|
| 1 | **`cr-brief`** | 0 | *"traducí la estrategia a brief"*, o arranca un ciclo | La sección de brief: slots agrupados por campaña, traducidos a etapa, con fecha |
| 2 | **`cr-swipe-file`** | 1 | *"buscá referencias"*, *"qué está funcionando"* | `swipe-file.md` — la bóveda filtrada por longevidad |
| 3 | **`cr-lectura-de-video`** | 1 | *"mirá este video"*, *"leé la ambientación"*, llega un archivo o link | La ficha de referencia: ritmo, hook, plano por plano, paleta, texto en pantalla |
| 4 | **`cr-fuentes`** | 1 | Hay que salir a buscar anuncios de competencia | Las referencias crudas, con su antigüedad verificada |
| 5 | **`cr-big-idea`** | 2 | *"dame conceptos"*, *"cuál es la big idea"* | 3 BIG IDEAS de una frase, una elegida, filtro D/N/R aplicado |
| 6 | **`cr-storytelling`** | 3 | Después de elegir la BIG IDEA | El arco de 7 piezas bajado a esta pieza |
| 7 | **`cr-hook-copy`** | 4 | *"escribí el hook y el copy"* | Hook, guion y copy **literales**, con CTA por etapa |
| 8 | **`cr-arte-video`** | 5 | Después del copy | Escenas, encuadres, duraciones, layout, mood, elementos gráficos |
| 9 | **`cr-adaptacion`** | 6 | Cierre del ciclo | `plan-de-contenido.csv` + un `ideas-<formato>.md` por formato, completos |
| 10 | **`cr-loop`** | 7 | *"qué funcionó el mes pasado"* | `aprendizaje-creativo.md` — 3 patrones ganadores + 3 hipótesis |

---

## Cómo se encadenan

```
cr-brief ──→ cr-swipe-file ──→ cr-big-idea ──→ cr-storytelling ──→ cr-hook-copy ──→ cr-arte-video ──→ cr-adaptacion
   │              │  ▲                                                                                      │
   │              │  └── cr-fuentes  (trae los anuncios)                                                     │
   │              └───── cr-lectura-de-video  (los lee de verdad)                                            │
   │                                                                                                          │
  GATE 1                                    GATE 2 (tras storytelling)                                    GATE 3
   │                                                                                                          │
   └──────────────────────────────── cr-loop ←──── métricas de las piezas publicadas ←─────────────────────┘
```

**Las tres reglas de encadenado:**

1. **Ninguna skill arranca sin el output de la anterior.** Si falta, se dice qué falta y se ofrece
   correrla. **No se improvisa el faltante.**
2. **Los gates son humanos.** `cr-brief` para después del brief. `cr-storytelling` para después del
   concepto. `cr-adaptacion` para antes del handoff. Nadie los salta.
3. **Cada skill trae su propio control de calidad al final.** El check vive donde se hace el trabajo,
   no en un archivo aparte que nadie abre.

---

## Las tres que se confunden

| | Qué hace | Qué NO hace |
|---|---|---|
| **`cr-fuentes`** | **Consigue** los anuncios: qué fuente, cómo se consulta, cómo se verifica la antigüedad | No los lee ni los juzga |
| **`cr-lectura-de-video`** | **Lee** un video: ritmo, cortes, ambientación, luz, encuadre, paleta, texto | No decide si la referencia sirve |
| **`cr-swipe-file`** | **Decide** si entra a la bóveda: señal de rendimiento, marca de patrón, cubeta 70/20/10 | No sale a buscar ni extrae frames |

> 🛑 **Leer no es validar.** Un video bien leído sin señal de rendimiento es `⚪ ruido` — bien leído,
> pero ruido. La que manda es `cr-swipe-file`.

---

## Si tenés que agregar o cambiar una skill

1. **¿Es un paso del flujo o es conocimiento?** Si es conocimiento —una taxonomía, una lista de
   técnicas— **va adentro de la skill que lo usa**, no en un archivo suelto. Esa fue la razón de la
   limpieza: el conocimiento vive donde se usa.
2. **El `name` del encabezado tiene que ser igual al nombre de la carpeta.** Si no, no carga.
3. **Toda skill declara arriba qué consume y qué produce.** Esa es la trazabilidad del departamento:
   no hay un archivo aparte que la lleve.
4. **Toda skill cierra con su bloque de QA.**
5. **Agregala a la tabla de arriba**, o en tres meses nadie sabe que existe.

---

## Procesos decididos pero no construidos

| Archivo | Qué es | Estado |
|---|---|---|
| `BARRIDO-NOCTURNO.md` | Recolección propia de anuncios en el VPS, de madrugada y sin nadie conectado. Reemplaza la búsqueda manual de `cr-fuentes` | 🟡 **Pendiente.** Cuando se construya, pasa a ser skill |
