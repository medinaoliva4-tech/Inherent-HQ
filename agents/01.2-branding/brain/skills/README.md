# Las skills de ②B Branding — cuál, cuándo y en qué orden

Una skill es **cómo se hace un paso**. El `WORKFLOW.md` dice qué pasa y en qué orden; acá está el
detalle de cada herramienta.

**Dónde viven:** acá mismo, una carpeta por skill: `agents/01.2-branding/brain/`.

> **Cómo cargan:** cada carpeta está **enlazada** en `.claude/skills/` de la raíz del repo. Es un
> enlace, no una copia.
> 🛑 **La sesión de Claude Code se abre en la carpeta raíz del repo.**

---

## El orquestador

| Skill | Qué hace |
|---|---|
| **`branding`** | La puerta de entrada. **Si no sabés cuál usar, es esta.** |

## Las capas de construcción — corren una vez, en el onboarding

| # | Skill | Capa | Se dispara cuando… | Produce |
|---|---|---|---|---|
| 1 | **`br-brief`** | 0 | *«arrancá el branding»* | § El brief — lo que ② decidió vs. lo que ②B resuelve |
| 2 | **`br-territorio`** | 1 | *«cuál es el territorio»* | § Territorio y personalidad |
| 3 | **`br-voz`** | 2 | *«el tono de voz»* | § Voz · **🚦 GATE 1** |
| 4 | **`br-sistema`** | 3 | *«qué colores»*, *«la tipografía»* | **`sistema-visual.md`** |
| 5 | **`br-activos`** | 4 | *«qué nos hace reconocibles»* | § Activos distintivos |
| 6 | **`br-aplicacion`** | 5 | *«cómo se ve en un reel»* | § Aplicación por formato · **🚦 GATE 2** |

## Las capas de ciclo — corren todos los meses

| Skill | Se dispara cuando… | Produce |
|---|---|---|
| **`br-guardian`** | *«¿esto es de marca?»*, *«validá estas piezas»*, *«¿podemos decir esto?»* | Veredicto por pieza y por claim |
| **`br-loop`** | La revisión del 20 | `aprendizaje-de-branding.md` |

---

## La regla de los ciclos

| Ciclo | Qué corre |
|---|---|
| **El primero** | Capas 0 a 5 |
| **Los demás** | Solo `br-guardian` y `br-loop` |

🛑 **La marca se evoluciona, no se rehace.**

## Los dos gates

| 🚦 | Después de | Qué aprueba Allan |
|---|---|---|
| **GATE 1** | `br-voz` | Territorio y voz |
| **GATE 2** | `br-aplicacion` | La guía completa |
