# Planificador por deadline · diseño corto

**Problema.** Los créditos son finitos (Cline Pass por ventanas, NVIDIA inestable) y cada tarea del OS tiene deadline. Hay que repartirlos para que cada entrega llegue a tiempo sin quemar dinero.

**Módulo.** `code-os/planificador/planificador.mjs` (puro: sin red ni disco) + `capacidad.mjs` (puente con el medidor de `code-os/cuotas/`). Tests: `node --test code-os/planificador/test/ code-os/cuotas/test/`.

## Entrada
- `trabajos[]`: `{id, titulo, deadline, partes:[{nivel: alto|medio|bajo, llamadas, repetitivo?, nombre?}]}`. La estimación es en **llamadas** por nivel.
- `capacidad(nivel, desde, hasta)`: llamadas sin pago por token que caben en ese intervalo. `capacidadDesdeMedidor` la calcula como `restante hoy + tope × reinicios hasta el deadline`, tomando el mínimo entre las ventanas de cada proveedor (5h/semana/mes en Cline, día UTC en NVIDIA).
- `aprobaciones[idTrabajo] = {usd}`: gasto por token ya aprobado por el CEO.

## Reglas
1. **Orden por deadline (EDF).** Los trabajos se reservan del más cercano al más lejano; cada uno resta de la bolsa común lo que reserva, así dos entregas no cuentan el mismo cupo dos veces.
2. **Reserva = estimación × 1.2** (colchón del 20 %).
3. **Bajar de nivel lo repetitivo.** Si en un nivel falta cupo, las partes marcadas `repetitivo` (las más grandes primero) pasan alto → medio → bajo. Lo no repetitivo no se baja: requiere calidad.
4. **Aviso temprano.** Si tras bajar sigue sin alcanzar, se emite aviso (`advertencia`; `critico` si quedan < 2 días) con lo que falta y los días restantes. También un aviso `info` cuando se bajó de nivel. El OS debe correr el plan de forma periódica para avisar con tiempo, no el día del deadline.
5. **Nada se gasta sin aprobación.** Lo que solo se cubre con pago por token (DeepSeek/frontier) no se asigna: sale en `aprobaciones_pendientes` con el costo estimado. Solo si `aprobaciones[id].usd` lo cubre pasa a `pago`. `nivel-bajo-pago` en LiteLLM no es fallback de nada, así que tampoco hay gasto accidental por la vía técnica.
6. **Estados:** `ok`, `justo` (usa ≥ 80 % de lo disponible), `requiere_aprobacion`, `no_alcanza` (deadline vencido).

## Supuestos a calibrar
- Cline Pass no publica números: `SUPUESTOS_LLAMADAS.cline` (120/5h, 1,500/semana, 5,000/mes) y NVIDIA (1,000/día) son **estimaciones**. Cuando el medidor vea un 429 de Cline, hay que ajustarlos al conteo real de esa ventana.
- `COSTO_LLAMADA_USD` (alto 0.06, medio 0.01, bajo 0.003) es un supuesto hasta tener facturación real.
- Las estimaciones de llamadas por tarea las pone quien crea la tarea (o el nivel alto al planearla).

## Fuera de alcance (siguiente paso)
Conectar el plan a las tareas reales del OS (ceo-os) y mostrar los avisos en la interfaz; hoy el módulo entrega estructuras listas para eso.
