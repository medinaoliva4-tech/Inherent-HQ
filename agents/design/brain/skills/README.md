# Skills de Diseño

Cada bloque del workflow es **un paso y además una skill**. Se corren en orden; cada una se
puede invocar suelta si ya existe el input de la anterior.

```
ds-sistema-visual → ds-brief-de-pieza → ds-composicion → ds-elementos-graficos → ds-figma → ds-adaptacion → ds-qa-visual
```

**Puerta de entrada:** `diseno` — clasifica el pedido y dirige a la skill correcta.
Nunca se produce un entregable de Diseño sin pasar por ahí.

## Las skills

| # | Skill | Qué hace | Input que necesita |
|---|---|---|---|
| **D0** | `ds-sistema-visual` | `MARCA.md` → tokens, contraste medido, escalas, grillas y componentes. Modo A o B. 🚦 **gate** | `MARCA.md` (o intel, en Modo B) |
| **D1-D2** | `ds-brief-de-pieza` | Lee y **valida** el Excel creativo → `lote-de-piezas.csv` + brief por pieza | `ds-sistema-visual` + el Excel |
| **D3** | `ds-composicion` | La jerarquía del mensaje se vuelve cierta. Se compone en gris. Tests de miniatura, gris y atención | `ds-brief-de-pieza` |
| **D4** | `ds-elementos-graficos` | Color y capas. Máximo 3 familias por pieza con rol. Anti-slop. 🚦 **gate** | `ds-composicion` |
| **D5** | `ds-figma` | Construye con Figwright: tokens bindeados, componentes con variants, validación por screenshot | la ruta visual aprobada |
| **D6** | `ds-adaptacion` | Recompone en cada formato y canal. **Adaptar no es escalar** | `ds-figma` |
| **D7** | `ds-qa-visual` | QA en 4 pasadas, exports nombrados y el handoff. 🚦 **gate** | el lote construido |

---

## Cómo se usan

1. El agente lee `../WORKFLOW.md` **completo** al arrancar.
2. Declara el **plan contratado** (`WORKFLOW.md` §3). Sin eso no sabe hasta dónde llega.
3. Corre los bloques **en orden**. Cada skill abre su `SKILL.md` y lo sigue entero.
4. Si falta el input de un bloque, **se corre el anterior**. Nunca se improvisa el faltante.
5. Cierra con los entregables de `../WORKFLOW.md` §7. **Cada agente entrega lo suyo**, con su
   propio formato — no hay skill de entrega compartida.

**No se inventan skills nuevas sobre la marcha.** Si un procedimiento se repite lo suficiente
como para merecer una, se propone a Allan primero.
