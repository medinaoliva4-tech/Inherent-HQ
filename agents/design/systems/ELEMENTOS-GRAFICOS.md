# Elementos Gráficos Superpuestos

La capa D4. **Refuerzan la jerarquía; nunca la crean.** Si la pieza no funciona en gris y sin
overlays (test de D3), ningún elemento gráfico la va a salvar.

---

## Las 5 familias

### 1 · Ilustraciones
Dibujos, trazos, iconos ilustrados, doodles.

| Rol legítimo | Especificación |
|---|---|
| Señalar (flecha dibujada, círculo a mano) | Trazo de grosor consistente con `stroke/` del sistema |
| Humanizar una pieza muy tipográfica | Máx. 1-2 por pieza |
| Explicar un concepto abstracto | Estilo único en todo el lote — no mezclar trazo a mano con icono vectorial |

🛑 **No:** ilustración decorativa sin rol · dos estilos de ilustración en una pieza · iconos de
librería genérica mezclados con trazo propio.

---

### 2 · Assets PNG recortados (sin fondo)
Stickers, sellos, productos recortados, objetos, recortes fotográficos.

| Rol legítimo | Especificación |
|---|---|
| Dar objeto real a una pieza plana | Recorte limpio: sin halo, sin borde de compresión |
| Romper el plano (salir del marco, pisar el texto) | Sombra sutil (`shadow/`) para separar del fondo |
| Marcar prueba (sello "agotado", "nuevo") | Máx. 2 stickers por pieza |

**Producción del recorte:** ver `playbooks/ASSETS-Y-MCP.md`. Un recorte con halo blanco o borde
dentado es motivo de rechazo en QA — se rehace, no se pasa.

🛑 **No:** PNG de stock con recorte sucio · sticker tapando el punto focal · más de 2 por pieza.

---

### 3 · Texturas
Papel, grano, polvo, tela, ruido.

| Rol legítimo | Especificación |
|---|---|
| Dar materia y temperatura | Opacidad baja: **5-20%**. Arriba de 25% compite con el contenido |
| Unificar el lote (la misma textura en todas las piezas) | Una sola textura por lote |
| Envejecer / dar tacto | Aplicada sobre toda la pieza, como capa 3 del orden |

⚠️ **La textura se pierde al comprimir.** Verificar en el test de miniatura: si desaparece, o sube
levemente la opacidad, o se saca (no se deja a medias).

🛑 **No:** textura al 60% · dos texturas superpuestas · textura solo en una parte de la pieza sin
razón de layout.

---

### 4 · Pinceladas y brochas
Trazos pintados, manchas, resaltados.

| Rol legítimo | Especificación |
|---|---|
| Destacar **una** palabra | Detrás de la palabra, con contraste verificado del texto encima |
| Marcar una zona | En un color del sistema, nunca uno nuevo |
| Dar gesto humano a una pieza rígida | Máx. 2 trazos por pieza |

**Regla de contraste:** si la pincelada va detrás de texto, el par `pincelada/texto` entra en la
matriz de D0 y se mide. Un resaltado que vuelve ilegible el texto es peor que no resaltar.

🛑 **No:** más de 2 palabras destacadas por pieza · pincelada en un color fuera del sistema ·
pincelada como fondo de bloques largos de texto.

---

### 5 · Formas gráficas
Círculos, líneas, flechas, marcos, barras, bloques.

| Rol legítimo | Especificación |
|---|---|
| **Dirigir** la mirada (flecha, línea) | Apunta al nivel 1 o al CTA, nunca fuera de la pieza |
| **Contener** (bloque, marco) | Radio del token `radius/`, no arbitrario |
| **Agrupar** (fondo de bloque, caja) | Padding del token `space/` |
| **Separar** (línea divisoria) | Grosor del token `stroke/` |

Son la familia **más segura** y la más subutilizada. Una barra sólida detrás de un titular resuelve
más problemas de contraste que cualquier efecto.

🛑 **No:** marcos decorativos sin función de contención · formas en colores fuera del sistema ·
flechas que apuntan a nada.

---

## El presupuesto gráfico — regla dura

**Máximo 3 familias por pieza.** Cada una con **un rol declarado** en el brief (D2, campo 6).

```
✅ textura (unificar) + forma (contener el titular) + sticker (romper el plano)
✅ forma (dirigir) + pincelada (destacar 1 palabra)
🛑 ilustración + textura + pincelada + sticker + forma   → 5 familias, se saca
```

**Si no podés nombrar el rol de un elemento, el elemento se saca.**

---

## Orden de capas (de atrás hacia adelante)

```
1  Fondo / color base
2  Foto o asset base
3  Textura global            ← opacidad 5-20%, sobre toda la pieza
4  Scrim / bloque de contención
5  Formas gráficas           ← contención y dirección
6  Tipografía
7  Pinceladas de destaque    ← detrás o encima de una palabra puntual
8  Assets PNG y stickers     ← encima de todo, rompiendo el plano
9  Logo / firma
```

En Figma este orden se construye como **grupos nombrados**, no como capas sueltas.

---

## El test de sustracción — cierre de D4

```
Sacar cada overlay de a uno.
Si la pieza NO empeora al sacarlo → ese overlay sobra.
```

Se corre sobre la pieza modelo de cada formato antes del 🚦 GATE 2.

---

## Anti-patrones

| Escenario | Por qué falla | En cambio |
|---|---|---|
| Overlay para tapar una foto mala | El problema es la foto | `⚠️ ASSET INSUFICIENTE` → pedir reemplazo a Production |
| 5 familias en una pieza | Ruido; el nivel 1 desaparece | Presupuesto de 3, con rol declarado |
| Textura al 50% | Compite con el contenido y muere al comprimir | 5-20% |
| Sticker sobre la cara del sujeto | Destruye el punto focal | Ubicar en zona de aire |
| Cada pieza del lote con overlays distintos | El lote no se lee como familia | Presupuesto **del lote**, no de la pieza |
| Flecha decorativa que no apunta a nada | Una flecha promete dirección; si no la da, confunde | Apuntar al nivel 1 o al CTA, o sacarla |
| Recorte PNG con halo | Se ve amateur al 100% y al comprimir | Rehacer el recorte |
