# Las skills de ① Comprensión — cuál, cuándo y en qué orden

Una skill es **cómo se hace un paso**. `agents/comprension/WORKFLOW.md` dice qué pasa, en qué orden y
con qué reglas; acá está el detalle de cada herramienta.

**Dónde viven:** acá mismo, una carpeta por skill, al lado de este documento. Todo el departamento en
un solo lugar. El brain es un **plugin**, y por eso no hace falta copiar nada a otra carpeta: un
archivo, un solo lugar, cero copias.

> 🛑 **Un plugin no se carga solo.** El `plugin.json` de `agents/comprension/.claude-plugin/` describe el
> plugin, pero **no hace que Claude lo encuentre**. Quien lo hace encontrable es
> `.claude-plugin/marketplace.json`, en la raíz del repo, que lista los departamentos; y
> `.claude/settings.json`, que los deja habilitados.
>
> 🛑 **Habilitar no es instalar.** `enabledPlugins` enciende un plugin **que ya está instalado**; por
> sí solo no lo instala. La primera vez, en cada máquina, hay que instalarlo a mano una vez.
>
> **Cómo se invocan:** las skills de un plugin llevan el nombre del plugin adelante —
> `comprension:comprension` es el orquestador, `comprension:co-capacidad` la Capa 4, y así.
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
| **`comprension`** | La puerta de entrada. Lee el pedido, verifica el pre-flight, decide qué capas correr y llama a las demás en orden, parando en los 2 gates. **Si no sabés cuál usar, es esta.** |

## Las 7 skills, en orden del flujo

| Capa | Skill | Se dispara cuando… | Produce |
|---|---|---|---|
| **0** | **`co-captura`** | Arranca un cliente · *"armá el formulario"*, *"qué sabemos de X"* | § **Qué sabemos y qué falta** — el barrido de lo que ya existe y la lista de huecos con nombre y fecha |
| **1** | **`co-negocio`** | *"cargá los precios"*, *"de dónde entra la plata"* | **`oferta.csv`** completo + § **El negocio** |
| **2** | **`co-cliente`** | *"quién compra"*, *"qué dicen los clientes"* | § **El cliente** — con el **lenguaje literal** entre comillas |
| **3** | **`co-entorno`** | *"quiénes son la competencia"*, *"cuánto cobran los demás"* | § **El entorno** — el mapa de 5-8 competidores y lo que es verdad del mercado |
| **4** | **`co-capacidad`** | *"cuánto puede producir"*, *"cuánto presupuesto hay"* | § **La capacidad** — en números, con su historial |
| **5** | **`co-diagnostico`** | *"qué le duele"*, *"dónde hay lugar"* | § **Problemas y oportunidades** — cada uno con evidencia, ninguno con solución |
| **6** | **`co-loop`** | *"qué resultó falso"*, *"actualizá la capacidad con lo del rodaje"* | **`aprendizaje-de-comprension.md`** |

El entregable es **uno** —`comprension.md`— más dos archivos internos: `oferta.csv` (8 columnas) y
`aprendizaje-de-comprension.md`. **Ninguna skill inventa un archivo nuevo: todas escriben dentro de
esos tres.**

---

## Cómo se encadenan

```
co-captura ──→ co-negocio ──→ co-cliente ──→ co-entorno ──→ co-capacidad ──→ co-diagnostico
     │                                                            ↑                │
  GATE 1                                                          │             GATE 2
 (captura)                                                        │           (documento)
                                                                  │                │
                                                                  │                ↓
                                          capacidad real de ⑤ ────┤         ② Estrategia
                                                                  │
                    co-loop ←──── qué resultó falso al cerrar ────┘
```

**Las reglas de encadenado:**

1. **Las capas 1-4 pueden correr en cualquier orden entre ellas**, pero **ninguna arranca sin la
   Capa 0.** Preguntar sin haber barrido lo que ya existe es como se quema la paciencia del cliente.
2. 🛑 **`co-diagnostico` va última, siempre.** Un problema listado antes de tener el negocio, el
   cliente y la capacidad es una opinión, no un hallazgo.
3. **Los gates son humanos.** `co-captura` para antes de escribir con huecos evitables ·
   `co-diagnostico` para antes de desbloquear ②. Nadie los salta.
4. **`co-loop` cierra el ciclo y corrige el documento:** alimenta a `co-capacidad` con las jornadas
   reales de ⑤ y a `co-negocio` con el `peso_ingreso` real. Si no vuelve a esas dos, no fue un loop.
5. **Cada skill trae su propio control de calidad al final.** El check vive donde se hace el trabajo.

---

## Las que se confunden

| | Qué hace | Qué NO hace |
|---|---|---|
| **`co-captura`** | **Barre y pregunta**: qué ya existe, qué falta, quién lo tiene, para cuándo | No interpreta lo que llegó ni lo ordena por tema |
| **`co-negocio`** | **La economía**: qué se vende, a cuánto, por qué canal, cuánto pesa | No dice si el precio está bien ni qué canal conviene |
| **`co-cliente`** | **Quién compra hoy** y con qué palabras lo dice | No define el ICP — eso es de ② |
| **`co-entorno`** | **El mapa**: quiénes están, qué venden, a cuánto | No lee sus ads ni mide saturación — eso es `st-ingenieria-inversa` de ② |
| **`co-diagnostico`** | **Lista** problemas y oportunidades con evidencia | No propone qué hacer ni prioriza cuál atacar |

> 🛑 **Mapear no es analizar.** `co-entorno` deja una tabla de quién cobra qué. En el momento en que
> aparece *"y por eso su anuncio funciona"*, el trabajo se metió en ② Estrategia y se está haciendo
> dos veces, con menos método.

| | Qué documenta | De quién es la otra pregunta |
|---|---|---|
| **`co-cliente`** | **Quién compra hoy**, con evidencia | Quién *debería* comprar es el ICP de **② Estrategia** |
| **`co-capacidad`** | **Cuánto se puede ejecutar**, en números | Cuánto *se va a* ejecutar este ciclo lo decide **③ Marketing** |

---

## Si tenés que agregar o cambiar una skill

1. **¿Es un paso del flujo o es conocimiento?** Si es conocimiento —una lista de preguntas, una tabla
   de fuentes, un checklist— **va adentro de la skill que lo usa**, no en un archivo suelto.
2. **El `name` del encabezado tiene que ser igual al nombre de la carpeta.** Si no, no carga.
3. **Toda skill declara arriba qué consume, qué produce y en qué sección de qué entregable escribe.**
4. **Toda skill cierra con su bloque de QA**, con los checks de su capa.
5. **Ninguna skill nueva agrega un entregable.** Los tres archivos están cerrados: una skill nueva
   escribe dentro de ellos o no va.
6. **Ninguna skill de este departamento produce una recomendación.** Si el output de una skill nueva
   contiene la palabra *"deberíamos"*, no es de ① Comprensión.
7. **Agregala a la tabla de arriba**, o en tres meses nadie sabe que existe.
