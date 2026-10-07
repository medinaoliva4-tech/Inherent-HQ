---
name: ve-armado
description: >
  Capa 1 de ⑥B Video Editing — el corte principal. Monta el hook literal de ④ en el primer frame,
  respeta el reparto HOOK-BODY-PAYOFF que ④ definió, ensambla las escenas en el orden y con las
  duraciones del shot list, y corta al ritmo que la personalidad de la marca pide. Antes de
  renderizar muestra el guion visual (el fotograma real de cada escena con su texto) para que el
  operador confirme el layout. Arma con el motor Remotion. Es la capa donde se decide si la pieza
  engancha o no. Úsala cuando pidan "armá este reel", "montá la pieza", "el corte principal",
  "mostrame el guion", "por qué esto no engancha", "va muy rápido". Requiere la Capa 0 hecha.
  El hook no se cambia acá.
---

# Capa 1 · Armado — el corte principal

| | |
|---|---|
| **Consume** | El `ideas-<formato>.md` de la pieza · el material con selects · § Movimiento de ②B *(si existe)* |
| **Produce** | El **guion visual** aprobado y el corte principal de cada reel |
| **Herramientas** | `motor/guion-visual/` · `motor/remotion/edit/build_reels.py` · `stab_shots.py` · `npx remotion render` |

## 1 · Los primeros 3 segundos deciden todo

| Segundo | Qué tiene que pasar |
|---|---|
| **0** | El **frame 1 visual** que ④ definió. **Con activo distintivo de marca** |
| **0-1** | El hook ya empezó. **No hay intro, no hay logo animado, no hay "hola a todos"** |
| **1-3** | Se entiende de qué va. Quien se queda, se queda acá |

🛑 **Un logo animado al inicio es tirar el 40% de la retención.** El branding va **dentro** de la
pieza, no antes. **El logo fijo sobre el frame del hook sí va** —es el activo del primer frame—:
entra en ≤ 10 frames, al 100 % y sin tapar el hook (`ve-marca` §1).

## 2 · El guion visual — antes de renderizar

**El operador aprueba el layout sobre el fotograma real, no sobre una descripción.** Fue lo que
más redujo rondas de cambios en cliente real.

| Paso | Qué se hace |
|---|---|
| **1** | `guion-visual/build_data.py`: una fila por escena — tomas (clip + segundos de la lista de posproducción), el **texto literal de ④**, posición, estilo y efecto propuestos |
| **2** | `thumbs.py` saca el fotograma real de cada escena del original; en doble cuadro, las dos mitades con la línea |
| **3** | `build.py` arma la página y se publica como **Artifact con base de datos** (`capabilities: {db: {}}`) |
| **4** | El operador anota por escena: texto, posición, estilo, efecto, notas y «aprobada». Se guarda solo |
| **5** | Claude lee las notas (`ArtifactData list` de la colección `notas`) y las pasa al guion de montaje |

🛑 **Si el operador cambia una palabra del texto, es un cambio de copy:** se registra y se avisa a
④ por escrito. Posición, estilo, efecto, duración y toma sí se deciden acá.

## 3 · El reparto HOOK-BODY-PAYOFF

**④ lo definió en `cr-hook-copy`. Se respeta.**

| Bloque | Qué hace | Error típico |
|---|---|---|
| **HOOK** | Frena el scroll | Tardar en llegar al punto |
| **BODY** | Entrega lo prometido | Meter tres ideas donde iba una |
| **PAYOFF** | Cierra y pide la acción | Cortar antes del CTA |

> 🛑 **Si la pieza se pasa de largo, se corta del BODY — nunca del HOOK ni del PAYOFF.**

> 🔑 **El hook visual es el momento más apetitoso del material, en cámara lenta** (el `hero` de la
> lista de posproducción). **Lo más rico va al final y dura más**: los pasos poco vistosos (aderezo,
> base) se cortan cortos; el plato terminado, la salsa cayendo y el primer bocado se sostienen.

## 4 · El ensamblado

| | Regla |
|---|---|
| **Orden** | El del shot list de `cr-arte-video`. Si se cambia, se declara y se avisa a ④ |
| **Duraciones** | Las que ④ definió. Un plano que se estira mata el ritmo |
| **Ritmo** | El de § Movimiento de ②B. Una marca calma no corta cada 0.8 s |
| **Audio** | Limpio primero. Música después, y **nunca tapando la voz** |

