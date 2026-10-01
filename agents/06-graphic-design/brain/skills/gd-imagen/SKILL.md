---
name: gd-imagen
description: >
  Capa 2 de ⑥A Diseño gráfico — resuelve de dónde sale la imagen de cada pieza, en orden de
  costo: banco propio, material de ⑤ Producción, generación en lote o foto de producto sin
  sesión. Verifica resolución, encuadre y derechos antes de componer, porque una imagen que no
  sirve se descubre recién al exportar. Úsala cuando pidan "de dónde sacamos la imagen", "fotos
  de producto", "generá las imágenes del ciclo", "quitá el fondo", "esta foto no da". Requiere
  las plantillas aprobadas.
---

# Capa 2 · Imagen — de dónde sale cada una

| | |
|---|---|
| **Consume** | Las plantillas con GATE 1 · § Imagen de `sistema-visual.md` · material de ⑤ · el banco del cliente |
| **Produce** | Las imágenes del ciclo, resueltas y verificadas |

## 1 · El orden de costo

**Se busca en este orden. Se baja un escalón solo cuando el anterior no da.**

| # | Fuente | Costo | Cuándo |
|---|---|---|---|
| **1** | **Banco del cliente** | Q0 | Siempre se mira primero |
| **2** | **Material de ⑤ Producción** | Ya pagado | Si el ciclo tuvo rodaje |
| **3** | **Generación en lote** — Higgsfield `generate_image_batch` | Q0 marginal | Cuando el sistema lo permite |
| **4** | **Foto de producto sin sesión** — `product-shot` | Q0 marginal | Para producto sobre fondo |
| **5** | **Pedirle al cliente** | Tiempo del cliente | Último recurso |

🛑 **Nunca se compra stock sin autorización.** Es costo que no está en el plan.

## 2 · La verificación, antes de componer

| Chequeo | Si falla |
|---|---|
| **Resolución** | ¿Alcanza para el formato más grande donde va? → `upscale_image` o se descarta |
| **Encuadre** | ¿El sujeto sobrevive al recorte de la plantilla? → otra imagen o `reframe` |
| **Luz y color** | ¿Convive con la paleta del sistema? |
| **Derechos** | ¿Es del cliente, o hay permiso escrito? → 🔴 **Sin permiso no se usa** |
| **Personas** | ¿Hay cesión de imagen? → 🔴 **Sin cesión no sale** |

> ⚠️ **Una foto con una persona sin cesión firmada es un problema legal del cliente, no un
> detalle de diseño.** Se escala.

## 3 · La generación — lo que hay que saber

| | |
|---|---|
| **Se genera en lote**, con el prompt base de `sistema-visual.md` § Imagen |
| **Se revisa cada salida.** El lote acelera, **no aprueba** |
| **Lo que siempre se corrige a mano** está declarado en el sistema visual |
| 🛑 **Nunca se genera una persona que parezca un cliente real** o un testimonio falso |

## 4 · Quitar fondo y componer producto

**`remove_background` + `product-shot` resuelven el caso más común del ciclo:** producto sobre
fondo de marca.

| Chequeo | Qué se mira |
|---|---|
| El recorte no se come bordes finos | Pelo, transparencias, asas |
| La sombra es coherente con la luz del fondo | Un producto flotando se nota |
| El color del producto **no cambió** | Es el error que más devuelve el cliente |

## 5 · El banco crece cada ciclo

**Toda imagen resuelta se guarda en el banco del cliente, nombrada.** El ciclo siguiente empieza
con más material gratis.

> 🔑 **Un cliente en su tercer ciclo debería resolver la mitad de sus imágenes del banco.**

## 6 · Checklist

- [ ] Se buscó en el **banco primero**
- [ ] Cada imagen tiene **resolución** para su formato más grande
- [ ] Cada imagen **sobrevive al recorte** de su plantilla
- [ ] Toda imagen con personas tiene **cesión**
- [ ] Ninguna generación inventa un **testimonio o cliente falso**
- [ ] Cada salida generada **se miró**, no solo se procesó
- [ ] Las imágenes nuevas **se guardaron en el banco**
