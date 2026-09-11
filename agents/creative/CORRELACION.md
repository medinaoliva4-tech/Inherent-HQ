# ⓪ Lo que llega de afuera — el contrato de entrada

**Creative no tiene raíz propia.** Su Capa 0 se alimenta enteramente de otros departamentos. Esta es
la tabla que impide la duplicación: **cada campo se cita, no se recalcula.**

> 📍 **Este es el único lugar del repo donde viven las rutas de entrada de Creative.** Si un
> departamento de aguas arriba se reorganiza, se actualiza acá y nada más.

## ⓪.1 · De dónde sale cada ruta — mapeo de transición

Hoy el repo tiene **un solo agente aguas arriba** (`agents/strategy/`) que cubre Comprensión,
Estrategia y Marketing juntos. La columna «Hoy» es de dónde se lee mientras eso siga así; la columna
«Cuando exista» es a dónde se moverá la lectura sin tocar el método.

| Departamento | Hoy | Cuando exista |
|---|---|---|
| **① Comprensión** | `agents/strategy/clients/<c>/nucleo.md` | `agents/comprension/clients/<c>/` |
| **② Estrategia** | `agents/strategy/clients/<c>/` → `ingenieria-inversa.md` · `posicionamiento.md` | `agents/estrategia/clients/<c>/` |
| **③ Marketing** | `agents/strategy/clients/<c>/` → `estrategia-de-contenido.md` · `contenido-por-canal.md` · `calendario-estrategico.csv` | `agents/marketing/clients/<c>/` |
| **②B Branding** | `_INPUTS/` del cliente | `agents/branding/clients/<c>/` |
| **⑧B Ads** | `_INPUTS/` del cliente | `agents/ads/clients/<c>/` |

En las tablas de abajo la ruta se escribe con el **nombre del departamento**, no con la carpeta:
`② posicionamiento §4.3` se resuelve con este mapeo.

## ⓪.2 · Campo por campo

