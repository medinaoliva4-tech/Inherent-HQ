# Correlación entre Entregables

Cómo se desarrolla cada entregable: **qué campo viene de dónde y qué transformación lo produce.**

> **Regla estructural:** ningún campo de un entregable aparece sin un padre en un entregable
> anterior. Si un campo no tiene origen, o está inventado, o falta una capa.

---

## Vista general del flujo

```
      FUENTES EXTERNAS
      brief · sitio · redes · material previo · Notion · Drive
                    │
                    ▼
         ┌──────────────────────┐
    ①    │      nucleo.md       │  WIN · restricciones · ARQUETIPO
         └──────────┬───────────┘
                    │  el arquetipo decide QUÉ mirar y CÓMO
                    ▼
         ┌──────────────────────┐
    ②    │ ingenieria-inversa   │  CEPs · patrones · white space · objeciones
         └──────────┬───────────┘
                    │  la evidencia decide QUÉ es posible
                    ▼
         ┌──────────────────────┐
    ③    │  posicionamiento.md  │  MBT · UNFAIR · objetivo · territorio · promesa
         └──────────┬───────────┘
                    │  la decisión restringe TODO lo que sigue
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
 ④ │estrateg.│ │contenido│ │medicion │ ⑦
   │contenido│ │por-canal│ │         │
   └────┬────┘ └────┬────┘ └────▲────┘
        └─────┬─────┘           │
              ▼                 │
        ┌──────────┐            │
      ⑥ │calendario│            │
        └────┬─────┘            │
             └──────────────────┘
                 aprendizaje ↺ vuelve a ③ (Capa 2)
```

---

# ① `nucleo.md` — la raíz

**No consume ningún entregable interno.** Es el único que se alimenta solo de fuentes externas.

| Campo que produce | De dónde sale | Transformación |
|---|---|---|
| **A · Retrato** | Brief, sitio, redes, material previo | Se transcribe. Lo que dice el cliente se etiqueta como percepción |
| **B · WIN** | Conversación con el cliente | Se **operacionaliza**: "ser los mejores" → "#1 en qué, medido cómo" |
| **C · Restricciones** | Cliente + observación | Se cuantifica: presupuesto, horas, capacidad de producción |
| **D · Arquetipo** | Los 8 ejes aplicados a A | Clasificación por árbol de decisión |

### A qué alimenta cada campo

| Campo | Alimenta a |
|---|---|
| **B · WIN** | → ③ TRUTH 01 (se convierte en las MUST BE TRUE) · ⑦ KPI de negocio |
| **C · Restricciones** | → ③ Recursos (3.5) · ⑤ cadencia · ⑥ frecuencia total |
| **D · Arquetipo** | → ② a quién estudiar y con qué MCP · ② CEPs típicos de partida · ⑤ rol por canal · ④ mix de funciones · ⑦ métricas que mienten |
| **A · Diferenciación percibida** | → ② se pone **a prueba** contra el mapa de saturación |

> **El arquetipo es el multiplicador.** Es el único campo que toca los 6 entregables siguientes.
> Clasificarlo mal desalinea todo el sistema.

---

# ② `ingenieria-inversa.md`

**Consume:** `nucleo.md` D (arquetipo) + A (categoría, oferta, diferenciación percibida)

| Campo que produce | Input que lo genera | Transformación |
|---|---|---|
| **1.1 Reglas de categoría** | Ficha del arquetipo + Firecrawl/WebSearch | Se observa cómo se compra y se descubre realmente |
| **1.1 Default de categoría** | Las 15+ piezas cosechadas | Lo que se repite en todos = el default |
| **1.2 Lista de CEPs** | CEPs típicos del arquetipo + reviews + búsquedas | Se **valida** con lenguaje real; se agregan los que aparecen y se sacan los que no |
| **1.2c Motor de demanda** | Volumen de búsqueda vs descubrimiento | Prueba diagnóstica: ¿buscan el producto o el problema? |
| **1.3a Universo 5 anillos** | Arquetipo → a quién priorizar · `AdWhispr find_competitors` | Verificación por MCP, no de memoria |
| **1.3b Tabla 15×7** | Piezas ganadoras cosechadas | Descomposición en las 7 capas |
| **1.3c Patrones** | La tabla 15×7 | Conteo de repeticiones por capa → 🟢/🟡/⚪ |
| **Mapa de saturación** | Los patrones 🟢 | Lo que hace todo el mundo |
| **Mapa 2x2 + white space** | Posicionamiento declarado de cada competidor | Ejes derivados de la evidencia, no de plantilla |
| **Mapa de objeciones** | Reviews y comentarios negativos de competidores | Se extrae en **lenguaje literal**, sin parafrasear |
| **1.5 Lenguaje literal** | Reviews, comentarios, DMs, llamadas | Citas textuales |

