---
name: ad-creativos
description: >
  Capa 2 de ⑩ Ads Management — elige qué piezas del ciclo se pautan y con qué variantes de hook,
  porque la pauta no testea creativos distintos sino hooks distintos sobre el mismo cuerpo.
  Verifica que todo claim esté validado por ②B Branding antes de que salga con dinero detrás y que haya
  suficientes variantes para que el test sirva. Úsala cuando pidan "qué anuncios corremos",
  "cuántas variantes", "este anuncio se quemó", "podemos decir esto en pauta". Cierra con el
  GATE 1, donde el CEO aprueba plan y presupuesto.
---

# Capa 2 · Creativos — qué corre y con qué variantes

| | |
|---|---|
| **Consume** | Los entregables de ⑥A Diseño gráfico y ⑦ Video Editing · los claims validados de ②B Branding · § La estructura |
| **Produce** | La sección **§ Los creativos** de `plan-de-pauta.md` |

## 1 · Se testean hooks, no creativos

🛑 **El error más caro de la pauta: cambiar todo el anuncio cuando no rinde.** Así nunca se
sabe qué falló.

**⑦ Video Editing produce variantes de hook sobre el mismo cuerpo.** Eso es lo que se testea.

| | |
|---|---|
| **Qué cambia entre variantes** | Solo los primeros 3 segundos |
| **Qué NO cambia** | El cuerpo, el CTA y la oferta |
| **Cuántas por campaña** | **Mínimo 3.** Con menos, el test no dice nada |

## 2 · El techo de variantes

**El techo de variantes por campaña es el que fija la ficha de oferta.** Si la ficha no lo fija,
se declara y se escala al CEO; no se inventa el número.

🛑 **Si hacen falta más, se pide a ⑦ Video Editing dentro del techo de la ficha** — no se pauta con menos de 3
por campaña.

## 3 · 🔴 Todo claim va validado

🛑 **Un claim sin validar, con dinero detrás, es un problema legal y de marca.**

| Antes de pautar | |
|---|---|
| ¿②B Branding lo marcó validado? | Si tiene `⏸️` **no sale** |
| ¿Hay número o comparación? | Necesita fuente |
| ¿Dice *«el mejor»*, *«el único»*? | 🛑 **Rechazado por defecto** |

> ⚠️ **Las plataformas rechazan anuncios por claims.** Un rechazo frena la campaña entera.

## 4 · Partir de lo que ya funciona en la categoría

| Qué se busca | Con qué |
|---|---|
| **Los anuncios de Meta de una página, con días corriendo** | **Apify `apify/facebook-ads-scraper`** — la fuente oficial. Reglas completas en `cr-fuentes` |
| Un anuncio de TikTok que ya rinde | AdWhispr `clone_tiktok_ad` |

> **Decisión del CEO · las dos capas.** No se mezclan en el mismo análisis:
> **competencia** se busca **solo en Guatemala** (`country=GT`), por página de cada competidor;
> **referencias ganadoras** salen de países parecidos a Guatemala, con la lista fija de
> `cr-fuentes`. Y **primero se descubre por keyword qué páginas lideran, después se scrapea por
> página** (`search_type=page` + `view_all_page_id=…`).

**Ganador = 60-90+ días corriendo.** El mismo criterio de `cr-swipe-file`, para que ① Strategy,
④ Creatividad y ⑩ Ads no midan con reglas distintas.

🛑 **Se adapta la estructura y el ángulo, nunca la pieza.** Y lo que viene de otro país se pasa a
quetzales y a la cultura local antes de usarlo. Copiar el creativo de un competidor es un problema
legal y además nos mete en su código visual — justo lo contrario de lo que ②B Branding construyó.

## 4B · El ranking de formatos de anuncio

**Qué formato se pauta primero.** Es el criterio para elegir entre las piezas que ya existen.

| Nivel | Formatos | Qué se hace |
|---|---|---|
| **S** | **Fundador a cámara** · **reels estáticos** | Primera opción de cada campaña |
| **A** | **Imágenes** · **carruseles** · **anuncios hechos con IA** | Segunda opción y complemento |
| **B** | **Testimonios** · **orgánicos usados como anuncio** · **creadores pagados** | Solo si ya existen; no se produce nada nuevo para ellos |
| **C** | **Memes** · **webinars largos** · **podcasts** · **videos de marca** | No se pautan de entrada. Entran si `ad-loop` muestra que en esa cuenta rinden |
| **F** | **Cualquier cosa sin subtítulos ni edición** | 🛑 **No sale.** Se devuelve a ⑦ Video Editing o ⑥A Diseño gráfico |

> ⚠️ **El ranking es un punto de partida, no un dato de nuestras cuentas.** Sale de una referencia
> externa `[sin verificar en cuentas de Inherent]`. **Lo que `ad-loop` mide en la cuenta del cliente
> manda sobre la tabla.**

- 🛑 **El techo manda:** pautar un nivel S no autoriza pedir grabación extra. **Se elige entre material que ya existe**;
  si falta un fundador a cámara, se le pide a ④ Creatividad para el próximo ciclo.
- **Los anuncios hechos con IA pasan por lo mismo:** claims validados por ②B Branding y la guía de marca.
- 🎬 **Los trial reels que ganaron** *(pasaron a seguidores)* **son los primeros candidatos a pauta**: ya probaron el hook con quien no nos conoce. Salen marcados de ⑨ Posting.
- **Cada pieza lleva su nivel** en la tabla de § Los creativos.

## 5 · Qué pieza va a qué campaña

| Temperatura | Qué pieza |
|---|---|
| **Frío** | La que explica el problema. `Unaware` · `Problem aware` |
| **Tibio** | La que explica **por qué esta forma y no otra** |
| **Caliente** | La prueba y la oferta |
| **Cliente** | Recompra y comunidad |

🛑 **Es el mismo vocabulario de ③ Marketing.** Si la pieza no trae temperatura, se devuelve.

## 6 · 🚦 GATE 1

**El CEO aprueba el plan completo y el presupuesto.**

🛑 **Después de este gate se gasta dinero del cliente.**

## 7 · Qué escribe

`## § Los creativos`:

| Bloque | Qué lleva |
|---|---|
| **A · Qué piezas van** | `id_creativo` · campaña · temperatura · **nivel del ranking** *(S · A · B · C)* |
| **B · Las variantes** | Cuántas por campaña, con su hook |
| **C · Claims** | Cuáles se usan, y quién los validó |
| **D · Qué se pidió a ⑦ Video Editing** | Si hizo falta más |

## 8 · Checklist

- [ ] **Mínimo 3 variantes de hook** por campaña
- [ ] Cada pieza tiene su **nivel del ranking**; **ninguna sin subtítulos ni edición** *(F)* y ninguna **C** sin dato propio que la respalde
- [ ] Las variantes cambian **solo los primeros 3 segundos**
- [ ] **Todo claim está validado por ②B Branding**
- [ ] Ninguna pieza clonó el **creativo** de un competidor
- [ ] Cada pieza va a la campaña de **su temperatura**
- [ ] El total está dentro del **techo de la ficha**
- [ ] **El CEO aprobó el GATE 1**
