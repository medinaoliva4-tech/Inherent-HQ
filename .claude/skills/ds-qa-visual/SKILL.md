---
name: ds-qa-visual
description: >
  Capa D7 del método de Diseño — corre el QA visual en 4 pasadas (sistema, pieza, miniatura y
  secuencia del feed), produce los exports con nomenclatura y specs correctas, y arma el handoff a
  Content, Media Buy y Production. Úsala cuando pidan "revisá estas piezas", "está lista para
  publicar", "exportá el lote", "hacé el QA", "esto se puede pautar", "cómo se ve el feed", "armá la
  entrega", o antes de cerrar cualquier lote. Es el último filtro antes de que algo salga del
  departamento. Diseño no publica, no programa y no pauta.
---

# D7 · QA Visual y Entrega

Leé `qa/QA-GATES.md` completo y `brain/FEED-Y-GRILLA.md`. Plantilla: `templates/entrega.md`.

## Regla madre

**Un ítem fallado se corrige.** No se entrega marcado como "menor". Este es el último filtro antes de
que algo llegue al cliente o a la pauta.

## QA en 4 pasadas

### Pasada 1 · Sistema — ¿el lote es una familia?
- Todas las piezas usan tokens (cero hex y cero px literales)
- Grilla, márgenes y escala tipográfica respetados
- El activo distintivo aparece donde corresponde
- Presupuesto gráfico del lote respetado
- 🛑 Ningún texto quedó en **Inter**

### Pasada 2 · Pieza — ¿cada pieza funciona?
- **La jerarquía del brief de Creative está respetada, no reordenada**
- Lo primero que se ve es el **nivel 1**
- **Contraste medido** en cada par texto/fondo — no estimado
- Safe areas por canal y formato
- **Copy verificado contra el contenido original**, sin erratas
- Cortes de línea a mano, por unidad de sentido
- Máx. 3 familias de overlay, con rol · máx. 1 animado
- CTA presente e inequívoco en piezas de goal `vender`
- Carruseles: portada autosuficiente · continuidad · quiebre · un solo CTA
- Seamless: elementos que cruzan las guías · se exportaron los **frames**, no el componente

### Pasada 3 · Miniatura — ¿sobrevive el feed real?
- Se entiende al **10%** de tamaño
- Sigue habiendo jerarquía **en gris**
- Se ve bien sobre **fondo oscuro** (modo oscuro del canal)
- **Sobrevive la compresión** — texto chico, textura, bordes de recorte
- Recorte de grilla de perfil revisado (IG)

🛑 **Revisar el PNG original al 100% no es QA.** El feed comprime, achica y cambia el fondo.

### Pasada 4 · Secuencia — ¿cómo se ve el feed?
> Se revisa en **orden de publicación**. La grilla es un chequeo secundario.

- 🛑 **Dos piezas consecutivas no comparten encuadre + color dominante + densidad de texto**
- Alterna mezcla **visual**, no solo mezcla de contenido
- Las portadas con texto se leen a tamaño de miniatura de grilla
- La consistencia viene del **tratamiento**, no de teñir todo de color de marca
- Test anti-slop corrido sobre el lote

## Export — con Figwright

```
save_screenshots({ nodeIds: [...], outDir: "clients/<cliente>/exports", format: "PNG", scale: 1 })
```

| Regla | Valor |
|---|---|
| Escala | `scale: 1` sobre el frame en px reales — no 2x sobre un frame a la mitad |
| Formato | PNG con texto y planos sólidos · JPG con fotografía dominante |
| Perfil | **sRGB** — nunca CMYK |
| Fondo | Siempre **opaco**. 🛑 Nunca transparente |
| Nombre | `<cliente>_<AAAAMMDD>_<id_pieza>_<canal>_<formato>.<ext>` |
| Carrusel | Un archivo por slide, sufijo `_s01`, `_s02`… en orden de publicación |

🛑 **Los archivos salen nombrados por node id.** Renombrarlos al esquema de Inherent es un paso
obligatorio, no opcional.

### Leé los dos flags de la respuesta
| Flag | Qué hacés |
|---|---|
| `recovered: true` | ✅ Normal en recortes de carrusel seamless. Verificá el PNG igual |
| `empty: true` | 🛑 El nodo no renderizó nada. Volvé a D5 |

### Entrega a Drive — después del gate
```
save_screenshots → renombrar → subir a Drive → registrar link en entrega.md
```
🛑 Subir a Drive requiere **confirmación explícita** y va **después** del 🚦 GATE 3, nunca antes.

⚠️ **D7 corre en sesión local.** Los exports se escriben en el disco de la máquina donde está
Figwright. Si la sesión es remota: `BLOQUEADO`, y se entrega la especificación.

## Se listan aparte, siempre

| Lista | Por qué |
|---|---|
| **Piezas para pauta** | Densidad de texto verificada + CTA |
| **Piezas con elemento animado** | Cambian el formato de entrega (MP4) |
| **Piezas candidatas a motion** | Con capas separadas y nombradas, para Production |
| **Assets generados** `[asset generado]` | Requieren ojo humano antes de publicar |
| **Piezas bloqueadas** | Con motivo, qué las desbloquea y a quién |
| **Devoluciones a Creative** | Qué campo del contrato faltaba, y su estado |
| **Deuda visual** | Qué quedó sin resolver y por qué |

## Lo que Diseño NO promete

🛑 **Nunca prometas alcance ni ventas por la estética.** El resultado depende también de la oferta,
la distribución, la consistencia y la medición. Diseño responde por **claridad, jerarquía, marca
reconocible y craft**.

## Cierre

🚦 **GATE 3** — un humano aprueba antes del handoff.

```markdown
## HANDOFF — Diseño → Content / Media Buy / Production
- Cliente: · Período: · Fecha:
- Piezas entregadas: [n] · Bloqueadas: [n] · Devueltas a Creative: [n] · Assets faltantes: [n]
- Gates aprobados: sistema [✅/⬜] · ruta visual [✅/⬜] · entrega [✅/⬜]
- Ruta de exports: · Carpeta de Drive: · Archivo Figma:
- Piezas para pauta: [ids] · Con animado: [ids] · Candidatas a motion: [ids]
- Piezas con asset generado: [ids]
- Devoluciones a Creative abiertas: [ids]
- Deuda visual abierta:
- Siguiente: Content (publicación) · Media Buy (pauta) · Production (motion)
```

🛑 **Diseño no publica, no programa y no pauta.** Que Figwright escriba sobre el archivo del cliente,
subir a Drive o registrar en Notion requiere **confirmación explícita del usuario**.
