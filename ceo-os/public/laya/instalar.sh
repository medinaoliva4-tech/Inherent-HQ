#!/usr/bin/env bash
# Laya para Inherent OS · instalador de un comando (Mac y Linux).
#
#   Instalar o actualizar:  curl -fsSL https://inherent-work.vercel.app/laya/instalar.sh | bash
#   Con el modelo local:    curl -fsSL https://inherent-work.vercel.app/laya/instalar.sh | bash -s -- --modelo-local
#   Quitarlo todo:          curl -fsSL https://inherent-work.vercel.app/laya/instalar.sh | bash -s -- --desinstalar
#
# Qué hace (sin sudo, todo dentro de ~/.inherent/laya):
#   1. Instala uv si no está (el instalador oficial, dentro de esta carpeta: no toca tu PATH).
#   2. Crea un entorno con Python 3.12 propio (no usa el Python de tu sistema).
#   3. Instala laya[serve] (en Linux, torch para CPU; en Mac con Apple Silicon torch ya trae MPS).
#   4. Copia el puente (puente.py) y baja el modelo multilingual (~650 MB, solo la primera vez).
#   5. Lo deja corriendo siempre: LaunchAgent en Mac, servicio de usuario systemd en Linux
#      (si no hay systemd de usuario, lo arranca con nohup y te avisa).
#   6. Revisa que http://127.0.0.1:7357/health responda.
#   7. OPCIONAL, solo con --modelo-local: instala Ollama (sin sudo, dentro de esta misma carpeta) y baja
#      un modelo pequeño que escribe español (gemma3:4b, ~3.4 GB) para el texto repetitivo: variantes de
#      caption, alt text y títulos cortos. Queda en http://127.0.0.1:11434. Si algo falla ahí, Laya ya
#      quedó funcionando: este paso nunca la rompe.
# Correrlo otra vez actualiza sin romper nada.
#
# Opciones:  --modelo-local (agrega el paso 7) · --solo-modelo-local (solo el paso 7, sin tocar Laya)
#            --desinstalar (quita todo, también el modelo local).
# Variables opcionales: LAYA_HOME (carpeta), LAYA_PUENTE_PUERTO (puerto), LAYA_PYTHON (versión de
# Python), LAYA_BASE_URL (de dónde baja puente.py), HF_HOME (dónde guarda el modelo),
# LAYA_MODELO_LOCAL (otro modelo de ollama.com/library; por defecto gemma3:4b).
set -euo pipefail