### A qué alimenta cada campo

| Campo | Alimenta a |
|---|---|
| **1.1 Default de categoría** | → ③ **Novelty** (la novedad se mide contra el default, no en abstracto) |
| **1.2b CEPs priorizados** | → ③ CEPs a poseer (4.2) · ⑦ KPI de marca |
| **1.2c Motor de demanda** | → ⑤ qué canal es principal · ⑥ mix owned/paid |
| **1.2d Estacionalidad** | → ⑥ fases y momentos del calendario |
| **1.3c Patrones de formato** | → ④ mecanismo (5.3) · ④ especificación de piezas (6.5) |
| **1.4 Señales culturales** | → ④ idea de campaña (5.4) |
| **1.5 Lenguaje literal** | → ③ **promesa** (se escribe con sus palabras, no con las nuestras) |
| **Mapa de saturación** | → ③ filtro de distintividad · ③ activos distintivos (qué NO usar) |
| **White space** | → ③ **territorio** (4.1) · ③ GO GET (TRUTH 03) |
| **Mapa de objeciones** | → ③ objeciones + RTB (4.3) · ③ problema (3.3) |
| **Hipótesis** | → ③ filtro D/N/R · ④ movimiento |

---

# ③ `posicionamiento.md` — el nudo del sistema

**Consume:** `nucleo.md` completo + `ingenieria-inversa.md` completo
**Alimenta:** todo lo que sigue. Es donde converge la evidencia y de donde sale la decisión.

## Capa 2 — Diagnóstico

| Campo | Input | Transformación |
|---|---|---|
| **MUST BE TRUE** | ① WIN + ② reglas de categoría | El WIN se descompone en condiciones necesarias que la categoría hace posibles |
| **Posición actual de cada MBT** | ② audiencia + analytics + ② mapa 2x2 | Diagnóstico de dónde está la marca hoy, con fuente |
| **UNFAIR** | ① activos declarados **verificados contra** ② saturación | Si todo el mundo lo tiene (aparece en saturación), no es unfair |
| **UNFAIR descartadas** | Las que no sirven a ninguna MBT | Doble filtro aplicado |
| **GO GET** | ② white space + ② señales culturales + ② anillo 5 (creadores) | Lo que podemos provocar aprovechando lo que la evidencia mostró vacío |

> **Correlación crítica:** una UNFAIR solo sobrevive si ② no la muestra en el mapa de saturación.
> Ahí es donde la "diferenciación percibida" del cliente se confirma o se cae.

## Capa 3 — Decisión

| Campo | Input | Transformación |
|---|---|---|
| **Objetivo** | Las MBT | Se **selecciona** 1-2 para este ciclo. No se inventa una nueva |
| **Comportamiento** | ② CEPs + ② audiencia | La conducta que hay que cambiar para mover esa MBT |
| **Problema** | ② mapa de objeciones + ② qué genera confianza | Se nombra el obstáculo, uno |
| **Renuncias** | Consecuencia de elegir el objetivo | Todo lo que sirve a las **otras** MBT queda afuera este ciclo |
| **Recursos** | ① Restricciones | Se verifica que el alcance cabe. Si no, se recorta acá |
| **Riesgos** | Nuevo — no deriva de nada | Qué invalidaría esta estrategia |

## Capa 4 — Territorio

