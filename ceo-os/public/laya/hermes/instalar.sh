#!/usr/bin/env bash
# Hermes Agent para Inherent OS · instalador de un comando (Mac).
#
#   Instalar o actualizar:  curl -fsSL https://inherent-work.vercel.app/laya/hermes/instalar.sh | bash
#   Quitarlo:               curl -fsSL https://inherent-work.vercel.app/laya/hermes/instalar.sh | bash -s -- --desinstalar
#
# Qué hace (sin sudo):
#   1. Instala Hermes Agent (el instalador oficial de Nous Research, en ~/.hermes) si no está.
#   2. Crea el perfil «inherent»: su propia memoria, config y SOUL.md (la identidad de Inherent, bajada del OS).
#   3. Le pone el repo como carpeta de trabajo (la copia que mantiene el puente de Laya en ~/.inherent/laya/repo):
#      así lee CLAUDE.md y el manual como contexto.
#   4. Le conecta el conector de Inherent OS (MCP por OAuth): las acciones del OS, con el perfil de cada quien.
#   5. Enciende su API local (http://127.0.0.1:8642) solo para el OS, con una llave que la app de Mac lee sola.
#   6. Lo deja corriendo siempre (launchd) y revisa que /health responda.
# El modelo (ChatGPT, Claude, local) lo elige cada quien después: `inherent model` en la Terminal, o desde el OS.
# Correrlo otra vez actualiza sin romper nada.
#
# Variables opcionales: HERMES_OS_URL (el OS; por defecto https://inherent-work.vercel.app) · HERMES_PERFIL (por
# defecto inherent) · HERMES_REPO (la carpeta del repo; por defecto ~/.inherent/laya/repo) · HERMES_API_PUERTO (8642).
set -euo pipefail

main() {
  local OS_URL="${HERMES_OS_URL:-https://inherent-work.vercel.app}"
  local PERFIL="${HERMES_PERFIL:-inherent}"
  local REPO="${HERMES_REPO:-$HOME/.inherent/laya/repo}"
  local PUERTO="${HERMES_API_PUERTO:-8642}"
  local HERMES_HOME_BASE="${HERMES_HOME:-$HOME/.hermes}"
  local DATOS="$HOME/.inherent/hermes"
  local PHOME="$HERMES_HOME_BASE/profiles/$PERFIL"
  local BIN="$HOME/.local/bin"
  export PATH="$BIN:$HERMES_HOME_BASE/bin:$PATH"

  if [ "${1:-}" = "--desinstalar" ]; then
    echo "→ Quitando el perfil $PERFIL de Hermes"
    hermes -p "$PERFIL" gateway stop -y >/dev/null 2>&1 || true
    hermes -p "$PERFIL" gateway uninstall >/dev/null 2>&1 || true
    hermes profile delete "$PERFIL" >/dev/null 2>&1 || true
    rm -rf "$DATOS"
    echo "✓ Listo. Hermes sigue instalado (para quitarlo del todo: hermes uninstall)."
    return 0
  fi

  if [ "$(uname -s)" != "Darwin" ]; then echo "❌ Este instalador es para Mac. En Linux, instala Hermes a mano: https://hermes-agent.nousresearch.com/docs"; return 1; fi
  mkdir -p "$DATOS"

  # 1 · Hermes
  if ! command -v hermes >/dev/null 2>&1; then
    echo "→ Instalando Hermes Agent (unos minutos)"
    curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --non-interactive --skip-browser --skip-computer-use >"$DATOS/instalar-hermes.log" 2>&1 || { echo "❌ No se pudo instalar Hermes. Mira $DATOS/instalar-hermes.log"; return 1; }
    hash -r
    command -v hermes >/dev/null 2>&1 || { echo "❌ Hermes se instaló pero no está en el PATH. Cierra y abre la Terminal, o corre: source ~/.zshrc"; return 1; }
  else
    echo "→ Hermes ya está: $(hermes --version 2>/dev/null | head -1)"
  fi

  # 2 · El perfil
  if ! hermes profile list 2>/dev/null | grep -qE "^\*? *$PERFIL\$"; then
    echo "→ Creando el perfil $PERFIL"
    hermes profile create "$PERFIL" >/dev/null
  fi
  mkdir -p "$PHOME"
  echo "→ Poniendo la identidad de Inherent (SOUL.md)"
  curl -fsSL "$OS_URL/laya/hermes/SOUL.md" -o "$PHOME/SOUL.md" || { echo "❌ No pude bajar SOUL.md de $OS_URL"; return 1; }

  # 3 · El repo como carpeta de trabajo
  if [ -d "$REPO" ]; then
    hermes -p "$PERFIL" config set terminal.cwd "$REPO" >/dev/null
  else
    echo "→ Aviso: todavía no existe la copia del repo en $REPO (la crea el puente de Laya la primera vez que chateas). Hermes la tomará cuando esté."
    hermes -p "$PERFIL" config set terminal.cwd "$REPO" >/dev/null || true
  fi

  # 4 · El conector de Inherent OS (OAuth: la primera vez pide entrar con Google)
  if ! hermes -p "$PERFIL" mcp list 2>/dev/null | grep -q "inherent"; then
    echo "→ Conectando el conector de Inherent OS"
    hermes -p "$PERFIL" mcp add inherent --url "$OS_URL/mcp" --auth oauth >/dev/null 2>&1 || echo "→ Aviso: el conector queda por autorizar. Después: inherent mcp login inherent"
  fi

  # 5 · La API local, solo para el OS
  local KEY
  if [ -s "$DATOS/api-key" ]; then KEY="$(cat "$DATOS/api-key")"; else KEY="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 40)"; (umask 077; printf '%s' "$KEY" >"$DATOS/api-key"); fi
  printf 'http://127.0.0.1:%s' "$PUERTO" >"$DATOS/api-url"
  hermes -p "$PERFIL" config set API_SERVER_ENABLED true >/dev/null
  hermes -p "$PERFIL" config set API_SERVER_KEY "$KEY" >/dev/null
  hermes -p "$PERFIL" config set API_SERVER_PORT "$PUERTO" >/dev/null
  hermes -p "$PERFIL" config set API_SERVER_HOST 127.0.0.1 >/dev/null
  hermes -p "$PERFIL" config set API_SERVER_CORS_ORIGINS "$OS_URL,http://localhost:3000" >/dev/null
  hermes -p "$PERFIL" config set API_SERVER_MODEL_NAME inherent >/dev/null

  # 6 · Siempre encendido
  echo "→ Dejándolo encendido (launchd)"
  hermes -p "$PERFIL" gateway install >/dev/null 2>&1 || true
  hermes -p "$PERFIL" gateway restart -y >/dev/null 2>&1 || hermes -p "$PERFIL" gateway start >/dev/null 2>&1 || true
  local i
  for i in $(seq 1 30); do
    if curl -fsS -m 2 "http://127.0.0.1:$PUERTO/health" >/dev/null 2>&1; then echo "✓ Hermes responde en http://127.0.0.1:$PUERTO"; break; fi
    sleep 2
    [ "$i" = 30 ] && echo "→ Aviso: Hermes no respondió todavía en el puerto $PUERTO. Mira: hermes -p $PERFIL gateway status"
  done
  echo "✓ Listo. Falta elegir el modelo: en la Terminal, «$PERFIL model» (ChatGPT con tu cuenta, Claude, o uno local)."
}

main "$@"
