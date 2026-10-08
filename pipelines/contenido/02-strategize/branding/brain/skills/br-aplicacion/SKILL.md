---
name: br-aplicacion
description: >
  Capa 5 de Branding — baja el sistema a cada formato real donde la marca vive: reel, story,
  carrusel, estático, email, impresos. Por formato define las medidas, las safe zones, dónde van
  los activos distintivos y un ejemplo de bien y mal. Es la capa que evita que la guía quede
  bonita y sin aplicar. Cierra la guía de marca. Úsala cuando pidan "cómo se ve en un reel",
  "cómo se arma un carrusel", "las medidas de cada formato", "bajá la guía a los formatos".
  Requiere los activos distintivos. Los formatos salen de las Redes del plan contratado.
---

# Capa 5 · Aplicación — cómo se ve en cada formato real

| | |
|---|---|
| **Consume** | `sistema-visual.md` · § Activos distintivos · las **Redes** de `00-onboarding/plan-contratado.md` |
| **Produce** | La sección **§ Aplicación por formato** de `guia-de-marca.md` |

> 🔑 **Una guía que no se baja a formatos se lee una vez y no se aplica nunca.**

## 1 · Qué formatos se cubren

**Los de las Redes que `plan-contratado.md` declara para este cliente. No todos los que existen.**

**Un formato que sus Redes no usan no se documenta.** Es trabajo que nadie va a leer.

## 2 · La ficha de cada formato

| Campo | Qué lleva |
|---|---|
| **Medidas** | Px y relación de aspecto |
| **Safe zones** | Dónde **nunca** va texto, en px o % |
| **Jerarquía** | Qué se lee primero en **este** formato |
| **Qué activos van** | Cuáles de los 3-5, y dónde exactamente |
| **Largo de texto** | Máximo de caracteres que entra sin romper |
| **Un ejemplo bien** | Descrito, o la ruta a una pieza real |
| **Un ejemplo mal** | **Y por qué está mal** |

## 3 · Los formatos y lo que cada uno exige

| Formato | Lo que más se rompe |
|---|---|
| **Reel / TikTok / Short** | Texto bajo la UI. El primer frame sin activo. Subtítulos fuera de safe zone |
| **Carrusel** | La primera slide sin gancho. Slides que no se entienden sueltas |
| **Estático de feed** | Demasiado texto. Jerarquía plana |
| **Story** | Texto en la zona del dedo. Sin activo porque *«es efímero»* |
| **Email** | Imágenes que no cargan y dejan el mensaje vacío |
| **Impresos** | Sin márgenes de corte. Color RGB en vez de CMYK |

## 4 · El primer frame y la primera slide

**Es donde la marca se gana o se pierde.**

| | Regla |
|---|---|
| **Todo video** | Lleva activo distintivo **en el primer frame**. No al final |
| **Todo carrusel** | La slide 1 lleva activo y se entiende **sola** |
| **Todo estático** | Se reconoce la marca **sin leer el texto** |

> **Poner el branding solo al cierre es ponerlo donde ya nadie mira.**

## 5 · Qué escribe

`## § Aplicación por formato` — una sección por formato, más:

| Bloque | Qué lleva |
|---|---|
| **§ Resumen** | Tabla con formato, medidas, activos que van |
| **§ Lo que rompe el sistema** | La lista de errores que Diseño gráfico y Video Editing tienen que evitar |

## 6 · La guía cerrada

**Es lo que Creatividad, Diseño gráfico, Video Editing, Posting y Ads van a usar como ley.** A partir de acá, una pieza que no la cumple
se devuelve. Se auto-revisa con el checklist de §7 y sigue.

## 6.1 · El kit en el Drive del cliente

**Al cerrar la guía, los assets de la marca se bajan de Figma y se suben al Drive del cliente:**
logos en todas sus versiones, íconos, texturas y fuentes.
**El link del Drive va en `clients/<cliente>/02-marca/kit-de-redes/kit.md`**, junto al de Figma.

🔑 **Es para Video Editing:** el editor usa los assets de la marca sin abrir Figma, en
cualquier computadora. **Las plantillas no se suben:** se desarrollan en Figma y
Diseño gráfico trabaja ahí.
**Si el kit cambia en Figma, se vuelve a subir.**

Sin acceso a Figma o al Drive: `FALTA — falta Figma. Instalala: ver INSTALAR.md § Figma + Figwright`
· `FALTA — falta Google Drive. Instalala: ver INSTALAR.md § Google Drive`.

## 7 · Checklist

- [ ] Están cubiertos **los formatos de las Redes de `plan-contratado.md`**, y solo esos
- [ ] Cada formato tiene **medidas y safe zones**
- [ ] Cada formato dice **qué activos van y dónde**
- [ ] Cada formato tiene un ejemplo **bien** y uno **mal**
- [ ] Todo video lleva activo **en el primer frame**
- [ ] Toda slide 1 de carrusel se entiende **sola**
- [ ] **Los assets del kit están en el Drive del cliente** y el link está en `kit.md`
