---
name: rs-tendencias
description: >
  Capa 4 de Research — tendencias. Lee qué temas, formatos, búsquedas y audios se están moviendo
  ahora en las plataformas del cliente y en su categoría, separa lo que sube de lo que ya se quemó, y
  dice si cada tendencia aplica al cliente según su audiencia, su oferta y su marca. Una tendencia
  sin evidencia de volumen o de crecimiento no entra. Úsala cuando pidan "qué se está moviendo",
  "qué tendencias aplican", "qué formato está subiendo", "qué se busca ahora", antes del plan del
  ciclo. No decide qué tendencia se produce ni escribe la pieza: eso es Marketing y Creatividad.
---

# Capa 4 · rs-tendencias — qué se mueve ahora

| | |
|---|---|
| **Consume** | `audiencia.md` · `biblioteca-winners.csv` *(qué formatos y temas ya aparecen entre los ganadores)* · las Redes del plan · el territorio de marca de Branding, si existe |
| **Produce** | `tendencias.md` — cada tendencia con su evidencia, su estado y si aplica al cliente |

Contexto del departamento: `pipelines/contenido/03-research/research/brain/WORKFLOW.md`. Cadencia:
**una vez por ciclo, antes del día 3**, y a pedido.

**Observa. No decide.** Qué tendencia se aprovecha y cómo es de Marketing y de Creatividad; esta
capa dice **qué existe, con qué fuerza y si le calza al cliente.**

## Paso 1 · Dónde se mira

| Señal | Qué da | Herramienta |
|---|---|---|
| **Temas y hashtags en subida** | Qué conversación crece en la Red del cliente | Apify `apify/instagram-hashtag-scraper` · `clockworks/tiktok-scraper` ⬜ |
| **Formatos que se repiten entre winners** | Qué estructura aparece una y otra vez en `biblioteca-winners.csv` | La biblioteca |
| **Búsquedas** | Qué se busca más que antes, y con qué palabras | `research_keywords` ⬜ · Apify, `platform: google search` ⬜ |
| **Anuncios de TikTok que corren hoy** | Qué formato de pauta está de moda | AdWhispr `research_tiktok_ads` ⬜ |
| **Prensa y conversación pública** | Qué temas ocupan la categoría | `WebSearch` ✅ |

Solo se miran **las Redes del cliente.** Un formato que sube en una plataforma donde el cliente no
publica no es tendencia para él.

## Paso 2 · Qué cuenta como tendencia

Una tendencia entra **solo con evidencia**:

| Evidencia | Ejemplo de qué vale |
|---|---|
| **Volumen** | Búsquedas o publicaciones de ese tema, con cifra y fuente |
| **Crecimiento** | Más que en la lectura anterior; con **fecha de ambas** |
| **Repetición entre winners** | El formato o tema aparece en **3 o más** piezas ganadoras de la biblioteca |

🛑 **Una pieza viral aislada no es una tendencia.** Es un dato para `rs-winners`.
🛑 **Sin cifra ni fuente no entra.** «Se está viendo mucho» no es evidencia.

Cada tendencia se marca con su estado:

| Estado | Qué significa |
|---|---|
| 🟢 **Sube** | Crece entre lecturas y todavía no está saturada |
| 🟡 **En pico** | Mucho volumen, ya la usan todos |
| 🔴 **Se quema** | Cae entre lecturas, o la audiencia ya muestra fatiga |
| ⚪ **Una sola lectura** | Sin comparación; no se declara dirección |

## Paso 3 · ¿Aplica al cliente?

| Pregunta | Fuente |
|---|---|
| ¿Le interesa a **su audiencia**, con intención y proximidad? | `rs-audiencia` |
| ¿Cae dentro de **su oferta**, sin tocarla? | El plan y la estrategia |
| ¿Cabe en **su marca**: el territorio y la voz? | Branding |
| ¿Está en **una Red que el cliente usa**? | El plan contratado |

**Aplica · Aplica adaptada · No aplica**, con una frase de por qué. Subirse a una tendencia que
contradice la marca es un hallazgo para Marketing y Branding, **no una decisión de Research.**

## 🛑 Bloqueos

- Sin una fuente de volumen habilitada: se declara `⚠️ SIN [fuente]` y la capa sale solo con lo que
  hay en la biblioteca.
- Cero resultados describe esos filtros, no «no hay tendencias».

## ✅ Checklist

- [ ] Solo las Redes del plan
- [ ] Toda tendencia trae **cifra y fuente** con la fecha de la lectura
- [ ] Ninguna pieza viral aislada se declaró tendencia
- [ ] Cada tendencia tiene su **estado**; una sola lectura no declara dirección
- [ ] Cada tendencia dice si **aplica al cliente** y por qué
- [ ] Ninguna tendencia trae concepto, hook ni copy
- [ ] Entrada completa en `registro-de-research.md`

**Handoff →** Marketing *(el plan del ciclo)* · Creatividad **(insumo del swipe file)** ·
Strategy **(cita)**.