| Campo que Creative usa | De quién | Sección | Qué hace Creative con él |
|---|---|---|---|
| **Audiencia y su comportamiento** | ① Comprensión | — | Filtro, no análisis nuevo. No se re-perfila |
| **Competencia y mercado** | ① Comprensión | — | Contexto del swipe file. No se re-investiga |
| **Precios y canales de venta** | ① Comprensión | — | Techo de lo que el copy puede prometer |
| **Capacidad real de producción** | ① Comprensión | — | **Techo duro** del volumen de filas del Excel |
| **Las 3 verdades** | ② Estrategia | — | El marco del que cuelga toda idea |
| **ICP · villano · solución** | ② Estrategia | — | Villano → tensión del hook. ICP → filtro de lenguaje |
| **Historia de marca** | ② Estrategia | — | El arco de la pieza es un capítulo de esta historia, no otra historia |
| **Promesa** | ② Estrategia | posicionamiento | La respeta. **Nunca la cambia.** Es el techo del copy |
| **Mecanismo único** | ② Estrategia | posicionamiento | Es lo que el copy tiene que hacer creíble |
| **Enemigo** | ② Estrategia | posicionamiento | Le da tensión al hook y al ángulo |
| **Activos distintivos** | ② Estrategia | posicionamiento | Se **refuerzan** en layout y estética, no se reinventan |
| **Objeciones + RTB** | ② Estrategia | posicionamiento | Alimentan los conceptos de función Proof |
| **CEPs a poseer** | ② Estrategia | posicionamiento | Definen el momento al que le habla la pieza |
| **Territorio** | ② Estrategia | posicionamiento | Guardrail: qué **es** y qué **no es** la marca |
| **Tabla 15×7** | ② Estrategia | ing. inversa 1.3b | **El swipe file arranca de acá.** No se re-cosecha |
| **Mapa de saturación** | ② Estrategia | ing. inversa | Filtro anti-default: si el patrón es el default, se descarta |
| **Mapa de objeciones** | ② Estrategia | ing. inversa | Fuente del problema interno del arco |
| **Lenguaje literal del comprador** | ② Estrategia | ing. inversa 1.5 | El copy se escribe **con sus palabras**, no con las nuestras |
| **Estados de consciencia** | ② Estrategia | ing. inversa 1.5b | Base del `awareness` de cada slot |
| **Campañas del ciclo y su tipo** | ③ Marketing | plan de campañas | **Agrupan el Excel.** Cada fila cuelga de una campaña |
| **Fechas importantes y de preparación** | ③ Marketing | plan de campañas | Acotan la `fecha` y avisan cuánto margen hay para producir |
| **Lanzamientos y promociones** | ③ Marketing | plan de campañas | Definen qué campaña pide oferta y cuál pide marca |
| **Idea de campaña** | ③ Marketing | plan de campañas | La BIG IDEA de cada pieza cuelga de acá — no compite con ella |
| **Funciones y pesos** | ③ Marketing | sistema de contenido | Se heredan por slot. Creative no reasigna |
| **Pilares y su mix** | ③ Marketing | sistema de contenido | Cada pilar es una **cubeta** de la que se sacan ángulos. **El peso no se toca** |
| **Frecuencia por campaña** | ③ Marketing | sistema de contenido | Cuántos reels, historias y carruseles. Define el número de filas |
| **Jerarquía de mensaje** | ③ Marketing | sistema de contenido | La ley: la pieza cambia el ángulo, **nunca la promesa** |
| **Temperatura y awareness** | ③ Marketing | sistema de contenido | Temperatura → función · awareness → **ángulo** |
| **Especificación de tipos de pieza** | ③ Marketing | sistema de contenido | El encargo: qué tipo de pieza pide el plan |
| **Función única y vetos por canal** | ③ Marketing | plan por canal | Techo del canal: qué función tiene y **qué NO se hace ahí** |
| **Los slots** | ③ Marketing | calendario | El encargo operativo. No se agregan ni se mueven. **Solo la `fecha` la fija Creative**, dentro de la semana |
| **`objetivo_del_slot`** | ③ Marketing | calendario | Más específico que el `goal_del_arte`. Va al Excel y manda sobre el contenido concreto |
| **Guidelines, tono, lente de marca** | ②B Branding | — | El lente se aplica como filtro en el toolkit (técnica 2) |
| **Estética y dirección visual** | ②B Branding | — | Fuente de `estetica_mood`. Creative elige **dentro** de lo permitido |
| **Referencias visuales de marca** | ②B Branding | — | Referencias **estéticas** — distintas de las de performance del swipe file |
| **Banco de assets** | ②B Branding | — | Fuente de `elementos_graficos` ya existentes |
| **Do's & don'ts** | ②B Branding | — | Guardrail de copy y estética |
| **Creativos que rinden en pauta** | ⑧B Ads | — | Insumo del swipe file (el 10 % propio) |
| **Claims aprobados** | ⑧B Ads | — | Qué se puede afirmar sin pedir permiso otra vez |

> **Regla dura:** ninguno de estos campos se reescribe con otras palabras dentro de Creative. Se
> **cita** con su ruta. Reescribirlos crea una segunda versión de la verdad, y en dos ciclos las dos
> versiones no coinciden.

> **Dos tipos de referencia, y no se mezclan.** Las de **②B Branding** dicen cómo debe *verse* la
> marca (estética). Las del **swipe file** dicen qué *funciona* (performance, con señal `⏱️`). Una
> referencia estética sin señal de rendimiento no entra al swipe file, y una referencia de
> performance no sobrescribe las guidelines.

---

# ① `brief-creativo.md`

**Consume:** ① Comprensión + ② Estrategia + ③ Marketing + ②B Branding. **No consume ningún entregable de Creative.**