# Todo va dentro de main: con «curl | bash», bash lee el script completo antes de correr nada.
main() {
  local ETIQUETA="global.inherent.laya"
  local UNIDAD="inherent-laya.service"
  local LAYA_HOME="${LAYA_HOME:-$HOME/.inherent/laya}"
  local PUERTO="${LAYA_PUENTE_PUERTO:-7357}"
  local PYVER="${LAYA_PYTHON:-3.12}"
  local BASE_URL="${LAYA_BASE_URL:-https://inherent-work.vercel.app/laya}"
  local PLIST="$HOME/Library/LaunchAgents/$ETIQUETA.plist"
  local UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
  local VENV="$LAYA_HOME/venv"
  local PY="$VENV/bin/python"
  local LOGS="$LAYA_HOME/log"
  local OLLAMA_PUERTO=11434
  local OLLAMA_URL="http://127.0.0.1:11434"
  local OLLAMA_HOME="$LAYA_HOME/ollama"
  local OLLAMA_ETIQUETA="global.inherent.ollama"
  local OLLAMA_UNIDAD="inherent-ollama.service"
  local OLLAMA_PLIST="$HOME/Library/LaunchAgents/$OLLAMA_ETIQUETA.plist"
  local MODELO_LOCAL="${LAYA_MODELO_LOCAL:-gemma3:4b}"
  local MODELO_LOCAL_ON=0 SOLO_MODELO=0 QUITAR=0 ARG
  local SO
  SO="$(uname -s)"

  # uv y su Python quedan dentro de LAYA_HOME: desinstalar no deja rastros.
  export UV_PYTHON_INSTALL_DIR="$LAYA_HOME/python"
  export UV_CACHE_DIR="$LAYA_HOME/cache"
  export UV_NO_PROGRESS=1

  case "$SO" in
    Darwin | Linux) ;;
    *) fallo "Este instalador es para Mac o Linux. En Windows usa: irm https://inherent-work.vercel.app/laya/instalar.ps1 | iex" ;;
  esac

  for ARG in "$@"; do
    case "$ARG" in
      --desinstalar | --uninstall) QUITAR=1 ;;
      --modelo-local) MODELO_LOCAL_ON=1 ;;
      --solo-modelo-local) MODELO_LOCAL_ON=1 SOLO_MODELO=1 ;;
      *) fallo "No conozco la opción «$ARG». Usa nada (instalar o actualizar), --modelo-local o --desinstalar." ;;
    esac
  done
  if [ "$QUITAR" = 1 ]; then
    desinstalar
    return 0
  fi

  if [ "$SOLO_MODELO" = 1 ]; then
    command -v curl >/dev/null 2>&1 || fallo "Falta curl. Instálalo y vuelve a correr el comando."
    mkdir -p "$LAYA_HOME" "$LOGS"
    modelo_local || fallo "No pude dejar el modelo local. Mira $LOGS/instalar.log y vuelve a correr el comando."
    return 0
  fi

  if [ -x "$PY" ]; then
    paso "Actualizando Laya en $LAYA_HOME"
  else
    paso "Instalando Laya en $LAYA_HOME (5 a 15 minutos la primera vez)"
  fi
  command -v curl >/dev/null 2>&1 || fallo "Falta curl. Instálalo y vuelve a correr el comando."
  mkdir -p "$LAYA_HOME" "$LOGS"

  # 0. Si ya estaba corriendo, se apaga mientras se actualiza.
  detener

  # 1. uv
  local UV
  UV="$(buscar_uv)"
  if [ -z "$UV" ]; then
    paso "Instalando uv (el que instala Python sin tocar tu sistema)"
    curl -LsSf https://astral.sh/uv/install.sh | env UV_UNMANAGED_INSTALL="$LAYA_HOME/bin" sh >>"$LOGS/instalar.log" 2>&1 ||
      fallo "No pude instalar uv. Revisa tu internet y vuelve a correr el comando."
    UV="$LAYA_HOME/bin/uv"
  fi
  [ -x "$UV" ] || fallo "No encontré uv después de instalarlo. Vuelve a correr el comando."

  # 2. El entorno con su propio Python
  if [ ! -x "$PY" ] || ! "$PY" -c "import sys; sys.exit(0 if sys.version.startswith('$PYVER') else 1)" 2>/dev/null; then
    paso "Preparando Python $PYVER"
    rm -rf "$VENV"
    "$UV" venv --quiet --python "$PYVER" --python-preference only-managed "$VENV" >>"$LOGS/instalar.log" 2>&1 ||
      fallo "No pude preparar Python $PYVER. Mira $LOGS/instalar.log y vuelve a intentar."
  fi

  # 3. Laya (y torch)
  paso "Instalando Laya y sus piezas (torch pesa; ten paciencia)"
  # --upgrade-package laya: actualiza Laya sin cambiar el torch que ya quedó (en Linux, el de CPU).
  local -a pip=("$UV" pip install --quiet --python "$PY")
  if [ "$SO" = "Linux" ]; then
    # torch solo CPU: no baja los ~2 GB de CUDA.
    "${pip[@]}" --upgrade torch --index-url https://download.pytorch.org/whl/cpu >>"$LOGS/instalar.log" 2>&1 ||
      fallo "No pude instalar torch. Revisa tu internet y vuelve a correr el comando."
    "${pip[@]}" --upgrade-package laya "laya[serve]" >>"$LOGS/instalar.log" 2>&1 ||
      fallo "No pude instalar Laya. Mira $LOGS/instalar.log y vuelve a intentar."
  elif [ "$(uname -m)" = "x86_64" ]; then
    # Mac con Intel: torch dejó de publicar para Intel en 2.2.2; esas versiones son las que corren ahí.
    "${pip[@]}" --upgrade-package laya "laya[serve]" "numpy<2" "torch==2.2.2" "transformers==4.57.6" "huggingface_hub<1.0" >>"$LOGS/instalar.log" 2>&1 ||
      fallo "No pude instalar Laya en esta Mac con Intel. Mira $LOGS/instalar.log y mándaselo a tu operador."
  else
    "${pip[@]}" --upgrade-package laya "laya[serve]" >>"$LOGS/instalar.log" 2>&1 ||
      fallo "No pude instalar Laya. Mira $LOGS/instalar.log y vuelve a intentar."
  fi

  # 4. El puente
  poner_puente

  # El modelo: si ya lo bajaste antes con pip, se reusa; si no, queda dentro de LAYA_HOME.
  local HF="${HF_HOME:-}"
  if [ -z "$HF" ]; then
    if ls "$HOME"/.cache/huggingface/hub/models--convaiinnovations--laya/snapshots/*/multilingual/model.safetensors >/dev/null 2>&1; then
      HF="$HOME/.cache/huggingface"
    else
      HF="$LAYA_HOME/modelo"
    fi
  fi
  mkdir -p "$HF"
  if ls "$HF"/hub/models--convaiinnovations--laya/snapshots/*/multilingual/model.safetensors >/dev/null 2>&1; then
    paso "Revisando el modelo (ya está bajado)"
  else
    paso "Bajando el modelo (~650 MB), solo la primera vez…"
  fi
  HF_HOME="$HF" USE_TF=0 TOKENIZERS_PARALLELISM=false "$PY" "$LAYA_HOME/puente.py" --precargar </dev/null >>"$LOGS/instalar.log" 2>&1 ||
    fallo "No pude bajar o probar el modelo. Revisa tu internet y vuelve a correr el comando."
  # Lo que la persona eligió a mano (su propio repo, su Claude) se conserva al reescribir la config.
  local propio=""
  [ -f "$LAYA_HOME/config" ] && propio="$(grep -E '^(INHERENT_REPO|INHERENT_CLAUDE)=' "$LAYA_HOME/config" || true)"
  printf 'HF_HOME=%s\nLAYA_PUENTE_PUERTO=%s\nLAYA_PUENTE_LOG=%s\n' "$HF" "$PUERTO" "$LOGS" >"$LAYA_HOME/config"
  [ -n "$propio" ] && printf '%s\n' "$propio" >>"$LAYA_HOME/config"
  copia_repo "$PY"

  # El puerto tiene que estar libre: si responde algo aquí, es un puente abierto a mano.
  # Desde la app de escritorio (LAYA_DESDE_APP), es el puente de la app: la app lo apaga al leer este paso.
  if [ -n "${LAYA_DESDE_APP:-}" ] && curl -fsS -m 2 "http://127.0.0.1:$PUERTO/health" >/dev/null 2>&1; then
    paso "Cambiando al puente de siempre"
    for _ in $(seq 1 30); do
      curl -fsS -m 1 "http://127.0.0.1:$PUERTO/health" >/dev/null 2>&1 || break
      sleep 1
    done
  fi
  if curl -fsS -m 2 "http://127.0.0.1:$PUERTO/health" >/dev/null 2>&1; then
    fallo "Ya hay un puente abierto a mano en otra ventana: ciérralo (Ctrl + C) y vuelve a correr el comando."
  fi

  # 5. Que quede corriendo siempre
  local modo
  if [ "$SO" = "Darwin" ]; then
    servicio_mac "$HF"
    modo="mac"
  elif systemctl --user show-environment >/dev/null 2>&1; then
    servicio_linux "$HF"
    modo="systemd"
  else
    con_nohup "$HF"
    modo="nohup"
  fi

  # 6. ¿Responde?
  verificar "$modo"

  # 7. El modelo local (opcional). Laya ya quedó corriendo: aquí un fallo solo avisa.
  if [ "$MODELO_LOCAL_ON" = 1 ]; then
    if ! modelo_local; then
      printf '\n⚠️  El modelo local no quedó, pero Laya sí está corriendo. Mira %s/instalar.log y vuelve a correr con --modelo-local cuando quieras.\n' "$LOGS"
    fi
  fi
}

