---
name: gr-producto
description: >
  Capa de ② Growth — product management: el ciclo de vida de lo que el cliente vende. Decide qué
  producto o servicio se lanza, cuál se mejora, cuál se empuja y cuál se retira, con señales del
  comprador y del margen, no por gusto. Complementa a gr-oferta (que empaqueta y pone precio) y a
  mk-campana (que calendariza el lanzamiento). Sirve para clientes y para el catálogo de Inherent
  (OS → Servicios). Úsala cuando pidan "qué producto lanzamos", "este producto no se vende",
  "roadmap de producto", "qué quitamos del menú", "validar un producto nuevo", "el catálogo",
  "product management". Requiere Growth Partnership o un proyecto de Brand Foundation.
---

# Capa · Producto — qué se lanza, qué se mejora, qué se retira

| | |
|---|---|
| **Corre en** | ② Growth · en Brand Foundation, dentro de la estrategia de ① Strategy · para Inherent, con el CEO |
| **Niveles** | **Growth Partnership:** completo · **Brand Foundation:** solo la estructura inicial del catálogo *(es parte de la oferta del proyecto)* · **Brand Growth:** ⛔ no se toca qué se vende *(`gr-oferta` §1b)* |
| **Consume** | § La oferta (`gr-oferta`) · unit economics y margen por producto (`gr-numeros`, si hay costos confiables) · lenguaje y preguntas del comprador (⑧ Community `cm-loop`, brief) · ventas por producto del cliente |
| **Produce** | La sección **§ Producto** de `motor-de-crecimiento.md` *(Inherent: el catálogo de Servicios del OS)* |

> 🔑 **MENSAJE no es OFERTA, y OFERTA no es PRODUCTO.** El mensaje cuenta lo que se vende
> (③ Marketing); la oferta lo empaqueta y le pone precio (`gr-oferta`); **el producto es la cosa en sí
> y su vida**: nace, se mejora, se retira. Las dos últimas solo en Brand Foundation y Growth Partnership.

## 1 · El tablero de productos

**Una fila por producto o servicio que el cliente vende hoy.**

| Columna | Qué lleva |
|---|---|
| **Producto** | Como lo nombra el cliente |
| **Ventas** | Del sistema del cliente, por período. Sin dato: `⚠️ SIN DATOS` |
| **Margen** | De `gr-numeros`, solo con costos confiables |
| **Señal del comprador** | Qué preguntan, qué piden, de qué se quejan *(con cita)* |
| **Capacidad** | ¿El negocio aguanta vender más de esto? |
| **Decisión** | Empujar · mejorar · mantener · retirar · lanzar |

## 2 · Las cinco decisiones

| Decisión | Cuándo | Quién la ejecuta |
|---|---|---|
| **Empujar** | Vende, deja margen y hay capacidad | ③ Marketing y ⑩ Ads *(vía `ofertas-a-empujar`)* |
| **Mejorar** | Se pide pero hay una queja que se repite | El cliente; ② Growth lo documenta |
| **Mantener** | Cumple su papel en la escalera *(`gr-upsells`)* aunque no crezca | — |
| **Retirar** | No vende, no deja margen y no sostiene a otro producto | **El cliente decide.** ② Growth recomienda |
| **Lanzar** | Hay una señal repetida del comprador que nada del catálogo resuelve | Validación *(§3)* → `gr-oferta` → `mk-campana` |

🛑 **Nunca se cambia, se retira ni se lanza sin el cliente: es su negocio** *(`gr-oferta`)*. Si
implica precio u oferta nueva, **se escala al CEO antes de llevarla al cliente**.
🔑 **«Si la empresa es el estorbo, más demanda empeora el problema»** *(CLAUDE.md)*: no se empuja un
producto que el negocio no puede entregar.

## 3 · Lanzar — validar antes de construir

| Paso | Qué se hace |
|---|---|
| **1 · La señal** | La cita del comprador que pide algo que no existe, **repetida** *(no una sola vez)* |
| **2 · La prueba barata** | Preventa, lista de espera o un mensaje a quienes ya preguntaron *(`gr-captura`)* |
| **3 · El dato** | Cuántos dijeron que sí con dinero o con contacto, no con un «me gusta» |
| **4 · La decisión** | Se lanza, se ajusta o se descarta. Se escribe el porqué |
| **5 · El lanzamiento** | El calendario de `mk-campana` § Lanzamiento de producto |

## 4 · Para Inherent — el catálogo de Servicios

**Inherent es el cliente cero.** El catálogo de módulos y paquetes del OS se lee con el mismo tablero:
qué se vende, qué margen deja *(🔒 `06-ECONOMIA.md`, nunca sale)*, qué piden los prospectos que no
tenemos y qué módulo nadie compra. **Toda decisión la toma el CEO**, y un servicio nuevo entra al
manual con su ficha de oferta *(`03-OFERTA.md`)*.

## 5 · Gates

| Situación | Qué pasa |
|---|---|
| Es Brand Growth | ⛔ No corre: el producto llega como está |
| Una decisión cambia precio, oferta o catálogo | Se escala al CEO antes de ir al cliente |
| No hay ventas por producto | Se trabaja con señales, marcado `⚠️ SIN DATOS`, y se pide el dato |

## Checklist

- [ ] El tablero tiene **todos los productos** con ventas, margen o `⚠️ SIN DATOS`
- [ ] Cada decisión tiene **su señal** escrita
- [ ] Ningún lanzamiento sin **prueba barata** y dato
- [ ] Nada se cambió **sin el cliente**; lo de precio u oferta **se escaló al CEO**
- [ ] Lo que se empuja **cabe en la capacidad** del negocio

**Handoff →** `gr-oferta` *(empaque y precio)* · ③ Marketing *(`mk-campana`)* · ⑩ Ads · `gr-loop`.
