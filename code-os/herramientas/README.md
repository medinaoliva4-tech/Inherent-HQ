# Herramientas · Code OS

El backend de las herramientas del diseño de departamentos (`code-os/docs/diseno-departamentos.md`): la **memoria viva del cliente**, el **ICP** y las **calculadoras de adquisición**. Librería TypeScript sin dependencias; el puente la expone por HTTP.

```bash
cd code-os/herramientas && npm i && npm test      # pruebas
npm run typecheck
npm run grafo -- <carpeta-del-almacén> [cliente] [salida]   # graph.json para graphify + hilo.md
```

| Archivo | Qué hace |
|---|---|
| `src/memoria.ts` | Nodos con versión e historial, dependientes recursivos por `viene_de`, avisos al cambiar, aprobar solo tras leer |
| `src/almacen.ts` | Interfaz `Almacen` + `AlmacenJson` (un JSON por cliente, modo 600, escritura atómica) + `AlmacenMemoria` |
| `src/icp.ts` | Esquema y validación del ICP (§6) con alertas de la regla guía |
| `src/outbound.ts` | Menor n con P(Bin(n, c) ≥ m) ≥ P, en log-probabilidades y búsqueda binaria |
| `src/inbound.ts` | Embudo inverso, presupuesto, reels de prueba y autocalibración |
| `src/zernio.ts` | Adaptador del JSON de analytics de Zernio (no llama a Zernio) |
| `src/grafo.ts` | Exporta a `graph.json` de graphify y a Markdown |
| `src/api.ts` | Router sin framework que usa el puente |

**API exacta:** `code-os/docs/herramientas-api.md`. En el servidor, los datos quedan en `<PUENTE_DATA_DIR>/herramientas/<cliente>.json`.

El puente compila esta carpeta antes de compilar o probarse (`npm run herramientas` en `code-os/puente`), así que **esta carpeta tiene que llegar al servidor junto con `puente`**.
