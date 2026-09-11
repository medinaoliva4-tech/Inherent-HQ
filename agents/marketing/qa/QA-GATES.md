# QA Gates — Agente de Marketing

Checklist por fase. **Ninguna fase se entrega sin pasar su bloque completo.**
Si un ítem falla, se corrige — no se entrega con el ítem fallado sin marcarlo.

---

## Gate 0 — Frontera *(se corre en TODA sesión, antes que cualquier otra cosa)*

- [ ] El pedido **no** es de Strategy (posicionamiento, territorio, enemigo, promesa, 3 Verdades)
- [ ] El pedido **no** es de Growth (precio, oferta, money model, funnel, compra de medios)
- [ ] El pedido **no** es de Branding (paleta, tipografía, sistema de tono)
- [ ] El pedido **no** es de Creative (copies, guiones, conceptos, ideas de pieza)
- [ ] El pedido **no** es de Content (publicar, programar, community management)
- [ ] No se está por escribir en ningún archivo fuera de `clients/<cliente>/marketing/`

---

## M0 — Handoff
- [ ] `posicionamiento.md` existe **y pasó su gate humano** — si no: **BLOQUEADO**, se para acá
- [ ] Los 5 campos intocables están copiados **literal**: promesa · territorio · enemigo · mecanismo único · movimiento
- [ ] El objetivo del ciclo está copiado con su métrica y su horizonte
- [ ] Las renuncias de Strategy están registradas
- [ ] Los CEPs a poseer y las objeciones están copiados
- [ ] La economía unitaria y la capacidad de producción están, o marcadas `⚠️ SIN DATOS`
- [ ] La cadencia base por canal está extraída del `calendario-estrategico.csv`
- [ ] El motor de demanda y el ciclo de compra están registrados
- [ ] Cada faltante tiene su supuesto declarado y su vía de resolución
- [ ] Hay veredicto explícito `PASS` o `BLOQUEADO`

## M1 — Terreno comercial
- [ ] Los competidores están **verificados por MCP**, no listados de memoria (`🟢` / `🟡`)
- [ ] Cada ad de la tabla tiene **días corriendo** — sin eso no se sabe cuál ganó
- [ ] Los patrones están marcados 🟢 (3+ fuentes) / 🟡 (1-2) / ⚪ (ruido), con conteo
- [ ] Las mecánicas promocionales tienen magnitud y momento del año
- [ ] Cada fecha del calendario comercial tiene **fuente y año de referencia**
- [ ] Están identificados valles, ventanas de saturación y ventanas de aire
- [ ] **Ningún benchmark de costo está inventado**: tiene fuente o va `⚠️ estimado`
- [ ] El **CAC máximo tolerable** está calculado contra el margen real
- [ ] Hay 2-4 avatares, cada uno con **frase literal citada** (o `⚠️ SIN DATOS`)
- [ ] Cada avatar tiene nivel de consciencia y CEP de entrada
- [ ] Dos avatares difieren en al menos dos dimensiones de motivación, no solo en demografía
- [ ] El **nivel de sofisticación** está declarado y justificado con evidencia de ads
- [ ] 🛑 **Ninguna oración decide una campaña**
- [ ] El bloque de fuentes está completo (MCPs usados, no disponibles, fecha, confianza)

## M2 — Distribución del objetivo
- [ ] El objetivo está **copiado** de Strategy, no reinterpretado
- [ ] Los % **suman 100**
- [ ] Cada fuente tiene número absoluto, no solo porcentaje
- [ ] Cada fuente declara su **supuesto de conversión** y el **origen** del supuesto
- [ ] La **base actual** (lo que ya vende) entra como fuente — no es cero
- [ ] Está declarado si la distribución es **PLAN** o **HIPÓTESIS**
- [ ] Si es hipótesis: está definido qué se mide en las primeras 2 semanas
- [ ] El CAC implícito cabe en el margen, o hay ajuste declarado
- [ ] La capacidad de entrega aguanta el volumen, o hay recorte declarado
- [ ] Está declarada la parte del número que **no se va a ver** en este ciclo por el ciclo de compra
- [ ] Si el número no cierra con supuestos realistas → hay **⟲ RETORNO A ESTRATEGIA** emitido

## M3 — Mix de marketing
- [ ] Cada tipo seleccionado apalanca una **UNFAIR real** y tiene dueño con nombre
- [ ] Hay **tipos descartados documentados** con su razón
- [ ] El mix es coherente con el **motor de demanda** (captura vs creación)
- [ ] Los **tres puestos** están cubiertos: descubrimiento · confianza · conversión
- [ ] Ningún canal duplica el trabajo de otro
- [ ] El rol de Strategy está **copiado** en cada canal, no reinterpretado
- [ ] Cada canal tiene métrica de compra declarada, no de engagement
- [ ] El balance marca/respuesta coincide con el declarado por Strategy, o está justificada la diferencia

