# Toolkit Creativo — 7 taxonomías

**Por qué existe esto.** Un hook no se improvisa, un CTA no se elige por costumbre y un layout no se
describe con adjetivos. Cada decisión creativa sale de una **taxonomía cerrada**, para que sea
repetible, auditable y comunicable a quien ejecuta.

**Cómo funciona.** Cada capa del método usa una o dos fichas. La ficha da las opciones; la evidencia
del bloque decide cuál.

| Ficha | Capa | Qué decide | Columnas del Excel |
|---|---|---|---|
| `01-tecnicas-de-direccion.md` | 2 | Cómo una referencia se vuelve original | `concepto` |
| `02-hooks.md` | 4 | Con qué entra la pieza y cómo se estructura | `hook` |
| `03-arco-narrativo.md` | 3 | Quién es el héroe y qué transformación se cuenta | `concepto` `copy` |
| `04-copy-y-ctas.md` | 4 | Qué dice y qué pide, en texto y en voz | `guion` `copy` `layout_de_texto` |
| `05-arte-y-layout.md` | 5 | Cómo se ve y en qué orden se lee | `layout_de_texto` `estetica_mood` `elementos_graficos` |
| `06-shot-list.md` | 5 | Cómo se filma | `composicion_encuadre` `audio_musica` |
| `07-plataformas.md` | 6 | Cómo vive en cada canal | `audio_musica` + specs del `formato` |

---

## Estructura de cada ficha

Todas responden lo mismo, en el mismo orden:

1. **Qué decide** — y en qué capa se usa
2. **La taxonomía** — las opciones cerradas
3. **Reglas duras** — lo que no se negocia
4. **Ejemplo trabajado** — una pieza real, de punta a punta
5. **Anti-patterns** — los errores que se repiten siempre acá
6. **Qué columna del Excel llena**

---

## Cómo modula el arquetipo

El arquetipo del cliente (`strategy/clients/<cliente>/nucleo.md` sección E, de los 11 del repo)
**no cambia las taxonomías, cambia los pesos**. Punto de partida:

| Arquetipo | Técnica que pesa | Hook que pesa | Prueba que pesa |
|---|---|---|---|
| **01 Local Alta Frecuencia** | Belleza · Escala | Pattern Interrupt · Pain | Evidencia sensorial real (nunca stock) |
| **02 Local Alto Ticket** | Belleza · Tensión | Bold Claim · Question | Antes/después, credenciales |
| **03 Marca Personal** | Tensión · Estética | Story/Tease · Bold Claim | La persona en cámara |
| **04 E-commerce / DTC** | Escala · Belleza · Transportación | Pattern Interrupt · Bold Claim | Demo de producto, UGC |
| **05 Servicio B2B** | Estética · Tensión | Question · List/Number | Casos con número, autoridad |
| **06 SaaS / Suscripción** | Choque · Estética | Pain · List/Number | Demo de pantalla, dato |
| **07 Infoproducto** | Tensión · Escala | Bold Claim · Curiosity Gap | Resultado de alumno |
| **08 Marketplace** | Escala · Choque | List/Number · Question | Cantidad, los dos lados |
| **09 Hospitalidad** | Belleza · Transportación | Pattern Interrupt · Story/Tease | La experiencia filmada |
| **10 Institución** | Estética · Belleza | Question · List/Number | Trayectoria, certificación, dato |
| **11 Media / IP** | Choque · Transportación · Tensión | Story/Tease · Pattern Interrupt | La audiencia misma |

> **Las fichas son puntos de partida con evidencia detrás, no verdades.** Si el swipe file del cliente
> contradice la ficha, gana la evidencia del cliente — y se anota la contradicción para revisar la
> ficha en el ciclo trimestral.

---

## Actualización

Las fichas se revisan **cada 3 meses** con los patrones acumulados en `aprendizaje-creativo.md`:

- Un tipo de hook que ganó 3+ veces en un arquetipo **sube al tope** de su ficha
- Un formato que fatigó consistentemente se marca en `07-plataformas.md`
- Una técnica que produjo la prueba del logo fallida se anota como riesgosa en ese arquetipo

**Nunca se agrega una opción nueva a una taxonomía sin evidencia de 3+ piezas.** Una taxonomía que
crece sin criterio deja de ser una taxonomía y se vuelve una lista.