# ---------- piezas ----------

paso() { printf '\n→ %s\n' "$1"; }
fallo() { printf '\n❌ %s\n' "$1" >&2; exit 1; }

buscar_uv() {
  local c
  for c in "$(command -v uv 2>/dev/null || true)" "$LAYA_HOME/bin/uv" "$HOME/.local/bin/uv" "$HOME/.cargo/bin/uv"; do
    if [ -n "$c" ] && [ -x "$c" ]; then
      printf '%s' "$c"
      return 0
    fi
  done
}

# Copia puente.py junto al script si se corre desde el repo; si no (curl | bash), lo baja del OS.
poner_puente() {
  local origen="" tmp
  if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
    origen="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/puente.py"
  fi
  tmp="$LAYA_HOME/puente.py.nuevo"
  if [ -n "$origen" ] && [ -f "$origen" ]; then
    cp "$origen" "$tmp"
  else
    curl -fsSL "$BASE_URL/puente.py" -o "$tmp" || fallo "No pude bajar el puente. Revisa tu internet y vuelve a correr el comando."
  fi
  grep -q "Puente local de Laya" "$tmp" || fallo "El puente que bajé no se ve bien. Vuelve a correr el comando en un rato."
  mv -f "$tmp" "$LAYA_HOME/puente.py"
}

