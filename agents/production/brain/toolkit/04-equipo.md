# 04 · Equipo y técnica
`Capas 1-3 · columnas: equipo, tiempo_estimado_min`

**Qué decide.** Qué equipo pide cada `encuadre` heredado, y **cuánto tarda cada setup** — que es lo
que convierte una lista de escenas en una jornada real.

> 🛑 El equipo **se deriva del encuadre**, no se elige por gusto. El encuadre lo decidió ④
> Creatividad; acá solo se resuelve con qué se consigue.

---

## Del encuadre al equipo

| Encuadre pedido | Óptica típica | Soporte | Luz | Audio |
|---|---|---|---|---|
| **CU frontal fijo** (hablante) | 50-85 mm | Trípode | Key suave lateral + rebote | Solapa o boom |
| **Wide fijo** (contexto) | 24-35 mm | Trípode | Ambiente + relleno | Ambiente |
| **Inserto / detalle** | Macro o 50 mm | Trípode + columna | Rasante, controlada | Sin audio |
| **Cámara en mano** | 24-35 mm | Estabilizador o mano | Ambiente | Solapa |
| **Movimiento** (travelling, gimbal) | 24-35 mm | Gimbal o slider | Ambiente controlado | Sin audio directo |
| **Cenital** (mesa, producto) | 35-50 mm | Brazo o columna cenital | Difusa pareja | Sin audio |
| **Pantalla partida / captura** | N/A | N/A | N/A | N/A |

---

## Tiempos de setup — la tabla que arma la jornada

| Setup | Tiempo |
|---|---|
| Montaje inicial completo | 60-90 min |
| Cambio de óptica | 5 min |
| Reubicar cámara, mismo esquema de luz | 10-15 min |
| **Cambio de esquema de luz** | 30-45 min |
| Pasar a cenital | 30-40 min |
| Montar gimbal y equilibrar | 20-30 min |
| Cambio de locación (mismo edificio) | 30 min |
| Cambio de locación (traslado) | 60 min + viaje real |
| Desmontaje | 45 min |

🛑 **El cambio de esquema de luz es el que ordena el día.** Dentro de una jornada se agrupa por
setup de luz antes que por cualquier otra cosa.

---

## `duracion_s` ≠ `tiempo_estimado_min`

| Escena | `duracion_s` | `tiempo_estimado_min` | Por qué |
|---|---|---|---|
| CU hablante, 3 s | 3 | 45 | Montaje de audio, 4-6 tomas, revisión |
| Inserto de producto, 2 s | 2 | 25 | Luz rasante + reset entre tomas |
| Wide de contexto, 5 s | 5 | 15 | Una toma, dos de seguridad |

**Regla práctica de estimación inicial:** `tiempo_estimado_min ≈ setup + (tomas previstas × 4 min)`,
con mínimo de 15 min por escena. La Capa 7 corrige el número real.

---

## Audio — la que más se descubre tarde

| Situación | Qué se necesita |
|---|---|
| Alguien habla en cuadro | Solapa **y** respaldo de ambiente |
| Voz en off | Puede grabarse otro día, en otro lugar, más barato |
| Escena sin voz | Ambiente de referencia igual — sirve para sincronizar |

🛑 **El audio se verifica escuchándolo en set**, con auriculares. Nunca se asume porque el medidor
se mueve. Un audio roto no se arregla en post: se vuelve a grabar.

---

## Reglas duras

1. **El equipo se deriva del `encuadre`.** Si el encuadre pide algo que no tenemos, se devuelve a ④
   con alternativa, no se cambia el encuadre.
2. **Se agrupa por setup de luz** dentro de la jornada.
3. **Siempre se graba ambiente** en cada locación: 30 segundos, aunque la escena no tenga audio.
4. **Batería y tarjeta de respaldo** en toda jornada. No es opcional.
5. **Monitor externo** para toda escena con talento: sin él, el foco se descubre en la edición.
6. **Se prueba la primera escena completa antes de convocar al talento** — 15 min que salvan la
   jornada.

---

## Anti-patterns

| Error | Por qué falla | Qué hacer |
|---|---|---|
| Estimar tiempo de rodaje con `duracion_s` | Una escena de 3 s puede llevar 45 min | Usar `tiempo_estimado_min` |
| Ordenar la jornada por número de pieza | Se rearma la luz cinco veces | Ordenar por setup |
| Asumir el audio porque el medidor se mueve | El zumbido aparece en la edición | Escuchar con auriculares |
| Elegir lente por gusto | Cambia el encuadre que aprobó ④ | Derivar del `encuadre` |
| Sin ambiente grabado | No hay con qué rellenar cortes | 30 s por locación, siempre |
