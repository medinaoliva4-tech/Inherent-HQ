---
name: cr-arte-video
description: >
  Capa 5 del método de ④ Creatividad — la forma. Convierte el concepto y el copy ya escritos en
  instrucciones que se ejecutan sin adivinar: las escenas (acción, encuadre, duración y tipo de
  lugar), el layout de texto, la estética y el mood, el foco visual único y los elementos gráficos
  del vocabulario cerrado de 4 familias. Acá también se decide la columna `material` del Excel
  (`ninguno` / `video` / `foto`), la que dice qué le hace falta a ⑤ Producción, y para las piezas de
  foto se escribe la § Foto. Úsala cuando pidan "el shot list", "qué tomas
  necesitamos", "cómo se filma esto", "el layout", "dónde va cada texto", "la estética", "el mood",
  "qué elementos gráficos lleva", o cuando el hook y el copy de la Capa 4 ya estén escritos.
  Creative dirige y especifica; ⑤ Producción rueda y ⑥A Diseño compone.
---

# Capa 5 — Forma

**Consume:** el concepto aprobado en **Gate 2** · el **hook, guion y copy literales** de la Capa 4, con
su **frame 1 visual** · de **②B Branding**: guidelines, lente de marca, paleta, tipografía y **banco de
assets** · de **③ Marketing**: activos distintivos y formato del slot · de **① Comprensión**: la **capacidad real de producción**.

**Produce**, dentro del `ideas-<formato>.md` de la pieza, en su sección:

| Sección | Qué lleva |
|---|---|
| **Escenas** | Tabla `# · acción · encuadre · duración · tipo de lugar` + las tomas de cobertura |
| **Forma** | Estética / mood · foco visual · elementos gráficos |
| **Layout de texto** | Ubicación, tamaño, proporción, peso y safe zones de cada texto |

**Y decide una columna del `plan-de-contenido.csv`:** `material` → `ninguno` / `video` / `foto`.

> 🛑 **Creative dirige, no ejecuta.** Nada de archivos de diseño, mockups finales, tomas grabadas,
> media generada ni edición. La especificación **es** el límite exacto del departamento.

El departamento entero está en `agents/04-creative/brain/WORKFLOW.md`.

---

## La regla de oro — especificidad

> ❌ *"Juan entra"*
> ✅ *"Juan entra por la puerta, plano medio, cámara fija, 3 s, audio directo"*

**Lo vago mata el rodaje.** Cada segundo de ambigüedad en el brief son diez minutos perdidos en el
set y una toma que falta en la edición. Lo mismo en arte:

> ❌ *"que se vea limpio y moderno, con el título arriba"*
> ✅ *"Grid de tercios. Foco = título en el tercio superior, 60 % del ancho, peso alto. Subtítulo
> inferior, 20 % del ancho, peso regular. Logo en esquina inferior derecha, dentro de safe zone.
> Fondo oscuro editorial, 1 acento de marca. Foto real del local, no stock. Orden de lectura:
> título → foto → subtítulo → logo."*

La segunda **no admite interpretación**. Eso es dirección.

🛑 **Ningún adjetivo es una instrucción.** *"Impactante"*, *"limpio"*, *"que se vea lindo"*: el ejecutor tiene que inventar la intención.

## 1 · La decisión de `material`

Es lo que le dice a ⑤ Producción qué tiene que existir antes de que nadie arme la pieza.

| `material` | Cuándo | Qué se escribe | Qué le pide a ⑤ |
|---|---|---|---|
| **`ninguno`** | Se arma con assets existentes, banco de ②B Branding o solo grafismo | `Escenas: N/A — sin material nuevo` + Forma + Layout | Nada |
| **`video`** | La pieza necesita **metraje nuevo** | Escenas + cobertura + Forma + Layout | `plan-de-produccion.csv` |
| **`foto`** | La pieza necesita una **imagen fija nueva** —producto, platillo, detalle, retrato— | **§ Foto** + Forma + Layout *(sin tabla de Escenas)* | `plan-de-fotos.csv` |

> 🔑 **`material` NO decide quién arma la pieza.** Eso lo decide el `formato`: los estáticos,
> carruseles y stories van a **⑥A Diseño**, los videos a **⑦ Video Editing**.
> **Un carrusel con `material = foto` sigue siendo de ⑥A** — solo que espera su foto primero.

- 🛑 **Se decide por si el material existe**, no por presupuesto ni por pereza. Si la idea pide una
  toma o una foto que nadie tiene, no es `ninguno`.
