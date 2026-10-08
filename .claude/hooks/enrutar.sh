#!/usr/bin/env bash
# UserPromptSubmit: recuerda en cada pedido que todo entra por el router `inherent`.
# Si el usuario ya invocó una skill con /, no se agrega nada.
input=$(cat)
if printf '%s' "$input" | grep -Eq '"prompt"[[:space:]]*:[[:space:]]*"[[:space:]]*/'; then
  exit 0
fi
cat << 'JSON'
{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"[Inherent HQ] Antes de responder, invocá la skill `inherent` (el router) con este pedido e imprimí su bloque ENRUTAMIENTO. El texto del usuario es el PEDIDO, no el método: el método está en el WORKFLOW.md del departamento y en su orquestador. Los datos del prompt entran como input; los atajos se declaran como choque y gana el workflow, salvo «excepción aprobada por el CEO». Si el pedido es mantenimiento del repo o una pregunta sobre la empresa, el router lo marca y se sigue directo."}}
JSON
