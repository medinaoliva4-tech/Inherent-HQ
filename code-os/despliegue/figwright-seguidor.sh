#!/usr/bin/env bash
# En el VPS (usuario deploy, con sudo). Deja listos los MCP que el puente lanza DENTRO de la jaula de cada sesión:
#   - Figwright «seguidor» fijado a una versión (por defecto 0.7.0, la misma que la Mac) en /opt/code-os-mcp/figwright
#   - el MCP de imágenes (copia de ~/code-os/imagen/src, sin dependencias) en /opt/code-os-mcp/imagen
#   - el catálogo ~/code-os-data/puente-mcp.json y PUENTE_MCP_CONFIG en ~/code-os-data/puente.env
#
# Por qué no hay un servicio aparte: un MCP stdio sirve a UN cliente. El puente arranca un seguidor por sesión, dentro
# de bubblewrap (red del anfitrión para llegar a 127.0.0.1:3055, sin ver /home/deploy ni otros usuarios) y lo cierra al
# terminar el turno. No hay socket compartido entre personas ni otro demonio que vigilar. El «líder» es el Figwright de
# la Mac; el túnel lo abre la Mac (figwright-tunel-mac.sh). Si el túnel no responde, el puente NO lanza Figwright (así
# el VPS nunca toma el puerto 3055 y no le bloquea el túnel a la Mac).
#
# Uso:  bash ~/code-os/despliegue/figwright-seguidor.sh [--dry-run] [--version 0.7.0] [--sin-imagen] [--reiniciar]
#       bash ~/code-os/despliegue/figwright-seguidor.sh --revertir <carpeta-de-respaldo>
# Con --dry-run solo muestra lo que haría. Nunca toca LiteLLM ni las llaves. --reiniciar reinicia code-os-puente al final.
set -euo pipefail

VERSION=0.7.0; DRY=0; IMAGEN=1; REINICIAR=0; REVERTIR=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1 ;;
    --version) VERSION="$2"; shift ;;
    --sin-imagen) IMAGEN=0 ;;
    --reiniciar) REINICIAR=1 ;;
    --revertir) REVERTIR="$2"; shift ;;
    -h|--help) sed -n 2,16p "$0"; exit 0 ;;
    *) echo "opción desconocida: $1" >&2; exit 2 ;;
  esac; shift
done
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "versión inválida: $VERSION (fija una exacta, nunca latest)" >&2; exit 2; }

DESTINO=/opt/code-os-mcp
DATOS="$HOME/code-os-data"; CATALOGO="$DATOS/puente-mcp.json"; ENVF="$DATOS/puente.env"
PLANTILLA="$HOME/code-os/despliegue/puente-mcp.json"; IMAGEN_SRC="$HOME/code-os/imagen/src"
run() { if [ "$DRY" = 1 ]; then printf '  [dry-run] %s\n' "$*"; else eval "$@"; fi; }
ok() { printf '✓ %s\n' "$*"; }; aviso() { printf '⚠ %s\n' "$*"; }

if [ -n "$REVERTIR" ]; then
  [ -d "$REVERTIR" ] || { echo "no existe $REVERTIR" >&2; exit 1; }
  [ -d "$REVERTIR/code-os-mcp" ] && run "sudo rm -rf '$DESTINO' && sudo cp -a '$REVERTIR/code-os-mcp' '$DESTINO'"
  [ -d "$REVERTIR/code-os-mcp" ] || run "sudo rm -rf '$DESTINO'"
  if [ -f "$REVERTIR/puente.env" ]; then run "cp -a '$REVERTIR/puente.env' '$ENVF'"; else run "sed -i '/^PUENTE_MCP_CONFIG=/d' '$ENVF'"; fi
  if [ -f "$REVERTIR/puente-mcp.json" ]; then run "cp -a '$REVERTIR/puente-mcp.json' '$CATALOGO'"; else run "rm -f '$CATALOGO'"; fi
  ok "revertido desde $REVERTIR. Reinicia el puente: sudo systemctl restart code-os-puente"; exit 0
fi

# 0 · Comprobaciones (solo lectura)
command -v node >/dev/null && [ "$(command -v node)" = /usr/bin/node ] || { echo "node debe estar en /usr/bin/node (la jaula solo ve /usr)" >&2; exit 1; }
command -v npm >/dev/null || { echo "falta npm" >&2; exit 1; }
[ -f "$PLANTILLA" ] || { echo "falta $PLANTILLA: corre antes code-os/despliegue/sincronizar.sh desde la Mac" >&2; exit 1; }
[ "$IMAGEN" = 0 ] || [ -f "$IMAGEN_SRC/mcp.mjs" ] || { echo "falta $IMAGEN_SRC/mcp.mjs (sincronizar.sh copia code-os/imagen) o usa --sin-imagen" >&2; exit 1; }
node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).mcpServers.figwright||process.exit(1)' "$PLANTILLA" || { echo "plantilla inválida" >&2; exit 1; }
echo "· sshd (el túnel necesita AllowTcpForwarding y conviene ClientAliveInterval para liberar el puerto si la Mac se duerme):"
sudo -n sshd -T 2>/dev/null | grep -E '^(allowtcpforwarding|clientaliveinterval|clientalivecountmax|gatewayports) ' | sed 's/^/    /' || echo "    (sin sudo sin contraseña: revisa con sudo sshd -T)"

