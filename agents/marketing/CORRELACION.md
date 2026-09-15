# Correlación — de Strategy a Marketing, campo por campo

**Ningún campo de un entregable de Marketing aparece sin un padre.** Si un campo no tiene origen,
o está inventado, o falta una fase, o corresponde a otro departamento.

---

## Vista general del flujo

```
   STRATEGY (aprobado)              BRANDING
   posicionamiento · nucleo         guidelines · activos
   ing-inversa · calendario              │
            │                            │
            └──────────┬─────────────────┘
                       ▼
              ┌──────────────────┐
         ⓪    │ handoff-recibido │   qué llegó · qué falta · qué se asume
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
         ①    │ research-comercial│  ads vivos · ofertas · fechas · costos · avatares
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
         ②    │ plan-de-marketing │  distribución · mix · arquitectura
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
         ③    │    campanas       │  una ficha por campaña
              └────────┬─────────┘
              ┌────────┴─────────┐
              ▼                  ▼
      ┌──────────────┐   ┌────────────────┐
   ④  │ calendario-  │   │ volumen-y-     │ ⑤
      │ comercial    │   │ presupuesto    │
      └──────┬───────┘   └───────┬────────┘
             └─────────┬─────────┘
                       ▼
              ┌──────────────────┐
         ⑥    │ lectura-comercial │
              └────────┬─────────┘
                       │
        vuelve a ② ────┘────► ⟲ RETORNO A ESTRATEGIA (si toca el nivel marca)
```

---

# ⓪ `handoff-recibido.md` — la aduana

**No produce contenido propio.** Verifica, extrae y declara faltantes.

| Campo | Viene de | Transformación |
|---|---|---|
| Promesa, territorio, enemigo, mecanismo | `posicionamiento.md` 4.1-4.3 | **Se copia literal.** No se reformula |
| Objetivo del ciclo + métrica + horizonte | `posicionamiento.md` §2 | Se copia |
| MUST BE TRUE en juego | `posicionamiento.md` §1 | Se copia — es la traza de toda campaña |
| Renuncias | `posicionamiento.md` 3.4 | Se copia — define qué campañas **no** se proponen |
| CEPs a poseer | `posicionamiento.md` 4.2 | Se copian — son los momentos de entrada de los ángulos |
| Objeciones | `posicionamiento.md` 4.3 | Se copian — alimentan el mensaje 6 de cada campaña |
| Movimiento elegido | `estrategia-de-contenido.md` 5.1 | Se copia — las campañas lo ejecutan |
| Arquetipo | `nucleo.md` E | Decide qué canales y tipos pesan |
| Economía unitaria | `nucleo.md` C | Se convierte en **CAC máximo tolerable** en M1.4 |
| Capacidad de producción | `nucleo.md` D | Es el techo duro del volumen (M6.2) |
| Velocidad de aprobación | `nucleo.md` D | Entra en el cálculo de `fecha_prep_inicio` (M5) |
| Motor de demanda | `ingenieria-inversa.md` 1.2c | Decide el peso de captura vs creación en el mix |
| Ciclo de compra | `ingenieria-inversa.md` 1.2d | Fija el horizonte del calendario y de la lectura |
| Estacionalidad | `ingenieria-inversa.md` 1.2e | Es la semilla del calendario comercial de M1.3 |
| Cadencia base por canal | `calendario-estrategico.csv` | Es la **base** sobre la que se apila el pico (M6) |
| Balance marca/activación | `calendario-estrategico.csv` | Se traduce a plata en M3.3 |
| Rol de cada canal | `contenido-por-canal.md` | Se copia y se le agrega la capa comercial (M3.2) |
| Activos distintivos, tono, visual | Branding | Restricción de consistencia de toda campaña |

> **Los cinco campos que nunca se reformulan:** promesa · territorio · enemigo · mecanismo único ·
> movimiento elegido. Se copian. Cambiarlos es ⟲ RETORNO A ESTRATEGIA.

---

# ① `research-comercial.md`

| Campo que produce | De dónde sale | Alimenta a |
|---|---|---|
| **1.1 Ads vivos y patrones** | MCP (AdWhispr, Eden) | → ① nivel de sofisticación · → ③ ángulos · → ② mix |
| **1.2 Ofertas y promos vigentes** | MCP + web | → ③ mecánica promocional · → **Growth** |
| **1.3 Calendario comercial** | Firecrawl/WebSearch + estacionalidad de Strategy | → ④ fechas duras, valles, saturación, aire |
| **1.4 Benchmarks y costos** | MCP + fuentes | → ⑤ presupuesto · → ② test de viabilidad |
| **1.4b CAC máximo tolerable** | Economía unitaria de `nucleo.md` C | → ② viabilidad · → ⑤ techo de pauta |
| **1.5 Avatares** | Audiencia y objeciones de `ingenieria-inversa.md` 1.5 + CEPs | → ③ avatar y ángulo por campaña |
| **1.5b Nivel de sofisticación** | Evidencia de 1.1 | → ③ qué tipo de ángulo puede funcionar |