- 🛑 **Si el plan no cabe en la capacidad de producción**, se recorta acá **y se declara**. Nunca se
  pasa a `ninguno` en silencio para que entre.
- 🛑 **Nunca `video` para conseguir una imagen fija.** Si lo que hace falta es una foto, es `foto`:
  sacar un frame del rodaje es el **plan B** que decide ⑤ cuando la hora de foto no alcanza, no la
  forma normal de pedirla.
- Una pieza `ninguno` igual lleva **Forma y Layout completos**: Diseño necesita la intención tanto
  como Producción.

### § Foto — qué se escribe en `ideas-<formato>.md`

**Toda pieza con `material = foto` lleva esta sección.** Es lo que ⑤ convierte en una fila de
`plan-de-fotos.csv`, y lo que decide si la foto sirve para varias piezas o solo para una.

| Campo | Qué lleva |
|---|---|
| **Sujeto** | **Exacto, no genérico.** *«el Menú Ejecutivo de res, plato montado»*, no *«comida»* |
| **Encuadre** | Plano y ángulo — cenital, 45°, frontal, detalle |
| **Fondo y props** | Superficie, qué acompaña, qué **nunca** entra en cuadro |
| **Espacio libre para el texto** | Dónde NO puede haber sujeto, **según el Layout de esta pieza** |
| **Proporción** | `1:1` · `4:5` · `9:16` — la del formato donde va |
| **También la usan** | Los `id` de las otras piezas que comparten esta misma foto, o `solo esta` |

- 🛑 **El «espacio libre para el texto» sale del Layout, no se inventa.** Una foto encuadrada sin
  saber dónde va el texto se vuelve a tomar.
- **Si varias piezas comparten la foto, se escribe en todas**, con los mismos valores. ⑤ la agrupa
  una sola vez.

## 2 · Escenas — el shot list

### Las 8 propiedades de cada toma

Se resuelven las ocho, sin excepción. Una toma incompleta es una toma que se improvisa.

| # | Propiedad | Opciones |
|---|---|---|
| 1 | **# de toma** | El orden de rodaje |
| 2 | **Tamaño de plano** | `wide` · `medium` · `close-up` · `extreme close-up` · `insert / detalle` |
| 3 | **Ángulo** | Frontal · lateral · picado · contrapicado · a nivel · sobre el hombro |
| 4 | **Movimiento** | Fija · paneo · tilt · seguimiento · acercamiento · handheld |
| 5 | **Sujeto / acción** | Qué pasa **exactamente** |
| 6 | **Duración** | En segundos, y suma al total del formato del canal |
| 7 | **Audio** | Directo · voz en off · sin sonido · música · ambiente |
| 8 | **Equipo** | Trípode, gimbal, luz, micro — **solo si hace falta algo especial** |

**Las 8 caen en las 5 columnas así:** `#` ← ① · `encuadre` ← ② + ③ + ④ · `acción` ← ⑤ + ⑦ + ⑧ ·
`duración` ← ⑥. La quinta, `tipo de lugar`, es **la frontera con ⑤ Producción**: Creative escribe
*"cocina profesional en hora pico"*; Producción consigue **cuál**, con permisos, y arma la jornada.

### Ejemplo — Reel testimonial de 20 s

| # | Acción | Encuadre | Duración | Tipo de lugar |
|---|---|---|---|---|
| 1 | El cliente dice a cámara la frase del resultado · audio directo · lavalier | Close-up, frontal a nivel, fija | 6 s | Local, mesa junto a ventana |
| 2 | Manos usando el producto · sin sonido | Insert, picado, fija | 3 s | El mismo local, mostrador |
| 3 | El negocio funcionando con gente · ambiente · gimbal | Wide, a nivel, paneo lento | 3 s | Salón principal |
| 4 | Texto en pantalla con el resultado `+40 %` · música | Close-up, frontal, fija | 3 s | — (grafismo) |
| 5 | Cover de cierre: logo + CTA · música | Medium, frontal, fija | 2 s | — (grafismo) |

**Total 17 s + 3 s de margen = 20 s** ✅

### Tomas de cobertura — siempre 2-3, nombradas

**No son opcionales.** Sin cobertura el editor no puede cubrir cortes y **el video queda plano**.

| Toma | Para qué |
|---|---|
| **Reaction** | Cubrir cortes de diálogo, dar ritmo |
| **Wide** | Establecer el espacio, respirar entre puntos |
| **Detalle / insert** | Cubrir un salto, mostrar el producto, sostener una afirmación |

