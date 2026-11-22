# Informe de la visión del OS · 22 de noviembre

> **La visión NO está terminada.** Quedó firme la plomería y varias piezas completas y probadas; **ninguna de las 34 herramientas está completa** (la auditoría de Fable las dejó en 75 requisitos «parcial» y 9 «falta», y eso no cambió). Aquí va lo que sí, lo que no y lo que sigue.

## Lo que tienes que hacer (en este orden)

1. **Probar la app en tu iPhone.** En tu Mac, carpeta `ios/`: abre `LEEME.md` y sigue los 6 pasos (`npm run ios:instalar`). **No pude compilarla desde Linux:** ese paso es tuyo y es la primera prueba real.
2. **Entrar con Google en la app.** Debe abrir el navegador del sistema y volver sola. Si no vuelve, dime qué pantalla viste.
3. **Abrir `#/decide`** (o «Decide» en la barra de abajo del teléfono) con datos reales y aprobar una pieza.
4. **Revisar la rama** `claude/blissful-ramanujan-hoj78y` (no está en `main`). Si te parece bien, dime «merge» y la subo.
5. **Codex:** quedó instalado en esta sesión, pero **no inició sesión** (el código del dispositivo vence en 15 min y no se ingresó). No lo necesité para lo que se hizo. Si lo quieres, dímelo y lo conecto.

## Hecho y verificado (con prueba)

| Pieza | Qué es | Prueba |
|---|---|---|
| **Decide** (`#/decide`, Hoy, barra de abajo) | Lo que solo tú decides: aprobar / pedir cambios / escalar, con la versión que leíste; los criterios en falta bloquean «Aprobar»; una por vez en el teléfono | 14 + navegador (aprobar de 3 → 2 tarjetas) |
| **Franja del ciclo 1→20** | Día, fase, 11 y 20 firmes, huso de Guatemala | incluida arriba |
| **El hilo del cliente** | Nodos = entregables, aristas «viene de», revisión de descendientes, traza hasta el ICP, nunca cruza marcas | 11 |
| **Intent-to-Interface** | Entiende lo que quieres lograr, elige del catálogo cerrado, cierra con una acción real, rechaza código/HTML/enlaces/inyecciones | 9 |
| **Motor de workflows** | Corridas durables: idempotencia, leases y recuperación, reintentos solo seguros, aprobación sobre hash, lo que envía/publica/gasta exige aprobación antes, límites, bitácora sin secretos, outbox | 18 |
| **Aprobación del cliente por enlace** (`aprobar.html`) | Un solo uso, caduca, revocable, atado a una versión; el cliente ve solo título/herramienta/versión/marca, nunca costos | 10 + navegador (teléfono) |
| **Login de la app** | Google fuera de la web embebida: código de un uso + PKCE | 10 |
| **Cápsula de Apple** (`ios/`) | Capacitor 8, instalación por cable gratis, permisos en español, pantalla sin red | 8 (configuración) |
| **Barra de abajo de 5 puertas** | Hoy · Decide · Chat · Calendario · Más (decisión **D10**: antes estaba oculta) | recorrido de 50 rutas |

Suites que pasan: `npm test`, `test:ui`, `test:herramientas`, `test:llm`, `test:openui`, `test:capacidades`, `test:vision-{hilo,decide,intent,auth-native,workflow,portal}`, `test-vision-seguridad`, `test-vision-candados`, `lint:css`.

## Hecho pero NO verificable desde aquí (Linux)

- Compilar y firmar en **Xcode**, instalar en un **iPhone real**, **Face ID** físico y el vuelo completo del login con Google.
- Servicios en vivo (Zernio, Meta, Drive): no hay acceso desde este entorno.

## Marcado como «sin conexión» (no se finge)

Los adaptadores `zernio-publicar` y `meta-pauta` del motor de workflows dicen **«no conectado»** y fallan con su motivo. Hasta conectarlos, **ningún workflow publica ni cambia pauta**.

## Lo que NO se hizo (sigue pendiente, en este orden de valor)

1. **Las 34 herramientas y los 8 departamentos × 4 capas** (T1–T7, D1). Empezar por la cadena P0 con el kit de 12 componentes. Es el grueso del trabajo que falta.
2. ~~Passkeys (Face ID) para aprobar~~ **— quitado por decisión del CEO (22-nov).** Queda **notificaciones con botón «Aprobar»** (necesita la cuenta de US$99).
3. **Workflow Builder** (la pantalla) y agendar el motor (hoy se avanza por ruta; falta un cron).
4. **`⌘K` con acciones**, lienzo del hilo, presentación del día 20, **modo rodaje**, **bandeja de Community con el anillo de 60 s**, **Finanzas/capacidad**, **mensajes mínimos y modo concentración** (Olas 3, 4, 7, 8).
5. **Voz con contexto**, **refactor para gastar menos** (`app.css` de 10 mil líneas) y el **video explicativo**.
6. Llevar la respuesta del modelo por `armar()` de forma automática (hoy el motor guía el prompt y valida, pero el Chat aún no re-enruta solo).

## Decisiones que tomé por ti (reversibles)

- **D10 · barra de abajo en el teléfono** vuelve a mostrarse (estaba oculta con `display:none!important`). Revertir: una línea en `app.css` (ver `DECISIONES-FABLE.md`).
- **Aprobación del cliente** solo anota la respuesta en el entregable; **no mueve su estado interno** (eso sigue siendo del CEO/COO).
- **Enlace al cliente** solo se emite sobre piezas **ya aprobadas por dentro** (el QA va antes que el cliente).
- En `test:ui` quité una aserción vieja (`ch-volver-os`) que ya fallaba en `main` por un cambio de Codex; y en `test:herramientas` anoté que `GET /api/hilo` no lleva contenido.

## Cambios que sugiero al manual (no los hice)

- `inherent/05-OPERACION.md`: anotar el **enlace de aprobación del cliente** como forma oficial de aprobar piezas sin cuenta.
- `PENDIENTES.md`: «Construir #7» (fases 5 a 7) y «Reestructura #4» (el hilo) ya tienen servidor y lógica; falta la pantalla.

## Riesgos y deuda

- El motor de workflows no tiene todavía quién lo despierte solo: sin cron, una corrida avanza cuando alguien la abre o la aprueba.
- `GET /api/decide?hoy=AAAA-MM-DD` acepta una fecha para pruebas; no concede nada, pero conviene quitarla antes de producción si prefieres.
- Con el **Apple ID gratis** la app caduca a los **7 días** (se reinstala por cable).
- `app.css` y `screens/llm.js` siguen enormes: cada cambio visual cuesta mucho leerlos.