| Campo que produce | Input que lo genera | Transformación |
|---|---|---|
| **A · Contexto cargado** | Existencia de cada archivo | Verificación, no producción. Falta uno → BLOQUEADO |
| **B · Extracto de estrategia** | ② posicionamiento | Se **cita** con ruta y sección. Cero reescritura |
| **C · Jerarquía de mensaje** | ③ sistema de contenido 6.5 | Se copia tal cual — es la ley del bloque |
| **D · Avatar y filtro** | ② ing. inversa 1.5 + ① audiencia | Se declara **como filtro**, no como análisis nuevo |
| **E · Slots del bloque** | ③ calendario | Se filtran las filas del ciclo. Sin editar |
| **F · Traducción de slot** | `funcion` (manda) + `temperatura` (ajusta) + `awareness` (ángulo) | **Tabla fija** de `playbooks/TRADUCCION-DE-SLOT.md`. Vocabulario cerrado de 6 valores |
| **F2 · `fecha`** | `semana` + `frecuencia` del slot + estacionalidad §1.2e | El día concreto dentro de la semana. **Lo único que Creative fija del calendario** |
| **G · Función y vetos por canal** | ③ plan por canal | Se copian: función única, formatos y qué NO se hace |
| **H · Restricciones** | ① capacidad de producción + ②B Branding + ⑧B Ads | Se cuantifican: cuántas filas caben |

### A qué alimenta cada campo

| Campo | Alimenta a |
|---|---|
| **B · Promesa y mecanismo** | → ③ el filtro de toda BIG IDEA · ④ el techo del copy |
| **B · Enemigo y objeciones** | → ③ el problema interno del arco · ④ el ángulo del hook |
| **C · Jerarquía de mensaje** | → ④ qué puede cambiar la pieza y qué no |
| **D · Avatar** | → ③ descarte de ideas **antes de escribirlas** · ④ el lenguaje del copy |
| **E · Slots** | → ⑥ una fila por slot. Es el índice del Excel |
| **F · `goal_del_arte`** | → ④ **el hook y el CTA** · ⑦ la métrica que juzga la pieza. Valores: `alcance · memoria · valor-de-uso · confianza · accion · pertenencia` |
| **E · `objetivo_del_slot`** | → ④ el contenido concreto de la pieza · ⑥ columna propia. **Si el `goal_del_arte` lo contradice, el slot se devuelve** |
| **G · Capacidad** | → ⑤ cuántas adaptaciones · ⑥ techo de filas |

> **El `goal_del_arte` es el multiplicador de Creative.** Es el campo que decide el hook, el CTA y la
> métrica. Traducirlo mal desalinea la pieza entera aunque el concepto sea bueno.

---

# ② `swipe-file.md`

**Consume:** ① brief (pilares y formatos del bloque) + ② ingeniería inversa + ⑦ del ciclo anterior

| Campo que produce | Input que lo genera | Transformación |
|---|---|---|
| **1.1 Heredado** | Tabla 15×7 de ② Estrategia | Se **filtran** las filas que aplican a este bloque |
| **1.2 El hueco** | 1.1 vs. los formatos de los slots | Diferencia: solo eso se cosecha nuevo |
| **1.3 Bóveda** | Cosecha en Ad Library / social / landings | Organizada **por pilar y tipo de hook** |
| **1.4 Señal** | Días corriendo · outlier vs. base propia | Escala `⏱️`, **separada** de 🟢/🟡/⚪ (patrón por fuentes). Sin señal no entra |
| **1.5 Patrones** | Las piezas de 1.3 | Se extrae **estructura**, nunca la imagen |
| **1.6 Hipótesis** | Patrón + marca + pilar | El único paso donde se genera algo nuevo |
| **1.7 Anti-default** | Patrón **contra** mapa de saturación | Si es el default de categoría, se descarta |
| **1.8 Banco de hooks** | ⑦ del ciclo anterior | Los ganadores propios suben al tope |

### A qué alimenta cada campo

| Campo | Alimenta a |
|---|---|
| **1.5 Patrones de ángulo** | → ③ la referencia que entra al toolkit |
| **1.5 Patrones de hook** | → ④ qué caja de las 7 elegir |
| **1.5 Patrones de formato y prueba** | → ④ la estructura · ⑤ la duración por canal |
| **1.6 Hipótesis** | → ⑥ columna `hipotesis` · ③ candidatas de BIG IDEA |
| **1.3 Links** | → ⑥ columna `referencia_visual` |
| **1.7 Descartes** | → ③ **Novelty** del filtro D/N/R |

