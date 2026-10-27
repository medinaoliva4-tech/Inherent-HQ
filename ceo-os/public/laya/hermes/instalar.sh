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
#   4. Guarda el conector de Inherent OS (MCP por OAuth): las acciones del OS, con el perfil de cada quien.
#      El login con Google lo hace la persona una vez: `inherent mcp login inherent`.
#   5. Enciende la API local solo para el OS, con una llave que la app de Mac lee sola. Hermes corre UN servicio por
#      compu: la API la abre el perfil principal (127.0.0.1:8642) y atiende a «inherent» en /p/inherent/, con su llave.
#   6. Lo deja corriendo siempre (launchd), revisa dónde contesta el perfil y lo deja escrito en ~/.inherent/hermes/api-url.
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
  # El perfil se reconoce por su carpeta: «hermes profile list» ahora es una tabla y leerla con grep fallaba, así que
  # al correr el instalador otra vez intentaba crearlo de nuevo y el script se cortaba.
  if [ ! -f "$PHOME/config.yaml" ]; then
    echo "→ Creando el perfil $PERFIL"
    hermes profile create "$PERFIL" >/dev/null 2>&1 || [ -f "$PHOME/config.yaml" ] || { echo "❌ No pude crear el perfil $PERFIL de Hermes"; return 1; }
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

  # 4 · El conector de Inherent OS (OAuth). Se guarda directo en la config: «hermes mcp add» pide contestar en la
  #     Terminal y, sin respuesta (como aquí), no guarda nada. El login con Google lo hace la persona después.
  echo "→ Guardando el conector de Inherent OS"
  hermes -p "$PERFIL" config set mcp_servers.inherent.url "$OS_URL/mcp" >/dev/null
  hermes -p "$PERFIL" config set mcp_servers.inherent.auth oauth >/dev/null

  # 5 · La API local, solo para el OS.
  #     La llave sale de openssl. Antes salía de «tr </dev/urandom | head -c 40»: con pipefail, el corte de head contaba
  #     como error y el script se detenía aquí sin avisar (sin llave, sin API y sin servicio).
  local KEY
  if [ -s "$DATOS/api-key" ] && [ "$(wc -c <"$DATOS/api-key" | tr -d ' ')" -ge 32 ]; then KEY="$(cat "$DATOS/api-key")"
  else KEY="$(openssl rand -hex 32)"; (umask 077; printf '%s' "$KEY" >"$DATOS/api-key"); fi
  #     El perfil solo pone su llave: con ella se entra a /p/<perfil>/ (no abre un puerto propio).
  hermes -p "$PERFIL" config set API_SERVER_KEY "$KEY" >/dev/null
  hermes -p "$PERFIL" config set API_SERVER_MODEL_NAME inherent >/dev/null
  #     El perfil principal abre el puerto, solo en esta compu y con su propia llave. Lo que ya tenía se respeta: su
  #     llave, su puerto si ya estaba encendida y los orígenes CORS de otras apps (solo se suman los del OS).
  local CORS o
  if [ -z "$(hermes -p default config get API_SERVER_KEY 2>/dev/null || true)" ]; then
    hermes -p default config set API_SERVER_KEY "$(openssl rand -hex 32)" >/dev/null
  fi
  if [ "$(hermes -p default config get API_SERVER_ENABLED 2>/dev/null || true)" = "true" ]; then
    PUERTO="$(hermes -p default config get API_SERVER_PORT 2>/dev/null || true)"; PUERTO="${PUERTO:-8642}"
  else
    hermes -p default config set API_SERVER_ENABLED true >/dev/null
    hermes -p default config set API_SERVER_HOST 127.0.0.1 >/dev/null
    hermes -p default config set API_SERVER_PORT "$PUERTO" >/dev/null
  fi
  CORS="$(hermes -p default config get API_SERVER_CORS_ORIGINS 2>/dev/null || true)"
  for o in "$OS_URL" "http://localhost:3000"; do case ",$CORS," in *",$o,"*) ;; *) CORS="${CORS:+$CORS,}$o" ;; esac; done
  hermes -p default config set API_SERVER_CORS_ORIGINS "$CORS" >/dev/null
  # Sin terminal, ni código, ni navegador, ni control de la compu, ni tareas programadas: el Inherent LLM lee el repo
  # (la copia que el puente pone al día y limpia antes de cada turno) y trabaja en el OS por su conector.
  hermes -p "$PERFIL" config set agent.disabled_toolsets '["terminal", "code_execution", "browser", "computer_use", "cronjob"]' >/dev/null

  # 6 · Siempre encendido: el servicio del perfil principal atiende a todos los perfiles (Hermes ≥ 0.22; con uno
  #     anterior, «inherent update» primero).
  echo "→ Dejándolo encendido (launchd)"
  hermes gateway install >/dev/null 2>&1 || true
  hermes gateway restart -y >/dev/null 2>&1 || hermes gateway start >/dev/null 2>&1 || true
  # Dónde contesta el perfil con su llave: /p/<perfil> (un servicio por compu) o la raíz (un servicio por perfil).
  local URL="" u i
  for i in $(seq 1 30); do
    for u in "http://127.0.0.1:$PUERTO/p/$PERFIL" "http://127.0.0.1:$PUERTO"; do
      if curl -fsS -m 3 -o /dev/null -H "Authorization: Bearer $KEY" "$u/v1/capabilities" 2>/dev/null; then URL="$u"; break 2; fi
    done
    sleep 2
  done
  if [ -n "$URL" ]; then
    printf '%s' "$URL" >"$DATOS/api-url"; echo "✓ Hermes responde en $URL"
  else
    printf 'http://127.0.0.1:%s/p/%s' "$PUERTO" "$PERFIL" >"$DATOS/api-url"
    echo "→ Aviso: Hermes no respondió todavía en el puerto $PUERTO. Mira: hermes gateway status"
  fi
  echo "✓ Listo. Faltan dos pasos en la Terminal:"
  echo "   1. «$PERFIL mcp login $PERFIL» → entra con tu Google y dale «Permitir» (el conector de Inherent OS)."
  echo "   2. «$PERFIL model» si todavía no eliges el modelo (ChatGPT con tu cuenta, Claude, o uno local)."
}

main "$@"