# 1 · Respaldo
R="$HOME/respaldo-codeos-figwright-$(date +%Y%m%d%H%M%S)"
run "mkdir -p '$R'"
[ -d "$DESTINO" ] && run "sudo cp -a '$DESTINO' '$R/code-os-mcp'"
[ -f "$ENVF" ] && run "cp -a '$ENVF' '$R/puente.env'"
[ -f "$CATALOGO" ] && run "cp -a '$CATALOGO' '$R/puente-mcp.json'"
ok "respaldo en $R (para volver: $0 --revertir $R)"

# 2 · Figwright fijado (sin scripts de instalación) y cambio atómico
NUEVO="$DESTINO/figwright.nuevo"
run "sudo mkdir -p '$DESTINO' && sudo rm -rf '$NUEVO' && sudo mkdir -p '$NUEVO'"
run "sudo npm install --prefix '$NUEVO' --omit=dev --no-audit --no-fund --ignore-scripts --save-exact '@figwright/mcp@$VERSION'"
if [ "$DRY" = 0 ]; then
  V=$(node -p 'require(process.argv[1]).version' "$NUEVO/node_modules/@figwright/mcp/package.json")
  [ "$V" = "$VERSION" ] || { echo "se instaló $V y se pidió $VERSION" >&2; exit 1; }
fi
run "sudo rm -rf '$DESTINO/figwright.viejo'; [ -d '$DESTINO/figwright' ] && sudo mv '$DESTINO/figwright' '$DESTINO/figwright.viejo'; sudo mv '$NUEVO' '$DESTINO/figwright'"
ok "Figwright $VERSION en $DESTINO/figwright"

# 3 · MCP de imágenes (código puro, sin llaves: usa la llave virtual de cada persona que pone el puente)
if [ "$IMAGEN" = 1 ]; then
  run "sudo mkdir -p '$DESTINO/imagen' && sudo rsync -a --delete '$IMAGEN_SRC/' '$DESTINO/imagen/src/'"
  ok "imagen en $DESTINO/imagen"
fi
run "sudo chown -R root:root '$DESTINO' && sudo chmod -R a+rX,go-w '$DESTINO'"

# 4 · Catálogo y variable del puente
CAT_TMP=$(mktemp)
if [ "$IMAGEN" = 1 ]; then cp "$PLANTILLA" "$CAT_TMP"; else node -e 'const f=require("fs");const j=JSON.parse(f.readFileSync(process.argv[1],"utf8"));delete j.mcpServers.imagen;f.writeFileSync(process.argv[2],JSON.stringify(j,null,2))' "$PLANTILLA" "$CAT_TMP"; fi
run "install -m 640 '$CAT_TMP' '$CATALOGO'"; rm -f "$CAT_TMP"
if [ -f "$ENVF" ] && grep -q '^PUENTE_MCP_CONFIG=' "$ENVF"; then run "sed -i 's#^PUENTE_MCP_CONFIG=.*#PUENTE_MCP_CONFIG=$CATALOGO#' '$ENVF'"
else run "touch '$ENVF' && chmod 600 '$ENVF' && echo 'PUENTE_MCP_CONFIG=$CATALOGO' >> '$ENVF'"; fi
ok "PUENTE_MCP_CONFIG=$CATALOGO en $ENVF"

# 5 · Prueba de humo: solo si el túnel ya responde (si no, el seguidor tomaría el puerto como líder)
if curl -s -m 3 http://127.0.0.1:3055/ping | grep -q '"ok":true'; then
  echo "· túnel arriba: $(curl -s -m 3 http://127.0.0.1:3055/ping | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(`Figwright ${j.serverVersion} en la Mac, ${j.plugins} archivo(s): ${(j.sessions||[]).map(x=>x.fileName).join(", ")}`)})')"
  if [ "$DRY" = 0 ]; then
    OUT=$( { printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"humo","version":"0"}}}' '{"jsonrpc":"2.0","method":"notifications/initialized"}' '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_files","arguments":{}}}'; sleep 8; } \
      | timeout 20 node "$DESTINO/figwright/node_modules/@figwright/mcp/dist/index.mjs" 2>/dev/null | grep '"id":2' || true)
    [ -n "$OUT" ] && ok "el seguidor del VPS ve los archivos de la Mac: $(echo "$OUT" | head -c 300)" || aviso "el seguidor no respondió list_files (revisa la versión de la Mac y del VPS)"
  fi
else
  aviso "el túnel no responde en 127.0.0.1:3055: prueba de humo omitida. En la Mac: bash code-os/despliegue/figwright-tunel-mac.sh"
fi

# 6 · Reinicio del puente (solo con --reiniciar)
if [ "$REINICIAR" = 1 ]; then run "sudo systemctl restart code-os-puente && sleep 2 && systemctl is-active code-os-puente"
else echo "· falta reiniciar el puente para que lea el catálogo: sudo systemctl restart code-os-puente"; fi