---

# ③ `conceptos.md` — el nudo del sistema

**Consume:** ① completo + ② patrones + lente de marca. **Alimenta:** todo lo que sigue.

## Capa 2 — BIG IDEA

| Campo | Input | Transformación |
|---|---|---|
| **Insight** | ① avatar + ② ingeniería inversa 1.5 + mapa de objeciones | Se busca el dolor **interno y específico**, con cita literal |
| **Técnicas aplicadas** | ② referencia + lente de marca (Branding) | 1-2 del toolkit. La técnica **Choque** es la regla anti-copia operativa |
| **3 BIG IDEAS** | Insight + técnica + ① idea de campaña | 3 candidatas de 1 frase. Cuelgan de la campaña, no compiten con ella |
| **Derivación** | La BIG IDEA elegida | Hook, tono y estética salen **de la misma idea** |
| **Filtro D/N/R** | BIG IDEA **contra** mapa de saturación | Novelty solo tiene sentido contra el default de categoría |
| **Prueba del logo** | BIG IDEA + activos distintivos | ❌ → se vuelve al toolkit. **No se fuerza** |

> **Correlación crítica:** una BIG IDEA solo sobrevive si el mapa de saturación de ② Estrategia no la
> muestra como default. Ahí es donde *"me gustó la referencia"* se confirma o se cae.

## Capa 3 — Historia

| Campo | Input | Transformación |
|---|---|---|
| **Héroe** | ① avatar | Es el cliente. **Nunca la marca** |
| **Problema interno** | Mapa de objeciones + lenguaje literal | Se traduce la objeción externa a su versión emocional |
| **Guía** | ① promesa + mecanismo único + RTB | La marca muestra empatía (el insight) + autoridad (el RTB) |
| **Plan** | ① mecanismo único | 3 pasos derivados del cómo, no inventados |
| **Llamado** | ① `goal_del_arte` | Directo en BOFU, transicional en TOFU |
| **Éxito** | ① promesa | El después de la promesa, hecho visible |
| **Fracaso evitado** | ① enemigo | El costo de quedarse con el statu quo |

---

# ④ `direccion-creativa.md`

**Consume:** ③ completo + ② patrones de hook y formato + ① `goal_del_arte`, jerarquía y avatar

| Campo | Input | Transformación |
|---|---|---|
| **Tipo de hook** | ③ derivación + ② patrones + ① `goal_del_arte` | Se elige de las 7 cajas (ver tabla abajo) |
| **Texto del hook** | ③ BIG IDEA + ① lenguaje literal | Texto **exacto**, legible en mute, sin saludo |
| **Frame 1 visual** | ③ dirección estética | Lo decide Creative, **no el editor** |
| **Estructura + timing** | ① formato del slot + ② duración probada | HOOK 0-3s · BODY 4-15s · PAYOFF 16-45s · CTA ~5s |
| **Cierre del gap** | El tipo de hook | Obligatorio si es Curiosity Gap o Story/Tease |
| **Guion** | ③ arco + ④ estructura con timing | Un tramo por pieza del arco. Literal, `VO 0-3s: "..."`. `N/A` en estáticos |
| **Copy** | ③ arco + ① tono de Branding + lenguaje literal | Rule of Three, texto literal |
| **Jerarquía de texto** | El copy | título > subtítulo > CTA, explícita |
| **CTA** | ① `goal_del_arte` | Familia por etapa. **Nunca "comprá" por default** |
| **Flags de aprobación** | Bold claims con dato/precio/promesa | `⏸️` + quién valida (Branding o Ads) |
| **Grid y jerarquía visual** | ① formato del canal | Carrusel → columnas · cover → tercios · post → modular |
| **Foco** | ③ BIG IDEA | **Uno solo.** El que la idea exige |
| **Layout de texto** | El copy + el grid | Ubicación, tamaño, proporción, peso |
| **Safe zones** | ① canal | Del canal, marcadas |
| **Mood / estética** | ③ derivación + lente de Branding | Paleta, iluminación, acabado |
| **Elementos gráficos** | Banco de assets de Branding | Del banco, no inventados |
| **SHOT LIST** | ③ arco + ① duración | 8 propiedades por toma, específicas |
| **Cobertura** | El shot list | +2-3: reaction · wide · detalle |

