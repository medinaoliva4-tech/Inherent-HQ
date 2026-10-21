#!/usr/bin/env python3
"""Puente local de Laya para Inherent OS.

Laya corre en tu compu (no en Vercel). Este puente carga ``laya.Router`` una sola vez y le deja a la
web del OS pedirle juicios desde el navegador:

    GET  /health        -> {"status": "ok", "listo": bool, "chat": {...}, ...}
    POST /juzgar        -> {"texto": str, "questions": {...}} -> el resultado de Laya (answers, routing, usage)
    GET  /chat/estado   -> con token: {"ok": true, ...}; sin token, 401. Sirve para emparejar sin gastar nada
    POST /chat          -> {"prompt": str, "resume"?: uuid, "modo"?: "estrategia"|"diseno"} -> corre Claude Code (`claude -p`) dentro de tu clon del repo y
                           devuelve la respuesta en streaming (SSE: inicio · delta · herramienta · fin · error)

Seguridad:
  * escucha solo en 127.0.0.1;
  * CORS solo para el dominio del OS (LAYA_PUENTE_ORIGENES o --origenes; por defecto
    https://inherent-work.vercel.app y http://localhost:* / http://127.0.0.1:*);
  * responde el preflight de Private Network Access (Access-Control-Allow-Private-Network: true);
  * rechaza otro Host (DNS rebinding), otro Origin y cuerpos que no sean JSON.

El chat de Estrategia (/chat) ejecuta Claude Code en tu compu, con TU sesión de Claude (no gasta API de Inherent), así que
es lo más delicado y va con candados extra:
  * emparejamiento con token: la primera vez el puente genera uno, lo imprime y lo guarda (0600) en
    ~/.inherent/laya/chat-token; el OS te lo pide una sola vez. `puente.py --token` lo vuelve a mostrar; sin token, 401;
  * solo desde el OS: /chat exige un Origin permitido (un script sin Origin o una página de otro sitio, 403);
  * SOLO LECTURA: `claude -p --tools Read,Grep,Glob --allowedTools Read,Grep,Glob` (+ `--restricted` si tu Claude Code lo trae,
    que además encierra la lectura en el repo), `--permission-mode dontAsk`, sin servidores MCP. Nunca usa
    --dangerously-skip-permissions;
  * el chat de Diseño («modo»: "diseno") es el mismo candado de solo lectura sobre el repo, más un único servidor MCP:
    figwright (Figma), con --mcp-config y --strict-mcp-config. Las imágenes de get_screenshot se reenvían al OS (evento «imagen»);
  * corre dentro del clon del repo: la ruta va en INHERENT_REPO (variable de entorno o línea en el archivo «config»;
    el archivo se relee en cada mensaje, no hace falta reiniciar);
  * tiempo máximo por respuesta (INHERENT_CHAT_SEGUNDOS, 240 por defecto) y un solo chat a la vez.

Como servicio (lo deja así el instalador de un comando, https://inherent-work.vercel.app/laya/instalar.sh):
  * carga el modelo al arrancar, para que el primer juicio sea rápido;
  * LAYA_PUENTE_LOG=<carpeta> guarda el log en <carpeta>/puente.log con rotación (1 MB × 3), sin crecer sin límite;
  * LAYA_PUENTE_PUERTO cambia el puerto (el OS lo busca en 7357);
  * --precargar baja el modelo (la primera vez) y sale: el instalador lo usa antes de dejarlo corriendo;
  * un archivo «config» junto a este (líneas CLAVE=valor: HF_HOME, LAYA_PUENTE_PUERTO, LAYA_PUENTE_LOG…) completa
    el entorno, para servicios que no pasan variables (la tarea programada de Windows). El entorno manda.

Uso:  pip install "laya[serve]"   y luego   python puente.py
"""
import argparse
import hmac
import json
import logging
import logging.handlers
import os
import re
import secrets
import shutil
import signal
import subprocess
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
VERSION = "5"
# La copia del repo que el puente maneja solo (si no le dices otra con INHERENT_REPO): se pone al día con main antes de cada chat.
REPO_URL = os.environ.get("INHERENT_REPO_URL") or "https://github.com/medinaoliva4-tech/Inherent-HQ.git"
SYNC_CADA = 60  # segundos mínimos entre dos puestas al día
LOG_MAX = 1_000_000  # bytes por archivo de log
LOG_COPIAS = 3

