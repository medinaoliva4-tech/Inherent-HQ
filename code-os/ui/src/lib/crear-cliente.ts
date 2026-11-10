import { configDesdeEntorno, type Cliente, type ConfigCliente } from './cliente'
import { crearClienteHttp } from './cliente-http'
import { crearClienteMock } from './cliente-mock'

/** `http` si hay VITE_PUENTE_URL; si no, `mock` (datos de ejemplo). */
export function crearCliente(cfg: ConfigCliente = configDesdeEntorno()): Cliente {
  return cfg.url ? crearClienteHttp(cfg) : crearClienteMock()
}
