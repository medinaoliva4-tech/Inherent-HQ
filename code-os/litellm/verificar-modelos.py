#!/usr/bin/env python3
"""Verifica por llamada real cada alias: latencia, contexto y tool calling por /v1/messages.
Uso (en el servidor): set -a; . .env; set +a; python3 verificar-modelos.py [puerto] [alias...]
Lee LITELLM_MASTER_KEY del entorno; nunca imprime llaves. Salida: JSON por línea."""
import json, os, sys, time, urllib.request, urllib.error

PORT = sys.argv[1] if len(sys.argv) > 1 else "4100"
ALIAS = sys.argv[2:]
BASE = f"http://127.0.0.1:{PORT}"
KEY = os.environ["LITELLM_MASTER_KEY"]

def post(path, body, timeout=120):
    req = urllib.request.Request(BASE + path, json.dumps(body).encode(), {
        "content-type": "application/json", "authorization": f"Bearer {KEY}",
        "x-api-key": KEY, "anthropic-version": "2023-06-01"})
    t = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read()), time.time() - t
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.read()[:300].decode("utf8", "replace")}, time.time() - t
    except Exception as e:
        return 0, {"error": f"{type(e).__name__}: {e}"[:300]}, time.time() - t

def texto(resp):
    if "choices" in resp:
        return (resp["choices"][0]["message"].get("content") or "")
    return "".join(b.get("text", "") for b in resp.get("content", []) if b.get("type") == "text")

def prueba(alias):
    out = {"alias": alias}
    # 1) velocidad: respuesta corta
    st, r, dt = post("/v1/chat/completions", {"model": alias, "max_tokens": 800,
        "messages": [{"role": "user", "content": "Responde solo con la palabra: listo"}]}, 90)
    out["chat"] = {"status": st, "seg": round(dt, 1), "ok": st == 200 and "listo" in texto(r).lower()}
    if st != 200: out["chat"]["error"] = r.get("error")
    # 2) tool calling por /v1/messages
    tools = [{"name": "sumar", "description": "Suma dos números", "input_schema": {
        "type": "object", "properties": {"a": {"type": "number"}, "b": {"type": "number"}}, "required": ["a", "b"]}}]
    st, r, dt = post("/v1/messages", {"model": alias, "max_tokens": 1000, "tools": tools,
        "messages": [{"role": "user", "content": "Usa la herramienta sumar con a=17 y b=25."}]}, 90)
    usos = [b for b in r.get("content", []) if isinstance(b, dict) and b.get("type") == "tool_use"] if st == 200 else []
    out["tools"] = {"status": st, "seg": round(dt, 1), "ok": bool(usos) and usos[0].get("input", {}).get("a") == 17}
    if st != 200: out["tools"]["error"] = r.get("error")
    # 3) contexto: aguja en ~N tokens
    for n in (8000, 28000, 60000):
        relleno = ("El cielo de la tarde era azul y la ciudad seguía en calma. " * (n // 14))
        prompt = relleno + "\nDato clave: el código secreto es AZUL-731.\n" + relleno + "\n¿Cuál es el código secreto? Responde solo el código."
        st, r, dt = post("/v1/chat/completions", {"model": alias, "max_tokens": 2000, "messages": [{"role": "user", "content": prompt}]}, 150)
        ok = st == 200 and "731" in texto(r)
        out.setdefault("contexto", []).append({"tokens_aprox": n, "status": st, "seg": round(dt, 1), "ok": ok,
                                               **({"error": r.get("error")} if st != 200 else {})})
        if not ok: break
    return out

for a in ALIAS:
    print(json.dumps(prueba(a), ensure_ascii=False), flush=True)