# --- el chat de Estrategia ---
MAX_PROMPT = 60000
CHAT_SEGUNDOS = 240  # tiempo máximo por respuesta
HERRAMIENTAS = ("Read", "Grep", "Glob")  # lo único que puede usar el chat: leer
BLOQUEADAS = ("Bash", "Edit", "Write", "MultiEdit", "NotebookEdit", "WebFetch", "WebSearch", "Task")
# --- el chat de Diseño: el repo sigue en solo lectura; lo único que se suma es Figma (figwright), para diseñar ---
DISENO_SEGUNDOS = 600  # diseñar en Figma tarda más que responder
DISENO_MCP = {"mcpServers": {"figwright": {"command": "npx", "args": ["-y", "@figwright/mcp@latest"]}}}
DISENO_PERMITIDAS = ("Read", "Grep", "Glob", "mcp__figwright")  # leer el repo y usar Figma; nada más
MAX_IMAGEN = 8 * 1024 * 1024  # bytes de base64 por imagen que se reenvía al OS
MAX_IMAGENES = 40
REGLA_DISENO = ("Chat de Diseño de Inherent OS. El repo es de solo lectura: no crees, cambies ni borres archivos y no ejecutes comandos. "
                "Diseñas en Figma con las herramientas de figwright, dentro del archivo y la página de la marca. Responde en español de «tú».")
REGLA_CHAT = ("Chat de Estrategia de Inherent OS, en solo lectura: no crees, cambies ni borres archivos y no ejecutes comandos. "
              "Lo que escribas es un borrador que revisa el CEO. Responde en español de «tú».")
UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)


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
        self.segundos = None  # cuánto tardó en cargar

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
            self.segundos = round(time.time() - t, 1)
            print(f"[puente] Laya {self.version} lista con «{self.modelo}» en {self.segundos} s", flush=True)
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


def carpeta_datos():
    """Donde viven el token y lo que no debe quedar junto al código (nunca dentro de un repo)."""
    return os.environ.get("LAYA_PUENTE_DATOS") or os.path.join(os.path.expanduser("~"), ".inherent", "laya")


def ruta_config():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "config")


def valor_de_config(clave):
    """La última línea CLAVE=valor del archivo «config» (se relee cada vez: cambiarlo no pide reiniciar)."""
    out = ""
    try:
        with open(ruta_config(), encoding="utf-8-sig") as f:
            for linea in f:
                k, sep, v = linea.strip().partition("=")
                if sep and k == clave:
                    out = v.strip().strip('"').strip("'")
    except OSError:
        pass
    return out


