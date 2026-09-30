# Skills de Branding

Cada bloque del workflow es **un paso y además una skill**. Se corren en orden; cada una se
puede invocar suelta si ya existe el input de la anterior.

```
br-auditoria → br-plataforma → br-tono-de-voz · br-direccion-visual → br-lenguaje-visual → br-guia-aplicable
```

**Puerta de entrada:** `branding` — clasifica el pedido y dirige a la skill correcta.
Nunca se produce un entregable de Branding sin pasar por ahí.

## Las skills

| # | Skill | Qué hace | Input que necesita |
|---|---|---|---|
| **B1** | `br-auditoria` | Inventario propio, prueba del logo tapado y saturación visual de la categoría: 10 marcas × 8 capas. **Mapea, no decide** | el brief de marca de Strategy |
| **B2** | `br-plataforma` | Idea madre · punto de vista · verdad emocional · 3-5 rasgos con contraste · qué NO es. 🚦 **gate** | `br-auditoria` + el brief |
| **B3** | `br-tono-de-voz` | Registro, léxico, glosario, titulares y CTAs, tono por punto de contacto, y 5+ antes/después reales | `br-plataforma` |
| **B4** | `br-direccion-visual` | 6 ejes estéticos → 1-2 direcciones con moodboard → filtro D/N/R → prueba del logo tapado. 🚦 **gate** | `br-plataforma` + `br-auditoria` |
| **B5** | `br-lenguaje-visual` | Logo, paleta base, familias tipográficas, principios de composición, tratamiento fotográfico y activos | `br-direccion-visual` aprobada |
| **B6** | `br-guia-aplicable` | Rol por punto de contacto, reglas duras, test de reconocimiento y el consolidado `MARCA.md`. 🚦 **gate** | `br-lenguaje-visual` + `br-tono-de-voz` |

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
