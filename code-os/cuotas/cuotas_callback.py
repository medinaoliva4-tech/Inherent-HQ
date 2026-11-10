"""Callback de LiteLLM: escribe una línea JSON por llamada (éxito o fallo) en eventos.jsonl.
Se activa con litellm_settings.callbacks: cuotas_callback.cuotas_handler
No guarda prompts ni llaves: solo proveedor, modelo, tokens, costo, estado HTTP y duración."""
import json, os, time
try:
    from litellm.integrations.custom_logger import CustomLogger
except ImportError:  # permite probar piso_max_tokens fuera del servidor
    class CustomLogger: pass

RUTA = os.environ.get("CUOTAS_EVENTOS", "/home/deploy/gateway/cuotas/eventos.jsonl")


def _escribir(ev):
    try:
        os.makedirs(os.path.dirname(RUTA), exist_ok=True)
        with open(RUTA, "a") as f:
            f.write(json.dumps(ev) + "\n")
    except Exception:
        pass  # medir nunca debe romper una llamada


def _base(kwargs):
    lp = kwargs.get("litellm_params", {}) or {}
    prov = lp.get("custom_llm_provider") or ""
    return {"ts": time.time() * 1000,
            "modelo": f"{prov}/{kwargs.get('model')}",  # modelo real del proveedor, no el alias
            "api_base": lp.get("api_base") or ""}


# Cline Pass da 500 "empty response content" si max_tokens no alcanza para razonar + responder.
PISOS = {"nivel-alto": 2000, "cp-kimi-k3.1-pro": 2000}
PISO_DEFECTO = 1000


def piso_max_tokens(modelo, valor):
    """Sube max_tokens al piso del modelo; si el cliente no lo manda, no se toca."""
    if valor is None or not isinstance(modelo, str):
        return valor
    if modelo.startswith(("nivel-", "cp-", "nv-")):
        return max(valor, PISOS.get(modelo, PISO_DEFECTO))
    return valor


class CuotasHandler(CustomLogger):
    async def async_pre_call_hook(self, user_api_key_dict, cache, data, call_type):
        try:
            for k in ("max_tokens", "max_completion_tokens"):
                if k in data:
                    data[k] = piso_max_tokens(data.get("model"), data[k])
        except Exception:
            pass  # nunca romper una llamada por esto
        return data

    async def async_log_success_event(self, kwargs, response_obj, start_time, end_time):
        u = getattr(response_obj, "usage", None)
        ev = _base(kwargs)
        ev.update({"http": 200, "tokens_in": getattr(u, "prompt_tokens", 0) or 0,
                   "tokens_out": getattr(u, "completion_tokens", 0) or 0,
                   "costo_usd": kwargs.get("response_cost") or 0,
                   "duracion_ms": int((end_time - start_time).total_seconds() * 1000)})
        _escribir(ev)

    async def async_log_failure_event(self, kwargs, response_obj, start_time, end_time):
        exc = kwargs.get("exception")
        code = getattr(exc, "status_code", None) or (408 if "imeout" in type(exc).__name__ else 0)
        ev = _base(kwargs)
        ev.update({"http": code, "error": type(exc).__name__,
                   "duracion_ms": int((end_time - start_time).total_seconds() * 1000)})
        if "missing credentials" in str(exc).lower():
            ev["error_tipo"] = "sin_llave"  # placeholder sin llave: no consumió cupo del proveedor
        _escribir(ev)


cuotas_handler = CuotasHandler()