### Reglas duras del shot list

1. **Cada toma con las 8 propiedades resueltas.** Lo que queda vago se improvisa en el set.
2. **Las duraciones suman** al total del formato del canal. Si no suman, el shot list está mal.
3. **Siempre 2-3 tomas de cobertura**, nombradas como tales.
4. **La toma 1 es el frame 1 visual** del hook de la Capa 4, y dura lo que ese frame ocupa antes del siguiente corte. **No se decide dos veces** — acá se verifica el cruce.
5. **El audio se declara por toma**, no al final. *"Le ponemos música"* no es una instrucción.

## 3 · Forma — arte y layout

### El grid por formato

**El grid se declara siempre.** Una pieza que sale de un grid se ve intencional; una que no, improvisada.

| Formato | Grid | Por qué |
|---|---|---|
| **Carrusel** | Columnas | Cada slide repite la estructura → se siente una serie |
| **Cover de Reel / miniatura** | Tercios | Un solo mensaje, alto, para sobrevivir el crop del feed |
| **Post estático** | Modular | Bloques de peso distinto en una sola vista |
| **Story** | Tercios verticales + safe zones | La UI del canal ocupa arriba y abajo |
| **Video** | Tercios + centro protegido | El texto sobrevive al recorte de cada canal |

### Jerarquía y foco

**El orden de lectura no es casualidad. Se define y se escribe.**

| Elemento | Qué se especifica |
|---|---|
| **Foco visual** | 🛑 **UNO SOLO.** El que la BIG IDEA exige |
| **Orden de lectura** | Qué se ve 1°, 2° y 3°, explícito |
| **Layout de texto** | Ubicación, tamaño, proporción y peso de **cada** texto |
| **Safe zones** | Canal por canal, para que la UI no tape nada |
| **Estética / mood** | Paleta, iluminación, acabado — **del lente de Branding** |

> 🛑 **Un foco por pieza. Cuando todo parece importante, nada resalta.**

### Reglas duras de arte

1. **Jerarquía explícita:** `título > subtítulo > CTA`. Nunca implícita.
2. **Safe zones respetadas.** Un texto tapado por la UI es un texto que no existe.
3. **Paleta, tipografía y lente son de ②B Branding.** Creative los **aplica**, no los estira.
4. **Los activos distintivos de ③ Marketing se refuerzan, no se reinventan** cada pieza: es lo que hace que la marca acumule memoria.
5. **Foto real antes que stock** — obligatorio en locales y servicios, donde la evidencia real vence a la producción cara.
6. **Nunca hex, tipografía, píxeles ni coordenadas.** Se dice la **zona**; el resto lo resuelve ⑥A Diseño.

## 4 · Elementos gráficos — el vocabulario cerrado

Lo que se le **agrega encima** al material filmado o fotográfico.

> 🛑 **Acá está la frontera con ⑥A Diseño gráfico. Creative PIDE por nombre; Diseño CREA.**
> Creative dice qué elementos lleva la pieza y por qué. Diseño los crea o los saca del banco, los
> aplica, y decide tamaño, posición fina y acabado. Si la fila dice *"algo que se vea lindo arriba"*,
> la frontera se rompió: Diseño tiene que inventar la intención.

### Las 4 familias

**No se inventan familias nuevas.** Si algo no entra en ninguna, es composición o tipografía, y eso lo decide Diseño.

| Familia | Qué es | Ejemplos | Cuándo se pide |
|---|---|---|---|
| **① Ilustraciones** | Dibujo a mano o vectorial, no fotográfico | Trazos, iconos ilustrados, doodles, subrayados a mano, flechas dibujadas | La pieza necesita **calidez o humor** y la foto sola sale fría. También para señalar sin tapar |
| **② Assets PNG** | Imagen recortada sin fondo, pegada encima | Stickers, sellos, recortes de producto, badges, cintas, etiquetas de precio | Hay que **destacar un objeto o un dato** sin rehacer la toma |
| **③ Texturas** | Capa de material sobre la pieza | Papel, grano, polvo, tela, pinceladas, manchas de tinta | La pieza necesita **época, oficio o imperfección** — lo opuesto a lo corporativo limpio |
| **④ Formas gráficas** | Geometría pura del sistema de marca | Círculos, líneas, flechas, marcos, barras, bloques de color, contenedores | Hay que **ordenar la lectura**: separar, encuadrar, dirigir el ojo |

### Cómo se escribe

