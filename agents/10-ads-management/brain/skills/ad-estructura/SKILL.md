---
name: ad-estructura
description: >
  Capa 1 de ⑩ Ads Management — arma la estructura de campañas y públicos: cuántas campañas, con
  qué objetivo cada una, qué públicos y con qué presupuesto. Usa el plan del plugin y la
  investigación de keywords y competencia de AdWhispr. La regla es pocas campañas con
  presupuesto suficiente para salir de aprendizaje, no muchas campañas sin datos. Úsala cuando
  pidan "cómo armamos las campañas", "a quién le pegamos", "cuántos conjuntos", "qué keywords",
  "cómo repartimos el presupuesto". Requiere la Capa 0 hecha.
---

# Capa 1 · Estructura — campañas, públicos y reparto

| | |
|---|---|
| **Consume** | § El encargo · la temperatura y el nivel de consciencia de `calendario.csv` de ③ Marketing |
| **Produce** | La sección **§ La estructura** de `plan-de-pauta.md` |

## 1 · La regla del presupuesto repartido

🛑 **Pocas campañas con presupuesto suficiente, no muchas campañas sin datos.**

| | Por qué |
|---|---|
| **Cada campaña necesita conversiones para salir de aprendizaje** | Dividir el presupuesto en seis campañas deja a las seis sin aprender |
| **Si el presupuesto no alcanza para dos campañas, se corre una** | Y se declara |

## 2 · La estructura sale de la temperatura

**③ Marketing ya clasificó cada pieza. Se usa esa clasificación, no otra.**

| Temperatura | Campaña | Objetivo típico |
|---|---|---|
| **Frío** | Adquisición | Alcance, video, tráfico |
| **Tibio** | Consideración | Tráfico cualificado, mensajes |
| **Caliente** | Conversión | Compra, lead |
| **Cliente** | Retención | Recompra, comunidad |

🛑 **Una campaña de conversión apuntada a público frío gasta sin convertir.**

## 3 · Los públicos

| Tipo | De dónde sale |
|---|---|
| **Propios** | Lista del cliente, visitantes, interacciones. **Los más baratos** |
| **Similares** | Derivados de los propios. Necesitan volumen de origen |
| **Por interés o keyword** | AdWhispr `research_keywords` · `search_ad_targeting` |
| **Competencia** | AdWhispr `find_competitors` · `research_competitor_keywords`. **Sus anuncios salen de Apify `apify/facebook-ads-scraper`, con el país del mercado donde vende el cliente y por página** — ver `cr-fuentes` |

> 🔑 **Se empieza por los propios.** Son los que mejor convierten y los que menos cuestan.

## 4 · Google — qué entra según los canales contratados

| La ficha dice | Qué entra |
|---|---|
| **Google no está en los canales** | ⛔ No se corre |
| **Solo búsqueda** | **Pauta de búsqueda** — lo que respalda *«que te encuentren en Google»* |
| **Google Ads como canal completo** | **Google Ads como canal de la estructura:** Search y Performance Max, con keywords propias y de la competencia |

| Tipo | Con qué |
|---|---|
| **Search** | AdWhispr `launch_search_campaign` |
| **Performance Max** | AdWhispr `launch_pmax_campaign` |
| **Keywords** | AdWhispr `research_keywords` · `research_competitor_keywords` |

**Cuando Google es canal de la ficha, corre con el mismo gate del CEO que Meta y TikTok:** su campaña
entra en el **GATE 1** y todo cambio de su presupuesto en el **GATE 2**. **Su presupuesto sale del
total aprobado**, no se suma aparte.

⚠️ **Es pauta de búsqueda, nunca SEO técnico ni posicionamiento orgánico.**

**Cómo se arma Search:** grupos de anuncios por intención *(una familia de keywords que se buscan
igual)*, cada uno con su anuncio escrito según `ad-creativos` §4C. **Las negativas de arranque** se
cargan desde el primer día: lo que se busca con palabras de otra intención *(empleo, gratis, cursos,
otra ciudad)* según la categoría. La limpieza semanal de términos es de `ad-optimizacion` §2B.

## 5 · El plan del plugin

**`/ads plan`** arma canales, campañas, presupuestos y medición.

🛑 **Lo que devuelva se contrasta contra el objetivo y el techo del alcance contratado.** El plugin
no sabe qué alcance tiene el cliente.

## 6 · Qué escribe

`## § La estructura`:

| Bloque | Qué lleva |
|---|---|
| **A · Las campañas** | Nombre · objetivo · temperatura · presupuesto · plataforma |
| **B · Los públicos** | Por campaña, empezando por los propios |
| **C · El reparto** | Cuánto a cada una, y por qué |
| **D · Qué no se corre** | Lo que se descartó, con el motivo |

## 7 · Checklist

- [ ] **Pocas campañas con presupuesto suficiente**
- [ ] La temperatura de cada campaña viene de **③ Marketing**
- [ ] Ninguna campaña de conversión apunta a **público frío**
- [ ] Se empezó por los **públicos propios**
- [ ] Google según los canales de la ficha: solo **búsqueda**, o Search y PMax, **dentro del presupuesto aprobado** y con sus gates
- [ ] El reparto suma **el presupuesto aprobado**, ni un quetzal más
