---
name: ve-derivadas
description: >
  Capa 3 de ⑥B Video Editing — multiplica el corte principal aprobado en todas las piezas que
  puede dar: cortes más cortos, variantes de hook para pauta, reencuadres por formato y
  fragmentos para story. Es donde el modelo gana margen, porque cada derivada cuesta Q0 marginal
  sobre horas de grabación ya pagadas. Úsala cuando pidan "sacá las derivadas", "multiplicá
  esto", "variantes para pauta", "cortalo para story", "cuántas piezas salen de esto". Requiere
  el GATE 1 aprobado: derivar de un corte no aprobado multiplica el error.
---

# Capa 3 · Derivadas — multiplicar a Q0 marginal

| | |
|---|---|
| **Consume** | El corte principal **con GATE 1** · `plan-de-contenido.csv` · `plan-por-canal.md` |
| **Produce** | Las **10 · 20 · 30** piezas derivadas del ciclo |

> 🔑 **Acá está el margen del modelo.** ⑤ Producción cuesta horas humanas; cada derivada cuesta
> Q0. **Entregar menos derivadas no ahorra: desperdicia grabación pagada.**

## 1 · Los cuatro tipos de derivada

| Tipo | Qué es | Para qué |
|---|---|---|
| **Corte corto** | La misma pieza en menos tiempo | Plataformas con menos paciencia |
| **Variante de hook** | **Mismo cuerpo, otro arranque** | Pauta: es lo que ⑩ Ads testea |
| **Reencuadre** | El mismo corte en otra relación de aspecto | Publicar en varios formatos |
| **Fragmento** | Un momento suelto que se sostiene solo | Story, teaser |

## 2 · Las variantes de hook son las que más valen

**⑩ Ads no testea creativos distintos: testea hooks distintos sobre el mismo cuerpo.**

| | |
|---|---|
| **Cuántas** | 2 o 3 por pieza que vaya a pauta |
| **De dónde salen** | De las **7 cajas de hook** que ④ maneja en `cr-hook-copy` |
| **Qué cambia** | Solo los primeros 3 segundos |
| **Qué NO cambia** | El cuerpo, el CTA y la traza a la MUST BE TRUE |

🛑 **Una variante que cambia el mensaje no es una variante: es otra pieza**, y ④ la tiene que
dirigir.

## 3 · El reencuadre no es recortar

| | Regla |
|---|---|
| **El sujeto queda en el encuadre** | Un reencuadre automático que corta la cara no sirve |
| **El texto se reposiciona** | Las safe zones cambian con el formato |
| **Se revisa pieza por pieza** | `reframe` acelera, **no aprueba** |

> ⚠️ **Higgsfield `reframe` y el workflow `ad-multiplier` hacen el trabajo pesado**, pero cada
> salida se mira antes de entregarla. `⬜` sin probar en cliente real.

## 4 · El reparto del techo

**Las derivadas del plan se reparten donde más rinden, no parejo.**

| Prioridad | Dónde |
|---|---|
| **1** | Variantes de hook de las piezas que van a **pauta** |
| **2** | Reencuadres de las piezas que van a **más de una plataforma** |
| **3** | Fragmentos para **story** |
| **4** | Cortes cortos |

🛑 **Si no alcanza el techo para todo, se corta por el final de la lista y se declara.**

## 5 · El segundo idioma — solo 🟨 Compound

**Higgsfield `dubbing`.** No entra en Ignite ni Accelerate: **prometerlo ahí rompe el margen.**

## 6 · Cada derivada hereda

| | De dónde |
|---|---|
| El `id_creativo` | Del corte principal, **más su sufijo de variante** |
| La traza a la MUST BE TRUE | Igual que el principal |
| Los activos de marca | Ya están en el corte principal. **Se verifica que sobrevivan al reencuadre** |

## 7 · Checklist

- [ ] Se derivó del corte **con GATE 1 aprobado**
- [ ] Las variantes de hook cambian **solo los primeros 3 segundos**
- [ ] Ninguna variante cambia el mensaje ni la traza
- [ ] Cada reencuadre **se miró**, no solo se procesó
- [ ] El texto se reposicionó según la safe zone del nuevo formato
- [ ] El total **entra en el techo** del plan
- [ ] Lo que no se alcanzó a derivar está **declarado**
- [ ] Segundo idioma **solo si es Compound**