Formato **familia + qué + para qué**, separados por `·`. Una línea por elemento.

```
② sello "agotado" sobre el producto · marca la escasez sin decirla en el copy
④ marco fino en el tercio inferior · contiene el precio y lo separa de la foto
③ grano de papel al 12 % sobre toda la pieza · le saca el brillo de render
```

**Si no lleva ninguno**, se escribe `ninguno` **y por qué**: `ninguno · la foto ya tiene demasiada información y cualquier capa compite`. Un campo vacío no es un entregable.

### Reglas duras de elementos gráficos

1. 🛑 **Máximo 3 por pieza.** Del cuarto en adelante la pieza no tiene jerarquía: tiene ruido. Si hacen falta más, el problema está en el concepto.
2. **Una familia por función, no por gusto.** Si un círculo y una flecha señalan lo mismo, uno sobra. Vale la regla general: **1 foco por pieza**.
3. **Del banco antes que nuevo.** Si ②B Branding ya tiene el asset, se pide **ese**: uno nuevo multiplica versiones de lo mismo.
4. **Lo que tapa, se declara.** Qué puede taparse y qué no. Es lo que más se corrige tarde.

## Anti-patterns

| Error | Por qué falla |
|---|---|
| Tomas vagas (*"grabá algo del producto"*) | El resultado es azar, y no se puede repetir si funciona |
| Sin tomas de cobertura | El editor no puede cubrir cortes: el video queda plano |
| Duraciones que no suman, o frame 1 distinto del hook | Hay que reeditar, o la pieza arranca con otra cosa de la que prometió el brief |
| Varios focos compitiendo | Ninguno gana. La pieza se scrollea |
| Describir con adjetivos, o *"elementos gráficos de marca"* | No es una instrucción: Diseño elige a ciegas y se corrige tarde |
| Pedir 5 o 6 elementos "por si acaso" | Diseño decide qué sacar — o sea, decide la intención |
| El mismo set de elementos en todas las filas | Dejó de ser decisión creativa: es plantilla |
| Una textura para tapar una foto mala | El problema es la foto, y vuelve en la próxima pieza |
| Entregar un mockup o el video editado | Se cruzó la frontera con ⑤ Producción y ⑥A Diseño |

---

## QA

**Ninguna pieza sale de la Capa 5 sin pasar el bloque completo.**

- [ ] El **grid está declarado** y corresponde al formato
- [ ] 🛑 **Máximo 1 foco visual** por pieza, y el **orden de lectura** escrito (1° / 2° / 3°)
- [ ] **Layout de texto** con ubicación, tamaño, proporción y peso de cada texto — **sin adjetivos**
- [ ] **Safe zones** del canal marcadas
- [ ] Mood, paleta e iluminación **coherentes con el lente de ②B Branding**
- [ ] Los **activos distintivos de ③ Marketing se refuerzan**, no se reinventan
- [ ] Los elementos gráficos salen **del banco de assets**, usan las **4 familias cerradas**, son **máximo 3**, y si no lleva ninguno dice `ninguno` con su motivo
- [ ] Ninguna fila especifica **hex, tipografía, píxeles, lente, locación concreta, permiso o casting** — eso es de ⑥A Diseño y ⑤ Producción
- [ ] **La toma 1 es el frame 1 visual** definido en la Capa 4
- [ ] Cada toma resuelta con las **8 propiedades** (# · plano · ángulo · movimiento · acción · duración · audio · equipo)
- [ ] `#`, `acción`, `encuadre` y `duración` tienen **el mismo número de ítems y el mismo orden**, o la sección dice `N/A — sin material nuevo` *(o `N/A — pieza de foto`)*
- [ ] Cada escena declara su **`tipo de lugar`** — la intención, nunca la locación concreta
- [ ] Las **duraciones suman** al total del formato del canal
- [ ] Hay **2-3 tomas de cobertura** nombradas (reaction · wide · detalle)
- [ ] El plan **cabe en la capacidad de producción** del cliente — y si se recortó, está declarado
- [ ] La columna **`material`** está decidida (`ninguno` / `video` / `foto`) y coherente con lo escrito en Escenas o en § Foto
- [ ] 🛑 Toda pieza con **`material = foto`** tiene su **§ Foto completa**, con el **espacio libre para el texto tomado del Layout** y los `id` de las piezas que comparten la foto
- [ ] 🛑 No hay archivos de diseño, mockups finales, media generada ni video editado

## Siguiente

→ `cr-adaptacion` (Capa 6)