class Chat:
    """El chat de Estrategia: `claude -p` en solo lectura, dentro del clon del repo, con token y un solo chat a la vez."""

    def __init__(self, repo_env="", claude_env="", segundos=CHAT_SEGUNDOS, datos=None):
        self.repo_env = repo_env  # lo que mandó el entorno o --repo: gana sobre el archivo «config»
        self.claude_env = claude_env
        self.segundos = max(10, min(900, int(segundos or CHAT_SEGUNDOS)))
        self.datos = datos or carpeta_datos()
        self.ruta_token = os.path.join(self.datos, "chat-token")
        self.token, self.token_nuevo = self.cargar_token()
        self.lock = threading.Lock()  # un solo chat a la vez
        self.ayuda = None  # el texto de `claude --help`, una sola vez
        self.fallos = []  # instantes de los tokens malos (freno contra adivinar)
        self.sync = {"at": 0.0, "ok_at": None, "error": None, "commit": None}  # la copia automática del repo
        self.sync_lock = threading.Lock()

    # --- token ---
    def cargar_token(self, renovar=False):
        if not renovar:
            try:
                with open(self.ruta_token, encoding="utf-8") as f:
                    t = f.read().strip()
                if len(t) >= 24:
                    return t, False
            except OSError:
                pass
        t = secrets.token_urlsafe(32)
        os.makedirs(self.datos, exist_ok=True)
        fd = os.open(self.ruta_token, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(t + "\n")
        try:
            os.chmod(self.ruta_token, 0o600)
        except OSError:
            pass
        return t, True

    def token_ok(self, cabecera):
        """True si la cabecera Authorization es «Bearer <token>»; False si no; None si ya probaron demasiados (frena)."""
        ahora = time.time()
        self.fallos = [x for x in self.fallos if ahora - x < 60]
        if len(self.fallos) >= 8:
            return None
        m = re.match(r"^Bearer\s+(\S{8,200})$", cabecera or "")
        if m and hmac.compare_digest(m.group(1).encode(), self.token.encode()):
            return True
        self.fallos.append(ahora)
        return False

    # --- repo y claude ---
    def repo_propio(self):
        """El repo que la persona eligió (entorno, --repo o config). Vacío = el puente maneja su propia copia."""
        return self.repo_env or valor_de_config("INHERENT_REPO")

    def repo(self):
        r = self.repo_propio()
        return os.path.abspath(os.path.expanduser(r)) if r else os.path.join(self.datos, "repo")

    # --- la copia automática: se baja una vez y antes de cada chat se pone al día con main (solo lectura: nadie la edita) ---
    def sincronizar(self, forzar=False):
        if self.repo_propio():
            return True
        if not forzar and time.time() - self.sync["at"] < SYNC_CADA:
            return self.sync["error"] is None
        with self.sync_lock:
            if not forzar and time.time() - self.sync["at"] < SYNC_CADA:
                return self.sync["error"] is None
            self.sync["at"] = time.time()
            destino = self.repo()
            git = shutil.which("git") or "/usr/bin/git"
            env = dict(os.environ, GIT_TERMINAL_PROMPT="0")  # nunca se queda esperando una contraseña
            try:
                if not os.path.isdir(os.path.join(destino, ".git")):
                    if os.path.isdir(destino):
                        shutil.rmtree(destino, ignore_errors=True)
                    pasos = [[git, "clone", "--depth", "1", "--single-branch", "--branch", "main", REPO_URL, destino]]
                else:
                    pasos = [[git, "-C", destino, "fetch", "--depth", "1", "origin", "main"], [git, "-C", destino, "reset", "--hard", "-q", "FETCH_HEAD"]]
                for cmd in pasos:
                    r = subprocess.run(cmd, capture_output=True, text=True, timeout=180, env=env, stdin=subprocess.DEVNULL)
                    if r.returncode != 0:
                        raise RuntimeError((r.stderr or r.stdout or "git falló").strip()[-300:])
                c = subprocess.run([git, "-C", destino, "rev-parse", "--short", "HEAD"], capture_output=True, text=True, timeout=20)
                self.sync.update(error=None, ok_at=time.time(), commit=(c.stdout or "").strip() or None)
                return True
            except Exception as e:  # noqa: BLE001
                msg = str(e).replace(REPO_URL, "el repo")
                self.sync["error"] = msg
                return False

    def sin_github(self):
        e = (self.sync.get("error") or "").lower()
        return any(x in e for x in ("authentication", "could not read username", "terminal prompts disabled", "403", "permission denied", "repository not found"))

    def repo_valido(self, r):
        return bool(r) and os.path.isfile(os.path.join(r, "CLAUDE.md")) and os.path.isdir(os.path.join(r, "agents", "01-strategy"))

    def buscar_claude(self):
        c = self.claude_env or valor_de_config("INHERENT_CLAUDE")
        if c:
            return c if os.path.isfile(c) else None
        casa = os.path.expanduser("~")
        extra = [os.path.join(casa, ".claude", "local"), os.path.join(casa, ".local", "bin"), "/usr/local/bin", "/opt/homebrew/bin",
                 os.path.join(casa, ".npm-global", "bin"), os.path.join(os.environ.get("APPDATA", ""), "npm")]
        return shutil.which("claude", path=os.pathsep.join([os.environ.get("PATH", ""), *[x for x in extra if x]]))

    def soporta(self, claude, flag):
        if self.ayuda is None:
            try:
                r = subprocess.run([claude, "--help"], capture_output=True, text=True, timeout=20, stdin=subprocess.DEVNULL)
                self.ayuda = (r.stdout or "") + (r.stderr or "")
            except Exception:  # noqa: BLE001
                self.ayuda = ""
        return flag in self.ayuda

    def estado(self):
        """Lo que /health cuenta del chat (sin el token)."""
        r = self.repo()
        claude = self.buscar_claude()
        propio = bool(self.repo_propio())
        if not propio and self.sync["at"] == 0:
            threading.Thread(target=self.sincronizar, daemon=True).start()  # la primera vez, en segundo plano
        ok_repo = bool(r and self.repo_valido(r))
        if ok_repo:
            ayuda = None if claude else "sin_claude"
        elif propio:
            ayuda = "repo_invalido"
        else:
            ayuda = "sin_github" if self.sin_github() else "bajando_repo" if self.sync["error"] is None else "repo_error"
        return {"listo": ayuda is None, "ayuda": ayuda, "repo": ok_repo, "repo_configurado": propio, "copia": "propia" if propio else "automatica",
                "commit": self.sync["commit"], "sincronizado": self.sync["ok_at"], "error_repo": None if ok_repo else self.sync["error"],
                "claude": bool(claude), "ocupado": self.lock.locked(), "segundos": self.segundos, "modos": ["estrategia", "diseno"]}

    def mcp_diseno(self):
        """El archivo con el único servidor MCP del chat de Diseño (figwright)."""
        ruta = os.path.join(self.datos, "mcp-diseno.json")
        os.makedirs(self.datos, exist_ok=True)
        with open(ruta, "w", encoding="utf-8") as f:
            json.dump(DISENO_MCP, f)
        return ruta

    def comando(self, claude, resume, modo="estrategia"):
        cmd = [claude, "-p", "--output-format", "stream-json", "--verbose"]
        if self.soporta(claude, "--include-partial-messages"):
            cmd.append("--include-partial-messages")
        diseno = modo == "diseno"
        # Solo lectura: las herramientas disponibles son estas tres, y lo demás se niega sin preguntar.
        # En Diseño se permite además figwright (Figma); el repo sigue igual de cerrado.
        cmd += ["--tools", ",".join(HERRAMIENTAS), "--allowedTools", ",".join(DISENO_PERMITIDAS if diseno else HERRAMIENTAS),
                "--disallowedTools", ",".join(BLOQUEADAS), "--permission-mode", "dontAsk"]
        if diseno:
            cmd += ["--mcp-config", self.mcp_diseno()]
        if self.soporta(claude, "--strict-mcp-config"):
            cmd.append("--strict-mcp-config")  # solo los MCP de --mcp-config: Estrategia ninguno; Diseño, figwright
        if self.soporta(claude, "--restricted"):
            cmd.append("--restricted")  # además, la lectura queda encerrada en el repo
        elif self.soporta(claude, "--setting-sources"):
            cmd += ["--setting-sources", "user"]  # sin los hooks y permisos del proyecto
        cmd += ["--append-system-prompt", REGLA_DISENO if diseno else REGLA_CHAT]
        if resume:
            cmd += ["--resume", resume]
        return cmd

    def correr(self, prompt, resume, emitir, vivo, modo="estrategia"):
        """Corre claude y va emitiendo (evento, datos). Devuelve True si terminó bien. Mata el proceso si se acaba el tiempo o si `vivo()` es False."""
        self.sincronizar()  # lo último de main antes de leer (si falla, se lee la copia que ya hay)
        repo, claude = self.repo(), self.buscar_claude()
        env = dict(os.environ)
        env["PATH"] = os.pathsep.join([os.path.dirname(claude), "/usr/local/bin", "/opt/homebrew/bin", env.get("PATH", "")])
        kw = {"start_new_session": True} if os.name != "nt" else {"creationflags": getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)}
        proc = subprocess.Popen(self.comando(claude, resume, modo), cwd=repo, env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, **kw)
        estado = {"agotado": False, "fin": False}
        err = []
        nodos = {}  # id del tool_use de get_screenshot → los nodos que pidió (para nombrar cada imagen)
        imagenes = {"n": 0}
        segundos = max(self.segundos, DISENO_SEGUNDOS) if modo == "diseno" else self.segundos

        def matar():
            try:
                if os.name == "nt":
                    proc.kill()
                else:
                    os.killpg(proc.pid, signal.SIGKILL)
            except Exception:  # noqa: BLE001
                pass

        def tiempo():
            estado["agotado"] = True
            matar()

        reloj = threading.Timer(segundos, tiempo)
        reloj.daemon = True
        reloj.start()
        threading.Thread(target=lambda: [err.append(x.decode("utf-8", "replace")) for x in proc.stderr], daemon=True).start()
        try:
            proc.stdin.write(prompt.encode("utf-8"))  # el prompt va por stdin: sin límite de argumentos y sin que se lea como una opción
            proc.stdin.close()
        except OSError:
            pass
        try:
            for linea in proc.stdout:
                if not vivo():
                    matar()
                    return False
                try:
                    j = json.loads(linea)
                except ValueError:
                    continue
                t = j.get("type")
                if t == "system" and j.get("subtype") == "init":
                    emitir("inicio", {"sesion": j.get("session_id")})
                elif t == "stream_event":
                    d = (j.get("event") or {}).get("delta") or {}
                    if d.get("type") == "text_delta" and d.get("text"):
                        emitir("delta", {"texto": d["text"]})
                elif t == "assistant":
                    for c in (j.get("message") or {}).get("content") or []:
                        if c.get("type") == "tool_use":
                            i = c.get("input") or {}
                            det = str(i.get("file_path") or i.get("pattern") or i.get("path") or "")
                            if det.startswith(repo):
                                det = det[len(repo):].lstrip("/\\")
                            nombre = str(c.get("name") or "")
                            if nombre.startswith("mcp__figwright__"):
                                det = nombre[len("mcp__figwright__"):]
                                if det == "get_screenshot" and isinstance(i.get("nodeIds"), list):
                                    nodos[c.get("id")] = [str(x)[:40] for x in i["nodeIds"]]
                            emitir("herramienta", {"nombre": nombre.replace("mcp__figwright__", "figma:")[:40], "detalle": det[:200]})
                elif t == "user" and modo == "diseno":
                    # Lo que devuelve get_screenshot: una imagen por nodo. Se reenvía al OS para mostrar las piezas.
                    for c in (j.get("message") or {}).get("content") or []:
                        if not isinstance(c, dict) or c.get("type") != "tool_result" or c.get("tool_use_id") not in nodos:
                            continue
                        ids = nodos.pop(c.get("tool_use_id"))
                        k = 0
                        for x in c.get("content") if isinstance(c.get("content"), list) else []:
                            if not isinstance(x, dict) or x.get("type") != "image":
                                continue
                            src = x.get("source") or {}
                            datos = src.get("data") or ""
                            tipo = src.get("media_type") or "image/png"
                            if imagenes["n"] < MAX_IMAGENES and datos and len(datos) <= MAX_IMAGEN and tipo in ("image/png", "image/jpeg", "image/webp"):
                                imagenes["n"] += 1
                                emitir("imagen", {"nodo": ids[k] if k < len(ids) else None, "tipo": tipo, "datos": datos})
                            k += 1
                elif t == "result":
                    estado["fin"] = True
                    if j.get("is_error"):
                        emitir("error", {"error": str(j.get("result") or "Claude no pudo responder")[:600], "sesion": j.get("session_id")})
                    else:
                        emitir("fin", {"texto": str(j.get("result") or ""), "sesion": j.get("session_id")})
            proc.wait(timeout=10)
        except (BrokenPipeError, ConnectionError):
            matar()
            return False
        finally:
            reloj.cancel()
            if proc.poll() is None:
                matar()
        if estado["agotado"]:
            emitir("error", {"error": f"Claude tardó más de {segundos} s y se cortó. Pide algo más acotado.", "codigo": "tiempo"})
            return False
        if not estado["fin"]:
            emitir("error", {"error": (("".join(err)).strip()[-500:] or "Claude Code se cerró sin responder. Revisa que tengas la sesión iniciada (claude)."), "codigo": "claude"})
            return False
        return True


