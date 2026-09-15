# Playbook — Color (Capa B5.2)

Cómo Branding decide y especifica color. **El color no se elige por significado: se elige por
contraste con la categoría y por función dentro del sistema.**

> 🛑 **Alcance: la paleta base y el piso de contraste.**
> La matriz de contraste medida par por par, los scrims y los tokens son de **⑥A Diseño**:
> `agents/design/systems/COLOR-Y-CONTRASTE.md`.

---

## La regla que gobierna este playbook

> **La psicología del color no es una regla.**
> Sí existen asociaciones comunes — rojo/pasión, azul/confianza, verde/naturaleza. El problema es
> que **son las mismas para todos**. Elegir azul porque *"transmite confianza"* te pone en el
> mismo lugar donde ya están las otras nueve marcas de tu categoría: te hace ver **común**, no
> confiable. Usar azul no garantiza confianza. Usar verde no obliga a que seas ecológico.

**Qué reemplaza a la psicología del color, en este orden:**

1. **Contraste con el mapa de saturación (B1.3).** ¿Qué color no está ocupado en esta categoría?
2. **Coherencia con la personalidad (B2.4).** ¿Este color se comporta como el rasgo dice?
3. **Función en el sistema.** ¿Qué trabajo hace cada color? Jerarquía, no decoración.
4. **Viabilidad.** ¿Sobrevive en impresión, en pantalla mala, en blanco y negro, a 4.5:1?

Si el color pasa los cuatro y además tiene una lectura simbólica, bien. Si **solo** tiene la
lectura simbólica, no entra.

---

## Fundamento mínimo

| Concepto | Qué es | Dónde importa |
|---|---|---|
| **Aditivo (RGB)** | Más color = más luz. Todo al máximo = blanco | Pantallas. **Diseñá en RGB para digital** |
| **Sustractivo (CMYK)** | Más tinta = menos luz. Todo = tiende al negro | Impresión |
| **Tono** | El color en sí | La identidad |
| **Saturación** | Qué tan puro o intenso | La energía del sistema |
| **Luminosidad** | Qué tan claro u oscuro | El contraste y la legibilidad |

**HEX:** 6 caracteres, dos por canal. `FF0000` = rojo puro.

> **Un color en pantalla no se ve igual impreso.** RGB y CMYK no son equivalentes: un HEX puede no
> tener traducción exacta en tinta. Si el cliente imprime, la conversión **se verifica con prueba
> física o con Pantone**, nunca se asume. Esto no es un detalle: es la diferencia entre un logo que
> funciona y un logo que llega del proveedor de otro color.

---

## Armonías — guía, no fórmula

| Armonía | Qué es | Cuándo sirve |
|---|---|---|
| **Monocromática** | Un tono, variando saturación y luminosidad | Sistemas sobrios, premium, técnicos. La más segura |
| **Análogos** | Colores vecinos en la rueda | Armonía suave, poco agresiva |
| **Complementarios** | Opuestos en la rueda | Contraste alto, destacar un elemento. Pueden "vibrar" |
| **Tríada** | Tres equidistantes | Variedad alta. Marcas coloridas, infantiles, lúdicas |

> La rueda cromática es una **guía**. Si el complementario exacto no funciona, movelo un poco,
> bajale saturación o ajustale luminosidad. No la obedezcas como fórmula cerrada.

---

## Los roles del sistema

Un color sin rol declarado es decoración. Cada uno hace un trabajo:

| Rol | Trabajo | Regla |
|---|---|---|
| **Primario** | Identidad. Es el que se recuerda | 1. Nunca dos |
| **Secundario** | Soporte, fondos, bloques | 1-2 |
| **Acento** | Interrumpe. Señala la acción | 1. Si hay dos acentos, no hay acento |
| **Neutros** | Estructura: texto, fondos, bordes | 3-5, con escala de luminosidad |
| **Fondo claro / oscuro** | Las dos bases del sistema | Ambas definidas. La marca vive en los dos modos |
| **Semánticos** | Éxito, error, alerta, info | Solo si hay producto digital |

### Proporción de reparto

Sin reparto declarado, cualquiera usa el primario al 80% y el sistema se rompe.

```
Ejemplo:  60% neutro  ·  30% primario  ·  10% acento
```

El acento vale porque es escaso. **Si el acento está en todos lados, deja de acentuar.**

---

## Especificación — la tabla obligatoria

| Rol | Nombre interno | HEX | RGB | CMYK | Pantone | Uso | Nunca |
|---|---|---|---|---|---|---|---|
| Primario | | | | | | | |

`CMYK` y `Pantone` solo si hay impresión declarada en B0.3. Si no hay, se pone `N/A — sin impresión`.

---

## Contraste y accesibilidad

**No opcional.** Branding **declara el piso** y verifica que la paleta base lo permita.
⑥A Diseño **mide cada par en cada pieza**.

| Caso | Ratio mínimo |
|---|---|
| Texto legible en miniatura | **4.5:1** |
| Texto sobre foto | **7:1** o scrim obligatorio |
| Texto grande | **3:1** |

Tabla de salida:

| Texto | Fondo | Ratio | Pasa AA |
|---|---|---|---|
| `#FFFFFF` | `#0F1115` | 18.2:1 | ✅ |

**Combinaciones prohibidas:** las que no pasan, escritas explícitamente. Si no las escribís,
alguien las va a usar.

---

## Verificaciones antes de cerrar

- [ ] Cada color tiene **rol** y **trabajo** declarado
- [ ] Hay proporción de reparto
- [ ] Piso de contraste declarado y paleta base verificada contra él
- [ ] Combinaciones prohibidas listadas
- [ ] El sistema funciona en **fondo claro y fondo oscuro**
- [ ] El sistema **sobrevive en blanco y negro** (si no, el contraste depende solo del tono → frágil)
- [ ] Si hay impresión: conversión CMYK verificada, no asumida
- [ ] La justificación cita el **mapa de saturación**, no un diccionario de color
- [ ] Está respondido el chequeo de categoría: ¿esta paleta nos hace ver igual que la competencia?
- [ ] Ningún color entró porque *"queda lindo"*
- [ ] 🛑 No se fijaron scrims ni tokens — eso es de ⑥A Diseño

---

## Errores que se repiten

| Error | Por qué duele |
|---|---|
| Elegir el color por su significado | Te pone donde ya está toda la categoría |
| Paleta de 8 colores sin roles | Nadie sabe cuál usar, cada pieza sale distinta |
| Dos acentos | El ojo no sabe dónde ir. No hay jerarquía |
| No definir modo oscuro | Medio sistema no existe y se improvisa |
| Asumir la conversión a CMYK | El material impreso llega de otro color |
| Contraste bajo por estética | Ilegible en celular, al sol, o para quien no ve bien |
| Forzar todos los objetos al color de marca | El feed se ve artificial. La consistencia viene del **tratamiento**, no del tinte |
