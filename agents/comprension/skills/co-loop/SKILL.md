---
name: co-loop
description: >
  Capa 6 de ① Comprensión — el cierre del ciclo. Revisa solo los datos que el ciclo puso a prueba: la
  capacidad declarada contra las jornadas reales que midió ⑤ Producción, el peso_ingreso declarado
  contra lo que efectivamente se vendió, el lenguaje literal contra lo que ④ Creatividad vio que
  funcionó, y los huecos que siguen abiertos. Corrige el documento con fuente nueva, anotando qué
  cambió y por qué. Escribe `aprendizaje-de-comprension.md`. Úsala cuando pidan "qué resultó falso",
  "cerrá el ciclo de comprensión", "actualizá la capacidad con lo del rodaje", "el cliente estaba
  equivocado en X", "revisá el documento con lo que pasó". Requiere un ciclo cerrado aguas abajo.
---

# Capa 6 · Loop — qué de lo que escribimos resultó falso

| | |
|---|---|
| **Consume** | `aprendizaje-de-produccion.md` de ⑤ (capacidad real medida, desvíos) · `aprendizaje-creativo.md` de ④ (qué lenguaje funcionó) · lo que vendió el cliente en el período · la tabla de huecos de `comprension.md` |
| **Produce** | **`aprendizaje-de-comprension.md`** — archivo de trabajo interno: no se entrega al cliente pero **sí se guarda** en su carpeta. Plantilla: `aprendizaje-de-comprension.md`, al lado de esta skill. Además **corrige** `comprension.md` y `oferta.csv` con fuente nueva |

Contexto del departamento: `agents/comprension/WORKFLOW.md`.

## 1 · Solo se revisa lo que el ciclo puso a prueba

🛑 **No se re-hace el documento.** Un ciclo no pone a prueba todo: pone a prueba cuatro cosas, y esas
cuatro son las que se revisan.

| # | Lectura | Contra qué se compara | De dónde sale el dato real |
|---|---|---|---|
| **1** | **Capacidad declarada** | Jornadas realmente ejecutadas | `aprendizaje-de-produccion.md` de ⑤ — `pr-loop` |
| **2** | **`peso_ingreso`** | Lo que efectivamente se vendió en el período | Reporte del cliente |
| **3** | **Lenguaje literal** | Qué hooks y qué palabras rindieron | `aprendizaje-creativo.md` de ④ — `cr-loop` |
| **4** | **Huecos abiertos** | ¿Llegaron? ¿Siguen pendientes? ¿Ya no importan? | La tabla de § Qué sabemos y qué falta |

**Lo que el ciclo no tocó, no se toca.** Un competidor que no cambió de precio no se vuelve a
revisar solo porque pasó un mes.

## 2 · Cómo se corrige — dato por dato, con fuente

🛑 **Un dato se reemplaza con otro dato, nunca con una impresión.** Y nunca en silencio:

```markdown
**Capacidad de producción** — 3 jornadas/mes → **1,5 jornadas/mes**
Fuente: `agents/production/clients/<cliente>/aprendizaje-de-produccion.md`, ciclo oct-2026.
Era: declarada por Ana el 2026-09. Ahora: medida sobre 2 jornadas ejecutadas.
```

| Dónde se corrige | Cómo |
|---|---|
| **Capacidad** | Se **agrega una fila** al historial de § La capacidad. 🛑 No se pisa el número anterior |
| **`oferta.csv`** | Se actualiza `peso_ingreso` y `fuente`, y se sube la marca de `[percepción]` a 🟢 si ahora hay reporte |
| **Lenguaje literal** | Se agregan las frases que ④ confirmó que rinden, con la marca 🟢 si vinieron de 3+ fuentes |
| **Huecos** | Los que llegaron pasan al documento con su fuente; los que no, **suben de prioridad** con la fecha del primer pedido |

## 3 · El hallazgo que vale — percepción desmentida

> **Un dato que el cliente afirmó y el ciclo desmintió es el hallazgo más valioso del departamento.**
> No es un error de nadie: es la diferencia entre lo que una empresa cree de sí misma y lo que hace.

Se escribe sin juicio, con las dos versiones y lo que se aprendió:

```
| Qué se creía            | Qué resultó      | Cómo se supo        | Qué cambia |
| Delivery = 60% ingreso  | 27%              | Reporte oct-2026    | ③ estaba pautando el canal equivocado |
| "Aprobamos en 24h"      | 6 días promedio  | 4 ciclos de ⑦       | El calendario de ③ necesita +5 días |
```

🛑 **Nunca se escribe *"el cliente se equivocó"*.** Se escribe qué se creía, qué resultó, y qué
cambia aguas abajo. La relación con el cliente vive de esa diferencia.

## 4 · Un hueco que lleva tres ciclos abierto ya no es un hueco

Es una **restricción**: nadie va a mandar ese dato. Se mueve a § La capacidad como restricción real y
se declara qué se pierde por no tenerlo, para que ② deje de esperarlo y trabaje con supuesto
declarado.

## 5 · Qué vuelve a las skills

Lo que se repite entre clientes deja de ser un dato de un cliente y **sube a la skill**:

| Si pasa esto | Va a |
|---|---|
| Una pregunta destapa siempre lo mismo y no estaba en la lista | Las *"6 que más se olvidan"* de `co-captura` |
| Un tipo de cliente sobreestima siempre el mismo número | La tabla de trampas de `co-negocio` |
| Una fuente de lenguaje literal rinde mejor que las otras | La tabla de fuentes de `co-cliente` |

---

## Control de calidad de la Capa 6

- [ ] Se revisaron **solo las cuatro lecturas** — no se re-hizo el documento entero
- [ ] La capacidad se corrigió **agregando fila**, sin pisar el histórico
- [ ] 🛑 **Toda corrección tiene fuente nueva citada con ruta y fecha** — ninguna impresión
- [ ] Las percepciones desmentidas están escritas con **qué se creía / qué resultó / qué cambia**
- [ ] 🛑 **En ningún lado dice que el cliente se equivocó**
- [ ] Los huecos de 3+ ciclos se movieron a **restricción**, con qué se pierde
- [ ] `oferta.csv` quedó con las marcas actualizadas donde ahora hay reporte
- [ ] Lo que se repite entre clientes se **propuso subir a la skill** que corresponde
