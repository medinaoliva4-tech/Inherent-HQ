#!/usr/bin/env bash
# Pone la nueva base (Supabase) al worker del servidor. Pide la URL y el CA con entrada oculta/pegado; no se guardan en historial.
# Correr:  ssh -t inherent-gw 'bash ~/gateway/gw/ceo-os/scripts/cambiar-base.sh'
set -euo pipefail
G=/home/deploy/gateway; E=$G/neon-prod.env
cp "$E" "$G/respaldo-gw/neon-prod.env.antes-supabase-$(date +%Y%m%d%H%M)"
read -rsp "DATABASE_URL de Supabase (pooler, puerto 6543) (oculto): " U; echo
[ -z "$U" ] && { echo "vacía, no cambio nada"; exit 1; }
echo "Pega el certificado CA (PEM) y termina con una línea que diga FIN:"
CA=""; while IFS= read -r l; do [ "$l" = "FIN" ] && break; CA="$CA$l"$'\n'; done
umask 077
printf '%s' "$CA" > "$G/supabase-ca.pem"
printf 'DATABASE_URL=%s\nDB_SSL_CA_FILE=%s\n' "$U" "$G/supabase-ca.pem" > "$E"
echo "Listo. Falta: actualizar el código del worker y reiniciar gw-worker (lo hace Claude)."