> **La diferencia con Strategy:** `ingenieria-inversa.md` estudió qué se **dice**.
> `research-comercial.md` estudia qué se **vende, cuándo y a qué costo**. No se repite el trabajo.

---

# ② `plan-de-marketing.md`

| Campo que produce | De dónde sale | Alimenta a |
|---|---|---|
| **Distribución del objetivo** | Objetivo de Strategy ÷ fuentes de demanda viables (①) | → ③ % de cada campaña · → ⑥ lectura |
| **Supuestos de conversión** | Benchmarks de ①1.4 + baseline propio | → ⑥ confirmado / optimista / pesimista |
| **Test de viabilidad** | Economía unitaria + capacidad + ciclo de compra | → puede disparar ⟲ RETORNO |
| **Tipos de marketing** | `TIPOS-DE-MARKETING.md` filtrado por UNFAIR, motor, recursos | → ③ mecánica de cada campaña |
| **Rol comercial por canal** | Rol de Strategy + puesto comercial | → ⑤ volumen y presupuesto por canal |
| **Balance marca/respuesta en plata** | Balance de `calendario-estrategico.csv` | → ⑤ split de presupuesto |
| **Arquitectura de campañas** | Todo lo anterior | → ③ fichas |

---

# ③ `campanas.md`

| Campo de la ficha | Padre exacto |
|---|---|
| Traza a MUST BE TRUE | `posicionamiento.md` §1 |
| % del objetivo | ② distribución |
| Avatar + nivel de consciencia | ① 1.5 |
| CEP de entrada | `posicionamiento.md` 4.2 |
| **Ángulo** | ① 1.5 + `ANGULOS-Y-AVATARES.md` — **derivado, nunca la promesa** |
| Promesa que sostiene | `posicionamiento.md` 4.3 — **copiada** |
| Objeción que responde | `posicionamiento.md` 4.3 |
| Mecanismo (mensaje 4) | `posicionamiento.md` 4.1c — **copiado** |
| Prueba (mensaje 5) | RTBs de `posicionamiento.md` 4.3 |
| Mecánica | ② tipos seleccionados |
| Canales | ② 2.2 |
| Función comercial | ② 2.3 balance |
| Presupuesto | ⑤ |
| Ventana | ④ |

> **Ninguna campaña inventa un mecanismo ni una prueba.** Los toma de Strategy. Lo único que
> Marketing crea acá es **el ángulo, la mecánica y el mensaje comercial**.

---

# ④ `calendario-comercial.csv`

| Columna | Padre |
|---|---|
| `campana` | ③ |
| `fase` | ③ fases de la campaña |
| `fecha_inicio` / `fecha_fin` | ③ ventana, ajustada contra ① 1.3 |
| `fecha_prep_inicio` | Calculada hacia atrás con la velocidad de aprobación de `nucleo.md` D |
| `dependencia` | ③ dependencias |
| `responsable` | ③ dueño |
| `canal` | ② 2.2 |
| `naturaleza` / `funcion` | ③ clasificación |

**No contradice** al `calendario-estrategico.csv`: se apoya sobre él.

---

# ⑤ `volumen-y-presupuesto.md`

| Campo | Padre | Restricción que lo limita |
|---|---|---|
| Piezas por día y formato | ③ + `CANALES.md` | Capacidad de producción (`nucleo.md` D) |
| Consolidado semanal | ④ + cadencia base de `calendario-estrategico.csv` | **El total, no campaña por campaña** |
| Presupuesto por partida | ② 2.3 balance en plata | CAC máximo tolerable (① 1.4) |
| Pauta por bloque | ③ campañas pautadas | Se entrega por bloque; el día a día es de Growth |
| Reserva de prueba | Regla fija | Mínimo 10% |

---

# ⑥ `lectura-comercial.md`

| Campo | Padre | Vuelve a |
|---|---|---|
| Resultado por campaña | ③ función declarada + métrica | → ② mix del próximo ciclo |
| Supuesto real vs declarado | ② distribución | → ② convierte hipótesis en plan |
| Ángulos ganadores y perdedores | ③ | → **Creative** y ③ del próximo ciclo |
| Objeciones nuevas | Datos de campaña | → **Strategy** (actualiza 4.3) |
| Supuesto de conversión roto | ② | → **Growth** |
| Promesa que no sostiene | ③ resultados | → **⟲ RETORNO A ESTRATEGIA** |
| Activo que funcionó | ③ | → **Branding** (se refuerza, no se reinventa) |

---

## Las tres correlaciones que hay que vigilar

| | Si se rompe | Síntoma |
|---|---|---|
| **Objetivo → distribución → campañas** | Los % no suman 100, o una campaña no aporta a ninguna fuente | Campañas que nadie sabe por qué existen |
| **Cadencia base + pico → capacidad** | El volumen se revisa campaña por campaña | El plan se cae en la semana 3 |
| **Promesa → ángulo → pieza** | Un ángulo cambia la promesa | La marca dice cosas distintas en cada campaña y no acumula memoria |