servicio_mac() {
  local hf="$1"
  mkdir -p "$(dirname "$PLIST")"
  : >"$LOGS/sistema.log"
  cat >"$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$ETIQUETA</string>
  <key>ProgramArguments</key>
  <array>
    <string>$PY</string>
    <string>$LAYA_HOME/puente.py</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>HF_HOME</key><string>$hf</string>
    <key>LAYA_PUENTE_PUERTO</key><string>$PUERTO</string>
    <key>LAYA_PUENTE_LOG</key><string>$LOGS</string>
    <key>USE_TF</key><string>0</string>
    <key>TOKENIZERS_PARALLELISM</key><string>false</string>
    <key>PYTHONUNBUFFERED</key><string>1</string>
  </dict>
  <key>WorkingDirectory</key><string>$LAYA_HOME</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>$LOGS/sistema.log</string>
  <key>StandardErrorPath</key><string>$LOGS/sistema.log</string>
</dict>
</plist>
PLIST
  paso "Dejándolo encendido siempre (también al reiniciar)"
  launchctl enable "gui/$UID/$ETIQUETA" >/dev/null 2>&1 || true
  if ! launchctl bootstrap "gui/$UID" "$PLIST" >/dev/null 2>&1; then
    launchctl load -w "$PLIST" >/dev/null 2>&1 || fallo "Mac no me dejó encenderlo. Reinicia la compu y vuelve a correr el comando."
  fi
}

servicio_linux() {
  local hf="$1"
  mkdir -p "$UNIT_DIR"
  cat >"$UNIT_DIR/$UNIDAD" <<UNIT
[Unit]
Description=Laya para Inherent OS (puente en 127.0.0.1:$PUERTO)
After=network.target

[Service]
ExecStart="$PY" "$LAYA_HOME/puente.py"
WorkingDirectory=$LAYA_HOME
Environment="HF_HOME=$hf" "LAYA_PUENTE_PUERTO=$PUERTO" "LAYA_PUENTE_LOG=$LOGS" USE_TF=0 TOKENIZERS_PARALLELISM=false PYTHONUNBUFFERED=1
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
UNIT
  paso "Dejándolo encendido siempre (también al reiniciar)"
  systemctl --user daemon-reload
  systemctl --user enable --now "$UNIDAD" >/dev/null 2>&1 || fallo "systemd no me dejó encenderlo. Mira: systemctl --user status $UNIDAD"
}

con_nohup() {
  local hf="$1" pid
  paso "Tu sistema no tiene systemd de usuario: lo enciendo con nohup"
  : >"$LOGS/sistema.log"
  HF_HOME="$hf" LAYA_PUENTE_PUERTO="$PUERTO" LAYA_PUENTE_LOG="$LOGS" USE_TF=0 TOKENIZERS_PARALLELISM=false PYTHONUNBUFFERED=1 \
    nohup "$PY" "$LAYA_HOME/puente.py" </dev/null >>"$LOGS/sistema.log" 2>&1 &
  pid=$!
  printf '%s\n' "$pid" >"$LAYA_HOME/puente.pid"
}

