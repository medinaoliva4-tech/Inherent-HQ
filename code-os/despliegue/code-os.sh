#!/usr/bin/env bash
# Code OS en UN comando, desde tu Mac.
#   bash code-os/despliegue/code-os.sh            abre Code OS ya con tu sesión (si no está configurado, lo configura)
#   bash code-os/despliegue/code-os.sh configurar  instala/actualiza todo en el VPS y te deja dentro
# Tu token queda en el Llavero de macOS (nunca se imprime). Variables: CODEOS_HOST (inherent-gw) · CODEOS_USER (rodrigo)
set -euo pipefail
HOST="${CODEOS_HOST:-inherent-gw}"; ID="${CODEOS_USER:-rodrigo}"; SVC="code-os-puente"
DIR="$(cd "$(dirname "$0")" && pwd)"
token() { security find-generic-password -a "$ID" -s "$SVC" -w 2>/dev/null || true; }
dominio() { ssh -n "$HOST" "tailscale status --self --json | python3 -c 'import sys,json;print(json.load(sys.stdin)[\"Self\"][\"DNSName\"].rstrip(\".\"))'"; }

abrir() {
  local t u f; t="$(token)"; [ -n "$t" ] || { echo "✗ Aún no hay sesión guardada: corre  bash $0 configurar"; exit 1; }
  u="http://$(dominio):8080"
  f="$(mktemp -t codeos).html"; chmod 600 "$f"
  # Página local que envía el token al puente y se borra sola: el puente responde con una cookie y entras directo.
  printf '<!doctype html><meta charset=utf-8><body onload="document.f.submit()"><form name=f method=post action="%s/entrar"><input type=hidden name=token value="%s"></form>Entrando a Code OS…' "$u" "$t" > "$f"
  open "$f"; ( sleep 15; rm -f "$f" ) >/dev/null 2>&1 &
  echo "✓ Abriendo Code OS ($u)"
}

configurar() {
  echo "1/5 Copiando el código al servidor…";   bash "$DIR/sincronizar.sh" >/dev/null
  echo "2/5 Instalando en el servidor (respaldo + verificación)…"
  ssh -n "$HOST" 'bwrap --ro-bind /usr /usr --symlink usr/bin /bin --symlink usr/lib /lib --symlink usr/lib64 /lib64 --proc /proc --dev /dev --unshare-pid /usr/bin/true' >/dev/null 2>&1 || ssh -t "$HOST" 'bash ~/code-os/despliegue/habilitar-bwrap.sh'
  ssh -t "$HOST" 'bash ~/code-os/despliegue/instalar.sh'
  if [ -z "$(token)" ]; then
    echo "3/5 Creando tu usuario ($ID)…"
    out="$(ssh -n "$HOST" "code-os-asistente usuario $ID --directos cp-,nv-")"
    t="$(printf '%s\n' "$out" | grep -E '^ +[A-Za-z0-9_-]{30,}$' | tr -d ' ')"
    [ -n "$t" ] || { echo "✗ No pude crear el usuario"; exit 1; }
    security add-generic-password -a "$ID" -s "$SVC" -w "$t" -U && echo "   token guardado en el Llavero de macOS (no se muestra)"
  else echo "3/5 Tu usuario ya existe (token en el Llavero)"; fi
  ssh -n "$HOST" 'sudo systemctl restart code-os-puente'
  echo "4/5 Tu sesión de Claude (para que el nivel alto use tu suscripción) — es opcional"
  read -r -p "    ¿Iniciarla ahora? [s/N] " r; [[ "$r" =~ ^[sS]$ ]] && ssh -t "$HOST" "code-os-login $ID" || true
  echo "5/5 Revisión final"; ssh -n "$HOST" 'code-os-asistente' | tail -12
  abrir
}

case "${1:-abrir}" in configurar) configurar ;; abrir) [ -n "$(token)" ] && abrir || configurar ;; *) echo "Uso: $0 [abrir|configurar]"; exit 1 ;; esac
