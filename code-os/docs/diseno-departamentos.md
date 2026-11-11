# Diseño: departamentos, herramientas y agentes de Inherent (versión de trabajo, 2026-11-10)

Aprobado por el CEO en el chat el 2026-11-10 («dale ya a todo»). Regla del CEO: **sencillo**. Lo que se armó antes y no encaja con esto se BORRA y se vuelve a crear corto; no se adapta lo viejo salvo que dé un boost claro. Nada de 50 agentes ni 30 skills: cada área = 1 orquestador + 4 skills como máximo.

## 1. Regla: agente, herramienta, persona
- **Agente:** trabajo de profundidad o de volumen rápido (investigar, ver cientos de videos y sacar patrones, generar variantes, borradores de diseño, derivar piezas, primer corte de video).
- **Herramienta:** donde se ve, se decide y se escribe encima (formularios, calculadoras, tableros, hojas imprimibles). Vive en el OS y se abre como **artefacto** en el panel derecho del chat.
- **Persona:** realidad, gusto y aprobación. Nada pasa de un agente a otro sin que alguien lo lea (gate de ceo-os F4.5, `ceo-os/PLAN-GATEWAY.md` §20).
- **Flujo:** el agente propone → la persona corrige en la herramienta → lo aprobado queda como dato fijo.

## 2. Una sola pantalla
Chat al centro (Code OS, `code-os/ui`). Panel derecho con pestañas: **páginas** del cliente, **portal del agente** (workflow, habilidades, botón Start, trabajos) y **herramientas como artefactos**. El workspace de cada persona se arma según su rol (el editor ve el editor de video; estrategia ve el perfil y las calculadoras). `@agente` en el chat arranca su flujo con lo ya hablado (F4.5). Backend: Claude Code (Agent SDK) vía `code-os/puente`, datos y flujos en `ceo-os`.

## 3. Áreas (de 12 agentes quedan 9)
| Área | Herramientas | Agente |
|---|---|---|
| **Strategy** (madre de todo; absorbe Growth) | Perfil del cliente ideal (ICP) · Calculadora de adquisición (outbound e inbound) · Dolores/deseos e historia villano-héroe | Investiga producto y precio, deduce quién puede comprar, busca industrias y perfiles que calcen, sintetiza entrevistas, propone la conversión de partida con fuente, panel sintético del ICP (hipótesis) |
| **Marketing y Creative** (un solo agente) | Radar con sentido · Tablero pilares × ángulos · Campañas (copy íntegro ↔ ideas ↔ piezas ↔ resultado esperado) | Ve videos en volumen, rankea winners, detecta contenido quemado, genera ideas por ángulo |
| **Production** (Pre y Post; absorbe Video Editing) | Pre: jornada, guion, shot list, permisos, compras, hooks alternos (hoja imprimible para escribir encima) · Post: editor de video simple | Borradores pre, primer corte y derivadas |
| **Diseño gráfico** | Conexión con Figma (Figwright) | Borradores de carruseles/posts/stories sobre plantillas |
| Account, Branding, Community, Posting, Ads | sin cambio de fondo | sin cambio de fondo |

Orden del trabajo en Strategy: producto → ICP → dolores, deseos, entrevistas, forma de comunicar, historia villano-héroe → adquisición.

