---
name: client-delivery
description: >
  Skill COMPARTIDA de entrega — la usan todos los agentes, con el mismo formato. Arma los dos
  entregables con los que cierra cualquier agente: el documento listo para mandarle al cliente, y el
  folder del cliente con toda la data expandida para que los demás agentes trabajen. Úsala al cerrar
  el trabajo de un cliente, o cuando pidan el documento de entrega o el handoff a otro departamento.
  En Strategy es el paso 10 del workflow.
---

# Entrega — skill compartida

La usan **todos los agentes**, con el mismo formato. Dos cosas: una para el cliente, otra para
adentro. **No son el mismo documento.**

> Las secciones de abajo son las de **Strategy**. Cada agente ajusta el contenido de
> `ESTRATEGIA.md` a lo suyo (`CREATIVE.md`, `BRANDING.md`, …) — la estructura de las dos entregas
> y las reglas no cambian.

---

## 1 · `clients/<cliente>/ESTRATEGIA.md` — para el cliente

Lo que se manda. Resume todo, **sin ruido interno**: sin marcas de confianza, sin pendientes,
sin notas de método.

| Sección | Qué lleva |
|---|---|
| **Dónde está la marca hoy** | El diagnóstico, en una página |
| **A dónde vamos** | El objetivo del ciclo, con plazo y métrica |
| **Dónde competimos y contra qué** | Categoría, enemigo, territorio |
| **Qué nos hace distintos** | Mecanismo único, promesa y las pruebas que la sostienen |
| **Qué NO vamos a hacer** | Las renuncias, explícitas |
| **Cómo se monetiza** | Oferta, precio, recorrido de compra |
| **Qué vamos a hacer** | El movimiento, la campaña, el sistema de contenido |
| **Dónde y cada cuánto** | Canales y calendario macro |
| **Cómo sabremos si funcionó** | Las métricas |

**Reglas:** en el lenguaje del cliente, no en jerga de método · toda afirmación con su razón ·
lo que falta se dice, no se disimula.

---

## 2 · `clients/<cliente>/` — para los demás agentes

```
clients/<cliente>/
├── ESTRATEGIA.md   ← el de arriba
├── LINKS.md        ← todo lo que vive afuera
└── data/           ← lo que se investigó, expandido
```

### `LINKS.md`
Lo externo **no se copia, se linkea**: Drive de fotos, Drive de videos, Drive de entregables,
Figma, Notion, redes del cliente, analytics. Con una línea de qué hay en cada uno.

### `data/`
Todo lo crudo y expandido, que en `ESTRATEGIA.md` está resumido:
- Lo que entregó el cliente
- La evidencia de la ingeniería inversa, con sus marcas 🟢/🟡/⚪ y su fecha
- Las 3 Verdades completas, incluido lo que se descartó y por qué
- Los movimientos candidatos que **no** se eligieron
- Los huecos abiertos `⚠️ SIN DATOS`

> Acá **sí** va todo el aparato de método. Es el material de trabajo de los otros agentes.

---

## 3 · El handoff

Al cerrar, decir en una línea por destino qué le toca a cada uno:

```
Creative   → posicionamiento, campaña y qué tipo de pieza hace falta
Growth     → oferta, precio y objetivo
Branding   → territorio, tono y activos distintivos
Content    → calendario macro
```

---

## 4 · Antes de entregar
- [ ] `ESTRATEGIA.md` se entiende **sin haber leído el método**
- [ ] Las renuncias están escritas, no implícitas
- [ ] Lo externo está en `LINKS.md`, no copiado
- [ ] Los huecos abiertos están nombrados, no disimulados
- [ ] **Allan aprobó.** El agente propone, no cierra
