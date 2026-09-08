# Mapa de Outputs — Agente de Estrategia

Todo lo que el agente produce, dónde vive y quién lo consume. **Si algo no está en este mapa, el
agente no lo produce.**

---

## Resumen

| Tipo | Cantidad | Dónde vive |
|---|---|---|
| **A · Entregables de archivo** | 3 | `clients/<cliente>/` |
| **B · Instrumentos de recolección** | 3 | `templates/` — se copian por cliente |
| **C · Outputs de sesión** | 4 | En la conversación (Buzz) |
| **D · Outputs externos** | 3 | Notion · Drive · Eden — solo con gate |

---

# A · Entregables de archivo

| # | Archivo | Capa | Skill | Gate | Lo consume |
|---|---|---|---|---|---|
| 1 | `nucleo.md` | 0 | `st-foundation` + `st-arquetipo` | 🚦 GATE | Todo el sistema |
| 2 | `ingenieria-inversa.md` | 1 | `st-ingenieria-inversa` | — | Capas 3-4 |
| 3 | `posicionamiento.md` | 2-4 | `st-tres-verdades` + `st-posicionamiento` | 🚦 GATE | Contenido/Calendar · Creative · Growth |
| 4 | `estrategia-de-contenido.md` | 4 | `st-posicionamiento` | — | Creative |

---

## 1 · `nucleo.md` — Capa 0

| Sub-output | Qué es |
|---|---|
| **A · Retrato de la empresa** | Qué hace, visión, propósito, oferta, precio, tono, visuales, audiencia actual — sale del `formulario-cliente.md` |
| **B · WIN** | Qué significa ganar, específico y verificable |
| **C · Economía unitaria** | Ticket, margen bruto, capacidad de entrega, punto de equilibrio — sale de `unit-economics.csv` |
| **D · Restricciones reales** | Presupuesto, equipo, capacidad de producción, aprobación, legales |
| **E · Clasificación** | 8 ejes + arquetipo dominante + modificador |
| **Huecos abiertos** | `⚠️ SIN DATOS` con qué falta y cómo conseguirlo |

**Restricción:** describe, no decide. La diferenciación declarada por el cliente sale como
`[percepción del cliente, no verificado]`.

---

## 2 · `ingenieria-inversa.md` — Capa 1

| Sub-output | Qué es |
|---|---|
| **1.1 Cómo se compra/descubre** | Observación directa de los canales donde está el cliente |
| **1.2 Demanda por crear** | CEPs + volumen disponible (AdWhispr/Eden) — registrado en `demanda.csv`. El volumen es lo que valida la ingeniería inversa financiera de la Capa 3 |
| **1.3 Audience behavior** | Análisis de seguidores de un competidor: qué consumen, con qué interactúan, funnel real |
| **1.4 Awareness stages** | Distribución estimada del mercado frente al problema |

**Restricción:** 🛑 no recomienda. Termina en observación.

---

## 3 · `posicionamiento.md` — Capas 2-4

### Sección 1 — Análisis (Capa 2)
| Sub-output | Qué es |
|---|---|
| **MUST BE TRUE** | Condiciones para ser #1 |
| **UNFAIR** | Ventajas reales, difícil de replicar + relevantes |
| **GO GET** | Candidatos a provocar |

### Sección 2 — Objetivo (Capa 3)
| Sub-output | Qué es |
|---|---|
| **Objetivo agresivo del ciclo** | 1-2 MUST BE TRUE elegidas |
| **Ingeniería inversa financiera** | Meta → ticket → clientes necesarios → conversión → volumen necesario |
| **Renuncias** | Qué queda afuera este ciclo, y por qué |

### Sección 3 — Estrategia (Capa 4)
| Sub-output | Qué es |
|---|---|
| **Pasos puntuales** | La ingeniería inversa de cómo se logra el objetivo, con fechas |
| **Promesa / Posicionamiento / ICP** | Soporte de la estrategia, no el outcome principal |
| **Historia** | Héroe (ICP) · Villano (contra qué está la promesa) · Solución (nosotros) |

**Restricción:** 🚦 GATE — el más importante. Todo lo que sigue depende de esto.

---

## 4 · `estrategia-de-contenido.md` — Capa 4

| Sub-output | Qué es |
|---|---|
| **Promesa, posicionamiento e ICP** | Desarrollados en detalle para handoff a Creative |
| **Historia completa** | Héroe / villano / solución, con el razonamiento detrás de cada rol |

**Restricción:** no escribe ideas, copies ni guiones — eso es de Creative, que interpreta la
historia. No arma calendario ni distribución — eso es de Contenido/Calendar.

---

# B · Instrumentos de recolección

Cada instrumento existe porque alimenta un cálculo o una decisión puntual más adelante — nunca
"para tener el dato".

| # | Instrumento | Qué levanta | Capa | Se usa en |
|---|---|---|---|---|
| 1 | `templates/formulario-cliente.md` | Visión, propósito, tono, audiencia actual, restricciones | 0 | Retrato de `nucleo.md` |
| 2 | `templates/unit-economics.csv` | Costeo del menú/producto/servicio → ticket, margen, capacidad | 0 | Ingeniería inversa financiera (Capa 3.2) |
| 3 | `templates/demanda.csv` | CEPs + volumen, audience behavior, awareness stage | 1 | Volumen valida Capa 3.2 · audience behavior escribe la promesa y la historia (Capa 4) |

---

# C · Outputs de sesión
No son archivos. El agente los emite en la conversación de Buzz.

| # | Output | Cuándo |
|---|---|---|
| 1 | **Pre-flight** | Siempre, antes de producir |
| 2 | **Bloqueo** | Falta un input o una capa previa |
| 3 | **Clasificación de arquetipo** | Cierre de Capa 0 |
| 4 | **Bloque de HANDOFF** | Al cerrar el ciclo |

---

# D · Outputs externos
**Solo con gate.** El repositorio es siempre la fuente de verdad; esto son copias.

| Destino | Qué se publica | Permiso |
|---|---|---|
| **Notion** | Entregable como página | `ask` |
| **Google Drive** | Entregable aprobado, visible para el cliente | `ask` — solo post-gate |
| **Eden board** | Evidencia cruda de la Capa 1 | `ask` |

---

# E · Qué NO produce

| No produce | De quién es |
|---|---|
| Precios, money model, oferta, funnel, LTV/CAC | **Growth** |
| Ideas día por día, copies, guiones, conceptos | **Creative** |
| Paleta, tipografía, guidelines, moodboard | **Branding** |
| Shot lists, piezas, edición, assets finales | **Production** |
| Publicaciones, programación, pauta | **Social Media / Media Buy** |
| Dashboards y reportes de performance | **Analytics** |

---

# Trazabilidad

```
nucleo.md            WIN + arquetipo + ticket/margen (unit economics)
      ↓                    ticket → Capa 3.2
ingenieria-inversa    canales + demanda/volumen + audience behavior + awareness
      ↓                    volumen → valida Capa 3.2 · audience behavior → promesa/historia
posicionamiento       MBT → UNFAIR → GO GET → objetivo → ing. inversa financiera → renuncias
                       → pasos → promesa/posicionamiento/ICP → historia
      ↓
estrategia-contenido  detalle de promesa/ICP/historia para Creative
      ↺
      al cerrar el ciclo, vuelve a posicionamiento (Capa 2) para el siguiente
      → handoff a Contenido/Calendar (arma distribución y cadencia), Growth y Creative
```
