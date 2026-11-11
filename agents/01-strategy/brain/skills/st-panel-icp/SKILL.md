---
name: st-panel-icp
description: >
  El panel sintético del ICP de ① Strategy — entrevistas simuladas con 5 a 8 personas ficticias
  armadas con los criterios del perfil del cliente ideal, para explorar dolores, deseos,
  objeciones y palabras antes de tener entrevistas reales. Todo lo que sale va SIEMPRE marcado
  [hipótesis] y se valida después con reels de prueba. Nunca reemplaza una entrevista real. Úsala
  cuando pidan "simulá entrevistas", "el panel sintético", "qué diría el cliente ideal",
  "probemos el mensaje con el ICP", "no tenemos entrevistas todavía".
---

# Panel sintético del ICP — explorar rápido, validar con datos

> 🛑 **Todo lo que sale de aquí es `[hipótesis]`.** Un panel sintético sirve para hacer mejores
> preguntas y elegir qué probar, nunca para aprobar un dolor. **Solo un reel de prueba o una
> entrevista real lo pasa a `aprobado`.**

| | |
|---|---|
| **Consume** | El nodo `icp` *(aunque esté en hipótesis)* · el producto · frases reales que ya existan |
| **Produce** | `01-estrategia/panel-icp-<AAAA-MM>.md` — nodos `dolor` y `deseo` con `estado: hipotesis` y `fuente: hipótesis (panel sintético)` |

## 1 · Armar el panel

**5 a 8 personas**, cada una con los criterios del ICP llenos y **una diferencia que importa**:
edad *(jóvenes, millennials, mayores)*, etapa del negocio, decisor o no, conciencia del problema.

```
P3 · <nombre ficticio>, <edad>, <rol> en <industria> · factura <rango> · ciclo <rápido/lento>
Qué ve, a quién sigue, dónde compra · nivel de conciencia
```

🛑 **Nunca se usa el nombre ni los datos de una persona real.**

## 2 · La entrevista

Las mismas 5 preguntas de la entrevista real (`st-dolores-historia` §2), más:
- «¿Qué tendrías que ver para creerle a esta marca?»
- «¿Qué te haría dejar de seguirla?»
- Se le muestra el mensaje o un hook y se le pide reaccionar en una frase.

**Cada respuesta se escribe en primera persona y en el lenguaje de esa persona.**

## 3 · Qué se saca

| Salida | Cómo |
|---|---|
| **Dolores y deseos candidatos** | Los que aparecen en 3 o más personas |
| **Objeciones** | Las que se repiten |
| **Palabras** | Las frases que suenan a comprador, no a marketing |
| **Diferencias por ángulo** | Qué cambia entre jóvenes, millennials y mayores — alimenta los ángulos de ③ Marketing y Creative |

## 4 · Cómo se valida

Cada hipótesis que se quiera usar en serio **lleva un reel de prueba** en `st-adquisicion` §2: una
pieza corta que pone ese dolor o deseo como hook. `resultados` lee retención, guardados,
compartidos y comentarios y la pasa a `aprobado` o la tira.

## 5 · Antes de cerrar

- [ ] Todo nodo del panel dice `estado: hipotesis` y `fuente: hipótesis (panel sintético)`
- [ ] Ninguna persona del panel es real
- [ ] Cada hipótesis que se va a usar tiene su reel de prueba
