#!/usr/bin/env python3
"""Puente local de Laya para Inherent OS.

Laya corre en tu compu (no en Vercel). Este puente carga ``laya.Router`` una sola vez y le deja a la
web del OS pedirle juicios desde el navegador:

    GET  /health   -> {"status": "ok", "listo": bool, ...}
    POST /juzgar   -> {"texto": str, "questions": {...}} -> el resultado de Laya (answers, routing, usage)

Seguridad:
  * escucha solo en 127.0.0.1;
  * CORS solo para el dominio del OS (LAYA_PUENTE_ORIGENES o --origenes; por defecto
    https://inherent-work.vercel.app y http://localhost:* / http://127.0.0.1:*);
  * responde el preflight de Private Network Access (Access-Control-Allow-Private-Network: true);
  * rechaza otro Host (DNS rebinding), otro Origin y cuerpos que no sean JSON.

Uso:  pip install "laya[serve]"   y luego   python puente.py
"""
import argparse
import json
import os
import re
import sys
import threading
import time
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = "127.0.0.1"
PUERTO = 7357
ORIGENES = "https://inherent-work.vercel.app,http://localhost:*,http://127.0.0.1:*"
MODELO = "multilingual"  # el checkpoint que lee español (~644 MB la primera vez)
MAX_CUERPO = 256 * 1024
MAX_TEXTO = 20000
MAX_PREGUNTAS = 16
VERSION = "1"


def patrones(texto):
    """'https://a.com,http://localhost:*' -> regex por origen; ':*' acepta cualquier puerto (o ninguno)."""
    out = []
    for o in [x.strip().rstrip("/") for x in str(texto or "").split(",") if x.strip()]:
        if o.endswith(":*"):
            out.append(re.compile("^" + re.escape(o[:-2]) + r"(:\d{1,5})?$"))
        else:
            out.append(re.compile("^" + re.escape(o) + "$"))
    return out


class Laya:
    """El Router de Laya, cargado una vez. El primer juicio espera a que termine de cargar."""

    def __init__(self, modelo):
        self.modelo = modelo
        self.router = None
        self.listo = threading.Event()
        self.error = None
        self.cargando = False
        self.lock = threading.Lock()  # una inferencia a la vez
        self.version = None

    def cargar(self):
        self.cargando = True
        t = time.time()
        try:
            import laya
            from laya import Router
            self.version = getattr(laya, "__version__", None)
            self.router = Router(max_loaded=1)
            # Un juicio de calentamiento: baja el checkpoint (la primera vez) y lo deja en memoria.
            self.router.predict("Hola", {"x": {"type": "noul", "instructions": "¿Es un saludo?"}}, model=self.modelo)
            print(f"[puente] Laya {self.version} lista con «{self.modelo}» en {time.time() - t:.1f} s", flush=True)
        except Exception as e:  # noqa: BLE001
            self.error = f"{type(e).__name__}: {e}"
            traceback.print_exc()
            print("[puente] Laya no cargó. ¿Instalaste laya?  pip install \"laya[serve]\"", file=sys.stderr, flush=True)
        finally:
            self.cargando = False
            self.listo.set()

    def juzgar(self, texto, questions, modelo=None):
        if not self.listo.wait(timeout=900):
            raise RuntimeError("Laya sigue cargando el modelo")
        if self.error or self.router is None:
            raise RuntimeError("Laya no cargó: " + str(self.error))
        with self.lock:
            return self.router.predict(texto, questions, model=modelo or self.modelo)


def validar(cuerpo):
    if not isinstance(cuerpo, dict):
        raise ValueError("el cuerpo debe ser un objeto JSON")
    texto = cuerpo.get("texto", cuerpo.get("state"))
    if isinstance(texto, dict):
        texto = texto.get("texto") or json.dumps(texto, ensure_ascii=False)
    if not isinstance(texto, str) or not texto.strip():
        raise ValueError("falta «texto»")
    if len(texto) > MAX_TEXTO:
        raise ValueError(f"el texto pasa de {MAX_TEXTO} caracteres")
    q = cuerpo.get("questions")
    if not isinstance(q, dict) or not q:
        raise ValueError("falta «questions»")
    if len(q) > MAX_PREGUNTAS:
        raise ValueError(f"máximo {MAX_PREGUNTAS} preguntas")
    for k, v in q.items():
        if not isinstance(v, dict) or v.get("type") not in ("choice", "score", "noul"):
            raise ValueError(f"la pregunta «{k}» no es choice, score ni noul")
        if not isinstance(v.get("instructions"), str) or not v["instructions"].strip():
            raise ValueError(f"la pregunta «{k}» no trae instructions")
    modelo = cuerpo.get("model")
    if modelo is not None and (not isinstance(modelo, str) or not re.match(r"^[\w.-]{1,40}$", modelo)):
        raise ValueError("model inválido")
    return texto, q, modelo


