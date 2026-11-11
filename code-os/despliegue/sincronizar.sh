#!/usr/bin/env bash
# Desde tu Mac: copia el código de Code OS al servidor (sin node_modules ni compilados) y recompila. Uso: bash code-os/despliegue/sincronizar.sh [host]
set -euo pipefail
HOST="${1:-inherent-gw}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ssh "$HOST" 'mkdir -p ~/code-os'
for d in herramientas puente ui asistente despliegue cuotas litellm; do
  rsync -az --delete --exclude=/node_modules --exclude=/dist --exclude=/data --exclude=/.env "$ROOT/code-os/$d/" "$HOST:code-os/$d/"
done
ssh "$HOST" 'cd ~/code-os/puente && npm ci --no-audit --no-fund && npm run build && echo "✓ puente compilado"'
ssh "$HOST" 'bash ~/code-os/despliegue/recompilar-ui.sh'