### Las reglas de montaje que funcionaron *(cliente real, oct 2026)*

**Se aplican salvo que § Movimiento de ②B diga otra cosa** — la guía manda.

| Regla | Número / cómo |
|---|---|
| **Escena** | **3 a 4.5 s.** Menos de 3 s se siente apurado. Escenas de paso (plato en la mesa, toma de apoyo): **0.7 a 1.5 s** |
| **Reel** | 18 a 30 s |
| **Doble cuadro** | Dos tomas apiladas 9:8 con una línea del color de superficie. **Arriba el detalle, abajo el contexto.** Los cambios de cada cuadro van escalonados unos frames, para que no corten juntos |
| **Abrir / cerrar el doble cuadro** | El cambio de pantalla completa a doble (o al revés) **es** la transición: 22 frames, sin empuje encima |
| **Cuándo NO usar doble cuadro** | En secuencias con historia (pedir → llega → come) o cuando las dos mitades repiten la misma escena. Ahí, pantalla completa |
| **Cámara lenta** | **0.5× real desde fuente de 60 fps**, solo en momentos protagonistas: salsa cayendo, vertido, fideo levantado, pieza goteando |
| **Transición entre tomas** | Empuje vertical suave, 14 frames, la toma que sale se mueve menos (parallax) |
| **Tomas sin trípode que deben empatar** | Un destello breve del color claro de la marca (16 frames) esconde el salto. **Nunca un corte seco** entre dos tomas de cámara en mano que deberían ser la misma |
| **Toma caminando hacia cámara** | Alejamiento suave (zoom 1.14 → 1.0) para que se vea el entorno |
| **Una toma continua** | Si varias escenas salen de la misma toma (p. ej. una secuencia cenital), se cortan de **un solo tramo** (`win`), no de pedazos sueltos: así no se traba ni se repite |
| **No repetir** | La misma toma no aparece dos veces seguidas, ni en las dos mitades del doble cuadro |
| **Escenas sin sentido para la historia** | Se quitan aunque estén bien grabadas (en cliente real: los platos vacíos de una secuencia de pedidos) |

### Cómo se arma — el motor

1. **`edit/build_reels.py`**: una escena por línea, con la toma, los segundos, la velocidad, el
   encuadre (`focusY`), el texto y la transición. **Es la única fuente del reel.**
2. `stab_shots.py`: corta cada tramo del original 4K a 1440×2560, con el color de esa toma
   (`ve-marca` §6) y estabilizado solo si mide mejor.
3. `npx remotion render … --muted` → `out/<id>_vN.mp4`.
4. **Cada cambio pedido se hace en `build_reels.py` y se vuelve a renderizar.** Nunca se parchea un
   MP4 a mano: el cambio tiene que quedar escrito para la siguiente ronda.

## 5 · Cuando el material no permite montar el guion

**Tres caminos, en este orden:**

| | Qué se intenta |
|---|---|
| **1** | ¿Hay otra toma del mismo setup que sirva? |
| **2** | ¿Hay material de banco que cubra esa escena? |
| **3** | ↩️ **Se devuelve a ④** con qué escena falta y qué sí hay |

🛑 **Nunca se cambia el hook para que entre el material.** El hook traza a una MUST BE TRUE;
cambiarlo rompe la cadena y nadie se entera hasta el loop.

## 6 · El corte principal es el que se multiplica

**De este corte salen todas las derivadas de la Capa 3.** Por eso su auto-revisión (`ve-marca`
§6-7) está después de la Capa 2 y antes de derivar.

> 🔑 **Un corte principal flojo produce 3 derivadas flojas.** Se invierte el tiempo acá.

## 7 · Checklist

- [ ] El **frame 1** es el que ④ definió, **con activo distintivo**
- [ ] **No hay intro ni logo animado** antes del hook
- [ ] El hook está montado **literal**, como lo escribió ④
- [ ] El reparto **HOOK-BODY-PAYOFF** se respeta
- [ ] El orden y las duraciones son las del shot list
- [ ] El ritmo coincide con **§ Movimiento** de ②B *(si existe)*
- [ ] El operador aprobó el **guion visual** antes del render, y sus notas están en `build_reels.py`
- [ ] Ninguna escena dura menos de 3 s salvo las de paso; ninguna toma se repite seguida
- [ ] La cámara lenta solo está en momentos protagonistas, desde fuente de 60 fps
- [ ] La voz se entiende **por encima de la música**
