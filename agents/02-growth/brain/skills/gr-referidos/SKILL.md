---
name: gr-referidos
description: >
  Capa de ② Growth — el sistema de referidos: que los clientes contentos traigan clientes nuevos,
  pedidos en el momento correcto y no esperados (3er pilar del método, «Referidos sistematizados»).
  Sirve para Inherent (cliente cero, lo opera el CEO) y como servicio para clientes de Growth
  Partnership (área 8 de la ficha). Define cuándo se pide, a quién, qué se ofrece a cambio, cómo se
  registra el referido en el CRM y qué plataforma externa lo opera. Úsala cuando pidan "referidos",
  "que nos recomienden", "programa de referidos", "embajadores", "cómo pedimos recomendaciones",
  "quién nos refirió". Requiere la recompensa aprobada por el CEO.
---

# Capa · Referidos — el cliente contento trae al siguiente

| | |
|---|---|
| **Corre en** | ② Growth · para Inherent, con el CEO *(ventas de `inherent/administracion/`)* |
| **Niveles** | **Growth Partnership:** cuando la ficha incluye el área 8 *(«sistema de reseñas, referidos y recompra»)* · **Brand Growth y Brand Foundation:** ⛔ no corre · **Inherent:** sí, como cliente cero |
| **Consume** | § La oferta · § La escalera (`gr-upsells`) · el recorrido de `gr-conversion` · los clientes reales del CRM |
| **Produce** | La sección **§ Referidos** de `motor-de-crecimiento.md` *(Inherent: `inherent/inherent-social-media/07-oferta-y-ventas/referidos.md`)* |

> 🔑 **«Referidos sistematizados — pedidos en el momento correcto, no esperados»**
> *(`inherent/02-METODO.md`, 3er pilar)*. Esperar a que recomienden no es un sistema.

## 1 · ⛔ Por qué no corre antes

🛑 **Se le pide referir a quien ya compró y quedó contento.** En Brand Growth la conversión no está
en el alcance *(`gr-conversion` §1)*, y un programa sin compradores es infraestructura sin uso.
**Prometerlo antes es cobrar por algo que no se puede usar** *(CLAUDE.md «Los cuatro sistemas»)*.

## 2 · El momento — cuándo se pide

**Se pide justo después de una prueba de valor**, no al azar.

| Momento | Ejemplo |
|---|---|
| **Al entregar** | El cliente recibió lo que compró y lo dijo |
| **Al ver un resultado** | Lo midió, lo celebró, dejó una reseña |
| **Al renovar** | Siguió: es la señal más fuerte de que está contento |

🛑 **No se pide a quien tiene una queja abierta** *(⑧ Community la marca como `queja` en `cm-triage`)*.

## 3 · Las cinco piezas del sistema

| Pieza | Qué decide |
|---|---|
| **A · A quién** | Clientes con prueba de valor *(§2)* · y terceros que ya recomiendan *(socios, proveedores)* |
| **B · El pedido** | El mensaje en la voz de ②B Branding: **específico** *(«¿conoces a otro dueño de restaurante que…?»)*, nunca «si sabes de alguien» |
| **C · Lo que se ofrece** | La recompensa para quien refiere y, si aplica, para el referido. **La decide el CEO** *(como servicio, el cliente: §5)* |
| **D · El registro** | El referido entra al CRM con fuente `referido:<quién refirió>` *(mismo formato que `gr-captura` §4)* |
| **E · El cierre del círculo** | A quien refirió se le avisa qué pasó y se le entrega lo prometido cuando corresponde |

🛑 **Sin el campo `referido:<quién>` no hay sistema:** no se sabe a quién agradecer ni cuánto rinde.

## 4 · La plataforma — un slot, no una marca

**La herramienta que opera el programa es un slot** *(CLAUDE.md «Las herramientas son slots»)*:
genera el enlace de cada quien, cuenta los referidos y avisa cuando hay que entregar la recompensa.

| Regla | Por qué |
|---|---|
| **Se anota en la tabla de slots de `inherent/05-OPERACION.md`** | Si cambia la herramienta, cambia esa tabla |
| **Sin MCP o integración probada, el registro se hace a mano en el CRM** | Un MCP declarado no es un MCP conectado |
| **Se conecta con el CRM de Inherent OS** *(Zapier si no hay conexión directa)* | Un referido fuera del CRM no se mide |

## 5 · Como servicio vs. para Inherent

| | **Cliente (Growth Partnership)** | **Inherent** |
|---|---|---|
| **Quién refiere** | Los compradores del cliente | Nuestros clientes y aliados |
| **Quién decide la recompensa** | **El cliente**, con la recomendación de ② Growth. Si cambia precio u oferta, se escala al CEO | **El CEO** |
| **Quién pide** | El equipo del cliente, con el guion que dejamos | El CEO *(la secretaria `00-account` no ofrece recompensas: no compromete precio)* |
| **Atribución** | **Lo referido no cuenta para el performance fee** si no pasó por nada nuestro *(`ad-atribucion` §1)* | — |

## 6 · Qué se mide

| Medida | Para qué |
|---|---|
| **Pedidos hechos** | Que el sistema corre |
| **Referidos recibidos** | Que el pedido funciona |
| **Referidos que compraron** | Que traen al cliente correcto |
| **Recompensas entregadas a tiempo** | Que cumplimos lo prometido |

**Lo lee `gr-loop`.**

## 7 · Gates

| Situación | Qué pasa |
|---|---|
| La recompensa no está aprobada | 🛑 `BLOQUEADO — falta la recompensa de referidos` |
| La ficha no incluye el área 8 | ⛔ No corre |
| El pedido promete precio, descuento o resultado | Se escala al CEO |
| Mensaje que sale al cliente final | Se auto-revisa contra el tono de ②B Branding antes de encenderse |

## Checklist

- [ ] El nivel es **Growth Partnership con área 8**, o es Inherent
- [ ] El **momento** de pedir está atado a una prueba de valor
- [ ] El pedido es **específico** y está en la voz de la marca
- [ ] La **recompensa** está aprobada por quien corresponde
- [ ] Cada referido entra al CRM con **`referido:<quién>`**
- [ ] La plataforma está en la **tabla de slots**, o el registro es manual y se dice
- [ ] Lo referido **no se suma** al performance fee sin atribución

**Handoff →** ⑧ Community *(si el pedido sale por mensaje)* · `gr-loop` lee las medidas.
