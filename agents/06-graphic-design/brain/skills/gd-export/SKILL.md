---
name: gd-export
description: >
  Capa 4 de ⑥A Diseño gráfico — exporta cada pieza con las specs de su formato y la nomenclatura
  que ⑨ Posting cruza, y arma el manifiesto del ciclo. Verifica medidas, peso, perfil de color y
  legibilidad en pantalla chica antes de entregar. Para impresos cambian las reglas: CMYK,
  márgenes de corte y resolución de impresión. Úsala cuando pidan "exportá el paquete", "dejalo
  listo para posting", "¿cumple las medidas?", "armá el manifiesto", "esto va a imprenta".
  Cierra con el GATE 2.
---

# Capa 4 · Export — specs, nombres y manifiesto

| | |
|---|---|
| **Consume** | Las piezas compuestas · `plan-por-canal.md` · § Aplicación de `sistema-visual.md` |
| **Produce** | Los archivos finales + **`entregas-diseno.md`** |

## 1 · La nomenclatura

```
<id_creativo>_<formato>.png
```

**Para carruseles:** `<id_creativo>_carrusel_01.png`, `_02`, `_03`…

🛑 **⑨ Posting cruza por `id_creativo`.** Un archivo sin él **se devuelve sin abrirse**.
🛑 **Las slides van numeradas con dos dígitos**, o se desordenan al cargar.

## 2 · El QA técnico, pieza por pieza

| Chequeo | Qué se mira |
|---|---|
| **Medidas** | Las del formato, exactas |
| **Peso** | Bajo el límite de la plataforma |
| **Perfil de color** | **sRGB** para digital |
| **Legibilidad en chico** | Se mira al tamaño real del feed, no al 100% |
| **Sin elementos cortados** | Texto o activo que quedó fuera del lienzo |
| **Sin placeholder** | Ningún *«Lorem»*, ninguna imagen de prueba |

> 🔑 **La prueba de la pantalla chica es la que más atrapa errores.** Una jerarquía que funciona
> en el monitor desaparece en un feed.

## 3 · Los impresos cambian las reglas

| | Digital | **Impreso** |
|---|---|---|
| Perfil de color | sRGB | **CMYK** |
| Resolución | 72-150 dpi | **300 dpi** |
| Márgenes | Safe zones | **+ márgenes de corte** |
| Formato | PNG / JPG | **PDF** |

🛑 **Un impreso exportado en RGB sale con otro color.** Es el error que más caro se paga porque
se descubre con el material ya impreso.

## 4 · El manifiesto — `entregas-diseno.md`

| Columna | Qué lleva |
|---|---|
| `id_creativo` | El del Excel de ④ |
| `formato` | Carrusel · estático · story · impreso |
| `slides` | Cuántas, si aplica |
| `archivo` | **La ruta**, no el archivo copiado |
| `plantilla` | Cuál se usó. **Lo necesita `gd-loop`** |
| `specs_ok` | ✅ / ❌ con el motivo |
| `estado` | `entregado` · `⚠️ SIN IMAGEN` · `↩️ devuelto` |

🛑 **La columna `plantilla` no es opcional:** sin ella el loop no puede saber qué molde rindió.

## 5 · Lo que no salió

**Se escribe, no se omite.** Pieza, motivo, de quién se espera.

## 6 · 🚦 GATE 2

**Allan aprueba el paquete completo**, y recién ahí entra a QA y después a ⑨ Posting.

## 7 · Checklist

- [ ] Todo archivo lleva **`id_creativo`** en el nombre
- [ ] Las slides van con **dos dígitos**
- [ ] El QA técnico corrió **pieza por pieza**
- [ ] Todo se miró **en tamaño real de feed**
- [ ] **sRGB** en digital, **CMYK + corte + 300 dpi** en impresos
- [ ] Ningún **placeholder** quedó adentro
- [ ] `entregas-diseno.md` tiene la columna **`plantilla`** llena
- [ ] Lo que no salió está **escrito**
- [ ] **Allan aprobó el GATE 2**
