# Medidor de cuotas

Cuenta uso por proveedor y ventana (Cline Pass 5h/semana/mes, ModelScope día UTC+8, NVIDIA/DeepSeek/frontier por día/mes), avisa al 80 % y marca `agotado` al 100 % o si el proveedor respondió 402/429 en los últimos 10 min.

- `cuotas_callback.py` — callback de LiteLLM (`litellm_settings.callbacks`): escribe una línea por llamada en `/home/deploy/gateway/cuotas/eventos.jsonl` (sin prompts ni llaves). Las llamadas sin llave no consumen cupo.
- `servidor.mjs` — servicio HTTP en `127.0.0.1:4200`: `GET /cuotas` (estado + avisos, lo que lee la interfaz), `GET /salud`, `POST /evento`. `CUOTAS_TOKEN` exige `Authorization: Bearer`. Al cruzar 80 % escribe `avisos.jsonl` y, si hay `CUOTAS_WEBHOOK`, hace POST.
- `limites.json` (opcional, junto al servicio): fija topes sin tocar código, p. ej. `{"deepseek":{"ventanas":{"dia":{"usd":5},"mes":{"usd":50}}}}`. Hoy solo ModelScope tiene tope (2,000/día); los demás están en `null` hasta que el CEO los defina o el medidor los calibre.
- `cuotas.service` — unidad systemd lista para instalar (no instalada).

Prueba: `node --test code-os/cuotas/test/`. Probado de punta a punta en un LiteLLM temporal: llamadas reales → `eventos.jsonl` → `/cuotas`.
