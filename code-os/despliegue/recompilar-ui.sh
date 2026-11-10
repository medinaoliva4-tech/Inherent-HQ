#!/usr/bin/env bash
# VITE_PUENTE_URL=/. = mismo origen (el navegador manda la cookie de /entrar; el token no va en el JS).
# Recompila la interfaz (code-os/ui) en el servidor. El puente la sirve desde ~/code-os/ui/dist.
set -euo pipefail
cd "$HOME/code-os/ui" && npm ci --no-audit --no-fund && VITE_PUENTE_URL=/. npm run build && echo "✓ Interfaz compilada en $PWD/dist"