def servidor(laya_, origenes, puerto, chat=None):
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

        # ---------- el chat de Estrategia ----------
        def chat_puerta(self):
            """Las tres puertas de /chat: viene del OS (Origin permitido), con el token y con el chat encendido. True si pasa."""
            if chat is None:
                self.responder(404, {"error": "El chat está apagado en este puente"})
                return False
            if not self.origen():  # sin Origin (un script) o de otro sitio: el chat solo se abre desde el OS
                self.responder(403, {"error": "El chat solo se abre desde Inherent OS"})
                return False
            ok = chat.token_ok(self.headers.get("Authorization", ""))
            if ok is None:
                self.responder(429, {"error": "Demasiados intentos con un token malo. Espera un minuto."}, {"Retry-After": "60"})
                return False
            if not ok:
                self.responder(401, {"error": "Falta el token de emparejamiento o no es el correcto", "codigo": "token"})
                return False
            return True

        def chat_estado(self):
            if not self.chat_puerta():
                return
            self.responder(200, {"ok": True, **chat.estado()})

        def sse(self, evento, datos):
            self.wfile.write(("event: " + evento + "\ndata: " + json.dumps(datos, ensure_ascii=False) + "\n\n").encode("utf-8"))
            self.wfile.flush()

        def chat_enviar(self):
            if not self.chat_puerta():
                return
            if "application/json" not in self.headers.get("Content-Type", ""):
                return self.responder(415, {"error": "Manda JSON (Content-Type: application/json)"})
            try:
                n = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                n = -1
            if n <= 0 or n > MAX_PROMPT * 4 + 4096:
                return self.responder(413, {"error": "El cuerpo es demasiado grande o está vacío"})
            try:
                b = json.loads(self.rfile.read(n).decode("utf-8"))
            except (ValueError, UnicodeDecodeError):
                return self.responder(400, {"error": "El cuerpo no es JSON"})
            prompt = b.get("prompt") if isinstance(b, dict) else None
            resume = b.get("resume") if isinstance(b, dict) else None
            modo = b.get("modo", "estrategia") if isinstance(b, dict) else "estrategia"
            if modo not in ("estrategia", "diseno"):
                return self.responder(400, {"error": "«modo» es estrategia o diseno"})
            if not isinstance(prompt, str) or not prompt.strip():
                return self.responder(400, {"error": "Falta «prompt»"})
            if len(prompt) > MAX_PROMPT:
                return self.responder(413, {"error": f"El prompt pasa de {MAX_PROMPT} caracteres"})
            if resume is not None and not (isinstance(resume, str) and UUID.match(resume)):
                return self.responder(400, {"error": "«resume» no es un id de sesión válido"})
            st = chat.estado()
            if not st["listo"]:
                msg = {"sin_repo": "Falta INHERENT_REPO: la ruta de tu clon del repo, en el archivo config del puente.",
                       "repo_invalido": "INHERENT_REPO no apunta a un clon de Inherent-HQ (falta CLAUDE.md o agents/01-strategy).",
                       "sin_claude": "No encuentro Claude Code en tu compu (el comando claude)."}[st["ayuda"]]
                return self.responder(412, {"error": msg, "codigo": st["ayuda"]})
            if not chat.lock.acquire(blocking=False):
                return self.responder(429, {"error": "Ya hay una respuesta en curso. Espera a que termine.", "codigo": "ocupado"})
            try:
                self.send_response(200)
                o = self.origen()
                if o:
                    self.send_header("Access-Control-Allow-Origin", o)
                    self.send_header("Vary", "Origin")
                self.send_header("Content-Type", "text/event-stream; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self.send_header("X-Accel-Buffering", "no")
                self.send_header("Connection", "close")
                self.end_headers()
                self.close_connection = True
                vivo = {"v": True}

                def emitir(evento, datos):
                    try:
                        self.sse(evento, datos)
                    except (BrokenPipeError, ConnectionError, OSError):
                        vivo["v"] = False

                chat.correr(prompt, resume, emitir, lambda: vivo["v"], modo)
            except Exception as e:  # noqa: BLE001
                traceback.print_exc()
                try:
                    self.sse("error", {"error": "El chat falló: " + type(e).__name__})
                except Exception:  # noqa: BLE001
                    pass
            finally:
                chat.lock.release()

        def do_OPTIONS(self):  # noqa: N802 — el preflight de CORS y de Private Network Access
            if not self.filtro():
                return
            extra = {"Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization",
                     "Access-Control-Max-Age": "600"}
            if self.headers.get("Access-Control-Request-Private-Network", "").lower() == "true":
                extra["Access-Control-Allow-Private-Network"] = "true"
            self.responder(204, None, extra)

        def do_GET(self):  # noqa: N802
            if not self.filtro():
                return
            ruta = self.path.split("?")[0]
            if ruta == "/chat/estado":
                return self.chat_estado()
            if ruta != "/health":
                return self.responder(404, {"error": "No existe. Usa /health, /juzgar o /chat"})
            cargado = laya_.listo.is_set() and not laya_.error and laya_.router is not None
            self.responder(200, {"status": "ok", "puente": VERSION, "version": VERSION, "listo": cargado,
                                 "cargando": laya_.cargando, "error": laya_.error, "modelo": laya_.modelo,
                                 "modelo_cargado": laya_.modelo if cargado else None, "laya": laya_.version,
                                 "carga_s": laya_.segundos, "puerto": puerto, "pid": os.getpid(),
                                 "chat": chat.estado() if chat else {"listo": False, "ayuda": "apagado"}})

        def do_POST(self):  # noqa: N802
            if not self.filtro():
                return
            ruta = self.path.split("?")[0]
            if ruta == "/chat":
                return self.chat_enviar()
            if ruta != "/juzgar":
                return self.responder(404, {"error": "No existe. Usa /juzgar o /chat"})
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


class _AlLog:
    """stdout/stderr → el log con rotación (prints, tracebacks y avisos de torch), línea por línea."""

    def __init__(self, log, nivel):
        self.log, self.nivel, self.buf = log, nivel, ""

    def write(self, s):
        self.buf += str(s)
        while "\n" in self.buf:
            linea, self.buf = self.buf.split("\n", 1)
            linea = linea.rstrip("\r")
            if linea.strip():
                self.log.log(self.nivel, linea.split("\r")[-1])
        return len(s)

    def flush(self):
        pass

    def isatty(self):
        return False


def configurar_log(destino):
    """Manda todo a <destino>/puente.log, rotando a 1 MB × 3. Recorta sistema.log (la salida que guarda launchd)."""
    os.makedirs(destino, exist_ok=True)
    for nombre in os.listdir(destino):  # lo que escribe el sistema fuera de Python (launchd, nohup) no rota solo
        ruta = os.path.join(destino, nombre)
        if nombre.endswith(".log") and not nombre.startswith("puente.log") and os.path.isfile(ruta) and os.path.getsize(ruta) > 5 * LOG_MAX:
            with open(ruta, "r+b") as f:
                f.truncate(0)
    h = logging.handlers.RotatingFileHandler(os.path.join(destino, "puente.log"), maxBytes=LOG_MAX, backupCount=LOG_COPIAS, encoding="utf-8")
    h.setFormatter(logging.Formatter("%(asctime)s %(message)s", "%Y-%m-%d %H:%M:%S"))
    log = logging.getLogger("laya-puente")
    log.setLevel(logging.INFO)
    log.addHandler(h)
    log.propagate = False
    logging.raiseExceptions = False  # si el disco falla, el log no se llama a sí mismo en bucle
    sys.stdout, sys.stderr = _AlLog(log, logging.INFO), _AlLog(log, logging.ERROR)


def precargar(modelo):
    """Baja el modelo (la primera vez) y lo prueba con un juicio. Sale 0 si quedó listo."""
    laya_ = Laya(modelo)
    laya_.cargar()
    return 0 if laya_.router is not None and not laya_.error else 1


def cargar_config():
    """Lee «config» junto a este archivo (CLAVE=valor por línea) sin pisar lo que ya trae el entorno."""
    ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config")
    try:
        with open(ruta, encoding="utf-8-sig") as f:
            for linea in f:
                k, sep, v = linea.strip().partition("=")
                if sep and re.match(r"^[A-Z][A-Z0-9_]{0,60}$", k):
                    os.environ.setdefault(k, v.strip())
    except OSError:
        pass


def main():
    repo_env = os.environ.get("INHERENT_REPO", "")  # antes de leer «config»: lo que manda el entorno gana
    claude_env = os.environ.get("INHERENT_CLAUDE", "")
    cargar_config()
    ap = argparse.ArgumentParser(description="Puente local de Laya para Inherent OS (escucha solo en 127.0.0.1).")
    ap.add_argument("--puerto", type=int, default=int(os.environ.get("LAYA_PUENTE_PUERTO", PUERTO)))
    ap.add_argument("--origenes", default=os.environ.get("LAYA_PUENTE_ORIGENES", ORIGENES),
                    help="orígenes permitidos, separados por coma; ':*' = cualquier puerto")
    ap.add_argument("--modelo", default=os.environ.get("LAYA_PUENTE_MODELO", MODELO))
    ap.add_argument("--log", default=os.environ.get("LAYA_PUENTE_LOG", ""),
                    help="carpeta del log con rotación; vacío = a la consola")
    ap.add_argument("--precargar", action="store_true", help="baja el modelo, lo prueba y sale (sin servidor)")
    ap.add_argument("--repo", default=repo_env, help="ruta de tu clon de Inherent-HQ para el chat (o INHERENT_REPO en el entorno / el archivo config)")
    ap.add_argument("--token", action="store_true", help="muestra el token de emparejamiento del chat (lo crea si no existe) y sale")
    ap.add_argument("--nuevo-token", action="store_true", help="cambia el token del chat por uno nuevo, lo muestra y sale")
    ap.add_argument("--sincronizar", action="store_true", help="baja (o pone al día) la copia del repo que usa el chat, dice cómo quedó y sale")
    a = ap.parse_args()
    if a.sincronizar:
        c = Chat(a.repo, os.environ.get("INHERENT_CLAUDE", ""), os.environ.get("INHERENT_CHAT_SEGUNDOS") or CHAT_SEGUNDOS)
        if c.repo_propio():
            print(f"[puente] Usas tu propio repo ({c.repo()}): no hay copia automática que poner al día.")
            sys.exit(0)
        ok = c.sincronizar(forzar=True)
        print(f"[puente] Copia del repo al día en {c.repo()} ({c.sync['commit']})." if ok else f"[puente] No pude bajar el repo: {c.sync['error']}")
        sys.exit(0 if ok else (3 if c.sin_github() else 1))
    if a.token or a.nuevo_token:
        c = Chat(a.repo, os.environ.get("INHERENT_CLAUDE", ""), os.environ.get("INHERENT_CHAT_SEGUNDOS") or CHAT_SEGUNDOS)
        if a.nuevo_token:
            c.token, _ = c.cargar_token(renovar=True)
        print(c.token)
        sys.exit(0)
    if a.precargar:
        sys.exit(precargar(a.modelo))
    if a.log:
        configurar_log(a.log)
    if a.puerto != PUERTO:
        print(f"[puente] Ojo: el OS busca el puente en el puerto {PUERTO}.", file=sys.stderr)
    laya_ = Laya(a.modelo)
    chat = Chat(a.repo, claude_env, os.environ.get("INHERENT_CHAT_SEGUNDOS") or CHAT_SEGUNDOS)
    try:
        srv = servidor(laya_, patrones(a.origenes), a.puerto, chat)
    except OSError as e:
        print(f"[puente] No pude abrir el puerto {a.puerto} ({e}). ¿Ya hay otro puente encendido?", file=sys.stderr, flush=True)
        sys.exit(1)
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))  # launchd / systemd lo apagan con SIGTERM
    threading.Thread(target=laya_.cargar, daemon=True).start()
    print(f"[puente] Escuchando en http://{HOST}:{a.puerto} · orígenes: {a.origenes}", flush=True)
    if chat.token_nuevo:
        print(f"[puente] Chat de Estrategia · token de emparejamiento (pégalo una sola vez en Inherent OS): {chat.token}", flush=True)
        print(f"[puente] Queda guardado en {chat.ruta_token}. Para verlo otra vez: python puente.py --token", flush=True)
    chat.sincronizar(forzar=True)
    st = chat.estado()
    print("[puente] Chat de Estrategia: " + ("listo." if st["listo"] else {"sin_github": "no pude bajar el repo: inicia sesión en GitHub una vez (gh auth login).", "bajando_repo": "bajando la copia del repo…", "repo_error": "no pude bajar el repo: " + str(st.get("error_repo")), "repo_invalido": "INHERENT_REPO no apunta a un clon de Inherent-HQ.", "sin_claude": "no encuentro Claude Code (el comando claude)."}.get(st["ayuda"], st["ayuda"])), flush=True)
    print("[puente] Cargando Laya (la primera vez baja el modelo, ~644 MB)…", flush=True)
    try:
        srv.serve_forever()
    except (KeyboardInterrupt, SystemExit):
        print("[puente] Apagado.", flush=True)


if __name__ == "__main__":
    main()
