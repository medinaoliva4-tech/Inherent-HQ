#!/usr/bin/env bash
# En la Mac del diseñador (la que tiene Figma con el plugin Figwright). Carga un LaunchAgent que mantiene abierto el
# túnel inverso hacia el VPS: el Figwright de esta Mac (líder, 127.0.0.1:3055) queda visible SOLO en el loopback del
# VPS. El VPS nunca recibe acceso a la Mac: el túnel solo expone ese puerto. Se reconecta solo (KeepAlive) cuando la
# Mac despierta o vuelve la red. Necesita Tailscale arriba y que `ssh inherent-gw` funcione sin contraseña.
#
# Uso:  bash code-os/despliegue/figwright-tunel-mac.sh [--dry-run] [--host inherent-gw] [--puerto 3055]
#       bash code-os/despliegue/figwright-tunel-mac.sh --estado
#       bash code-os/despliegue/figwright-tunel-mac.sh --desinstalar [--dry-run]
set -euo pipefail

ETIQUETA=global.inherent.figwright-tunel
HOST=inherent-gw; PUERTO=3055; DRY=0; ACCION=instalar
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1 ;;
    --host) HOST="$2"; shift ;;
    --puerto) PUERTO="$2"; shift ;;
    --desinstalar) ACCION=desinstalar ;;
    --estado) ACCION=estado ;;
    -h|--help) sed -n 2,10p "$0"; exit 0 ;;
    *) echo "opción desconocida: $1" >&2; exit 2 ;;
  esac; shift
done
[ "$(uname)" = Darwin ] || { echo "este script es para macOS" >&2; exit 1; }
[[ "$PUERTO" =~ ^[0-9]+$ ]] && [[ "$HOST" =~ ^[A-Za-z0-9._-]+$ ]] || { echo "host o puerto inválido" >&2; exit 2; }
PLIST="$HOME/Library/LaunchAgents/$ETIQUETA.plist"; LOG="$HOME/Library/Logs/inherent-figwright-tunel.log"
DOM="gui/$(id -u)"
run() { if [ "$DRY" = 1 ]; then printf '  [dry-run] %s\n' "$*"; else eval "$@"; fi; }

remoto() { ssh -o BatchMode=yes -o ConnectTimeout=8 "$HOST" "curl -s -m 3 http://127.0.0.1:$PUERTO/ping" 2>/dev/null || true; }

if [ "$ACCION" = estado ]; then
  launchctl print "$DOM/$ETIQUETA" 2>/dev/null | grep -E '^\s*(state|pid|last exit code) =' || echo "LaunchAgent no cargado"
  echo "Mac  : $(curl -s -m 2 http://127.0.0.1:$PUERTO/ping | head -c 200 || echo 'Figwright no responde')"
  echo "VPS  : $(remoto | head -c 200)"
  [ -f "$LOG" ] && { echo "log  : $LOG"; tail -n 5 "$LOG"; }
  exit 0
fi

if [ "$ACCION" = desinstalar ]; then
  run "launchctl bootout '$DOM/$ETIQUETA' 2>/dev/null || true"
  [ -f "$PLIST" ] && run "mv '$PLIST' '$PLIST.respaldo-$(date +%Y%m%d%H%M%S)'"
  echo "✓ túnel desinstalado (el plist quedó como respaldo junto al original)"; exit 0
fi

# Comprobaciones
command -v /usr/bin/ssh >/dev/null || { echo "falta /usr/bin/ssh" >&2; exit 1; }
if curl -s -m 2 "http://127.0.0.1:$PUERTO/ping" | grep -q '"ok":true'; then echo "✓ Figwright responde en esta Mac (líder en :$PUERTO)"
else echo "⚠ Figwright no responde en 127.0.0.1:$PUERTO: abre Figma y el plugin Figwright (el túnel se instala igual)"; fi
if [ "$DRY" = 0 ]; then
  ssh -o BatchMode=yes -o ConnectTimeout=8 "$HOST" true || { echo "✗ ssh $HOST no entra sin contraseña (¿Tailscale arriba? ¿llave cargada?)" >&2; exit 1; }
  echo "✓ ssh $HOST funciona"
fi

TMP=$(mktemp)
cat > "$TMP" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$ETIQUETA</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/ssh</string>
    <string>-N</string>
    <string>-o</string><string>BatchMode=yes</string>
    <string>-o</string><string>ServerAliveInterval=30</string>
    <string>-o</string><string>ServerAliveCountMax=3</string>
    <string>-o</string><string>ExitOnForwardFailure=yes</string>
    <string>-o</string><string>ConnectTimeout=15</string>
    <string>-R</string><string>127.0.0.1:$PUERTO:127.0.0.1:$PUERTO</string>
    <string>$HOST</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>20</integer>
  <key>ProcessType</key><string>Background</string>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
PLIST
plutil -lint "$TMP" >/dev/null
if [ "$DRY" = 1 ]; then echo "--- $PLIST (no se escribe en --dry-run)"; cat "$TMP"; fi
[ -f "$PLIST" ] && run "cp -a '$PLIST' '$PLIST.respaldo-$(date +%Y%m%d%H%M%S)'"
run "mkdir -p '$HOME/Library/LaunchAgents' '$HOME/Library/Logs' && install -m 644 '$TMP' '$PLIST'"
rm -f "$TMP"
run "launchctl bootout '$DOM/$ETIQUETA' 2>/dev/null || true"
run "launchctl bootstrap '$DOM' '$PLIST' && launchctl enable '$DOM/$ETIQUETA'"
if [ "$DRY" = 0 ]; then
  sleep 5
  R=$(remoto)
  if echo "$R" | grep -q '"ok":true'; then echo "✓ el VPS ve el Figwright de esta Mac: $(echo "$R" | head -c 200)"
  else echo "⚠ el VPS aún no ve el puerto $PUERTO. Revisa: bash $0 --estado  (y el log $LOG)"; fi
fi
echo "Para quitarlo: bash $0 --desinstalar"
