#!/usr/bin/env bash
# Instala/actualiza Code OS en el VPS (corre en el servidor como deploy). Idempotente, con respaldo y con
# verificación de litellm, gw-worker y cuotas; si LiteLLM no vuelve con base de datos, deshace el cambio.
# Antes: bash code-os/despliegue/sincronizar.sh   (desde la Mac)
set -euo pipefail
G="$HOME/gateway"; D="$HOME/code-os-data"; C="$HOME/code-os"; TS=$(date +%Y%m%d%H%M)
R="$HOME/respaldo-codeos-$TS"; mkdir -p "$R" "$D"; chmod 700 "$R" "$D"
act() { for u in litellm gw-worker cuotas; do printf '%s=%s ' "$u" "$(systemctl is-active $u)"; done; echo; }
ok() { echo "✓ $*"; }

# 0. Respaldo (sin el .env: ese no se copia ni se imprime)
sudo cp -a /etc/systemd/system/{litellm,gw-worker,cuotas}.service "$R/" 2>/dev/null || true
cp -a "$G/litellm.yaml" "$R/"; [ -f "$D/users.json" ] && cp -a "$D/users.json" "$R/"; dpkg -l > "$R/dpkg.txt"; ok "respaldo en $R"

# 1. bubblewrap (el perfil de AppArmor se habilita aparte: habilitar-bwrap.sh)
command -v bwrap >/dev/null || sudo apt-get install -y bubblewrap >/dev/null; ok "bubblewrap $(bwrap --version | cut -d' ' -f2)"

# 2. Postgres local (Docker) para las llaves virtuales de LiteLLM + venv aparte con prisma
if ! docker ps -a --format '{{.Names}}' | grep -qx litellm-pg; then
  if [ ! -f "$G/litellm-db.env" ]; then PW=$(head -c 24 /dev/urandom | base64 | tr -dc A-Za-z0-9 | head -c 28); (umask 077; printf 'DATABASE_URL=postgresql://litellm:%s@127.0.0.1:5433/litellm\nLITELLM_PG_PASSWORD=%s\n' "$PW" "$PW" > "$G/litellm-db.env"); fi
  set -a; . "$G/litellm-db.env"; set +a
  docker run -d --name litellm-pg --restart unless-stopped -p 127.0.0.1:5433:5432 -e POSTGRES_USER=litellm -e POSTGRES_PASSWORD="$LITELLM_PG_PASSWORD" -e POSTGRES_DB=litellm -v litellm-pgdata:/var/lib/postgresql/data postgres:16 >/dev/null
fi
ok "Postgres local (127.0.0.1:5433)"
if [ ! -x "$G/.venv-vk/bin/litellm" ]; then
  python3 -m venv "$G/.venv-vk"; "$G/.venv-vk/bin/pip" install -q "litellm[proxy]==1.108.0" litellm-enterprise==0.1.79 litellm-proxy-extras==0.4.110 prisma
fi
( export PATH="$G/.venv-vk/bin:$PATH"; set -a; . "$G/litellm-db.env"; set +a; prisma generate --schema "$G"/.venv-vk/lib/python3.12/site-packages/litellm/proxy/schema.prisma >/dev/null 2>&1 ) && ok "cliente prisma generado"

# 3. LiteLLM con base de datos (drop-in reversible). Verifica y, si falla, deshace.
if [ ! -f /etc/systemd/system/litellm.service.d/db.conf ]; then
  sudo mkdir -p /etc/systemd/system/litellm.service.d
  printf '[Service]\nEnvironmentFile=%s/litellm-db.env\nExecStart=\nExecStart=%s/.venv-vk/bin/litellm --config litellm.yaml --host 127.0.0.1 --port 4000\n' "$G" "$G" | sudo tee /etc/systemd/system/litellm.service.d/db.conf >/dev/null
  sudo systemctl daemon-reload; sudo systemctl restart litellm
  for i in $(seq 1 40); do curl -s -m2 127.0.0.1:4000/health/readiness | grep -q '"db":"connected"' && break; sleep 3; done
  if ! curl -s -m3 127.0.0.1:4000/health/readiness | grep -q '"db":"connected"'; then
    echo "✗ LiteLLM no volvió con base de datos: deshago el cambio"; sudo rm -f /etc/systemd/system/litellm.service.d/db.conf; sudo systemctl daemon-reload; sudo systemctl restart litellm; act; exit 1
  fi
fi
ok "LiteLLM con base de datos"; act
for u in litellm gw-worker cuotas; do [ "$(systemctl is-active $u)" = active ] || { echo "✗ $u no está activo"; exit 1; }; done

# 4. Comandos de ayuda y cliente oficial de Claude (cada persona hace su login por su cuenta)
sudo install -m 755 "$C/despliegue/code-os-login" /usr/local/bin/code-os-login
sudo install -m 755 "$C/asistente/asistente.sh" /usr/local/bin/code-os-asistente 2>/dev/null || sudo ln -sf "$C/asistente/asistente.sh" /usr/local/bin/code-os-asistente
command -v claude >/dev/null || sudo npm i -g @anthropic-ai/claude-code >/dev/null 2>&1 || echo "! No pude instalar el cliente de Claude (opcional): sudo npm i -g @anthropic-ai/claude-code"
ok "comandos code-os-login y code-os-asistente"

# 5. Servicio del puente (solo localhost)
sudo install -m 644 "$C/despliegue/code-os-puente.service" /etc/systemd/system/code-os-puente.service
sudo systemctl daemon-reload; sudo systemctl enable code-os-puente >/dev/null 2>&1
if [ -f "$D/users.json" ]; then sudo systemctl restart code-os-puente; sleep 3; curl -s -m3 127.0.0.1:4300/health | grep -q ok && ok "puente en 127.0.0.1:4300" || echo "✗ el puente no responde: journalctl -u code-os-puente -n 30"
else echo "! Aún no hay usuarios: code-os-asistente usuario <tu-nombre>  y luego: sudo systemctl restart code-os-puente"; fi

# 6. Publicación: solo por Tailscale (Serve, no Funnel). El puente sigue en 127.0.0.1.
sudo tailscale serve --bg --http=8080 http://127.0.0.1:4300 >/dev/null 2>&1 && ok "Tailscale Serve: http://$(tailscale status --self --json | python3 -c 'import sys,json;print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))'):8080 (solo tu tailnet)" || echo "! No pude configurar Tailscale Serve"
act; echo "Siguiente: code-os-asistente"
