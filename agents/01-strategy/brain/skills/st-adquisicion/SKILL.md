---
name: st-adquisicion
description: >
  Paso 4 de ① Strategy — la adquisición: cuántos prospectos, leads, alcance y presupuesto hacen
  falta para llegar a la meta, y con qué receta se capturan. Corre la calculadora outbound
  (prospectos con probabilidad binomial) y la inbound (embudo alcance → clic → lead → cliente,
  calibrada con las métricas reales de Zernio), elige la receta de captura (comenta-y-te-mando,
  quiz, lead magnet, VSL, low ticket, outbound), el embudo y los referidos. Úsala cuando pidan
  "cuántos prospectos necesito", "la calculadora", "cuánto alcance hace falta", "cuánto
  presupuesto", "cómo capturamos leads", "el embudo", "referidos", "qué reels de prueba".
---

# Paso 4 · Adquisición — de la meta al número de cada día

| | |
|---|---|
| **Consume** | `producto` e `icp` aprobados · los nodos `dolor` y `deseo` · la ficha de oferta |
| **Produce** | `clients/<cliente>/01-estrategia/adquisicion.md` — nodo `tipo: adquisicion`, `viene_de: [icp-…]` |
| **Herramienta** | La calculadora de adquisición del OS · aquí: `calculadora.py` |

## 1 · Outbound — se idealiza, no se calibra

| Entrada | Qué es |
|---|---|
| `m` | Clientes meta |
| `c` | Conversión prospecto → cliente (0–1) |
| `P` | Probabilidad objetivo (p. ej. 0.95) |
| `w` | Plazo en semanas |

**Prospectos `n`** = el menor entero tal que P(Binomial(n, c) ≥ m) ≥ P · **por semana** = ⌈n / w⌉ ·
**por día hábil** = ⌈n / (w·5)⌉.

```bash
python3 calculadora.py outbound --m 5 --c 0.01 --p 0.95 --semanas 4
# Prospectos necesarios: 913 · por semana: 229 · por día hábil: 46
```

- **La conversión de partida** la sugiere el agente según «¿oferta comprobada?», **citando la
  fuente**; el CEO la ajusta. Sin fuente va `[hipótesis]`.
- **Texto fijo junto al resultado:** «La probabilidad es una estimación estadística, no una
  garantía; los prospectos deben ser empresas calificadas y la tasa debe validarse con datos reales».
- **La lista** sale de Apify *(`compass/crawler-google-places`, `harvestapi/linkedin-post-search`)*,
  solo datos públicos de negocio, filtrada contra el ICP: **lista corta que calza, no larga que cabe.**
- **El agente investiga y redacta; una persona envía.** Quien pide que no se le escriba más no se
  vuelve a contactar.

## 2 · Inbound — se calibra con Zernio

**Entradas:** ventas o clientes meta · tasas del embudo *(alcance→clic, clic→lead, lead→cliente)* ·
frecuencia · CPM o CPC de referencia · segmentación.

```bash
python3 calculadora.py inbound --ventas 10 --lead-cliente 0.10 --clic-lead 0.20 \
  --alcance-clic 0.01 --frecuencia 1.8 --cpm 4.5
```

**Salidas:** leads, clics, alcance, impresiones, presupuesto estimado y **qué reels de prueba
producir** *(uno por dolor o deseo `hipotesis` que haya que validar)*.
🔑 **Cada tasa dice de dónde viene:** `[supuesta]` o `[Zernio, AAAA-MM]`. Cuando `resultados` trae
las reales, reemplazan a las supuestas.

## 3 · La receta de captura — una principal por ciclo

| Receta | Cuándo sirve |
|---|---|
| **Comenta-y-te-mando** | El contenido regala algo que se entrega por mensaje; ⑥ Community lo deja corriendo en Zernio |
| **Quiz** | La compra se decide comparando; el valor es el segmento |
| **Lead magnet** | Un problema concreto se resuelve en parte con un documento. Demuestra el método, no regala el servicio |
| **VSL** | La oferta necesita explicación y hay casos que la prueben |
| **Low ticket** | No hay confianza todavía; trae compradores para la escalera. El precio lo decide el cliente y se escala al CEO |
| **Outbound** | Pocos compradores grandes que se sabe dónde están |

**El lead entra siempre igual:** quién y cómo contactarlo · fuente *(receta)* · pieza que lo trajo
*(su id)* · etapa *(prospecto o lead)* · **siguiente paso con fecha** — un lead sin siguiente paso
se pierde.

## 4 · Embudo y referidos *(Growth Partnership, o si la ficha lo incluye)*

- **El embudo** en una línea por paso: la pieza que atrae → la captura → el seguimiento → el cierre
  → la recompra, con su métrica.
- **Referidos:** se piden en el momento de más satisfacción *(después de un resultado visible)*, a
  quién, qué se ofrece a cambio y cómo se registra. La recompensa la decide el CEO; sin ella, los
  referidos no se activan.

## 5 · Por nivel

| Nivel | Qué corre |
|---|---|
| **Brand Foundation** | La calculadora como parte del plan a 90 días |
| **Brand Growth** | Inbound y **cuáles de las ofertas que ya existen se empujan**. No cambia la oferta |
| **Growth Partnership** | Todo: outbound, inbound, captura, embudo, referidos y canales grandes |

## 6 · Antes de cerrar

- [ ] El caso de referencia da 913 · 229 · 46 *(la calculadora no se tocó mal)*
- [ ] Cada tasa y cada conversión dicen su fuente o `[hipótesis]`
- [ ] Una receta principal, con su métrica
- [ ] Los reels de prueba están listados, uno por hipótesis