### El `goal_del_arte` decide el hook y el CTA

| `goal_del_arte` | Cajas de hook que pesan | Familia de CTA |
|---|---|---|
| `alcance` (TOFU) | Pattern Interrupt · Bold Claim · Pain | **Engagement** |
| `memoria` (TOFU→MOFU) | List/Number · Story/Tease | **Engagement** |
| `valor-de-uso` (MOFU) | List/Number · Question | **Tráfico** |
| `confianza` (MOFU) | Curiosity Gap · Bold Claim con dato | **Tráfico o DM** |
| `accion` (BOFU) | Pain · Question directa · Bold Claim | **Conversión** |
| `pertenencia` (post-compra) | Story/Tease · Question | **Engagement** |

> Esta es la correlación que más se rompe en la práctica: se elige el hook por gusto y el CTA por
> costumbre, en vez de por la etapa diagnosticada.

---

# ⑤ `adaptacion-por-canal.md`

**Consume:** ③ concepto + ④ dirección + ① slots y capacidad

| Campo | Input | Transformación |
|---|---|---|
| **Canales a producir** | ① slots del calendario ∩ ③ plan por canal | **Intersección**, no unión. Sin slot no se produce |
| **Vetos por canal** | ③ plan por canal "qué NO se hace acá" | Se copian literales. No se reinterpretan |
| **Specs por canal** | `toolkit/07-plataformas.md` | Duración, ratio, resolución, audio, watermark |
| **Ajuste de tono** | Qué premia el canal | TikTok más crudo · Reels más factura · Shorts más how-to |
| **Plan de repurposing** | ③ concepto + ④ copy | 1 concepto → N piezas: cortes, quotes, frames |
| **Canales descartados** | ① slots ausentes + ③ canales descartados | Coherencia con lo que ya se decidió no hacer |

---

# ⑥ `ideas-de-contenido.csv` — el entregable definitivo

**Consume:** ①②③④⑤. **No agrega información nueva: la ordena en filas ejecutables.**

| Columna | Viene de | Skill que la produce |
|---|---|---|
| `id` | Operativo | — |
| `campana` | ① E — la campaña de ③ Marketing a la que pertenece el slot (heredada) | `cr-brief` |
| `slot_origen` | ① E — la fila del calendario | `cr-brief` |
| `fecha` | ① F2 — el día dentro de la `semana` del slot | `cr-brief` |
| `canal` | ① E (heredada) | `cr-brief` |
| `formato` | ① E (heredada). Solo si falta: `🟡 propuesto por Creative` | `cr-brief` |
| `pilar` | ① E (heredada) | `cr-brief` |
| `funcion` | ① E (heredada) | `cr-brief` |
| `temperatura` | ① E (heredada) | `cr-brief` |
| `awareness` | ① C/E (heredada) | `cr-brief` |
| `objetivo_del_slot` | ① E (heredada) | `cr-brief` |
| `goal_del_arte` | ① F — derivado de la función, vocabulario cerrado | `cr-brief` |
| `emocion` | ③ qué tiene que sentir quien la ve — una sola, en lenguaje del comprador | `cr-big-idea` |
| `mezcla` | ② la cubeta 70/20/10 del patrón que sostiene la fila | `cr-swipe-file` |
| `concepto` | ③ BIG IDEA elegida | `cr-big-idea` |
| `hook` | ④ tipo + texto exacto | `cr-hook-copy` |
| `guion` | ④ voz en off / diálogo literal por tramo | `cr-hook-copy` |
| `copy` | ④ texto literal | `cr-hook-copy` |
| `layout_de_texto` | ④ grid + jerarquía | `cr-arte-video` |
| `escenas` | ④ SHOT LIST — acción y lugar | `cr-arte-video` |
| `encuadres` | ④ SHOT LIST — encuadre por escena | `cr-arte-video` |
| `duraciones` | ④ SHOT LIST — segundos por escena | `cr-arte-video` |
| `referencia_visual` | ② link de la bóveda | `cr-swipe-file` |
| `estetica_mood` | ④ mood + lente de Branding | `cr-arte-video` |
| `elementos_graficos` | ④ + banco de assets | `cr-arte-video` |
| `audio_musica` | ④ shot list (audio por toma) + ⑤ audio del canal | `cr-arte-video` + `cr-adaptacion` |
| `hipotesis` | ② 1.6 (el patrón que se prueba) → una por fila | `cr-swipe-file` + `cr-adaptacion` |
| `aprobacion_claim` | ④ flags | `cr-hook-copy` |
| `traza_a_must_be_true` | ① E (heredada, la letra) | `cr-brief` |
| `handoff` | ⑤ canal + formato → quién ejecuta: `produccion-video` · `produccion-foto` · `diseno-grafico` · `posting-directo` | `cr-adaptacion` |
| `estado` | Operativo | — |