| Campo | Input | Transformación |
|---|---|---|
| **Territorio** | ② white space **+** UNFAIR (defendible) | Un white space que no se puede defender con una UNFAIR no es un territorio, es un hueco |
| **CEPs a poseer** | ② CEPs priorizados | Se eligen 3-5 |
| **Promesa** | ② lenguaje literal + territorio | Se escribe con las palabras del comprador |
| **RTBs** | **UNFAIR** | Las pruebas salen de las ventajas reales. Sin UNFAIR no hay RTB creíble |
| **Objeciones** | ② mapa de objeciones | Las 3-5 más frecuentes + qué las responde |
| **Filtro D/N/R** | Territorio **contra** ② saturación | Novelty solo tiene sentido contra el default de categoría |
| **Activos distintivos** | ① visuales existentes + ② saturación | Se descarta todo lo que ya es código de categoría |

---

# ④ `estrategia-de-contenido.md`

**Consume:** ③ completo + ② patrones + ① arquetipo

| Campo | Input | Transformación |
|---|---|---|
| **Movimiento elegido** | ③ GO GET, filtrado por ③ UNFAIR y ③ objetivo | De candidatos a decisión: 1-2 |
| **Descartados** | Los otros GO GET | Se documenta por qué |
| **Trabajo estratégico** | ③ objetivo + ③ problema | `La comunicación tiene que [resolver el problema] para que [se cumpla el objetivo]` |
| **Mecanismo** | ② patrones capa "prueba" + ③ UNFAIR | Qué tipo de solución puede lograr el trabajo |
| **Idea de campaña** | ③ territorio + ② señales culturales | Pasa el filtro D/N/R |
| **Funciones + pesos** | ③ **problema** | El problema decide qué función pesa (ver tabla abajo) |
| **Pilares + mix** | ① ficha del arquetipo | Mix base, ajustado por momento |
| **Temperatura** | ③ comportamiento `actual → deseado` | La distancia entre los dos estados define cuánto peso lleva cada temperatura |
| **Especificación de piezas** | Funciones + temperatura + ② patrones de formato | Tipos de pieza, no piezas |

### El problema decide las funciones

| Si el problema (3.3) es… | La función que pesa es… |
|---|---|
| Awareness / salience / memoria | **Hero** + **Series** |
| Confianza / percepción | **Proof** |
| Relevancia / no entienden | **Utility** |
| Fricción / precio / no cierran | **Conversion** |
| Pertenencia / recurrencia | **Community** |

> Esta es la correlación que más se rompe en la práctica: se eligen funciones por gusto en vez
> de por el problema diagnosticado.

---

# ⑤ `contenido-por-canal.md`

**Consume:** ④ funciones y temperatura + ② canales que importan + ① arquetipo y capacidad

| Campo | Input | Transformación |
|---|---|---|
| **Canales candidatos** | ① ficha arquetipo §5 + ② 1.1 canales que importan | Intersección de los dos, no la unión |
| **Función única por canal** | ④ funciones (6.1) | Se **reparten** entre canales. Ninguna se duplica |
| **Temperatura por canal** | ④ temperatura (6.3) | Cada canal atiende una o dos, no las cuatro |
| **Formatos** | ② patrones de formato (1.3c) | Los que la evidencia mostró que funcionan en ese canal |
| **Cadencia** | ① capacidad de producción | Techo duro. No se supera |
| **Métrica que lo juzga** | ① ficha arquetipo §7 | Métricas que importan, no las que mienten |
| **Canales descartados** | ③ renuncias | Coherencia con lo que ya se decidió no hacer |

---

# ⑥ `calendario-estrategico.csv`

**Consume:** ④ + ⑤ + ② estacionalidad + ① capacidad. **No agrega información nueva: la ordena en el tiempo.**

| Columna | Viene de |
|---|---|
| `semana` | ④ fases del movimiento |
| `fase_del_movimiento` | ④ movimiento elegido (5.1) |
| `canal` | ⑤ |
| `funcion` | ④ funciones (6.1) |
| `pilar` | ④ pilares (6.2) |
| `temperatura` | ④ temperatura (6.3) |
| `formato` | ⑤ formatos |
| `frecuencia` | ⑤ cadencia, limitada por ① capacidad |
| `balance` | ③ objetivo (marca vs activación) |
| `objetivo_del_slot` | ③ problema + ③ CEPs a poseer |
| `traza_a_must_be_true` | ③ MUST BE TRUE (la letra) |
| `estado` | Operativo |

> **Nada nace acá.** Si una columna no se puede llenar desde un entregable anterior, falta una capa.

---

# ⑦ `medicion.md` — y el retorno

