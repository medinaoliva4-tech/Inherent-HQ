---
name: ds-qa-visual
description: >
  Capa D7 del método de Diseño — corre el QA visual en 3 pasadas (sistema, pieza, miniatura),
  produce los exports con nomenclatura y specs correctas, y arma el handoff a Content y Media Buy.
  Úsala cuando pidan "revisá estas piezas", "está lista para publicar", "exportá el lote", "hacé el
  QA", "esto se puede pautar", "armá la entrega", o antes de cerrar cualquier lote. Es el último
  filtro antes de que algo salga del departamento. Diseño no publica, no programa y no pauta.
---

# D7 · QA Visual y Entrega

Leé `agents/design/qa/QA-GATES.md` completo. Plantilla: `templates/entrega.md`.

## Regla madre

**Un ítem fallado se corrige.** No se entrega marcado como "menor". Este es el último filtro antes
de que algo llegue al cliente o a la pauta.

## QA en 3 pasadas

### Pasada 1 · Sistema — ¿el lote es una familia?
- Todas las piezas usan tokens (cero hex y cero px literales)
- Grilla, márgenes y escala tipográfica respetados en todo el lote
- El activo distintivo aparece en todas las piezas
- Presupuesto gráfico del lote respetado

### Pasada 2 · Pieza — ¿cada pieza funciona?
- Jerarquía 1-2-3 identificable
- **Contraste medido** en cada par texto/fondo — no estimado
- Safe areas por canal y formato
- **Copy verificado contra el contenido original**, sin erratas
- Cortes de línea a mano, por unidad de sentido
- Máx. 3 familias de overlay, con rol
- CTA presente e inequívoco en piezas `Conversion`
- Carruseles: portada autosuficiente · continuidad · quiebre · un solo CTA

### Pasada 3 · Miniatura — ¿sobrevive el feed real?
- Se entiende al **10%** de tamaño
- Sigue habiendo jerarquía **en gris**
- Se ve bien sobre **fondo oscuro** (modo oscuro del canal)
- **Sobrevive la compresión** — texto chico, textura, bordes de recorte
- Recorte de grilla de perfil revisado (IG)

🛑 **Revisar el PNG original al 100% no es QA.** El feed comprime, achica y cambia el fondo.

## Export

| Regla | Valor |
|---|---|
| Escala | **1x sobre el frame en px reales** — no 2x sobre un frame a la mitad |
| Formato | PNG con texto y planos sólidos · JPG alta calidad con fotografía dominante |
| Perfil | sRGB |
| Fondo | Siempre **opaco**. 🛑 Nunca transparente |
| Nombre | `<cliente>_<AAAAMMDD>_<id_pieza>_<canal>_<formato>.<ext>` |
| Carrusel | Un archivo por slide, sufijo `_s01`, `_s02`… en orden de publicación |

## Se listan aparte, siempre

| Lista | Por qué |
|---|---|
| **Piezas para pauta** | Densidad de texto verificada + CTA |
| **Assets generados** `[asset generado]` | Requieren ojo humano antes de publicar |
| **Piezas bloqueadas** | Con motivo, qué las desbloquea y a quién se le pide |
| **Deuda visual** | Qué quedó sin resolver y por qué |

## Cierre

🚦 **GATE 3** — un humano aprueba antes del handoff.

```markdown
## HANDOFF — Diseño → Content / Media Buy
- Cliente: · Período: · Fecha:
- Piezas entregadas: [n] · Bloqueadas: [n] · Assets faltantes: [n]
- Gates aprobados: sistema [✅/⬜] · ruta visual [✅/⬜] · entrega [✅/⬜]
- Ruta de exports: · Archivo Figma:
- Piezas marcadas para pauta: [ids]
- Piezas con asset generado: [ids]
- Deuda visual abierta:
- Siguiente: Content (publicación) · Media Buy (pauta)
```

🛑 **Diseño no publica, no programa y no pauta.** Subir a Drive, escribir en Notion o sobrescribir
un archivo de Figma aprobado requiere **confirmación explícita del usuario**.
