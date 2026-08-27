---
name: growth-money-model-pricing
description: Calcula y protege la economia de adquisicion (LTGP:CAC) y disena la secuencia de ofertas (atraccion, upsell, downsell, continuidad) para que la adquisicion de clientes se autofinancie. USA ESTE SKILL SIEMPRE que se hable de pricing, presupuesto de ads, CAC, margen, rentabilidad de un canal, o antes de aprobar cualquier gasto de adquisicion. Es un skill de control obligatorio: si LTGP:CAC no esta calculado, senalarlo como bloqueante antes de aprobar campanas o pricing nuevo.
---

# Money Model & Pricing (Economia de Adquisicion)

## Cuando se activa
- Definir o auditar pricing.
- Aprobar presupuesto de ads/adquisicion.
- Cualquier decision que involucre gastar para conseguir clientes.

## Formula nuclear (obligatoria)
LTGP (Lifetime Gross Profit) = (Ingreso promedio por cliente en su vida x Margen bruto %) - costo de entrega total
CAC (Costo de Adquisicion) = Gasto total de ventas + marketing / numero de clientes nuevos
Ratio objetivo: LTGP:CAC >= 3:1 como minimo saludable.

## Proceso obligatorio

### Paso 1 - Calcular LTGP
Pedir/estimar: ticket promedio, margen bruto %, duracion promedio del cliente (retencion), costo de entrega/fulfillment.

### Paso 2 - Calcular CAC actual o proyectado
Pedir/estimar: gasto total en marketing+ventas / clientes nuevos en el mismo periodo.

### Paso 3 - Diagnostico del ratio
- Si LTGP:CAC < 3:1 -> el problema NO es "necesitamos mas leads", es oferta/precio/margen/retencion. Redirigir a growth-oferta-grand-slam o growth-retencion-referidos antes de aprobar mas gasto.
- Si LTGP:CAC esta muy por encima (ej. >8-10:1) -> senal de que se esta subinvirtiendo en adquisicion; hay espacio para escalar gasto.

### Paso 4 - Diseno de secuencia de oferta (money model)
Definir, si aplica:
- Oferta de atraccion (entrada, bajo riesgo, puede ser a costo/perdida controlada)
- Upsell (aumenta el ticket inmediato)
- Downsell (recupera al que dice que no, version mas accesible)
- Continuidad (ingreso recurrente que estabiliza flujo de caja)
Objetivo: recuperar el CAC lo mas rapido posible con la ganancia bruta temprana (Client-Financed Acquisition) para que la adquisicion se autofinancie.

## Output obligatorio
```
LTGP estimado: [numero + supuestos usados]
CAC actual/estimado: [numero + fuente del gasto]
Ratio LTGP:CAC:
Diagnostico (verde/amarillo/rojo):
Secuencia de oferta recomendada (atraccion/upsell/downsell/continuidad):
Decision: aprobar gasto / bloquear y corregir oferta / escalar gasto
```

## QA antes de entregar
- [ ] El ratio esta calculado con numeros reales o supuestos explicitos, no inventado?
- [ ] Si el ratio es rojo (<3:1), NO se recomienda aumentar gasto en leads sin antes corregir oferta/margen?
- [ ] La recomendacion final es una decision clara (aprobar/bloquear/escalar), no ambigua?

## Handoff
Este skill es el filtro de control antes de growth-media-buying (aprobacion de presupuesto) y retroalimenta a growth-oferta-grand-slam si el ratio esta en rojo.