def servidor(laya_, origenes, puerto):
    hosts = {f"127.0.0.1:{puerto}", f"localhost:{puerto}"}

    class H(BaseHTTPRequestHandler):
        server_version = "laya-puente/" + VERSION
        protocol_version = "HTTP/1.1"

        def log_message(self, fmt, *args):  # sin ruido: solo errores
            pass

        def origen(self):
            """None = sin Origin (curl, scripts locales); False = no permitido; str = el origen permitido."""
            o = self.headers.get("Origin")
            if not o:
                return None
            return o if any(p.match(o) for p in origenes) else False

        def responder(self, code, obj=None, extra=None):
            datos = b"" if obj is None else json.dumps(obj, ensure_ascii=False, default=str).encode("utf-8")
            self.send_response(code)
            o = self.origen()
            if o:
                self.send_header("Access-Control-Allow-Origin", o)
                self.send_header("Vary", "Origin")
            for k, v in (extra or {}).items():
                self.send_header(k, v)
            if obj is not None:
                self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(datos)))
            self.end_headers()
            if datos:
                self.wfile.write(datos)

        def filtro(self):
            if self.headers.get("Host", "") not in hosts:
                self.responder(403, {"error": "Host no permitido"})
                return False
            if self.origen() is False:
                self.responder(403, {"error": "Origen no permitido. Agrégalo con LAYA_PUENTE_ORIGENES."})
                return False
            return True

        def do_OPTIONS(self):  # noqa: N802 — el preflight de CORS y de Private Network Access
            if not self.filtro():
                return
            extra = {"Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type",
                     "Access-Control-Max-Age": "600"}
            if self.headers.get("Access-Control-Request-Private-Network", "").lower() == "true":
                extra["Access-Control-Allow-Private-Network"] = "true"
            self.responder(204, None, extra)

        def do_GET(self):  # noqa: N802
            if not self.filtro():
                return
            if self.path.split("?")[0] != "/health":
                return self.responder(404, {"error": "No existe. Usa /health o /juzgar"})
            self.responder(200, {"status": "ok", "puente": VERSION, "listo": laya_.listo.is_set() and not laya_.error,
                                 "cargando": laya_.cargando, "error": laya_.error, "modelo": laya_.modelo, "laya": laya_.version})

        def do_POST(self):  # noqa: N802
            if not self.filtro():
                return
            if self.path.split("?")[0] != "/juzgar":
                return self.responder(404, {"error": "No existe. Usa /juzgar"})
            if "application/json" not in self.headers.get("Content-Type", ""):
                return self.responder(415, {"error": "Manda JSON (Content-Type: application/json)"})
            try:
                n = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                n = -1
            if n <= 0 or n > MAX_CUERPO:
                return self.responder(413, {"error": f"El cuerpo debe pesar entre 1 byte y {MAX_CUERPO // 1024} KB"})
            try:
                texto, questions, modelo = validar(json.loads(self.rfile.read(n).decode("utf-8")))
            except (ValueError, UnicodeDecodeError) as e:
                return self.responder(400, {"error": str(e)})
            t = time.time()
            try:
                r = laya_.juzgar(texto, questions, modelo)
            except ValueError as e:  # preguntas mal armadas: Laya dice cuál
                return self.responder(422, {"error": str(e)})
            except Exception as e:  # noqa: BLE001
                traceback.print_exc()
                return self.responder(503 if "cargando" in str(e) or "no cargó" in str(e) else 500, {"error": str(e) if "Laya" in str(e) else "Laya falló"})
            out = dict(r) if isinstance(r, dict) else {"answers": r}
            out["engine"] = "laya-local"
            out["ms"] = round((time.time() - t) * 1000)
            self.responder(200, out)

    class Servidor(ThreadingHTTPServer):
        daemon_threads = True

        def handle_error(self, request, client_address):  # un navegador que corta la conexión no es un error
            if isinstance(sys.exc_info()[1], ConnectionError):
                return
            super().handle_error(request, client_address)

    return Servidor((HOST, puerto), H)


def main():
    ap = argparse.ArgumentParser(description="Puente local de Laya para Inherent OS (escucha solo en 127.0.0.1).")
    ap.add_argument("--puerto", type=int, default=int(os.environ.get("LAYA_PUENTE_PUERTO", PUERTO)))
    ap.add_argument("--origenes", default=os.environ.get("LAYA_PUENTE_ORIGENES", ORIGENES),
                    help="orígenes permitidos, separados por coma; ':*' = cualquier puerto")
    ap.add_argument("--modelo", default=os.environ.get("LAYA_PUENTE_MODELO", MODELO))
    a = ap.parse_args()
    if a.puerto != PUERTO:
        print(f"[puente] Ojo: el OS busca el puente en el puerto {PUERTO}.", file=sys.stderr)
    laya_ = Laya(a.modelo)
    srv = servidor(laya_, patrones(a.origenes), a.puerto)
    threading.Thread(target=laya_.cargar, daemon=True).start()
    print(f"[puente] Escuchando en http://{HOST}:{a.puerto} · orígenes: {a.origenes}", flush=True)
    print("[puente] Cargando Laya (la primera vez baja el modelo, ~644 MB)…", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n[puente] Apagado.")


if __name__ == "__main__":
    main()