# ¿Este pid es nuestro puente? (para no matar nunca otro proceso)
es_nuestro() {
  local pid="$1" cmd
  [ -n "$pid" ] || return 1
  cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  case "$cmd" in *"$LAYA_HOME/puente.py"*) return 0 ;; *) return 1 ;; esac
}

# Apaga lo que haya dejado una instalación anterior (sin borrar nada).
detener() {
  if [ "$(uname -s)" = "Darwin" ]; then
    if [ -f "$PLIST" ] || launchctl print "gui/$UID/$ETIQUETA" >/dev/null 2>&1; then
      launchctl bootout "gui/$UID/$ETIQUETA" >/dev/null 2>&1 || launchctl unload "$PLIST" >/dev/null 2>&1 || true
      for _ in 1 2 3 4 5 6 7 8 9 10; do
        launchctl print "gui/$UID/$ETIQUETA" >/dev/null 2>&1 || break
        sleep 0.5
      done
    fi
  elif [ -f "$UNIT_DIR/$UNIDAD" ] && systemctl --user show-environment >/dev/null 2>&1; then
    systemctl --user stop "$UNIDAD" >/dev/null 2>&1 || true
  fi
  if [ -f "$LAYA_HOME/puente.pid" ]; then
    local pid
    pid="$(cat "$LAYA_HOME/puente.pid" 2>/dev/null || true)"
    if es_nuestro "$pid"; then
      kill "$pid" 2>/dev/null || true
      for _ in 1 2 3 4 5 6 7 8 9 10; do
        es_nuestro "$pid" || break
        sleep 0.5
      done
      es_nuestro "$pid" && kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$LAYA_HOME/puente.pid"
  fi
}

# La copia del repo que lee el chat: la maneja el puente (~/.inherent/laya/repo) y la pone al día con main antes de cada chat.
# Nadie la edita. Como el repo es privado, la primera vez hay que iniciar sesión en GitHub (una sola vez, en el navegador).
copia_repo() {
  local PY="$1" rc=0
  if grep -q '^INHERENT_REPO=' "$LAYA_HOME/config" 2>/dev/null; then return 0; fi
  paso "Preparando la copia del repo de Inherent (se pone al día sola antes de cada chat)"
  if ! command -v git >/dev/null 2>&1; then
    printf '⚠️  Falta git. En Mac: corre «xcode-select --install», acepta, y vuelve a correr este comando.\n'; return 0
  fi
  "$PY" "$LAYA_HOME/puente.py" --sincronizar </dev/null >>"$LOGS/instalar.log" 2>&1 || rc=$?
  if [ "$rc" = 3 ]; then
    paso "GitHub pide que inicies sesión (una sola vez)"
    if ! command -v gh >/dev/null 2>&1; then
      if command -v brew >/dev/null 2>&1; then brew install gh >>"$LOGS/instalar.log" 2>&1 || true; fi
    fi
    if command -v gh >/dev/null 2>&1; then
      gh auth status -h github.com >/dev/null 2>&1 || gh auth login -h github.com -p https -w </dev/tty || true
      gh auth setup-git >/dev/null 2>&1 || true
      rc=0; "$PY" "$LAYA_HOME/puente.py" --sincronizar </dev/null >>"$LOGS/instalar.log" 2>&1 || rc=$?
    else
      printf '⚠️  Instala GitHub CLI (https://cli.github.com), corre «gh auth login» y vuelve a correr este comando.\n'; return 0
    fi
  fi
  if [ "$rc" = 0 ]; then printf 'Copia del repo lista: el chat siempre lee lo último de main.\n'
  else printf '⚠️  No pude bajar el repo (mira %s/instalar.log). Laya funciona igual; el chat espera la copia.\n' "$LOGS"; fi
}

