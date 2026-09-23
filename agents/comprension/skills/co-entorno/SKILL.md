---
name: co-entorno
description: >
  Capa 3 de ① Comprensión — el mapa del entorno, no el análisis. Lista los 5-8 competidores que el
  comprador realmente considera (no los del mismo rubro) con qué venden, a cuánto, dónde están y en
  qué canales se los ve, y deja lo que sea verdad del mercado con fuente. Escribe la sección § El
  entorno de `comprension.md`. Úsala cuando pidan "quiénes son la competencia de X", "cuánto cobran
  los demás", "con quién compite", "cómo está el mercado". 🛑 Se para en el mapa: leer sus ads,
  extraer hooks y medir saturación es `st-ingenieria-inversa` de ② Estrategia, y duplicarlo acá hace
  el trabajo dos veces con menos método.
---

# Capa 3 · Entorno — quién más está y qué cobra

| | |
|---|---|
| **Consume** | La § Qué sabemos y qué falta de `comprension.md` · lo que conteste el cliente sobre con quién lo comparan · búsqueda pública acotada |
| **Produce** | La sección **§ El entorno** de `comprension.md`: la tabla de 5-8 competidores y la tabla de lo que es verdad del mercado |

Contexto del departamento: `agents/comprension/WORKFLOW.md`. Plantilla del entregable:
`agents/comprension/entregables/comprension.md`.

## 1 · 🛑 Dónde se para esta capa

| ① Comprensión hace | ② Estrategia hace |
|---|---|
| **El mapa**: quiénes son, qué venden, a cuánto, dónde | **La ingeniería inversa**: sus ads, sus hooks, su ritmo, la tabla 15×7, el mapa de saturación |
| Sale de preguntar y de mirar 20 minutos | Sale de `st-ingenieria-inversa`, con método y evidencia estructurada |

> 🛑 **En el momento en que aparece *"y por eso su anuncio funciona"*, el trabajo se metió en ②** — y
> se está haciendo dos veces, con menos método. Acá alcanza con: existe, vende esto, cobra esto,
> está acá, se lo ve en estos canales.

## 2 · Quién es competidor de verdad

**El criterio es el del comprador, no el del rubro.** No es competidor quien hace lo mismo: es quien
**se lleva la misma decisión de compra**.

La pregunta que lo resuelve:

> *"Cuando un cliente decide no venir, ¿a dónde va en su lugar?"*

Esa respuesta suele traer competidores que no están en el rubro: la cafetería compite con quedarse en
la oficina; el gimnasio, con no ir a ninguno. **Si aparece «no hace nada» como alternativa real, se
escribe igual** — es información que ② usa.

**5 a 8.** Menos de 5 y el mapa no muestra el rango de precios; más de 8 y se está haciendo ②.

## 3 · La tabla

```
| Quién | Qué vende | Precio | Dónde está | Dónde se lo ve | Fuente |
```

| Columna | Qué lleva | Cómo se consigue |
|---|---|---|
| `Quién` | El nombre como lo dice el comprador | Del cliente |
| `Qué vende` | En una línea, sin adjetivos | Su web, su perfil o el menú |
| `Precio` | Con moneda, y el rango si varía | 🛑 **Del sitio público, no estimado** |
| `Dónde está` | Zona, o "solo online" | Maps |
| `Dónde se lo ve` | Los canales donde tiene presencia activa | Búsqueda directa de sus perfiles |
| `Fuente` | 🛑 Obligatoria, con fecha | — |

**Herramientas, cuando el dato no lo tiene el cliente:**

| Para | Herramienta |
|---|---|
| Precios y propuesta pública | `mcp__Firecrawl__firecrawl_search` sobre el nombre + web del competidor |
| Qué perfiles tiene activos | Búsqueda directa; o `mcp__Eden__eden_resolve_creator` si hay que confirmar una cuenta |

🛑 **Un precio que no se pudo leer va `⚠️ SIN DATOS`, nunca estimado.** Un rango inventado acá se
convierte en el argumento de precio de ② un mes después.

## 4 · Lo que es verdad del mercado

Solo lo que tenga fuente y sea **verificable**. Tres o cuatro afirmaciones, no un informe.

```
| Afirmación                                        | Fuente                  | Marca |
| No hay delivery de desayuno antes de las 7 en zona| Revisión de 6 apps, oct | 🟢    |
| El rubro subió precios ~15% en el año             | dicho por Ana           | 🟡    |
```

🛑 **Nunca una tendencia sin fuente.** *"El video corto está creciendo"* no entra: o se cita, o no va.
Un modelo sin acceso a los datos no dice *"no sé"* — rellena, y eso es exactamente lo que este
departamento existe para evitar.

---

## Control de calidad de la Capa 3

- [ ] Hay entre **5 y 8 competidores**, elegidos por el criterio del **comprador**, no del rubro
- [ ] Se preguntó *"si no viene acá, ¿a dónde va?"* y la respuesta está reflejada
- [ ] Si «no hacer nada» es una alternativa real del comprador, **está escrita**
- [ ] Todo `Precio` sale de una **fuente pública con fecha**, o va `⚠️ SIN DATOS` — ninguno estimado
- [ ] Toda afirmación de mercado tiene **fuente** y su marca 🟢/🟡
- [ ] 🛑 **Ninguna línea explica por qué a un competidor le funciona algo** — eso es `st-ingenieria-inversa` de ②
- [ ] 🛑 **No se leyó ni se analizó un solo anuncio** en esta capa
