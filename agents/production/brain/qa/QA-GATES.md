# QA Gates — Agente de Producción

Checklist por capa. **Ninguna capa se entrega sin pasar su bloque completo.**

---

## Capa 0 — Brief de producción
- [ ] El `ideas-de-contenido.csv` de ④ Creatividad existe y **tiene el Gate 3 aprobado** — si no, **BLOQUEADO**
- [ ] Las guidelines y el banco de assets de ②B Branding están cargados — si no, **BLOQUEADO**
- [ ] Las fechas de campaña y **de preparación** de ③ Marketing están cargadas — si no, **BLOQUEADO**
- [ ] El presupuesto disponible y la capacidad declarada de ① Comprensión están cuantificados
- [ ] Solo se filtraron las filas con `handoff = produccion-video` o `produccion-foto`
- [ ] Las filas están **agrupadas por `campana`**
- [ ] **Producibilidad verificada fila por fila:** `escenas`, `encuadres` y `duraciones` tienen el mismo número de ítems y el mismo orden
- [ ] Cada escena declara **qué acción ocurre y en qué tipo de lugar**
- [ ] Cada fila tiene `estetica_mood` y `emocion` — sin ellas el equipo dirige a ciegas
- [ ] **Cruce contra el banco de assets hecho:** lo que ya existe está marcado `reutiliza` y **no entra al desglose**
- [ ] Los **tres techos** están declarados en números: presupuesto · días de rodaje · capacidad
- [ ] Si el ciclo excede algún techo: el exceso está declarado **en filas concretas**, no en general
- [ ] Las devoluciones ↩️ tienen los **tres elementos** (qué no se puede · por qué importa · dos alternativas)
- [ ] 🛑 **Ninguna decisión creativa fue cambiada**

## Capa 1 — Desglose
- [ ] Cada fila creativa se partió en **una fila de producción por escena**
- [ ] **Toda fila tiene `id_creativo`** — sin él se elimina
- [ ] `accion`, `encuadre`, `duracion_s` y `tipo_de_lugar` están **copiados literales**, no parafraseados
- [ ] Las **8 categorías** están completas en cada escena — las que no aplican dicen `N/A`, no vacío
- [ ] `locacion` es un lugar **concreto**, no el tipo de lugar heredado
- [ ] Los props están listados **uno por uno** — *"ambientación de oficina"* no es un prop
- [ ] El producto declara **cuántas unidades**; lo destructivo tiene mínimo 3
- [ ] El vestuario está verificado: **sin logos de terceros, sin rayas finas, sin verde si hay croma**
- [ ] Los permisos necesarios están identificados, incluidas **cesiones de imagen de personas de fondo**
- [ ] El `equipo` se **derivó del `encuadre`**, no se eligió por gusto
- [ ] 🛑 **No se agregó ninguna escena** que el Excel creativo no pidió
- [ ] El inventario consolidado del ciclo está armado, sin repetir ítems

## Capa 2 — Consolidación
- [ ] La **matriz completa** del ciclo está armada antes de agrupar
- [ ] Agrupado por los **4 ejes en orden**: locación → talento → setup de luz → producto
- [ ] Las escenas sin rodaje (capturas, placas, composiciones de post) están en **J0** y **no cuentan para el factor**
- [ ] El `orden_en_jornada` está por **costo de cambio**, no narrativo
- [ ] Los cambios de vestuario están **agrupados, no alternados**
- [ ] El producto destructivo está **al final de su bloque**
- [ ] La **cobertura** está ubicada antes de desarmar cada setup, **nunca al final del día**
- [ ] `tiempo_estimado_min` es tiempo de **set**, no `duracion_s` de la pieza
- [ ] La carga de cada jornada incluye montaje, cambios de setup, comida y desmontaje
- [ ] 🛑 **Ninguna jornada supera 10 h efectivas** — si no entra, se parte, no se comprime
- [ ] El **factor de consolidación** está declarado con su lectura
- [ ] Si el factor es **< 4**: está explicado por qué, y devuelto a ④ con números si la dispersión es del Excel creativo
- [ ] 🛑 **Ninguna decisión creativa fue cambiada para lograr el agrupamiento**

## Capa 3 — Recursos
- [ ] Cada ítem tiene `origen_del_recurso` del vocabulario cerrado de 5 valores
- [ ] **Cada ítem tiene `responsable` con nombre**, no rol genérico
- [ ] Cada ítem tiene **fecha de confirmación**, con más margen para `comprado` y `a-producir`
- [ ] Semáforo 🟢/🟡/🔴 aplicado a todo ítem
- [ ] Todo 🟡 a menos de **48 h** de su jornada está marcado 🔴 y con su plan B activado
- [ ] Toda escena con dependencia externa (clima · talento · permiso · producto) tiene `riesgo` y `plan_b` **escritos**
- [ ] Las locaciones pasaron el **chequeo de viabilidad** de `toolkit/02` — visita o fotos actuales, franja por escrito, luz verificada **a la hora del rodaje**, ruido, acceso, electricidad
- [ ] Toda locación exterior tiene **plan B con interior alternativo o fecha reservada**
- [ ] Toda persona identificable tiene **cesión de imagen gestionada**, con canales, territorio y vigencia
- [ ] Si hay uso en pauta, está **declarado aparte** en la cesión
- [ ] Los permisos están **gestionados primero**, no dejados para el final