> **Nada nace acá.** Si una columna no se puede llenar desde un entregable anterior, falta una capa —
> o falta un input de aguas arriba, y entonces la fila va `PENDIENTE`, no inventada.

---

# ⑦ `aprendizaje-creativo.md` — y el retorno

**Consume:** ⑥ filas publicadas + métricas (③ Marketing / plataforma) + ② bóveda actual

| Campo | Input |
|---|---|
| **Lectura por goal** | ⑥ `goal_del_arte` + métricas — nunca en agregado |
| **Patrones ganadores** | ⑥ `hook` `formato` `concepto` agrupados por resultado |
| **Hipótesis con veredicto** | ⑥ columna `hipotesis` |
| **Fatiga** | CPM sube + CTR baja, por fila |
| **Actualización del toolkit** | Los patrones que ganaron 3+ veces |
| **Banco de hooks** | Los `hook` propios que ganaron |
| **Devoluciones aguas arriba** | Lo que Creative detectó y no le toca arreglar, con el departamento destino |

### El retorno al ciclo

| Output de ⑦ | Actualiza |
|---|---|
| Patrón ganador de hook | → ② 1.8 banco de hooks · `toolkit/02-hooks.md` (sube al tope) |
| Patrón ganador de formato | → ⑤ specs por canal · `toolkit/07-plataformas.md` |
| Patrón ganador de ángulo | → ③ candidatas de BIG IDEA del bloque siguiente |
| Técnica del toolkit que ganó | → `toolkit/01-tecnicas-de-direccion.md` |
| Hipótesis refutada | → ② se descarta el patrón que la produjo |
| Fatiga detectada | → ③ se remixa: mismo ángulo, nuevo visual |
| Pieza que no movió nada estratégico | → **devolución a ③ Marketing**: el slot no estaba justificado |

```
gana → se remixa (mismo ángulo, nuevo visual) → se refresca antes de la fatiga → sigue ganando
```

---

# Reglas de correlación

1. **Ningún campo sin padre.** Si no se puede señalar de dónde viene, o se inventó o falta una capa.
2. **Lo que viene de afuera se cita, no se reescribe.** Reescribir un campo de aguas arriba crea una
   segunda versión de la verdad, y en dos ciclos no coinciden.
3. **La estrategia manda sobre la idea.** ① restringe ③. Una BIG IDEA que necesita otra promesa no
   es nuestra.
4. **La evidencia manda sobre el gusto.** ② entra por longevidad y outlier, nunca por estética.
5. **La idea manda sobre la ejecución.** ③ decide; ④ y ⑤ solo la bajan a instrucción.
6. **El Excel no crea nada.** ⑥ solo ordena en filas lo ya decidido.
7. **La capacidad es un techo duro.** ① G limita ⑤ adaptaciones y ⑥ filas. Nunca al revés.
8. **El toolkit modula, no decide.** Ajusta técnicas y formatos — pero la evidencia del cliente le
   gana a la ficha.
9. **El ciclo cierra en ② y ③, no en ①.** El aprendizaje actualiza la bóveda y el concepto. El brief
   solo se rehace si el plan de Marketing cambió de ciclo.
