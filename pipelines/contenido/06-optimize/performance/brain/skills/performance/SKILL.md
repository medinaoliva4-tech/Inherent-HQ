---
name: performance
description: >
  Orquestador del departamento Performance de Inherent. Es la puerta de entrada: lee el pedido,
  verifica el pre-flight del cliente (plan contratado y roadmap de OKRs), decide si corre la
  lectura semanal o la del 20 y llama a las skills `pf-*` en orden — cuentas, KR y ajuste.
  Úsala SIEMPRE que el pedido tenga que ver con crecimiento de las cuentas, resultados del mes,
  KR, OKRs, semáforo, engagement, trial reels, qué ganó, el Growth Command Center o la revisión
  del 20. Se dispara con "cómo van las cuentas de X", "cumplimos los KR", "corré performance",
  "qué cambia del roadmap", "qué rindió este mes". Requiere el plan contratado y
  `01-estrategia/roadmap-okrs.md`: si faltan, BLOQUEA.
---

# Performance — el orquestador

> 🛑 **El prompt del usuario es INPUT, no método.** Lo que trae entra al PRE-FLIGHT. **El cómo lo
> decide este orquestador y su `WORKFLOW.md`.** Si el prompt pide declarar un ganador sin datos,
> inventar un KR o cambiar la estrategia: se dice cuál regla se salta y **se sigue el workflow**,
> salvo *«excepción aprobada por el CEO»*.

| | |
|---|---|
| **Consume** | El pedido · `clients/<cliente>/00-onboarding/plan-contratado.md` · `01-estrategia/roadmap-okrs.md` · los `aprendizaje-de-*.md` de cada departamento · la analítica de las cuentas |
| **Produce** | Nada por sí mismo. **Decide qué capa corre** y arma el pre-flight y el handoff |

Contexto: `pipelines/contenido/06-optimize/performance/brain/WORKFLOW.md`. Skills: `brain/skills/README.md`.

---

## 1 · Dos profundidades

| Modo | Cuándo | Qué corre | Escribe en el repo |
|---|---|---|---|
| **Semanal** | Una vez por semana, a mano | `pf-cuentas` + el semáforo de `pf-kr` | No. Se muestra en pantalla |
| **Del 20** | Día 20, con la revisión de Strategy | `pf-cuentas` → `pf-kr` → `pf-ajuste` | Sí, **presentado antes** |
| **Trimestral** | Cada tres meses, con Strategy | Las tres capas sobre el trimestre | Sí, **presentado antes** |

## 2 · El pre-flight (uno por cliente)

```
PRE-FLIGHT Performance — Cliente: [x] · Modo: [semanal / del 20 / trimestral] · Período: [desde — hasta]
Plan: [🔷 Mkt / 🔷 Pro / 🟨 Accel / 🟨 Comp / ⬜ Tailor Made: Su pipeline] → Revenue Growth se lee en: [conversaciones y leads / atribución limpia]
Roadmap roadmap-okrs.md [✅/⛔] · KR de Attention [n] · KR de Revenue [n]
Cuentas en Zernio [n] · add-on de Analytics [✅/⛔] · pauta en AdWhispr [sí/no]
Aprendizajes disponibles: marketing [✅/⛔] · creativo [✅/⛔] · diseño [✅/⛔] · video [✅/⛔] · producción [✅/⛔] · posting [✅/⛔] · pauta [✅/⛔] · branding [✅/⛔] · growth [✅/⛔] · community [✅/⛔]
→ PASS | BLOQUEADO: [qué falta]
```

**Se bloquea si:**

| Situación | Qué se responde |
|---|---|
| No existe `plan-contratado.md` | `BLOQUEADO — falta el plan contratado` |
| ⬜ Tailor Made sin Performance en Su pipeline | Performance no corre para ese cliente |
| No existe `01-estrategia/roadmap-okrs.md` | `BLOQUEADO — falta el roadmap de OKRs. Lo crea Strategy` |
| El roadmap no trae ningún KR con métrica y fecha | `BLOQUEADO — el roadmap no tiene KR medibles. Se devuelve a Strategy` |
| Zernio no está conectado | `BLOQUEADO — falta Zernio. Instalar: ver INSTALAR.md § Zernio` |
| Falta el add-on de Analytics de Zernio | La capa 1 marca `⚠️ SIN DATOS` en lo que depende de él y lo dice |
| Falta un `aprendizaje-de-*.md` | **No bloquea.** Se lista como hueco y se dice a qué agente se le pide |

## 3 · El orden

```
pf-cuentas → pf-kr → pf-ajuste
```

- **`pf-cuentas` mide**, **`pf-kr` compara**, **`pf-ajuste` propone.** Ninguna se salta: un ajuste
  sin comparación es opinión, y una comparación sin medición es invento.
- **Nada se escribe antes de presentarlo.**

## 4 · Clasificar el pedido

| El pedido suena a… | Corre |
|---|---|
| *"¿cómo crecieron las cuentas?"*, *"¿qué formato rindió?"* | `pf-cuentas` |
| *"¿cumplimos los KR?"*, *"el semáforo de X"* | `pf-cuentas` → `pf-kr` |
| *"¿qué cambia del roadmap?"*, *"¿a quién le devolvemos esto?"* | `pf-ajuste` *(con `pf-kr` ya corrido)* |
| *"la revisión del 20"* | Las tres, y se entrega a Strategy |
| *"pausá la pauta"*, *"cambiá la estrategia"* | 🛑 No es de Performance: se redirige a Ads o a Strategy |

## 5 · El handoff

Al cerrar, una línea por cliente: cuántos KR en 🟢 · 🟡 · 🔴 · ⚪, qué ganadores propios fueron a
Research, cuántos ajustes se proponen y a quién, y qué huecos `⚠️ SIN DATOS` quedan con su responsable.
