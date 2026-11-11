---
name: ad-corrida
description: >
  Paso 2 de ⑧ Ads — la pauta corriendo: lanza lo aprobado en el GATE 1 con verificación final,
  lee pacing, fatiga y rendimiento, mueve una cosa a la vez (todo movimiento de presupuesto pasa
  por el GATE 2 del CEO), y mide qué ventas vinieron de la pauta con el modelo declarado, que es
  lo que habilita el performance fee en Growth Partnership. Úsala cuando pidan "lanzá", "no está
  rindiendo", "pausá esto", "subí el presupuesto", "se quemó el anuncio", "cuánto vendimos por
  pauta", "el fee de este mes", "el reporte de pauta".
---

# Paso 2 · Lanzar, optimizar y medir

| | |
|---|---|
| **Consume** | `plan-de-pauta.md` con GATE 1 aprobado por escrito |
| **Produce** | Campañas corriendo · el registro de cada cambio · `06-pauta/<AAAA-MM>/reporte-de-pauta.md` *(plantilla en `brain/entregables/`)* |

## 1 · Lanzar — acción que gasta y no se deshace

**Sin GATE 1 por escrito, no corre.** Antes de apretar:

| Verificación | Si falla |
|---|---|
| El tracking de la ficha funciona | 🛑 No se lanza |
| El presupuesto diario es el aprobado | Se corrige |
| El destino de cada anuncio abre y funciona | 🛑 Un destino roto convierte 0 % y gasta 100 % |
| Ningún claim `⏸️` · 3+ variantes por campaña | 🛑 No sale |

Se lanza con AdWhispr y **se registra qué quedó corriendo, con fecha.** Una campaña que nadie
registró es una que nadie va a pausar. Las primeras 48 h se mira que gaste y entregue, sin tocar.

## 2 · Optimizar — un cambio a la vez, con datos

- **Nunca antes de que haya datos suficientes**, y **un solo cambio a la vez.** Optimizar de más rompe
  lo que estaba aprendiendo.
- **Orden:** pausar la variante que pierde → rotar hook *(fatiga: CPM sube + CTR baja)* → ajustar
  público → presupuesto.
- 🔴 **Si la gente llega y no compra, el problema no es la pauta:** es oferta o conversión → ① Strategy.
- **Google:** términos de búsqueda y negativas *(no mueve presupuesto, se registra)*.
- 🚦 **GATE 2:** subir, bajar o mover presupuesto **necesita OK del CEO.** Pausar lo que gasta mal se
  hace y se avisa.
- **Cada cambio se registra:** qué, por qué, con qué dato y cuándo.

## 3 · Medir — la atribución

- **Se separa lo atribuible del tráfico que ya existía**, con ventana y modelo declarados.
- **La plataforma siempre reporta de más:** se cruza con las ventas reales del cliente.
- **CAC** = gasto ÷ clientes nuevos atribuidos. No se estima ni se completa con un promedio.
- 🛑 **Sin atribución limpia no hay performance fee** *(solo Growth Partnership)*, y **el fee nunca se
  estima.** Lo que no se puede medir va `⚠️ SIN DATOS`.

## 4 · El reporte

Hook ganador, público que rindió, cuánto duró cada creativo antes de fatigar, costo por resultado,
ventas atribuidas con su modelo. Lo lee `resultados` para el día 20.
