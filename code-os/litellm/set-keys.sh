#!/usr/bin/env bash
# Versión ampliada de ~/set-keys.sh (servidor): pide las llaves con entrada oculta y las guarda en ~/gateway/.env (600).
# Correr:  ssh -t inherent-gw 'bash ~/set-keys.sh'   (copiar este archivo allí primero, o pegarle las líneas setkey nuevas)
set -euo pipefail
mkdir -p "$HOME/gateway"; F="$HOME/gateway/.env"; touch "$F"; chmod 600 "$F"
setkey() { # nombre, etiqueta
  local v; read -rsp "$2 (oculto, Enter para omitir): " v; echo
  [ -z "$v" ] && { echo "  - $1 omitida"; return; }
  grep -v "^$1=" "$F" > "$F.tmp" || true; printf '%s=%s\n' "$1" "$v" >> "$F.tmp"; mv "$F.tmp" "$F"; chmod 600 "$F"
  echo "  ok: $1 guardada (${#v} caracteres)"
}
setkey FEATHERLESS_API_KEY "Llave de Featherless"
setkey NVIDIA_API_KEY "Llave de NVIDIA (build.nvidia.com)"
setkey CLINE_API_KEY "Llave de Cline Pass (app.cline.bot)"
setkey DEEPSEEK_API_KEY "Llave de DeepSeek (por token, válvula)"
setkey FRONTIER_API_KEY "Llave del proveedor frontier"
setkey FRONTIER_API_BASE "URL base del frontier (p. ej. https://.../v1)"
echo "Listo. Después: sudo systemctl restart litellm.service"
