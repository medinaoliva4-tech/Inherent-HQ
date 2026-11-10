#!/usr/bin/env bash
# Desde tu Mac: crea UNA vez el secreto compartido entre el OS y el puente (HS256) y lo pone en los dos lados sin mostrarlo.
#  · VPS: ~/code-os-data/pase.secret (600)      · OS (Vercel): variable CODEOS_PASE_SECRET (production)
# Uso: bash code-os/despliegue/code-os-pase.sh   (desde la carpeta ceo-os enlazada a Vercel, con `vercel` con sesión)
set -euo pipefail
HOST="${CODEOS_HOST:-inherent-gw}"; F="$(mktemp -t pase)"; trap 'rm -f "$F"' EXIT
openssl rand -base64 48 | tr -d '\n' > "$F"; chmod 600 "$F"
ssh -n "$HOST" 'mkdir -p ~/code-os-data && chmod 700 ~/code-os-data'
scp -q "$F" "$HOST:code-os-data/pase.secret" && ssh -n "$HOST" 'chmod 600 ~/code-os-data/pase.secret' && echo "✓ Secreto en el VPS"
# Vincula el proyecto del OS en una carpeta temporal (así no ensucia el repo) y guarda el secreto en Vercel.
T="$(mktemp -d)"; trap 'rm -f "$F"; rm -rf "$T"' EXIT
( cd "$T" && vercel link --yes --project "${CODEOS_VERCEL_PROYECTO:-inherent-work}" >/dev/null 2>&1 && { vercel env rm CODEOS_PASE_SECRET production -y >/dev/null 2>&1 || true; vercel env add CODEOS_PASE_SECRET production < "$F" >/dev/null; } ) && echo "✓ Secreto en Vercel (CODEOS_PASE_SECRET)" || { echo "✗ No pude guardarlo en Vercel: corre 'vercel login' y repite"; exit 1; }