**Consume:** ① WIN + ③ objetivo y comportamiento + ④ funciones + ① arquetipo

| Campo | Input |
|---|---|
| **KPI de negocio** | ① WIN operacionalizado |
| **KPI de comportamiento** | ③ comportamiento deseado (3.2) |
| **KPI de marca** | ③ CEPs a poseer (4.2) — se mide asociación a esos CEPs |
| **KPI de contenido** | ④ funciones (6.1) — cada función tiene su métrica |
| **Métricas ignoradas** | ① ficha arquetipo §7 "métricas que mienten" |
| **Baseline** | ② audiencia + analytics del cliente |
| **Condiciones de invalidación** | ③ riesgos (3.6) |
| **Compounding** | ④ movimiento elegido (5.1) |

### El retorno al ciclo

| Output de ⑦ | Actualiza |
|---|---|
| Resultado vs objetivo | → ③ **MUST BE TRUE**: ¿se movió la condición? |
| Ventaja descubierta | → ③ **UNFAIR**: se agrega la que no sabíamos que teníamos |
| Movimiento que compoundeó | → ③ **UNFAIR**: un GO GET que funcionó y se repitió **se convirtió en ventaja** |
| Hipótesis refutada | → ② se re-corre el bloque que la produjo |

```
High-leverage move → funciona → se repite → se reconoce → atrae talento y sponsors →
crece comunidad → propiedad cultural   ⇒   ahora es UNFAIR ADVANTAGE
```

---

# Tres hilos completos

Para ver la correlación funcionando, seguí un dato de punta a punta.

### Hilo 1 — Del WIN al KPI
```
① WIN "ser la primera opción de cena rápida en Palermo"
   ↓
③ MUST BE TRUE "A: que nos consideren en el momento de hambre entre semana"
   ↓
③ Objetivo del ciclo "mover A"
   ↓
③ CEP a poseer "no quiero cocinar hoy"
   ↓
⑥ objetivo_del_slot "ocupar el CEP de martes a jueves 18-20h" · traza_a_must_be_true = A
   ↓
⑦ KPI de marca "asociación al CEP" + KPI de negocio "cubiertos martes a jueves"
```

### Hilo 2 — De la objeción a la pieza
```
② Mapa de objeciones "las fotos no se parecen al lugar" (🟢 12 reviews de 3 competidores)
   ↓
③ Problema "confianza: la categoría quemó la credibilidad visual"
   ↓
③ Objeción + RTB "mostramos el lugar sin retoque, siempre"
   ↓
④ Función que pesa = Proof · Mecanismo = prueba
   ↓
⑤ Canal: Instagram, temperatura tibio, formato "video crudo sin edición"
   ↓
⑥ Slot semanal · funcion=Proof · pilar=Educativo · temperatura=Tibio
```

### Hilo 3 — De la ventaja a la distribución
```
① El cliente dice "tenemos buena relación con productores locales" [percepción]
   ↓
② Saturación: ningún competidor lo comunica  ⇒  se confirma como UNFAIR
   ↓
③ UNFAIR "acceso a productores" · relevante a MBT A  ⇒  entra
   ↓
③ RTB "el productor aparece con nombre y cara"
   ↓
④ GO GET elegido "serie con los productores" · mecanismo = asociación
   ↓
⑥ Distribución: **borrowed** — las audiencias de los productores
```

---

# Reglas de correlación

1. **Ningún campo sin padre.** Si no se puede señalar de dónde viene, o se inventó o falta una capa.
2. **La evidencia manda sobre la percepción.** Lo que el cliente cree (①) se confirma o se cae en ②.
3. **La decisión manda sobre la evidencia.** ② muestra muchas opciones; ③ elige y **renuncia** al resto.
4. **El calendario no crea nada.** Solo ordena en el tiempo lo ya decidido.
5. **La capacidad es un techo duro.** ① C limita ⑤ cadencia y ⑥ frecuencia. Nunca al revés.
6. **El arquetipo modula, no decide.** Ajusta canales, métricas y mix — pero la evidencia del cliente
   le gana a la ficha.
7. **El ciclo cierra en ③, no en ①.** El aprendizaje actualiza las 3 Verdades. El núcleo solo se
   rehace si la empresa cambió de verdad (pivote, fusión, nueva línea).
