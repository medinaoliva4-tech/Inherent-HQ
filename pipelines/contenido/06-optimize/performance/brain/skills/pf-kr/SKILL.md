---
name: pf-kr
description: >
  Capa 2 de Performance — compara lo medido contra los KR del roadmap de OKRs, en los dos
  objetivos: Attention Growth (alcance, distribución, reconocimiento, audiencia relevante,
  autoridad) y Revenue Growth (leads, oportunidades comerciales, conversión, clientes e ingresos
  atribuibles). Da un semáforo por KR y, sin dato, no da veredicto. En la línea Marketing lee
  Revenue Growth en conversaciones y leads, sin prometer facturación. Escribe `lectura-de-kr.md`.
  Úsala cuando pidan "cumplimos los KR", "el semáforo de X", "cómo vamos contra el roadmap",
  "qué KR está en rojo", "la revisión del 20". Requiere `roadmap-okrs.md` y la Capa 1.
---

# Capa 2 · KR — qué prometía el roadmap y qué pasó

| | |
|---|---|
| **Consume** | `clients/<cliente>/01-estrategia/roadmap-okrs.md` · la lectura de `pf-cuentas` · `reporte-de-pauta.md` y su § Atribución *(línea Growth)* · el seguimiento de Community *(conversaciones)* |
| **Produce** | **`clients/<cliente>/01-estrategia/revisiones-del-20/<AAAA-MM>/lectura-de-kr.md`** — trabajo interno, no se entrega al cliente pero **sí se guarda** |

🛑 **Sin `roadmap-okrs.md`, esta capa no corre:** `BLOQUEADO — falta el roadmap de OKRs. Lo crea Strategy`.

## 1 · Los dos objetivos

El roadmap de Strategy tiene dos objetivos con métricas distintas. **Los KR cuelgan de las MUST BE
TRUE**: la MUST BE TRUE es la pregunta inicial, el deseo; el KR es cómo se sabe que se cumple.

| Objetivo | Qué cubre | De dónde sale el dato |
|---|---|---|
| **Attention Growth** | Alcance · distribución · reconocimiento · audiencia relevante · autoridad | `pf-cuentas` |
| **Revenue Growth** | Leads · oportunidades comerciales · conversión · clientes e ingresos atribuibles | Ads, Community y el cliente |

## 2 · Qué se puede leer según el plan

🔒 **La atribución de ventas solo es honesta donde hay atribución limpia.**

| Plan | Revenue Growth se lee en | Qué NO se hace |
|---|---|---|
| 🔷 **Marketing · Pro** | **Conversaciones y leads:** mensajes que llegaron, clics al WhatsApp, formularios | No se calculan ventas ni ingresos. No se promete facturación |
| 🟨 **Accelerate · Compound** | Lo anterior **más** ventas atribuidas con el modelo y la ventana de `ad-atribucion` | No se estima. Si el cliente no comparte sus ventas, `⚠️ SIN DATOS` y se escala al CEO |
| ⬜ **Tailor Made** | Lo que declara Su pipeline | Lo que no declara no se lee |

Un KR de Revenue Growth con meta en ingresos, en una cuenta de la línea Marketing, **no se compara**:
se marca `⚪ fuera de lo que el plan puede medir` y se devuelve a Strategy como dato.

## 3 · El método

Por cada KR del roadmap:

| Paso | Qué se hace |
|---|---|
| **1** | Se copia el KR tal cual: objetivo, MUST BE TRUE de la que cuelga, métrica, meta y fecha |
| **2** | Se toma el valor medido en el período, con su fuente y su ventana |
| **3** | Se calcula el ritmo: cuánto debería llevar a esta altura según su meta y su fecha |
| **4** | Se compara y se asigna el semáforo |
| **5** | Se anota qué lo movió *(pieza, formato, pilar, canal)* si hay evidencia; si no, se dice que no se sabe |

| Semáforo | Criterio |
|---|---|
| 🟢 | En ritmo o cumplido |
| 🟡 | Por debajo del ritmo, recuperable en el período que queda |
| 🔴 | No se cumple con el ritmo actual |
| ⚪ | `⚠️ SIN DATOS`: **no hay veredicto** |

🛑 **Sin dato no hay semáforo.** No se pinta amarillo «por prudencia» ni verde «por tendencia».

## 4 · Reglas de lectura

| Regla | Qué dice |
|---|---|
| **Un KR, una métrica** | La que el roadmap declaró. No se reemplaza por otra que dé mejor número |
| **Seguidores no cumple Attention solo** | Un KR de audiencia relevante o alcance se lee con alcance y calidad, no con el conteo de seguidores |
| **Se declara el modelo** | Toda cifra de Revenue Growth lleva fuente, ventana y modelo |
| **El número del cliente manda** | Si la plataforma y el cliente no coinciden, vale el del cliente y la diferencia se declara |
| **Un período corto no hace tendencia** | Con menos de dos lecturas del KR se dice «primera lectura» y no se concluye |
| **Causa no es correlación** | Si dos cosas cambiaron a la vez, se declara que no se puede atribuir |

## 5 · ⚠️ Cuando no se puede leer

| Situación | Qué se hace |
|---|---|
| El KR no tiene meta o fecha | ⚪ y se devuelve a Strategy: un KR sin meta no se puede comparar |
| La herramienta no entrega esa métrica *(por ejemplo, trial reels)* | ⚪ `⚠️ SIN DATOS`, con qué habría que probar |
| El cliente no comparte ventas o leads | 🔴 Se escala: precio y alcance al CEO, lo demás al COO. ⚪ en el KR |
| La venta cierra por WhatsApp sin rastro | No se atribuye. Se lee solo como conversación |

## 6 · Qué escribe

`lectura-de-kr.md`:

| Bloque | Qué lleva |
|---|---|
| **A · El período y el plan** | Fechas, plan, qué se puede leer de Revenue Growth |
| **B · Attention Growth** | Tabla: KR · MUST BE TRUE · meta · medido · fuente · semáforo · qué lo movió |
| **C · Revenue Growth** | La misma tabla, con el modelo y la ventana declarados |
| **D · Resumen** | Cuántos KR en 🟢 · 🟡 · 🔴 · ⚪ |
| **E · Los huecos** | `⚠️ SIN DATOS`, con responsable |

🛑 **Al cerrar el ciclo, la lectura anterior no se sobrescribe:** cada mes tiene su carpeta.

## 7 · Checklist

- [ ] Existe `roadmap-okrs.md` y cada KR se copió **tal cual**, con la MUST BE TRUE de la que cuelga
- [ ] Cada KR tiene **semáforo o `⚠️ SIN DATOS`**, nunca un color sin dato
- [ ] Cada cifra lleva **fuente y período**
- [ ] Revenue Growth en 🔷 se leyó en **conversaciones y leads**, sin facturación
- [ ] En 🟨 las ventas atribuidas traen **modelo y ventana**, y el número es el del cliente
- [ ] El KR se juzgó con **su propia métrica**, no con una más favorable
- [ ] Los huecos tienen **responsable**
- [ ] Se presentó antes de escribir el archivo
