---
name: vd-broll
description: >
  Disciplina 6 — edición con B-roll. Agrega tomas de apoyo para cubrir cortes, mostrar producto,
  ambiente, manos, detalles o contexto, y para que un talking head no sea un plano fijo de tres
  minutos. Úsala cuando pidan "falta B-roll", "tapá este corte", "mostrá el producto mientras
  habla", "esto es muy plano", "cubrí el jump cut", o cuando el análisis detecte saltos sin cubrir.
  Requiere picture lock.
---

# B-roll y Cobertura

**Requiere:** picture lock + ritmo cerrado. **Fuente:** inventario de planos de
`analisis-de-material.md` (columna uso = B-roll).

## Para qué entra un B-roll

| Función | Cuándo |
|---|---|
| **Cubrir** | Tapar un jump cut o un salto de continuidad |
| **Mostrar** | Lo que la voz nombra (producto, lugar, proceso) |
| **Contextualizar** | Dónde pasa, quién es, en qué escala |
| **Respirar** | Bajar la intensidad antes de un beat importante |
| **Detallar** | Manos, textura, materiales — lo que da veracidad |

🛑 **Un B-roll sin función se elimina.** "Queda lindo" no es una función.

## Reglas de uso

- **El B-roll ilustra lo que se está diciendo**, no algo de tres frases después.
- **Entra con J-cut**: el audio del plano siguiente empieza antes que la imagen. Sale con L-cut.
- **Duración:** 1-3s en social, 2-5s en pieza larga. Un B-roll largo se convierte en A-roll.
- **No compite con la voz.** Si el plano de apoyo es más interesante que lo que se dice, se pierde
  el mensaje.
- **Continuidad:** dirección de movimiento, hora del día, vestuario y clima tienen que cerrar.
- **Nunca dos B-roll seguidos sin volver a A-roll**, salvo en secuencia intencional.

## Si no existe el plano

En este orden:

```
1  Buscar en el material completo (revisar descartes del análisis)
2  Assets del cliente en _INPUTS/ o Drive
3  Stock con licencia
4  Generar (Higgsfield) → se declara [GENERADO] en la EDL
5  Cambiar el beat para que no lo necesite
6  ⚠️ FALTA MATERIAL — se escala para refilmación
```

🛑 **Nunca se genera un producto real, una persona real ni una demo.** Si el plano prueba algo,
tiene que ser real.

## Reglas duras

- 🛑 **El B-roll no arregla un corte mal ubicado.** Si el salto molesta, el problema es narrativo.
- **Se declara en la EDL** como capa `B-roll`, con `tc_fuente`.
- **Se corrige color junto con el A-roll** (`vd-color`), no antes y no por separado.
- En modo documental: la entrevista manda, el B-roll ilustra. **Nunca al revés.**

## Cierre
Verificar que **ningún jump cut involuntario** quedó al aire. Correr los ítems de B-roll del
bloque **Fase 4** de `qa/QC-GATES.md`.

## Handoff
→ `vd-vfx` si hay limpieza o keys · si no, → `vd-color`.
