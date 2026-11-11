---
name: mc-campanas-piezas
description: >
  Paso 3 de ③ Marketing y Creative — campañas, ideas y piezas con el copy íntegro. Cada campaña se
  ata al resultado esperado que viene de ① Strategy, se baja a ideas por celda del tablero pilares
  × ángulos, y cada idea a piezas con hook literal (7 cajas, por nivel de conciencia), guion por
  tramo, copy, CTA, escenas y formato, listas para Producción y Diseño. Úsala cuando pidan "la
  campaña del mes", "ideas", "hooks", "escribí el copy", "el guion del reel", "la story",
  "el carrusel", "el calendario", "el plan de contenido".
---

# Paso 3 · Campañas → ideas → piezas

| | |
|---|---|
| **Consume** | El tablero pilares × ángulos · el radar · el brief *(con el resultado esperado)* · la voz de ② Branding |
| **Produce** | `clients/<cliente>/04-contenido/<AAAA-MM>/ideas/` — nodos `campana-NN` y `pieza-NN`, cada pieza con `viene_de: [campana-…, pilar-…, angulo-…]` |
| **Herramienta** | Campañas del OS: copy íntegro ↔ ideas ↔ piezas ↔ resultado esperado |

## 1 · La campaña — una por ciclo, dos si se justifica

```
campana-01 · <la idea en una frase que cualquiera del equipo pueda repetir>
Resultado esperado: <el número de st-adquisicion: leads, ventas, alcance> · cómo se mide
Copy íntegro: <el mensaje madre, completo, del que salen todos los copies>
Pilares × ángulos que activa · fechas · canales
```

🛑 **Una campaña sin resultado esperado no se arma.** Ese número es el que `resultados` lee el día 20.

## 2 · Las ideas — por celda

Por cada celda activa del tablero, **2-3 ideas** con el formato que pide su canal. Se elige con el
radar: lo que ya ganó pesa más. Reparto guía: **70 % probado · 20 % variación · 10 % apuesta.**

## 3 · La pieza — todo literal, nada descrito

| Campo | Regla |
|---|---|
| **Hook** | **Literal, entre comillas**, de una de las 7 cajas: pattern interrupt · lista/número · curiosity gap · pregunta · dolor · bold claim · story/tease. **Sin saludo:** el segundo 1 es el hook. No se repite la misma caja todo el ciclo |
| **Nivel de conciencia** | Decide de qué habla el hook: 1 síntoma · 2 problema · 3 solución · 4 por qué tú · 5 la acción |
| **Frame 1 visual** | Qué se ve antes del texto |
| **Guion** *(lo que se dice)* | Por tramo y con tiempo: HOOK 0-3 s · BODY · PAYOFF · CTA. `N/A — formato estático` si no lleva voz |
| **Copy** *(lo que se ve)* | Texto en pantalla y pie. Nunca vacío. Lenguaje literal del comprador |
| **CTA** | **Una idea, una acción**, de la familia de su etapa *(TOF seguir/guardar · MOF escribir/comentar · BOF reservar/comprar)* |
| **Historia** | El cliente es el héroe, se ataca su problema interno |
| **Escenas y formato** | Escena por escena: acción, encuadre, duración y lugar · medidas del canal · `material: video / foto / ninguno` |
| **Hooks alternos** | 2-3 variantes del hook para pauta y prueba *(solo cambian los primeros 3 s)* |

- Todo gap o tease **se cierra en la misma pieza.**
- Todo claim, precio o promesa va `⏸️ PENDIENTE APROBACIÓN` y lo valida `br-guardian`.
- **Reel:** 9:16, hook en 2-3 s. **Carrusel:** slide 1 = hook y se entiende sola; 2-4 body; última
  payoff + CTA. **Story:** un objetivo, una interacción nativa, ≤ 15 s por frame, nada en la zona
  del dedo.

## 4 · El calendario

Cada pieza con su semana y día. **El total cabe en el techo de la ficha.** La hora y la cuenta las
pone ⑦ Posting.

## 5 · Antes de cerrar

- [ ] Cada campaña tiene resultado esperado y copy íntegro
- [ ] Cada pieza tiene `viene_de` hasta un pilar y un ángulo *(y por ahí hasta el ICP)*
- [ ] Guiones y piezas cumplen las fichas 1 a 4 de `inherent/08-CRITERIOS-DE-ACEPTACION.md`
- [ ] Ningún hook ni formato está en lo quemado del radar