## Capa 4 — Presupuesto
- [ ] 🛑 **La Capa 2 está hecha.** Presupuestar sin consolidar se rechaza, aunque lo pidan directo
- [ ] Se costeó **por jornada**, no por pieza
- [ ] Los 5 bloques están separados: fijos · talento · variables por escena · post base · contingencia
- [ ] **Post base ≠ edición.** El montaje, el color de entrega y el export no están acá
- [ ] La **contingencia va como línea propia y visible**, con el % según perfil del rodaje
- [ ] Todo número lleva **moneda y fecha de cotización**
- [ ] El **costo por pieza está calculado** (fijos prorrateados + variables propias)
- [ ] Si no entra: están **las 3 opciones** con su impacto, y **decide un humano**
- [ ] 🛑 **Producción no eligió sola qué pieza se cae**
- [ ] 🚦 **GATE 1 registrado.** Nada comprometido antes: ni reserva, ni convocatoria, ni compra

## Capa 5 — Plan de rodaje
- [ ] Un call sheet **por jornada**
- [ ] Encabezado completo: cliente · campaña · jornada · fecha · **dirección** · clima previsto
- [ ] Horarios: llamado · primer tiro · comida · wrap previsto
- [ ] **Contactos con teléfono** de cada convocado
- [ ] Orden de tiro escena por escena, con `id`, acción, encuadre, duración y tiempo estimado
- [ ] Requerimientos por escena: talento · producto · props · vestuario · equipo específico
- [ ] La **cobertura obligatoria** está marcada aparte del orden de tiro
- [ ] Los riesgos 🟡/🔴 del día están listados con su plan B
- [ ] 🛑 **La nomenclatura está definida acá**, antes de grabar — no al entregar
- [ ] Los márgenes de `toolkit/04` están incluidos: montaje, cambios de setup, traslado, desmontaje
- [ ] El llamado del talento es **≥ 30 min antes** de su primer tiro, escalonado por bloque
- [ ] 🚦 **GATE 2 registrado.** Nadie convocado antes

## Capa 6 — Rodaje y entrega
- [ ] Todas las escenas de cada locación están grabadas y marcadas en `estado`
- [ ] **Cada escena tiene al menos dos tomas buenas**
- [ ] Las **5 tomas de cobertura** están hechas por escena con talento o producto
- [ ] El **ambiente de cada locación** está grabado (30 s)
- [ ] El audio de cada escena con voz se **escuchó con auriculares**, no se asumió por el medidor
- [ ] 🛑 **Backup en dos lugares antes de salir de la locación**
- [ ] Los **selects están marcados** — las tomas buenas, y solo esas
- [ ] 🛑 **No se entregó ninguna pieza terminada** — eso es de ⑥A Diseño y ⑥B Video Editing
- [ ] La nomenclatura está aplicada, con `id_creativo` y `escena` **exactos**
- [ ] La estructura de carpetas sigue `toolkit/07`, con `01_SELECTS` organizado **por `id_creativo`**
- [ ] El **manifiesto cruza el Excel fila por fila**
- [ ] Toda escena `Planificada` que no llegó a `Entregada` tiene **motivo escrito**
- [ ] 🛑 **Ninguna fila creativa se declaró completa si le falta una escena**
- [ ] 🛑 **Nada se borró**, ni el descarte
- [ ] 🚦 **GATE 3 registrado**

## Capa 7 — Loop
- [ ] **`costo_real` cargado en todas las filas**, aunque coincida con el estimado
- [ ] Desvío de costo calculado por ítem y por jornada
- [ ] Desvío de tiempo calculado por escena, con explicación de los que se pasaron
- [ ] **Material no usado identificado**, cruzado contra lo que ⑥A y ⑥B usaron en la pieza final
- [ ] El material no usado se devuelve a ④ Creatividad **como dato**, no como reclamo
- [ ] Factor de consolidación **real vs. previsto**, con dónde se perdió
- [ ] La **corrección de capacidad** para ① Comprensión está redactada **como propuesta**
- [ ] 🛑 **No se editó ningún archivo de otro departamento**
- [ ] Los tiempos y costos del `toolkit/` están actualizados con el dato real
- [ ] Sin datos: `⚠️ SIN DATOS` + a quién pedírselos. **Ningún desvío inventado**

---

## Coherencia global — antes del handoff
- [ ] Brief, desglose, jornadas, recursos y Excel **no se contradicen**
- [ ] **Toda fila del Excel traza a un `id_creativo`**, y de ahí a un slot y a una MUST BE TRUE
- [ ] **Ninguna escena existe que ④ Creatividad no haya pedido**
- [ ] **Ninguna decisión creativa fue cambiada** — lo que no se podía, se devolvió
- [ ] Las devoluciones tienen **respuesta de ④ registrada con fecha**
- [ ] Los 3 gates humanos están registrados con estado
- [ ] **Ningún entregable pisa a ①②③, ②B Branding, ④ Creatividad, ⑥A Diseño, ⑥B Video Editing, ⑦ Posting o ⑧B Ads** — se verifica contra la tabla «Qué NO produce» de `OUTPUTS.md §D`
- [ ] Ningún campo de otro departamento fue reescrito — todos citados con ruta
- [ ] Todo faltante está marcado `BLOQUEADO` o `PENDIENTE`, **ninguno omitido en silencio**
- [ ] El bloque de HANDOFF está emitido completo, con las filas creativas incompletas nombradas
