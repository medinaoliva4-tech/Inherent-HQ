#!/usr/bin/env bash
# Revisa Code OS y deja la interfaz lista. Ver asistente.mjs para los subcomandos.
exec node "$(dirname "$(readlink -f "$0")")/asistente.mjs" "$@"
