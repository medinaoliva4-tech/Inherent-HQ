#!/usr/bin/env bash
# Recompila la interfaz (code-os/ui) en el servidor. El puente la sirve desde ~/code-os/ui/dist.
set -euo pipefail
cd "$HOME/code-os/ui" && npm ci --no-audit --no-fund && npm run build && echo "✓ Interfaz compilada en $PWD/dist"