## M4 — Campañas
- [ ] **Toda campaña tiene traza a una MUST BE TRUE** — sin traza, se elimina
- [ ] Toda campaña está clasificada en los **dos ejes**: naturaleza + función
- [ ] Las campañas están agrupadas en **orgánicas** y **pautadas**
- [ ] Toda campaña tiene **un** avatar y **un** nivel de consciencia, no "todos"
- [ ] **Ningún ángulo cambia la promesa** — la promesa está copiada literal en cada ficha
- [ ] El mecanismo y las pruebas están **tomados de Strategy**, no inventados
- [ ] Los **7 mensajes base** están completos en cada campaña
- [ ] Toda campaña tiene dueño con nombre y **fecha de fin**
- [ ] El **filtro comercial** (4 preguntas) está aplicado y registrado campaña por campaña
- [ ] Hay campañas descartadas documentadas
- [ ] Las campañas de **marca** están declaradas como tales y no se miden con ROAS
- [ ] Toda mecánica promocional está `PENDIENTE` de validación de Growth
- [ ] Las campañas respetan las **renuncias** declaradas por Strategy
- [ ] El loop de cada campaña está declarado, o marcada **no compounding**
- [ ] La suma de `% del objetivo` de todas las campañas = 100%
- [ ] Ninguna ficha contiene copies, guiones ni conceptos creativos

## M5 — Calendario comercial
- [ ] **Toda fila de lanzamiento tiene `fecha_prep_inicio`**, calculada hacia atrás
- [ ] El cálculo incluye el tiempo de **aprobación del cliente** (`nucleo.md`)
- [ ] Toda fila tiene `responsable` con nombre
- [ ] Toda campaña tiene `fecha_fin` — ninguna queda abierta
- [ ] Las fechas duras de M1.3 están reflejadas
- [ ] Ninguna campaña de **activación** cae en un valle sin justificación
- [ ] Ninguna campaña cae en ventana de **saturación** sin presupuesto extra declarado
- [ ] No hay dos lanzamientos solapados compitiendo por el mismo equipo
- [ ] Las dependencias están marcadas como secuenciales o paralelas
- [ ] Las campañas con **expectativa** tienen payload real declarado
- [ ] El horizonte respeta el **ciclo de compra**
- [ ] **No contradice** al `calendario-estrategico.csv`

## M6 — Volumen y presupuesto
- [ ] El volumen se calculó como **base + pico**, no reemplazando la base
- [ ] El chequeo de capacidad se hizo sobre el **total semanal de todas las campañas activas**
- [ ] Hay veredicto `cabe` / `NO CABE` por semana
- [ ] Si no cabe: el recorte está **declarado** con su criterio e impacto
- [ ] La capacidad de producción viene de `nucleo.md`, o está `⚠️ SIN DATOS`
- [ ] El split marca/respuesta en plata coincide con el balance de M3.3
- [ ] La **reserva de prueba es ≥ 10%**
- [ ] El costo por resultado implícito cabe en el **CAC máximo tolerable**
- [ ] El presupuesto de pauta se entrega **por bloque**, nunca repartido por día
- [ ] El total coincide con el declarado en `plan-de-marketing.md` §3.1
- [ ] Está declarado dónde está el cliente en el **orden de inversión**

## M7 — Lectura comercial
- [ ] Cada campaña se leyó contra **la función que declaró antes de lanzar**
- [ ] Ninguna campaña de marca fue juzgada con ROAS
- [ ] Ninguna campaña de activación fallida fue reclasificada como "de marca" después del resultado
- [ ] La distribución real está comparada contra la planificada, fuente por fuente
- [ ] Cada supuesto tiene veredicto: confirmado / optimista / pesimista / ⚠️ no medible
- [ ] Está declarado si la distribución pasa de **hipótesis a plan**
- [ ] El plan de iteración cambia **una variable por vez**
- [ ] Las objeciones nuevas y el lenguaje literal nuevo están dirigidos a Strategy y Creative
- [ ] Cada campaña tiene declarado si **compuso** o `no compounding`
- [ ] Si algo del nivel marca no se sostiene → hay **⟲ RETORNO A ESTRATEGIA**

---

## Los 5 errores que más se repiten

| Error | Dónde se detecta | Regla que lo previene |
|---|---|---|
| Rehacer el posicionamiento con otras palabras | M0 / M4 | Los 5 campos intocables se **copian literal** |
| Un ángulo que cambia la promesa | M4 | Un ángulo cambia la puerta, no la casa |
| Volumen revisado campaña por campaña | M6 | El chequeo es sobre el **total semanal** |
| Fecha de lanzamiento sin preparación | M5 | Se calcula **hacia atrás**, paso por paso |
| Campaña de marca juzgada con ROAS | M7 | La función se declara **antes** de lanzar |
