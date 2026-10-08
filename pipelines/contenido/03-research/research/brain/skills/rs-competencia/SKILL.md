---
name: rs-competencia
description: >
  Capa 2 de Research — competidores y referentes. Fija a quién se mira: los competidores de
  Guatemala (los que compiten por el mismo cliente) y los referentes (los que ya ganaron donde el
  cliente quiere llegar, dentro y fuera de la categoría y de la lista fija de países). Descubre por
  keyword y mide por página, resuelve cada handle antes de analizar, y calcula la base de cada cuenta
  —su mediana—, que es lo que permite decir después qué es un ganador. Mantiene competencia y
  referencias en secciones separadas. Úsala cuando pidan "quiénes son los competidores", "a quién
  miramos", "qué referentes hay", "quién pauta hoy en esta categoría". No re-mapea la categoría: eso
  ya lo hizo Strategy.
---

# Capa 2 · rs-competencia — a quién se mira

| | |
|---|---|
| **Consume** | `audiencia.md` · el mapa de categoría y los competidores que Strategy ya identificó · las Redes del plan · la cuota por Red |
| **Produce** | `competencia-y-referentes.md` — dos secciones separadas, con la **base de rendimiento** de cada cuenta |

Contexto del departamento: `pipelines/contenido/03-research/research/README.md`.

**Elige a quién se scrapea; no scrapea el contenido** *(eso es `rs-winners`)*. Strategy ya mapeó la
categoría en lo macro; esta capa **baja a la lista de cuentas** que valen la pena mirar pieza por
pieza. Lo que Strategy ya cubre **se cita, no se re-investiga**.

## Dos capas que no se mezclan

| | 🔍 **Competidores** | ⭐ **Referentes** |
|---|---|---|
| **Quiénes son** | Los que le compiten al cliente por el mismo comprador en Guatemala | Los que ya ganaron donde el cliente quiere llegar |
| **Para qué** | Saber de qué hay que despegarse | Encontrar qué estructura ya funciona |
| **Quién lo usa** | Strategy *(el código saturado)* | Creatividad *(el swipe file)* |
| **Dónde** | **Solo Guatemala** | La **lista fija de países** de `cr-fuentes`; dentro y fuera de la categoría |
| **Cuota** | **La mitad** de los contenidos de cada Red | **La otra mitad** |

**Costa Rica y Panamá entran solo en un cliente premium o de ticket alto**, como dice `cr-fuentes`.

## Paso 1 · Descubrir, después medir

```
1 · DESCUBRIR por keyword o hashtag  →  qué cuentas lideran la categoría y la conversación
2 · MEDIR      por página o perfil    →  cuánto publican, cuánto rinden, cuál es su base
```

**No al revés.** Buscar por keyword y quedarse ahí mezcla marcas y no deja medir a nadie.

| Acción | Herramienta |
|---|---|
| **Competidores verificados que pautan hoy** | AdWhispr `find_competitors` ✅ |
| Trackear una marca nueva | AdWhispr `add_brand` *(toma `pageId` numérico, **no** `brandId`)* ⬜ |
| Descubrir cuentas orgánicas por hashtag | Apify `apify/instagram-hashtag-scraper` ⬜ |
| **Resolver un handle antes de analizar** | Apify `apify/instagram-profile-scraper` ⬜ |
| **Estudiar una cuenta a fondo y sacar su mediana** | Apify `easy_scraper/instagram-profile-engagement-analytics` ⬜ |
| Leer su sitio, oferta y precios | Firecrawl `firecrawl_scrape` ✅ |
| Reseñas y prensa | `WebSearch` ✅ |

**Si el handle devuelve ambiguo, se pregunta.** Nunca se adivina cuál es la cuenta.
**`find_competitors` no se reemplaza con nombres sacados de memoria:** un competidor que no
pauta ni publica no es evidencia. Si no devuelve nada, se declara y se pide un nombre.

## Paso 2 · La ficha de cada cuenta

```
| Capa | Cuenta | Red | País | Seguidores | Frecuencia | Mediana de vistas o interacciones | Formato dominante | Por qué entra | Fuente y fecha |
```

- **La mediana es lo que vuelve útil la cuenta:** sin ella no se puede medir un outlier en
  `rs-winners`. Si no se pudo medir, la cuenta queda `⚪ sin base`.
- **«Por qué entra»** es una frase con evidencia: a qué audiencia le habla *(de `rs-audiencia`)* y
  qué hace que sea competidor o referente.
- **Una cuenta que pauta** lleva además su página de anuncios y cuántos anuncios activos tiene.

## Paso 3 · Cerrar la lista

- Competidores y referentes **por Red del plan**, con el reparto 50/50 que pide la cuota.
- Los **ingresos, conversiones y ventas** de un competidor normalmente no son públicos:
  `⚠️ SIN DATOS`. No se estiman como dato.
- Lo que sugiere un competidor no mapeado por Strategy se **levanta como hallazgo**.

## ✅ Checklist

- [ ] Competidores y referentes en **secciones separadas**
- [ ] Competidores: **solo Guatemala**. Referentes: **solo la lista fija de países**
- [ ] Se **descubrió por keyword y se midió por página**, no al revés
- [ ] Cada handle se **resolvió** antes de analizarse; los ambiguos se preguntaron
- [ ] Cada cuenta trae **su mediana**, o queda marcada `⚪ sin base`
- [ ] Ningún ingreso ni conversión de competidor aparece sin fuente
- [ ] Solo las Redes del plan, con el reparto mitad y mitad
- [ ] Lo que Strategy ya mapeó se citó, no se rehízo
- [ ] Entrada completa en `registro-de-research.md`

**Handoff →** `rs-winners` (scrapear las piezas de estas cuentas) · Strategy **(cita)**.
