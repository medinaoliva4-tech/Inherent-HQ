---
name: ve-export
description: >
  Capa 4 de Video Editing — exporta cada pieza con las specs de su plataforma y la
  nomenclatura que Posting cruza, y arma el manifiesto que cierra el ciclo. Verifica aspecto,
  duración, peso, audio y ausencia de watermark antes de entregar, porque lo que no cumple lo
  devuelve po-specs y vuelve acá igual, pero tarde. Publica la página donde el cliente aprueba
  o pide cambios. Úsala cuando pidan "exportá el paquete", "dejalo listo para
  posting", "¿cumple las specs?", "armá el manifiesto", "pasame un link para el cliente", "¿qué
  respondió el cliente?".
---

# Capa 4 · Export — specs, nombres y manifiesto

| | |
|---|---|
| **Consume** | Las piezas terminadas · `plan-por-canal.md` *(si no existe, las **Redes** del `plan-contratado.md`)* · las specs de cada plataforma |
| **Produce** | Los archivos finales (master + preview) + **`entregas-video.md`** + la **página de aprobación del cliente** |
| **Herramientas** | `ffmpeg` · `motor/aprobacion/vercel/` (`build.py` + `vercel deploy --prod`) |

> 🔑 **Lo que no cumple specs lo devuelve `po-specs` y vuelve acá igual — pero tarde, con el
> ciclo encima.** Verificar acá cuesta minutos; verificar allá cuesta un día.

## 1 · La nomenclatura — no es opcional

```
<id_creativo>_<variante>_<plataforma>.mp4
```

| Parte | Ejemplo |
|---|---|
| `id_creativo` | `CR-007` — el del Excel de Creatividad |
| `variante` | `principal` · `hookB` · `corto` · `fragmento1` |
| `plataforma` | `ig-reel` · `tiktok` · `yt-short` · `ig-story` |

**Posting cruza por `id_creativo`.** Un archivo sin él **se devuelve sin abrirse**.

## 2 · El QA técnico, pieza por pieza

| Chequeo | Qué se mira |
|---|---|
| **Aspecto** | El de la plataforma. Sin barras negras |
| **Duración** | Dentro del máximo del formato |
| **Peso** | Bajo el límite de la plataforma |
| **Audio** | Existe, se entiende, sin saturar. **Nivel parejo entre piezas** (−20 LUFS). Si la música se pone en la app, la pieza va **sin audio** y se anota en el manifiesto para Posting |
| **Safe zones** | El texto no queda bajo la UI. **Se verifica en el export, no en el proyecto** |
| **Sin watermark** | De ninguna app de edición ni de generación |
| **Primer frame** | No es negro. Es el frame que Creatividad definió |

**El watermark de una herramienta de IA en una pieza de cliente es un problema de marca, no
un detalle.**

## 3 · Una pieza, un archivo por plataforma

**No se entrega un master y que Posting lo adapte.** Cada plataforma recibe su archivo exportado con
sus specs.

| Archivo | Para qué | Cómo |
|---|---|---|
| **Master** | El que se publica | Render del motor, 1080×1920 o mayor, H.264 |
| **Preview** | Verlo en el teléfono y en la página del cliente | `ffmpeg … -crf 24 -an -movflags +faststart`, **< 30 MB** |

### Las versiones

**Cada ronda de cambios es una versión nueva** (`_v2`, `_v3`…). La anterior se mueve a
`outputs/video/<versión>-anterior/`. **Nunca se sobreescribe un entregable**: si el cliente
dice «me gustaba más antes», tiene que existir el antes.

## 4 · El manifiesto — `entregas-video.md`

**Cruza el Excel de Creatividad fila por fila contra lo entregado.** Es lo que Posting abre primero.

| Columna | Qué lleva |
|---|---|
| `id_creativo` | El del Excel de Creatividad |
| `variante` | `principal` o cuál |
| `plataforma` | Dónde va |
| `archivo` | **El link al Drive**, no el archivo copiado |
| `duracion` | Segundos |
| `specs_ok` | ✅ / ❌ con el motivo |
| `estado` | `entregado` · `⚠️ SIN MATERIAL` · `↩️ devuelto` |

**Ningún archivo se copia a otra carpeta: se cita su ruta.**

## 5 · Lo que no salió

**Se escribe, no se omite.** Una tabla con pieza, motivo y de quién se espera.

**Un ciclo que entrega 9 de 10 reels sin decir cuál falta obliga a Posting a descubrirlo.**

## 6 · Sin paradas — se auto-revisa y sigue

**El paquete no para:** con el checklist de §8 completo entra a QA y después a Posting.

**La página del cliente (§7) sale con el checklist de §8 completo:** sin eso no se corre
`vercel deploy --prod` ni se le manda el link. Es lo que ve el cliente.

## 7 · La página de aprobación del cliente

**Con el checklist de §8 completo (§6), el cliente ve las piezas en un link público, las califica
y aprueba o pide cambios por escrito.** Reemplaza los audios de WhatsApp: el pedido queda escrito, por pieza y con
versión.

| | |
|---|---|
| **Qué muestra** | Cada video (el preview) con su caption — **el de Posting**, no uno escrito acá — y al pie los datos fijos del cliente (sucursales, teléfonos, dónde hay delivery) |
| **Qué responde el cliente** | Calificación 1–5 · «aprobado» o «con cambios» · qué cambiar. Se guarda en un Blob **privado** |
| **Dónde se leen las respuestas** | `/respuestas?k=<clave>`. La clave es una variable de entorno del proyecto de Vercel |
| **Cómo se arma** | `data.json` (piezas, captions, pie) → `build.py data.json display.ttf sans.ttf <videos>` → `vercel deploy --prod`. Un proyecto de Vercel por cliente |
| **Nueva versión** | Se sube el preview nuevo y se sube el `?v=` de ese video en `data.json`. Sin eso, el navegador muestra el video viejo |

**La clave de respuestas, el `.env` y el `.admin_key` nunca entran al repo ni se comparten con
el cliente.** El link que se manda es solo el de la página.

> 🔑 **Lo que pide el cliente vuelve como una ronda de cambios**: se anota por pieza, se corrige
> en `build_reels.py`, se renderiza una versión nueva y se actualiza la página. Lo que se repite
> entre rondas se vuelve regla (`ve-loop`).

## 8 · Checklist

- [ ] Todo archivo lleva **`id_creativo`** en el nombre
- [ ] Un archivo **por plataforma**, exportado con sus specs
- [ ] El QA técnico corrió **pieza por pieza**, sin muestreo
- [ ] **Ningún watermark**
- [ ] El primer frame **no es negro**
- [ ] El audio tiene **nivel parejo** entre piezas
- [ ] `entregas-video.md` cruza el Excel de Creatividad **fila por fila**
- [ ] Lo que no salió está **escrito**, con responsable
- [ ] Hay **master + preview < 30 MB** de cada pieza; las versiones anteriores quedaron archivadas
- [ ] La página del cliente tiene **la versión actual** de cada video (`?v=`) y el caption de Posting
- [ ] La clave de respuestas **no** está en el repo ni en el link al cliente