## 4. El hilo (memoria viva del cliente)
Cada dato importante es un **nodo** con id estable y enlaces. Ejemplos: `producto`, `icp`, `dolor`, `deseo`, `pilar`, `angulo`, `campana`, `pieza`, `decision`. Cada nodo guarda `cliente`, `tipo`, `titulo`, `contenido`, `estado` (`hipotesis | aprobado`), `fuente` (enlace o «hipótesis»), `viene_de: [id]`, `version`, `actualizado`. Al cambiar un nodo, todos los nodos y trabajos que dependen de él (`viene_de`) reciben un aviso. Un índice de grafo (graphify) permite preguntar «qué depende de este dolor». Una **tarjeta de decisión** es la vista de un nodo: título, de dónde viene («viene de Strategy: dolor #2»), qué decide, estado, botones. La misma tarjeta aparece en el chat, en la herramienta y como contexto del portal cuando se agrega un archivo.
Lo construido (`code-os/herramientas`, API en `herramientas-api.md`) agrega al nodo: `numero` (el «#2» dentro de su tipo), `creado`, `actualizado_por`, `leido_por` (quién abrió qué versión: aprobar exige haber abierto la versión actual) y `aprobado_por/aprobado_en`; además el tipo `adquisicion`. Editar un nodo aprobado lo regresa a `hipotesis`. Editar o aprobar un nodo resuelve sus avisos pendientes. El índice para graphify es un `graph.json` que `graphify query/path/explain` leen directo.

## 5. Calculadora de adquisición
**Outbound.** Entradas: clientes meta `m`, conversión prospecto→cliente `c` (0–1), probabilidad objetivo `P` (p. ej. 0.95), plazo en semanas `w`. Prospectos necesarios `n` = el menor entero tal que P(Binomial(n, c) ≥ m) ≥ P. Por semana = ceil(n / w). Por día hábil = ceil(n / (w·5)). Caso de referencia (debe dar exactamente): m=5, c=1%, P=95%, w=4 → n=913, semana 229, día hábil 46. Texto fijo: «La probabilidad es una estimación estadística, no una garantía; los prospectos deben ser empresas calificadas y la tasa debe validarse con datos reales». Un selector «¿oferta comprobada?» y el agente (con IA, citando fuente) sugieren la conversión de partida; el CEO la ajusta. Outbound no se calibra con métricas: se idealiza con IA y se ajusta a mano.
**Inbound.** Entradas: ventas/clientes meta, tasa de conversión del embudo (alcance→clic→lead→cliente), engagement objetivo, presupuesto, CPM/CPC de referencia, segmentación. Salidas: alcance e impresiones necesarios, leads, presupuesto estimado, y qué reels de prueba producir. Inbound SÍ se calibra solo con las métricas reales de Zernio (analytics): las tasas reales reemplazan a las supuestas, marcando de dónde vino cada número.
El resultado de ambas se guarda en el perfil del cliente (nodo `icp`/`adquisicion`).
Detalle de lo construido: inbound calcula hacia atrás con `ceil` en cada paso (leads = clientes / tasa lead→cliente, clics = leads / tasa clic→lead, alcance = clics / tasa alcance→clic, impresiones = alcance × frecuencia); el presupuesto estimado usa el mayor entre CPM y CPC (conservador); los reels de prueba son uno por ángulo (3 genéricos si no hay ángulos) con su parte de impresiones, presupuesto y engagement mínimo. El engagement objetivo es una meta: la calibración no lo reemplaza, muestra el real al lado. Si una tasa real sale 0, mayor que 1 o sin datos, se conserva la supuesta y se avisa.

## 6. Perfil del cliente ideal (ICP), criterios
Facturación mensual, ticket promedio, frecuencia de ventas, demanda (alta), ciclo comercial (rápido), margen (suficiente para pagar el producto), capacidad, decisor, industrias/perfiles elegidos, dónde vive (geografía y canales). Con una regla guía editable por producto (p. ej. «el cliente factura ~10× el precio del producto»).
Lo construido: un ICP parcial se puede guardar como hipótesis si lo que trae tiene la forma correcta; para aprobarlo tiene que estar completo. La regla guía, la demanda alta, el ciclo rápido (≤ 30 días por defecto, editable) y el margen que paga el producto dan alertas que orientan, no bloquean.

## 7. Mejoras acordadas
1. Memoria viva del cliente (graphify) — hilo real. 2. Calculadora inbound autocalibrada con Zernio. 3. Radar automático con alternativa gratuita/open source a Apify (costo cero o casi, respetando términos de uso). 4. Entrevistas sintéticas del ICP (siempre marcadas hipótesis; los reels de prueba validan). 5. Cortes hechos por agente: el editor humano casi no edita. 6. Radar de tecnología: el sistema se mantiene al día de MCPs, open source y tendencias.

## 8. Editor de video
Candidato principal: FilmCraft (Apache-2.0/MIT, Rust, versión web WASM, servidor MCP con 650+ comandos) en prueba de 2 días; respaldo Twick (React, licencia SUL a confirmar). Solo el rol de editor lo carga. Multiplicar: ffmpeg directo (~80 %) y motor del editor para variantes con texto animado; endpoint `video.derive` con cola. Figma: queda vía Figwright desde la Mac; probar Chromium en el VPS solo si se puede sin que nadie entregue contraseñas, si no, descartar.

## 9. Reglas que no cambian
Español de tú, sencillo; evidencia o etiqueta (`[hipótesis]`); el alcance contratado es el techo; nada se publica ni se pauta sin OK; el repo es el manual (los cambios al manual vienen con este diseño aprobado); un PR por tema, sin merge hasta el «Sí, merge» del CEO.
