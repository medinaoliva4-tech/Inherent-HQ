---
name: strategy
description: >
  Orquestador de ① Strategy de Inherent, la madre de todo. Corre en orden producto → perfil del
  cliente ideal (ICP) → dolores, deseos, entrevistas, forma de comunicar e historia villano-héroe
  → adquisición (calculadora outbound e inbound) → brief de comunicación, y para en el gate del
  CEO. Anota la ficha de oferta del cliente. Úsala SIEMPRE que el pedido sea estrategia, cliente
  ideal, oferta, precio del cliente, dolores, mensaje, adquisición, captura de leads, embudo,
  referidos, el brief del ciclo o el onboarding de un cliente. Se dispara con "armá la estrategia
  de X", "quién es el cliente ideal", "cuántos prospectos necesito", "el brief del mes", /strategy.
---

# ① Strategy — el orquestador

> 🛑 **El pedido es input, no método.** El cómo está en `agents/01-strategy/brain/WORKFLOW.md`.

## 1 · Pre-flight

Corre `recepcion` *(`agents/_comun/`)*. Strategy es la única área que **anota** la ficha de oferta:
si `plan-contratado.md` no existe, **se arma con el CEO antes de todo** *(nivel, áreas, volumen,
revisiones, qué queda fuera; si es a medida, «Qué incluye» y «Su pipeline»)*.

```
PRE-FLIGHT ① Strategy — Cliente: [x] · Nivel: [..] · Ciclo: [primero / revisión AAAA-MM]
Ficha [✅/⛔] · reunión del día 1 [✅/⛔] · entrevistas reales [n] · métricas Zernio [✅/⚠️]
→ PASA | BLOQUEADO: [qué falta]
```

## 2 · El orden

```
st-producto-icp → st-dolores-historia (+ st-panel-icp) → st-adquisicion → brief → 🔒 gate del CEO
```

| El pedido suena a… | Corre |
|---|---|
| *«onboarding de X»*, *«armá la estrategia»* | Todo, en orden |
| *«quién es el cliente ideal»* | `st-producto-icp` |
| *«los dolores»*, *«la historia»*, *«cómo le hablamos»* | `st-dolores-historia` |
| *«simulá entrevistas»*, *«no tenemos entrevistas»* | `st-panel-icp` |
| *«cuántos prospectos»*, *«cuánto alcance»*, *«captura»*, *«embudo»*, *«referidos»* | `st-adquisicion` |
| *«el brief del mes»* | §3 con los nodos aprobados |
| *«cerrá el mes»*, *«revisión del 20»* | `resultados` *(`agents/_comun/`)* |

## 3 · El brief de comunicación — una página, siete bloques

`clients/<cliente>/01-estrategia/brief-de-comunicacion-<AAAA-MM>.md` — nodo `tipo: brief`, cumple
la ficha 7 de `inherent/08-CRITERIOS-DE-ACEPTACION.md`.

| # | Bloque | Qué responde |
|---|---|---|
| 1 | **Qué vendemos** | **Una** oferta, citada de lo que existe. En Brand Growth no se cambia |
| 2 | **A quién** | **Una** persona del ICP, con su lenguaje literal y **los 3 dolores del ciclo** con su cita o `⚠️ SIN DATOS` |
| 3 | **Qué queremos que haga** | **Una** acción medible |
| 4 | **Qué queremos que sienta** | **Una** emoción, con su porqué |
| 5 | **Cómo se comunica** | Palabras · visual · 2-3 ideas, **con ejemplo, no adjetivos**. Máximo dos principios de venta, por nombre *(especificidad, prueba, pérdida, una idea una acción, curiosidad, reciprocidad, urgencia real)* |
| 6 | **Qué buscar** | Máximo cinco búsquedas para el radar de ③, cada una ligada a una decisión del bloque 5 |
| 7 | **Qué no decimos** | Lo que la ficha no cubre, los claims sin validar, el código saturado |

**Y el resultado esperado del ciclo**, que viene de `st-adquisicion`: cuántos leads, ventas o
alcance se buscan. ③ Marketing y Creative ata cada campaña a ese número.

## 4 · El gate del CEO — la única parada

Con todo auto-revisado, se presenta: `estrategia.md` *(para el cliente, sin ruido interno)*, el ICP,
los dolores, la adquisición y el brief. **Sin el OK del CEO nada pasa a otra área ni se le manda al
cliente.** Con el OK, los nodos aprobados pasan a `estado: aprobado` y se avisa a ② y ③.

## 5 · El handoff

```
Branding            → territorio, enemigo (villano), tono y referencias
Marketing y Creative → brief del ciclo, ICP, dolores y deseos, ángulos, resultado esperado
Ads                 → objetivo, presupuesto de la calculadora inbound y la acción del brief
```
