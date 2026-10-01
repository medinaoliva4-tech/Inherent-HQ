---
name: ve-export
description: >
  Capa 4 de ⑥B Video Editing — exporta cada pieza con las specs de su plataforma y la
  nomenclatura que ⑨ Posting cruza, y arma el manifiesto que cierra el ciclo. Verifica aspecto,
  duración, peso, audio y ausencia de watermark antes de entregar, porque lo que no cumple lo
  devuelve po-specs y vuelve acá igual, pero tarde. Úsala cuando pidan "exportá el paquete",
  "dejalo listo para posting", "¿cumple las specs?", "armá el manifiesto". Cierra con el
  GATE 2.
---

# Capa 4 · Export — specs, nombres y manifiesto

| | |
|---|---|
| **Consume** | Las piezas terminadas · `plan-por-canal.md` · las specs de cada plataforma |
| **Produce** | Los archivos finales + **`entregas-video.md`** |

> 🔑 **Lo que no cumple specs lo devuelve `po-specs` y vuelve acá igual — pero tarde, con el
> ciclo encima.** Verificar acá cuesta minutos; verificar allá cuesta un día.

## 1 · La nomenclatura — no es opcional

```
<id_creativo>_<variante>_<plataforma>.mp4
```

| Parte | Ejemplo |
|---|---|
| `id_creativo` | `CR-007` — el del Excel de ④ |
| `variante` | `principal` · `hookB` · `corto` · `fragmento1` |
| `plataforma` | `ig-reel` · `tiktok` · `yt-short` · `ig-story` |

🛑 **⑨ Posting cruza por `id_creativo`.** Un archivo sin él **se devuelve sin abrirse**.

## 2 · El QA técnico, pieza por pieza

| Chequeo | Qué se mira |
|---|---|
| **Aspecto** | El de la plataforma. Sin barras negras |
| **Duración** | Dentro del máximo del formato |
| **Peso** | Bajo el límite de la plataforma |
| **Audio** | Existe, se entiende, sin saturar. **Nivel parejo entre piezas** |
| **Safe zones** | El texto no queda bajo la UI. **Se verifica en el export, no en el proyecto** |
| **Sin watermark** | De ninguna app de edición ni de generación |
| **Primer frame** | No es negro. Es el frame que ④ definió |

🛑 **El watermark de una herramienta de IA en una pieza de cliente es un problema de marca, no
un detalle.**

## 3 · Una pieza, un archivo por plataforma

**No se entrega un master y que ⑨ lo adapte.** Cada plataforma recibe su archivo exportado con
sus specs.

## 4 · El manifiesto — `entregas-video.md`

**Cruza el Excel de ④ fila por fila contra lo entregado.** Es lo que ⑨ abre primero.

| Columna | Qué lleva |
|---|---|
| `id_creativo` | El del Excel de ④ |
| `variante` | `principal` o cuál |
| `plataforma` | Dónde va |
| `archivo` | **La ruta**, no el archivo copiado |
| `duracion` | Segundos |
| `specs_ok` | ✅ / ❌ con el motivo |
| `estado` | `entregado` · `⚠️ SIN MATERIAL` · `↩️ devuelto` |

🛑 **Ningún archivo se copia a otra carpeta: se cita su ruta.**

## 5 · Lo que no salió

**Se escribe, no se omite.** Una tabla con pieza, motivo y de quién se espera.

🛑 **Un ciclo que entrega 9 de 10 reels sin decir cuál falta obliga a ⑨ a descubrirlo.**

## 6 · 🚦 GATE 2

**Allan aprueba el paquete completo**, y recién ahí entra a QA y después a ⑨ Posting.

## 7 · Checklist

- [ ] Todo archivo lleva **`id_creativo`** en el nombre
- [ ] Un archivo **por plataforma**, exportado con sus specs
- [ ] El QA técnico corrió **pieza por pieza**, sin muestreo
- [ ] **Ningún watermark**
- [ ] El primer frame **no es negro**
- [ ] El audio tiene **nivel parejo** entre piezas
- [ ] `entregas-video.md` cruza el Excel de ④ **fila por fila**
- [ ] Lo que no salió está **escrito**, con responsable
- [ ] **Allan aprobó el GATE 2**
