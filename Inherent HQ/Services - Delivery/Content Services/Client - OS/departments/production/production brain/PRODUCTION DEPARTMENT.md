# Guía de uso: Skills de Content y Production

## MODO DE EJECUCIÓN Y ENTREGABLES

Production trabaja en modo híbrido. No repite `contenido-research.md`: recibe las ideas y referencias aprobadas de Creative.

### 1. Human + Cowork — viabilidad

Revisar cada idea de video/fotografía contra realidad, locación, talento, presupuesto, tiempo, producto y guidelines. Output: `validación-de-viabilidad.md`. Solo ideas viables pasan a preproducción.

### 2. Agente — preproducción y control

- `preproducción-shot-list.xlsx`: el agente convierte ideas viables en tomas, IDs, referencias, acción, cámara, audio, props y criterio de aprobación.
- `production.html`: checklist visual interactivo para el día de producción con una tarjeta y referencia por toma.
- `post-production-list.md`: correcciones, selección, assets faltantes, gráficos, transiciones, retoques y responsables.
- `adobe-edit-plan.md`: plan aprobado antes de ejecutar Premiere/After Effects.

### 3. Human + Cowork — fotografía y finales

El humano crea/revisa fotografía con Cowork y la skill/integración de Higgsfield correspondiente, aprueba cada final y registra `final-assets-manifest.md`. Los assets finales aprobados se guardan en Drive y se indexan en **Jockey Knowledge Store**.

### 4. Agente — Adobe

Con plan, clips y assets aprobados, el Production Agent ejecuta el flujo documentado de Premiere/After Effects mediante Higgsfield Bridge. No abre Adobe antes de aprobar `adobe-edit-plan.md`.

### Gates

Viabilidad humana → shot list aprobado → captura aprobada → post-production list → assets aprobados → Adobe plan aprobado → final aprobado.

Esta guía es para el CEO / Inherente HQ. Explica cómo instalar, activar y forzar estos dos skills en el día a día, no cómo funcionan por dentro (eso ya está documentado en cada `SKILL.md`).

---

## 1. Cómo se instalan

**En Claude.ai / Cowork:** sube el archivo `SKILL.md` (o el `.skill` empaquetado) al proyecto correspondiente. Verás un botón **"Save skill"** — al hacer clic, queda disponible para ese proyecto/organización. No hace falta reescribir nada.

**En el repositorio (fuente de verdad):** haz commit del `SKILL.md` en la ruta de arriba. Esto es lo que garantiza que cualquier agente o Cowork que trabaje sobre ese departamento en el futuro lo tenga disponible, incluso si nadie lo "activó" manualmente en una sesión de chat.

---

## 2. Cómo se activan (dos formas)

### A. Automática (la forma correcta a largo plazo)
Claude decide invocar un skill según su `description`. Ambos están escritos con lenguaje "pushy" a propósito — deberían dispararse solos cuando alguien pida un Reel/guion/idea de contenido, o cuando suba una foto de producto pidiendo que se vea premium.

No confíes solo en esto al inicio. La activación automática puede fallar si el prompt es ambiguo.

### B. Forzada por regla del departamento (la que garantiza el gate)
Agrega esta línea literal en el `README.md` de cada departamento:

```
ANTES de generar cualquier concepto de video, guion o shot list:
→ invocar skill: content-preproduccion-concepto (bloqueante, no opcional)
```

```
ANTES de marcar cualquier foto retocada como lista para publicar/entregar:
→ invocar skill: production-retoque-etico (bloqueante, no opcional)
```

Esto convierte el skill en un **gate**, no en una sugerencia. Cualquier agente, Cowork o instancia de Chat que lea el README del departamento antes de trabajar debe pasar por ahí primero.

### C. Manual (si dudas de que se activó)
Simplemente pídelo por nombre:

> "Corre el skill content-preproduccion-concepto sobre esta idea de Reel."

> "Corre production-retoque-etico sobre esta foto vs. esta referencia."

---

## 3. Prompts de ejemplo (para probarlos)

**Content:**
- "Necesito un Reel de cómo el itamae prepara un roll para Akai."
- "Dame 3 ideas de TikTok para el pilar de frescura e ingredientes."

**Production:**
- "Aquí está la foto del roll de Akai y esta es la referencia que quiero igualar — súbelo a nivel premium."
- "¿Esta foto ya está lista para publicar?"

Si el skill correcto no se dispara solo con estos prompts, es señal de que hay que ajustar la `description` (optimización de triggering) antes de confiar en la activación automática.

---

## 4. Qué esperar como resultado

Ambos terminan siempre en un veredicto explícito — nunca ambiguo:

- `content-preproduccion-concepto` → **APROBADO PARA PRODUCCIÓN** o **BLOQUEADO** (con el punto exacto del checklist que falló).
- `production-retoque-etico` → **APROBADO PARA ENTREGA** o **BLOQUEADO** (con la razón del test ético).

Si el resultado no trae ese veredicto explícito, el skill no corrió completo — pide que lo repita.

---

## 5. Qué necesitan del Client-OS para funcionar bien

| Skill | Necesita en el Client-OS | Si falta |
|---|---|---|
| content-preproduccion-concepto | `positioning.md`, `content-pillars.md` | Avisa y marca el concepto como "sin positioning validado" — no lo bloquea del todo, pero lo señala |
| production-retoque-etico | `brand-guidelines.md` (opcional, para coherencia de grade) | Sigue funcionando, solo pierde ese chequeo de coherencia |

Si un Client-OS todavía no tiene `positioning.md`, corre primero `brand-positioning-cbbe` — es el bloqueante real detrás de ambos.

---

## 6. Cuándo NO usarlos

- Posts estáticos de puro texto sin componente narrativo → no uses `content-preproduccion-concepto`.
- Generación de imagen desde cero (no partir de una foto real) → no es retoque, `production-retoque-etico` debe detenerse y decirlo — no tratar de forzarlo.