verificar() {
  local modo="$1" j=""
  paso "Revisando que responda (hasta 1 minuto)"
  for _ in $(seq 1 60); do
    j="$(curl -fsS -m 2 "http://127.0.0.1:$PUERTO/health" 2>/dev/null || true)"
    case "$j" in *'"listo": true'*) break ;; esac
    case "$j" in *'"error": "'*) break ;; esac
    sleep 1
  done
  case "$j" in
    *'"listo": true'*) ;;
    *'"error": "'*) fallo "Laya arrancó pero el modelo no cargó. Mira $LOGS/puente.log y mándaselo a tu operador." ;;
    *'"status": "ok"'*) printf '\n(El modelo termina de cargar en unos segundos.)\n' ;;
    *) fallo "Laya no respondió. Reinicia la compu; si sigue igual, manda $LOGS/puente.log a tu operador." ;;
  esac
  if [ "$modo" = "nohup" ]; then
    printf '\n⚠️  Sin systemd de usuario no arranca solo al reiniciar: después de reiniciar, vuelve a correr este comando.\n'
  fi
  printf '\n✅ Laya está corriendo. Vuelve a Inherent OS y recarga.\n'
}

# ---------- el modelo local (opcional): Ollama + un modelo pequeño que escribe español ----------

ollama_vivo() { curl -fsS -m 2 "$OLLAMA_URL/api/version" >/dev/null 2>&1; }

# ¿Dónde está el programa de Ollama? Primero el nuestro, luego el que ya tengas.
ollama_buscar() {
  local c
  for c in "$OLLAMA_HOME/bin/ollama" "$OLLAMA_HOME/ollama" "$(command -v ollama 2>/dev/null || true)" "/Applications/Ollama.app/Contents/Resources/ollama"; do
    if [ -n "$c" ] && [ -x "$c" ]; then
      printf '%s' "$c"
      return 0
    fi
  done
}

modelo_instalado() { curl -fsS -m 3 "$OLLAMA_URL/api/tags" 2>/dev/null | grep -qF "\"name\":\"$MODELO_LOCAL\""; }

# Baja el programa (sin sudo) a ~/.inherent/laya/ollama. Solo se llama si no hay uno ya.
bajar_ollama() {
  local arch uv
  case "$(uname -m)" in
    x86_64 | amd64) arch="amd64" ;;
    arm64 | aarch64) arch="arm64" ;;
    *) printf 'Ollama no publica programa para esta arquitectura (%s).\n' "$(uname -m)" >&2; return 1 ;;
  esac
  mkdir -p "$OLLAMA_HOME"
  paso "Bajando Ollama (el programa que corre el modelo en tu compu)"
  if [ "$SO" = "Darwin" ]; then
    curl -fL --retry 3 -sS "https://ollama.com/download/ollama-darwin.tgz" | tar -xzf - -C "$OLLAMA_HOME" >>"$LOGS/instalar.log" 2>&1 || return 1
  elif command -v zstd >/dev/null 2>&1; then
    curl -fL --retry 3 -sS "https://ollama.com/download/ollama-linux-$arch.tar.zst" | zstd -d | tar -xf - -C "$OLLAMA_HOME" >>"$LOGS/instalar.log" 2>&1 || return 1
  else
    # Sin zstd y sin sudo: se descomprime con el Python propio de Laya.
    uv="$(buscar_uv)"
    if [ -z "$uv" ]; then
      curl -LsSf https://astral.sh/uv/install.sh | env UV_UNMANAGED_INSTALL="$LAYA_HOME/bin" sh >>"$LOGS/instalar.log" 2>&1 || return 1
      uv="$LAYA_HOME/bin/uv"
    fi
    curl -fL --retry 3 -sS "https://ollama.com/download/ollama-linux-$arch.tar.zst" |
      "$uv" run --quiet --no-project --python "$PYVER" --python-preference only-managed --with zstandard python -c \
        'import sys, zstandard; zstandard.ZstdDecompressor().copy_stream(sys.stdin.buffer, sys.stdout.buffer)' 2>>"$LOGS/instalar.log" |
      tar -xf - -C "$OLLAMA_HOME" >>"$LOGS/instalar.log" 2>&1 || return 1
  fi
  [ -x "$OLLAMA_HOME/bin/ollama" ] || [ -x "$OLLAMA_HOME/ollama" ]
}

