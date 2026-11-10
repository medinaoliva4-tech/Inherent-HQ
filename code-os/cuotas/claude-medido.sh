#!/usr/bin/env bash
# Ejecuta Claude Code (cliente OFICIAL, con el login de suscripción del usuario) y reporta la llamada al medidor.
# Uso: claude-medido.sh -p "tarea"   (mismos argumentos que `claude`)
# Cada persona usa SU propio login; no se comparte una suscripción entre usuarios ni se extraen tokens.
set -u
URL="${CUOTAS_URL:-http://127.0.0.1:4200}"
t0=$(date +%s); claude "$@"; rc=$?
dur=$(( ($(date +%s) - t0) * 1000 ))
curl -s -m3 -X POST "$URL/evento" -H 'content-type: application/json' \
  ${CUOTAS_TOKEN:+-H "authorization: Bearer $CUOTAS_TOKEN"} \
  -d "{\"proveedor\":\"claude_login\",\"http\":$([ $rc -eq 0 ] && echo 200 || echo 500),\"duracion_ms\":$dur}" >/dev/null 2>&1 || true
exit $rc
