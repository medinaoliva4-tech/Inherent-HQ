import type { Icp } from '../src/icp.js';

export const ICP_COMPLETO: Icp = {
  moneda: 'USD',
  facturacion_mensual: { min: 30_000, max: 120_000 },
  ticket_promedio: 45,
  frecuencia_ventas: { ventas: 900, periodo: 'mes' },
  demanda: 'alta',
  ciclo_comercial: { dias: 7 },
  margen: 0.35,
  capacidad: 'Cocina para 300 órdenes diarias; pueden crecer 30 % sin contratar',
  decisor: 'Dueño-fundador',
  industrias: ['restaurantes casuales'],
  perfiles: ['2–5 sucursales'],
  geografia: ['Ciudad de Guatemala'],
  canales: ['Instagram', 'WhatsApp'],
  regla_guia: { multiplo: 10, precio_producto: 2400, texto: 'El cliente factura ~10× el precio del producto' },
};