# Lo deja encendido siempre, igual que a Laya. OLLAMA_ORIGINS deja que Inherent OS lea /api/tags desde el navegador.
encender_ollama() {
  local bin="$1" modelos="$OLLAMA_HOME/modelos" origenes="https://inherent-work.vercel.app" pid
  mkdir -p "$modelos"
  paso "Dejando el modelo local encendido siempre"
  if [ "$SO" = "Darwin" ]; then
    mkdir -p "$(dirname "$OLLAMA_PLIST")"
    cat >"$OLLAMA_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$OLLAMA_ETIQUETA</string>
  <key>ProgramArguments</key>
  <array>
    <string>$bin</string>
    <string>serve</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>OLLAMA_HOST</key><string>127.0.0.1:$OLLAMA_PUERTO</string>
    <key>OLLAMA_ORIGINS</key><string>$origenes</string>
    <key>OLLAMA_MODELS</key><string>$modelos</string>
  </dict>
  <key>WorkingDirectory</key><string>$LAYA_HOME</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>$LOGS/ollama.log</string>
  <key>StandardErrorPath</key><string>$LOGS/ollama.log</string>
</dict>
</plist>
PLIST
    launchctl enable "gui/$UID/$OLLAMA_ETIQUETA" >/dev/null 2>&1 || true
    if ! launchctl bootstrap "gui/$UID" "$OLLAMA_PLIST" >/dev/null 2>&1; then
      launchctl load -w "$OLLAMA_PLIST" >/dev/null 2>&1 || return 1
    fi
  elif systemctl --user show-environment >/dev/null 2>&1; then
    mkdir -p "$UNIT_DIR"
    cat >"$UNIT_DIR/$OLLAMA_UNIDAD" <<UNIT
[Unit]
Description=Modelo local para Inherent OS (Ollama en 127.0.0.1:$OLLAMA_PUERTO)
After=network.target

[Service]
ExecStart="$bin" serve
WorkingDirectory=$LAYA_HOME
Environment="OLLAMA_HOST=127.0.0.1:$OLLAMA_PUERTO" "OLLAMA_ORIGINS=$origenes" "OLLAMA_MODELS=$modelos"
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
UNIT
    systemctl --user daemon-reload
    systemctl --user enable --now "$OLLAMA_UNIDAD" >/dev/null 2>&1 || return 1
  else
    printf 'Tu sistema no tiene systemd de usuario: lo enciendo con nohup (después de reiniciar, vuelve a correr este comando).\n'
    : >"$LOGS/ollama.log"
    OLLAMA_HOST="127.0.0.1:$OLLAMA_PUERTO" OLLAMA_ORIGINS="$origenes" OLLAMA_MODELS="$modelos" \
      nohup "$bin" serve </dev/null >>"$LOGS/ollama.log" 2>&1 &
    pid=$!
    printf '%s\n' "$pid" >"$LAYA_HOME/ollama.pid"
  fi
  local _
  for _ in $(seq 1 60); do
    ollama_vivo && return 0
    sleep 1
  done
  printf 'Ollama no respondió en 1 minuto. Mira %s/ollama.log\n' "$LOGS" >&2
  return 1
}

bajar_modelo() {
  local bin="$1"
  paso "Bajando el modelo $MODELO_LOCAL (~3.4 GB), solo la primera vez…"
  if [ -n "$bin" ]; then
    if [ -t 1 ]; then
      OLLAMA_HOST="127.0.0.1:$OLLAMA_PUERTO" "$bin" pull "$MODELO_LOCAL" || return 1
    else
      OLLAMA_HOST="127.0.0.1:$OLLAMA_PUERTO" "$bin" pull "$MODELO_LOCAL" >>"$LOGS/instalar.log" 2>&1 || return 1
    fi
  else
    # Hay un Ollama encendido pero no encontré su programa: se lo pido por su API.
    curl -fsS "$OLLAMA_URL/api/pull" -d "{\"model\":\"$MODELO_LOCAL\",\"stream\":false}" >>"$LOGS/instalar.log" 2>&1 || return 1
  fi
  modelo_instalado
}

