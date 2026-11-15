# A-LIB · Auditoría de bibliotecas

**Revisión: 13 nov 2026.** Versiones, licencias y última publicación: npm. Actividad reciente en GitHub confirma mantenimiento; “última publicación” no garantiza soporte futuro.

## Catálogo de §12

| Biblioteca | Versión vigente · licencia | Actividad | Decisión para Inherent OS |
|---|---|---|---|
| OpenUI | `@openuidev/react-ui` 0.18.8, `react-lang` 1.1.1, `react-headless` 0.18.8 · MIT | Publicados 12 nov 2026 | El OS ya usa OpenUI Lang en un renderizador vanilla propio. Mantenerlo. No cambiar el parser local 1.1.0 por el renderer React: hay diferencia de versión y tema, y sus estilos/plantilla no son plug-and-play. [npm UI](https://www.npmjs.com/package/@openuidev/react-ui) · [npm Lang](https://www.npmjs.com/package/@openuidev/react-lang) · [GitHub](https://github.com/thesysdev/openui) |
| json-render | `@json-render/core` 0.22.0 · Apache-2.0 | Publicado 4 nov 2026 | Sigue siendo evaluación de contrato. Agrega un segundo formato al OpenUI Lang existente; no adoptar sin decidir cuál reemplaza al otro y probar que el catálogo y acciones queden cerrados. [npm](https://www.npmjs.com/package/@json-render/core) · [GitHub](https://github.com/vercel-labs/json-render) |
| React Flow | `@xyflow/react` 12.12.1 · MIT | Publicado 2 nov 2026; el prerelease 13 siguió activo hasta 8 nov | Único candidato React aprobado por esta prueba: una isla local para canvas de nodos. Requiere build local y adaptación de montaje/eventos. [npm](https://www.npmjs.com/package/@xyflow/react) · [documentación](https://reactflow.dev/) · [GitHub](https://github.com/xyflow/xyflow) |
| shadcn/ui | CLI `shadcn` 4.23.0 · MIT | Publicado 27 oct 2026; commits al 11 nov | Es un generador/registro que copia componentes al proyecto, no una dependencia React visual lista para instalar. Úsese como referencia de anatomía/accesibilidad; no introduce Tailwind/Radix ni sus tokens al OS sin elegir cada pieza. [npm](https://www.npmjs.com/package/shadcn) · [documentación](https://ui.shadcn.com/) · [GitHub](https://github.com/shadcn-ui/ui) |
| assistant-ui | `@assistant-ui/react` 0.15.36 · MIT | Publicado 12 nov 2026 | No incorporarlo ahora: el Chat actual ya tiene OpenUI y componentes/acciones propios. Su plantilla React necesita un adaptador explícito al transporte, acciones, tokens y estado del OS. [npm](https://www.npmjs.com/package/@assistant-ui/react) · [documentación](https://www.assistant-ui.com/) · [GitHub](https://github.com/assistant-ui/assistant-ui) |

## Base iOS y puentes de §3.4

Capacitor 8 está publicado; cada plugin nativo se debe fijar al instalarse y revisar con Xcode. Versiones vigentes y licencia consultadas en npm el 13 nov 2026.

| Uso de §3.4 | Paquete vigente · licencia · última publicación | Límite/adaptación |
|---|---|---|
| Contenedor | [`@capacitor/core`](https://www.npmjs.com/package/@capacitor/core) 8.6.2 y [`@capacitor/ios`](https://www.npmjs.com/package/@capacitor/ios) 8.6.2 · MIT · 13 nov 2026 | Misma versión mayor. `server.url` sirve para desarrollo; en producción la cápsula debe cargar origen controlado y conservar el inicio del OS en navegador del sistema. [Docs](https://capacitorjs.com/docs) |
| Login OAuth en navegador del sistema | [`@capacitor/browser`](https://www.npmjs.com/package/@capacitor/browser) 8.0.5 · MIT · 13 nov 2026 | Es el puente de abrir/cerrar navegador, no implementa por sí solo el retorno seguro `ASWebAuthenticationSession`/callback. [Docs](https://capacitorjs.com/docs/apis/browser) · [Apple](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession) |
| Face ID / Touch ID | [`@aparajita/capacitor-biometric-auth`](https://www.npmjs.com/package/@aparajita/capacitor-biometric-auth) 10.0.0 · MIT · 9 feb 2026 | Compatible con Capacitor 8; requiere `NSFaceIDUsageDescription`. Es confirmación local del dispositivo, **no** identidad ni autorización para el servidor. [README](https://github.com/aparajita/capacitor-biometric-auth) · [cambios](https://github.com/aparajita/capacitor-biometric-auth/blob/main/CHANGELOG.md) |
| Haptics | [`@capacitor/haptics`](https://www.npmjs.com/package/@capacitor/haptics) 8.0.2 · MIT · 6 nov 2026 | Confirmar disponibilidad y no depender de vibración para comunicar estado. [Docs](https://capacitorjs.com/docs/apis/haptics) |
| Cámara | [`@capacitor/camera`](https://www.npmjs.com/package/@capacitor/camera) 8.2.6 · MIT · 6 nov 2026 | Añadir texto de permiso iOS y seleccionar si captura o picker; guardar/subir el archivo por el flujo existente. [Docs](https://capacitorjs.com/docs/apis/camera) |
| Notificaciones locales | [`@capacitor/local-notifications`](https://www.npmjs.com/package/@capacitor/local-notifications) 8.3.1 · MIT · 28 sep 2026 | Sirve recordatorios programados en el dispositivo; no sustituye el push remoto. [Docs](https://capacitorjs.com/docs/apis/local-notifications) |
| Push remoto y acciones | [`@capacitor/push-notifications`](https://www.npmjs.com/package/@capacitor/push-notifications) 8.1.3 · MIT · 12 nov 2026 | Requiere APNs, firma/capacidad y configuración de cuenta Apple. No demuestra botones aprobatorios seguros; el servidor debe autorizar cada acción y validar estado/usuario. [Docs](https://capacitorjs.com/docs/apis/push-notifications) |
| Hoja de compartir | [`@capacitor/share`](https://www.npmjs.com/package/@capacitor/share) 8.0.3 · MIT · 12 nov 2026 | La API abre la hoja, pero recibir contenido desde otras apps requiere extensión/configuración iOS adicional. [Docs](https://capacitorjs.com/docs/apis/share) |
| Dictado a texto | [`@capacitor-community/speech-recognition`](https://www.npmjs.com/package/@capacitor-community/speech-recognition) 7.0.1 · MIT · 12 nov 2026 | Acepta `@capacitor/core >=7`; requiere permisos `NSSpeechRecognitionUsageDescription` y `NSMicrophoneUsageDescription`. Dicta texto, no es grabadora de notas de voz. [README](https://github.com/capacitor-community/speech-recognition) · [releases](https://github.com/capacitor-community/speech-recognition/releases) |

El audio de una nota de voz es distinto del dictado. Antes de sumar un grabador nativo, comprobar si `MediaRecorder` de la web instalada cubre captura y reanudación requeridas.

## Prueba de navegador

Artefacto local: [`probes/vision-libraries/`](../../probes/vision-libraries/). Ejecutado como build Vite servido en `127.0.0.1:4173`, en Google Chrome/Chromium con `deviceScaleFactor: 2`. React Flow montó 3 nodos; Recharts dibujó un gráfico sintético; al pulsar un nodo, `document.dispatchEvent(new CustomEvent('inherent:vision-node-selected', { detail }))` llegó al listener vanilla. Playwright reportó 0 errores de consola/página, DPR 2 y 1 evento recibido. Captura: [`vision-reactflow-dsf2.png`](../../probes/vision-libraries/capturas/vision-reactflow-dsf2.png) (2880×2080 px).

La prueba lee variables `--ui-*` con valores de respaldo y muestra que React Flow se integra con eventos del DOM. No integra API, React Flow con OpenUI, ni Capacitor sobre un iPhone.

## Bundle, CSP y adaptación

- Build aislado: JS 755.64 KB minificado (227.64 KB gzip), CSS 18.40 KB (3.48 KB gzip). Vite avisa que el chunk excede 500 KB. El prototipo funciona, pero ese peso impide concluir “apto para cargar siempre”; limitar el React a la pantalla de mapa con carga diferida y reconsiderar el gráfico (el OS ya dibuja SVG sin librería en `charts.js`). Recharts es solo parte de esta prueba, no una recomendación de adopción.
- CSP actual (`vercel.json`): `script-src 'self'` acepta los archivos de build del mismo origen sin CDN ni `unsafe-eval`; `style-src 'self' 'unsafe-inline'` admite estilos de nodos que genera React Flow. La prueba con CSP equivalente no necesitó excepciones nuevas. No abrir dominios ni insertar bundle inline.
- Para integrar: alojar JS/CSS compilado en el mismo origen; montar/desmontar la isla desde un módulo vanilla; transportar identificadores/estado con eventos tipados y validar de nuevo toda escritura en API. Mantener el tema con tokens CSS `--ui-*`; adaptar foco, teclado, zoom, móvil y accesibilidad. No mover permisos al cliente.
- Recomendación: **prototipo satisfactorio; no adopción permanente todavía.** La isla React Flow resuelve una necesidad sin equivalente claro, pero falta adelgazar el bundle y comprobar integración real en la navegación antes de fijar dependencia. Las otras librerías de §12 quedan en el rol indicado arriba.

## Actualización K1 · 14 nov 2026

El kit compartido ya usa React Flow en `VisualCanvas`, cargado bajo demanda desde `/vendor/vision-flow/` y con lista accesible cuando falla el lienzo. El bundle específico, sin Recharts, mide 616.8 KB sin comprimir y 154.6 KB gzip (solo JS). `node scripts/test-kit-browser.mjs` comprobó selección con Enter, cuatro combinaciones de tema/tamaño, CSP y la alternativa de lista. Es una integración en el kit y su demo sintética; todavía falta montarlo sobre el hilo real de un cliente y medir su costo en navegación de producción. La decisión de mantenerlo como dependencia permanente queda para B1/V1.
