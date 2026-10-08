---
name: pf-cuentas
description: >
  Capa 1 de Performance — lee cada cuenta del cliente: crecimiento de seguidores, alcance y
  engagement por pieza, por formato y por pilar, el engagement de los trial reels y las mejores
  horas para publicar. Compara cada cuenta contra su propia mediana, nunca contra un promedio
  general, y marca SIN DATOS lo que la herramienta no entrega. Úsala cuando pidan "cómo crecieron
  las cuentas", "qué formato rindió", "cómo van los trial reels", "a qué hora publicamos",
  "cuántos seguidores ganamos", o como primer paso de la revisión del 20. No compara contra los KR:
  eso es la Capa 2.
---

# Capa 1 · Cuentas — qué pasó en cada una

| | |
|---|---|
| **Consume** | `plan-contratado.md` (las Redes) · `calendario-de-publicacion.csv` y `plan-de-contenido.csv` del ciclo *(para cruzar pieza, formato y pilar)* · la analítica de Zernio · el perfil de Instagram en Apify |
| **Produce** | La lectura de cada cuenta, que alimenta `pf-kr`. En el modo semanal se muestra en pantalla; **no se escribe en el repo** |

## 1 · Qué se lee, cuenta por cuenta

**Una cuenta a la vez.** Los números de dos cuentas no se mezclan, aunque compartan perfil en Zernio.

| Lectura | Qué se mide | Herramienta |
|---|---|---|
| **Crecimiento** | Seguidores al inicio y al final del período, ganancia neta y ritmo semanal | Zernio `accounts_get_follower_stats` ⬜ |
| **Alcance y distribución** | Alcance, vistas e impresiones por día | Zernio `analytics_get_daily_metrics` ⬜ |
| **Engagement por pieza** | Alcance, vistas, guardados, compartidos, comentarios, clics. **Se ordena por la métrica que manda el objetivo del slot** | Zernio `analytics_get_analytics` ⬜ |
| **Por formato** | Reel, carrusel, estático, story: la mediana de cada uno | `analytics_get_analytics` cruzado con el plan de contenido |
| **Por pilar** | La mediana de cada pilar del ciclo | `analytics_get_analytics` cruzado con el plan de contenido |
| **La mediana de la cuenta** | El umbral para llamar «ganador» a una pieza | Apify `easy_scraper/instagram-profile-engagement-analytics` ⬜ |
| **Trial reels** | Engagement de los trial reels frente a los reels normales | ⬜ sin probar: ver §3 |
| **Mejores horas** | Día y hora con más engagement | Zernio `analytics_get_best_time_to_post` ⬜ |
| **Pauta** *(si hay)* | Gasto, clics, conversiones y resultados del período | AdWhispr `get_account_performance` ⬜ |

## 2 · Cómo se lee

| Regla | Qué dice |
|---|---|
| **Pieza por pieza, luego agregado** | El promedio del ciclo esconde al ganador y al perdedor en el mismo número |
| **La métrica la manda el objetivo del slot** | Alcance se juzga por retención, guardados y compartidos; acción, por DMs y clics. **Nunca «likes» por default** |
| **Contra la propia cuenta** | Ganador = por encima de la mediana de esa cuenta, no de un promedio general |
| **Seguidores no es éxito** | Una cuenta que gana seguidores sin alcance relevante no cumple Attention Growth; se lee junto al alcance |
| **Horas en UTC** | `best_time_to_post` devuelve UTC: se convierte a la hora del cliente antes de proponerlas |
| **Ventana de datos** | Se declara el período leído. Las piezas recientes todavía acumulan: se marcan como «en curso» |

## 3 · Los trial reels

Los trial reels son reels que se muestran primero a no seguidores, para probar un gancho antes de
darlo a la audiencia.

- **No hay herramienta confirmada que entregue su engagement.** No se promete ni se estima.
- Mientras no se pruebe, la fila va así: `Trial reels — ⚠️ SIN DATOS: ninguna herramienta confirmada los expone`.
- Si una herramienta los devuelve, se compara su engagement contra los reels normales **de la
  misma cuenta** y se anota qué gancho pasó a la audiencia y con qué resultado.

## 4 · ⚠️ Cuando no se puede leer

| Situación | Qué se hace |
|---|---|
| Sin el add-on de Analytics de Zernio | `⚠️ SIN DATOS` en crecimiento, alcance diario y mejores horas. Se dice qué falta y se escala al COO |
| Una cuenta no está conectada a Zernio | Esa cuenta no se lee. Se dice cuál falta |
| La cuenta es de LinkedIn personal con piezas no publicadas por Zernio | Sin métricas de esas piezas. Se declara |
| Menos de 3 piezas de un formato | No hay mediana: `⚠️ SIN DATOS` en ese formato |
| La pieza no se puede cruzar con el plan de contenido | Se lee como pieza, sin pilar ni formato asignado, y se declara |

**Un dato que no se pudo leer nunca se rellena.** Un número inventado en esta capa contamina
el semáforo de la siguiente.

## 5 · Qué entrega a la Capa 2

| Bloque | Qué lleva |
|---|---|
| **A · Período y fuentes** | Fechas leídas, herramientas usadas |
| **B · Por cuenta** | Seguidores (inicio, fin, neto) · alcance · engagement · mediana |
| **C · Por formato y por pilar** | Mediana de cada uno, con el número de piezas |
| **D · Piezas por encima de la mediana** | Candidatas a ganador, con su métrica y su objetivo de slot |
| **E · Trial reels** | Los datos o `⚠️ SIN DATOS` |
| **F · Mejores horas** | Ya en la hora del cliente |
| **G · Los huecos** | `⚠️ SIN DATOS`, con responsable |

## 6 · Checklist

- [ ] Cada cuenta se leyó **por separado**, con su período declarado
- [ ] El engagement se leyó **pieza por pieza** y con la métrica del objetivo del slot
- [ ] La comparación es contra **la mediana de la propia cuenta**
- [ ] Los seguidores se leyeron **junto al alcance**
- [ ] Los trial reels están como `⚠️ SIN DATOS` si no hay herramienta probada
- [ ] Las horas están convertidas a la hora del cliente
- [ ] Ningún dato faltante se rellenó; cada hueco tiene responsable
