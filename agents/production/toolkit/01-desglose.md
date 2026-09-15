# 01 · El desglose — las 8 categorías
`Capa 1 · columnas: talento, producto, props, vestuario, arte_ambientacion, equipo, permisos`

**Qué decide.** Cómo se traduce una escena escrita en una lista de cosas que alguien tiene que
conseguir. Es la traducción central del departamento.

> 🛑 **Ninguna categoría se omite.** Si no aplica, se escribe `N/A`. Una categoría vacía es
> ambigua —¿no aplica, o nadie la pensó?— y esa ambigüedad se descubre el día del rodaje.

---

## La taxonomía

### 1 · Locación
Lo que se define: el lugar **concreto**, no el tipo.

| Sub-ítem | Qué se chequea |
|---|---|
| Interior / exterior | El exterior activa dependencia de clima y plan B obligatorio |
| Día / noche | La hora del día define la ventana real de rodaje |
| Acceso | Cómo entra el equipo, si hay ascensor, cuántos viajes |
| Electricidad | Cuántas tomas, de qué amperaje, si hace falta generador |
| Ruido | Tráfico, obra, aire acondicionado. **Mata el audio directo** |
| Permiso | Quién autoriza, por escrito, para qué franja horaria |

### 2 · Talento
| Tipo | Qué implica |
|---|---|
| **Rostro** | Cesión de imagen obligatoria · dirección de actor · vestuario y maquillaje |
| **Cuerpo sin rostro** | Cesión igual — el cuerpo identifica |
| **Manos / detalle** | Lo más barato y lo más reemplazable. Muchas escenas se pueden reescribir a manos |
| **Voz** | Puede grabarse después, en otro lugar. **No obliga a que esté en la jornada** |

### 3 · Producto
Qué producto, **cuántas unidades**, en qué estado, quién lo provee y para cuándo.

🛑 **Lo que se destruye en cuadro necesita unidades de respaldo.** Si se corta, se abre, se derrite
o se consume: mínimo 3 unidades, y va último en su bloque.

### 4 · Props
Objetos en cuadro que no son el producto. Se listan **uno por uno**: "ambientación de oficina" no es
un prop, es una lista que nadie armó.

### 5 · Vestuario
Ropa, calzado, accesorios. De quién sale cada prenda y quién la lleva el día.

🛑 **Sin logos de terceros, sin rayas finas, sin verde si hay croma.** Son las tres que más se
descubren tarde.

### 6 · Arte y ambientación
Lo que hay que **montar o quitar** del lugar para que se vea como el `estetica_mood` pide. Es la
categoría que más tiempo consume y menos se estima.

### 7 · Equipo técnico
Cámara · óptica · soporte · luz · audio · monitor. Sale del `encuadre` heredado — no se elige por
gusto. → `04-equipo.md`

### 8 · Permisos y legales
| Permiso | Cuándo hace falta |
|---|---|
| **Locación** | Siempre que no sea espacio propio del cliente |
| **Cesión de imagen** | Toda persona identificable, incluidas las de fondo |
| **Derechos de música** | Si suena música en set o si se usa en la pieza |
| **Seguro** | Equipo alquilado · espacios de terceros · vía pública |

---

## Reglas duras

1. **Se desglosa lo pedido, nunca se agrega.** Si hace falta una escena que no está en el Excel
   creativo, se **devuelve** a ④ para que la agregue ella. Una escena agregada acá no tiene
   `traza_a_must_be_true`.
2. **El `tipo_de_lugar` se hereda; la `locacion` se decide.** Son dos columnas por esa razón.
3. **Todo ítem tiene dueño desde el desglose.** "Lo vemos después" es cómo se llega a la jornada sin
   props.
4. **Lo perecedero y lo destructivo se marcan acá**, no en la jornada. Cambia el orden de tiro.
5. **Antes de desglosar, se cruza contra el banco de assets.** Lo que ya existe no se desglosa.

---

## Tiempos de referencia

| Actividad | Tiempo típico |
|---|---|
| Montaje inicial de jornada | 60-90 min |
| Cambio de setup de luz | 30-45 min |
| Cambio de vestuario | 15-20 min |
| Ambientación de un espacio | 30-120 min — **la que más se subestima** |
| Escena simple, talento cómodo | 20-30 min |
| Escena con producto destructivo | 40-60 min (incluye reset entre tomas) |
| Desmontaje | 45 min |

*(La Capa 7 corrige estos números con el dato real de cada ciclo.)*

---

## Anti-patterns

| Error | Por qué falla | Qué hacer |
|---|---|---|
| *"Props: lo de siempre"* | El día del rodaje nadie sabe qué era "lo de siempre" | Listar uno por uno |
| Desglosar sin cruzar el banco de assets | Se vuelve a grabar lo que ya existe | Cruce obligatorio en Capa 0 |
| Dejar el permiso para el final | Es lo que más tarda y lo único que puede anular la jornada entera | Se gestiona primero |
| Una sola unidad de producto destructivo | La segunda toma ya no existe | Mínimo 3 |
| Estimar arte en 15 minutos | Es la categoría que más se pasa | Usar el rango de la tabla, no el optimismo |