modelo_local() {
  local bin
  paso "Modelo local para el texto repetitivo ($MODELO_LOCAL)"
  bin="$(ollama_buscar)"
  if ollama_vivo; then
    printf 'Ya hay un Ollama encendido en %s: lo uso tal cual.\n' "$OLLAMA_URL"
  else
    if [ -z "$bin" ]; then
      bajar_ollama || { printf 'No pude bajar Ollama. Revisa tu internet.\n' >&2; return 1; }
      bin="$(ollama_buscar)"
    fi
    encender_ollama "$bin" || { printf 'No pude encender Ollama.\n' >&2; return 1; }
  fi
  if modelo_instalado; then
    printf 'El modelo %s ya está bajado.\n' "$MODELO_LOCAL"
  else
    bajar_modelo "$bin" || { printf 'No pude bajar el modelo %s.\n' "$MODELO_LOCAL" >&2; return 1; }
  fi
  # Un texto de prueba: carga el modelo en memoria y confirma que escribe.
  if curl -fsS -m 240 "$OLLAMA_URL/api/generate" -d "{\"model\":\"$MODELO_LOCAL\",\"prompt\":\"Responde solo con la palabra: listo\",\"stream\":false,\"options\":{\"num_predict\":8}}" 2>/dev/null | grep -q '"response"'; then
    printf '\n✅ Modelo local listo: %s en %s\n' "$MODELO_LOCAL" "$OLLAMA_URL"
  else
    printf '\n⚠️  El modelo quedó bajado pero no contestó la prueba (¿poca memoria libre?). Se volverá a intentar solo al usarlo.\n'
  fi
}

# ¿Este pid es nuestro Ollama? (por el pid que guardamos y porque corre «serve»)
es_ollama_nuestro() {
  local pid="$1" cmd
  [ -n "$pid" ] || return 1
  cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  case "$cmd" in *"ollama"*" serve"*) return 0 ;; *) return 1 ;; esac
}

# Apaga y desregistra el Ollama que dejó este instalador (nunca toca uno que ya tenías).
quitar_ollama() {
  if [ "$(uname -s)" = "Darwin" ]; then
    if [ -f "$OLLAMA_PLIST" ]; then
      launchctl bootout "gui/$UID/$OLLAMA_ETIQUETA" >/dev/null 2>&1 || launchctl unload "$OLLAMA_PLIST" >/dev/null 2>&1 || true
      rm -f "$OLLAMA_PLIST"
    fi
  elif [ -f "$UNIT_DIR/$OLLAMA_UNIDAD" ]; then
    if systemctl --user show-environment >/dev/null 2>&1; then
      systemctl --user disable --now "$OLLAMA_UNIDAD" >/dev/null 2>&1 || true
    fi
    rm -f "$UNIT_DIR/$OLLAMA_UNIDAD"
    systemctl --user daemon-reload >/dev/null 2>&1 || true
  fi
  if [ -f "$LAYA_HOME/ollama.pid" ]; then
    local pid
    pid="$(cat "$LAYA_HOME/ollama.pid" 2>/dev/null || true)"
    if es_ollama_nuestro "$pid"; then
      kill "$pid" 2>/dev/null || true
      sleep 1
      es_ollama_nuestro "$pid" && kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$LAYA_HOME/ollama.pid"
  fi
}

desinstalar() {
  paso "Quitando Laya de esta compu"
  local hf=""
  [ -f "$LAYA_HOME/config" ] && hf="$(sed -n 's/^HF_HOME=//p' "$LAYA_HOME/config")"
  detener
  quitar_ollama
  if [ "$(uname -s)" = "Darwin" ]; then
    rm -f "$PLIST"
  elif [ -f "$UNIT_DIR/$UNIDAD" ]; then
    if systemctl --user show-environment >/dev/null 2>&1; then
      systemctl --user disable "$UNIDAD" >/dev/null 2>&1 || true
    fi
    rm -f "$UNIT_DIR/$UNIDAD"
    systemctl --user daemon-reload >/dev/null 2>&1 || true
  fi
  case "$LAYA_HOME" in
    "$HOME"/?*) rm -rf "$LAYA_HOME" ;;
    *) fallo "No borro $LAYA_HOME porque no está dentro de tu carpeta personal. Bórrala tú si quieres." ;;
  esac
  rmdir "$HOME/.inherent" 2>/dev/null || true
  case "$hf" in
    "" | "$LAYA_HOME"/*) ;;
    *) printf '\n(El modelo se queda en %s porque ya estaba ahí antes de Laya para Inherent OS.)\n' "$hf" ;;
  esac
  printf '\n✅ Laya quedó desinstalado (y el modelo local, si lo habías puesto). Para volver a tenerlo, corre otra vez el comando de instalar.\n'
}

main "$@"
