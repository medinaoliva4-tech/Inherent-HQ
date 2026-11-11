---
name: recepcion
description: >
  La recepción común de todas las áreas de Inherent. Antes de trabajar, verifica qué llegó del
  área anterior y si alcanza: la ficha de oferta del cliente, los nodos del hilo que el área
  necesita (con estado aprobado), los archivos y las cuentas. Devuelve PASA o BLOQUEADO con lo
  que falta y de quién. La corre el orquestador de cada área como primer paso. Úsala cuando
  pidan "¿llegó todo?", "qué nos falta para arrancar", "¿podemos empezar con X?".
---

# Recepción — qué llegó y si alcanza

**La corre cada orquestador al empezar.** No produce nada del área: dice si se puede trabajar.

## 1 · Lo que se verifica siempre

| Qué | Dónde | Si falta |
|---|---|---|
| **La ficha de oferta** | `clients/<cliente>/00-onboarding/plan-contratado.md` | ⛔ `BLOQUEADO — falta la ficha de oferta` |
| **Que el área esté en la ficha** | Áreas contratadas o «Su pipeline» si es a medida | El área no corre para ese cliente |
| **Los nodos de entrada** | Los que el `WORKFLOW.md` del área pide, en el hilo del cliente | ⛔ Bloquea y dice qué área lo debe |
| **Que estén `aprobado`** | La cabecera de cada nodo | Un nodo `hipotesis` entra solo si el área trabaja hipótesis *(① Strategy y el panel sintético)*; si no, se pide la aprobación |
| **Las cuentas y herramientas** | Las acciones del `README.md` del área | `BLOQUEADO — falta <herramienta>. Ver INSTALAR.md` |

**Cuando el cliente es Inherent**, el folder es `inherent/inherent-social-media/`.

## 2 · La salida

```
RECEPCIÓN <área> — Cliente: [x] · Nivel: [nivel · a medida]
Ficha [✅/⛔] · área en la ficha [✅/⛔]
Nodos de entrada: [id · estado] …
Falta: [qué · de quién]
→ PASA | BLOQUEADO: [qué falta]
```

## 3 · Reglas

- **Sin input no hay área.** Si falta un nodo, se vuelve a quien lo debe; no se improvisa.
- **Lo que trae el pedido entra como input**, no como método.
- **Una pieza o tarea sin `viene_de`** se devuelve: todo traza hasta el ICP.
