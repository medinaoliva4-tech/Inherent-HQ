# Las skills de ⑩ Ads Management — cuál, cuándo y en qué orden

Una skill es **cómo se hace un paso**. El `WORKFLOW.md` dice qué pasa y en qué orden.

**Dónde viven:** acá mismo, una carpeta por skill: `agents/10-ads-management/brain/`.

> 🛑 **La sesión de Claude Code se abre en la carpeta raíz del repo.**

---

## El orquestador

| Skill | Qué hace |
|---|---|
| **`ads`** | La puerta de entrada. **Si no sabés cuál usar, es esta.** |

🛑 **Si el pedido es sobre la oferta, el precio o los canales grandes, es ② Growth.**

## Las 7 capas

| # | Skill | Capa | Se dispara cuando… | Produce |
|---|---|---|---|---|
| 1 | **`ad-encargo`** | 0 | *«cuánto presupuesto»*, *«qué objetivo»* | § El encargo + la auditoría de arranque |
| 2 | **`ad-estructura`** | 1 | *«cómo armamos las campañas»* | § La estructura |
| 3 | **`ad-creativos`** | 2 | *«qué anuncios corremos»* | § Los creativos · **🚦 GATE 1** |
| 4 | **`ad-lanzamiento`** | 3 | *«lanzá»* 🔒 | Las campañas corriendo |
| 5 | **`ad-optimizacion`** | 4 | *«no está rindiendo»*, *«pausá»* 🔒 | Los cambios · **🚦 GATE 2** |
| 6 | **`ad-atribucion`** | 5 | *«cuánto vendimos por pauta»* | § Atribución — habilita el fee |
| 7 | **`ad-loop`** | 6 | La revisión del 20 | `aprendizaje-de-pauta.md` |

---

## Las dos herramientas

| | **AdWhispr** *(MCP)* | **`claude-ads`** *(plugin)* |
|---|---|---|
| Ejecuta | ✅ | ❌ — `--draft` |
| Audita y monitorea | ❌ | ✅ |

**El plugin propone, AdWhispr ejecuta, Allan aprueba en el medio.**

## 🔴 Pautar es acción destructiva

🛑 **Nada se lanza ni se mueve de presupuesto sin gate de Allan.**
**La inversión la pone el cliente, siempre, aparte del fee.**

| 🚦 | Después de | Qué aprueba |
|---|---|---|
| **GATE 1** | `ad-creativos` | El plan y **el presupuesto** |
| **GATE 2** | Cada cambio | **Todo movimiento de presupuesto** |
