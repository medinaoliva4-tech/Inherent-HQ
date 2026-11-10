#!/usr/bin/env bash
# Publica el motor de Code OS en https://code.inherentglobal.com (el OS vive en work.inherentglobal.com) (corre en el VPS como deploy). Idempotente.
# Antes: registro A  work → IP del VPS en el DNS, y `sudo ufw allow 80,443/tcp`.
# Pone el secreto del pase del OS (si hay ~/code-os-data/pase.secret, creado por code-os-pase.sh desde tu Mac) y Caddy.
set -euo pipefail
D="$HOME/code-os-data"; C="$HOME/code-os"; DOM="${CODEOS_DOMINIO:-code.inherentglobal.com}"; ORIGEN="${CODEOS_ORIGEN_OS:-https://inherent-work.vercel.app,https://work.inherentglobal.com}"
R="$HOME/respaldo-codeos-$(date +%Y%m%d%H%M)"; mkdir -p "$R"; chmod 700 "$R"; [ -f /etc/caddy/Caddyfile ] && sudo cp -a /etc/caddy/Caddyfile "$R/" || true
dig +short "$DOM" | grep -q . || { echo "✗ $DOM aún no resuelve: revisa el registro A en Squarespace"; exit 1; }
[ -f "$D/pase.secret" ] || { echo "✗ Falta el secreto del pase: corre desde tu Mac  bash code-os/despliegue/code-os-pase.sh"; exit 1; }
( umask 077; printf 'PUENTE_PASE_SECRET=%s\nPUENTE_ALLOWED_ORIGINS=%s\n' "$(cat "$D/pase.secret")" "$ORIGEN" > "$D/puente.env" )
command -v caddy >/dev/null || sudo apt-get install -y caddy >/dev/null
sed "s#{\$CODEOS_DOMINIO:code.inherentglobal.com}#$DOM#" "$C/despliegue/Caddyfile" | sudo tee /etc/caddy/Caddyfile >/dev/null
sudo caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1 && echo "✓ Caddyfile válido"
sudo install -m 644 "$C/despliegue/code-os-puente.service" /etc/systemd/system/code-os-puente.service; sudo systemctl daemon-reload
sudo systemctl enable --now caddy >/dev/null 2>&1; sudo systemctl reload caddy || sudo systemctl restart caddy
sudo systemctl restart code-os-puente; sleep 3
for u in litellm gw-worker cuotas code-os-puente caddy; do printf '%s=%s ' "$u" "$(systemctl is-active $u)"; done; echo
for i in $(seq 1 20); do curl -s -m5 -o /dev/null -w "%{http_code}" "https://$DOM/health" | grep -q 200 && { echo "✓ https://$DOM responde"; exit 0; }; sleep 3; done
echo "! Aún no responde por HTTPS (Caddy sigue pidiendo el certificado): sudo journalctl -u caddy -n 20"
