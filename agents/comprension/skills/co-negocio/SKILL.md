---
name: co-negocio
description: >
  Capa 1 de ① Comprensión — la economía real del negocio. Carga producto por producto qué es, cuánto
  cuesta, cuánto deja, por qué canal se vende, cuánto pesa en el ingreso y cuándo sube o baja, con
  fuente obligatoria por fila; y documenta cómo llega hoy un cliente nuevo, cuánto tarda en comprar,
  cada cuánto vuelve y qué ya se intentó. Produce `oferta.csv` completo y la sección § El negocio de
  `comprension.md`. Úsala cuando pidan "cargá los precios de X", "de dónde entra la plata", "cuánto
  pesa el delivery", "cuál es el ticket promedio", "qué se vende más", "qué ya probaron". Requiere la
  Capa 0 hecha.
---

# Capa 1 · Negocio — qué vende y de dónde entra la plata

| | |
|---|---|
| **Consume** | La § Qué sabemos y qué falta de `comprension.md` (de `co-captura`) · reportes de venta y contratos del `_INPUTS/` · lo que conteste quien maneja la caja |
| **Produce** | **`oferta.csv`** completo — una fila por producto o servicio, 8 columnas · la sección **§ El negocio** de `comprension.md` |

Contexto del departamento: `agents/comprension/WORKFLOW.md`. Plantillas:
`agents/comprension/entregables/oferta.csv` y `comprension.md`.

**Describís la economía, no la juzgás.** Que un producto deje poco margen es un dato; que *"habría
que subirle el precio"* es una decisión de ② Estrategia.

## 1 · `oferta.csv` — una fila por ítem, con fuente

```
item · tipo · precio · costo · canal_de_venta · peso_ingreso · estacionalidad · fuente
```

| Columna | Cómo se llena | Si no se sabe |
|---|---|---|
| `item` | **Como lo nombra el cliente**, no como lo nombraríamos nosotros | — |
| `tipo` | `producto` / `servicio` / `membresia` / `evento` | — |
| `precio` | 🛑 **Siempre con moneda** | `⚠️ SIN DATOS` |
| `costo` | Costo directo | `⚠️ SIN DATOS` — y se declara qué se pierde |
| `canal_de_venta` | Varios separados por `;` — local; delivery; web; DM; WhatsApp; mayoreo | — |
| `peso_ingreso` | % del ingreso total | `⚠️ SIN DATOS`. **Nunca se estima en silencio** |
| `estacionalidad` | Cuándo sube y cuándo baja, concreto | `estable` si de verdad lo es |
| `fuente` | 🛑 **Obligatoria** | La fila no entra sin fuente |

**Las tres fuentes posibles, y lo que valen:**

| Fuente | Marca | Qué significa |
|---|---|---|
| `sistema [mes-año]` | 🟢 | Sale del punto de venta, de un reporte o de una plataforma |
| `dicho por [nombre]` | 🟡 | Lo afirma alguien con acceso a la información |
| `estimado por el equipo` | `[percepción]` | Nadie lo confirmó. **Se escribe igual, etiquetado** |

> 🛑 **`peso_ingreso` sin fuente es el dato más caro del repo.** Un cliente que cree que el delivery
> es el 60 % cuando es el 25 % hace que ② reparta mal el objetivo y que ⑧B pautemos el canal
> equivocado tres meses. Si es percepción, va como percepción — y ② lo sabe antes de decidir.

**Verificación aritmética:** los `peso_ingreso` tienen que sumar ~100 %. Si no suman, falta un ítem o
alguno está estimado de más. **Se declara la diferencia, no se ajusta a mano.**

## 2 · La lectura del negocio — § El negocio

Del CSV sale la lectura, que es lo que ② lee primero:

| | Cómo se saca |
|---|---|
| **Ticket promedio** | Del sistema si existe; si no, del cliente, etiquetado |
| **De dónde entra la mayor parte** | El `canal_de_venta` con mayor `peso_ingreso` sumado |
| **Qué se vende más vs. qué deja más** | Mayor `peso_ingreso` vs. mayor `precio − costo`. 🛑 **Si no coinciden, se dice explícitamente** |
| **Estacionalidad** | El patrón que se repite entre los ítems |

> **Que el producto estrella no sea el que deja más plata es un hallazgo, no un problema.** Se
> escribe como hecho; qué hacer con eso lo decide ②.

### La pregunta que casi nunca se hace

> **Si mañana se cae el canal por el que entra la mayor parte del ingreso, ¿qué queda?**

Se pregunta siempre y **la respuesta va tal cual la dio el cliente**, entre comillas si sirve. Es lo
que destapa la dependencia real del negocio, y es información que ② no puede deducir de un CSV.

## 3 · Cómo llega y cómo se queda un cliente

| Campo | Qué se busca | Trampa |
|---|---|---|
| **Cómo llega uno nuevo hoy** | El camino **real**, con su peso aproximado | El cliente suele contestar el camino que le gustaría, no el que pasa |
| **Cuánto tarda en comprar** | De que lo conoce a que paga | En impulso puede ser el mismo día; en alto ticket, meses |
| **Cada cuánto vuelve** | Frecuencia real de recompra | Si nadie la mide: `⚠️ SIN DATOS` |
| **Qué pasa cuando deja de venir** | ¿Alguien lo nota? ¿Alguien lo contacta? | Casi siempre la respuesta es *"no"*, y es un dato valioso |

## 4 · Lo que ya se intentó

🛑 **Esto se pregunta siempre y se escribe siempre.** Proponer en ② algo que fracasó hace seis meses
quema la relación con el cliente en una sola reunión.

```
| Qué se probó        | Cuándo   | Qué pasó                          | Fuente         |
| Pauta en Meta       | may-2026 | Q3000 gastados, 2 pedidos         | dicho por Ana  |
| Influencer local    | jul-2026 | Mucha visita, nadie compró        | dicho por Ana  |
```

**No se juzga por qué falló.** *"Estaba mal segmentado"* es una hipótesis de ② o de ⑧B, no un dato
de este departamento.

---

## Control de calidad de la Capa 1

- [ ] `oferta.csv` tiene **una fila por ítem** que el cliente vende, con las 8 columnas
- [ ] 🛑 **Toda fila tiene `fuente`** — ninguna quedó en blanco
- [ ] Todo `precio` y todo `costo` llevan **moneda**; el documento lleva **fecha de referencia**
- [ ] Los `peso_ingreso` **suman ~100 %**, o la diferencia está declarada
- [ ] Lo que es percepción está **etiquetado como percepción**, no promovido a dato
- [ ] Está escrito **qué se vende más y qué deja más**, y si no coinciden, dicho explícitamente
- [ ] La pregunta del **canal que se cae** está hecha y contestada
- [ ] **Lo que ya se intentó** está documentado, con fecha y resultado
- [ ] 🛑 **Ninguna línea juzga el precio, el margen ni el canal** — eso es de ② Estrategia
